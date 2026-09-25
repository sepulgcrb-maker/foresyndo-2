import React, { useState, useRef, useEffect } from 'react';
import { PhotoItem, PhotoCategory, UserRole, RolePermissions } from '../../types';
import {
  Camera,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Minimize2,
  Download,
  Maximize2,
  X,
  Calendar,
  User,
  Tag,
  Upload,
  Image as ImageIcon,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Link as LinkIcon,
  FileImage,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ProgressCameraModal } from '../monitoring/ProgressCameraModal';
import { SafeImage, ImageClarityMode } from '../common/SafeImage';

interface PhotoGalleryProps {
  photos: PhotoItem[];
  userRole: UserRole;
  permissions?: RolePermissions;
  activeUserName?: string;
  onAddPhoto: (photo: Omit<PhotoItem, 'id'>) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  userRole,
  permissions,
  activeUserName,
  onAddPhoto,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory | 'Semua'>('Semua');
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);
  const [lightboxZoom, setLightboxZoom] = useState<number>(100);
  const [lightboxRotation, setLightboxRotation] = useState<number>(0);
  const [lightboxFullscreen, setLightboxFullscreen] = useState<boolean>(false);
  const [lightboxClarity, setLightboxClarity] = useState<ImageClarityMode>('sharp');
  const [lightboxPan, setLightboxPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isLightboxDragging, setIsLightboxDragging] = useState<boolean>(false);
  const lightboxDragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [photoSourceType, setPhotoSourceType] = useState<'camera' | 'gallery' | 'url' | null>(null);
  const [showUrlField, setShowUrlField] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const categories: (PhotoCategory | 'Semua')[] = [
    'Semua',
    'Pondasi',
    'Struktur',
    'Lantai',
    'Atap',
    'Finishing',
    'MEP',
    'Progress Hari Ini',
  ];

  const filteredPhotos =
    selectedCategory === 'Semua'
      ? photos
      : photos.filter((p) => p.category === selectedCategory);

  // Reset lightbox state when changing photo
  useEffect(() => {
    if (lightboxPhoto) {
      setLightboxZoom(100);
      setLightboxRotation(0);
      setLightboxPan({ x: 0, y: 0 });
    }
  }, [lightboxPhoto?.id]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (!lightboxPhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxFullscreen) {
          setLightboxFullscreen(false);
        } else {
          setLightboxPhoto(null);
        }
      } else if (e.key === 'ArrowLeft') {
        const idx = filteredPhotos.findIndex((p) => p.id === lightboxPhoto.id);
        if (idx > 0) {
          setLightboxPhoto(filteredPhotos[idx - 1]);
        } else if (filteredPhotos.length > 0) {
          setLightboxPhoto(filteredPhotos[filteredPhotos.length - 1]);
        }
      } else if (e.key === 'ArrowRight') {
        const idx = filteredPhotos.findIndex((p) => p.id === lightboxPhoto.id);
        if (idx < filteredPhotos.length - 1) {
          setLightboxPhoto(filteredPhotos[idx + 1]);
        } else if (filteredPhotos.length > 0) {
          setLightboxPhoto(filteredPhotos[0]);
        }
      } else if (e.key === '+' || e.key === '=') {
        setLightboxZoom((prev) => Math.min(prev + 25, 400));
      } else if (e.key === '-') {
        setLightboxZoom((prev) => Math.max(prev - 25, 50));
      } else if (e.key === '0') {
        setLightboxZoom(100);
        setLightboxPan({ x: 0, y: 0 });
      } else if (e.key === 'r' || e.key === 'R') {
        setLightboxRotation((prev) => (prev + 90) % 360);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxPhoto, lightboxFullscreen, filteredPhotos]);

  const defaultUploader =
    activeUserName ||
    (userRole === 'Konsultan'
      ? 'SAEPUL ANWAR (Konsultan MK)'
      : userRole === 'Kontraktor'
      ? 'EKO YULIANTO (Kontraktor Pelaksana)'
      : userRole === 'Owner' || userRole === 'Direktur'
      ? 'HASANUDIN (Owner)'
      : 'EKO YULIANTO');

  // New photo state
  const [newPhoto, setNewPhoto] = useState<Omit<PhotoItem, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    category: 'Struktur',
    title: '',
    url: '',
    uploadedBy: defaultUploader,
    notes: '',
  });

  const canUpload =
    permissions?.canUploadDocumentation ??
    (userRole === 'Kontraktor' ||
      userRole === 'Konsultan' ||
      userRole === 'Owner' ||
      userRole === 'Site Manager' ||
      userRole === 'Direktur' ||
      userRole === 'Admin');

  // Open camera directly from header
  const handleOpenDirectCamera = () => {
    setIsCameraModalOpen(true);
  };

  // When photo is captured via ProgressCameraModal
  const handleCameraCapture = (photoDataUrl: string, caption?: string) => {
    setNewPhoto((prev) => ({
      ...prev,
      url: photoDataUrl,
      title: prev.title || caption || 'Dokumentasi Progres Fisik Lapangan',
    }));
    setPhotoSourceType('camera');
    setIsCameraModalOpen(false);
    setIsUploadModalOpen(true);
  };

  // When file is picked from gallery
  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const cleanFileName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .trim();

        setNewPhoto((prev) => ({
          ...prev,
          url: dataUrl,
          title: prev.title || cleanFileName || 'Dokumentasi Fisik Lapangan',
        }));
        setPhotoSourceType('gallery');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Reset or clear selected photo
  const handleClearPhoto = () => {
    setNewPhoto((prev) => ({ ...prev, url: '' }));
    setPhotoSourceType(null);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoto.title || !newPhoto.url) return;
    onAddPhoto(newPhoto);
    setIsUploadModalOpen(false);
    setPhotoSourceType(null);
    setShowUrlField(false);
    setNewPhoto({
      date: new Date().toISOString().split('T')[0],
      category: 'Progress Hari Ini',
      title: '',
      url: '',
      uploadedBy: defaultUploader,
      notes: '',
    });
  };

  const handleDownload = (photo: PhotoItem) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = `Dokumentasi_FORESYNDO2_${photo.category}_${photo.date}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Camera className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Galeri Dokumentasi Foto Proyek</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Arsip foto inspeksi & kemajuan konstruksi Gedung FORESYNDO 2 berdasarkan kategori pekerjaan
          </p>
        </div>

        {canUpload && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleOpenDirectCamera}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 shadow-md transition-all shrink-0 cursor-pointer"
              title="Ambil foto langsung menggunakan kamera perangkat dengan stempel resmi proyek"
            >
              <Camera className="w-4 h-4 text-orange-400" /> Foto Kamera Langsung
            </button>

            <button
              onClick={() => {
                setIsUploadModalOpen(true);
              }}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Upload Foto Baru
            </button>
          </div>
        )}
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              selectedCategory === cat
                ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {cat} {cat !== 'Semua' && `(${photos.filter((p) => p.category === cat).length})`}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPhotos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => setLightboxPhoto(photo)}
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer flex flex-col"
          >
            {/* Image Container with Hover Overlay */}
            <div className="relative aspect-video overflow-hidden bg-slate-950">
              <SafeImage
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <span className="p-2.5 rounded-full bg-white/20 backdrop-blur-md text-white hover:scale-110 transition-transform">
                  <ZoomIn className="w-5 h-5" />
                </span>
              </div>
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-orange-400 text-[10px] font-bold border border-slate-700">
                {photo.category}
              </span>
            </div>

            {/* Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2 leading-snug">
                  {photo.title}
                </h3>
                {photo.notes && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {photo.notes}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-2 mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-orange-400" /> {photo.date}
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> {photo.uploadedBy}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Inspection Lightbox Modal */}
      {lightboxPhoto && (() => {
        const currentIdx = filteredPhotos.findIndex((p) => p.id === lightboxPhoto.id);
        const totalPhotos = filteredPhotos.length;

        const handlePrev = (e?: React.MouseEvent) => {
          e?.stopPropagation();
          if (currentIdx > 0) {
            setLightboxPhoto(filteredPhotos[currentIdx - 1]);
          } else if (totalPhotos > 0) {
            setLightboxPhoto(filteredPhotos[totalPhotos - 1]);
          }
        };

        const handleNext = (e?: React.MouseEvent) => {
          e?.stopPropagation();
          if (currentIdx < totalPhotos - 1) {
            setLightboxPhoto(filteredPhotos[currentIdx + 1]);
          } else if (totalPhotos > 0) {
            setLightboxPhoto(filteredPhotos[0]);
          }
        };

        const handleMouseDown = (e: React.MouseEvent) => {
          if (lightboxZoom <= 100) return;
          e.preventDefault();
          setIsLightboxDragging(true);
          lightboxDragStartRef.current = {
            x: e.clientX - lightboxPan.x,
            y: e.clientY - lightboxPan.y,
          };
        };

        const handleMouseMove = (e: React.MouseEvent) => {
          if (!isLightboxDragging || lightboxZoom <= 100) return;
          e.preventDefault();
          setLightboxPan({
            x: e.clientX - lightboxDragStartRef.current.x,
            y: e.clientY - lightboxDragStartRef.current.y,
          });
        };

        const handleMouseUp = () => setIsLightboxDragging(false);

        const handleWheel = (e: React.WheelEvent) => {
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            if (e.deltaY < 0) {
              setLightboxZoom((prev) => Math.min(prev + 15, 400));
            } else {
              setLightboxZoom((prev) => Math.max(prev - 15, 50));
            }
          }
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
            <div
              className={`bg-slate-900 border border-slate-800 rounded-3xl w-full overflow-hidden shadow-2xl relative flex flex-col transition-all duration-300 ${
                lightboxFullscreen
                  ? 'fixed inset-2 z-50 max-w-none max-h-none h-[calc(100vh-16px)] p-4'
                  : 'max-w-5xl max-h-[92vh] my-auto'
              }`}
            >
              {/* Top Navigation & Control Bar */}
              <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-20">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
                    <Camera className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white line-clamp-1">{lightboxPhoto.title}</span>
                      {totalPhotos > 1 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-orange-400 font-bold border border-slate-700">
                          {currentIdx + 1} / {totalPhotos}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {lightboxPhoto.category} &bull; {lightboxPhoto.date} &bull; Oleh: {lightboxPhoto.uploadedBy}
                    </span>
                  </div>
                </div>

                {/* Inspection Controls: Clarity, Zoom, Rotate, Fullscreen, Close */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Clarity Mode Toggle */}
                  <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                    <button
                      onClick={() => setLightboxClarity('sharp')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        lightboxClarity === 'sharp' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Mode Tajam & Jernih (Enhanced HDR)"
                    >
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Tajam & Jernih
                      </span>
                    </button>
                    <button
                      onClick={() => setLightboxClarity('original')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        lightboxClarity === 'original' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Warna Gambar Asli"
                    >
                      Asli
                    </button>
                    <button
                      onClick={() => setLightboxClarity('high_contrast')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        lightboxClarity === 'high_contrast' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Kontras Tinggi (Perjelas Tekstur Fisik)"
                    >
                      Kontras
                    </button>
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                    <button
                      onClick={() => setLightboxZoom((prev) => Math.max(prev - 25, 50))}
                      className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Perkecil (-25%)"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-bold text-white px-2 min-w-[50px] text-center">
                      {lightboxZoom}%
                    </span>
                    <button
                      onClick={() => setLightboxZoom((prev) => Math.min(prev + 25, 400))}
                      className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Perbesar (+25%)"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setLightboxZoom(100);
                        setLightboxRotation(0);
                        setLightboxPan({ x: 0, y: 0 });
                      }}
                      className="px-2 py-1 rounded-lg hover:bg-slate-700 text-[11px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Reset Ukuran (100%)"
                    >
                      Reset
                    </button>
                    <div className="w-[1px] h-4 bg-slate-700 mx-1" />
                    <button
                      onClick={() => setLightboxRotation((prev) => (prev + 90) % 360)}
                      className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Putar 90 Derajat"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setLightboxFullscreen(!lightboxFullscreen)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title={lightboxFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
                  >
                    {lightboxFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setLightboxPhoto(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Tutup (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Interactive Canvas with Prev/Next overlays */}
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                className={`flex-1 overflow-hidden relative flex items-center justify-center bg-black/90 p-4 select-none ${
                  lightboxZoom > 100 ? (isLightboxDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
                } ${lightboxFullscreen ? 'min-h-[500px]' : 'min-h-[380px] max-h-[66vh]'}`}
                style={{
                  backgroundImage: `radial-gradient(#1e293b 1px, transparent 1px)`,
                  backgroundSize: '24px 24px',
                }}
              >
                {/* Previous Navigation Button */}
                {totalPhotos > 1 && (
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-slate-900/80 hover:bg-orange-500 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all cursor-pointer hover:scale-110"
                    title="Foto Sebelumnya (Panah Kiri)"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}

                {/* Next Navigation Button */}
                {totalPhotos > 1 && (
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-slate-900/80 hover:bg-orange-500 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all cursor-pointer hover:scale-110"
                    title="Foto Berikutnya (Panah Kanan)"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}

                {/* Scaled/Panned Image Container */}
                <div
                  className="transition-transform duration-150 ease-out origin-center flex items-center justify-center pointer-events-none"
                  style={{
                    transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxZoom / 100}) rotate(${lightboxRotation}deg)`,
                  }}
                >
                  <SafeImage
                    src={lightboxPhoto.url}
                    alt={lightboxPhoto.title}
                    clarityMode={lightboxClarity}
                    className="max-h-[62vh] max-w-full w-auto object-contain rounded-xl shadow-2xl border border-slate-800 pointer-events-auto"
                  />
                </div>
              </div>

              {/* Bottom Info & Download Bar */}
              <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 z-20">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
                      {lightboxPhoto.category}
                    </span>
                    <span className="text-xs text-slate-400">{lightboxPhoto.date}</span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-xs text-slate-400">Oleh: <strong className="text-slate-200">{lightboxPhoto.uploadedBy}</strong></span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white truncate">{lightboxPhoto.title}</h3>
                  {lightboxPhoto.notes && (
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">{lightboxPhoto.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleDownload(lightboxPhoto)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                    title="Unduh Berkas Foto Resolusi Penuh"
                  >
                    <Download className="w-4 h-4" /> Download Foto HD
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative my-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Upload Foto Dokumentasi Proyek</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Bisa foto langsung dari site atau unggah dari galeri ponsel / komputer
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUploadModalOpen(false);
                  handleClearPhoto();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              {/* Photo Attachment Section */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-900 dark:text-white">
                  Lampiran Foto Progres Fisik <span className="text-red-500">*</span>
                </label>

                {newPhoto.url ? (
                  /* Photo Preview Box */
                  <div className="relative rounded-2xl overflow-hidden border-2 border-orange-500/40 bg-slate-950 shadow-md group">
                    <SafeImage
                      src={newPhoto.url}
                      alt="Preview Foto Terpilih"
                      className="w-full h-52 object-contain bg-slate-950"
                    />

                    {/* Source Tag Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      {photoSourceType === 'camera' && (
                        <span className="px-2.5 py-1 rounded-full bg-orange-500/90 text-white font-bold text-[10px] flex items-center gap-1 shadow backdrop-blur-sm">
                          <Camera className="w-3 h-3" /> Foto Kamera (Stempel Resmi)
                        </span>
                      )}
                      {photoSourceType === 'gallery' && (
                        <span className="px-2.5 py-1 rounded-full bg-blue-600/90 text-white font-bold text-[10px] flex items-center gap-1 shadow backdrop-blur-sm">
                          <Upload className="w-3 h-3" /> Berkas Galeri HP / PC
                        </span>
                      )}
                      {photoSourceType === 'url' && (
                        <span className="px-2.5 py-1 rounded-full bg-slate-800/90 text-white font-bold text-[10px] flex items-center gap-1 shadow backdrop-blur-sm">
                          <LinkIcon className="w-3 h-3" /> URL Web Eksternal
                        </span>
                      )}
                    </div>

                    {/* Quick Action Overlay */}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCameraModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 backdrop-blur-md transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" /> Foto Ulang Kamera
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center gap-1.5 backdrop-blur-md transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Pilih dari Galeri
                      </button>
                      <button
                        type="button"
                        onClick={handleClearPhoto}
                        className="px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 backdrop-blur-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Two Big Option Cards: Camera vs Gallery */
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option 1: Direct Camera */}
                      <button
                        type="button"
                        onClick={() => setIsCameraModalOpen(true)}
                        className="p-4 rounded-2xl border-2 border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/10 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 text-left transition-all group flex flex-col justify-between cursor-pointer"
                      >
                        <div className="p-3 rounded-xl bg-orange-500 text-white w-fit mb-3 shadow-md shadow-orange-500/30 group-hover:scale-105 transition-transform">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Foto Langsung (Kamera)</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Buka lensa kamera site dengan stempel resmi proyek otomatis
                          </p>
                        </div>
                        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 dark:text-orange-400">
                          Buka Kamera &rarr;
                        </span>
                      </button>

                      {/* Option 2: Gallery / Local File */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-all group flex flex-col justify-between cursor-pointer"
                      >
                        <div className="p-3 rounded-xl bg-blue-500 text-white w-fit mb-3 shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Unggah dari Galeri</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Pilih file foto dari memori ponsel atau komputer (JPG, PNG)
                          </p>
                        </div>
                        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                          Pilih Berkas &rarr;
                        </span>
                      </button>
                    </div>

                    {/* URL Link Alternative Toggle */}
                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => setShowUrlField(!showUrlField)}
                        className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-orange-500 dark:hover:text-orange-400 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                      >
                        {showUrlField ? 'Sembunyikan Input URL' : 'Atau input tautan URL gambar web langsung'}
                      </button>
                    </div>

                    {showUrlField && (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/photo-..."
                          value={newPhoto.url}
                          onChange={(e) => {
                            setNewPhoto({ ...newPhoto, url: e.target.value });
                            setPhotoSourceType('url');
                          }}
                          className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newPhoto.url) setPhotoSourceType('url');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-orange-500 text-white font-bold text-xs"
                        >
                          Pakai URL
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Tanggal Dokumentasi
                  </label>
                  <input
                    type="date"
                    required
                    value={newPhoto.date}
                    onChange={(e) => setNewPhoto({ ...newPhoto, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Kategori Pekerjaan
                  </label>
                  <select
                    value={newPhoto.category}
                    onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value as PhotoCategory })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    {categories.filter((c) => c !== 'Semua').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Judul / Keterangan Foto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengecoran Balok & Pelat Lantai 2 Zona B"
                  value={newPhoto.title}
                  onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Catatan Teknis / QC
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan hasil inspeksi, mutu beton slump test, atau catatan spesifikasi..."
                  value={newPhoto.notes}
                  onChange={(e) => setNewPhoto({ ...newPhoto, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              {/* Uploader display info */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Pengunggah:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{newPhoto.uploadedBy}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsUploadModalOpen(false);
                    handleClearPhoto();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newPhoto.url || !newPhoto.title}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Simpan ke Galeri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden file input for native gallery/file upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryFileSelect}
        className="hidden"
      />

      {/* Reusable Camera Modal with Site Stamp */}
      <ProgressCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
        logDate={newPhoto.date}
        defaultCaption={newPhoto.title}
        title="Kamera Dokumentasi Fisik Proyek"
        badgeLabel="Galeri Foto"
        buttonLabel="Lampirkan ke Galeri Foto"
      />
    </div>
  );
};
