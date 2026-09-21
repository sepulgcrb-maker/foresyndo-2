import React from 'react';
import { X, Calendar, User, Download, MapPin, Tag } from 'lucide-react';

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
  if (!isOpen || !photoUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = `Dokumentasi-Progres-${date || 'Site'}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl p-4 sm:p-6 shadow-2xl relative space-y-4 my-auto max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
              <MapPin className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {title || 'Dokumentasi Progres Fisik Lapangan'}
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                {date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-orange-400" /> {date}
                  </span>
                )}
                {author && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-sky-400" /> {author}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh Berkas Foto"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Unduh</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Content */}
        <div className="flex-1 overflow-hidden flex items-center justify-center bg-black/50 rounded-2xl border border-slate-800/80 p-2 min-h-[300px] max-h-[65vh]">
          <img
            src={photoUrl}
            alt={title || 'Dokumentasi Progres'}
            className="max-w-full max-h-[62vh] object-contain rounded-xl shadow-2xl"
          />
        </div>

        {/* Notes / Footer */}
        {notes && (
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 text-xs text-slate-300">
            <span className="font-bold text-orange-400 block mb-0.5">Keterangan / Kegiatan:</span>
            <p className="line-clamp-2">{notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};
