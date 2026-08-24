"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemController = void 0;
const workflow_service_1 = require("../services/workflow.service");
const seed_service_1 = require("../services/seed.service");
class SystemController {
    /**
     * API: GET /api/system/dashboard
     * Thống kê tổng quan & live Telegram logs
     */
    static async getDashboardData(req, res) {
        try {
            const data = await workflow_service_1.workflowService.getSystemDashboardData();
            return res.status(200).json({
                success: true,
                data,
            });
        }
        catch (err) {
            console.error('[SystemController] Error fetching dashboard data:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
    /**
     * API: POST /api/system/reset-demo
     * Reset lại dữ liệu demo & nạp 9 mẻ gốm mẫu đa dạng độ ưu tiên
     */
    static async resetDemoData(req, res) {
        try {
            await (0, seed_service_1.seedDatabase)();
            return res.status(200).json({
                success: true,
                message: 'Đã nạp thành công 9 mẻ gốm mẫu đa dạng độ ưu tiên & thời hạn!',
            });
        }
        catch (err) {
            console.error('[SystemController] Error resetting demo data:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
exports.SystemController = SystemController;
