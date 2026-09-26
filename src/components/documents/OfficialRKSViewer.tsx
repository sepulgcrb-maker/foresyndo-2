import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  FileText,
  Download,
  Printer,
  Search,
  CheckCircle2,
  ShieldCheck,
  Building,
  HardHat,
  Layers,
  Wrench,
  Sparkles,
  X,
  ChevronRight,
  Filter,
  Copy,
  Check,
  Calendar,
  Clock,
  Award,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ProjectInfo, UserRole, RKSChapter, RKSClause } from '../../types';
import { OFFICIAL_RKS_CHAPTERS, RKS_META_INFO } from '../../data/rksData';
import { generateOfficialRKSPDF } from '../../utils/exportEngine';
import { formatIDR } from '../../utils/calculations';

interface OfficialRKSViewerProps {
  onClose: () => void;
  project?: Partial<ProjectInfo>;
  userRole?: UserRole;
  onAddAuditLog?: (action: string, details: string) => void;
}

export const OfficialRKSViewer: React.FC<OfficialRKSViewerProps> = ({
  onClose,
  project,
  userRole = 'Kontraktor',
  onAddAuditLog,
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedClause, setCopiedClause] = useState<string | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Category counts
  const categories = ['all', 'Administrasi', 'K3', 'Struktur', 'Arsitektur', 'MEP', 'Mutu & Serah Terima'];

  // Filtered chapters & clauses
  const filteredChapters = useMemo(() => {
    return OFFICIAL_RKS_CHAPTERS.filter((chapter) => {
      // Category filter
      if (selectedCategory !== 'all' && chapter.category !== selectedCategory) {
        return false;
      }
      // Chapter filter
      if (selectedChapterId !== 'all' && chapter.id !== selectedChapterId) {
        return false;
      }
      return true;
    }).map((chapter) => {
      // If there's a search query, filter clauses within the chapter
      if (!searchQuery.trim()) {
        return chapter;
      }
      const q = searchQuery.toLowerCase();
      const matchingClauses = chapter.clauses.filter((clause) => {
        const inNum = clause.number.toLowerCase().includes(q);
        const inTitle = clause.title.toLowerCase().includes(q);
        const inContent = clause.content.toLowerCase().includes(q);
        const inStandards = (clause.standards || []).some((s) => s.toLowerCase().includes(q));
        const inSub = (clause.subClauses || []).some(
          (sub) => sub.text.toLowerCase().includes(q) || (sub.requirement || '').toLowerCase().includes(q)
        );
        return inNum || inTitle || inContent || inStandards || inSub;
      });
      return {
        ...chapter,
        clauses: matchingClauses,
      };
    }).filter((chapter) => chapter.clauses.length > 0);
  }, [selectedChapterId, selectedCategory, searchQuery]);

  const totalMatchingClauses = useMemo(() => {
    return filteredChapters.reduce((acc, curr) => acc + curr.clauses.length, 0);
  }, [filteredChapters]);

  const handleCopyClause = (clause: RKSClause, chapter: RKSChapter) => {
    const textToCopy = `[RKS FORESYNDO 2 - ${chapter.chapterNumber} ${chapter.title}]\n${clause.number}: ${clause.title}\nStandar Acuan: ${(clause.standards || []).join(', ') || '-'}\n\n${clause.content}\n\n${
      clause.subClauses?.map((s) => `• (${s.code}) ${s.text} [Syarat: ${s.requirement || '-'}]`).join('\n') || ''
    }`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedClause(clause.number);
    setTimeout(() => {
      setCopiedClause(null);
    }, 2500);

    onAddAuditLog?.('Salin Klausul RKS', `Menyalin teks spesifikasi ${clause.number} (${clause.title})`);
  };

  const handleExportPDF = () => {
    setIsExportingPDF(true);
    try {
      generateOfficialRKSPDF(project, OFFICIAL_RKS_CHAPTERS, RKS_META_INFO);
      onAddAuditLog?.('Unduh Buku RKS Resmi', `Mengunduh dokumen PDF Buku RKS & Spesifikasi Teknis (${RKS_META_INFO.documentNumber})`);
    } catch (err) {
      console.warn('Export RKS PDF notice:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all">
        {/* 1. TOP HEADER BANNER */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-700/80 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {RKS_META_INFO.documentNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Tripartit Disetujui
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {RKS_META_INFO.revision}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white mt-1">
                  Rencana Kerja dan Syarat-Syarat (RKS) &amp; Spesifikasi Teknis
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  {project?.name || RKS_META_INFO.projectTitle} &bull; Nilai Kontrak:{' '}
                  <strong className="text-emerald-400">
                    {formatIDR(project?.contractValue || RKS_META_INFO.contractValueIDR)}
                  </strong>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExportingPDF ? 'Menyusun PDF...' : 'Unduh RKS (PDF)'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="hidden sm:flex px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold items-center gap-1.5 transition-all cursor-pointer"
                title="Cetak RKS"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak</span>
              </button>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer ml-1"
                aria-label="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tripartite Signatories Strip */}
          <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
            {RKS_META_INFO.tripartiteSignatories.map((sig, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-700/60"
              >
                <div>
                  <span className="text-slate-400 text-[10px] block">{sig.role}</span>
                  <span className="font-bold text-slate-200">{sig.name}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Valid</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. SEARCH & FILTER CONTROLS */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 shrink-0 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari klausul spesifikasi (mis: beton K-300, slump, besi SNI, granit, K3, hydrotest)..."
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/30"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Result Indicator */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
              <Layers className="w-4 h-4 text-orange-500" />
              <span>
                Menampilkan <strong>{totalMatchingClauses}</strong> dari{' '}
                <strong>{RKS_META_INFO.totalClauses}</strong> klausul pasal
              </span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedChapterId('all');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {cat === 'all' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3. MAIN CONTENT: CHAPTERS SIDEBAR + CLAUSES LIST */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* Left Chapter Navigator (Desktop) */}
          <div className="w-full md:w-72 p-3 bg-slate-100/60 dark:bg-slate-900/60 border-r border-slate-200 dark:border-slate-800 overflow-y-auto shrink-0 space-y-1 text-xs">
            <div className="px-2 py-1.5 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Daftar Bab RKS ({OFFICIAL_RKS_CHAPTERS.length})
            </div>

            <button
              onClick={() => setSelectedChapterId('all')}
              className={`w-full text-left p-2.5 rounded-xl font-bold transition-all flex items-center justify-between cursor-pointer ${
                selectedChapterId === 'all'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800'
              }`}
            >
              <span>Semua Bab Lengkap</span>
              <span className="text-[10px] opacity-80">{RKS_META_INFO.totalClauses} Pasal</span>
            </button>

            {OFFICIAL_RKS_CHAPTERS.map((ch) => {
              const isSelected = selectedChapterId === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    setSelectedChapterId(ch.id);
                    setSelectedCategory('all');
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 text-orange-600 dark:text-orange-400 shadow-sm border border-orange-500/30 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 font-medium'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-0.5">
                    <span className="font-mono font-bold text-orange-500">{ch.chapterNumber}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-200 dark:bg-slate-700/80">
                      {ch.category}
                    </span>
                  </div>
                  <div className="truncate text-xs text-slate-800 dark:text-slate-200 font-semibold">
                    {ch.title.replace(/^BAB [IVXLCDM]+ - /, '')}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Clauses Stream */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {filteredChapters.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Klausul RKS tidak ditemukan
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Tidak ada pasal atau spesifikasi teknis yang cocok dengan kata kunci &ldquo;{searchQuery}&rdquo;.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedChapterId('all');
                  }}
                  className="text-xs font-bold text-orange-500 hover:underline cursor-pointer"
                >
                  Reset Semua Filter
                </button>
              </div>
            ) : (
              filteredChapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
                >
                  {/* Chapter Section Title */}
                  <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md font-mono text-[11px] font-black bg-orange-500 text-white">
                          {chapter.chapterNumber}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {chapter.category}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-1">
                        {chapter.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {chapter.description}
                      </p>
                    </div>

                    <span className="text-xs font-semibold text-slate-400 shrink-0">
                      {chapter.clauses.length} Pasal
                    </span>
                  </div>

                  {/* Clauses Body */}
                  <div className="p-4 sm:p-6 space-y-6 divide-y divide-slate-100 dark:divide-slate-800/80">
                    {chapter.clauses.map((clause, idx) => (
                      <div key={idx} className={idx > 0 ? 'pt-6' : ''}>
                        {/* Clause Header & Copy Action */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                {clause.number}
                              </span>
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                                {clause.title}
                              </h4>
                            </div>

                            {/* Standard pills */}
                            {clause.standards && clause.standards.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] font-bold text-slate-400">Acuan:</span>
                                {clause.standards.map((std, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40"
                                  >
                                    {std}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Copy button */}
                          <button
                            onClick={() => handleCopyClause(clause, chapter)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all shrink-0 cursor-pointer"
                            title="Salin isi klausul"
                          >
                            {copiedClause === clause.number ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                <Check className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Tersalin</span>
                              </span>
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Main Clause Text */}
                        <div className="mt-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal bg-slate-50/60 dark:bg-slate-800/30 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                          {clause.content}
                        </div>

                        {/* Sub-Clauses / Criteria Badges */}
                        {clause.subClauses && clause.subClauses.length > 0 && (
                          <div className="mt-3 space-y-2 pl-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              Ketentuan Khusus &amp; Parameter Syarat Mutu:
                            </span>
                            <div className="grid grid-cols-1 gap-2">
                              {clause.subClauses.map((sub, subIdx) => (
                                <div
                                  key={subIdx}
                                  className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 shrink-0">
                                      {sub.code}
                                    </span>
                                    <span className="text-slate-800 dark:text-slate-200">{sub.text}</span>
                                  </div>
                                  {sub.requirement && (
                                    <div className="self-end sm:self-center shrink-0">
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                                        <Award className="w-3 h-3 text-emerald-500" />
                                        {sub.requirement}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 4. FOOTER BAR */}
        <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              Dokumen RKS ini merupakan lampiran sah yang mengikat Kontrak No.{' '}
              <strong className="text-slate-800 dark:text-slate-200">{project?.contractNumber || 'PR-2026-FGI-004'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExportingPDF ? 'Mengunduh...' : 'Unduh Dokumen Lengkap (PDF)'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
