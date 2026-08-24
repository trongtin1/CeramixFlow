# 🎬 TÓM TẮT GIẢI TRÌNH DỰ ÁN & KỊCH BẢN PHỤ ĐỀ VIDEO DEMO (ĐỒNG BỘ 100%)
## CeramixFlow - Hệ Thống Điều Phối & Giám Sát Sản Xuất Xưởng Gốm Sứ Đa Bước

> **Tệp phụ đề đính kèm:** [`document/subtitles.srt`](subtitles.srt) (Khớp 100% từng giây với 6 bước thao tác màn hình bên dưới).

---

## 📌 1. TÓM TẮT DỰ ÁN TRONG 3 GẠCH ĐẦU DÒNG (EXECUTIVE SUMMARY)

- **Bài toán thực tế:** Ngành gốm sứ có quy trình 6 công đoạn liên hoàn nghiêm ngặt và thông số kỹ thuật đa dạng (đất sét, nhiệt độ lò 1050-1300°C, loại men, tỷ lệ co ngót nhiệt). Quản lý thủ công dễ gây sai sót định mức vật liệu, trễ hạn và không kịp ứng phó khi nứt men/sập lò hoặc cần tái chế sửa chữa phôi mộc.
- **Giải pháp công nghệ:** Ứng dụng **Google Gemini AI & RAG Chat 2 tầng** để tiếp nhận tự nhiên $\rightarrow$ Lưu trữ bằng **Kiến trúc Dữ liệu Lai (Hybrid SQL + PostgreSQL JSONB)** $\rightarrow$ Điều phối bằng **Bảng Kanban 6 trạm phản hồi tức thì 0ms (Optimistic UI)** $\rightarrow$ Hỗ trợ **Xác nhận 2 chiều Web & Telegram Bot**, **Kéo lùi công đoạn tái chế phôi mộc (Rework)** $\rightarrow$ Tự động phát **Cảnh báo đỏ sự cố qua Telegram Bot**.
- **Giá trị mang lại:** Tự động hóa tính toán công thức vật liệu, sắp xếp thứ tự xử lý bằng kéo thả linh hoạt, cho phép thợ thao tác trực tiếp trên Telegram và phát cảnh báo đỏ khẩn cấp tức thời ngăn ngừa trễ hạn giao hàng.

---

## 📝 2. BẢNG KHỚP 100% GIỮA THAO TÁC MÀN HÌNH VÀ PHỤ ĐỀ CHỮ (SUBTITLES)

