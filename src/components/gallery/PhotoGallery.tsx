import React, { useState } from 'react';
import { PhotoItem, PhotoCategory, UserRole, RolePermissions } from '../../types';
import { Camera, Plus, ZoomIn, Download, Maximize2, X, Calendar, User, Tag } from 'lucide-react';

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

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhoto.title || !newPhoto.url) return;
    onAddPhoto(newPhoto);
    setIsUploadModalOpen(false);
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
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Upload Foto Baru
          </button>
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
              <img
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
              <img
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Upload Foto Dokumentasi Proyek</h3>

            <form onSubmit={handleUploadSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Kategori Pekerjaan</label>
                <select
                  value={newPhoto.category}
                  onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value as PhotoCategory })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                >
                  {categories.filter((c) => c !== 'Semua').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Judul / Keterangan Foto</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengecoran Balok & Pelat Lantai 2 Zona B"
                  value={newPhoto.title}
                  onChange={(e) => setNewPhoto({ ...newPhoto, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">URL Foto (Unsplash / Supabase Storage)</label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={newPhoto.url}
                  onChange={(e) => setNewPhoto({ ...newPhoto, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Catatan Teknis QC</label>
                <textarea
                  rows={2}
                  placeholder="Catatan hasil inspeksi atau spesifikasi..."
                  value={newPhoto.notes}
                  onChange={(e) => setNewPhoto({ ...newPhoto, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
                >
                  Simpan Foto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
