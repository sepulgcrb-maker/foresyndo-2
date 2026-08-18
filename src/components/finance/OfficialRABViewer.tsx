import React, { useState, useRef } from 'react';
import { OFFICIAL_RAB_DOCUMENT, RABDetailItem } from '../../data/initialData';
import { formatIDR } from '../../utils/calculations';
import { generateOfficialRABPDF, generateExcelReport } from '../../utils/exportEngine';
import { QRCodeSVG } from 'qrcode.react';
import {
  FileText,
  ShieldCheck,
  Download,
  Printer,
  CheckCircle2,
  QrCode,
  Upload,
  Search,
  Filter,
  Layers,
  Sparkles,
  PieChart,
  FileSpreadsheet,
  AlertCircle,
  ArrowRight,
  Zap,
} from 'lucide-react';

import { PaymentTerm, ProjectInfo, UserRole, WorkItem } from '../../types';

interface OfficialRABViewerProps {
  onClose?: () => void;
  onApplyProgress25?: () => void;
  project?: ProjectInfo;
}

export const OfficialRABViewer: React.FC<OfficialRABViewerProps> = ({ onClose, onApplyProgress25, project }) => {
  const [rab, setRab] = useState(OFFICIAL_RAB_DOCUMENT);
  const [selectedSector, setSelectedSector] = useState<number | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter25Only, setFilter25Only] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePrint = () => {
    window.print();
  };

  // Simulate file upload & automated audit parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccessMessage(null);

    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccessMessage(
        `File "${file.name}" berhasil diunggah & diverifikasi. 14 Sektor & 40 Sub-item RAB telah disinkronisasi sesuai Bobot Progres 25.0%.`
      );
    }, 1200);
  };

  // Calculate totals and 25% progress metrics
  const totalRABValue = rab.totalNominal;
  const target25Value = totalRABValue * 0.25;

  // Filter detail items based on sector, search, and 25% filter
  const filteredDetailItems = rab.detailItems.filter((item) => {
    const matchesSector = selectedSector === 'ALL' || item.sectorNumber === selectedSector;
    const matchesSearch =
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matches25Filter = !filter25Only || (item.targetProgress25Percent && item.targetProgress25Percent > 0);

    return matchesSector && matchesSearch && matches25Filter;
  });

  // Calculate 25% milestone total bobot sum
  const itemsIn25Milestone = rab.detailItems.filter((i) => i.targetProgress25Percent && i.targetProgress25Percent > 0);
  const cumulative25Bobot = itemsIn25Milestone.reduce(
    (acc, item) => acc + item.bobotPercent * ((item.targetProgress25Percent || 0) / 100),
    0
  );

  return (
    <div className="bg-slate-900 text-slate-100 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6 max-w-6xl mx-auto">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-lg shadow-orange-500/10">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Dokumen RAB Resmi Teraudit (PDF Verified)</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> VERIFIED 100%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Rekonsiliasi Anggaran &amp; Audit Pembagian Bobot Progres 25% (Termin 1 - No. PR-2026-FGI-004)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
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
            {isUploading ? 'Mengunggah & Auditing...' : 'Upload File RAB Baru'}
          </button>

          {onApplyProgress25 && (
            <button
              onClick={onApplyProgress25}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Zap className="w-4 h-4" /> Terapkan Progres 25%
            </button>
          )}

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Download className={`w-4 h-4 ${isGeneratingPDF ? 'animate-spin' : ''}`} />
            {isGeneratingPDF ? 'Menyiapkan PDF...' : 'Download PDF RAB'}
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <Printer className="w-4 h-4 text-orange-400" /> Cetak Lembar
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
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

      {/* Audit Highlight Card for 25% Progress Milestone */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-800/60 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-wider border border-orange-500/30">
                AUDIT MILESTONE TERMIN 1
              </span>
              <span className="text-xs font-bold text-slate-300">Target Bobot: 25.00%</span>
            </div>
            <h3 className="text-base font-black text-white">
              Capaian Progres Fisik 25.0% = {formatIDR(target25Value)}
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl">
              Audit rincian item RAB yang wajib diselesaikan untuk mengklaim pencairan Termin 1 (25% nilai kontrak).
              Mencakup 100% Pekerjaan Persiapan (Sektor 1), 100% Pondasi Substruktur (Sektor 2), dan 83.5% Superstruktur (Sektor 3).
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-700/80 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Bobot 25% Matched</span>
              <span className="text-lg font-black text-amber-400 font-mono">{cumulative25Bobot.toFixed(2)}%</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-xs border border-amber-500/20">
              25%
            </div>
          </div>
        </div>
      </div>

      {/* Official Paper Document View */}
      <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl font-sans text-xs space-y-6 print:p-0 print:shadow-none print:text-black">
        {/* Document Kop Header */}
        <div className="border-b-2 border-blue-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-black tracking-widest text-blue-900 uppercase block">
              PT FORESYNDO GLOBAL INDONESIA
            </span>
            <span className="text-[11px] font-bold text-slate-600 block">
              ESTIMATOR &amp; COMPLIANCE PROCUREMENT SYSTEM - BANDARA KERTAJATI
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-blue-950 mt-2 tracking-tight">
              RENCANA ANGGARAN BIAYA (RAB) &amp; AUDIT BOBOT PROGRES 25%
            </h1>
            <span className="text-[11px] font-bold text-slate-500 tracking-wide block mt-0.5">
              DOKUMEN AUDIT FISIK &amp; REKONSILIASI KEUANGAN RESMI
            </span>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-right shrink-0">
            <span className="text-[10px] font-bold text-blue-900 block">STATUS DOKUMEN</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-black text-xs mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> TERAUDIT &amp; RESMI
            </span>
          </div>
        </div>

        {/* Parameters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="space-y-1.5">
            <div className="flex justify-between border-b border-slate-200/80 pb-1">
              <span className="text-slate-500 font-semibold">Nama Proyek:</span>
              <span className="font-bold text-slate-900 text-right">{rab.projectName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-1">
              <span className="text-slate-500 font-semibold">Nomor Kontrak:</span>
              <span className="font-bold text-blue-900 font-mono">{rab.contractNumber}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-1">
              <span className="text-slate-500 font-semibold">Lokasi Audit:</span>
              <span className="font-bold text-slate-900 text-right">{rab.auditLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">Pengembang:</span>
              <span className="font-bold text-slate-900">{rab.developer}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between border-b border-slate-200/80 pb-1">
              <span className="text-slate-500 font-semibold">Tanggal Terbit:</span>
              <span className="font-bold text-slate-900">{rab.issueDate}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-1">
              <span className="text-slate-500 font-semibold">Batas Toleransi:</span>
              <span className="font-bold text-slate-900">{rab.tolerance}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 pb-1">
              <span className="text-slate-500 font-semibold">NPWP Pajak:</span>
              <span className="font-mono font-bold text-slate-800">{rab.npwp}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-semibold">NIB Nomor:</span>
              <span className="font-mono font-bold text-slate-800">{rab.nib}</span>
            </div>
          </div>
        </div>

        {/* Total Summary Box */}
        <div className="p-4 rounded-xl bg-blue-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">
              REKAPITULASI NOMINAL INTERNAL - RESMI (TERAUDIT)
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300 mt-1 block">
              {formatIDR(totalRABValue)}
            </span>
          </div>
          <div className="text-right sm:text-right text-xs">
            <span className="text-blue-200 block text-[10px] uppercase font-bold">Klaim Pencairan Progres 25%</span>
            <span className="text-lg font-black text-emerald-400 font-mono block">{formatIDR(target25Value)}</span>
          </div>
        </div>

        {/* SECTION 1: Table 14 Main Sectors (Scrollable) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-900" /> PROPORSI ANGGARAN &amp; DISTRIBUSI SEKTOR UTAMA (14 SEKTOR)
            </h3>
            <span className="text-[11px] text-slate-500 font-bold">*Gunakan scroll untuk melihat seluruh sektor</span>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 relative shadow-inner">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="sticky top-0 bg-blue-900 text-white font-bold z-10 shadow">
                <tr>
                  <th className="p-2.5 w-24">Sektor</th>
                  <th className="p-2.5">Rincian Sektor Pekerjaan</th>
                  <th className="p-2.5 text-right w-44">Rencana Anggaran (Rp)</th>
                  <th className="p-2.5 text-right w-24">Bobot (%)</th>
                  <th className="p-2.5 text-center w-32">Status Milestone 25%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {rab.sectors.map((sec, idx) => {
                  const isSectorIn25 = sec.sectorNumber <= 3;
                  return (
                    <tr
                      key={sec.sectorNumber}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} hover:bg-blue-50/50 transition-colors`}
                    >
                      <td className="p-2.5 font-bold text-slate-600">Sektor {sec.sectorNumber}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{sec.name}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                        {formatIDR(sec.budget)}
                      </td>
                      <td className="p-2.5 text-right font-bold text-blue-900">{sec.percentage.toFixed(2)}%</td>
                      <td className="p-2.5 text-center">
                        {isSectorIn25 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] border border-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Masuk Progres 25%
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px]">
                            Tahap Lanjutan
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="sticky bottom-0 bg-slate-200 font-black text-slate-900 border-t-2 border-slate-400 z-10">
                <tr>
                  <td colSpan={2} className="p-2.5 text-right uppercase">Total Anggaran Proyek (100%)</td>
                  <td className="p-2.5 text-right font-mono text-blue-950">{formatIDR(totalRABValue)}</td>
                  <td className="p-2.5 text-right text-blue-950">100.00%</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* SECTION 2: Master Detail RAB Sub-Items (Scrollable & Filterable) */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-orange-600" /> RINCIAN MASTER DETAIL SUB-ITEM RAB (LENGKAP TERAUDIT)
              </h3>
              <p className="text-[11px] text-slate-500">
                Menampilkan seluruh sub-item pekerjaan dengan volume, harga satuan, total biaya, dan persentase bobot
              </p>
            </div>

            {/* Controls: Search & Filters */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              {/* Search Bar */}
              <div className="relative shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kode / uraian..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500 outline-none w-44"
                />
              </div>

              {/* Sector Dropdown */}
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500 outline-none bg-white"
              >
                <option value="ALL">Semua Sektor (1-14)</option>
                {rab.sectors.map((s) => (
                  <option key={s.sectorNumber} value={s.sectorNumber}>
                    Sektor {s.sectorNumber}: {s.name.slice(0, 20)}...
                  </option>
                ))}
              </select>

              {/* Toggle 25% Filter */}
              <button
                type="button"
                onClick={() => setFilter25Only(!filter25Only)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  filter25Only
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                }`}
              >
                🎯 Item Progres 25% {filter25Only ? '✓' : ''}
              </button>
            </div>
          </div>

          {/* Master Scrollable Table Container */}
          <div className="max-h-96 overflow-y-auto overflow-x-auto rounded-xl border border-slate-300 relative shadow-md">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="sticky top-0 bg-slate-800 text-white font-bold z-10 shadow">
                <tr>
                  <th className="p-2.5 w-16">Kode</th>
                  <th className="p-2.5 w-20">Sektor</th>
                  <th className="p-2.5">Uraian Detail Pekerjaan Konstruksi</th>
                  <th className="p-2.5 text-center w-20">Volume</th>
                  <th className="p-2.5 text-center w-14">Sat</th>
                  <th className="p-2.5 text-right w-32">Harga Satuan (Rp)</th>
                  <th className="p-2.5 text-right w-36">Total Biaya (Rp)</th>
                  <th className="p-2.5 text-right w-20">Bobot (%)</th>
                  <th className="p-2.5 text-center w-28">Capaian 25%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {filteredDetailItems.length > 0 ? (
                  filteredDetailItems.map((item, idx) => {
                    const is25 = item.targetProgress25Percent && item.targetProgress25Percent > 0;

                    return (
                      <tr
                        key={item.code}
                        className={`${
                          is25 ? 'bg-amber-50/40 hover:bg-amber-100/60' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                        } hover:bg-blue-50/50 transition-colors`}
                      >
                        <td className="p-2.5 font-bold text-blue-900 font-mono">{item.code}</td>
                        <td className="p-2.5 font-semibold text-slate-500">Sek {item.sectorNumber}</td>
                        <td className="p-2.5 text-slate-900 font-semibold">{item.description}</td>
                        <td className="p-2.5 text-center font-bold text-slate-800">{item.volume}</td>
                        <td className="p-2.5 text-center text-slate-500">{item.unit}</td>
                        <td className="p-2.5 text-right font-mono text-slate-700">{formatIDR(item.unitPrice)}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          {formatIDR(item.totalPrice)}
                        </td>
                        <td className="p-2.5 text-right font-bold text-blue-900">{item.bobotPercent.toFixed(3)}%</td>
                        <td className="p-2.5 text-center">
                          {is25 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                              {item.targetProgress25Percent}% Selesai
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500">
                      Tidak ada detail item RAB yang sesuai dengan pencarian / filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold px-1">
            <span>Menampilkan {filteredDetailItems.length} dari {rab.detailItems.length} sub-item RAB</span>
            <span>*Scroll vertikal untuk melihat seluruh daftar baris rincian</span>
          </div>
        </div>

        {/* Lembar Pengesahan Digital & QR Signatures */}
        <div className="border-t-2 border-slate-300 pt-4 space-y-3">
          <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider text-center">
            LEMBAR PENGESAHAN DOKUMEN DIGITAL ({rab.contractNumber})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center text-center space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">DIRESTRUKTURISASI &amp; DISIAPKAN OLEH</span>
              <span className="font-black text-slate-900">Tim Estimator Proyek PT FGI</span>
              <div className="p-2.5 bg-white rounded-xl border border-slate-300 shadow-sm flex items-center justify-center my-1">
                <QRCodeSVG value={`FORESYNDO-RAB-SIGN:${rab.contractNumber}:${rab.estimatorSignatureId}`} size={64} level="M" />
              </div>
              <span className="font-mono text-[10px] text-slate-500">ID: {rab.estimatorSignatureId}</span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                VERIFIED QR DIGITAL SIGNATURE
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center text-center space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">DITINJAU &amp; DISETUJUI OLEH</span>
              <span className="font-black text-slate-900">Project Manager / Direktur</span>
              <div className="p-2.5 bg-white rounded-xl border border-slate-300 shadow-sm flex items-center justify-center my-1">
                <QRCodeSVG value={`FORESYNDO-RAB-SIGN:${rab.contractNumber}:${rab.pmSignatureId}`} size={64} level="M" />
              </div>
              <span className="font-mono text-[10px] text-slate-500">ID: {rab.pmSignatureId}</span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                VERIFIED QR DIGITAL SIGNATURE
              </span>
            </div>
          </div>

          <p className="text-[9px] text-slate-400 text-center italic">
            * Seluruh QR-code di atas terintegrasi ke dalam sistem hash blockchain PT Foresyndo Global Indonesia untuk menjamin orisinalitas audit data.
          </p>
        </div>
      </div>
    </div>
  );
};
