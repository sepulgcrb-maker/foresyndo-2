import React, { useState, useMemo } from 'react';
import {
  ProjectInfo,
  WorkItem,
  PaymentTerm,
  DailyLog,
  MaterialItem,
  PhotoItem,
  PhotoCategory,
  PDFCustomExportOptions,
  DateRangePreset,
} from '../../types';
import {
  X,
  FileText,
  Calendar,
  Camera,
  Layers,
  Settings2,
  Download,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  Building2,
  FileCheck2,
  Sliders,
  ChevronRight,
  Eye,
  Sparkles,
} from 'lucide-react';

interface PDFCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'Harian' | 'Mingguan' | 'Bulanan' | 'Progress' | 'Termin' | 'Material' | 'Keuangan' | 'RAB' | 'Kurva-S';
  project: ProjectInfo;
  workItems: WorkItem[];
  paymentTerms: PaymentTerm[];
  dailyLogs: DailyLog[];
  materials: MaterialItem[];
  photos: PhotoItem[];
  onGenerate: (options: PDFCustomExportOptions) => Promise<void> | void;
}

const ALL_CATEGORIES: PhotoCategory[] = [
  'Pondasi',
  'Struktur',
  'Arsitektur',
  'MEP',
  'Finishing',
  'Progress Hari Ini',
];

