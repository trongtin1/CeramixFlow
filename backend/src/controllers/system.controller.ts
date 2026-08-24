import { Request, Response } from 'express';
import { workflowService } from '../services/workflow.service';
import prisma from '../config/prisma';
import { seedDatabase } from '../services/seed.service';

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
   * Reset lại dữ liệu demo & nạp 9 mẻ gốm mẫu đa dạng độ ưu tiên
   */
  static async resetDemoData(req: Request, res: Response) {
    try {
      await seedDatabase();

      return res.status(200).json({
        success: true,
        message: 'Đã nạp thành công 9 mẻ gốm mẫu đa dạng độ ưu tiên & thời hạn!',
      });
    } catch (err: any) {
      console.error('[SystemController] Error resetting demo data:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}
