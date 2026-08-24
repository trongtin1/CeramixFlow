# 📡 CeramixFlow API Specifications

Base URL: `http://localhost:5000/api`

---

## 1. AI Order Parsing API
- **Endpoint:** `POST /api/orders/parse-ai`
- **Description:** Nhận mô tả tự nhiên tiếng Việt, bóc tách và ước tính thông số kỹ thuật.
- **Request Body:**
```json
{
  "text": "Đơn 200 Bình gốm họa tiết sen men lam cao 35cm, yêu cầu nung nhiệt độ cao 1280°C, hoàn thành trong 10 ngày"
}
```
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "product_name": "Bình gốm họa tiết sen men lam",
    "quantity": 200,
    "deadline_days": 10,
    "priority": "HIGH",
    "technical_specs": {
      "dimensions": { "height_cm": 35, "diameter_cm": 21 },
      "estimated_clay_kg": 345,
      "glaze_type": "Men lam Bát Tràng truyền thống",
      "firing_specs": {
        "target_temperature_c": 1280,
        "estimated_duration_hours": 14,
        "firing_curve": "Nung khử khí gas tuần hoàn"
      },
      "craft_technique": "Vuốt tay bàn xoay",
      "artwork_details": "Vẽ hoa sen thủy mặc xanh coban",
      "additional_notes": ["Đã tính kèm 15% hao hụt"]
    },
    "ai_reasoning": "Bóc tách thành công 200 sản phẩm với nhiệt độ nung 1280°C..."
  }
}
```

---

## 2. Batches Management API
- **`GET /api/batches`**: Lấy danh sách tất cả các mẻ kèm 6 công đoạn và lịch sử sự cố.
- **`POST /api/batches`**: Khởi tạo mẻ sản xuất mới và tự động sinh 6 công đoạn.
- **`PATCH /api/batches/:id/advance`**: Chuyển công đoạn sang trạm tiếp theo (kích hoạt Telegram).
- **`POST /api/batches/:id/incidents`**: Ghi nhận sự cố QC và phát cảnh báo đỏ.

---

## 3. System & Logs API
- **`GET /api/system/dashboard`**: Lấy thống kê số lượng mẻ, sự cố QC và 20 logs sự kiện gần nhất.
- **`POST /api/system/reset-demo`**: Reset dữ liệu về trạng thái ban đầu.
