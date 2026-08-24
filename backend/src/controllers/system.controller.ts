import { Request, Response } from 'express';
import { workflowService } from '../services/workflow.service';
import prisma from '../config/prisma';

export class SystemController {
  /**
   * API: GET /api/system/dashboard
   * Thống kê tổng quan & live Telegram logs
   */
  static async getDashboardData(req: Request, res: Response) {
    try {
      const data = await workflowService.getSystemDashboardData();
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (err: any) {
      console.error('[SystemController] Error fetching dashboard data:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * API: POST /api/system/reset-demo
   * Reset lại dữ liệu demo để dễ dàng trình diễn
   */
  static async resetDemoData(req: Request, res: Response) {
    try {
      await prisma.incidentReport.deleteMany({});
      await prisma.batchStageLog.deleteMany({});
      await prisma.batch.deleteMany({});
      await prisma.systemEventLog.deleteMany({});

      return res.status(200).json({
        success: true,
        message: 'Đã làm sạch dữ liệu để bắt đầu phiên kiểm thử mới!',
      });
    } catch (err: any) {
      console.error('[SystemController] Error resetting demo data:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
