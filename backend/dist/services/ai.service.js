"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiService = exports.AiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const batchSchema_1 = require("../schemas/batchSchema");
class AiService {
    genAI = null;
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && apiKey.trim() !== '') {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        }
    }
    /**
     * Phân tích văn bản mô tả tự nhiên từ người dùng bằng AI hoặc Fallback Engine
     */
    async extractOrderSpecs(rawText) {
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
            }
            catch (err) {
                console.warn(`[AI Service] Gemini API call error: ${err.message}. Đang kích hoạt Fallback Engine...`);
            }
        }
        // 2. Intelligent Domain Heuristic Fallback Engine
        return this.heuristicFallbackParser(cleanText);
    }
    async callGeminiLlm(rawText) {
        if (!this.genAI)
            return null;
        const model = this.genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.2,
            },
        });
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
        const result = await model.generateContent([
            { text: systemPrompt },
            { text: `Văn bản đơn hàng: "${rawText}"` },
        ]);
        const rawJson = result.response.text();
        const parsed = JSON.parse(rawJson);
        return batchSchema_1.CeramicOrderExtractionSchema.parse(parsed);
    }
    /**
     * Bộ phân tích Heuristic thông minh cho nghiệp vụ gốm sứ khi chưa có API Key
     */
    heuristicFallbackParser(text) {
        const lower = text.toLowerCase();
        // 1. Trích xuất số lượng
        let quantity = 100;
        const qtyMatch = text.match(/(?:đơn|số lượng|sl|làm|sản xuất|order)\s*[:\s]*(\d+)/i) || text.match(/(\d+)\s*(?:chiếc|cái|sản phẩm|bình|chén|bộ|ly|đĩa|hũ)/i);
        if (qtyMatch && qtyMatch[1]) {
            quantity = parseInt(qtyMatch[1], 10);
        }
        // 2. Trích xuất thời hạn & ưu tiên
        let deadlineDays = null;
        let priority = 'MEDIUM';
        const dayMatch = text.match(/(\d+)\s*(?:ngày|day|days)/i);
        if (dayMatch && dayMatch[1]) {
            deadlineDays = parseInt(dayMatch[1], 10);
            if (deadlineDays <= 3 || lower.includes('gấp') || lower.includes('hỏa tốc')) {
                priority = 'URGENT';
            }
            else if (deadlineDays <= 10) {
                priority = 'HIGH';
            }
            else if (deadlineDays > 30) {
                priority = 'LOW';
            }
        }
        else if (lower.includes('gấp') || lower.includes('hỏa tốc') || lower.includes('khẩn')) {
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
        if (lower.includes('men rạn'))
            glazeType = 'Men rạn cổ Bát Tràng';
        else if (lower.includes('men ngọc') || lower.includes('celadon'))
            glazeType = 'Men ngọc (Celadon)';
        else if (lower.includes('men hỏa biến'))
            glazeType = 'Men hỏa biến nhiệt độ cao';
        else if (lower.includes('men hoàng lưu'))
            glazeType = 'Men hoàng lưu hoàng gia';
        else if (lower.includes('men tro'))
            glazeType = 'Men tro tự nhiên';
        else if (lower.includes('men trắng') || lower.includes('sứ trắng'))
            glazeType = 'Men sứ trắng bóng';
        else if (lower.includes('men lam'))
            glazeType = 'Men lam vẽ tay truyền thống';
        // 5. Trích xuất nhiệt độ nung
        let firingTemp = 1250;
        const tempMatch = text.match(/(\d{3,4})\s*(?:°c|c|độ)/i);
        if (tempMatch && tempMatch[1]) {
            firingTemp = parseInt(tempMatch[1], 10);
        }
        else if (lower.includes('nhiệt độ cao') || lower.includes('nung cao')) {
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
        }
        else if (lower.includes('ấm chén') || lower.includes('tách')) {
            productName = `Bộ ấm chén gốm sứ cao cấp (${glazeType})`;
            artworkDetails = 'Khắc chìm hoa văn tinh xảo';
        }
        else if (lower.includes('hút lộc') || lower.includes('hút tài')) {
            productName = `Bình hút tài lộc phong thủy (${glazeType})`;
            artworkDetails = 'Vẽ vàng kim họa tiết Thuận Buồm Xuôi Gió';
        }
        else if (lower.includes('đĩa') || lower.includes('khay')) {
            productName = `Đĩa gốm trang trí (${glazeType})`;
            artworkDetails = 'Họa tiết phong cảnh làng quê';
        }
        else {
            productName = `Mẻ sản phẩm gốm sứ ${glazeType}`;
        }
        const durationHours = firingTemp >= 1250 ? 14 : 10;
        const resultPayload = {
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
        return batchSchema_1.CeramicOrderExtractionSchema.parse(resultPayload);
    }
}
exports.AiService = AiService;
exports.aiService = new AiService();
