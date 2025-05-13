# Hướng dẫn khắc phục lỗi Quản lý Liên hệ trong Admin

## Vấn đề hiện tại
Hiện tại hệ thống đang gặp lỗi khi tải danh sách liên hệ trong trang quản trị Admin, với thông báo "Không thể tải danh sách liên hệ" và lỗi 403 Forbidden.

## Các bước kiểm tra và khắc phục

### Bước 1: Kiểm tra xác thực Admin
Truy cập trang kiểm tra xác thực admin mới:
```
http://localhost:3000/admin-auth-test
```

Trang này sẽ hiển thị thông tin về token admin, thông tin người dùng và trạng thái xác thực. Đảm bảo bạn đã đăng nhập với tài khoản admin và token còn hiệu lực.

### Bước 2: Kiểm tra các API
Trên trang kiểm tra admin:
1. Nhấn nút "Kiểm tra API Contacts" để thử kết nối với API liên hệ
2. Nhấn nút "Kiểm tra API Auth" để kiểm tra API xác thực

### Bước 3: Đăng nhập lại nếu cần thiết
Nếu kết quả kiểm tra cho thấy token đã hết hạn hoặc không hợp lệ:
1. Nhấn nút "Đăng nhập lại" trên trang kiểm tra
2. Đăng nhập với tài khoản admin
3. Sau khi đăng nhập thành công, kiểm tra lại bằng cách quay lại trang kiểm tra

### Bước 4: Quay lại trang quản lý liên hệ
Sau khi đã đăng nhập thành công và xác thực hoạt động bình thường:
1. Nhấn nút "Quay lại quản lý liên hệ" trên trang kiểm tra
2. Kiểm tra xem danh sách liên hệ đã hiển thị đúng chưa

## Các cải tiến đã thực hiện
- Thêm xác thực toàn cục cho Axios trong quản lý liên hệ admin
- Cải thiện quản lý token JWT trong ứng dụng
- Thêm kiểm tra kép về quyền admin trong controller
- Bổ sung các thông báo lỗi chi tiết để dễ gỡ lỗi

## Nếu vẫn gặp lỗi
Nếu sau các bước trên vẫn gặp lỗi, vui lòng kiểm tra Console trong trình duyệt (F12) để xem thông báo lỗi chi tiết và liên hệ với đội phát triển.
