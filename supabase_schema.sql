-- ====================================================================
-- SKEMA LENGKAP DATABASE SUPABASE (POSTGRESQL)
-- SISTEM MONITORING PEMBANGUNAN PROYEK GEDUNG PT. FORESYNDO GLOBAL INDONESIA
-- Lokasi Proyek: Jatitujuh, Majalengka, Jawa Barat
-- ====================================================================
-- PETUNJUK PENGGUNAAN:
-- 1. Buka Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Pilih Project Anda
-- 3. Buka menu "SQL Editor" pada bilah sisi kiri
-- 4. Klik "New query", tempel (paste) seluruh isi skrip ini, lalu klik "Run"
-- ====================================================================

-- Aktifkan ekstensi UUID jika belum ada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. TABEL SNAPSHOT MASTER (Sync State Menyeluruh & Realtime Backup)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.project_snapshots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  data JSONB NOT NULL,
  synced_by TEXT DEFAULT 'System',
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 2. TABEL INFORMASI PROYEK (Identitas & Kontrak Proyek)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.project_info (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  owner TEXT NOT NULL,
  contractor TEXT NOT NULL,
  consultant TEXT NOT NULL,
  location TEXT NOT NULL,
  contract_number TEXT,
  contract_value NUMERIC DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  duration_weeks INTEGER DEFAULT 24,
  status TEXT DEFAULT 'Berjalan',
  current_week INTEGER DEFAULT 1,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 3. TABEL DOKUMEN PROYEK (DED, Shop Drawing, Kontrak, Notulen, BAST)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.project_documents (
  id TEXT PRIMARY KEY,
  document_number TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- Kontrak, Gambar DED, Shop Drawing, As-Built, Laporan, Notulen
  file_type TEXT DEFAULT 'PDF',
  file_size TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'Draft', -- Draft, Submitted, Under Review, Approved, Revision, Rejected
  version TEXT DEFAULT 'v1.0',
  upload_date TEXT,
  uploaded_by TEXT,
  uploaded_by_role TEXT, -- Owner, Konsultan, Kontraktor
  description TEXT,
  confidentiality TEXT DEFAULT 'Internal Proyek',
  signatures JSONB DEFAULT '[]'::jsonb,
  review_notes JSONB DEFAULT '[]'::jsonb,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 4. TABEL LAPORAN HARIAN LAPANGAN (Daily Field Logs & Monitoring)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  weather TEXT DEFAULT 'Cerah', -- Cerah, Berawan, Hujan Ringan, Hujan Lebat
  worker_count INTEGER DEFAULT 0,
  mandor_name TEXT,
  activity_summary TEXT,
  volume_done TEXT,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  created_by TEXT,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 5. TABEL ITEM PEKERJAAN & KURVA S (Time Schedule & WBS)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.work_items (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- Persiapan, Struktur, Arsitektur, MEP
  weight NUMERIC DEFAULT 0,
  unit TEXT,
  volume NUMERIC DEFAULT 0,
  price_per_unit NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  weekly_plan NUMERIC[] DEFAULT ARRAY[]::NUMERIC[],
  weekly_actual NUMERIC[] DEFAULT ARRAY[]::NUMERIC[],
  status TEXT DEFAULT 'Belum Mulai',
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 6. TABEL INVENTARIS MATERIAL & LOGISTIK
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.material_inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- Semen, Besi Beton, Agregat, Bata, Cat, Baja
  unit TEXT NOT NULL,
  total_rab NUMERIC DEFAULT 0,
  ordered NUMERIC DEFAULT 0,
  arrived NUMERIC DEFAULT 0,
  used NUMERIC DEFAULT 0,
  stock NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Aman', -- Aman, Kritis, Menipis, Habis
  min_threshold NUMERIC DEFAULT 0,
  supplier TEXT,
  last_updated TEXT,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 7. TABEL TENAGA KERJA (Manpower & Roster)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.workers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trade TEXT NOT NULL, -- Tukang Batu, Tukang Besi, Tukang Kayu, Pekerja, Mandor
  mandor TEXT,
  phone TEXT,
  status TEXT DEFAULT 'Aktif',
  daily_rate NUMERIC DEFAULT 0,
  rating NUMERIC DEFAULT 5,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 8. TABEL MONITORING ALAT BERAT (Heavy Equipment)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.equipments (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- Excavator, Crane, Molen, Dumptruck, Genset
  capacity TEXT,
  operator TEXT,
  daily_rent_cost NUMERIC DEFAULT 0,
  condition TEXT DEFAULT 'Baik', -- Baik, Perawatan, Rusak
  location TEXT,
  working_hours_today NUMERIC DEFAULT 0,
  total_working_hours NUMERIC DEFAULT 0,
  fuel_level TEXT DEFAULT '80%',
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 9. TABEL TERMIN PEMBAYARAN (Progress Claim & Termin 1 s/d 5)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.payment_terms (
  term_number INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  percentage NUMERIC NOT NULL,
  planned_amount NUMERIC NOT NULL,
  target_progress NUMERIC NOT NULL,
  invoice_number TEXT,
  status TEXT DEFAULT 'Terkunci', -- Terkunci, Diajukan, Diverifikasi MK, Disetujui Owner, Cair
  submission_date TEXT,
  verification_date_mk TEXT,
  approval_date_owner TEXT,
  notes TEXT,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 10. TABEL AUDIT LOG TRIPARTIT (Jejak Aktivitas & Akuntabilitas)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  role TEXT,
  user_name TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- PENGATURAN INDEX UNTUK PERFORMA QUERY TINGGI
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.project_documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.project_documents(status);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON public.daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_work_items_category ON public.work_items(category);
CREATE INDEX IF NOT EXISTS idx_material_status ON public.material_inventory(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- ====================================================================
-- AKTIFKAN ROW LEVEL SECURITY (RLS)
-- ====================================================================
ALTER TABLE public.project_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- KEBIJAKAN AKSES (POLICIES) UNTUK INTEGRASI WEB & API
-- ====================================================================
DROP POLICY IF EXISTS "Akses publik snapshots" ON public.project_snapshots;
CREATE POLICY "Akses publik snapshots" ON public.project_snapshots FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik project info" ON public.project_info;
CREATE POLICY "Akses publik project info" ON public.project_info FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik documents" ON public.project_documents;
CREATE POLICY "Akses publik documents" ON public.project_documents FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik daily logs" ON public.daily_logs;
CREATE POLICY "Akses publik daily logs" ON public.daily_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik work items" ON public.work_items;
CREATE POLICY "Akses publik work items" ON public.work_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik materials" ON public.material_inventory;
CREATE POLICY "Akses publik materials" ON public.material_inventory FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik workers" ON public.workers;
CREATE POLICY "Akses publik workers" ON public.workers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik equipments" ON public.equipments;
CREATE POLICY "Akses publik equipments" ON public.equipments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik payment terms" ON public.payment_terms;
CREATE POLICY "Akses publik payment terms" ON public.payment_terms FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik audit logs" ON public.audit_logs;
CREATE POLICY "Akses publik audit logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- AKTIFKAN SUPABASE REALTIME (Websocket Push & Sync Multi-Device)
-- ====================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_snapshots;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.project_documents;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_terms;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ====================================================================
-- DATA AWAL DEFAULT (SEED DATA)
-- ====================================================================
INSERT INTO public.project_info (id, name, code, owner, contractor, consultant, location, contract_number, contract_value, start_date, end_date, duration_weeks, status, current_week)
VALUES (
  'FORESYNDO-PROJECT-2',
  'Pembangunan Gedung Kantor & Fasilitas Produksi Foresyndo 2',
  'FS-2025-002',
  'PT. Foresyndo Global Indonesia',
  'PT. Konstruksi Nusantara Prima',
  'PT. Mitra Cipta Engineering (Konsultan MK)',
  'Kecamatan Jatitujuh, Kabupaten Majalengka, Jawa Barat',
  '048/SPK-FS/V/2025',
  4850000000,
  '2025-06-01',
  '2025-11-15',
  24,
  'Berjalan',
  1
)
ON CONFLICT (id) DO NOTHING;
