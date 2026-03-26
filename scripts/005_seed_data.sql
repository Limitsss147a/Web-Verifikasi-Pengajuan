-- E-Budgeting System Seed Data
-- Run this after all other scripts for testing/demo purposes

-- Insert sample fiscal years
INSERT INTO fiscal_years (year, is_active, start_date, end_date)
VALUES 
  (2024, false, '2024-01-01', '2024-12-31'),
  (2025, false, '2025-01-01', '2025-12-31'),
  (2026, true, '2026-01-01', '2026-12-31')
ON CONFLICT (year) DO NOTHING;

-- Insert sample institutions
INSERT INTO institutions (id, name, code, address, phone, email)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Dinas Pendidikan', 'DISDIK', 'Jl. Pendidikan No. 1', '021-1234567', 'disdik@example.gov.id'),
  ('22222222-2222-2222-2222-222222222222', 'Dinas Kesehatan', 'DINKES', 'Jl. Kesehatan No. 2', '021-2345678', 'dinkes@example.gov.id'),
  ('33333333-3333-3333-3333-333333333333', 'Dinas Pekerjaan Umum', 'DPU', 'Jl. Pembangunan No. 3', '021-3456789', 'dpu@example.gov.id'),
  ('44444444-4444-4444-4444-444444444444', 'Badan Perencanaan Pembangunan Daerah', 'BAPPEDA', 'Jl. Perencanaan No. 4', '021-4567890', 'bappeda@example.gov.id')
ON CONFLICT (code) DO NOTHING;

-- Insert sample programs for each institution
INSERT INTO programs (institution_id, fiscal_year_id, code, name, description, total_ceiling)
SELECT 
  i.id,
  f.id,
  CASE i.code
    WHEN 'DISDIK' THEN 'PRG-01'
    WHEN 'DINKES' THEN 'PRG-02'
    WHEN 'DPU' THEN 'PRG-03'
    WHEN 'BAPPEDA' THEN 'PRG-04'
  END,
  CASE i.code
    WHEN 'DISDIK' THEN 'Program Peningkatan Mutu Pendidikan'
    WHEN 'DINKES' THEN 'Program Pelayanan Kesehatan Masyarakat'
    WHEN 'DPU' THEN 'Program Pembangunan Infrastruktur'
    WHEN 'BAPPEDA' THEN 'Program Perencanaan Pembangunan'
  END,
  CASE i.code
    WHEN 'DISDIK' THEN 'Program untuk meningkatkan kualitas pendidikan di daerah'
    WHEN 'DINKES' THEN 'Program untuk meningkatkan layanan kesehatan masyarakat'
    WHEN 'DPU' THEN 'Program pembangunan dan pemeliharaan infrastruktur'
    WHEN 'BAPPEDA' THEN 'Program perencanaan dan koordinasi pembangunan daerah'
  END,
  CASE i.code
    WHEN 'DISDIK' THEN 5000000000
    WHEN 'DINKES' THEN 7500000000
    WHEN 'DPU' THEN 15000000000
    WHEN 'BAPPEDA' THEN 2500000000
  END
FROM institutions i
CROSS JOIN fiscal_years f
WHERE f.is_active = true
ON CONFLICT (institution_id, code, fiscal_year_id) DO NOTHING;

-- Insert sample activities for Dinas Pendidikan programs
INSERT INTO activities (program_id, code, name, description, total_ceiling)
SELECT 
  p.id,
  'KEG-01',
  'Pengadaan Sarana Pendidikan',
  'Kegiatan pengadaan peralatan dan perlengkapan pendidikan',
  2000000000
FROM programs p
JOIN institutions i ON i.id = p.institution_id
WHERE i.code = 'DISDIK'
ON CONFLICT DO NOTHING;

INSERT INTO activities (program_id, code, name, description, total_ceiling)
SELECT 
  p.id,
  'KEG-02',
  'Pelatihan Tenaga Pendidik',
  'Kegiatan peningkatan kapasitas guru dan tenaga pendidik',
  1500000000
FROM programs p
JOIN institutions i ON i.id = p.institution_id
WHERE i.code = 'DISDIK'
ON CONFLICT DO NOTHING;

-- Note: Admin user needs to be created through Supabase Auth
-- After creating admin user, update their profile:
-- UPDATE profiles SET role = 'admin' WHERE id = '<admin-user-id>';
