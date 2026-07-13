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
       avatar AS avatar_url,
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

CREATE VIEW inventory_history AS
SELECT lich_su_id AS history_id,
       bien_the_id AS variant_id,
       so_luong_thay_doi AS quantity_changed,
       so_luong_sau_khi_doi AS stock_after,
       loai_giao_dich AS transaction_type,
       tham_chieu_id AS reference_code,
       ghi_chu AS note,
       nguoi_thuc_hien AS performed_by,
       ngay_tao AS created_at
FROM lich_su_ton_kho;

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
       san_pham_id AS product_id
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
       san_pham_id AS product_id
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