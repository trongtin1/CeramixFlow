# 📡 CeramixFlow API Specifications

Base URL: `http://localhost:5000/api`

---

## 1. AI Order Parsing & Interactive RAG Chat API

### 1.1 Bóc Tách Đơn Hàng 1-Click
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
      "estimated_clay_kg": 160,
      "glaze_type": "Men lam Bát Tràng truyền thống",
      "firing_specs": {
        "target_temperature_c": 1280,
        "estimated_duration_hours": 14,
        "firing_curve": "Nung khử khí gas tuần hoàn"
      },
      "craft_technique": "Vuốt tay bàn xoay & tiện mộc",
      "artwork_details": "Vẽ hoa sen liên hoa thủy mặc xanh coban",
      "custom_attributes": {
        "Tỷ lệ co ngót nhiệt": "12.5%"
      }
    },
    "ai_reasoning": "Bóc tách thành công 200 sản phẩm với nhiệt độ nung 1280°C..."
  }
}
```

### 1.2 Hội Thoại Đa Bước RAG Copilot (Tư Vấn & Hỏi Thêm Thông Số)
- **Endpoint:** `POST /api/chat/assistant`
- **Description:** Hội thoại tương tác 2 tầng, tự động phát hiện thông số thiếu và hỏi sâu về thông số kỹ thuật chuyên ngành gốm.
- **Request Body:**
```json
{
  "messages": [
    { "role": "user", "content": "Tôi muốn làm 150 bình hút tài lộc phong thủy" }
  ]
}
```
- **Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "reply": "Chào Quản đốc! Để xưởng có thể tính toán chính xác công thức đất sét và nhiệt độ lò, bạn vui lòng cho tôi biết thêm: 1. Chiều cao dự kiến bao nhiêu cm? 2. Bạn muốn phủ men lam, men ngọc Celadon hay men rạn? 3. Thời hạn giao hàng là bao nhiêu ngày?",
    "is_complete": false,
    "missing_fields": [
      "Chiều cao / Kích thước (cm)",
      "Loại men gốm mong muốn",
      "Thời hạn hoàn thành (ngày)"
    ],
    "suggested_options": [
      "Chiều cao 35cm",
      "Men ngọc Celadon",
      "Hoàn thành trong 7 ngày"
    ],
    "extracted_specs": null
  }
}
```

---

## 2. Batches Management & Workflow API

### 2.1 Lấy Danh Sách Mẻ Gốm
- **Endpoint:** `GET /api/batches`
- **Response:** Danh sách các mẻ kèm 6 công đoạn và lịch sử sự cố QC.

### 2.2 Khởi Tạo Mẻ Sản Xuất Mới
- **Endpoint:** `POST /api/batches`
- **Request Body:**
```json
{
  "raw_description": "Đơn 200 bình sen men lam cao 35cm nung 1280C trong 10 ngày",
  "product_name": "Bình gốm họa tiết sen men lam",
  "quantity": 200,
  "priority": "HIGH",
  "deadline_days": 10,
  "technical_specs": {
    "estimated_clay_kg": 160,
    "glaze_type": "Men lam Bát Tràng",
    "firing_specs": { "target_temperature_c": 1280, "estimated_duration_hours": 14 },
    "custom_attributes": {
      "Tỷ lệ co ngót nhiệt": "12.5%",
      "Kỹ thuật viền miệng": "Bọc đồng thủ công"
    }
  }
}
```

### 2.3 Cập Nhật Thông Số & Đổi Độ Ưu Tiên
- **Endpoint:** `PUT /api/batches/:id`
- **Request Body:** `{ product_name, quantity, priority, deadline_days, technical_specs }`

### 2.4 Hoán Đổi Thứ Tự Ưu Tiên Thủ Công (Kéo Thả)
- **Endpoint:** `POST /api/batches/reorder`
- **Request Body:** `{ ordered_ids: ["batch-id-1", "batch-id-2", "batch-id-3"] }`

### 2.5 Chuyển Công Đoạn Sản Xuất
- **Endpoint:** `PATCH /api/batches/:id/advance`
- **Description:** Chuyển mẻ gốm sang trạm kế tiếp theo thứ tự 6 công đoạn State Machine và tự động bắn thông báo Telegram.

### 2.6 Báo Cáo Sự Cố QC & Cảnh Báo Đỏ
- **Endpoint:** `POST /api/batches/:id/incidents`
- **Request Body:**
```json
{
  "defect_count": 5,
  "reason": "Phát hiện 5 sản phẩm bị nứt men và cong vênh miệng lò",
  "severity": "CRITICAL"
}
```

---

## 3. System & Live Logs API

- **`GET /api/system/dashboard`**: Lấy thống kê tổng số mẻ, mẻ đang chạy, sự cố QC và danh sách logs sự kiện gần nhất.
- **`POST /api/system/reset-demo`**: Nạp lại 9 mẻ gốm mẫu ban đầu phục vụ kiểm thử.
