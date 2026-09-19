import React, { useState, useRef, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ProjectInfo } from '../../types';
import { formatIDR } from '../../utils/calculations';
import {
  X,
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Building2,
  MapPin,
  Calendar,
  Smartphone,
  CheckCircle2,
  HardHat,
  FileText,
  BadgePercent,
  Sliders,
  Eye,
} from 'lucide-react';

interface ProjectQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInfo;
}

export const ProjectQRCodeModal: React.FC<ProjectQRCodeModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [activeTab, setActiveTab] = useState<'qrcode' | 'metadata' | 'scanner_preview'>('qrcode');
  const [payloadMode, setPayloadMode] = useState<'url' | 'json'>('url');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate target dashboard URL
  const dashboardUrl = useMemo(() => {
    if (typeof window === 'undefined') return 'https://foresyndo.co.id';
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams();
    searchParams.set('project', project.contractNumber || 'PROJ-FORESYNDO-01');
    searchParams.set('view', 'dashboard');
    searchParams.set('ref', 'qr_field_inspection');
    searchParams.set('ts', Date.now().toString());
    return `${origin}${pathname}?${searchParams.toString()}`;
  }, [project.contractNumber]);

  // Verification Hash ID
  const verificationHash = useMemo(() => {
    const raw = `${project.contractNumber}-${project.name}-${project.startDate}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `FGI-VRF-${Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')}`;
  }, [project.contractNumber, project.name, project.startDate]);

  // Structured Metadata Payload
  const metadataPayload = useMemo(() => {
    return {
      appName: 'PT FORESYNDO GLOBAL INDONESIA - SISTEM KONTRAKTOR & INSPEKSI',
      verifikasi: 'KARTU_VERIFIKASI_PROYEK_RESMI',
      hashID: verificationHash,
      proyek: {
        nama: project.name,
        noKontrak: project.contractNumber,
        pemilik: project.owner,
        kontraktor: project.contractorProfile?.companyName || project.contractor,
        lokasi: project.location,
        nilaiKontrak: formatIDR(project.contractValue),
        tanggalMulai: project.startDate,
        targetSelesai: project.targetEndDate,
        status: project.status,
      },
      timLapangan: {
        siteManager: project.siteManager,
        qcEngineer: project.qcEngineer,
        direktur: project.director,
      },
      linkDashboardLangsung: dashboardUrl,
      waktuVerifikasiSistem: new Date().toISOString(),
    };
  }, [project, verificationHash, dashboardUrl]);

  // Final QR string based on payloadMode
  const qrValue = useMemo(() => {
    if (payloadMode === 'url') {
      return dashboardUrl;
    }
    return JSON.stringify(metadataPayload, null, 2);
  }, [payloadMode, dashboardUrl, metadataPayload]);

  if (!isOpen) return null;

  // Copy Link Handler
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(dashboardUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  // Copy JSON Handler
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(metadataPayload, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      // fallback
    }
  };

  // Download QR as PNG
  const handleDownloadPNG = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Scale up for crisp printable quality
    const size = 1024;
    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      if (!ctx) return;
      // Background white
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);
      // Draw QR image
      ctx.drawImage(img, 0, 0, size, size);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-Verifikasi-${project.contractNumber || 'Proyek'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  // Print Field Badge / Sticker
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-md text-sky-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  QR Code Verifikasi Proyek
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Siap Lapangan
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                Akses cepat inspeksi lapangan &amp; verifikasi keabsahan data proyek
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors relative z-10 cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 sm:px-6 gap-2">
          <button
            onClick={() => setActiveTab('qrcode')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'qrcode'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" /> QR Code &amp; Aksi
          </button>
          <button
            onClick={() => setActiveTab('metadata')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'metadata'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Detail Metadata Proyek
          </button>
          <button
            onClick={() => setActiveTab('scanner_preview')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'scanner_preview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" /> Pratinjau Hasil Scan
          </button>
        </div>

        {/* Tab 1: QR Code & Generator Controls */}
        {activeTab === 'qrcode' && (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Format Mode Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Target Konten QR:
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setPayloadMode('url')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    payloadMode === 'url'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Tautan Dashboard Langsung
                </button>
                <button
                  type="button"
                  onClick={() => setPayloadMode('json')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    payloadMode === 'json'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Payload Metadata Lengkap
                </button>
              </div>
            </div>

            {/* QR Code Presentation Box */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: The QR Code Card */}
              <div className="md:col-span-5 flex flex-col items-center justify-center">
                <div
                  ref={qrRef}
                  className="p-4 rounded-2xl bg-white border-2 border-indigo-100 dark:border-indigo-900/50 shadow-lg flex flex-col items-center justify-center relative group"
                >
                  <QRCodeSVG
                    value={qrValue}
                    size={190}
                    level="H"
                    includeMargin={true}
                    imageSettings={
                      includeLogo
                        ? {
                            src: project.logoUrl || '/assets/logo.png',
                            x: undefined,
                            y: undefined,
                            height: 38,
                            width: 38,
                            excavate: true,
                          }
                        : undefined
                    }
                  />

                  {/* Stamp below QR */}
                  <div className="mt-2 text-center">
                    <span className="text-[10px] font-mono font-bold text-slate-700 tracking-wider block">
                      {verificationHash}
                    </span>
                    <span className="text-[9px] font-semibold text-emerald-600 block uppercase">
                      ✓ Valid &bull; Terverifikasi Lapangan
                    </span>
                  </div>
                </div>

                {/* Option to toggle logo in center */}
                <label className="flex items-center gap-2 mt-3 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLogo}
                    onChange={(e) => setIncludeLogo(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Sertakan Logo Perusahaan di Tengah QR</span>
                </label>
              </div>

              {/* Right Column: Project Context & Action Buttons */}
              <div className="md:col-span-7 space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">
                      Identitas Proyek Terverifikasi:
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold font-mono">
                      {project.contractNumber}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                    {project.name}
                  </h4>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span><strong>Owner:</strong> {project.owner}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <HardHat className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span><strong>Kontraktor:</strong> {project.contractorProfile?.companyName || project.contractor}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span className="truncate"><strong>Lokasi:</strong> {project.location}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Link Input Box */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Tautan Langsung Aplikasi:</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Dapat dipindai dari kamera HP/Tablet
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={dashboardUrl}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 truncate outline-none select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                        copiedLink
                          ? 'bg-emerald-600 text-white'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      }`}
                      title="Salin Tautan ke Clipboard"
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={handleDownloadPNG}
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Unduh Gambar QR (PNG)
                  </button>

                  <button
                    onClick={handlePrint}
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Cetak Kartu Lapangan
                  </button>
                </div>
              </div>
            </div>

            {/* Field Usage Instructions */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <Smartphone className="w-3.5 h-3.5" /> Panduan Penggunaan di Lapangan:
              </span>
              <p className="text-[11px] leading-relaxed">
                Tempelkan QR Code ini pada papan nama proyek (site board), pintu direksi keet, atau lembar checklist inspeksi. Pengawas, konsultan, dan tim owner dapat langsung memindai dengan kamera smartphone untuk memverifikasi keaslian kontrak dan mengakses formulir checklist BAST secara instan tanpa perlu login berulang.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Full Project Metadata */}
        {activeTab === 'metadata' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Data Lengkap Payload Verifikasi Lapangan:
              </span>
              <button
                onClick={handleCopyJson}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  copiedJson
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJson ? 'JSON Tersalin!' : 'Salin Format JSON'}</span>
              </button>
            </div>

            {/* Structured Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                <div className="grid grid-cols-3 p-2.5 bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Kode Verifikasi</span>
                  <span className="col-span-2 font-mono font-black text-indigo-600 dark:text-indigo-400">
                    {verificationHash}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Nama Proyek</span>
                  <span className="col-span-2 font-bold text-slate-900 dark:text-white">
                    {project.name}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-2.5 bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Nomor Kontrak</span>
                  <span className="col-span-2 font-mono text-slate-800 dark:text-slate-200">
                    {project.contractNumber}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Pemberi Tugas (Owner)</span>
                  <span className="col-span-2 text-slate-800 dark:text-slate-200 font-semibold">
                    {project.owner}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-2.5 bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Kontraktor Pelaksana</span>
                  <span className="col-span-2 text-slate-800 dark:text-slate-200 font-semibold">
                    {project.contractorProfile?.companyName || project.contractor}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Lokasi Pekerjaan</span>
                  <span className="col-span-2 text-slate-800 dark:text-slate-200">
                    {project.location}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-2.5 bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Nilai Kontrak</span>
                  <span className="col-span-2 font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatIDR(project.contractValue)}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Masa Kontrak</span>
                  <span className="col-span-2 text-slate-800 dark:text-slate-200">
                    {project.startDate} s/d {project.targetEndDate}
                  </span>
                </div>
                <div className="grid grid-cols-3 p-2.5 bg-slate-50 dark:bg-slate-800/50">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Penanggung Jawab</span>
                  <span className="col-span-2 text-slate-800 dark:text-slate-200">
                    Site Manager: <strong>{project.siteManager}</strong> &bull; QC: <strong>{project.qcEngineer}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-3 p-2.5">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Status Resmi</span>
                  <span className="col-span-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                      {project.status.toUpperCase()}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* JSON Code Box */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                Pratinjau JSON Payload Mentah:
              </span>
              <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-48 border border-slate-800">
                {JSON.stringify(metadataPayload, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Field Inspection Simulator Preview */}
        {activeTab === 'scanner_preview' && (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="text-center space-y-1 max-w-md mx-auto">
              <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold inline-flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> Tampilan di Ponsel Pengawas Lapangan
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Simulasi Hasil Pindai Kamera Petugas di Lokasi Site
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Ketika pengawas lapangan atau tamu resmi memindai QR code, halaman verifikasi instan berikut akan terbuka langsung di browser gawai mereka:
              </p>
            </div>

            {/* Simulated Mobile Device Card */}
            <div className="max-w-sm mx-auto bg-slate-50 dark:bg-slate-800/80 rounded-3xl border-2 border-slate-300 dark:border-slate-700 shadow-xl p-4 space-y-3.5">
              {/* Device Header Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 text-[10px] text-slate-400 font-mono">
                <span>09:41</span>
                <span>Foresyndo Security Scanner</span>
                <span>100%</span>
              </div>

              {/* Status Banner */}
              <div className="p-3 rounded-2xl bg-emerald-500 text-slate-950 space-y-1 text-center shadow-sm">
                <div className="w-8 h-8 rounded-full bg-white/30 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-slate-950" />
                </div>
                <h5 className="text-xs font-black uppercase tracking-wider">
                  PROYEK RESMI TERVERIFIKASI
                </h5>
                <p className="text-[10px] font-semibold text-slate-900">
                  PT FORESYNDO GLOBAL INDONESIA
                </p>
              </div>

              {/* Verification Info */}
              <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Nama Pekerjaan:</span>
                  <strong className="text-slate-900 dark:text-white leading-tight block">
                    {project.name}
                  </strong>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <div>
                    <span className="text-[9px] text-slate-400 block">No. Kontrak:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
                      {project.contractNumber}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Status Lapangan:</span>
                    <span className="font-bold text-emerald-600 block">
                      {project.status}
                    </span>
                  </div>
                </div>
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="text-[9px] text-slate-400 block">Pelaksana Lapangan:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {project.contractorProfile?.companyName || project.contractor}
                  </span>
                </div>
              </div>

              {/* Launch Button in Simulator */}
              <a
                href={dashboardUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <ExternalLink className="w-4 h-4" /> Buka Dashboard Inspeksi Langsung
              </a>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate hidden sm:inline">
            Ref: {verificationHash} &bull; Tingkat Keamanan: Level H (30%)
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
