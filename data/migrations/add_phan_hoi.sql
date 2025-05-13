-- SQL script to add phan_hoi column
ALTER TABLE yeu_cau_lien_he
ADD COLUMN phan_hoi TEXT NULL AFTER noi_dung;
