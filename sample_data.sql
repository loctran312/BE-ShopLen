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

-- Tài khoản Shipper (Mật khẩu mặc định: Password@123)
INSERT INTO nguoi_dung (nguoi_dung_id, thu_dien_tu, ten_dang_nhap, mat_khau, ho, ten, so_dien_thoai, vai_tro, trang_thai, avatar) VALUES 
(13, 'shipperhcm@gmail.com', 'shipperhcm', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Nguyễn', 'Văn Giao', '0988888881', 'shipper', 'active', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150'),
(14, 'shipperhn@gmail.com', 'shipperhn', '$2b$10$AJH0x9q4Cr.2s3CVMCEBquSg83rfHN0KF8fbBlbrSglctnnyKhsVu', 'Trần', 'Giao Hàng', '0988888882', 'shipper', 'active', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150');

-- ----------------------------------------
-- 2. BẢNG: DANH_MUC & LOAI_SAN_PHAM (Đã bổ sung hình ảnh thực tế)
-- ----------------------------------------
INSERT INTO loai_san_pham (loai_san_pham_id, ten_loai, mo_ta) VALUES 
(1, 'Len cuộn', 'Các dòng len sợi cuộn tròn phục vụ thủ công đan móc'),
(2, 'Công cụ', 'Dụng cụ và thiết bị hỗ trợ định hình sản phẩm len'),
(3, 'Workshop', 'Vé tham gia trải nghiệm lớp học làm đồ len trực tiếp'),
(4, 'Phụ kiện', 'Các thành phẩm trang trí và thời trang từ sợi len dệt tay');

-- Danh mục hình ảnh
INSERT INTO danh_muc (danh_muc_id, ten_danh_muc, mo_ta, danh_muc_cha_id, hinh_anh, slug) VALUES 
(1, 'Len đan', 'Sản phẩm và vật liệu liên quan đến len sợi handmade', NULL, 'https://images.unsplash.com/photo-1605721245645-12b23423b0a7?w=500', 'len-dan'),
(2, 'Len Cotton', 'Các dòng len thành phần cotton mềm, mịn, ít xù sợi', 1, 'https://images.unsplash.com/photo-1610444391690-362095cc6c7a?w=500', 'len-cotton'),
(3, 'Dụng cụ đan móc', 'Các thiết bị phụ trợ đan móc đan len thủ công chuyên nghiệp', NULL, 'https://images.unsplash.com/photo-1590494412353-81b0a8eb1467?w=500', 'dung-cu-dan-moc'),
(4, 'Kim đan len', 'Kim đan thẳng, kim đan vòng các chất liệu gỗ, kim loại', 3, 'https://images.unsplash.com/photo-1584065792246-88005391208b?w=500', 'kim-dan-len'),
(5, 'Kim móc len', 'Kim móc cán dẻo cao cấp bảo vệ khớp ngón tay', 3, 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=500', 'kim-moc-len'),
(6, 'Thành phẩm len', 'Các sản phẩm thời trang, Decor làm hoàn toàn bằng tay', NULL, 'https://images.unsplash.com/photo-1520981825232-ece5fae45120?w=500', 'thanh-pham-len'),
(7, 'Khăn len thời trang', 'Khăn len đan tay họa tiết đa dạng phong cách giữ ấm tốt', 6, 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=500', 'khan-len-thoi-trang'),
(8, 'Áo len đan tay', 'Áo khoác cardigan, áo len cổ lọ dệt thủ công tỉ mỉ', 6, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500', 'ao-len-dan-tay'),
(9, 'Thú bông len Amigurumi', 'Thú bông móc bằng len nhồi bông gòn sạch tinh khiết', 6, 'https://images.unsplash.com/photo-1588610546683-11a5b8bebf65?w=500', 'thu-bong-len-amigurumi'),
(10, 'Nguyên liệu len phụ trợ', 'Phụ kiện bổ trợ như nút gỗ, bông nhồi, mắt thú giả, mác da gắn túi', NULL, 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=500', 'nguyen-lieu-len-phu-tro'),
(11, 'Sợi dệt thảm Decor', 'Các dòng dòng sợi dệt cỡ lớn dùng trang trí nội thất', 1, 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=500', 'soi-det-tham-decor');

-- ----------------------------------------
-- 3. BẢNG: SAN_PHAM, BIEN_THE_SAN_PHAM, TON_KHO, HINH_ANH (Mở rộng lên 15 biến thể)
-- ----------------------------------------
INSERT INTO san_pham (san_pham_id, loai_san_pham_id, danh_muc_id, ten_san_pham, mo_ta, trang_thai_san_pham) VALUES 
(1, 1, 2, 'Len Cotton Milk', 'Dòng len sợi sữa mềm thích hợp cho cả da em bé', 'active'),
(2, 2, 5, 'Kim Móc Cán Dẻo Tulip', 'Thương hiệu kim móc cao cấp nhập khẩu Nhật Bản', 'active'),
(3, 1, 10, 'Len Sợi Nhung Đũa', 'Sợi len kết cấu nhung siêu to chuyên dùng đan chăn, thảm', 'active'),
(4, 2, 4, 'Bộ Kim Đan Vòng Gỗ Sồi', 'Chất liệu gỗ tự nhiên nối dây cáp dẻo chống xoắn', 'active'),
(5, 3, NULL, 'Workshop đan khăn len cơ bản', 'Hướng dẫn cách gầy mũi đan dòng đầu tiên và hoàn thiện viền khăn', 'active'),
(6, 4, 9, 'Thú Bông Khủng Long Xanh', 'Thành phẩm thú bông móc thủ công từ len Milk bò mềm mịn', 'active'),
(7, 1, 11, 'Sợi Dệt Macrame Cotton', 'Sợi cotton xoắn dày chuyên dụng thắt macrame treo tường', 'active'),
(8, 3, NULL, 'Học móc len nâng cao Tulip Nhật', 'Ứng dụng kim cán dẻo móc hoa văn dâu tây, hoa hướng dương nổi', 'active'),
(9, 3, NULL, 'Tự làm chăn Sofa từ len đũa khổng lồ', 'Kỹ thuật dùng tay không bện các búi len nhung đũa thành chăn nằm', 'active'),
(10, 3, NULL, 'Ứng dụng kim vòng đan mũ không đường may', 'Kỹ thuật giấu chỉ nối nâng cao khi sử dụng kim vòng gỗ sồi', 'active'),
(11, 3, NULL, 'Móc thú bông Amigurumi mini cho bé', 'Từng bước tạo hình đầu, thân và ráp các chi tiết thú nhồi bông', 'active'),
(12, 3, NULL, 'Chuyên đề sửa các mũi lỗi khi đan móc', 'Phương pháp khắc phục khi bị tuột chỉ, lỏng tay không đều mũi', 'active'),
(13, 3, NULL, 'Móc thảm tròn phòng ngủ từ sợi nhung siêu to', 'Thiết kế thảm dệt chân từ sợi len đũa êm ái cho mùa đông', 'active'),
(14, 3, NULL, 'Đan áo Cardigan len dáng lửng', 'Cách xem bảng chart hình vẽ, tính size len và ráp áo hoàn chỉnh', 'active'),
(15, 3, NULL, 'Offline cộng đồng Yêu Đan Móc Việt Nam', 'Giao lưu, trao đổi kinh nghiệm và chia sẻ len sợi thừa', 'active'),
(16, 3, NULL, 'Khóa học đan khăn len cấp tốc làm quà tặng', 'Hoàn thành trọn vẹn mẫu khăn len đơn giản chỉ trong 1 buổi học', 'active'),
(17, 3, NULL, 'Nhập môn Thắt nút Nghệ thuật Macrame', 'Tạo hình sản phẩm rèm treo cửa decor nhỏ phong cách Bắc Âu', 'active'),
(18, 3, NULL, 'Workshop ráp bông len thành túi xách', 'Kết nối các mảnh hoa văn vuông granny square thành túi thời trang', 'active'),
(19, 3, NULL, 'Lớp thêu hoa bằng len nổi trên nền canvas', 'Kỹ thuật đâm kim Punch Needle tạo bề mặt xù nổi độc đáo', 'active'),
(20, 3, NULL, 'Khai phá kỹ thuật móc búp bê Chart Tây', 'Đọc hiểu thuật ngữ viết chart nước ngoài và ứng dụng định hình khuôn mặt', 'active'),
(21, 3, NULL, 'Tự tay dệt ổ nằm ấm áp cho thú cưng', 'Sử dụng len đũa cỡ đại bện nôi ngủ cho chó mèo siêu tốc', 'active');

INSERT INTO bien_the_san_pham (bien_the_id, san_pham_id, sku, slug, gia, mau_sac, kich_co) VALUES 
(1, 1, 'L-COTTON-001', 'len-cotton-milk-trang', 25000.00, 'Trắng', 'M'),
(2, 2, 'KM-TULIP-20MM', 'kim-moc-tulip-20mm', 120000.00, 'Vàng Kim', '2.0mm'),
(3, 2, 'KM-TULIP-30MM', 'kim-moc-tulip-30mm', 125000.00, 'Hồng Pastel', '3.0mm'),
(4, 3, 'L-NHUNG-DO', 'len-nhung-dua-do-do', 45000.00, 'Đỏ Đô', 'Cỡ Đại'),
(5, 3, 'L-NHUNG-XANH', 'len-nhung-dua-xanh-reu', 45000.00, 'Xanh Rêu', 'Cỡ Đại'),
(6, 4, 'KD-VONG-40MM', 'kim-dan-vong-40mm', 85000.00, 'Gỗ Tự Nhiên', '4.0mm'),
(7, 4, 'KD-VONG-50MM', 'kim-dan-vong-50mm', 90000.00, 'Gỗ Tự Nhiên', '5.0mm'),
(8, 4, 'KD-VONG-60MM', 'kim-dan-vong-60mm', 95000.00, 'Gỗ Tự Nhiên', '6.0mm'),
(9, 4, 'KD-VONG-70MM', 'kim-dan-vong-70mm', 100000.00, 'Gỗ Tự Nhiên', '7.0mm'),
(10, 5, 'WS-001', 've-workshop-dan-khan-hcm', 350000.00, 'Ca Sáng', '1 Buổi'),
(11, 6, 'TP-AMIGURUMI-KL', 'thu-bong-khung-long-moc-tay', 195000.00, 'Xanh Mint', 'Cao 25cm'),
(12, 7, 'L-MACRAME-BE', 'soi-macrame-cotton-be-4mm', 75000.00, 'Màu Be Trầm', 'Cuộn 500g'),
(13, 1, 'L-COTTON-002', 'len-cotton-milk-vang', 25000.00, 'Vàng Cúc', 'M'),
(14, 1, 'L-COTTON-003', 'len-cotton-milk-hong', 25000.00, 'Hồng Đào', 'M'),
(15, 2, 'KM-TULIP-40MM', 'kim-moc-tulip-40mm', 130000.00, 'Xanh Dương', '4.0mm'),
(16, 8, 'WS-002', 'ws-moc-len-nang-cao', 350000.00, 'Ca Chiều', '1 Buổi'),
(17, 9, 'WS-003', 'ws-lam-chan-sofa', 450000.00, 'Ca Sáng', '1 Buổi'),
(18, 10, 'WS-004', 'ws-dan-mu-kim-vong', 300000.00, 'Ca Tối', '1 Buổi'),
(19, 11, 'WS-005', 'ws-moc-amigurumi-mini', 200000.00, 'Ca Chiều', '1 Buổi'),
(20, 12, 'WS-006', 'ws-sua-mui-loi', 150000.00, 'Ca Sáng', '1 Buổi'),
(21, 13, 'WS-007', 'ws-moc-tham-nhung', 500000.00, 'Ca Chiều', '1 Buổi'),
(22, 14, 'WS-008', 'ws-dan-cardigan', 600000.00, 'Ca Sáng', '1 Buổi'),
(23, 15, 'WS-009', 'ws-offline-cong-dong', 100000.00, 'Cả Ngày', '1 Buổi'),
(24, 16, 'WS-010', 'ws-dan-khan-cap-toc', 250000.00, 'Ca Chiều', '1 Buổi'),
(25, 17, 'WS-011', 'ws-that-macrame', 350000.00, 'Ca Chiều', '1 Buổi'),
(26, 18, 'WS-012', 'ws-rap-tui-xach', 400000.00, 'Ca Sáng', '1 Buổi'),
(27, 19, 'WS-013', 'ws-theu-hoa-noi', 280000.00, 'Ca Tối', '1 Buổi'),
(28, 20, 'WS-014', 'ws-moc-bup-be-tay', 320000.00, 'Ca Chiều', '1 Buổi'),
(29, 21, 'WS-015', 'ws-det-o-thu-cung', 380000.00, 'Ca Sáng', '1 Buổi');

INSERT INTO ton_kho (bien_the_id, so_luong_ton) VALUES 
(1, 100), (2, 150), (3, 210), (4, 120), (5, 60), (6, 80), (7, 140), (8, 100), (9, 50), 
(11, 15), (12, 90), (13, 110), (14, 85), (15, 45);

INSERT INTO ton_kho (bien_the_id, so_luong_ton) 
SELECT bien_the_id, 20 FROM bien_the_san_pham WHERE bien_the_id IN (10, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29);

INSERT INTO lich_su_ton_kho (bien_the_id, so_luong_thay_doi, so_luong_sau_khi_doi, loai_giao_dich, ghi_chu, nguoi_thuc_hien) VALUES
(1, 100, 100, 'nhap_kho', 'Khởi tạo kho ban đầu', 1), (2, 150, 150, 'nhap_kho', 'Khởi tạo kho ban đầu', 1),
(3, 210, 210, 'nhap_kho', 'Khởi tạo kho ban đầu', 1), (4, 120, 120, 'nhap_kho', 'Khởi tạo kho ban đầu', 1),
(5, 60, 60, 'nhap_kho', 'Khởi tạo kho ban đầu', 1), (6, 80, 80, 'nhap_kho', 'Khởi tạo kho ban đầu', 1),
(7, 140, 140, 'nhap_kho', 'Khởi tạo kho ban đầu', 1), (8, 100, 100, 'nhap_kho', 'Khởi tạo kho ban đầu', 1),
(9, 50, 50, 'nhap_kho', 'Khởi tạo kho ban đầu', 1), (10, 30, 30, 'nhap_kho', 'Khởi tạo kho ban đầu', 1),
(11, 15, 15, 'nhap_kho', 'Nhập kho thành phẩm Amigurumi', 1), (12, 90, 90, 'nhap_kho', 'Khởi tạo kho sợi Macrame', 1),
(13, 110, 110, 'nhap_kho', 'Nhập bổ sung Cotton Milk Vàng', 1), (14, 85, 85, 'nhap_kho', 'Nhập bổ sung Cotton Milk Hồng', 1),
(15, 45, 45, 'nhap_kho', 'Khởi tạo biến thể Tulip 4.0mm', 1);

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
FROM bien_the_san_pham WHERE bien_the_id IN (10, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29);

-- ----------------------------------------
-- 4. BẢNG: GIO_HANG (15 bản ghi mẫu)
-- ----------------------------------------
INSERT INTO gio_hang (nguoi_dung_id, bien_the_id, so_luong) VALUES 
(4, 2, 2), (4, 4, 1), (4, 11, 1),
(5, 3, 1), (5, 6, 2), (5, 12, 1),
(6, 1, 5), (6, 7, 1), (6, 13, 2),
(7, 8, 1), (7, 14, 3),
(8, 9, 3), (8, 15, 1),
(9, 4, 2), (10, 5, 4);

-- ----------------------------------------
-- 5. BẢNG: PHIEU_GIAM_GIA & KHUYEN_MAI (Đầy đủ 15 bản ghi mỗi bảng)
-- ----------------------------------------
-- GIỮ NGUYÊN HOÀN TOÀN LOGIC DÒNG ID SỐ 1 WELCOME10 CỦA BẠN
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
(10, 'XADONG2026', 'Dọn kho đón hè', 'percent', 25.00, 300000.00, 100000.00, 20, 20, '2026-04-01 00:00:00', '2026-05-01 00:00:00'),
(11, 'FREESHIP15', 'Freeship đơn 15k', 'free_ship', 15000.00, 150000.00, 15000.00, 300, 12, '2026-06-01 00:00:00', '2026-08-31 00:00:00'),
(12, 'FREESHIPMAX', 'Freeship tối đa', 'free_ship', 32000.00, 300000.00, 32000.00, 100, 40, '2026-06-15 00:00:00', '2026-07-15 00:00:00'),
(13, 'COTTONDEAL', 'Ưu đãi sợi cotton', 'percent', 12.00, 100000.00, 25000.00, 150, 5, '2026-06-20 00:00:00', '2026-07-20 00:00:00'),
(14, 'AMIGURUMI30', 'Giảm giá thú bông', 'fixed', 30000.00, 190000.00, 30000.00, 50, 1, '2026-06-22 00:00:00', '2026-07-22 00:00:00'),
(15, 'TULIPPROMO', 'Săn kim móc xịn', 'fixed', 15000.00, 120000.00, 15000.00, 80, 0, '2026-07-01 00:00:00', '2026-07-31 00:00:00');

-- Chương trình khuyến mãi (Mở rộng lên 15 bản ghi)
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
(10, 'Ưu đãi ngày mưa lớn', 'fixed', 8000.00, 120000.00, '2026-06-20 00:00:00', '2026-07-20 23:59:59', 'active'),
(11, 'Ngày hội xả kho Macrame', 'percent', 18.00, 100000.00, '2026-06-25 00:00:00', '2026-06-29 23:59:59', 'active'),
(12, 'Siêu sale giữa năm 7/7', 'percent', 15.00, 0.00, '2026-07-07 00:00:00', '2026-07-08 00:00:00', 'active'),
(13, 'Freeship độc quyền Xtra', 'free_ship', 32000.00, 250000.00, '2026-06-01 00:00:00', '2026-08-31 23:59:59', 'active'),
(14, 'Khuyến mãi tết đoan ngọ', 'fixed', 12000.00, 150000.00, '2026-06-18 00:00:00', '2026-06-21 23:59:59', 'inactive'),
(15, 'Trải nghiệm thú bông len', 'percent', 10.00, 0.00, '2026-06-15 00:00:00', '2026-07-15 23:59:59', 'active');

-- Bảng liên kết trung gian mẫu
INSERT INTO nguoi_dung_phieu_giam_gia (phieu_giam_gia_id, nguoi_dung_id, so_lan_su_dung) VALUES
(1, 4, 1), (1, 5, 0), (2, 6, 1), (3, 7, 2), (4, 8, 0), (5, 9, 1), (6, 10, 0), (7, 4, 1), (8, 5, 0), (9, 6, 1),
(11, 11, 1), (12, 12, 1), (13, 15, 0), (14, 4, 1), (15, 5, 0);

INSERT INTO phieu_giam_gia_san_pham (phieu_giam_gia_id, san_pham_id, bien_the_id) VALUES
(1, 1, 1), (3, 2, 2), (4, 3, 4), (7, 4, 6), (10, 1, 1), (2, NULL, NULL), (5, NULL, NULL), (6, NULL, NULL), (8, NULL, NULL), (9, NULL, NULL),
(13, 1, 13), (14, 6, 11), (11, NULL, NULL), (12, NULL, NULL), (15, NULL, NULL);

INSERT INTO khuyen_mai_san_pham (khuyen_mai_id, san_pham_id) VALUES 
(1, 1), (2, 2), (5, 4), (7, 3), (3, NULL), (4, NULL), (6, NULL), (8, NULL), (9, NULL), (10, NULL),
(11, 7), (12, 1), (12, 2), (13, NULL), (15, 6);

-- ----------------------------------------
-- 6. BẢNG: DON_HANG, CHI_TIET_DON_HANG & LICH_SU (Từ 20/06 - 29/06/2026)
-- ----------------------------------------
INSERT INTO don_hang (
    don_hang_id, nguoi_dung_id, trang_thai, tong_tien, phieu_giam_gia_id, 
    so_tien_giam, idempotency_key, phuong_xa_id, dia_chi_giao_hang, 
    ten_nguoi_nhan, sdt_nguoi_nhan, phi_van_chuyen, phuong_thuc_giao_hang
) VALUES 
('DH-20260620-0001', 4, 'completed', 43000.00, NULL, 0.00, 'key-003', 1, '456 Đường Nguyễn Trãi', 'Nguyễn Văn Huy', '0909876543', 18000.00, 'GH_TIETKIEM'),
('DH-20260621-0001', 5, 'pending', 272000.00, NULL, 0.00, 'key-004', 2, '789 Đường Lê Lợi', 'Nguyễn Văn Long', '0912345678', 32000.00, 'GH_NHANH'),
('DH-20260621-0002', 6, 'processing', 128000.00, 1, 15000.00, 'key-005', 6, '12 Lý Thường Kiệt', 'Lê Thị Mai', '0923456789', 18000.00, 'GH_TIETKIEM'),
('DH-20260622-0001', 7, 'shipping', 122000.00, NULL, 0.00, 'key-006', 11, '45 Trần Phú', 'Phạm Minh Đức', '0934567890', 32000.00, 'GH_NHANH'),
('DH-20260623-0001', 8, 'completed', 153000.00, 2, 20000.00, 'key-007', 16, '88 Điện Biên Phủ', 'Hoàng Thị Dung', '0945678901', 18000.00, 'GH_TIETKIEM'),
('DH-20260624-0001', 4, 'cancelled', 77000.00, NULL, 0.00, 'key-008', 3, '123 Đinh Tiên Hoàng', 'Nguyễn Văn Huy', '0909876543', 32000.00, 'GH_NHANH'),
('DH-20260625-0001', 9, 'pending', 188000.00, NULL, 0.00, 'key-009', 21, '34 Nguyễn Trãi', 'Đào Linh Chi', '0956789012', 18000.00, 'GH_TIETKIEM'),
('DH-20260626-0001', 10, 'completed', 412000.00, 5, 15000.00, 'key-010', 4, '99 Cách Mạng Tháng 8', 'Vũ Anh Tuấn', '0967890123', 32000.00, 'GH_NHANH'),
('DH-20260627-0001', 11, 'processing', 113000.00, NULL, 0.00, 'key-011', 8, '14 Hàng Bạc', 'Bùi Thị Ngọc', '0978901234', 18000.00, 'GH_TIETKIEM'),
('DH-20260627-0002', 12, 'shipping', 382000.00, NULL, 0.00, 'key-012', 12, '55 Hùng Vương', 'Đỗ Hoàng Việt', '0989012345', 32000.00, 'GH_NHANH'),
('DH-20260628-0001', 5, 'completed', 198000.00, NULL, 0.00, 'key-013', 2, '789 Đường Lê Lợi', 'Nguyễn Văn Long', '0912345678', 18000.00, 'GH_TIETKIEM'),
('DH-20260628-0002', 4, 'processing', 168000.00, NULL, 0.00, 'key-014', 1, '123 Đồng Khởi', 'Nguyễn Văn A', '0911111111', 18000.00, 'GH_TIETKIEM'),
('DH-20260628-0003', 5, 'processing', 352000.00, NULL, 0.00, 'key-015', 2, '456 Lê Lợi', 'Trần Thị B', '0922222222', 32000.00, 'GH_NHANH'),
('DH-20260629-0001', 6, 'processing', 228000.00, NULL, 0.00, 'key-016', 6, '789 Tràng Tiền', 'Lê Văn C', '0933333333', 18000.00, 'GH_TIETKIEM'),
('DH-20260629-0002', 11, 'completed', 213000.00, 11, 15000.00, 'key-017', 8, '32 Gia Ngư', 'Bùi Thị Ngọc', '0978901234', 32000.00, 'GH_NHANH'),
('DH-20260629-0003', 15, 'pending', 110000.00, 12, 32000.00, 'key-018', 3, '55bis Nguyễn Thị Minh Khai', 'Tống Khánh Linh', '0912112233', 32000.00, 'GH_NHANH');

INSERT INTO chi_tiet_don_hang (don_hang_id, bien_the_id, ten_san_pham, gia, so_luong) VALUES 
('DH-20260620-0001', 1, 'Len Cotton Milk', 25000.00, 1),
('DH-20260621-0001', 2, 'Kim Móc Cán Dẻo Tulip - 2.0mm', 120000.00, 2),
('DH-20260621-0002', 3, 'Kim Móc Cán Dẻo Tulip - 3.0mm', 125000.00, 1),
('DH-20260622-0001', 7, 'Bộ Kim Đan Vòng Gỗ Sồi - 5.0mm', 90000.00, 1),
('DH-20260623-0001', 4, 'Len Sợi Nhung Đũa - Đỏ Đô', 45000.00, 3),
('DH-20260624-0001', 5, 'Len Sợi Nhung Đũa - Xanh Rêu', 45000.00, 1),
('DH-20260625-0001', 6, 'Bộ Kim Đan Vòng Gỗ Sồi - 4.0mm', 85000.00, 2),
('DH-20260626-0001', 8, 'Bộ Kim Đan Vòng Gỗ Sồi - 6.0mm', 95000.00, 4),
('DH-20260627-0001', 9, 'Bộ Kim Đan Vòng Gỗ Sồi - 7.0mm', 100000.00, 1),
('DH-20260627-0002', 10, 'Vé Workshop Đan Khăn Căn Bản', 350000.00, 1),
('DH-20260628-0001', 4, 'Len Sợi Nhung Đũa - Đỏ Đô', 45000.00, 4),
('DH-20260628-0002', 1, 'Len Cotton Milk', 25000.00, 6),
('DH-20260628-0003', 2, 'Kim Móc Cán Dẻo Tulip - 2.0mm', 160000.00, 2),
('DH-20260629-0001', 4, 'Len Sợi Nhung Đũa - Đỏ Đô', 52500.00, 4),
('DH-20260629-0002', 11, 'Thú Bông Khủng Long Xanh', 195000.00, 1),
('DH-20260629-0003', 12, 'Sợi Dệt Macrame Cotton', 110000.00, 1);

INSERT INTO lich_su_trang_thai_don_hang (don_hang_id, trang_thai) VALUES 
('DH-20260620-0001', 'pending'), ('DH-20260620-0001', 'processing'), ('DH-20260620-0001', 'shipping'), ('DH-20260620-0001', 'completed'),
('DH-20260621-0001', 'pending'), ('DH-20260621-0002', 'pending'), ('DH-20260621-0002', 'processing'),
('DH-20260622-0001', 'pending'), ('DH-20260622-0001', 'processing'), ('DH-20260622-0001', 'shipping'),
('DH-20260623-0001', 'pending'), ('DH-20260623-0001', 'processing'), ('DH-20260623-0001', 'shipping'), ('DH-20260623-0001', 'completed'),
('DH-20260624-0001', 'pending'), ('DH-20260624-0001', 'cancelled'), ('DH-20260628-0002', 'pending'), ('DH-20260628-0002', 'processing'),
('DH-20260629-0002', 'pending'), ('DH-20260629-0002', 'completed'), ('DH-20260629-0003', 'pending');

-- ----------------------------------------
-- 7. BẢNG: THANH_TOAN & HOAN_TIEN 
-- ----------------------------------------
INSERT INTO thanh_toan (don_hang_id, phuong_thuc, trang_thai, ma_tham_chieu) VALUES 
('DH-20260620-0001', 'COD', 'paid', 'COD-003'), ('DH-20260621-0001', 'COD', 'pending', NULL), ('DH-20260621-0002', 'COD', 'pending', NULL),
('DH-20260622-0001', 'COD', 'pending', NULL), ('DH-20260623-0001', 'COD', 'paid', 'COD-007'), ('DH-20260624-0001', 'COD', 'failed', NULL),
('DH-20260625-0001', 'COD', 'pending', NULL), ('DH-20260626-0001', 'COD', 'paid', 'COD-010'), ('DH-20260627-0001', 'COD', 'pending', NULL),
('DH-20260627-0002', 'COD', 'pending', NULL), ('DH-20260628-0001', 'COD', 'paid', 'COD-013'), ('DH-20260628-0002', 'COD', 'pending', NULL),
('DH-20260628-0003', 'COD', 'pending', NULL), ('DH-20260629-0001', 'COD', 'pending', NULL), ('DH-20260629-0002', 'MOMO', 'paid', 'MOMO-PAY77'),
('DH-20260629-0003', 'MOMO', 'pending', NULL);

INSERT INTO hoan_tien (don_hang_id, so_tien, ly_do, trang_thai) VALUES 
('DH-20260624-0001', 45000.00, 'Khách hàng chủ động hủy đơn hàng', 'success'),
('DH-20260621-0001', 240000.00, 'Hệ thống hoàn tiền do kho hết hàng thình lình', 'failed'),
('DH-20260621-0002', 30000.00, 'Áp sai giá trị voucher, hoàn tiền thừa', 'pending'),
('DH-20260622-0001', 90000.00, 'Sản phẩm móp méo bưu tá trả lại kho', 'pending'),
('DH-20260623-0001', 15000.00, 'Hoàn tiền hỗ trợ tổn thất vận chuyển chậm', 'success'),
('DH-20260620-0001', 0.00, 'Giao dịch test hệ thống xử lý lỗi hoàn', 'failed'),
('DH-20260625-0001', 20000.00, 'Hoàn một phần tiền từ chương trình marketing bổ sung', 'pending'),
('DH-20260626-0001', 50000.00, 'Đóng thiếu 1 cuộn len trong gói hàng', 'success'),
('DH-20260627-0001', 10000.00, 'Bồi thường khách do trễ hạn cam kết', 'pending'),
('DH-20260627-0002', 350000.00, 'Hủy lịch Workshop hoàn tiền 100% học phí', 'success'),
('DH-20260628-0002', 25000.00, 'Khách giảm số lượng cuộn len khi đóng hàng', 'success'),
('DH-20260628-0003', 32000.00, 'Hoàn lại tiền chênh lệch chương trình Flash Sale', 'pending'),
('DH-20260629-0001', 52500.00, 'Hoàn trả tiền 1 cuộn nhung đũa bị lỗi sợi', 'success'),
('DH-20260623-0001', 5000.00, 'Đền bù voucher lỗi hệ thống', 'success'),
('DH-20260628-0001', 15000.00, 'Sản phẩm giao thiếu phụ kiện mác nút gỗ', 'pending');

-- ----------------------------------------
-- 8. BẢNG: LOYALTY, YEU_THICH & SPIN (Mở rộng dày dặn dữ liệu)
-- ----------------------------------------
INSERT INTO diem_tich_luy (nguoi_dung_id, tong_diem) VALUES 
(4, 150), (5, 240), (6, 95), (7, 0), (8, 450), (9, 30), (10, 620), (11, 10), (12, 105), (1, 0), (15, 80);

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

INSERT INTO luot_quay (nguoi_dung_id, so_luot) VALUES 
(4, 3), (5, 5), (6, 1), (7, 0), (8, 12), (9, 2), (10, 4), (11, 1), (12, 8), (1, 10), (15, 6);

INSERT INTO cau_hinh_qua_quay (cau_hinh_qua_quay_id, loai_qua, gia_tri, ty_le_thang, so_luong_con_lai, trang_thai) VALUES 
(1, 'point', 10, 20.00, 95, 'active'), (2, 'voucher', 1, 10.00, 48, 'active'),
(3, 'none', 0, 50.00, 999, 'active'), (4, 'point', 50, 5.00, 20, 'active'),
(5, 'voucher', 2, 5.00, 10, 'active'), (6, 'point', 100, 2.00, 5, 'active'),
(7, 'voucher', 3, 3.00, 15, 'active'), (8, 'none', 0, 5.00, 200, 'inactive');

INSERT INTO lich_su_quay (nguoi_dung_id, cau_hinh_qua_quay_id) VALUES 
(4, 1), (4, 3), (5, 2), (6, 3), (8, 4), (8, 1), (9, 3), (10, 5), (12, 1), (12, 3), (15, 2), (15, 4), (4, 5), (5, 7), (6, 1);

-- ----------------------------------------
-- 9. BẢNG: WORKSHOP (Đầy đủ 15 bản ghi cho phân hệ hội thảo)
-- ----------------------------------------
INSERT INTO hoi_thao (hoi_thao_id, san_pham_id, tieu_de, mo_ta, dia_diem) VALUES 
(1, 5, 'Workshop đan khăn len cơ bản', 'Hướng dẫn cách gầy mũi đan dòng đầu tiên và hoàn thiện viền khăn', 'TP. Hồ Chí Minh'),
(2, 8, 'Học móc len nâng cao Tulip Nhật', 'Ứng dụng kim cán dẻo móc hoa văn dâu tây, hoa hướng dương nổi', 'Hà Nội'),
(3, 9, 'Tự làm chăn Sofa từ len đũa khổng lồ', 'Kỹ thuật dùng tay không bện các búi len nhung đũa thành chăn nằm', 'Đà Nẵng'),
(4, 10, 'Ứng dụng kim vòng đan mũ không đường may', 'Kỹ thuật giấu chỉ nối nâng cao khi sử dụng kim vòng gỗ sồi', 'TP. Hồ Chí Minh'),
(5, 11, 'Móc thú bông Amigurumi mini cho bé', 'Từng bước tạo hình đầu, thân và ráp các chi tiết thú nhồi bông', 'Cần Thơ'),
(6, 12, 'Chuyên đề sửa các mũi lỗi khi đan móc', 'Phương pháp khắc phục khi bị tuột chỉ, lỏng tay không đều mũi', 'Hải Phòng'),
(7, 13, 'Móc thảm tròn phòng ngủ từ sợi nhung siêu to', 'Thiết kế thảm dệt chân từ sợi len đũa êm ái cho mùa đông', 'Hà Nội'),
(8, 14, 'Đan áo Cardigan len dáng lửng', 'Cách xem bảng chart hình vẽ, tính size len và ráp áo hoàn chỉnh', 'TP. Hồ Chí Minh'),
(9, 15, 'Offline cộng đồng Yêu Đan Móc Việt Nam', 'Giao lưu, trao đổi kinh nghiệm và chia sẻ len sợi thừa', 'Đà Nẵng'),
(10, 16, 'Khóa học đan khăn len cấp tốc làm quà tặng', 'Hoàn thành trọn vẹn mẫu khăn len đơn giản chỉ trong 1 buổi học', 'TP. Hồ Chí Minh'),
(11, 17, 'Nhập môn Thắt nút Nghệ thuật Macrame', 'Tạo hình sản phẩm rèm treo cửa decor nhỏ phong cách Bắc Âu', 'Hà Nội'),
(12, 18, 'Workshop ráp bông len thành túi xách', 'Kết nối các mảnh hoa văn vuông granny square thành túi thời trang', 'TP. Hồ Chí Minh'),
(13, 19, 'Lớp thêu hoa bằng len nổi trên nền canvas', 'Kỹ thuật đâm kim Punch Needle tạo bề mặt xù nổi độc đáo', 'Đà Nẵng'),
(14, 20, 'Khai phá kỹ thuật móc búp bê Chart Tây', 'Đọc hiểu thuật ngữ viết chart nước ngoài và ứng dụng định hình khuôn mặt', 'Hà Nội'),
(15, 21, 'Tự tay dệt ổ nằm ấm áp cho thú cưng', 'Sử dụng len đũa cỡ đại bện nôi ngủ cho chó mèo siêu tốc', 'TP. Hồ Chí Minh');

INSERT INTO hoi_thao_bien_the (hoi_thao_id, bien_the_id, ngay_bat_dau, ngay_ket_thuc, trang_thai) VALUES 
(1, 10, '2026-06-10 09:00:00', '2026-06-10 12:00:00', 'closed'), 
(2, 16, '2026-07-01 14:00:00', '2026-07-01 17:00:00', 'open'),
(3, 17, '2026-07-05 08:30:00', '2026-07-05 11:30:00', 'open'), 
(4, 18, '2026-07-10 18:00:00', '2026-07-10 21:00:00', 'open'),
(5, 19, '2026-07-15 09:00:00', '2026-07-15 12:00:00', 'open'), 
(6, 20, '2026-06-20 13:00:00', '2026-06-20 16:00:00', 'cancelled'),
(7, 21, '2026-07-22 09:00:00', '2026-07-22 12:00:00', 'open'), 
(8, 22, '2026-08-01 08:00:00', '2026-08-01 12:00:00', 'open'),
(9, 23, '2026-08-15 09:00:00', '2026-08-15 17:00:00', 'open'), 
(10, 24, '2026-06-25 14:00:00', '2026-06-25 17:00:00', 'open'),
(11, 25, '2026-07-18 13:30:00', '2026-07-18 16:30:00', 'open'), 
(12, 26, '2026-07-20 09:00:00', '2026-07-20 12:00:00', 'open'),
(13, 27, '2026-07-25 15:00:00', '2026-07-25 18:00:00', 'open'), 
(14, 28, '2026-08-05 09:00:00', '2026-08-05 12:00:00', 'open'),
(15, 29, '2026-08-10 14:00:00', '2026-08-10 17:00:00', 'open');

-- ----------------------------------------
-- 10. BẢNG: THONG_TIN_SHIPPER
-- ----------------------------------------
INSERT INTO thong_tin_shipper (nguoi_dung_id, ma_shipper, cccd, bien_so_xe, dia_chi_ca_nhan, ma_tinh_hoat_dong) VALUES 
(13, 'SHP013', '079090000001', '59A1-12345', '123 Phạm Văn Đồng, TP.HCM', 'HCM'),
(14, 'SHP014', '001090000002', '29B1-67890', '456 Giảng Võ, Hà Nội', 'HN');

-- ----------------------------------------
-- 11. BẢNG: MUC_DOI_DIEM & LICH_SU_DIEM (Hệ thống Loyalty)
-- ----------------------------------------
INSERT INTO muc_doi_diem (phieu_giam_gia_id, diem_yeu_cau, trang_thai, ngay_tao) VALUES 
(11, 100, 'active', '2026-06-01 10:00:00'),
(8, 200, 'active', '2026-06-01 10:05:00'),
(14, 300, 'active', '2026-06-05 09:00:00'),
(6, 500, 'active', '2026-06-10 14:30:00'),
(7, 400, 'inactive', '2026-06-12 08:00:00');

INSERT INTO lich_su_diem (nguoi_dung_id, so_diem, loai_giao_dich, tham_chieu_id, mo_ta, ngay_tao) VALUES 
(4, 150, 'earn', 'DH-20260620-0001', 'Tích điểm từ đơn hàng DH-20260620-0001', '2026-06-20 15:30:00'),
(5, 340, 'earn', 'DH-20260621-0001', 'Tích điểm từ đơn hàng DH-20260621-0001', '2026-06-21 09:15:00'),
(5, -100, 'redeem', 'FREESHIP15', 'Đổi 100 điểm lấy Voucher FREESHIP15', '2026-06-22 10:00:00'),
(8, 450, 'earn', 'DH-20260623-0001', 'Tích điểm từ đơn hàng DH-20260623-0001', '2026-06-23 11:20:00'),
(10, 620, 'earn', 'DH-20260626-0001', 'Tích điểm từ đơn hàng DH-20260626-0001', '2026-06-26 14:00:00'),
(12, 200, 'earn', 'DH-20260627-0002', 'Tích điểm từ đơn hàng DH-20260627-0002', '2026-06-27 16:00:00'),
(12, -95, 'refund', 'DH-20260627-0002', 'Hệ thống trừ điểm do hoàn trả 1 phần đơn hàng DH-20260627-0002', '2026-06-28 09:00:00');

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