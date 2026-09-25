import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  Download,
  MapPin,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Sparkles,
  Eye,
} from 'lucide-react';
import { SafeImage, ImageClarityMode } from '../common/SafeImage';

interface PhotoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  title?: string;
  date?: string;
  author?: string;
  notes?: string;
}

export const PhotoPreviewModal: React.FC<PhotoPreviewModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  title,
  date,
  author,
  notes,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [clarityMode, setClarityMode] = useState<ImageClarityMode>('sharp');
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset viewport state when opening a new photo
  useEffect(() => {
    if (isOpen) {
      setZoom(100);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setIsFullscreen(false);
    }
  }, [isOpen, photoUrl]);

  // Keyboard shortcut support
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
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
  }, [isOpen, isFullscreen, onClose]);

  if (!isOpen || !photoUrl) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 400));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleResetZoom = () => {
    setZoom(100);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Mouse drag handlers
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

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = `Dokumentasi-Progres-${date || 'Site'}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div
        className={`bg-slate-900 border border-slate-800 rounded-3xl w-full shadow-2xl relative space-y-3 flex flex-col transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-2 z-50 max-w-none max-h-none h-[calc(100vh-16px)] p-4'
            : 'max-w-5xl p-4 sm:p-6 my-auto max-h-[95vh]'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 shrink-0">
              <MapPin className="w-4 h-4" />
            </span>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {title || 'Dokumentasi Progres Fisik Lapangan'}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                {date && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Calendar className="w-3 h-3 text-orange-400" /> {date}
                  </span>
                )}
                {author && (
                  <span className="flex items-center gap-1 truncate">
                    <User className="w-3 h-3 text-sky-400 shrink-0" /> {author}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Clarity Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setClarityMode('sharp')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  clarityMode === 'sharp' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Gambar Tajam (Enhanced HDR Clarity)"
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
                title="Warna Gambar Asli Kamera"
              >
                Asli
              </button>
              <button
                onClick={() => setClarityMode('high_contrast')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                  clarityMode === 'high_contrast' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Kontras Tinggi (Perjelas Tekstur Beton & Tulangan)"
              >
                Kontras
              </button>
            </div>

            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh Berkas Foto Kualitas Penuh"
            >
              <Download className="w-4 h-4 text-orange-400" />
              <span className="hidden sm:inline">Unduh</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? 'Keluar Mode Layar Penuh' : 'Mode Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar: Zoom, Rotate, Clarity */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-950/70 rounded-2xl border border-slate-800 text-xs shrink-0">
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Perkecil (-25%)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-white px-2 min-w-[54px] text-center">
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
              title="Kembali ke Ukuran Pas Layar (100%)"
            >
              Reset
            </button>
            <div className="w-[1px] h-4 bg-slate-700 mx-1" />
            <button
              onClick={handleRotate}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Putar 90 Derajat Searah Jarum Jam"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span className="hidden sm:inline">
              Tips: Geser mouse untuk menggeser gambar saat di-zoom. Tekan <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]">+</kbd> / <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[10px]">-</kbd> untuk zoom.
            </span>
          </div>
        </div>

        {/* Interactive Image Canvas Area */}
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className={`flex-1 overflow-hidden relative flex items-center justify-center bg-black/80 rounded-2xl border border-slate-800 p-2 select-none ${
            zoom > 100 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          } ${isFullscreen ? 'min-h-[450px]' : 'min-h-[340px] max-h-[65vh]'}`}
          style={{
            backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        >
          <div
            className="transition-transform duration-150 ease-out origin-center flex items-center justify-center pointer-events-none"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
            }}
          >
            <SafeImage
              src={photoUrl}
              alt={title || 'Dokumentasi Progres Lapangan'}
              clarityMode={clarityMode}
              className="max-w-full max-h-[62vh] object-contain rounded-xl shadow-2xl border border-slate-800/80 pointer-events-auto"
            />
          </div>
        </div>

        {/* Notes / Footer */}
        {notes && (
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300 shrink-0">
            <span className="font-bold text-orange-400 block mb-0.5">Keterangan / Kegiatan Lapangan:</span>
            <p className="line-clamp-2">{notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
