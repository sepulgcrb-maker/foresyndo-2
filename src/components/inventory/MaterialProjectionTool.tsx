import React, { useState, useMemo } from 'react';
import { MaterialItem, WorkItem, UserRole, MaterialProjectionConfig } from '../../types';
import {
  calculateMaterialProjections,
  summarizeMaterialProjections,
} from '../../utils/materialProjection';
import { formatIDR } from '../../utils/calculations';
import {
  AlertTriangle,
  ShieldCheck,
  TrendingDown,
  Clock,
  ShoppingCart,
  DollarSign,
  Sliders,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Boxes,
  Truck,
  Plus,
  FileSpreadsheet,
  Download,
  Flame,
  Zap,
  Info,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';

interface MaterialProjectionToolProps {
  materials: MaterialItem[];
  workItems: WorkItem[];
  userRole: UserRole;
  onUpdateMaterial?: (updated: MaterialItem) => void;
  onAddAuditLog?: (action: string, details: string) => void;
}

export const MaterialProjectionTool: React.FC<MaterialProjectionToolProps> = ({
  materials,
  workItems,
  userRole,
  onUpdateMaterial,
  onAddAuditLog,
}) => {
  // Simulator configuration state
  const [config, setConfig] = useState<MaterialProjectionConfig>({
    speedMultiplier: 1.0,
    wasteContingencyPercent: 5,
    alertThresholdDays: 14,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<'All' | 'Kritis' | 'Waspada' | 'Aman'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPOModalItem, setSelectedPOModalItem] = useState<{
    material: MaterialItem;
    orderQty: number;
    notes: string;
    expectedDate: string;
  } | null>(null);
  const [poSuccessMessage, setPoSuccessMessage] = useState<string>('');

  const canEdit = userRole === 'Direktur' || userRole === 'Site Manager' || userRole === 'Admin';

  // Calculate projections
  const projections = useMemo(() => {
    return calculateMaterialProjections(materials, workItems, config);
  }, [materials, workItems, config]);

  const summary = useMemo(() => {
    return summarizeMaterialProjections(projections);
  }, [projections]);

  // Categories available
  const categories = useMemo(() => {
    const set = new Set<string>();
    materials.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return ['All', ...Array.from(set)];
  }, [materials]);

  // Filtered projections
  const filteredProjections = useMemo(() => {
    return projections.filter((p) => {
      const matchSearch =
        p.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.materialId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.relatedWorkItemNames.some((n) => n.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchUrgency = filterUrgency === 'All' || p.urgencyStatus === filterUrgency;

      const mat = materials.find((m) => m.id === p.materialId);
      const matchCategory = selectedCategory === 'All' || (mat && mat.category === selectedCategory);

      return matchSearch && matchUrgency && matchCategory;
    });
  }, [projections, searchTerm, filterUrgency, selectedCategory, materials]);

  // Chart data 1: Stock vs Demand
  const chartStockVsDemand = useMemo(() => {
    return projections.slice(0, 8).map((p) => ({
      name: p.materialName.length > 12 ? p.materialName.substring(0, 12) + '...' : p.materialName,
      'Sisa Stok Fisik': p.currentStock,
      'Proyeksi Sisa Kebutuhan': p.projectedRemainingDemand,
      Defisit: p.shortageQuantity,
      unit: p.unit,
      status: p.urgencyStatus,
    }));
  }, [projections]);

  // Chart data 2: Runway Days vs Lead Time
  const chartRunway = useMemo(() => {
    return projections.map((p) => ({
      name: p.materialName.length > 14 ? p.materialName.substring(0, 14) + '...' : p.materialName,
      'Ketahanan Stok (Hari)': Math.min(120, p.daysOfStockRemaining),
      'Lead Time Supplier (Hari)': p.leadTimeDays,
      status: p.urgencyStatus,
    }));
  }, [projections]);

  // Handle PO Creation / Restock
  const handleOpenPOModal = (p: typeof projections[0]) => {
    const mat = materials.find((m) => m.id === p.materialId);
    if (!mat) return;
    setSelectedPOModalItem({
      material: mat,
      orderQty: p.recommendedOrderQuantity > 0 ? p.recommendedOrderQuantity : Math.round(mat.volumeTotal * 0.25),
      notes: `Order restok untuk pemenuhan sisa pekerjaan Sektor (${p.relatedSectors.join(', ')})`,
      expectedDate: p.recommendedOrderDate || new Date().toISOString().split('T')[0],
    });
  };

  const handleConfirmPOOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOModalItem || !onUpdateMaterial) return;

    const { material, orderQty, notes } = selectedPOModalItem;
    if (orderQty <= 0) return;

    const updated: MaterialItem = {
      ...material,
      volumeTotal: material.volumeTotal + orderQty,
      stockRemaining: material.stockRemaining + orderQty,
      arrivalDate: selectedPOModalItem.expectedDate,
    };

    onUpdateMaterial(updated);

    if (onAddAuditLog) {
      onAddAuditLog(
        'Pengadaan Material Baru (PO)',
        `Penerbitan PO ${orderQty} ${material.unit} untuk ${material.name} (${formatIDR(orderQty * material.pricePerUnit)}) - ${notes}`
      );
    }

    setPoSuccessMessage(`PO berhasil diproses! Stok ${material.name} bertambah +${orderQty} ${material.unit}.`);
    setSelectedPOModalItem(null);
    setTimeout(() => setPoSuccessMessage(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Critical Materials Exist */}
      {summary.criticalCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-red-500/40">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white/20 rounded-2xl animate-bounce">
              <Flame className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white text-red-700 text-[10px] font-black uppercase tracking-wider">
                  Peringatan Dini Kritis
                </span>
                <span className="text-xs font-bold text-red-100">
                  {summary.criticalCount} Material Terancam Habis Sebelum PO Datang!
                </span>
              </div>
              <p className="text-xs text-red-100/90 mt-1">
                Laju pemakaian saat ini melebihi sisa hari pengiriman lead time supplier. Lakukan pemesanan darurat segera untuk mencegah penghentian pekerjaan.
              </p>
            </div>
          </div>

          <button
            onClick={() => setFilterUrgency('Kritis')}
            className="px-4 py-2 rounded-xl bg-white text-red-700 hover:bg-red-50 font-black text-xs flex items-center gap-1.5 shadow-lg transition-all shrink-0 cursor-pointer"
          >
            Lihat {summary.criticalCount} Material Kritis <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {poSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-lg flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2 font-bold text-xs">
            <CheckCircle2 className="w-5 h-5" />
            {poSuccessMessage}
          </div>
          <button onClick={() => setPoSuccessMessage('')} className="p-1 hover:bg-emerald-600 rounded-lg">
            ✕
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Critical & Warnings */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Risiko Stok</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-500">{summary.criticalCount}</span>
            <span className="text-xs font-bold text-slate-400">Kritis</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-2xl font-black text-amber-500">{summary.warningCount}</span>
            <span className="text-xs font-bold text-slate-400">Waspada</span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            {summary.safeCount} material dalam batas aman
          </span>
        </div>

        {/* Card 2: Deficit Procurement Cost */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estimasi Defisit Pengadaan</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-2 block">
            {formatIDR(summary.totalProcurementDeficitCost)}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Biaya sisa kebutuhan untuk menuntaskan 100% volume
          </span>
        </div>

        {/* Card 3: Avg Runway Days */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rata-Rata Ketahanan Stok</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2 block">
            {summary.avgStockRunwayDays} Hari
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Berdasarkan laju pemakaian harian ({config.speedMultiplier}x kecepatan)
          </span>
        </div>

        {/* Card 4: Recommended PO Count */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Rekomendasi Penerbitan PO</span>
            <div className="p-2 rounded-xl bg-orange-500 text-white">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-orange-400 mt-2 block">
            {summary.totalRecommendedOrderCount} Item PO
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Perlu diorder sebelum deadline lead time supplier
          </span>
        </div>
      </div>

      {/* Dynamic Simulation Control Box */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-500">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                Simulasi Laju Pemakaian &amp; Faktor Beban Lapangan
                <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black">
                  Realtime Calculation
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Atur skenario lembur percepatan dan toleransi susut / waste material konstruksi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setConfig({
                  speedMultiplier: 1.0,
                  wasteContingencyPercent: 5,
                  alertThresholdDays: 14,
                })
              }
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reset Parameter Normal
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Slider 1: Speed Multiplier */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Kecepatan Kerja / Lembur:
              </span>
              <span className="font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/50 px-2 py-0.5 rounded-lg border border-orange-500/20">
                {config.speedMultiplier}x ({config.speedMultiplier === 1 ? 'Normal' : config.speedMultiplier === 1.25 ? 'Percepatan' : config.speedMultiplier === 1.5 ? 'Lembur 2 Shift' : 'Kejar Target Maksimal'})
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.0"
              step="0.1"
              value={config.speedMultiplier}
              onChange={(e) => setConfig({ ...config, speedMultiplier: parseFloat(e.target.value) })}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0.8x Lambat</span>
              <span>1.0x Standar</span>
              <span>1.5x Lembur</span>
              <span>2.0x Maksimal</span>
            </div>
          </div>

          {/* Slider 2: Waste Contingency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" /> Toleransi Susut / Waste SNI:
              </span>
              <span className="font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-lg border border-blue-500/20">
                +{config.wasteContingencyPercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={config.wasteContingencyPercent}
              onChange={(e) => setConfig({ ...config, wasteContingencyPercent: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% Tanpa Susut</span>
              <span>5% Standar PU</span>
              <span>10% Kompleks</span>
              <span>15% Ekstrem</span>
            </div>
          </div>

          {/* Slider 3: Alert Threshold Days */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-rose-500" /> Ambang Peringatan Dini:
              </span>
              <span className="font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-lg border border-rose-500/20">
                ≤ {config.alertThresholdDays} Hari
              </span>
            </div>
            <input
              type="range"
              min="7"
              max="30"
              step="1"
              value={config.alertThresholdDays}
              onChange={(e) => setConfig({ ...config, alertThresholdDays: parseInt(e.target.value) })}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>7 Hari (Mendesak)</span>
              <span>14 Hari (2 Minggu)</span>
              <span>21 Hari</span>
              <span>30 Hari (1 Bulan)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Sisa Stok Fisik vs Proyeksi Sisa Kebutuhan */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-orange-500" /> Sisa Stok Fisik vs Proyeksi Kebutuhan Sektor
            </h3>
            <span className="text-[10px] text-slate-400">Top 8 Material</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartStockVsDemand} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={10} stroke="#94A3B8" />
                <YAxis fontSize={10} stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Sisa Stok Fisik" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Proyeksi Sisa Kebutuhan" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Defisit" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Runway Days vs Lead Time */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-500" /> Runway Ketahanan Stok (Hari) vs Lead Time PO
            </h3>
            <span className="text-[10px] text-slate-400">Estimasi Hari Bertahan</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRunway} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={10} stroke="#94A3B8" />
                <YAxis fontSize={10} stroke="#94A3B8" />
                <ReferenceLine y={14} stroke="#F59E0B" strokeDasharray="3 3" label={{ value: 'Batas 14 Hari', fill: '#F59E0B', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#FFF',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Ketahanan Stok (Hari)" radius={[4, 4, 0, 0]}>
                  {chartRunway.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.status === 'Kritis' ? '#EF4444' : entry.status === 'Waspada' ? '#F59E0B' : '#10B981'}
                    />
                  ))}
                </Bar>
                <Bar dataKey="Lead Time Supplier (Hari)" fill="#64748B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Table: Projection Analytics & Early Warning Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-5 h-5 text-orange-500" /> Analisis Proyeksi Kebutuhan &amp; Peringatan Dini Stok
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Korelasi sisa bobot/volume pekerjaan Time Schedule dengan ketersediaan stok fisik gudang
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari material / sektor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Urgency Filter */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['All', 'Kritis', 'Waspada', 'Aman'] as const).map((urg) => (
                <button
                  key={urg}
                  onClick={() => setFilterUrgency(urg)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterUrgency === urg
                      ? urg === 'Kritis'
                        ? 'bg-red-500 text-white shadow-sm'
                        : urg === 'Waspada'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : urg === 'Aman'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-900 dark:bg-slate-700 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {urg === 'All' ? 'Semua' : urg}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            {categories.length > 2 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'Semua Kategori' : c}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-3.5">Material &amp; Supplier</th>
                <th className="py-3.5 px-3">Sektor Terkait (Time Schedule)</th>
                <th className="py-3.5 px-3 text-center">Sisa Progress Sektor</th>
                <th className="py-3.5 px-3 text-right">Laju Pakai Rata-rata</th>
                <th className="py-3.5 px-3 text-right">Stok Saat Ini</th>
                <th className="py-3.5 px-3 text-right">Proyeksi Sisa Kebutuhan</th>
                <th className="py-3.5 px-3 text-center">Ketahanan Stok</th>
                <th className="py-3.5 px-3 text-center">Peringatan Dini</th>
                <th className="py-3.5 px-3 text-right">Rekomendasi PO</th>
                <th className="py-3.5 px-3 text-center w-28">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredProjections.map((p) => {
                const isCritical = p.urgencyStatus === 'Kritis';
                const isWarning = p.urgencyStatus === 'Waspada';

                return (
                  <tr
                    key={p.materialId}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isCritical
                        ? 'bg-red-50/40 dark:bg-red-950/10'
                        : isWarning
                        ? 'bg-amber-50/30 dark:bg-amber-950/10'
                        : ''
                    }`}
                  >
                    {/* Material Name & Supplier */}
                    <td className="py-3 px-3.5">
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] text-orange-500 font-black">{p.materialId}</span>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{p.materialName}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Truck className="w-3 h-3" /> {p.supplier}
                        </span>
                      </div>
                    </td>

                    {/* Sektor Terkait */}
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {p.relatedSectors.map((sec, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold border border-slate-200 dark:border-slate-700"
                          >
                            {sec}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Sisa Progress Sektor */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {p.avgRemainingProgressPercent}%
                        </span>
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-orange-500 h-full rounded-full"
                            style={{ width: `${Math.max(5, p.avgRemainingProgressPercent)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Laju Pakai Rata-rata */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                      <div>
                        <span>{p.dailyBurnRate} {p.unit}</span>
                        <span className="text-[10px] text-slate-400 font-normal block">/ hari</span>
                      </div>
                    </td>

                    {/* Stok Saat Ini */}
                    <td className="py-3 px-3 text-right">
                      <span className={`font-black text-xs ${isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {p.currentStock.toLocaleString('id-ID')} {p.unit}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Min: {p.minAlertStock}</span>
                    </td>

                    {/* Proyeksi Sisa Kebutuhan */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">
                        {p.projectedRemainingDemand.toLocaleString('id-ID')} {p.unit}
                      </span>
                      {p.isDeficit && (
                        <span className="text-[10px] text-red-500 font-bold block">
                          Defisit: -{p.shortageQuantity.toLocaleString('id-ID')} {p.unit}
                        </span>
                      )}
                    </td>

                    {/* Ketahanan Stok (Runway) */}
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                            isCritical
                              ? 'bg-red-500 text-white shadow-sm shadow-red-500/20'
                              : isWarning
                              ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {p.daysOfStockRemaining >= 999 ? '∞' : `${p.daysOfStockRemaining} Hari`}
                        </span>
                        <span className="text-[9px] text-slate-400 mt-0.5">
                          Habis: {p.estimatedStockoutDate}
                        </span>
                      </div>
                    </td>

                    {/* Status Peringatan Dini */}
                    <td className="py-3 px-3 text-center">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider animate-pulse shadow-md shadow-red-600/30">
                          <Flame className="w-3 h-3 text-yellow-300" /> Kritis (Habis)
                        </span>
                      ) : isWarning ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3" /> Waspada PO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3" /> Stok Aman
                        </span>
                      )}
                    </td>

                    {/* Rekomendasi PO */}
                    <td className="py-3 px-3 text-right">
                      {p.recommendedOrderQuantity > 0 ? (
                        <div>
                          <span className="font-bold text-orange-600 dark:text-orange-400 text-xs">
                            +{p.recommendedOrderQuantity.toLocaleString('id-ID')} {p.unit}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {formatIDR(p.recommendedOrderQuantity * p.pricePerUnit)}
                          </span>
                          <span className="text-[9px] text-rose-500 font-semibold block">
                            Order s/d: {p.recommendedOrderDate}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">Belum Perlu PO</span>
                      )}
                    </td>

                    {/* Action Button */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleOpenPOModal(p)}
                        className={`px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all w-full cursor-pointer ${
                          isCritical
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Order PO
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Quick PO Order / Procurement Restock */}
      {selectedPOModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Penerbitan PO / Restok Material
                  </h3>
                  <span className="text-xs text-slate-400">
                    {selectedPOModalItem.material.id} - {selectedPOModalItem.material.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPOModalItem(null)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPOOrder} className="space-y-4">
              {/* Supplier & Price Info */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Supplier Rekanan:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPOModalItem.material.supplier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Harga Satuan Resmi:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatIDR(selectedPOModalItem.material.pricePerUnit)} / {selectedPOModalItem.material.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Sisa Stok Fisik Saat Ini:</span>
                  <span className="font-bold text-emerald-500">
                    {selectedPOModalItem.material.stockRemaining} {selectedPOModalItem.material.unit}
                  </span>
                </div>
              </div>

              {/* Order Volume Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Kuantitas Pemesanan / Restok ({selectedPOModalItem.material.unit}):
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={selectedPOModalItem.orderQty}
                  onChange={(e) =>
                    setSelectedPOModalItem({
                      ...selectedPOModalItem,
                      orderQty: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Expected Arrival Date */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Kedatangan ke Site Proyek:
                </label>
                <input
                  type="date"
                  required
                  value={selectedPOModalItem.expectedDate}
                  onChange={(e) =>
                    setSelectedPOModalItem({
                      ...selectedPOModalItem,
                      expectedDate: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan / Keterangan SPK / PO:
                </label>
                <textarea
                  rows={2}
                  value={selectedPOModalItem.notes}
                  onChange={(e) =>
                    setSelectedPOModalItem({
                      ...selectedPOModalItem,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Total Estimated Cost */}
              <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 block">
                    Total Estimasi Nilai PO:
                  </span>
                  <span className="text-lg font-black text-orange-600 dark:text-orange-400">
                    {formatIDR(selectedPOModalItem.orderQty * selectedPOModalItem.material.pricePerUnit)}
                  </span>
                </div>
                <span className="text-[10px] text-orange-500 font-semibold">
                  {selectedPOModalItem.orderQty} {selectedPOModalItem.material.unit}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPOModalItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!canEdit}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-orange-500/30 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Proses PO &amp; Update Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
