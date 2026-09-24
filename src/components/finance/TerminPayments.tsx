import React, { useState } from 'react';
import { PaymentTerm, ProjectInfo, UserRole, WorkItem, RolePermissions } from '../../types';
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck2,
  Upload,
  Receipt,
  ShieldCheck,
  X,
  FileSpreadsheet,
  Download,
  FileText,
} from 'lucide-react';
import { formatIDR, calculateFinancialSummary, calculatePhysicalProgress } from '../../utils/calculations';
import { generateTerminPDF, generateTerminVoucherPDF } from '../../utils/exportEngine';
import { OfficialRABViewer } from './OfficialRABViewer';
import { SafeImage, FALLBACK_DOCUMENT_SVG } from '../common/SafeImage';

interface TerminPaymentsProps {
  project: ProjectInfo;
  paymentTerms: PaymentTerm[];
  workItems: WorkItem[];
  userRole: UserRole;
  permissions?: RolePermissions;
  onUpdateTermStatus: (
    termNumber: number,
    status: PaymentTerm['status'],
    paymentDate?: string,
    proofUrl?: string,
    approvedBy?: string
  ) => void;
  onApplyProgress25?: () => void;
}

export const TerminPayments: React.FC<TerminPaymentsProps> = ({
  project,
  paymentTerms,
  workItems,
  userRole,
  permissions,
  onUpdateTermStatus,
  onApplyProgress25,
}) => {
  const [selectedVoucherTerm, setSelectedVoucherTerm] = useState<PaymentTerm | null>(null);
  const [uploadProofModalTerm, setUploadProofModalTerm] = useState<PaymentTerm | null>(null);
  const [showRABModal, setShowRABModal] = useState(false);
  const [proofUrlInput, setProofUrlInput] = useState('');
  const [payDateInput, setPayDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const currentPhysicalProgress = calculatePhysicalProgress(workItems);
  const summary = calculateFinancialSummary(project.contractValue, paymentTerms);

  const handleDownloadTerminPDF = () => {
    setIsExportingPDF(true);
    try {
      generateTerminPDF(project, paymentTerms, workItems);
    } catch (err) {
      console.error('Error generating Termin PDF:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleDownloadSingleVoucherPDF = (term: PaymentTerm) => {
    try {
      generateTerminVoucherPDF(term, project);
    } catch (err) {
      console.error('Error generating Voucher PDF:', err);
    }
  };

  const isOwner = userRole === 'Owner' || userRole === 'Direktur';
  const isKonsultan = userRole === 'Konsultan';
  const isKontraktor = userRole === 'Kontraktor' || userRole === 'Site Manager' || userRole === 'Admin';

  const canApprove = permissions ? permissions.canApproveTermin : isOwner;
  const canVerify = permissions ? permissions.canVerifyOpname : (isKonsultan || isOwner);
  const canInputPayment = permissions ? permissions.canSubmitTermin : (isKontraktor || isOwner);

  const handleApproveTerm = (term: PaymentTerm) => {
    const approver = project.director
      ? `${project.director} (Direktur / Owner)`
      : 'HASANUDIN (Direktur / Owner)';

    onUpdateTermStatus(
      term.termNumber,
      'Dibayar',
      new Date().toISOString().split('T')[0],
      term.proofUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80',
      approver
    );
  };

  const handleSaveProofUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadProofModalTerm) return;

    const approver = project.director
      ? `${project.director} (Direktur / Owner)`
      : 'HASANUDIN (Direktur / Owner)';

    onUpdateTermStatus(
      uploadProofModalTerm.termNumber,
      canApprove ? 'Dibayar' : 'Menunggu Approval',
      payDateInput,
      proofUrlInput.trim() || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80',
      canApprove ? approver : undefined
    );

    setUploadProofModalTerm(null);
    setProofUrlInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Pembayaran Termin Proyek & Retensi</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Skema Pembayaran Berdasarkan Progres (Setiap 25% + Retensi 5% Per Termin)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadTerminPDF}
            disabled={isExportingPDF}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Download className={`w-4 h-4 ${isExportingPDF ? 'animate-spin' : ''}`} />
            {isExportingPDF ? 'Menyiapkan PDF...' : 'Download PDF Termin'}
          </button>
          <button
            onClick={() => setShowRABModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" /> Audit RAB Resmi Upload
          </button>
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 border border-slate-700 text-white text-xs font-bold">
            Nilai Kontrak: {formatIDR(project.contractValue)}
          </span>
        </div>
      </div>

      {/* Auto-Calculated Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Dibayar Netto */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-md">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">Total Dana Cair (Netto)</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {formatIDR(summary.totalPaidNet)}
          </span>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5 block">
            Progress Keuangan: {summary.financialProgressPercent}%
          </span>
        </div>

        {/* Total Retensi Terpotong */}
        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 shadow-md">
          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 block">Total Retensi Terpotong (5%)</span>
          <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
            {formatIDR(summary.totalRetentionHeld)}
          </span>
          <span className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5 block">
            Jaminan Pemeliharaan Proyek
          </span>
        </div>

        {/* Sisa Pembayaran Kontrak */}
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 shadow-md">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 block">Sisa Pembayaran Kontrak</span>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {formatIDR(summary.remainingContractValue)}
          </span>
          <span className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5 block">
            Termin Belum Cair
          </span>
        </div>

        {/* Progress Fisik Link */}
        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 shadow-md">
          <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 block">Progress Fisik Saat Ini</span>
          <span className="text-xl font-black text-orange-600 dark:text-orange-400 mt-1 block">
            {currentPhysicalProgress}%
          </span>
          <span className="text-[11px] text-orange-700 dark:text-orange-300 mt-0.5 block">
            {currentPhysicalProgress >= 75 ? 'Termin 3 Siap Dicairkan' : 'Menuju Target Termin berikutnya'}
          </span>
        </div>
      </div>

      {/* Termin Breakdown Cards / Table */}
      <div className="space-y-4">
        {paymentTerms.map((term) => {
          const isEligibleByProgress = currentPhysicalProgress >= term.targetProgressPercent;

          return (
            <div
              key={term.termNumber}
              className={`p-5 rounded-2xl border shadow-lg transition-all ${
                term.status === 'Dibayar'
                  ? 'bg-white dark:bg-slate-900 border-emerald-500/30'
                  : term.status === 'Menunggu Approval'
                  ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-90'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Term Info */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl font-black flex items-center justify-center text-base shrink-0 ${
                      term.status === 'Dibayar'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    }`}
                  >
                    T-{term.termNumber}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{term.title}</h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          term.status === 'Dibayar'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : term.status === 'Menunggu Approval'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/30'
                        }`}
                      >
                        {term.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Syarat Progress: <strong className="text-slate-800 dark:text-slate-200">{term.targetProgressPercent}%</strong> &bull; Status Fisik: {currentPhysicalProgress}%
                    </p>
                  </div>
                </div>

                {/* Term Math Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Nilai Termin (Bruto)</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formatIDR(term.grossValue)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Retensi ({term.retentionPercent}%)</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      -{formatIDR(term.retentionValue)}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-400 block font-medium">Netto Diterima</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      {formatIDR(term.netPayableValue)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {term.status === 'Dibayar' && (
                    <>
                      <button
                        onClick={() => setSelectedVoucherTerm(term)}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Receipt className="w-4 h-4 text-orange-500" /> Voucher
                      </button>
                      <button
                        onClick={() => handleDownloadSingleVoucherPDF(term)}
                        title="Download PDF Voucher Termin"
                        className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {term.status === 'Menunggu Approval' && canApprove && (
                    <button
                      onClick={() => handleApproveTerm(term)}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" /> Otorisasi Cair (Owner)
                    </button>
                  )}

                  {term.status === 'Belum Bayar' && isKonsultan && (
                    <button
                      onClick={() => onUpdateTermStatus(term.termNumber, 'Menunggu Approval')}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Verifikasi Opname (MK)
                    </button>
                  )}

                  {term.status !== 'Dibayar' && canInputPayment && (
                    <button
                      onClick={() => setUploadProofModalTerm(term)}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" /> {isOwner ? 'Input Pembayaran / Bukti' : 'Ajukan Tagihan Termin'}
                    </button>
                  )}
                </div>
              </div>

              {term.notes && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Catatan: {term.notes}</span>
                  {term.approvedBy && (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      Disetujui: {term.approvedBy} ({term.paymentDate})
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Bukti Transfer Modal */}
      {uploadProofModalTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Input Pembayaran {uploadProofModalTerm.title}
            </h3>

            <form onSubmit={handleSaveProofUpload} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Tanggal Pembayaran</label>
                <input
                  type="date"
                  value={payDateInput}
                  onChange={(e) => setPayDateInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">URL Bukti Transfer Bank (Unsplash / PDF Image)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={proofUrlInput}
                  onChange={(e) => setProofUrlInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                Nilai Netto Ditransfer: <strong>{formatIDR(uploadProofModalTerm.netPayableValue)}</strong> (setelah retensi 5%).
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setUploadProofModalTerm(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
                >
                  Simpan Bukti Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voucher Transfer Modal */}
      {selectedVoucherTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-900 dark:text-white space-y-4">
            <button
              onClick={() => setSelectedVoucherTerm(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">
                PT. FORESYNDO GLOBAL INDONESIA
              </span>
              <h3 className="text-lg font-black mt-1">VOUCHER PENCAIRAN TERMIN</h3>
              <p className="text-xs text-slate-400">Proyek FORESYNDO 2 - Jatitujuh, Majalengka</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Termin:</span>
                <span className="font-bold">{selectedVoucherTerm.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Tanggal Bayar:</span>
                <span className="font-bold">{selectedVoucherTerm.paymentDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Nilai Bruto:</span>
                <span className="font-bold">{formatIDR(selectedVoucherTerm.grossValue)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Potongan Retensi (5%):</span>
                <span className="font-bold text-red-500">-{formatIDR(selectedVoucherTerm.retentionValue)}</span>
              </div>
              <div className="flex justify-between py-2 bg-emerald-500/10 p-2 rounded-xl text-emerald-600 dark:text-emerald-400 font-black text-sm">
                <span>Total Netto Cair:</span>
                <span>{formatIDR(selectedVoucherTerm.netPayableValue)}</span>
              </div>
            </div>

            {selectedVoucherTerm.proofUrl && (
              <div>
                <span className="text-[11px] font-bold block mb-1">Lampiran Bukti Transfer:</span>
                <SafeImage
                  src={selectedVoucherTerm.proofUrl}
                  alt="Bukti Transfer"
                  fallbackSrc={FALLBACK_DOCUMENT_SVG}
                  className="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>
            )}

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => handleDownloadSingleVoucherPDF(selectedVoucherTerm)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download PDF Voucher Resmi
              </button>

              <div className="text-center">
                <span className="text-[11px] text-slate-400 font-medium block">
                  Disetujui Oleh: {selectedVoucherTerm.approvedBy || 'Direktur PT. Foresyndo'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official RAB Document Modal */}
      {showRABModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-1 sm:p-3 lg:p-4 overflow-y-auto flex items-start justify-center">
          <div className="w-full max-w-[98vw] 2xl:max-w-[1600px] my-1 sm:my-2">
            <OfficialRABViewer
              onClose={() => setShowRABModal(false)}
              project={project}
              onApplyProgress25={() => {
                if (onApplyProgress25) {
                  onApplyProgress25();
                  setShowRABModal(false);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
