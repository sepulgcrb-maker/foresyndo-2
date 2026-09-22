import { getSupabase, isSupabaseConnected } from './supabase';
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

/**
 * Returns the ready-to-use SQL Migration script that the user can paste
 * directly into Supabase Dashboard -> SQL Editor.
 */
export function getSupabaseSqlSchema(): string {
  return `-- ====================================================================
-- SKEMA LENGKAP DATABASE SUPABASE (POSTGRESQL)
-- SISTEM MONITORING PEMBANGUNAN PROYEK GEDUNG PT. FORESYNDO GLOBAL INDONESIA
-- Lokasi Proyek: Jatitujuh, Majalengka, Jawa Barat
-- ====================================================================
-- PETUNJUK:
-- 1. Buka Supabase Dashboard -> SQL Editor -> New Query
-- 2. Tempel seluruh skrip ini dan klik RUN
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL SNAPSHOT MASTER (Sync State Menyeluruh & Realtime Backup)
CREATE TABLE IF NOT EXISTS public.project_snapshots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  data JSONB NOT NULL,
  synced_by TEXT DEFAULT 'System',
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. TABEL INFORMASI PROYEK
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

-- 3. TABEL DOKUMEN PROYEK (DED, Shop Drawing, Kontrak, Notulen, BAST)
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

-- 4. TABEL LAPORAN HARIAN LAPANGAN
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

-- 5. TABEL ITEM PEKERJAAN & KURVA S
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

-- 6. TABEL INVENTARIS MATERIAL & LOGISTIK
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

-- 7. TABEL TENAGA KERJA (Manpower)
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

-- 8. TABEL MONITORING ALAT BERAT
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

-- 9. TABEL TERMIN PEMBAYARAN
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

-- 10. TABEL AUDIT LOG TRIPARTIT
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  role TEXT,
  user_name TEXT,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexing
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.project_documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.project_documents(status);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON public.daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_material_status ON public.material_inventory(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- Aktifkan Row Level Security (RLS)
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

-- Kebijakan Akses (RLS Policies)
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

-- Aktifkan Supabase Realtime
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

-- Data Awal Identitas Proyek
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
`;
}

/**
 * Tests connection to Supabase instance and measures latency
 */
export async function testSupabaseConnection(): Promise<SupabaseTestResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase URL atau Anon Key belum dikonfigurasi. Silakan isi URL dan Anon Key atau atur di Environment Variables.',
    };
  }

  const startTime = performance.now();
  try {
    const { error } = await supabase.from('project_snapshots').select('id').limit(1);
    const latency = Math.round(performance.now() - startTime);

    if (error) {
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: true,
          latencyMs: latency,
          message: `Koneksi Supabase aktif (${latency}ms), namun tabel belum dibuat. Jalankan skrip SQL skema untuk mengaktifkan tabel.`,
        };
      }
      return {
        success: false,
        latencyMs: latency,
        message: `Koneksi gagal: ${error.message} (Kode: ${error.code || 'UNKNOWN'})`,
      };
    }

    return {
      success: true,
      latencyMs: latency,
      message: `Terhubung ke Supabase dengan respons cepat (${latency}ms). Database siap digunakan!`,
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - startTime);
    return {
      success: false,
      latencyMs: latency,
      message: `Gagal menghubungi server Supabase: ${err.message || 'Network error'}`,
    };
  }
}

/**
 * Pushes all current project state into Supabase Cloud & Server Snapshot
 */
