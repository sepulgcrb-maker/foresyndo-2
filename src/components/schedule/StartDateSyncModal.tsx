import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  CalendarDays,
  ShieldCheck,
  Sparkles,
  Layers,
  X,
} from 'lucide-react';
import {
  ProjectInfo,
  WorkItem,
  CalendarEvent,
  PaymentTerm,
  MaterialItem,
  WorkerAllocation,
  DailyLog,
} from '../../types';
import {
  computeDaysOffset,
  safeShiftDate,
  syncAllProjectSchedules,
  StartDateSyncOptions,
  DEFAULT_SYNC_OPTIONS,
} from '../../utils/dateScheduleSync';

interface StartDateSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInfo;
  workItems: WorkItem[];
  calendarEvents: CalendarEvent[];
  paymentTerms: PaymentTerm[];
  materials: MaterialItem[];
  allocations: WorkerAllocation[];
  dailyLogs: DailyLog[];
  onApplySync: (result: {
    updatedProject: ProjectInfo;
    updatedWorkItems: WorkItem[];
    updatedCalendarEvents: CalendarEvent[];
    updatedPaymentTerms: PaymentTerm[];
    updatedMaterials: MaterialItem[];
    updatedAllocations: WorkerAllocation[];
    updatedDailyLogs: DailyLog[];
    summary: any;
  }) => void;
}

