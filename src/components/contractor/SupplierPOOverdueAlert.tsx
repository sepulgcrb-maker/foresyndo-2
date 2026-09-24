import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Clock,
  Truck,
  Package,
  Phone,
  MessageSquare,
  Mail,
  CheckCircle2,
  Calendar,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Building2,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  FileText,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import {
  SupplierPurchaseOrder,
  SupplierPartner,
  ProjectInfo,
  UserRole,
  NotificationItem,
} from '../../types';
import { formatIDR } from '../../utils/calculations';

export interface OverduePOAnalysis {
  po: SupplierPurchaseOrder;
  supplier?: SupplierPartner;
  deliveryDate: string;
  diffDays: number; // positive = days overdue, 0 = due today, negative = days until due
  urgency: 'overdue' | 'today' | 'upcoming';
  urgencyLabel: string;
}

interface SupplierPOOverdueAlertProps {
  purchaseOrders: SupplierPurchaseOrder[];
  suppliers: SupplierPartner[];
  project: ProjectInfo;
  activeUserName?: string;
  currentRole?: UserRole;
  onUpdatePO?: (po: SupplierPurchaseOrder) => void;
  onUpdatePOStatus?: (
    id: string,
    paymentStatus: SupplierPurchaseOrder['paymentStatus'],
    deliveryStatus: SupplierPurchaseOrder['deliveryStatus']
  ) => void;
  onAddNotification?: (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => void;
  onAddAuditLog?: (action: string, details: string) => void;
  onViewPODetail?: (po: SupplierPurchaseOrder) => void;
  onNavigateTab?: (tab: any) => void;
  darkMode?: boolean;
  compact?: boolean;
}

export const SupplierPOOverdueAlert: React.FC<SupplierPOOverdueAlertProps> = ({
  purchaseOrders,
  suppliers,
  project,
  activeUserName = 'EKO YULIANTO',
  currentRole = 'Kontraktor',
  onUpdatePO,
  onUpdatePOStatus,
  onAddNotification,
  onAddAuditLog,
  onViewPODetail,
  onNavigateTab,
  darkMode = false,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedPOForAction, setSelectedPOForAction] = useState<OverduePOAnalysis | null>(null);
  const [modalMode, setModalMode] = useState<'whatsapp' | 'update_status' | null>(null);

  // WhatsApp reminder modal form state
  const [waCustomMessage, setWaCustomMessage] = useState('');
  const [copiedWA, setCopiedWA] = useState(false);

  // Status update modal form state
  const [newDeliveryStatus, setNewDeliveryStatus] = useState<SupplierPurchaseOrder['deliveryStatus']>('Diterima Lengkap');
  const [newDeliveryOrderRef, setNewDeliveryOrderRef] = useState('');
  const [newDeliveryDate, setNewDeliveryDate] = useState('');
  const [statusUpdateNotes, setStatusUpdateNotes] = useState('');

  // Reference today date
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Analyze all POs for overdue delivery
  const analyzedPOs = useMemo<OverduePOAnalysis[]>(() => {
    return purchaseOrders
      .filter((po) => {
        // Exclude completed/fully delivered
        if (po.deliveryStatus === 'Diterima Lengkap' || po.deliveryStatus === 'Selesai') {
          return false;
        }
        return !!po.deliveryDate;
      })
      .map((po) => {
        const dDate = new Date(po.deliveryDate!);
        dDate.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - dDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        let urgency: OverduePOAnalysis['urgency'] = 'upcoming';
        let urgencyLabel = `Jadwal ${Math.abs(diffDays)} hari lagi`;

        if (diffDays > 0) {
          urgency = 'overdue';
          urgencyLabel = `Terlambat ${diffDays} Hari`;
        } else if (diffDays === 0) {
          urgency = 'today';
          urgencyLabel = 'Estimasi Tiba Hari Ini!';
        } else if (diffDays >= -2) {
          urgency = 'upcoming';
          urgencyLabel = `Jadwal H${diffDays}`;
        }

        const matchedSupplier = suppliers.find(
          (s) => s.id === po.supplierId || s.name.toLowerCase() === po.supplierName.toLowerCase()
        );

        return {
          po,
          supplier: matchedSupplier,
          deliveryDate: po.deliveryDate!,
          diffDays,
          urgency,
          urgencyLabel,
        };
      })
      .sort((a, b) => b.diffDays - a.diffDays); // Most overdue first
  }, [purchaseOrders, suppliers, today]);

  // Overdue POs only (diffDays > 0)
  const overduePOs = useMemo(() => {
    return analyzedPOs.filter((item) => item.urgency === 'overdue');
  }, [analyzedPOs]);

  // Due today POs (diffDays === 0)
  const dueTodayPOs = useMemo(() => {
    return analyzedPOs.filter((item) => item.urgency === 'today');
  }, [analyzedPOs]);

  // Total affected POs needing contractor attention
  const totalAlertCount = overduePOs.length + dueTodayPOs.length;

  // Total amount of delayed materials
  const totalOverdueAmount = useMemo(() => {
    return overduePOs.reduce((acc, curr) => acc + curr.po.totalAmount, 0);
  }, [overduePOs]);

  // If there are no overdue or due today POs, return null
  if (totalAlertCount === 0) {
    return null;
  }

  // Open WhatsApp Modal
  const handleOpenWhatsAppModal = (item: OverduePOAnalysis) => {
    setSelectedPOForAction(item);
    const supName = item.supplier?.name || item.po.supplierName;
    const pic = item.supplier?.picName || 'Bapak/Ibu PIC Penjualan';
    const contractorName = project.contractor || 'PT. GONG MBE LINK PAMUNGKAS';

    const defaultMsg = `Yth. ${pic} (${supName}),\n\nKami dari Kontraktor Pelaksana ${contractorName} untuk proyek *${project.name}*.\n\nMohon perhatian dan konfirmasi segera, Purchase Order material berikut telah *MELEWATI BATAS WAKTU ESTIMASI KEDATANGAN*:\n\n📋 *No. PO*: ${item.po.poNumber}\n📦 *Material*: ${item.po.materialItem}\n📊 *Volume*: ${item.po.quantity.toLocaleString('id-ID')} ${item.po.unit}\n📅 *Batas Estimasi Kedatangan*: ${item.deliveryDate} (*Terlambat ${item.diffDays} hari*)\n📍 *Lokasi Pengiriman*: ${project.location}\n\nKeterlambatan material ini berisiko memperlambat schedule fisik pekerjaan di lapangan. Mohon konfirmasi nomor Surat Jalan (DO) dan estimasi jam tiba armada pengiriman ke lokasi site hari ini.\n\nTerima kasih.\n*Site Manager / Tim Logistik Kontraktor*\n${activeUserName}`;

    setWaCustomMessage(defaultMsg);
    setCopiedWA(false);
    setModalMode('whatsapp');
  };

  // Open Update Status Modal
  const handleOpenUpdateModal = (item: OverduePOAnalysis) => {
    setSelectedPOForAction(item);
    setNewDeliveryStatus('Diterima Lengkap');
    setNewDeliveryOrderRef(item.po.deliveryOrderRef || '');
    setNewDeliveryDate(item.po.deliveryDate || '');
    setStatusUpdateNotes(item.po.notes || '');
    setModalMode('update_status');
  };

  // Execute WhatsApp launch
  const handleSendWhatsApp = () => {
    if (!selectedPOForAction) return;
    const phone =
      selectedPOForAction.supplier?.whatsapp ||
      selectedPOForAction.supplier?.phone ||
      '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(waCustomMessage)}`;
    
    // Open WhatsApp
    window.open(waUrl, '_blank');

    onAddAuditLog?.(
      'ALERT_PO_SUPPLIER',
      `Kontraktor mengirim notifikasi peringatan keterlambatan PO ${selectedPOForAction.po.poNumber} kepada supplier ${selectedPOForAction.supplier?.name || selectedPOForAction.po.supplierName}`
    );

    setModalMode(null);
  };

  // Copy WhatsApp text to clipboard
  const handleCopyWAText = () => {
    navigator.clipboard.writeText(waCustomMessage);
    setCopiedWA(true);
    setTimeout(() => setCopiedWA(false), 2500);
  };

  // Save updated PO status
  const handleSaveUpdatedStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPOForAction) return;

