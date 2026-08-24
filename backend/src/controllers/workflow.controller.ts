import { Request, Response } from 'express';
import { workflowService } from '../services/workflow.service';
import { ReportQcIncidentSchema } from '../schemas/batchSchema';

export class WorkflowController {
  /**
   * API: PATCH /api/batches/:id/advance
   * Chuyển công đoạn mẻ gốm sang trạm tiếp theo
   */
  static async advanceStage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updatedBatch = await workflowService.advanceStage(id);
      return res.status(200).json({
        success: true,
        data: updatedBatch,
        message: 'Đã chuyển công đoạn thành công!',
      });
    } catch (err: any) {
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
  static async reportIncident(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const validationResult = ReportQcIncidentSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          errors: validationResult.error.flatten(),
          message: 'Dữ liệu báo cáo sự cố không hợp lệ.',
        });
      }

      const incident = await workflowService.reportIncident(id, validationResult.data);
      return res.status(201).json({
        success: true,
        data: incident,
        message: 'Đã ghi nhận sự cố và phát cảnh báo đỏ tới Telegram!',
      });
    } catch (err: any) {
      console.error('[WorkflowController] Error reporting incident:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Lỗi ghi nhận sự cố.',
      });
    }
  }

  /**
   * API: PATCH /api/batches/:id/rollback
   * Chuyển lùi công đoạn để sửa chữa / tái chế mộc
   */
  static async rollbackStage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { target_stage, reason } = req.body;

      if (!target_stage || !reason || typeof reason !== 'string' || reason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp công đoạn đích và lý do chuyển lùi / sửa chữa.',
        });
      }

      const updatedBatch = await workflowService.rollbackStage(id, {
        target_stage,
        reason: reason.trim(),
      });

      return res.status(200).json({
        success: true,
        data: updatedBatch,
        message: 'Đã chuyển lùi công đoạn để sửa chữa thành công!',
      });
    } catch (err: any) {
      console.error('[WorkflowController] Error rolling back stage:', err);
      return res.status(400).json({
        success: false,
        message: err.message || 'Lỗi chuyển lùi công đoạn.',
      });
    }
  }
}
