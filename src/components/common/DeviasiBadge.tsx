import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface DeviasiBadgeProps {
  deviationPercent: number;
}

export const DeviasiBadge: React.FC<DeviasiBadgeProps> = ({ deviationPercent }) => {
  const isAhead = deviationPercent >= 0;
  const isSevereLag = deviationPercent < -5;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
        isSevereLag
          ? 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30 animate-pulse'
          : isAhead
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      }`}
    >
      {isSevereLag ? (
        <AlertTriangle className="w-3.5 h-3.5" />
      ) : isAhead ? (
        <TrendingUp className="w-3.5 h-3.5" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5" />
      )}
      {deviationPercent > 0 ? `+${deviationPercent}%` : `${deviationPercent}%`}
      {isSevereLag && ' (Warning >5%)'}
    </span>
  );
};
