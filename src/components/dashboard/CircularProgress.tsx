import React from 'react';

interface CircularProgressProps {
  percentage: number;
  label: string;
  sublabel?: string;
  color: 'emerald' | 'blue' | 'orange' | 'purple';
  size?: number;
  strokeWidth?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  label,
  sublabel,
  color,
  size = 180,
  strokeWidth = 14,
}) => {
  const clampedPercent = Math.min(100, Math.max(0, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  const colorMap = {
    emerald: {
      stroke: '#10B981',
      glow: 'rgba(16, 185, 129, 0.25)',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    },
    blue: {
      stroke: '#3B82F6',
      glow: 'rgba(59, 130, 246, 0.25)',
      badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    },
    orange: {
      stroke: '#F97316',
      glow: 'rgba(249, 115, 22, 0.25)',
      badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30',
    },
    purple: {
      stroke: '#8B5CF6',
      glow: 'rgba(139, 92, 246, 0.25)',
      badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    },
  };

  const theme = colorMap[color];

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg hover:shadow-xl transition-all relative overflow-hidden group">
      {/* Glow aura */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-2xl"
        style={{ background: `radial-gradient(circle at center, ${theme.glow} 0%, transparent 70%)` }}
      />

      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100 dark:text-slate-800"
            fill="transparent"
          />
          {/* Animated progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {clampedPercent}%
          </span>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
            {label}
          </span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${theme.badge}`}>
          {sublabel || label}
        </span>
      </div>
    </div>
  );
};
