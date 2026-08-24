# 🔑 Hướng Dẫn Toàn Tập Cấu Hình Môi Trường (.env)

Tài liệu này hướng dẫn chi tiết từng bước thiết lập và kiểm tra các biến môi trường trong file **`backend/.env`** của dự án **CeramixFlow**.

---

## 📋 1. Bảng Tổng Quan Các Biến Môi Trường

| Tên Biến | Ý Nghĩa / Mục Đích | Bắt Buộc? | Giá Trị Mặc Định / Ví Dụ |
| :--- | :--- | :---: | :--- |
| `PORT` | Cổng mạng Backend Server | Không | `5000` |
| `NODE_ENV` | Môi trường thực thi (`development` / `production`) | Không | `development` |
| `DATABASE_URL` | Kết nối PostgreSQL qua Transaction Pooler (port 6543) | **Có** | `postgresql://postgres.[REF]:[PASS]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Kết nối trực tiếp PostgreSQL Session Mode (port 5432) | **Có** | `postgresql://postgres.[REF]:[PASS]@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres` |
| `GEMINI_API_KEY` | API Key chính thức của Google Gemini | Khuyến nghị | `AIzaSy...` |
| `GEMINI_MODEL` | Tên model AI xử lý bóc tách thông tin | Không | `gemini-3.6-flash` (hoặc `gemini-2.5-flash`, `gemini-1.5-flash`) |
| `TELEGRAM_BOT_TOKEN` | Mã token xác thực Telegram Bot | Khuyến nghị | `8123456789:AAH...` |
| `TELEGRAM_CHAT_ID` | ID người nhận hoặc Group ID nhận cảnh báo | Khuyến nghị | `8570076169` (Cá nhân) hoặc `-100...` (Nhóm) |

---

## 📦 2. Cấu Hình Cơ Sở Dữ Liệu (Supabase / PostgreSQL)

