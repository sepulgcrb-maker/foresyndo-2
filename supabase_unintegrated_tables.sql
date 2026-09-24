-- ====================================================================
-- SKEMA SQL TABEL YANG BELUM TERINTEGRASI KE SUPABASE
-- APLIKASI: FORESYNDO PROJECT 2 (GEDUNG FORESYNDO 2)
-- ====================================================================
-- Skrip ini idempotent (dapat dijalankan berulang kali tanpa error).
-- Mencakup 15 tabel operasional, indeks performa, Row Level Security (RLS),
-- dan Publikasi Realtime Supabase.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. TABEL: worker_allocations (Alokasi & Penugasan Harian Tenaga Kerja)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.worker_allocations (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  worker_id TEXT NOT NULL,
  worker_name TEXT NOT NULL,
  worker_role TEXT NOT NULL,
  work_item_id TEXT NOT NULL,
  work_item_name TEXT NOT NULL,
  work_item_category TEXT,
  allocated_hours NUMERIC DEFAULT 0,
  assigned_date TEXT NOT NULL,
  target_output NUMERIC DEFAULT 0,
  actual_output NUMERIC DEFAULT 0,
  unit TEXT,
  status TEXT DEFAULT 'Dalam Pengerjaan',
  notes TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_worker_allocations_project_id
  ON public.worker_allocations(project_id);

CREATE INDEX IF NOT EXISTS idx_worker_allocations_worker_id
  ON public.worker_allocations(worker_id);

CREATE INDEX IF NOT EXISTS idx_worker_allocations_work_item_id
  ON public.worker_allocations(work_item_id);

CREATE INDEX IF NOT EXISTS idx_worker_allocations_assigned_date
  ON public.worker_allocations(assigned_date);

-- ====================================================================
-- 2. TABEL: daily_attendances (Presensi / Absensi Tenaga Kerja & Lembur)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.daily_attendances (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  date TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  worker_name TEXT NOT NULL,
  role TEXT,
  is_present BOOLEAN DEFAULT true,
  overtime_hours NUMERIC DEFAULT 0,
  notes TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_daily_attendances_date
  ON public.daily_attendances(date);

CREATE INDEX IF NOT EXISTS idx_daily_attendances_worker_id
  ON public.daily_attendances(worker_id);

-- ====================================================================
-- 3. TABEL: project_photos (Dokumentasi Foto Lapangan & Fisik Progres)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.project_photos (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  notes TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_project_photos_project_id
  ON public.project_photos(project_id);

CREATE INDEX IF NOT EXISTS idx_project_photos_category
  ON public.project_photos(category);

CREATE INDEX IF NOT EXISTS idx_project_photos_date
  ON public.project_photos(date);

-- ====================================================================
-- 4. TABEL: calendar_events (Agenda Proyek, Milestone, Rapat & Termin)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  end_date TEXT,
  type TEXT NOT NULL DEFAULT 'milestone',
  status TEXT NOT NULL DEFAULT 'Mendatang',
  description TEXT,
  location TEXT,
  assigned_role TEXT,
  is_custom BOOLEAN DEFAULT false,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_project_id
  ON public.calendar_events(project_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_date
  ON public.calendar_events(date);

CREATE INDEX IF NOT EXISTS idx_calendar_events_type
  ON public.calendar_events(type);

-- ====================================================================
-- 5. TABEL: notifications (Notifikasi Sistem, Review Dokumen, Cuaca)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  timestamp TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'system',
  document_id TEXT,
  uploader_role TEXT,
  uploader_name TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_project_id
  ON public.notifications(project_id);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read
  ON public.notifications(is_read);

-- ====================================================================
-- 6. TABEL: stakeholder_profiles (Profil Pihak Tripartit & TTD Digital)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.stakeholder_profiles (
  role TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  role_name TEXT NOT NULL,
  company TEXT NOT NULL,
  person_name TEXT NOT NULL,
  position TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  sk_number TEXT,
  digital_signature_active BOOLEAN DEFAULT false,
  avatar_url TEXT,
  permissions JSONB NOT NULL,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 7. TABEL: contractor_profiles (Profil Badan Usaha, NIB, IUJK & Manajemen)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.contractor_profiles (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  company_name TEXT NOT NULL,
  brand_name TEXT,
  address TEXT NOT NULL,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  npwp TEXT NOT NULL,
  nib TEXT NOT NULL,
  iujk_number TEXT NOT NULL,
  sbu_number TEXT,
  classification TEXT,
  logo_url TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_holder TEXT,
  notes TEXT,
  management JSONB,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 8. TABEL: bast_submissions (Pengesahan BAST-1 & Workflow Tripartit)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.bast_submissions (
  submission_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  submission_number TEXT NOT NULL,
  submission_date TEXT NOT NULL,
  target_handover_date TEXT,
  contractor_representative TEXT,
  contractor_position TEXT,
  contractor_notes TEXT,
  stage TEXT NOT NULL DEFAULT 'draft',
  attachments JSONB DEFAULT '[]'::jsonb,
  punch_list JSONB DEFAULT '[]'::jsonb,
  mk_recommendation_letter_no TEXT,
  mk_recommendation_date TEXT,
  mk_recommendation_notes TEXT,
  mk_verified_by TEXT,
  owner_approval_date TEXT,
  owner_approval_notes TEXT,
  owner_approved_by TEXT,
  bast_number TEXT,
  title TEXT,
  scope_description TEXT,
  contract_nominal NUMERIC DEFAULT 0,
  handover_date TEXT,
  maintenance_period_days INTEGER DEFAULT 180,
  maintenance_end_date TEXT,
  retention_percent NUMERIC DEFAULT 5,
  retention_value NUMERIC DEFAULT 0,
  contractor_signature JSONB,
  mk_signature JSONB,
  owner_signature JSONB,
  is_completed BOOLEAN DEFAULT false,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bast_submissions_project_id
  ON public.bast_submissions(project_id);

CREATE INDEX IF NOT EXISTS idx_bast_submissions_stage
  ON public.bast_submissions(stage);

-- ====================================================================
-- 9. TABEL: bast_punch_lists (Daftar Defect / Cacat Mutu BAST Lapangan)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.bast_punch_lists (
  id TEXT PRIMARY KEY,
  submission_id TEXT REFERENCES public.bast_submissions(submission_id) ON DELETE CASCADE,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  sector_name TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'Ringan',
  deadline_date TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_date TEXT,
  verified_by_mk BOOLEAN DEFAULT false,
  photo_url TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bast_punch_lists_submission
  ON public.bast_punch_lists(submission_id);

CREATE INDEX IF NOT EXISTS idx_bast_punch_lists_is_resolved
  ON public.bast_punch_lists(is_resolved);

-- ====================================================================
-- 10. TABEL: rab_sectors (Sektor Divisi Anggaran Biaya Kontrak RAB)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.rab_sectors (
  sector_number INTEGER PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  name TEXT NOT NULL,
  budget NUMERIC NOT NULL DEFAULT 0,
  percentage NUMERIC NOT NULL DEFAULT 0,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 11. TABEL: rab_items (Rincian Item Pekerjaan & Analisis Harga RAB)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.rab_items (
  code TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  sector_number INTEGER NOT NULL REFERENCES public.rab_sectors(sector_number) ON DELETE CASCADE,
  description TEXT NOT NULL,
  volume NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  bobot_percent NUMERIC NOT NULL DEFAULT 0,
  target_progress_25_percent NUMERIC DEFAULT 0,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rab_items_sector_number
  ON public.rab_items(sector_number);

-- ====================================================================
-- 12. TABEL: user_roles_pins (Sistem Kredensial PIN Stakeholder)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.user_roles_pins (
  role TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  pin TEXT NOT NULL,
  user_name TEXT,
  last_login TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 13. TABEL: material_approvals (Approval Material Masuk & Barcode Gudang)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.material_approvals (
  id TEXT PRIMARY KEY,
  material_id TEXT NOT NULL REFERENCES public.material_inventory(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  status TEXT DEFAULT 'Menunggu Approval',
  submitted_by TEXT,
  submission_date TEXT,
  approved_by TEXT,
  approved_at TEXT,
  approval_notes TEXT,
  rejection_reason TEXT,
  inspection_doc_ref TEXT,
  barcode TEXT,
  batch_number TEXT,
  location_rack TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_material_approvals_material_id
  ON public.material_approvals(material_id);

CREATE INDEX IF NOT EXISTS idx_material_approvals_status
  ON public.material_approvals(status);

-- ====================================================================
-- 14. TABEL: material_projections (Analisis Kebutuhan & Defisit Material)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.material_projections (
  material_id TEXT PRIMARY KEY REFERENCES public.material_inventory(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  projected_total_demand NUMERIC DEFAULT 0,
  projected_remaining_demand NUMERIC DEFAULT 0,
  stock_difference NUMERIC DEFAULT 0,
  is_deficit BOOLEAN DEFAULT false,
  shortage_quantity NUMERIC DEFAULT 0,
  shortage_cost_idr NUMERIC DEFAULT 0,
  days_of_stock_remaining NUMERIC DEFAULT 0,
  estimated_stockout_date TEXT,
  recommended_order_date TEXT,
  urgency_status TEXT DEFAULT 'Aman',
  urgency_reason TEXT,
  recommended_order_quantity NUMERIC DEFAULT 0,
  speed_multiplier NUMERIC DEFAULT 1.0,
  waste_contingency_percent NUMERIC DEFAULT 5.0,
  alert_threshold_days INTEGER DEFAULT 14,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================================================
-- 15. TABEL: custom_categories (Kategori Tambahan Kustom Proyek)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.custom_categories (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  category_name TEXT NOT NULL,
  scope TEXT DEFAULT 'work_item',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_custom_categories_project_id
  ON public.custom_categories(project_id);

-- ====================================================================
-- 16. TABEL: supplier_partners (Mitra Supplier & Subkontraktor)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.supplier_partners (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  pic_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_holder TEXT,
  npwp TEXT,
  top TEXT NOT NULL DEFAULT 'NET 14 Hari',
  rating NUMERIC(3,2) DEFAULT 5.0 CHECK (rating >= 1.0 AND rating <= 5.0),
  status TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Prioritas', 'On Hold', 'Nonaktif')),
  notes TEXT,
  total_orders_count INTEGER DEFAULT 0,
  total_spent NUMERIC(15,2) DEFAULT 0,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_supplier_partners_project_id ON public.supplier_partners(project_id);
CREATE INDEX IF NOT EXISTS idx_supplier_partners_category ON public.supplier_partners(category);
CREATE INDEX IF NOT EXISTS idx_supplier_partners_status ON public.supplier_partners(status);

-- ====================================================================
-- 17. TABEL: purchase_orders (Purchase Order / Surat Pesanan Material)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id TEXT PRIMARY KEY,
  po_number TEXT UNIQUE NOT NULL,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  supplier_id TEXT NOT NULL REFERENCES public.supplier_partners(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  supplier_name TEXT NOT NULL,
  date TEXT NOT NULL DEFAULT CURRENT_DATE::text,
  delivery_date TEXT,
  material_item TEXT NOT NULL,
  quantity NUMERIC(15,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit TEXT NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  payment_status TEXT NOT NULL DEFAULT 'Belum Lunas' CHECK (payment_status IN ('Belum Lunas', 'DP Dibayar', 'Lunas', 'Dibatalkan')),
  delivery_status TEXT NOT NULL DEFAULT 'Draft' CHECK (delivery_status IN ('Draft', 'Dipesan', 'Sebagian Terkirim', 'Diterima Lengkap', 'Selesai', 'Dibatalkan')),
  delivery_order_ref TEXT,
  notes TEXT,
  signed_by TEXT NOT NULL DEFAULT 'EKO YULIANTO',
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON public.purchase_orders(po_number);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_project_id ON public.purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_delivery_status ON public.purchase_orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_payment_status ON public.purchase_orders(payment_status);

-- ====================================================================
-- 18. TABEL: purchase_order_items (Rincian Item Multi-Material PO)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id TEXT PRIMARY KEY DEFAULT ('POI-' || substr(md5(random()::text), 1, 8)),
  po_id TEXT NOT NULL REFERENCES public.purchase_orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  quantity NUMERIC(15,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit TEXT NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_price NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  delivery_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_po_id ON public.purchase_order_items(po_id);

-- ====================================================================
-- 19. TABEL: contractor_transactions (Buku Kas & Keuangan Kontraktor)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.contractor_transactions (
  id TEXT PRIMARY KEY,
  transaction_number TEXT UNIQUE NOT NULL,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  date TEXT NOT NULL DEFAULT CURRENT_DATE::text,
  type TEXT NOT NULL CHECK (type IN ('Pemasukan', 'Pengeluaran')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  payment_method TEXT NOT NULL DEFAULT 'Transfer Bank' CHECK (payment_method IN ('Transfer Bank', 'Tunai / Kas Kecil', 'Cek / Bilyet Giro')),
  recipient_or_payer TEXT NOT NULL,
  receipt_ref TEXT,
  approved_by TEXT NOT NULL DEFAULT 'EKO YULIANTO',
  status TEXT NOT NULL DEFAULT 'Terverifikasi' CHECK (status IN ('Terverifikasi', 'Menunggu Verifikasi', 'Draf', 'Dibatalkan')),
  notes TEXT,
  po_id TEXT REFERENCES public.purchase_orders(id) ON UPDATE CASCADE ON DELETE SET NULL,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contractor_trx_number ON public.contractor_transactions(transaction_number);
CREATE INDEX IF NOT EXISTS idx_contractor_trx_type ON public.contractor_transactions(type);
CREATE INDEX IF NOT EXISTS idx_contractor_trx_category ON public.contractor_transactions(category);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) & KEBIJAKAN AKSES
-- ====================================================================
ALTER TABLE public.worker_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholder_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bast_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bast_punch_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rab_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rab_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_transactions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'worker_allocations',
    'daily_attendances',
    'project_photos',
    'calendar_events',
    'notifications',
    'stakeholder_profiles',
    'contractor_profiles',
    'bast_submissions',
    'bast_punch_lists',
    'rab_sectors',
    'rab_items',
    'user_roles_pins',
    'material_approvals',
    'material_projections',
    'custom_categories',
    'supplier_partners',
    'purchase_orders',
    'purchase_order_items',
    'contractor_transactions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Akses publik %s" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Akses publik %s" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

-- ====================================================================
-- AKTIVASI SUPABASE REALTIME PUBLICATION
-- ====================================================================
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'worker_allocations',
    'daily_attendances',
    'project_photos',
    'calendar_events',
    'notifications',
    'stakeholder_profiles',
    'contractor_profiles',
    'bast_submissions',
    'bast_punch_lists',
    'rab_sectors',
    'rab_items',
    'user_roles_pins',
    'material_approvals',
    'material_projections',
    'custom_categories',
    'supplier_partners',
    'purchase_orders',
    'purchase_order_items',
    'contractor_transactions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN undefined_object THEN NULL;
    END;
  END LOOP;
END $$;
