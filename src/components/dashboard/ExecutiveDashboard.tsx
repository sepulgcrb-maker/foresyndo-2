import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Users,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  BarChart3,
  LineChart as LineChartIcon,
  Gauge,
  Zap,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ProjectInfo, WorkItem, PaymentTerm, AuditLog, NotificationItem } from '../../types';
import { CircularProgress } from './CircularProgress';
import { MLForecastingModule } from './MLForecastingModule';
import { WeatherWidget } from './WeatherWidget';
import { DeviasiBadge } from '../common/DeviasiBadge';
import {
  formatIDR,
  calculatePhysicalProgress,
  calculateTargetProgress,
  calculateDeviation,
  calculateProjectDuration,
  calculateFinancialSummary,
  generateSCurveData,
} from '../../utils/calculations';
import { ActiveTab } from '../layout/Sidebar';

interface ExecutiveDashboardProps {
  project: ProjectInfo;
  workItems: WorkItem[];
  paymentTerms: PaymentTerm[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
  onNavigateTab: (tab: ActiveTab) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  project,
  workItems,
  paymentTerms,
  auditLogs,
  notifications,
  onNavigateTab,
}) => {
  const [chartMode, setChartMode] = useState<'cumulative' | 'weekly'>('cumulative');

  const physicalProgress = calculatePhysicalProgress(workItems);
  const targetProgress = calculateTargetProgress(workItems);
  const deviation = calculateDeviation(physicalProgress, targetProgress);
  const duration = calculateProjectDuration(project);
  const finance = calculateFinancialSummary(project.contractValue, paymentTerms);

  // Velocity and completion projection calculations
  const dailyVelocity = physicalProgress / Math.max(1, duration.elapsedDays); // % progress per elapsed day
  const remainingProgressNeeded = Math.max(0, 100 - physicalProgress);
  const estimatedDaysToComplete = dailyVelocity > 0 ? remainingProgressNeeded / dailyVelocity : (physicalProgress >= 100 ? 0 : 9999);
  const isProjectedOverdue = physicalProgress < 100 && (
    estimatedDaysToComplete > duration.remainingDays ||
    (deviation < 0 && (dailyVelocity * duration.remainingDays) < remainingProgressNeeded)
  );
  const projectedDelayDays = Math.max(0, Math.ceil(estimatedDaysToComplete - duration.remainingDays));

  const isSevereDeviation = deviation < -5;

  // Generate Recharts data points for weekly vs target comparison
  const rawSCurve = useMemo(() => generateSCurveData(workItems), [workItems]);

  const chartData = useMemo(() => {
    return rawSCurve.map((pt, idx, arr) => {
      const prevTarget = idx > 0 ? arr[idx - 1].targetCumulativePercent : 0;
      const prevRealized =
        idx > 0 && arr[idx - 1].realizedCumulativePercent !== undefined
          ? arr[idx - 1].realizedCumulativePercent
          : 0;

      const targetWeeklyRate = Number((pt.targetCumulativePercent - prevTarget).toFixed(2));
      const realizedWeeklyRate =
        pt.realizedCumulativePercent !== undefined
          ? Number((pt.realizedCumulativePercent - (prevRealized || 0)).toFixed(2))
          : undefined;

      return {
        ...pt,
        targetWeeklyRate: Math.max(0, targetWeeklyRate),
        realizedWeeklyRate: realizedWeeklyRate !== undefined ? Math.max(0, realizedWeeklyRate) : undefined,
      };
    });
  }, [rawSCurve]);

  return (
    <div className="space-y-6">
      {/* Deviasi Warning Alert Banner */}
      {isSevereDeviation && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500/15 via-red-500/10 to-orange-500/15 border border-red-500/30 flex items-start gap-3.5 shadow-lg">
          <div className="p-2 rounded-xl bg-red-500/20 text-red-500 shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              PERINGATAN DEVIASI JADWAL TERLAMBAT ({deviation}%)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
              Progress fisik riil ({physicalProgress}%) berada lebih dari 5% di bawah target rencana ({targetProgress}%). Diperlukan tindakan percepatan (rescheduling, penambahan manpower/grup malam, atau suplai material dipercepat).
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('schedule')}
            className="px-3.5 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold shrink-0 transition-colors shadow-md"
          >
            Tinjau Schedule
          </button>
        </div>
      )}

      {/* Main Hero Card: Project Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl relative overflow-hidden">
        {/* Background Decorative Accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center p-2 shrink-0 shadow-lg">
              {project.logoUrl ? (
                <img src={project.logoUrl} alt="Logo FGI" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Building2 className="w-8 h-8 text-orange-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
                  {project.owner}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Status: {project.status}
                </span>
                <DeviasiBadge deviationPercent={deviation} />
              </div>

              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
                PROYEK {project.name}
              </h2>

              <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                {project.location}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60 backdrop-blur-sm">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Nilai Kontrak</span>
              <span className="text-base font-black text-amber-400">{formatIDR(project.contractValue)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Durasi Kontrak</span>
              <span className="text-base font-bold text-slate-200">{duration.totalDays} Hari</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Sisa Hari Kerja</span>
              <span className="text-base font-bold text-orange-400">{duration.remainingDays} Hari Lagi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Top Card: Project Performance KPI */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white border-2 border-orange-500/30 shadow-2xl relative overflow-hidden space-y-6">
        {/* Subtle background glow */}
        <div className="absolute -right-10 -top-10 w-60 h-60 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-inner">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  PROJECT PERFORMANCE KPI
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  REAL-TIME METRICS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dashboard indikator kinerja utama: Total anggaran terpakai, sisa hari kerja, dan status efisiensi proyek
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-700/80 text-xs font-bold text-slate-300">
            <Zap className="w-4 h-4 text-orange-400" />
            Status Efisiensi:
            <span className={`font-black px-2 py-0.5 rounded-lg ${deviation >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
              {deviation >= 0 ? 'OPTIMAL & ON TRACK' : 'PERLU AKSELERASI'}
            </span>
          </div>
        </div>

        {/* 3 Metric Column Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
          {/* Metric 1: Total Budget Spent */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 hover:border-slate-600 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Total Anggaran Terpakai
              </span>
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-amber-400 tracking-tight">
                {formatIDR(finance.totalPaidGross)}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>Total Nilai Kontrak:</span>
                <span className="font-bold text-slate-200">{formatIDR(project.contractValue)}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-amber-400">{finance.financialProgressPercent}% Dicairkan</span>
                <span className="text-slate-400">Sisa: {formatIDR(finance.remainingContractValue)}</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, finance.financialProgressPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Metric 2: Remaining Work Days */}
          <div className={`p-4 rounded-2xl bg-slate-800/60 border hover:border-slate-600 transition-all space-y-3 ${
            isProjectedOverdue ? 'border-red-500/60 bg-red-950/20' : 'border-slate-700/70'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                Sisa Hari Kerja Pelaksanaan
                {isProjectedOverdue && (
                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 text-[9px] font-black border border-red-500/30">
                    RESIKO TERLAMBAT
                  </span>
                )}
              </span>
              <div className={`p-2 rounded-xl ${isProjectedOverdue ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'}`}>
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className={`text-2xl font-black tracking-tight ${isProjectedOverdue ? 'text-red-400' : 'text-orange-400'}`}>
                {duration.remainingDays} Hari Lagi
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>Target Selesai:</span>
                <span className="font-bold text-slate-200">{project.targetEndDate}</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className={isProjectedOverdue ? 'text-red-400' : 'text-orange-400'}>
                  {duration.elapsedDays} / {duration.totalDays} Hari Terlewati
                </span>
                <span className="text-slate-400">{duration.timePercentage}% Durasi</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isProjectedOverdue ? 'bg-red-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(100, duration.timePercentage)}%` }}
                />
              </div>
            </div>

            {isProjectedOverdue && (
              <div className="text-[10px] text-red-300 bg-red-500/10 border border-red-500/20 p-2 rounded-xl flex items-center gap-1.5 mt-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>
                  Kecepatan ({dailyVelocity.toFixed(2)}%/hari) diproyeksikan terlambat +{projectedDelayDays} hari dari target selesai.
                </span>
              </div>
            )}
          </div>

          {/* Metric 3: Overall Project Efficiency Status */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 hover:border-slate-600 transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Status Efisiensi & Kinerja Proyek
              </span>
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-black text-emerald-400 tracking-tight flex items-center gap-2">
                {deviation >= 0 ? 'SANGAT EFISIEN' : 'PERLU PERHATIAN'}
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30 font-mono text-emerald-300">
                  SPI: {(physicalProgress / Math.max(1, targetProgress)).toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>Deviasi Jadwal:</span>
                <span className={`font-bold ${deviation >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {deviation >= 0 ? `+${deviation}% (Surplus Progress)` : `${deviation}% (Terlambat)`}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-emerald-400">Fisik: {physicalProgress}%</span>
                <span className="text-slate-400">Target Plan: {targetProgress}%</span>
              </div>
              <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    deviation >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, physicalProgress)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive High-Level KPI Summary Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Ringkasan Eksekutif KPI Proyek
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-500/20">
                  LIVE SUMMARY
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ikhtisar anggaran vs realisasi pengeluaran dan sisa durasi masa pelaksanaan proyek
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Calendar className="w-4 h-4 text-orange-500" />
            Target Selesai: <span className="text-slate-900 dark:text-white font-black">{project.targetEndDate}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* KPI Item 1: Total Budget vs Actual Spend */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Anggaran vs Realisasi
              </span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {formatIDR(project.contractValue)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                <span>Realisasi Pencairan:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatIDR(finance.totalPaidGross)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-500 dark:text-slate-400">Terpakai ({finance.financialProgressPercent}%)</span>
                <span className="text-slate-700 dark:text-slate-300">
                  Sisa: {formatIDR(finance.remainingContractValue)}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, finance.financialProgressPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* KPI Item 2: Remaining Work Days */}
          <div className={`p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border space-y-3 transition-all ${
            isProjectedOverdue
              ? 'border-red-300 dark:border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
              : 'border-slate-200 dark:border-slate-700/80'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                Sisa Hari Kerja Pelaksanaan
                {isProjectedOverdue && (
                  <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black border border-red-500/20">
                    RESIKO TERLAMBAT
                  </span>
                )}
              </span>
              <div className={`p-2 rounded-xl ${isProjectedOverdue ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                <Clock className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className={`text-xl font-black ${isProjectedOverdue ? 'text-red-600 dark:text-red-400' : 'text-orange-500'}`}>
                {duration.remainingDays} Hari Lagi
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                <span>Total Durasi Kontrak:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{duration.totalDays} Hari</span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className={isProjectedOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}>
                  Waktu Berjalan ({duration.timePercentage}%)
                </span>
                <span className="text-slate-700 dark:text-slate-300">{duration.elapsedDays} Hari Terlewati</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isProjectedOverdue ? 'bg-red-500' : 'bg-orange-500'}`}
                  style={{ width: `${Math.min(100, duration.timePercentage)}%` }}
                />
              </div>
            </div>

            {isProjectedOverdue && (
              <p className="text-[10px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1 pt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Kecepatan ({dailyVelocity.toFixed(2)}%/hari) berisiko terlambat +{projectedDelayDays} hari</span>
              </p>
            )}
          </div>

          {/* KPI Item 3: Physical Performance vs Schedule */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Performa Fisik vs Plan
              </span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                {physicalProgress}%
                <span className="text-xs text-slate-400 font-normal">vs Target {targetProgress}%</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center justify-between">
                <span>Deviasi Jadwal:</span>
                <span className={`font-black ${deviation >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {deviation >= 0 ? `+${deviation}% (Surplus)` : `${deviation}% (Terlambat)`}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-500 dark:text-slate-400">Status Capaian</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {workItems.length} Sektor Pekerjaan
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    deviation >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, physicalProgress)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Large Circular Progress Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CircularProgress
          percentage={physicalProgress}
          label="Progress Fisik"
          sublabel="Realisasi Pekerjaan Lapangan"
          color="emerald"
        />
        <CircularProgress
          percentage={finance.financialProgressPercent}
          label="Progress Keuangan"
          sublabel={`Total Cair: ${formatIDR(finance.totalPaidGross)}`}
          color="blue"
        />
        <CircularProgress
          percentage={targetProgress}
          label="Target Schedule"
          sublabel={`Rencana Rencana s/d Saat Ini`}
          color="orange"
        />
      </div>

      {/* Weather Widget Component (Search Grounded Weather for Majalengka / Jatitujuh) */}
      <WeatherWidget />

      {/* Quick Metric KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Sisa Pembayaran */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sisa Tagihan Kontrak</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {formatIDR(finance.remainingContractValue)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Retensi Terpotong: {formatIDR(finance.totalRetentionHeld)}
          </span>
        </div>

        {/* Card 2: Progress Mingguan */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Progress Minggu Ini</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
            {physicalProgress === 0 ? '0.0% / Minggu' : '+2.4% / Minggu'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {physicalProgress === 0 ? 'Status: Persiapan Mobilisasi' : 'Target Kecepatan: +2.8% / Minggu'}
          </span>
        </div>

        {/* Card 3: Progress Bulanan */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status Pekerjaan</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-purple-600 dark:text-purple-400">
            {physicalProgress === 0 ? '0.0% (Belum Mulai)' : '+11.2%'}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {physicalProgress === 0 ? 'Jadwal Start: 1 Sep 2026' : 'Pekerjaan Utama: Balok Lt. 2'}
          </span>
        </div>

        {/* Card 4: Status Termin */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status Pembayaran</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-orange-500">
            {paymentTerms.filter((t) => t.status === 'Dibayar').length === 0
              ? 'Belum Ada Termin'
              : `Termin ${paymentTerms.filter((t) => t.status === 'Dibayar').length} Lunas`}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {paymentTerms.filter((t) => t.status === 'Dibayar').length === 0
              ? 'Syarat Termin 1: Progress 25%'
              : 'Termin Selanjutnya Siap Diproses'}
          </span>
        </div>
      </div>

      {/* Visualisasi Data Recharts: Progress Mingguan vs Target */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Visualisasi Performa Progress Mingguan vs Target
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold text-[10px] border border-orange-500/20">
                  RECHARTS GRAPH
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Grafik perbandingan capaian progress riil versus target kurva S kumulatif dan kecepatan mingguan
              </p>
            </div>
          </div>

          {/* Metric Switcher Toggle Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setChartMode('cumulative')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                chartMode === 'cumulative'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" /> Progress Kumulatif (%)
            </button>
            <button
              onClick={() => setChartMode('weekly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                chartMode === 'weekly'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Laju Mingguan (%/Wk)
            </button>
          </div>
        </div>

        {/* Recharts Render Container */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="realizedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.25} vertical={false} />
              <XAxis dataKey="weekLabel" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                unit="%"
                domain={chartMode === 'cumulative' ? [0, 100] : [0, 'auto']}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const dataPoint = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 text-white p-3 rounded-xl shadow-2xl text-xs space-y-1.5">
                        <div className="font-extrabold text-orange-400 border-b border-slate-800 pb-1 flex justify-between gap-4">
                          <span>Minggu Ke-{label} ({dataPoint.date})</span>
                          <span className="text-[10px] text-slate-400 font-normal">S-Curve Analysis</span>
                        </div>
                        {chartMode === 'cumulative' ? (
                          <>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-orange-500" /> Target Kumulatif:
                              </span>
                              <span className="font-bold text-orange-400">{dataPoint.targetCumulativePercent}%</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Realisasi Kumulatif:
                              </span>
                              <span className="font-bold text-emerald-400">
                                {dataPoint.realizedCumulativePercent !== undefined
                                  ? `${dataPoint.realizedCumulativePercent}%`
                                  : 'Belum Terjadi'}
                              </span>
                            </div>
                            {dataPoint.realizedCumulativePercent !== undefined && (
                              <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1 font-semibold">
                                <span className="text-slate-400">Deviasi Lapangan:</span>
                                <span
                                  className={`font-black ${
                                    dataPoint.deviationPercent >= 0 ? 'text-emerald-400' : 'text-red-400'
                                  }`}
                                >
                                  {dataPoint.deviationPercent >= 0
                                    ? `+${dataPoint.deviationPercent}%`
                                    : `${dataPoint.deviationPercent}%`}
                                </span>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-orange-500" /> Target Laju Minggu Ini:
                              </span>
                              <span className="font-bold text-orange-400">+{dataPoint.targetWeeklyRate}% / minggu</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-slate-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Realisasi Laju Minggu Ini:
                              </span>
                              <span className="font-bold text-emerald-400">
                                {dataPoint.realizedWeeklyRate !== undefined
                                  ? `+${dataPoint.realizedWeeklyRate}% / minggu`
                                  : 'Belum Ada Data'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontWeight: 'bold' }}
                formatter={(value) => <span className="text-slate-700 dark:text-slate-300">{value}</span>}
              />

              {chartMode === 'cumulative' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="targetCumulativePercent"
                    name="Target Kumulatif Rencana (%)"
                    stroke="#f97316"
                    strokeWidth={2}
                    fill="url(#targetGrad)"
                    strokeDasharray="4 4"
                  />
                  <Area
                    type="monotone"
                    dataKey="realizedCumulativePercent"
                    name="Realisasi Kumulatif Lapangan (%)"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#realizedGrad)"
                    connectNulls
                  />
                </>
              ) : (
                <>
                  <Bar
                    dataKey="targetWeeklyRate"
                    name="Target Laju per Minggu (%)"
                    fill="#f97316"
                    opacity={0.6}
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="realizedWeeklyRate"
                    name="Realisasi Laju per Minggu (%)"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ r: 3, fill: '#10b981' }}
                    connectNulls
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Summary Indicators Footnote */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Target Progress Rencana:</span>
            <span className="font-black text-orange-500">{targetProgress}%</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Capaian Progress Lapangan:</span>
            <span className="font-black text-emerald-500">{physicalProgress}%</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Schedule Performance Index (SPI):</span>
            <span className={`font-black ${deviation >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {(physicalProgress / (targetProgress || 1)).toFixed(2)} ({deviation >= 0 ? 'On Track' : 'Terlambat'})
            </span>
          </div>
        </div>
      </div>

      {/* ML Machine Learning Forecasting & Trend Analytics Section */}
      <MLForecastingModule project={project} workItems={workItems} />

      {/* Grid Section: Time Schedule Overview & Recent Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Summary of Work Schedule Items */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Status Pekerjaan Time Schedule</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ringkasan kemajuan item proyek utama</p>
            </div>
            <button
              onClick={() => onNavigateTab('schedule')}
              className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
            >
              Lihat Detail Schedule <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {workItems.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="w-6 h-6 rounded-lg bg-orange-500/10 text-orange-500 font-bold flex items-center justify-center shrink-0">
                    {item.no}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Bobot: {item.bobotPercent}% &bull; Target: {item.targetProgressPercent}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.realizedProgressPercent >= item.targetProgressPercent
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${item.realizedProgressPercent}%` }}
                    />
                  </div>
                  <span className="font-black text-slate-900 dark:text-white w-10 text-right">
                    {item.realizedProgressPercent}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Audit Trail Log */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Riwayat Perubahan (Audit Trail)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Log aktivitas update proyek</p>
            </div>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{log.userName}</span>
                  <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                </div>
                <div className="text-orange-600 dark:text-orange-400 font-semibold">{log.action}</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">{log.details}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