### Bước 2.1: Lấy chuỗi kết nối từ Supabase
1. Truy cập: **[https://supabase.com](https://supabase.com)** và đăng nhập.
2. Tạo mới một Project (chọn khu vực gần bạn nhất, ví dụ: *Singapore - Southeast Asia* hoặc *Sydney*).
3. Vào mục **Project Settings** (biểu tượng bánh răng ở góc dưới bên trái) $\rightarrow$ Chọn tab **Database**.
4. Kéo xuống mục **Connection string**:
   - Chọn tab **URI**.
   - Tại mục **Mode**, chọn **Transaction (port 6543)** $\rightarrow$ Copy chuỗi này dán vào `DATABASE_URL`.
   - Tiếp tục đổi sang chế độ **Session (port 5432)** $\rightarrow$ Copy chuỗi này dán vào `DIRECT_URL`.
5. Thay thế `[YOUR-PASSWORD]` trong chuỗi kết nối bằng mật khẩu Database bạn đã đặt khi tạo Supabase Project:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"
```

> **💡 Tại sao cần cả `DATABASE_URL` và `DIRECT_URL`?**  
> `DATABASE_URL` (port 6543 với PgBouncer) giúp quản lý hàng nghìn kết nối đồng thời với hiệu năng cao. `DIRECT_URL` (port 5432) được Prisma ORM sử dụng để thực thi lệnh tạo bảng/migration (`prisma db push`).

### Bước 2.2: Đồng bộ Schema lên Supabase
Mở terminal tại thư mục `backend/` và chạy:
```bash
cd backend
npx prisma db push
npx ts-node prisma/seed.ts
```

---

## 🤖 3. Cấu Hình Google Gemini AI API

### Bước 3.1: Lấy API Key miễn phí
1. Truy cập trang quản lý chính thức: **[https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)**
2. Đăng nhập tài khoản Google.
3. Bấm **`Create API key`** (Tạo API key mới).
4. Copy chuỗi key nhận được (chuỗi này **bắt buộc bắt đầu bằng `AIzaSy...`**).

### Bước 3.2: Điền vào file `.env`
```env
GEMINI_API_KEY="AIzaSyB_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
GEMINI_MODEL="gemini-3.6-flash"
```

> **💡 Lưu ý về Model Name:**  
> Hệ thống hỗ trợ linh hoạt các model: `gemini-3.6-flash`, `gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-pro`. Nếu để trống, hệ thống sẽ tự động thử lần lượt các model khả dụng nhất trên tài khoản của bạn.  
> *(Nếu không điền Key, hệ thống tự động chuyển sang chế độ **Intelligent Heuristic Fallback Engine** giúp demo mượt mà 100%).*

---

## 📬 4. Cấu Hình Telegram Bot Thông Báo & Cảnh Báo Đỏ

### Bước 4.1: Tạo Bot và lấy Token
1. Mở ứng dụng Telegram trên máy tính hoặc điện thoại.
2. Tìm kiếm người dùng chính thức: **`@BotFather`** (có tích xanh).
3. Gửi lệnh: `/newbot`
4. Nhập tên hiển thị của Bot (ví dụ: `CeramixFlow Bot`).
5. Nhập Username của Bot (kết thúc bằng đuôi `_bot`, ví dụ: `ceramixflow_bot`).
6. `@BotFather` sẽ gửi lại cho bạn mã **HTTP API Token** (dạng `8123456789:AAH...`).
7. Dán mã này vào biến:
```env
TELEGRAM_BOT_TOKEN="8123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Bước 4.2: Lấy Chat ID nhận tin nhắn
- **Cách 1 (Nhận tin nhắn cá nhân):**
  1. Tìm bot **`@userinfobot`** trên Telegram $\rightarrow$ Bấm nút **Start**.
  2. Bot sẽ trả về **`Id`** của bạn (ví dụ: `8570076169`).
  3. Mở bot bạn vừa tạo ở Bước 4.1 và bấm **Start** (bắt buộc để bot có quyền gửi tin cho bạn).
  4. Điền ID vào file `.env`:
     ```env
     TELEGRAM_CHAT_ID="8570076169"
     ```

- **Cách 2 (Nhận tin nhắn vào Group / Nhóm xưởng):**
  1. Tạo nhóm Telegram mới $\rightarrow$ Thêm bot của bạn vào nhóm.
  2. Gửi một tin nhắn bất kỳ vào nhóm (ví dụ: `Hello Bot`).
  3. Mở trình duyệt truy cập:  
     `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getUpdates`
  4. Tìm đoạn `"chat":{"id": -100xxxxxxxx}`. Copy số ID bắt đầu bằng dấu `-` đó vào `TELEGRAM_CHAT_ID`.

---

## 🧪 5. Kiểm Tra Tự Động Toàn Bộ Kết Nối (Health Check)

Sau khi điền file `.env`, bạn kiểm tra bằng một trong hai cách:

### Cách 1: Chạy file Batch 1-Click (Windows)
Vào thư mục `Setup/scripts/` $\rightarrow$ Double click vào file:
👉 **`test-keys.bat`**

### Cách 2: Chạy qua Terminal
```bash
cd backend
npm run test:connections
```

### 🎯 Kết quả mong muốn khi toàn bộ kết nối sẵn sàng:
```
=============================================================
  🔍 CERAMIXFLOW - KIỂM TRA TOÀN BỘ KẾT NỐI (HEALTH CHECK)
=============================================================

📦 [1/3] Đang kiểm tra kết nối Database (Supabase/PostgreSQL)...
   ✅ DATABASE: Kết nối THÀNH CÔNG!
   📊 Host: aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres

-------------------------------------------------------------
🤖 [2/3] Đang kiểm tra Google Gemini AI API...
   ✅ GEMINI AI: Kết nối THÀNH CÔNG với Model [gemini-3.6-flash]!
   💬 Phản hồi từ AI: OK

-------------------------------------------------------------
📬 [3/3] Đang kiểm tra Telegram Bot & Chat ID...
   ✅ TELEGRAM BOT: Token HỢP LỆ! (Tên bot: @ceramixflow_bot)
   ✅ TELEGRAM MESSAGE: Đã gửi thành công 1 tin nhắn test đến Chat ID: 8570076169!

=============================================================
  📋 TỔNG KẾT KIỂM TRA:
  - Database: 🟢 HOẠT ĐỘNG
  - Gemini AI: 🟢 HOẠT ĐỘNG
  - Telegram: 🟢 HOẠT ĐỘNG
=============================================================
```

---

## 🛠️ 6. Xử Lý Các Lỗi Thường Gặp (Troubleshooting)

| Hiện tượng | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **Database `Authentication failed`** | Sai mật khẩu database Supabase | Vào Supabase $\rightarrow$ *Project Settings* $\rightarrow$ *Database* $\rightarrow$ Bấm *Reset Database Password* và cập nhật lại vào `.env`. |
| **Gemini `404 Model not found`** | Model name không tồn tại hoặc API Key sai định dạng | Đổi `GEMINI_MODEL="gemini-3.6-flash"` hoặc `gemini-2.5-flash` và kiểm tra Key phải bắt đầu bằng `AIzaSy...`. |
| **Telegram `403 Forbidden: bot can't initiate conversation`** | Bạn chưa bấm "Start" trên bot cá nhân | Mở bot của bạn trên Telegram và bấm nút **Start** một lần. |
| **Telegram `400 Chat not found`** | Điền sai `TELEGRAM_CHAT_ID` | Kiểm tra lại Chat ID bằng `@userinfobot`. |
