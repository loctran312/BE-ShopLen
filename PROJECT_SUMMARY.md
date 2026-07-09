# PROJECT_SUMMARY.md — BE-ShopLen

## 1. Project Overview

**BE-ShopLen** is a RESTful API backend built with **Node.js + Express 5 + PostgreSQL**, serving an e-commerce platform for yarn and knitting/crochet accessories. The system covers the full spectrum of features from user authentication, product management, cart, orders, payments (COD + MoMo), to specialized features like Workshops, Lucky Spin, Loyalty Points, and a shipping/delivery system for shippers.

- **Repository**: [github.com/loctran312/BE-ShopLen](https://github.com/loctran312/BE-ShopLen)
- **Runtime**: Node.js >= 16.x
- **Database**: PostgreSQL >= 13.x
- **API Docs**: Swagger UI at `/api/docs`

---

## 2. System Architecture

### 2.1. Layered Architecture

```
HTTP Request
    |
    v
[Routes] ---- Endpoint definitions, Swagger annotations
    |
    v
[Middlewares] ---- requireAuth, requireAdmin, requireShipper, error handler
    |
    v
[Controllers] ---- Validate input, call Repository/Service, return response
    |
    v
[Repositories] ---- Direct PostgreSQL queries (raw SQL via pg)
    |
    v
[Database] ---- PostgreSQL (Vietnamese tables + English Compatibility Views)
```

### 2.2. Layer Details

| Layer | Directory | Responsibility |
|---|---|---|
| **Routes** | `src/routes/` | Endpoint definitions, HTTP methods, Swagger JSDoc |
| **Middlewares** | `src/middlewares/` | JWT verification, role-based access (admin/shipper/auth), global error handler |
| **Controllers** | `src/controllers/` | Parse request, validate, call repository/service, format response |
| **Repositories** | `src/repositories/` | Direct SQL queries, transaction management, complex business logic |
| **Services** | `src/services/` | External integrations: MoMo payment, Resend email (OTP + notifications) |
| **Utils** | `src/utils/` | ImgBB upload, pagination helper |
| **Config** | `src/config/` | DB pool, env loader, Swagger setup |
| **Docs** | `src/docs/` | Custom HTML API docs generator |

### 2.3. Data Flow

```
Client -> Express (CORS, JSON parser) -> Route -> Middleware (auth) -> Controller
    Controller -> Repository (SQL query via pg pool)
    Controller -> Service (MoMo / Resend) -> External API
    Controller -> Response (JSON)
```

---

## 3. Technology Stack

| Library | Version | Purpose |
|---|---|---|
| `express` | 5.2.1 | Web framework |
| `pg` | 8.13.3 | PostgreSQL client (connection pool) |
| `bcrypt` | 6.0.0 | Password hashing (salt rounds = 10) |
| `jsonwebtoken` | 9.0.3 | JWT access + refresh tokens |
| `axios` | 1.18.0 | MoMo API calls (create payment, refund, verify IPN) |
| `resend` | 6.11.0 | Email OTP + wishlist notifications |
| `cors` | 2.8.6 | Cross-origin resource sharing |
| `dotenv` | 17.4.1 | Environment variables |
| `swagger-jsdoc` | 6.3.0 | Generate OpenAPI spec from JSDoc |
| `swagger-ui-express` | 5.0.1 | Serve Swagger UI |

---

## 4. Data Model (Database Schema)

### 4.1. Design Approach

- **Base tables use Vietnamese names** (e.g., `nguoi_dung`, `san_pham`, `don_hang`) — serve business logic
- **Compatibility Views use English names** (e.g., `users`, `products`, `orders`) — map column names for code readability
- Each view SELECTs from the base table with column aliases (e.g., `nguoi_dung_id AS user_id`)

### 4.2. Core Tables

| Table (Vietnamese) | View (English) | Purpose |
|---|---|---|
| `nguoi_dung` | `users` | Users (customer, admin, shipper) |
| `ma_dat_lai_mat_khau` | `password_reset_tokens` | Password reset OTP |
| `nguoi_dung_xac_thuc` | `user_auth_provider` | OAuth providers (local, google) |
| `danh_muc` | `categories` | Product categories (self-referencing tree) |
| `loai_san_pham` | `product_types` | Product types (product, workshop) |
| `san_pham` | `products` | Products |
| `bien_the_san_pham` | `product_variants` | Variants (color, size, SKU, price) |
| `ton_kho` | `inventory` | Stock per variant |
| `lich_su_ton_kho` | `inventory_history` | Stock movement history |
| `hinh_anh_bien_the` | `variant_images` | Variant images |
| `hoi_thao` | `workshops` | Workshops |
| `hoi_thao_bien_the` | `workshop_variants` | Workshop sessions |
| `gio_hang` | `cart` | Per-user cart |
| `phieu_giam_gia` | `vouchers` | Discount vouchers |
| `nguoi_dung_phieu_giam_gia` | `user_vouchers` | User saved vouchers |
| `khuyen_mai` | `promotions` | Product promotions |
| `tinh_thanh` | `cities` | Provinces/cities |
| `phuong_xa` | `wards` | Wards/districts |
| `don_hang` | `orders` | Orders |
| `chi_tiet_don_hang` | `order_details` | Order line items |
| `lich_su_trang_thai_don_hang` | `order_status_history` | Order status history |
| `thanh_toan` | `payments` | Payments (COD, MoMo) |
| `hoan_tien` | `refunds` | Refunds |
| `diem_tich_luy` | `loyalty_points` | Loyalty points |
| `lich_su_diem` | — | Point transaction history |
| `danh_sach_yeu_thich` | `wishlist` | Wishlist |
| `thong_bao_yeu_thich` | `wishlist_notifications` | Price drop / back-in-stock alerts |
| `luot_quay` | `spin_turns` | Spin turns per user |
| `cau_hinh_qua_quay` | `spin_reward_config` | Spin reward configuration |
| `lich_su_quay` | `spin_history` | Spin history |
| `thong_tin_shipper` | — | Shipper extended info |
| `phan_cong_giao_hang` | — | Delivery assignments |
| `muc_doi_diem` | — | Point redemption tiers |

### 4.3. Key Constraints

- `don_hang.trang_thai`: `pending`, `processing`, `shipping`, `completed`, `cancelled`
- `thanh_toan.phuong_thuc`: `COD`, `MOMO`
- `thanh_toan.trang_thai`: `pending`, `paid`, `failed`, `refunded`
- `phieu_giam_gia.kieu_giam_gia`: `percent`, `fixed`, `free_ship`
- `lich_su_ton_kho.loai_giao_dich`: `nhap_kho`, `xuat_ban`, `hoan_tra`, `kiem_kho`, `khac`
- `cau_hinh_qua_quay.ty_le_thang`: NUMERIC(5,2), 0–100 (total win rate across system <= 100%)
- `don_hang.idempotency_key`: UNIQUE — prevents duplicate order creation

---

## 5. System Features

### 5.1. Authentication & Users

- **Registration**: Email + username + password (regex: >= 8 chars, uppercase + lowercase + digit + special)
- **Login**: Email + password, returns access_token (JWT) + refresh_token
- **Refresh token rotation**: Each refresh issues a new token; old token is revoked
- **Google OAuth 2.0**: Authorization code flow with JWT state token (10 min), auto-links or creates user
- **Forgot password**: 3-step flow — send OTP email (Resend) -> verify OTP -> reset password (reset session token 15 min)
- **Role-based access**: `customer`, `admin`, `shipper` — middleware `requireAuth`, `requireAdmin`, `requireShipper`
- **Logout**: Clears refresh token, sets status = inactive

### 5.2. Products & Categories

- **Categories**: Self-referencing tree (parent_category_id), auto-generated slug, unique normalized name
- **Products**: Belong to product_type + category, have status (active/inactive)
- **Variants**: Color, size, SKU (unique), slug (unique), price
- **Inventory**: 1:1 with variant, stock_quantity >= 0
- **Stock history**: Records every transaction (nhap_kho, xuat_ban, hoan_tra, kiem_kho)
- **Images**: Uploaded to ImgBB, display order sortable
- **Filtering**: Multi-criteria (recursive child categories, price, type)

### 5.3. Cart & Orders

- **Cart**: Per-user, real-time stock validation, sync from localStorage
- **Order creation**: From cart or "Buy Now" (bypass cart)
- **Idempotency**: `idempotency_key` UNIQUE prevents duplicate orders
- **Order status**: pending -> processing -> shipping -> completed (or cancelled)
- **Status history**: Every change recorded
- **Payments**:
  - **COD**: Pay on delivery
  - **MoMo**: Create payment URL, receive IPN webhook, verify HMAC-SHA256 signature
- **Refunds**: Call MoMo refund API, record in hoan_tien table
- **Loyalty points**: 1 point / 10,000 VND on completed orders (COD and MoMo)

### 5.4. Workshops

- Special product type (`loai_san_pham_id = 3`)
- Each workshop has multiple **sessions** (session = variant)
- Session fields: date, start time, end time, capacity, status (open/closed/cancelled)
- Workshops require MoMo payment
- Users view "my-workshops" by status (upcoming, ongoing, past)

### 5.5. Shipping System (Shipper)

- Admin creates shipper accounts, assigns working city
- Shippers view available orders (matched by city)
- Accept orders (FOR UPDATE to prevent race conditions)
- Confirm delivery success / failure (with proof image)
- Collect COD, award loyalty points on successful delivery
- View delivery history

### 5.6. Loyalty & Spin

- **Loyalty points**: Earned from orders (earn), deducted on voucher redemption (redeem), refunded (refund)
- **Point redemption**: Tiers linked to vouchers, checks sufficient points
- **Point history**: Every transaction recorded
- **Lucky Spin**:
  - Each user gets 3 turns (admin can reset)
  - Weighted random based on ty_le_thang (total <= 100%)
  - Rewards: voucher, points, or none (miss)
  - Limited quantity per reward (so_luong_con_lai)
  - Admin manages config, add/edit/toggle

### 5.7. Vouchers & Promotions

- **Vouchers**: percent, fixed, free_ship — with minimum_value, max_discount, quantity, expiry
- **Product vouchers**: Apply to specific products/variants
- **Save voucher**: Users save to personal wallet
- **Apply voucher**: Validate conditions, return discount amount
- **Promotions**: Per-product, with start/end dates, active/inactive status

### 5.8. Wishlist & Notifications

- Toggle product wishlist
- Auto-records events:
  - **price_drop**: Product price decreased
  - **back_in_stock**: Product restocked
- Admin triggers email notifications (Resend) for unsent events

### 5.9. Admin Dashboard

- **Revenue**: Today / this week / this month + growth % vs last week
- **Revenue chart**: Last 7 days
- **Orders**: Count by status (pending, processing, shipping, completed)
- **Workshops**: Today's bookings, upcoming, top workshops
- **Users**: Active customers, active shippers, new this month
- **Inventory alerts**: Out of stock / low stock
- **Top selling products**: By quantity sold

### 5.10. Inventory Management

- Overview with filters (keyword, stock_status)
- Stock history per variant
- Adjust: nhap_kho (increment), kiem_kho (set absolute), xuat_ban (decrement)

---

## 6. API Endpoints Overview

All endpoints are prefixed with `/api`.

### 6.1. Auth (`/api/auth`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Register |
| POST | `/login` | Public | Login |
| POST | `/refresh-token` | Public | Refresh access token |
| POST | `/logout` | Auth | Logout |
| GET | `/me` | Auth | Current user info |
| POST | `/forgot-password` | Public | Send OTP email |
| POST | `/verify-reset-otp` | Public | Verify OTP |
| POST | `/reset-password` | Public | Reset password |
| GET | `/google` | Public | Start Google OAuth |
| GET | `/google/callback` | Public | Google OAuth callback |

### 6.2. Users (`/api/users`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Admin | List users |
| GET | `/:id` | Admin | User detail |
| POST | `/` | Admin | Create user |
| PUT | `/:id` | Admin | Update user |
| PUT | `/user/me` | Auth | Update own profile |
| DELETE | `/:id` | Admin | Delete user |
| POST | `/change-password` | Auth | Change password |
| POST | `/filter` | Admin | Filter users |

### 6.3. Categories (`/api/categories`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List categories (tree) |
| GET | `/:id` | Public | Category detail |
| POST | `/` | Admin | Create category |
| PUT | `/:id` | Admin | Update category |
| DELETE | `/:id` | Admin | Delete category |
| POST | `/filter` | Admin | Filter categories |

### 6.4. Products (`/api/products`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List products |
| GET | `/types` | Public | List product types |
| GET | `/top-selling` | Public | Top selling products |
| POST | `/filter` | Public | Filter products |
| GET | `/:id` | Public | Product detail |
| POST | `/` | Admin | Create product |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Delete product |

### 6.5. Variants (`/api/variants`)

| Method | Path | Access | Description |
|---|---|---|---|
| DELETE | `/:id` | Admin | Delete variant |

### 6.6. Cart (`/api/cart`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Auth | Get cart |
| POST | `/` | Auth | Add to cart |
| POST | `/sync` | Auth | Sync from localStorage |
| PUT | `/:variant_id` | Auth | Update quantity |
| DELETE | `/:variant_id` | Auth | Remove item |

### 6.7. Orders (`/api/orders`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/` | Auth | Create order from cart |
| POST | `/buy-now` | Auth | Buy now (bypass cart) |
| GET | `/shipping-fees` | Auth | Shipping fee list |
| GET | `/my-orders` | Auth | My orders (filter by tab/type) |
| GET | `/my-orders/:id` | Auth | Order detail |
| POST | `/my-orders/:id/cancel` | Auth | Cancel order (auto MoMo refund) |
| POST | `/repurchase/:id` | Auth | Repurchase (add to cart) |
| GET | `/admin/all` | Admin | All orders |
| GET | `/admin/:id` | Admin | Order detail |
| PUT | `/admin/:id/status` | Admin | Update order status |
| POST | `/admin/filter` | Admin | Filter orders |

### 6.8. Payment (`/api/payment`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/momo/ipn` | Public | MoMo IPN webhook |
| GET | `/momo/return` | Public | MoMo redirect after payment |
| POST | `/refund/:orderId` | Admin | Process refund |

### 6.9. Workshops (`/api/workshops`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/filter` | Public | Filter workshops |
| GET | `/my-workshops` | Auth | My workshops |
| GET | `/:id` | Public | Workshop detail |
| POST | `/` | Admin | Create workshop |
| PUT | `/:id` | Admin | Update workshop |
| DELETE | `/:id` | Admin | Delete workshop |

### 6.10. Shippers (`/api`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/admin/shippers` | Admin | List shippers |
| POST | `/admin/shippers` | Admin | Create shipper |
| PATCH | `/admin/shippers/:id/status` | Admin | Update shipper status |
| PUT | `/admin/shippers/:id/location` | Admin | Reassign working city |
| GET | `/shipper/profile` | Shipper | Shipper profile |
| PUT | `/shipper/profile` | Shipper | Update profile |
| GET | `/shipper/available-orders` | Shipper | Available orders |
| PUT | `/shipper/orders/:id/accept` | Shipper | Accept order |
| PUT | `/shipper/orders/:id/delivery-status` | Shipper | Update delivery status |
| GET | `/shipper/my-deliveries` | Shipper | Delivery history |
| GET | `/shipper/orders/:id` | Shipper | Delivery detail |

### 6.11. Loyalty (`/api/loyalty`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/admin/rewards` | Admin | Create reward tier |
| GET | `/admin/rewards` | Admin | List reward tiers |
| PUT | `/admin/rewards/:id/status` | Admin | Toggle reward status |
| DELETE | `/admin/rewards/:id` | Admin | Delete reward tier |
| GET | `/rewards` | Auth | Available rewards |
| GET | `/history` | Auth | Point history |
| POST | `/redeem` | Auth | Redeem points for voucher |

### 6.12. Spin (`/api/spin`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/info` | Auth | Spin info |
| POST | `/play` | Auth | Play spin |
| GET | `/history` | Auth | Spin history |
| GET | `/admin/configs` | Admin | Reward configs |
| POST | `/admin/configs` | Admin | Add reward |
| POST | `/admin/add-turns` | Admin | Add turns to all users |
| PUT | `/admin/configs/:id` | Admin | Update config |
| DELETE | `/admin/configs/:id` | Admin | Delete config |

### 6.13. Vouchers (`/api/vouchers`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Active vouchers |
| POST | `/apply` | Auth | Apply voucher |
| POST | `/save` | Auth | Save voucher |
| GET | `/my-vouchers` | Auth | My saved vouchers |
| GET | `/vouchers` | Admin | All vouchers |
| GET | `/vouchers/:id` | Admin | Voucher detail |
| POST | `/vouchers` | Admin | Create voucher |
| PUT | `/vouchers/:id` | Admin | Update voucher |
| DELETE | `/vouchers/:id` | Admin | Delete voucher |
| POST | `/vouchers/filter` | Admin | Filter vouchers |

### 6.14. Promotions (`/api/promotions`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Active promotions |
| GET | `/:id` | Public | Promotion detail |
| GET | `/promotions/all` | Admin | All promotions |
| POST | `/promotions` | Admin | Create promotion |
| PUT | `/promotions/:id` | Admin | Update promotion |
| DELETE | `/promotions/:id` | Admin | Delete promotion |
| POST | `/promotions/filter` | Admin | Filter promotions |

### 6.15. Wishlist (`/api/wishlist`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/toggle` | Auth | Toggle wishlist |
| GET | `/` | Auth | My wishlist |
| POST | `/trigger-emails` | Admin | Send notification emails |

### 6.16. Inventory (`/api/inventory`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/overview` | Admin | Inventory overview |
| GET | `/:variant_id/history` | Admin | Stock history |
| POST | `/adjust` | Admin | Adjust stock |

### 6.17. Location (`/api/location`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/cities` | Public | List cities |
| GET | `/cities/:city_code/wards` | Public | Wards by city |

### 6.18. Dashboard (`/api/admin/dashboard`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Admin | System overview |

---

## 7. Security

### 7.1. Authentication

- **JWT**: Access token (1d default) + Refresh token (7d default), secret from `JWT_SECRET`
- **Password hashing**: bcrypt, salt rounds = 10
- **Password policy**: >= 8 chars, uppercase + lowercase + digit + special character
- **Google OAuth**: State token = JWT (10 min expiry), verify audience + issuer + email_verified
- **OTP**: 6 digits, bcrypt hash, 10 min expiry, max attempts, marked used after reset

### 7.2. Authorization

3 roles: `customer`, `admin`, `shipper` — middleware chain `requireAuth` -> `requireAdmin` / `requireShipper`

### 7.3. MoMo Payment Security

- **Signature**: HMAC-SHA256 with secretKey
- **IPN verification**: Verify signature from MoMo webhook before processing
- **Refund**: Separate refundOrderId, verify signature

---

## 8. External Integrations

| Service | Purpose | Environment Variables |
|---|---|---|
| **MoMo** | Payment + refund | `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`, `MOMO_API_ENDPOINT`, `MOMO_REFUND_ENDPOINT`, `MOMO_REDIRECT_URL`, `MOMO_IPN_URL` |
| **Resend** | Email OTP + wishlist notifications | `RESEND_API_KEY`, `RESEND_API_KEY_1` (backup), `RESEND_FROM` |
| **ImgBB** | Product image upload | `IMGBB_API_KEY` |
| **Google OAuth** | Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_FRONTEND_REDIRECT_URI` |

---

## 9. Environment Configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` / `DB_NAME` | — | PostgreSQL credentials (if not using DATABASE_URL) |
| `JWT_SECRET` | — | JWT signing secret |
| `JWT_EXPIRES_IN` | 1d | Access token expiry |
| `JWT_REFRESH_EXPIRES_IN` | 7d | Refresh token expiry |
| `FRONTEND_URL` | http://localhost:5173 | CORS origin |
| `PASSWORD_RESET_OTP_EXPIRY_MINUTES` | 10 | OTP expiry |
| `PASSWORD_RESET_SESSION_EXPIRES_IN` | 15m | Reset session token expiry |
| `GOOGLE_OAUTH_STATE_EXPIRES_IN` | 10m | Google state token expiry |

---

## 10. Notable Architectural Patterns

### 10.1. Idempotency Key

Orders have a `idempotency_key` UNIQUE field — if a client retries with the same key, no duplicate order is created.

### 10.2. Optimistic Locking (FOR UPDATE)

Critical transactions use `SELECT ... FOR UPDATE` to prevent race conditions:
- Shipper accepting orders (prevents two shippers accepting the same order)
- Playing lucky spin (prevents double-winning)
- Order creation (stock validation)

### 10.3. Compatibility Views

Base tables use Vietnamese names, but code queries through English views — improves code readability without changing the schema.

### 10.4. Resend API Key Fallback

OTP service has 2 API keys (`RESEND_API_KEY` + `RESEND_API_KEY_1`); if the primary key fails, the backup key is tried.

### 10.5. SSL Auto-Detect

Server auto-detects SSL based on hostname (supports Render.com deployment).

---

## 11. Project Structure

```
BE-ShopLen/
├── src/
│   ├── app.js                      # Express app, CORS, route mounting
│   ├── server.js                   # Entry point, SSL auto-detect
│   ├── config/
│   │   ├── db.js                   # PostgreSQL connection pool
│   │   ├── env.js                  # dotenv loader
│   │   └── swagger.js             # Swagger setup
│   ├── routes/                     # 18 route files
│   ├── controllers/                # 18 controller files
│   ├── repositories/               # 18 repository files
│   ├── middlewares/
│   │   ├── authMiddleware.js       # requireAuth, requireAdmin, requireShipper
│   │   └── errorMiddleware.js      # Global error handler
│   ├── services/
│   │   ├── momoService.js          # MoMo payment + refund + IPN verify
│   │   ├── otpService.js           # Email OTP via Resend
│   │   └── notificationService.js  # Wishlist notification emails
│   ├── utils/
│   │   ├── imgbb.js                # ImgBB image upload
│   │   └── pagination.js           # Pagination helper
│   └── docs/
│       └── apiDocs.js              # Custom HTML API docs
├── shoplen.sql                     # Database schema + compatibility views
├── sample_data.sql                 # Sample data
├── env.example                     # Environment template
├── package.json
├── README.md
└── PROJECT_SUMMARY.md              # This file
```