export const PDFCustomizationModal: React.FC<PDFCustomizationModalProps> = ({
  isOpen,
  onClose,
  reportType,
  project,
  workItems,
  paymentTerms,
  dailyLogs,
  materials,
  photos,
  onGenerate,
}) => {
  // 1. Date Range State
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('project_period');
  const [startDate, setStartDate] = useState(project.startDate || '2026-09-01');
  const [endDate, setEndDate] = useState(project.targetEndDate || '2027-06-30');

  // 2. Photo Documentation State
  const [includePhotos, setIncludePhotos] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<PhotoCategory[]>([
    'Pondasi',
    'Struktur',
    'Arsitektur',
    'MEP',
    'Finishing',
    'Progress Hari Ini',
  ]);
  const [maxPhotosPerCategory, setMaxPhotosPerCategory] = useState<number>(6);
  const [includePhotoDetails, setIncludePhotoDetails] = useState(true);

  // 3. Document Sections & Layout
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [includeProjectInfo, setIncludeProjectInfo] = useState(true);
  const [includeDataTable, setIncludeDataTable] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includeSupervisoryMK, setIncludeSupervisoryMK] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  // Loading state during generation
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper to handle date preset selection
  const handleSelectPreset = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
    const today = new Date();

    if (preset === 'project_period') {
      setStartDate(project.startDate || '2026-09-01');
      setEndDate(project.targetEndDate || '2027-06-30');
    } else if (preset === 'this_month') {
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
      setStartDate(`${year}-${month}-01`);
      setEndDate(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'last_month') {
      const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const year = prevDate.getFullYear();
      const month = String(prevDate.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(year, prevDate.getMonth() + 1, 0).getDate();
      setStartDate(`${year}-${month}-01`);
      setEndDate(`${year}-${month}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'this_week') {
      const past7 = new Date(today);
      past7.setDate(today.getDate() - 7);
      setStartDate(past7.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Toggle category
  const toggleCategory = (cat: PhotoCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories([...ALL_CATEGORIES]);
  };

  const handleClearCategories = () => {
    setSelectedCategories([]);
  };

  // Aggregate all photos including daily log photos
  const allAvailablePhotos = useMemo(() => {
    const list: PhotoItem[] = [...photos];
    dailyLogs.forEach((dl) => {
      if (dl.photos && dl.photos.length > 0) {
        dl.photos.forEach((photoUrl, pIdx) => {
          if (!list.some((p) => p.url === photoUrl)) {
            list.push({
              id: `DL-${dl.id}-${pIdx}`,
              date: dl.date,
              category: 'Progress Hari Ini',
              title: `Foto Site Harian (${dl.date})`,
              url: photoUrl,
              uploadedBy: dl.mandorName || dl.createdBy || 'Site Inspector',
              notes: dl.activitySummary || 'Dokumentasi terlampir',
            });
          }
        });
      }
    });
    return list;
  }, [photos, dailyLogs]);

  // Compute live count of matching photos in range and categories
  const matchingPhotosCount = useMemo(() => {
    let list = allAvailablePhotos;
    if (startDate && endDate) {
      list = list.filter((p) => p.date >= startDate && p.date <= endDate);
    }
    list = list.filter((p) => selectedCategories.includes(p.category));
    return list.length;
  }, [allAvailablePhotos, startDate, endDate, selectedCategories]);

  // Photo counts by category (for badges)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_CATEGORIES.forEach((cat) => {
      let filtered = allAvailablePhotos.filter((p) => p.category === cat);
      if (startDate && endDate) {
        filtered = filtered.filter((p) => p.date >= startDate && p.date <= endDate);
      }
      counts[cat] = filtered.length;
    });
    return counts;
  }, [allAvailablePhotos, startDate, endDate]);

  // Active items in date range
  const matchingWorkItemsCount = useMemo(() => {
    if (!startDate || !endDate) return workItems.length;
    return workItems.filter((wi) => wi.startDate <= endDate && wi.endDate >= startDate).length;
  }, [workItems, startDate, endDate]);

  const matchingDailyLogsCount = useMemo(() => {
    if (!startDate || !endDate) return dailyLogs.length;
    return dailyLogs.filter((l) => l.date >= startDate && l.date <= endDate).length;
  }, [dailyLogs, startDate, endDate]);

  // Days range computation
  const daysDiff = useMemo(() => {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : null;
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    const options: PDFCustomExportOptions = {
      reportType,
      dateRangePreset,
      startDate: dateRangePreset !== 'all' ? startDate : undefined,
      endDate: dateRangePreset !== 'all' ? endDate : undefined,
      includePhotos,
      photoCategories: selectedCategories,
      maxPhotosPerCategory,
      includePhotoDetails,
      includeProjectInfo,
      includeDataTable,
      includeSignatures,
      signatories: {
        siteManager: true,
        director: true,
        supervisoryMK: includeSupervisoryMK,
      },
      orientation,
      customNotes: customNotes.trim() ? customNotes.trim() : undefined,
      reportTitle: customTitle.trim() ? customTitle.trim() : undefined,
    };

    try {
      await onGenerate(options);
      onClose();
    } catch (err) {
      console.error('Failed to generate customized PDF', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickDefaultExport = async () => {
    setIsGenerating(true);
    try {
      await onGenerate({
        reportType,
        includePhotos: false,
        orientation: 'portrait',
      });
      onClose();
    } catch (err) {
      console.error('Failed quick export', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl my-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-red-500/10 text-red-500 dark:bg-red-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Kustomisasi Ekspor Laporan PDF
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white">
                  {reportType}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Atur rentang tanggal, filter kategori foto dokumentasi site, dan tata letak resmi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body with Scroll */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          {/* Section 1: Rentang Tanggal Laporan */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  1. Rentang Tanggal Laporan
                </h4>
              </div>
              {daysDiff && (
                <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 px-2.5 py-0.5 rounded-full">
                  Durasi: {daysDiff} Hari
                </span>
              )}
            </div>

            {/* Presets Chips */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'project_period', label: 'Seluruh Masa Proyek' },
                { id: 'this_month', label: 'Bulan Berjalan' },
                { id: 'last_month', label: 'Bulan Lalu' },
                { id: 'this_week', label: '7 Hari Terakhir' },
                { id: 'custom', label: 'Kustom Tanggal' },
                { id: 'all', label: 'Tanpa Batasan' },
              ].map((p) => {
                const isSelected = dateRangePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id as DateRangePreset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Date Pickers */}
            {dateRangePreset !== 'all' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Dari Tanggal (Mulai)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDateRangePreset('custom');
                    }}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Sampai Tanggal (Selesai)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDateRangePreset('custom');
                    }}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Match Data Preview Tag */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Data tercakup:</span>
              <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-medium">
                {matchingWorkItemsCount} Item Pekerjaan
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-medium">
                {matchingDailyLogsCount} Catatan Harian
              </span>
              <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md font-medium">
                {matchingPhotosCount} Foto Dokumentasi
              </span>
            </div>
          </div>

          {/* Section 2: Ringkasan Foto Dokumentasi per Kategori */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-orange-500" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  2. Dokumentasi Foto Lapangan per Kategori
                </h4>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePhotos}
                  onChange={(e) => setIncludePhotos(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Sertakan Lampiran Foto
                </span>
              </label>
            </div>

            {includePhotos && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">
                    Pilih Kategori Pekerjaan yang Ditampilkan:
                  </span>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectAllCategories}
                      className="text-orange-500 hover:text-orange-600 font-bold"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={handleClearCategories}
                      className="text-slate-400 hover:text-slate-600 font-semibold"
                    >
                      Hapus Semua
                    </button>
                  </div>
                </div>

                {/* Category Selection Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {ALL_CATEGORIES.map((cat) => {
                    const isChecked = selectedCategories.includes(cat);
                    const count = categoryCounts[cat] || 0;

                    return (
                      <div
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isChecked
                            ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-400 text-orange-900 dark:text-orange-200'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center text-white text-[10px] ${
                              isChecked ? 'bg-orange-500' : 'border border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3" />}
                          </div>
                          <span className="text-xs font-semibold">{cat}</span>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            count > 0
                              ? 'bg-orange-200 dark:bg-orange-900/60 text-orange-800 dark:text-orange-300'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                          }`}
                        >
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Photo Limit & Details Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Maksimal Foto per Kategori:
                    </label>
                    <select
                      value={maxPhotosPerCategory}
                      onChange={(e) => setMaxPhotosPerCategory(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white"
                    >
                      <option value={4}>Maksimal 4 Foto / Kategori</option>
                      <option value={6}>Maksimal 6 Foto / Kategori (Rekomendasi)</option>
                      <option value={10}>Maksimal 10 Foto / Kategori</option>
                      <option value={20}>Semua Foto (Tanpa Batasan)</option>
                    </select>
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={includePhotoDetails}
                        onChange={(e) => setIncludePhotoDetails(e.target.checked)}
                        className="rounded text-orange-500 focus:ring-orange-500"
                      />
                      <span>Tampilkan stempel tanggal &amp; nama pengunggah</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Tata Letak & Dokumen Tambahan */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-orange-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                3. Tata Letak &amp; Penandatangan
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Orientation */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Orientasi Kertas Dokumen
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      orientation === 'portrait'
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Portrait (A4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      orientation === 'landscape'
                        ? 'bg-orange-500 text-white border-orange-500'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Landscape (A4)
                  </button>
                </div>
              </div>

              {/* Signatures Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Kolom Pengesahan Dokumen
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={includeSignatures}
                      onChange={(e) => setIncludeSignatures(e.target.checked)}
                      className="rounded text-orange-500 focus:ring-orange-500"
                    />
                    <span>Sertakan Kolom Tanda Tangan Resmi</span>
                  </label>
                  {includeSignatures && (
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 pl-6">
                      <input
                        type="checkbox"
                        checked={includeSupervisoryMK}
                        onChange={(e) => setIncludeSupervisoryMK(e.target.checked)}
                        className="rounded text-orange-500 focus:ring-orange-500"
                      />
                      <span>Tanda Tangan Tripartit (Kontraktor, Pengawas MK, Owner)</span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Custom Memo Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Catatan Khusus / Disposisi Lapangan (Opsional):
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Tambahkan catatan khusus, instruksi penyesuaian jadwal, atau evaluasi mingguan untuk Direktur..."
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              Format: <strong>{orientation.toUpperCase()}</strong> &bull; Total Foto:{' '}
              <strong>{includePhotos ? matchingPhotosCount : 0}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleQuickDefaultExport}
              disabled={isGenerating}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
            >
              Ekspor Cepat Default
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isGenerating}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF Kustom</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
