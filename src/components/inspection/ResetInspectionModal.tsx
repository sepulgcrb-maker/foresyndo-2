import React, { useState } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  X,
  CheckSquare,
  Square,
  ShieldAlert,
  ClipboardCheck,
  Send,
  PenTool,
  Award,
} from 'lucide-react';

export interface ResetOptions {
  resetChecklist: boolean;
  resetWorkflow: boolean;
  resetSignatures: boolean;
  revertProjectStatus: boolean;
}

interface ResetInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: (options: ResetOptions) => void;
  isProjectCompleted: boolean;
  currentStage?: string;
}

export const ResetInspectionModal: React.FC<ResetInspectionModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
  isProjectCompleted,
  currentStage = 'draft',
}) => {
  const [resetChecklist, setResetChecklist] = useState(true);
  const [resetWorkflow, setResetWorkflow] = useState(true);
  const [resetSignatures, setResetSignatures] = useState(true);
  const [revertProjectStatus, setRevertProjectStatus] = useState(isProjectCompleted);

  if (!isOpen) return null;

  const handleSelectAll = () => {
    setResetChecklist(true);
    setResetWorkflow(true);
    setResetSignatures(true);
    setRevertProjectStatus(isProjectCompleted);
  };

  const handleSelectSignaturesOnly = () => {
    setResetChecklist(false);
    setResetWorkflow(false);
    setResetSignatures(true);
    setRevertProjectStatus(isProjectCompleted);
  };

  const handleSelectChecklistOnly = () => {
    setResetChecklist(true);
    setResetWorkflow(false);
    setResetSignatures(false);
    setRevertProjectStatus(false);
  };

  const handleConfirm = () => {
    onConfirmReset({
      resetChecklist,
      resetWorkflow,
      resetSignatures,
      revertProjectStatus,
    });
  };

  const hasAnySelected = resetChecklist || resetWorkflow || resetSignatures || revertProjectStatus;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-rose-600 via-rose-700 to-amber-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black">Reset Modul Inspeksi &amp; BAST Akhir</h3>
              <p className="text-xs text-rose-100 mt-0.5">
                Pilih cakupan data yang ingin dikembalikan ke kondisi awal (awal proyek)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 dark:text-rose-200">
            <strong className="font-bold block">Peringatan Penghapusan Data:</strong>
            Data verifikasi inspeksi, status alur BAST, dan tanda tangan digital yang telah dibubuhkan akan dihapus dan diatur ulang ke status draft awal.
          </div>
        </div>

        {/* Quick Presets */}
        <div className="px-5 pt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Preset Cepat:</span>
          <button
            type="button"
            onClick={handleSelectAll}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Pilih Semua (Reset Total)
          </button>
          <button
            type="button"
            onClick={handleSelectSignaturesOnly}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Tanda Tangan Saja
          </button>
          <button
            type="button"
            onClick={handleSelectChecklistOnly}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Checklist Saja
          </button>
        </div>

        {/* Body Options */}
        <div className="p-5 space-y-3 overflow-y-auto">
          {/* Option 1: Checklist Sektor */}
          <div
            onClick={() => setResetChecklist(!resetChecklist)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
              resetChecklist
                ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-70'
            }`}
          >
            <div className="mt-0.5 text-rose-600 dark:text-rose-400 shrink-0">
              {resetChecklist ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Reset Checklist Inspeksi Sektor (14 Sektor)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Mengosongkan persetujuan Site Manager &amp; Direktur ke status belum lulus (0%) serta membersihkan catatan temuan inspeksi.
              </p>
            </div>
          </div>

          {/* Option 2: Alur Pengajuan BAST */}
          <div
            onClick={() => setResetWorkflow(!resetWorkflow)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
              resetWorkflow
                ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-70'
            }`}
          >
            <div className="mt-0.5 text-rose-600 dark:text-rose-400 shrink-0">
              {resetWorkflow ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Reset Alur Pengajuan BAST Kontraktor &amp; Dokumen Serah Terima
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Mengembalikan tahap alur ke &quot;Draft&quot; awal, mereset verifikasi lampiran berkas MK, serta mengosongkan Daftar Dokumen BAST &amp; status tanda tangan digital jika pekerjaan berstatus belum dimulai.
              </p>
            </div>
          </div>

          {/* Option 3: Tanda Tangan Tripartit */}
          <div
            onClick={() => setResetSignatures(!resetSignatures)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
              resetSignatures
                ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-70'
            }`}
          >
            <div className="mt-0.5 text-rose-600 dark:text-rose-400 shrink-0">
              {resetSignatures ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Reset Tanda Tangan Digital &amp; Kanvas Tripartit
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Menghapus coretan kanvas tanda tangan Site Manager (Kontraktor), Pengawas MK, dan Direktur Utama (Owner), serta membatalkan status sah BAST-1.
              </p>
            </div>
          </div>

          {/* Option 4: Status Proyek Selesai */}
          {isProjectCompleted && (
            <div
              onClick={() => setRevertProjectStatus(!revertProjectStatus)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                revertProjectStatus
                  ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-70'
              }`}
            >
              <div className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0">
                {revertProjectStatus ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    Kembalikan Status Proyek ke &quot;Dalam Pengerjaan&quot;
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Proyek saat ini berstatus &quot;Selesai&quot;. Mengaktifkan opsi ini akan membatalkan status selesai dan mengaktifkan kembali masa konstruksi.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!hasAnySelected}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 disabled:opacity-40 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" /> Konfirmasi Reset Modul
          </button>
        </div>
      </div>
    </div>
  );
};
