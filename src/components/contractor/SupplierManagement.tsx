import React, { useState, useMemo } from 'react';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  Package,
  FileText,
  Star,
  ExternalLink,
  Edit2,
  Trash2,
  DollarSign,
  Download,
  Share2,
  X,
  FileCheck,
  Send,
  Building,
  ShieldAlert,
} from 'lucide-react';
import {
  SupplierPartner,
  SupplierPurchaseOrder,
  SupplierCategory,
  UserRole,
  ProjectInfo,
} from '../../types';
import { formatIDR } from '../../utils/calculations';

interface SupplierManagementProps {
  suppliers: SupplierPartner[];
  purchaseOrders: SupplierPurchaseOrder[];
  userRole: UserRole;
  activeUserName: string;
  project: ProjectInfo;
  onAddSupplier: (supplier: SupplierPartner) => void;
  onUpdateSupplier: (supplier: SupplierPartner) => void;
  onDeleteSupplier: (id: string) => void;
  onAddPurchaseOrder: (po: SupplierPurchaseOrder) => void;
  onUpdatePOStatus: (
    id: string,
    paymentStatus: SupplierPurchaseOrder['paymentStatus'],
    deliveryStatus: SupplierPurchaseOrder['deliveryStatus']
  ) => void;
  onAddAuditLog?: (action: string, details: string) => void;
}

const CATEGORIES: { label: string; value: SupplierCategory | 'all' }[] = [
  { label: 'Semua Kategori', value: 'all' },
  { label: 'Beton & Semen', value: 'Beton & Semen' },
  { label: 'Besi & Baja Tulangan', value: 'Besi & Baja Tulangan' },
  { label: 'Agregat & Pasir', value: 'Agregat & Pasir' },
  { label: 'Bata Ringan & Mortar', value: 'Bata Ringan & Mortar' },
  { label: 'MEP & Elektrikal', value: 'MEP & Elektrikal' },
  { label: 'Alat Berat & Safety Tools', value: 'Alat Berat & Safety Tools' },
  { label: 'Finishing & Keramik/Cat', value: 'Finishing & Keramik/Cat' },
  { label: 'Kayu, Bekisting & Perancah', value: 'Kayu, Bekisting & Perancah' },
];

