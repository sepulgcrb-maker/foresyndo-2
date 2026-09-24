import React, { useState, useMemo } from 'react';
import { WorkItem, ProjectInfo } from '../../types';
import { BarChart3, ZoomIn, ZoomOut, Calendar, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface GanttChartProps {
  workItems: WorkItem[];
  project?: ProjectInfo;
  onUpdateWorkItem?: (item: WorkItem) => void;
}

type ZoomMode = 'Weekly' | 'Monthly' | 'Yearly';

export const GanttChart: React.FC<GanttChartProps> = ({ workItems, project, onUpdateWorkItem }) => {
  const [zoomMode, setZoomMode] = useState<ZoomMode>('Weekly');

  // Dynamic timeline boundaries based on project start and target end dates
  const { projectStart, projectEnd, totalDurationMs, baseDate } = useMemo(() => {
    let startMs = project?.startDate ? new Date(project.startDate).getTime() : NaN;
    if (isNaN(startMs)) {
      const validStarts = workItems.map((w) => new Date(w.startDate).getTime()).filter((t) => !isNaN(t));
      startMs = validStarts.length > 0 ? Math.min(...validStarts) : new Date('2026-09-01').getTime();
    }

    let endMs = project?.targetEndDate ? new Date(project.targetEndDate).getTime() : NaN;
    if (isNaN(endMs)) {
      const validEnds = workItems.map((w) => new Date(w.endDate).getTime()).filter((t) => !isNaN(t));
      endMs = validEnds.length > 0 ? Math.max(...validEnds) : startMs + 273 * 86400000;
    }

    if (endMs <= startMs) {
      endMs = startMs + 90 * 86400000;
    }

    return {
      projectStart: startMs,
      projectEnd: endMs,
      totalDurationMs: endMs - startMs,
      baseDate: new Date(startMs),
    };
  }, [project?.startDate, project?.targetEndDate, workItems]);

  // Generate timeline headers dynamically based on zoomMode and project start
  const getTimelineHeaders = () => {
    if (zoomMode === 'Weekly') {
      const headers = [];
      const totalWeeks = Math.max(12, Math.ceil(totalDurationMs / (7 * 86400000)));
      for (let i = 1; i <= totalWeeks; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + (i - 1) * 7);
        headers.push({
          label: `M${i}`,
          subLabel: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        });
      }
      return headers;
    } else if (zoomMode === 'Monthly') {
      const headers = [];
      const startD = new Date(baseDate);
      const endD = new Date(projectEnd);
      let curr = new Date(startD.getFullYear(), startD.getMonth(), 1);
      let monthIdx = 1;
      while (curr <= endD || headers.length < 6) {
        headers.push({
          label: curr.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
          subLabel: `Bulan ${monthIdx}`,
        });
        curr.setMonth(curr.getMonth() + 1);
        monthIdx++;
        if (headers.length >= 24) break;
      }
      return headers;
    } else {
      // Yearly
      const startYear = new Date(baseDate).getFullYear();
      const endYear = new Date(projectEnd).getFullYear();
      const headers = [];
      for (let yr = startYear; yr <= Math.max(startYear, endYear); yr++) {
        headers.push(
          { label: `Tahun ${yr} (Semester I)`, subLabel: 'Kuartal 1 & 2' },
          { label: `Tahun ${yr} (Semester II)`, subLabel: 'Kuartal 3 & 4' }
        );
      }
      return headers;
    }
  };

  const headers = getTimelineHeaders();

  // Helper to calculate position % (left and width) for each item bar
  const calculateBarPosition = (startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr).getTime();
    const end = new Date(endDateStr).getTime();

    const leftPercent = Math.max(0, Math.min(100, ((start - projectStart) / totalDurationMs) * 100));
    const widthPercent = Math.max(2, Math.min(100 - leftPercent, ((end - start) / totalDurationMs) * 100));

    return { leftPercent, widthPercent };
  };

  return (
    <div className="space-y-4">
      {/* Header Bar & Zoom Controls */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Gantt Chart Interactive Proyek</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualisasi Timeline & Skala Pengerjaan Gedung FORESYNDO 2
          </p>
        </div>

        {/* Zoom Mode Toggle Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-xs font-semibold text-slate-400 px-2 flex items-center gap-1">
            <ZoomIn className="w-3.5 h-3.5" /> Skala Zoom:
          </span>
          {(['Weekly', 'Monthly', 'Yearly'] as ZoomMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setZoomMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                zoomMode === mode
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Gantt Chart Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Timeline Header Row */}
            <div className="flex bg-slate-900 text-white border-b border-slate-800 text-xs font-bold">
              <div className="w-72 p-3 shrink-0 border-r border-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-400" /> Item Pekerjaan
              </div>
              <div className="flex-1 flex divide-x divide-slate-800">
                {headers.map((h, idx) => (
                  <div key={idx} className="flex-1 p-2 text-center text-[10px] truncate">
                    <span className="block font-bold text-slate-200">{h.label}</span>
                    <span className="block text-[9px] text-slate-400 font-normal">{h.subLabel}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gantt Rows */}
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {workItems.map((item) => {
                const { leftPercent, widthPercent } = calculateBarPosition(item.startDate, item.endDate);

                return (
                  <div
                    key={item.id}
                    className="flex items-center text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors py-2.5"
                  >
                    {/* Item Name Column */}
                    <div className="w-72 px-3 shrink-0 border-r border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-orange-500/10 text-orange-500 font-bold flex items-center justify-center text-[10px] shrink-0">
                          {item.no}
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-slate-900 dark:text-white block truncate">{item.name}</span>
                          <span className="text-[10px] text-slate-400">
                            {item.startDate} &rarr; {item.endDate} ({item.bobotPercent}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Bar Track */}
                    <div className="flex-1 px-4 relative h-8 flex items-center">
                      {/* Grid Background Lines */}
                      <div className="absolute inset-0 flex divide-x divide-slate-100 dark:divide-slate-800/60 pointer-events-none">
                        {headers.map((_, idx) => (
                          <div key={idx} className="flex-1" />
                        ))}
                      </div>

                      {/* Bar */}
                      <div
                        className="absolute h-6 rounded-lg shadow-sm border border-black/10 transition-all group cursor-pointer flex items-center px-2 overflow-hidden"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          backgroundColor:
                            item.status === 'Selesai'
                              ? '#10B981'
                              : item.status === 'Terlambat'
                              ? '#EF4444'
                              : '#F97316',
                        }}
                      >
                        {/* Progress Fill inside bar */}
                        <div
                          className="absolute inset-y-0 left-0 bg-black/20"
                          style={{ width: `${item.realizedProgressPercent}%` }}
                        />

                        {/* Label on Bar */}
                        <span className="relative z-10 text-[10px] font-black text-white truncate shadow-xs">
                          {item.realizedProgressPercent}% ({item.status})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
