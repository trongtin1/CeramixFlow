"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportQcIncidentSchema = exports.CreateBatchRequestSchema = exports.CeramicOrderExtractionSchema = exports.TechnicalSpecsSchema = exports.STAGE_DISPLAY_NAMES = exports.STAGES = void 0;
const zod_1 = require("zod");
exports.STAGES = [
    'TAO_HINH_MOC',
    'PHOI_SUA_MOC',
    'VE_HOA_TIET',
    'TRANG_MEN',
    'VAO_LO_NUNG',
    'QC_DONG_GOI',
];
exports.STAGE_DISPLAY_NAMES = {
    TAO_HINH_MOC: '1. Tạo hình mộc',
    PHOI_SUA_MOC: '2. Phơi sấy & Sửa mộc',
    VE_HOA_TIET: '3. Vẽ họa tiết',
    TRANG_MEN: '4. Tráng men',
    VAO_LO_NUNG: '5. Vào lò nung',
    QC_DONG_GOI: '6. QC & Đóng gói',
};
// Dynamic Technical Specifications Schema (Extensible & Validated)
exports.TechnicalSpecsSchema = zod_1.z.object({
    dimensions: zod_1.z.object({
        height_cm: zod_1.z.number().optional().describe('Chiều cao sản phẩm (cm)'),
        diameter_cm: zod_1.z.number().optional().describe('Đường kính sản phẩm (cm)'),
        width_cm: zod_1.z.number().optional().describe('Chiều rộng sản phẩm (cm)'),
    }).passthrough().optional(),
    estimated_clay_kg: zod_1.z.number().positive().describe('Tổng lượng đất sét ước tính (kg)'),
    glaze_type: zod_1.z.string().min(1).describe('Loại men sử dụng (men lam, men rạn, men ngọc, men hoàng lưu...)'),
    firing_specs: zod_1.z.object({
        target_temperature_c: zod_1.z.number().min(800).max(1500).describe('Nhiệt độ nung mục tiêu (°C)'),
        estimated_duration_hours: zod_1.z.number().min(1).max(72).describe('Thời gian nung dự kiến (giờ)'),
        firing_curve: zod_1.z.string().optional().describe('Kiểu nung: nung oxy hóa, nung khử, nung củi...'),
    }).passthrough(),
    craft_technique: zod_1.z.string().optional().describe('Kỹ thuật chế tác: vuốt tay, đổ rót khuôn, dập khuôn...'),
    artwork_details: zod_1.z.string().optional().describe('Chi tiết hoa văn trang trí'),
    additional_notes: zod_1.z.array(zod_1.z.string()).optional().describe('Các ghi chú kỹ thuật mở rộng khác'),
}).passthrough();
// Schema for Natural Language AI Order Parsing Output
exports.CeramicOrderExtractionSchema = zod_1.z.object({
    product_name: zod_1.z.string().min(1).describe('Tên định danh sản phẩm gốm'),
    quantity: zod_1.z.number().int().positive().describe('Số lượng sản phẩm trong mẻ'),
    deadline_days: zod_1.z.number().int().positive().nullable().describe('Thời hạn hoàn thành (ngày) hoặc null nếu không đề cập'),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM').describe('Độ ưu tiên sản xuất'),
    technical_specs: exports.TechnicalSpecsSchema,
    ai_reasoning: zod_1.z.string().optional().describe('Giải thích tóm tắt logic ước tính của AI'),
});
// Create Batch API Request Schema
exports.CreateBatchRequestSchema = zod_1.z.object({
    batch_code: zod_1.z.string().optional(),
    raw_description: zod_1.z.string().min(1),
    product_name: zod_1.z.string().min(1),
    quantity: zod_1.z.number().int().positive(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
    deadline_days: zod_1.z.number().int().positive().nullable().optional(),
    technical_specs: exports.TechnicalSpecsSchema,
});
// QC Incident Report Request Schema
exports.ReportQcIncidentSchema = zod_1.z.object({
    defect_count: zod_1.z.number().int().positive().describe('Số lượng sản phẩm bị lỗi'),
    reason: zod_1.z.string().min(3).describe('Nguyên nhân lỗi (ví dụ: Nứt men, rạn xương gốm, méo form do nhiệt...)'),
    severity: zod_1.z.enum(['WARNING', 'CRITICAL']).default('CRITICAL'),
});