    const currentPO = selectedPOForAction.po;
    const updatedPO: SupplierPurchaseOrder = {
      ...currentPO,
      deliveryStatus: newDeliveryStatus,
      deliveryOrderRef: newDeliveryOrderRef.trim() || currentPO.deliveryOrderRef,
      deliveryDate: newDeliveryDate || currentPO.deliveryDate,
      notes: statusUpdateNotes.trim() || currentPO.notes,
    };

    if (onUpdatePO) {
      onUpdatePO(updatedPO);
    } else if (onUpdatePOStatus) {
      onUpdatePOStatus(currentPO.id, currentPO.paymentStatus, newDeliveryStatus);
    }

    onAddAuditLog?.(
      'UPDATE_PO_DELIVERY',
      `Memperbarui status pengiriman PO ${currentPO.poNumber} menjadi "${newDeliveryStatus}" (Ref DO: ${newDeliveryOrderRef || 'N/A'})`
    );

    if (onAddNotification) {
      onAddNotification({
        title: `Status PO ${currentPO.poNumber} Diperbarui`,
        message: `Material "${currentPO.materialItem}" dari ${currentPO.supplierName} kini berstatus "${newDeliveryStatus}".`,
        type: newDeliveryStatus === 'Diterima Lengkap' ? 'info' : 'warning',
        category: 'schedule',
      });
    }

