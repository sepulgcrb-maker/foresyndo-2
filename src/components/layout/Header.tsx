import React from 'react';
import {
  Building2,
  Bell,
  Sun,
  Moon,
  Download,
  Database,
  ChevronDown,
  Activity,
  UserCheck,
  RotateCcw,
  Settings,
  Pencil,
  Sliders,
  ShieldCheck,
  KeyRound,
  LogOut,
  HardHat,
  Radio,
  RefreshCw,
  QrCode,
} from 'lucide-react';
import { ProjectInfo, UserRole, NotificationItem } from '../../types';
import { RoleBadge } from '../common/RoleBadge';
import { isSupabaseConnected } from '../../lib/supabase';
import { SyncStatusResult } from '../../utils/syncManager';

interface HeaderProps {
  project: ProjectInfo;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onOpenSupabaseModal: () => void;
  onQuickExport: () => void;
  onResetProject?: () => void;
  onOpenSettingsModal?: () => void;
  onOpenContractorModal?: () => void;
  onOpenRoleModal?: (subTab?: 'profiles' | 'permissions' | 'matrix' | 'workflow' | 'pins') => void;
  activeUserName?: string;
  onLogout?: () => void;
  syncStatus?: SyncStatusResult;
  onOpenSyncModal?: () => void;
  onOpenQrModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  currentRole,
  onRoleChange,
  darkMode,
  onToggleDarkMode,
  notifications,
  onOpenNotifications,
  onOpenSupabaseModal,
  onQuickExport,
  onResetProject,
  onOpenSettingsModal,
  onOpenContractorModal,
  onOpenRoleModal,
  activeUserName,
  onLogout,
  syncStatus,
  onOpenSyncModal,
  onOpenQrModal,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const unreadDocNotifications = notifications.filter(
    (n) =>
      !n.isRead &&
      (n.category === 'document' ||
        n.title.toLowerCase().includes('dokumen') ||
        n.message.toLowerCase().includes('dokumen') ||
        n.uploaderRole === 'Owner' ||
        n.uploaderRole === 'Direktur' ||
        n.uploaderRole === 'Konsultan')
  );
  const unreadDocCount = unreadDocNotifications.length;
  const hasNewDocsFromMKOorOwner = unreadDocCount > 0;
  const connected = isSupabaseConnected();

  const isOwner = currentRole === 'Owner' || currentRole === 'Direktur';
  const isKontraktor = currentRole === 'Kontraktor' || currentRole === 'Site Manager';

