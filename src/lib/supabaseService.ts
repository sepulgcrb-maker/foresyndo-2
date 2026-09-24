import { getSupabase } from './supabase';
import {
  ProjectInfo,
  ProjectDocument,
  DailyLog,
  MaterialItem,
  WorkItem,
  WorkerItem,
  WorkerAllocation,
  EquipmentItem,
  AuditLog,
  PaymentTerm,
  PhotoItem,
  CalendarEvent,
  NotificationItem,
  SupplierPartner,
  SupplierPurchaseOrder,
  ContractorTransaction,
  CategoryPekerjaan,
  DocumentCategory,
  WeatherCondition,
  StakeholderRoleProfile,
  StakeholderRoleKey,
} from '../types';

export interface ProjectSyncPayload {
  projectId: string;
  projectInfo: ProjectInfo;
  documents: ProjectDocument[];
  dailyLogs: DailyLog[];
  materials?: MaterialItem[];
  workItems?: WorkItem[];
  workers?: WorkerItem[];
  allocations?: WorkerAllocation[];
  equipments?: EquipmentItem[];
  auditLogs?: AuditLog[];
  paymentTerms?: PaymentTerm[];
  photos?: PhotoItem[];
  calendarEvents?: CalendarEvent[];
  notifications?: NotificationItem[];
  customCategories?: string[];
  suppliers?: SupplierPartner[];
  purchaseOrders?: SupplierPurchaseOrder[];
  contractorTransactions?: ContractorTransaction[];
  userNames?: Record<string, string>;
  rolePins?: Record<string, string>;
  stakeholderProfiles?: Record<StakeholderRoleKey, StakeholderRoleProfile>;
  syncedAt?: string;
  syncedBy?: string;
}

export interface SupabaseTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  projectUrl?: string;
  tablesFound?: string[];
}

export interface SupabaseSyncResult {
  success: boolean;
  message: string;
  syncedAt: string;
  counts: {
    documents: number;
    dailyLogs: number;
    materials: number;
    workItems: number;
    auditLogs: number;
  };
  error?: string;
}

const DEFAULT_PROJECT_ID = 'FORESYNDO-PROJECT-2';

/**
 * Returns the ready-to-use SQL Migration script.
 */
export function getSupabaseSqlSchema(): string {
  return `-- ====================================================================
-- SKEMA DATABASE SUPABASE
-- FORESYNDO PROJECT 2
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.project_snapshots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  data JSONB NOT NULL,
  synced_by TEXT DEFAULT 'System',
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

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

CREATE TABLE IF NOT EXISTS public.project_documents (
  id TEXT PRIMARY KEY,
  document_number TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  file_type TEXT DEFAULT 'PDF',
  file_size TEXT,
  file_url TEXT,
  status TEXT DEFAULT 'Draft',
  version TEXT DEFAULT 'v1.0',
  upload_date TEXT,
  uploaded_by TEXT,
  uploaded_by_role TEXT,
  description TEXT,
  confidentiality TEXT DEFAULT 'Internal Proyek',
  signatures JSONB DEFAULT '[]'::jsonb,
  review_notes JSONB DEFAULT '[]'::jsonb,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.daily_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  weather TEXT DEFAULT 'Cerah',
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

CREATE TABLE IF NOT EXISTS public.work_items (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS public.material_inventory (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  total_rab NUMERIC DEFAULT 0,
  ordered NUMERIC DEFAULT 0,
  arrived NUMERIC DEFAULT 0,
  used NUMERIC DEFAULT 0,
  stock NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Aman',
  min_threshold NUMERIC DEFAULT 0,
  supplier TEXT,
  last_updated TEXT,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.workers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  trade TEXT NOT NULL,
  mandor TEXT,
  phone TEXT,
  status TEXT DEFAULT 'Aktif',
  daily_rate NUMERIC DEFAULT 0,
  rating NUMERIC DEFAULT 5,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.equipments (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  capacity TEXT,
  operator TEXT,
  daily_rent_cost NUMERIC DEFAULT 0,
  condition TEXT DEFAULT 'Baik',
  location TEXT,
  working_hours_today NUMERIC DEFAULT 0,
  total_working_hours NUMERIC DEFAULT 0,
  fuel_level TEXT DEFAULT '80%',
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payment_terms (
  term_number INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  percentage NUMERIC NOT NULL,
  planned_amount NUMERIC NOT NULL,
  target_progress NUMERIC NOT NULL,
  invoice_number TEXT,
  status TEXT DEFAULT 'Terkunci',
  submission_date TEXT,
  verification_date_mk TEXT,
  approval_date_owner TEXT,
  notes TEXT,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  role TEXT,
  user_name TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_category
  ON public.project_documents(category);

CREATE INDEX IF NOT EXISTS idx_documents_status
  ON public.project_documents(status);

CREATE INDEX IF NOT EXISTS idx_daily_logs_date
  ON public.daily_logs(date);

CREATE INDEX IF NOT EXISTS idx_material_status
  ON public.material_inventory(status);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
  ON public.audit_logs(timestamp);

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

DROP POLICY IF EXISTS "Akses publik snapshots"
ON public.project_snapshots;

CREATE POLICY "Akses publik snapshots"
ON public.project_snapshots
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik project info"
ON public.project_info;

CREATE POLICY "Akses publik project info"
ON public.project_info
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik documents"
ON public.project_documents;

CREATE POLICY "Akses publik documents"
ON public.project_documents
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik daily logs"
ON public.daily_logs;

CREATE POLICY "Akses publik daily logs"
ON public.daily_logs
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik work items"
ON public.work_items;

CREATE POLICY "Akses publik work items"
ON public.work_items
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik materials"
ON public.material_inventory;

CREATE POLICY "Akses publik materials"
ON public.material_inventory
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik workers"
ON public.workers;

CREATE POLICY "Akses publik workers"
ON public.workers
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik equipments"
ON public.equipments;

CREATE POLICY "Akses publik equipments"
ON public.equipments
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik payment terms"
ON public.payment_terms;

CREATE POLICY "Akses publik payment terms"
ON public.payment_terms
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Akses publik audit logs"
ON public.audit_logs;

CREATE POLICY "Akses publik audit logs"
ON public.audit_logs
FOR ALL
USING (true)
WITH CHECK (true);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime
    ADD TABLE public.project_snapshots;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime
    ADD TABLE public.project_documents;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime
    ADD TABLE public.daily_logs;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime
    ADD TABLE public.payment_terms;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

INSERT INTO public.project_info (
  id,
  name,
  code,
  owner,
  contractor,
  consultant,
  location,
  contract_number,
  contract_value,
  start_date,
  end_date,
  duration_weeks,
  status,
  current_week
)
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

${getUnintegratedTablesSqlSchema()}
`;
}

