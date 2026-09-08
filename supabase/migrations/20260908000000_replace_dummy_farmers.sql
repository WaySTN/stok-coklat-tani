-- Hapus semua data farmer dummy lama
TRUNCATE TABLE farmers;

-- Masukkan 10 anggota tani asli Kelompok Tani Mulyojati
INSERT INTO farmers (nama, no_hp) VALUES
  ('M. Nawawi', '0857-7309-13340'),
  ('Taufik Hidayat', '0857-3250-9925'),
  ('Hj. Muslikha', '0857-0814-3053'),
  ('Basrohi', '0852-5936-5677'),
  ('H. Jamil', '0812-3588-2907'),
  ('Rohmatus Sholihatin', '0856-4885-9766'),
  ('Tawi', '0858-5612-3011'),
  ('Askamil', '0821-3180-0553'),
  ('Drawi', '0822-3210-0790'),
  ('Tohir', '0858-0669-0397')
ON CONFLICT (nama) DO NOTHING;
