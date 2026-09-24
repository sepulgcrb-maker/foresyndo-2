import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  LineChart,
  BarChart3,
  ClipboardList,
  Camera,
  CreditCard,
  Boxes,
  Users,
  Truck,
  FileSpreadsheet,
  AlertTriangle,
  ShieldCheck,
  Settings,
  Calendar,
  UserCheck,
  Lock,
  KeyRound,
  Files,
  LogOut,
  HardHat,
  QrCode,
  Wallet,
  Building2,
} from 'lucide-react';
import { ActiveTab, UserRole } from '../../types';

export type { ActiveTab };

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  hasDeviasiWarning?: boolean;
  onOpenSettingsModal?: () => void;
  onOpenContractorModal?: () => void;
  onOpenRoleModal?: (subTab?: 'profiles' | 'permissions' | 'matrix' | 'workflow' | 'pins') => void;
  activeUserName?: string;
  projectName?: string;
  allowedTabs?: ActiveTab[];
  currentRole?: UserRole;
  onLogout?: () => void;
  darkMode?: boolean;
  unreadDocCount?: number;
  onOpenQrModal?: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  hasAlert?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  hasDeviasiWarning = false,
  onOpenSettingsModal,
  onOpenContractorModal,
  onOpenRoleModal,
  activeUserName = 'Site Manager',
  projectName = 'FORESYNDO 2',
  allowedTabs,
  currentRole = 'Kontraktor',
  onLogout,
  darkMode = false,
  unreadDocCount = 0,
  onOpenQrModal,
}) => {
  const isOwner = currentRole === 'Owner' || currentRole === 'Direktur';
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'schedule', label: 'Time Schedule', icon: CalendarDays },
    { id: 'calendar', label: 'Kalender Proyek', icon: Calendar },
    { id: 'scurve', label: 'Grafik Progress (Kurva S)', icon: LineChart, hasAlert: hasDeviasiWarning },
    { id: 'gantt', label: 'Gantt Chart', icon: BarChart3 },
    { id: 'daily', label: 'Monitoring Harian', icon: ClipboardList },
    { id: 'photos', label: 'Dokumentasi Foto', icon: Camera },
    { id: 'termin', label: 'Pembayaran Termin', icon: CreditCard },
    { id: 'contractor-finance', label: 'Keuangan Proyek', icon: Wallet },
    { id: 'suppliers', label: 'Rekanan Supplier & PO', icon: Building2 },
    { id: 'materials', label: 'Monitoring Material', icon: Boxes },
    { id: 'workforce', label: 'Tenaga Kerja', icon: Users },
    { id: 'equipment', label: 'Monitoring Alat', icon: Truck },
    { id: 'documents', label: 'Dokumen & Gambar', icon: Files },
    { id: 'inspection', label: 'Inspeksi & BAST Akhir', icon: ShieldCheck },
    { id: 'reports', label: 'Pusat Laporan (PDF/Excel)', icon: FileSpreadsheet },
  ];

  return (
    <nav
      className={`w-full md:w-64 border-r p-4 shrink-0 flex flex-col justify-between overflow-x-auto md:overflow-x-visible space-y-4 scrollbar-none transition-colors duration-200 ${
        darkMode
          ? 'bg-[#0F172A] border-slate-800 text-slate-300'
          : 'bg-gradient-to-b from-white/95 via-sky-50/70 to-blue-50/90 border-sky-200/80 text-slate-700 shadow-sm shadow-sky-500/5'
      }`}
    >
      <div className="space-y-4">
        {/* Brand Header */}
        <div
          className={`px-2 py-2 flex items-center gap-3 border-b pb-4 ${
            darkMode ? 'border-slate-800/80' : 'border-sky-200/80'
          }`}
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-sky-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-md shadow-sky-500/25 shrink-0">
            F
          </div>
          <div className="overflow-hidden">
            <h1
              className={`font-bold text-sm tracking-tight uppercase truncate ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              FORESYNDO 2
            </h1>
            <p className={`text-[10px] truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Construction Monitoring
            </p>
          </div>
        </div>

        <div
          className={`hidden md:block px-2 text-[10px] font-bold uppercase tracking-wider ${
            darkMode ? 'text-slate-400' : 'text-sky-800'
          }`}
        >
          Menu Utama Proyek
        </div>

        <div className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const isRestricted = allowedTabs && !allowedTabs.includes(item.id);

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id as ActiveTab)}
                title={isRestricted ? `${item.label} (Akses dibatasi oleh Owner)` : item.label}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold shadow-md shadow-sky-500/25'
                    : isRestricted
                    ? darkMode
                      ? 'text-slate-500 hover:text-slate-400 hover:bg-slate-800/30 opacity-70'
                      : 'text-slate-400 hover:text-slate-500 hover:bg-sky-50/50 opacity-60'
                    : darkMode
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-sky-100/70'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? 'text-white'
                      : isRestricted
                      ? 'text-slate-400'
                      : darkMode
                      ? 'text-slate-400'
                      : 'text-sky-600'
                  }`}
                />
                <span className="truncate">{item.label}</span>
                {item.id === 'documents' && unreadDocCount > 0 && (
                  <span
                    className={`ml-auto px-1.5 py-0.2 rounded-full text-[10px] font-black shrink-0 ${
                      isActive
                        ? 'bg-white text-sky-700'
                        : 'bg-rose-500 text-white shadow-xs animate-pulse'
                    }`}
                    title={`${unreadDocCount} dokumen baru dari MK / Owner`}
                  >
                    {unreadDocCount}
                  </span>
                )}
                {isRestricted && (
                  <Lock className="ml-auto w-3 h-3 text-amber-500/80 shrink-0" />
                )}
                {item.hasAlert && !isActive && !isRestricted && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
                {item.hasAlert && isActive && (
                  <AlertTriangle className="ml-auto w-3.5 h-3.5 text-amber-200" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Footer / Settings Trigger */}
      <div
        className={`hidden md:block p-3 rounded-xl border transition-all ${
          darkMode
            ? 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800/80'
            : 'bg-white/90 border-sky-200/80 hover:border-sky-300 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500/20 to-blue-500/20 border border-sky-400/30 text-sky-600 flex items-center justify-center font-bold text-xs shrink-0">
              FGI
            </div>
            <div className="overflow-hidden text-left">
              <p
                className={`text-xs font-bold truncate ${
                  darkMode ? 'text-slate-200' : 'text-slate-900'
                }`}
              >
                {activeUserName}
              </p>
              <p
                className={`text-[10px] truncate ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {projectName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isOwner && onOpenRoleModal && (
              <>
                <button
                  onClick={() => onOpenRoleModal('pins')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer border ${
                    darkMode
                      ? 'bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border-transparent'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 shadow-xs'
                  }`}
                  title="Atur PIN Keamanan Peran (Wewenang Owner)"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                </button>
                <button
                  onClick={() => onOpenRoleModal('profiles')}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer border ${
                    darkMode
                      ? 'bg-indigo-500/20 hover:bg-indigo-500 hover:text-white text-indigo-300 border-transparent'
                      : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 shadow-xs'
                  }`}
                  title="Manajemen Role Tiga Pihak (Owner, Konsultan, Kontraktor)"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                </button>
              </>
            )}
            {onOpenContractorModal && (
              <button
                onClick={onOpenContractorModal}
                className={`p-1.5 rounded-lg transition-all cursor-pointer border ${
                  darkMode
                    ? 'bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border-transparent'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 shadow-xs'
                }`}
                title="Pengaturan Profil & Legalitas Kontraktor (NPWP, NIB, Manajemen, Logo)"
              >
                <HardHat className="w-3.5 h-3.5 text-amber-600" />
              </button>
            )}
            {onOpenQrModal && (
              <button
                onClick={onOpenQrModal}
                className={`p-1.5 rounded-lg transition-all cursor-pointer border ${
                  darkMode
                    ? 'bg-indigo-500/20 hover:bg-indigo-500 hover:text-white text-indigo-300 border-transparent'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 shadow-xs'
                }`}
                title="QR Code Verifikasi Lapangan & Akses Cepat"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
              </button>
            )}
            {onOpenSettingsModal && (
              <button
                onClick={onOpenSettingsModal}
                className={`p-1.5 rounded-lg transition-all cursor-pointer border ${
                  darkMode
                    ? 'bg-slate-700/60 hover:bg-orange-500 hover:text-white text-slate-300 border-transparent'
                    : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200 shadow-xs'
                }`}
                title="Pengaturan Nama & Identitas Proyek"
              >
                <Settings className="w-3.5 h-3.5 text-sky-600" />
              </button>
            )}
            {onLogout && (
              <button
                onClick={onLogout}
                className={`p-1.5 rounded-lg transition-all cursor-pointer border ${
                  darkMode
                    ? 'bg-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-300 border-transparent'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-xs'
                }`}
                title="Keluar dari Sesi Akun (Logout)"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
