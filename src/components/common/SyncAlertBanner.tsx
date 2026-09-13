import React from 'react';
import { RefreshCw, AlertTriangle, X, CheckCircle2, Clock } from 'lucide-react';
import { SyncStatusResult } from '../../utils/syncManager';

interface SyncAlertBannerProps {
  syncStatus: SyncStatusResult;
  isChecking?: boolean;
  onSync: () => void;
  onDismiss: () => void;
}

export const SyncAlertBanner: React.FC<SyncAlertBannerProps> = ({
  syncStatus,
  isChecking,
  onSync,
  onDismiss,
}) => {
  if (!syncStatus.isOutOfSync) {
    return null;
  }

  return (
    <div className="relative z-30 bg-gradient-to-r from-amber-600/95 via-orange-600/95 to-amber-700/95 text-white border-b-2 border-amber-400/50 shadow-xl backdrop-blur-sm animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          {/* Alert Message & Context */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm tracking-wide uppercase bg-black/20 px-2 py-0.5 rounded-md border border-white/20">
                  Peringatan Desinkronisasi Sesi
                </span>
                <span className="text-xs text-amber-100 font-medium">
                  Versi Sesi: <strong className="font-mono text-white">v{syncStatus.sessionVersion}</strong> &bull; Versi Utama: <strong className="font-mono text-white">v{syncStatus.primaryVersion}</strong>
                </span>
              </div>
              <p className="text-xs text-amber-50 mt-0.5 leading-snug">
                {syncStatus.diffDescription ||
                  `Cache browser Anda berbeda dengan state utama proyek yang baru saja diperbarui pada ${syncStatus.lastUpdated}.`}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={onSync}
              disabled={isChecking}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-amber-50 font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Perbarui data lokal Anda dengan state proyek terbaru"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-orange-600 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Menyinkronkan...' : 'Sinkronkan Sesi Sekarang'}</span>
            </button>
            <button
              onClick={onDismiss}
              className="p-2 rounded-xl bg-black/20 hover:bg-black/30 text-white/90 hover:text-white transition-colors cursor-pointer"
              title="Abaikan peringatan ini untuk sementara"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
