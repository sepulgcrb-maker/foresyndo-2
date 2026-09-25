import React, { useState, useMemo } from 'react';
import {
  FileText,
  Wallet,
  TrendingUp,
  Activity,
  Calendar,
  Clock,
  Camera,
  Package,
  HardHat,
  ShieldCheck,
  Users,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  Filter,
  Sparkles,
  Layers,
  History,
  FileCheck2,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { AuditLog, UserRole } from '../../types';
import { ActiveTab } from '../layout/Sidebar';

export type ActivityCategory =
  | 'all'
  | 'document'
  | 'payment'
  | 'progress'
  | 'dailylog'
  | 'photo'
  | 'material'
  | 'worker'
  | 'system';

interface ProjectActivityTimelineProps {
  auditLogs: AuditLog[];
  darkMode?: boolean;
  onNavigateTab?: (tab: ActiveTab) => void;
  className?: string;
  initialLimit?: number;
}

interface ActivityMeta {
  category: ActivityCategory;
  categoryLabel: string;
  icon: React.ElementType;
  iconBgLight: string;
  iconBgDark: string;
  iconColorLight: string;
  iconColorDark: string;
  borderColorLight: string;
  borderColorDark: string;
  badgeBgLight: string;
  badgeBgDark: string;
  badgeTextLight: string;
  badgeTextDark: string;
  navTarget?: ActiveTab;
  navLabel?: string;
}

/**
 * Resolves activity category, icon, color scheme, and direct navigation target
 * based on the action and details string.
 */
function resolveActivityMeta(action: string, details: string): ActivityMeta {
  const text = `${action} ${details}`.toLowerCase();

  // 1. Upload & Manajemen Dokumen
  if (
    text.includes('dokumen') ||
    text.includes('upload') ||
    text.includes('unggah') ||
    text.includes('gambar kerja') ||
    text.includes('addendum') ||
    text.includes('instruksi') ||
    text.includes('rab') ||
    text.includes('kontrak')
  ) {
    return {
      category: 'document',
      categoryLabel: 'Upload Dokumen & Kontrak',
      icon: FileText,
      iconBgLight: 'bg-blue-100',
      iconBgDark: 'bg-blue-950/60',
      iconColorLight: 'text-blue-600',
      iconColorDark: 'text-blue-400',
      borderColorLight: 'border-blue-200',
      borderColorDark: 'border-blue-800/60',
      badgeBgLight: 'bg-blue-50',
      badgeBgDark: 'bg-blue-900/40',
      badgeTextLight: 'text-blue-700',
      badgeTextDark: 'text-blue-300',
      navTarget: 'documents',
      navLabel: 'Lihat Arsip Dokumen',
    };
  }

  // 2. Pencairan & Status Termin Keuangan
  if (
    text.includes('termin') ||
    text.includes('pencairan') ||
    text.includes('invoice') ||
    text.includes('bap') ||
    text.includes('retensi') ||
    text.includes('pembayaran') ||
    text.includes('cash flow') ||
    text.includes('keuangan')
  ) {
    return {
      category: 'payment',
      categoryLabel: 'Pencairan Termin & Keuangan',
      icon: Wallet,
      iconBgLight: 'bg-emerald-100',
      iconBgDark: 'bg-emerald-950/60',
      iconColorLight: 'text-emerald-600',
      iconColorDark: 'text-emerald-400',
      borderColorLight: 'border-emerald-200',
      borderColorDark: 'border-emerald-800/60',
      badgeBgLight: 'bg-emerald-50',
      badgeBgDark: 'bg-emerald-900/40',
      badgeTextLight: 'text-emerald-700',
      badgeTextDark: 'text-emerald-300',
      navTarget: 'termin',
      navLabel: 'Buka Manajemen Termin',
    };
  }

  // 3. Update Progress & Time Schedule
  if (
    text.includes('progress') ||
    text.includes('schedule') ||
    text.includes('pekerjaan') ||
    text.includes('bobot') ||
    text.includes('time schedule') ||
    text.includes('kurva s') ||
    text.includes('milestone') ||
    text.includes('re-order') ||
    text.includes('tambah pekerjaan') ||
    text.includes('hapus pekerjaan')
  ) {
    return {
      category: 'progress',
      categoryLabel: 'Update Progress Fisik',
      icon: TrendingUp,
      iconBgLight: 'bg-amber-100',
      iconBgDark: 'bg-amber-950/60',
      iconColorLight: 'text-amber-600',
      iconColorDark: 'text-amber-400',
      borderColorLight: 'border-amber-200',
      borderColorDark: 'border-amber-800/60',
      badgeBgLight: 'bg-amber-50',
      badgeBgDark: 'bg-amber-900/40',
      badgeTextLight: 'text-amber-700',
      badgeTextDark: 'text-amber-300',
      navTarget: 'schedule',
      navLabel: 'Buka Time Schedule',
    };
  }

  // 4. Laporan Harian Proyek
  if (
    text.includes('laporan harian') ||
    text.includes('daily log') ||
    text.includes('kegiatan harian') ||
    text.includes('cuaca')
  ) {
    return {
      category: 'dailylog',
      categoryLabel: 'Laporan Harian Lapangan',
      icon: Calendar,
      iconBgLight: 'bg-cyan-100',
      iconBgDark: 'bg-cyan-950/60',
      iconColorLight: 'text-cyan-600',
      iconColorDark: 'text-cyan-400',
      borderColorLight: 'border-cyan-200',
      borderColorDark: 'border-cyan-800/60',
      badgeBgLight: 'bg-cyan-50',
      badgeBgDark: 'bg-cyan-900/40',
      badgeTextLight: 'text-cyan-700',
      badgeTextDark: 'text-cyan-300',
      navTarget: 'daily',
      navLabel: 'Lihat Laporan Harian',
    };
  }

  // 5. Upload Dokumentasi Foto
  if (
    text.includes('foto') ||
    text.includes('dokumentasi') ||
    text.includes('visual') ||
    text.includes('gambar')
  ) {
    return {
      category: 'photo',
      categoryLabel: 'Dokumentasi Visual Lapangan',
      icon: Camera,
      iconBgLight: 'bg-purple-100',
      iconBgDark: 'bg-purple-950/60',
      iconColorLight: 'text-purple-600',
      iconColorDark: 'text-purple-400',
      borderColorLight: 'border-purple-200',
      borderColorDark: 'border-purple-800/60',
      badgeBgLight: 'bg-purple-50',
      badgeBgDark: 'bg-purple-900/40',
      badgeTextLight: 'text-purple-700',
      badgeTextDark: 'text-purple-300',
      navTarget: 'photos',
      navLabel: 'Buka Galeri Foto',
    };
  }

  // 6. Logistik & Material
  if (
    text.includes('material') ||
    text.includes('stok') ||
    text.includes('supplier') ||
    text.includes('semen') ||
    text.includes('besi') ||
    text.includes('batu')
  ) {
    return {
      category: 'material',
      categoryLabel: 'Logistik Material Proyek',
      icon: Package,
      iconBgLight: 'bg-teal-100',
      iconBgDark: 'bg-teal-950/60',
      iconColorLight: 'text-teal-600',
      iconColorDark: 'text-teal-400',
      borderColorLight: 'border-teal-200',
      borderColorDark: 'border-teal-800/60',
      badgeBgLight: 'bg-teal-50',
      badgeBgDark: 'bg-teal-900/40',
      badgeTextLight: 'text-teal-700',
      badgeTextDark: 'text-teal-300',
      navTarget: 'materials',
      navLabel: 'Kelola Stok Material',
    };
  }

  // 7. Tenaga Kerja & Alokasi
  if (
    text.includes('pekerja') ||
    text.includes('tenaga kerja') ||
    text.includes('mandor') ||
    text.includes('alokasi') ||
    text.includes('tukang')
  ) {
    return {
      category: 'worker',
      categoryLabel: 'Alokasi Tenaga Kerja',
      icon: HardHat,
      iconBgLight: 'bg-orange-100',
      iconBgDark: 'bg-orange-950/60',
      iconColorLight: 'text-orange-600',
      iconColorDark: 'text-orange-400',
      borderColorLight: 'border-orange-200',
      borderColorDark: 'border-orange-800/60',
      badgeBgLight: 'bg-orange-50',
      badgeBgDark: 'bg-orange-900/40',
      badgeTextLight: 'text-orange-700',
      badgeTextDark: 'text-orange-300',
      navTarget: 'workforce',
      navLabel: 'Lihat Data Pekerja',
    };
  }

  // 8. Sistem, Sesi & Keamanan Akun
  return {
    category: 'system',
    categoryLabel: 'Aktivitas Sistem & Akun',
    icon: ShieldCheck,
    iconBgLight: 'bg-slate-100',
    iconBgDark: 'bg-slate-800',
    iconColorLight: 'text-slate-600',
    iconColorDark: 'text-slate-400',
    borderColorLight: 'border-slate-200',
    borderColorDark: 'border-slate-700',
    badgeBgLight: 'bg-slate-100',
    badgeBgDark: 'bg-slate-800',
    badgeTextLight: 'text-slate-700',
    badgeTextDark: 'text-slate-300',
  };
}

/**
 * Format relative time or clean date string
 */
function formatActivityTime(timestamp: string): { relative: string; full: string } {
  if (!timestamp) return { relative: 'Baru saja', full: '-' };

  const parsed = new Date(timestamp.replace(' ', 'T'));
  if (isNaN(parsed.getTime())) {
    return { relative: timestamp, full: timestamp };
  }

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - parsed.getTime()) / 1000);

  let relative = '';
  if (diffSec < 60) {
    relative = 'Baru saja';
  } else if (diffSec < 3600) {
    relative = `${Math.floor(diffSec / 60)} mnt lalu`;
  } else if (diffSec < 86400) {
    relative = `${Math.floor(diffSec / 3600)} jam lalu`;
  } else if (diffSec < 86400 * 7) {
    relative = `${Math.floor(diffSec / 86400)} hari lalu`;
  } else {
    relative = parsed.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const full = parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';

  return { relative, full };
}

