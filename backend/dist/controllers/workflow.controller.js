"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const workflow_service_1 = require("../services/workflow.service");
const batchSchema_1 = require("../schemas/batchSchema");
class WorkflowController {
    /**
     * API: PATCH /api/batches/:id/advance
     * Chuyển công đoạn mẻ gốm sang trạm tiếp theo
     */
    static async advanceStage(req, res) {
        try {
            const { id } = req.params;
            const updatedBatch = await workflow_service_1.workflowService.advanceStage(id);
            return res.status(200).json({
                success: true,
                data: updatedBatch,
                message: 'Đã chuyển công đoạn thành công!',
            });
        }
        catch (err) {
            console.error('[WorkflowController] Error advancing stage:', err);
            return res.status(400).json({
                success: false,
                message: err.message || 'Lỗi chuyển công đoạn.',
            });
        }
    }
    /**
     * API: POST /api/batches/:id/incidents
     * Báo cáo sự cố QC hoặc sản phẩm nứt vỡ
     */
    static async reportIncident(req, res) {
        try {
            const { id } = req.params;
            const validationResult = batchSchema_1.ReportQcIncidentSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    errors: validationResult.error.flatten(),
                    message: 'Dữ liệu báo cáo sự cố không hợp lệ.',
                });
            }
            const incident = await workflow_service_1.workflowService.reportIncident(id, validationResult.data);
            return res.status(201).json({
                success: true,
                data: incident,
                message: 'Đã ghi nhận sự cố và phát cảnh báo đỏ tới Telegram!',
            });
        }
        catch (err) {
            console.error('[WorkflowController] Error reporting incident:', err);
            return res.status(500).json({
                success: false,
                message: err.message || 'Lỗi ghi nhận sự cố.',
            });
        }
    }
}
exports.WorkflowController = WorkflowController;
