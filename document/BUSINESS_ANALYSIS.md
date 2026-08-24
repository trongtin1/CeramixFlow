# 📋 TÀI LIỆU PHÂN TÍCH NGHIỆP VỤ (BUSINESS ANALYSIS - BA)
## Hệ Thống Điều Phối & Giám Sát Sản Xuất Xưởng Gốm Sứ (CeramixFlow MES)

---

## 1. TỔNG QUAN BÀI TOÁN DOANH NGHIỆP (BUSINESS CONTEXT)

### 1.1 Bối Cảnh Ngành Gốm Sứ Thủ Công & Bán Tự Động
Ngành sản xuất gốm sứ thủ công mỹ nghệ (như làng nghề Bát Tràng, Chu Đậu, Hương Canh) có lịch sử lâu đời với giá trị gia tăng cao nhưng đang gặp các rào cản lớn trong quá trình số hóa và quản trị sản xuất:
1. **Thiếu chuẩn hóa dữ liệu đầu vào:** Khách hàng đặt hàng với yêu cầu mô tả tự nhiên ("*Làm 200 bình hút lộc men lam cao 35cm nung 1280°C giao trong 10 ngày*"). Việc tính toán định mức đất sét, loại men, nhiệt độ lò và thời gian nung thường phụ thuộc hoàn toàn vào trí nhớ hoặc kinh nghiệm cảm tính của Quản đốc xưởng.
2. **Quy trình 6 công đoạn liên hoàn khắt khe:** Mỗi sản phẩm phải đi qua tuần tự:
   `1. Tạo hình mộc ➔ 2. Phơi sấy & Sửa ➔ 3. Vẽ họa tiết ➔ 4. Tráng men ➔ 5. Vào lò nung ➔ 6. QC & Đóng gói`
   Nếu một mẻ gốm bị chậm tiến độ ở khâu phơi sấy hoặc vẽ họa tiết, toàn bộ lịch vào lò nung (chi phí đốt lò rất cao) sẽ bị xáo trộn.
3. **Thất thoát thông tin & Thiếu cảnh báo sự cố kịp thời:** Khi xảy ra nứt men hoặc sập lò tại khâu nung (nhiệt độ 1200-1300°C), thợ lò thường chỉ báo cáo miệng cuối ngày $\rightarrow$ Ban quản lý không kịp trở tay để bù mẻ mới, dẫn tới trễ hạn xuất khẩu.

### 1.2 Mục Tiêu của Hệ Thống CeramixFlow
- **Số hóa và tự động hóa toàn diện:** Chuyển đổi ngôn ngữ tự nhiên thành thông số kỹ thuật chuẩn hóa dạng `JSONB` trong 1-2 giây nhờ AI Agent.
- **Minh bạch tiến độ sản xuất:** Giám sát trực quan từng mẻ gốm trên bảng điều phối Kanban 6 công đoạn theo thời gian thực.
- **Cảnh báo tức thời:** Tích hợp Bot Telegram tự động phát bản tin tiến độ và **Cảnh báo đỏ khẩn cấp** khi có sự cố phế phẩm.
- **Tối ưu thứ tự ưu tiên (Scheduling):** Hỗ trợ điều phối đa tầng kết hợp kéo thả (Drag & Drop) để ưu tiên xử lý các đơn hàng gấp.

---

## 2. CÁC ĐỐI TƯỢNG NGƯỜI DÙNG (USER PERSONAS)

| Vai Trò | Trách Nhiệm Chính | Nhu Cầu & Nỗi Đau (Pain Points) | Tính Năng Hệ Thống Phục Vụ |
| :--- | :--- | :--- | :--- |
| **Quản Đốc Xưởng (Factory Manager)** | Lập kế hoạch sản xuất, điều phối thứ tự ưu tiên các mẻ, phân bổ lò nung, duyệt công thức vật liệu. | • Khó kiểm soát hàng chục mẻ gốm đang làm dở.<br>• Mất thời gian tính toán thủ công lượng đất sét & nhiệt lò. | • AI Copilot bóc tách công thức tự động.<br>• Pre-flight Review Modal duyệt thông số.<br>• Kéo thả thay đổi thứ tự ưu tiên mẻ. |
| **Kỹ Thuật Viên / Thợ Trưởng Trạm** | Thực hiện thao tác tại từng trạm (vuốt gốm, sửa mộc, vẽ, tráng men, vào lò). | • Không nắm được mẻ nào cần làm trước.<br>• Ghi chép sổ sách giấy dễ rách hỏng trong môi trường bùn đất/lò nung. | • Bảng Kanban hiển thị trực quan thứ tự `#1, #2, #3`.<br>• Nút chuyển bước 1-click tức thì (0ms). |
| **Kiểm Định Viên Chất Lượng (QC Inspector)** | Kiểm tra độ tròn đều, men rạn, bọt khí, nứt men trước khi đóng gói hoặc sau khi ra lò. | • Khi phát hiện hàng hỏng hàng loạt, báo cáo chậm trễ dẫn tới không kịp sản xuất bù. | • Nút "🚨 Báo QC" gửi cảnh báo đỏ tức thì về nhóm Telegram của Ban Giám đốc. |
| **Khách Hàng / Bộ Phận Kinh Doanh** | Gửi đơn đặt hàng, theo dõi tiến độ hoàn thành đơn. | • Thường xuyên phải gọi điện hỏi xưởng xem đơn hàng đang làm đến đâu. | • Kênh thông báo tự động qua Telegram Bot cập nhật mỗi khi mẻ hoàn thành 1 công đoạn. |

