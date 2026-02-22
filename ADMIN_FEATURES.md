# Hệ Thống Admin - ScamGuard

## Tổng Quan
Hệ thống admin dành cho quản trị viên quản lý nền tảng báo cáo lừa đảo ScamGuard.

---

## 1. Xác Thực & Phân Quyền (Authentication & Authorization)

### 1.1 Đăng nhập Admin
- Trang đăng nhập riêng biệt (`/admin/login`)
- Xác thực email/password
- Hỗ trợ 2FA (Two-Factor Authentication)
- Session management với JWT tokens
- Remember me functionality

### 1.2 Phân quyền người dùng (Role-Based Access Control)
- **Super Admin**: Toàn quyền hệ thống
- **Admin**: Quản lý nội dung, báo cáo
- **Moderator**: Duyệt báo cáo, hỗ trợ người dùng
- **Viewer**: Chỉ xem thống kê, báo cáo

---

## 2. Dashboard (Trang Tổng Quan)

### 2.1 Thống kê tổng quan
- Tổng số báo cáo lừa đảo (theo ngày/tuần/tháng)
- Số báo cáo mới hôm nay
- Số báo cáo đang chờ duyệt
- Số người dùng đăng ký mới
- Số lượng scam đã xác minh

### 2.2 Biểu đồ & Charts
- Biểu đồ đường: Xu hướng báo cáo theo thời gian
- Biểu đồ tròn: Phân loại lừa đảo theo danh mục
- Biểu đồ cột: Top 10 loại lừa đảo phổ biến
- Heatmap: Phân bố lừa đảo theo địa lý

### 2.3 Hoạt động gần đây
- Danh sách 10-20 hoạt động mới nhất
- Báo cáo mới, duyệt báo cáo, người dùng mới
- Cảnh báo hệ thống

---

## 3. Quản Lý Báo Cáo Lừa Đảo

### 3.1 Danh sách báo cáo
- Bảng hiển thị tất cả báo cáo
- Các cột: ID, Loại, Tiêu đề, Người báo cáo, Trạng thái, Ngày tạo
- Bộ lọc: Theo trạng thái, loại lừa đảo, khoảng thời gian
- Tìm kiếm: Theo từ khóa, ID, số điện thoại, website
- Phân trang

### 3.2 Chi tiết báo cáo
- Xem đầy đủ thông tin báo cáo
- Hình ảnh bằng chứng
- Thông tin người báo cáo
- Lịch sử trạng thái

### 3.3 Duyệt/Từ chối báo cáo
- Duyệt báo cáo: Chuyển trạng thái "Đã xác minh"
- Từ chối báo cáo: Lý do từ chối
- Gửi thông báo cho người báo cáo

### 3.4 Chỉnh sửa báo cáo
- Sửa thông tin báo cáo
- Thêm ghi chú admin
- Gắn thẻ phân loại

### 3.5 Xóa báo cáo
- Xóa mềm (soft delete)
- Khôi phục báo cáo đã xóa

---

## 4. Quản Lý Danh Mục Lừa Đảo

### 4.1 Danh sách danh mục
- Các loại lừa đảo: SMS, Email, Website, Cuộc gọi, Mạng xã hội, Ứng dụng, Khác
- Thống kê số báo cáo theo danh mục

### 4.2 Thêm/Sửa/Xóa danh mục
- Form thêm danh mục mới
- Chỉnh sửa tên, mô tả, icon
- Sắp xếp thứ tự hiển thị
- Xóa danh mục (kiểm tra ràng buộc)

---

## 5. Quản Lý Người Dùng

### 5.1 Danh sách người dùng
- Bảng hiển thị tất cả người dùng
- Các cột: ID, Tên, Email, Vai trò, Trạng thái, Ngày đăng ký
- Bộ lọc: Theo vai trò, trạng thái, khoảng thời gian
- Tìm kiếm: Theo tên, email

### 5.2 Chi tiết người dùng
- Thông tin cá nhân
- Lịch sử báo cáo
- Điểm uy tín (reputation score)
- Hoạt động gần đây

### 5.3 Phân quyền người dùng
- Thay đổi vai trò người dùng
- Cấp quyền đặc biệt

### 5.4 Khóa/Mở khóa người dùng
- Khóa tài khoản tạm thời
- Khóa vĩnh viễn
- Lý do khóa
- Gửi email thông báo

