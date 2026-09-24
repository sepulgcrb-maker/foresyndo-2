import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  Code,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Radio,
  Eye,
  EyeOff,
  Trash2,
  Download,
} from 'lucide-react';
import { isSupabaseConnected, saveSupabaseConfig, getSupabaseConfigDetails } from '../../lib/supabase';
import { testSupabaseConnection, getSupabaseSqlSchema, getUnintegratedTablesSqlSchema } from '../../lib/supabaseService';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPushToSupabase?: () => Promise<{ success: boolean; message: string; counts?: any }>;
  onPullFromSupabase?: () => Promise<{ success: boolean; message: string }>;
  lastSyncedAt?: string | null;
  documentsCount?: number;
  reportsCount?: number;
  issuesCount?: number;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onPushToSupabase,
  onPullFromSupabase,
  lastSyncedAt,
  documentsCount = 0,
  reportsCount = 0,
  issuesCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'config' | 'schema'>('sync');

  // Credentials
  const config = getSupabaseConfigDetails();
  const [url, setUrl] = useState(config.url || '');
  const [key, setKey] = useState(localStorage.getItem('FORESYNDO_SUPABASE_ANON_KEY') || '');
  const [showKey, setShowKey] = useState(false);

  // States
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; latencyMs?: number } | null>(null);

  const [isPushing, setIsPushing] = useState(false);
  const [pushStatus, setPushStatus] = useState<{ success: boolean; message: string } | null>(null);

  const [isPulling, setIsPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [schemaMode, setSchemaMode] = useState<'unintegrated' | 'all'>('unintegrated');

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfigDetails();
      setUrl(cfg.url || '');
      setKey(localStorage.getItem('FORESYNDO_SUPABASE_ANON_KEY') || '');
      setTestResult(null);
      setPushStatus(null);
      setPullStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const connected = isSupabaseConnected();

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Gagal menghubungi server Supabase',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSupabaseConfig(url.trim(), key.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      handleTestConnection();
    }, 800);
  };

  const handleDisconnect = () => {
    if (window.confirm('Apakah Anda yakin ingin memutus koneksi Supabase lokal? Data di Supabase tidak akan terhapus.')) {
      saveSupabaseConfig('', '');
      setUrl('');
      setKey('');
      setTestResult(null);
    }
  };

  const handlePush = async () => {
    if (!onPushToSupabase) return;
    setIsPushing(true);
    setPushStatus(null);
    try {
      const res = await onPushToSupabase();
      setPushStatus(res);
    } catch (err: any) {
      setPushStatus({ success: false, message: err?.message || 'Gagal sinkronisasi data ke Supabase' });
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    if (!onPullFromSupabase) return;
    setIsPulling(true);
    setPullStatus(null);
    try {
      const res = await onPullFromSupabase();
      setPullStatus(res);
    } catch (err: any) {
      setPullStatus({ success: false, message: err?.message || 'Gagal mengambil data dari Supabase' });
    } finally {
      setIsPulling(false);
    }
  };

  const handleCopySchema = () => {
    const sql = schemaMode === 'unintegrated' ? getUnintegratedTablesSqlSchema() : getSupabaseSqlSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleDownloadSchema = () => {
    const sql = schemaMode === 'unintegrated' ? getUnintegratedTablesSqlSchema() : getSupabaseSqlSchema();
    const filename = schemaMode === 'unintegrated' ? 'supabase_unintegrated_tables.sql' : 'supabase_full_schema.sql';
    const blob = new Blob([sql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Integrasi Supabase Cloud</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    connected
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                  }`}
                >
                  {connected ? 'Terhubung' : 'Penyimpanan Lokal'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Penyimpanan Database PostgreSQL, Realtime Sync, dan Manajemen Dokumen Proyek
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'sync'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Radio className="w-4 h-4" /> Sinkronisasi Realtime
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'config'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Kredensial & URL
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" /> Skrip SQL Skema
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6">
          {/* TAB 1: SINKRONISASI REALTIME */}
          {activeTab === 'sync' && (
            <div className="space-y-5">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  connected
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {connected ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {connected ? 'Supabase Siap Digunakan' : 'Supabase Belum Dikonfigurasi'}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      {connected
                        ? `Terhubung ke: ${url.replace(/^(https?:\/\/)([^.]+)(.*)$/, '$1$2...')}. Status realtime aktif.`
                        : 'Aplikasi saat ini berjalan dengan penyimpanan persisten browser (LocalStorage). Masukkan URL & Anon Key di tab Kredensial untuk menghubungkan ke Supabase.'}
                    </p>
                    {lastSyncedAt && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                        Terakhir disinkronkan: {lastSyncedAt}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleTestConnection}
                  disabled={testingConnection || !connected}
                  className="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5 shrink-0 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin text-emerald-500' : ''}`} />
                  {testingConnection ? 'Menguji...' : 'Uji Ping Koneksi'}
                </button>
              </div>

              {/* Test Connection Output */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <div className="font-semibold flex items-center gap-1.5">
                    {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {testResult.message}
                  </div>
                  {testResult.latencyMs !== undefined && (
                    <div className="text-[11px] opacity-80 mt-0.5">Latency respons: {testResult.latencyMs} ms</div>
                  )}
                </div>
              )}

              {/* Data Summary Grid */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Ringkasan Objek Terkelola Proyek:
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                    <span className="text-[10px] text-slate-500 font-medium block">Dokumen Teknis</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">{documentsCount} Berkas</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                    <span className="text-[10px] text-slate-500 font-medium block">Laporan Harian</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">{reportsCount} Laporan</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                    <span className="text-[10px] text-slate-500 font-medium block">Kendala Lapangan</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">{issuesCount} Isu</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handlePush}
                    disabled={isPushing || !connected}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-colors disabled:opacity-50"
                  >
                    <UploadCloud className={`w-4 h-4 ${isPushing ? 'animate-bounce' : ''}`} />
                    {isPushing ? 'Mengunggah ke Supabase...' : 'Unggah Data ke Supabase (Push)'}
                  </button>

                  <button
                    onClick={handlePull}
                    disabled={isPulling || !connected}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <DownloadCloud className={`w-4 h-4 ${isPulling ? 'animate-bounce' : ''}`} />
                    {isPulling ? 'Mengambil Data...' : 'Tarik Data dari Supabase (Pull)'}
                  </button>
                </div>

                {/* Push Status Toast */}
                {pushStatus && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-medium text-center border ${
                      pushStatus.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {pushStatus.message}
                  </div>
                )}

                {/* Pull Status Toast */}
                {pullStatus && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-medium text-center border ${
                      pullStatus.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {pullStatus.message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: KREDENSIAL & URL */}
          {activeTab === 'config' && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Dapat ditemukan di: <strong>Project Settings &rarr; API &rarr; Project URL</strong>
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Supabase Anon Key (Public)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showKey ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Dapat ditemukan di: <strong>Project Settings &rarr; API &rarr; Project API keys (anon public)</strong>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 text-[11px] text-sky-800 dark:text-sky-300 leading-relaxed space-y-1">
                <p>
                  <strong>Sinkronisasi Antar-Browser:</strong> Kredensial yang disimpan di sini otomatis didistribusikan ke server sehingga saat pengguna lain membuka aplikasi dari browser atau perangkat lain, mereka langsung terhubung ke database Supabase yang sama.
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Anda juga dapat mendefinisikan <code className="bg-sky-100 dark:bg-sky-900 px-1 py-0.5 rounded font-mono">SUPABASE_URL</code> dan{' '}
                  <code className="bg-sky-100 dark:bg-sky-900 px-1 py-0.5 rounded font-mono">SUPABASE_ANON_KEY</code> di konfigurasi Secrets server.
                </p>
              </div>

              {savedSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Konfigurasi Supabase Berhasil Disimpan!
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                {connected && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Putus Koneksi
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    Tutup
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-colors"
                  >
                    <Save className="w-4 h-4" /> Simpan Konfigurasi
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: SKRIP SQL SKEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Skrip Pembuatan Tabel & Kebijakan RLS Supabase
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Eksekusi skrip ini di SQL Editor Supabase untuk membuat tabel dan mengaktifkan RLS serta Realtime.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadSchema}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition-colors"
                    title="Unduh file .sql"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh .SQL
                  </button>
                  <button
                    onClick={handleCopySchema}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSchema ? 'Tersalin!' : 'Salin Skrip SQL'}
                  </button>
                </div>
              </div>

              {/* Toggle Mode */}
              <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setSchemaMode('unintegrated')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    schemaMode === 'unintegrated'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Tabel Baru / Belum Terintegrasi (15 Tabel)
                </button>
                <button
                  type="button"
                  onClick={() => setSchemaMode('all')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                    schemaMode === 'all'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Skema Lengkap (Semua 25 Tabel)
                </button>
              </div>

              {schemaMode === 'unintegrated' && (
                <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] space-y-1.5">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 19 Tabel Operasional Termasuk Rekanan Supplier &amp; PO:
                  </div>
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {[
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
                    ].map((tbl) => (
                      <span key={tbl} className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-mono">
                        {tbl}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-950 text-slate-200 rounded-xl p-3 text-[11px] font-mono overflow-x-auto max-h-64 border border-slate-800">
                <pre>{schemaMode === 'unintegrated' ? getUnintegratedTablesSqlSchema() : getSupabaseSqlSchema()}</pre>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Langkah Menjalankan di Supabase:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px]">
                  <li>Buka project Supabase Anda di browser (<a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">supabase.com/dashboard</a>).</li>
                  <li>
                    Pilih menu <strong>SQL Editor</strong> pada bilah navigasi kiri &rarr; klik <strong>New query</strong>.
                  </li>
                  <li>Klik tombol <strong>Salin Skrip SQL</strong> di atas, lalu tempel (Paste) ke dalam editor SQL.</li>
                  <li>
                    Klik tombol <strong>Run</strong> (atau tekan Ctrl/Cmd + Enter) untuk mengeksekusi skrip SQL.
                  </li>
                  <li>
                    Tabel, kolom, indeks performa, RLS publik, dan publikasi Realtime akan aktif secara instan!
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