| Mốc Thời Gian | Thao Tác Trực Tiếp Trên Màn Hình | Dòng Phụ Đề Chữ Xuất Hiện Trên Màn Hình (Subtitles) |
| :---: | :--- | :--- |
| **0:00 - 0:35** | 1. Bấm nút màu cam: **`💬 Chat Tư Vấn Kỹ Sư AI`**.<br>2. Nhập: *"Tôi muốn đặt làm 150 bình hút tài lộc phong thủy"* $\rightarrow$ Gửi.<br>3. AI hiện cảnh báo thiếu thông số $\rightarrow$ Click lần lượt 3-4 chip: `+ Chiều cao 35cm`, `+ Men ngọc Celadon`, `+ Hạn 7 ngày`, `+ Bọc đồng viền miệng` (hoặc `+ Co ngót 12.5%`). | **CeramixFlow - Hệ Thống Điều Phối & Giám Sát Sản Xuất Xưởng Gốm Sứ Đa Bước**<br>Bước 1: Tiếp nhận yêu cầu & Chat RAG AI tự động phát hiện thông số thiếu, bổ sung thông số chuyên sâu. |
| **0:36 - 0:55** | 1. Bấm nút: **`🚀 Kích Hoạt Mẻ Sản Xuất Này Vào Bảng Kanban`**.<br>2. Modal **Kiểm duyệt thông số (Pre-flight Review)** mở ra $\rightarrow$ Cuộn xem định mức đất sét (130kg), nhiệt độ lò (1260°C).<br>3. Bấm **`Xác Nhận & Khởi Tạo Mẻ Sản Xuất`**. | **Bước 2: AI tự động tính toán định mức đất sét, nhiệt độ lò nung và mở Pre-flight Review**<br>Quản đốc kiểm duyệt thông số kỹ thuật và bấm "Xác Nhận & Khởi Tạo Mẻ Sản Xuất". |
| **0:56 - 1:20** | 1. Mẻ xuất hiện ở Trạm 1 $\rightarrow$ Kéo thả thẻ tự do thay đổi thứ tự ưu tiên trong cột.<br>2. Bấm nút **`➔ Bước 2, 3, 4`** hoặc kéo sang cột kế tiếp để chuyển công đoạn liên hoàn $\rightarrow$ Toast thông báo trượt ra 0ms và phát tín hiệu về Telegram. | **Bước 3: Điều phối Kanban 6 công đoạn - Kéo thả tự do & Chuyển tiến công đoạn siêu tốc 0ms**<br>Hệ thống hỗ trợ xác nhận 2 chiều đồng thời trên Web và nút bấm Telegram với cơ chế chống xung đột. |
| **1:21 - 1:50** | 1. Thử nghiệm tính năng **Tái chế / Sửa chữa phôi mộc (Rework)**: Kéo 1 thẻ từ Trạm 3 (Vẽ họa tiết) lùi về Trạm 2 (Phơi sấy & Sửa mộc).<br>2. **Modal Xác Nhận Chuyển Lùi** mở ra $\rightarrow$ Chọn lý do: *"Phôi mộc chưa phẳng / Men bị bọt khí"* $\rightarrow$ Bấm **Xác nhận** $\rightarrow$ Thẻ chuyển lùi mượt mà và Telegram nhận cảnh báo điều phối lại. | **Bước 4: Tính năng Rework - Kéo lùi công đoạn tái chế phôi mộc & Bắn cảnh báo điều phối lại**<br>Tự động đặt lại trạng thái các trạm sau về Pending, ghi nhật ký Audit Log và thông báo tới đội ngũ sản xuất. |
| **1:51 - 2:20** | 1. Tại trạm *5. Vào lò nung*, bấm nút: **`🚨 Báo QC`**.<br>2. Nhập `5` phế phẩm, chọn mức `CRITICAL`, chọn lý do `Nứt men sau nung nhiệt cao`.<br>3. Bấm **`Bắn Cảnh Báo Đỏ Khẩn Cấp`** $\rightarrow$ Kênh Telegram lập tức nhận tin nhắn cảnh báo đỏ. | **Bước 5: Báo cáo sự cố QC tại lò nung & Bắn CẢNH BÁO ĐỎ khẩn cấp về Telegram**<br>Ghi nhận 5 sản phẩm nứt men để Quản đốc xưởng kịp thời xử lý và lên phương án bù mẻ. |
| **2:21 - 2:50** | 1. Tại thanh tìm kiếm, gõ từ khóa **`Celadon`** hoặc bấm chip gợi ý **`1280°C`** $\rightarrow$ Bấm **`✕ Xóa lọc`**.<br>2. Bấm nút **`📑 Thu Gọn`** $\rightarrow$ Thẻ thu nhỏ dạng mật độ cao $\rightarrow$ Bấm **`📋 Chi Tiết`**.<br>3. Bấm icon **`👁️`** trên thẻ xem `technical_specs` JSONB $\rightarrow$ Cuộn xuống xem **Live Event Feed**. | **Bước 6: Bộ công cụ mật độ cao (Deep Search, Chế độ Thu gọn) & Tổng kết Kiến trúc Hybrid JSONB**<br>Tổng kết: Toàn vẹn ACID cho State Machine & Linh hoạt tối đa cho thông số kỹ thuật gốm sứ! |

---

## 🏗️ 3. TÓM TẮT 5 ĐIỂM SÁNG KỸ THUẬT NỔI BẬT

1. **Kiến trúc Dữ liệu Lai (Hybrid PostgreSQL JSONB):**
   - Không bị giới hạn bởi schema cứng: Mọi thông số vật liệu đặc thù (tỷ lệ co ngót, kỹ thuật bọc đồng, thời gian ngâm nhiệt) đều được lưu trữ trong cột `JSONB` mà không cần chạy migration DB.
2. **Trợ lý AI RAG Đối thoại 2 Tầng (Gemini 2.5 Flash + Fallback Engine):**
   - Tự động kiểm tra tính đầy đủ của dữ liệu. Nếu thiếu, AI chủ động hỏi các câu hỏi chuyên môn ngành gốm kèm gợi ý 1-click.
3. **Quy Trình Tái Chế & Điều Phối Lùi (Rework & Stage Rollback):**
   - Kéo lùi thẻ kích hoạt modal xác nhận lý do nghiệp vụ, reset trạng thái các trạm sau và ghi nhận vết kiểm toán (Audit Trail).
4. **Xác Nhận Hai Chiều Web & Telegram (Dual-Channel Anti-Conflict):**
   - Thợ xưởng có thể xác nhận chuyển trạm trực tiếp qua nút bấm Telegram hoặc Web; backend kiểm soát tính nhất quán và chống xung đột.
5. **Phản Hồi Giao Diện Không Độ Trễ (Optimistic UI 0ms & Non-blocking Dispatches):**
   - Tách rời các tác vụ gửi tin nhắn Telegram thành background async task, giúp API và giao diện phản hồi tức thì dưới 15ms.
