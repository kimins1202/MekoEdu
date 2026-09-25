# Đồng bộ bài làm offline

Đáp án được ghi vào AsyncStorage ngay sau mỗi lựa chọn, trước khi gửi lên Moodle. Hàng đợi tách theo userid, quizid và attemptid. Câu hỏi đã tải, trang đang làm và hạn nộp được lưu cùng bài làm; thời gian không bắt đầu lại khi khôi phục.

| Trạng thái | Ý nghĩa |
| --- | --- |
| Pending | Đã lưu trên thiết bị, còn chờ Moodle xác nhận. Lỗi kết nối/timeout giữ trạng thái này. |
| Synced | Moodle đã xác nhận thao tác lưu hoặc lượt thi đã hoàn tất. |
| Failed | Moodle/HTTP từ chối đồng bộ; giữ dữ liệu và thông báo lỗi để thử lại thủ công. Lỗi lưu thiết bị cũng hiển thị Failed với thông báo riêng, không khẳng định đã lưu. |

Gửi sau 1,5 giây ngừng đổi đáp án. Khi ứng dụng đang hoạt động, hàng đợi thử lại Pending mỗi 15 giây và khi quay lại từ nền. Không yêu cầu tác vụ nền của hệ điều hành: nếu ứng dụng bị đóng, việc gửi tiếp tục khi mở lại và đăng nhập đúng tài khoản.

Mỗi lượt thi chỉ có một tác vụ gửi đang chạy. Mỗi bản sửa có revision; phản hồi cho bản cũ không đánh dấu bản mới là Synced. Ghi cache và cập nhật trạng thái dùng cùng hàng đợi ghi để không làm mất dữ liệu của nhau.

## Nộp bài

Nộp bài (kể cả hết giờ) lưu yêu cầu nộp và khóa đáp án trước khi gửi. Màn hình chỉ chuyển sang kết quả sau khi Moodle xác nhận. Nếu phản hồi nộp bị mất, lần thử sau kiểm tra lịch sử lượt thi trước để tránh gửi lại lượt đã hoàn thành. Cho phép quay lại màn hình khác sau khi yêu cầu nộp đã được lưu; hàng đợi vẫn tiếp tục khi ứng dụng hoạt động.

Moodle quyết định việc chấp nhận câu trả lời/nộp bài muộn theo cấu hình kỳ thi. Đồng bộ offline không gia hạn thời gian và không đảm bảo Moodle chấp nhận dữ liệu gửi sau hạn. Với lượt đã được Moodle kết thúc trước đó, ứng dụng khôi phục trạng thái hoàn tất; không thể ghi bổ sung đáp án vào lượt đã đóng.

## Giới hạn

- Cần kết nối để tạo lượt thi và tải trang câu hỏi chưa có cache. Tiếp tục offline chỉ áp dụng với lượt và các trang đã tải; danh sách khóa học/kỳ thi chưa được bổ sung cache trong thay đổi này.
- Không đồng bộ đa thiết bị theo thời gian thực; bản đáp án cục bộ được ưu tiên khi khôi phục trên thiết bị đó.
- Dữ liệu được giữ trong bộ nhớ ứng dụng. Xóa dữ liệu/gỡ ứng dụng sẽ xóa bản chưa đồng bộ.

## Kiểm tra

`node --test scripts/test-offline-sync.cjs scripts/test-exam-countdown.cjs scripts/test-exam-monitoring.cjs`

Kiểm tra với thiết bị và Moodle thật:

1. Chọn đáp án khi online: Pending → Synced sau xác nhận.
2. Bật chế độ máy bay, đổi đáp án: Pending; trang đã tải vẫn mở được, trang chưa tải báo cần mạng.
3. Mở lại lượt đã lưu: đáp án và hạn giờ không đổi. Khôi phục mạng: tự gửi trong chu kỳ 15 giây hoặc bấm Đồng bộ lại.
4. Nộp khi offline: giữ yêu cầu nộp, khóa đáp án, chưa chuyển kết quả. Khôi phục mạng: chỉ chuyển kết quả khi Moodle xác nhận.
5. Giả lập lỗi HTTP/Moodle: Failed, không mất đáp án; sửa lỗi và bấm Đồng bộ lại.
6. Đổi tài khoản: hàng đợi tài khoản cũ không được gửi bằng tài khoản mới.
