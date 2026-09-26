import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardHat,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Sparkles,
  FileText,
  PenTool,
  Upload,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Check,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { ProjectDocument, DocumentStatus, DocumentReviewNote, UserRole } from '../../types';
import { RoleBadge } from '../common/RoleBadge';

interface TechnicalDrawingReviewModalProps {
  document: ProjectDocument;
  isOpen: boolean;
  onClose: () => void;
  onSubmitReview: (reviewData: {
    status: DocumentStatus;
    comment: string;
    updatedFileUrl?: string;
  }) => void;
  userRole: UserRole;
  activeUserName: string;
  isKontraktor: boolean;
  onDownloadOriginal?: (doc: ProjectDocument) => void;
  onDownloadPdf?: (doc: ProjectDocument) => void;
}

export const TechnicalDrawingReviewModal: React.FC<TechnicalDrawingReviewModalProps> = ({
  document: doc,
  isOpen,
  onClose,
  onSubmitReview,
  userRole,
  activeUserName,
  isKontraktor,
  onDownloadOriginal,
  onDownloadPdf,
}) => {
  if (!isOpen) return null;

  // Review Form States
  const [reviewStatus, setReviewStatus] = useState<DocumentStatus>(
    doc.status === 'Review' ? 'Approved' : doc.status
  );
  const [reviewComment, setReviewComment] = useState('');
  const [attachedFileUrl, setAttachedFileUrl] = useState<string | undefined>(doc.fileUrl);

  // Drawing Visual States
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [invertBlueprint, setInvertBlueprint] = useState(false);
  const [clarityMode, setClarityMode] = useState<'normal' | 'sharp'>('sharp');
  const [imageError, setImageError] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check file types
  const hasUploadedImage = Boolean(
    !imageError &&
    attachedFileUrl &&
    typeof attachedFileUrl === 'string' &&
    !attachedFileUrl.startsWith('[') &&
    (attachedFileUrl.startsWith('data:image') ||
      attachedFileUrl.startsWith('blob:') ||
      doc.fileType === 'image' ||
      doc.fileType === 'png' ||
      doc.fileType === 'jpg' ||
      doc.fileType === 'jpeg' ||
      /\.(png|jpe?g|webp|svg|gif|bmp)(\?.*)?$/i.test(attachedFileUrl) ||
      (!attachedFileUrl.startsWith('data:application/pdf') &&
        !attachedFileUrl.toLowerCase().endsWith('.pdf') &&
        (attachedFileUrl.startsWith('http://') || attachedFileUrl.startsWith('https://') || attachedFileUrl.startsWith('/'))))
  );

  const isPdf = Boolean(
    doc.fileType === 'pdf' ||
    (attachedFileUrl &&
      typeof attachedFileUrl === 'string' &&
      (attachedFileUrl.startsWith('data:application/pdf') || attachedFileUrl.toLowerCase().endsWith('.pdf')))
  );

  // Reset zoom & pan on open
  useEffect(() => {
    setZoom(100);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setImageError(false);
    setAttachedFileUrl(doc.fileUrl);
    setReviewStatus(doc.status === 'Review' ? 'Approved' : doc.status);
    setReviewComment('');
  }, [doc.id, doc.fileUrl]);

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 100) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 100) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom((prev) => Math.min(prev + 20, 400));
      } else {
        setZoom((prev) => Math.max(prev - 20, 50));
      }
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 400));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // File replacement right in review modal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setAttachedFileUrl(dataUrl);
        setImageError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick Preset Comments
  const quickPresets = isKontraktor
    ? [
        {
          label: 'Disetujui Sesuai RKS & DED',
          text: 'Dimensi gambar kerja, notasi penulangan, dan elevasi telah dicek sesuai RKS & DED. Siap dilaksanakan di lapangan.',
          status: 'Approved' as DocumentStatus,
        },
        {
          label: 'Periksa Selimut Beton & Sengkang',
          text: 'Harap periksa kembali kerapatan sengkang di tumpuan kolom dan pastikan ketebalan selimut beton minimal 40mm.',
          status: 'Revision' as DocumentStatus,
        },
        {
          label: 'Klarifikasi Elevasi ke MK',
          text: 'Terdapat ketidaksesuaian elevasi acuan BM ±0.00 di lapangan dengan gambar. Menunggu klarifikasi tertulis dari Konsultan MK.',
          status: 'Review' as DocumentStatus,
        },
        {
          label: 'Koordinasi MEP & Struktur',
          text: 'Titik sparing instalasi pipa plumbing memotong balok utama. Mohon diterbitkan revisi shop drawing penempatan sparing.',
          status: 'Revision' as DocumentStatus,
        },
      ]
    : [
        {
          label: 'Dokumen Disetujui (Approved)',
          text: 'Gambar kerja telah diverifikasi dan memenuhi standar teknis, perhitungan beban, dan spesifikasi kontrak. Disetujui untuk konstruksi.',
          status: 'Approved' as DocumentStatus,
        },
        {
          label: 'Perbaikan Dimensi / Rebar',
          text: 'Catatan MK: Gambar belum mencantumkan detail kait gempa 135 derajat pada sengkang kolom. Harap segera direvisi.',
          status: 'Revision' as DocumentStatus,
        },
        {
          label: 'Tinjau Kembali Data Lapangan',
          text: 'Perlu konfirmasi hasil uji sondir / kalendering pemancangan sebelum gambar pondasi ini dapat disahkan.',
          status: 'Review' as DocumentStatus,
        },
      ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      alert('Mohon tuliskan catatan review teknis pada gambar ini.');
      return;
    }

    onSubmitReview({
      status: reviewStatus,
      comment: reviewComment.trim(),
      updatedFileUrl: attachedFileUrl !== doc.fileUrl ? attachedFileUrl : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        className={`bg-slate-900 border border-slate-700/80 rounded-3xl w-full flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? 'fixed inset-2 max-w-none max-h-none z-50 h-[calc(100vh-16px)]'
            : 'max-w-6xl max-h-[92vh]'
        }`}
      >
        {/* ========================================================================= */}
        {/* 1. TOP MODAL HEADER */}
        {/* ========================================================================= */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border-b border-slate-700/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              {isKontraktor ? <HardHat className="w-5 h-5" /> : <PenTool className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-amber-400">
                  {doc.documentNumber}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-200">
                  {doc.version}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {doc.category === 'drawing' ? 'Gambar Teknis (DED/Shop Drawing)' : doc.category.toUpperCase()}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white truncate mt-0.5">
                {isKontraktor
                  ? 'Review Gambar Kerja Terlaksana (Pengecekan Fisik Lapangan)'
                  : 'Verifikasi & Approval Gambar Teknis Resmi'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onDownloadOriginal && (
              <button
                onClick={() => onDownloadOriginal(doc)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                title="Unduh Berkas Gambar Asli"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Gambar</span>
              </button>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Perbesar Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. MAIN SPLIT BODY: VISUAL INSPECTION (LEFT) + REVIEW FORM (RIGHT) */}
        {/* ========================================================================= */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden bg-slate-950">
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT: INTERACTIVE DRAWING INSPECTION CANVAS */}
          {/* ----------------------------------------------------------------------- */}
          <div className="flex-1 flex flex-col min-w-0 border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950 overflow-hidden">
            {/* Toolbar for Drawing View */}
            <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 font-bold text-slate-200">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span className="truncate max-w-[200px] sm:max-w-xs">{doc.fileName || doc.title}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold">
                  SESUAI BERKAS UPLOAD
                </span>
              </div>

              {/* Inspection Controls: Zoom, Pan, Rotate, Contrast */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 50}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Perkecil Zoom (-)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <span className="font-mono text-xs font-bold text-slate-300 px-1 min-w-[45px] text-center">
                  {zoom}%
                </span>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 400}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Perbesar Zoom (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 transition-colors cursor-pointer"
                  title="Reset Ukuran Normal (100%)"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Putar 90 Derajat (Rotate)"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setInvertBlueprint(!invertBlueprint)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    invertBlueprint
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="Mode Kontras Cetak Biru (Blueprint CAD)"
                >
                  Blueprint
                </button>

                <button
                  type="button"
                  onClick={() => setClarityMode(clarityMode === 'sharp' ? 'normal' : 'sharp')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    clarityMode === 'sharp'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                  title="Filter Ketajaman Garis Gambar (Clarity HDR)"
                >
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-orange-400" /> Tajam
                  </span>
                </button>

                {/* Upload or swap drawing button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png,image/jpeg,image/jpg,image/webp,.pdf,.dwg"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ml-1"
                  title="Ganti / Lampirkan Berkas Gambar Baru untuk Direview"
                >
                  <Upload className="w-3 h-3 text-indigo-400" />
                  <span>Ganti Berkas</span>
                </button>
              </div>
            </div>

            {/* Drawing Viewport */}
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              onDoubleClick={handleResetZoom}
              className={`flex-1 relative overflow-hidden flex items-center justify-center p-4 select-none min-h-[360px] ${
                zoom > 100 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
              }`}
              style={{
                backgroundColor: '#090d16',
                backgroundImage: 'radial-gradient(#1e293b 1.5px, transparent 1.5px)',
                backgroundSize: '24px 24px',
              }}
            >
              {hasUploadedImage ? (
                <div
                  className="transition-transform duration-100 ease-out origin-center flex items-center justify-center pointer-events-none"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
                  }}
                >
                  <img
                    src={attachedFileUrl}
                    alt={doc.title}
                    onError={() => setImageError(true)}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl border border-slate-700 pointer-events-auto transition-all"
                    style={{
                      filter: `${invertBlueprint ? 'invert(0.9) hue-rotate(180deg) contrast(1.2)' : ''} ${
                        clarityMode === 'sharp' ? 'contrast(1.15) saturate(1.1)' : ''
                      }`,
                    }}
                  />
                </div>
              ) : isPdf && attachedFileUrl ? (
                <div className="w-full h-full min-h-[420px] flex flex-col rounded-xl overflow-hidden border border-slate-800 bg-white">
                  <iframe
                    src={attachedFileUrl}
                    title={doc.title}
                    className="w-full h-full flex-1"
                  />
                </div>
              ) : (
                /* Fallback Drawing Schematic if no image uploaded yet */
                <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <PenTool className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Gambar Kerja DED / Shop Drawing</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Dokumen <span className="font-mono text-amber-400">{doc.documentNumber}</span> ({doc.fileName}).
                      Anda dapat mengunggah berkas gambar kerja asli (.png, .jpg, .dwg, .pdf) untuk ditelaah langsung pada panel ini.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Unggah Berkas Gambar Asli</span>
                  </button>
                </div>
              )}

              {/* Floating Helper Notice at Bottom of Viewport */}
              <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80 pointer-events-none">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Visual gambar kerja terlaksana tervalidasi sesuai dokumen lelang &amp; RKS
                </span>
                <span className="hidden sm:inline text-slate-500 text-[10px]">
                  Gunakan Mousewheel untuk zoom &bull; Drag untuk menggeser gambar
                </span>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT: TECHNICAL REVIEW DECISION & NOTES FORM */}
          {/* ----------------------------------------------------------------------- */}
          <div className="w-full lg:w-96 p-5 sm:p-6 bg-slate-900/95 flex flex-col justify-between overflow-y-auto space-y-5 text-xs shrink-0">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Document Identity Box */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-1.5">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  Identitas Gambar yang Ditinjau:
                </div>
                <div className="font-bold text-white text-xs leading-snug">{doc.title}</div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/50">
                  <span>Diupload Oleh:</span>
                  <span className="font-semibold text-slate-200">{doc.uploadedBy} ({doc.uploadedByRole})</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Status Dokumen Saat Ini:</span>
                  <span className="font-mono font-bold text-amber-400">{doc.status}</span>
                </div>
              </div>

              {/* Status Decision Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 block">
                  {isKontraktor ? 'Keputusan Hasil Review Lapangan' : 'Keputusan Approval Dokumen'} *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('Approved')}
                    className={`p-2.5 rounded-xl text-center font-bold transition-all cursor-pointer border ${
                      reviewStatus === 'Approved'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                    <span className="text-[11px] block">{isKontraktor ? 'Disetujui' : 'Setujui'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('Revision')}
                    className={`p-2.5 rounded-xl text-center font-bold transition-all cursor-pointer border ${
                      reviewStatus === 'Revision'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-rose-400" />
                    <span className="text-[11px] block">Minta Revisi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setReviewStatus('Review')}
                    className={`p-2.5 rounded-xl text-center font-bold transition-all cursor-pointer border ${
                      reviewStatus === 'Review'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <Clock className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                    <span className="text-[11px] block">Tinjau Kembali</span>
                  </button>
                </div>
              </div>

              {/* Quick Presets for Construction Feedback */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 block">
                  Pilihan Cepat Catatan Teknis (1-Klik):
                </label>
                <div className="flex flex-col gap-1.5">
                  {quickPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setReviewComment(preset.text);
                        setReviewStatus(preset.status);
                      }}
                      className="text-left p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-[11px] cursor-pointer flex items-center justify-between group"
                    >
                      <span className="truncate">{preset.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Comment Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    {isKontraktor ? 'Catatan Lapangan & Respon Kontraktor' : 'Uraian Review Teknis & Arahan'} *
                  </label>
                  <span className="text-[10px] text-slate-500">{reviewComment.length} karakter</span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    isKontraktor
                      ? 'Tuliskan hasil pengecekan gambar kerja di lapangan, kesiapan bekisting/pembesian, kepatuhan RKS, atau usulan penyesuaian lapangan...'
                      : 'Tuliskan catatan teknis pengawasan, arahan revisi, atau konfirmasi persetujuan gambar kerja ini...'
                  }
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500/40"
                />
              </div>

              {/* Signatory Legal Stamp Indicator */}
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Disahkan secara digital oleh: <strong>{activeUserName}</strong> ({userRole})
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                >
                  {isKontraktor ? 'Kirim Review Gambar' : 'Sahkan Keputusan Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
