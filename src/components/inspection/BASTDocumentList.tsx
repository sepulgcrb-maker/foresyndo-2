import React, { useState, useMemo } from 'react';
import {
  ProjectInfo,
  UserRole,
  BASTSubmissionData,
  WorkItem,
} from '../../types';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck2,
  FileText,
  Building2,
  UserCheck,
  Award,
  Search,
  Filter,
  Eye,
  Printer,
  ChevronRight,
  ShieldCheck,
  FilePlus2,
  QrCode,
  Calendar,
  X,
  Check,
  FileDown,
  Loader2,
  HardHat,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';
import { formatIDR } from '../../utils/calculations';
import { generateBASTPDF } from '../../utils/exportEngine';

interface BASTDocumentListProps {
  project: ProjectInfo;
  userRole: UserRole;
  bastList: BASTSubmissionData[];
  currentSubmissionId?: string;
  onSelectSubmission: (submission: BASTSubmissionData) => void;
  onGoToOfficialBAST: (submission?: BASTSubmissionData) => void;
  onOpenNewBASTModal: () => void;
  workItems?: WorkItem[];
}

export const BASTDocumentList: React.FC<BASTDocumentListProps> = ({
  project,
  userRole,
  bastList,
  currentSubmissionId,
  onSelectSubmission,
  onGoToOfficialBAST,
  onOpenNewBASTModal,
  workItems = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'both_signed' | 'mk_pending' | 'contractor_pending' | 'finalized'>('all');
  const [selectedPreviewBAST, setSelectedPreviewBAST] = useState<BASTSubmissionData | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Handle PDF generation & download
  const handleDownloadPDF = (doc: BASTSubmissionData) => {
    try {
      setDownloadingId(doc.submissionId);
      generateBASTPDF(doc, project, workItems);
      setToastMessage(`Dokumen BAST "${doc.bastNumber}" berhasil diunduh dalam format PDF.`);
      setTimeout(() => {
        setToastMessage(null);
      }, 4000);
    } catch (err) {
      console.warn('Gagal membuat PDF BAST notice:', err);
      setToastMessage('Gagal membuat file PDF. Silakan coba lagi.');
    } finally {
      setTimeout(() => {
        setDownloadingId(null);
      }, 500);
    }
  };

  // Stats calculation
  const totalDocs = bastList.length;
  const bothSignedCount = bastList.filter(
    (b) => b.contractorSignature.signed && b.mkSignature.signed
  ).length;
  const mkPendingCount = bastList.filter(
    (b) => b.contractorSignature.signed && !b.mkSignature.signed
  ).length;
  const contractorPendingCount = bastList.filter(
    (b) => !b.contractorSignature.signed
  ).length;
  const finalizedCount = bastList.filter((b) => b.stage === 'finalized').length;

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return bastList.filter((doc) => {
      const matchesSearch =
        doc.bastNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.submissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.title && doc.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (doc.scopeDescription && doc.scopeDescription.toLowerCase().includes(searchTerm.toLowerCase())) ||
        doc.contractorRepresentative.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'both_signed') {
        return doc.contractorSignature.signed && doc.mkSignature.signed;
      }
      if (statusFilter === 'mk_pending') {
        return doc.contractorSignature.signed && !doc.mkSignature.signed;
      }
      if (statusFilter === 'contractor_pending') {
        return !doc.contractorSignature.signed;
      }
      if (statusFilter === 'finalized') {
        return doc.stage === 'finalized';
      }

      return true;
    });
  }, [bastList, searchTerm, statusFilter]);

  const getStageBadge = (stage: BASTSubmissionData['stage']) => {
    switch (stage) {
      case 'draft':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            DRAFT
          </span>
        );
      case 'submitted':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            DIAJUKAN KE MK
          </span>
        );
      case 'joint_inspection':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            OPNAME BERSAMA
          </span>
        );
      case 'mk_recommended':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            REKOMENDASI MK
          </span>
        );
      case 'owner_approved':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-800">
            DISETUJUI OWNER
          </span>
        );
      case 'finalized':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-400 dark:border-emerald-700 flex items-center gap-1">
            <Award className="w-3 h-3" /> BAST SAH RESMI
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Stats */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border border-blue-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white">
                Verifikasi Dokumen Resmi
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Tanda Tangan Digital Tripartit
              </span>
              {project.status === 'Belum Mulai' ? (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Status Proyek: Belum Mulai
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  Status: {project.status}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-orange-400" />
              Daftar Dokumen BAST &amp; Status Tanda Tangan Digital
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              {bastList.length === 0
                ? 'Daftar berkas Berita Acara Serah Terima (BAST-1 Utama, Parsial, dan Komisioning) beserta pratinjau status tanda tangan digital masih kosong karena pekerjaan fisik konstruksi belum dimulai.'
                : 'Pantau seluruh berkas Berita Acara Serah Terima (BAST-1 Utama, Parsial, dan Komisioning) beserta pratinjau visual status tanda tangan digital Kontraktor Pelaksana dan Konsultan Pengawas MK.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {bastList.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const activeDoc = bastList.find((b) => b.submissionId === currentSubmissionId) || bastList[0];
                  handleDownloadPDF(activeDoc);
                }}
                disabled={downloadingId !== null}
                className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {downloadingId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
                <span>Cetak BAST (PDF)</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenNewBASTModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" /> Buat Pengajuan BAST Baru
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards: Digital Signature Status Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Berkas BAST
            </span>
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
            {totalDocs}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Seluruh dokumen terdaftar</span>
        </div>

        <div
          onClick={() => setStatusFilter('both_signed')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'both_signed'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              TTD Lengkap (KTR &amp; MK)
            </span>
            <div className="flex items-center text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {bothSignedCount}
          </span>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
            ✓ Kontraktor &amp; ✓ MK Terverifikasi
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('mk_pending')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'mk_pending'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Menunggu TTD Konsultan
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {mkPendingCount}
          </span>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80">
            ✓ Kontraktor, ✗ MK Belum TTD
          </span>
        </div>

        <div
          onClick={() => setStatusFilter('contractor_pending')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            statusFilter === 'contractor_pending'
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/20 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Belum TTD Kontraktor
            </span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {contractorPendingCount}
          </span>
          <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80">
            ✗ Menunggu tanda tangan awal
          </span>
        </div>
      </div>

      {/* KONDISI JIKA BELUM DIMULAI PEKERJAAN: TAMPILKAN EMPTY STATE KHUSUS & PENJELASAN LEGALITAS */}
      {bastList.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-500 shadow-inner">
              <ClipboardList className="w-10 h-10 stroke-[1.75]" />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-blue-600 text-white shadow-md">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <HardHat className="w-3.5 h-3.5" /> Pekerjaan Konstruksi Belum Dimulai
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Daftar Dokumen BAST &amp; Status Tanda Tangan Digital Masih Kosong
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Sesuai ketentuan standar kontrak konstruksi (Permen PUPR No. 14/2020), Berita Acara Serah Terima (BAST-1 Utama, BAST Parsial, dan Komisioning) beserta proses tanda tangan digital Tripartit baru dapat diterbitkan setelah tahapan pelaksanaan pekerjaan fisik di lapangan mulai berlangsung atau telah mencapai progres serah terima.
            </p>
          </div>

          {/* 3 Penjelasan Kebijakan Dokumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto text-left pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs">
                1
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Fisik Pekerjaan Masih 0%
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Kontrak proyek bernomor <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{project.contractNumber}</span> saat ini berstatus <strong>{project.status}</strong>. Belum ada volume pekerjaan terpasang yang dapat diserahterimakan.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
                2
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Verifikasi Opname &amp; QC
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Penerbitan BAST-1 PHO mensyaratkan checklist 14 sektor 100%, penyelesaian punch list, dan uji fungsi MEP / komisioning yang disetujui Konsultan MK.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-xs">
                3
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Integritas TTD Tripartit
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                Tanda tangan digital Kontraktor, Rekomendasi Konsultan MK, dan Pengesahan Direktur Owner memiliki kekuatan hukum sah dan dibubuhkan pasca inspeksi lapangan.
              </p>
            </div>
          </div>

          {/* Action CTA Box */}
          <div className="pt-2 max-w-md mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onOpenNewBASTModal}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" />
              <span>Buat Pengajuan Draft BAST Awal</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Filter, Search & View Mode Switcher */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Nomor BAST, No. Surat, nama sektor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Semua ({totalDocs})
            </button>
            <button
              onClick={() => setStatusFilter('both_signed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                statusFilter === 'both_signed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Lengkap ({bothSignedCount})
            </button>
            <button
              onClick={() => setStatusFilter('mk_pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                statusFilter === 'mk_pending'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Pending MK ({mkPendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('contractor_pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                statusFilter === 'contractor_pending'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" /> Pending KTR ({contractorPendingCount})
            </button>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-end md:self-center">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Tabel Rinci
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Kartu Pratinjau
          </button>
        </div>
      </div>

      {/* Legend Guide: Penjelasan Status Tanda Tangan */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-bold">Panduan Status Tanda Tangan Digital Tripartit:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ikon Ceklis (✓) = Tanda Tangan Sah &amp; Terverifikasi</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-bold">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Ikon Silang (✗) = Belum Ditandatangani</span>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: TABEL RINCI DENGAN PRATINJAU VISUAL TANDA TANGAN */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-3.5 text-center w-12">No</th>
                <th className="py-3 px-3.5">Dokumen &amp; No. BAST</th>
                <th className="py-3 px-3.5">Lingkup &amp; Nilai Serah Terima</th>
                <th className="py-3 px-3.5 text-center w-52">
                  <div className="flex items-center justify-center gap-1 text-orange-400">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>TTD Kontraktor</span>
                  </div>
                </th>
                <th className="py-3 px-3.5 text-center w-52">
                  <div className="flex items-center justify-center gap-1 text-blue-400">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>TTD Konsultan MK</span>
                  </div>
                </th>
                <th className="py-3 px-3.5 text-center w-36">Status Berkas</th>
                <th className="py-3 px-3.5 text-right w-44">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-600 dark:text-slate-300">Tidak ada dokumen BAST yang cocok.</p>
                    <p className="text-[11px] mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, idx) => {
                  const isActive = currentSubmissionId === doc.submissionId;
                  const ktrSigned = doc.contractorSignature.signed;
                  const mkSigned = doc.mkSignature.signed;

                  return (
                    <tr
                      key={doc.submissionId}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isActive ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {/* No */}
                      <td className="py-3.5 px-3.5 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Dokumen & No. BAST */}
                      <td className="py-3.5 px-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-slate-900 dark:text-white font-mono text-[11px]">
                              {doc.bastNumber}
                            </span>
                            {isActive && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-600 text-white uppercase">
                                Aktif di Alur
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                            {doc.title || `BAST-1 Pengajuan Proyek`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            No. Surat: {doc.submissionNumber} • Tgl: {doc.handoverDate || doc.submissionDate}
                          </span>
                        </div>
                      </td>

                      {/* Lingkup & Nilai */}
                      <td className="py-3.5 px-3.5">
                        <div className="space-y-0.5">
                          <span className="text-slate-800 dark:text-slate-200 text-[11px] font-medium block line-clamp-2 max-w-xs">
                            {doc.scopeDescription || doc.contractorNotes || 'Seluruh sektor pekerjaan rampung 100%'}
                          </span>
                          <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 font-mono block">
                            {formatIDR(doc.contractNominal || project.contractValue)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Retensi 5%: {formatIDR(doc.retentionValue || (doc.contractNominal || project.contractValue) * 0.05)}
                          </span>
                        </div>
                      </td>

                      {/* VISUAL PREVIEW: TTD KONTRAKTOR */}
                      <td className="py-3.5 px-3.5">
                        <div
                          onClick={() => setSelectedPreviewBAST(doc)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer group ${
                            ktrSigned
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 hover:ring-2 hover:ring-emerald-500/30'
                              : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80 hover:ring-2 hover:ring-rose-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1 rounded-lg shrink-0 ${
                                ktrSigned ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                              }`}
                            >
                              {ktrSigned ? (
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                              ) : (
                                <XCircle className="w-4 h-4 stroke-[2.5]" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`text-[11px] font-black uppercase tracking-tight block truncate ${
                                    ktrSigned ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                                  }`}
                                >
                                  {ktrSigned ? '✓ Sudah TTD' : '✗ Belum TTD'}
                                </span>
                                <Eye className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate block">
                                {doc.contractorSignature.name || doc.contractorRepresentative || project.siteManager || 'Kontraktor'}
                              </span>
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono block">
                                {ktrSigned
                                  ? doc.contractorSignature.signedAt || 'Terverifikasi Digital'
                                  : 'Menunggu Pengesahan'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* VISUAL PREVIEW: TTD KONSULTAN MK */}
                      <td className="py-3.5 px-3.5">
                        <div
                          onClick={() => setSelectedPreviewBAST(doc)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer group ${
                            mkSigned
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 hover:ring-2 hover:ring-emerald-500/30'
                              : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/80 hover:ring-2 hover:ring-rose-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`p-1 rounded-lg shrink-0 ${
                                mkSigned ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                              }`}
                            >
                              {mkSigned ? (
                                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                              ) : (
                                <XCircle className="w-4 h-4 stroke-[2.5]" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`text-[11px] font-black uppercase tracking-tight block truncate ${
                                    mkSigned ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                                  }`}
                                >
                                  {mkSigned ? '✓ Sudah TTD' : '✗ Belum TTD'}
                                </span>
                                <Eye className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate block">
                                {doc.mkSignature.name || doc.mkVerifiedBy || project.consultantMK || 'Konsultan MK'}
                              </span>
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono block">
                                {mkSigned
                                  ? doc.mkSignature.signedAt || 'Rekomendasi Terbit'
                                  : 'Menunggu Evaluasi MK'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Berkas */}
                      <td className="py-3.5 px-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          {getStageBadge(doc.stage)}
                          <span className="text-[9px] text-slate-400">
                            {doc.attachments?.filter((a) => a.isCompleted).length || 0} / {doc.attachments?.length || 7} Berkas
                          </span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Cetak BAST (PDF) */}
                          <button
                            type="button"
                            onClick={() => handleDownloadPDF(doc)}
                            disabled={downloadingId === doc.submissionId}
                            title="Cetak BAST (Download File PDF Resmi Lengkap)"
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                          >
                            {downloadingId === doc.submissionId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <FileDown className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">Cetak BAST</span>
                          </button>

                          {/* Tombol Pratinjau Tanda Tangan */}
                          <button
                            type="button"
                            onClick={() => setSelectedPreviewBAST(doc)}
                            title="Pratinjau Tanda Tangan & QR Code"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Buka Tab Dokumen Resmi BAST-1 */}
                          <button
                            type="button"
                            onClick={() => {
                              onSelectSubmission(doc);
                              onGoToOfficialBAST(doc);
                            }}
                            title="Buka Lembar BAST-1 di Tab Resmi"
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => onSelectSubmission(doc)}
                              className="px-2 py-1 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-950 text-white font-bold text-[10px] transition-all cursor-pointer"
                            >
                              Pilih Aktif
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW MODE 2: KARTU PRATINJAU VISUAL (GRID VIEW) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const isActive = currentSubmissionId === doc.submissionId;
            const ktrSigned = doc.contractorSignature.signed;
            const mkSigned = doc.mkSignature.signed;

            return (
              <div
                key={doc.submissionId}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between space-y-4 shadow-sm relative ${
                  isActive
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                      {doc.bastNumber}
                    </span>
                    {getStageBadge(doc.stage)}
                  </div>

                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                    {doc.title || 'BAST-1 Pengajuan Serah Terima'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {doc.scopeDescription || doc.contractorNotes || 'Seluruh pekerjaan terselesaikan sesuai gambar terlaksana.'}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Nilai Kontrak:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">
                        {formatIDR(doc.contractNominal || project.contractValue)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tanggal Handover:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">
                        {doc.handoverDate || doc.submissionDate}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* DUAL VISUAL SIGNATURE BADGES: KONTRAKTOR & MK */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                    Status Tanda Tangan Digital:
                  </span>

                  {/* Kontraktor Badge */}
                  <div
                    onClick={() => setSelectedPreviewBAST(doc)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      ktrSigned
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {ktrSigned ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <div>
                        <span className="text-[10px] font-black block">
                          PIHAK KONTRAKTOR {ktrSigned ? '✓ SAH' : '✗ BELUM TTD'}
                        </span>
                        <span className="text-[10px] font-medium opacity-90 truncate block max-w-[150px]">
                          {doc.contractorSignature.name || project.siteManager}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono opacity-75">
                      {ktrSigned ? 'Terverifikasi' : 'Menunggu'}
                    </span>
                  </div>

                  {/* Konsultan MK Badge */}
                  <div
                    onClick={() => setSelectedPreviewBAST(doc)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      mkSigned
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {mkSigned ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <div>
                        <span className="text-[10px] font-black block">
                          KONSULTAN MK {mkSigned ? '✓ SAH' : '✗ BELUM TTD'}
                        </span>
                        <span className="text-[10px] font-medium opacity-90 truncate block max-w-[150px]">
                          {doc.mkSignature.name || project.consultantMK}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono opacity-75">
                      {mkSigned ? 'Terverifikasi' : 'Menunggu'}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewBAST(doc)}
                    className="py-2 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Pratinjau TTD
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(doc)}
                    disabled={downloadingId === doc.submissionId}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {downloadingId === doc.submissionId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5" />
                    )}
                    <span>Cetak BAST (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onSelectSubmission(doc);
                      onGoToOfficialBAST(doc);
                    }}
                    title="Buka Lembar BAST-1 di Tab Resmi"
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* POPUP MODAL: PRATINJAU VISUAL TANDA TANGAN DIGITAL & QR VERIFIKASI */}
      {selectedPreviewBAST && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden transition-all">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-blue-900/40 flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-orange-500 text-white">
                    Pratinjau Tanda Tangan
                  </span>
                  <span className="text-xs font-mono text-blue-300">
                    {selectedPreviewBAST.bastNumber}
                  </span>
                </div>
                <h3 className="text-base font-black text-white">
                  {selectedPreviewBAST.title || 'Dokumen Berita Acara Serah Terima (BAST-1)'}
                </h3>
              </div>

              <button
                onClick={() => setSelectedPreviewBAST(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Document Overview */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">No. Surat Permohonan:</span>
                  <strong className="text-slate-900 dark:text-white font-mono text-xs">
                    {selectedPreviewBAST.submissionNumber}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Tanggal Handover:</span>
                  <strong className="text-slate-900 dark:text-white font-mono text-xs">
                    {selectedPreviewBAST.handoverDate || selectedPreviewBAST.submissionDate}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Status Tahapan:</span>
                  {getStageBadge(selectedPreviewBAST.stage)}
                </div>
              </div>

              {/* Side-by-side Visual Signature Panels: Kontraktor vs Konsultan MK */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Panel Kontraktor */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    selectedPreviewBAST.contractorSignature.signed
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-wider">
                      PIHAK KONTRAKTOR
                    </span>
                    <div
                      className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                        selectedPreviewBAST.contractorSignature.signed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {selectedPreviewBAST.contractorSignature.signed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> SUDAH TTD
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> BELUM TTD
                        </>
                      )}
                    </div>
                  </div>

                  {/* Signature Visual Canvas / Stamp */}
                  <div className="h-32 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center p-3 text-center shadow-inner relative overflow-hidden">
                    {selectedPreviewBAST.contractorSignature.signed ? (
                      selectedPreviewBAST.contractorSignature.signatureData &&
                      selectedPreviewBAST.contractorSignature.signatureData.startsWith('data:image') ? (
                        <img
                          src={selectedPreviewBAST.contractorSignature.signatureData}
                          alt="Tanda Tangan Kontraktor"
                          className="max-h-24 max-w-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-emerald-800">
                          <QrCode className="w-10 h-10 text-emerald-600 mb-1" />
                          <span className="text-xs font-black text-emerald-900">VERIFIED QR SIGNATURE</span>
                          <span className="text-[9px] text-emerald-600 font-mono">
                            ID: KTR-{selectedPreviewBAST.submissionId.slice(-6).toUpperCase()}
                          </span>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <XCircle className="w-8 h-8 text-rose-400 mb-1" />
                        <span className="text-xs font-bold text-rose-500">Tanda Tangan Belum Dibubuhkan</span>
                        <span className="text-[10px] text-slate-400">Menunggu otorisasi Site Manager</span>
                      </div>
                    )}
                  </div>

                  {/* Signatory Details */}
                  <div className="space-y-0.5 text-[11px]">
                    <span className="text-slate-400 text-[10px] block">Penandatangan Resmi:</span>
                    <strong className="text-slate-900 dark:text-white block">
                      {selectedPreviewBAST.contractorSignature.name || project.siteManager || 'EKO YULIANTO'}
                    </strong>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">
                      Jabatan: Site Manager Lapangan
                    </span>
                    {selectedPreviewBAST.contractorSignature.signedAt && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block">
                        Waktu TTD: {selectedPreviewBAST.contractorSignature.signedAt}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Panel Konsultan MK */}
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    selectedPreviewBAST.mkSignature.signed
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                      : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                      KONSULTAN PENGAWAS MK
                    </span>
                    <div
                      className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                        selectedPreviewBAST.mkSignature.signed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {selectedPreviewBAST.mkSignature.signed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> SUDAH TTD
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> BELUM TTD
                        </>
                      )}
                    </div>
                  </div>

                  {/* Signature Visual Canvas / Stamp */}
                  <div className="h-32 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center p-3 text-center shadow-inner relative overflow-hidden">
                    {selectedPreviewBAST.mkSignature.signed ? (
                      selectedPreviewBAST.mkSignature.signatureData &&
                      selectedPreviewBAST.mkSignature.signatureData.startsWith('data:image') ? (
                        <img
                          src={selectedPreviewBAST.mkSignature.signatureData}
                          alt="Tanda Tangan Konsultan MK"
                          className="max-h-24 max-w-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-blue-800">
                          <QrCode className="w-10 h-10 text-blue-600 mb-1" />
                          <span className="text-xs font-black text-blue-900">VERIFIED MK SIGNATURE</span>
                          <span className="text-[9px] text-blue-600 font-mono">
                            ID: MK-{selectedPreviewBAST.submissionId.slice(-6).toUpperCase()}
                          </span>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <XCircle className="w-8 h-8 text-rose-400 mb-1" />
                        <span className="text-xs font-bold text-rose-500">Tanda Tangan Belum Dibubuhkan</span>
                        <span className="text-[10px] text-slate-400">Menunggu rekomendasi &amp; TTD MK</span>
                      </div>
                    )}
                  </div>

                  {/* Signatory Details */}
                  <div className="space-y-0.5 text-[11px]">
                    <span className="text-slate-400 text-[10px] block">Penandatangan Resmi:</span>
                    <strong className="text-slate-900 dark:text-white block">
                      {selectedPreviewBAST.mkSignature.name || project.consultantMK || 'SAEPUL ANWAR'}
                    </strong>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block">
                      Jabatan: Team Leader Konsultan Pengawas MK
                    </span>
                    {selectedPreviewBAST.mkSignature.signedAt && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block">
                        Waktu TTD: {selectedPreviewBAST.mkSignature.signedAt}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedPreviewBAST(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Tutup Pratinjau
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectSubmission(selectedPreviewBAST);
                    setSelectedPreviewBAST(null);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Pilih Dokumen Aktif
                </button>

                <button
                  type="button"
                  onClick={() => handleDownloadPDF(selectedPreviewBAST)}
                  disabled={downloadingId === selectedPreviewBAST.submissionId}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {downloadingId === selectedPreviewBAST.submissionId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileDown className="w-4 h-4" />
                  )}
                  <span>Cetak BAST (Unduh PDF)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectSubmission(selectedPreviewBAST);
                    onGoToOfficialBAST(selectedPreviewBAST);
                    setSelectedPreviewBAST(null);
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Format Tab
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white border border-emerald-500/40 rounded-2xl shadow-2xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
