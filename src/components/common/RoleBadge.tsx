import React from 'react';
import { UserRole } from '../../types';
import { ShieldCheck, HardHat, FileText, Eye } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showIcon = true }) => {
  const getBadgeStyle = () => {
    switch (role) {
      case 'Direktur':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
          icon: ShieldCheck,
          label: 'Direktur (Full Access)',
        };
      case 'Site Manager':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          icon: HardHat,
          label: 'Site Manager',
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
