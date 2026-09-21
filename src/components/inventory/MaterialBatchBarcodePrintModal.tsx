import React, { useRef, useState } from 'react';
import { MaterialItem } from '../../types';
import { QRCodeSVG } from 'qrcode.react';
import { BarcodeSVG } from '../common/BarcodeSVG';
import { Printer, X, ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import { formatIDR } from '../../utils/calculations';

interface MaterialBatchBarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: MaterialItem[];
}

export const MaterialBatchBarcodePrintModal: React.FC<MaterialBatchBarcodePrintModalProps> = ({
  isOpen,
  onClose,
  materials,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [filterMode, setFilterMode] = useState<'approved_only' | 'all'>('approved_only');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const approvedMaterials = materials.filter(
    (m) => (m.approvalStatus || 'Disetujui') === 'Disetujui'
  );
  const pendingCount = materials.filter(
    (m) => m.approvalStatus === 'Menunggu Approval' || m.approvalStatus === 'Ditolak'
  ).length;

  const displayList = filterMode === 'approved_only' ? approvedMaterials : materials;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl p-6 shadow-2xl relative space-y-5 my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Cetak Lembar Label Barcode Material Proyek
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Resmi Konsultan MK
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Format stiker rak &amp; kemasan material (QR Code + Barcode 1D Code128)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" /> Cetak Sekarang (Print / PDF)
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 print:hidden text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMode('approved_only')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                filterMode === 'approved_only'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Hanya Disetujui Konsultan MK ({approvedMaterials.length})
            </button>
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                filterMode === 'all'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              Semua Pasokan ({materials.length})
            </button>
          </div>

          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{pendingCount} material belum disetujui MK (Barcode terkunci)</span>
            </div>
          )}
        </div>

        {/* Printable Grid Area */}
        <div ref={printAreaRef} className="overflow-y-auto flex-1 pr-1 space-y-4 print:p-0">
          <div className="hidden print:block text-center border-b pb-2 mb-4">
            <h1 className="text-lg font-black uppercase text-slate-900">
              PT FORESYNDO GLOBAL INDONESIA
            </h1>
            <p className="text-xs text-slate-600">
              Katalog Label Barcode Resmi - Proyek Pembangunan Gedung Jatitujuh Majalengka
            </p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
              Diverifikasi &amp; Disetujui oleh Konsultan Manajemen Konstruksi (MK)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3">
            {displayList.map((m) => {
              const isApproved = (m.approvalStatus || 'Disetujui') === 'Disetujui';
              const barcodeValue = m.barcode || m.id;
              const qrValue = `FORESYNDO-MAT:${m.id}`;

              return (
                <div
                  key={m.id}
                  className={`p-3.5 rounded-2xl border-2 bg-white text-slate-900 flex flex-col justify-between shadow-sm page-break-inside-avoid relative overflow-hidden ${
                    isApproved
                      ? 'border-slate-800 print:border-slate-400'
                      : 'border-amber-400 bg-amber-50/20'
                  }`}
                >
                  {!isApproved && (
                    <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-[1px] flex flex-col items-center justify-center p-3 text-center pointer-events-none z-10 border-2 border-dashed border-amber-500 m-1 rounded-xl">
                      <Lock className="w-6 h-6 text-amber-600 mb-1" />
                      <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        MENUNGGU APPROVAL KONSULTAN MK
                      </span>
                      <span className="text-[9px] text-amber-700 mt-1 font-semibold">
                        Barcode belum aktif &amp; belum berizin masuk gudang
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-b pb-1.5 mb-2">
                    <span className="text-[8px] font-black uppercase tracking-wider text-orange-600">
                      FORESYNDO SITE TAG
                    </span>
                    <span className="font-mono text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                      {m.id}
                    </span>
                  </div>

                  <div className="text-center mb-2">
                    <h4 className="text-xs font-black line-clamp-1 text-slate-900">{m.name}</h4>
                    <span className="text-[9px] text-slate-500 font-semibold block">
                      {m.supplier} {m.locationRack ? `• ${m.locationRack}` : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 my-1">
                    <div className="shrink-0 bg-white p-1 rounded-lg border border-slate-200">
                      <QRCodeSVG value={qrValue} size={64} level="M" />
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                      <BarcodeSVG value={barcodeValue} height={36} showText={true} barColor="#0f172a" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[9px] text-slate-600 pt-1.5 border-t border-slate-100">
                    <span>
                      Stok: <strong>{m.stockRemaining} {m.unit}</strong>
                    </span>
                    <span className="text-[8px] font-mono text-emerald-700 font-bold">
                      {isApproved ? '✓ Terverifikasi MK' : '⏳ Pending MK'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
