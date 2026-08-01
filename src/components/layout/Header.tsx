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
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const connected = isSupabaseConnected();

  const roles: UserRole[] = ['Direktur', 'Site Manager', 'Admin', 'Viewer'];

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
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
              {project.owner} &bull; {project.location}
            </p>
          </div>
        </div>

        {/* Right: Actions, Role Selector & Notifications */}
        <div className="flex items-center gap-2 sm:gap-3">
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

          {/* Reset Project Button */}
          {onResetProject && (
            <button
              onClick={onResetProject}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              title="Reset data proyek ke kondisi Belum Mulai (0% Progress)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" /> Reset Belum Mulai
            </button>
          )}

          {/* Role Switcher Dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all text-xs font-medium">
              <UserCheck className="w-3.5 h-3.5 text-orange-400" />
              <RoleBadge role={currentRole} showIcon={false} />
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <div className="absolute right-0 mt-2 w-52 py-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Simulasi Hak Akses Role
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => onRoleChange(r)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    currentRole === r ? 'text-orange-400 font-bold bg-slate-800/50' : 'text-slate-300'
                  }`}
                >
                  <RoleBadge role={r} />
                  {currentRole === r && <span className="text-[10px] text-orange-400 font-bold">&bull; Aktif</span>}
                </button>
              ))}
            </div>
          </div>

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
        </div>
      </div>
    </header>
  );
};
