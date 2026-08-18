import { MaterialItem, WorkItem, MaterialProjection, MaterialProjectionConfig } from '../types';

/**
 * Standard sector mapping fallback for materials when not explicitly specified
 */
export const DEFAULT_MATERIAL_SECTOR_MAP: Record<string, number[]> = {
  'MAT-01': [1, 2, 4, 10], // Semen PCC -> Pondasi, Struktur, Dinding, Kolam
  'MAT-02': [1, 2],       // Besi Ulur D16 -> Pondasi, Struktur
  'MAT-03': [4],          // Bata Ringan -> Dinding
  'MAT-04': [1, 2],       // Ready Mix Beton K-350 -> Pondasi, Struktur Lantai
  'MAT-05': [1, 2],       // Besi Polos D10 -> Sengkang
  'MAT-06': [1, 2, 4],    // Pasir Pasang/Cor -> Pondasi, Struktur, Plesteran
  'MAT-07': [4],          // Mortar Perekat -> Dinding
  'MAT-08': [4, 5, 11],   // Granit Tile -> Dinding/Lantai, KM, Cafe
  'MAT-09': [4, 10, 12],  // Cat Weathershield -> Arsitektur, Kolam, Eksternal
  'MAT-10': [7],          // Pipa PVC Plumbing -> MEP Plumbing
  'MAT-11': [6],          // Kabel Listrik NYM -> MEP Listrik
  'MAT-12': [8],          // Pipa Hydrant Sch 40 -> MEP Fire Fighting
};

/**
 * Default material lead times (days from PO to warehouse delivery)
 */
export const DEFAULT_MATERIAL_LEAD_TIMES: Record<string, number> = {
  'MAT-01': 3, // Semen (Supplier Lokal Majalengka/Cirebon)
  'MAT-02': 7, // Besi Krakatau Steel (Pengiriman Pabrik)
  'MAT-03': 4, // Bata Ringan Hebel
  'MAT-04': 2, // Ready Mix Batching Plant
  'MAT-05': 5, // Besi Polos
  'MAT-06': 2, // Pasir
  'MAT-07': 3, // Mortar
  'MAT-08': 8, // Granit Tile
  'MAT-09': 4, // Cat
  'MAT-10': 5, // Pipa PVC
  'MAT-11': 4, // Kabel Listrik
  'MAT-12': 7, // Pipa Hydrant
};

/**
 * Default baseline daily burn rates when not yet recorded
 */
export const DEFAULT_DAILY_BURN_RATES: Record<string, number> = {
  'MAT-01': 35,  // 35 Sak/hari
  'MAT-02': 28,  // 28 Batang/hari
  'MAT-03': 4.5, // 4.5 m³/hari
  'MAT-04': 8,   // 8 m³/hari
  'MAT-05': 22,  // 22 Batang/hari
  'MAT-06': 6,   // 6 m³/hari
  'MAT-07': 12,  // 12 Sak/hari
  'MAT-08': 18,  // 18 m²/hari
  'MAT-09': 3,   // 3 Pail/hari
  'MAT-10': 15,  // 15 Batang/hari
  'MAT-11': 6,   // 6 Roll/hari
  'MAT-12': 4,   // 4 Batang/hari
};

/**
 * Format a Date object to YYYY-MM-DD string
 */
function formatDateISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Add days to a date string (or current project anchor date)
 */
function addDays(baseDateStr: string, days: number): string {
  const d = new Date(baseDateStr);
  if (isNaN(d.getTime())) {
    const now = new Date('2026-09-01');
    now.setDate(now.getDate() + Math.round(days));
    return formatDateISO(now);
  }
  d.setDate(d.getDate() + Math.round(days));
  return formatDateISO(d);
}

/**
 * Calculate comprehensive Material Demand Projections & Early Warnings
 */
