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
  userNames?: Record<string, string>;
  rolePins?: Record<string, string>;
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
     * 1. MASTER SNAPSHOT
     * ================================================================
     */
    const { error: snapshotError } = await supabase
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

    if (snapshotError) {
      throw new Error(
        `Gagal menyimpan project_snapshots: ${snapshotError.message}`
      );
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
            code: project.code || null,
            owner: project.owner || '',
            contractor: project.contractor || '',
            consultant: project.consultant || '',
            location: project.location || '',
            contract_number: project.contractNumber || null,
            contract_value: Number(project.contractValue || 0),
            start_date: project.startDate || null,
            end_date: project.endDate || null,
            duration_weeks: Number(project.durationWeeks || 0),
            status: project.status || 'Berjalan',
            current_week: Number(project.currentWeek || 1),
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
      const documentRows = payload.documents.map((d) => ({
        id: d.id,
        document_number: d.documentNumber,
        title: d.title,
        category: d.category,
        file_type: d.fileType,
        file_size: d.fileSize,
        file_url: d.fileUrl || null,
        status: d.status,
        version: d.version,
        upload_date: d.uploadDate,
        uploaded_by: d.uploadedBy,
        uploaded_by_role: d.uploadedByRole,
        description: d.description,
        confidentiality: d.confidentiality,
        signatures: d.signatures || [],
        review_notes: d.reviewNotes || [],
        raw_data: d,
        updated_at: timestamp,
      }));

      const { error } = await supabase
        .from('project_documents')
        .upsert(documentRows, {
          onConflict: 'id',
        });

      if (error) {
        throw new Error(
          `Gagal menyimpan project_documents: ${error.message}`
        );
      }
    }

    /**
     * ================================================================
     * 4. DAILY LOGS
     * ================================================================
     */
    if (payload.dailyLogs?.length) {
      const rows = payload.dailyLogs.map((r) => ({
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
        raw_data: r,
        updated_at: timestamp,
      }));

      const { error } = await supabase
        .from('daily_logs')
        .upsert(rows, {
          onConflict: 'id',
        });

      if (error) {
        throw new Error(`Gagal menyimpan daily_logs: ${error.message}`);
      }
    }

    /**
     * ================================================================
     * 5. WORK ITEMS
     * ================================================================
     */
    if (payload.workItems?.length) {
      const rows = payload.workItems.map((w) => ({
        id: w.id,
        code: w.code,
        name: w.name,
        category: w.category,
        weight: Number(w.weight || 0),
        unit: w.unit,
        volume: Number(w.volume || 0),
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
        throw new Error(`Gagal menyimpan work_items: ${error.message}`);
      }
    }

    /**
     * ================================================================
     * 6. MATERIALS
     * ================================================================
     */
    if (payload.materials?.length) {
      const rows = payload.materials.map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        unit: m.unit,
        total_rab: Number(m.totalRAB || 0),
        ordered: Number(m.ordered || 0),
        arrived: Number(m.arrived || 0),
        used: Number(m.used || 0),
        stock: Number(m.stock || 0),
        status: m.status,
        min_threshold: Number(m.minThreshold || 0),
        supplier: m.supplier,
        last_updated: m.lastUpdated,
        raw_data: m,
        updated_at: timestamp,
      }));

      const { error } = await supabase
        .from('material_inventory')
        .upsert(rows, {
          onConflict: 'id',
        });

      if (error) {
        throw new Error(
          `Gagal menyimpan material_inventory: ${error.message}`
        );
      }
    }

    /**
     * ================================================================
     * 7. WORKERS
     * ================================================================
     */
    if (payload.workers?.length) {
      const rows = payload.workers.map((w) => ({
        id: w.id,
        name: w.name,
        trade: w.trade,
        mandor: w.mandor,
        phone: w.phone,
        status: w.status,
        daily_rate: Number(w.dailyRate || 0),
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
        throw new Error(`Gagal menyimpan workers: ${error.message}`);
      }
    }

    /**
     * ================================================================
     * 8. EQUIPMENTS
     * ================================================================
     */
    if (payload.equipments?.length) {
      const rows = payload.equipments.map((e) => ({
        id: e.id,
        code: e.code,
        name: e.name,
        category: e.category,
        capacity: e.capacity,
        operator: e.operator,
        daily_rent_cost: Number(e.dailyRentCost || 0),
        condition: e.condition,
        location: e.location,
        working_hours_today: Number(e.workingHoursToday || 0),
        total_working_hours: Number(e.totalWorkingHours || 0),
        fuel_level: e.fuelLevel,
        raw_data: e,
        updated_at: timestamp,
      }));

      const { error } = await supabase
        .from('equipments')
        .upsert(rows, {
          onConflict: 'id',
        });

      if (error) {
        throw new Error(`Gagal menyimpan equipments: ${error.message}`);
      }
    }

    /**
     * ================================================================
     * 9. PAYMENT TERMS
     * ================================================================
     */
    if (payload.paymentTerms?.length) {
      const rows = payload.paymentTerms.map((p) => ({
        term_number: Number(p.termNumber),
        title: p.title,
        percentage: Number(p.percentage || 0),
        planned_amount: Number(p.plannedAmount || 0),
        target_progress: Number(p.targetProgress || 0),
        invoice_number: p.invoiceNumber,
        status: p.status,
        submission_date: p.submissionDate,
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
        throw new Error(`Gagal menyimpan payment_terms: ${error.message}`);
      }
    }

    /**
     * ================================================================
     * 10. AUDIT LOGS
     * ================================================================
     */
    if (payload.auditLogs?.length) {
      const rows = payload.auditLogs.map((a) => ({
        id: a.id,
        timestamp: a.timestamp,
        action: a.action,
        role: a.role,
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
        throw new Error(`Gagal menyimpan audit_logs: ${error.message}`);
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
 * Tidak ada:
 * - localStorage fallback
 * - /api/project/snapshot
 * - server disk fallback
 */
export async function pullAllDataFromSupabase(
  projectId = DEFAULT_PROJECT_ID
): Promise<ProjectSyncPayload | null> {
  const supabase = getSupabase();

  if (!supabase) {
    console.error(
      'Supabase tidak tersedia. Pull dibatalkan. Tidak menggunakan localStorage fallback.'
    );
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('project_snapshots')
      .select('data, updated_at, synced_by')
      .eq('id', projectId)
      .maybeSingle();

    if (error) {
      console.error(
        'Gagal mengambil project_snapshots dari Supabase:',
        error
      );
      return null;
    }

    if (!data?.data) {
      console.warn(
        `Snapshot proyek ${projectId} belum ditemukan di Supabase.`
      );
      return null;
    }

    const payload = data.data as ProjectSyncPayload;

    return {
      ...payload,
      projectId: payload.projectId || projectId,
      syncedAt: data.updated_at,
      syncedBy: data.synced_by,
    };
  } catch (error) {
    console.error(
      'Unexpected Supabase pull error:',
      error
    );

    return null;
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