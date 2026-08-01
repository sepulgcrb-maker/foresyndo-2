import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { WorkItem } from '../../types';
import { generateSCurveData, calculatePhysicalProgress, calculateTargetProgress, calculateDeviation } from '../../utils/calculations';
import { LineChart, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SCurveChartProps {
  workItems: WorkItem[];
}

export const SCurveChart: React.FC<SCurveChartProps> = ({ workItems }) => {
  const [viewGranularity, setViewGranularity] = useState<'Weekly' | 'Monthly'>('Weekly');

  const rawData = generateSCurveData(workItems);

  // If monthly, aggregate weekly points into 9 months (Jan to Oct 2026)
  const chartData =
    viewGranularity === 'Monthly'
      ? [
          { date: 'Jan 26', targetCumulativePercent: 3.5, realizedCumulativePercent: 3.5, deviationPercent: 0 },
          { date: 'Feb 26', targetCumulativePercent: 12.0, realizedCumulativePercent: 12.0, deviationPercent: 0 },
          { date: 'Mar 26', targetCumulativePercent: 22.5, realizedCumulativePercent: 22.5, deviationPercent: 0 },
          { date: 'Apr 26', targetCumulativePercent: 35.0, realizedCumulativePercent: 34.0, deviationPercent: -1.0 },
          { date: 'Mei 26', targetCumulativePercent: 49.0, realizedCumulativePercent: 46.5, deviationPercent: -2.5 },
          { date: 'Jun 26', targetCumulativePercent: 62.0, realizedCumulativePercent: 57.0, deviationPercent: -5.0 },
          { date: 'Jul 26', targetCumulativePercent: 72.4, realizedCumulativePercent: 65.8, deviationPercent: -6.6 },
          { date: 'Agu 26', targetCumulativePercent: 86.0, realizedCumulativePercent: undefined, deviationPercent: undefined },
          { date: 'Sep 26', targetCumulativePercent: 96.0, realizedCumulativePercent: undefined, deviationPercent: undefined },
          { date: 'Okt 26', targetCumulativePercent: 100.0, realizedCumulativePercent: undefined, deviationPercent: undefined },
        ]
      : rawData;

  const currentRealized = calculatePhysicalProgress(workItems);
  const currentTarget = calculateTargetProgress(workItems);
  const currentDev = calculateDeviation(currentRealized, currentTarget);

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <LineChart className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Analisis Kurva S (S-Curve) Proyek</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Perbandingan Kumulatif Target vs Realisasi vs Deviasi Pembangunan Gedung FORESYNDO 2
          </p>
        </div>

        {/* Granularity Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewGranularity('Weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewGranularity === 'Weekly'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-white'
            }`}
          >
            Mingguan (Weekly)
          </button>
          <button
            onClick={() => setViewGranularity('Monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewGranularity === 'Monthly'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-white'
            }`}
          >
            Bulanan (Monthly)
          </button>
        </div>
      </div>

      {/* Stats Callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <span className="text-xs font-semibold text-slate-400 block">Kumulatif Target Schedule</span>
          <span className="text-2xl font-black text-orange-500 mt-1 block">{currentTarget}%</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Sesuai rencana kerja mingguan</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <span className="text-xs font-semibold text-slate-400 block">Kumulatif Realisasi Fisik</span>
          <span className="text-2xl font-black text-emerald-500 mt-1 block">{currentRealized}%</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Total fisik terverifikasi di lapangan</span>
        </div>

        <div
          className={`p-4 rounded-2xl border shadow-md ${
            currentDev < -5
              ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold block">Deviasi Progress Saat Ini</span>
            {currentDev < -5 ? (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
          </div>
          <span className="text-2xl font-black mt-1 block">
            {currentDev > 0 ? `+${currentDev}%` : `${currentDev}%`}
          </span>
          <span className="text-[11px] opacity-80 mt-0.5 block">
            {currentDev < -5 ? 'Peringatan: Keterlambatan >5%!' : 'Proyek Berjalan Lancar'}
          </span>
        </div>
      </div>

      {/* Chart Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="h-96 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                domain={[0, 100]}
                unit="%"
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#FFF',
                  fontSize: '12px',
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <ReferenceLine y={currentRealized} stroke="#10B981" strokeDasharray="3 3" label={{ value: `Realisasi ${currentRealized}%`, fill: '#10B981', fontSize: 10 }} />

              {/* Deviation Bar */}
              <Bar dataKey="deviationPercent" name="Deviasi (%)" fill="#EF4444" radius={[4, 4, 0, 0]} opacity={0.7} />

              {/* Target Line (Orange) */}
              <Line
                type="monotone"
                dataKey="targetCumulativePercent"
                name="Target Rencana (%)"
                stroke="#F97316"
                strokeWidth={3}
                dot={{ r: 4, fill: '#F97316' }}
                activeDot={{ r: 6 }}
              />

              {/* Realized Line (Emerald Green) */}
              <Line
                type="monotone"
                dataKey="realizedCumulativePercent"
                name="Realisasi Fisik (%)"
                stroke="#10B981"
                strokeWidth={3.5}
                dot={{ r: 5, fill: '#10B981' }}
                activeDot={{ r: 7 }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
