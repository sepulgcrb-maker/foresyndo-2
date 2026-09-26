import React, { useState, useMemo } from 'react';
import {
  WorkItem,
  WorkerAllocation,
  WorkerItem,
  UserRole,
} from '../../types';
import {
  Calendar,
  AlertTriangle,
  Users,
  Clock,
  TrendingUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Flame,
  Info,
  Layers,
  Plus,
  ShieldAlert,
  Sparkles,
  Target,
  X,
  HelpCircle,
} from 'lucide-react';
import { formatIDR } from '../../utils/calculations';

interface WorkforceHeatmapProps {
  workItems: WorkItem[];
  allocations: WorkerAllocation[];
  workers: WorkerItem[];
  userRole?: UserRole;
  canEdit?: boolean;
  onOpenAllocModal?: (preselectedWorkItemId?: string, preselectedDate?: string) => void;
  onViewWorkItemDetails?: (workItemId: string) => void;
}

export const WorkforceHeatmap: React.FC<WorkforceHeatmapProps> = ({
  workItems,
  allocations,
  workers,
  userRole,
  canEdit,
  onOpenAllocModal,
  onViewWorkItemDetails,
}) => {
  // Metric Mode: 'headcount' (Jumlah Pekerja) | 'hours' (Total Jam Kerja)
  const [metricMode, setMetricMode] = useState<'headcount' | 'hours'>('headcount');

  // Filter by category
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Filter only bottleneck work items
  const [showBottlenecksOnly, setShowBottlenecksOnly] = useState<boolean>(false);

  // Selected Cell for Detailed Drawer
  const [selectedCell, setSelectedCell] = useState<{
    workItemId: string;
    date: string;
  } | null>(null);

  // Time Window Offset in days (0 = last 30 days ending today, -30 = prev 30 days)
  const [dayOffset, setDayOffset] = useState<number>(0);

  // Reference "Today" date for the project (2026-09-26)
  const referenceDate = useMemo(() => {
    // Uses 2026-09-26 as the active project date
    const d = new Date(2026, 8, 26); // September 26, 2026
    return d;
  }, []);

  // Compute the 30 dates in the window
  const dateWindow = useMemo(() => {
    const dates: {
      dateStr: string;
      dayOfWeek: string;
      dayNum: string;
      monthStr: string;
      isWeekend: boolean;
      isToday: boolean;
    }[] = [];

    const daysCount = 30;
    const endDate = new Date(referenceDate);
    endDate.setDate(endDate.getDate() + dayOffset);

    // Days of week short Indonesian
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    for (let i = daysCount - 1; i >= 0; i--) {
      const cur = new Date(endDate);
      cur.setDate(cur.getDate() - i);

      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const dayOfWeekIdx = cur.getDay();
      const isWeekend = dayOfWeekIdx === 0 || dayOfWeekIdx === 6;

      const isToday =
        cur.getFullYear() === referenceDate.getFullYear() &&
        cur.getMonth() === referenceDate.getMonth() &&
        cur.getDate() === referenceDate.getDate();

      dates.push({
        dateStr,
        dayOfWeek: dayNames[dayOfWeekIdx],
        dayNum: String(cur.getDate()),
        monthStr: monthNames[cur.getMonth()],
        isWeekend,
        isToday,
      });
    }

    return dates;
  }, [referenceDate, dayOffset]);

  // Aggregate allocations into a map: `workItemId_dateStr` -> WorkerAllocation[]
  const allocationMap = useMemo(() => {
    const map = new Map<string, WorkerAllocation[]>();

    allocations.forEach((alloc) => {
      const key = `${alloc.workItemId}_${alloc.assignedDate}`;
      const existing = map.get(key) || [];
      existing.push(alloc);
      map.set(key, existing);
    });

    return map;
  }, [allocations]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    workItems.forEach((w) => {
      if (w.category) set.add(w.category);
    });
    return Array.from(set);
  }, [workItems]);

  // Analyze each work item for the 30-day window
  const workItemAnalytics = useMemo(() => {
    return workItems.map((item) => {
      let totalHeadcount = 0;
      let totalHours = 0;
      let activeDaysCount = 0;
      let peakDailyWorkers = 0;
      let peakDate = '';
      let overloadDaysCount = 0; // > 7 workers on one work item
      let deficitDaysCount = 0; // 0 workers while within scheduled window

      const dailyMetrics: Record<
        string,
        {
          workersCount: number;
          totalHours: number;
          allocations: WorkerAllocation[];
          isOverload: boolean;
          isDeficit: boolean;
        }
      > = {};

      dateWindow.forEach(({ dateStr }) => {
        const key = `${item.id}_${dateStr}`;
        const cellAllocs = allocationMap.get(key) || [];
        const workersCount = cellAllocs.length;
        const hours = cellAllocs.reduce((sum, a) => sum + (a.allocatedHours || 8), 0);

        totalHeadcount += workersCount;
        totalHours += hours;

        if (workersCount > 0) {
          activeDaysCount++;
          if (workersCount > peakDailyWorkers) {
            peakDailyWorkers = workersCount;
            peakDate = dateStr;
          }
        }

        // Overload bottleneck: > 7 workers concentrated on this sector
        const isOverload = workersCount >= 8;
        if (isOverload) overloadDaysCount++;

        // Deficit bottleneck: Scheduled to be active, but 0 workers assigned
        const isWithinSchedule =
          item.startDate &&
          item.endDate &&
          dateStr >= item.startDate &&
          dateStr <= item.endDate;
        const isDeficit = isWithinSchedule && workersCount === 0;
        if (isDeficit) deficitDaysCount++;

        dailyMetrics[dateStr] = {
          workersCount,
          totalHours: hours,
          allocations: cellAllocs,
          isOverload,
          isDeficit,
        };
      });

      // Overall bottleneck score / severity
      const hasBottlenecks = overloadDaysCount > 0 || deficitDaysCount > 5;
      const severity =
        overloadDaysCount >= 3 || deficitDaysCount >= 10
          ? 'critical'
          : overloadDaysCount > 0 || deficitDaysCount > 0
          ? 'warning'
          : 'optimal';

      return {
        item,
        totalHeadcount,
        totalHours,
        activeDaysCount,
        peakDailyWorkers,
        peakDate,
        overloadDaysCount,
        deficitDaysCount,
        hasBottlenecks,
        severity,
        dailyMetrics,
      };
    });
  }, [workItems, dateWindow, allocationMap]);

  // Filtered rows for the heatmap
  const filteredWorkItems = useMemo(() => {
    return workItemAnalytics.filter(({ item, hasBottlenecks }) => {
      const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchBottleneck = !showBottlenecksOnly || hasBottlenecks;
      return matchCat && matchBottleneck;
    });
  }, [workItemAnalytics, selectedCategory, showBottlenecksOnly]);

  // Daily totals across all work items (for bottom summary row)
  const dailyTotals = useMemo(() => {
    return dateWindow.map(({ dateStr }) => {
      let totalWorkers = 0;
      let totalHours = 0;

      workItemAnalytics.forEach(({ dailyMetrics }) => {
        const metric = dailyMetrics[dateStr];
        if (metric) {
          totalWorkers += metric.workersCount;
          totalHours += metric.totalHours;
        }
      });

      // Congestion threshold across site (e.g. > 35 workers)
      const isSiteOverload = totalWorkers >= 40;
      const isSiteLow = totalWorkers > 0 && totalWorkers < 10;

      return {
        dateStr,
        totalWorkers,
        totalHours,
        isSiteOverload,
        isSiteLow,
      };
    });
  }, [dateWindow, workItemAnalytics]);

  // Overall 30-day KPI Metrics
  const summaryMetrics = useMemo(() => {
    const totalManDays = workItemAnalytics.reduce((sum, w) => sum + w.totalHeadcount, 0);
    const totalManHours = workItemAnalytics.reduce((sum, w) => sum + w.totalHours, 0);

    const totalOverloadIncidents = workItemAnalytics.reduce((sum, w) => sum + w.overloadDaysCount, 0);
    const totalDeficitIncidents = workItemAnalytics.reduce((sum, w) => sum + w.deficitDaysCount, 0);

    // Find peak site day
    let peakSiteDay = { dateStr: '', workers: 0 };
    dailyTotals.forEach((d) => {
      if (d.totalWorkers > peakSiteDay.workers) {
        peakSiteDay = { dateStr: d.dateStr, workers: d.totalWorkers };
      }
    });

    const activeDaysCount = dailyTotals.filter((d) => d.totalWorkers > 0).length || 1;
    const avgDailyWorkers = Math.round(totalManDays / activeDaysCount);

    return {
      totalManDays,
      totalManHours,
      totalOverloadIncidents,
      totalDeficitIncidents,
      peakSiteDay,
      avgDailyWorkers,
    };
  }, [workItemAnalytics, dailyTotals]);

  // Color scale helper for cell
  const getCellColor = (value: number, isOverload: boolean, isDeficit: boolean) => {
    if (value === 0) {
      if (isDeficit) {
        // Red warning pattern for unscheduled deficit
        return 'bg-rose-500/10 dark:bg-rose-950/20 text-rose-500/60 border border-rose-500/20';
      }
      return 'bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800/60';
    }

    if (metricMode === 'headcount') {
      if (value >= 8) {
        // Critical Overload
        return 'bg-rose-600 text-white font-extrabold shadow-sm shadow-rose-600/30 border border-rose-500';
      }
      if (value >= 6) {
        // High density
        return 'bg-amber-500 text-slate-950 font-bold border border-amber-400';
      }
      if (value >= 3) {
        // Optimal balanced density
        return 'bg-emerald-500/30 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/40';
      }
      // Low minimal density (1-2)
      return 'bg-sky-500/20 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 font-medium border border-sky-500/30';
    } else {
      // Hours mode (8 hours = 1 worker)
      if (value >= 64) {
        return 'bg-rose-600 text-white font-extrabold shadow-sm shadow-rose-600/30 border border-rose-500';
      }
      if (value >= 48) {
        return 'bg-amber-500 text-slate-950 font-bold border border-amber-400';
      }
      if (value >= 24) {
        return 'bg-emerald-500/30 dark:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/40';
      }
      return 'bg-sky-500/20 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 font-medium border border-sky-500/30';
    }
  };

  // Selected cell data for modal
  const selectedCellData = useMemo(() => {
    if (!selectedCell) return null;
    const workItem = workItems.find((w) => w.id === selectedCell.workItemId);
    if (!workItem) return null;

    const key = `${selectedCell.workItemId}_${selectedCell.date}`;
    const cellAllocs = allocationMap.get(key) || [];
    const workersCount = cellAllocs.length;
    const hours = cellAllocs.reduce((sum, a) => sum + (a.allocatedHours || 8), 0);

    const isWithinSchedule =
      workItem.startDate &&
      workItem.endDate &&
      selectedCell.date >= workItem.startDate &&
      selectedCell.date <= workItem.endDate;

    const isOverload = workersCount >= 8;
    const isDeficit = isWithinSchedule && workersCount === 0;

    return {
      workItem,
      date: selectedCell.date,
      allocations: cellAllocs,
      workersCount,
      hours,
      isOverload,
      isDeficit,
      isWithinSchedule,
    };
  }, [selectedCell, workItems, allocationMap]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & METRIC CONTROLS */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center font-black">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Heatmap Kepadatan Tenaga Kerja (30 Hari)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                    BOTTLENECK ANALYZER
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visualisasi sebaran alokasi tukang &amp; mandor per item pekerjaan untuk mendeteksi penumpukan atau defisit tenaga kerja
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Metric Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setMetricMode('headcount')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  metricMode === 'headcount'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Jumlah Pekerja (HOK)
              </button>
              <button
                type="button"
                onClick={() => setMetricMode('hours')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  metricMode === 'hours'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Jam Kerja (Man-Hours)
              </button>
            </div>

            {/* Time Window Navigator */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setDayOffset((prev) => prev - 30)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                title="30 Hari Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setDayOffset(0)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  dayOffset === 0
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                30 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => setDayOffset((prev) => prev + 30)}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
                title="30 Hari Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {canEdit && onOpenAllocModal && (
              <button
                type="button"
                onClick={() => onOpenAllocModal()}
                className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Alokasikan Pekerja</span>
              </button>
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 2. ANALYTICS KPI STRIP */}
        {/* ======================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-1">
          {/* Total Man-Days */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              Total Alokasi 30 Hari
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
                {metricMode === 'headcount' ? summaryMetrics.totalManDays : summaryMetrics.totalManHours}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {metricMode === 'headcount' ? 'Hari-Orang (HOK)' : 'Jam Kerja'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              Rata-rata {summaryMetrics.avgDailyWorkers} pekerja/hari di seluruh site
            </div>
          </div>

          {/* Peak Density Day */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
              Puncak Kepadatan Lapangan
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-500 font-mono tabular-nums">
                {summaryMetrics.peakSiteDay.workers}
              </span>
              <span className="text-xs text-slate-500 font-semibold">Pekerja Serentak</span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              Tanggal puncak: {summaryMetrics.peakSiteDay.dateStr || '-'}
            </div>
          </div>

          {/* Overload Incidents */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Penumpukan (Overload)</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-rose-500 font-mono tabular-nums">
                {summaryMetrics.totalOverloadIncidents}
              </span>
              <span className="text-xs text-slate-500 font-semibold">Insiden Kritis</span>
            </div>
            <div className="text-[10px] text-rose-500/80 font-medium">
              Sektor dengan &ge;8 pekerja serentak
            </div>
          </div>

          {/* Deficit Incidents */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Kekurangan (Defisit)</span>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-500 font-mono tabular-nums">
                {summaryMetrics.totalDeficitIncidents}
              </span>
              <span className="text-xs text-slate-500 font-semibold">Hari Kosong</span>
            </div>
            <div className="text-[10px] text-amber-500/80 font-medium">
              0 pekerja pada jadwal aktif time schedule
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* 3. FILTERS BAR & COLOR SCALE LEGEND */}
        {/* ======================================================================= */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
          {/* Category Filter & Bottleneck Switch */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Sektor:
            </span>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
            >
              <option value="ALL">Semua Sektor ({workItems.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showBottlenecksOnly}
                onChange={(e) => setShowBottlenecksOnly(e.target.checked)}
                className="rounded text-orange-500 focus:ring-orange-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="font-bold text-rose-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Hanya Tampilkan Bottleneck
              </span>
            </label>
          </div>

          {/* Color Scale Legend */}
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span className="font-bold text-slate-700 dark:text-slate-300">Skala Kepadatan:</span>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-md bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 inline-block" />
              <span>0 (Kosong)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-md bg-sky-500/25 border border-sky-500/40 inline-block" />
              <span>1-2 (Rendah)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-500/30 border border-emerald-500/50 inline-block" />
              <span>3-5 (Optimal)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-md bg-amber-500 text-slate-950 inline-block" />
              <span>6-7 (Tinggi)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-md bg-rose-600 text-white inline-block shadow-xs" />
              <span className="text-rose-500 font-bold">&ge;8 (Overload/Kritis)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VISUAL HEATMAP GRID */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[1050px]">
            {/* Header Row: Work Item column + 30 Date columns */}
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-800 font-bold">
                {/* Left Fixed Column Header */}
                <th className="py-3 px-4 min-w-[280px] max-w-[340px] sticky left-0 z-20 bg-slate-900 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-slate-300">
                      Sektor Pekerjaan Time Schedule ({filteredWorkItems.length})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {dateWindow[0]?.dayNum} {dateWindow[0]?.monthStr} - {dateWindow[dateWindow.length - 1]?.dayNum} {dateWindow[dateWindow.length - 1]?.monthStr}
                    </span>
                  </div>
                </th>

                {/* 30 Date Columns */}
                {dateWindow.map((d) => (
                  <th
                    key={d.dateStr}
                    className={`py-2 px-1 text-center font-mono text-[10px] min-w-[32px] sm:min-w-[36px] transition-colors select-none ${
                      d.isToday
                        ? 'bg-orange-600 text-white font-black'
                        : d.isWeekend
                        ? 'bg-slate-800/90 text-slate-400'
                        : 'text-slate-300'
                    }`}
                    title={`${d.dayOfWeek}, ${d.dayNum} ${d.monthStr}`}
                  >
                    <div className="text-[9px] uppercase tracking-tighter opacity-80">{d.dayOfWeek}</div>
                    <div className="text-xs font-black">{d.dayNum}</div>
                  </th>
                ))}

                {/* Row Summary Header */}
                <th className="py-3 px-3 text-center min-w-[90px] font-mono text-[10px] uppercase tracking-wider text-slate-300 bg-slate-900">
                  Total (30 Hari)
                </th>
                <th className="py-3 px-3 text-center min-w-[95px] font-mono text-[10px] uppercase tracking-wider text-slate-300 bg-slate-900">
                  Status Beban
                </th>
              </tr>
            </thead>

            {/* Body Rows: One row per work item */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredWorkItems.length === 0 ? (
                <tr>
                  <td colSpan={33} className="py-16 text-center text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-60" />
                    <p className="font-bold text-sm text-slate-700 dark:text-slate-200">
                      Tidak Ada Sektor Pekerjaan yang Cocok dengan Filter
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {showBottlenecksOnly
                        ? 'Tidak ditemukan hambatan (bottleneck) pada kategori ini dalam 30 hari terakhir. Semua alokasi berjalan optimal.'
                        : 'Coba pilih kategori sektor lain atau reset filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredWorkItems.map(({ item, totalHeadcount, totalHours, overloadDaysCount, deficitDaysCount, severity, dailyMetrics }) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Left Sticky Sektor Label Column */}
                    <td className="py-3 px-4 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/80 shadow-sm border-r border-slate-200 dark:border-slate-800/80">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-bold text-orange-600 dark:text-orange-400">
                              {item.id}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border border-slate-200 dark:border-slate-700">
                              {item.category}
                            </span>
                          </div>
                          <div
                            className="font-bold text-slate-900 dark:text-white text-xs truncate mt-0.5 cursor-pointer hover:text-orange-500 transition-colors"
                            onClick={() => onViewWorkItemDetails?.(item.id)}
                            title={item.name}
                          >
                            {item.name}
                          </div>
                        </div>

                        {/* Overload badge indicator */}
                        {overloadDaysCount > 0 && (
                          <span
                            className="shrink-0 p-1 rounded-md bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            title={`${overloadDaysCount} hari penumpukan tenaga kerja (>7 orang)`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 30 Heatmap Day Cells */}
                    {dateWindow.map((d) => {
                      const metric = dailyMetrics[d.dateStr] || {
                        workersCount: 0,
                        totalHours: 0,
                        isOverload: false,
                        isDeficit: false,
                      };

                      const value = metricMode === 'headcount' ? metric.workersCount : metric.totalHours;
                      const cellStyle = getCellColor(value, metric.isOverload, metric.isDeficit);
                      const isSelected = selectedCell?.workItemId === item.id && selectedCell?.date === d.dateStr;

                      return (
                        <td
                          key={d.dateStr}
                          onClick={() => setSelectedCell({ workItemId: item.id, date: d.dateStr })}
                          className="p-0.5 text-center cursor-pointer transition-transform hover:scale-105 select-none"
                          title={`${item.name} | ${d.dayOfWeek}, ${d.dayNum} ${d.monthStr}: ${metric.workersCount} Pekerja (${metric.totalHours} Jam)${
                            metric.isOverload ? ' - [PERINGATAN: Kritis Overload]' : metric.isDeficit ? ' - [PERINGATAN: Defisit Kosong]' : ''
                          }`}
                        >
                          <div
                            className={`h-9 rounded-md flex flex-col items-center justify-center transition-all ${cellStyle} ${
                              isSelected ? 'ring-2 ring-orange-500 ring-offset-1 z-10' : ''
                            } ${d.isToday ? 'outline outline-1 outline-orange-500' : ''}`}
                          >
                            <span className="font-mono text-xs tabular-nums leading-none">
                              {value > 0 ? value : metric.isDeficit ? '!' : '-'}
                            </span>
                          </div>
                        </td>
                      );
                    })}

                    {/* Row Total (30 Days) */}
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-50/50 dark:bg-slate-900/40">
                      <div className="text-xs font-black tabular-nums">
                        {metricMode === 'headcount' ? totalHeadcount : totalHours}
                      </div>
                      <div className="text-[9px] text-slate-400 font-sans">
                        {metricMode === 'headcount' ? 'HOK' : 'Jam'}
                      </div>
                    </td>

                    {/* Bottleneck Status Column */}
                    <td className="py-2 px-3 text-center">
                      {severity === 'critical' ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 whitespace-nowrap inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-500" /> Kritis
                        </span>
                      ) : severity === 'warning' ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 whitespace-nowrap inline-flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-amber-500" /> Waspada
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 whitespace-nowrap inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Optimal
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            {/* Bottom Summary Row: Daily Total Workforce Across Entire Site */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-700">
                <td className="py-3 px-4 sticky left-0 z-20 bg-slate-900 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-orange-400">
                      Total Pekerja di Site / Hari
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      (Kapasitas Max: 45)
                    </span>
                  </div>
                </td>

                {dailyTotals.map((dt) => {
                  const val = metricMode === 'headcount' ? dt.totalWorkers : dt.totalHours;
                  return (
                    <td
                      key={dt.dateStr}
                      className={`py-2 px-1 text-center font-mono text-xs tabular-nums ${
                        dt.isSiteOverload
                          ? 'bg-rose-900/60 text-rose-300 font-black'
                          : dt.totalWorkers > 0
                          ? 'text-white font-bold'
                          : 'text-slate-600'
                      }`}
                      title={`Total site pada ${dt.dateStr}: ${dt.totalWorkers} Pekerja (${dt.totalHours} Jam)`}
                    >
                      {val > 0 ? val : '-'}
                    </td>
                  );
                })}

                {/* Grand Total */}
                <td className="py-3 px-3 text-center font-mono font-black text-orange-400 text-xs tabular-nums bg-slate-900">
                  {metricMode === 'headcount' ? summaryMetrics.totalManDays : summaryMetrics.totalManHours}
                </td>
                <td className="py-3 px-3 text-center text-[10px] text-slate-400 bg-slate-900 font-sans">
                  {summaryMetrics.totalOverloadIncidents} Bottlenecks
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Heatmap Footer Help Bar */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-orange-500 shrink-0" />
            <span>
              <strong>Petunjuk:</strong> Klik pada sembarang kotak sel tanggal untuk melihat rincian nama pekerja, peran, target output, serta rekomendasi mitigasi hambatan.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-slate-400">
              Sinkronisasi: Real-Time S-Curve &amp; Time Schedule
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CELL DETAIL INSPECTION DRAWER / MODAL */}
      {/* ========================================================================= */}
      {selectedCellData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-orange-400">
                      {selectedCellData.workItem.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {selectedCellData.date}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm truncate mt-0.5">
                    {selectedCellData.workItem.name}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCell(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs text-slate-300">
              {/* Bottleneck Diagnosis Banner */}
              {selectedCellData.isOverload ? (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 space-y-2 text-rose-300">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Peringatan Bottleneck: Penumpukan Tenaga Kerja (Overload)</span>
                  </div>
                  <p className="text-xs text-rose-200 leading-relaxed">
                    Sektor ini memiliki konsentrasi <strong>{selectedCellData.workersCount} pekerja</strong> secara bersamaan. Penumpukan tenaga kerja berlebih pada satu area berisiko menyebabkan saling tunggu material, ruang gerak terbatas, dan penurunan rasio produktivitas per orang.
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-rose-500/20 text-[11px] font-medium text-slate-200">
                    <strong>Rekomendasi Site Manager:</strong> Seimbangkan jadwal atau pecah kru menjadi 2 shift/zona berbeda untuk memaksimalkan efisiensi HOK.
                  </div>
                </div>
              ) : selectedCellData.isDeficit ? (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 space-y-2 text-amber-300">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-400">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Peringatan Defisit: Sektor Aktif Tanpa Tenaga Kerja</span>
                  </div>
                  <p className="text-xs text-amber-200 leading-relaxed">
                    Sektor ini berada dalam rentang jadwal aktif Time Schedule ({selectedCellData.workItem.startDate} s/d {selectedCellData.workItem.endDate}), namun belum ada alokasi pekerja pada tanggal ini. Sektor ini berisiko deviasi minus bila tidak segera diisi tenaga kerja.
                  </p>
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/20 text-[11px] font-medium text-slate-200">
                    <strong>Rekomendasi Site Manager:</strong> Segera alokasikan minimal 2-4 tenaga kerja untuk menjaga ritme progres fisik mingguan.
                  </div>
                </div>
              ) : selectedCellData.workersCount > 0 ? (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3 text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-bold text-xs text-emerald-400">Alokasi Tenaga Kerja Seimbang &amp; Terkendali</div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      Kepadatan {selectedCellData.workersCount} pekerja ({selectedCellData.hours} Jam Kerja) sesuai dengan volume target harian.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-slate-400 text-center">
                  Tidak ada penugasan pekerja pada sektor ini untuk tanggal {selectedCellData.date}.
                </div>
              )}

              {/* Roster of Workers on this Date & Work Item */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-orange-400" />
                    <span>Daftar Pekerja Bertugas ({selectedCellData.allocations.length})</span>
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Total: {selectedCellData.hours} Jam Kerja
                  </span>
                </div>

                {selectedCellData.allocations.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-800 text-center text-slate-400">
                    <Users className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                    Belum ada pekerja yang dialokasikan pada tanggal ini.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedCellData.allocations.map((alloc) => {
                      const matchedWorker = workers.find((w) => w.id === alloc.workerId);
                      const dailyWage = matchedWorker?.dailyWage || 170000;
                      const outputRatio =
                        alloc.targetOutput > 0
                          ? Math.round((alloc.actualOutput / alloc.targetOutput) * 100)
                          : 100;

                      return (
                        <div
                          key={alloc.id}
                          className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate">
                              {alloc.workerName}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{alloc.workerRole}</span>
                              <span>&bull;</span>
                              <span className="font-mono text-emerald-400">{formatIDR(dailyWage)}</span>
                            </div>
                            {alloc.notes && (
                              <p className="text-[10px] text-slate-400 mt-1 italic line-clamp-1">
                                &ldquo;{alloc.notes}&rdquo;
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-mono font-bold text-slate-200">
                              {alloc.actualOutput} / {alloc.targetOutput} {alloc.unit}
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                outputRatio >= 100
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {outputRatio}% Capaian
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedCell(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Tutup
                </button>

                {canEdit && onOpenAllocModal && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = selectedCellData.workItem.id;
                      const date = selectedCellData.date;
                      setSelectedCell(null);
                      onOpenAllocModal(item, date);
                    }}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/25 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Alokasi Tenaga Kerja ke Tanggal Ini</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
