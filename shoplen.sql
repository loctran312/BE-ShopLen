-- =========================
-- NGUOI DUNG
-- =========================
CREATE TABLE nguoi_dung (
  nguoi_dung_id INT PRIMARY KEY,
  thu_dien_tu VARCHAR(100) UNIQUE NOT NULL,
  ten_dang_nhap VARCHAR(50) UNIQUE NOT NULL,
  mat_khau VARCHAR(255),
  ho VARCHAR(50),
  ten VARCHAR(50),
  so_dien_thoai VARCHAR(15),
  vai_tro VARCHAR(20) DEFAULT 'customer',
  trang_thai VARCHAR(20) DEFAULT 'active',
  so_lan_dang_nhap_sai INT DEFAULT 0 CHECK (so_lan_dang_nhap_sai >= 0),
  lan_dang_nhap_cuoi TIMESTAMP,
  refresh_token VARCHAR(255),
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ma_dat_lai_mat_khau (
  ma_id BIGSERIAL PRIMARY KEY,
  nguoi_dung_id INT NOT NULL,
  kenh VARCHAR(20) NOT NULL,
  dia_chi_nhan VARCHAR(100) NOT NULL,
  ma_otp_hash VARCHAR(255) NOT NULL,
  so_lan_thu INT DEFAULT 0 CHECK (so_lan_thu >= 0),
  het_han_luc TIMESTAMP NOT NULL,
  da_su_dung_luc TIMESTAMP,
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(nguoi_dung_id) ON DELETE CASCADE
);

ALTER TABLE ma_dat_lai_mat_khau ADD CONSTRAINT chk_ma_dat_lai_kenh CHECK (
  kenh IN ('email')
);

CREATE INDEX idx_ma_dat_lai_mat_khau_nguoi_dung_kenh_ngay_tao
  ON ma_dat_lai_mat_khau (nguoi_dung_id, kenh, ngay_tao DESC);

CREATE TABLE nguoi_dung_xac_thuc (
  xac_thuc_id SERIAL PRIMARY KEY,
  nguoi_dung_id INT NOT NULL,
  nha_cung_cap VARCHAR(20) NOT NULL,
  nha_cung_cap_id VARCHAR(255),
  UNIQUE(nha_cung_cap, nha_cung_cap_id),
  FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(nguoi_dung_id) ON DELETE CASCADE
);

ALTER TABLE nguoi_dung_xac_thuc ADD CONSTRAINT chk_nha_cung_cap CHECK (
  nha_cung_cap IN ('local','google')
);

-- =========================
-- DANH MUC
-- =========================
CREATE TABLE danh_muc (
  danh_muc_id SERIAL PRIMARY KEY,
  ten_danh_muc VARCHAR(100) UNIQUE NOT NULL,
  mo_ta TEXT,
  danh_muc_cha_id INT,
  hinh_anh VARCHAR(255),
  slug VARCHAR(100) UNIQUE NOT NULL,
  FOREIGN KEY (danh_muc_cha_id) REFERENCES danh_muc(danh_muc_id)
);

CREATE UNIQUE INDEX idx_danh_muc_unique_normalized_name
  ON danh_muc (LOWER(TRIM(ten_danh_muc)));

-- =========================
-- SAN PHAM
-- =========================
CREATE TABLE loai_san_pham (
  loai_san_pham_id SERIAL PRIMARY KEY,
  ten_loai VARCHAR(100) NOT NULL,
  mo_ta TEXT
);

CREATE TABLE san_pham (
  san_pham_id SERIAL PRIMARY KEY,
  loai_san_pham_id INT,
  danh_muc_id INT,
  ten_san_pham VARCHAR(150) NOT NULL,
  mo_ta TEXT,
  trang_thai_san_pham VARCHAR(20) DEFAULT 'active',
  FOREIGN KEY (loai_san_pham_id) REFERENCES loai_san_pham(loai_san_pham_id),
  FOREIGN KEY (danh_muc_id) REFERENCES danh_muc(danh_muc_id)
);

CREATE TABLE bien_the_san_pham (
  bien_the_id SERIAL PRIMARY KEY,
  san_pham_id INT NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  slug VARCHAR(150) UNIQUE NOT NULL,
  gia NUMERIC(10,2) NOT NULL CHECK (gia >= 0),
  mau_sac VARCHAR(50),
  kich_co VARCHAR(50),
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (san_pham_id) REFERENCES san_pham(san_pham_id)
);

CREATE TABLE ton_kho (
  ton_kho_id SERIAL PRIMARY KEY,
  bien_the_id INT NOT NULL,
  so_luong_ton INT DEFAULT 0 CHECK (so_luong_ton >= 0),
  UNIQUE(bien_the_id),
  FOREIGN KEY (bien_the_id) REFERENCES bien_the_san_pham(bien_the_id)
);

CREATE TABLE hinh_anh_bien_the (
  hinh_anh_id SERIAL PRIMARY KEY,
  bien_the_id INT NOT NULL,
  duong_dan_anh VARCHAR(255) NOT NULL,
  thu_tu_hien_thi INT DEFAULT 0,
  FOREIGN KEY (bien_the_id) REFERENCES bien_the_san_pham(bien_the_id)
);

-- =========================
-- WORKSHOP
-- =========================
CREATE TABLE hoi_thao (
  hoi_thao_id SERIAL PRIMARY KEY,
  san_pham_id INT NOT NULL,
  tieu_de VARCHAR(150) NOT NULL,
  mo_ta TEXT,
  dia_diem VARCHAR(255),
  FOREIGN KEY (san_pham_id) REFERENCES san_pham(san_pham_id)
);

CREATE TABLE hoi_thao_bien_the (
  hoi_thao_bien_the_id SERIAL PRIMARY KEY,
  hoi_thao_id INT NOT NULL,
  bien_the_id INT NOT NULL,
  ngay_bat_dau TIMESTAMP NOT NULL,
  ngay_ket_thuc TIMESTAMP NOT NULL,
  trang_thai VARCHAR(20) DEFAULT 'open',
  UNIQUE(hoi_thao_id, bien_the_id),
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hoi_thao_id) REFERENCES hoi_thao(hoi_thao_id),
  FOREIGN KEY (bien_the_id) REFERENCES bien_the_san_pham(bien_the_id)
);

ALTER TABLE hoi_thao_bien_the ADD CONSTRAINT chk_hoi_thao_trang_thai CHECK (
  trang_thai IN ('open','closed','cancelled')
);

-- =========================
-- GIO HANG
-- =========================
CREATE TABLE gio_hang (
  gio_hang_id SERIAL PRIMARY KEY,
  nguoi_dung_id INT NOT NULL,
  bien_the_id INT NOT NULL,
  so_luong INT DEFAULT 1 CHECK (so_luong > 0),
  UNIQUE(nguoi_dung_id, bien_the_id),
  FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(nguoi_dung_id),
  FOREIGN KEY (bien_the_id) REFERENCES bien_the_san_pham(bien_the_id)
);

