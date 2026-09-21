import React, { useState } from 'react';
import { MaterialItem, WorkItem, UserRole, RolePermissions } from '../../types';
import { MaterialProjectionTool } from './MaterialProjectionTool';
import { calculateMaterialProjections } from '../../utils/materialProjection';
import {
  Boxes,
  Plus,
  AlertTriangle,
  Truck,
  DollarSign,
  Search,
  CheckCircle2,
  QrCode,
  Scan,
  Printer,
  X,
  Edit3,
  RefreshCw,
  Camera,
  Layers,
  Check,
  PackageCheck,
  Tag,
  Download,
  Barcode as BarcodeIcon,
  Upload,
  Sparkles,
  TrendingDown,
  Flame,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BarcodeSVG } from '../common/BarcodeSVG';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { formatIDR } from '../../utils/calculations';
import { MaterialBarcodeScannerModal } from './MaterialBarcodeScannerModal';
import { MaterialBatchBarcodePrintModal } from './MaterialBatchBarcodePrintModal';

interface MaterialMonitoringProps {
  materials: MaterialItem[];
  workItems: WorkItem[];
  userRole: UserRole;
  permissions?: RolePermissions;
  onAddMaterial: (mat: Omit<MaterialItem, 'id'>) => void;
  onUpdateMaterial: (mat: MaterialItem) => void;
  onAddAuditLog?: (action: string, details: string) => void;
}

