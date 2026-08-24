"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderController = void 0;
const ai_service_1 = require("../services/ai.service");
const batchSchema_1 = require("../schemas/batchSchema");
const workflow_service_1 = require("../services/workflow.service");
class OrderController {
    /**
     * API: POST /api/orders/parse-ai
     * Bóc tách thông tin từ văn bản tự nhiên
     */
    static async parseOrderWithAi(req, res) {
        try {
            const { text } = req.body;
            if (!text || typeof text !== 'string') {
                return res.status(400).json({ success: false, message: 'Vui lòng cung cấp chuỗi văn bản mô tả đơn hàng.' });
            }
            const extractedData = await ai_service_1.aiService.extractOrderSpecs(text);
            return res.status(200).json({
                success: true,
                data: extractedData,
                message: 'Bóc tách thông tin đơn hàng thành công!',
            });
        }
        catch (err) {
            console.error('[OrderController] Error parsing order:', err);
            return res.status(500).json({
                success: false,
                message: err.message || 'Lỗi xử lý bóc tách AI.',
            });
        }
    }
    /**
     * API: POST /api/batches
     * Khởi tạo mẻ sản xuất mới
     */
    static async createBatch(req, res) {
        try {
            const validationResult = batchSchema_1.CreateBatchRequestSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({
                    success: false,
                    errors: validationResult.error.flatten(),
                    message: 'Dữ liệu khởi tạo mẻ gốm không hợp lệ.',
                });
            }
            const batch = await workflow_service_1.workflowService.createBatch(validationResult.data);
            return res.status(201).json({
                success: true,
                data: batch,
                message: `Đã khởi tạo thành công mẻ sản xuất #${batch?.batchCode}!`,
            });
        }
        catch (err) {
            console.error('[OrderController] Error creating batch:', err);
            return res.status(500).json({
                success: false,
                message: err.message || 'Lỗi khởi tạo mẻ gốm.',
            });
        }
    }
    /**
     * API: GET /api/batches
     * Lấy toàn bộ danh sách mẻ sản xuất
     */
    static async getAllBatches(req, res) {
        try {
            const batches = await workflow_service_1.workflowService.getAllBatches();
            return res.status(200).json({
                success: true,
                data: batches,
            });
        }
        catch (err) {
            console.error('[OrderController] Error fetching batches:', err);
            return res.status(500).json({
                success: false,
                message: err.message || 'Lỗi tải danh sách mẻ gốm.',
            });
        }
    }
    /**
     * API: GET /api/batches/:id
     */
    static async getBatchById(req, res) {
        try {
            const { id } = req.params;
            const batch = await workflow_service_1.workflowService.getBatchById(id);
            if (!batch) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy mẻ gốm.' });
            }
            return res.status(200).json({ success: true, data: batch });
        }
        catch (err) {
            console.error('[OrderController] Error fetching batch by id:', err);
            return res.status(500).json({ success: false, message: err.message });
        }
    }
}
exports.OrderController = OrderController;
