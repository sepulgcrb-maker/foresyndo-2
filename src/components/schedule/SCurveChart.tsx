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
import { WorkItem, ProjectInfo } from '../../types';
import { INITIAL_PROJECT_INFO } from '../../data/initialData';
import { generateSCurveData, calculatePhysicalProgress, calculateTargetProgress, calculateDeviation } from '../../utils/calculations';
import { generateSCurvePDF, generateExcelReport } from '../../utils/exportEngine';
import { LineChart, AlertTriangle, CheckCircle2, FileText, FileSpreadsheet, Download, Info, ChevronRight, TrendingUp, Calendar } from 'lucide-react';

interface SCurveChartProps {
  workItems: WorkItem[];
  project?: ProjectInfo;
  onAddAuditLog?: (action: string, detail: string) => void;
}

export const SCurveChart: React.FC<SCurveChartProps> = ({
  workItems,
  project = INITIAL_PROJECT_INFO,
  onAddAuditLog,
}) => {
  const [viewGranularity, setViewGranularity] = useState<'Weekly' | 'Monthly'>('Weekly');
  const [activeTableTab, setActiveTableTab] = useState<'all' | 'delayed'>('all');

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
  const spi = currentTarget > 0 ? (currentRealized / currentTarget).toFixed(2) : '1.00';

  const handleDownloadPDF = () => {
    generateSCurvePDF(project, workItems, viewGranularity);
    if (onAddAuditLog) {
      onAddAuditLog('Download PDF Analisis Kurva-S', `Mengunduh laporan analisis Kurva-S (${viewGranularity})`);
    }
  };

  const handleDownloadExcel = () => {
    generateExcelReport('Kurva-S', project, workItems, [], [], []);
    if (onAddAuditLog) {
      onAddAuditLog('Export Excel Kurva-S', 'Mengekspor data tabulasi Kurva-S ke Excel');
    }
  };

  const filteredTableData = rawData.filter((pt) => {
    if (activeTableTab === 'delayed') {
      return pt.deviationPercent !== undefined && pt.deviationPercent < 0;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
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

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Granularity Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewGranularity('Weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewGranularity === 'Weekly'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-white'
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setViewGranularity('Monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewGranularity === 'Monthly'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-white'
              }`}
            >
              Bulanan
            </button>
          </div>

          {/* Dedicated Download PDF Button */}
          <button
            id="download-scurve-pdf-btn"
            onClick={handleDownloadPDF}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/25 transition-all cursor-pointer"
            title="Download Dokumen PDF Resmi Kurva-S Lengkap dengan Grafik Vektor dan Tabulasi Deviasi"
          >
            <FileText className="w-4 h-4" />
            <span>Download PDF Kurva-S</span>
          </button>

          <button
            onClick={handleDownloadExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Stats Callouts */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <span className="text-xs font-semibold text-slate-400 block">Target Schedule Rencana</span>
          <span className="text-2xl font-black text-orange-500 mt-1 block">{currentTarget}%</span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Kumulatif Target s/d Minggu Ini</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <span className="text-xs font-semibold text-slate-400 block">Realisasi Fisik Lapangan</span>
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
            <span className="text-xs font-semibold block">Deviasi Jadwal (Variance)</span>
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
            {currentDev < -5 ? 'Peringatan: Keterlambatan >5%!' : 'Proyek Berjalan Sesuai Jadwal'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <span className="text-xs font-semibold text-slate-400 block">Schedule Index (SPI)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{spi}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${Number(spi) < 1 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {Number(spi) < 1 ? 'SPI < 1.0 (Behind)' : 'SPI ≥ 1.0 (On Track)'}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Earned Value vs Planned Value</span>
        </div>
      </div>

      {/* Chart Card */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Grafik Kumulatif Kurva-S & Bar Deviasi Mingguan
            </h3>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 inline-block" />
              <span>Target Rencana</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span>Realisasi Fisik</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-500 inline-block" />
              <span>Deviasi</span>
            </div>
          </div>
        </div>

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

      {/* Tabular Schedule Variance Summary */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Tabel Tabulasi Progres & Evaluasi Deviasi Berkala
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rekapitulasi target vs realisasi yang diexport ke dalam dokumen PDF resmi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                onClick={() => setActiveTableTab('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTableTab === 'all'
                    ? 'bg-slate-900 dark:bg-slate-700 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Semua Periode
              </button>
              <button
                onClick={() => setActiveTableTab('delayed')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTableTab === 'delayed'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-red-500'
                }`}
              >
                Periode Deviasi Negatif
              </button>
            </div>

            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-1.5 rounded-xl bg-red-600/10 hover:bg-red-600 text-red-600 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-red-600/30 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">Periode</th>
                <th className="p-3">Tanggal Opname</th>
                <th className="p-3 text-right">Target Kumulatif (%)</th>
                <th className="p-3 text-right">Realisasi Fisik (%)</th>
                <th className="p-3 text-right">Deviasi Varian (%)</th>
                <th className="p-3 text-center">Status Kinerja</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredTableData.slice(0, 15).map((pt) => {
                const isDelayedPeriod = pt.deviationPercent !== undefined && pt.deviationPercent < 0;
                return (
                  <tr
                    key={pt.weekLabel}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="p-3 font-bold text-slate-900 dark:text-white">{pt.weekLabel}</td>
                    <td className="p-3 text-slate-500 dark:text-slate-400">{pt.date}</td>
                    <td className="p-3 text-right font-bold text-orange-600 dark:text-orange-400">
                      {pt.targetCumulativePercent.toFixed(1)}%
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {pt.realizedCumulativePercent !== undefined ? `${pt.realizedCumulativePercent.toFixed(1)}%` : '-'}
                    </td>
                    <td className="p-3 text-right font-black">
                      {pt.deviationPercent !== undefined ? (
                        <span className={isDelayedPeriod ? 'text-red-500' : 'text-emerald-500'}>
                          {pt.deviationPercent > 0 ? `+${pt.deviationPercent.toFixed(1)}%` : `${pt.deviationPercent.toFixed(1)}%`}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {pt.realizedCumulativePercent === undefined ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Rencana Kedepan
                        </span>
                      ) : isDelayedPeriod ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          Deviasi {pt.deviationPercent}%
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Sesuai Jadwal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
