# Giám sát màn hình thi

- Thông báo trước khi bắt đầu; theo dõi trong lượt thi đang mở.
- Android/iOS: bật `expo-screen-capture`, che nội dung khi ứng dụng mất trạng thái active. iOS bật thêm bảo vệ ảnh xem trước trong trình chuyển ứng dụng.
- Ghi `APP_BACKGROUND` một lần khi chuyển nền, `APP_FOREGROUND` khi quay lại và hiển thị cảnh báo. Trạng thái inactive tạm thời (hộp thoại, Control Center) chỉ che nội dung, không tự coi là rời ứng dụng.
- Web: theo dõi tab ẩn bằng Page Visibility; không hỗ trợ chặn chụp/quay màn hình.
- Chặn điều hướng quay lại khi còn bài thi; giải phóng bảo vệ sau khi nộp thành công hoặc màn hình bị tháo khỏi navigation.
- Không tự động nộp bài hay trừ điểm dựa trên số lần rời màn hình.

Nhật ký được lưu bằng AsyncStorage theo khóa `exam-monitoring:<userid>:<quizid>:<attemptid>`, giữ số lần rời màn hình khi mở lại cùng lượt thi. Có thể đọc bằng `readMonitoringEvents`. Các trường gồm userid, quizid, attemptid, event, timestamp (Unix giây). Nhật ký cục bộ không phải bằng chứng chống chỉnh sửa; không ghi lại hình ảnh màn hình.

Tài liệu API mô tả `POST /api/monitoring/events` nhưng chưa xác định địa chỉ backend giám sát và hợp đồng xác thực. Hiện chưa gửi nhật ký lên server. Cần bổ sung các thông tin này trước khi tích hợp đồng bộ với giám thị.

## Kiểm tra

Chạy `node --test scripts/test-exam-monitoring.cjs` để kiểm tra hàng đợi lưu sự kiện và vòng đời giám sát với mock native.

Trên Android/iOS thật (build lại development client nếu đang dùng bản cũ):

1. Bắt đầu thi, kiểm tra thông báo bảo vệ; thử chụp và quay màn hình.
2. Chuyển sang ứng dụng khác rồi quay lại: tăng đúng một lần và cảnh báo; chuyển trang câu hỏi không làm mất số đếm.
3. Mở hộp thoại nộp bài rồi hủy: không tăng số lần rời màn hình.
4. Kiểm tra màn hình xem trước trong trình chuyển ứng dụng không lộ câu hỏi.
5. Nộp bài thất bại: tiếp tục giám sát. Nộp thành công: chụp màn hình kết quả hoạt động bình thường.
6. Mở lại lượt thi chưa nộp: khôi phục số lần đã ghi. Kiểm tra nhật ký không lẫn giữa tài khoản/lượt thi.
7. Web: đổi tab rồi quay lại; hiển thị giới hạn chặn chụp/quay chính xác.

Tham chiếu: https://docs.expo.dev/versions/v57.0.0/sdk/screen-capture/