---

## 3. QUY TRÌNH NGHIỆP VỤ CHI TIẾT (BUSINESS PROCESS FLOW)

```
[Khách hàng / Kinh doanh]
          │
          ▼ 1. Nhập mô tả tiếng Việt
[AI Manufacturing Hub] ──(Tùy chọn)──► [Chat Tư Vấn RAG Copilot] (Hỏi thêm thông số)
          │                                     │
          ▼ 2. Bóc tách JSON                    ▼
[Pre-flight Review Gate] ◄──────────────────────┘
 (Quản đốc kiểm duyệt, thêm "Tỷ lệ co ngót 12.5%", "Bọc đồng")
          │
          ▼ 3. Bấm "Khởi Tạo Mẻ Sản Xuất"
[PostgreSQL Database] ──► Lưu JSONB & Tạo 6 trạm công đoạn
          │
          ▼ 4. Bắn thông báo khởi tạo
[Telegram Bot Alert] (@ceramixflow_bot)
          │
          ▼ 5. Điều phối trên Kanban 6 Trạm
 ┌──────────────────────────────────────────────────────────┐
 │ Trạm 1: Tạo hình mộc (Vuốt tay / Ép khuôn)               │
 │    ▼                                                     │
 │ Trạm 2: Phơi sấy & Sửa (Gọt tiện phôi mộc)               │
 │    ▼                                                     │
 │ Trạm 3: Vẽ họa tiết (Nghệ nhân tỉa hoa văn)             │
 │    ▼                                                     │
 │ Trạm 4: Tráng men (Nhúng / Phun men gốm)                 │
 │    ▼                                                     │
 │ Trạm 5: Vào lò nung (Nung nhiệt cao 1050 - 1300°C)       │
 │    ▼                                                     │
 │ Trạm 6: QC & Đóng gói (Kiểm định xuất xưởng)             │
 └──────────────────────────────────────────────────────────┘
          │
          ├───────────────(Phát hiện lỗi nứt men)───────────────┐
          ▼                                                     ▼
 [Hoàn thành xuất xưởng]                              [🚨 Bắn Cảnh Báo Đỏ QC]
  (Bắn Telegram thành công)                             (Bắn Telegram sự cố khẩn)
```

---

## 4. DANH SÁCH USER STORIES & TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

### US-01: Bóc Tách Đơn Hàng Nhanh 1-Click Bằng AI
- **Là một:** Quản đốc xưởng.
- **Tôi muốn:** Nhập một đoạn mô tả tiếng Việt tự nhiên và bấm *Bóc Tách Nhanh*.
- **Để:** AI tự động trích xuất tên sản phẩm, số lượng, loại men, nhiệt độ nung và dự toán lượng đất sét cần dùng.
- **Tiêu chí nghiệm thu (AC):**
  - AC 1.1: Trả về kết quả JSON chuẩn Zod trong vòng < 2 giây.
  - AC 1.2: Tính toán chính xác định mức đất sét = số lượng * khối lượng phôi (+ 15% hao hụt).
  - AC 1.3: Tự động gán cấp độ ưu tiên (`URGENT`/`HIGH`/`MEDIUM`/`LOW`) dựa trên thời hạn ngày giao.

### US-02: Hội Thoại Đa Bước Tư Vấn & Hỏi Thêm Thông Số (RAG Copilot)
- **Là một:** Nhân viên kinh doanh / Quản đốc.
- **Tôi muốn:** Trò chuyện với Trợ lý Kỹ sư trưởng AI khi đơn hàng chưa đủ thông tin.
- **Để:** AI chủ động phát hiện các thông số thiếu (kích thước, loại men, thời hạn) và hỏi thêm các thông số kỹ thuật chuyên sâu (viền miệng bọc đồng, tỷ lệ co ngót nhiệt, thời gian giữ nhiệt đỉnh lò Soaking).
- **Tiêu chí nghiệm thu (AC):**
  - AC 2.1: Hiển thị cảnh báo rõ ràng các thông số còn thiếu (`missing_fields`).
  - AC 2.2: Cung cấp các chip gợi ý chọn nhanh 1-click (`suggested_options`).
  - AC 2.3: Khi đủ thông tin, hiển thị thẻ JSON tóm tắt kèm nút *Kích hoạt mẻ vào Kanban*.