export const StartDateSyncModal: React.FC<StartDateSyncModalProps> = ({
  isOpen,
  onClose,
  project,
  workItems,
  calendarEvents,
  paymentTerms,
  materials,
  allocations,
  dailyLogs,
  onApplySync,
}) => {
  const [newStartDate, setNewStartDate] = useState(project.startDate || '2026-09-01');
  const [syncOptions, setSyncOptions] = useState<StartDateSyncOptions>(DEFAULT_SYNC_OPTIONS);
  const [isApplying, setIsApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state with prop if reopened
  React.useEffect(() => {
    if (isOpen) {
      setNewStartDate(project.startDate || '2026-09-01');
      setSuccessMessage(null);
    }
  }, [isOpen, project.startDate]);

  const offsetDays = useMemo(() => {
    return computeDaysOffset(project.startDate, newStartDate);
  }, [project.startDate, newStartDate]);

  const newTargetEndDate = useMemo(() => {
    if (!syncOptions.syncTargetEndDate) return project.targetEndDate;
    return safeShiftDate(project.targetEndDate, offsetDays);
  }, [project.targetEndDate, offsetDays, syncOptions.syncTargetEndDate]);

  // Preview sample of first 4 shifted work items
  const previewWorkItems = useMemo(() => {
    return workItems.slice(0, 4).map((wi) => ({
      name: wi.name,
      oldStart: wi.startDate,
      oldEnd: wi.endDate,
      newStart: safeShiftDate(wi.startDate, offsetDays),
      newEnd: safeShiftDate(wi.endDate, offsetDays),
      duration: wi.durationDays,
    }));
  }, [workItems, offsetDays]);

  if (!isOpen) return null;

  const handleApply = () => {
    setIsApplying(true);
    try {
      const result = syncAllProjectSchedules({
        newStartDate,
        project,
        workItems,
        calendarEvents,
        paymentTerms,
        materials,
        allocations,
        dailyLogs,
        options: syncOptions,
      });

      onApplySync(result);
      setSuccessMessage(
        `Berhasil menyinkronkan seluruh jadwal dengan pergeseran ${
          offsetDays > 0 ? `+${offsetDays}` : offsetDays
        } hari!`
      );

      setTimeout(() => {
        setIsApplying(false);
        onClose();
      }, 1200);
    } catch (err) {
      setIsApplying(false);
      console.error(err);
    }
  };

  // Quick preset helper
  const setPreset = (type: 'today' | 'firstOfNextMonth' | 'add30' | 'sub30') => {
    const today = new Date();
    if (type === 'today') {
      setNewStartDate(today.toISOString().split('T')[0]);
    } else if (type === 'firstOfNextMonth') {
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      setNewStartDate(nextMonth.toISOString().split('T')[0]);
    } else if (type === 'add30') {
      setNewStartDate(safeShiftDate(newStartDate, 30));
    } else if (type === 'sub30') {
      setNewStartDate(safeShiftDate(newStartDate, -30));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Pengaturan Tanggal Mulai Pekerjaan
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300">
                  Sinkronisasi Otomatis
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ubah tanggal mulai proyek, semua jadwal (Time Schedule, Kurva S, Kalender &amp; Termin) akan otomatis bergeser.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Current vs New Start Date Comparison Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tanggal Mulai Saat Ini
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                {project.startDate}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Target Selesai: <span className="font-semibold">{project.targetEndDate}</span>
              </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-3 md:pt-0 md:pl-4">
              <div className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider flex items-center justify-between">
                <span>Tanggal Mulai Baru</span>
                {offsetDays !== 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      offsetDays > 0
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {offsetDays > 0 ? `+${offsetDays} Hari (Mundur)` : `${offsetDays} Hari (Maju)`}
                  </span>
                )}
              </div>
              <div className="text-sm font-bold text-orange-600 dark:text-orange-400 mt-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                {newStartDate}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Estimasi Selesai Baru: <span className="font-semibold text-slate-700 dark:text-slate-300">{newTargetEndDate}</span>
              </div>
            </div>
          </div>

          {/* Date Picker & Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Pilih Tanggal Mulai Baru:</span>
              <span className="text-[11px] font-normal text-slate-500">Format: YYYY-MM-DD</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPreset('today')}
                  className="px-2.5 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('firstOfNextMonth')}
                  className="px-2.5 py-2 rounded-xl text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  Awal Bulan Depan
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('add30')}
                  className="px-2 py-2 rounded-xl text-xs font-medium bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 transition-colors"
                  title="Maju 30 Hari"
                >
                  +30 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('sub30')}
                  className="px-2 py-2 rounded-xl text-xs font-medium bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 transition-colors"
                  title="Mundur 30 Hari"
                >
                  -30 Hari
                </button>
              </div>
            </div>
          </div>

          {/* Sync Options Checklist */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-500" />
                Pilih Komponen yang Mengikuti Tanggal Mulai:
              </span>
              <button
                type="button"
                onClick={() =>
                  setSyncOptions({
                    syncWorkItems: true,
                    syncTargetEndDate: true,
                    syncCalendarEvents: true,
                    syncPaymentTerms: true,
                    syncMaterials: true,
                    syncAllocations: true,
                    syncDailyLogs: true,
                  })
                }
                className="text-[11px] font-semibold text-orange-600 hover:underline"
              >
                Pilih Semua
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-start gap-2.5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={syncOptions.syncWorkItems}
                  onChange={(e) =>
                    setSyncOptions({ ...syncOptions, syncWorkItems: e.target.checked })
                  }
                  className="mt-0.5 rounded text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Item Time Schedule ({workItems.length} Pekerjaan)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Menyesuaikan tanggal mulai &amp; selesai tiap seksi, durasi hari tetap terjaga.
                  </div>
                </div>
              </label>

              <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-start gap-2.5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={syncOptions.syncTargetEndDate}
                  onChange={(e) =>
                    setSyncOptions({ ...syncOptions, syncTargetEndDate: e.target.checked })
                  }
                  className="mt-0.5 rounded text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Target Selesai Proyek
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Menggeser tanggal target selesai sehingga total waktu kontrak tidak berubah.
                  </div>
                </div>
              </label>

              <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-start gap-2.5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={syncOptions.syncCalendarEvents}
                  onChange={(e) =>
                    setSyncOptions({ ...syncOptions, syncCalendarEvents: e.target.checked })
                  }
                  className="mt-0.5 rounded text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Kalender &amp; Agenda ({calendarEvents.length} Acara)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Milestone, rapat berkala, inspeksi, dan jadwal monitoring.
                  </div>
                </div>
              </label>

              <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-start gap-2.5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={syncOptions.syncPaymentTerms}
                  onChange={(e) =>
                    setSyncOptions({ ...syncOptions, syncPaymentTerms: e.target.checked })
                  }
                  className="mt-0.5 rounded text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Jadwal Termin Pembayaran ({paymentTerms.length} Termin)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Tanggal pengajuan MC, verifikasi MK, dan jatuh tempo termin.
                  </div>
                </div>
              </label>

              <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-start gap-2.5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={syncOptions.syncMaterials}
                  onChange={(e) =>
                    setSyncOptions({ ...syncOptions, syncMaterials: e.target.checked })
                  }
                  className="mt-0.5 rounded text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Kedatangan &amp; Pemakaian Material ({materials.length} Material)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Rencana kedatangan batch dan estimasi pemakaian di lapangan.
                  </div>
                </div>
              </label>

              <label className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex items-start gap-2.5 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={syncOptions.syncAllocations}
                  onChange={(e) =>
                    setSyncOptions({ ...syncOptions, syncAllocations: e.target.checked })
                  }
                  className="mt-0.5 rounded text-orange-500 focus:ring-orange-500"
                />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Alokasi Tenaga Kerja ({allocations.length} Pekerja)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Jadwal penugasan mandor dan tukang per item pekerjaan.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Live Preview Table */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Preview Pergeseran Jadwal Pekerjaan (Contoh):</span>
              <span className="text-[10px] font-mono text-slate-500">
                {workItems.length} total item pekerjaan
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-[11px]">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Item Pekerjaan</th>
                    <th className="py-2 px-2 text-center">Durasi</th>
                    <th className="py-2 px-3">Jadwal Semula</th>
                    <th className="py-2 px-3 text-orange-600 dark:text-orange-400">
                      Jadwal Baru (Sinkron)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {previewWorkItems.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-1.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {item.name}
                      </td>
                      <td className="py-1.5 px-2 text-center text-slate-500">
                        {item.duration}h
                      </td>
                      <td className="py-1.5 px-3 text-slate-400 line-through">
                        {item.oldStart} s/d {item.oldEnd}
                      </td>
                      <td className="py-1.5 px-3 font-semibold text-orange-600 dark:text-orange-400">
                        {item.newStart} s/d {item.newEnd}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Otomatis disimpan ke Cloud Supabase &amp; Audit Log</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying || !newStartDate}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Menerapkan...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Terapkan &amp; Sinkronisasikan Jadwal
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