export const MaterialMonitoring: React.FC<MaterialMonitoringProps> = ({
  materials,
  workItems,
  userRole,
  permissions,
  onAddMaterial,
  onUpdateMaterial,
  onAddAuditLog,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'projection'>('projection');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchPrintOpen, setIsBatchPrintOpen] = useState(false);
  
  // Barcode & QR Code Modals & State
  const [selectedQrMaterial, setSelectedQrMaterial] = useState<MaterialItem | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'qr' | 'barcode' | 'both'>('both');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTargetContext, setScannerTargetContext] = useState<'inventory' | 'fill_form'>('inventory');

  // Stock Adjustment State inside QR Modal
  const [adjustType, setAdjustType] = useState<'use' | 'add' | 'set'>('use');
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState<string>('');

  const [newMat, setNewMat] = useState<Omit<MaterialItem, 'id'>>({
    name: '',
    volumeTotal: 100,
    volumeUsed: 0,
    unit: 'Sak',
    pricePerUnit: 78000,
    supplier: '',
    arrivalDate: new Date().toISOString().split('T')[0],
    stockRemaining: 100,
    minAlertStock: 25,
    barcode: '',
    category: 'Struktur & Sipil',
    batchNumber: '',
    locationRack: '',
    leadTimeDays: 3,
    dailyBurnRate: 10,
  });

  const generateRandomBarcode = () => {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
    const barcodeVal = `899${randomDigits}`;
    setNewMat((prev) => ({ ...prev, barcode: barcodeVal }));
  };

  const handleOpenScannerForForm = () => {
    setScannerTargetContext('fill_form');
    setIsScannerOpen(true);
  };

  const handleOpenScannerForInventory = () => {
    setScannerTargetContext('inventory');
    setIsScannerOpen(true);
  };

  const handleFillBarcodeToForm = (scannedBarcode: string) => {
    setNewMat((prev) => ({ ...prev, barcode: scannedBarcode }));
  };

  const handleOpenAddModalWithBarcode = (scannedBarcode: string) => {
    setNewMat({
      name: '',
      volumeTotal: 100,
      volumeUsed: 0,
      unit: 'Sak',
      pricePerUnit: 78000,
      supplier: '',
      arrivalDate: new Date().toISOString().split('T')[0],
      stockRemaining: 100,
      minAlertStock: 25,
      barcode: scannedBarcode,
      category: 'Struktur & Sipil',
      batchNumber: `LOT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`,
      locationRack: 'Gudang Utama - Rak A1',
      leadTimeDays: 3,
      dailyBurnRate: 10,
    });
    setIsAddModalOpen(true);
  };

  const handleQuickStockAdjust = (
    mat: MaterialItem,
    type: 'add' | 'use',
    amount: number,
    notes: string
  ) => {
    let newUsed = mat.volumeUsed;
    let newTotal = mat.volumeTotal;
    let newStock = mat.stockRemaining;

    if (type === 'use') {
      newUsed = mat.volumeUsed + amount;
      newStock = Math.max(0, mat.volumeTotal - newUsed);
    } else {
      newTotal = mat.volumeTotal + amount;
      newStock = newTotal - mat.volumeUsed;
    }

    const updatedMaterial: MaterialItem = {
      ...mat,
      volumeTotal: newTotal,
      volumeUsed: newUsed,
      stockRemaining: newStock,
      usageDate: new Date().toISOString().split('T')[0],
    };

    onUpdateMaterial(updatedMaterial);
    if (onAddAuditLog) {
      onAddAuditLog(
        type === 'add' ? 'Terima Pasokan (Inbound Barcode)' : 'Catat Pemakaian (Outbound Barcode)',
        `${mat.name}: ${type === 'add' ? '+' : '-'}${amount} ${mat.unit} (${notes})`
      );
    }
  };

  const canEdit =
    permissions?.canManageMaterial ??
    (userRole === 'Kontraktor' ||
      userRole === 'Konsultan' ||
      userRole === 'Owner' ||
      userRole === 'Site Manager' ||
      userRole === 'Direktur' ||
      userRole === 'Admin');

  const filtered = materials.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.barcode && m.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.batchNumber && m.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.locationRack && m.locationRack.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.category && m.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Summary Metrics
  const totalValue = materials.reduce((acc, m) => acc + m.stockRemaining * m.pricePerUnit, 0);
  const lowStockCount = materials.filter((m) => m.stockRemaining <= m.minAlertStock).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMat.name) return;
    
    // Auto-generate barcode if blank
    const finalBarcode = newMat.barcode?.trim() || `899${Math.floor(100000000 + Math.random() * 900000000)}`;

    onAddMaterial({
      ...newMat,
      barcode: finalBarcode,
      stockRemaining: newMat.volumeTotal - newMat.volumeUsed,
    });
    
    if (onAddAuditLog) {
      onAddAuditLog(
        'Tambah Material Baru',
        `Menambahkan ${newMat.name} (Barcode: ${finalBarcode}, Stok Awal: ${newMat.volumeTotal} ${newMat.unit})`
      );
    }

    setIsAddModalOpen(false);
  };

  const handleApplyStockAdjustment = (mat: MaterialItem) => {
    if (!canEdit || adjustAmount <= 0) return;

    let newUsed = mat.volumeUsed;
    let newTotal = mat.volumeTotal;
    let newStock = mat.stockRemaining;

    if (adjustType === 'use') {
      newUsed = mat.volumeUsed + adjustAmount;
      newStock = Math.max(0, mat.volumeTotal - newUsed);
    } else if (adjustType === 'add') {
      newTotal = mat.volumeTotal + adjustAmount;
      newStock = newTotal - mat.volumeUsed;
    } else if (adjustType === 'set') {
      newStock = adjustAmount;
      newUsed = Math.max(0, newTotal - newStock);
    }

    const updatedMaterial: MaterialItem = {
      ...mat,
      volumeTotal: newTotal,
      volumeUsed: newUsed,
      stockRemaining: newStock,
      usageDate: new Date().toISOString().split('T')[0],
    };

    onUpdateMaterial(updatedMaterial);
    setSelectedQrMaterial(updatedMaterial);
    setUpdateSuccessMsg(`Stok berhasil diperbarui: Sisa ${newStock} ${mat.unit}`);
    setTimeout(() => setUpdateSuccessMsg(''), 3000);
  };

  const handlePrintQRBadge = () => {
    window.print();
  };

  const chartData = materials.map((m) => ({
    name: m.name.length > 15 ? m.name.substring(0, 15) + '...' : m.name,
    Terpakai: m.volumeUsed,
    'Sisa Stok': m.stockRemaining,
  }));

  const projections = React.useMemo(() => {
    return calculateMaterialProjections(materials, workItems || []);
  }, [materials, workItems]);

  const criticalAlertCount = projections.filter((p) => p.urgencyStatus === 'Kritis').length;
  const warningAlertCount = projections.filter((p) => p.urgencyStatus === 'Waspada').length;

  return (
    <div className="space-y-6">
      {/* Top Navigation Sub-Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={() => setActiveSubTab('projection')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'projection'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <TrendingDown className="w-4 h-4" /> Proyeksi Kebutuhan &amp; Peringatan Dini
            {criticalAlertCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">
                {criticalAlertCount} Kritis
              </span>
            ) : warningAlertCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {warningAlertCount} Waspada
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'inventory'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Boxes className="w-4 h-4" /> Stok Gudang &amp; QR Label
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
              {materials.length} Item
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setScannerTargetContext('inventory');
              setIsScannerOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <QrCode className="w-4 h-4" /> Pindai QR Label (Auto-Update)
          </button>
        </div>
      </div>

      {activeSubTab === 'projection' ? (
        <MaterialProjectionTool
          materials={materials}
          workItems={workItems}
          userRole={userRole}
          onUpdateMaterial={onUpdateMaterial}
          onAddAuditLog={onAddAuditLog}
        />
      ) : (
        <>
          {/* Top Stats & Quick Scanner Action */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Jenis Material</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{materials.length} Item</span>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                <Boxes className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Valuasi Stok Tersisa</span>
                <span className="text-xl font-black text-emerald-500 mt-1 block">{formatIDR(totalValue)}</span>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Peringatan Reorder Stok</span>
                <span className={`text-2xl font-black mt-1 block ${lowStockCount > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                  {lowStockCount} Material
                </span>
              </div>
              <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-slate-500/10 text-slate-400'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-600 to-amber-700 text-white shadow-lg flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-orange-100 uppercase tracking-wider block">QR Code &amp; SC Barcode</span>
                <span className="text-xs font-semibold text-white/90 mt-0.5 block">Scan Label &amp; Update Stok Instan</span>
                <button
                  onClick={handleOpenScannerForInventory}
                  className="mt-2.5 px-3.5 py-1.5 rounded-xl bg-white text-orange-600 hover:bg-orange-50 font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-orange-600" /> Pindai QR Code (Auto-Update)
                </button>
              </div>
              <div className="p-3 bg-white/20 rounded-2xl text-white">
                <QrCode className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Header Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                  <Boxes className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Monitoring Pasokan &amp; Stok Material (QR Code &amp; SC Barcode)</h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sistem scanning QR-Code label 2D &amp; barcode 1D via kamera ponsel/webcam untuk update stok otomatis instan di gudang &amp; site
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-60 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari QR label, barcode, nama, ID, rak..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                onClick={handleOpenScannerForInventory}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-black flex items-center gap-1.5 shadow-md shadow-orange-500/20 shrink-0 transition-all cursor-pointer"
                title="Pindai QR Code Label Material untuk update stok instan secara otomatis"
              >
                <QrCode className="w-4 h-4" /> Pindai QR Code
              </button>

              <button
                onClick={() => setIsBatchPrintOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shrink-0 transition-all cursor-pointer"
                title="Cetak Stiker Label QR & Barcode untuk Semua Material"
              >
                <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" /> Cetak Label QR
              </button>

              {canEdit && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 shrink-0 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Tambah Material
                </button>
              )}
            </div>
          </div>

          {/* Usage Chart */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-500" /> Grafik Pemakaian Material vs Sisa Stok
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
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
                  <Bar dataKey="Terpakai" fill="#F97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Sisa Stok" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Material Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white border-b border-slate-800 font-bold uppercase text-[10px]">
                    <th className="py-3.5 px-3 text-center w-16">Tag</th>
                    <th className="py-3.5 px-3">Kode, Barcode &amp; Nama Material</th>
                    <th className="py-3.5 px-3 text-right">Total Terima</th>
                    <th className="py-3.5 px-3 text-right">Terpakai</th>
                    <th className="py-3.5 px-3 text-right">Sisa Stok</th>
                    <th className="py-3.5 px-3 text-right">Harga Satuan</th>
                    <th className="py-3.5 px-3">Supplier &amp; Lokasi</th>
                    <th className="py-3.5 px-3 text-center">Status Stok</th>
                    <th className="py-3.5 px-3 text-center w-28">Label Barcode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filtered.map((m) => {
                    const isLow = m.stockRemaining <= m.minAlertStock;
                    const qrValue = `FORESYNDO-MAT:${m.id}`;

                    return (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        {/* QR Code Icon Thumbnail */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setSelectedQrMaterial(m)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-500 hover:bg-orange-500/10 text-slate-700 dark:text-slate-300 transition-all inline-flex items-center justify-center group cursor-pointer"
                            title="Buka QR & Barcode Tag"
                          >
                            <QRCodeSVG value={qrValue} size={28} level="M" />
                          </button>
                        </td>

                        {/* Name, ID & Barcode */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] text-orange-500 font-bold">{m.id}</span>
                            {m.barcode && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-[9px] font-mono font-bold text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60" title={`Barcode: ${m.barcode}`}>
                                <BarcodeIcon className="w-2.5 h-2.5" />
                                {m.barcode}
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white text-xs block mt-0.5">{m.name}</span>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 flex-wrap">
                            {m.category && <span className="text-slate-500">{m.category}</span>}
                            {m.locationRack && <span className="text-amber-600 dark:text-amber-400 font-medium">📍 {m.locationRack}</span>}
                            {m.batchNumber && <span className="font-mono text-slate-400">Lot: {m.batchNumber}</span>}
                          </div>
                        </td>

                        {/* Total Received */}
                        <td className="py-3 px-3 text-right font-medium">
                          {m.volumeTotal} {m.unit}
                        </td>

                        {/* Volume Used */}
                        <td className="py-3 px-3 text-right font-semibold text-orange-500">
                          {m.volumeUsed} {m.unit}
                        </td>

                        {/* Stock Remaining */}
                        <td className="py-3 px-3 text-right font-black text-emerald-500 text-sm">
                          {m.stockRemaining} {m.unit}
                        </td>

                        {/* Price per unit */}
                        <td className="py-3 px-3 text-right font-semibold">{formatIDR(m.pricePerUnit)}</td>

                        {/* Supplier & Location */}
                        <td className="py-3 px-3">
                          <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px] block">{m.supplier}</span>
                          {m.leadTimeDays && (
                            <span className="text-[10px] text-slate-400">Lead time: {m.leadTimeDays} hr</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold border border-red-500/30">
                              <AlertTriangle className="w-3 h-3" /> Reorder Alert!
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Aman
                            </span>
                          )}
                        </td>

                        {/* QR & Barcode Action Button */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setSelectedQrMaterial(m)}
                            className="px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1 border border-orange-500/20 transition-all w-full cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5" /> Label &amp; Stok
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* QR CODE & BARCODE BADGE & STOCK UPDATE MODAL */}
      {selectedQrMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl relative space-y-6 my-8 print:p-0 print:border-none print:shadow-none">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-500">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Label QR &amp; Barcode Material (Dual Tagged)
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black">
                      CODE128 + QR 2D
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sistem identifikasi fisik standar pergudangan &amp; pemindaian logistik lapangan
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintQRBadge}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-300 dark:border-slate-700 transition-all"
                >
                  <Printer className="w-4 h-4 text-orange-500" /> Cetak Label Badge
                </button>
                <button
                  onClick={() => setSelectedQrMaterial(null)}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Code Selector Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl print:hidden">
              <button
                onClick={() => setActiveCodeTab('both')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeCodeTab === 'both'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Kombinasi (QR + Barcode)
              </button>
              <button
                onClick={() => setActiveCodeTab('qr')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeCodeTab === 'qr'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" /> QR Code 2D
              </button>
              <button
                onClick={() => setActiveCodeTab('barcode')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeCodeTab === 'barcode'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BarcodeIcon className="w-3.5 h-3.5" /> Barcode 1D (CODE128)
              </button>
            </div>

            {/* Printable Badge Asset Tag Layout */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* QR / Barcode Render Column */}
              <div className="md:col-span-6 flex flex-col items-center justify-center p-4 bg-white text-slate-900 rounded-2xl shadow-md border-4 border-orange-500 space-y-3">
                <span className="text-[9px] font-black tracking-widest text-orange-600 uppercase text-center block">
                  PT FORESYNDO GLOBAL INDONESIA
                </span>

                {(activeCodeTab === 'both' || activeCodeTab === 'qr') && (
                  <div id={`qr-code-svg-${selectedQrMaterial.id}`} className="p-2 bg-white rounded-xl border border-slate-200">
                    <QRCodeSVG
                      value={`FORESYNDO-MAT:${selectedQrMaterial.id}`}
                      size={150}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                )}

                {(activeCodeTab === 'both' || activeCodeTab === 'barcode') && (
                  <div id={`barcode-svg-${selectedQrMaterial.id}`} className="w-full flex justify-center overflow-hidden py-1">
                    <BarcodeSVG
                      value={selectedQrMaterial.barcode || selectedQrMaterial.id}
                      height={45}
                      showText={true}
                      barColor="#0f172a"
                    />
                  </div>
                )}

                <div className="text-center space-y-0.5">
                  <span className="font-mono text-xs font-black text-slate-900 block">
                    ID: {selectedQrMaterial.id} {selectedQrMaterial.barcode ? `| BRC: ${selectedQrMaterial.barcode}` : ''}
                  </span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                    OFFICIAL CONSTRUCTION MATERIAL TAG
                  </span>
                </div>
              </div>

              {/* Material Details Column */}
              <div className="md:col-span-6 space-y-3">
                <div className="border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block">NAMA MATERIAL</span>
                  <h2 className="text-xl font-black text-white">{selectedQrMaterial.name}</h2>
                  <span className="text-xs text-slate-400 font-medium">Supplier: {selectedQrMaterial.supplier}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 font-semibold block">Sisa Stok Saat Ini</span>
                    <span className="text-lg font-black text-emerald-400">
                      {selectedQrMaterial.stockRemaining} {selectedQrMaterial.unit}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 font-semibold block">Total Diterima</span>
                    <span className="text-lg font-black text-slate-200">
                      {selectedQrMaterial.volumeTotal} {selectedQrMaterial.unit}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 font-semibold block">Total Terpakai</span>
                    <span className="text-sm font-bold text-orange-400">
                      {selectedQrMaterial.volumeUsed} {selectedQrMaterial.unit}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[10px] text-slate-400 font-semibold block">Harga per {selectedQrMaterial.unit}</span>
                    <span className="text-sm font-bold text-slate-200">
                      {formatIDR(selectedQrMaterial.pricePerUnit)}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 italic">
                  * Tgl Kedatangan: {selectedQrMaterial.arrivalDate} | Reorder Min: {selectedQrMaterial.minAlertStock} {selectedQrMaterial.unit}
                </div>
              </div>
            </div>

            {/* Quick Stock Update Form (Site Manager & Admin) */}
            {canEdit && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4 print:hidden">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-orange-500" /> Pembaruan Stok Lapangan Langsung
                  </h4>
                  {updateSuccessMsg && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <Check className="w-3.5 h-3.5" /> {updateSuccessMsg}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('use')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      adjustType === 'use'
                        ? 'bg-orange-500 text-white border-orange-600 shadow-md'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    - Catat Pemakaian
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      adjustType === 'add'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    + Terima Stok Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('set')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                      adjustType === 'set'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-md'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Set Stok Sisa
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Jumlah {adjustType === 'use' ? 'Pemakaian' : adjustType === 'add' ? 'Tambahan Pasokan' : 'Stok Baru'} ({selectedQrMaterial.unit})
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="self-end">
                    <button
                      type="button"
                      onClick={() => handleApplyStockAdjustment(selectedQrMaterial)}
                      className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all"
                    >
                      <PackageCheck className="w-4 h-4" /> Simpan Stok
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REAL CAMERA & FILE HTML5 QR & BARCODE SCANNER MODAL */}
      <MaterialBarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        materials={materials}
        onSelectMaterial={(mat) => {
          setSelectedQrMaterial(mat);
        }}
        onQuickStockAdjust={handleQuickStockAdjust}
        onAddMaterialWithBarcode={handleOpenAddModalWithBarcode}
        targetContext={scannerTargetContext}
        onFillBarcode={handleFillBarcodeToForm}
      />

      {/* BATCH BARCODE PRINT MODAL */}
      <MaterialBatchBarcodePrintModal
        isOpen={isBatchPrintOpen}
        onClose={() => setIsBatchPrintOpen(false)}
        materials={materials}
      />

      {/* Add Material Modal with SC Barcode & Auto-Generation */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative my-auto max-h-[92vh] flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Tambah Material Konstruksi Baru
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Input spesifikasi material, registrasi barcode &amp; penetapan lokasi rak site
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs overflow-y-auto pr-1">
              {/* Barcode Section with Real Scanner Button */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <BarcodeIcon className="w-4 h-4 text-sky-500" />
                    Kode Barcode / EAN-13 / Code128
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Opsional (Bisa auto-generate)</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Contoh: 899123456789 atau scan label kemasan..."
                    value={newMat.barcode || ''}
                    onChange={(e) => setNewMat({ ...newMat, barcode: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleOpenScannerForForm}
                    className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                    title="Scan barcode dari kamera HP/laptop dan otomatis masukkan ke form"
                  >
                    <Camera className="w-3.5 h-3.5" /> SC Barcode
                  </button>
                  <button
                    type="button"
                    onClick={generateRandomBarcode}
                    className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    title="Buat nomor barcode standar EAN otomatis"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Auto
                  </button>
                </div>
                {newMat.barcode && (
                  <div className="pt-1 flex items-center gap-2">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Barcode terdeteksi:
                    </span>
                    <span className="font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                      {newMat.barcode}
                    </span>
                  </div>
                )}
              </div>

              {/* Material Name & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Nama Material <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Semen Gresik PPC 50kg"
                    value={newMat.name}
                    onChange={(e) => setNewMat({ ...newMat, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Kategori Material
                  </label>
                  <select
                    value={newMat.category || 'Struktur & Sipil'}
                    onChange={(e) => setNewMat({ ...newMat, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Struktur & Sipil">Struktur &amp; Sipil (Besi, Semen, Pasir)</option>
                    <option value="Arsitektur">Arsitektur (Bata, Granit, Cat)</option>
                    <option value="MEP Plumbing">MEP - Plumbing &amp; Sanitasi</option>
                    <option value="MEP Listrik">MEP - Elektrikal &amp; Kabel</option>
                    <option value="MEP Fire Fighting">MEP - Proteksi Kebakaran</option>
                    <option value="Finishing">Finishing &amp; Interior</option>
                    <option value="Lainnya">Lain-lain / General</option>
                  </select>
                </div>
              </div>

              {/* Volume, Unit & Price */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Volume Total Terima
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newMat.volumeTotal}
                    onChange={(e) => setNewMat({ ...newMat, volumeTotal: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Satuan
                  </label>
                  <input
                    type="text"
                    placeholder="Sak, m³, Batang, m², Kg"
                    value={newMat.unit}
                    onChange={(e) => setNewMat({ ...newMat, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    value={newMat.pricePerUnit}
                    onChange={(e) => setNewMat({ ...newMat, pricePerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Supplier & Location Rack */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Nama Supplier / Vendor
                  </label>
                  <input
                    type="text"
                    placeholder="PT Semen Indonesia / Distributor Majalengka"
                    value={newMat.supplier}
                    onChange={(e) => setNewMat({ ...newMat, supplier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Lokasi Rak / Gudang Site
                  </label>
                  <input
                    type="text"
                    placeholder="Gudang A - Rak B2 / Lapangan Terbuka"
                    value={newMat.locationRack || ''}
                    onChange={(e) => setNewMat({ ...newMat, locationRack: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Batch Number & Reorder Alerts */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    No. Batch / Lot
                  </label>
                  <input
                    type="text"
                    placeholder="LOT-202609-01"
                    value={newMat.batchNumber || ''}
                    onChange={(e) => setNewMat({ ...newMat, batchNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Batas Min. Stok (Alert)
                  </label>
                  <input
                    type="number"
                    value={newMat.minAlertStock}
                    onChange={(e) => setNewMat({ ...newMat, minAlertStock: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Lead Time (Hari)
                  </label>
                  <input
                    type="number"
                    value={newMat.leadTimeDays || 3}
                    onChange={(e) => setNewMat({ ...newMat, leadTimeDays: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Simpan &amp; Daftarkan Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
