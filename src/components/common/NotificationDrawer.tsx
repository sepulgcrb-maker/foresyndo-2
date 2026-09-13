import React, { useState } from 'react';
import {
  X,
  Bell,
  AlertTriangle,
  AlertCircle,
  Clock,
  Info,
  CheckCircle2,
  FileText,
  Building,
  UserCheck,
  ExternalLink,
  Sparkles,
  Check,
  Filter,
} from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onMarkItemRead?: (id: string) => void;
  onNavigateToDocument?: (docId?: string) => void;
  onSimulateMKDocument?: () => void;
  onSimulateOwnerDocument?: () => void;
  darkMode?: boolean;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkItemRead,
  onNavigateToDocument,
  onSimulateMKDocument,
  onSimulateOwnerDocument,
  darkMode = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'documents' | 'alerts'>('all');

  if (!isOpen) return null;

  const isDocNotification = (n: NotificationItem) =>
    n.category === 'document' ||
    n.title.toLowerCase().includes('dokumen') ||
    n.message.toLowerCase().includes('dokumen') ||
    n.uploaderRole === 'Owner' ||
    n.uploaderRole === 'Direktur' ||
    n.uploaderRole === 'Konsultan';

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const docNotifications = notifications.filter(isDocNotification);
  const unreadDocCount = docNotifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'documents') return isDocNotification(n);
    if (activeFilter === 'alerts') return n.type === 'alert' || n.type === 'warning';
    return true;
  });

  const getIcon = (item: NotificationItem) => {
    if (isDocNotification(item)) {
      return (
        <div className="p-2 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
          <FileText className="w-4 h-4" />
        </div>
      );
    }
    switch (item.type) {
      case 'alert':
        return (
          <div className="p-2 rounded-xl bg-red-500/15 text-red-500 border border-red-500/30">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'warning':
        return (
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <AlertCircle className="w-4 h-4" />
          </div>
        );
      case 'reminder':
        return (
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-500 border border-blue-500/30">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'info':
      default:
        return (
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
            <Info className="w-4 h-4" />
          </div>
        );
    }
  };

  const handleDocumentClick = (notif: NotificationItem) => {
    if (onMarkItemRead && !notif.isRead) {
      onMarkItemRead(notif.id);
    }
    if (onNavigateToDocument) {
      onNavigateToDocument(notif.documentId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-white via-sky-50/50 to-blue-50/70 dark:from-slate-900 dark:to-slate-900">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-400/30 shadow-xs relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Pemberitahuan & Alert</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shadow-xs">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update dokumen MK/Owner & monitoring deviasi
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Tutup Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="px-4 pt-3 pb-2 bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                activeFilter === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('documents')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeFilter === 'documents'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Dokumen MK & Owner
              {unreadDocCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-black">
                  {unreadDocCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilter('alerts')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeFilter === 'alerts'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Peringatan
            </button>
          </div>

          {/* Action Bar */}
          <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {unreadCount} pemberitahuan belum dibaca
            </span>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-sky-700 dark:text-sky-400 font-bold hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Tandai Semua Dibaca
              </button>
            )}
          </div>

          {/* Quick Simulation Banner (for testing document notifications by MK or Owner) */}
          {(onSimulateMKDocument || onSimulateOwnerDocument) && (
            <div className="p-3 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-800/40 border-b border-sky-200/80 dark:border-slate-700/80">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-900 dark:text-sky-200 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Uji Coba Otomatis Badge Lonceng:
              </div>
              <div className="flex items-center gap-2">
                {onSimulateMKDocument && (
                  <button
                    onClick={onSimulateMKDocument}
                    className="flex-1 py-1.5 px-2 bg-white dark:bg-slate-700 hover:bg-sky-50 dark:hover:bg-slate-600 text-sky-800 dark:text-sky-200 border border-sky-300 dark:border-slate-600 rounded-lg text-[11px] font-bold shadow-2xs transition-all flex items-center justify-center gap-1"
                    title="Simulasikan Konsultan MK mengunggah Shop Drawing baru"
                  >
                    <UserCheck className="w-3 h-3 text-sky-600" />
                    + Dokumen MK
                  </button>
                )}
                {onSimulateOwnerDocument && (
                  <button
                    onClick={onSimulateOwnerDocument}
                    className="flex-1 py-1.5 px-2 bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-600 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-slate-600 rounded-lg text-[11px] font-bold shadow-2xs transition-all flex items-center justify-center gap-1"
                    title="Simulasikan Owner menerbitkan dokumen Addendum baru"
                  >
                    <Building className="w-3 h-3 text-indigo-600" />
                    + Dokumen Owner
                  </button>
                )}
              </div>
            </div>
          )}

          {/* List of Notifications */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center gap-2">
                <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                  <Bell className="w-6 h-6" />
                </div>
                <span>Tidak ada pemberitahuan pada filter ini</span>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const isDoc = isDocNotification(notif);
                return (
                  <div
                    key={notif.id}
                    className={`p-3.5 rounded-2xl border text-xs transition-all ${
                      notif.isRead
                        ? 'bg-slate-50/80 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-80'
                        : isDoc
                        ? 'bg-gradient-to-r from-sky-50/70 to-blue-50/60 dark:bg-slate-800/90 border-sky-300 dark:border-sky-500/40 shadow-xs ring-1 ring-sky-400/20'
                        : 'bg-white dark:bg-slate-800 border-amber-300/80 dark:border-amber-500/30 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0">{getIcon(notif)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-slate-900 dark:text-white leading-tight">
                              {notif.title}
                            </h4>
                            {!notif.isRead && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Belum dibaca" />
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.timestamp}</span>
                        </div>

                        {/* Badges for document uploader if present */}
                        {isDoc && (
                          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                            {notif.uploaderRole && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                                  notif.uploaderRole === 'Konsultan'
                                    ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700'
                                    : notif.uploaderRole === 'Owner' || notif.uploaderRole === 'Direktur'
                                    ? 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700'
                                    : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                                }`}
                              >
                                Diunggah oleh: {notif.uploaderRole === 'Konsultan' ? 'Konsultan MK' : notif.uploaderRole}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 dark:bg-slate-800 dark:text-sky-300 text-[10px] font-semibold border border-sky-200 dark:border-slate-700">
                              Dokumen Proyek
                            </span>
                          </div>
                        )}

                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                          {notif.message}
                        </p>

                        {/* Interactive Buttons */}
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          {isDoc && onNavigateToDocument && (
                            <button
                              onClick={() => handleDocumentClick(notif)}
                              className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] flex items-center gap-1 transition-all shadow-xs"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Buka di Dokumen & Gambar
                            </button>
                          )}
                          {!notif.isRead && onMarkItemRead && (
                            <button
                              onClick={() => onMarkItemRead(notif.id)}
                              className="px-2 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 font-semibold text-[10px] transition-colors flex items-center gap-1"
                              title="Tandai notifikasi ini sudah dibaca"
                            >
                              <Check className="w-3 h-3" />
                              Tandai Dibaca
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

