# Ứng dụng Di động Thi Trực tuyến (Online Exam Mobile App) - MekoEdu

Dự án phát triển ứng dụng di động thi trực tuyến tích hợp trực tiếp với hệ thống **Moodle LMS** thông qua **Moodle Web Services REST API**, hỗ trợ sinh viên làm bài thi trắc nghiệm và tự luận theo thời gian thực (_real-time_), chấm điểm tự động và tích hợp các cơ chế giám sát phòng thi.

---

## Thông tin tổng quan dự án

- **Mô tả:** Xây dựng ứng dụng di động cho phép đồng bộ kỳ thi, ngân hàng câu hỏi, đề thi và nộp bài thi an toàn, ổn định từ Moodle LMS.
- **Thời gian thực hiện:** 12 tuần
- **Quy mô đội ngũ:** 2 thành viên
- **Tech Stack:**
  - **Framework:** React Native (Expo Managed Workflow)
  - **Language:** TypeScript
  - **Navigation:** React Navigation
  - **Networking:** Axios (giao tiếp Moodle Web Services REST API)
  - **Local Storage:** AsyncStorage (hỗ trợ lưu trữ cache bài thi offline)

---

## Các tính năng và mục tiêu cốt lõi

1. **Moodle Integration:**
   - Kết nối và khai thác Moodle Core Web Services thông qua Token Authentication.
   - Đồng bộ danh sách kỳ thi, ngân hàng câu hỏi, đề thi và luồng nộp bài hoàn chỉnh.
2. **Core Exam Engine:**
   - Hỗ trợ đa dạng các dạng câu hỏi: Trắc nghiệm (Single/Multiple choice), Đúng/Sai, Điền từ, và Tự luận kèm ảnh.
   - Tích hợp đồng hồ đếm ngược thời gian _real-time_ và cơ chế tự động lưu nháp liên tục (_Auto-save draft_).
3. **Giám sát phòng thi & Khả năng chịu lỗi (Proctoring & Offline Resiliency):**
   - **Anti-Cheating cơ bản:** Phát hiện và ghi vết khi thí sinh rời màn hình/chuyển ứng dụng, đếm số lần vi phạm và chặn chụp màn hình (_Flag Secure_).
   - **Offline Resiliency:** Xử lý rủi ro mất kết nối Internet trong lúc thi bằng cơ chế caching cục bộ, tự động khôi phục phiên thi và đồng bộ bài làm lên Moodle khi có mạng trở lại.
4. **Grade & Analytics:**
   - Xem kết quả thi tức thì cho bài trắc nghiệm, hiển thị đáp án chi tiết, điểm số và thống kê lịch sử làm bài.

---

## Hướng dẫn Cài đặt & Khởi chạy Chi tiết

### 1. Yêu cầu hệ thống trước khi bắt đầu

- Đã cài đặt **Node.js** (phiên bản LTS khuyến nghị).
- Đã cài đặt **Git** để quản lý mã nguồn.
- Đã cài đặt **Android Studio** (nếu chạy máy ảo Android) hoặc cài đặt ứng dụng **Expo Go** trên điện thoại di động thực tế.

### 2. Các lệnh cài đặt Dependencies

Sau khi clone repository của dự án về máy tính cá nhân, bạn mở Terminal tại thư mục gốc của dự án và chạy lệnh sau để tải toàn bộ các thư viện cần thiết:

```bash
npm install
```

1. Nhóm Điều hướng (Navigation & Screens):

```bash
npm install @react-navigation/native @react-navigation/stack
npx expo install react-native-screens react-native-safe-area-context
```

2. Nhóm Giao tiếp API:

```bash
npm install axios
```

3. Nhóm Lưu trữ cục bộ (Dùng để lưu Token Moodle):

```bash
npx expo install @react-native-async-storage/async-storage
```

4. Nhóm Biểu tượng và Cử chỉ (Icons & Gestures):

```bash
npm install react-native-vector-icons
npx expo install react-native-gesture-handler
```

### 3. Các lệnh khởi chạy ứng dụng (Development)

Tùy theo nhu cầu kiểm thử, bạn có thể lựa chọn một trong hai trường hợp khởi chạy dưới đây:

- **Trường hợp 1: Chạy nhanh qua ứng dụng Expo Go (Khuyên dùng khi test giao diện, logic nhanh trên điện thoại thật)**

  ```bash
  npx expo start
  ```

- **Trường hợp 2: Chạy trực tiếp trên máy ảo Android / Development Build (Dùng khi test các module native, custom native code hoặc build file APK/IPA)**

  ```bash
  npx expo run:android
  ```
