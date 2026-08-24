import { GoogleGenerativeAI } from '@google/generative-ai';
import { CeramicOrderExtraction, CeramicOrderExtractionSchema } from '../schemas/batchSchema';

export class AiService {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== '') {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Phân tích văn bản mô tả tự nhiên từ người dùng bằng AI hoặc Fallback Engine
   */
  async extractOrderSpecs(rawText: string): Promise<CeramicOrderExtraction> {
    const cleanText = rawText.trim();
    if (!cleanText) {
      throw new Error('Vui lòng cung cấp mô tả đơn hàng.');
    }

    // 1. Thử gọi LLM nếu có GEMINI_API_KEY
    if (this.genAI) {
      try {
        const extraction = await this.callGeminiLlm(cleanText);
        if (extraction) {
          return extraction;
        }
      } catch (err: any) {
        console.warn(`[AI Service] Gemini API call error: ${err.message}. Đang kích hoạt Fallback Engine...`);
      }
    }

    // 2. Intelligent Domain Heuristic Fallback Engine
    return this.heuristicFallbackParser(cleanText);
  }

  private async callGeminiLlm(rawText: string): Promise<CeramicOrderExtraction | null> {
    if (!this.genAI) return null;

    const preferredModel = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
    const candidateModels = Array.from(new Set([preferredModel, 'gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-1.5-flash', 'gemini-pro']));

    const systemPrompt = `
Bạn là AI Agent Chuyên gia Kỹ thuật và Điều phối Sản xuất Gốm Sứ Bát Tràng / Chu Đậu.
Nhiệm vụ của bạn là nhận mô tả yêu cầu đơn hàng dạng văn bản tự nhiên tiếng Việt và bóc tách thành đối tượng JSON chuẩn theo cấu trúc yêu cầu.

Quy tắc nghiệp vụ & ước tính kỹ thuật:
1. Tên sản phẩm (product_name): Tên chính xác ngắn gọn (ví dụ: "Bình gốm họa tiết sen men lam", "Bộ ấm chén tử sa").
2. Số lượng (quantity): Số nguyên dương. Nếu không ghi rõ, mặc định là 100.
3. Hạn giao hàng (deadline_days): Số ngày từ mô tả (ví dụ "trong 10 ngày" -> 10, "giao gấp 3 ngày" -> 3). Nếu không đề cập thì null.
4. Mức độ ưu tiên (priority):
   - URGENT: Dưới 5 ngày hoặc có từ "gấp", "hỏa tốc".
   - HIGH: Từ 5 - 10 ngày.
   - MEDIUM: Trên 10 ngày hoặc đơn thông thường.
   - LOW: Không gấp hoặc thời gian dài.
5. Thông số kỹ thuật (technical_specs):
   - dimensions: height_cm, diameter_cm (nếu có từ "cao 35cm" -> height_cm = 35).
   - estimated_clay_kg: Ước tính tổng khối lượng đất sét (kg) = Số lượng * (Đất cho 1 sản phẩm). Với sản phẩm cao ~35cm tốn khoảng 1.5kg đất/chiếc -> 200 chiếc tốn 300kg.
   - glaze_type: Loại men (men lam, men rạn, men ngọc, men hoàng lưu, men hỏa biến, men tro...). Mặc định "Men lam truyền thống".
   - firing_specs:
     + target_temperature_c: Nhiệt độ nung (°C). Nếu yêu cầu nung cao hoặc men lam/rạn thường 1250°C - 1300°C (mặc định 1280°C). Nếu men nhẹ nhiệt thường 1050°C - 1150°C.
     + estimated_duration_hours: Thời gian nung dự kiến trong lò (thường 12 - 18 giờ tùy nhiệt độ).
     + firing_curve: "Nung khử oxy hóa cao" hoặc "Nung lò gas tuần hoàn".
   - craft_technique: Kỹ thuật tạo hình (Vuốt tay thủ công, Đổ rót khuôn thạch cao, Dập áp lực...).
   - artwork_details: Chi tiết hoa văn (Vẽ sen, Tứ quý, Rồng phượng, Trơn không họa tiết...).
   - additional_notes: Mảng string chứa các yêu cầu đặc thù khác.
6. ai_reasoning: Giải thích ngắn gọn 1-2 câu lý do ước tính các con số trên.

Hãy trả về DUY NHẤT một JSON hợp lệ tuân thủ chính xác Schema. Không kèm bất kỳ văn bản giải thích nào ngoài JSON.
`;

    for (const modelName of candidateModels) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const result = await model.generateContent([
          { text: systemPrompt },
          { text: `Văn bản đơn hàng: "${rawText}"` },
        ]);

        const rawJson = result.response.text();
        const parsed = JSON.parse(rawJson);
        return CeramicOrderExtractionSchema.parse(parsed);
      } catch (err: any) {
        console.warn(`[AI Service] Model '${modelName}' không khả dụng (${err.message}). Đang thử model tiếp theo...`);
      }
    }

    return null;
  }

  /**
   * Bộ phân tích Heuristic thông minh cho nghiệp vụ gốm sứ khi chưa có API Key
   */
  private heuristicFallbackParser(text: string): CeramicOrderExtraction {
    const lower = text.toLowerCase();

    // 1. Trích xuất số lượng
    let quantity = 100;
    const qtyMatch = text.match(/(?:đơn|số lượng|sl|làm|sản xuất|order)\s*[:\s]*(\d+)/i) || text.match(/(\d+)\s*(?:chiếc|cái|sản phẩm|bình|chén|bộ|ly|đĩa|hũ)/i);
    if (qtyMatch && qtyMatch[1]) {
      quantity = parseInt(qtyMatch[1], 10);
    }

    // 2. Trích xuất thời hạn & ưu tiên
    let deadlineDays: number | null = null;
    let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
    const dayMatch = text.match(/(\d+)\s*(?:ngày|day|days)/i);
    if (dayMatch && dayMatch[1]) {
      deadlineDays = parseInt(dayMatch[1], 10);
      if (deadlineDays <= 3 || lower.includes('gấp') || lower.includes('hỏa tốc')) {
        priority = 'URGENT';
      } else if (deadlineDays <= 10) {
        priority = 'HIGH';
      } else if (deadlineDays > 30) {
        priority = 'LOW';
      }
    } else if (lower.includes('gấp') || lower.includes('hỏa tốc') || lower.includes('khẩn')) {
      priority = 'URGENT';
      deadlineDays = 3;
    }

    // 3. Trích xuất kích thước (chiều cao)
    let heightCm = 30;
    const heightMatch = text.match(/cao\s*(\d+(?:\.\d+)?)\s*cm/i) || text.match(/(\d+(?:\.\d+)?)\s*cm/i);
    if (heightMatch && heightMatch[1]) {
      heightCm = parseFloat(heightMatch[1]);
    }

    // 4. Trích xuất loại men
    let glazeType = 'Men lam cổ truyền';
    if (lower.includes('men rạn')) glazeType = 'Men rạn cổ Bát Tràng';
    else if (lower.includes('men ngọc') || lower.includes('celadon')) glazeType = 'Men ngọc (Celadon)';
    else if (lower.includes('men hỏa biến')) glazeType = 'Men hỏa biến nhiệt độ cao';
    else if (lower.includes('men hoàng lưu')) glazeType = 'Men hoàng lưu hoàng gia';
    else if (lower.includes('men tro')) glazeType = 'Men tro tự nhiên';
    else if (lower.includes('men trắng') || lower.includes('sứ trắng')) glazeType = 'Men sứ trắng bóng';
    else if (lower.includes('men lam')) glazeType = 'Men lam vẽ tay truyền thống';

    // 5. Trích xuất nhiệt độ nung
    let firingTemp = 1250;
    const tempMatch = text.match(/(\d{3,4})\s*(?:°c|c|độ)/i);
    if (tempMatch && tempMatch[1]) {
      firingTemp = parseInt(tempMatch[1], 10);
    } else if (lower.includes('nhiệt độ cao') || lower.includes('nung cao')) {
      firingTemp = 1280;
    }

    // 6. Tính toán khối lượng đất sét ước tính
    // Ước tính: Trọng lượng 1 sản phẩm phụ thuộc vào chiều cao theo hàm bậc hai xấp xỉ
    const weightPerItemKg = Math.max(0.3, Math.round((Math.pow(heightCm / 30, 2) * 1.2) * 10) / 10);
    const estimatedClayKg = Math.round(quantity * weightPerItemKg * 1.15 * 10) / 10; // +15% hao hụt khi tiện gọt mộc

    // 7. Xác định tên sản phẩm & họa tiết
    let productName = 'Bình gốm nghệ thuật';
    let artworkDetails = 'Họa tiết thủ công';
    if (lower.includes('sen') || lower.includes('hoa sen')) {
      productName = `Bình gốm họa tiết hoa sen (${glazeType})`;
      artworkDetails = 'Vẽ tay họa tiết hoa sen & lá sen thủy mặc';
    } else if (lower.includes('ấm chén') || lower.includes('tách')) {
      productName = `Bộ ấm chén gốm sứ cao cấp (${glazeType})`;
      artworkDetails = 'Khắc chìm hoa văn tinh xảo';
    } else if (lower.includes('hút lộc') || lower.includes('hút tài')) {
      productName = `Bình hút tài lộc phong thủy (${glazeType})`;
      artworkDetails = 'Vẽ vàng kim họa tiết Thuận Buồm Xuôi Gió';
    } else if (lower.includes('đĩa') || lower.includes('khay')) {
      productName = `Đĩa gốm trang trí (${glazeType})`;
      artworkDetails = 'Họa tiết phong cảnh làng quê';
    } else {
      productName = `Mẻ sản phẩm gốm sứ ${glazeType}`;
    }

    const durationHours = firingTemp >= 1250 ? 14 : 10;

    const resultPayload: CeramicOrderExtraction = {
      product_name: productName,
      quantity: quantity,
      deadline_days: deadlineDays,
      priority: priority,
      technical_specs: {
        dimensions: {
          height_cm: heightCm,
          diameter_cm: Math.round(heightCm * 0.6),
        },
        estimated_clay_kg: estimatedClayKg,
        glaze_type: glazeType,
        firing_specs: {
          target_temperature_c: firingTemp,
          estimated_duration_hours: durationHours,
          firing_curve: firingTemp >= 1250 ? 'Nung khử oxy hóa khí gas' : 'Nung oxy hóa buồng nhiệt điện',
        },
        craft_technique: heightCm > 40 ? 'Vuốt tay thủ công kết hợp tiện mộc' : 'Tạo hình bàn xoay & dập khuôn',
        artwork_details: artworkDetails,
        additional_notes: [
          `Đã tính kèm 15% hao hụt nguyên liệu đất sét khi tiện gọt`,
          `Nhiệt độ nung mục tiêu ${firingTemp}°C đòi hỏi giữ nhiệt (soaking) 2.5 giờ ở đỉnh lò`,
        ],
      },
      ai_reasoning: `Bóc tách thành công ${quantity} sản phẩm với thông số kích thước cao ${heightCm}cm, dự toán ${estimatedClayKg}kg đất sét và nhiệt độ lò ${firingTemp}°C để đạt chuẩn chất men ${glazeType}.`,
    };

    return CeramicOrderExtractionSchema.parse(resultPayload);
  }

  /**
   * RAG Conversational Copilot: Tiếp nhận mô tả, phân tích độ đầy đủ thông số & đặt câu hỏi tương tác nếu còn thiếu
   */
  async chatWithRagAssistant(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]): Promise<{
    reply: string;
    is_complete: boolean;
    missing_fields: string[];
    suggested_options?: string[];
    extracted_specs: CeramicOrderExtraction | null;
  }> {
    if (!messages || messages.length === 0) {
      throw new Error('Danh sách tin nhắn không được để trống.');
    }

    const conversationHistory = messages
      .map((m) => `${m.role === 'user' ? 'Khách hàng / Quản đốc' : 'Trợ lý AI'}: ${m.content}`)
      .join('\n');

    // 1. Thử gọi Gemini AI
    if (this.genAI) {
      const preferredModel = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
      const candidateModels = Array.from(
        new Set([preferredModel, 'gemini-2.5-flash', 'gemini-3.6-flash', 'gemini-1.5-flash', 'gemini-pro'])
      );

      const ragPrompt = `
Bạn là "Trợ Lý Kỹ Sư Trưởng Xưởng Gốm Sứ Bát Tràng (CeramixFlow RAG Copilot)".
Bạn có kiến thức chuyên sâu về công nghệ sản xuất gốm sứ thủ công Bát Tràng:
- Đất sét: Đất sét trắng Kaolin dẻo, đất sét đỏ gốm mộc, đất tử sa.
- Định mức đất: Ly/Cốc (0.25-0.35kg), Ấm chén (1.0-1.5kg/bộ), Bình cao 25-35cm (1.0-1.8kg), Bình lớn 40-60cm (2.5-5kg), Chum vại (5-15kg).
- Men gốm & Nhiệt độ:
  + Men lam cổ truyền: nung oxy hóa 1260 - 1280°C
  + Men rạn cổ: nung 1200 - 1220°C (làm nguội tạo rạn, đánh mực tàu)
  + Men ngọc Celadon / Hỏa biến: nung khử môi trường 1260 - 1300°C
  + Men da lươn / men tro: nung 1220 - 1250°C
  + Men hoàng gia / vàng: 1200 - 1260°C
- Các thông số kỹ thuật chuyên sâu ngành gốm:
  + Kỹ thuật viền miệng / phụ kiện: Bọc đồng thủ công, dát vàng kim 24K, quai mây truyền thống...
  + Thông số phôi mộc: Tỷ lệ co ngót nhiệt (10% - 14%), Độ ẩm phôi mộc (14% - 18%), Thời gian ủ men (24h - 48h), Độ dày thành gốm (3mm - 12mm)...
  + Chế độ lò nung nâng cao: Thời gian giữ nhiệt đỉnh (Soaking: 60 - 180 phút), Áp suất buồng lò, Môi trường nung khử sâu/oxy hóa.

LỊCH SỬ HỘI THOẠI ĐẾN HIỆN TẠI:
${conversationHistory}

QUY TRÌNH HỘI THOẠI 2 TẦNG (BẮT BUỘC TUÂN THỦ):

🔷 TẦNG 1: KIỂM TRA 5 THÔNG TIN ĐƠN HÀNG CƠ BẢN:
1. Tên dòng sản phẩm & chủng loại
2. Số lượng sản phẩm
3. Chiều cao / Kích thước (cm)
4. Loại men gốm mong muốn
5. Thời hạn hoàn thành / giao hàng (ngày)
=> NẾU THIẾU BẤT KỲ THÔNG TIN NÀO TRONG 5 MỤC TRÊN:
   - 'is_complete': false
   - Hỏi trọng tâm các thông tin cơ bản còn thiếu.
   - 'missing_fields': Danh sách các mục còn thiếu.
   - 'suggested_options': 3-4 lựa chọn nhanh (ví dụ: ["Cao 35cm", "Men lam Bát Tràng", "Hoàn thành trong 7 ngày"]).

🔶 TẦNG 2: HỎI THÊM CÁC THÔNG SỐ KỸ THUẬT CHUYÊN SÂU (SAU KHI ĐÃ XONG CƠ BẢN):
Nếu đã có đủ 5 thông tin cơ bản ở trên NHƯNG người dùng CHƯA được hỏi hoặc chưa thảo luận về các **Thông Số Kỹ Thuật Bổ Sung**:
=> KHÔNG ĐƯỢC KẾT THÚC NGAY! ĐẶT 'is_complete': false.
=> Trong 'reply': Xác nhận các thông số cơ bản đã có, sau đó hỏi thăm dò chuyên gia về các thông số kỹ thuật chuyên sâu:
   - "Đã ghi nhận các thông số cơ bản của đơn hàng. Để xưởng gốm thiết lập công thức và quy trình nung chính xác nhất, bạn có yêu cầu gì về các **Thông Số Kỹ Thuật Chuyên Sâu** dưới đây không?"
     1. Kỹ thuật hoàn thiện viền miệng / Họa tiết (Bọc đồng, Dát vàng 24K, Men rạn đánh mực...)?
     2. Đặc tính phôi mộc & vật liệu (Tỷ lệ co ngót nhiệt, Độ ẩm mộc, Độ dày thành gốm...)?
     3. Chế độ lò nung nâng cao (Thời gian giữ nhiệt đỉnh Soaking, Nung khử khí gas...)?
=> 'missing_fields': ["Thông số kỹ thuật chuyên sâu (Tùy chọn)"]
=> 'suggested_options': [
     "Bọc đồng viền miệng thủ công",
     "Tỷ lệ co ngót nhiệt 12.5%",
     "Giữ nhiệt đỉnh lò (Soaking) 120 phút",
     "Áp dụng thông số kỹ thuật tiêu chuẩn của xưởng"
   ]

🔷 TẦNG 3: HOÀN THIỆN & ĐÓNG GÓI JSON (KHI NGƯỜI DÙNG ĐÃ CHỌN THÔNG SỐ HOẶC CHỌN 'TIÊU CHUẨN'):
Khi người dùng đã bổ sung thông số kỹ thuật hoặc nhắn 'Áp dụng thông số tiêu chuẩn' / 'Không cần thêm' / 'Dùng mặc định':
=> ĐẶT 'is_complete': true.
=> Viết 'reply' tổng kết trọn vẹn toàn bộ kế hoạch sản xuất và thông số kỹ thuật.
=> Đóng gói 'extracted_specs' đầy đủ có:
   {
     "product_name": string,
     "quantity": number,
     "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
     "deadline_days": number,
     "technical_specs": {
       "dimensions": { "height_cm": number, "diameter_cm": number },
       "estimated_clay_kg": number,
       "glaze_type": string,
       "firing_specs": { "target_temperature_c": number, "estimated_duration_hours": number, "firing_curve": string },
       "craft_technique": string,
       "artwork_details": string,
       "custom_attributes": {
         // Chứa các thông số kỹ thuật bổ sung (ví dụ: "Tỷ lệ co ngót nhiệt": "12.5%", "Kỹ thuật viền miệng": "Bọc đồng thủ công"...)
       }
     },
     "ai_reasoning": string
   }

BẮT BUỘC TRẢ VỀ DUY NHẤT 1 ĐỐI TƯỢNG JSON:
{
  "reply": "Nội dung phản hồi...",
  "is_complete": true hoặc false,
  "missing_fields": ["..."],
  "suggested_options": ["..."],
  "extracted_specs": { ... } hoặc null
}
`;

      for (const modelName of candidateModels) {
        try {
          const model = this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });

          const result = await model.generateContent(ragPrompt);
          const responseText = result.response.text();
          if (responseText) {
            const parsed = JSON.parse(responseText);
            return {
              reply: parsed.reply || 'Chào bạn, tôi đã tiếp nhận yêu cầu.',
              is_complete: Boolean(parsed.is_complete),
              missing_fields: Array.isArray(parsed.missing_fields) ? parsed.missing_fields : [],
              suggested_options: Array.isArray(parsed.suggested_options) ? parsed.suggested_options : [],
              extracted_specs: parsed.extracted_specs ? parsed.extracted_specs : null,
            };
          }
        } catch (e: any) {
          console.warn(`[AI RAG Chat] Thử model ${modelName} thất bại: ${e.message}`);
        }
      }
    }

    // 2. Fallback Heuristic RAG Assistant (2-Stage Prompting)
    const fullText = messages.map((m) => m.content).join(' ');
    const lowerFull = fullText.toLowerCase();

    const hasQty = /\d+\s*(?:chiếc|bộ|cái|ly|bình|chum|đĩa)/i.test(fullText) || /\b\d+\b/.test(fullText);
    const hasHeight = /\d+\s*(?:cm|centimet|mét|m)/i.test(fullText) || /cao\s*\d+/i.test(fullText);
    const hasGlaze = /(?:men lam|men rạn|men ngọc|celadon|men da lươn|men tro|men hoàng|men hỏa biến)/i.test(fullText);
    const hasDeadline = /\d+\s*(?:ngày|tuần|tháng|hạn)/i.test(fullText);

    // Tầng 1: Thiếu thông tin cơ bản
    const missingBasic: string[] = [];
    if (!hasQty) missingBasic.push('Số lượng cần sản xuất');
    if (!hasHeight) missingBasic.push('Chiều cao / Kích thước (cm)');
    if (!hasGlaze) missingBasic.push('Loại men gốm mong muốn');
    if (!hasDeadline) missingBasic.push('Thời hạn hoàn thành (ngày)');

    if (missingBasic.length > 0) {
      const suggestions: string[] = [];
      if (!hasHeight) suggestions.push('Chiều cao 35cm');
      if (!hasGlaze) suggestions.push('Men lam Bát Tràng');
      if (!hasDeadline) suggestions.push('Hoàn thành trong 7 ngày');
      if (!hasQty) suggestions.push('Số lượng 100 chiếc');

      return {
        reply: `Chào Quản đốc! Tôi đã tiếp nhận thông tin sơ bộ. Để xưởng có thể thiết lập lệnh sản xuất, bạn vui lòng cung cấp thêm các thông tin cơ bản sau:\n\n${missingBasic.map((m, i) => `${i + 1}. **${m}**?`).join('\n')}`,
        is_complete: false,
        missing_fields: missingBasic,
        suggested_options: suggestions,
        extracted_specs: null,
      };
    }

    // Tầng 2: Đã có thông tin cơ bản -> Hỏi thêm Thông Số Kỹ Thuật Nâng Cao
    const hasAdvancedSpecs =
      lowerFull.includes('co ngót') ||
      lowerFull.includes('bọc đồng') ||
      lowerFull.includes('soaking') ||
      lowerFull.includes('tiêu chuẩn') ||
      lowerFull.includes('mặc định') ||
      lowerFull.includes('độ ẩm') ||
      lowerFull.includes('dát vàng') ||
      lowerFull.includes('không cần') ||
      lowerFull.includes('áp dụng');

    if (!hasAdvancedSpecs) {
      return {
        reply: `Tuyệt vời! Tôi đã ghi nhận đầy đủ 5 thông số cơ bản. Để đảm bảo mẻ gốm đạt độ bền hoàn hảo và tối ưu chất lượng mộc khi nung, bạn có yêu cầu bổ sung thêm về các **Thông Số Kỹ Thuật Chuyên Sâu** dưới đây không?\n\n1. **Kỹ thuật viền miệng / Chế tác:** Bọc đồng thủ công, Dát vàng kim 24K?\n2. **Thông số phôi mộc:** Tỷ lệ co ngót nhiệt (10-14%), Độ ẩm phôi mộc?\n3. **Chế độ nung lò:** Thời gian giữ nhiệt đỉnh (Soaking) 60-180 phút?\n\n*(Nếu không có yêu cầu đặc biệt, bạn có thể chọn "Áp dụng thông số kỹ thuật tiêu chuẩn của xưởng")*`,
        is_complete: false,
        missing_fields: ['Thông số kỹ thuật chuyên sâu (Tùy chọn)'],
        suggested_options: [
          'Bọc đồng viền miệng thủ công',
          'Tỷ lệ co ngót nhiệt 12.5%',
          'Giữ nhiệt đỉnh lò (Soaking) 120 phút',
          'Áp dụng thông số kỹ thuật tiêu chuẩn của xưởng',
        ],
        extracted_specs: null,
      };
    }

    // Tầng 3: Đã đủ cả 2 tầng -> Đóng gói JSON
    const extracted = this.heuristicFallbackParser(fullText);

    // Bổ sung custom specs nếu có nhắc đến
    if (lowerFull.includes('bọc đồng')) {
      extracted.technical_specs.custom_attributes = {
        ...(extracted.technical_specs.custom_attributes || {}),
        'Kỹ thuật viền miệng': 'Bọc đồng thủ công chữ Vạn',
      };
    }
    if (lowerFull.includes('co ngót')) {
      extracted.technical_specs.custom_attributes = {
        ...(extracted.technical_specs.custom_attributes || {}),
        'Tỷ lệ co ngót nhiệt': '12.5%',
      };
    }
    if (lowerFull.includes('soaking') || lowerFull.includes('giữ nhiệt')) {
      extracted.technical_specs.custom_attributes = {
        ...(extracted.technical_specs.custom_attributes || {}),
        'Thời gian giữ nhiệt đỉnh (Soaking)': '120 phút',
      };
    }

    return {
      reply: `Hoàn tất! Tôi đã tổng hợp toàn diện kế hoạch sản xuất cho mẻ **${extracted.product_name}** (${extracted.quantity} chiếc). Đã tự động ước tính **${extracted.technical_specs.estimated_clay_kg}kg đất sét**, nhiệt độ lò **${extracted.technical_specs.firing_specs.target_temperature_c}°C** (${extracted.technical_specs.firing_specs.estimated_duration_hours} giờ nung) và tích hợp các thông số kỹ thuật chuyên sâu vào cấu trúc JSONB. Bạn có thể bấm nút bên dưới để kích hoạt ngay vào bảng điều phối!`,
      is_complete: true,
      missing_fields: [],
      suggested_options: [],
      extracted_specs: extracted,
    };
  }
}

export const aiService = new AiService();