-- =========================
-- PHIEU GIAM GIA
-- =========================
CREATE TABLE phieu_giam_gia (
  phieu_giam_gia_id SERIAL PRIMARY KEY,
  ma VARCHAR(50) UNIQUE NOT NULL,
  ten_phieu VARCHAR(20),
  kieu_giam_gia VARCHAR(20),
  gia_tri NUMERIC(10,2) CHECK (gia_tri >= 0),
  gia_tri_toi_thieu NUMERIC(10,2),
  giam_toi_da NUMERIC(10,2),
  so_luong INT,
  da_dung INT DEFAULT 0,
  ngay_bat_dau TIMESTAMP,
  ngay_ket_thuc TIMESTAMP
);

ALTER TABLE phieu_giam_gia ADD CONSTRAINT chk_kieu_giam_gia CHECK (
  kieu_giam_gia IN ('percent','fixed')
);

CREATE TABLE nguoi_dung_phieu_giam_gia (
  id SERIAL PRIMARY KEY,
  phieu_giam_gia_id INT NOT NULL,
  nguoi_dung_id INT NOT NULL,
  so_lan_su_dung INT DEFAULT 0,
  UNIQUE(phieu_giam_gia_id, nguoi_dung_id),
  FOREIGN KEY (phieu_giam_gia_id) REFERENCES phieu_giam_gia(phieu_giam_gia_id),
  FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(nguoi_dung_id)
);

CREATE TABLE phieu_giam_gia_san_pham (
  id SERIAL PRIMARY KEY,
  phieu_giam_gia_id INT,
  san_pham_id INT,
  bien_the_id INT,
  FOREIGN KEY (phieu_giam_gia_id) REFERENCES phieu_giam_gia(phieu_giam_gia_id)
);

