"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramService = exports.TelegramService = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const prisma_1 = __importDefault(require("../config/prisma"));
const batchSchema_1 = require("../schemas/batchSchema");
class TelegramService {
    bot = null;
    chatId = null;
    constructor() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
        if (token && token.trim() !== '' && chatId && chatId.trim() !== '') {
            try {
                // Khởi tạo Telegram Bot ở chế độ Polling để nhận tương tác nút bấm từ thợ/quản lý
                this.bot = new node_telegram_bot_api_1.default(token, { polling: true });
                this.chatId = chatId;
                console.log('[Telegram Service] Bot đã kết nối thành công với Chat ID:', chatId);
                this.setupCallbackHandlers();
            }
            catch (err) {
                console.error('[Telegram Service] Lỗi khởi tạo bot:', err.message);
            }
        }
        else {
            console.log('[Telegram Service] Chế độ Live Simulation (chưa cấu hình TELEGRAM_BOT_TOKEN / CHAT_ID). Log sẽ hiển thị trực tiếp trên Web Dashboard.');
        }
    }
    /**
     * Thiết lập bộ lắng nghe sự kiện nút bấm trực tiếp trên Telegram (Inline Keyboard Callbacks)
     * Kèm cơ chế chống xung đột (Conflict Resolution & Idempotency) giữa Web và Telegram
     */
    setupCallbackHandlers() {
        if (!this.bot)
            return;
        // Bắt lỗi polling để tránh crash ứng dụng khi mạng gián đoạn
        this.bot.on('polling_error', (error) => {
            console.log('[Telegram Bot Notice]:', error.message);
        });
        this.bot.on('callback_query', async (query) => {
            try {
                const data = query.data;
                const fromUser = query.from?.first_name || query.from?.username || 'Thợ xưởng';
                const userTag = query.from?.username ? `@${query.from.username}` : fromUser;
                if (data?.startsWith('advance:')) {
                    // Format callback_data: advance:<batchId>:<expectedStage>
                    const parts = data.split(':');
                    const batchId = parts[1];
                    const expectedStage = parts[2]; // Công đoạn dự kiến khi nút được tạo
                    // Lazy load workflowService để tránh circular dependency
                    const { workflowService } = await Promise.resolve().then(() => __importStar(require('./workflow.service')));
                    try {
                        // Chuyển trạm kèm kiểm tra chống xung đột
                        const updated = await workflowService.advanceStage(batchId, expectedStage);
                        if (updated) {
                            const currentStageDisplay = batchSchema_1.STAGE_DISPLAY_NAMES[updated.currentStage] || updated.currentStage;
                            // Phản hồi toast ngay trên app Telegram
                            await this.bot?.answerCallbackQuery(query.id, {
                                text: `✅ Đã chuyển sang trạm: ${currentStageDisplay}!`,
                                show_alert: false,
                            });
                            // Cập nhật tin nhắn trên Telegram để vô hiệu hóa nút bấm cũ và thông báo ai vừa bấm
                            if (query.message) {
                                const confirmNote = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n✅ <b>XÁC NHẬN BỞI THỢ/QUẢN ĐỐC TRÊN TELEGRAM:</b>\n👤 <b>Người duyệt:</b> <b>${userTag}</b> (${fromUser})\n📍 <b>Trạng thái mới:</b> 🎯 <b>${currentStageDisplay}</b>\n⏰ <b>Thời điểm:</b> ${new Date().toLocaleTimeString('vi-VN')}`;
                                await this.bot?.editMessageText((query.message.text || '') + confirmNote, {
                                    chat_id: query.message.chat.id,
                                    message_id: query.message.message_id,
                                    parse_mode: 'HTML',
                                }).catch(() => { });
                            }
                            // Ghi log hệ thống để cập nhật Web Dashboard
                            await this.logEvent('TELEGRAM_CONFIRMATION', `Xác nhận từ Telegram bởi ${fromUser}`, `Thợ/Quản đốc ${userTag} đã bấm nút trên Telegram để chuyển mẻ #${updated.batchCode} sang công đoạn: ${currentStageDisplay}.`, { batchCode: updated.batchCode, confirmedBy: fromUser, newStage: updated.currentStage });
                        }
                    }
                    catch (conflictErr) {
                        // 🛡️ XỬ LÝ XUNG ĐỘT: Nếu Quản đốc đã chuyển trên Web trước đó rồi
                        await this.bot?.answerCallbackQuery(query.id, {
                            text: `ℹ️ ${conflictErr.message}`,
                            show_alert: true,
                        });
                        // Xóa nút bấm cũ để tránh bấm lại
                        if (query.message) {
                            await this.bot?.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: query.message.chat.id, message_id: query.message.message_id }).catch(() => { });
                        }
                    }
                }
                else if (data?.startsWith('qc_quick:')) {
                    const parts = data.split(':');
                    const batchId = parts[1];
                    await this.bot?.answerCallbackQuery(query.id, {
                        text: `🚨 Đã ghi nhận cảnh báo sự cố từ Telegram!`,
                    });
                    const { workflowService } = await Promise.resolve().then(() => __importStar(require('./workflow.service')));
                    const batch = await prisma_1.default.batch.findUnique({ where: { id: batchId } });
                    if (batch) {
                        await workflowService.reportIncident(batchId, {
                            defect_count: 1,
                            reason: `Phát hiện lỗi trực tiếp từ thợ/quản đốc (${userTag}) qua nút bấm trên Telegram`,
                            severity: 'CRITICAL',
                        });
                    }
                }
            }
            catch (err) {
                console.error('[Telegram Callback Error]:', err.message);
                if (query?.id) {
                    await this.bot?.answerCallbackQuery(query.id, {
                        text: `⚠️ Thao tác: ${err.message}`,
                    }).catch(() => { });
                }
            }
        });
    }
    /**
     * Lưu log sự kiện vào DB để Frontend hiển thị Live Telegram Feed
     */
    async logEvent(eventType, title, message, metadata) {
        try {
            await prisma_1.default.systemEventLog.create({
                data: {
                    eventType,
                    title,
                    message,
                    metadata: metadata ? JSON.stringify(metadata) : null,
                },
            });
        }
        catch (e) {
            console.error('[Telegram Service] Error saving log:', e.message);
        }
    }
    /**
     * Gửi tin nhắn thực tế tới Telegram kèm các nút bấm tương tác (Inline Keyboards)
     */
    async dispatchMessage(htmlMessage, replyMarkup) {
        if (this.bot && this.chatId) {
            try {
                await this.bot.sendMessage(this.chatId, htmlMessage, {
                    parse_mode: 'HTML',
                    reply_markup: replyMarkup,
                });
                return true;
            }
            catch (err) {
                console.error('[Telegram Service] Lỗi gửi tin nhắn Telegram:', err.message);
                return false;
            }
        }
        return true;
    }
    /**
     * 1. Thông báo khi khởi tạo mẻ gốm mới (Kèm nút bấm xác nhận hoàn thành trạm 1)
     */
    async notifyBatchCreated(batch) {
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

🚀 <i>Quy trình 6 công đoạn đã được kích hoạt tại trạm: <b>1. Tạo hình mộc</b></i>
━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        // Nút bấm tương tác trên Telegram (gắn kèm expectedStage = TAO_HINH_MOC)
        const replyMarkup = batch.id ? {
            inline_keyboard: [
                [
                    {
                        text: '✅ Xong "Tạo hình mộc" ➔ Sang "Phơi sấy"',
                        callback_data: `advance:${batch.id}:TAO_HINH_MOC`,
                    },
                ],
                [
                    {
                        text: '🚨 Báo Lỗi QC Nhanh',
                        callback_data: `qc_quick:${batch.id}`,
                    },
                ],
            ],
        } : undefined;
        await this.dispatchMessage(message, replyMarkup);
        await this.logEvent('ORDER_CREATED', `Khởi tạo mẻ #${batch.batchCode}`, message, { batchCode: batch.batchCode, productName: batch.productName });
    }
    /**
     * 2. Thông báo khi mẻ gốm chuyển sang công đoạn mới (Kèm nút bấm chuyển bước tiếp theo)
     */
    async notifyStageAdvanced(batch) {
        const fromName = batchSchema_1.STAGE_DISPLAY_NAMES[batch.fromStage] || batch.fromStage;
        const toName = batchSchema_1.STAGE_DISPLAY_NAMES[batch.toStage] || batch.toStage;
        const specs = typeof batch.technicalSpecs === 'string' ? JSON.parse(batch.technicalSpecs || '{}') : batch.technicalSpecs;
        let stageHighlight = '';
        if (batch.toStage === 'VAO_LO_NUNG') {
            stageHighlight = `\n🔥 <i>Chuẩn bị nung nhiệt độ đỉnh: <b>${specs?.firing_specs?.target_temperature_c || 1280}°C</b> trong lò khí gas</i>`;
        }
        else if (batch.toStage === 'TRANG_MEN') {
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
        // Tạo nút bấm cho trạm tiếp theo (gắn kèm expectedStage = batch.toStage)
        let replyMarkup = undefined;
        if (!batch.isCompleted && batch.id) {
            const currentIndex = batchSchema_1.STAGES.indexOf(batch.toStage);
            const nextStage = currentIndex < batchSchema_1.STAGES.length - 1 ? batchSchema_1.STAGES[currentIndex + 1] : null;
            const nextStageName = nextStage ? (batchSchema_1.STAGE_DISPLAY_NAMES[nextStage] || nextStage) : 'Hoàn thành xuất xưởng';
            replyMarkup = {
                inline_keyboard: [
                    [
                        {
                            text: `✅ Xong "${toName}" ➔ Sang "${nextStageName}"`,
                            callback_data: `advance:${batch.id}:${batch.toStage}`,
                        },
                    ],
                    [
                        {
                            text: '🚨 Báo Lỗi QC Nhanh',
                            callback_data: `qc_quick:${batch.id}`,
                        },
                    ],
                ],
            };
        }
        await this.dispatchMessage(message, replyMarkup);
        await this.logEvent(batch.isCompleted ? 'BATCH_COMPLETED' : 'STAGE_ADVANCED', batch.isCompleted ? `Hoàn thành mẻ #${batch.batchCode}` : `Mẻ #${batch.batchCode} -> ${toName}`, message, { batchCode: batch.batchCode, toStage: batch.toStage });
    }
    /**
     * 3. Bắn CẢNH BÁO ĐỎ khi có sự cố QC hoặc hỏng hóc khẩn cấp
     */
    async notifyQcIncident(incident) {
        const stageName = batchSchema_1.STAGE_DISPLAY_NAMES[incident.stageName] || incident.stageName;
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
        await this.logEvent('QC_ALERT', `🚨 Lỗi QC mẻ #${incident.batchCode}: ${incident.defectCount} sản phẩm`, message, { batchCode: incident.batchCode, defectCount: incident.defectCount, reason: incident.reason });
    }
    /**
     * 4. Bắn thông báo khi chuyển lùi công đoạn (Rework & Rollback)
     */
    async notifyStageRollback(payload) {
        const fromName = batchSchema_1.STAGE_DISPLAY_NAMES[payload.fromStage] || payload.fromStage;
        const toName = batchSchema_1.STAGE_DISPLAY_NAMES[payload.toStage] || payload.toStage;
        const message = `
⚠️ <b>[ĐIỀU PHỐI LẠI - TÁI CHẾ / SỬA PHÔI] MẺ GỐM #${payload.batchCode}</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏺 <b>Sản phẩm:</b> ${payload.productName}
📍 <b>Chuyển lùi từ:</b> <i>${fromName}</i> ➔ 🎯 <b>${toName}</b>
📝 <b>Lý do yêu cầu sửa:</b> <i>"${payload.reason}"</i>
⏰ <b>Thời điểm:</b> ${new Date().toLocaleString('vi-VN')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        const replyMarkup = payload.id ? {
            inline_keyboard: [
                [
                    {
                        text: `✅ Đã sửa xong "${toName}" ➔ Chuyển tiếp`,
                        callback_data: `advance:${payload.id}:${payload.toStage}`,
                    },
                ],
            ],
        } : undefined;
        await this.dispatchMessage(message, replyMarkup);
        await this.logEvent('STAGE_ROLLBACK', `⚠️ Mẻ #${payload.batchCode} chuyển lùi về ${toName}`, message, { batchCode: payload.batchCode, fromStage: payload.fromStage, toStage: payload.toStage, reason: payload.reason });
    }
}
exports.TelegramService = TelegramService;
exports.telegramService = new TelegramService();
