# Tiếp tục bài làm

Màn hình chi tiết tải lại trạng thái khi được mở hoặc quay lại. Nếu Moodle có lượt đang làm, nút chính hiển thị **Tiếp tục bài làm**, kèm trang sẽ khôi phục. Nếu không có mạng, ứng dụng tìm lượt có câu hỏi đã lưu trên thiết bị, đúng tài khoản và kỳ thi.

Nút truyền `attemptid` cụ thể sang màn hình thi. Màn hình kiểm tra lượt đó trong lịch sử của người dùng: đang làm thì khôi phục, đã hoàn tất thì mở kết quả, đã bị đóng/không tìm thấy thì báo lỗi. Chọn tiếp tục không tạo lượt mới thay cho lượt được chọn.

Trang trên thiết bị được ưu tiên; nếu chưa có cache thì dùng `currentpage` của Moodle. Đáp án và hạn nộp dùng luồng lưu/đồng bộ hiện có, không khởi động lại thời gian. Yêu cầu nộp đang chờ hiển thị **Tiếp tục đồng bộ bài nộp** và giữ khóa đáp án.

Kiểm tra tự động: `node --test scripts/test-resume-exam.cjs`.

Kiểm tra với Moodle thật:

1. Làm bài, sang trang khác và chọn đáp án; đóng rồi mở lại ứng dụng, vào chi tiết kỳ thi và bấm Tiếp tục bài làm.
2. Xác nhận giữ nguyên lượt thi, trang, đáp án và hạn nộp. Không tăng số lượt thi.
3. Lặp lại với mạng tắt và trang đã có cache.
4. Hoàn tất lượt trên thiết bị khác sau khi mở chi tiết; bấm tiếp tục phải mở kết quả, không tạo lượt mới.
5. Quay lại chi tiết sau khi nộp: không còn nút tiếp tục lượt đã hoàn tất.

Trang chưa tải vẫn cần mạng; các màn hình danh sách khóa học/kỳ thi chưa có cache offline. Quy tắc giám sát ngăn rời màn hình khi đang làm vẫn được giữ nguyên.
