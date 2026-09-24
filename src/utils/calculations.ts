import { WorkItem, PaymentTerm, SCurveDataPoint, ProjectInfo } from '../types';

/**
 * Format currency to Indonesian Rupiah (Rp)
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Short currency format (e.g., Rp 14.4 M)
 */
export function formatIDRShort(amount: number): string {
  if (amount >= 1000000000) {
    return `Rp ${(amount / 1000000000).toFixed(3)} Miliar`;
  }
  if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(1)} Juta`;
  }
  return formatIDR(amount);
}

/**
 * Calculate total physical progress realized %
 * Sum of (bobotPercent * realizedProgressPercent / 100)
 */
export function calculatePhysicalProgress(workItems: WorkItem[]): number {
  if (!workItems || workItems.length === 0) return 0;
  const totalWeight = workItems.reduce((acc, item) => acc + item.bobotPercent, 0);
  if (totalWeight === 0) return 0;

  const totalWeightedProgress = workItems.reduce(
    (acc, item) => acc + (item.bobotPercent * item.realizedProgressPercent) / 100,
    0
  );

  // Normalize to 100% total weight ratio just in case
  return Number(((totalWeightedProgress / (totalWeight / 100))).toFixed(2));
}

/**
 * Calculate target schedule progress % based on item weight & item target %
 */
export function calculateTargetProgress(workItems: WorkItem[]): number {
  if (!workItems || workItems.length === 0) return 0;
  const totalWeight = workItems.reduce((acc, item) => acc + item.bobotPercent, 0);
  if (totalWeight === 0) return 0;

  const totalWeightedTarget = workItems.reduce(
    (acc, item) => acc + (item.bobotPercent * item.targetProgressPercent) / 100,
    0
  );

  return Number(((totalWeightedTarget / (totalWeight / 100))).toFixed(2));
}

/**
 * Calculate schedule deviation: Realized % - Target %
 */
export function calculateDeviation(realized: number, target: number): number {
  return Number((realized - target).toFixed(2));
}

/**
 * Calculate days elapsed and days remaining
 */
export function calculateProjectDuration(project: ProjectInfo) {
  const start = new Date(project.startDate).getTime();
  const end = new Date(project.targetEndDate).getTime();
  const today = new Date('2026-08-31').getTime();

  const totalDays = Math.max(1, Math.round((end - start) / (1000 * 3600 * 24)));
  
  if (project.status === 'Belum Mulai') {
    return {
      totalDays,
      elapsedDays: 0,
      remainingDays: totalDays,
      timePercentage: 0,
    };
  }

  const elapsedDays = Math.max(0, Math.round((today - start) / (1000 * 3600 * 24)));
  const remainingDays = Math.max(0, Math.round((end - today) / (1000 * 3600 * 24)));

  return {
    totalDays,
    elapsedDays,
    remainingDays,
    timePercentage: Math.min(100, Math.max(0, Number(((elapsedDays / totalDays) * 100).toFixed(1)))),
  };
}

/**
 * Financial summary from payment terms
 */
export function calculateFinancialSummary(contractValue: number, terms: PaymentTerm[]) {
  const paidTerms = terms.filter((t) => t.status === 'Dibayar');
  const totalPaidGross = paidTerms.reduce((acc, t) => acc + t.grossValue, 0);
  const totalPaidNet = paidTerms.reduce((acc, t) => acc + t.netPayableValue, 0);
  const totalRetentionHeld = paidTerms.reduce((acc, t) => acc + t.retentionValue, 0);

  const financialProgressPercent = Number(((totalPaidGross / contractValue) * 100).toFixed(1));
  const remainingContractValue = contractValue - totalPaidGross;

  return {
    totalPaidGross,
    totalPaidNet,
    totalRetentionHeld,
    financialProgressPercent,
    remainingContractValue,
  };
}

/**
 * Generate weekly S-Curve data points for Recharts (Week 1 to Week 39)
 */
export function generateSCurveData(workItems: WorkItem[], projectStartDate?: string): SCurveDataPoint[] {
  const points: SCurveDataPoint[] = [];

  let startDate: Date;
  if (projectStartDate && !isNaN(new Date(projectStartDate).getTime())) {
    startDate = new Date(projectStartDate);
  } else {
    const validDates = workItems
      .map((w) => w.startDate)
      .filter(Boolean)
      .sort();
    startDate =
      validDates.length > 0 && !isNaN(new Date(validDates[0]).getTime())
        ? new Date(validDates[0])
        : new Date('2026-09-01');
  }

  const currentProgress = calculatePhysicalProgress(workItems);
  const isUnstarted = currentProgress === 0;
  const currentWeekIndex = isUnstarted ? 0 : 28;

  let accumTarget = 0;
  let accumRealized = 0;

  for (let week = 1; week <= 39; week++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + (week - 1) * 7);
    const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

    // Logistic S-Curve formula for planned target curve (0 to 100%)
    const x = (week - 20) / 5;
    const targetVal = 100 / (1 + Math.exp(-x));
    accumTarget = Math.min(100, Math.max(0, Math.round(targetVal * 10) / 10));

    let realizedVal: number | undefined;
    if (isUnstarted) {
      if (week === 1) {
        realizedVal = 0;
      }
    } else {
      if (week <= currentWeekIndex) {
        if (week <= 10) {
          realizedVal = accumTarget * 1.02;
        } else if (week <= 18) {
          realizedVal = accumTarget * 0.98;
        } else {
          realizedVal = accumTarget * 0.91;
        }
        accumRealized = Math.min(100, Math.max(0, Math.round(realizedVal * 10) / 10));
      } else {
        const catchupFactor = (week - currentWeekIndex) * 0.4;
        accumRealized = Math.min(100, Math.round((accumRealized + catchupFactor + 2.1) * 10) / 10);
      }
    }

    const dev = realizedVal !== undefined ? Number((realizedVal - accumTarget).toFixed(1)) : 0;

    points.push({
      weekLabel: `M${week}`,
      date: dateStr,
      targetCumulativePercent: accumTarget,
      realizedCumulativePercent: realizedVal as unknown as number,
      deviationPercent: realizedVal !== undefined ? dev : (undefined as unknown as number),
    });
  }

  const currentTarget = calculateTargetProgress(workItems);

  if (points[currentWeekIndex]) {
    points[currentWeekIndex].realizedCumulativePercent = currentProgress;
    points[currentWeekIndex].targetCumulativePercent = currentTarget;
    points[currentWeekIndex].deviationPercent = calculateDeviation(currentProgress, currentTarget);
  }

  return points;
}
