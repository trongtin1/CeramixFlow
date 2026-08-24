import prisma from '../config/prisma';
import { STAGES, STAGE_DISPLAY_NAMES, StageNameType, CreateBatchRequest, ReportQcIncidentRequest } from '../schemas/batchSchema';
import { telegramService } from './telegram.service';

export class WorkflowService {
  /**
   * Tạo một mã mẻ sản xuất tự động duy nhất (ví dụ: GOM-88, GOM-102)
   */
  private async generateBatchCode(): Promise<string> {
    const count = await prisma.batch.count();
    const randomSuffix = Math.floor(10 + Math.random() * 90);
    return `GOM-${(count + 1) * 10 + randomSuffix}`;
  }

  /**
   * Khởi tạo mẻ sản xuất mới kèm theo chuỗi 6 công đoạn liên hoàn
   */
  async createBatch(payload: CreateBatchRequest) {
    const batchCode = payload.batch_code || (await this.generateBatchCode());

    // 1. Tạo Batch trong Transaction
    const batch = await prisma.$transaction(async (tx) => {
      const createdBatch = await tx.batch.create({
        data: {
          batchCode,
          rawDescription: payload.raw_description,
          productName: payload.product_name,
          quantity: payload.quantity,
          priority: payload.priority,
          deadlineDays: payload.deadline_days || null,
          overallStatus: 'IN_PROGRESS',
          currentStage: STAGES[0], // 'TAO_HINH_MOC'
          technicalSpecs: JSON.stringify(payload.technical_specs),
        },
      });

      // 2. Tạo trước 6 trạm công đoạn
      for (let i = 0; i < STAGES.length; i++) {
        const stageName = STAGES[i];
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

    // 3. Bắn thông báo Telegram bất đồng bộ (Non-blocking, phản hồi 0ms)
    telegramService.notifyBatchCreated({
      id: batch.id,
      batchCode: batch.batchCode,
      productName: batch.productName,
      quantity: batch.quantity,
      priority: batch.priority,
      deadlineDays: batch.deadlineDays,
      technicalSpecs: payload.technical_specs,
    }).catch((e) => console.error('[Telegram BG Error]:', e.message));

    return this.getBatchById(batch.id);
  }

  /**
   * Lấy chi tiết mẻ gốm kèm các trạm và lịch sử sự cố
   */
  async getBatchById(id: string) {
    const batch = await prisma.batch.findUnique({
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

    if (!batch) return null;

    return {
      ...batch,
      technicalSpecs: JSON.parse(batch.technicalSpecs || '{}'),
    };
  }

  /**
   * Cập nhật thông tin mẻ gốm (Độ ưu tiên, Tên, Số lượng, Thông số kỹ thuật)
   */
  async updateBatch(id: string, payload: {
    product_name?: string;
    quantity?: number;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    deadline_days?: number | null;
    technical_specs?: any;
  }) {
    const existing = await prisma.batch.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Không tìm thấy mẻ gốm cần cập nhật.');
    }

    const dataToUpdate: any = {};
    if (payload.product_name !== undefined) dataToUpdate.productName = payload.product_name;
    if (payload.quantity !== undefined) dataToUpdate.quantity = payload.quantity;
    if (payload.priority !== undefined) dataToUpdate.priority = payload.priority;
    if (payload.deadline_days !== undefined) dataToUpdate.deadlineDays = payload.deadline_days;
    if (payload.technical_specs !== undefined) {
      dataToUpdate.technicalSpecs = JSON.stringify(payload.technical_specs);
    }

    await prisma.batch.update({
      where: { id },
      data: dataToUpdate,
    });

    // Ghi log sự kiện cập nhật
    await prisma.systemEventLog.create({
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
  async reorderBatches(orderedIds: string[]) {
    await prisma.$transaction(async (tx) => {
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
    const batches = await prisma.batch.findMany({
      include: {
        stages: true,
        incidents: true,
      },
    });

    // Thuật toán sắp xếp thứ tự mẻ sản xuất:
    // 1. Thứ tự kéo thả thủ công của Quản đốc (custom_rank)
    // 2. Thời điểm vào xưởng (FIFO: First-In-First-Out, createdAt cũ hơn làm trước)
    const sortedBatches = batches.sort((a, b) => {
      // 1. Thứ tự kéo thả thủ công (custom_rank)
      const specsA = JSON.parse(a.technicalSpecs || '{}');
      const specsB = JSON.parse(b.technicalSpecs || '{}');
      const rankA = typeof specsA.custom_rank === 'number' ? specsA.custom_rank : null;
      const rankB = typeof specsB.custom_rank === 'number' ? specsB.custom_rank : null;
      if (rankA !== null && rankB !== null && rankA !== rankB) {
        return rankA - rankB;
      } else if (rankA !== null && rankB === null) {
        return -1;
      } else if (rankA === null && rankB !== null) {
        return 1;
      }

      // 2. Áp dụng FIFO
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return sortedBatches.map((b) => ({
      ...b,
      technicalSpecs: JSON.parse(b.technicalSpecs || '{}'),
    }));
  }

  /**
   * Chuyển công đoạn sang trạm kế tiếp (Workflow State Machine)
   * Hỗ trợ expectedStage để kiểm soát xung đột đồng bộ giữa Web và Telegram
   */
  async advanceStage(batchId: string, expectedStage?: string) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { stages: true },
    });

    if (!batch) {
      throw new Error('Không tìm thấy mẻ sản xuất.');
    }

    if (batch.overallStatus === 'COMPLETED') {
      throw new Error(`Mẻ #${batch.batchCode} đã hoàn thành toàn bộ 6 công đoạn xuất xưởng.`);
    }

    // Kiểm tra xung đột nếu thao tác từ nút bấm cũ
    if (expectedStage && batch.currentStage !== expectedStage) {
      const currentDisplayName = STAGE_DISPLAY_NAMES[batch.currentStage as StageNameType] || batch.currentStage;
      throw new Error(`Mẻ #${batch.batchCode} hiện đã chuyển sang "${currentDisplayName}" trước đó rồi.`);
    }

    const currentStageIndex = STAGES.indexOf(batch.currentStage as StageNameType);
    if (currentStageIndex === -1) {
      throw new Error('Công đoạn hiện tại không hợp lệ.');
    }

    const currentStageName = STAGES[currentStageIndex];
    const isLastStage = currentStageIndex === STAGES.length - 1;
    const nextStageName = isLastStage ? currentStageName : STAGES[currentStageIndex + 1];

    await prisma.$transaction(async (tx) => {
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
      } else {
        // Hoàn thành mẻ gốm
        await tx.batch.update({
          where: { id: batchId },
          data: {
            overallStatus: 'COMPLETED',
          },
        });
      }
    });

    // Bắn thông báo Telegram bất đồng bộ ngầm (Non-blocking, phản hồi tức thì < 15ms)
    telegramService.notifyStageAdvanced({
      id: batchId,
      batchCode: batch.batchCode,
      productName: batch.productName,
      fromStage: currentStageName,
      toStage: nextStageName,
      isCompleted: isLastStage,
      technicalSpecs: batch.technicalSpecs,
    }).catch((e) => console.error('[Telegram BG Error]:', e.message));

    return this.getBatchById(batchId);
  }

  /**
   * Chuyển lùi công đoạn để sửa chữa / tái chế phôi mộc (Rework & Rollback Workflow)
   */
  async rollbackStage(batchId: string, payload: { target_stage: string; reason: string }) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { stages: true },
    });

    if (!batch) {
      throw new Error('Không tìm thấy mẻ sản xuất.');
    }

    if (batch.overallStatus === 'COMPLETED') {
      throw new Error('Mẻ sản xuất đã hoàn thành xuất xưởng, không thể chuyển lùi.');
    }

    const currentStageIndex = STAGES.indexOf(batch.currentStage as StageNameType);
    const targetStageIndex = STAGES.indexOf(payload.target_stage as StageNameType);

    if (targetStageIndex === -1 || targetStageIndex >= currentStageIndex) {
      throw new Error('Công đoạn đích phải là một công đoạn trước công đoạn hiện tại.');
    }

    const currentStageName = STAGES[currentStageIndex];
    const targetStageName = STAGES[targetStageIndex];

    await prisma.$transaction(async (tx) => {
      // 1. Kích hoạt lại stage đích: Chuyển sang IN_PROGRESS
      await tx.batchStageLog.updateMany({
        where: {
          batchId,
          stageName: targetStageName,
        },
        data: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          completedAt: null,
          notes: `[Tiếp nhận sửa chữa từ ${STAGE_DISPLAY_NAMES[currentStageName] || currentStageName}]: ${payload.reason}`,
        },
      });

      // 2. Reset tất cả các stage từ targetStageIndex + 1 trở đi về PENDING
      const downstreamStages = STAGES.slice(targetStageIndex + 1);
      for (const stg of downstreamStages) {
        await tx.batchStageLog.updateMany({
          where: {
            batchId,
            stageName: stg,
          },
          data: {
            status: 'PENDING',
            completedAt: null,
            notes: stg === currentStageName ? `[Tái chế] Trả về trạm [${STAGE_DISPLAY_NAMES[targetStageName] || targetStageName}]. Lý do: ${payload.reason}` : null,
          },
        });
      }

      // 3. Cập nhật trạng thái Batch
      await tx.batch.update({
        where: { id: batchId },
        data: {
          currentStage: targetStageName,
          overallStatus: 'IN_PROGRESS',
        },
      });
    });

    // 4. Bắn thông báo Telegram bất đồng bộ (Non-blocking)
    telegramService.notifyStageRollback({
      id: batchId,
      batchCode: batch.batchCode,
      productName: batch.productName,
      fromStage: currentStageName,
      toStage: targetStageName,
      reason: payload.reason,
    }).catch((e) => console.error('[Telegram Rollback BG Error]:', e.message));

    return this.getBatchById(batchId);
  }

  /**
   * Báo cáo sự cố kiểm định QC hoặc lỗi hỏng ở bất kỳ trạm nào
   */
  async reportIncident(batchId: string, payload: ReportQcIncidentRequest) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error('Không tìm thấy mẻ sản xuất.');
    }

    const incident = await prisma.incidentReport.create({
      data: {
        batchId,
        stageName: batch.currentStage,
        defectCount: payload.defect_count,
        reason: payload.reason,
        severity: payload.severity,
      },
    });

    // Bắn thông báo khẩn cấp Telegram bất đồng bộ (Non-blocking)
    telegramService.notifyQcIncident({
      batchCode: batch.batchCode,
      productName: batch.productName,
      stageName: batch.currentStage,
      defectCount: payload.defect_count,
      reason: payload.reason,
      severity: payload.severity,
    }).catch((e) => console.error('[Telegram BG Error]:', e.message));

    return incident;
  }

  /**
   * Lấy thống kê tổng quan và system event logs
   */
  async getSystemDashboardData() {
    const totalBatches = await prisma.batch.count();
    const inProgressBatches = await prisma.batch.count({ where: { overallStatus: 'IN_PROGRESS' } });
    const completedBatches = await prisma.batch.count({ where: { overallStatus: 'COMPLETED' } });
    const totalIncidents = await prisma.incidentReport.count();

    const recentLogs = await prisma.systemEventLog.findMany({
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

export const workflowService = new WorkflowService();
