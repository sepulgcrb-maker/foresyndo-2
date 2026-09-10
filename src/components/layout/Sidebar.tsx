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
} from 'lucide-react';
import { ActiveTab } from '../../types';

export type { ActiveTab };

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  hasDeviasiWarning?: boolean;
  onOpenSettingsModal?: () => void;
  onOpenRoleModal?: () => void;
  activeUserName?: string;
  projectName?: string;
  allowedTabs?: ActiveTab[];
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
  onOpenRoleModal,
  activeUserName = 'Site Manager',
  projectName = 'FORESYNDO 2',
  allowedTabs,
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'schedule', label: 'Time Schedule', icon: CalendarDays },
    { id: 'calendar', label: 'Kalender Proyek', icon: Calendar },
    { id: 'scurve', label: 'Grafik Progress (Kurva S)', icon: LineChart, hasAlert: hasDeviasiWarning },
    { id: 'gantt', label: 'Gantt Chart', icon: BarChart3 },
    { id: 'daily', label: 'Monitoring Harian', icon: ClipboardList },
    { id: 'photos', label: 'Dokumentasi Foto', icon: Camera },
    { id: 'termin', label: 'Pembayaran Termin', icon: CreditCard },
    { id: 'materials', label: 'Monitoring Material', icon: Boxes },
    { id: 'workforce', label: 'Tenaga Kerja', icon: Users },
    { id: 'equipment', label: 'Monitoring Alat', icon: Truck },
    { id: 'inspection', label: 'Inspeksi & BAST Akhir', icon: ShieldCheck },
    { id: 'reports', label: 'Pusat Laporan (PDF/Excel)', icon: FileSpreadsheet },
  ];

  return (
    <nav className="w-full md:w-64 bg-[#0F172A] border-r border-slate-800 text-slate-300 p-4 shrink-0 flex flex-col justify-between overflow-x-auto md:overflow-x-visible space-y-4 scrollbar-none">
      <div className="space-y-4">
        {/* Brand Header */}
        <div className="px-2 py-2 flex items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-xl text-white shadow-md shadow-orange-500/20 shrink-0">
            F
          </div>
          <div className="overflow-hidden">
            <h1 className="font-bold text-sm tracking-tight text-white uppercase truncate">FORESYNDO 2</h1>
            <p className="text-[10px] text-slate-400 truncate">Construction Monitoring</p>
          </div>
        </div>

        <div className="hidden md:block px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                    ? 'bg-orange-500 text-white font-bold shadow-md shadow-orange-500/20'
                    : isRestricted
                    ? 'text-slate-500 hover:text-slate-400 hover:bg-slate-800/30 opacity-70'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : isRestricted ? 'text-slate-500' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
                {isRestricted && (
                  <Lock className="ml-auto w-3 h-3 text-amber-400/80 shrink-0" />
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
      <div className="hidden md:block p-3 rounded-xl bg-slate-800/40 border border-slate-800/80 hover:bg-slate-800/80 transition-all">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
              FGI
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-bold text-slate-200 truncate">{activeUserName}</p>
              <p className="text-[10px] text-slate-400 truncate">{projectName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onOpenRoleModal && (
              <button
                onClick={onOpenRoleModal}
                className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500 hover:text-white text-indigo-300 transition-all cursor-pointer"
                title="Manajemen Role Tiga Pihak (Owner, Konsultan, Kontraktor)"
              >
                <UserCheck className="w-3.5 h-3.5" />
              </button>
            )}
            {onOpenSettingsModal && (
              <button
                onClick={onOpenSettingsModal}
                className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-orange-500 hover:text-white text-slate-300 transition-all cursor-pointer"
                title="Pengaturan Nama & Identitas Proyek"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
