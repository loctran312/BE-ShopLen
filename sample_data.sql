-- =========================
-- SAMPLE DATA
-- =========================

-- ----------------------------------------
-- 1. BẢNG: NGUOI_DUNG & PHỤ THUỘC (Tài khoản)
-- ----------------------------------------
-- Hệ thống Admin cũ
INSERT INTO nguoi_dung (nguoi_dung_id, thu_dien_tu, ten_dang_nhap, mat_khau, ho, ten, so_dien_thoai, vai_tro, avatar) VALUES 
(1, 'haunghia1512@gmail.com', 'admin', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Admin', 'Developer', '0900000000', 'admin', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'), 
(2, 'lommlay@gmail.com', 'admin1', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Admin', 'Developer', '0900000001', 'admin', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150'),
(3, 'admin@gmail.com', 'admin2', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Admin', 'Test', '0900000002', 'admin', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150');

-- Khách hàng cũ và mới (Đã làm dày lên 15 bản ghi người dùng, bổ sung avatar mẫu)
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

-- ----------------------------------------
-- 2. BẢNG: DANH_MUC & LOAI_SAN_PHAM (Đã bổ sung hình ảnh thực tế)
-- ----------------------------------------
INSERT INTO loai_san_pham (loai_san_pham_id, ten_loai, mo_ta) VALUES 
(1, 'Len cuộn', 'Các dòng len sợi cuộn tròn phục vụ thủ công đan móc'),
(2, 'Công cụ & Phụ kiện', 'Dụng cụ, thiết bị và nguyên liệu hỗ trợ làm len thủ công'),
(3, 'Workshop', 'Vé tham gia trải nghiệm lớp học làm đồ len trực tiếp');

