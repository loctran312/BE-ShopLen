# BE-ShopLen

Backend API cho hệ thống thương mại điện tử **ShopLen** - cửa hàng bán sợi len và phụ kiện đan móc trực tuyến.

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng](#tính-năng)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)
- [API Documentation](#api-documentation)
- [Cấu trúc dự án](#cấu-trúc-dự-án)

---

## Giới thiệu

**BE-ShopLen** là RESTful API backend được xây dựng bằng Node.js và Express, phục vụ cho ứng dụng thương mại điện tử bán sợi len và phụ kiện đan móc. Hệ thống hỗ trợ đầy đủ các tính năng từ quản lý người dùng, sản phẩm, giỏ hàng, đơn hàng cho đến các tính năng đặc biệt như Workshop, Voucher và Vòng quay may mắn.

### Công nghệ sử dụng

| Công nghệ | Phiên bản | Mô tả |
|-----------|-----------|-------|
| Node.js | >= 16.x | Runtime environment |
| Express | 5.x | Web framework |
| PostgreSQL | >= 13.x | Cơ sở dữ liệu |
| JWT | - | Xác thực người dùng |
| Bcrypt | - | Mã hóa mật khẩu |
| Resend | - | Gửi email OTP |
| ImgBB | - | Lưu trữ hình ảnh |

---

## Tính năng

### Đã hoàn thành

| Tính năng | Mô tả |
|-----------|-------|
| **Xác thực người dùng** | Đăng ký, đăng nhập, đăng xuất, refresh token |
| **Google OAuth 2.0** | Đăng nhập bằng tài khoản Google |
| **Quên mật khẩu** | Gửi OTP qua email, xác thực OTP, đặt lại mật khẩu |
| **Quản lý người dùng** | CRUD người dùng, đổi mật khẩu, cập nhật thông tin |
| **Phân quyền** | Customer và Admin roles |
| **Danh mục sản phẩm** | Cấu trúc dạng cây (multi-level), CRUD danh mục |
| **Sản phẩm & Biến thể** | Quản lý sản phẩm, biến thể (màu, size), giá, SKU |
| **Tồn kho** | Quản lý số lượng tồn kho, cập nhật tăng/giảm |
| **Hình ảnh sản phẩm** | Upload ảnh lên ImgBB, sắp xếp thứ tự hiển thị |
| **Giỏ hàng** | Thêm, sửa, xóa, đồng bộ giỏ hàng |
| **Địa điểm** | Danh sách tỉnh/thành và phường/xã |
| **Voucher** | Áp dụng mã giảm giá (theo % hoặc số tiền cố định) |
| **Khuyến mãi** | Chương trình khuyến mãi theo sản phẩm |
| **Đơn hàng** | Tạo đơn, cập nhật trạng thái, lịch sử đơn hàng |

### Đang phát triển

| Tính năng | Mô tả |
|-----------|-------|
| **Thanh toán** | Tích hợp COD và MoMo payment gateway |
| **Workshop** | Quản lý lớp học đan móc trực tiếp |
| **Danh sách yêu thích** | Wishlist với thông báo giảm giá/hàng về |

### Kế hoạch phát triển

| Tính năng | Mô tả |
|-----------|-------|
| **Điểm tích lũy** | Hệ thống loyalty points cho khách hàng thân thiết |
| **Vòng quay may mắn** | Minigame spin to win voucher/điểm thưởng |
| **Hoàn tiền** | Xử lý yêu cầu hoàn tiền |
| **Thông báo** | Push notification cho các sự kiện |

---

## Yêu cầu hệ thống

- **Node.js** >= 16.x
- **PostgreSQL** >= 13.x
- **npm** >= 8.x hoặc **yarn** >= 1.22

---

## Cài đặt

### 1. Tải mã nguồn

```bash
# Clone repository
git clone https://github.com/loctran312/BE-ShopLen.git

# Di chuyển vào thư mục dự án
cd BE-ShopLen
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Thiết lập cơ sở dữ liệu

Tạo database PostgreSQL và chạy file `shoplen.sql`:

```bash
# Tạo database
createdb shoplen

# Import schema và dữ liệu mẫu
psql -d shoplen -f shoplen.sql
```

Hoặc sử dụng công cụ GUI như pgAdmin hoặc DBeaver để import file `shoplen.sql`.

---

## Cấu hình

### File `.env`

Tạo file `.env` từ template `env.example`:

```bash
cp env.example .env
```

Cập nhật các biến môi trường trong file `.env`:

```env
# ===== SERVER CONFIGURATION =====
PORT=3000
NODE_ENV=development

# ===== DATABASE CONFIGURATION =====
# Option 1: Dùng connection string đầy đủ (khuyên dùng cho production)
DATABASE_URL=postgresql://user:password@host:5432/shoplen

# Option 2: Dùng từng biến riêng (cho local development)
DB_USER=your-db-username
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shoplen

# ===== JWT CONFIGURATION =====
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# ===== FRONTEND URL =====
FRONTEND_URL=http://localhost:5173

# ===== GOOGLE OAUTH =====
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_FRONTEND_REDIRECT_URI=http://localhost:5173/login

# ===== EMAIL (RESEND) =====
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM="ShopLen <noreply@yourdomain.com>"

# ===== PASSWORD RESET OTP =====
PASSWORD_RESET_OTP_EXPIRY_MINUTES=10

# ===== PRODUCT IMAGES (ImgBB) =====
IMGBB_API_KEY=your-imgbb-api-key
```

### Lấy API keys

| Service | Cách lấy |
|---------|----------|
| **Google OAuth** | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| **Resend** | [Resend Dashboard](https://resend.com/api-keys) |
| **ImgBB** | [ImgBB API](https://api.imgbb.com/) |

---

## Hướng dẫn sử dụng

### Khởi động server

```bash
# Chế độ development (auto-reload)
npm run dev

# Chế độ production
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

### Kiểm tra kết nối

```bash
# Health check
curl http://localhost:3000/health

# API info
curl http://localhost:3000/
```


### Tài khoản mẫu

Sau khi import `shoplen.sql`, bạn có thể sử dụng:

| Role | Email | Username | Password |
|------|-------|----------|----------|
| Admin | admin@gmail.com | admin2 | `Admin@123` |
| Customer | khachhang3@gmail.com | user03 | `Admin@123` |

> Lưu ý: Mật khẩu mặc định đã được hash bằng bcrypt.

---

## API Documentation

### Truy cập documentation

Sau khi chạy server, truy cập:

- **HTML Docs**: `http://localhost:3000/api/docs`
- **JSON Spec**: `http://localhost:3000/api/docs.json`

## Cấu trúc dự án

```
BE-ShopLen/
├── src/
│   ├── app.js                    # Express app configuration
│   ├── server.js                 # Entry point
│   ├── config/
│   │   ├── db.js                 # PostgreSQL connection pool
│   │   └── env.js                # Environment variables loader
|   |
│   ├── routes/                   # API route definitions
|   |
│   ├── controllers/              # Request handlers & business logic
│   │
│   ├── repositories/             # Database query functions
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js     # JWT verification & role check
│   │   └── errorMiddleware.js    # Global error handler
│   ├── services/
│   │   └── otpService.js         # Email OTP service (Resend)
│   ├── utils/
│   │   └── imgbb.js              # Image upload utility
│   └── docs/
│       └── apiDocs.js            # API documentation generator
├── shoplen.sql                   # Database schema & sample data
├── env.example                   # Environment template
├── package.json
└── README.md
```

### Kiến trúc

Dự án tuân theo mô hình **Layered Architecture**:

```
Routes → Controllers → Repositories → Database
              ↓
           Services
              ↓
            Utils
```

- **Routes**: Định nghĩa endpoints và HTTP methods
- **Controllers**: Xử lý request, validate, gọi business logic
- **Repositories**: Tương tác trực tiếp với database
- **Services**: Logic nghiệp vụ phức tạp (gửi email, upload ảnh)
- **Middlewares**: Xác thực, phân quyền, xử lý lỗi

---

## License

ISC

---

## Tác giả

- **GitHub**: [loctran312](https://github.com/loctran312)
