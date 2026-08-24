import { z } from 'zod';

export const STAGES = [
  'TAO_HINH_MOC',
  'PHOI_SUA_MOC',
  'VE_HOA_TIET',
  'TRANG_MEN',
  'VAO_LO_NUNG',
  'QC_DONG_GOI',
] as const;

export type StageNameType = typeof STAGES[number];

export const STAGE_DISPLAY_NAMES: Record<StageNameType, string> = {
  TAO_HINH_MOC: '1. Tạo hình mộc',
  PHOI_SUA_MOC: '2. Phơi sấy & Sửa mộc',
  VE_HOA_TIET: '3. Vẽ họa tiết',
  TRANG_MEN: '4. Tráng men',
  VAO_LO_NUNG: '5. Vào lò nung',
  QC_DONG_GOI: '6. QC & Đóng gói',
};

// Dynamic Technical Specifications Schema (Extensible & Validated)
export const TechnicalSpecsSchema = z.object({
  dimensions: z.object({
    height_cm: z.number().optional().describe('Chiều cao sản phẩm (cm)'),
    diameter_cm: z.number().optional().describe('Đường kính sản phẩm (cm)'),
    width_cm: z.number().optional().describe('Chiều rộng sản phẩm (cm)'),
  }).passthrough().optional(),
  estimated_clay_kg: z.number().positive().describe('Tổng lượng đất sét ước tính (kg)'),
  glaze_type: z.string().min(1).describe('Loại men sử dụng (men lam, men rạn, men ngọc, men hoàng lưu...)'),
  firing_specs: z.object({
    target_temperature_c: z.number().min(800).max(1500).describe('Nhiệt độ nung mục tiêu (°C)'),
    estimated_duration_hours: z.number().min(1).max(72).describe('Thời gian nung dự kiến (giờ)'),
    firing_curve: z.string().optional().describe('Kiểu nung: nung oxy hóa, nung khử, nung củi...'),
  }).passthrough(),
  craft_technique: z.string().optional().describe('Kỹ thuật chế tác: vuốt tay, đổ rót khuôn, dập khuôn...'),
  artwork_details: z.string().optional().describe('Chi tiết hoa văn trang trí'),
  additional_notes: z.array(z.string()).optional().describe('Các ghi chú kỹ thuật mở rộng khác'),
}).passthrough();

export type TechnicalSpecs = z.infer<typeof TechnicalSpecsSchema>;

// Schema for Natural Language AI Order Parsing Output
export const CeramicOrderExtractionSchema = z.object({
  product_name: z.string().min(1).describe('Tên định danh sản phẩm gốm'),
  quantity: z.number().int().positive().describe('Số lượng sản phẩm trong mẻ'),
  deadline_days: z.number().int().positive().nullable().describe('Thời hạn hoàn thành (ngày) hoặc null nếu không đề cập'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM').describe('Độ ưu tiên sản xuất'),
  technical_specs: TechnicalSpecsSchema,
  ai_reasoning: z.string().optional().describe('Giải thích tóm tắt logic ước tính của AI'),
});

export type CeramicOrderExtraction = z.infer<typeof CeramicOrderExtractionSchema>;

// Create Batch API Request Schema
export const CreateBatchRequestSchema = z.object({
  batch_code: z.string().optional(),
  raw_description: z.string().min(1),
  product_name: z.string().min(1),
  quantity: z.number().int().positive(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  deadline_days: z.number().int().positive().nullable().optional(),
  technical_specs: TechnicalSpecsSchema,
});

export type CreateBatchRequest = z.infer<typeof CreateBatchRequestSchema>;

// QC Incident Report Request Schema
export const ReportQcIncidentSchema = z.object({
  defect_count: z.number().int().positive().describe('Số lượng sản phẩm bị lỗi'),
  reason: z.string().min(3).describe('Nguyên nhân lỗi (ví dụ: Nứt men, rạn xương gốm, méo form do nhiệt...)'),
  severity: z.enum(['WARNING', 'CRITICAL']).default('CRITICAL'),
});

export type ReportQcIncidentRequest = z.infer<typeof ReportQcIncidentSchema>;

// Update Batch API Request Schema
export const UpdateBatchRequestSchema = z.object({
  product_name: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  deadline_days: z.number().int().positive().nullable().optional(),
  technical_specs: TechnicalSpecsSchema.optional(),
});

export type UpdateBatchRequest = z.infer<typeof UpdateBatchRequestSchema>;

