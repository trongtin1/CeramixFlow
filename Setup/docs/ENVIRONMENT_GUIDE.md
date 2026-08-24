# 🔑 Hướng Dẫn Cấu Hình Môi Trường (.env)

Tất cả các thông số được cấu hình trong file `backend/.env`.

---

## 1. Cơ Sở Dữ Liệu (PostgreSQL / Supabase)

### Cách 1: Sử dụng Supabase (Khuyến nghị)
1. Đăng nhập vào [Supabase](https://supabase.com) $\rightarrow$ Tạo project mới.
2. Vào **Project Settings** $\rightarrow$ **Database** $\rightarrow$ Kéo xuống mục **Connection string**:
   - Chọn tab **URI** và chọn chế độ **Transaction (port 6543)** cho `DATABASE_URL`.
   - Chọn chế độ **Session (port 5432)** cho `DIRECT_URL`.
3. Điền mật khẩu database của bạn vào chuỗi kết nối:
```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
```
4. Đẩy schema lên database:
```bash
cd backend
npx prisma db push
npx ts-node-dev src/prisma/seed.ts
```

---

## 2. Trí Tuệ Nhân Tạo (Google Gemini API)

*(Tùy chọn: Nếu để trống, hệ thống sẽ tự động kích hoạt bộ phân tích Heuristic thông minh để demo mượt mà 100%)*

1. Truy cập [Google AI Studio](https://aistudio.google.com/).
2. Đăng nhập bằng tài khoản Google $\rightarrow$ Bấm **Get API key** $\rightarrow$ **Create API key**.
3. Dán vào file `.env`:
```env
GEMINI_API_KEY="AIzaSy..."
```

---

## 3. Thông Báo Telegram (Telegram Bot)

*(Tùy chọn: Nếu để trống, hệ thống sẽ hiển thị bản tin thời gian thực ngay trên cửa sổ Live Telegram Feed ở giao diện Web)*

1. Mở ứng dụng Telegram $\rightarrow$ Tìm kiếm bot **`@BotFather`**.
2. Gửi lệnh `/newbot` $\rightarrow$ Đặt tên và username cho bot (ví dụ `CeramixFlowBot`).
3. Copy mã Token nhận được dán vào:
```env
TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
```
4. Để lấy `TELEGRAM_CHAT_ID`:
   - Tìm kiếm bot **`@userinfobot`** trên Telegram $\rightarrow$ Bấm **Start** để lấy ID cá nhân của bạn (ví dụ `987654321`).
   - (Hoặc nếu dùng nhóm: Thêm bot của bạn vào nhóm, gửi 1 tin nhắn bất kỳ, sau đó truy cập `https://api.telegram.org/bot<TOKEN>/getUpdates` để lấy group ID bắt đầu bằng dấu `-`).
5. Dán vào file `.env`:
```env
TELEGRAM_CHAT_ID="987654321"
```