export function calculateMaterialProjections(
  materials: MaterialItem[],
  workItems: WorkItem[],
  config: MaterialProjectionConfig = {
    speedMultiplier: 1.0,
    wasteContingencyPercent: 5,
    alertThresholdDays: 14,
  },
  currentDateAnchor: string = '2026-09-01'
): MaterialProjection[] {
  return materials.map((material) => {
    // 1. Identify linked sector work items
    const sectorNos =
      material.relatedSectorNos && material.relatedSectorNos.length > 0
        ? material.relatedSectorNos
        : DEFAULT_MATERIAL_SECTOR_MAP[material.id] || [1, 2];

    const linkedWorkItems = workItems.filter((wi) => sectorNos.includes(wi.no));
    const relatedWorkItemNames = linkedWorkItems.map((wi) => wi.name);
    const relatedSectors = linkedWorkItems.map((wi) => `Sektor ${wi.no}`);

    // 2. Calculate remaining progress % weighted by work item weights
    let totalWeight = 0;
    let weightedRemainingPercent = 0;

    if (linkedWorkItems.length > 0) {
      linkedWorkItems.forEach((wi) => {
        const weight = wi.bobotPercent || 1;
        const remainingProg = Math.max(0, 100 - wi.realizedProgressPercent);
        weightedRemainingPercent += weight * remainingProg;
        totalWeight += weight;
      });
    }

    const avgRemainingProgressPercent =
      totalWeight > 0 ? Number((weightedRemainingPercent / totalWeight).toFixed(1)) : 100;

    // 3. Projected remaining demand with waste tolerance
    const wasteFactor = 1 + config.wasteContingencyPercent / 100;
    const projectedTotalDemand = Math.round(material.volumeTotal * wasteFactor);
    const projectedRemainingDemand = Math.max(
      0,
      Math.round(material.volumeTotal * (avgRemainingProgressPercent / 100) * wasteFactor)
    );

    // 4. Burn Rate & Stock Runway
    const baseBurnRate =
      material.dailyBurnRate || DEFAULT_DAILY_BURN_RATES[material.id] || Math.max(1, Math.round(material.volumeTotal / 120));
    const effectiveDailyBurnRate = Number((baseBurnRate * config.speedMultiplier).toFixed(2));

    const leadTime = material.leadTimeDays || DEFAULT_MATERIAL_LEAD_TIMES[material.id] || 5;

    // Days remaining of current physical stock
    const daysOfStockRemaining =
      effectiveDailyBurnRate > 0
        ? Number((material.stockRemaining / effectiveDailyBurnRate).toFixed(1))
        : 999;

    // Dates calculation
    const estimatedStockoutDate = addDays(currentDateAnchor, daysOfStockRemaining);
    const recommendedOrderDays = Math.max(0, daysOfStockRemaining - leadTime);
    const recommendedOrderDate = addDays(currentDateAnchor, recommendedOrderDays);

    // 5. Shortage & Cost
    const stockDifference = material.stockRemaining - projectedRemainingDemand;
    const isDeficit = stockDifference < 0;
    const shortageQuantity = isDeficit ? Math.abs(stockDifference) : 0;
    const shortageCostIDR = shortageQuantity * material.pricePerUnit;

    // Recommended order quantity includes safety stock threshold
    const recommendedOrderQuantity = isDeficit
      ? shortageQuantity + material.minAlertStock
      : material.stockRemaining <= material.minAlertStock
      ? material.minAlertStock - material.stockRemaining + Math.round(material.minAlertStock * 0.5)
      : 0;

    // 6. Urgency Status & Early Warning Reason
    let urgencyStatus: 'Kritis' | 'Waspada' | 'Aman' = 'Aman';
    let urgencyReason = 'Stok persediaan saat ini memadai untuk sisa volume pekerjaan terkait.';

    if (daysOfStockRemaining <= leadTime || material.stockRemaining <= material.minAlertStock * 0.5 || (isDeficit && daysOfStockRemaining <= 7)) {
      urgencyStatus = 'Kritis';
      urgencyReason = `PERINGATAN KRITIS: Stok habis dalam ${daysOfStockRemaining} hari (Lead time supplier: ${leadTime} hari). Terbitkan PO hari ini agar operasional lapangan tidak terhenti!`;
    } else if (
      daysOfStockRemaining <= config.alertThresholdDays ||
      material.stockRemaining <= material.minAlertStock ||
      isDeficit
    ) {
      urgencyStatus = 'Waspada';
      urgencyReason = `PERINGATAN DINI: Stok tersisa bertahan ${daysOfStockRemaining} hari. Terdapat defisit proyeksi ${shortageQuantity} ${material.unit}. Jadwalkan PO sebelum ${recommendedOrderDate}.`;
    }

    return {
      materialId: material.id,
      materialName: material.name,
      unit: material.unit,
      pricePerUnit: material.pricePerUnit,
      supplier: material.supplier,
      currentStock: material.stockRemaining,
      minAlertStock: material.minAlertStock,
      leadTimeDays: leadTime,
      dailyBurnRate: effectiveDailyBurnRate,
      relatedWorkItemNames,
      relatedSectors,
      avgRemainingProgressPercent,
      projectedTotalDemand,
      projectedRemainingDemand,
      stockDifference,
      isDeficit,
      shortageQuantity,
      shortageCostIDR,
      daysOfStockRemaining,
      estimatedStockoutDate,
      recommendedOrderDate,
      urgencyStatus,
      urgencyReason,
      recommendedOrderQuantity,
    };
  });
}

/**
 * Summary metrics of Material Projections
 */
export function summarizeMaterialProjections(projections: MaterialProjection[]) {
  const totalItems = projections.length;
  const criticalCount = projections.filter((p) => p.urgencyStatus === 'Kritis').length;
  const warningCount = projections.filter((p) => p.urgencyStatus === 'Waspada').length;
  const safeCount = projections.filter((p) => p.urgencyStatus === 'Aman').length;

  const totalProcurementDeficitCost = projections.reduce((acc, p) => acc + p.shortageCostIDR, 0);
  const totalRecommendedOrderCount = projections.filter((p) => p.recommendedOrderQuantity > 0).length;

  const avgStockRunwayDays =
    totalItems > 0
      ? Number(
          (
            projections.reduce((acc, p) => acc + Math.min(180, p.daysOfStockRemaining), 0) / totalItems
          ).toFixed(1)
        )
      : 0;

  return {
    totalItems,
    criticalCount,
    warningCount,
    safeCount,
    totalProcurementDeficitCost,
    totalRecommendedOrderCount,
    avgStockRunwayDays,
  };
}