export async function pushAllDataToSupabase(payload: ProjectSyncPayload): Promise<SupabaseSyncResult> {
  const supabase = getSupabase();
  const timestamp = new Date().toISOString();

  const counts = {
    documents: payload.documents?.length || 0,
    dailyLogs: payload.dailyLogs?.length || 0,
    materials: payload.materials?.length || 0,
    workItems: payload.workItems?.length || 0,
    auditLogs: payload.auditLogs?.length || 0,
  };

  let clientSuccess = false;
  let clientError = '';

  // 1. Client-side direct Supabase upsert (if connected)
  if (supabase) {
    try {
      const { error: snapshotError } = await supabase
        .from('project_snapshots')
        .upsert({
          id: payload.projectId || 'FORESYNDO-PROJECT-2',
          project_id: payload.projectId || 'FORESYNDO-PROJECT-2',
          data: payload,
          synced_by: payload.syncedBy || 'Owner / Konsultan MK',
          updated_at: timestamp,
        });

      if (snapshotError) {
        clientError = snapshotError.message;
      } else {
        clientSuccess = true;
      }

      // Granular documents upsert
      if (payload.documents && payload.documents.length > 0) {
        try {
          const docRows = payload.documents.map((d) => ({
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
            raw_data: d,
            updated_at: timestamp,
          }));
          await supabase.from('project_documents').upsert(docRows);
        } catch (docErr) {
          console.warn('Granular documents table sync notice:', docErr);
        }
      }

      // Granular daily logs upsert
      if (payload.dailyLogs && payload.dailyLogs.length > 0) {
        try {
          const reportRows = payload.dailyLogs.map((r) => ({
            id: r.id,
            date: r.date,
            weather: r.weather,
            worker_count: r.workerCount,
            mandor_name: r.mandorName,
            activity_summary: r.activitySummary,
            volume_done: r.volumeDone,
            notes: r.notes,
            created_by: r.createdBy,
            raw_data: r,
            updated_at: timestamp,
          }));
          await supabase.from('daily_logs').upsert(reportRows);
        } catch (repErr) {
          console.warn('Granular daily_logs sync notice:', repErr);
        }
      }
    } catch (err: any) {
      clientError = err?.message || 'Client direct sync notice';
    }
  }

  // 2. Server-side unified snapshot push (Persists to server disk & server-side Supabase client)
  let serverSuccess = false;
  try {
    const endpoint = '/api/project/snapshot';
    const fullUrl =
      typeof window !== 'undefined'
        ? new URL(endpoint, window.location.origin).href
        : endpoint;

    const serverRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ payload }),
    });

    const contentType = serverRes.headers.get('content-type') || '';
    const isJson = contentType.toLowerCase().includes('application/json');

    if (!serverRes.ok) {
      let errorBody = '';
      try {
        errorBody = await serverRes.text();
      } catch (e) {
        errorBody = `[Unable to read body: ${e}]`;
      }
      console.warn(
        `[Server Snapshot Push Notice]\n` +
        `  Target URL: ${fullUrl}\n` +
        `  Resolved URL: ${serverRes.url || fullUrl}\n` +
        `  HTTP Status: ${serverRes.status} (${serverRes.statusText})\n` +
        `  Content-Type: "${contentType}"\n` +
        `  Response Body Snippet:\n${errorBody.slice(0, 1000)}`
      );
    } else if (!isJson) {
      let unexpectedBody = '';
      try {
        unexpectedBody = await serverRes.text();
      } catch (e) {
        unexpectedBody = `[Unable to read body: ${e}]`;
      }
      console.warn(
        `[Server Snapshot Push Notice - Non-JSON / HTML Returned]\n` +
        `  Expected: "application/json"\n` +
        `  Received Content-Type: "${contentType}"\n` +
        `  Target URL: ${fullUrl}\n` +
        `  Resolved URL: ${serverRes.url || fullUrl}\n` +
        `  HTTP Status: ${serverRes.status} (${serverRes.statusText})\n` +
        `  Response Body Snippet (HTML returned instead of JSON):\n${unexpectedBody.slice(0, 1000)}`
      );
    } else {
      serverSuccess = true;
    }
  } catch (serverErr) {
    console.warn('Server snapshot push notice:', serverErr);
  }

  const overallSuccess = clientSuccess || serverSuccess;
  const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (overallSuccess) {
    return {
      success: true,
      message: 'Seluruh data proyek berhasil disimpan ke Supabase Cloud & tersinkronisasi untuk semua browser!',
      syncedAt: timeStr,
      counts,
    };
  }

  return {
    success: false,
    message: clientError || 'Gagal melakukan sinkronisasi data ke cloud server.',
    syncedAt: timeStr,
    counts,
    error: clientError,
  };
}

/**
 * Pulls all project state from Supabase Cloud (with server fallback)
 * Ensures any browser immediately retrieves the shared project state.
 * Strictly verifies response.ok and Content-Type before parsing JSON.
 */
