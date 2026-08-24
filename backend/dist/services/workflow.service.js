"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowService = exports.WorkflowService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const batchSchema_1 = require("../schemas/batchSchema");
const telegram_service_1 = require("./telegram.service");
class WorkflowService {
    /**
     * Tạo một mã mẻ sản xuất tự động duy nhất (ví dụ: GOM-88, GOM-102)
     */
    async generateBatchCode() {
        const count = await prisma_1.default.batch.count();
        const randomSuffix = Math.floor(10 + Math.random() * 90);
        return `GOM-${(count + 1) * 10 + randomSuffix}`;
    }
    /**
     * Khởi tạo mẻ sản xuất mới kèm theo chuỗi 6 công đoạn liên hoàn
     */
    async createBatch(payload) {
        const batchCode = payload.batch_code || (await this.generateBatchCode());
        // 1. Tạo Batch trong Transaction
        const batch = await prisma_1.default.$transaction(async (tx) => {
            const createdBatch = await tx.batch.create({
                data: {
                    batchCode,
                    rawDescription: payload.raw_description,
                    productName: payload.product_name,
                    quantity: payload.quantity,
                    priority: payload.priority,
                    deadlineDays: payload.deadline_days || null,
                    overallStatus: 'IN_PROGRESS',
                    currentStage: batchSchema_1.STAGES[0], // 'TAO_HINH_MOC'
                    technicalSpecs: JSON.stringify(payload.technical_specs),
                },
            });
            // 2. Tạo trước 6 trạm công đoạn
            for (let i = 0; i < batchSchema_1.STAGES.length; i++) {
                const stageName = batchSchema_1.STAGES[i];
                await tx.batchStageLog.create({
                    data: {
                        batchId: createdBatch.id,
                        stageName,
                        status: i === 0 ? 'IN_PROGRESS' : 'PENDING',
                        startedAt: i === 0 ? new Date() : null,
                    },
                });
            }
            return createdBatch;
        });
        // 3. Bắn thông báo Telegram
        await telegram_service_1.telegramService.notifyBatchCreated({
            batchCode: batch.batchCode,
            productName: batch.productName,
            quantity: batch.quantity,
            priority: batch.priority,
            deadlineDays: batch.deadlineDays,
            technicalSpecs: payload.technical_specs,
        });
        return this.getBatchById(batch.id);
    }
    /**
     * Lấy chi tiết mẻ gốm kèm các trạm và lịch sử sự cố
     */
    async getBatchById(id) {
        const batch = await prisma_1.default.batch.findUnique({
            where: { id },
            include: {
                stages: {
                    orderBy: { startedAt: 'asc' },
                },
                incidents: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!batch)
            return null;
        return {
            ...batch,
            technicalSpecs: JSON.parse(batch.technicalSpecs || '{}'),
        };
    }
    /**
     * Cập nhật thông tin mẻ gốm (Độ ưu tiên, Tên, Số lượng, Thông số kỹ thuật)
     */
    async updateBatch(id, payload) {
        const existing = await prisma_1.default.batch.findUnique({ where: { id } });
        if (!existing) {
            throw new Error('Không tìm thấy mẻ gốm cần cập nhật.');
        }
        const dataToUpdate = {};
        if (payload.product_name !== undefined)
            dataToUpdate.productName = payload.product_name;
        if (payload.quantity !== undefined)
            dataToUpdate.quantity = payload.quantity;
        if (payload.priority !== undefined)
            dataToUpdate.priority = payload.priority;
        if (payload.deadline_days !== undefined)
            dataToUpdate.deadlineDays = payload.deadline_days;
        if (payload.technical_specs !== undefined) {
            dataToUpdate.technicalSpecs = JSON.stringify(payload.technical_specs);
        }
        await prisma_1.default.batch.update({
            where: { id },
            data: dataToUpdate,
        });
        // Ghi log sự kiện cập nhật
        await prisma_1.default.systemEventLog.create({
            data: {
                eventType: 'BATCH_UPDATED',
                title: `Cập nhật mẻ #${existing.batchCode}`,
                message: `Quản đốc đã điều chỉnh thông số & độ ưu tiên mẻ [${existing.batchCode}]: ${payload.priority ? `Ưu tiên -> ${payload.priority}` : ''}`,
                metadata: JSON.stringify({ batchId: id, batchCode: existing.batchCode, updates: payload }),
            },
        });
        return this.getBatchById(id);
    }
    /**
     * Cập nhật lại thứ tự ưu tiên kéo thả (Drag & Drop Manual Reorder)
     */
    async reorderBatches(orderedIds) {
        await prisma_1.default.$transaction(async (tx) => {
            for (let i = 0; i < orderedIds.length; i++) {
                const id = orderedIds[i];
                const batch = await tx.batch.findUnique({ where: { id } });
                if (batch) {
                    const specs = JSON.parse(batch.technicalSpecs || '{}');
                    specs.custom_rank = i + 1;
                    await tx.batch.update({
                        where: { id },
                        data: { technicalSpecs: JSON.stringify(specs) },
                    });
                }
            }
        });
        return this.getAllBatches();
    }
    /**
     * Lấy danh sách tất cả các mẻ gốm (Sắp xếp theo thứ tự ưu tiên: URGENT -> HIGH -> MEDIUM -> LOW, custom_rank, EDD, FIFO)
     */
    async getAllBatches() {
        const batches = await prisma_1.default.batch.findMany({
            include: {
                stages: true,
                incidents: true,
            },
        });
        const PRIORITY_ORDER = {
            URGENT: 1,
            HIGH: 2,
            MEDIUM: 3,
            LOW: 4,
        };
        // Thuật toán điều phối đa tầng (Multi-tier Workshop Scheduling Engine):
        // Tầng 1: Cấp độ ưu tiên (URGENT > HIGH > MEDIUM > LOW)
        // Tầng 2: Thứ tự kéo thả thủ công của Quản đốc (custom_rank)
        // Tầng 3 (Tie-breaker 1): Hạn giao hàng sớm hơn (Earliest Due Date - EDD: deadlineDays ít ngày hơn)
        // Tầng 4 (Tie-breaker 2): Thời điểm vào xưởng (FIFO: First-In-First-Out, createdAt cũ hơn làm trước)
        const sortedBatches = batches.sort((a, b) => {
            // 1. So sánh cấp độ ưu tiên
            const priorityA = PRIORITY_ORDER[a.priority] || 99;
            const priorityB = PRIORITY_ORDER[b.priority] || 99;
            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            // 2. Thứ tự kéo thả thủ công (custom_rank)
            const specsA = JSON.parse(a.technicalSpecs || '{}');
            const specsB = JSON.parse(b.technicalSpecs || '{}');
            const rankA = typeof specsA.custom_rank === 'number' ? specsA.custom_rank : null;
            const rankB = typeof specsB.custom_rank === 'number' ? specsB.custom_rank : null;
            if (rankA !== null && rankB !== null && rankA !== rankB) {
                return rankA - rankB;
            }
            else if (rankA !== null && rankB === null) {
                return -1;
            }
            else if (rankA === null && rankB !== null) {
                return 1;
            }
            // 3. Đồng cấp ưu tiên & chưa kéo thả -> So sánh Thời hạn giao hàng (EDD rule)
            const deadlineA = a.deadlineDays !== null && a.deadlineDays !== undefined ? a.deadlineDays : 9999;
            const deadlineB = b.deadlineDays !== null && b.deadlineDays !== undefined ? b.deadlineDays : 9999;
            if (deadlineA !== deadlineB) {
                return deadlineA - deadlineB;
            }
            // 4. Cùng thời hạn -> Áp dụng FIFO (Mẻ nào tạo trước/chờ lâu hơn thì làm trước)
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        return sortedBatches.map((b) => ({
            ...b,
            technicalSpecs: JSON.parse(b.technicalSpecs || '{}'),
        }));
    }
    /**
     * Chuyển công đoạn sang trạm kế tiếp (Workflow State Machine)
     */
    async advanceStage(batchId) {
        const batch = await prisma_1.default.batch.findUnique({
            where: { id: batchId },
            include: { stages: true },
        });
        if (!batch) {
            throw new Error('Không tìm thấy mẻ sản xuất.');
        }
        if (batch.overallStatus === 'COMPLETED') {
            throw new Error('Mẻ sản xuất này đã hoàn thành toàn bộ quy trình.');
        }
        const currentStageIndex = batchSchema_1.STAGES.indexOf(batch.currentStage);
        if (currentStageIndex === -1) {
            throw new Error('Công đoạn hiện tại không hợp lệ.');
        }
        const currentStageName = batchSchema_1.STAGES[currentStageIndex];
        const isLastStage = currentStageIndex === batchSchema_1.STAGES.length - 1;
        const nextStageName = isLastStage ? currentStageName : batchSchema_1.STAGES[currentStageIndex + 1];
        await prisma_1.default.$transaction(async (tx) => {
            // 1. Đánh dấu hoàn thành trạm hiện tại
            await tx.batchStageLog.updateMany({
                where: {
                    batchId,
                    stageName: currentStageName,
                },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
            });
            if (!isLastStage) {
                // 2. Kích hoạt trạm kế tiếp
                await tx.batchStageLog.updateMany({
                    where: {
                        batchId,
                        stageName: nextStageName,
                    },
                    data: {
                        status: 'IN_PROGRESS',
                        startedAt: new Date(),
                    },
                });
                // Cập nhật Batch
                await tx.batch.update({
                    where: { id: batchId },
                    data: {
                        currentStage: nextStageName,
                    },
                });
            }
            else {
                // Hoàn thành mẻ gốm
                await tx.batch.update({
                    where: { id: batchId },
                    data: {
                        overallStatus: 'COMPLETED',
                    },
                });
            }
        });
        // Bắn thông báo Telegram
        await telegram_service_1.telegramService.notifyStageAdvanced({
            batchCode: batch.batchCode,
            productName: batch.productName,
            fromStage: currentStageName,
            toStage: nextStageName,
            isCompleted: isLastStage,
            technicalSpecs: batch.technicalSpecs,
        });
        return this.getBatchById(batchId);
    }
    /**
     * Báo cáo sự cố kiểm định QC hoặc lỗi hỏng ở bất kỳ trạm nào
     */
    async reportIncident(batchId, payload) {
        const batch = await prisma_1.default.batch.findUnique({
            where: { id: batchId },
        });
        if (!batch) {
            throw new Error('Không tìm thấy mẻ sản xuất.');
        }
        const incident = await prisma_1.default.incidentReport.create({
            data: {
                batchId,
                stageName: batch.currentStage,
                defectCount: payload.defect_count,
                reason: payload.reason,
                severity: payload.severity,
            },
        });
        // Bắn thông báo khẩn cấp Telegram
        await telegram_service_1.telegramService.notifyQcIncident({
            batchCode: batch.batchCode,
            productName: batch.productName,
            stageName: batch.currentStage,
            defectCount: payload.defect_count,
            reason: payload.reason,
            severity: payload.severity,
        });
        return incident;
    }
    /**
     * Lấy thống kê tổng quan và system event logs
     */
    async getSystemDashboardData() {
        const totalBatches = await prisma_1.default.batch.count();
        const inProgressBatches = await prisma_1.default.batch.count({ where: { overallStatus: 'IN_PROGRESS' } });
        const completedBatches = await prisma_1.default.batch.count({ where: { overallStatus: 'COMPLETED' } });
        const totalIncidents = await prisma_1.default.incidentReport.count();
        const recentLogs = await prisma_1.default.systemEventLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        return {
            stats: {
                totalBatches,
                inProgressBatches,
                completedBatches,
                totalIncidents,
            },
            recentLogs: recentLogs.map((log) => ({
                ...log,
                metadata: log.metadata ? JSON.parse(log.metadata) : null,
            })),
        };
    }
}
exports.WorkflowService = WorkflowService;
exports.workflowService = new WorkflowService();
