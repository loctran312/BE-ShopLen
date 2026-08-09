ALTER TABLE bien_the_san_pham
  ADD COLUMN IF NOT EXISTS gia_von_binh_quan NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS gia_nhap_gan_nhat NUMERIC(10,2);

ALTER TABLE bien_the_san_pham
  ADD CONSTRAINT chk_gia_von_binh_quan_non_negative CHECK (gia_von_binh_quan IS NULL OR gia_von_binh_quan >= 0);

ALTER TABLE bien_the_san_pham
  ADD CONSTRAINT chk_gia_nhap_gan_nhat_non_negative CHECK (gia_nhap_gan_nhat IS NULL OR gia_nhap_gan_nhat >= 0);

ALTER TABLE lich_su_ton_kho
  ADD COLUMN IF NOT EXISTS gia_nhap NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS thanh_tien NUMERIC(12,2);

ALTER TABLE lich_su_ton_kho
  ADD CONSTRAINT chk_gia_nhap_non_negative CHECK (gia_nhap IS NULL OR gia_nhap >= 0);

ALTER TABLE lich_su_ton_kho
  ADD CONSTRAINT chk_thanh_tien_non_negative CHECK (thanh_tien IS NULL OR thanh_tien >= 0);

ALTER TABLE don_hang
  ADD COLUMN IF NOT EXISTS tong_doanh_thu NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS tong_loi_nhuan NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS ty_le_loi_nhuan NUMERIC(6,2);
