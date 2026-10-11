# Kiểm thử FE sau đợt sửa BE

## Môi trường

- Chạy BE từ branch `fix/admin-leader-leave-export-import`, commit `6ba1d37` hoặc bản mới hơn có cùng hợp đồng API; bảo đảm migration V17 đã chạy.
- FE mặc định gọi `/api/v1`. `vite.config.js` hiện proxy đến Railway. Để test BE LAN/local, cấu hình `VITE_API_PROXY_TARGET=http://localhost:8080` trước khi chạy `npm run dev` (thay localhost bằng địa chỉ BE nếu cần).
- Nếu gọi BE khác origin trực tiếp, đặt `VITE_API_BASE_URL=http://<BE>:8080/api/v1` và cấu hình CORS trên BE. Header `Content-Disposition` cần được expose để lấy tên file Excel.
- Dùng hai phiên trình duyệt: Admin và Leader; có thêm sinh viên chưa có nhóm, sinh viên không đủ điều kiện, nhóm đủ 5 người.

Ví dụ PowerShell để dùng proxy cùng origin với BE local:

```powershell
$env:VITE_API_PROXY_TARGET = "http://localhost:8080"
$env:VITE_API_BASE_URL = "/api/v1"
npm.cmd run dev
```

## Điểm truy cập

| Vai trò | Menu | Kiểm tra |
| --- | --- | --- |
| Leader | Xét duyệt đơn Apply | Invite gửi đúng `{studentCode}`, trim/uppercase; hiện MSSV từ `student.studentCode`; lỗi 403/404/409 hiện message của BE |
| Admin | Xuất Excel Báo cáo | Chọn học kỳ hoặc tất cả; chỉ tải khi 200 và MIME XLSX; tên file theo header; mở được hai sheet |
| Leader | Quản lý trạng thái & Rời nhóm | Lý do bắt buộc, tối đa 1000 ký tự; gửi xong vẫn là Leader; lịch sử và trạng thái yêu cầu được tải lại |
| Admin | Chuông thông báo | `LEADER_LEAVE_REQUESTED` có nhãn riêng, lý do và nút mở hộp thư theo entityId |
| Admin | Yêu cầu rời nhóm của Leader | Lọc trạng thái; chọn userId thành viên ACTIVE hoặc để tự động; duyệt khiến Leader cũ rời nhóm; từ chối giữ nguyên nhóm |
| Admin | Danh sách nhóm → Đổi Leader | PUT `/groups/{id}/leader`; chỉ đổi vai trò, không tự duyệt đơn xin rời và không xóa Leader cũ |
| Admin | Import Sinh viên | Import JSON, CSV/XLSX/XLS; hiện students và invalid; tìm theo tên/email/MSSV, lọc điều kiện và phân trang |
| Leader/Member | Lịch gặp GVHD | Danh sách slot phân trang; chỉ Leader đặt/hủy; bắt buộc lý do hủy; slot dưới 24 giờ bị chặn |
| Leader/Member | Tài liệu nhóm | Leader upload file hoặc gửi link; thành viên xem danh sách, phiên bản, phản hồi và tải file qua request có Bearer token |

## Kịch bản trọng tâm

1. **INV-01..11:** mời MSSV hợp lệ/không tồn tại/đã có nhóm/không đủ điều kiện; gửi lặp; nhóm đầy; chấp nhận hoặc thu hồi Invite. Chỉ đơn Apply PENDING tính vào giới hạn ba đơn.
2. **EXP-01..12:** xuất học kỳ có/không có dữ liệu; giữ MSSV và tiếng Việt; 401/403/404/405/501 và JSON lỗi không được lưu thành XLSX; nút khóa khi đang tải. File không có cột số điện thoại.
3. **LEA-01..14:** gửi đơn Leader; Admin nhận thông báo; duyệt với người thay thế cụ thể hoặc tự động; từ chối; không tự duyệt; lỗi 409 khi đã có đơn chờ; người ngoài nhóm nhận 403. Sau khi Admin xử lý, quay lại cửa sổ Leader hoặc bấm “Làm mới nhóm” để tải vai trò và thành viên từ BE.
4. **REG-01..05:** thành viên thường vẫn gửi lý do tùy chọn, Leader duyệt/từ chối; nhóm khóa hoặc hết thời hạn hiển thị message lỗi từ BE.
5. **Import:** thử file hợp lệ, file chỉ có MSSV tài khoản đã tồn tại, dữ liệu có dòng lỗi và dữ liệu không có dòng hợp lệ. Kiểm tra bảng kết quả, invalid[], bộ lọc và trang sau.
6. **Đặt lịch:** slot còn trống, slot đã đầy, slot dưới 24 giờ, lỗi quyền, hủy với lý do trống/hợp lệ. Kiểm tra slot được cập nhật sau đặt/hủy.
7. **Tài liệu:** gửi link HTTP(S), upload file hợp lệ, file vượt giới hạn BE, lỗi quyền, download đúng nội dung và tên file, đọc phản hồi của GVHD.

## Giới hạn và xác minh

- BE hiện không có API liệt kê booking theo nhóm trong hợp đồng được cung cấp. FE lưu mã booking vừa đặt theo groupId trên trình duyệt; có thể nhập booking ID khi hủy lịch đặt từ thiết bị khác.
- `npm test` kiểm tra hợp đồng request, multipart, trạng thái/MIME/tên file Excel và phản hồi lỗi bằng mock; không thay thế kiểm thử BE thật, notification, CORS hoặc migration.
- `npm run build` kiểm tra khả năng đóng gói frontend.
- Không đưa accessToken hoặc mật khẩu vào ảnh/log báo lỗi.