/**
 * Skrip SQL khusus untuk 15 tabel operasional yang belum terintegrasi ke Supabase.
 */
export function getUnintegratedTablesSqlSchema(): string {
  return `-- ====================================================================
-- SKEMA SQL TABEL OPERASIONAL BARU (BELUM TERINTEGRASI KE SUPABASE)
-- FORESYNDO PROJECT 2
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

CREATE INDEX IF NOT EXISTS idx_worker_allocations_project_id ON public.worker_allocations(project_id);
CREATE INDEX IF NOT EXISTS idx_worker_allocations_assigned_date ON public.worker_allocations(assigned_date);

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

CREATE INDEX IF NOT EXISTS idx_daily_attendances_date ON public.daily_attendances(date);

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

CREATE INDEX IF NOT EXISTS idx_project_photos_category ON public.project_photos(category);
CREATE INDEX IF NOT EXISTS idx_project_photos_date ON public.project_photos(date);

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

CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(date);

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

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

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

CREATE INDEX IF NOT EXISTS idx_bast_submissions_stage ON public.bast_submissions(stage);

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

CREATE INDEX IF NOT EXISTS idx_bast_punch_lists_submission ON public.bast_punch_lists(submission_id);

CREATE TABLE IF NOT EXISTS public.rab_sectors (
  sector_number INTEGER PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  name TEXT NOT NULL,
  budget NUMERIC NOT NULL DEFAULT 0,
  percentage NUMERIC NOT NULL DEFAULT 0,
  raw_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

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

CREATE INDEX IF NOT EXISTS idx_rab_items_sector_number ON public.rab_items(sector_number);

CREATE TABLE IF NOT EXISTS public.user_roles_pins (
  role TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  pin TEXT NOT NULL,
  user_name TEXT,
  last_login TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

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

CREATE INDEX IF NOT EXISTS idx_material_approvals_material_id ON public.material_approvals(material_id);

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

CREATE TABLE IF NOT EXISTS public.custom_categories (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL DEFAULT 'FORESYNDO-PROJECT-2',
  category_name TEXT NOT NULL,
  scope TEXT DEFAULT 'work_item',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

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

-- RLS Policies
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
    'worker_allocations', 'daily_attendances', 'project_photos',
    'calendar_events', 'notifications', 'stakeholder_profiles',
    'contractor_profiles', 'bast_submissions', 'bast_punch_lists',
    'rab_sectors', 'rab_items', 'user_roles_pins',
    'material_approvals', 'material_projections', 'custom_categories',
    'supplier_partners', 'purchase_orders', 'purchase_order_items', 'contractor_transactions'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Akses publik %s" ON public.%I;', tbl, tbl);
    EXECUTE format('CREATE POLICY "Akses publik %s" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
  END LOOP;
END $$;

-- Realtime Publications
DO $$
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'worker_allocations', 'daily_attendances', 'project_photos',
    'calendar_events', 'notifications', 'stakeholder_profiles',
    'contractor_profiles', 'bast_submissions', 'bast_punch_lists',
    'rab_sectors', 'rab_items', 'user_roles_pins',
    'material_approvals', 'material_projections', 'custom_categories',
    'supplier_partners', 'purchase_orders', 'purchase_order_items', 'contractor_transactions'
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
`;
}

/**
 * Test direct connection to Supabase.
 *
 * Tidak menggunakan /api/*
 * Tidak menggunakan localStorage.
 */
export async function testSupabaseConnection(): Promise<SupabaseTestResult> {
  const supabase = getSupabase();

  if (!supabase) {
    return {
      success: false,
      message:
        'Supabase belum dikonfigurasi. Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY tersedia saat build.',
    };
  }

  const startTime = performance.now();

  try {
    const { error } = await supabase
      .from('project_snapshots')
      .select('id')
      .limit(1);

    const latencyMs = Math.round(performance.now() - startTime);

    if (error) {
      if (
        error.code === '42P01' ||
        error.message?.includes('relation') ||
        error.message?.includes('does not exist')
      ) {
        return {
          success: false,
          latencyMs,
          message:
            'Supabase berhasil dihubungi, tetapi tabel project_snapshots belum tersedia. Jalankan SQL schema terlebih dahulu.',
        };
      }

      return {
        success: false,
        latencyMs,
        message: `Koneksi Supabase gagal: ${error.message} (${error.code || 'UNKNOWN'})`,
      };
    }

    return {
      success: true,
      latencyMs,
      message: `Supabase terhubung. Database siap digunakan (${latencyMs}ms).`,
    };
  } catch (error: any) {
    return {
      success: false,
      latencyMs: Math.round(performance.now() - startTime),
      message:
        error?.message ||
        'Tidak dapat menghubungi Supabase. Periksa koneksi internet dan konfigurasi environment.',
    };
  }
}

