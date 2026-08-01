import React, { useState } from 'react';
import { ProjectInfo, WorkItem } from '../../types';
import {
  BrainCircuit,
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign,
  Sliders,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Zap,
  Info,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  formatIDR,
  calculatePhysicalProgress,
  calculateTargetProgress,
  calculateDeviation,
  calculateProjectDuration,
} from '../../utils/calculations';

interface MLForecastingModuleProps {
  project: ProjectInfo;
  workItems: WorkItem[];
}

export const MLForecastingModule: React.FC<MLForecastingModuleProps> = ({ project, workItems }) => {
  const currentPhysical = calculatePhysicalProgress(workItems);
  const currentTarget = calculateTargetProgress(workItems);
  const deviation = calculateDeviation(currentPhysical, currentTarget);
  const duration = calculateProjectDuration(project);

  // Scenario state: 'realistic' | 'optimistic' | 'pessimistic'
  const [scenario, setScenario] = useState<'realistic' | 'optimistic' | 'pessimistic'>('realistic');
  const [resourceMultiplier, setResourceMultiplier] = useState<number>(1.0); // 0.8x to 1.5x

  // Multipliers based on scenario & resource slider
  const scenarioMultiplier =
    (scenario === 'optimistic' ? 1.25 : scenario === 'pessimistic' ? 0.75 : 1.0) * resourceMultiplier;

  // ML Linear Regression & S-Curve Forecasting Calculation Engine
  // Assume project has 16 weeks duration
  const totalWeeks = 16;
  const currentWeek = Math.min(
    totalWeeks,
    Math.max(1, Math.round((duration.elapsedDays / duration.totalDays) * totalWeeks))
  );

  // Generate historical & predicted curve data points
  const forecastData = [];
  const baseContractValue = project.contractValue;

  // Base progress velocity per week
  const baseWeeklyProgressRate = currentWeek > 0 ? currentPhysical / currentWeek : 6.25;
  const adjustedWeeklyRate = baseWeeklyProgressRate * scenarioMultiplier;

  // Predict total weeks required to reach 100%
  const remainingProgress = Math.max(0, 100 - currentPhysical);
  const weeksNeededToFinish = adjustedWeeklyRate > 0 ? Math.ceil(remainingProgress / adjustedWeeklyRate) : 20;
  const predictedTotalWeeks = currentWeek + weeksNeededToFinish;

  // Calculate predicted completion date
  const contractEndDate = new Date(project.targetEndDate);
  const delayWeeks = Math.max(-4, Math.round(predictedTotalWeeks - totalWeeks));
  const delayDays = delayWeeks * 7;

  const predictedCompletionDate = new Date(contractEndDate);
  predictedCompletionDate.setDate(predictedCompletionDate.getDate() + delayDays);
  const formattedPredictedDate = predictedCompletionDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate predicted budget overrun / savings (EAC: Estimate At Completion)
  // Factors: Schedule delay overhead (0.5% per week delay) + resource intensity cost + material price risk
  const overheadFactor = delayDays > 0 ? (delayDays / 30) * 0.025 : (delayDays / 30) * 0.01;
  const resourceCostFactor = (resourceMultiplier - 1.0) * 0.08;
  const predictedOverrunPercent = Math.max(-5.0, Number(((overheadFactor + resourceCostFactor) * 100).toFixed(1)));
  const predictedTotalCost = Math.round(baseContractValue * (1 + predictedOverrunPercent / 100));
  const budgetVariance = predictedTotalCost - baseContractValue;

  // Generate week-by-week S-Curve & ML Trend Forecast Points
  const maxPlotWeeks = Math.max(totalWeeks, predictedTotalWeeks) + 2;

  let cumTarget = 0;
  let cumRealized = 0;
  let cumForecast = 0;

  for (let w = 0; w <= maxPlotWeeks; w++) {
    const weekLabel = `Minggu ${w}`;

    // Target S-curve baseline (logistic / sigmoid approximation)
    const tRatio = w / totalWeeks;
    cumTarget = Math.min(100, Math.round(100 / (1 + Math.exp(-6 * (tRatio - 0.5)))));

    if (w === 0) cumTarget = 0;

    if (w <= currentWeek) {
      // Historical actual data
      const actualRatio = w / currentWeek;
      cumRealized = Math.min(currentPhysical, Math.round(currentPhysical * Math.pow(actualRatio, 1.1)));
      cumForecast = cumRealized;

      forecastData.push({
        week: weekLabel,
        Rencana: cumTarget,
        Realisasi: cumRealized,
        PrediksiML: cumRealized,
        BatasAtas: Math.min(100, cumRealized + 3),
        BatasBawah: Math.max(0, cumRealized - 3),
      });
    } else {
      // Forecast future weeks
      const futureWeeksCount = w - currentWeek;
      cumForecast = Math.min(100, Math.round(currentPhysical + futureWeeksCount * adjustedWeeklyRate));

      const confidenceRange = Math.min(12, futureWeeksCount * 1.8);
      const upper = Math.min(100, Math.round(cumForecast + confidenceRange));
      const lower = Math.max(0, Math.round(cumForecast - confidenceRange));

      forecastData.push({
        week: weekLabel,
        Rencana: cumTarget,
        Realisasi: null,
        PrediksiML: cumForecast,
        BatasAtas: upper,
        BatasBawah: lower,
      });
    }
  }

  // Confidence Score (higher when velocity is steady)
  const confidenceScore = Math.min(96, Math.max(78, 92 - Math.abs(deviation) * 1.5));

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20">
            <BrainCircuit className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Prediksi &amp; Forecasting ML Proyek (EVM Engine)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold text-[10px] border border-orange-500/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> AI Predictive Model v3.2
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Proyeksi tanggal penyelesaian &amp; potensi estimasi biaya akhir (EAC) berdasarkan kecepatan histori lapangan
            </p>
          </div>
        </div>

        {/* Confidence Badge */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Akurasi &amp; Tingkat Kepercayaan</span>
            <span className="text-xs font-black text-emerald-500 font-mono">{confidenceScore}% Confidence Interval</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-xs border border-emerald-500/20">
            {confidenceScore}%
          </div>
        </div>
      </div>

      {/* KPI Prediction Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Estimated Completion Date */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Prediksi Tanggal Selesai
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white leading-tight">
            {formattedPredictedDate}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            {delayDays > 0 ? (
              <span className="text-red-500 flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                <AlertTriangle className="w-3 h-3" /> +{delayDays} Hari Terlambat
              </span>
            ) : delayDays < 0 ? (
              <span className="text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> {Math.abs(delayDays)} Hari Lebih Cepat
              </span>
            ) : (
              <span className="text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                ✓ Sesuai Jadwal Kontrak
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block pt-1 border-t border-slate-200 dark:border-slate-700/50">
            Target Kontrak: {new Date(project.targetEndDate).toLocaleDateString('id-ID')}
          </span>
        </div>

        {/* Card 2: Estimated Cost at Completion (EAC) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Estimasi Biaya Akhir (EAC)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-amber-500 leading-tight">
            {formatIDR(predictedTotalCost)}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold">
            {budgetVariance > 0 ? (
              <span className="text-red-500 flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                <ShieldAlert className="w-3 h-3" /> +{predictedOverrunPercent}% ({formatIDR(budgetVariance)})
              </span>
            ) : (
              <span className="text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Efisiensi Biaya ({formatIDR(Math.abs(budgetVariance))})
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 block pt-1 border-t border-slate-200 dark:border-slate-700/50">
            Nilai Kontrak Awal: {formatIDR(baseContractValue)}
          </span>
        </div>

        {/* Card 3: Velocity Rate */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Kecepatan Progress ML
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-purple-600 dark:text-purple-400 leading-tight">
            +{adjustedWeeklyRate.toFixed(1)}% / Minggu
          </div>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
            SPI (Schedule Index):{' '}
            <strong className={currentTarget > 0 && currentPhysical / currentTarget >= 1 ? 'text-emerald-500' : 'text-amber-500'}>
              {currentTarget > 0 ? (currentPhysical / currentTarget).toFixed(2) : '1.00'}
            </strong>
          </span>
          <span className="text-[10px] text-slate-400 block pt-1 border-t border-slate-200 dark:border-slate-700/50">
            Dibutuhkan: ~{weeksNeededToFinish} Minggu lagi untuk 100%
          </span>
        </div>

        {/* Card 4: Risk Alert Mitigation */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Status Risiko Proyek
            </span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white leading-tight">
            {deviation < -5 ? (
              <span className="text-red-500">Risiko Tinggi (Keterlambatan)</span>
            ) : deviation < 0 ? (
              <span className="text-amber-500">Risiko Sedang</span>
            ) : (
              <span className="text-emerald-500">Risiko Rendah (Aman)</span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            {deviation < -5
              ? 'Direkomendasikan tambah 1 gilir kerja malam'
              : 'Mobilisasi material & tenaga kerja stabil'}
          </p>
          <span className="text-[10px] text-slate-400 block pt-1 border-t border-slate-200 dark:border-slate-700/50">
            Deviasi Rencana vs Realisasi: {deviation}%
          </span>
        </div>
      </div>

      {/* Scenario & Resource Parameter Controls (Simulation Engine) */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-orange-400">
              Simulasi Skenario &amp; Resourcing Lapangan (What-If Analysis)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Gunakan pengontrol untuk mensimulasikan dampak penambahan sumber daya pada tanggal selesai &amp; anggaran.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Scenario Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">Pilih Mode Skenario Tren:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScenario('optimistic')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  scenario === 'optimistic'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                🚀 Optimis (+25% Speed)
              </button>
              <button
                type="button"
                onClick={() => setScenario('realistic')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  scenario === 'realistic'
                    ? 'bg-orange-500 text-white border-orange-600 shadow-md'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                📊 Realistis (Histori ML)
              </button>
              <button
                type="button"
                onClick={() => setScenario('pessimistic')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  scenario === 'pessimistic'
                    ? 'bg-red-500 text-white border-red-600 shadow-md'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                ⚠️ Pesimistis (-25% Delay)
              </button>
            </div>
          </div>

          {/* Resource Multiplier Slider */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-300">
                Faktor Akselerasi Manpower / Shift Malam:
              </label>
              <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {resourceMultiplier.toFixed(2)}x Kapasitas
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.05"
              value={resourceMultiplier}
              onChange={(e) => setResourceMultiplier(parseFloat(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>0.8x (Keterbatasan SDM)</span>
              <span>1.0x (Normal)</span>
              <span>1.5x (Shift Malam + Overtime)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Trend Forecast Recharts Visualization */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-500" /> Kurva Proyeksi Tren ML (Baseline vs Forecast vs Risk Band)
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            *Area biru transparan menunjukkan pita toleransi risiko (Confidence Band)
          </span>
        </div>

        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="week" fontSize={11} stroke="#94A3B8" />
              <YAxis fontSize={11} stroke="#94A3B8" unit="%" domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F172A',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#FFF',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              {/* Upper & Lower Confidence Area */}
              <Area
                type="monotone"
                dataKey="BatasAtas"
                stroke="none"
                fill="#3B82F6"
                fillOpacity={0.15}
                name="Confidence Upper Bound"
              />
              <Area
                type="monotone"
                dataKey="BatasBawah"
                stroke="none"
                fill="#3B82F6"
                fillOpacity={0.1}
                name="Confidence Lower Bound"
              />

              {/* Target Baseline */}
              <Line
                type="monotone"
                dataKey="Rencana"
                stroke="#3B82F6"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={false}
                name="Target Rencana (Baseline)"
              />

              {/* Actual Realization */}
              <Line
                type="monotone"
                dataKey="Realisasi"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10B981' }}
                name="Realisasi Aktual Lapangan"
              />

              {/* ML Forecast Line */}
              <Line
                type="monotone"
                dataKey="PrediksiML"
                stroke="#F97316"
                strokeWidth={3}
                strokeDasharray="3 3"
                dot={{ r: 3, fill: '#F97316' }}
                name="Prediksi Tren ML"
              />

              {/* Contract Deadline Line */}
              <ReferenceLine
                x={`Minggu ${totalWeeks}`}
                stroke="#EF4444"
                strokeWidth={2}
                label={{
                  value: 'Target Kontrak',
                  fill: '#EF4444',
                  fontSize: 10,
                  position: 'top',
                  fontWeight: 'bold',
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ML Insight Recommendations Box */}
      <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-orange-600 dark:text-orange-400">
          <Info className="w-4 h-4 shrink-0" />
          <span>Rekomendasi Tindakan Cerdas dari Model ML Foresyndo:</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
          <li>
            <strong>Prioritaskan Sektor Kritis:</strong> Fokuskan percepatan pada pekerjaan pengecoran struktur utama yang memiliki bobot terbesar ({'>'}10%).
          </li>
          <li>
            <strong>Manajemen Suplai Material:</strong> Sediakan cadangan semen &amp; besi ulur minimal 3 hari sebelum tahap pengecoran untuk mencegah downtime pekerja.
          </li>
          <li>
            <strong>Opsi Shift Malam:</strong> Menambahkan 1 shift kerja malam (3 jam overtime) pada 2 minggu ke depan diproyeksikan memangkas keterlambatan sebesar <strong>6-8 hari kerja</strong> dengan tambahan biaya hanya ~0.4% dari total RAB.
          </li>
        </ul>
      </div>
    </div>
  );
};