export const SupplierManagement: React.FC<SupplierManagementProps> = ({
  suppliers,
  purchaseOrders,
  userRole,
  activeUserName,
  project,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onAddPurchaseOrder,
  onUpdatePOStatus,
  onAddAuditLog,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'orders' | 'performance'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SupplierCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Aktif' | 'Prioritas' | 'On Hold'>('all');

  // Modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierPartner | null>(null);
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedSupplierForPO, setSelectedSupplierForPO] = useState<SupplierPartner | null>(null);
  const [viewingPO, setViewingPO] = useState<SupplierPurchaseOrder | null>(null);

  // Form states for Supplier Modal
  const [nameInput, setNameInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<SupplierCategory>('Beton & Semen');
  const [picInput, setPicInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [cityInput, setCityInput] = useState('Majalengka');
  const [bankNameInput, setBankNameInput] = useState('Bank Mandiri');
  const [bankAccNoInput, setBankAccNoInput] = useState('');
  const [bankAccHolderInput, setBankAccHolderInput] = useState('');
  const [npwpInput, setNpwpInput] = useState('');
  const [topInput, setTopInput] = useState('NET 14 Hari');
  const [ratingInput, setRatingInput] = useState(4.8);
  const [statusInput, setStatusInput] = useState<'Aktif' | 'Prioritas' | 'On Hold'>('Aktif');
  const [notesInput, setNotesInput] = useState('');

  // Form states for PO Modal
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poMaterialItem, setPoMaterialItem] = useState('');
  const [poQuantity, setPoQuantity] = useState(10);
  const [poUnit, setPoUnit] = useState('m³');
  const [poUnitPrice, setPoUnitPrice] = useState(950000);
  const [poDeliveryDate, setPoDeliveryDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  );
  const [poNotes, setPoNotes] = useState('');
  const [poPaymentStatus, setPoPaymentStatus] = useState<SupplierPurchaseOrder['paymentStatus']>('Belum Lunas');

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.picName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.notes && s.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = selectedCategory === 'all' || s.category === selectedCategory;
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [suppliers, searchQuery, selectedCategory, statusFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchSearch =
        po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.materialItem.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (po.deliveryOrderRef && po.deliveryOrderRef.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchSearch;
    });
  }, [purchaseOrders, searchQuery]);

  // Financial Stats
  const totalPOAmount = useMemo(() => {
    return purchaseOrders.reduce((acc, po) => acc + po.totalAmount, 0);
  }, [purchaseOrders]);

  const totalPaidAmount = useMemo(() => {
    return purchaseOrders.reduce((acc, po) => {
      if (po.paymentStatus === 'Lunas') return acc + po.totalAmount;
      if (po.paymentStatus === 'DP Dibayar') return acc + po.totalAmount * 0.3; // estimated 30% DP
      return acc;
    }, 0);
  }, [purchaseOrders]);

  const activePOCount = useMemo(() => {
    return purchaseOrders.filter(
      (po) => po.deliveryStatus === 'Dipesan' || po.deliveryStatus === 'Sebagian Terkirim'
    ).length;
  }, [purchaseOrders]);

  // Open Edit Supplier Modal
  const handleOpenEditSupplier = (supplier: SupplierPartner) => {
    setEditingSupplier(supplier);
    setNameInput(supplier.name);
    setCategoryInput(supplier.category);
    setPicInput(supplier.picName);
    setPhoneInput(supplier.phone);
    setEmailInput(supplier.email || '');
    setAddressInput(supplier.address);
    setCityInput(supplier.city);
    setBankNameInput(supplier.bankName || '');
    setBankAccNoInput(supplier.bankAccountNumber || '');
    setBankAccHolderInput(supplier.bankAccountHolder || '');
    setNpwpInput(supplier.npwp || '');
    setTopInput(supplier.top);
    setRatingInput(supplier.rating);
    setStatusInput(supplier.status);
    setNotesInput(supplier.notes || '');
    setIsSupplierModalOpen(true);
  };

  // Open Create Supplier Modal
  const handleOpenCreateSupplier = () => {
    setEditingSupplier(null);
    setNameInput('');
    setCategoryInput('Beton & Semen');
    setPicInput('');
    setPhoneInput('');
    setEmailInput('');
    setAddressInput('');
    setCityInput('Kabupaten Majalengka');
    setBankNameInput('Bank Mandiri');
    setBankAccNoInput('');
    setBankAccHolderInput('');
    setNpwpInput('');
    setTopInput('NET 14 Hari');
    setRatingInput(4.8);
    setStatusInput('Aktif');
    setNotesInput('');
    setIsSupplierModalOpen(true);
  };

  // Save Supplier
  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    if (editingSupplier) {
      const updated: SupplierPartner = {
        ...editingSupplier,
        name: nameInput.trim(),
        category: categoryInput,
        picName: picInput.trim() || 'PIC Penjualan',
        phone: phoneInput.trim(),
        whatsapp: phoneInput.trim(),
        email: emailInput.trim(),
        address: addressInput.trim(),
        city: cityInput.trim(),
        bankName: bankNameInput.trim(),
        bankAccountNumber: bankAccNoInput.trim(),
        bankAccountHolder: bankAccHolderInput.trim(),
        npwp: npwpInput.trim(),
        top: topInput.trim(),
        rating: ratingInput,
        status: statusInput,
        notes: notesInput.trim(),
      };
      onUpdateSupplier(updated);
      onAddAuditLog?.('UPDATE_SUPPLIER', `Memperbarui profil rekanan supplier: ${updated.name}`);
    } else {
      const newSupplier: SupplierPartner = {
        id: `SUP-${Date.now().toString().slice(-4)}`,
        name: nameInput.trim(),
        category: categoryInput,
        picName: picInput.trim() || 'PIC Penjualan',
        phone: phoneInput.trim(),
        whatsapp: phoneInput.trim(),
        email: emailInput.trim(),
        address: addressInput.trim(),
        city: cityInput.trim(),
        bankName: bankNameInput.trim(),
        bankAccountNumber: bankAccNoInput.trim(),
        bankAccountHolder: bankAccHolderInput.trim(),
        npwp: npwpInput.trim(),
        top: topInput.trim(),
        rating: ratingInput,
        status: statusInput,
        notes: notesInput.trim(),
        totalOrdersCount: 0,
        totalSpent: 0,
      };
      onAddSupplier(newSupplier);
      onAddAuditLog?.('ADD_SUPPLIER', `Menambahkan mitra rekanan supplier baru: ${newSupplier.name}`);
    }

    setIsSupplierModalOpen(false);
  };

  // Open Create PO Modal
  const handleOpenCreatePO = (preselectedSupplier?: SupplierPartner) => {
    const target = preselectedSupplier || suppliers[0];
    if (target) {
      setPoSupplierId(target.id);
      setSelectedSupplierForPO(target);
    }
    setPoMaterialItem('');
    setPoQuantity(10);
    setPoUnit('m³');
    setPoUnitPrice(950000);
    setPoDeliveryDate(new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]);
    setPoNotes('');
    setPoPaymentStatus('Belum Lunas');
    setIsPOModalOpen(true);
  };

  // Save PO
  const handleSavePO = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === poSupplierId) || suppliers[0];
    if (!sup || !poMaterialItem.trim()) return;

    const poSeq = purchaseOrders.length + 1;
    const now = new Date();
    const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    const poNumber = `PO-GMP/${yearMonth}-${String(poSeq).padStart(3, '0')}`;
    const total = poQuantity * poUnitPrice;

    const newPO: SupplierPurchaseOrder = {
      id: `PO-${Date.now().toString().slice(-4)}`,
      poNumber,
      supplierId: sup.id,
      supplierName: sup.name,
      date: now.toISOString().split('T')[0],
      deliveryDate: poDeliveryDate,
      materialItem: poMaterialItem.trim(),
      quantity: Number(poQuantity),
      unit: poUnit,
      unitPrice: Number(poUnitPrice),
      totalAmount: total,
      paymentStatus: poPaymentStatus,
      deliveryStatus: 'Dipesan',
      notes: poNotes.trim(),
      signedBy: activeUserName || project.siteManager || 'EKO YULIANTO',
    };

    onAddPurchaseOrder(newPO);
    onAddAuditLog?.('CREATE_PO', `Menerbitkan Purchase Order baru ${poNumber} ke ${sup.name} senilai ${formatIDR(total)}`);
    setIsPOModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-blue-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              <span>Divisi Logistik &amp; Procurement Kontraktor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Rekanan Supplier &amp; Pengadaan Material
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Direktori mitra pemasok bahan bangunan terverifikasi, manajemen Purchase Order (PO), serta evaluasi kinerja pengiriman logistik untuk <strong>{project.name}</strong>.
            </p>
            <div className="pt-1 text-xs text-blue-200/80 flex items-center gap-2">
              <span>Pelaksana:</span>
              <strong className="text-amber-300 font-bold">
                {project.contractor || 'PT. GONG MBE LINK PAMUNGKAS'}
              </strong>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenCreatePO()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
            >
              <Package className="w-4 h-4" />
              <span>+ Buat PO Material</span>
            </button>
            <button
              onClick={handleOpenCreateSupplier}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Rekanan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Rekanan Aktif</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {suppliers.filter((s) => s.status === 'Aktif' || s.status === 'Prioritas').length} Vendor
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {suppliers.filter((s) => s.status === 'Prioritas').length} Vendor Prioritas
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Purchase Order (PO)</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{purchaseOrders.length} Diterbitkan</h3>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              {activePOCount} Pengiriman Berjalan
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Nilai Pengadaan</p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
              {formatIDR(totalPOAmount)}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Terbayar: {formatIDR(totalPaidAmount)}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Penerimaan Material</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {purchaseOrders.filter((po) => po.deliveryStatus === 'Diterima Lengkap' || po.deliveryStatus === 'Selesai').length} / {purchaseOrders.length}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">Lolos Uji Kualitas QC</p>
          </div>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'directory'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Direktori Rekanan ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'orders'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>Daftar Purchase Order ({purchaseOrders.length})</span>
            {activePOCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('performance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'performance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Evaluasi &amp; Rating Vendor
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={activeSubTab === 'directory' ? 'Cari nama supplier, PIC...' : 'Cari No PO, material...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-64"
            />
          </div>
          {activeSubTab === 'directory' && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: DIREKTORI REKANAN SUPPLIER */}
      {activeSubTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSuppliers.map((supplier) => (
            <div
              key={supplier.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all p-5 shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500/20 to-sky-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 border border-blue-200 dark:border-blue-800">
                      {supplier.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                        {supplier.category}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 mt-0.5">
                        {supplier.name}
                      </h4>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                      supplier.status === 'Prioritas'
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                        : supplier.status === 'Aktif'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {supplier.status}
                  </span>
                </div>

                {/* Rating & TOP */}
                <div className="flex items-center justify-between py-2 border-y border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{supplier.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-slate-400 font-normal">/ 5.0</span>
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    TOP: <strong className="text-slate-800 dark:text-slate-200">{supplier.top}</strong>
                  </div>
                </div>

                {/* Contact & Location Details */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">PIC: <strong>{supplier.picName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px]">{supplier.phone}</span>
                    {supplier.whatsapp && (
                      <a
                        href={`https://wa.me/${supplier.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline text-[10px] font-semibold"
                      >
                        (Chat WA)
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{supplier.city}</span>
                  </div>
                  {supplier.bankAccountNumber && (
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{supplier.bankName}: {supplier.bankAccountNumber}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {supplier.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg line-clamp-2 italic">
                    "{supplier.notes}"
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenCreatePO(supplier)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Order PO</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEditSupplier(supplier)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    title="Edit Data Rekanan"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Hapus rekanan supplier ${supplier.name}?`)) {
                        onDeleteSupplier(supplier.id);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Hapus Supplier"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredSuppliers.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-sm">Tidak ada data rekanan supplier yang cocok.</p>
              <button
                onClick={handleOpenCreateSupplier}
                className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Daftarkan Supplier Baru</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: DAFTAR PURCHASE ORDER (PO) */}
      {activeSubTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Daftar Surat Pesanan Material (Purchase Order)
              </h3>
              <p className="text-xs text-slate-500">
                Pencatatan resmi pengadaan barang ke supplier oleh Kontraktor Pelaksana
              </p>
            </div>
            <button
              onClick={() => handleOpenCreatePO()}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat PO Baru</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">No. PO &amp; Tanggal</th>
                  <th className="py-3 px-4">Nama Supplier</th>
                  <th className="py-3 px-4">Item Material</th>
                  <th className="py-3 px-4 text-right">Volume</th>
                  <th className="py-3 px-4 text-right">Total Nilai (IDR)</th>
                  <th className="py-3 px-4 text-center">Status Kirim</th>
                  <th className="py-3 px-4 text-center">Pembayaran</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{po.poNumber}</div>
                      <div className="text-[11px] text-slate-500">{po.date}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {po.supplierName}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{po.materialItem}</div>
                      {po.deliveryOrderRef && (
                        <div className="text-[10px] text-slate-400 font-mono">DO: {po.deliveryOrderRef}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                      {po.quantity.toLocaleString('id-ID')} {po.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatIDR(po.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          po.deliveryStatus === 'Diterima Lengkap' || po.deliveryStatus === 'Selesai'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : po.deliveryStatus === 'Sebagian Terkirim'
                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                            : po.deliveryStatus === 'Dipesan'
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}
                      >
                        {po.deliveryStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          po.paymentStatus === 'Lunas'
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                            : po.paymentStatus === 'DP Dibayar'
                            ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300'
                            : 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {po.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewingPO(po)}
                          className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Lihat Slip</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      Belum ada Purchase Order (PO) yang tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: EVALUASI KINERJA VENDOR */}
      {activeSubTab === 'performance' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Matriks Evaluasi Mutu &amp; Kepatuhan Rekanan Supplier
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Parameter penilaian mencakup ketepatan waktu pengiriman (SLA), kesesuaian spesifikasi uji lab, dan kemudahan syarat pembayaran (Term of Payment).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suppliers.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                        {s.category}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{s.name}</h4>
                      <p className="text-xs text-slate-500">PIC: {s.picName} ({s.phone})</p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-black text-sm bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-lg">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span>{s.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg">
                      <p className="text-[10px] text-slate-400">Ketepatan Waktu</p>
                      <strong className="text-emerald-600 font-bold">98% Tepat</strong>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg">
                      <p className="text-[10px] text-slate-400">Uji Mutu QC</p>
                      <strong className="text-blue-600 font-bold">100% Lulus</strong>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg">
                      <p className="text-[10px] text-slate-400">Syarat Bayar</p>
                      <strong className="text-slate-800 dark:text-slate-200 font-bold">{s.top}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Rekanan Supplier */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingSupplier ? 'Edit Rekanan Supplier' : 'Daftarkan Rekanan Supplier Baru'}
                </h3>
                <p className="text-xs text-blue-100">
                  Data mitra pengadaan material resmi PT. GONG MBE LINK PAMUNGKAS
                </p>
              </div>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Perusahaan / Supplier *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: PT. SCG ReadyMix Indonesia"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori Material *
                  </label>
                  <select
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value as SupplierCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {CATEGORIES.filter((c) => c.value !== 'all').map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Kerjasama
                  </label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Prioritas">Prioritas</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama PIC (Sales / Account Manager)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ir. Bambang Triyono"
                    value={picInput}
                    onChange={(e) => setPicInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nomor WhatsApp / Telepon *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+62 812-xxxx-xxxx"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kota / Wilayah Operasional
                  </label>
                  <input
                    type="text"
                    placeholder="Majalengka / Cirebon / Bandung"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Term of Payment (TOP)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: NET 14 Hari / CBD / DP 30%"
                    value={topInput}
                    onChange={(e) => setTopInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Pabrik / Depo Logistik
                  </label>
                  <input
                    type="text"
                    placeholder="Jl. Raya Kertajati Km 7..."
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rekening Bank
                  </label>
                  <input
                    type="text"
                    placeholder="Bank Mandiri - 13100xxxx"
                    value={`${bankNameInput} - ${bankAccNoInput}`}
                    onChange={(e) => {
                      const parts = e.target.value.split('-');
                      if (parts.length > 1) {
                        setBankNameInput(parts[0].trim());
                        setBankAccNoInput(parts[1].trim());
                      } else {
                        setBankAccNoInput(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    NPWP Vendor
                  </label>
                  <input
                    type="text"
                    placeholder="01.xxx.xxx.x-xxx.000"
                    value={npwpInput}
                    onChange={(e) => setNpwpInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Material &amp; Spesifikasi Khusus
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Kapasitas suplai harian, spesifikasi SNI, jaminan sertifikat uji tarik/tekan..."
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                >
                  {editingSupplier ? 'Simpan Perubahan' : 'Daftarkan Rekanan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Buat Purchase Order (PO) Baru */}
      {isPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 flex items-center justify-between">
              <div>
                <h3 className="font-black text-base">Penerbitan Purchase Order (PO) Material</h3>
                <p className="text-xs text-slate-900 font-medium">
                  Pengadaan bahan bangunan resmi kontraktor untuk proyek {project.name}
                </p>
              </div>
              <button
                onClick={() => setIsPOModalOpen(false)}
                className="p-1 rounded-lg hover:bg-black/10 text-slate-950 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePO} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Pilih Rekanan Supplier *
                </label>
                <select
                  value={poSupplierId}
                  onChange={(e) => {
                    setPoSupplierId(e.target.value);
                    const s = suppliers.find((x) => x.id === e.target.value);
                    setSelectedSupplierForPO(s || null);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Uraian Item Material *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beton Ready Mix K-350 NFA Slump 12±2 cm"
                  value={poMaterialItem}
                  onChange={(e) => setPoMaterialItem(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Volume / Qty *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={poQuantity}
                    onChange={(e) => setPoQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Satuan *
                  </label>
                  <select
                    value={poUnit}
                    onChange={(e) => setPoUnit(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="m³">m³ (Kubik)</option>
                    <option value="batang">batang</option>
                    <option value="kg">kg</option>
                    <option value="ton">ton</option>
                    <option value="sak">sak</option>
                    <option value="meter">meter</option>
                    <option value="rit">rit (truk)</option>
                    <option value="set">set</option>
                    <option value="lembar">lembar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Harga Satuan (IDR) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    required
                    value={poUnitPrice}
                    onChange={(e) => setPoUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Total Calculation Display */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                <span className="text-xs text-amber-900 dark:text-amber-300 font-bold">Total Nilai Tagihan PO:</span>
                <span className="text-base font-black text-amber-900 dark:text-amber-200">
                  {formatIDR(poQuantity * poUnitPrice)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Tanggal Dropping / Kirim
                  </label>
                  <input
                    type="date"
                    value={poDeliveryDate}
                    onChange={(e) => setPoDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Bayar
                  </label>
                  <select
                    value={poPaymentStatus}
                    onChange={(e) => setPoPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="Belum Lunas">Belum Lunas</option>
                    <option value="DP Dibayar">DP Dibayar</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Teknis / Instruksi Pengiriman
                </label>
                <textarea
                  rows={2}
                  placeholder="Lokasi bongkar muat, nomor kontak penerima lapangan, syarat uji slump test..."
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPOModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md shadow-amber-500/20"
                >
                  Terbitkan Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SLIP PURCHASE ORDER DETAIL & CETAK */}
      {viewingPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-sm">Slip Purchase Order Resmi (PO)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  onClick={() => setViewingPO(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6 text-slate-900 dark:text-slate-100 print:text-black">
              {/* Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-base font-black uppercase text-slate-900 dark:text-white">
                    {project.contractor || 'PT. GONG MBE LINK PAMUNGKAS'}
                  </h2>
                  <p className="text-xs text-slate-500">General Contractor &amp; Civil Engineering Specialist</p>
                  <p className="text-[11px] text-slate-400">Proyek: {project.name} - Majalengka</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 rounded">
                    {viewingPO.poNumber}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">Tanggal: {viewingPO.date}</p>
                </div>
              </div>

              {/* Vendor & Delivery Box */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Kepada Rekanan (Vendor):</p>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{viewingPO.supplierName}</p>
                  <p className="text-slate-500 mt-0.5">Jadwal Kirim: {viewingPO.deliveryDate || 'Segera'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Lokasi Penerimaan Site:</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{project.name}</p>
                  <p className="text-slate-500">{project.location}</p>
                  <p className="text-slate-500 mt-0.5">Penerima Lapangan: {project.siteManager || 'EKO YULIANTO'}</p>
                </div>
              </div>

              {/* Item Table */}
              <table className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                  <tr>
                    <th className="p-3 text-left">Deskripsi Barang / Material</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Harga Satuan</th>
                    <th className="p-3 text-right">Jumlah Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border-t border-slate-200 dark:border-slate-800">
                      <strong className="block text-slate-900 dark:text-white">{viewingPO.materialItem}</strong>
                      {viewingPO.notes && <span className="text-[11px] text-slate-500">{viewingPO.notes}</span>}
                    </td>
                    <td className="p-3 text-right border-t border-slate-200 dark:border-slate-800 font-medium">
                      {viewingPO.quantity} {viewingPO.unit}
                    </td>
                    <td className="p-3 text-right border-t border-slate-200 dark:border-slate-800 font-mono">
                      {formatIDR(viewingPO.unitPrice)}
                    </td>
                    <td className="p-3 text-right border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white font-mono">
                      {formatIDR(viewingPO.totalAmount)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-bold border-t border-slate-200 dark:border-slate-800">
                  <tr>
                    <td colSpan={3} className="p-3 text-right uppercase text-[11px]">
                      Total Pengadaan Material Netto:
                    </td>
                    <td className="p-3 text-right font-black text-sm text-blue-600 dark:text-blue-400 font-mono">
                      {formatIDR(viewingPO.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs">
                <div>
                  <p className="text-slate-500 mb-12">Diterima &amp; Disetujui Vendor,</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">( PIC Rekanan Supplier )</p>
                  <p className="text-[10px] text-slate-400">Bagian Penjualan &amp; Logistik</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-12">Dipesan Oleh (Kontraktor),</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    ( {viewingPO.signedBy || project.siteManager || 'EKO YULIANTO'} )
                  </p>
                  <p className="text-[10px] text-slate-400">Site Manager PT. GONG MBE LINK PAMUNGKAS</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