-- Danh mục hình ảnh
INSERT INTO danh_muc (danh_muc_id, ten_danh_muc, mo_ta, danh_muc_cha_id, hinh_anh, slug) VALUES 
(1, 'Len đan', 'Các dòng len sợi handmade đa dạng', NULL, 'https://images.unsplash.com/photo-1605721245645-12b23423b0a7?w=500', 'len-dan'),
(2, 'Len Cotton', 'Các dòng len thành phần cotton mềm, mịn, ít xù sợi', 1, 'https://images.unsplash.com/photo-1610444391690-362095cc6c7a?w=500', 'len-cotton'),
(3, 'Len Nhung', 'Dòng len nhung đũa siêu mềm, kích cỡ sợi to', 1, 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500', 'len-nhung'),
(4, 'Sợi Macrame', 'Sợi xoắn cotton chuyên dùng đan móc macrame treo tường', 1, 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=500', 'soi-macrame'),
(5, 'Dụng cụ đan móc', 'Thiết bị phụ trợ đan móc đan len thủ công', NULL, 'https://images.unsplash.com/photo-1590494412353-81b0a8eb1467?w=500', 'dung-cu-dan-moc'),
(6, 'Kim đan len', 'Kim đan thẳng, kim đan vòng các chất liệu gỗ, kim loại', 5, 'https://images.unsplash.com/photo-1584065792246-88005391208b?w=500', 'kim-dan-len'),
(7, 'Kim móc len', 'Kim móc cán dẻo cao cấp bảo vệ khớp ngón tay', 5, 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500', 'kim-moc-len'),
(8, 'Phụ kiện làm len', 'Các phụ kiện cơ bản hỗ trợ cắt chỉ, khâu ráp, đo đạc', 5, 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=500', 'phu-kien-lam-len'),
(9, 'Nguyên liệu nhồi', 'Bông gòn tinh khiết chuyên dụng để nhồi thú bông', NULL, 'https://images.unsplash.com/photo-1588610546683-11a5b8bebf65?w=500', 'nguyen-lieu-nhoi'),
(10, 'Phụ kiện trang trí', 'Nút gỗ, mắt thú giả, mác da gắn túi xách', NULL, 'https://images.unsplash.com/photo-1520981825232-ece5fae45120?w=500', 'phu-kien-trang-tri'),
(11, 'Kẽm nhung uốn hoa', 'Kẽm nhung mềm uốn tạo hình hoa hồng handmade', NULL, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500', 'kem-nhung-uon-hoa');

-- ----------------------------------------
-- 3. BẢNG: SAN_PHAM, BIEN_THE_SAN_PHAM, HINH_ANH (6 sản phẩm, 6 workshop)
-- ----------------------------------------
INSERT INTO san_pham (san_pham_id, loai_san_pham_id, danh_muc_id, ten_san_pham, mo_ta, trang_thai_san_pham) VALUES 
(1, 1, 2, 'Len Cotton Milk', 'Dòng len sợi sữa mềm thích hợp cho cả da em bé', 'active'),
(2, 2, 7, 'Kim Móc Cán Dẻo Tulip', 'Thương hiệu kim móc cao cấp nhập khẩu Nhật Bản', 'active'),
(3, 1, 3, 'Len Sợi Nhung Đũa', 'Sợi len kết cấu nhung siêu to chuyên dùng đan chăn, thảm', 'active'),
(4, 2, 6, 'Bộ Kim Đan Vòng Gỗ Sồi', 'Chất liệu gỗ tự nhiên nối dây cáp dẻo chống xoắn', 'active'),
(5, 3, NULL, 'Workshop móc hoa hồng len kẽm nhung', 'Làm quen với kẽm nhung và kỹ thuật uốn tạo hình hoa hồng', 'active'),
(6, 2, 8, 'Kéo Cắt Chỉ Bấm', 'Kéo bấm cắt chỉ thép không gỉ lưỡi siêu bén tiện dụng', 'active'),
(7, 1, 4, 'Sợi Dệt Macrame Cotton', 'Sợi cotton xoắn dày chuyên dụng thắt macrame treo tường', 'active'),
(8, 3, NULL, 'Lớp học móc móc khoá thú bông len mini', 'Móc và nhồi bông cho các mẫu móc khoá thú cưng đáng yêu', 'active'),
(9, 3, NULL, 'Workshop móc túi xách thời trang', 'Sử dụng sợi dệt để móc một chiếc túi xách tay đi tiệc', 'active'),
(10, 3, NULL, 'Lớp học đan chăn Sofa từ len đũa', 'Kỹ thuật dùng tay bện chăn nhung đũa siêu tốc không cần kim', 'active'),
(11, 3, NULL, 'Workshop đan áo Cardigan cơ bản', 'Hướng dẫn xem chart và ráp áo khoác cardigan cho mùa đông', 'active'),
(12, 3, NULL, 'Lớp học móc gấu bông Amigurumi', 'Tạo hình gấu bông và kỹ thuật ráp các chi tiết tay chân', 'active');

INSERT INTO bien_the_san_pham (bien_the_id, san_pham_id, sku, slug, gia, mau_sac, kich_co) VALUES 
(1, 1, 'L-COTTON-001', 'len-cotton-milk-trang', 25000.00, 'Trắng', 'Cuộn 50g'),
(2, 2, 'KM-TULIP-20MM', 'kim-moc-tulip-20mm', 120000.00, 'Vàng Kim', 'Kim 2.0mm'),
(3, 2, 'KM-TULIP-30MM', 'kim-moc-tulip-30mm', 125000.00, 'Hồng Pastel', 'Kim 3.0mm'),
(4, 3, 'L-NHUNG-DO', 'len-nhung-dua-do-do', 45000.00, 'Đỏ Đô', 'Cuộn 100g'),
(5, 3, 'L-NHUNG-XANH', 'len-nhung-dua-xanh-reu', 45000.00, 'Xanh Rêu', 'Cuộn 100g'),
(6, 4, 'KD-VONG-40MM', 'kim-dan-vong-40mm', 85000.00, 'Màu Gỗ', '4.0mm - Dây 80cm'),
(7, 4, 'KD-VONG-50MM', 'kim-dan-vong-50mm', 90000.00, 'Màu Gỗ', '5.0mm - Dây 80cm'),
(8, 4, 'KD-VONG-60MM', 'kim-dan-vong-60mm', 95000.00, 'Màu Gỗ', '6.0mm - Dây 80cm'),
(9, 4, 'KD-VONG-70MM', 'kim-dan-vong-70mm', 100000.00, 'Màu Gỗ', '7.0mm - Dây 80cm'),
(10, 5, 'WS-HOA-001-SANG', 'ws-moc-hoa-hong-sang', 250000.00, 'Ca Sáng (8:00 - 11:00)', '1 Buổi'),
(11, 6, 'KCB-THEP-01', 'keo-cat-chi-bam-thep', 15000.00, 'Màu Bạc', 'Loại 10cm'),
(12, 7, 'L-MACRAME-BE', 'soi-macrame-cotton-be-4mm', 75000.00, 'Màu Be Trầm', '500g - Sợi 4mm'),
(13, 1, 'L-COTTON-002', 'len-cotton-milk-vang', 25000.00, 'Vàng Cúc', 'Cuộn 50g'),
(14, 1, 'L-COTTON-003', 'len-cotton-milk-hong', 25000.00, 'Hồng Đào', 'Cuộn 50g'),
(15, 2, 'KM-TULIP-40MM', 'kim-moc-tulip-40mm', 130000.00, 'Xanh Dương', 'Kim 4.0mm'),
(16, 8, 'WS-KHOA-002-SANG', 'ws-moc-khoa-thu-sang', 150000.00, 'Ca Sáng (9:00 - 12:00)', '1 Buổi'),
(17, 9, 'WS-TUI-003-CT', 'ws-moc-tui-xach-ct', 350000.00, 'T7-CN (13:00 - 17:00)', '2 Buổi'),
(18, 10, 'WS-CHAN-004-CHIEU', 'ws-dan-chan-sofa-chieu', 500000.00, 'Ca Chiều (13:30 - 16:30)', '1 Buổi'),
(19, 11, 'WS-AOLEN-005-SANG', 'ws-dan-ao-cardigan-sang', 450000.00, 'Ca Sáng (8:30 - 11:30)', '3 Buổi'),
(20, 12, 'WS-GAU-006-CT', 'ws-moc-gau-amigurumi-ct', 300000.00, 'Chủ Nhật (9:00 - 16:00)', '1 Ngày'),
(21, 5, 'WS-HOA-001-CHIEU', 'ws-moc-hoa-hong-chieu', 250000.00, 'Ca Chiều (14:00 - 17:00)', '1 Buổi'),
(22, 8, 'WS-KHOA-002-TOI', 'ws-moc-khoa-thu-toi', 150000.00, 'Ca Tối (18:00 - 21:00)', '1 Buổi'),
(23, 11, 'WS-AOLEN-005-CHIEU', 'ws-dan-ao-cardigan-chieu', 450000.00, 'Ca Chiều (14:00 - 17:00)', '3 Buổi');

INSERT INTO hinh_anh_bien_the (bien_the_id, duong_dan_anh, thu_tu_hien_thi) VALUES 
(1, 'https://images.unsplash.com/photo-1610444391690-362095cc6c7a?w=600', 1),
(2, 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=600', 1),
(3, 'https://images.unsplash.com/photo-1590494412353-81b0a8eb1467?w=600', 1),
(4, 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=600', 1),
(5, 'https://images.unsplash.com/photo-1623869269490-333e66487e41?w=600', 1),
(6, 'https://images.unsplash.com/photo-1584065792246-88005391208b?w=600', 1),
(7, 'https://images.unsplash.com/photo-1584065792246-88005391208b?w=600', 1),
(8, 'https://images.unsplash.com/photo-1584065792246-88005391208b?w=600', 1),
(9, 'https://images.unsplash.com/photo-1584065792246-88005391208b?w=600', 1),
(11, 'https://images.unsplash.com/photo-1588610546683-11a5b8bebf65?w=600', 1),
(12, 'https://images.unsplash.com/photo-1632731885542-f2f219fdfb78?w=600', 1),
(13, 'https://images.unsplash.com/photo-1509423424749-373143fefbc4?w=600', 1),
(14, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600', 1),
(15, 'https://images.unsplash.com/photo-1590494412353-81b0a8eb1467?w=600', 1);

INSERT INTO hinh_anh_bien_the (bien_the_id, duong_dan_anh, thu_tu_hien_thi) 
SELECT bien_the_id, 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=600', 1 
FROM bien_the_san_pham WHERE bien_the_id IN (10, 16, 17, 18, 19, 20, 21, 22, 23);

-- ----------------------------------------
-- 4. BẢNG: PHIEU_GIAM_GIA & KHUYEN_MAI (6 bản ghi)
-- ----------------------------------------
INSERT INTO phieu_giam_gia (phieu_giam_gia_id, ma, ten_phieu, kieu_giam_gia, gia_tri, gia_tri_toi_thieu, giam_toi_da, so_luong, da_dung, ngay_bat_dau, ngay_ket_thuc) VALUES 
(1, 'WELCOME10', 'Giảm 10%', 'percent', 10.00, 50000.00, 50000.00, NULL, 0, NULL, NULL),
(2, 'LENMOI2026', 'Mừng năm mới', 'fixed', 20000.00, 150000.00, 20000.00, 50, 5, '2026-01-01 00:00:00', '2026-03-01 00:00:00'),
(3, 'FLASHSALE5', 'Flashsale 5%', 'percent', 5.00, 0.00, 20000.00, 200, 85, '2026-06-15 00:00:00', '2026-06-16 00:00:00'),
(4, 'DANLENKHOE', 'Yêu đan móc', 'percent', 15.00, 200000.00, 60000.00, 30, 2, '2026-06-01 00:00:00', '2026-07-01 00:00:00'),
(5, 'CODFREE', 'Hỗ trợ ship', 'fixed', 15000.00, 100000.00, 15000.00, 500, 140, '2026-05-01 00:00:00', '2026-08-01 00:00:00'),
(6, 'VIPKHACH', 'Tri ân VIP', 'percent', 20.00, 500000.00, 150000.00, 10, 1, '2026-06-01 00:00:00', '2026-12-31 23:59:59');

INSERT INTO khuyen_mai (khuyen_mai_id, tieu_de, kieu_giam_gia, gia_tri, gia_tri_don_hang_toi_thieu, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES 
(1, 'Sale hè rực rỡ', 'fixed', 5000.00, 0.00, '2026-06-01 00:00:00', '2026-06-30 23:59:59', 'active'),
(2, 'Tuần lễ vàng Kim móc', 'percent', 10.00, 100000.00, '2026-06-10 00:00:00', '2026-06-17 23:59:59', 'active'),
(3, 'Ưu đãi tháng 6', 'fixed', 10000.00, 150000.00, '2026-06-01 00:00:00', '2026-06-30 23:59:59', 'active'),
(4, 'Xả hàng len cotton lỗi mác', 'percent', 15.00, 50000.00, '2026-05-01 00:00:00', '2026-05-15 23:59:59', 'inactive'),
(5, 'Giờ vàng giá sốc', 'fixed', 20000.00, 300000.00, '2026-06-15 12:00:00', '2026-06-15 14:00:00', 'active'),
(6, 'Khai trương chi nhánh', 'percent', 5.00, 0.00, '2026-03-01 00:00:00', '2026-03-07 23:59:59', 'inactive');

INSERT INTO nguoi_dung_phieu_giam_gia (phieu_giam_gia_id, nguoi_dung_id, so_lan_su_dung) VALUES
(1, 4, 1), (1, 5, 0), (2, 6, 1), (3, 7, 2), (4, 8, 0), (5, 9, 1), (6, 10, 0);

INSERT INTO phieu_giam_gia_san_pham (phieu_giam_gia_id, san_pham_id, bien_the_id) VALUES
(1, 1, 1), (3, 2, 2), (4, 3, 4), (2, NULL, NULL), (5, NULL, NULL), (6, NULL, NULL);

INSERT INTO khuyen_mai_san_pham (khuyen_mai_id, san_pham_id) VALUES 
(1, 1), (2, 2), (5, 4), (3, NULL), (4, NULL), (6, NULL);

-- ----------------------------------------
-- 5. BẢNG: YEU_THICH
-- ----------------------------------------
INSERT INTO danh_sach_yeu_thich (nguoi_dung_id, san_pham_id) VALUES 
(4, 1), (4, 3), (5, 2), (5, 4), (6, 1), (7, 2), (8, 3), (9, 1), (10, 4), (11, 2), (12, 6), (15, 7), (4, 6), (5, 7), (6, 2);

INSERT INTO thong_bao_yeu_thich (nguoi_dung_id, san_pham_id, loai_thong_bao, da_gui) VALUES 
(4, 1, 'price_drop', TRUE), (4, 2, 'back_in_stock', FALSE),
(5, 2, 'back_in_stock', TRUE), (6, 3, 'price_drop', FALSE),
(7, 4, 'price_drop', TRUE), (8, 4, 'back_in_stock', FALSE),
(9, 1, 'price_drop', FALSE), (10, 3, 'back_in_stock', TRUE),
(11, 2, 'price_drop', FALSE), (12, 4, 'back_in_stock', FALSE),
(15, 6, 'price_drop', FALSE), (4, 7, 'back_in_stock', TRUE),
(5, 1, 'price_drop', TRUE), (6, 6, 'back_in_stock', FALSE),
(7, 7, 'price_drop', FALSE);

-- ----------------------------------------
-- 6. BẢNG: WORKSHOP (6 bản ghi)
-- ----------------------------------------
INSERT INTO hoi_thao (hoi_thao_id, san_pham_id, tieu_de, mo_ta, dia_diem) VALUES 
(1, 5, 'Workshop móc hoa hồng len kẽm nhung', 'Làm quen với kẽm nhung và kỹ thuật uốn tạo hình hoa hồng', 'TP. Hồ Chí Minh'),
(2, 8, 'Lớp học móc móc khoá thú bông len mini', 'Móc và nhồi bông cho các mẫu móc khoá thú cưng đáng yêu', 'Hà Nội'),
(3, 9, 'Workshop móc túi xách thời trang', 'Sử dụng sợi dệt để móc một chiếc túi xách tay đi tiệc', 'Đà Nẵng'),
(4, 10, 'Lớp học đan chăn Sofa từ len đũa', 'Kỹ thuật dùng tay bện chăn nhung đũa siêu tốc không cần kim', 'TP. Hồ Chí Minh'),
(5, 11, 'Workshop đan áo Cardigan cơ bản', 'Hướng dẫn xem chart và ráp áo khoác cardigan cho mùa đông', 'Cần Thơ'),
(6, 12, 'Lớp học móc gấu bông Amigurumi', 'Tạo hình gấu bông và kỹ thuật ráp các chi tiết tay chân', 'Hải Phòng');

INSERT INTO hoi_thao_bien_the (hoi_thao_id, bien_the_id, ngay_bat_dau, gio_bat_dau, gio_ket_thuc, trang_thai) VALUES
(1, 10, '2026-06-10 08:00:00', '08:00:00', '11:00:00', 'closed'),
(1, 21, '2026-07-15 14:00:00', '14:00:00', '17:00:00', 'open'),
(2, 16, '2026-07-01 09:00:00', '09:00:00', '12:00:00', 'open'),
(2, 22, '2026-07-02 18:00:00', '18:00:00', '21:00:00', 'open'),
(3, 17, '2026-07-04 13:00:00', '13:00:00', '17:00:00', 'open'),
(4, 18, '2026-07-10 13:30:00', '13:30:00', '16:30:00', 'open'),
(5, 19, '2026-07-15 08:30:00', '08:30:00', '11:30:00', 'open'),
(5, 23, '2026-07-16 14:00:00', '14:00:00', '17:00:00', 'open'),
(6, 20, '2026-06-21 09:00:00', '09:00:00', '16:00:00', 'cancelled');

-- ----------------------------------------
-- 7. BẢNG: THONG_TIN_SHIPPER
-- ----------------------------------------
INSERT INTO thong_tin_shipper (nguoi_dung_id, ma_shipper, cccd, bien_so_xe, dia_chi_ca_nhan, ma_tinh_hoat_dong) VALUES 
(13, 'SHP013', '079090000001', '59A1-12345', '123 Phạm Văn Đồng, TP.HCM', '701'),
(14, 'SHP014', '001090000002', '29B1-67890', '456 Giảng Võ, Hà Nội', '101');

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