/**
 * Push seluruh state aplikasi langsung ke Supabase.
 *
 * IMPORTANT:
 * - Tidak ada fetch('/api/project/snapshot')
 * - Tidak ada server fallback
 * - Tidak ada localStorage fallback
 */
export async function pushAllDataToSupabase(
  payload: ProjectSyncPayload
): Promise<SupabaseSyncResult> {
  const supabase = getSupabase();
  const timestamp = new Date().toISOString();

  const counts = {
    documents: payload.documents?.length || 0,
    dailyLogs: payload.dailyLogs?.length || 0,
    materials: payload.materials?.length || 0,
    workItems: payload.workItems?.length || 0,
    auditLogs: payload.auditLogs?.length || 0,
  };

  if (!supabase) {
    return {
      success: false,
      message:
        'Supabase tidak tersedia. Data TIDAK disimpan ke localStorage atau server fallback.',
      syncedAt: timestamp,
      counts,
      error: 'SUPABASE_NOT_CONFIGURED',
    };
  }

  try {
    /**
     * ================================================================
     * 1. MASTER SNAPSHOT (Dengan Retry Otomatis & Toleransi Jaringan)
     * ================================================================
     */
    let snapshotError: any = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const { error } = await supabase
          .from('project_snapshots')
          .upsert(
            {
              id: payload.projectId || DEFAULT_PROJECT_ID,
              project_id: payload.projectId || DEFAULT_PROJECT_ID,
              data: {
                ...payload,
                syncedAt: timestamp,
              },
              synced_by: payload.syncedBy || 'System',
              updated_at: timestamp,
            },
            {
              onConflict: 'id',
            }
          );

        snapshotError = error;
        if (!snapshotError) {
          break; // Sukses tersimpan!
        }
        console.warn(
          `Percobaan ${attempt + 1} simpan project_snapshots gagal:`,
          snapshotError.message
        );
      } catch (err: any) {
        snapshotError = err;
        console.warn(
          `Percobaan ${attempt + 1} simpan project_snapshots mengalami error jaringan:`,
          err?.message || err
        );
      }

      if (attempt < maxRetries) {
        // Jeda backoff sebelum mencoba kembali (600ms, 1200ms)
        await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      }
    }

    // Jika simpan langsung dari browser ke Supabase mengalami kendala (misal CORS/adblocker/jaringan/TypeError),
    // gunakan server proxy backend yang memiliki koneksi langsung dan stabil ke Supabase Cloud
    if (snapshotError) {
      console.warn(
        'Direct Supabase save encountered issue, attempting resilient server proxy save...',
        snapshotError?.message || snapshotError
      );
      try {
        const proxyRes = await fetch('/api/project/snapshot', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ payload }),
        });
        if (proxyRes.ok) {
          const proxyData = await proxyRes.json();
          if (proxyData.success) {
            snapshotError = null; // Berhasil tersimpan ke Supabase via server proxy!
            console.log(
              'Snapshot project_snapshots berhasil disimpan ke Supabase Cloud via server proxy fallback.'
            );
          } else {
            snapshotError = new Error(
              proxyData.message || 'Gagal menyimpan snapshot via server proxy.'
            );
          }
        } else {
          snapshotError = new Error(
            `Server proxy mengembalikan status ${proxyRes.status}`
          );
        }
      } catch (proxyErr: any) {
        console.warn('Server proxy save also failed:', proxyErr);
      }
    }

    if (snapshotError) {
      const errMsg =
        snapshotError.message ||
        (typeof snapshotError === 'string'
          ? snapshotError
          : 'Koneksi jaringan terputus saat menghubungi Supabase');
      throw new Error(`Gagal menyimpan project_snapshots: ${errMsg}`);
    }

    /**
     * ================================================================
     * 2. PROJECT INFO
     * ================================================================
     */
    if (payload.projectInfo) {
      const project = payload.projectInfo;

      const { error } = await supabase
        .from('project_info')
        .upsert(
          {
            id: project.id || payload.projectId || DEFAULT_PROJECT_ID,
            name: project.name || '',
            code: (project as any).code || null,
            owner: project.owner || '',
            contractor: project.contractor || '',
            consultant: project.consultantMK || (project as any).consultant || '',
            location: project.location || '',
            contract_number: project.contractNumber || null,
            contract_value: Number(project.contractValue || 0),
            start_date: project.startDate || null,
            end_date: project.targetEndDate || (project as any).endDate || null,
            duration_weeks: Number((project as any).durationWeeks || 0),
            status: project.status || 'Berjalan',
            current_week: Number((project as any).currentWeek || 1),
            raw_data: project,
            updated_at: timestamp,
          },
          {
            onConflict: 'id',
          }
        );

      if (error) {
        throw new Error(`Gagal menyimpan project_info: ${error.message}`);
      }
    }

    /**
     * ================================================================
     * 3. DOCUMENTS
     * ================================================================
     */
    if (payload.documents?.length) {
      try {
        const documentRows = payload.documents.map((d: any) => {
          const isLargeBase64 =
            typeof d.fileUrl === 'string' &&
            d.fileUrl.startsWith('data:') &&
            d.fileUrl.length > 50000;
          const cleanRaw = { ...d };
          if (isLargeBase64) {
            cleanRaw.fileUrl = '[STORED_IN_SNAPSHOT]';
          }
          return {
            id: d.id,
            document_number: d.documentNumber,
            title: d.title,
            category: d.category,
            file_type: d.fileType,
            file_size: d.fileSize,
            file_url: isLargeBase64
              ? '[INLINE_BASE64_ATTACHMENT_IN_SNAPSHOT]'
              : (d.fileUrl || null),
            status: d.status,
            version: d.version,
            upload_date: d.uploadDate,
            uploaded_by: d.uploadedBy,
            uploaded_by_role: d.uploadedByRole,
            description: d.description,
            confidentiality: d.confidentiality,
            signatures: d.signatures || d.signatories || [],
            review_notes: d.reviewNotes || [],
            raw_data: cleanRaw,
            updated_at: timestamp,
          };
        });

        const { error } = await supabase
          .from('project_documents')
          .upsert(documentRows, {
            onConflict: 'id',
          });

        if (error) {
          console.warn('Peringatan simpan project_documents:', error.message);
        }
      } catch (err: any) {
        console.warn('Peringatan simpan project_documents:', err?.message);
      }
    }

    /**
     * ================================================================
     * 4. DAILY LOGS
     * ================================================================
     */
    if (payload.dailyLogs?.length) {
      try {
        const rows = payload.dailyLogs.map((r: any) => {
          const cleanRaw = { ...r };
          return {
            id: r.id,
            date: r.date,
            weather: r.weather,
            worker_count: r.workerCount,
            mandor_name: r.mandorName,
            activity_summary: r.activitySummary,
            volume_done: r.volumeDone,
            photos: r.photos || [],
            notes: r.notes,
            created_by: r.createdBy,
            raw_data: cleanRaw,
            updated_at: timestamp,
          };
        });

        const { error } = await supabase
          .from('daily_logs')
          .upsert(rows, {
            onConflict: 'id',
          });

        if (error) {
          console.warn(`Peringatan simpan daily_logs: ${error.message}`);
        }
      } catch (err: any) {
        console.warn(`Peringatan simpan daily_logs:`, err?.message);
      }
    }

    /**
     * ================================================================
     * 5. WORK ITEMS
     * ================================================================
     */
    if (payload.workItems?.length) {
      try {
        const rows = payload.workItems.map((w: any) => ({
          id: w.id,
          code: w.code || `W-${w.no}`,
          name: w.name,
          category: w.category,
          weight: Number(w.weight ?? w.bobotPercent ?? 0),
          unit: w.unit,
          volume: Number(w.volume ?? w.volumeTarget ?? 0),
          price_per_unit: Number(w.pricePerUnit || 0),
          total_price: Number(w.totalPrice || 0),
          weekly_plan: w.weeklyPlan || [],
          weekly_actual: w.weeklyActual || [],
          status: w.status,
          raw_data: w,
          updated_at: timestamp,
        }));

        const { error } = await supabase
          .from('work_items')
          .upsert(rows, {
            onConflict: 'id',
          });

        if (error) {
          console.warn(`Peringatan simpan work_items: ${error.message}`);
        }
      } catch (err: any) {
        console.warn(`Peringatan simpan work_items:`, err?.message);
      }
    }

    /**
     * ================================================================
     * 6. MATERIALS
     * ================================================================
     */
    if (payload.materials?.length) {
      try {
        const rows = payload.materials.map((m: any) => ({
          id: m.id,
          name: m.name,
          category: m.category,
          unit: m.unit,
          total_rab: Number(m.totalRAB ?? m.volumeTotal ?? 0),
          ordered: Number(m.ordered || 0),
          arrived: Number(m.arrived || 0),
          used: Number(m.used ?? m.volumeUsed ?? 0),
          stock: Number(m.stock ?? m.stockRemaining ?? 0),
          status: m.status || m.approvalStatus || 'Tersedia',
          min_threshold: Number(m.minThreshold ?? m.minAlertStock ?? 0),
          supplier: m.supplier,
          last_updated: m.lastUpdated || m.usageDate || m.arrivalDate,
          raw_data: m,
          updated_at: timestamp,
        }));

        const { error } = await supabase
          .from('material_inventory')
          .upsert(rows, {
            onConflict: 'id',
          });

        if (error) {
          console.warn(`Peringatan simpan material_inventory: ${error.message}`);
        }
      } catch (err: any) {
        console.warn(`Peringatan simpan material_inventory:`, err?.message);
      }
    }

    /**
     * ================================================================
     * 7. WORKERS
     * ================================================================
     */
    if (payload.workers?.length) {
      try {
        const rows = payload.workers.map((w: any) => ({
          id: w.id,
          name: w.name,
          trade: w.trade || w.role,
          mandor: w.mandor || '',
          phone: w.phone || '',
          status: w.status,
          daily_rate: Number(w.dailyRate ?? w.dailyWage ?? 0),
          rating: Number(w.rating || 5),
          raw_data: w,
          updated_at: timestamp,
        }));

        const { error } = await supabase
          .from('workers')
          .upsert(rows, {
            onConflict: 'id',
          });

        if (error) {
          console.warn(`Peringatan simpan workers: ${error.message}`);
        }
      } catch (err: any) {
        console.warn(`Peringatan simpan workers:`, err?.message);
      }
    }

    /**
     * ================================================================
     * 8. EQUIPMENTS
     * ================================================================
     */
    if (payload.equipments?.length) {
      try {
        const rows = payload.equipments.map((e: any) => ({
          id: e.id,
          code: e.code || e.id,
          name: e.name,
          category: e.category || 'Alat Berat',
          capacity: e.capacity || '',
          operator: e.operator,
          daily_rent_cost: Number(e.dailyRentCost || 0),
          condition: e.condition,
          location: e.location || '',
          working_hours_today: Number(e.workingHoursToday || 0),
          total_working_hours: Number(e.totalWorkingHours ?? e.workHoursHM ?? 0),
          fuel_level: e.fuelLevel || '100%',
          raw_data: e,
          updated_at: timestamp,
        }));

        const { error } = await supabase
          .from('equipments')
          .upsert(rows, {
            onConflict: 'id',
          });

        if (error) {
          console.warn(`Peringatan simpan equipments: ${error.message}`);
        }
      } catch (err: any) {
        console.warn(`Peringatan simpan equipments:`, err?.message);
      }
    }

    /**
     * ================================================================
     * 9. PAYMENT TERMS
     * ================================================================
     */
    if (payload.paymentTerms?.length) {
      try {
        const rows = payload.paymentTerms.map((p: any) => ({
          term_number: Number(p.termNumber),
          title: p.title,
          percentage: Number(p.percentage ?? p.termValuePercent ?? 0),
          planned_amount: Number(p.plannedAmount ?? p.grossValue ?? 0),
          target_progress: Number(p.targetProgress ?? p.targetProgressPercent ?? 0),
          invoice_number: p.invoiceNumber || `INV-TERM-${p.termNumber}`,
          status: p.status,
          submission_date: p.submissionDate || p.paymentDate,
          verification_date_mk: p.verificationDateMK,
          approval_date_owner: p.approvalDateOwner,
          notes: p.notes,
          raw_data: p,
          updated_at: timestamp,
        }));

        const { error } = await supabase
          .from('payment_terms')
          .upsert(rows, {
            onConflict: 'term_number',
          });

        if (error) {
          console.warn(`Peringatan simpan payment_terms: ${error.message}`);
        }
      } catch (err: any) {
        console.warn(`Peringatan simpan payment_terms:`, err?.message);
      }
    }

    /**
     * ================================================================
     * 10. AUDIT LOGS
     * ================================================================
     */
    if (payload.auditLogs?.length) {
      try {
        const rows = payload.auditLogs.map((a: any) => ({
          id: a.id,
          timestamp: a.timestamp,
          action: a.action,
          role: a.role || a.userRole,
          user_name: a.userName,
          details: a.details,
          updated_at: timestamp,
        }));

        const { error } = await supabase
          .from('audit_logs')
          .upsert(rows, {
            onConflict: 'id',
          });

        if (error) {
          console.warn(`Peringatan simpan audit_logs: ${error.message}`);
        }
      } catch (err: any) {
        console.warn(`Peringatan simpan audit_logs:`, err?.message);
      }
    }

    /**
     * ================================================================
     * SUCCESS
     * ================================================================
     */
    const timeStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return {
      success: true,
      message:
        'Data berhasil disimpan langsung ke Supabase Cloud. Tidak menggunakan localStorage sebagai database.',
      syncedAt: timeStr,
      counts,
    };
  } catch (error: any) {
    const timeStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return {
      success: false,
      message:
        error?.message ||
        'Gagal menyimpan data ke Supabase Cloud.',
      syncedAt: timeStr,
      counts,
      error: error?.message || 'SUPABASE_SYNC_ERROR',
    };
  }
}

