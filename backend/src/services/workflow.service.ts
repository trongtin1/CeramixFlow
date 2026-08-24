import prisma from '../config/prisma';
import { STAGES, StageNameType, CreateBatchRequest, ReportQcIncidentRequest } from '../schemas/batchSchema';
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

    // 3. Bắn thông báo Telegram
    await telegramService.notifyBatchCreated({
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
   * Lấy danh sách tất cả các mẻ gốm
   */
  async getAllBatches() {
    const batches = await prisma.batch.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        stages: true,
        incidents: true,
      },
    });

    return batches.map((b) => ({
      ...b,
      technicalSpecs: JSON.parse(b.technicalSpecs || '{}'),
    }));
  }

  /**
   * Chuyển công đoạn sang trạm kế tiếp (Workflow State Machine)
   */
  async advanceStage(batchId: string) {
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { stages: true },
    });

    if (!batch) {
      throw new Error('Không tìm thấy mẻ sản xuất.');
    }

    if (batch.overallStatus === 'COMPLETED') {
      throw new Error('Mẻ sản xuất này đã hoàn thành toàn bộ quy trình.');
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

    // Bắn thông báo Telegram
    await telegramService.notifyStageAdvanced({
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

    // Bắn thông báo khẩn cấp Telegram
    await telegramService.notifyQcIncident({
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
