import React, { useState, useRef } from 'react';
import { PhotoItem, PhotoCategory, UserRole, RolePermissions } from '../../types';
import {
  Camera,
  Plus,
  ZoomIn,
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
} from 'lucide-react';
import { ProgressCameraModal } from '../monitoring/ProgressCameraModal';
import { SafeImage } from '../common/SafeImage';

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
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [photoSourceType, setPhotoSourceType] = useState<'camera' | 'gallery' | 'url' | null>(null);
  const [showUrlField, setShowUrlField] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const defaultUploader =
    activeUserName ||
    (userRole === 'Konsultan'
      ? 'Ir. Hendra Gunawan, ST, IPU (Konsultan MK)'
      : userRole === 'Kontraktor'
      ? 'Ir. Agus Pratama (Kontraktor Pelaksana)'
      : userRole === 'Owner' || userRole === 'Direktur'
      ? 'H. Bambang S., M.T. (Owner)'
      : 'Ir. Agus Pratama');

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

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/60 text-white hover:bg-slate-950 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex-1 bg-black flex items-center justify-center p-4 min-h-[350px]">
              <SafeImage
                src={lightboxPhoto.url}
                alt={lightboxPhoto.title}
                className="max-h-[60vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="p-5 bg-slate-900 border-t border-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-bold border border-orange-500/30">
                    {lightboxPhoto.category}
                  </span>
                  <span className="text-xs text-slate-400">{lightboxPhoto.date}</span>
                </div>
                <h3 className="text-base font-black text-white">{lightboxPhoto.title}</h3>
                {lightboxPhoto.notes && (
                  <p className="text-xs text-slate-300 mt-1">{lightboxPhoto.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleDownload(lightboxPhoto)}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all"
                >
                  <Download className="w-4 h-4" /> Download Foto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
