import React, { useState } from 'react';
import {
  Flag,
  Calendar,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Target,
  Sliders,
  Zap,
  Layers,
} from 'lucide-react';
import { ProjectInfo, WorkItem } from '../../types';

interface MilestonePredictorCardProps {
  project: ProjectInfo;
  workItems: WorkItem[];
  physicalProgress: number;
  dailyVelocity: number; // progress % per elapsed day
  elapsedDays: number;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  category: string;
  targetPercent: number;
  plannedDate: string; // ISO date or formatted
  description: string;
}

export const MilestonePredictorCard: React.FC<MilestonePredictorCardProps> = ({
  project,
  workItems,
  physicalProgress,
  dailyVelocity,
  elapsedDays,
}) => {
  // Scenario velocity multiplier state (1 = actual velocity, 1.25 = +25% acceleration)
  const [velocityMultiplier, setVelocityMultiplier] = useState<number>(1);

  const activeDailyVelocity = Math.max(0.05, dailyVelocity * velocityMultiplier);

  // Baseline start date for prediction calculations (defaults to 2026-08-31)
  const baseDate = new Date('2026-08-31');

  // Define key project milestones
  const milestones: ProjectMilestone[] = [
    {
      id: 'MS-1',
      title: 'Milestone 25%: Substruktur & Pondasi',
      category: 'Pondasi',
      targetPercent: 25,
      plannedDate: '2026-11-15',
      description: 'Penyelesaian tiang pancang, pile cap, dan galian tanah dasar.',
    },
    {
      id: 'MS-2',
      title: 'Milestone 50%: Superstruktur & Topping Off',
      category: 'Struktur',
      targetPercent: 50,
      plannedDate: '2027-01-31',
      description: 'Struktur kolom, balok, pelat lantai beton bertulang, dan core lift.',
    },
    {
      id: 'MS-3',
      title: 'Milestone 75%: Pekerjaan Arsitektur & MEP',
      category: 'MEP & Arsitektur',
      targetPercent: 75,
      plannedDate: '2027-04-15',
      description: 'Dinding, finishing arsitektur, instalasi listrik, dan plumbing utama.',
    },
    {
      id: 'MS-4',
      title: 'Milestone 100%: Serah Terima & Final Handover',
      category: 'Serah Terima',
      targetPercent: 100,
      plannedDate: '2027-06-01',
      description: 'Pengujian komisioning MEP, pembersihan akhir, dan BAST Pekerjaan.',
    },
  ];

  // Helper to format date nicely in Indonesian locale
  const formatDateIndo = (dateObj: Date): string => {
    return dateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Helper to calculate predicted date for a target percentage
  const calculatePrediction = (targetPercent: number, plannedDateStr: string) => {
    if (physicalProgress >= targetPercent) {
      return {
        isCompleted: true,
        daysNeeded: 0,
        predictedDateStr: 'Telah Tercapai',
        varianceDays: 0,
        status: 'COMPLETED' as const,
      };
    }

    const neededPercent = targetPercent - physicalProgress;
    const daysNeeded = Math.ceil(neededPercent / activeDailyVelocity);

    const predictedDateObj = new Date(baseDate.getTime());
    predictedDateObj.setDate(predictedDateObj.getDate() + daysNeeded);

    const plannedDateObj = new Date(plannedDateStr);
    const timeDiffMs = predictedDateObj.getTime() - plannedDateObj.getTime();
    const varianceDays = Math.round(timeDiffMs / (1000 * 3600 * 24));

    return {
      isCompleted: false,
      daysNeeded,
      predictedDateObj,
      predictedDateStr: formatDateIndo(predictedDateObj),
      plannedDateStrFormatted: formatDateIndo(plannedDateObj),
      varianceDays, // > 0 means delayed, <= 0 means early or on time
      status: varianceDays > 0 ? ('DELAYED' as const) : ('ON_TRACK' as const),
    };
  };

  // Find the next upcoming uncompleted major milestone
  const nextMilestone = milestones.find((m) => physicalProgress < m.targetPercent) || milestones[milestones.length - 1];
  const nextPred = calculatePrediction(nextMilestone.targetPercent, nextMilestone.plannedDate);

  // Calculate progress ratio to next milestone
  const prevMilestonePercent = milestones
    .filter((m) => m.targetPercent <= physicalProgress)
    .pop()?.targetPercent || 0;
  
  const milestoneRange = Math.max(1, nextMilestone.targetPercent - prevMilestonePercent);
  const currentInMilestone = Math.max(0, physicalProgress - prevMilestonePercent);
  const milestoneProgressRatio = Math.min(100, Math.round((currentInMilestone / milestoneRange) * 100));

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400 border border-orange-500/20">
            <Target className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                PREDIKSI TANGGAL MILESTONE BERIKUTNYA
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black border border-orange-500/20 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-500" />
                PREDICTIVE ANALYTICS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Estimasi penyelesaian milestone proyek berbasis kecepatan laju progress harian real-time ({dailyVelocity.toFixed(2)}%/hari)
            </p>
          </div>
        </div>

        {/* Velocity Simulator Control */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-extrabold text-slate-700 dark:text-slate-300">
            <Sliders className="w-4 h-4 text-orange-500" />
            <span>Simulasi Laju:</span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            {[
              { label: 'Normal (1x)', val: 1 },
              { label: 'Lembur (+20%)', val: 1.2 },
              { label: 'Akselerasi (+40%)', val: 1.4 },
            ].map((option) => (
              <button
                key={option.val}
                onClick={() => setVelocityMultiplier(option.val)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  velocityMultiplier === option.val
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURED HIGHLIGHT: NEXT MAJOR MILESTONE CARD */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl relative overflow-hidden space-y-4">
        <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3 relative z-10">
          <div className="space-y-0.5">
            <span className="text-[10px] font-extrabold text-orange-400 uppercase tracking-widest flex items-center gap-1">
              <Flag className="w-3.5 h-3.5" /> MILESTONE UTAMA TERDEKAT
            </span>
            <h4 className="text-lg font-black text-white tracking-tight">
              {nextMilestone.title}
            </h4>
            <p className="text-xs text-slate-400">{nextMilestone.description}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase border flex items-center gap-1.5 ${
              nextPred.status === 'COMPLETED'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : nextPred.status === 'ON_TRACK'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            }`}>
              {nextPred.status === 'COMPLETED' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> TELAH TERCAPAI
                </>
              ) : nextPred.status === 'ON_TRACK' ? (
                <>
                  <Zap className="w-4 h-4 text-emerald-400" /> ON TRACK ({Math.abs(nextPred.varianceDays)} HARI LEBIH CEPAT)
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-400" /> PROYEKSI TERLAMBAT +{nextPred.varianceDays} HARI
                </>
              )}
            </span>
          </div>
        </div>

        {/* Prediction Metrics Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10 pt-1">
          {/* Target Milestone Percentage & Needed */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Target &amp; Capaian Progress</span>
            <div className="text-lg font-black text-white flex items-baseline gap-1.5">
              <span>{physicalProgress}%</span>
              <span className="text-xs font-normal text-slate-400">/ Target {nextMilestone.targetPercent}%</span>
            </div>
            <div className="text-[11px] text-orange-400 font-bold">
              Sisa {(nextMilestone.targetPercent - physicalProgress).toFixed(2)}% Progress Lagi
            </div>
          </div>

          {/* Planned Schedule Date */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Target Jadwal Rencana</span>
            <div className="text-base font-black text-slate-200 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{nextPred.plannedDateStrFormatted || nextMilestone.plannedDate}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Target Jadwal S-Curve Kontrak</div>
          </div>

          {/* Predicted Completion Date (Highlighted) */}
          <div className={`p-3.5 rounded-xl border space-y-1 ${
            nextPred.status === 'ON_TRACK'
              ? 'bg-emerald-950/40 border-emerald-500/40'
              : 'bg-red-950/40 border-red-500/40'
          }`}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>PREDIKSI TANGGAL CAPAIAN</span>
              <span className="font-mono text-[9px] text-orange-400">{nextPred.daysNeeded} Hari Lagi</span>
            </span>
            <div className={`text-lg font-black flex items-center gap-1.5 ${
              nextPred.status === 'ON_TRACK' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              <Clock className="w-4 h-4" />
              <span>{nextPred.predictedDateStr}</span>
            </div>
            <div className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-orange-400" />
              <span>Laju Asumsi: {activeDailyVelocity.toFixed(2)}% / Hari</span>
            </div>
          </div>
        </div>

        {/* Progress bar towards next milestone */}
        <div className="space-y-1.5 pt-2 relative z-10">
          <div className="flex justify-between text-[11px] font-bold text-slate-300">
            <span>Progress Menuju {nextMilestone.title}</span>
            <span className="text-orange-400">{milestoneProgressRatio}% Tercapai dalam Tahap Ini</span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-orange-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${milestoneProgressRatio}%` }}
            />
          </div>
        </div>
      </div>

      {/* ALL MILESTONES TIMELINE MATRIX */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-orange-500" />
          MATRIKS PROYEKSI SEMUA MILESTONE PROYEK
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {milestones.map((m) => {
            const pred = calculatePrediction(m.targetPercent, m.plannedDate);
            const isNext = m.id === nextMilestone.id;

            return (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition-all space-y-2.5 relative ${
                  isNext
                    ? 'border-orange-500/80 bg-orange-500/5 dark:bg-orange-500/10 shadow-md'
                    : pred.isCompleted
                    ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                }`}
              >
                {isNext && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-orange-500 text-white font-black text-[9px] uppercase shadow">
                    SEGERA
                  </span>
                )}

                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {m.category}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                    pred.isCompleted
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                      : pred.status === 'ON_TRACK'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-red-500/10 text-red-600 dark:text-red-400'
                  }`}>
                    {m.targetPercent}%
                  </span>
                </div>

                <div>
                  <h5 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {m.title}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                    {m.description}
                  </p>
                </div>

                <div className="pt-1 space-y-1 text-xs border-t border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Rencana:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{m.plannedDate}</span>
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Prediksi:</span>
                    <span className={`font-black ${
                      pred.isCompleted
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : pred.status === 'ON_TRACK'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {pred.predictedDateStr}
                    </span>
                  </div>

                  {!pred.isCompleted && (
                    <div className={`text-[10px] font-extrabold pt-1 flex items-center justify-between ${
                      pred.status === 'ON_TRACK' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      <span>
                        {pred.status === 'ON_TRACK'
                          ? `On Track (${Math.abs(pred.varianceDays)} hr lebih cepat)`
                          : `Terlambat +${pred.varianceDays} hari`}
                      </span>
                      <span className="font-mono text-slate-400">~{pred.daysNeeded} hr</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