    setModalMode(null);
  };

  // Compact View (for Executive Dashboard card)
  if (compact) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-950 via-red-900 to-amber-950 text-white p-5 border border-rose-700/50 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center shrink-0 text-rose-300">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold text-[10px] tracking-wider uppercase">
                  Peringatan Logistik
                </span>
                <span className="text-xs text-rose-200">
                  {overduePOs.length} PO Terlambat Kedatangan
                </span>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-white mt-1">
                Keterlambatan Pengiriman Material oleh Rekanan Supplier
              </h3>
              <p className="text-xs text-rose-200/90 max-w-xl mt-0.5">
                Nilai pengadaan tertahan: <strong className="text-white">{formatIDR(totalOverdueAmount)}</strong>. Diperlukan tindakan segera agar tidak memicu deviasi schedule proyek.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('suppliers')}
                className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-950 font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <span>Tindak Lanjuti di Tab Supplier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick pills of overdue items */}
        <div className="mt-3.5 pt-3 border-t border-rose-800/60 flex flex-wrap gap-2 text-xs">
          {overduePOs.map((item) => (
            <div
              key={item.po.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/30 border border-rose-500/30 text-rose-100"
            >
              <Package className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold">{item.po.poNumber}</span>
              <span className="text-rose-300">({item.po.materialItem})</span>
              <span className="px-1.5 py-0.2 rounded bg-rose-500/80 text-[10px] font-black text-white">
                +{item.diffDays} Hari
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full Expanded View (in SupplierManagement)
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950 via-slate-900 to-rose-950 text-white border-2 border-rose-500/60 shadow-2xl p-5 sm:p-6 transition-all duration-300">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white shadow-lg shadow-rose-900/50 shrink-0">
            <Truck className="w-6 h-6 animate-bounce" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600/90 text-white font-black text-[10px] tracking-wide uppercase">
                <ShieldAlert className="w-3 h-3" />
                SISTEM PENGINGAT OTOMATIS KONTRAKTOR
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-semibold">
                {totalAlertCount} PO Memerlukan Tindak Lanjut
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Peringatan Keterlambatan Pengiriman Purchase Order (PO)
            </h2>
            <p className="text-xs text-rose-200/90 max-w-3xl">
              Terdeteksi <strong>{overduePOs.length} PO</strong> belum dikirim oleh supplier setelah melewati batas estimasi tanggal kedatangan di site <strong>{project.name}</strong>. Nilai total pengadaan tertahan:{' '}
              <strong className="text-amber-300 font-bold">{formatIDR(totalOverdueAmount)}</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <>
                <span>Sembunyikan Rincian</span>
                <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Lihat {totalAlertCount} PO Terlambat</span>
                <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded List of Overdue Orders */}
      {isExpanded && (
        <div className="mt-5 space-y-3 pt-4 border-t border-rose-800/40">
          {overduePOs.map((item) => {
            const supplier = item.supplier;
            const contactPhone = supplier?.whatsapp || supplier?.phone || '-';

            return (
              <div
                key={item.po.id}
                className="group relative rounded-xl bg-slate-900/90 border border-rose-500/40 hover:border-rose-400 p-4 transition-all duration-200 shadow-md hover:shadow-rose-950/40"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: PO info */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {item.po.poNumber}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-black tracking-wide">
                        <AlertCircle className="w-3 h-3" />
                        Terlambat {item.diffDays} Hari
                      </span>
                      <span className="text-[11px] text-amber-300 font-medium">
                        Estimasi Awal: {item.deliveryDate}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        Status: {item.po.deliveryStatus}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                      <h4 className="font-bold text-sm sm:text-base text-white">
                        {item.po.materialItem}
                      </h4>
                      <span className="text-xs text-rose-300 font-medium">
                        Volume: <strong>{item.po.quantity.toLocaleString('id-ID')} {item.po.unit}</strong> • Nilai: <strong className="text-amber-300">{formatIDR(item.po.totalAmount)}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300 pt-0.5">
                      <div className="flex items-center gap-1 text-slate-200">
                        <Building2 className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-semibold">{item.po.supplierName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>PIC: {supplier?.picName || 'Sales'} ({contactPhone})</span>
                      </div>
                      {item.po.notes && (
                        <div className="text-[11px] text-slate-400 italic">
                          Catatan: &ldquo;{item.po.notes}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenWhatsAppModal(item)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer transition-all active:scale-95"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Kirim Teguran WA</span>
                    </button>

                    <button
                      onClick={() => handleOpenUpdateModal(item)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-950/40 cursor-pointer transition-all active:scale-95"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Update Status Kedatangan</span>
                    </button>

                    {onViewPODetail && (
                      <button
                        onClick={() => onViewPODetail(item.po)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1 border border-slate-700 cursor-pointer transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Slip PO</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Due Today Section */}
          {dueTodayPOs.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>PO dengan Jadwal Kedatangan Hari Ini ({dueTodayPOs.length} PO)</span>
              </div>
              <div className="space-y-2">
                {dueTodayPOs.map((item) => (
                  <div
                    key={item.po.id}
                    className="p-3 rounded-xl bg-amber-950/30 border border-amber-600/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{item.po.poNumber}</span>
                        <span className="text-amber-300 font-medium">{item.po.materialItem}</span>
                        <span className="text-slate-400 font-mono">({item.po.quantity} {item.po.unit})</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        Supplier: <strong className="text-slate-200">{item.po.supplierName}</strong> • Pastikan tim penerima / QC di site sudah siap memeriksa mutu.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenWhatsAppModal(item)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-600 text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Konfirmasi Armada</span>
                      </button>
                      <button
                        onClick={() => handleOpenUpdateModal(item)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Catat Tiba</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          MODAL 1: WHATSAPP TEGURAN / REMINDER SUPPLIER
      ======================================================== */}
      {modalMode === 'whatsapp' && selectedPOForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Kirim Peringatan Keterlambatan PO</h3>
                  <p className="text-xs text-slate-500">
                    Template pesan resmi Kontraktor ke WhatsApp Supplier
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Details */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Tujuan Supplier:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedPOForAction.supplier?.name || selectedPOForAction.po.supplierName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">PIC Penjualan / Pengiriman:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {selectedPOForAction.supplier?.picName || 'PIC Sales'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">No. WhatsApp:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedPOForAction.supplier?.whatsapp || selectedPOForAction.supplier?.phone || 'Belum diisi'}
                </span>
              </div>
            </div>

            {/* Editable Text Area */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Isi Pesan Peringatan Resmi:
              </label>
              <textarea
                value={waCustomMessage}
                onChange={(e) => setWaCustomMessage(e.target.value)}
                rows={9}
                className="w-full text-xs font-sans rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleCopyWAText}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                {copiedWA ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Pesan</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Buka WhatsApp Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: UPDATE STATUS PENGIRIMAN & SURAT JALAN
      ======================================================== */}
      {modalMode === 'update_status' && selectedPOForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Update Status Pengiriman Material</h3>
                  <p className="text-xs text-slate-500">
                    Konfirmasi kedatangan material atau penyesuaian jadwal dropping
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdatedStatus} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">
                  {selectedPOForAction.po.poNumber} &bull; {selectedPOForAction.po.materialItem}
                </p>
                <p className="text-slate-500">
                  Supplier: {selectedPOForAction.po.supplierName} &bull; Vol: {selectedPOForAction.po.quantity} {selectedPOForAction.po.unit}
                </p>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Pilih Status Pengiriman Terbaru:
                </label>
                <select
                  value={newDeliveryStatus}
                  onChange={(e) =>
                    setNewDeliveryStatus(e.target.value as SupplierPurchaseOrder['deliveryStatus'])
                  }
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="Diterima Lengkap">✅ Diterima Lengkap (Semua Material Tiba di Site)</option>
                  <option value="Sebagian Terkirim">🚚 Sebagian Terkirim (Sebagian Volume Tiba)</option>
                  <option value="Dipesan">⏳ Dipesan (Belum Dikirim / Dalam Perjalanan)</option>
                </select>
              </div>

              {/* Delivery Order Reference (No. Surat Jalan) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Surat Jalan / Delivery Order (DO):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: DO-SCG/09-9942 atau SJ-KW/2026/088"
                  value={newDeliveryOrderRef}
                  onChange={(e) => setNewDeliveryOrderRef(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Reschedule Date (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Penyesuaian Tanggal Estimasi Kedatangan (Jika Reschedule):
                </label>
                <input
                  type="date"
                  value={newDeliveryDate}
                  onChange={(e) => setNewDeliveryDate(e.target.value)}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Field Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Lapangan &amp; Hasil Pemeriksaan QC:
                </label>
                <textarea
                  placeholder="Contoh: Material telah dibongkar di stockpile barat, diperiksa oleh Tim Pelaksana dan QC site..."
                  value={statusUpdateNotes}
                  onChange={(e) => setStatusUpdateNotes(e.target.value)}
                  rows={3}
                  className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
