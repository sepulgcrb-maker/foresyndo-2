import React, { useState, useEffect } from 'react';
import { MaterialItem } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  QrCode,
  Lock,
  Unlock,
  Building2,
  UserCheck,
  FileText,
  Warehouse,
  PackageCheck,
  X,
  Printer,
  Calendar,
  Layers,
  Send,
  Sparkles,
  Clock,
} from 'lucide-react';
import { formatIDR } from '../../utils/calculations';
import { QRCodeSVG } from 'qrcode.react';
import { BarcodeSVG } from '../common/BarcodeSVG';

interface MaterialApprovalModalProps {
  isOpen?: boolean;
  onClose: () => void;
  material: MaterialItem | null;
  userRole?: string;
  canApprove?: boolean;
  onApprove: (
    materialId: string,
    data: {
      approvedBy: string;
      notes: string;
      inspectionDocRef: string;
      locationRack: string;
    }
  ) => void;
  onReject: (
    materialId: string,
    data: {
      rejectedBy: string;
      reason: string;
      inspectionDocRef: string;
    }
  ) => void;
  onOpenQRBadge?: (material: MaterialItem) => void;
  onOpenBarcodeTag?: (material: MaterialItem) => void;
}

export const MaterialApprovalModal: React.FC<MaterialApprovalModalProps> = ({
  isOpen = true,
  onClose,
  material,
  userRole = 'Konsultan',
  canApprove: canApproveProp,
  onApprove,
  onReject,
  onOpenQRBadge,
  onOpenBarcodeTag,
}) => {
  if (!isOpen || !material) return null;

  const currentStatus = material.approvalStatus || 'Disetujui';
  const isApproved = currentStatus === 'Disetujui';
  const isPending = currentStatus === 'Menunggu Approval';
  const isRejected = currentStatus === 'Ditolak';

  // Role permissions
  const canApprove =
    canApproveProp !== undefined
      ? canApproveProp
      : userRole === 'Konsultan' ||
        userRole === 'Admin' ||
        userRole === 'Owner' ||
        userRole === 'Direktur' ||
        userRole === 'Quality Control';

  const defaultConsultantName =
    userRole === 'Konsultan'
      ? 'SAEPUL ANWAR (Kuasa Direktur MK)'
      : userRole === 'Owner' || userRole === 'Direktur'
      ? 'HASANUDIN (Direktur Utama PT. FORESYNDO GLOBAL INDONESIA)'
      : 'Tim Pengawas Mutu (MK)';

  // Form states
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [consultantName, setConsultantName] = useState(defaultConsultantName);
  const [docRef, setDocRef] = useState(
    material.inspectionDocRef || `BAPM-2026/MK/${material.id.replace('MAT-', '')}`
  );
  const [locationRack, setLocationRack] = useState(
    material.locationRack && !material.locationRack.includes('Transit')
      ? material.locationRack
      : 'Gudang Utama - Rak A1'
  );
  const [notes, setNotes] = useState(
    material.approvalNotes ||
      'Fisik kemasan utuh, sertifikasi SNI/pabrik sesuai RKS, volume fisik sesuai dokumen jalan. Disetujui masuk gudang & diterbitkan izin barcode.'
  );
  const [rejectionReason, setRejectionReason] = useState(
    material.rejectionReason || 'Spesifikasi teknis / fisik tidak memenuhi standar RKS.'
  );

  // Checklists
  const [checkPackage, setCheckPackage] = useState(true);
  const [checkSpec, setCheckSpec] = useState(true);
  const [checkVolume, setCheckVolume] = useState(true);

  // Sync state when material changes
  useEffect(() => {
    if (material) {
      setDocRef(material.inspectionDocRef || `BAPM-2026/MK/${material.id.replace('MAT-', '')}`);
      if (material.locationRack && !material.locationRack.includes('Transit')) {
        setLocationRack(material.locationRack);
      }
      if (material.approvalNotes) {
        setNotes(material.approvalNotes);
      }
      if (material.rejectionReason) {
        setRejectionReason(material.rejectionReason);
      }
    }
  }, [material]);

  const handleSubmitDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canApprove) return;

    if (decision === 'approve') {
      onApprove(material.id, {
        approvedBy: consultantName,
        notes: notes.trim(),
        inspectionDocRef: docRef.trim(),
        locationRack: locationRack.trim(),
      });
    } else {
      onReject(material.id, {
        rejectedBy: consultantName,
        reason: rejectionReason.trim(),
        inspectionDocRef: docRef.trim(),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative space-y-5 my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                isApproved
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : isRejected
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isApproved ? (
                <ShieldCheck className="w-6 h-6" />
              ) : isRejected ? (
                <XCircle className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Pemeriksaan Mutu &amp; Izin Barcode Material (Konsultan MK)
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verifikasi sebelum material masuk gudang &amp; aktivasi stiker barcode proyek
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-black inline-flex items-center gap-1.5 ${
                isApproved
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                  : isRejected
                  ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
              }`}
            >
              {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
              {isPending && <Clock className="w-3.5 h-3.5 animate-pulse" />}
              {isRejected && <XCircle className="w-3.5 h-3.5" />}
              {currentStatus}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 text-xs">
          {/* SOP Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-slate-200">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-800 dark:text-amber-300 block">
                  Regulasi SOP Gudang &amp; Pengawasan Mutu Proyek:
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  Setiap pasokan material baru yang tiba di lokasi <strong>WAJIB diperiksa dan disetujui (Approved)</strong> oleh{' '}
                  <strong>Konsultan Manajemen Konstruksi (MK)</strong>. Sebelum disetujui, material ditempatkan di Area Transit Karantina dan{' '}
                  <strong>stiker Barcode / QR Code dilarang diterbitkan</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Material Detail Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-black text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded border border-orange-200 dark:border-orange-800/40">
                {material.id}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Kategori: <strong>{material.category || 'Struktur & Sipil'}</strong>
              </span>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">{material.name}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Pemasok / Vendor: <strong className="text-slate-700 dark:text-slate-200">{material.supplier}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Volume Tiba</span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {material.volumeTotal} {material.unit}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Harga Satuan</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {formatIDR(material.pricePerUnit)}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">Tgl Tiba</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {material.arrivalDate}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase font-bold block">No. Batch / Lot</span>
                <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 truncate block">
                  {material.batchNumber || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Barcode Permission & Status Box */}
          <div
            className={`p-4 rounded-2xl border ${
              isApproved
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
                : isRejected
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isApproved ? (
                  <Unlock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                )}
                <span className="font-black text-xs">
                  {isApproved
                    ? 'Izin Barcode Resmi: DITERBITKAN (AKTIF)'
                    : isRejected
                    ? 'Izin Barcode: DITOLAK (DIBATALKAN)'
                    : 'Izin Barcode: TERKUNCI (Menunggu Approval Konsultan MK)'}
                </span>
              </div>

              {isApproved && (onOpenBarcodeTag || onOpenQRBadge) && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenBarcodeTag) {
                      onOpenBarcodeTag(material);
                    } else if (onOpenQRBadge) {
                      onOpenQRBadge(material);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                >
                  <QrCode className="w-3 h-3" /> Cetak / Lihat Label
                </button>
              )}
            </div>

            {isApproved ? (
              <div className="mt-2 text-[11px] space-y-1 text-slate-700 dark:text-slate-300">
                <div className="flex items-center justify-between border-t border-emerald-500/20 pt-1.5">
                  <span>Konsultan Pengawas: <strong>{material.approvedBy || 'Konsultan MK'}</strong></span>
                  <span>Tgl Persetujuan: <strong>{material.approvedAt || material.arrivalDate}</strong></span>
                </div>
                {material.inspectionDocRef && (
                  <div>No. Dokumen Berita Acara: <strong className="font-mono">{material.inspectionDocRef}</strong></div>
                )}
                {material.approvalNotes && (
                  <div className="italic text-slate-600 dark:text-slate-400">"{material.approvalNotes}"</div>
                )}
                <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 mt-1">
                  Barcode ID: {material.barcode || `899-${material.id}`} | Rak: {material.locationRack || 'Gudang Utama'}
                </div>
              </div>
            ) : isRejected ? (
              <div className="mt-2 text-[11px] text-rose-700 dark:text-rose-300 border-t border-rose-500/20 pt-1.5 space-y-1">
                <div>Alasan Penolakan: <strong>{material.rejectionReason || 'Spesifikasi tidak lolos uji fisik'}</strong></div>
                <div className="text-[10px]">Material dilarang ditempatkan di rak gudang dan wajib diretur ke pihak supplier.</div>
              </div>
            ) : (
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                Barcode dan QR Code tidak dapat dipindai untuk menambah stok aktif gudang dan tidak dapat dicetak stikernya sebelum ditandatangani oleh Konsultan MK.
              </p>
            )}
          </div>

          {/* Review & Approval Form for Consultant */}
          {canApprove ? (
            <form onSubmit={handleSubmitDecision} className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <UserCheck className="w-4 h-4 text-orange-500" />
                <span className="font-black text-xs text-slate-900 dark:text-white">
                  Formulir Keputusan Konsultan Manajemen Konstruksi (MK)
                </span>
              </div>

              {/* Action Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDecision('approve')}
                  className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    decision === 'approve'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Setujui Masuk Gudang (Terbitkan Barcode)
                </button>

                <button
                  type="button"
                  onClick={() => setDecision('reject')}
                  className={`py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    decision === 'reject'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Tolak Material (Retur Vendor)
                </button>
              </div>

              {decision === 'approve' ? (
                <>
                  {/* Quality Checklist */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                      Checklist Verifikasi Mutu Lapangan
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={checkPackage}
                        onChange={(e) => setCheckPackage(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Kondisi fisik kemasan &amp; material utuh (tidak rusak, cacat, atau bocor)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={checkSpec}
                        onChange={(e) => setCheckSpec(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Sesuai RKS &amp; dilampiri Mill Certificate / Surat Jalan Pabrik resmi</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={checkVolume}
                        onChange={(e) => setCheckVolume(e.target.checked)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Volume fisik yang dibongkar cocok dengan Surat Jalan ({material.volumeTotal} {material.unit})</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        No. Berita Acara Pemeriksaan Material (BAPM)
                      </label>
                      <input
                        type="text"
                        value={docRef}
                        onChange={(e) => setDocRef(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                        placeholder="Contoh: BAPM-2026/MK/09-08"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Izin Rak Penempatan Gudang
                      </label>
                      <input
                        type="text"
                        value={locationRack}
                        onChange={(e) => setLocationRack(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                        placeholder="Contoh: Gudang Utama - Rak B1"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Nama Konsultan MK Pemeriksa
                    </label>
                    <input
                      type="text"
                      value={consultantName}
                      onChange={(e) => setConsultantName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                      Catatan Teknis / Rekomendasi Konsultan
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      placeholder="Catatan inspeksi fisik & kelayakan..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block mb-1">
                      Alasan Penolakan Material (Wajib Diisi)
                    </label>
                    <textarea
                      rows={3}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900 text-xs text-slate-900 dark:text-white focus:ring-rose-500"
                      placeholder="Uraikan temuan cacat fisik, ketidaksesuaian merek, atau kegagalan uji mutu..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        No. Berita Acara Penolakan (BAPM-R)
                      </label>
                      <input
                        type="text"
                        value={docRef}
                        onChange={(e) => setDocRef(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Nama Konsultan Penolak
                      </label>
                      <input
                        type="text"
                        value={consultantName}
                        onChange={(e) => setConsultantName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl text-white font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                    decision === 'approve'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                      : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                  }`}
                >
                  {decision === 'approve' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Terbitkan Approval &amp; Izin Barcode
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Tolak Material &amp; Batalkan Barcode
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Non-consultant view */
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-center space-y-2">
              <Building2 className="w-6 h-6 text-slate-400 mx-auto" />
              <h5 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Otoritas Khusus Konsultan Manajemen Konstruksi (MK)
              </h5>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Anda login dengan peran <strong>{userRole}</strong>. Persetujuan masuk gudang dan penerbitan izin barcode material merupakan wewenang mutlak Konsultan MK / Pengawas Mutu Proyek.
              </p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-800/50">
                  <Send className="w-3 h-3" /> Berkas telah diajukan ke Tim Konsultan Pengawas Lapangan
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
