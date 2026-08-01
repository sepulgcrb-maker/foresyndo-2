import React from 'react';
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
} from 'lucide-react';
import { ProjectInfo, WorkItem, PaymentTerm, AuditLog, NotificationItem } from '../../types';
import { CircularProgress } from './CircularProgress';
import { MLForecastingModule } from './MLForecastingModule';
import { DeviasiBadge } from '../common/DeviasiBadge';
import {
  formatIDR,
  calculatePhysicalProgress,
  calculateTargetProgress,
  calculateDeviation,
  calculateProjectDuration,
  calculateFinancialSummary,
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
  const physicalProgress = calculatePhysicalProgress(workItems);
  const targetProgress = calculateTargetProgress(workItems);
  const deviation = calculateDeviation(physicalProgress, targetProgress);
  const duration = calculateProjectDuration(project);
  const finance = calculateFinancialSummary(project.contractValue, paymentTerms);

  const isSevereDeviation = deviation < -5;

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
