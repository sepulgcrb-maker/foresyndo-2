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
} from 'lucide-react';
import {
  SyncStatusResult,
  CLIENT_SESSION_ID,
  recordPrimaryStateUpdate,
} from '../../utils/syncManager';

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

  if (!isOpen) return null;

  const handleSimulateExternalUpdate = () => {
    // Simulate another tab/device making an update with different session ID
    recordPrimaryStateUpdate(
      'Uji Coba Sinkronisasi (Simulasi Tab Lain)',
      'Kontraktor',
      'Ir. Hendra (Sesi Pengawas Eksternal)'
    );
    setSimulationTriggered(true);
    setTimeout(() => {
      onCheckSync();
      setSimulationTriggered(false);
    }, 400);
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
              <h3 className="font-bold text-white text-sm">Status Sinkronisasi & Cache Sesi</h3>
              <p className="text-[11px] text-slate-400">Pusat Diagnostik Integritas Data Lokal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
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
              <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-slate-500" /> Service Worker / Cache:</span>
              <span className="text-emerald-400 font-bold">Aktif & Terproteksi</span>
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
        </div>
      </div>
    </div>
  );
};
