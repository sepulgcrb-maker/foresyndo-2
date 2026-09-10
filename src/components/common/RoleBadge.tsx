import React from 'react';
import { UserRole } from '../../types';
import { ShieldCheck, HardHat, FileText, Eye, Compass, Award, UserCheck } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showIcon = true }) => {
  const getBadgeStyle = () => {
    switch (role) {
      case 'Owner':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
          icon: Award,
          label: 'Owner / Pemberi Tugas',
        };
      case 'Konsultan':
        return {
          bg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
          icon: Compass,
          label: 'Konsultan Pengawas (MK)',
        };
      case 'Kontraktor':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          icon: HardHat,
          label: 'Kontraktor Pelaksana',
        };
      case 'Direktur':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
          icon: ShieldCheck,
          label: 'Direktur (Owner)',
        };
      case 'Site Manager':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          icon: HardHat,
          label: 'Site Manager (Kontraktor)',
        };
      case 'Admin':
        return {
          bg: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
          icon: FileText,
          label: 'Admin Keuangan & Stok',
        };
      case 'Viewer':
      default:
        return {
          bg: 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400 border-slate-500/30',
          icon: Eye,
          label: 'Viewer (Read-Only)',
        };
    }
  };

  const style = getBadgeStyle();
  const Icon = style.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg}`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      {style.label}
    </span>
  );
};