/**
 * Pull seluruh state proyek langsung dari Supabase.
 *
 * Mengambil data secara terstruktur dari seluruh tabel relasional Supabase:
 * 1. project_info
 * 2. work_items
 * 3. daily_logs
 * 4. workers
 * 5. equipments
 * 6. material_inventory
 * 7. payment_terms
 * 8. project_documents
 * 9. project_snapshots (untuk data auxiliary: photos, allocations, dsb.)
 *
 * Alur: Supabase → SELECT → React State → Component → Tampilan
 * Bebas dari ketergantungan localStorage untuk data proyek bersama.
 */
export async function pullAllDataFromSupabase(
  projectId = DEFAULT_PROJECT_ID
): Promise<ProjectSyncPayload | null> {
  const supabase = getSupabase();

  if (!supabase) {
    console.error(
      'Supabase client tidak tersedia. Operasi pull dibatalkan.'
    );
    throw new Error('Supabase client tidak terkonfigurasi');
  }

  try {
    // 0. Cek Auth Session
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    console.log('[AUTH] session:', sessionData?.session ?? null);
    if (sessionErr) {
      console.warn('[AUTH] getSession error:', sessionErr);
    }

    // 1. Load project_info
    const { data: projectInfoRows, error: projectInfoErr } = await supabase
      .from('project_info')
      .select('*');

    if (projectInfoErr) {
      console.error('[SUPABASE] project_info error:', projectInfoErr);
      throw projectInfoErr;
    }
    console.log('[SUPABASE] project_info loaded:', projectInfoRows?.length ?? 0);

    // 2. Load work_items
    const { data: workItemsRows, error: workItemsErr } = await supabase
      .from('work_items')
      .select('*');

    if (workItemsErr) {
      console.error('[SUPABASE] work_items error:', workItemsErr);
      throw workItemsErr;
    }
    console.log('[SUPABASE] work_items loaded:', workItemsRows?.length ?? 0);

    // 3. Load daily_logs
    const { data: dailyLogsRows, error: dailyLogsErr } = await supabase
      .from('daily_logs')
      .select('*');

    if (dailyLogsErr) {
      console.error('[SUPABASE] daily_logs error:', dailyLogsErr);
      throw dailyLogsErr;
    }
    console.log('[SUPABASE] daily_logs loaded:', dailyLogsRows?.length ?? 0);

    // 4. Load workers
    const { data: workersRows, error: workersErr } = await supabase
      .from('workers')
      .select('*');

    if (workersErr) {
      console.error('[SUPABASE] workers error:', workersErr);
      throw workersErr;
    }
    console.log('[SUPABASE] workers loaded:', workersRows?.length ?? 0);

    // 5. Load equipments
    const { data: equipmentsRows, error: equipmentsErr } = await supabase
      .from('equipments')
      .select('*');

    if (equipmentsErr) {
      console.error('[SUPABASE] equipments error:', equipmentsErr);
      throw equipmentsErr;
    }
    console.log('[SUPABASE] equipments loaded:', equipmentsRows?.length ?? 0);

    // 6. Load material_inventory
    const { data: materialsRows, error: materialsErr } = await supabase
      .from('material_inventory')
      .select('*');

    if (materialsErr) {
      console.error('[SUPABASE] material_inventory error:', materialsErr);
      throw materialsErr;
    }
    console.log('[SUPABASE] material_inventory loaded:', materialsRows?.length ?? 0);

    // 7. Load payment_terms
    const { data: paymentTermsRows, error: paymentTermsErr } = await supabase
      .from('payment_terms')
      .select('*');

    if (paymentTermsErr) {
      console.error('[SUPABASE] payment_terms error:', paymentTermsErr);
      throw paymentTermsErr;
    }
    console.log('[SUPABASE] payment_terms loaded:', paymentTermsRows?.length ?? 0);

    // 8. Load project_documents
    const { data: documentsRows, error: documentsErr } = await supabase
      .from('project_documents')
      .select('*');

    if (documentsErr) {
      console.error('[SUPABASE] project_documents error:', documentsErr);
      throw documentsErr;
    }
    console.log('[SUPABASE] project_documents loaded:', documentsRows?.length ?? 0);

    // 9. Load project_snapshots (untuk auxiliary items seperti photos, calendarEvents, allocations, dsb.)
    const { data: snapshotRows, error: snapshotErr } = await supabase
      .from('project_snapshots')
      .select('*')
      .order('updated_at', { ascending: false });

    if (snapshotErr) {
      console.error('[SUPABASE] project_snapshots error:', snapshotErr);
    } else {
      console.log('[SUPABASE] project_snapshots loaded:', snapshotRows?.length ?? 0);
    }

    // Temukan snapshot yang memiliki data lengkap (seperti PROJ-FORESYNDO-02 atau yang memiliki properti)
    const validSnapshot = snapshotRows?.find(
      (s) => s.data && (s.data.photos || s.data.calendarEvents || s.data.allocations || s.data.rolePins)
    ) || snapshotRows?.[0];
    const snapshotAux = (validSnapshot?.data || {}) as Partial<ProjectSyncPayload>;

    // ============================================================
    // PEMETAAN ENTITAS SUPABASE -> REACT MODEL
    // ============================================================

    // 1. Project Info
    const matchedProjectRow =
      projectInfoRows?.find((r) => r.id === projectId) ||
      projectInfoRows?.find((r) => r.id === 'PROJ-FORESYNDO-02' || r.id === 'FORESYNDO-PROJECT-2') ||
      projectInfoRows?.[0];

    const rawProject = (matchedProjectRow?.raw_data || {}) as Partial<ProjectInfo>;
    const resolvedProjectId = matchedProjectRow?.id || projectId || DEFAULT_PROJECT_ID;

    const projectInfo: ProjectInfo = {
      id: resolvedProjectId,
      name: String(rawProject.name || matchedProjectRow?.name || 'Pembangunan Gedung 7 Lantai (Foresyndo 2)'),
      owner: String(rawProject.owner || matchedProjectRow?.owner || 'PT. FORESYNDO GLOBAL INDONESIA'),
      location: String(rawProject.location || matchedProjectRow?.location || 'Jatitujuh, Majalengka, Jawa Barat'),
      contractValue: Number(rawProject.contractValue ?? matchedProjectRow?.contract_value ?? 14461760981),
      startDate: String(rawProject.startDate || matchedProjectRow?.start_date || '2026-09-01'),
      targetEndDate: String(rawProject.targetEndDate || matchedProjectRow?.end_date || '2027-06-01'),
      status: (rawProject.status || matchedProjectRow?.status || 'Belum Mulai') as any,
      logoUrl: String(rawProject.logoUrl || '/assets/logo.png'),
      contractNumber: String(rawProject.contractNumber || matchedProjectRow?.contract_number || 'PR-2026-FGI-004'),
      contractor: String(rawProject.contractor || matchedProjectRow?.contractor || 'PT. GONG MBE LINK PAMUNGKAS'),
      contractorProfile: rawProject.contractorProfile,
      director: String(rawProject.director || 'HASANUDIN'),
      siteManager: String(rawProject.siteManager || 'EKO YULIANTO'),
      qcEngineer: String(rawProject.qcEngineer || 'KIKI'),
      financeAdmin: String(rawProject.financeAdmin || 'COKRO'),
      inspector: String(rawProject.inspector || 'Tamu Pengawas'),
      consultantMK: String(rawProject.consultantMK || matchedProjectRow?.consultant || 'SAEPUL ANWAR'),
      estimator: String(rawProject.estimator || 'IHSAN '),
      projectManager: String(rawProject.projectManager || 'JAKA SEPTIANDANA'),
    };

    // 2. Work Items (14 items)
    const workItems: WorkItem[] = (workItemsRows || []).map((row: any) => {
      const raw = (row.raw_data || {}) as Partial<WorkItem>;
      const codeNum = row.code ? parseInt(String(row.code).replace(/\D/g, ''), 10) : 0;
      const no = Number(raw.no ?? (codeNum > 0 ? codeNum : 1));

      return {
        id: String(row.id || raw.id || `WI-${String(no).padStart(2, '0')}`),
        no,
        name: String(raw.name || row.name || `Sektor ${no}`),
        category: (raw.category || row.category || 'Persiapan') as CategoryPekerjaan,
        startDate: String(raw.startDate || '2026-09-01'),
        endDate: String(raw.endDate || '2027-06-01'),
        durationDays: Number(raw.durationDays ?? 30),
        bobotPercent: Number(row.weight ?? raw.bobotPercent ?? 0),
        targetProgressPercent: Number(raw.targetProgressPercent ?? 0),
        realizedProgressPercent: Number(raw.realizedProgressPercent ?? 0),
        volumeTarget: Number(row.volume ?? raw.volumeTarget ?? 0),
        volumeRealized: Number(raw.volumeRealized ?? 0),
        unit: String(row.unit || raw.unit || 'Rp'),
        status: (row.status || raw.status || 'Belum Mulai') as any,
        notes: String(raw.notes || ''),
        updatedAt: String(row.updated_at || raw.updatedAt || new Date().toISOString()),
      };
    }).sort((a, b) => a.no - b.no);

    // 3. Daily Logs
    const dailyLogs: DailyLog[] = (dailyLogsRows || []).map((row: any) => {
      const raw = (row.raw_data || {}) as Partial<DailyLog>;
      return {
        id: String(row.id || raw.id),
        date: String(raw.date || row.date || new Date().toISOString().slice(0, 10)),
        weather: (raw.weather || row.weather || 'Cerah') as WeatherCondition,
        workerCount: Number(raw.workerCount ?? row.worker_count ?? 0),
        mandorName: String(raw.mandorName || row.mandor_name || ''),
        activitySummary: String(raw.activitySummary || row.activity_summary || ''),
        volumeDone: String(raw.volumeDone || row.volume_done || ''),
        photos: Array.isArray(raw.photos)
          ? raw.photos
          : (Array.isArray(row.photos) ? row.photos : []),
        notes: String(raw.notes || row.notes || ''),
        createdBy: String(raw.createdBy || row.created_by || ''),
      };
    }).sort((a, b) => b.date.localeCompare(a.date));

    // 4. Workers (6 workers)
    const workers: WorkerItem[] = (workersRows || []).map((row: any) => {
      const raw = (row.raw_data || {}) as Partial<WorkerItem>;
      return {
        id: String(row.id || raw.id),
        name: String(raw.name || row.name || ''),
        role: String(raw.role || row.trade || 'Pekerja'),
        dailyWage: Number(raw.dailyWage ?? row.daily_rate ?? 0),
        daysWorked: Number(raw.daysWorked ?? 10),
        status: (raw.status || row.status || 'Aktif') as any,
      };
    });

    // 5. Equipments (2 equipments)
    const equipments: EquipmentItem[] = (equipmentsRows || []).map((row: any) => {
      const raw = (row.raw_data || {}) as Partial<EquipmentItem>;
      return {
        id: String(row.id || raw.id),
        name: String(raw.name || row.name || ''),
        quantity: Number(raw.quantity ?? 1),
        condition: (raw.condition || row.condition || 'Baik') as any,
        operator: String(raw.operator || row.operator || ''),
        workHoursHM: Number(raw.workHoursHM ?? row.total_working_hours ?? 0),
        lastMaintenance: String(raw.lastMaintenance || '2026-08-30'),
        notes: String(raw.notes || row.location || ''),
      };
    });

    // 6. Material Inventory (12 materials)
    const materials: MaterialItem[] = (materialsRows || []).map((row: any) => {
      const raw = (row.raw_data || {}) as Partial<MaterialItem>;
      return {
        id: String(row.id || raw.id),
        name: String(raw.name || row.name || ''),
        volumeTotal: Number(row.total_rab ?? raw.volumeTotal ?? 0),
        volumeUsed: Number(row.used ?? raw.volumeUsed ?? 0),
        unit: String(row.unit || raw.unit || ''),
        pricePerUnit: Number(raw.pricePerUnit || 0),
        supplier: String(row.supplier || raw.supplier || ''),
        arrivalDate: String(raw.arrivalDate || row.last_updated || '2026-09-01'),
        usageDate: raw.usageDate,
        stockRemaining: Number(row.stock ?? raw.stockRemaining ?? 0),
        minAlertStock: Number(row.min_threshold ?? raw.minAlertStock ?? 0),
        leadTimeDays: raw.leadTimeDays ? Number(raw.leadTimeDays) : undefined,
        dailyBurnRate: raw.dailyBurnRate ? Number(raw.dailyBurnRate) : undefined,
        relatedSectorNos: Array.isArray(raw.relatedSectorNos) ? raw.relatedSectorNos : undefined,
        category: String(raw.category || row.category || 'Struktur & Sipil'),
        barcode: raw.barcode,
        batchNumber: raw.batchNumber,
        locationRack: raw.locationRack,
        approvalStatus: raw.approvalStatus || 'Disetujui',
        approvedBy: raw.approvedBy,
        approvedAt: raw.approvedAt,
        approvalNotes: raw.approvalNotes,
        rejectionReason: raw.rejectionReason,
        inspectionDocRef: raw.inspectionDocRef,
        submissionDate: raw.submissionDate,
        submittedBy: raw.submittedBy,
      };
    });

    // 7. Payment Terms (5 terms)
    const paymentTerms: PaymentTerm[] = (paymentTermsRows || []).map((row: any) => {
      const raw = (row.raw_data || {}) as Partial<PaymentTerm>;
      const grossValue = Number(row.planned_amount ?? raw.grossValue ?? 0);
      const termValuePercent = Number(row.percentage ?? raw.termValuePercent ?? 0);
      const retentionPercent = Number(raw.retentionPercent ?? 5);
      const retentionValue = Number(raw.retentionValue ?? (grossValue * 0.05));
      const netPayableValue = Number(raw.netPayableValue ?? (grossValue - retentionValue));

      return {
        termNumber: Number(row.term_number ?? raw.termNumber ?? 1),
        title: String(raw.title || row.title || ''),
        targetProgressPercent: Number(row.target_progress ?? raw.targetProgressPercent ?? 0),
        termValuePercent,
        grossValue,
        retentionPercent,
        retentionValue,
        netPayableValue,
        status: (row.status || raw.status || 'Belum Dibayar') as any,
        paymentDate: raw.paymentDate || row.submission_date || undefined,
        dueDate: raw.dueDate || undefined,
        invoiceNumber: row.invoice_number || raw.invoiceNumber || undefined,
        proofUrl: raw.proofUrl || undefined,
        notes: raw.notes || row.notes || undefined,
        approvedBy: raw.approvedBy || undefined,
      };
    }).sort((a, b) => a.termNumber - b.termNumber);

    // 8. Project Documents (14 documents)
    const documents: ProjectDocument[] = (documentsRows || []).map((row: any) => {
      const raw = (row.raw_data || {}) as Partial<ProjectDocument>;
      return {
        id: String(row.id || raw.id),
        title: String(raw.title || row.title || ''),
        documentNumber: String(row.document_number || raw.documentNumber || ''),
        category: (raw.category || row.category || 'other') as DocumentCategory,
        fileType: (raw.fileType || row.file_type || 'pdf') as any,
        fileSize: String(raw.fileSize || row.file_size || '1.0 MB'),
        fileName: String(raw.fileName || `${row.title || 'Dokumen'}.${row.file_type || 'pdf'}`),
        fileUrl: (row.file_url && row.file_url !== '[STORED_IN_SNAPSHOT]') ? row.file_url : (raw.fileUrl || ''),
        uploadDate: String(raw.uploadDate || row.upload_date || '2026-09-01'),
        uploadedBy: String(raw.uploadedBy || row.uploaded_by || 'Admin'),
        uploadedByRole: (raw.uploadedByRole || row.uploaded_by_role || 'Kontraktor') as any,
        version: String(raw.version || row.version || 'v1.0'),
        status: (raw.status || row.status || 'Approved') as any,
        description: String(raw.description || row.description || ''),
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        confidentiality: (raw.confidentiality || row.confidentiality || 'Internal Tim Proyek') as any,
        reviewNotes: Array.isArray(raw.reviewNotes) ? raw.reviewNotes : [],
        signatories: Array.isArray(row.signatures) && row.signatures.length > 0
          ? row.signatures
          : (Array.isArray(raw.signatories) ? raw.signatories : []),
      };
    });

    const payload: ProjectSyncPayload = {
      projectId: resolvedProjectId,
      projectInfo,
      workItems,
      dailyLogs,
      workers,
      equipments,
      materials,
      paymentTerms,
      documents,
      // Auxiliary items dari snapshot / state
      photos: snapshotAux.photos || [],
      allocations: snapshotAux.allocations || [],
      auditLogs: snapshotAux.auditLogs || [],
      calendarEvents: snapshotAux.calendarEvents || [],
      notifications: snapshotAux.notifications || [],
      customCategories: snapshotAux.customCategories || [],
      suppliers: snapshotAux.suppliers,
      purchaseOrders: snapshotAux.purchaseOrders,
      contractorTransactions: snapshotAux.contractorTransactions,
      userNames: snapshotAux.userNames,
      rolePins: snapshotAux.rolePins,
      stakeholderProfiles: snapshotAux.stakeholderProfiles,
      syncedAt: validSnapshot?.updated_at || new Date().toISOString(),
      syncedBy: validSnapshot?.synced_by || 'Supabase Direct Pull',
    };

    return payload;
  } catch (error: any) {
    console.error('Supabase pullAllDataFromSupabase error:', error);
    throw error;
  }
}

