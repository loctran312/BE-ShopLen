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

-- Admin
INSERT INTO nguoi_dung (nguoi_dung_id, thu_dien_tu, ten_dang_nhap, mat_khau, ho, ten, so_dien_thoai, vai_tro) 
VALUES (1, 'haunghia1512@gmail.com', 'admin', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Admin', '0', '0900000000', 'admin'), 
(2, 'lommlay@gmail.com', 'admin1', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Admin', '1', '0900000001', 'admin'),
(3, 'admin@gmail.com', 'admin2', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Admin', '2', '0900000002', 'admin');

-- 1. NGUOI DUNG
INSERT INTO nguoi_dung (nguoi_dung_id, thu_dien_tu, ten_dang_nhap, mat_khau, ho, ten, so_dien_thoai) 
VALUES (4, 'khachhang3@gmail.com', 'user03', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Tran', 'Van C', '0909876543');

-- 2. DANH MUC
INSERT INTO danh_muc (danh_muc_id, ten_danh_muc, slug) VALUES (1, 'Len đan', 'len-dan');
INSERT INTO danh_muc (danh_muc_id, ten_danh_muc, danh_muc_cha_id, slug) VALUES (2, 'Len Cotton', 1, 'len-cotton');

-- 3. SAN PHAM
INSERT INTO loai_san_pham (loai_san_pham_id, ten_loai) VALUES (1, 'Len cuộn'), (2, 'Công cụ'), (3, 'Workshop');
INSERT INTO san_pham (san_pham_id, loai_san_pham_id, danh_muc_id, ten_san_pham) VALUES (1, 1, 2, 'Len Cotton Milk');

-- 4. BIEN THE & TON KHO
INSERT INTO bien_the_san_pham (bien_the_id, san_pham_id, sku, slug, gia, mau_sac) 
VALUES (1, 1, 'L-COTTON-001', 'len-cotton-milk-trang', 25000, 'Trắng');

INSERT INTO ton_kho (ton_kho_id, bien_the_id, so_luong_ton) VALUES (1, 1, 100);

-- 5. WORKSHOP
INSERT INTO hoi_thao (hoi_thao_id, san_pham_id, tieu_de, dia_diem) VALUES (1, 1, 'Workshop đan khăn', 'TP.HCM');
INSERT INTO hoi_thao_bien_the (hoi_thao_id, bien_the_id, ngay_bat_dau, ngay_ket_thuc) 
VALUES (1, 1, '2026-06-10 09:00:00', '2026-06-10 12:00:00');

-- 6. PHIEU GIAM GIA & KHUYEN MAI
INSERT INTO phieu_giam_gia (phieu_giam_gia_id, ma, ten_phieu, kieu_giam_gia, gia_tri) 
VALUES (1, 'WELCOME10', 'Giảm 10%', 'percent', 10);

INSERT INTO khuyen_mai (khuyen_mai_id, tieu_de, gia_tri, ngay_bat_dau, ngay_ket_thuc) 
VALUES (1, 'Sale hè', 5000, '2026-06-01', '2026-06-30');

-- 7. TINH THANH & PHUONG XA
INSERT INTO tinh_thanh (ma_tinh, ten_tinh) VALUES ('HCM', 'Hồ Chí Minh');
INSERT INTO tinh_thanh (ma_tinh, ten_tinh) VALUES ('HN', 'Hà Nội');
INSERT INTO tinh_thanh (ma_tinh, ten_tinh) VALUES ('DN', 'Đà Nẵng');
INSERT INTO tinh_thanh (ma_tinh, ten_tinh) VALUES ('HP', 'Hải Phòng');
INSERT INTO tinh_thanh (ma_tinh, ten_tinh) VALUES ('CT', 'Cần Thơ');

-- Các phường thuộc Hồ Chí Minh (HCM)
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (1, 'Phường Bến Nghé', 'HCM');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (2, 'Phường Bến Thành', 'HCM');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (3, 'Phường Đa Kao', 'HCM');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (4, 'Phường Phạm Ngũ Lão', 'HCM');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (5, 'Phường Tân Định', 'HCM');

-- Các phường thuộc Hà Nội (HN)
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (6, 'Phường Tràng Tiền', 'HN');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (7, 'Phường Hàng Bài', 'HN');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (8, 'Phường Hàng Bạc', 'HN');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (9, 'Phường Hàng Bông', 'HN');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (10, 'Phường Cửa Đông', 'HN');

-- Các phường thuộc Đà Nẵng (DN)
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (11, 'Phường Hải Châu I', 'DN');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (12, 'Phường Hải Châu II', 'DN');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (13, 'Phường Thạch Thang', 'DN');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (14, 'Phường Thanh Bình', 'DN');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (15, 'Phường Thuận Phước', 'DN');

-- Các phường thuộc Hải Phòng (HP)
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (16, 'Phường Minh Khai', 'HP');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (17, 'Phường Hoàng Văn Thụ', 'HP');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (18, 'Phường Quang Trung', 'HP');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (19, 'Phường Phan Bội Châu', 'HP');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (20, 'Phường Phạm Hồng Thái', 'HP');

-- Các phường thuộc Cần Thơ (CT)
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (21, 'Phường Tân An', 'CT');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (22, 'Phường An Lạc', 'CT');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (23, 'Phường An Cư', 'CT');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (24, 'Phường An Nghiệp', 'CT');
INSERT INTO phuong_xa (phuong_xa_id, ten_phuong_xa, ma_tinh) VALUES (25, 'Phường An Hòa', 'CT');

-- 8. DON HANG
INSERT INTO don_hang (don_hang_id, nguoi_dung_id, tong_tien, phuong_xa_id, dia_chi_giao_hang, ten_nguoi_nhan, sdt_nguoi_nhan) 
VALUES ('DH000003', 4, 25000, 1, '456 Đường Nguyễn Trãi', 'Tran Van C', '0909876543');

INSERT INTO chi_tiet_don_hang (don_hang_id, bien_the_id, ten_san_pham, gia, so_luong) 
VALUES ('DH000003', 1, 'Len Cotton Milk', 25000, 1);

-- 9. THANH TOAN
INSERT INTO thanh_toan (don_hang_id, phuong_thuc, trang_thai) VALUES ('DH000003', 'COD', 'pending');

-- 10. LOYALTY, YEU THICH & SPIN
INSERT INTO diem_tich_luy (nguoi_dung_id, tong_diem) VALUES (4, 50);
INSERT INTO danh_sach_yeu_thich (nguoi_dung_id, bien_the_id) VALUES (4, 1);
INSERT INTO luot_quay (nguoi_dung_id, so_luot) VALUES (4, 3);
INSERT INTO cau_hinh_qua_quay (cau_hinh_qua_quay_id, loai_qua, gia_tri, ty_le_thang, so_luong_con_lai) 
VALUES (1, 'point', 10, 20.00, 100);