---

## 6. Quản Lý Dữ Liệu Lừa Đảo (Scam Database)

### 6.1 Danh sách scam đã xác minh
- Số điện thoại lừa đảo
- Website lừa đảo
- Email lừa đảo
- Tài khoản ngân hàng lừa đảo

### 6.2 Thêm/Sửa/Xóa dữ liệu
- Thêm thủ công dữ liệu lừa đảo
- Import từ file CSV/Excel
- Chỉnh sửa thông tin
- Xóa dữ liệu

### 6.3 Gộp dữ liệu trùng lặp
- Phát hiện dữ liệu trùng
- Gộp các bản ghi tương tự

---

## 7. Quản Lý Nội Dung (Content Management)

### 7.1 Quản lý bài viết Blog
- Danh sách bài viết
- Thêm/Sửa/Xóa bài viết
- Trạng thái: Bản nháp, Đã xuất bản
- Phân loại bài viết

### 7.2 Quản lý FAQ
- Danh sách câu hỏi thường gặp
- Thêm/Sửa/Xóa FAQ
- Sắp xếp thứ tự

### 7.3 Quản lý trang tĩnh
- Trang About, Privacy, Terms, etc.
- Editor WYSIWYG

---

## 8. Thống Kê & Báo Cáo (Analytics & Reports)

### 8.1 Thống kê chi tiết
- Báo cáo theo khoảng thời gian tùy chỉnh
- Xu hướng lừa đảo
- Tỷ lệ xác minh báo cáo
- Thời gian xử lý trung bình

### 8.2 Báo cáo người dùng
- Người dùng hoạt động
- Top người báo cáo
- Tỷ lệ người dùng quay lại

### 8.3 Export dữ liệu
- Xuất báo cáo PDF
- Xuất dữ liệu Excel/CSV
- Lên lịch gửi báo cáo email

---

## 9. Cài Đặt Hệ Thống (Settings)

### 9.1 Cài đặt chung
- Tên website, logo, favicon
- Thông tin liên hệ
- Social media links

### 9.2 Cài đặt email
- SMTP configuration
- Email templates
- Email queue management

### 9.3 Cài đặt bảo mật
- Độ mạnh mật khẩu yêu cầu
- Thời gian session
- IP whitelist cho admin
- Rate limiting

### 9.4 Cài đặt API
- API keys management
- Rate limits
- Webhooks

### 9.5 Cài đặt ngôn ngữ
- Quản lý translations
- Thêm ngôn ngữ mới

---

## 10. Nhật Ký Hệ Thống (Audit Logs)

### 10.1 Activity Logs
- Ghi nhận mọi hành động admin
- Ai làm gì, khi nào, IP nào
- Lọc theo người dùng, hành động, thời gian

### 10.2 System Logs
- Lỗi hệ thống
- Cảnh báo bảo mật
- Performance logs

---

## 11. Thông Báo & Cảnh Báo

### 11.1 Thông báo hệ thống
- Thông báo bảo trì
- Thông báo cập nhật
- Banner thông báo

### 11.2 Cảnh báo tự động
- Cảnh báo khi có spike báo cáo
- Cảnh báo nghi ngờ spam
- Cảnh báo hệ thống quá tải

---

## 12. Hỗ Trợ Người Dùng (Support)

### 12.1 Quản lý feedback
- Danh sách phản hồi người dùng
- Trạng thái: Mới, Đang xử lý, Đã giải quyết
- Phản hồi lại người dùng

### 12.2 Ticket system (optional)
- Tạo ticket hỗ trợ
- Phân công xử lý
- Theo dõi tiến độ

---

## Cấu Trúc Thư Mục Đề Xuất