  // For Owner, allow switching between primary roles
  const primaryRoles: UserRole[] = ['Owner', 'Konsultan', 'Kontraktor'];
  const otherRoles: UserRole[] = ['Admin', 'Viewer'];

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-colors duration-200 ${
        darkMode
          ? 'bg-[#0F172A] border-b border-slate-800 text-white'
          : 'bg-gradient-to-r from-white via-sky-50/90 to-blue-50/95 backdrop-blur-md border-b border-sky-200/80 text-slate-800 shadow-sm shadow-sky-500/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Project Name */}
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center p-1 shrink-0 border shadow-xs ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-sky-200'
            }`}
          >
            <img
              src={project.logoUrl || '/assets/logo.png'}
              alt="Logo PT Foresyndo Global Indonesia"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className={`text-sm sm:text-base font-bold tracking-tight flex items-center gap-2 ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                {project.name}
                <span
                  className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    project.status === 'Belum Mulai' || project.status === 'Perencanaan'
                      ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                      : project.status === 'Berjalan'
                      ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-600 border-blue-500/30'
                  }`}
                >
                  <Activity className="w-3 h-3 animate-pulse" /> {project.status.toUpperCase()}
                </span>
              </h1>
              {onOpenSettingsModal && (
                <button
                  onClick={onOpenSettingsModal}
                  className={`p-1 rounded-md transition-colors ${
                    darkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-orange-400'
                      : 'bg-white hover:bg-sky-100/80 text-slate-500 hover:text-blue-600 border border-sky-200/80 shadow-xs'
                  }`}
                  title="Ubah Nama & Identitas Proyek"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className={`text-[11px] truncate max-w-xs sm:max-w-md ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {project.owner} &bull; {project.location}
            </p>
          </div>
        </div>

        {/* Right: Actions, Settings, Role Selector & Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Settings / Edit Name Button */}
          {onOpenSettingsModal && (
            <button
              onClick={onOpenSettingsModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border ${
                darkMode
                  ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border-orange-500/40'
                  : 'bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 border-sky-300 shadow-xs'
              }`}
              title="Pengaturan Nama & Identitas Proyek"
            >
              <Settings className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Ubah Nama</span>
            </button>
          )}

          {/* Role Management 3 Pihak Button - ONLY visible to Owner */}
          {isOwner && onOpenRoleModal && (
            <button
              onClick={onOpenRoleModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border ${
                darkMode
                  ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/40'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200/90 shadow-xs'
              }`}
              title="Kelola Role & Wewenang Tiga Pihak (Owner, Konsultan, Kontraktor)"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Role 3 Pihak</span>
            </button>
          )}

          {/* QR Code Verifikasi Lapangan Button */}
          {onOpenQrModal && (
            <button
              onClick={onOpenQrModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border ${
                darkMode
                  ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/40'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/90 shadow-xs'
              }`}
              title="QR Code Verifikasi Lapangan & Akses Cepat Proyek"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">QR Proyek</span>
            </button>
          )}

          {/* Session Cache Sync Status Pill */}
          {syncStatus && onOpenSyncModal && (
            <button
              onClick={onOpenSyncModal}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                syncStatus.isOutOfSync
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-600 animate-pulse hover:bg-amber-500/30'
                  : darkMode
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  : 'bg-white hover:bg-sky-50 border-sky-200 text-slate-700 shadow-xs'
              }`}
              title={
                syncStatus.isOutOfSync
                  ? 'Peringatan: Cache sesi browser tidak sinkron dengan storage utama!'
                  : `Sesi Sinkron (v${syncStatus.sessionVersion}) - Klik untuk periksa status sinkronisasi`
              }
            >
              {syncStatus.isOutOfSync ? (
                <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              ) : (
                <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              )}
              <span className="hidden sm:inline">
                {syncStatus.isOutOfSync ? 'Cache Out-of-Sync' : `Sync v${syncStatus.sessionVersion}`}
              </span>
            </button>
          )}

          {/* Supabase Status Pill */}
          <button
            onClick={onOpenSupabaseModal}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs transition-colors ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                : 'bg-white hover:bg-sky-50 border-sky-200 text-slate-700 shadow-xs'
            }`}
            title="Klik untuk konfigurasi Supabase Realtime"
          >
            <Database className={`w-3.5 h-3.5 ${connected ? 'text-emerald-500' : 'text-amber-500'}`} />
            <span className="font-semibold">{connected ? 'Supabase' : 'Local Store'}</span>
          </button>

          {/* Quick Export Button */}
          <button
            onClick={onQuickExport}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-white hover:bg-sky-50 border-sky-200 text-slate-700 shadow-xs'
            }`}
          >
            <Download className="w-3.5 h-3.5 text-sky-600" /> Export Laporan
          </button>

          {/* Reset Project Button - Only for Owner */}
          {isOwner && onResetProject && (
            <button
              onClick={onResetProject}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                darkMode
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  : 'bg-white hover:bg-sky-50 border-sky-200 text-slate-700 shadow-xs'
              }`}
              title="Reset data proyek ke kondisi Belum Mulai (0% Progress)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> Reset Belum Mulai
            </button>
          )}

          {/* Role Display / Switcher */}
          {isKontraktor ? (
            /* KONTRAKTOR: STRICTLY CANNOT SEE OWNER & MK ROLES */
            <div className="flex items-center gap-1.5">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm ${
                  darkMode
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
                title="Peran Aktif: Kontraktor Pelaksana Lapangan"
              >
                <HardHat className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate max-w-[130px] sm:max-w-[200px]">{activeUserName || 'Kontraktor Pelaksana'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Sesi Terverifikasi" />
              </div>
              {onOpenContractorModal && (
                <button
                  onClick={onOpenContractorModal}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    darkMode
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/30'
                      : 'bg-amber-100/70 hover:bg-amber-100 text-amber-900 border-amber-300'
                  }`}
                  title="Pengaturan Profil Kontraktor (Manajemen, Alamat, NPWP, NIB, Logo)"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden lg:inline">Profil Kontraktor</span>
                </button>
              )}
            </div>
          ) : isOwner ? (
            /* OWNER: Can switch between roles & configure permissions */
            <div className="relative group">
              <button
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-200'
                    : 'bg-white border-sky-200 hover:border-sky-400 text-slate-800 shadow-xs'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                <RoleBadge role={currentRole} showIcon={false} />
                <ChevronDown className={`w-3.5 h-3.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              </button>
              <div
                className={`absolute right-0 mt-2 w-64 py-2 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50 border ${
                  darkMode
                    ? 'bg-slate-900 border-slate-800 text-slate-200'
                    : 'bg-white/95 backdrop-blur-md border-sky-200/90 text-slate-800 shadow-sky-500/10'
                }`}
              >
                <div
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    darkMode ? 'text-orange-400' : 'text-sky-700'
                  }`}
                >
                  Tiga Pihak Proyek (Utama)
                </div>
                {primaryRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => onRoleChange(r)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      currentRole === r
                        ? darkMode
                          ? 'text-orange-400 font-bold bg-slate-800/50'
                          : 'text-sky-700 font-bold bg-sky-50'
                        : darkMode
                        ? 'text-slate-300 hover:bg-slate-800'
                        : 'text-slate-600 hover:bg-sky-50/70 hover:text-sky-800'
                    }`}
                  >
                    <RoleBadge role={r} />
                    {currentRole === r && (
                      <span className={`text-[10px] font-bold ${darkMode ? 'text-orange-400' : 'text-sky-600'}`}>
                        &bull; Aktif
                      </span>
                    )}
                  </button>
                ))}

                <div
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider mt-1 border-t pt-2 ${
                    darkMode ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-sky-100'
                  }`}
                >
                  Simulasi Lainnya
                </div>
                {otherRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => onRoleChange(r)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      currentRole === r
                        ? darkMode
                          ? 'text-orange-400 font-bold bg-slate-800/50'
                          : 'text-sky-700 font-bold bg-sky-50'
                        : darkMode
                        ? 'text-slate-400 hover:bg-slate-800'
                        : 'text-slate-500 hover:bg-sky-50/70 hover:text-sky-800'
                    }`}
                  >
                    <RoleBadge role={r} />
                    {currentRole === r && (
                      <span className={`text-[10px] font-bold ${darkMode ? 'text-orange-400' : 'text-sky-600'}`}>
                        &bull; Aktif
                      </span>
                    )}
                  </button>
                ))}

                {onOpenRoleModal && (
                  <div className={`px-2 pt-2 mt-1 border-t space-y-1 ${darkMode ? 'border-slate-800' : 'border-sky-100'}`}>
                    <button
                      onClick={() => onOpenRoleModal('pins')}
                      className={`w-full text-left px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        darkMode
                          ? 'bg-orange-500/15 hover:bg-orange-500/25 border-orange-500/30 text-orange-300'
                          : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-800'
                      }`}
                    >
                      <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                      <span>Atur PIN Keamanan (Owner)</span>
                    </button>

                    <button
                      onClick={() => onOpenRoleModal('permissions')}
                      className={`w-full text-left px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        darkMode
                          ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                          : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-800'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5 text-blue-600" />
                      <span>Atur Hak Akses Role (Owner)</span>
                    </button>

                    <button
                      onClick={() => onOpenRoleModal('profiles')}
                      className={`w-full text-left px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-xs font-semibold ${
                        darkMode
                          ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-300'
                          : 'bg-slate-50 hover:bg-sky-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>Kelola Profil & RACI</span>
                    </button>

                    {onOpenContractorModal && (
                      <button
                        onClick={onOpenContractorModal}
                        className={`w-full text-left px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          darkMode
                            ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                            : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                        }`}
                      >
                        <HardHat className="w-3.5 h-3.5 text-amber-600" />
                        <span>Profil &amp; Legalitas Kontraktor</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* KONSULTAN / VIEWER: Fixed profile badge */
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm ${
                darkMode
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
              title={`Peran Aktif: ${currentRole}`}
            >
              <RoleBadge role={currentRole} showIcon={false} />
              <span className="truncate max-w-[120px] sm:max-w-[180px]">{activeUserName}</span>
            </div>
          )}

          {/* Notifications Trigger with Animated Dynamic Badge */}
          <button
            onClick={onOpenNotifications}
            className={`relative p-2 rounded-xl transition-all border cursor-pointer ${
              hasNewDocsFromMKOorOwner
                ? darkMode
                  ? 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-sky-500/50 shadow-sm shadow-sky-500/10 ring-1 ring-sky-500/30'
                  : 'bg-gradient-to-r from-sky-50 to-blue-50 hover:bg-sky-100/80 text-sky-700 border-sky-300 shadow-sm shadow-sky-500/10 ring-1 ring-sky-400/40'
                : darkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-white hover:bg-sky-50 text-slate-700 border-sky-200 shadow-xs'
            }`}
            title={
              unreadCount > 0
                ? `${unreadCount} pemberitahuan belum dibaca${
                    hasNewDocsFromMKOorOwner ? ` (${unreadDocCount} dokumen baru dari MK / Owner)` : ''
                  }`
                : 'Pemberitahuan & Alert'
            }
          >
            <Bell
              className={`w-4 h-4 transition-transform ${
                hasNewDocsFromMKOorOwner
                  ? 'text-sky-600 dark:text-sky-400 animate-[wiggle_1s_ease-in-out_infinite]'
                  : unreadCount > 0
                  ? 'text-sky-600 dark:text-sky-400'
                  : ''
              }`}
            />
            {unreadCount > 0 && (
              <>
                {/* Pulsing ring halo if there are new documents from MK or Owner */}
                {hasNewDocsFromMKOorOwner && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500/60 animate-ping pointer-events-none" />
                )}
                <span
                  className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center border shadow-xs transition-transform ${
                    hasNewDocsFromMKOorOwner
                      ? 'bg-gradient-to-tr from-rose-500 to-red-600 text-white border-white dark:border-slate-900 animate-bounce'
                      : 'bg-sky-600 text-white border-white dark:border-slate-900'
                  }`}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-xl transition-colors border ${
              darkMode
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-white hover:bg-sky-50 text-slate-700 border-sky-200 shadow-xs'
            }`}
            title={darkMode ? 'Switch to Light/Gradient Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-700" />}
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ml-1 border ${
                darkMode
                  ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-xs'
              }`}
              title="Keluar dari sesi peran akun saat ini"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
