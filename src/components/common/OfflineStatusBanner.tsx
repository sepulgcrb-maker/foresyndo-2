import React from 'react';
import { WifiOff, ShieldCheck, Database, X, RefreshCw } from 'lucide-react';
import { useOfflineCache } from '../../utils/serviceWorkerRegistration';

interface OfflineStatusBannerProps {
  onOpenDiagnostics?: () => void;
}

export const OfflineStatusBanner: React.FC<OfflineStatusBannerProps> = ({ onOpenDiagnostics }) => {
  const { isOffline, cacheReport } = useOfflineCache();
  const [dismissed, setDismissed] = React.useState(false);

  // When coming back online, reset dismissal state
  React.useEffect(() => {
    if (!isOffline) {
      setDismissed(false);
    }
  }, [isOffline]);

  if (!isOffline || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-lg border-b border-amber-500/40 px-4 py-2.5 transition-all duration-300 relative z-30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 font-medium">
          <div className="p-1.5 rounded-lg bg-black/20 border border-white/20 shrink-0">
            <WifiOff className="w-4 h-4 text-amber-100 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold uppercase tracking-wide text-amber-200 mr-2">
              Mode Offline (Read-Only)
            </span>
            <span className="text-white/95">
              Koneksi internet terputus. Aset tampilan dan respons API termuat aman dari{' '}
              <strong className="text-white underline decoration-amber-300/60">Service Worker Cache</strong>.
            </span>
            {cacheReport && cacheReport.counts.total > 0 && (
              <span className="hidden md:inline ml-2 text-[11px] bg-black/25 px-2 py-0.5 rounded-full border border-white/10 font-mono">
                {cacheReport.counts.static} file statis • {cacheReport.counts.api} respon API tersimpan
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenDiagnostics && (
            <button
              onClick={onOpenDiagnostics}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Status Cache</span>
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Sembunyikan peringatan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
