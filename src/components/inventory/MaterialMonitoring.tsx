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
  ShieldCheck,
  ShieldAlert,
  Lock,
  FileCheck2,
  Clock,
  Ban,
  FolderPlus,
  Filter,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BarcodeSVG } from '../common/BarcodeSVG';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { formatIDR } from '../../utils/calculations';
import { MaterialBarcodeScannerModal } from './MaterialBarcodeScannerModal';
import { MaterialBatchBarcodePrintModal } from './MaterialBatchBarcodePrintModal';
import { MaterialApprovalModal } from './MaterialApprovalModal';
import { MaterialCategoryModal } from './MaterialCategoryModal';

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
  
  // Consultant Approval State & Modal
  const [selectedApprovalMaterial, setSelectedApprovalMaterial] = useState<MaterialItem | null>(null);
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [newMatDirectApproval, setNewMatDirectApproval] = useState<boolean>(
    userRole === 'Konsultan' || userRole === 'Admin' || userRole === 'Owner' || userRole === 'Direktur'
  );
  const [newMatBapmRef, setNewMatBapmRef] = useState<string>('');

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

  const canApprove =
    userRole === 'Konsultan' || userRole === 'Admin' || userRole === 'Owner' || userRole === 'Direktur';

  // Material Categories Management State
  const DEFAULT_MATERIAL_CATEGORIES = [
    'Struktur & Sipil',
    'Arsitektur',
    'MEP Plumbing',
    'MEP Listrik',
    'MEP Fire Fighting',
    'Finishing',
    'Lainnya',
  ];

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('FORESYNDO_CUSTOM_MATERIAL_CATEGORIES');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Listen to cross-browser / remote sync category updates
  React.useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('FORESYNDO_CUSTOM_MATERIAL_CATEGORIES');
        if (saved) {
          setCustomCategories(JSON.parse(saved));
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('foresyndo_categories_updated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('foresyndo_categories_updated', handleStorage);
    };
  }, []);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [manualCategoryInput, setManualCategoryInput] = useState('');

  // Combined list of categories (Default + Custom + Existing in Materials)
  const allCategories = React.useMemo(() => {
    const set = new Set<string>(DEFAULT_MATERIAL_CATEGORIES);
    customCategories.forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    materials.forEach((m) => {
      if (m.category && m.category.trim()) set.add(m.category.trim());
    });
    return Array.from(set);
  }, [customCategories, materials]);

  const handleAddCustomCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (!customCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      try {
        localStorage.setItem('FORESYNDO_CUSTOM_MATERIAL_CATEGORIES', JSON.stringify(updated));
        window.dispatchEvent(new Event('foresyndo_categories_updated'));
      } catch (err) {
        console.warn('LocalStorage save notice:', err);
      }
    }
    if (onAddAuditLog) {
      onAddAuditLog('Tambah Kategori Material Manual', `Menambahkan kategori baru: ${trimmed}`);
    }
  };

  const handleDeleteCustomCategory = (catToDelete: string) => {
    const updated = customCategories.filter(
      (c) => c.toLowerCase() !== catToDelete.toLowerCase()
    );
    setCustomCategories(updated);
    try {
      localStorage.setItem('FORESYNDO_CUSTOM_MATERIAL_CATEGORIES', JSON.stringify(updated));
      window.dispatchEvent(new Event('foresyndo_categories_updated'));
    } catch (err) {
      console.warn('LocalStorage remove notice:', err);
    }
    if (onAddAuditLog) {
      onAddAuditLog('Hapus Kategori Material', `Menghapus kategori kustom: ${catToDelete}`);
    }
    if (selectedCategoryFilter === catToDelete) {
      setSelectedCategoryFilter('all');
    }
  };

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

  // Approval Counts
  const approvedCount = materials.filter(
    (m) => (m.approvalStatus || 'Disetujui') === 'Disetujui'
  ).length;
  const pendingApprovalCount = materials.filter(
    (m) => m.approvalStatus === 'Menunggu Approval'
  ).length;
  const rejectedCount = materials.filter(
    (m) => m.approvalStatus === 'Ditolak'
  ).length;

  const handleApproveMaterial = (
    materialId: string,
    data: {
      approvedBy: string;
      notes: string;
      inspectionDocRef: string;
      locationRack: string;
    }
  ) => {
    const target = materials.find((m) => m.id === materialId);
    if (!target) return;

    // Issue valid barcode upon consultant approval!
    const generatedBarcode =
      target.barcode && target.barcode.length > 5
        ? target.barcode
        : `899${Math.floor(100000000 + Math.random() * 900000000)}`;

    const updatedMaterial: MaterialItem = {
      ...target,
      approvalStatus: 'Disetujui',
      approvedBy: data.approvedBy,
      approvedAt: new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      approvalNotes: data.notes,
      inspectionDocRef: data.inspectionDocRef,
      locationRack: data.locationRack || 'Gudang Utama - Rak A1',
      barcode: generatedBarcode,
    };

    onUpdateMaterial(updatedMaterial);

    if (selectedQrMaterial?.id === materialId) {
      setSelectedQrMaterial(updatedMaterial);
    }

    if (onAddAuditLog) {
      onAddAuditLog(
        'Approval Material Konsultan MK',
        `Persetujuan masuk gudang & terbit izin barcode: ${target.name} (BAPM: ${data.inspectionDocRef}, Oleh: ${data.approvedBy}, Lokasi: ${updatedMaterial.locationRack})`
      );
    }
  };

  const handleRejectMaterial = (
    materialId: string,
    data: {
      rejectedBy: string;
      reason: string;
      inspectionDocRef: string;
    }
  ) => {
    const target = materials.find((m) => m.id === materialId);
    if (!target) return;

    const updatedMaterial: MaterialItem = {
      ...target,
      approvalStatus: 'Ditolak',
      rejectionReason: data.reason,
      inspectionDocRef: data.inspectionDocRef,
      locationRack: 'Area Transit - Retur Supplier (Tidak Masuk Gudang)',
      barcode: '', // Clear barcode as unauthorized
    };

    onUpdateMaterial(updatedMaterial);

    if (selectedQrMaterial?.id === materialId) {
      setSelectedQrMaterial(updatedMaterial);
    }

    if (onAddAuditLog) {
      onAddAuditLog(
        'Penolakan Material Konsultan MK',
        `Material ${target.name} DITOLAK masuk gudang. Alasan: ${data.reason} (Oleh: ${data.rejectedBy})`
      );
    }
  };

  const filtered = materials.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.barcode && m.barcode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.batchNumber && m.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.locationRack && m.locationRack.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.category && m.category.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (approvalFilter === 'approved') {
      return (m.approvalStatus || 'Disetujui') === 'Disetujui';
    }
    if (approvalFilter === 'pending') {
      return m.approvalStatus === 'Menunggu Approval';
    }
    if (approvalFilter === 'rejected') {
      return m.approvalStatus === 'Ditolak';
    }

    if (selectedCategoryFilter !== 'all') {
      if ((m.category || 'Lainnya') !== selectedCategoryFilter) {
        return false;
      }
    }

    return true;
  });

  // Summary Metrics
  const totalValue = materials.reduce((acc, m) => acc + m.stockRemaining * m.pricePerUnit, 0);
  const lowStockCount = materials.filter((m) => m.stockRemaining <= m.minAlertStock).length;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMat.name) return;

    // Determine final category (manual custom typed vs selected from list)
    const finalCategory =
      isCustomCategoryMode && manualCategoryInput.trim()
        ? manualCategoryInput.trim()
        : newMat.category || 'Struktur & Sipil';

    if (isCustomCategoryMode && manualCategoryInput.trim()) {
      handleAddCustomCategory(manualCategoryInput.trim());
    }

    const isDirectApproved = newMatDirectApproval && canApprove;
    const finalBarcode = isDirectApproved
      ? newMat.barcode?.trim() || `899${Math.floor(100000000 + Math.random() * 900000000)}`
      : ''; // Barcode will be unlocked upon consultant approval

    const nowStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const matToAdd: Omit<MaterialItem, 'id'> = {
      ...newMat,
      category: finalCategory,
      barcode: finalBarcode,
      stockRemaining: newMat.volumeTotal - newMat.volumeUsed,
      approvalStatus: isDirectApproved ? 'Disetujui' : 'Menunggu Approval',
      approvedBy: isDirectApproved ? 'Konsultan MK (Verifikasi Langsung)' : undefined,
      approvedAt: isDirectApproved ? nowStr : undefined,
      inspectionDocRef: isDirectApproved
        ? newMatBapmRef || `BAPM-MK-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`
        : undefined,
      submissionDate: new Date().toISOString().split('T')[0],
      submittedBy: isDirectApproved ? 'Konsultan MK' : 'Tim Logistik Proyek',
      locationRack: isDirectApproved
        ? newMat.locationRack || 'Gudang Utama - Rak A1'
        : 'Area Transit Masuk (Menunggu Approval MK)',
    };

    onAddMaterial(matToAdd);

    if (onAddAuditLog) {
      onAddAuditLog(
        isDirectApproved ? 'Tambah & Sahkan Material' : 'Pendaftaran Pasokan Material Masuk',
        `Menambahkan ${newMat.name} (Kategori: ${finalCategory}, Status: ${isDirectApproved ? 'Disetujui Masuk Gudang' : 'Menunggu Approval Konsultan MK'})`
      );
    }

    // Reset form states
    setIsCustomCategoryMode(false);
    setManualCategoryInput('');
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

              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shrink-0 transition-all cursor-pointer"
                title="Tambah atau kelola kategori material secara manual"
              >
                <FolderPlus className="w-4 h-4 text-orange-500" /> + Kategori Manual
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

          {/* Pending Approval SOP Alert Banner */}
          {pendingApprovalCount > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-md">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Prosedur Mutu: {pendingApprovalCount} Pasokan Material Menunggu Approval Konsultan MK
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] animate-pulse">
                      WAJIB VERIFIKASI
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    Sesuai instruksi proyek, material sebelum masuk gudang harus mendapatkan verifikasi &amp; approval resmi dari Konsultan Manajemen Konstruksi (MK) sebelum diterbitkan izin barcode dan penempatan rak gudang.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApprovalFilter('pending')}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <Clock className="w-3.5 h-3.5" />
                Lihat Antrean Approval ({pendingApprovalCount})
              </button>
            </div>
          )}

          {/* Approval Filter Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Filter Masuk Gudang:
              </span>
              <button
                onClick={() => setApprovalFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                  approvalFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Semua ({materials.length})
              </button>
              <button
                onClick={() => setApprovalFilter('approved')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  approvalFilter === 'approved'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Disetujui Masuk Gudang ({approvedCount})
              </button>
              <button
                onClick={() => setApprovalFilter('pending')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  approvalFilter === 'pending'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Menunggu Approval MK ({pendingApprovalCount})
              </button>
              <button
                onClick={() => setApprovalFilter('rejected')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  approvalFilter === 'rejected'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20'
                }`}
              >
                <Ban className="w-3.5 h-3.5" /> Ditolak ({rejectedCount})
              </button>
            </div>
          </div>

          {/* Category Filter Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 max-w-full text-xs">
              <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                <Tag className="w-3.5 h-3.5 text-orange-500" /> Filter Kategori:
              </span>
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Semua Kategori ({materials.length})
              </button>
              {allCategories.map((cat) => {
                const count = materials.filter((m) => (m.category || 'Lainnya') === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2.5 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedCategoryFilter === cat
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        selectedCategoryFilter === cat
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 flex items-center gap-1 shrink-0 self-end md:self-center cursor-pointer px-2 py-1 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all"
            >
              <FolderPlus className="w-3.5 h-3.5" /> + Tambah Kategori Manual
            </button>
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
                    <th className="py-3.5 px-3 text-center">Approval Konsultan MK</th>
                    <th className="py-3.5 px-3 text-center w-28">Izin Barcode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filtered.map((m) => {
                    const isLow = m.stockRemaining <= m.minAlertStock;
                    const qrValue = `FORESYNDO-MAT:${m.id}`;
                    const isApproved = (m.approvalStatus || 'Disetujui') === 'Disetujui';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        {/* QR Code Icon Thumbnail */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => {
                              if (isApproved) {
                                setSelectedQrMaterial(m);
                              } else {
                                setSelectedApprovalMaterial(m);
                              }
                            }}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-500 hover:bg-orange-500/10 text-slate-700 dark:text-slate-300 transition-all inline-flex items-center justify-center group cursor-pointer relative"
                            title={isApproved ? 'Buka QR & Barcode Tag' : 'Barcode Terkunci - Butuh Approval Konsultan MK'}
                          >
                            <QRCodeSVG value={qrValue} size={28} level="M" />
                            {!isApproved && (
                              <div className="absolute inset-0 bg-slate-900/60 rounded-xl flex items-center justify-center text-amber-400">
                                <Lock className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </button>
                        </td>

                        {/* Name, ID & Barcode */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] text-orange-500 font-bold">{m.id}</span>
                            {m.barcode && isApproved ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-[9px] font-mono font-bold text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60" title={`Barcode: ${m.barcode}`}>
                                <BarcodeIcon className="w-2.5 h-2.5" />
                                {m.barcode}
                              </span>
                            ) : !isApproved ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                                <Lock className="w-2.5 h-2.5" /> Barcode Terkunci
                              </span>
                            ) : null}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white text-xs block mt-0.5">{m.name}</span>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 flex-wrap">
                            {m.category && (
                              <button
                                type="button"
                                onClick={() => setSelectedCategoryFilter(m.category!)}
                                className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-orange-500/10 hover:text-orange-600 dark:hover:text-orange-400 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer transition-colors"
                                title={`Filter berdasarkan kategori: ${m.category}`}
                              >
                                <Tag className="w-2.5 h-2.5 mr-1 text-orange-500" />
                                {m.category}
                              </button>
                            )}
                            {m.locationRack && (
                              <span className={isApproved ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-slate-400 italic'}>
                                📍 {m.locationRack}
                              </span>
                            )}
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

                        {/* Consultant MK Approval Status Column */}
                        <td className="py-3 px-3 text-center">
                          {m.approvalStatus === 'Menunggu Approval' ? (
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Menunggu MK
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedApprovalMaterial(m)}
                                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-[10px] flex items-center gap-1 shadow-sm cursor-pointer transition-all whitespace-nowrap"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                {canApprove ? 'Review & Approve' : 'Lihat Status MK'}
                              </button>
                            </div>
                          ) : m.approvalStatus === 'Ditolak' ? (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[10px] font-black inline-flex items-center gap-1">
                                <Ban className="w-3 h-3" /> Ditolak MK
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedApprovalMaterial(m)}
                                className="text-[9px] text-rose-600 hover:underline cursor-pointer font-bold mt-0.5"
                              >
                                Detail Alasan
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold inline-flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Izin Gudang Sah
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                {m.inspectionDocRef || 'BAPM-MK'}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* QR & Barcode Action Button */}
                        <td className="py-3 px-3 text-center">
                          {m.approvalStatus === 'Menunggu Approval' ? (
                            <button
                              onClick={() => setSelectedApprovalMaterial(m)}
                              className="px-2 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-700 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1 border border-amber-500/30 transition-all w-full cursor-pointer"
                              title="Barcode belum aktif sebelum disetujui Konsultan MK"
                            >
                              <Lock className="w-3 h-3 text-amber-600" /> Barcode Terkunci
                            </button>
                          ) : m.approvalStatus === 'Ditolak' ? (
                            <span className="text-[10px] text-slate-400 italic">Izin Dibatalkan</span>
                          ) : (
                            <button
                              onClick={() => setSelectedQrMaterial(m)}
                              className="px-2.5 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-600 hover:text-white font-bold text-[11px] flex items-center justify-center gap-1 border border-orange-500/20 transition-all w-full cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" /> Label &amp; Stok
                            </button>
                          )}
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

            {/* Approval Status Header Indicator */}
            {selectedQrMaterial.approvalStatus === 'Menunggu Approval' ? (
              <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 print:hidden">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500 text-white shrink-0 mt-0.5">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                      Material Menunggu Approval Konsultan MK
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      Material ini belum disahkan masuk gudang. Stiker barcode resmi terkunci sampai diverifikasi dan disetujui oleh Konsultan MK.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedQrMaterial;
                    setSelectedQrMaterial(null);
                    setSelectedApprovalMaterial(target);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" /> Buka Form Approval MK
                </button>
              </div>
            ) : selectedQrMaterial.approvalStatus === 'Ditolak' ? (
              <div className="p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/40 flex items-center justify-between gap-3 text-rose-900 dark:text-rose-200 print:hidden">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-600 text-white shrink-0">
                    <Ban className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-rose-700 dark:text-rose-300 uppercase tracking-wider">
                      Material Ditolak Konsultan MK (Izin Masuk Dibatalkan)
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                      Alasan: {selectedQrMaterial.rejectionReason || 'Spesifikasi tidak sesuai standar proyek'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex flex-wrap items-center justify-between gap-2 text-xs print:hidden">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">
                    Disetujui Masuk Gudang oleh: <strong>{selectedQrMaterial.approvedBy || 'Konsultan MK'}</strong>
                    {selectedQrMaterial.approvedAt ? ` (${selectedQrMaterial.approvedAt})` : ''}
                  </span>
                </div>
                {selectedQrMaterial.inspectionDocRef && (
                  <span className="font-mono text-[10px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-500/30">
                    Ref BAPM: {selectedQrMaterial.inspectionDocRef}
                  </span>
                )}
              </div>
            )}

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
              selectedQrMaterial.approvalStatus === 'Menunggu Approval' ? (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2 print:hidden">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Pencatatan Stok Gudang Ditangguhkan</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Sesuai instruksi proyek, material ini berstatus <strong>Menunggu Approval Konsultan MK</strong>. Pembaruan stok dan pencatatan pemakaian lapangan baru dapat dilakukan setelah material diverifikasi &amp; disahkan masuk gudang.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedQrMaterial;
                      setSelectedQrMaterial(null);
                      setSelectedApprovalMaterial(target);
                    }}
                    className="mt-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Buka Menu Verifikasi MK
                  </button>
                </div>
              ) : selectedQrMaterial.approvalStatus === 'Ditolak' ? (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs print:hidden flex items-center gap-2">
                  <Ban className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>Material ini ditolak oleh Konsultan MK dan tidak diizinkan masuk gudang proyek.</span>
                </div>
              ) : (
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
                        className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                      >
                        <PackageCheck className="w-4 h-4" /> Simpan Stok
                      </button>
                    </div>
                  </div>
                </div>
              )
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-orange-500" />
                      Kategori Material
                    </label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomCategoryMode(!isCustomCategoryMode);
                          if (!isCustomCategoryMode && !manualCategoryInput) {
                            setManualCategoryInput('');
                          }
                        }}
                        className="text-[10px] font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        {isCustomCategoryMode ? '← Pilih dari List' : '+ Ketik Manual'}
                      </button>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <button
                        type="button"
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-0.5 cursor-pointer"
                        title="Buka dialog kelola kategori lengkap"
                      >
                        <FolderPlus className="w-3 h-3 text-orange-500" /> Kelola
                      </button>
                    </div>
                  </div>

                  {isCustomCategoryMode ? (
                    <div className="space-y-1">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="Ketik nama kategori baru (contoh: K3 & APD, Baja Ringan)..."
                          value={manualCategoryInput}
                          onChange={(e) => setManualCategoryInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-orange-500/5 dark:bg-orange-500/10 border-2 border-orange-500/40 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          autoFocus
                        />
                      </div>
                      <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">
                        ✨ Kategori baru ini akan otomatis tersimpan ke daftar kategori proyek saat disimpan.
                      </p>
                    </div>
                  ) : (
                    <select
                      value={newMat.category || 'Struktur & Sipil'}
                      onChange={(e) => {
                        if (e.target.value === '__NEW_CUSTOM_CATEGORY__') {
                          setIsCustomCategoryMode(true);
                          setManualCategoryInput('');
                        } else {
                          setNewMat({ ...newMat, category: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__NEW_CUSTOM_CATEGORY__" className="font-bold text-orange-600">
                        ➕ Tambah Kategori Baru (Manual)...
                      </option>
                    </select>
                  )}
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

              {/* Quality & Consultant MK Approval Workflow Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="font-bold text-slate-900 dark:text-white text-xs">
                    Prosedur Masuk Gudang (Approval Konsultan MK)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sesuai ketentuan, material sebelum masuk rak gudang harus mendapatkan verifikasi &amp; approval resmi dari Konsultan MK sebelum stiker barcode dapat diterbitkan dan stok diaktifkan.
                </p>

                {canApprove ? (
                  <div className="pt-2 border-t border-amber-500/20 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newMatDirectApproval}
                        onChange={(e) => setNewMatDirectApproval(e.target.checked)}
                        className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                      />
                      <span className="font-bold text-amber-800 dark:text-amber-300 text-xs">
                        Langsung Sahkan Masuk Gudang &amp; Terbitkan Barcode (Otoritas MK / Admin)
                      </span>
                    </label>

                    {newMatDirectApproval && (
                      <div className="pl-6 pt-1">
                        <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                          Nomor Referensi Berita Acara Penerimaan Material (BAPM):
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: BAPM-MK-2026-098"
                          value={newMatBapmRef}
                          onChange={(e) => setNewMatBapmRef(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[10px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5 pt-1">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Material ini akan otomatis berstatus <strong>Menunggu Approval</strong> dan barcode ditangguhkan sampai diperiksa oleh Konsultan MK.</span>
                  </div>
                )}
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

      {/* Material Approval Modal for Konsultan MK */}
      {selectedApprovalMaterial && (
        <MaterialApprovalModal
          material={selectedApprovalMaterial}
          userRole={userRole}
          canApprove={canApprove}
          onClose={() => setSelectedApprovalMaterial(null)}
          onApprove={handleApproveMaterial}
          onReject={handleRejectMaterial}
          onOpenBarcodeTag={(mat) => {
            setSelectedApprovalMaterial(null);
            setSelectedQrMaterial(mat);
          }}
        />
      )}

      {/* Manual Material Category Management Modal */}
      {isCategoryModalOpen && (
        <MaterialCategoryModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={allCategories}
          materials={materials}
          defaultCategories={DEFAULT_MATERIAL_CATEGORIES}
          onAddCategory={handleAddCustomCategory}
          onDeleteCategory={handleDeleteCustomCategory}
          onSelectCategory={(cat) => {
            setNewMat((prev) => ({ ...prev, category: cat }));
            setSelectedCategoryFilter(cat);
          }}
        />
      )}
    </div>
  );
};
