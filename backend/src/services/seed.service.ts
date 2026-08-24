import prisma from '../config/prisma';

const STAGES = [
  'TAO_HINH_MOC',
  'PHOI_SUA_MOC',
  'VE_HOA_TIET',
  'TRANG_MEN',
  'VAO_LO_NUNG',
  'QC_DONG_GOI',
];

export async function seedDatabase() {
  console.log('🌱 Bắt đầu dọn dẹp & nạp dữ liệu mẫu (Seed Batches)...');

  try {
    await prisma.incidentReport.deleteMany({});
    await prisma.batchStageLog.deleteMany({});
    await prisma.batch.deleteMany({});
    await prisma.systemEventLog.deleteMany({});
  } catch (e) {
    console.warn('Lỗi khi xóa bảng, thử tiếp tục...');
  }

  const sampleBatches = [
    {
      batchCode: 'CF-801',
      productName: '200 Bình gốm họa tiết sen men lam cao 35cm (Xuất khẩu Nhật Bản)',
      rawDescription: 'Đơn gấp 200 bình gốm sen men lam cao 35cm nung nhiệt 1280C giao trong 2 ngày',
      quantity: 200,
      priority: 'URGENT' as const,
      deadlineDays: 2,
      currentStage: 'TAO_HINH_MOC',
      specs: {
        estimated_clay_kg: 160,
        glaze_type: 'Men lam cổ truyền Bát Tràng',
        firing_specs: { target_temperature_c: 1280, estimated_duration_hours: 14 },
        dimensions: { height_cm: 35 },
        craft_technique: 'Vuốt tay bàn xoay & tiện mộc thủ công',
        artwork_details: 'Họa tiết hoa sen liên hoa vẽ nét thanh',
        custom_attributes: {
          'Tỷ lệ co ngót nhiệt': '12.5%',
          'Độ ẩm phôi mộc': '16%',
          'Kỹ thuật viền miệng': 'Bọc đồng thủ công',
        },
      },
    },
    {
      batchCode: 'CF-802',
      productName: '150 Bình phong thủy men ngọc Celadon đắp nổi Thuận Buồm',
      rawDescription: '150 bình phong thủy men ngọc Celadon nung nhiệt 1260C giao trong 5 ngày',
      quantity: 150,
      priority: 'URGENT' as const,
      deadlineDays: 5,
      currentStage: 'TAO_HINH_MOC',
      specs: {
        estimated_clay_kg: 130,
        glaze_type: 'Men ngọc Celadon hỏa biến',
        firing_specs: { target_temperature_c: 1260, estimated_duration_hours: 12 },
        dimensions: { height_cm: 40 },
        craft_technique: 'Đắp nổi phù điêu thủ công',
        artwork_details: 'Họa tiết Thuận Buồm Xuôi Gió dát chỉ vàng',
        custom_attributes: {
          'Thời gian ủ men': '24 giờ',
          'Độ dày thành gốm': '5.0 mm',
        },
      },
    },
    {
      batchCode: 'CF-803',
      productName: '80 Bộ ấm chén men rạn cổ Bát Tràng bọc đồng cao cấp',
      rawDescription: '80 bộ ấm chén men rạn cổ nung 1200C hoàn thành trong 4 ngày',
      quantity: 80,
      priority: 'HIGH' as const,
      deadlineDays: 4,
      currentStage: 'TAO_HINH_MOC',
      specs: {
        estimated_clay_kg: 75,
        glaze_type: 'Men rạn tro trấu cổ',
        firing_specs: { target_temperature_c: 1200, estimated_duration_hours: 10 },
        dimensions: { height_cm: 18 },
        craft_technique: 'Ép khuôn bán tự động & gọt tỉa thủ công',
        artwork_details: 'Men rạn tam thái đánh mực tàu',
        custom_attributes: {
          'Kỹ thuật viền miệng': 'Bọc đồng hoa văn chữ Vạn',
        },
      },
    },
    {
      batchCode: 'CF-804',
      productName: '500 Ly gốm mộc tráng men tro vẽ tay quà tặng lưu niệm',
      rawDescription: '500 ly gốm mộc men tro nung 1220C thời hạn 12 ngày',
      quantity: 500,
      priority: 'MEDIUM' as const,
      deadlineDays: 12,
      currentStage: 'TAO_HINH_MOC',
      specs: {
        estimated_clay_kg: 95,
        glaze_type: 'Men tro tự nhiên mộc mạc',
        firing_specs: { target_temperature_c: 1220, estimated_duration_hours: 8 },
        dimensions: { height_cm: 12 },
        craft_technique: 'Rót phôi khuôn thạch cao',
        artwork_details: 'Vẽ phong cảnh làng quê Việt Nam',
        custom_attributes: {
          'Tỷ lệ co ngót nhiệt': '11.0%',
        },
      },
    },
    {
      batchCode: 'CF-805',
      productName: '100 Lọ hoa họa tiết chuồn trúc men rong cổ',
      rawDescription: '100 lọ hoa chuồn trúc men rong nung 1240C trong 6 ngày',
      quantity: 100,
      priority: 'HIGH' as const,
      deadlineDays: 6,
      currentStage: 'PHOI_SUA_MOC',
      specs: {
        estimated_clay_kg: 85,
        glaze_type: 'Men rong cổ truyền',
        firing_specs: { target_temperature_c: 1240, estimated_duration_hours: 11 },
        dimensions: { height_cm: 28 },
        craft_technique: 'Vuốt tay bàn xoay',
        artwork_details: 'Chuồn trúc thủy mặc',
      },
    },
    {
      batchCode: 'CF-806',
      productName: '300 Đĩa gốm hoa mai men hoàng phổ phong cách cung đình',
      rawDescription: '300 đĩa gốm hoa mai men hoàng phổ giao trong 20 ngày',
      quantity: 300,
      priority: 'LOW' as const,
      deadlineDays: 20,
      currentStage: 'PHOI_SUA_MOC',
      specs: {
        estimated_clay_kg: 110,
        glaze_type: 'Men vàng hoàng gia',
        firing_specs: { target_temperature_c: 1200, estimated_duration_hours: 9 },
        dimensions: { height_cm: 6 },
        craft_technique: 'Dập khuôn thủy lực',
        artwork_details: 'Cành mai nở mùa xuân',
      },
    },
    {
      batchCode: 'CF-807',
      productName: '90 Tượng gốm phong thủy Kim Quy men rêu hỏa biến',
      rawDescription: '90 tượng phong thủy Kim Quy men rêu nung 1270C trong 5 ngày',
      quantity: 90,
      priority: 'HIGH' as const,
      deadlineDays: 5,
      currentStage: 'TRANG_MEN',
      specs: {
        estimated_clay_kg: 105,
        glaze_type: 'Men rêu phong hỏa biến đa sắc',
        firing_specs: { target_temperature_c: 1270, estimated_duration_hours: 13 },
        dimensions: { height_cm: 25 },
        craft_technique: 'Đắp tay tạo hình nguyên khối',
        artwork_details: 'Vảy rùa đắp vân mây cổ',
        custom_attributes: {
          'Thời gian ủ men': '48 giờ',
          'Thời gian giữ nhiệt đỉnh (Soaking)': '120 phút',
        },
      },
    },
    {
      batchCode: 'CF-808',
      productName: '50 Bình hút tài lộc mạ vàng nung lò khử nhiệt đỉnh 1300°C',
      rawDescription: '50 bình tài lộc mạ vàng nung 1300C khẩn cấp 3 ngày',
      quantity: 50,
      priority: 'URGENT' as const,
      deadlineDays: 3,
      currentStage: 'VAO_LO_NUNG',
      specs: {
        estimated_clay_kg: 70,
        glaze_type: 'Men bóng hoàng gia nung khử sâu',
        firing_specs: { target_temperature_c: 1300, estimated_duration_hours: 18 },
        dimensions: { height_cm: 38 },
        craft_technique: 'Vuốt tay đơn bản kết hợp vẽ vàng 24K',
        artwork_details: 'Tứ linh Long Lân Quy Phụng vẽ vàng',
        custom_attributes: {
          'Áp suất buồng lò nung': '0.05 MPa (Áp suất dương)',
          'Thời gian giữ nhiệt đỉnh (Soaking)': '180 phút',
        },
      },
    },
    {
      batchCode: 'CF-809',
      productName: '120 Chum gốm ngâm ủ rượu men da lươn truyền thống 50L',
      rawDescription: '120 chum gốm ngâm rượu da lươn nung 1250C trong 15 ngày',
      quantity: 120,
      priority: 'MEDIUM' as const,
      deadlineDays: 15,
      currentStage: 'VAO_LO_NUNG',
      specs: {
        estimated_clay_kg: 240,
        glaze_type: 'Men da lươn truyền thống chống thấm tuyệt đối',
        firing_specs: { target_temperature_c: 1250, estimated_duration_hours: 16 },
        dimensions: { height_cm: 65 },
        craft_technique: 'Nối phôi vuốt tay kích thước lớn',
        artwork_details: 'Trơn mộc phủ men lươn óng',
        custom_attributes: {
          'Độ dày thành gốm': '12.0 mm',
        },
      },
    },
  ];

  for (const item of sampleBatches) {
    const stageIdx = STAGES.indexOf(item.currentStage);

    const existing = await prisma.batch.findUnique({ where: { batchCode: item.batchCode } });
    if (existing) {
      await prisma.batch.delete({ where: { id: existing.id } });
    }

    const batch = await prisma.batch.create({
      data: {
        batchCode: item.batchCode,
        productName: item.productName,
        rawDescription: item.rawDescription,
        quantity: item.quantity,
        priority: item.priority,
        deadlineDays: item.deadlineDays,
        currentStage: item.currentStage,
        overallStatus: 'IN_PROGRESS',
        technicalSpecs: JSON.stringify(item.specs),
        stages: {
          create: STAGES.map((stageName, i) => {
            let status: string = 'PENDING';
            let startedAt: Date | null = null;
            let completedAt: Date | null = null;

            if (i < stageIdx) {
              status = 'COMPLETED';
              startedAt = new Date(Date.now() - (stageIdx - i + 1) * 86400000);
              completedAt = new Date(Date.now() - (stageIdx - i) * 86400000);
            } else if (i === stageIdx) {
              status = 'IN_PROGRESS';
              startedAt = new Date();
            }

            return {
              stageName,
              status,
              startedAt,
              completedAt,
            };
          }),
        },
      },
    });

    await prisma.systemEventLog.create({
      data: {
        eventType: 'BATCH_CREATED',
        title: `Khởi tạo mẻ #${item.batchCode}`,
        message: `Mẻ [${item.productName}] - Độ ưu tiên: ${item.priority} - Hạn: ${item.deadlineDays} ngày`,
        metadata: JSON.stringify({ batchId: batch.id, batchCode: item.batchCode, priority: item.priority }),
      },
    });
  }

  console.log(`✅ Đã nạp thành công ${sampleBatches.length} mẻ gốm mẫu đa dạng độ ưu tiên!`);
}
