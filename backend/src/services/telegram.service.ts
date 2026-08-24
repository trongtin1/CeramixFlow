import TelegramBot from 'node-telegram-bot-api';
import prisma from '../config/prisma';
import { STAGE_DISPLAY_NAMES, StageNameType } from '../schemas/batchSchema';

export class TelegramService {
  private bot: TelegramBot | null = null;
  private chatId: string | null = null;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (token && token.trim() !== '' && chatId && chatId.trim() !== '') {
      try {
        this.bot = new TelegramBot(token, { polling: false });
        this.chatId = chatId;
        console.log('[Telegram Service] Bot đã kết nối thành công với Chat ID:', chatId);
      } catch (err: any) {
        console.error('[Telegram Service] Lỗi khởi tạo bot:', err.message);
      }
    } else {
      console.log('[Telegram Service] Chế độ Live Simulation (chưa cấu hình TELEGRAM_BOT_TOKEN / CHAT_ID). Log sẽ hiển thị trực tiếp trên Web Dashboard.');
    }
  }

  /**
   * Lưu log sự kiện vào DB để Frontend hiển thị Live Telegram Feed
   */
  private async logEvent(eventType: string, title: string, message: string, metadata?: any) {
    try {
      await prisma.systemEventLog.create({
        data: {
          eventType,
          title,
          message,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });
    } catch (e: any) {
      console.error('[Telegram Service] Error saving log:', e.message);
    }
  }

  /**
   * Gửi tin nhắn thực tế tới Telegram hoặc Mock
   */
  private async dispatchMessage(htmlMessage: string): Promise<boolean> {
    if (this.bot && this.chatId) {
      try {
        await this.bot.sendMessage(this.chatId, htmlMessage, { parse_mode: 'HTML' });
        return true;
      } catch (err: any) {
        console.error('[Telegram Service] Lỗi gửi tin nhắn Telegram:', err.message);
        return false;
      }
    }
    return true;
  }

  /**
   * 1. Thông báo khi khởi tạo mẻ gốm mới
   */
  async notifyBatchCreated(batch: {
    batchCode: string;
    productName: string;
    quantity: number;
    priority: string;
    deadlineDays?: number | null;
    technicalSpecs: any;
  }) {
    const specs = typeof batch.technicalSpecs === 'string' ? JSON.parse(batch.technicalSpecs) : batch.technicalSpecs;
    const priorityEmoji = batch.priority === 'URGENT' ? '🔥 KHẨN CẤP' : batch.priority === 'HIGH' ? '⚡ CAO' : '📌 TIÊU CHUẨN';

    let customSpecsText = '';
    if (specs?.custom_attributes && Object.keys(specs.custom_attributes).length > 0) {
      customSpecsText = '\n\n✨ <b>THUỘC TÍNH TÙY CHỈNH (CUSTOM JSONB):</b>\n' +
        Object.entries(specs.custom_attributes)
          .map(([k, v]) => `• 🔹 <b>${k}:</b> <code>${v}</code>`)
          .join('\n');
    }

    const message = `
🏺 <b>[XƯỞNG GỐM] KHỞI TẠO MẺ SẢN XUẤT MỚI #${batch.batchCode}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 <b>Sản phẩm:</b> ${batch.productName}
🔢 <b>Số lượng:</b> <b>${batch.quantity}</b> chiếc | Độ ưu tiên: <b>${priorityEmoji}</b>
⏳ <b>Thời hạn dự kiến:</b> ${batch.deadlineDays ? `${batch.deadlineDays} ngày` : 'Chưa xác định'}

📋 <b>THÔNG SỐ KỸ THUẬT (AI EXTRACTED):</b>
• 🧱 <b>Ước tính đất sét:</b> <code>${specs?.estimated_clay_kg || 'N/A'} kg</code>
• 🎨 <b>Loại men:</b> ${specs?.glaze_type || 'N/A'}
• 🔥 <b>Nhiệt độ nung:</b> <code>${specs?.firing_specs?.target_temperature_c || 'N/A'}°C</code> (~${specs?.firing_specs?.estimated_duration_hours || '12'}h)
• 📏 <b>Kích thước:</b> Cao ${specs?.dimensions?.height_cm || '30'}cm${customSpecsText}

🚀 <i>Quy trình 6 công đoạn đã được kích hoạt tại trạm: <b>Tạo hình mộc</b></i>
━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    await this.dispatchMessage(message);
    await this.logEvent(
      'ORDER_CREATED',
      `Khởi tạo mẻ #${batch.batchCode}`,
      message,
      { batchCode: batch.batchCode, productName: batch.productName }
    );
  }

  /**
   * 2. Thông báo khi mẻ gốm chuyển sang công đoạn mới
   */
  async notifyStageAdvanced(batch: {
    batchCode: string;
    productName: string;
    fromStage: string;
    toStage: string;
    isCompleted?: boolean;
    technicalSpecs?: any;
  }) {
    const fromName = STAGE_DISPLAY_NAMES[batch.fromStage as StageNameType] || batch.fromStage;
    const toName = STAGE_DISPLAY_NAMES[batch.toStage as StageNameType] || batch.toStage;
    const specs = typeof batch.technicalSpecs === 'string' ? JSON.parse(batch.technicalSpecs || '{}') : batch.technicalSpecs;

    let stageHighlight = '';
    if (batch.toStage === 'VAO_LO_NUNG') {
      stageHighlight = `\n🔥 <i>Chuẩn bị nung nhiệt độ đỉnh: <b>${specs?.firing_specs?.target_temperature_c || 1280}°C</b> trong lò khí gas</i>`;
    } else if (batch.toStage === 'TRANG_MEN') {
      stageHighlight = `\n🎨 <i>Áp dụng lớp men: <b>${specs?.glaze_type || 'Men truyền thống'}</b></i>`;
    }

    const message = batch.isCompleted ? `
🎉 <b>[HOÀN THÀNH TOÀN BỘ] MẺ GỐM #${batch.batchCode}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏺 <b>Sản phẩm:</b> ${batch.productName}
✅ Đã vượt qua kiểm định chất lượng QC và đóng gói xuất xưởng thành công!
⏰ <b>Thời điểm:</b> ${new Date().toLocaleString('vi-VN')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━` : `
🔄 <b>[CHUYỂN CÔNG ĐOẠN] MẺ GỐM #${batch.batchCode}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏺 <b>Sản phẩm:</b> ${batch.productName}
📍 <b>Đã hoàn thành:</b> ✅ <i>${fromName}</i>
👉 <b>Chuyển tiếp đến:</b> 🎯 <b>${toName}</b>${stageHighlight}
⏰ <b>Thời gian cập nhật:</b> ${new Date().toLocaleString('vi-VN')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    await this.dispatchMessage(message);
    await this.logEvent(
      batch.isCompleted ? 'BATCH_COMPLETED' : 'STAGE_ADVANCED',
      batch.isCompleted ? `Hoàn thành mẻ #${batch.batchCode}` : `Mẻ #${batch.batchCode} -> ${toName}`,
      message,
      { batchCode: batch.batchCode, toStage: batch.toStage }
    );
  }

  /**
   * 3. Bắn CẢNH BÁO ĐỎ khi có sự cố QC hoặc hỏng hóc khẩn cấp
   */
  async notifyQcIncident(incident: {
    batchCode: string;
    productName: string;
    stageName: string;
    defectCount: number;
    reason: string;
    severity: string;
  }) {
    const stageName = STAGE_DISPLAY_NAMES[incident.stageName as StageNameType] || incident.stageName;

    const message = `
🚨 <b>[CẢNH BÁO ĐỎ SỰ CỐ QC KHẨN CẤP]</b> 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ <b>Mẻ sản xuất:</b> <code>#${incident.batchCode}</code> (${incident.productName})
📍 <b>Phát hiện tại:</b> <b>${stageName}</b>
💥 <b>Số lượng sản phẩm hỏng/lỗi:</b> <b>${incident.defectCount} chiếc</b>
🔍 <b>Nguyên nhân ghi nhận:</b> <i>"${incident.reason}"</i>
📊 <b>Mức độ nghiêm trọng:</b> 🔴 <b>${incident.severity.toUpperCase()}</b>

👨‍🔧 <b>HÀNH ĐỘNG YÊU CẦU:</b>
- Quản đốc xưởng và kỹ thuật viên kiểm tra ngay lập tức.
- Tạm dừng mẻ nung/tráng men để đánh giá nguyên nhân rủi ro!
━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    await this.dispatchMessage(message);
    await this.logEvent(
      'QC_ALERT',
      `🚨 Lỗi QC mẻ #${incident.batchCode}: ${incident.defectCount} sản phẩm`,
      message,
      { batchCode: incident.batchCode, defectCount: incident.defectCount, reason: incident.reason }
    );
  }
}

export const telegramService = new TelegramService();
