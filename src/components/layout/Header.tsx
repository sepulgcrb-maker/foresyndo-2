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
} from 'lucide-react';
import { ProjectInfo, UserRole, NotificationItem } from '../../types';
import { RoleBadge } from '../common/RoleBadge';
import { isSupabaseConnected } from '../../lib/supabase';

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
  onOpenRoleModal?: (subTab?: 'profiles' | 'permissions' | 'matrix' | 'workflow' | 'pins') => void;
  activeUserName?: string;
  onLogout?: () => void;
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
  onOpenRoleModal,
  activeUserName,
  onLogout,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const connected = isSupabaseConnected();

  const isOwner = currentRole === 'Owner' || currentRole === 'Direktur';
  const isKontraktor = currentRole === 'Kontraktor' || currentRole === 'Site Manager';

  // For Owner, allow switching between primary roles
  const primaryRoles: UserRole[] = ['Owner', 'Konsultan', 'Kontraktor'];
  const otherRoles: UserRole[] = ['Admin', 'Viewer'];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0F172A] border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand & Project Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                {project.name}
                <span
                  className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    project.status === 'Belum Mulai' || project.status === 'Perencanaan'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : project.status === 'Berjalan'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                  }`}
                >
                  <Activity className="w-3 h-3 animate-pulse" /> {project.status.toUpperCase()}
                </span>
              </h1>
              {onOpenSettingsModal && (
                <button
                  onClick={onOpenSettingsModal}
                  className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-orange-400 transition-colors"
                  title="Ubah Nama & Identitas Proyek"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Pengaturan Nama & Identitas Proyek"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ubah Nama</span>
            </button>
          )}

          {/* Role Management 3 Pihak Button - ONLY visible to Owner */}
          {isOwner && onOpenRoleModal && (
            <button
              onClick={onOpenRoleModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Kelola Role & Wewenang Tiga Pihak (Owner, Konsultan, Kontraktor)"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Role 3 Pihak</span>
            </button>
          )}

          {/* Supabase Status Pill */}
          <button
            onClick={onOpenSupabaseModal}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors"
            title="Klik untuk konfigurasi Supabase Realtime"
          >
            <Database className={`w-3.5 h-3.5 ${connected ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className="font-semibold">{connected ? 'Supabase' : 'Local Store'}</span>
          </button>

          {/* Quick Export Button */}
          <button
            onClick={onQuickExport}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" /> Export Laporan
          </button>

          {/* Reset Project Button - Only for Owner */}
          {isOwner && onResetProject && (
            <button
              onClick={onResetProject}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              title="Reset data proyek ke kondisi Belum Mulai (0% Progress)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Reset Belum Mulai
            </button>
          )}

          {/* Role Display / Switcher */}
          {isKontraktor ? (
            /* KONTRAKTOR: STRICTLY CANNOT SEE OWNER & MK ROLES */
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-semibold text-amber-300 shadow-sm"
              title="Peran Aktif: Kontraktor Pelaksana Lapangan"
            >
              <HardHat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate max-w-[130px] sm:max-w-[200px]">{activeUserName || 'Kontraktor Pelaksana'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Sesi Terverifikasi" />
            </div>
          ) : isOwner ? (
            /* OWNER: Can switch between roles & configure permissions */
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all text-xs font-medium cursor-pointer">
                <UserCheck className="w-3.5 h-3.5 text-orange-400" />
                <RoleBadge role={currentRole} showIcon={false} />
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
              <div className="absolute right-0 mt-2 w-64 py-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
                <div className="px-3 py-1.5 text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                  Tiga Pihak Proyek (Utama)
                </div>
                {primaryRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => onRoleChange(r)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                      currentRole === r ? 'text-orange-400 font-bold bg-slate-800/50' : 'text-slate-300'
                    }`}
                  >
                    <RoleBadge role={r} />
                    {currentRole === r && <span className="text-[10px] text-orange-400 font-bold">&bull; Aktif</span>}
                  </button>
                ))}

                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1 border-t border-slate-800 pt-2">
                  Simulasi Lainnya
                </div>
                {otherRoles.map((r) => (
                  <button
                    key={r}
                    onClick={() => onRoleChange(r)}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                      currentRole === r ? 'text-orange-400 font-bold bg-slate-800/50' : 'text-slate-400'
                    }`}
                  >
                    <RoleBadge role={r} />
                    {currentRole === r && <span className="text-[10px] text-orange-400 font-bold">&bull; Aktif</span>}
                  </button>
                ))}

                {onOpenRoleModal && (
                  <div className="px-2 pt-2 mt-1 border-t border-slate-800 space-y-1">
                    <button
                      onClick={() => onOpenRoleModal('pins')}
                      className="w-full text-left px-3 py-1.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-orange-400" />
                      <span>Atur PIN Keamanan (Owner)</span>
                    </button>

                    <button
                      onClick={() => onOpenRoleModal('permissions')}
                      className="w-full text-left px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Atur Hak Akses Role (Owner)</span>
                    </button>

                    <button
                      onClick={() => onOpenRoleModal('profiles')}
                      className="w-full text-left px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Kelola Profil & RACI</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* KONSULTAN / VIEWER: Fixed profile badge */
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-xs font-semibold text-blue-300 shadow-sm"
              title={`Peran Aktif: ${currentRole}`}
            >
              <RoleBadge role={currentRole} showIcon={false} />
              <span className="truncate max-w-[120px] sm:max-w-[180px]">{activeUserName}</span>
            </div>
          )}

          {/* Notifications Trigger */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Pemberitahuan & Alert"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all shadow-sm cursor-pointer ml-1"
              title="Keluar dari sesi peran akun saat ini"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
