import prisma from '../config/prisma';
import { workflowService } from '../services/workflow.service';

async function main() {
  console.log('🌱 Seeding initial demo data for Ceramics Manufacturing Pipeline...');

  // Xóa dữ liệu cũ
  await prisma.incidentReport.deleteMany({});
  await prisma.batchStageLog.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.systemEventLog.deleteMany({});

  // 1. Mẻ gốm 1: Bình gốm sen men lam (Đang ở công đoạn Vào lò nung)
  const batch1 = await workflowService.createBatch({
    batch_code: 'GOM-88',
    raw_description: 'Đơn 200 Bình gốm họa tiết sen men lam cao 35cm, yêu cầu nung nhiệt độ cao 1280°C, hoàn thành trong 10 ngày',
    product_name: 'Bình gốm họa tiết sen men lam',
    quantity: 200,
    priority: 'HIGH',
    deadline_days: 10,
    technical_specs: {
      dimensions: { height_cm: 35, diameter_cm: 20 },
      estimated_clay_kg: 345,
      glaze_type: 'Men lam Bát Tràng truyền thống',
      firing_specs: {
        target_temperature_c: 1280,
        estimated_duration_hours: 14,
        firing_curve: 'Nung khử khí gas tuần hoàn',
      },
      craft_technique: 'Vuốt tay bàn xoay & tiện mộc',
      artwork_details: 'Vẽ tay hoa sen thủy mặc xanh coban',
      additional_notes: ['Hao hụt dự tính 15%', 'Giữ nhiệt đỉnh lò 2.5 giờ'],
    },
  });

  // Chuyển mẻ 1 qua các bước để đến trạm VAO_LO_NUNG (bước 5)
  if (batch1) {
    await workflowService.advanceStage(batch1.id); // sang PHOI_SUA_MOC
    await workflowService.advanceStage(batch1.id); // sang VE_HOA_TIET
    await workflowService.advanceStage(batch1.id); // sang TRANG_MEN
    await workflowService.advanceStage(batch1.id); // sang VAO_LO_NUNG
  }

  // 2. Mẻ gốm 2: Bộ ấm chén men rạn cổ (Đang ở công đoạn Tạo hình mộc)
  await workflowService.createBatch({
    batch_code: 'GOM-102',
    raw_description: 'Sản xuất 50 bộ ấm chén men rạn cổ bọc đồng, nhiệt độ nung 1200°C, đơn hàng xuất khẩu giao gấp 5 ngày',
    product_name: 'Bộ ấm chén men rạn cổ bọc đồng',
    quantity: 50,
    priority: 'URGENT',
    deadline_days: 5,
    technical_specs: {
      dimensions: { height_cm: 15, diameter_cm: 12 },
      estimated_clay_kg: 90,
      glaze_type: 'Men rạn cổ thời Lê',
      firing_specs: {
        target_temperature_c: 1200,
        estimated_duration_hours: 10,
        firing_curve: 'Nung oxy hóa lò điện nhiệt độ ổn định',
      },
      craft_technique: 'Đổ rót khuôn thạch cao cao cấp',
      artwork_details: 'Rạn hạt vừng đều, viền vàng đồng',
      additional_notes: ['Kiểm tra kỹ nứt viền miệng ấm'],
    },
  });

  console.log('✅ Demo data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
