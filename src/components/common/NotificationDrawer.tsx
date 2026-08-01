import React from 'react';
import { X, Bell, AlertTriangle, AlertCircle, Clock, Info, CheckCircle2 } from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) => {
  if (!isOpen) return null;

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'reminder':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-xs">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Pemberitahuan & Alert</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Peringatan otomatis deviasi & jadwal</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Bar */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {notifications.filter((n) => !n.isRead).length} Belum Dibaca
            </span>
            <button
              onClick={onMarkAllRead}
              className="text-orange-600 dark:text-orange-400 font-semibold hover:underline flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Tandai Semua Dibaca
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">Tidak ada notifikasi aktif</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border text-xs transition-all ${
                    notif.isRead
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75'
                      : 'bg-white dark:bg-slate-800 border-orange-500/30 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5">{getIcon(notif.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white">{notif.title}</h4>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.timestamp}</span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