```
src/app/admin/
├── layout.tsx                 # Admin layout với sidebar
├── page.tsx                   # Dashboard chính
├── login/
│   └── page.tsx              # Trang đăng nhập admin
├── reports/
│   ├── page.tsx              # Danh sách báo cáo
│   ├── [id]/
│   │   └── page.tsx          # Chi tiết báo cáo
│   └── pending/
│       └── page.tsx          # Báo cáo chờ duyệt
├── categories/
│   └── page.tsx              # Quản lý danh mục
├── users/
│   ├── page.tsx              # Danh sách người dùng
│   └── [id]/
│       └── page.tsx          # Chi tiết người dùng
├── scams/
│   ├── page.tsx              # Database lừa đảo
│   ├── phones/
│   │   └── page.tsx          # Số điện thoại lừa đảo
│   ├── websites/
│   │   └── page.tsx          # Website lừa đảo
│   └── emails/
│       └── page.tsx          # Email lừa đảo
├── content/
│   ├── blog/
│   │   └── page.tsx          # Quản lý blog
│   ├── faq/
│   │   └── page.tsx          # Quản lý FAQ
│   └── pages/
│       └── page.tsx          # Quản lý trang tĩnh
├── analytics/
│   └── page.tsx              # Thống kê & báo cáo
├── settings/
│   ├── page.tsx              # Cài đặt chung
│   ├── email/
│   │   └── page.tsx          # Cài đặt email
│   ├── security/
│   │   └── page.tsx          # Cài đặt bảo mật
│   └── api/
│       └── page.tsx          # Cài đặt API
├── logs/
│   ├── activity/
│   │   └── page.tsx          # Nhật ký hoạt động
│   └── system/
│       └── page.tsx          # Nhật ký hệ thống
└── support/
    └── feedback/
        └── page.tsx          # Quản lý feedback

src/app/api/admin/
├── auth/
│   └── route.ts              # API xác thực admin
├── reports/
│   ├── route.ts              # CRUD báo cáo
│   └── [id]/
│       └── route.ts          # Chi tiết báo cáo
├── categories/
│   └── route.ts              # CRUD danh mục
├── users/
│   ├── route.ts              # CRUD người dùng
│   └── [id]/
│       └── route.ts          # Chi tiết người dùng
├── scams/
│   └── route.ts              # CRUD scam database
├── content/
│   ├── blog/
│   │   └── route.ts          # CRUD blog
│   └── faq/
│       └── route.ts          # CRUD FAQ
├── analytics/
│   └── route.ts              # API thống kê
├── settings/
│   └── route.ts              # API cài đặt
├── logs/
│   └── route.ts              # API logs
└── support/
    └── feedback/
        └── route.ts          # API feedback

src/components/admin/
├── AdminLayout.tsx           # Layout wrapper
├── Sidebar.tsx               # Sidebar navigation
├── Header.tsx                # Admin header
├── StatsCard.tsx             # Card thống kê
├── DataTable.tsx             # Bảng dữ liệu
├── FilterBar.tsx             # Thanh lọc
├── Pagination.tsx            # Phân trang
├── Modal/
│   ├── ConfirmModal.tsx      # Modal xác nhận
│   └── FormModal.tsx         # Modal form
├── Forms/
│   ├── ReportForm.tsx        # Form báo cáo
│   ├── CategoryForm.tsx      # Form danh mục
│   └── UserForm.tsx          # Form người dùng
└── Charts/
    ├── LineChart.tsx         # Biểu đồ đường
    ├── PieChart.tsx          # Biểu đồ tròn
    └── BarChart.tsx          # Biểu đồ cột
```

---

## Thứ Tự Triển Khai Đề Xuất

### Phase 1: Cơ bản (Bắt buộc)
1. ✅ Admin Layout & Sidebar
2. ✅ Đăng nhập Admin
3. ✅ Dashboard tổng quan
4. ✅ Quản lý báo cáo (CRUD)
5. ✅ Quản lý danh mục

### Phase 2: Quản lý người dùng
6. ✅ Danh sách người dùng
7. ✅ Chi tiết người dùng
8. ✅ Phân quyền
9. ✅ Khóa/Mở khóa

### Phase 3: Dữ liệu & Nội dung
10. ✅ Scam Database
11. ✅ Quản lý Blog
12. ✅ Quản lý FAQ

### Phase 4: Nâng cao
13. ✅ Thống kê & Báo cáo
14. ✅ Cài đặt hệ thống
15. ✅ Audit Logs
16. ✅ Hỗ trợ người dùng

---

## Lưu Ý Kỹ Thuật

1. **Bảo mật**: Tất cả API admin cần middleware kiểm tra quyền
2. **Validation**: Validate kỹ input từ admin
3. **Soft Delete**: Nên dùng soft delete cho dữ liệu quan trọng
4. **Caching**: Cache thống kê để tối ưu performance
5. **Pagination**: Luôn dùng pagination cho danh sách dài
6. **Audit**: Ghi log mọi hành động quan trọng
