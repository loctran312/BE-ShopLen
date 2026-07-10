-- =========================
-- SAMPLE DATA
-- =========================

-- ----------------------------------------
-- BẢNG: NGUOI_DUNG & PHỤ THUỘC (Tài khoản)
-- ----------------------------------------
-- Hệ thống Admin
INSERT INTO nguoi_dung (nguoi_dung_id, thu_dien_tu, ten_dang_nhap, mat_khau, ho, ten, so_dien_thoai, vai_tro, avatar) VALUES 
(1, 'haunghia1512@gmail.com', 'admin', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Admin', 'Developer', '0900000000', 'admin', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'), 
(2, 'lommlay@gmail.com', 'admin1', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Admin', 'Developer', '0900000001', 'admin', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'),
(3, 'admin@gmail.com', 'admin2', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Admin', 'Test', '0900000002', 'admin', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150');

-- Khách hàng
INSERT INTO nguoi_dung (nguoi_dung_id, thu_dien_tu, ten_dang_nhap, mat_khau, ho, ten, so_dien_thoai, vai_tro, avatar) VALUES 
(4, 'khachhang3@gmail.com', 'user03', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Nguyễn', 'Văn Huy', '0909876543', 'customer', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
(5, 'khachhang4@gmail.com', 'user04', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Nguyễn', 'Văn Long', '0912345678', 'customer', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
(6, 'khachhang5@gmail.com', 'user05', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Lê', 'Thị Mai', '0923456789', 'customer', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'),
(7, 'khachhang6@gmail.com', 'user06', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Phạm', 'Minh Đức', '0934567890', 'customer', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'),
(8, 'khachhang7@gmail.com', 'user07', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Hoàng', 'Thị Dung', '0945678901', 'customer', 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150'),
(9, 'khachhang8@gmail.com', 'user08', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Đào', 'Linh Chi', '0956789012', 'customer', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
(10, 'khachhang9@gmail.com', 'user09', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Vũ', 'Anh Tuấn', '0967890123', 'customer', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150'),
(11, 'khachhang10@gmail.com', 'user10', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Bùi', 'Thị Ngọc', '0978901234', 'customer', 'https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150'),
(12, 'khachhang11@gmail.com', 'user11', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Đỗ', 'Hoàng Việt', '0989012345', 'customer', 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=150'),
(15, 'khachhang12@gmail.com', 'user12', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Tống', 'Khánh Linh', '0912112233', 'customer', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150');

-- Tài khoản Shipper (Mật khẩu mặc định: Admin@123)
INSERT INTO nguoi_dung (nguoi_dung_id, thu_dien_tu, ten_dang_nhap, mat_khau, ho, ten, so_dien_thoai, vai_tro, trang_thai, avatar) VALUES 
(13, 'shipperhcm@gmail.com', 'shipperhcm', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Nguyễn', 'Văn Giao', '0988888881', 'shipper', 'active', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'),
(14, 'shipperhn@gmail.com', 'shipperhn', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Trần', 'Giao Hàng', '0988888882', 'shipper', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');

INSERT INTO loai_san_pham (loai_san_pham_id, ten_loai, mo_ta) VALUES 
(1, 'Len cuộn', 'Các dòng len sợi cuộn tròn phục vụ thủ công đan móc'),
(2, 'Công cụ', 'Dụng cụ và thiết bị hỗ trợ định hình sản phẩm len'),
(3, 'Workshop', 'Vé tham gia trải nghiệm lớp học làm đồ len trực tiếp');

-- Tự động reset và đồng bộ các Sequence hệ thống tăng tự động tránh lệch index
DO $$
DECLARE
    seq_record RECORD;
    seq_name TEXT;
    max_val BIGINT;
BEGIN
    FOR seq_record IN 
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND column_default LIKE 'nextval(%'
    LOOP
        seq_name := pg_get_serial_sequence(seq_record.table_name, seq_record.column_name);
        
        IF seq_name IS NOT NULL THEN
            EXECUTE format('SELECT MAX(%I) FROM %I', seq_record.column_name, seq_record.table_name) INTO max_val;
            
            IF max_val IS NOT NULL THEN
                EXECUTE format('SELECT setval(%L, %L)', seq_name, max_val);
                RAISE NOTICE 'Đã cập nhật % (Bảng: %) -> MAX ID: %', seq_name, seq_record.table_name, max_val;
            ELSE
                EXECUTE format('SELECT setval(%L, 1, false)', seq_name);
                RAISE NOTICE 'Bảng % rỗng -> Đã reset % về 1', seq_record.table_name, seq_name;
            END IF;
        END IF;
    END LOOP;
END $$;