/**
 * Helper to render role badge styling
 */
function renderRoleBadge(role: UserRole | string, darkMode: boolean) {
  const r = (role || '').toLowerCase();
  if (r.includes('owner') || r.includes('direktur')) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
        Owner
      </span>
    );
  }
  if (r.includes('konsultan') || r.includes('mk')) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Konsultan MK
      </span>
    );
  }
  if (r.includes('kontraktor') || r.includes('site manager') || r.includes('pelaksana')) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Kontraktor
      </span>
    );
  }
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
      {role || 'Sistem'}
    </span>
  );
}

export const ProjectActivityTimeline: React.FC<ProjectActivityTimelineProps> = ({
  auditLogs = [],
  darkMode = false,
  onNavigateTab,
  className = '',
  initialLimit = 6,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);

  // Categorize and filter activities
  const filteredActivities = useMemo(() => {
    return auditLogs.filter((log) => {
      const meta = resolveActivityMeta(log.action, log.details);

      // Category filter
      if (selectedCategory !== 'all' && meta.category !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchAction = log.action.toLowerCase().includes(query);
        const matchDetails = log.details.toLowerCase().includes(query);
        const matchUser = log.userName.toLowerCase().includes(query);
        const matchRole = (log.userRole || '').toLowerCase().includes(query);
        if (!matchAction && !matchDetails && !matchUser && !matchRole) {
          return false;
        }
      }

      return true;
    });
  }, [auditLogs, selectedCategory, searchQuery]);

  // Statistics for header badges
  const categoryCounts = useMemo(() => {
    const counts: Record<ActivityCategory, number> = {
      all: auditLogs.length,
      document: 0,
      payment: 0,
      progress: 0,
      dailylog: 0,
      photo: 0,
      material: 0,
      worker: 0,
      system: 0,
    };

    auditLogs.forEach((log) => {
      const meta = resolveActivityMeta(log.action, log.details);
      counts[meta.category] = (counts[meta.category] || 0) + 1;
    });

    return counts;
  }, [auditLogs]);

  const displayedActivities = showAll
    ? filteredActivities
    : filteredActivities.slice(0, initialLimit);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div
      className={`rounded-3xl border transition-all duration-200 overflow-hidden shadow-sm ${
        darkMode
          ? 'bg-slate-900/90 border-slate-800 text-slate-100'
          : 'bg-white border-slate-200/90 text-slate-800'
      } ${className}`}
    >
      {/* 1. Header Section */}
      <div className="p-5 sm:p-6 border-b dark:border-slate-800/80 border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Project Activity Timeline
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  {auditLogs.length} Aktivitas
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kronologi audit trail resmi &amp; rekam jejak aksi tiga pihak proyek secara visual
              </p>
            </div>
          </div>

          {/* Quick Info & Verification Badge */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Audit Trail Terauntentikasi</span>
            </div>
          </div>
        </div>

        {/* 2. Filter Pills & Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 md:pb-0 scrollbar-none text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Semua ({categoryCounts.all})
            </button>

            <button
              onClick={() => setSelectedCategory('document')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'document'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-900/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Dokumen ({categoryCounts.document})</span>
            </button>

            <button
              onClick={() => setSelectedCategory('payment')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'payment'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-900/50'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Termin ({categoryCounts.payment})</span>
            </button>

            <button
              onClick={() => setSelectedCategory('progress')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'progress'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-900/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Progress ({categoryCounts.progress})</span>
            </button>

            <button
              onClick={() => setSelectedCategory('dailylog')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'dailylog'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 border border-cyan-200 dark:border-cyan-900/50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Harian ({categoryCounts.dailylog})</span>
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative min-w-[200px] shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari aktivitas / aksi..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
        </div>
      </div>

      {/* 3. Timeline Body */}
      <div className="p-5 sm:p-6">
        {displayedActivities.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Tidak ada aktivitas yang sesuai
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {searchQuery
                  ? `Tidak ditemukan aktivitas dengan kata kunci "${searchQuery}"`
                  : 'Belum ada riwayat tercatat pada kategori ini.'}
              </p>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-orange-500 hover:underline cursor-pointer"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="relative pl-6 sm:pl-8 space-y-6">
            {/* Continuous Vertical Timeline Line */}
            <div className="absolute left-[15px] sm:left-[19px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-orange-400 via-slate-300 to-transparent dark:from-orange-500 dark:via-slate-700 dark:to-transparent" />

            {displayedActivities.map((log, index) => {
              const meta = resolveActivityMeta(log.action, log.details);
              const IconComponent = meta.icon;
              const time = formatActivityTime(log.timestamp);
              const isExpanded = !!expandedItems[log.id];
              const isFirst = index === 0;

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Node Anchor Icon */}
                  <div
                    className={`absolute -left-[31px] sm:-left-[39px] top-1 w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-200 shadow-sm shrink-0 z-10 ${
                      darkMode
                        ? `${meta.iconBgDark} ${meta.iconColorDark} ${meta.borderColorDark} border-slate-900`
                        : `${meta.iconBgLight} ${meta.iconColorLight} ${meta.borderColorLight} border-white`
                    } ${isFirst ? 'ring-4 ring-orange-500/20 scale-105' : 'group-hover:scale-110'}`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  {/* Activity Card */}
                  <div
                    className={`p-4 rounded-2xl border transition-all duration-200 ${
                      darkMode
                        ? 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/50'
                    }`}
                  >
                    {/* Top Row: Meta Badge, Action Name & Time */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            darkMode
                              ? `${meta.badgeBgDark} ${meta.badgeTextDark} ${meta.borderColorDark}`
                              : `${meta.badgeBgLight} ${meta.badgeTextLight} ${meta.borderColorLight}`
                          }`}
                        >
                          {meta.categoryLabel}
                        </span>

                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {log.action}
                        </span>
                      </div>

                      {/* Relative & Full Timestamp */}
                      <div
                        className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0"
                        title={time.full}
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{time.relative}</span>
                        <span className="hidden md:inline text-[10px] text-slate-400">
                          ({log.timestamp})
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Actor (User & Role) */}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t dark:border-slate-800/60 border-slate-200/60 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Dilakukan oleh:</span>
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {log.userName || 'Sistem'}
                      </strong>
                      {renderRoleBadge(log.userRole, darkMode)}
                    </div>

                    {/* Description Details Box */}
                    <div className="mt-2.5">
                      <p
                        className={`text-xs text-slate-600 dark:text-slate-300 leading-relaxed ${
                          !isExpanded && log.details.length > 140 ? 'line-clamp-2' : ''
                        }`}
                      >
                        {log.details}
                      </p>

                      {log.details.length > 140 && (
                        <button
                          onClick={() => toggleExpand(log.id)}
                          className="mt-1 text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              Sembunyikan <ChevronUp className="w-3 h-3" />
                            </>
                          ) : (
                            <>
                              Lihat Selengkapnya <ChevronDown className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Optional Quick Navigation Action */}
                    {meta.navTarget && onNavigateTab && (
                      <div className="mt-3 pt-2.5 border-t dark:border-slate-800/60 border-slate-200/60 flex items-center justify-end">
                        <button
                          onClick={() => onNavigateTab(meta.navTarget!)}
                          className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <span>{meta.navLabel || 'Lihat Detail Terkait'}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Footer Show All / Collapse Toggle */}
        {filteredActivities.length > initialLimit && (
          <div className="mt-6 pt-4 border-t dark:border-slate-800 border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Menampilkan {displayedActivities.length} dari {filteredActivities.length} aktivitas
            </span>
            <button
              onClick={() => setShowAll(!showAll)}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              {showAll ? (
                <>
                  <span>Tampilkan Ringkas ({initialLimit})</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Lihat Semua Aktivitas ({filteredActivities.length})</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