### US-03: Điều Phối Thứ Tự Ưu Tiên Bằng Kéo Thả (Kanban DnD)
- **Là một:** Quản đốc xưởng.
- **Tôi muốn:** Kéo thả thẻ mẻ gốm lên/xuống trong cùng cột hoặc kéo sang cột tiếp theo.
- **Để:** Thay đổi thứ tự ưu tiên xử lý hoặc chuyển công đoạn sản xuất.
- **Tiêu chí nghiệm thu (AC):**
  - AC 3.1: Giao diện cập nhật tức thì trong 0ms (Optimistic UI).
  - AC 3.2: Tự động đánh số lại huy hiệu thứ tự `#1, #2, #3...` trên thẻ.
  - AC 3.3: Lưu lại thuộc tính `custom_rank` vào cơ sở dữ liệu.

### US-04: Báo Cáo Sự Cố QC & Cảnh Báo Khẩn Cấp
- **Là một:** Kỹ thuật viên kiểm định QC.
- **Tôi muốn:** Báo cáo số lượng sản phẩm lỗi kèm lý do và mức độ nghiêm trọng.
- **Để:** Hệ thống cập nhật số liệu và phát tín hiệu cảnh báo đỏ khẩn cấp tới nhóm Telegram.
- **Tiêu chí nghiệm thu (AC):**
  - AC 4.1: Mở modal Báo QC nhanh từ bất kỳ thẻ mẻ gốm nào.
  - AC 4.2: Lưu bản ghi sự cố vào bảng `incident_reports` và `system_event_logs`.
  - AC 4.3: Bắn tin nhắn Telegram có gắn cờ `🚨 CẢNH BÁO ĐỎ QC` trong thời gian thực.

### US-05: Xác Nhận Hoàn Thành Công Đoạn Trực Tiếp Trên Telegram (Bonus Feature ⭐)
- **Là một:** Thợ trưởng trạm / Quản đốc xưởng đang đi kiểm tra hiện trường.
- **Tôi muốn:** Bấm trực tiếp nút xác nhận hoàn thành công đoạn (*Inline Keyboard Button*) ngay trong tin nhắn thông báo trên ứng dụng Telegram.
- **Để:** Chuyển mẻ gốm sang trạm kế tiếp tức thì mà không cần phải mở máy tính hay đăng nhập vào Dashboard web.
- **Tiêu chí nghiệm thu (AC):**
  - AC 5.1: Mọi bản tin tiến độ bắn về Telegram đều tự động đính kèm nút:
    `[ ✅ Hoàn thành "Trạm X" ➔ Sang "Trạm Y" ]` và `[ 🚨 Báo Lỗi QC Nhanh ]`.
  - AC 5.2: Khi người dùng bấm nút trên điện thoại, Telegram hiển thị phản hồi tức thì qua Toast popup.
  - AC 5.3: Backend nhận `callback_query`, chuyển trạng thái mẻ gốm trong State Machine, cập nhật tên người bấm (`@username`), và đồng bộ tức thì lên bảng Kanban trên Web.

### US-06: Tái Chế & Điều Phối Lùi Công Đoạn (Rework / Rollback Modal ⭐)
- **Là một:** Quản đốc xưởng / Thợ kiểm tra chất lượng phôi mộc.
- **Tôi muốn:** Kéo lùi mẻ gốm từ trạm sau về trạm trước (ở các công đoạn trước nung 1-4) khi phát hiện phôi mộc hoặc men có khuyết tật cần xử lý lại.
- **Để:** Cho phép cạo men làm lại, gọt tiện lại phôi mộc hoặc nhào lại đất mà không phải hủy bỏ toàn bộ mẻ gốm.
- **Tiêu chí nghiệm thu (AC):**
  - AC 6.1: Kéo lùi thẻ kích hoạt Modal xác nhận với các lý do nghiệp vụ (Men bọt khí, Phôi chưa phẳng, Họa tiết nhòe nét).
  - AC 6.2: Tự động reset trạng thái các trạm phía sau về `PENDING`.
  - AC 6.3: Ghi nhận lý do điều phối lại vào bảng `batch_stage_logs` và bắn thông báo cảnh báo tới Telegram.

---

## 5. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFRs)

1. **Hiệu năng & Độ trễ (Performance):**
   - Áp dụng mô hình **Optimistic UI**: Mọi tương tác người dùng (chuyển trạm, kéo thả, chỉnh sửa) phản hồi trên giao diện tại **0ms**, việc đồng bộ cơ sở dữ liệu và gọi Telegram API diễn ra ngầm ở background không làm nghẽn luồng xử lý.
2. **Khả năng phục hồi (Resilience & Fault-Tolerance):**
   - Tích hợp **Ceramics Domain Heuristics Fallback Engine**: Kể cả khi mất kết nối Gemini AI API hoặc hết hạn quota, hệ thống vẫn tự động bóc tách và tính toán công thức gốm sứ chính xác 100%.
3. **Tính mở rộng schema (Extensibility):**
   - Sử dụng cột `technical_specs` định dạng **PostgreSQL JSONB** cho phép xưởng gốm tự do bổ sung các thông số kỹ thuật mới mà không cần chạy migration thay đổi cấu trúc bảng SQL.