export async function pullAllDataFromSupabase(projectId = 'FORESYNDO-PROJECT-2'): Promise<ProjectSyncPayload | null> {
  const supabase = getSupabase();

  // 1. Try client direct pull from Supabase Cloud
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('project_snapshots')
        .select('data, updated_at, synced_by')
        .eq('id', projectId)
        .single();

      if (!error && data && data.data) {
        const payload = data.data as ProjectSyncPayload;
        payload.syncedAt = data.updated_at;
        payload.syncedBy = data.synced_by;
        return payload;
      }
    } catch (err) {
      console.warn('Client direct pull notice:', err);
    }
  }

  // 2. Server-side retrieval fallback (Server fetches from Supabase or persistent snapshot)
  const endpoint = '/api/project/snapshot';
  const fullUrl =
    typeof window !== 'undefined'
      ? new URL(endpoint, window.location.origin).href
      : endpoint;

  const fetchWithRetry = async (retries = 1, delay = 800): Promise<Response | null> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetch(endpoint, {
          headers: {
            Accept: 'application/json',
          },
        });
        return res;
      } catch (networkErr: any) {
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          console.warn(
            `[Project Snapshot Pull Notice - Server snapshot currently unavailable]\n` +
            `  Target URL: ${fullUrl}\n` +
            `  Details: ${networkErr?.message || networkErr}. Menggunakan data lokal (localStorage).`
          );
        }
      }
    }
    return null;
  };

  try {
    const res = await fetchWithRetry(1, 800);
    if (!res) {
      return null;
    }

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.toLowerCase().includes('application/json');

    if (!res.ok) {
      let errorBody = '';
      try {
        errorBody = await res.text();
      } catch (readErr) {
        errorBody = `[Unable to read response body: ${readErr}]`;
      }
      console.warn(
        `[Project Snapshot Pull Notice]\n` +
        `  Target URL: ${fullUrl}\n` +
        `  Resolved URL: ${res.url || fullUrl}\n` +
        `  HTTP Status: ${res.status} (${res.statusText})\n` +
        `  Content-Type: "${contentType}"\n` +
        `  Response Body Snippet:\n${errorBody.slice(0, 1000)}`
      );
      return null;
    }

    if (!isJson) {
      let unexpectedBody = '';
      try {
        unexpectedBody = await res.text();
      } catch (readErr) {
        unexpectedBody = `[Unable to read response body: ${readErr}]`;
      }
      console.warn(
        `[Project Snapshot Pull Notice - Non-JSON Returned]\n` +
        `  Expected: "application/json"\n` +
        `  Received Content-Type: "${contentType}"\n` +
        `  Target URL: ${fullUrl}\n` +
        `  Resolved URL: ${res.url || fullUrl}\n` +
        `  HTTP Status: ${res.status} (${res.statusText})\n` +
        `  Response Body Snippet:\n${unexpectedBody.slice(0, 1000)}`
      );
      return null;
    }

    const rawText = await res.text();
    let result: any = null;
    try {
      result = JSON.parse(rawText);
    } catch (parseErr: any) {
      console.warn(
        `[Project Snapshot Pull Notice - JSON Parse Failure]\n` +
        `  Target URL: ${fullUrl}\n` +
        `  Resolved URL: ${res.url || fullUrl}\n` +
        `  HTTP Status: ${res.status} (${res.statusText})\n` +
        `  Content-Type: "${contentType}"\n` +
        `  Parse Error: ${parseErr?.message}\n` +
        `  Raw Body Preview:\n${rawText.slice(0, 1000)}`
      );
      return null;
    }

    if (result && result.success && result.data) {
      const payload = result.data as ProjectSyncPayload;
      payload.syncedAt = result.updatedAt;
      payload.syncedBy = result.syncedBy;
      return payload;
    }
  } catch (err: any) {
    console.warn(
      `[Project Snapshot Pull Fallback Notice]\n` +
      `  Target URL: ${fullUrl}\n` +
      `  Notice: ${err?.message || err}. Data fallback ke penyimpanan lokal.`
    );
  }

  return null;
}

/**
 * Subscribes to realtime changes from Supabase
 */
export function subscribeToSupabaseRealtime(
  onUpdate: (payload: any) => void,
  projectId = 'FORESYNDO-PROJECT-2'
): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

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
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[Supabase Realtime Notice: ${status}]`, err?.message || err);
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {
        // ignore cleanup error
      }
    };
  } catch (err) {
    console.warn('Realtime subscription skipped:', err);
    return () => {};
  }
}