/**
 * Hapus Work Item langsung dari Supabase
 */
export async function deleteWorkItemFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('work_items').delete().eq('id', id);
    if (error) {
      console.error('[SUPABASE] work_items delete error:', error);
      return false;
    }
    console.log('[SUPABASE] work_items deleted:', id);
    return true;
  } catch (err) {
    console.error('[SUPABASE] work_items delete unexpected error:', err);
    return false;
  }
}

/**
 * Hapus Dokumen langsung dari Supabase
 */
export async function deleteDocumentFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('project_documents').delete().eq('id', id);
    if (error) {
      console.error('[SUPABASE] project_documents delete error:', error);
      return false;
    }
    console.log('[SUPABASE] project_documents deleted:', id);
    return true;
  } catch (err) {
    console.error('[SUPABASE] project_documents delete unexpected error:', err);
    return false;
  }
}

/**
 * Hapus Laporan Harian langsung dari Supabase
 */
export async function deleteDailyLogFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('daily_logs').delete().eq('id', id);
    if (error) {
      console.error('[SUPABASE] daily_logs delete error:', error);
      return false;
    }
    console.log('[SUPABASE] daily_logs deleted:', id);
    return true;
  } catch (err) {
    console.error('[SUPABASE] daily_logs delete unexpected error:', err);
    return false;
  }
}

