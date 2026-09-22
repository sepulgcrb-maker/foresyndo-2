import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  X,
  Check,
  FolderPlus,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { MaterialItem } from '../../types';

interface MaterialCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  materials: MaterialItem[];
  defaultCategories: string[];
  onAddCategory: (newCategory: string) => void;
  onDeleteCategory: (categoryToDelete: string) => void;
  onSelectCategory?: (category: string) => void;
}

const PRESET_SUGGESTIONS = [
  'K3 & Alat Pelindung Diri (APD)',
  'Baja Ringan & Atap Galvalum',
  'Kayu, Triplek & Bekisting',
  'Perancah & Scaffolding',
  'Cat, Thinner & Waterproofing',
  'Bahan Kimia & Aditif Beton',
  'Sanitair, Keramik & Granit',
  'Peralatan & Perkakas Kerja',
  'Paving Block & Saluran Drainase',
  'Geoteknik, Tanah & Pasir Urug',
];

export const MaterialCategoryModal: React.FC<MaterialCategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  materials,
  defaultCategories,
  onAddCategory,
  onDeleteCategory,
  onSelectCategory,
}) => {
  const [newCatInput, setNewCatInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const handleAddSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCatInput.trim();
    if (!trimmed) {
      setErrorMsg('Nama kategori tidak boleh kosong');
      return;
    }

    const exists = categories.some(
      (c) => c.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setErrorMsg(`Kategori "${trimmed}" sudah ada.`);
      return;
    }

    onAddCategory(trimmed);
    setSuccessMsg(`Kategori "${trimmed}" berhasil ditambahkan!`);
    setErrorMsg('');
    setNewCatInput('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleQuickAdd = (preset: string) => {
    const exists = categories.some(
      (c) => c.toLowerCase() === preset.toLowerCase()
    );
    if (exists) {
      setErrorMsg(`Kategori "${preset}" sudah ada.`);
      setTimeout(() => setErrorMsg(''), 2500);
      return;
    }
    onAddCategory(preset);
    setSuccessMsg(`Kategori "${preset}" berhasil ditambahkan!`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const filteredCategories = categories.filter((c) =>
    c.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-6 shadow-2xl relative space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Tambah &amp; Kelola Kategori Material Manual
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Buat kategori baru secara fleksibel untuk klasifikasi material proyek
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form for Manual Category Addition */}
        <form onSubmit={handleAddSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Kategori Baru (Manual)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Contoh: K3 & Alat Pelindung Diri, Baja Ringan, Cat & Sealant..."
                  value={newCatInput}
                  onChange={(e) => {
                    setNewCatInput(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Tambah Kategori
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </form>

        {/* Quick Presets / Rekomendasi Kategori Proyek */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Saran Kategori Standar Konstruksi (Klik untuk langsung tambah):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_SUGGESTIONS.map((preset) => {
              const isAlreadyAdded = categories.some(
                (c) => c.toLowerCase() === preset.toLowerCase()
              );
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={isAlreadyAdded}
                  onClick={() => handleQuickAdd(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 ${
                    isAlreadyAdded
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed line-through'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-orange-500 hover:text-orange-600 cursor-pointer shadow-xs'
                  }`}
                >
                  <Plus className="w-2.5 h-2.5" />
                  {preset}
                </button>
              );
            })}
          </div>
        </div>

        {/* List of Active Categories */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-orange-500" />
              Daftar Kategori Tersedia ({categories.length})
            </span>
            {categories.length > 5 && (
              <input
                type="text"
                placeholder="Cari kategori..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-800 dark:text-white focus:outline-none"
              />
            )}
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {filteredCategories.map((cat) => {
              const isDefault = defaultCategories.includes(cat);
              const count = materials.filter((m) => m.category === cat).length;

              return (
                <div
                  key={cat}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 flex items-center justify-between gap-2 transition-all shadow-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="p-1 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400">
                      <Tag className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {cat}
                    </span>
                    {isDefault ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                        Default Sistem
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                        Manual Kustom
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {count} Material
                    </span>

                    {onSelectCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat);
                          onClose();
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-orange-500 hover:text-white text-slate-700 dark:text-slate-300 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Pilih
                      </button>
                    )}

                    {!isDefault && (
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            count > 0 &&
                            !window.confirm(
                              `Ada ${count} material yang saat ini menggunakan kategori "${cat}". Apakah Anda yakin ingin menghapus kategori ini?`
                            )
                          ) {
                            return;
                          }
                          onDeleteCategory(cat);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Hapus Kategori Manual"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredCategories.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                Tidak ada kategori yang cocok dengan pencarian.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
