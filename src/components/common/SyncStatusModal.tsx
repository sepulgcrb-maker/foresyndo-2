import React, { useState } from 'react';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Database,
  Radio,
  X,
  History,
  HardDrive,
  Cpu,
  Wifi,
  WifiOff,
  Layers,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  SyncStatusResult,
  CLIENT_SESSION_ID,
  recordPrimaryStateUpdate,
} from '../../utils/syncManager';
import { useOfflineCache } from '../../utils/serviceWorkerRegistration';

interface SyncStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncStatus: SyncStatusResult;
  lastSyncCheckedAt: Date;
  isChecking: boolean;
  onCheckSync: () => void;
  onForceSync: () => void;
}

export const SyncStatusModal: React.FC<SyncStatusModalProps> = ({
  isOpen,
  onClose,
  syncStatus,
  lastSyncCheckedAt,
  isChecking,
  onCheckSync,
  onForceSync,
}) => {
  const [simulationTriggered, setSimulationTriggered] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'session' | 'sw_cache'>('session');
  const [warmingNotice, setWarmingNotice] = useState<string | null>(null);

  const {
    isOnline,
    isOffline,
    cacheReport,
    isWarming,
    warmCache,
    clearCache,
    refreshReport,
  } = useOfflineCache();

  if (!isOpen) return null;

  const handleSimulateExternalUpdate = () => {
    // Simulate another tab/device making an update with different session ID
    recordPrimaryStateUpdate(
      'Uji Coba Sinkronisasi (Simulasi Tab Lain)',
      'Kontraktor',
      'EKO YULIANTO (Site Manager Lapangan)'
    );
    setSimulationTriggered(true);
    setTimeout(() => {
      onCheckSync();
      setSimulationTriggered(false);
    }, 400);
  };

  const handleWarmApi = async () => {
    const count = await warmCache();
    setWarmingNotice(`Berhasil memvalidasi & mem-prefetch ${count} payload API ke dalam cache offline.`);
    setTimeout(() => setWarmingNotice(null), 4000);
  };

  const handleClearCache = async () => {
    if (confirm('Bersihkan seluruh cache Service Worker (Aset Statis & API Payloads)?')) {
      await clearCache();
      setWarmingNotice('Cache berhasil dibersihkan dan diinisialisasi ulang.');
      setTimeout(() => setWarmingNotice(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Status Sinkronisasi & Cache Offline</h3>
              <p className="text-[11px] text-slate-400">Pusat Diagnostik Integritas Data Lokal & PWA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveSubTab('session')}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'session'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            Sesi & Cross-Tab
          </button>
          <button
            onClick={() => {
              setActiveSubTab('sw_cache');
              refreshReport();
            }}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'sw_cache'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Service Worker & Cache</span>
            {cacheReport && (
              <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full font-mono text-sky-300">
                {cacheReport.counts.total}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {activeSubTab === 'session' ? (
            <>
              {/* Status Highlight Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center gap-3 ${
                  syncStatus.isOutOfSync
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {syncStatus.isOutOfSync ? (
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-bold text-sm">
                    {syncStatus.isOutOfSync ? 'Cache Sesi Tidak Sinkron!' : 'Cache Sesi Sinkron & Terverifikasi'}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {syncStatus.isOutOfSync
                      ? 'State utama di penyimpanan telah diperbarui oleh sesi lain. Diperlukan sinkronisasi untuk memuat data terbaru.'
                      : 'Sesi browser Anda saat ini menggunakan versi data terbaru yang identik dengan primary storage.'}
                  </div>
                </div>
              </div>

              {/* Diagnostic Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Versi Sesi Saat Ini</span>
                  <span className="font-mono text-base font-bold text-orange-400">
                    v{syncStatus.sessionVersion}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Versi Storage Utama</span>
                  <span className="font-mono text-base font-bold text-white">
                    v{syncStatus.primaryVersion}
                  </span>
                </div>
              </div>

              {/* Detailed Info */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5 text-slate-500" /> Sesi Instance ID:</span>
                  <span className="text-slate-200">{CLIENT_SESSION_ID.substring(0, 16)}...</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5 text-slate-500" /> Pembaruan Terakhir:</span>
                  <span className="text-slate-200">{syncStatus.lastUpdated}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-slate-500" /> Pengubah Terakhir:</span>
                  <span className="text-slate-200">{syncStatus.updatedByName || syncStatus.updatedByRole}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-slate-500" /> Service Worker:</span>
                  <span className="text-emerald-400 font-bold">Aktif (v4.1 Multi-Tier Cache)</span>
                </div>
              </div>

              {/* Action Row */}
              <div className="space-y-2 pt-2">
                <div className="flex gap-2">
                  <button
                    onClick={onForceSync}
                    disabled={isChecking}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                    <span>Sinkronkan Sekarang</span>
                  </button>

                  <button
                    onClick={onCheckSync}
                    disabled={isChecking}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 transition-colors cursor-pointer"
                    title="Periksa Ulang Integritas Storage"
                  >
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Cek Status</span>
                  </button>
                </div>

                <button
                  onClick={handleSimulateExternalUpdate}
                  disabled={simulationTriggered}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer text-[11px] font-semibold"
                >
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Simulasikan Perubahan di Tab Lain (Uji Peringatan)</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* SW Cache Sub-Tab */}
              <div
                className={`p-4 rounded-2xl border flex items-center gap-3 ${
                  isOffline
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                    : 'bg-sky-500/10 border-sky-500/30 text-sky-200'
                }`}
              >
                {isOffline ? (
                  <WifiOff className="w-6 h-6 text-amber-400 shrink-0 animate-pulse" />
                ) : (
                  <Wifi className="w-6 h-6 text-sky-400 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>{isOffline ? 'Koneksi Offline (Read-Only Mode)' : 'Koneksi Online (Live)'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800/80 border border-white/10">
                      SW {cacheReport?.isActive ? 'Aktif' : 'Terdaftar'}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {isOffline
                      ? 'Aplikasi berjalan sepenuhnya secara lokal. Seluruh tampilan dan respons API disajikan dari Service Worker cache.'
                      : 'Koneksi internet aktif. Service Worker menjaga sinkronisasi cache aset statis dan payload API di latar belakang.'}
                  </div>
                </div>
              </div>

              {/* Cache Metric Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Aset Statis</span>
                  <span className="font-mono text-sm font-bold text-sky-400">
                    {cacheReport?.counts.static ?? 0} berkas
                  </span>
                  <span className="text-[10px] text-slate-500 block">Stale-While-Revalidate</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">API Payloads</span>
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {cacheReport?.counts.api ?? 0} respons
                  </span>
                  <span className="text-[10px] text-slate-500 block">Network-First + Fallback</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Halaman / SPA</span>
                  <span className="font-mono text-sm font-bold text-orange-400">
                    {cacheReport?.counts.pages ?? 0} rute
                  </span>
                  <span className="text-[10px] text-slate-500 block">Offline Shell</span>
                </div>
              </div>

              {/* Cache Details Breakdown */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-[11px]">
                <div className="font-semibold text-slate-300 flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-sky-400" /> Strategi Caching Service Worker:</span>
                  <span className="text-[10px] text-slate-400 font-mono">v4.1</span>
                </div>

                <div className="space-y-1.5 text-slate-400">
                  <div className="flex justify-between items-center">
                    <span>• Aset Statis (JS, CSS, Logo, Font):</span>
                    <span className="text-slate-200 font-mono">Cache-First / Revalidate</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Payload API Cuaca (`/api/weather`):</span>
                    <span className="text-emerald-400 font-mono">Cached + Offline Fallback</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Status Database (`/api/supabase/status`):</span>
                    <span className="text-emerald-400 font-mono">Auto-Cached</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>• Data Proyek (RAB, Jadwal, BAST, Laporan):</span>
                    <span className="text-orange-300 font-mono">Local Synchronized Storage</span>
                  </div>
                </div>
              </div>

              {warmingNotice && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] animate-in fade-in">
                  {warmingNotice}
                </div>
              )}

              {/* Cache Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleWarmApi}
                  disabled={isWarming}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-md shadow-sky-600/20 cursor-pointer disabled:opacity-50"
                  title="Unduh dan simpan data cuaca & status API terkini ke dalam cache offline"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isWarming ? 'animate-spin' : ''}`} />
                  <span>{isWarming ? 'Mem-prefetch...' : 'Hangatkan Cache API'}</span>
                </button>

                <button
                  onClick={handleClearCache}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 font-semibold border border-slate-700 hover:border-rose-800/50 transition-colors cursor-pointer"
                  title="Hapus cache dan inisialisasi ulang"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Cache</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