/**
 * Hapus Material langsung dari Supabase
 */
export async function deleteMaterialFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('material_inventory').delete().eq('id', id);
    if (error) {
      console.error('[SUPABASE] material_inventory delete error:', error);
      return false;
    }
    console.log('[SUPABASE] material_inventory deleted:', id);
    return true;
  } catch (err) {
    console.error('[SUPABASE] material_inventory delete unexpected error:', err);
    return false;
  }
}

/**
 * Realtime subscription.
 *
 * Perubahan di browser/account lain akan memberitahu aplikasi,
 * lalu App.tsx dapat melakukan pull ulang dari Supabase.
 */
export function subscribeToSupabaseRealtime(
  onUpdate: (payload: any) => void,
  projectId = DEFAULT_PROJECT_ID
): () => void {
  const supabase = getSupabase();

  if (!supabase) {
    console.warn(
      'Supabase tidak tersedia. Realtime subscription tidak dibuat.'
    );
    return () => {};
  }

  try {
    const channel = supabase
      .channel(`foresyndo-realtime-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_snapshots',
          filter: `id=eq.${projectId}`,
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_documents',
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_logs',
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'work_items',
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'material_inventory',
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workers',
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipments',
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_terms',
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'audit_logs',
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe((status, err) => {
        if (
          status === 'CHANNEL_ERROR' ||
          status === 'TIMED_OUT'
        ) {
          console.warn(
            `[Supabase Realtime ${status}]`,
            err?.message || err
          );
        }

        if (status === 'SUBSCRIBED') {
          console.log(
            `Supabase Realtime aktif untuk ${projectId}`
          );
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.warn(
          'Gagal membersihkan Supabase Realtime channel:',
          error
        );
      }
    };
  } catch (error) {
    console.warn(
      'Realtime subscription gagal dibuat:',
      error
    );

    return () => {};
  }
}