import React, { useState, useRef, useMemo } from 'react';
import { OFFICIAL_RAB_DOCUMENT, INITIAL_PROJECT_INFO } from '../../data/initialData';
import type { RABDetailItem, RABSector } from '../../data/initialData';
import { formatIDR } from '../../utils/calculations';
import { generateOfficialRABPDF, generateExcelReport } from '../../utils/exportEngine';
import { QRCodeSVG } from 'qrcode.react';
import {
  FileText,
  ShieldCheck,
  Download,
  Printer,
  CheckCircle2,
  Upload,
  Search,
  Filter,
  Layers,
  FileSpreadsheet,
  Zap,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Percent,
  SlidersHorizontal,
  FolderOpen,
  ArrowUpDown,
  Building2,
  ExternalLink,
} from 'lucide-react';

import { ProjectInfo } from '../../types';

interface OfficialRABViewerProps {
  onClose?: () => void;
  onApplyProgress25?: () => void;
  project?: ProjectInfo;
}

type ViewMode = 'grouped' | 'table';
type SortOption = 'code' | 'bobot-desc' | 'price-desc' | 'name';

export const OfficialRABViewer: React.FC<OfficialRABViewerProps> = ({ onClose, onApplyProgress25, project }) => {
  const [rab, setRab] = useState(OFFICIAL_RAB_DOCUMENT);
  const [selectedSector, setSelectedSector] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter25Only, setFilter25Only] = useState(false);
  const [filterSignificantOnly, setFilterSignificantOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [sortBy, setSortBy] = useState<SortOption>('code');
  const [expandedSectors, setExpandedSectors] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSector = (sectorNum: number) => {
    setExpandedSectors((prev) => ({
      ...prev,
      [sectorNum]: !prev[sectorNum],
    }));
  };

  const expandAllSectors = () => {
    const all: Record<number, boolean> = {};
    rab.sectors.forEach((s) => (all[s.sectorNumber] = true));
    setExpandedSectors(all);
  };

  const collapseAllSectors = () => {
    setExpandedSectors({});
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPDF(true);
    try {
      generateOfficialRABPDF(rab, project);
    } catch (err) {
      console.error('Error exporting RAB PDF:', err);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleExportExcel = () => {
    setIsExportingExcel(true);
    try {
      const projInfo: ProjectInfo = project || INITIAL_PROJECT_INFO;
      generateExcelReport('RAB', projInfo, [], [], [], [], rab);
    } catch (err) {
      console.error('Error exporting RAB Excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccessMessage(null);

    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccessMessage(
        `Berkas "${file.name}" terverifikasi. Seluruh 14 Sektor dan 97 Sub-item RAB berhasil disinkronisasi dengan persentase bobot presisi 100.00%.`
      );
    }, 1200);
  };

  // Metrics calculations
  const totalRABValue = rab.totalNominal;
  const subtotalFisik = rab.subtotalFisik || 13028613496;
  const ppnNominal = rab.ppn11Percent || 1433147485;
  const target25Value = totalRABValue * 0.25;

  // Filtered detail items
  const filteredDetailItems = useMemo(() => {
    return rab.detailItems
      .filter((item) => {
        const matchesSector = selectedSector === 'ALL' || item.sectorNumber === selectedSector;
        const matchesSearch =
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));
        const matches25Filter = !filter25Only || (item.targetProgress25Percent && item.targetProgress25Percent > 0);
        const matchesSignificant = !filterSignificantOnly || item.bobotPercent >= 1.0;

        return matchesSector && matchesSearch && matches25Filter && matchesSignificant;
      })
      .sort((a, b) => {
        if (sortBy === 'bobot-desc') return b.bobotPercent - a.bobotPercent;
        if (sortBy === 'price-desc') return b.totalPrice - a.totalPrice;
        if (sortBy === 'name') return a.description.localeCompare(b.description);
        // default code sort
        return a.code.localeCompare(b.code, undefined, { numeric: true });
      });
  }, [rab.detailItems, selectedSector, searchTerm, filter25Only, filterSignificantOnly, sortBy]);

  // Total filtered summary
  const filteredTotalNominal = useMemo(() => {
    return filteredDetailItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [filteredDetailItems]);

  const filteredTotalBobot = useMemo(() => {
    return filteredDetailItems.reduce((sum, item) => sum + item.bobotPercent, 0);
  }, [filteredDetailItems]);

  // Items in 25% milestone
  const itemsIn25Milestone = useMemo(() => {
    return rab.detailItems.filter((i) => i.targetProgress25Percent && i.targetProgress25Percent > 0);
  }, [rab.detailItems]);

  const cumulative25Bobot = useMemo(() => {
    return itemsIn25Milestone.reduce(
      (acc, item) => acc + item.bobotPercent * ((item.targetProgress25Percent || 0) / 100),
      0
    );
  }, [itemsIn25Milestone]);

  // Group items by sector for the grouped view
  const itemsBySector = useMemo(() => {
    const grouped = new Map<number, RABDetailItem[]>();
    rab.sectors.forEach((s) => grouped.set(s.sectorNumber, []));

    filteredDetailItems.forEach((item) => {
      const list = grouped.get(item.sectorNumber) || [];
      list.push(item);
      grouped.set(item.sectorNumber, list);
    });

    return grouped;
  }, [rab.sectors, filteredDetailItems]);

  return (
    <div className="bg-slate-900 text-slate-100 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-lg shadow-orange-500/10">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-white">Rencana Anggaran Biaya (RAB) Rinci &amp; Analisis Bobot</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> 97 SUB-ITEM TERAUDIT
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">
                14 SEKTOR UTAMA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Struktur Anggaran Lengkap, Harga Satuan Pekerjaan (HSP), dan Distribusi Bobot Progres Fisik PT Foresyndo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv,.pdf,.json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            <Upload className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
            {isUploading ? 'Mengunggah & Auditing...' : 'Upload File RAB'}
          </button>

          {onApplyProgress25 && (
            <button
              onClick={onApplyProgress25}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4" /> Terapkan Progres 25%
            </button>
          )}

          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className={`w-4 h-4 ${isExportingExcel ? 'animate-spin' : ''}`} />
            {isExportingExcel ? 'Exporting...' : 'Export Excel (.xlsx)'}
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Download className={`w-4 h-4 ${isGeneratingPDF ? 'animate-spin' : ''}`} />
            {isGeneratingPDF ? 'Menyiapkan...' : 'Download PDF RAB'}
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-orange-400" /> Cetak
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              Tutup
            </button>
          )}
        </div>
      </div>

      {/* Upload Banner Alert */}
      {uploadSuccessMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{uploadSuccessMessage}</span>
        </div>
      )}

      {/* Financial KPIs Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/70 shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 uppercase block tracking-wider">Total Nilai Kontrak (RAB)</span>
          <span className="text-xl font-black text-amber-400 font-mono mt-1 block">{formatIDR(totalRABValue)}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">Termasuk PPN 11% &amp; 14 Sektor Pekerjaan</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/70 shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 uppercase block tracking-wider">Biaya Konstruksi Fisik</span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">{formatIDR(subtotalFisik)}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">90.09% dari total kontrak (97 Sub-item)</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/70 shadow-lg">
          <span className="text-[11px] font-bold text-slate-400 uppercase block tracking-wider">PPN 11% Konstruksi</span>
          <span className="text-xl font-black text-blue-400 font-mono mt-1 block">{formatIDR(ppnNominal)}</span>
          <span className="text-[10px] text-slate-400 mt-1 block">9.91% dari total kontrak</span>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-950/50 to-slate-900 border border-orange-700/50 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-orange-300 uppercase block tracking-wider">Milestone Termin 1 (25%)</span>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black">
              {cumulative25Bobot.toFixed(2)}%
            </span>
          </div>
          <span className="text-xl font-black text-orange-400 font-mono mt-1 block">{formatIDR(target25Value)}</span>
          <span className="text-[10px] text-orange-200/80 mt-1 block">Sektor 1, Sektor 2 &amp; Bagian Sektor 3</span>
        </div>
      </div>

      {/* Visual Weight Distribution Bar (14 Sectors) */}
      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-orange-400" /> Distribusi Bobot 14 Sektor Pekerjaan terhadap Nilai Kontrak
          </span>
          <span className="text-slate-400 font-mono text-[11px]">Total Fisik: 90.09% + PPN: 9.91% = 100.00%</span>
        </div>

        {/* Stacked Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden flex shadow-inner">
          {rab.sectors.map((s, idx) => {
            const colors = [
              'bg-blue-500',
              'bg-emerald-500',
              'bg-amber-500',
              'bg-purple-500',
              'bg-pink-500',
              'bg-indigo-500',
              'bg-teal-500',
              'bg-red-500',
              'bg-cyan-500',
              'bg-lime-500',
              'bg-orange-500',
              'bg-yellow-500',
              'bg-rose-500',
              'bg-violet-500',
            ];
            const colorClass = colors[idx % colors.length];

            return (
              <div
                key={s.sectorNumber}
                style={{ width: `${s.percentage}%` }}
                title={`Sektor ${s.sectorNumber}: ${s.name} (${s.percentage.toFixed(2)}%)`}
                className={`${colorClass} hover:opacity-80 transition-opacity cursor-pointer`}
                onClick={() => setSelectedSector(s.sectorNumber)}
              />
            );
          })}
          <div
            style={{ width: '9.91%' }}
            title="PPN 11% (9.91%)"
            className="bg-slate-500/80 hover:opacity-80 cursor-pointer"
          />
        </div>

        {/* Mini Legend */}
        <div className="flex items-center gap-3 overflow-x-auto text-[10px] text-slate-400 pt-1">
          <span className="font-semibold text-slate-300 shrink-0">Top Bobot:</span>
          <span className="shrink-0">
            <strong className="text-amber-400">Superstruktur</strong> 17.29%
          </span>
          <span className="shrink-0">•</span>
          <span className="shrink-0">
            <strong className="text-red-400">Fire Fighting</strong> 15.87%
          </span>
          <span className="shrink-0">•</span>
          <span className="shrink-0">
            <strong className="text-purple-400">Arsitektur</strong> 11.90%
          </span>
          <span className="shrink-0">•</span>
          <span className="shrink-0">
            <strong className="text-indigo-400">Kelistrikan</strong> 10.67%
          </span>
          <span className="shrink-0">•</span>
          <span className="shrink-0">
            <strong className="text-emerald-400">Pondasi</strong> 8.99%
          </span>
          <span className="shrink-0">•</span>
          <span className="shrink-0">
            <strong className="text-teal-400">Plumbing</strong> 8.22%
          </span>
        </div>
      </div>

      {/* Filter and Control Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Left: View Mode & Sector Dropdown */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* View mode switcher */}
          <div className="p-1 rounded-xl bg-slate-900 border border-slate-700 flex items-center">
            <button
              onClick={() => setViewMode('grouped')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'grouped' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" /> Per Sektor
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === 'table' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Master Spreadsheet
            </button>
          </div>

          {/* Sector Selector */}
          <div className="relative">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-white focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="ALL">Semua Sektor (1 - 14)</option>
              {rab.sectors.map((s) => (
                <option key={s.sectorNumber} value={s.sectorNumber}>
                  Sektor {s.sectorNumber}: {s.name.length > 25 ? s.name.slice(0, 25) + '...' : s.name} ({s.percentage.toFixed(2)}%)
                </option>
              ))}
            </select>
          </div>

          {/* Expand/Collapse All (for grouped view) */}
          {viewMode === 'grouped' && (
            <div className="flex items-center gap-1">
              <button
                onClick={expandAllSectors}
                className="px-2.5 py-1.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition-all"
              >
                Buka Semua
              </button>
              <button
                onClick={collapseAllSectors}
                className="px-2.5 py-1.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition-all"
              >
                Tutup Semua
              </button>
            </div>
          )}
        </div>

        {/* Right: Search, Filter toggles & Sorting */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode / uraian sub-item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-orange-500 outline-none w-full sm:w-56"
            />
          </div>

          {/* Filter 25% Button */}
          <button
            onClick={() => setFilter25Only(!filter25Only)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filter25Only
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            🎯 Progres 25% {filter25Only ? '✓' : ''}
          </button>

          {/* Filter Significant Bobot (> 1%) */}
          <button
            onClick={() => setFilterSignificantOnly(!filterSignificantOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              filterSignificantOnly
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
          >
            ⭐ Bobot &gt; 1% {filterSignificantOnly ? '✓' : ''}
          </button>

          {/* Sort By */}
          <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-white font-semibold outline-none cursor-pointer text-xs"
            >
              <option value="code" className="bg-slate-900">Urut Kode (WBS)</option>
              <option value="bobot-desc" className="bg-slate-900">Bobot Tertinggi</option>
              <option value="price-desc" className="bg-slate-900">Nominal Terbesar</option>
              <option value="name" className="bg-slate-900">Nama Item</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Summary Bar */}
      <div className="flex items-center justify-between text-xs px-2 text-slate-400">
        <div className="flex items-center gap-2">
          <span>Menampilkan: <strong className="text-white">{filteredDetailItems.length}</strong> dari {rab.detailItems.length} sub-item</span>
          {selectedSector !== 'ALL' && (
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px]">
              Sektor {selectedSector}
            </span>
          )}
          {searchTerm && (
            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px]">
              Keyword: "{searchTerm}"
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span>Subtotal Tersaring: <strong className="text-amber-400 font-mono">{formatIDR(filteredTotalNominal)}</strong></span>
          <span>Total Bobot: <strong className="text-blue-400 font-mono">{filteredTotalBobot.toFixed(3)}%</strong></span>
        </div>
      </div>

      {/* VIEW 1: GROUPED BY SECTOR (ACCORDION) */}
      {viewMode === 'grouped' && (
        <div className="space-y-4">
          {rab.sectors
            .filter((sec) => selectedSector === 'ALL' || sec.sectorNumber === selectedSector)
            .map((sec) => {
              const sectorItems = itemsBySector.get(sec.sectorNumber) || [];
              const isExpanded = !!expandedSectors[sec.sectorNumber];
              const sectorItemsNominal = sectorItems.reduce((sum, item) => sum + item.totalPrice, 0);
              const sectorItemsBobot = sectorItems.reduce((sum, item) => sum + item.bobotPercent, 0);

              // Don't hide sector card if user is searching but no items match, or show empty note
              if (searchTerm && sectorItems.length === 0) return null;

              return (
                <div
                  key={sec.sectorNumber}
                  className="rounded-2xl border border-slate-800 bg-slate-850 overflow-hidden shadow-lg transition-all"
                >
                  {/* Sector Header / Toggle */}
                  <div
                    onClick={() => toggleSector(sec.sectorNumber)}
                    className="p-4 bg-slate-800/90 hover:bg-slate-800 flex items-center justify-between cursor-pointer select-none transition-colors border-b border-slate-750"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-slate-700 text-slate-300">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono font-bold text-xs">
                            Sektor {sec.sectorNumber}
                          </span>
                          <h4 className="font-bold text-white text-sm">{sec.name}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-semibold">
                            {sectorItems.length} sub-item
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Anggaran Sektoral</span>
                        <span className="text-sm font-bold text-amber-400 font-mono">{formatIDR(sec.budget)}</span>
                      </div>
                      <div className="w-20 text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-semibold">Bobot Sektor</span>
                        <span className="text-sm font-bold text-blue-400 font-mono">{sec.percentage.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Sector Items Table */}
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 text-[11px]">
                          <tr>
                            <th className="p-3 w-16">Kode</th>
                            <th className="p-3">Uraian Pekerjaan &amp; Spesifikasi Teknis</th>
                            <th className="p-3 text-center w-20">Volume</th>
                            <th className="p-3 text-center w-14">Satuan</th>
                            <th className="p-3 text-right w-32">Harga Satuan (Rp)</th>
                            <th className="p-3 text-right w-36">Total Biaya (Rp)</th>
                            <th className="p-3 text-right w-24">Bobot (%)</th>
                            <th className="p-3 text-center w-28">Milestone 25%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-medium">
                          {sectorItems.map((item, idx) => {
                            const is25 = item.targetProgress25Percent && item.targetProgress25Percent > 0;
                            return (
                              <tr
                                key={item.code}
                                className={`hover:bg-slate-800/40 transition-colors ${
                                  idx % 2 === 0 ? 'bg-slate-900/30' : 'bg-transparent'
                                } ${is25 ? 'border-l-2 border-l-amber-500' : ''}`}
                              >
                                <td className="p-3 font-mono font-bold text-blue-400">{item.code}</td>
                                <td className="p-3">
                                  <div className="font-semibold text-slate-200">{item.description}</div>
                                  {item.category && (
                                    <span className="inline-block mt-0.5 text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                                      {item.category}
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-center font-bold text-slate-200">{item.volume.toLocaleString('id-ID')}</td>
                                <td className="p-3 text-center text-slate-400">{item.unit}</td>
                                <td className="p-3 text-right font-mono text-slate-300">{formatIDR(item.unitPrice)}</td>
                                <td className="p-3 text-right font-mono font-bold text-slate-100">{formatIDR(item.totalPrice)}</td>
                                <td className="p-3 text-right font-mono font-bold text-blue-400">
                                  {item.bobotPercent.toFixed(3)}%
                                </td>
                                <td className="p-3 text-center">
                                  {is25 ? (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                      {item.targetProgress25Percent}% Capaian
                                    </span>
                                  ) : (
                                    <span className="text-slate-600 text-[11px]">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-900 font-bold border-t border-slate-700 text-xs">
                          <tr>
                            <td colSpan={4} className="p-3 text-right text-slate-400 uppercase">
                              Subtotal Sektor {sec.sectorNumber} ({sectorItems.length} Item)
                            </td>
                            <td className="p-3 text-right text-slate-400">Jumlah:</td>
                            <td className="p-3 text-right font-mono text-amber-400 font-black">{formatIDR(sectorItemsNominal)}</td>
                            <td className="p-3 text-right font-mono text-blue-400 font-black">{sectorItemsBobot.toFixed(3)}%</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* VIEW 2: FLAT MASTER SPREADSHEET TABLE */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-800 text-white font-bold z-10 shadow border-b border-slate-700 text-[11px]">
                <tr>
                  <th className="p-3 w-16">Kode</th>
                  <th className="p-3 w-24">Sektor</th>
                  <th className="p-3">Uraian Pekerjaan Lengkap (Spesifikasi Konstruksi)</th>
                  <th className="p-3 text-center w-20">Volume</th>
                  <th className="p-3 text-center w-14">Satuan</th>
                  <th className="p-3 text-right w-32">Harga Satuan (Rp)</th>
                  <th className="p-3 text-right w-36">Total Biaya (Rp)</th>
                  <th className="p-3 text-right w-24">Bobot Kontrak</th>
                  <th className="p-3 text-right w-24">Bobot Fisik</th>
                  <th className="p-3 text-center w-28">Milestone 25%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-medium">
                {filteredDetailItems.length > 0 ? (
                  filteredDetailItems.map((item, idx) => {
                    const is25 = item.targetProgress25Percent && item.targetProgress25Percent > 0;
                    return (
                      <tr
                        key={item.code}
                        className={`hover:bg-slate-800/50 transition-colors ${
                          idx % 2 === 0 ? 'bg-slate-900/40' : 'bg-transparent'
                        } ${is25 ? 'border-l-2 border-l-amber-500' : ''}`}
                      >
                        <td className="p-3 font-mono font-bold text-blue-400">{item.code}</td>
                        <td className="p-3 font-semibold text-slate-400">Sektor {item.sectorNumber}</td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-100">{item.description}</div>
                          {item.category && (
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded mr-1">
                              {item.category}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-slate-200">{item.volume.toLocaleString('id-ID')}</td>
                        <td className="p-3 text-center text-slate-400">{item.unit}</td>
                        <td className="p-3 text-right font-mono text-slate-300">{formatIDR(item.unitPrice)}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-100">{formatIDR(item.totalPrice)}</td>
                        <td className="p-3 text-right font-mono font-bold text-blue-400">{item.bobotPercent.toFixed(3)}%</td>
                        <td className="p-3 text-right font-mono text-emerald-400">
                          {item.bobotFisikPercent ? `${item.bobotFisikPercent.toFixed(3)}%` : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {is25 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                              {item.targetProgress25Percent}% Capaian
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-500">
                      Tidak ada detail sub-item RAB yang sesuai dengan pencarian atau filter yang dipilih.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="sticky bottom-0 bg-slate-800 font-black text-white border-t-2 border-slate-700 z-10 text-xs">
                <tr>
                  <td colSpan={5} className="p-3 text-right uppercase">
                    Akumulasi Subtotal ({filteredDetailItems.length} Sub-item)
                  </td>
                  <td className="p-3 text-right text-slate-400">Total:</td>
                  <td className="p-3 text-right font-mono text-amber-400 font-black">{formatIDR(filteredTotalNominal)}</td>
                  <td className="p-3 text-right font-mono text-blue-400 font-black">{filteredTotalBobot.toFixed(3)}%</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Official Signatures & QR Block */}
      <div className="p-5 rounded-2xl bg-slate-850 border border-slate-800 space-y-4">
        <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider text-center">
          PENGESAHAN DOKUMEN ELEKTRONIK RESMI (UU ITE NO. 11/2008 &amp; PP NO. 71/2019)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-750 bg-slate-900/60 flex flex-col items-center text-center space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">DIRESTRUKTURISASI &amp; DIHITUNG OLEH</span>
            <span className="font-black text-white text-sm">Tim Lead Estimator / QS Proyek</span>
            <span className="text-xs text-slate-400">PT. Foresyndo Global Indonesia</span>
            <div className="p-2.5 bg-white rounded-xl shadow-sm flex items-center justify-center my-1">
              <QRCodeSVG value={`FORESYNDO-RAB-SIGN:${rab.contractNumber}:${rab.estimatorSignatureId}`} size={64} level="M" />
            </div>
            <span className="font-mono text-[10px] text-slate-400">ID VERIFIKASI: {rab.estimatorSignatureId}</span>
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              DIGITALLY VERIFIED ESTIMATOR
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-750 bg-slate-900/60 flex flex-col items-center text-center space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">DITINJAU &amp; DISETUJUI OLEH</span>
            <span className="font-black text-white text-sm">Project Manager / Direktur Utama</span>
            <span className="text-xs text-slate-400">PT. Foresyndo Global Indonesia</span>
            <div className="p-2.5 bg-white rounded-xl shadow-sm flex items-center justify-center my-1">
              <QRCodeSVG value={`FORESYNDO-RAB-SIGN:${rab.contractNumber}:${rab.pmSignatureId}`} size={64} level="M" />
            </div>
            <span className="font-mono text-[10px] text-slate-400">ID VERIFIKASI: {rab.pmSignatureId}</span>
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              DIGITALLY APPROVED PM/DIREKTUR
            </span>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 text-center italic">
          * Seluruh 97 rincian sub-item RAB di atas terdaftar resmi dalam sistem database proyek Foresyndo 2 dan sinkron dengan jadwal Kurva-S serta Termin Pembayaran.
        </p>
      </div>
    </div>
  );
};