-- =========================
-- KHUYEN MAI
-- =========================
CREATE TABLE khuyen_mai (
  khuyen_mai_id SERIAL PRIMARY KEY,
  tieu_de VARCHAR(100),
  kieu_giam_gia VARCHAR(20) DEFAULT 'percent' CHECK (kieu_giam_gia IN ('percent','fixed')),
  gia_tri NUMERIC(10,2) NOT NULL,
  gia_tri_don_hang_toi_thieu NUMERIC(10,2) DEFAULT 0,
  ngay_bat_dau TIMESTAMP,
  ngay_ket_thuc TIMESTAMP,
  trang_thai VARCHAR(20) DEFAULT 'active' CHECK (trang_thai IN ('active','inactive')),
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE khuyen_mai_san_pham (
  id SERIAL PRIMARY KEY,
  khuyen_mai_id INT NOT NULL,
  san_pham_id INT,
  bien_the_id INT,
  FOREIGN KEY (khuyen_mai_id) REFERENCES khuyen_mai(khuyen_mai_id)
);

-- =========================
-- TINH THANH
-- =========================
CREATE TABLE tinh_thanh (
  ma_tinh VARCHAR(10) PRIMARY KEY,
  ten_tinh VARCHAR(100) NOT NULL
);

-- =========================
-- PHUONG XA
-- =========================
CREATE TABLE phuong_xa (
  phuong_xa_id SERIAL PRIMARY KEY,
  ten_phuong_xa VARCHAR(100) NOT NULL,
  ma_tinh VARCHAR(10),
  FOREIGN KEY (ma_tinh) REFERENCES tinh_thanh(ma_tinh)
);

-- =========================
-- DON HANG
-- =========================
CREATE TABLE don_hang (
  don_hang_id VARCHAR(25) PRIMARY KEY,
  nguoi_dung_id INT,
  trang_thai VARCHAR(20) DEFAULT 'pending',
  tong_tien NUMERIC(10,2) CHECK (tong_tien >= 0),
  phieu_giam_gia_id INT,
  so_tien_giam NUMERIC(10,2),
  idempotency_key VARCHAR(100) UNIQUE,
  phuong_xa_id INT,
  dia_chi_giao_hang VARCHAR(255) NOT NULL,
  ten_nguoi_nhan VARCHAR(100) NOT NULL,
  sdt_nguoi_nhan VARCHAR(15) NOT NULL,
  FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(nguoi_dung_id),
  FOREIGN KEY (phieu_giam_gia_id) REFERENCES phieu_giam_gia(phieu_giam_gia_id),
  FOREIGN KEY (phuong_xa_id) REFERENCES phuong_xa(phuong_xa_id)
);

ALTER TABLE don_hang ADD CONSTRAINT chk_trang_thai_don_hang CHECK (
  trang_thai IN ('pending','processing','shipping','completed','cancelled')
);

CREATE TABLE chi_tiet_don_hang (
  chi_tiet_don_hang_id SERIAL PRIMARY KEY,
  don_hang_id VARCHAR(25) NOT NULL,
  bien_the_id INT,
  ten_san_pham VARCHAR(150) NOT NULL,
  gia NUMERIC(10,2) NOT NULL CHECK (gia >= 0),
  so_luong INT NOT NULL CHECK (so_luong > 0),
  FOREIGN KEY (don_hang_id) REFERENCES don_hang(don_hang_id),
  FOREIGN KEY (bien_the_id) REFERENCES bien_the_san_pham(bien_the_id) ON DELETE SET NULL
);

CREATE TABLE lich_su_trang_thai_don_hang (
  lich_su_id SERIAL PRIMARY KEY,
  don_hang_id VARCHAR(25),
  trang_thai VARCHAR(20),
  thay_doi_luc TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (don_hang_id) REFERENCES don_hang(don_hang_id)
);

-- =========================
-- THANH TOAN
-- =========================
CREATE TABLE thanh_toan (
  thanh_toan_id SERIAL PRIMARY KEY,
  don_hang_id VARCHAR(25) UNIQUE NOT NULL,
  phuong_thuc VARCHAR(20) DEFAULT 'COD',
  trang_thai VARCHAR(20) DEFAULT 'pending',
  ma_tham_chieu VARCHAR(100),
  FOREIGN KEY (don_hang_id) REFERENCES don_hang(don_hang_id)
);

ALTER TABLE thanh_toan ADD CONSTRAINT chk_phuong_thuc_thanh_toan CHECK (
  phuong_thuc IN ('COD','MOMO')
);

ALTER TABLE thanh_toan ADD CONSTRAINT chk_trang_thai_thanh_toan CHECK (
  trang_thai IN ('pending','paid','failed','refunded')
);

-- =========================
-- HOAN TIEN
-- =========================
CREATE TABLE hoan_tien (
  hoan_tien_id SERIAL PRIMARY KEY,
  don_hang_id VARCHAR(25) NOT NULL,
  so_tien NUMERIC(10,2) NOT NULL CHECK (so_tien >= 0),
  ly_do TEXT,
  trang_thai VARCHAR(20) DEFAULT 'pending',
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (don_hang_id) REFERENCES don_hang(don_hang_id)
);

ALTER TABLE hoan_tien ADD CONSTRAINT chk_trang_thai_hoan_tien CHECK (
  trang_thai IN ('pending','success','failed')
);

-- =========================
-- LOYALTY
-- =========================
CREATE TABLE diem_tich_luy (
  nguoi_dung_id INT PRIMARY KEY,
  tong_diem INT DEFAULT 0 CHECK (tong_diem >= 0),
  FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(nguoi_dung_id)
);

-- =========================
-- DANH SACH YEU THICH
-- =========================
CREATE TABLE danh_sach_yeu_thich (
  danh_sach_yeu_thich_id SERIAL PRIMARY KEY,
  nguoi_dung_id INT NOT NULL,
  bien_the_id INT NOT NULL,
  UNIQUE(nguoi_dung_id, bien_the_id),
  FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(nguoi_dung_id),
  FOREIGN KEY (bien_the_id) REFERENCES bien_the_san_pham(bien_the_id)
);

CREATE TABLE thong_bao_yeu_thich (
  thong_bao_id SERIAL PRIMARY KEY,
  nguoi_dung_id INT,
  san_pham_id INT,
  loai_thong_bao VARCHAR(20) CHECK (loai_thong_bao IN ('price_drop','back_in_stock')),
  da_gui BOOLEAN DEFAULT FALSE,
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- SPIN
-- =========================
CREATE TABLE luot_quay (
  nguoi_dung_id INT PRIMARY KEY,
  so_luot INT DEFAULT 0 CHECK (so_luot >= 0),
  FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(nguoi_dung_id)
);

CREATE TABLE cau_hinh_qua_quay (
  cau_hinh_qua_quay_id SERIAL PRIMARY KEY,
  loai_qua VARCHAR(20),
  gia_tri INT CHECK (gia_tri >= 0),
  ty_le_thang NUMERIC(5,2) CHECK (ty_le_thang >= 0 AND ty_le_thang <= 100),
  so_luong_con_lai INT,
  trang_thai VARCHAR(20) DEFAULT 'active'
);

ALTER TABLE cau_hinh_qua_quay ADD CONSTRAINT chk_qua_quay CHECK (
  loai_qua IN ('voucher','point','none')
);

CREATE TABLE lich_su_quay (
  lich_su_quay_id SERIAL PRIMARY KEY,
  nguoi_dung_id INT NOT NULL,
  cau_hinh_qua_quay_id INT NOT NULL,
  ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung(nguoi_dung_id),
  FOREIGN KEY (cau_hinh_qua_quay_id) REFERENCES cau_hinh_qua_quay(cau_hinh_qua_quay_id)
);

-- =========================
-- COMPATIBILITY VIEWS
-- =========================
CREATE VIEW users AS
SELECT nguoi_dung_id AS user_id,
       thu_dien_tu AS email,
       ten_dang_nhap AS username,
       mat_khau AS password,
       ho AS first_name,
       ten AS last_name,
       so_dien_thoai AS phone_number,
       vai_tro AS role,
       trang_thai AS status,
       so_lan_dang_nhap_sai AS failed_login_attempts,
       lan_dang_nhap_cuoi AS last_login,
       refresh_token,
       ngay_tao AS created_at
FROM nguoi_dung;

CREATE VIEW password_reset_tokens AS
SELECT ma_id AS id,
       nguoi_dung_id AS user_id,
       kenh AS channel,
       dia_chi_nhan AS destination,
       ma_otp_hash AS otp_hash,
       so_lan_thu AS attempt_count,
       het_han_luc AS expires_at,
       da_su_dung_luc AS used_at,
       ngay_tao AS created_at
FROM ma_dat_lai_mat_khau;

CREATE VIEW user_auth_provider AS
SELECT xac_thuc_id AS id,
       nguoi_dung_id AS user_id,
       nha_cung_cap AS provider,
       nha_cung_cap_id AS provider_id
FROM nguoi_dung_xac_thuc;

CREATE VIEW categories AS
SELECT danh_muc_id AS category_id,
       ten_danh_muc AS category_name,
       mo_ta AS description,
       hinh_anh AS image_url,
       danh_muc_cha_id AS parent_category_id,
       slug
FROM danh_muc;

CREATE VIEW product_types AS
SELECT loai_san_pham_id AS type_id,
       ten_loai AS type_name,
       mo_ta AS description
FROM loai_san_pham;

CREATE VIEW products AS
SELECT san_pham_id AS product_id,
       loai_san_pham_id AS type_id,
       danh_muc_id AS category_id,
       ten_san_pham AS product_name,
       mo_ta AS description,
       trang_thai_san_pham AS product_status
FROM san_pham;

CREATE VIEW product_variants AS
SELECT bien_the_id AS variant_id,
       san_pham_id AS product_id,
       sku,
       slug,
       gia AS price,
       mau_sac AS color,
       kich_co AS size,
       ngay_tao AS created_at
FROM bien_the_san_pham;

CREATE VIEW inventory AS
SELECT ton_kho_id AS inventory_id,
       bien_the_id AS variant_id,
       so_luong_ton AS stock_quantity
FROM ton_kho;

CREATE VIEW variant_images AS
SELECT hinh_anh_id AS image_id,
       bien_the_id AS variant_id,
       duong_dan_anh AS image_url,
       thu_tu_hien_thi AS sort_order
FROM hinh_anh_bien_the;

CREATE VIEW workshops AS
SELECT hoi_thao_id AS workshop_id,
       san_pham_id AS product_id,
       tieu_de AS title,
       mo_ta AS description,
       dia_diem AS location
FROM hoi_thao;

CREATE VIEW workshop_variants AS
SELECT hoi_thao_bien_the_id AS id,
       hoi_thao_id AS workshop_id,
       bien_the_id AS variant_id,
       ngay_bat_dau AS start_date,
       ngay_ket_thuc AS end_date,
       trang_thai AS status,
       ngay_tao AS created_at
FROM hoi_thao_bien_the;

CREATE VIEW cart AS
SELECT gio_hang_id AS cart_id,
       nguoi_dung_id AS user_id,
       bien_the_id AS variant_id,
       so_luong AS quantity
FROM gio_hang;

CREATE VIEW vouchers AS
SELECT phieu_giam_gia_id AS voucher_id,
       ma AS code,
       ten_phieu AS voucher_name,
       kieu_giam_gia AS discount_type,
       gia_tri AS value,
       gia_tri_toi_thieu AS minimum_value,
       giam_toi_da AS max_discount,
       so_luong AS quantity,
       da_dung AS used_count,
       ngay_bat_dau AS start_date,
       ngay_ket_thuc AS end_date
FROM phieu_giam_gia;

CREATE VIEW user_vouchers AS
SELECT id,
       phieu_giam_gia_id AS voucher_id,
       nguoi_dung_id AS user_id,
       so_lan_su_dung AS usage_count
FROM nguoi_dung_phieu_giam_gia;

CREATE VIEW voucher_products AS
SELECT id,
       phieu_giam_gia_id AS voucher_id,
       san_pham_id AS product_id,
       bien_the_id AS variant_id
FROM phieu_giam_gia_san_pham;

CREATE VIEW promotions AS
SELECT khuyen_mai_id AS promotion_id,
       tieu_de AS title,
       kieu_giam_gia AS discount_type,
       gia_tri AS value,
       gia_tri_don_hang_toi_thieu AS min_order_value,
       ngay_bat_dau AS start_date,
       ngay_ket_thuc AS end_date,
       trang_thai AS status,
       ngay_tao AS created_at
FROM khuyen_mai;

CREATE VIEW promotion_products AS
SELECT id,
       khuyen_mai_id AS promotion_id,
       san_pham_id AS product_id,
       bien_the_id AS variant_id
FROM khuyen_mai_san_pham;

CREATE VIEW cities AS
SELECT ma_tinh AS city_code,
       ten_tinh AS city_name
FROM tinh_thanh;

CREATE VIEW wards AS
SELECT phuong_xa_id AS ward_id,
       ten_phuong_xa AS ward_name,
       ma_tinh AS city_code
FROM phuong_xa;

CREATE VIEW orders AS
SELECT don_hang_id AS order_id,
       nguoi_dung_id AS user_id,
       trang_thai AS status,
       tong_tien AS total_amount,
       phieu_giam_gia_id AS voucher_id,
       so_tien_giam AS discount_amount,
       idempotency_key,
       phuong_xa_id AS ward_id,
       dia_chi_giao_hang AS shipping_address,
       ten_nguoi_nhan AS recipient_name,
       sdt_nguoi_nhan AS recipient_phone
FROM don_hang;

CREATE VIEW order_details AS
SELECT chi_tiet_don_hang_id AS order_detail_id,
       don_hang_id AS order_id,
       bien_the_id AS variant_id,
       ten_san_pham AS product_name,
       gia AS price,
       so_luong AS quantity
FROM chi_tiet_don_hang;

CREATE VIEW order_status_history AS
SELECT lich_su_id AS id,
       don_hang_id AS order_id,
       trang_thai AS status,
       thay_doi_luc AS changed_at
FROM lich_su_trang_thai_don_hang;

CREATE VIEW payments AS
SELECT thanh_toan_id AS payment_id,
       don_hang_id AS order_id,
       phuong_thuc AS method,
       trang_thai AS status,
       ma_tham_chieu AS reference_code
FROM thanh_toan;

CREATE VIEW refunds AS
SELECT hoan_tien_id AS refund_id,
       don_hang_id AS order_id,
       so_tien AS amount,
       ly_do AS reason,
       trang_thai AS status,
       ngay_tao AS created_at
FROM hoan_tien;

CREATE VIEW loyalty_points AS
SELECT nguoi_dung_id AS user_id,
       tong_diem AS total_points
FROM diem_tich_luy;

CREATE VIEW wishlist AS
SELECT danh_sach_yeu_thich_id AS wishlist_id,
       nguoi_dung_id AS user_id,
       bien_the_id AS variant_id
FROM danh_sach_yeu_thich;

CREATE VIEW wishlist_notifications AS
SELECT thong_bao_id AS id,
       nguoi_dung_id AS user_id,
       san_pham_id AS product_id,
       loai_thong_bao AS notification_type,
       da_gui AS sent,
       ngay_tao AS created_at
FROM thong_bao_yeu_thich;

CREATE VIEW spin_turns AS
SELECT nguoi_dung_id AS user_id,
       so_luot AS turn_count
FROM luot_quay;

CREATE VIEW spin_reward_config AS
SELECT cau_hinh_qua_quay_id AS reward_id,
       loai_qua AS reward_type,
       gia_tri AS value,
       ty_le_thang AS win_rate,
       so_luong_con_lai AS remaining_quantity,
       trang_thai AS status
FROM cau_hinh_qua_quay;

CREATE VIEW spin_history AS
SELECT lich_su_quay_id AS history_id,
       nguoi_dung_id AS user_id,
       cau_hinh_qua_quay_id AS reward_id,
       ngay_tao AS created_at
FROM lich_su_quay;


-- =========================
-- SAMPLE DATA
-- =========================

-- ----------------------------------------
-- 0. DỮ LIỆU ĐỊA CHÍNH (TINH_THANH & PHUONG_XA)
-- ----------------------------------------
INSERT INTO tinh_thanh (ma_tinh, ten_tinh) VALUES 
('HCM', 'Hồ Chí Minh'), 
('HN', 'Hà Nội'), 
('DN', 'Đà Nẵng'), 
('HP', 'Hải Phòng'), 
('CT', 'Cần Thơ');

INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES 
(1, 'Phường Bến Nghé', 'HCM'), (2, 'Phường Bến Thành', 'HCM'), (3, 'Phường Đa Kao', 'HCM'), (4, 'Phường Phạm Ngũ Lão', 'HCM'), (5, 'Phường Tân Định', 'HCM'),
(6, 'Phường Tràng Tiền', 'HN'), (7, 'Phường Hàng Bài', 'HN'), (8, 'Phường Hàng Bạc', 'HN'), (9, 'Phường Hàng Bông', 'HN'), (10, 'Phường Cửa Đông', 'HN'),
(11, 'Phường Hải Châu I', 'DN'), (12, 'Phường Hải Châu II', 'DN'), (13, 'Phường Thạch Thang', 'DN'), (14, 'Phường Thanh Bình', 'DN'), (15, 'Phường Thuận Phước', 'DN'),
(16, 'Phường Minh Khai', 'HP'), (17, 'Phường Hoàng Văn Thụ', 'HP'), (18, 'Phường Quang Trung', 'HP'), (19, 'Phường Phan Bội Châu', 'HP'), (20, 'Phường Phạm Hồng Thái', 'HP'),
(21, 'Phường Tân An', 'CT'), (22, 'Phường An Lạc', 'CT'), (23, 'Phường An Cư', 'CT'), (24, 'Phường An Nghiệp', 'CT'), (25, 'Phường An Hòa', 'CT');

-- ----------------------------------------
-- 1. BẢNG: NGUOI_DUNG & PHỤ THUỘC (Tài khoản)
-- ----------------------------------------
-- Hệ thống Admin cũ
INSERT INTO nguoi_dung (nguoi_dung_id, thu_dien_tu, ten_dang_nhap, mat_khau, ho, ten, so_dien_thoai, vai_tro) VALUES 
(1, 'haunghia1512@gmail.com', 'admin', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Admin', 'Developer', '0900000000', 'admin'), 
(2, 'lommlay@gmail.com', 'admin1', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Admin', 'Developer', '0900000001', 'admin'),
(3, 'admin@gmail.com', 'admin2', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Admin', 'Test', '0900000002', 'admin');

-- Khách hàng cũ
INSERT INTO nguoi_dung (nguoi_dung_id, thu_dien_tu, ten_dang_nhap, mat_khau, ho, ten, so_dien_thoai, vai_tro) VALUES 
(4, 'khachhang3@gmail.com', 'user03', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Nguyễn', 'Văn Huy', '0909876543', 'customer'),
(5, 'khachhang4@gmail.com', 'user04', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Nguyễn', 'Văn Long', '0912345678', 'customer'),
(6, 'khachhang5@gmail.com', 'user05', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Lê', 'Thị Mai', '0923456789', 'customer'),
(7, 'khachhang6@gmail.com', 'user06', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Phạm', 'Minh Đức', '0934567890', 'customer'),
(8, 'khachhang7@gmail.com', 'user07', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Hoàng', 'Thị Dung', '0945678901', 'customer');

-- Thêm các tài khoản bổ sung (ID: 9->12) giúp làm dày dữ liệu cho các bảng giao dịch (>10 records)
INSERT INTO nguoi_dung (nguoi_dung_id, thu_dien_tu, ten_dang_nhap, mat_khau, ho, ten, so_dien_thoai) VALUES
(9, 'khachhang8@gmail.com', 'user08', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Đào', 'Linh Chi', '0956789012'),
(10, 'khachhang9@gmail.com', 'user09', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Vũ', 'Anh Tuấn', '0967890123'),
(11, 'khachhang10@gmail.com', 'user10', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Bùi', 'Thị Ngọc', '0978901234'),
(12, 'khachhang11@gmail.com', 'user11', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Đỗ', 'Hoàng Việt', '0989012345');

-- ----------------------------------------
-- 2. BẢNG: DANH_MUC & LOAI_SAN_PHAM (Phân cấp danh mục)
-- ----------------------------------------
INSERT INTO loai_san_pham (loai_san_pham_id, ten_loai, mo_ta) VALUES 
(1, 'Len cuộn', 'Các dòng len sợi cuộn tròn phục vụ thủ công đan móc'),
(2, 'Công cụ', 'Dụng cụ và thiết bị hỗ trợ định hình sản phẩm len'),
(3, 'Workshop', 'Vé tham gia trải nghiệm lớp học làm đồ len trực tiếp');

-- Danh mục gốc
INSERT INTO danh_muc (danh_muc_id, ten_danh_muc, mo_ta, danh_muc_cha_id, hinh_anh, slug) VALUES 
(1, 'Len đan', 'Sản phẩm và vật liệu liên quan đến len sợi handmade', NULL, NULL, 'len-dan'),
(2, 'Len Cotton', 'Các dòng len thành phần cotton mềm, mịn, ít xù sợi', 1, NULL, 'len-cotton');

-- Cây 1: Dụng cụ đan móc -> Kim đan len, Kim móc len
INSERT INTO danh_muc (danh_muc_id, ten_danh_muc, mo_ta, danh_muc_cha_id, hinh_anh, slug) VALUES 
(3, 'Dụng cụ đan móc', 'Các thiết bị phụ trợ đan móc đan len thủ công chuyên nghiệp', NULL, NULL, 'dung-cu-dan-moc'),
(4, 'Kim đan len', 'Kim đan thẳng, kim đan vòng các chất liệu gỗ, kim loại', 3, NULL, 'kim-dan-len'),
(5, 'Kim móc len', 'Kim móc cán dẻo cao cấp bảo vệ khớp ngón tay', 3, NULL, 'kim-moc-len');

-- Cây 2: Thành phẩm len -> Khăn len thời trang, Áo len đan tay, Thú bông len Amigurumi
INSERT INTO danh_muc (danh_muc_id, ten_danh_muc, mo_ta, danh_muc_cha_id, hinh_anh, slug) VALUES 
(6, 'Thành phẩm len', 'Các sản phẩm thời trang, Decor làm hoàn toàn bằng tay', NULL, NULL, 'thanh-pham-len'),
(7, 'Khăn len thời trang', 'Khăn len đan tay họa tiết đa dạng phong cách giữ ấm tốt', 6, NULL, 'khan-len-thoi-trang'),
(8, 'Áo len đan tay', 'Áo khoác cardigan, áo len cổ lọ dệt thủ công tỉ mỉ', 6, NULL, 'ao-len-dan-tay'),
(9, 'Thú bông len Amigurumi', 'Thú bông móc bằng len nhồi bông gòn sạch tinh khiết', 6, NULL, 'thu-bong-len-amigurumi');

-- Cây 3: Danh mục cha đứng độc lập
INSERT INTO danh_muc (danh_muc_id, ten_danh_muc, mo_ta, danh_muc_cha_id, hinh_anh, slug) VALUES 
(10, 'Nguyên liệu len phụ trợ', 'Phụ kiện bổ trợ như nút gỗ, bông nhồi, mắt thú giả, mác da gắn túi', NULL, NULL, 'nguyen-lieu-len-phu-tro');

-- ----------------------------------------
-- 3. BẢNG: SAN_PHAM, BIEN_THE_SAN_PHAM & TON_KHO
-- ----------------------------------------
INSERT INTO san_pham (san_pham_id, loai_san_pham_id, danh_muc_id, ten_san_pham, mo_ta) VALUES 
(1, 1, 2, 'Len Cotton Milk', 'Dòng len sợi sữa mềm thích hợp cho cả da em bé');
INSERT INTO bien_the_san_pham (bien_the_id, san_pham_id, sku, slug, gia, mau_sac, kich_co) VALUES 
(1, 1, 'L-COTTON-001', 'len-cotton-milk-trang', 25000.00, 'Trắng', 'M');
INSERT INTO ton_kho (ton_kho_id, bien_the_id, so_luong_ton) VALUES (1, 1, 100);

-- Sản phẩm 2: Kim Móc Cán Dẻo Tulip (Biến thể 1: 150 tồn kho, Biến thể 2: 210 tồn kho)
INSERT INTO san_pham (san_pham_id, loai_san_pham_id, danh_muc_id, ten_san_pham, mo_ta) VALUES 
(2, 2, 5, 'Kim Móc Cán Dẻo Tulip', 'Thương hiệu kim móc cao cấp nhập khẩu Nhật Bản');

INSERT INTO bien_the_san_pham (bien_the_id, san_pham_id, sku, slug, gia, mau_sac, kich_co) VALUES 
(2, 2, 'KM-TULIP-20MM', 'kim-moc-tulip-20mm', 120000.00, 'Vàng Kim', '2.0mm'),
(3, 2, 'KM-TULIP-30MM', 'kim-moc-tulip-30mm', 125000.00, 'Hồng Pastel', '3.0mm');

INSERT INTO ton_kho (ton_kho_id, bien_the_id, so_luong_ton) VALUES 
(2, 2, 150),
(3, 3, 210);

-- Sản phẩm 3: Len Sợi Nhung Đũa (Biến thể 1: 120 tồn kho, Biến thể 2: 60 tồn kho)
INSERT INTO san_pham (san_pham_id, loai_san_pham_id, danh_muc_id, ten_san_pham, mo_ta) VALUES 
(3, 1, 10, 'Len Sợi Nhung Đũa', 'Sợi len kết cấu nhung siêu to chuyên dùng đan chăn, thảm');

INSERT INTO bien_the_san_pham (bien_the_id, san_pham_id, sku, slug, gia, mau_sac, kich_co) VALUES 
(4, 3, 'L-NHUNG-DO', 'len-nhung-dua-do-do', 45000.00, 'Đỏ Đô', 'Cỡ Đại'),
(5, 3, 'L-NHUNG-XANH', 'len-nhung-dua-xanh-reu', 45000.00, 'Xanh Rêu', 'Cỡ Đại');

INSERT INTO ton_kho (ton_kho_id, bien_the_id, so_luong_ton) VALUES 
(4, 4, 120),
(5, 5, 60);

-- Sản phẩm 4: Bộ Kim Đan Vòng Gỗ Sồi (Biến thể 1: 80, BT2: 140, BT3: 100, BT4: 50)
INSERT INTO san_pham (san_pham_id, loai_san_pham_id, danh_muc_id, ten_san_pham, mo_ta) VALUES 
(4, 2, 4, 'Bộ Kim Đan Vòng Gỗ Sồi', 'Chất liệu gỗ tự nhiên nối dây cáp dẻo chống xoắn');

INSERT INTO bien_the_san_pham (bien_the_id, san_pham_id, sku, slug, gia, mau_sac, kich_co) VALUES 
(6, 4, 'KD-VONG-40MM', 'kim-dan-vong-40mm', 85000.00, 'Gỗ Tự Nhiên', '4.0mm'),
(7, 4, 'KD-VONG-50MM', 'kim-dan-vong-50mm', 90000.00, 'Gỗ Tự Nhiên', '5.0mm'),
(8, 4, 'KD-VONG-60MM', 'kim-dan-vong-60mm', 95000.00, 'Gỗ Tự Nhiên', '6.0mm'),
(9, 4, 'KD-VONG-70MM', 'kim-dan-vong-70mm', 100000.00, 'Gỗ Tự Nhiên', '7.0mm');

INSERT INTO ton_kho (ton_kho_id, bien_the_id, so_luong_ton) VALUES 
(6, 6, 80),
(7, 7, 140),
(8, 8, 100),
(9, 9, 50);

-- Sản phẩm phụ trợ 5: Dành cho phân hệ Workshop học đan khăn mẫu
INSERT INTO san_pham (san_pham_id, loai_san_pham_id, danh_muc_id, ten_san_pham, mo_ta) VALUES
(5, 3, 7, 'Workshop Đan Khăn Căn Bản', 'Buổi học thực tế đan khăn trực tiếp');
INSERT INTO bien_the_san_pham (bien_the_id, san_pham_id, sku, slug, gia, mau_sac, kich_co) VALUES 
(10, 5, 'WS-KHAN-01', 've-workshop-dan-khan-hcm', 350000.00, 'Mặc định', '1 Buổi');
INSERT INTO ton_kho (ton_kho_id, bien_the_id, so_luong_ton) VALUES (10, 10, 30);

-- ----------------------------------------
-- 4. BẢNG: GIO_HANG
-- ----------------------------------------
INSERT INTO gio_hang (nguoi_dung_id, bien_the_id, so_luong) VALUES 
(4, 2, 2), (4, 4, 1),
(5, 3, 1), (5, 6, 2),
(6, 1, 5), (6, 7, 1),
(7, 8, 1), (8, 9, 3),
(9, 4, 2), (10, 5, 4);

-- ----------------------------------------
-- 5. BẢNG: PHIEU_GIAM_GIA & KHUYEN_MAI (10 dòng mẫu từng bảng)
-- ----------------------------------------
-- Phiếu giảm giá (Vouchers)
INSERT INTO phieu_giam_gia (phieu_giam_gia_id, ma, ten_phieu, kieu_giam_gia, gia_tri, gia_tri_toi_thieu, giam_toi_da, so_luong, da_dung, ngay_bat_dau, ngay_ket_thuc) VALUES 
(1, 'WELCOME10', 'Giảm 10%', 'percent', 10.00, 50000.00, 50000.00, NULL, 0, NULL, NULL),
(2, 'LENMOI2026', 'Mừng năm mới', 'fixed', 20000.00, 150000.00, 20000.00, 50, 5, '2026-01-01 00:00:00', '2026-03-01 00:00:00'),
(3, 'FLASHSALE5', 'Flashsale 5%', 'percent', 5.00, 0.00, 20000.00, 200, 85, '2026-06-15 00:00:00', '2026-06-16 00:00:00'),
(4, 'DANLENKHOE', 'Yêu đan móc', 'percent', 15.00, 200000.00, 60000.00, 30, 2, '2026-06-01 00:00:00', '2026-07-01 00:00:00'),
(5, 'CODFREE', 'Hỗ trợ ship', 'fixed', 15000.00, 100000.00, 15000.00, 500, 140, '2026-05-01 00:00:00', '2026-08-01 00:00:00'),
(6, 'VIPKHACH', 'Tri ân VIP', 'percent', 20.00, 500000.00, 150000.00, 10, 1, '2026-06-01 00:00:00', '2026-12-31 23:59:59'),
(7, 'PROPION', 'Giảm sâu dụng cụ', 'fixed', 50000.00, 400000.00, 50000.00, 40, 10, '2026-06-10 00:00:00', '2026-06-25 00:00:00'),
(8, 'LENSIEURE', 'Sợi nhung deal', 'percent', 8.00, 80000.00, 30000.00, 100, 0, '2026-06-12 00:00:00', '2026-06-20 00:00:00'),
(9, 'HEVUIVE', 'Chào hè rực rỡ', 'fixed', 30000.00, 250000.00, 30000.00, 75, 4, '2026-06-01 00:00:00', '2026-07-31 00:00:00'),
(10, 'XADONG2026', 'Dọn kho đón hè', 'percent', 25.00, 300000.00, 100000.00, 20, 20, '2026-04-01 00:00:00', '2026-05-01 00:00:00');

-- Chương trình khuyến mãi (Promotions)
INSERT INTO khuyen_mai (khuyen_mai_id, tieu_de, kieu_giam_gia, gia_tri, gia_tri_don_hang_toi_thieu, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES 
(1, 'Sale hè rực rỡ', 'fixed', 5000.00, 0.00, '2026-06-01 00:00:00', '2026-06-30 23:59:59', 'active'),
(2, 'Tuần lễ vàng Kim móc', 'percent', 10.00, 100000.00, '2026-06-10 00:00:00', '2026-06-17 23:59:59', 'active'),
(3, 'Ưu đãi tháng 6', 'fixed', 10000.00, 150000.00, '2026-06-01 00:00:00', '2026-06-30 23:59:59', 'active'),
(4, 'Xả hàng len cotton lỗi mác', 'percent', 15.00, 50000.00, '2026-05-01 00:00:00', '2026-05-15 23:59:59', 'inactive'),
(5, 'Giờ vàng giá sốc', 'fixed', 20000.00, 300000.00, '2026-06-15 12:00:00', '2026-06-15 14:00:00', 'active'),
(6, 'Khai trương chi nhánh', 'percent', 5.00, 0.00, '2026-03-01 00:00:00', '2026-03-07 23:59:59', 'inactive'),
(7, 'Ngày hội Đan Móc Việt Nam', 'percent', 12.00, 200000.00, '2026-07-05 00:00:00', '2026-07-07 23:59:59', 'active'),
(8, 'Tri ân tương tác', 'fixed', 15000.00, 100000.00, '2026-06-01 00:00:00', '2026-06-20 23:59:59', 'active'),
(9, 'Chào đón học viên mới', 'percent', 20.00, 400000.00, '2026-06-01 00:00:00', '2026-08-31 23:59:59', 'active'),
(10, 'Ưu đãi ngày mưa lớn', 'fixed', 8000.00, 120000.00, '2026-06-20 00:00:00', '2026-07-20 23:59:59', 'active');

-- Bảng liên kết trung gian
INSERT INTO nguoi_dung_phieu_giam_gia (phieu_giam_gia_id, nguoi_dung_id, so_lan_su_dung) VALUES
(1, 4, 1), (1, 5, 0), (2, 6, 1), (3, 7, 2), (4, 8, 0), (5, 9, 1), (6, 10, 0), (7, 4, 1), (8, 5, 0), (9, 6, 1);

INSERT INTO phieu_giam_gia_san_pham (phieu_giam_gia_id, san_pham_id, bien_the_id) VALUES
(1, 1, 1), (3, 2, 2), (4, 3, 4), (7, 4, 6), (10, 1, 1), (2, NULL, NULL), (5, NULL, NULL), (6, NULL, NULL), (8, NULL, NULL), (9, NULL, NULL);

INSERT INTO khuyen_mai_san_pham (khuyen_mai_id, san_pham_id, bien_the_id) VALUES
(1, 1, 1), (2, 2, 2), (2, 2, 3), (5, 4, 8), (7, 3, 4), (3, NULL, NULL), (4, NULL, NULL), (6, NULL, NULL), (8, NULL, NULL), (9, NULL, NULL);

-- ----------------------------------------
-- 6. BẢNG: DON_HANG, CHI_TIET_DON_HANG & LICH_SU
-- ----------------------------------------
-- Toàn bộ đơn hàng mẫu thực tế điền đầy đủ thông tin giao nhận
INSERT INTO don_hang (don_hang_id, nguoi_dung_id, trang_thai, tong_tien, phieu_giam_gia_id, so_tien_giam, idempotency_key, phuong_xa_id, dia_chi_giao_hang, ten_nguoi_nhan, sdt_nguoi_nhan) VALUES 
('DH000003', 4, 'completed', 25000.00, NULL, 0.00, 'key-003', 1, '456 Đường Nguyễn Trãi', 'Nguyễn Văn Huy', '0909876543'),
('DH000004', 5, 'pending', 240000.00, NULL, 0.00, 'key-004', 2, '789 Đường Lê Lợi', 'Nguyễn Văn Long', '0912345678'),
('DH000005', 6, 'processing', 110000.00, 1, 15000.00, 'key-005', 6, '12 Lý Thường Kiệt', 'Lê Thị Mai', '0923456789'),
('DH000006', 7, 'shipping', 90000.00, NULL, 0.00, 'key-006', 11, '45 Trần Phú', 'Phạm Minh Đức', '0934567890'),
('DH000007', 8, 'completed', 135000.00, 2, 20000.00, 'key-007', 16, '88 Điện Biên Phủ', 'Hoàng Thị Dung', '0945678901'),
('DH000008', 4, 'cancelled', 45000.00, NULL, 0.00, 'key-008', 3, '123 Đinh Tiên Hoàng', 'Nguyễn Văn Huy', '0909876543'),
('DH000009', 9, 'pending', 170000.00, NULL, 0.00, 'key-009', 21, '34 Nguyễn Trãi', 'Đào Linh Chi', '0956789012'),
('DH000010', 10, 'completed', 380000.00, 5, 15000.00, 'key-010', 4, '99 Cách Mạng Tháng 8', 'Vũ Anh Tuấn', '0967890123'),
('DH000011', 11, 'processing', 95000.00, NULL, 0.00, 'key-011', 8, '14 Hàng Bạc', 'Bùi Thị Ngọc', '0978901234'),
('DH000012', 12, 'shipping', 350000.00, NULL, 0.00, 'key-012', 12, '55 Hùng Vương', 'Đỗ Hoàng Việt', '0989012345'),
('DH000013', 5, 'completed', 180000.00, NULL, 0.00, 'key-013', 2, '789 Đường Lê Lợi', 'Nguyễn Văn Long', '0912345678');

-- Chi tiết các mặt hàng nằm trong đơn
INSERT INTO chi_tiet_don_hang (don_hang_id, bien_the_id, ten_san_pham, gia, so_luong) VALUES 
('DH000003', 1, 'Len Cotton Milk', 25000.00, 1),
('DH000004', 2, 'Kim Móc Cán Dẻo Tulip - 2.0mm', 120000.00, 2),
('DH000005', 3, 'Kim Móc Cán Dẻo Tulip - 3.0mm', 125000.00, 1),
('DH000006', 7, 'Bộ Kim Đan Vòng Gỗ Sồi - 5.0mm', 90000.00, 1),
('DH000007', 4, 'Len Sợi Nhung Đũa - Đỏ Đô', 45000.00, 3),
('DH000008', 5, 'Len Sợi Nhung Đũa - Xanh Rêu', 45000.00, 1),
('DH000009', 6, 'Bộ Kim Đan Vòng Gỗ Sồi - 4.0mm', 85000.00, 2),
('DH000010', 8, 'Bộ Kim Đan Vòng Gỗ Sồi - 6.0mm', 95000.00, 4),
('DH000011', 9, 'Bộ Kim Đan Vòng Gỗ Sồi - 7.0mm', 100000.00, 1),
('DH000012', 10, 'Vé Workshop Đan Khăn Căn Bản', 350000.00, 1),
('DH000013', 4, 'Len Sợi Nhung Đũa - Đỏ Đô', 45000.00, 4);

-- Lịch sử vận chuyển và thay đổi trạng thái đơn
INSERT INTO lich_su_trang_thai_don_hang (don_hang_id, trang_thai) VALUES 
('DH000003', 'pending'), ('DH000003', 'processing'), ('DH000003', 'shipping'), ('DH000003', 'completed'),
('DH000004', 'pending'),
('DH000005', 'pending'), ('DH000005', 'processing'),
('DH000006', 'pending'), ('DH000006', 'processing'), ('DH000006', 'shipping'),
('DH000007', 'pending'), ('DH000007', 'processing'), ('DH000007', 'shipping'), ('DH000007', 'completed'),
('DH000008', 'pending'), ('DH000008', 'cancelled');

-- ----------------------------------------
-- 7. BẢNG: THANH_TOAN & HOAN_TIEN
-- ----------------------------------------
INSERT INTO thanh_toan (don_hang_id, phuong_thuc, trang_thai, ma_tham_chieu) VALUES 
('DH000003', 'COD', 'paid', 'COD-003'),
('DH000004', 'COD', 'pending', NULL),
('DH000005', 'COD', 'pending', NULL),
('DH000006', 'COD', 'pending', NULL),
('DH000007', 'COD', 'paid', 'COD-007'),
('DH000008', 'COD', 'failed', NULL),
('DH000009', 'COD', 'pending', NULL),
('DH000010', 'COD', 'paid', 'COD-010'),
('DH000011', 'COD', 'pending', NULL),
('DH000012', 'COD', 'pending', NULL),
('DH000013', 'COD', 'paid', 'COD-013');

-- Bảng quản lý hoàn trả tiền lỗi (10 dòng mẫu)
INSERT INTO hoan_tien (don_hang_id, so_tien, ly_do, trang_thai) VALUES 
('DH000008', 45000.00, 'Khách hàng chủ động hủy đơn hàng', 'success'),
('DH000004', 240000.00, 'Hệ thống hoàn tiền do kho hết hàng thình lình', 'failed'),
('DH000005', 30000.00, 'Áp sai giá trị voucher, hoàn tiền thừa', 'pending'),
('DH000006', 90000.00, 'Sản phẩm móp méo bưu tá trả lại kho', 'pending'),
('DH000007', 15000.00, 'Hoàn tiền hỗ trợ tổn thất vận chuyển chậm', 'success'),
('DH000003', 0.00, 'Giao dịch test hệ thống xử lý lỗi hoàn', 'failed'),
('DH000009', 20000.00, 'Hoàn một phần tiền từ chương trình marketing bổ sung', 'pending'),
('DH000010', 50000.00, 'Đóng thiếu 1 cuộn len trong gói hàng', 'success'),
('DH000011', 10000.00, 'Bồi thường khách do trễ hạn cam kết', 'pending'),
('DH000012', 350000.00, 'Hủy lịch Workshop hoàn tiền 100% học phí', 'success');

-- ----------------------------------------
-- 8. BẢNG: LOYALTY, YEU_THICH & SPIN (Tương tác khách hàng)
-- ----------------------------------------
INSERT INTO diem_tich_luy (nguoi_dung_id, tong_diem) VALUES 
(4, 150), (5, 240), (6, 95), (7, 0), (8, 450), (9, 30), (10, 620), (11, 10), (12, 105), (1, 0);

-- Danh sách yêu thích cá nhân (10 dòng)
INSERT INTO danh_sach_yeu_thich (nguoi_dung_id, bien_the_id) VALUES 
(4, 1), (4, 3), (5, 2), (5, 6), (6, 4), (7, 8), (8, 9), (9, 1), (10, 5), (11, 7);

-- Trạng thái thông báo thay đổi giá/kho của sản phẩm (10 dòng)
INSERT INTO thong_bao_yeu_thich (nguoi_dung_id, san_pham_id, loai_thong_bao, da_gui) VALUES 
(4, 1, 'price_drop', TRUE), (4, 2, 'back_in_stock', FALSE),
(5, 2, 'back_in_stock', TRUE), (6, 3, 'price_drop', FALSE),
(7, 4, 'price_drop', TRUE), (8, 4, 'back_in_stock', FALSE),
(9, 1, 'price_drop', FALSE), (10, 3, 'back_in_stock', TRUE),
(11, 2, 'price_drop', FALSE), (12, 4, 'back_in_stock', FALSE);

-- Lượt quay mini game còn lại (10 dòng)
INSERT INTO luot_quay (nguoi_dung_id, so_luot) VALUES 
(4, 3), (5, 5), (6, 1), (7, 0), (8, 12), (9, 2), (10, 4), (11, 1), (12, 8), (1, 10);

-- Cấu hình cơ cấu giải thưởng Vòng quay may mắn
INSERT INTO cau_hinh_qua_quay (cau_hinh_qua_quay_id, loai_qua, gia_tri, ty_le_thang, so_luong_con_lai, trang_thai) VALUES 
(1, 'point', 10, 20.00, 95, 'active'),
(2, 'voucher', 1, 10.00, 48, 'active'),
(3, 'none', 0, 50.00, 999, 'active'),
(4, 'point', 50, 5.00, 20, 'active'),
(5, 'voucher', 2, 5.00, 10, 'active'),
(6, 'point', 100, 2.00, 5, 'active'),
(7, 'voucher', 3, 3.00, 15, 'active'),
(8, 'none', 0, 5.00, 200, 'inactive');

-- Nhật ký quay vòng may mắn (10 dòng)
INSERT INTO lich_su_quay (nguoi_dung_id, cau_hinh_qua_quay_id) VALUES 
(4, 1), (4, 3), (5, 2), (6, 3), (8, 4), (8, 1), (9, 3), (10, 5), (12, 1), (12, 3);

-- ----------------------------------------
-- 9. BẢNG: WORKSHOP (Quản lý các buổi hội thảo/lớp học)
-- ----------------------------------------
INSERT INTO hoi_thao (hoi_thao_id, san_pham_id, tieu_de, mo_ta, dia_diem) VALUES 
(1, 1, 'Workshop đan khăn len cơ bản', 'Hướng dẫn cách gầy mũi đan dòng đầu tiên và hoàn thiện viền khăn', 'TP. Hồ Chí Minh'),
(2, 2, 'Học móc len nâng cao Tulip Nhật', 'Ứng dụng kim cán dẻo móc hoa văn dâu tây, hoa hướng dương nổi', 'Hà Nội'),
(3, 3, 'Tự làm chăn Sofa từ len đũa khổng lồ', 'Kỹ thuật dùng tay không bện các búi len nhung đũa thành chăn nằm', 'Đà Nẵng'),
(4, 4, 'Ứng dụng kim vòng đan mũ không đường may', 'Kỹ thuật giấu chỉ nối nâng cao khi sử dụng kim vòng gỗ sồi', 'TP. Hồ Chí Minh'),
(5, 1, 'Móc thú bông Amigurumi mini cho bé', 'Từng bước tạo hình đầu, thân và ráp các chi tiết thú nhồi bông', 'Cần Thơ'),
(6, 2, 'Chuyên đề sửa các mũi lỗi khi đan móc', 'Phương pháp khắc phục khi bị tuột chỉ, lỏng tay không đều mũi', 'Hải Phòng'),
(7, 3, 'Móc thảm tròn phòng ngủ từ sợi nhung siêu to', 'Thiết kế thảm dệt chân từ sợi len đũa êm ái cho mùa đông', 'Hà Nội'),
(8, 4, 'Đan áo Cardigan len dáng lửng', 'Cách xem bảng chart hình vẽ, tính size len và ráp áo hoàn chỉnh', 'TP. Hồ Chí Minh'),
(9, 1, 'Offline cộng đồng Yêu Đan Móc Việt Nam', 'Giao lưu, trao đổi kinh nghiệm và chia sẻ len sợi thừa', 'Đà Nẵng'),
(10, 5, 'Khóa học đan khăn len cấp tốc làm quà tặng', 'Hoàn thành trọn vẹn mẫu khăn len đơn giản chỉ trong 1 buổi học', 'TP. Hồ Chí Minh');

-- Quản lý ca học và tình trạng lớp
INSERT INTO hoi_thao_bien_the (hoi_thao_id, bien_the_id, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES 
(1, 1, '2026-06-10 09:00:00', '2026-06-10 12:00:00', 'closed'),
(2, 2, '2026-07-01 14:00:00', '2026-07-01 17:00:00', 'open'),
(3, 4, '2026-07-05 08:30:00', '2026-07-05 11:30:00', 'open'),
(4, 6, '2026-07-10 18:00:00', '2026-07-10 21:00:00', 'open'),
(5, 1, '2026-07-15 09:00:00', '2026-07-15 12:00:00', 'open'),
(6, 3, '2026-06-20 13:00:00', '2026-06-20 16:00:00', 'cancelled'),
(7, 5, '2026-07-22 09:00:00', '2026-07-22 12:00:00', 'open'),
(8, 7, '2026-08-01 08:00:00', '2026-08-01 12:00:00', 'open'),
(9, 1, '2026-08-15 09:00:00', '2026-08-15 17:00:00', 'open'),
(10, 10, '2026-06-25 14:00:00', '2026-06-25 17:00:00', 'open');