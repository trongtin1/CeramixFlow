"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemController = void 0;
const workflow_service_1 = require("../services/workflow.service");
const prisma_1 = __importDefault(require("../config/prisma"));
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
     * Reset lại dữ liệu demo để dễ dàng trình diễn
     */
    static async resetDemoData(req, res) {
        try {
            await prisma_1.default.incidentReport.deleteMany({});
            await prisma_1.default.batchStageLog.deleteMany({});
            await prisma_1.default.batch.deleteMany({});
            await prisma_1.default.systemEventLog.deleteMany({});
            return res.status(200).json({
                success: true,
                message: 'Đã làm sạch dữ liệu để bắt đầu phiên kiểm thử mới!',
            });
        }
        catch (err) {
            console.error('[SystemController] Error resetting demo data:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
exports.SystemController = SystemController;
