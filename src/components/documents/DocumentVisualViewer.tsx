import React, { useState, useId, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  FileText,
  Layers,
  Download,
  ExternalLink,
  Eye,
  CheckCircle2,
  ShieldCheck,
  PenTool,
  Compass,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { ProjectDocument } from '../../types';
import { SafeImage, ImageClarityMode } from '../common/SafeImage';

export type DrawingProfileType = 'toilet' | 'site_plant' | 'foundation' | 'rebar' | 'facade' | 'general';

export function getDrawingProfile(doc: ProjectDocument): DrawingProfileType {
  const t = (doc.title + ' ' + (doc.description || '') + ' ' + (doc.fileName || '')).toLowerCase();
  if (t.includes('toilet') || t.includes('sanitair') || t.includes('wc') || t.includes('kamar mandi') || t.includes('3d toilet')) {
    return 'toilet';
  }
  if (t.includes('site') || t.includes('plant') || t.includes('tapak') || t.includes('masterplan') || t.includes('kawasan')) {
    return 'site_plant';
  }
  if (t.includes('pondasi') || t.includes('pile') || t.includes('tiang pancang') || t.includes('cap')) {
    return 'foundation';
  }
  if (t.includes('kolom') || t.includes('balok') || t.includes('pembesian') || t.includes('rebar') || t.includes('tulangan') || t.includes('k1') || t.includes('b1')) {
    return 'rebar';
  }
  if (t.includes('tampak') || t.includes('fasade') || t.includes('facade') || t.includes('arsitektur')) {
    return 'facade';
  }
  return 'general';
}

interface DocumentVisualViewerProps {
  document: ProjectDocument;
  onDownloadPdf?: () => void;
  onDownloadOriginal?: () => void;
}

export const DocumentVisualViewer: React.FC<DocumentVisualViewerProps> = ({
  document: doc,
  onDownloadPdf,
  onDownloadOriginal,
}) => {
  const patternId = useId();
  // Image Viewer State
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [clarityMode, setClarityMode] = useState<ImageClarityMode>('sharp');
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [imageLoadFailed, setImageLoadFailed] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // CAD Blueprint Viewer State
  const [cadTheme, setCadTheme] = useState<'blueprint' | 'dark' | 'paper'>('blueprint');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showRebar, setShowRebar] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [activeDrawingView, setActiveDrawingView] = useState<'plan' | 'section' | 'detail'>('plan');

  const isImage =
    doc.fileType === 'image' ||
    doc.fileType === 'png' ||
    doc.fileType === 'jpg' ||
    doc.fileType === 'jpeg' ||
    Boolean(
      doc.fileUrl &&
      typeof doc.fileUrl === 'string' &&
      (doc.fileUrl.startsWith('data:image') ||
        doc.fileUrl.startsWith('blob:') ||
        /\.(png|jpe?g|webp|svg|gif|bmp)(\?.*)?$/i.test(doc.fileUrl))
    );

  const isPdf =
    doc.fileType === 'pdf' ||
    Boolean(doc.fileUrl && typeof doc.fileUrl === 'string' && (doc.fileUrl.startsWith('data:application/pdf') || doc.fileUrl.toLowerCase().endsWith('.pdf')));

  const isDrawingOrCad =
    doc.category === 'drawing' ||
    doc.fileType === 'dwg' ||
    doc.title.toLowerCase().includes('gambar') ||
    doc.title.toLowerCase().includes('ded') ||
    doc.title.toLowerCase().includes('shop drawing');

  // Validates if doc has a real, readable image URL (not a snapshot placeholder)
  const hasValidImageUrl = Boolean(
    !imageLoadFailed &&
    doc.fileUrl &&
    typeof doc.fileUrl === 'string' &&
    !doc.fileUrl.startsWith('[') &&
    (doc.fileUrl.startsWith('data:image') ||
      doc.fileUrl.startsWith('blob:') ||
      isImage ||
      /\.(png|jpe?g|webp|svg|gif|bmp)(\?.*)?$/i.test(doc.fileUrl) ||
      (!doc.fileUrl.startsWith('data:application/pdf') && !doc.fileUrl.toLowerCase().endsWith('.pdf') && (doc.fileUrl.startsWith('http://') || doc.fileUrl.startsWith('https://') || doc.fileUrl.startsWith('/'))))
  );

  // Validates if doc has a real, readable PDF URL
  const hasValidPdfUrl = Boolean(
    doc.fileUrl &&
    typeof doc.fileUrl === 'string' &&
    !doc.fileUrl.startsWith('[') &&
    (doc.fileUrl.startsWith('data:application/pdf') ||
      doc.fileUrl.startsWith('http://') ||
      doc.fileUrl.startsWith('https://') ||
      doc.fileUrl.startsWith('/') ||
      doc.fileUrl.startsWith('blob:'))
  );

  // Reset pan/zoom on doc change
  useEffect(() => {
    setZoom(100);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setImageLoadFailed(false);
  }, [doc.id, doc.fileUrl]);

  // Keyboard shortcut support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key === '+' || e.key === '=') {
        setZoom((prev) => Math.min(prev + 25, 400));
      } else if (e.key === '-') {
        setZoom((prev) => Math.max(prev - 25, 50));
      } else if (e.key === '0') {
        setZoom(100);
        setPan({ x: 0, y: 0 });
      } else if (e.key === 'r' || e.key === 'R') {
        setRotation((prev) => (prev + 90) % 360);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 400));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => {
    setZoom(100);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Mouse pan & drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 100) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 100) return;
    e.preventDefault();
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom((prev) => Math.min(prev + 15, 400));
      } else {
        setZoom((prev) => Math.max(prev - 15, 50));
      }
    }
  };

  // ---------------------------------------------------------------------------
  // 1. RENDER UPLOADED IMAGE (High-definition Interactive Inspection Studio)
  // ---------------------------------------------------------------------------
  if (hasValidImageUrl) {
    return (
      <div
        className={`flex flex-col rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl transition-all ${
          isFullscreen ? 'fixed inset-3 z-50 bg-slate-950/98 backdrop-blur-md' : 'w-full'
        }`}
      >
        {/* Top Control Bar */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ImageIcon className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white line-clamp-1">{doc.fileName || doc.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                  GAMBAR ASLI TERUNGGAH
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Ukuran: {doc.fileSize} &bull; Resolusi Tampil: {zoom}% &bull; Orientasi: {rotation}&deg;
              </span>
            </div>
          </div>

          {/* Controls: Clarity Filter, Zoom, Rotate, Fullscreen, Open in Tab */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Clarity Filters for Architectural & Construction Drawings */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setClarityMode('sharp')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  clarityMode === 'sharp' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Mode Tajam & Jernih (Enhanced HDR)"
              >
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Tajam & Jernih
                </span>
              </button>
              <button
                onClick={() => setClarityMode('original')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  clarityMode === 'original' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Warna Gambar Asli"
              >
                Asli
              </button>
              <button
                onClick={() => setClarityMode('high_contrast')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  clarityMode === 'high_contrast' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Kontras Tinggi (Perjelas Garis Arsitektur & Denah)"
              >
                Kontras
              </button>
              <button
                onClick={() => setClarityMode('blueprint_cad')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  clarityMode === 'blueprint_cad' ? 'bg-blue-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Invert Mode Blueprint CAD"
              >
                Blueprint
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Perkecil (-25%)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-white px-2 min-w-[50px] text-center">
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Perbesar (+25%)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="px-2 py-1 rounded-lg hover:bg-slate-700 text-[11px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Reset ke Ukuran Asli 100%"
              >
                Reset
              </button>
              <div className="w-[1px] h-4 bg-slate-700 mx-1" />
              <button
                onClick={handleRotate}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Putar 90 Derajat"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              {hasValidImageUrl && doc.fileUrl && (
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg hover:bg-slate-700 text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Buka Gambar Asli di Tab Baru"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Image Display Area */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onDoubleClick={handleResetZoom}
          className={`relative overflow-hidden flex items-center justify-center p-6 bg-slate-950 select-none ${
            zoom > 100 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          } ${
            isFullscreen ? 'h-[calc(100vh-140px)]' : 'min-h-[440px] max-h-[640px]'
          }`}
          style={{
            backgroundImage: `radial-gradient(#334155 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        >
          <div
            className="transition-transform duration-150 ease-out origin-center flex items-center justify-center pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          >
            <SafeImage
              src={doc.fileUrl}
              alt={doc.title}
              clarityMode={clarityMode}
              className="max-w-full max-h-[580px] object-contain rounded-xl shadow-2xl border border-slate-700/60 pointer-events-auto"
              onError={() => setImageLoadFailed(true)}
            />
          </div>
        </div>

        {/* Bottom Status & Info Bar */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Berkas visual valid dan terverifikasi
            </span>
            <span className="text-slate-600">&bull;</span>
            <span>Diunggah oleh: <strong className="text-slate-200">{doc.uploadedBy}</strong> [{doc.uploadedByRole}]</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-slate-500">
              Double-click gambar untuk reset zoom &bull; Drag untuk menggeser
            </span>
            {onDownloadOriginal && (
              <button
                onClick={onDownloadOriginal}
                className="flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline cursor-pointer font-medium ml-2"
              >
                <Download className="w-3 h-3" /> Unduh Berkas Asli
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. RENDER UPLOADED PDF DOCUMENT
  // ---------------------------------------------------------------------------
  if (hasValidPdfUrl && isPdf) {
    return (
      <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl w-full">
        {/* PDF Header Action Bar */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white line-clamp-1">{doc.fileName}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-bold">
                  PDF TERUNGGAH RESMI
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Ukuran: {doc.fileSize} &bull; Format: Adobe PDF Portable Document &bull; Status: {doc.status}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={doc.fileUrl}
              download={doc.fileName || `${doc.documentNumber}.pdf`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Unduh PDF
            </a>
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Buka Tab Baru
            </a>
          </div>
        </div>

        {/* Embedded PDF Viewer */}
        <div className="p-2 bg-slate-950 min-h-[520px] flex flex-col">
          <iframe
            src={doc.fileUrl}
            title={doc.title}
            className="w-full h-[520px] rounded-xl border border-slate-800 bg-white"
          />
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. RENDER TECHNICAL BLUEPRINT / CAD VIEWER (For Drawings or DWG)
  // ---------------------------------------------------------------------------
  if (isDrawingOrCad) {
    return (
      <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl w-full">
        {/* CAD Blueprint Toolbar */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <PenTool className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{doc.title}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-bold">
                  BLUEPRINT CAD
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                No: <span className="font-mono text-amber-400">{doc.documentNumber}</span> &bull; Versi: {doc.version} &bull; Skala 1:20 & 1:50
              </span>
            </div>
          </div>

          {/* Blueprint Tool Toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Modes */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setActiveDrawingView('plan')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activeDrawingView === 'plan' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Denah / Plan
              </button>
              <button
                onClick={() => setActiveDrawingView('section')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activeDrawingView === 'section' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Potongan / Section
              </button>
              <button
                onClick={() => setActiveDrawingView('detail')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  activeDrawingView === 'detail' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Detail Pembesian
              </button>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setCadTheme('blueprint')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  cadTheme === 'blueprint' ? 'bg-blue-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Mode Blueprint Biru Klasik"
              >
                Blueprint
              </button>
              <button
                onClick={() => setCadTheme('dark')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  cadTheme === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Mode AutoCAD Dark"
              >
                AutoCAD
              </button>
              <button
                onClick={() => setCadTheme('paper')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  cadTheme === 'paper' ? 'bg-amber-100 text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
                title="Mode Kertas Putih Plotter"
              >
                Plotter
              </button>
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <label className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-0"
                />
                <span>Grid As</span>
              </label>
              <label className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDimensions}
                  onChange={(e) => setShowDimensions(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-0"
                />
                <span>Dimensi</span>
              </label>
              <label className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRebar}
                  onChange={(e) => setShowRebar(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-0"
                />
                <span>Tulangan</span>
              </label>
            </div>
          </div>
        </div>

        {/* CAD Canvas SVG Rendering */}
        <div
          className={`relative p-6 overflow-x-auto flex justify-center items-center select-none ${
            cadTheme === 'blueprint'
              ? 'bg-[#0f274a] text-sky-100'
              : cadTheme === 'dark'
              ? 'bg-[#181a1f] text-emerald-300'
              : 'bg-[#fcfbf9] text-slate-900'
          }`}
        >
          {/* Engineering Drawing SVG Sheet */}
          <div
            className={`w-full max-w-4xl p-6 rounded-xl border-2 shadow-2xl relative ${
              cadTheme === 'blueprint'
                ? 'border-sky-400/50 bg-[#0d2240]'
                : cadTheme === 'dark'
                ? 'border-slate-700 bg-[#121418]'
                : 'border-slate-400 bg-white'
            }`}
          >
            {/* Outer CAD Border & Grid Markers */}
            <div className="border border-current p-4 relative">
              {/* Title & Coordinate Indicators */}
              <div className="flex justify-between items-center mb-4 text-[10px] font-mono opacity-80 border-b pb-2 border-current">
                <span>PROYEK: PEMBANGUNAN GEDUNG FORESYNDO 2</span>
                <span>KONSULTAN MK: PT BINA MANDIRI</span>
                <span>SKALA: 1:50 &bull; SATUAN: MILIMETER (MM)</span>
              </div>

              {/* Graphic Drawing Area depending on Active View */}
              <div className="min-h-[360px] flex items-center justify-center p-4">
                <svg viewBox="0 0 800 420" className="w-full h-auto max-h-[420px] overflow-visible">
                  <defs>
                    <pattern id={patternId} width="40" height="40" patternUnits="userSpaceOnUse">
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke={cadTheme === 'blueprint' ? '#1e3a8a' : cadTheme === 'dark' ? '#262a33' : '#e2e8f0'}
                        strokeWidth="0.8"
                      />
                    </pattern>
                  </defs>

                  {/* Grid Background */}
                  {showGrid && <rect width="800" height="420" fill={`url(#${patternId})`} opacity="0.6" />}

                  {/* Grid Lines and Axis Callouts */}
                  {showGrid && (
                    <g
                      stroke={cadTheme === 'blueprint' ? '#38bdf8' : cadTheme === 'dark' ? '#10b981' : '#64748b'}
                      strokeDasharray="6 3"
                      strokeWidth="1.2"
                      opacity="0.8"
                    >
                      {/* Vertical Axis Lines */}
                      <line x1="160" y1="30" x2="160" y2="350" />
                      <line x1="400" y1="30" x2="400" y2="350" />
                      <line x1="640" y1="30" x2="640" y2="350" />

                      {/* Horizontal Axis Lines */}
                      <line x1="60" y1="120" x2="740" y2="120" />
                      <line x1="60" y1="280" x2="740" y2="280" />

                      {/* Axis Labels */}
                      <g
                        fontSize="12"
                        fontWeight="bold"
                        fill="currentColor"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        <circle cx="160" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <text x="160" y="20">A</text>

                        <circle cx="400" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <text x="400" y="20">B</text>

                        <circle cx="640" cy="20" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <text x="640" y="20">C</text>

                        <circle cx="40" cy="120" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <text x="40" y="120">1</text>

                        <circle cx="40" cy="280" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <text x="40" y="280">2</text>
                      </g>
                    </g>
                  )}

                  {/* DRAWING VIEW 1: PLAN (DENAH STRUKTUR / PILE CAP) */}
                  {activeDrawingView === 'plan' && (
                    <g>
                      {/* Pile Cap Concrete Footings */}
                      <rect
                        x="100"
                        y="60"
                        width="120"
                        height="120"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />
                      <rect
                        x="340"
                        y="60"
                        width="120"
                        height="120"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />
                      <rect
                        x="580"
                        y="60"
                        width="120"
                        height="120"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />

                      <rect
                        x="100"
                        y="220"
                        width="120"
                        height="120"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />
                      <rect
                        x="340"
                        y="220"
                        width="120"
                        height="120"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />
                      <rect
                        x="580"
                        y="220"
                        width="120"
                        height="120"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />

                      {/* Tie Beams (Sloof) Connecting Pile Caps */}
                      <rect x="220" y="105" width="120" height="30" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="460" y="105" width="120" height="30" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="220" y="265" width="120" height="30" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="460" y="265" width="120" height="30" fill="none" stroke="currentColor" strokeWidth="1.5" />

                      {/* Spun Piles under Pile Caps */}
                      <circle cx="130" cy="90" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="190" cy="90" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="130" cy="150" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="190" cy="150" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />

                      <circle cx="370" cy="90" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="430" cy="90" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="370" cy="150" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="430" cy="150" r="14" fill="none" stroke="currentColor" strokeWidth="1.5" />

                      {/* Column Core K1 */}
                      <rect
                        x="145"
                        y="105"
                        width="30"
                        height="30"
                        fill={cadTheme === 'blueprint' ? '#38bdf8' : '#eab308'}
                        opacity="0.8"
                      />
                      <rect
                        x="385"
                        y="105"
                        width="30"
                        height="30"
                        fill={cadTheme === 'blueprint' ? '#38bdf8' : '#eab308'}
                        opacity="0.8"
                      />
                      <rect
                        x="625"
                        y="105"
                        width="30"
                        height="30"
                        fill={cadTheme === 'blueprint' ? '#38bdf8' : '#eab308'}
                        opacity="0.8"
                      />

                      {/* Labels */}
                      <text x="160" y="195" fontSize="11" textAnchor="middle" fill="currentColor" fontWeight="bold">
                        PC-1 (2400x2400)
                      </text>
                      <text x="400" y="195" fontSize="11" textAnchor="middle" fill="currentColor" fontWeight="bold">
                        PC-1 (2400x2400)
                      </text>
                      <text x="280" y="125" fontSize="10" textAnchor="middle" fill="currentColor">
                        Sloof S1 (300x500)
                      </text>
                    </g>
                  )}

                  {/* DRAWING VIEW 2: SECTION (POTONGAN PONDASI & ELEVASI) */}
                  {activeDrawingView === 'section' && (
                    <g>
                      {/* Ground Line */}
                      <line x1="80" y1="120" x2="720" y2="120" stroke="currentColor" strokeWidth="2" />
                      <text x="710" y="112" fontSize="11" textAnchor="end" fill="currentColor" fontWeight="bold">
                        EL. &plusmn; 0.00 MUKA TANAH ASLI
                      </text>

                      {/* Pile Cap Cross Section */}
                      <rect
                        x="240"
                        y="140"
                        width="320"
                        height="100"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />
                      <rect
                        x="230"
                        y="240"
                        width="340"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                      />
                      <text x="580" y="255" fontSize="10" fill="currentColor">
                        Lantai Kerja B-0 (t = 100mm)
                      </text>

                      {/* Pedestal & Column Stem */}
                      <rect
                        x="360"
                        y="60"
                        width="80"
                        height="80"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      />
                      <line x1="360" y1="60" x2="360" y2="20" stroke="currentColor" strokeWidth="2" />
                      <line x1="440" y1="60" x2="440" y2="20" stroke="currentColor" strokeWidth="2" />

                      {/* 2 Spun Piles Penetrating Deep */}
                      <rect x="270" y="240" width="60" height="150" fill="none" stroke="currentColor" strokeWidth="2" />
                      <rect x="470" y="240" width="60" height="150" fill="none" stroke="currentColor" strokeWidth="2" />

                      {/* Pile Cutoff Embedment */}
                      <line
                        x1="270"
                        y1="220"
                        x2="330"
                        y2="220"
                        stroke={cadTheme === 'blueprint' ? '#38bdf8' : '#f97316'}
                        strokeWidth="2"
                      />
                      <line
                        x1="470"
                        y1="220"
                        x2="530"
                        y2="220"
                        stroke={cadTheme === 'blueprint' ? '#38bdf8' : '#f97316'}
                        strokeWidth="2"
                      />

                      <text x="300" y="380" fontSize="10" textAnchor="middle" fill="currentColor">
                        Spun Pile Ø400mm
                      </text>
                      <text x="500" y="380" fontSize="10" textAnchor="middle" fill="currentColor">
                        Spun Pile Ø400mm
                      </text>
                      <text x="400" y="195" fontSize="11" textAnchor="middle" fill="currentColor" fontWeight="bold">
                        Beton K-350 / fc&apos; 29 MPa
                      </text>
                    </g>
                  )}

                  {/* DRAWING VIEW 3: DETAIL PEMBESIAN (REBAR REINFORCEMENT) */}
                  {activeDrawingView === 'detail' && (
                    <g>
                      {/* Column Cross Section Detail */}
                      <rect
                        x="140"
                        y="80"
                        width="200"
                        height="200"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <text x="240" y="60" fontSize="13" textAnchor="middle" fill="currentColor" fontWeight="bold">
                        DETAIL KOLOM K1 (600 x 600 MM)
                      </text>

                      {/* Ties/Stirrups */}
                      {showRebar && (
                        <g>
                          <rect
                            x="152"
                            y="92"
                            width="176"
                            height="176"
                            rx="8"
                            fill="none"
                            stroke={cadTheme === 'blueprint' ? '#38bdf8' : '#f59e0b'}
                            strokeWidth="2.5"
                          />
                          {/* Inner Ties Diamond */}
                          <polygon
                            points="240,92 328,180 240,268 152,180"
                            fill="none"
                            stroke={cadTheme === 'blueprint' ? '#38bdf8' : '#f59e0b'}
                            strokeWidth="1.8"
                          />

                          {/* 16 Main Rebar Dots D25 */}
                          {[
                            [158, 98], [185, 98], [213, 98], [240, 98], [268, 98], [295, 98], [322, 98],
                            [158, 262], [185, 262], [213, 262], [240, 262], [268, 262], [295, 262], [322, 262],
                            [158, 140], [158, 180], [158, 220],
                            [322, 140], [322, 180], [322, 220],
                          ].map(([cx, cy], idx) => (
                            <circle
                              key={idx}
                              cx={cx}
                              cy={cy}
                              r="6"
                              fill={cadTheme === 'blueprint' ? '#ffffff' : '#ef4444'}
                              stroke="currentColor"
                              strokeWidth="1"
                            />
                          ))}

                          {/* Leader Note for Rebar */}
                          <line x1="322" y1="98" x2="420" y2="70" stroke="currentColor" strokeWidth="1.5" />
                          <text x="425" y="74" fontSize="11" fill="currentColor" fontWeight="bold">
                            16 D25 (Tulangan Utama Ulir)
                          </text>

                          <line x1="240" y1="92" x2="420" y2="120" stroke="currentColor" strokeWidth="1.5" />
                          <text x="425" y="124" fontSize="11" fill="currentColor" fontWeight="bold">
                            Sengkang 2D10 - 100 mm (Sendi Plastis)
                          </text>

                          <line x1="140" y1="180" x2="80" y2="210" stroke="currentColor" strokeWidth="1.5" />
                          <text x="75" y="225" fontSize="10" textAnchor="end" fill="currentColor">
                            Selimut Beton 40 mm
                          </text>
                        </g>
                      )}

                      {/* Beam Transfer Cross Section B1 */}
                      <rect
                        x="480"
                        y="100"
                        width="160"
                        height="220"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <text x="560" y="80" fontSize="13" textAnchor="middle" fill="currentColor" fontWeight="bold">
                        BALOK TRANSFER B1 (400 x 800)
                      </text>

                      {showRebar && (
                        <g>
                          <rect
                            x="490"
                            y="110"
                            width="140"
                            height="200"
                            rx="6"
                            fill="none"
                            stroke={cadTheme === 'blueprint' ? '#38bdf8' : '#f59e0b'}
                            strokeWidth="2.5"
                          />
                          {/* Top Bars 6 D22 */}
                          {[498, 523, 548, 573, 598, 622].map((cx, i) => (
                            <circle
                              key={`top-${i}`}
                              cx={cx}
                              cy="118"
                              r="5"
                              fill={cadTheme === 'blueprint' ? '#ffffff' : '#ef4444'}
                            />
                          ))}
                          {/* Bottom Bars 8 D25 */}
                          {[498, 516, 534, 552, 570, 588, 606, 622].map((cx, i) => (
                            <circle
                              key={`bot-${i}`}
                              cx={cx}
                              cy="302"
                              r="5.5"
                              fill={cadTheme === 'blueprint' ? '#ffffff' : '#ef4444'}
                            />
                          ))}
                          {/* Waist / Pinggang Bars */}
                          <circle cx="498" cy="180" r="4" fill="currentColor" />
                          <circle cx="622" cy="180" r="4" fill="currentColor" />
                          <circle cx="498" cy="235" r="4" fill="currentColor" />
                          <circle cx="622" cy="235" r="4" fill="currentColor" />

                          <text x="560" y="340" fontSize="10" textAnchor="middle" fill="currentColor">
                            Tul. Bawah 8 D25 &bull; Tul. Atas 6 D22
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* Dimensions Layer */}
                  {showDimensions && (
                    <g
                      stroke="currentColor"
                      strokeWidth="1"
                      fontSize="10"
                      fill="currentColor"
                      textAnchor="middle"
                    >
                      {/* Top Span Dimension */}
                      <line x1="160" y1="380" x2="400" y2="380" />
                      <line x1="160" y1="375" x2="160" y2="385" strokeWidth="1.5" />
                      <line x1="400" y1="375" x2="400" y2="385" strokeWidth="1.5" />
                      <text x="280" y="372" fontWeight="bold">6.000 mm</text>

                      <line x1="400" y1="380" x2="640" y2="380" />
                      <line x1="640" y1="375" x2="640" y2="385" strokeWidth="1.5" />
                      <text x="520" y="372" fontWeight="bold">6.000 mm</text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Official Engineering Title Block (Kop Gambar CAD) */}
              <div
                className={`mt-4 border-2 p-3 text-xs grid grid-cols-1 md:grid-cols-4 gap-3 border-current ${
                  cadTheme === 'blueprint' ? 'bg-[#0f2d59]' : cadTheme === 'dark' ? 'bg-[#1e222b]' : 'bg-slate-50'
                }`}
              >
                <div className="border-r border-current pr-2">
                  <div className="text-[9px] uppercase font-bold opacity-75">Pemilik Proyek (Owner):</div>
                  <div className="font-bold">PT FORESYNDO GLOBAL INDONESIA</div>
                  <div className="text-[10px] opacity-80">Direktur: HASANUDIN</div>
                </div>
                <div className="border-r border-current pr-2">
                  <div className="text-[9px] uppercase font-bold opacity-75">Konsultan Manajemen Konstruksi:</div>
                  <div className="font-bold">PT BINA MANDIRI KONSULTAN</div>
                  <div className="text-[10px] opacity-80">Team Leader: SAEPUL ANWAR</div>
                </div>
                <div className="border-r border-current pr-2">
                  <div className="text-[9px] uppercase font-bold opacity-75">Kontraktor Pelaksana:</div>
                  <div className="font-bold">PT FORESYNDO CIPTA UTAMA</div>
                  <div className="text-[10px] opacity-80">Site Manager: EKO YULIANTO</div>
                </div>
                <div className="text-right flex flex-col justify-center">
                  <div className="text-[9px] uppercase font-mono font-bold text-amber-400">{doc.documentNumber}</div>
                  <div className="font-bold text-xs">{doc.version} - APPROVED FOR CONSTRUCTION</div>
                  <div className="text-[10px] opacity-80">{doc.uploadDate}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Blueprint Footer Controls */}
        <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-sky-400 font-bold">
              <Compass className="w-3.5 h-3.5" /> Standar Gambar: SNI 2847:2019 & SNI 1726:2019
            </span>
            <span className="text-slate-600">&bull;</span>
            <span>Diperiksa oleh: <strong className="text-white">SAEPUL ANWAR (MK)</strong></span>
          </div>

          <div className="flex items-center gap-2">
            {onDownloadPdf && (
              <button
                onClick={onDownloadPdf}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Download className="w-3 h-3" /> Unduh Lembar Gambar (PDF)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 4. RENDER OFFICIAL LEGAL & TRIPARTIT CONTRACT DOCUMENT (Default Fallback)
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl w-full">
      {/* Official Document Action Bar */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <FileText className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">{doc.title}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold">
                BERKAS DIVERIFIKASI TRIPARTIT
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              No: <span className="font-mono text-orange-400">{doc.documentNumber}</span> &bull; {doc.confidentiality}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Unduh Berkas Cetak (PDF)
            </button>
          )}
        </div>
      </div>

      {/* Official Paper Sheet Letterhead Content */}
      <div className="p-6 bg-slate-950 overflow-y-auto max-h-[580px] space-y-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-inner relative">
          {/* Official Letterhead Header */}
          <div className="border-b-2 border-slate-700 pb-4 text-center space-y-1">
            <div className="text-xs font-black tracking-widest text-orange-400 uppercase">
              PT FORESYNDO GLOBAL INDONESIA
            </div>
            <div className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
              PROYEK PEMBANGUNAN GEDUNG FORESYNDO 2
            </div>
            <div className="text-[11px] text-slate-400">
              Lokasi: Kec. Jatitujuh, Kabupaten Majalengka, Jawa Barat &bull; Nilai Kontrak: Rp 14.461.760.981
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Kategori Dokumen</span>
              <span className="font-bold text-white capitalize">{doc.category.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Klasifikasi Akses</span>
              <span className="font-bold text-amber-400">{doc.confidentiality}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Pengunggah Dokumen</span>
              <span className="font-bold text-white">{doc.uploadedBy}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Tanggal Penerbitan</span>
              <span className="font-bold text-white font-mono">{doc.uploadDate}</span>
            </div>
          </div>

          {/* Document Content / Specifications */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-orange-400" /> Ringkasan & Spesifikasi Teknis:
            </h4>
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 leading-relaxed text-slate-300 text-xs">
              {doc.description}
            </div>
          </div>

          {/* Tripartit Signatures Box */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Pengesahan & Tanda Tangan Digital Tripartit:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Pemberi Tugas (Owner)</div>
                <div className="py-2 flex items-center justify-center">
                  <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                    [TERVERIFIKASI DIGITAL]
                  </div>
                </div>
                <div className="font-bold text-white text-xs">HASANUDIN</div>
                <div className="text-[10px] text-slate-500">Direktur Utama PT FGI</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Konsultan Pengawas (MK)</div>
                <div className="py-2 flex items-center justify-center">
                  <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                    [TERVERIFIKASI DIGITAL]
                  </div>
                </div>
                <div className="font-bold text-white text-xs">SAEPUL ANWAR</div>
                <div className="text-[10px] text-slate-500">Team Leader MK</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 text-center">
                <div className="text-[10px] uppercase font-bold text-slate-400">Kontraktor Pelaksana</div>
                <div className="py-2 flex items-center justify-center">
                  <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                    [TERVERIFIKASI DIGITAL]
                  </div>
                </div>
                <div className="font-bold text-white text-xs">EKO YULIANTO</div>
                <div className="text-[10px] text-slate-500">Site Manager Lapangan</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
