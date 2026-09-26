import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Upload,
} from 'lucide-react';

interface ProjectQRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInfo;
}

/**
 * Utility to convert an image URL or path to a Base64 data URL.
 * Ensures that downloaded canvas and SVGs have self-contained images.
 */
async function urlToBase64(url: string): Promise<string> {
  if (url.startsWith('data:image/')) return url;
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 300;
        canvas.height = img.naturalHeight || 300;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
          return;
        }
      } catch {
        // Fallback on cross-origin restriction
      }
      resolve(url);
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}

export const ProjectQRCodeModal: React.FC<ProjectQRCodeModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [activeTab, setActiveTab] = useState<'qrcode' | 'metadata' | 'scanner_preview'>('qrcode');
  const [payloadMode, setPayloadMode] = useState<'url' | 'json'>('url');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [logoSource, setLogoSource] = useState<'owner' | 'contractor' | 'custom'>('owner');
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);
  const [cachedBase64Logo, setCachedBase64Logo] = useState<string>('/assets/logo.png');
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  // Active logo URL calculation
  const activeLogoUrl = useMemo(() => {
    if (logoSource === 'custom' && customLogoUrl) return customLogoUrl;
    if (logoSource === 'contractor') {
      return project.contractorProfile?.logoUrl || project.logoUrl || '/assets/logo.png';
    }
    return project.logoUrl || '/assets/logo.png';
  }, [logoSource, customLogoUrl, project.contractorProfile?.logoUrl, project.logoUrl]);

  // Convert logo to Base64 whenever activeLogoUrl changes
  useEffect(() => {
    let isMounted = true;
    urlToBase64(activeLogoUrl).then((b64) => {
      if (isMounted) setCachedBase64Logo(b64);
    });
    return () => {
      isMounted = false;
    };
  }, [activeLogoUrl]);

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

  // Handle custom logo file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setCustomLogoUrl(dataUrl);
        setLogoSource('custom');
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * Helper to load an image element reliably
   */
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  /**
   * Download QR as PNG with the Company Logo explicitly drawn in the center!
   * Guarantees that the logo is present, sharp, and properly centered in the downloaded file.
   */
  const handleDownloadPNG = async () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    try {
      setIsDownloading(true);

      // High resolution 1200x1200px for crisp site printouts
      const size = 1200;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Fill pure white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, size, size);

      // 1. Draw the QR code SVG matrix onto the canvas
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgDataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      const qrImg = await loadImage(svgDataUri);
      ctx.drawImage(qrImg, 0, 0, size, size);

      // 2. If includeLogo is active, draw the company logo in the center
      if (includeLogo) {
        try {
          const logoToDraw = cachedBase64Logo || activeLogoUrl;
          const logoImg = await loadImage(logoToDraw);

          const centerX = size / 2;
          const centerY = size / 2;

          // Logo badge size (proportional to excavated area ~23% of QR size)
          const badgeSize = Math.round(size * 0.23); // 276px
          const innerLogoSize = Math.round(badgeSize * 0.82); // 226px
          const badgeRadius = Math.round(badgeSize * 0.24); // 66px smooth rounded rect

          ctx.save();
          // Draw white pill/rounded-box background with subtle drop shadow
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
          ctx.shadowBlur = 18;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 6;

          ctx.beginPath();
          ctx.roundRect(
            centerX - badgeSize / 2,
            centerY - badgeSize / 2,
            badgeSize,
            badgeSize,
            badgeRadius
          );
          ctx.fill();

          // Draw crisp outer border
          ctx.shadowColor = 'transparent';
          ctx.lineWidth = 6;
          ctx.strokeStyle = '#E2E8F0';
          ctx.stroke();

          // Calculate aspect ratio so the company logo is not distorted
          const aspect = (logoImg.naturalWidth || 1) / (logoImg.naturalHeight || 1);
          let drawW = innerLogoSize;
          let drawH = innerLogoSize;
          if (aspect > 1) {
            drawH = Math.round(innerLogoSize / aspect);
          } else {
            drawW = Math.round(innerLogoSize * aspect);
          }

          // Clip and draw the logo image cleanly
          ctx.beginPath();
          ctx.roundRect(centerX - drawW / 2, centerY - drawH / 2, drawW, drawH, 12);
          ctx.clip();
          ctx.drawImage(logoImg, centerX - drawW / 2, centerY - drawH / 2, drawW, drawH);
          ctx.restore();
        } catch (logoErr) {
          console.warn('Gagal memuat logo ke dalam canvas QR:', logoErr);
        }
      }

      // 3. Export and trigger instant file download
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      const companyTag = logoSource === 'contractor' ? 'Kontraktor' : 'Owner';
      downloadLink.download = `QR-Proyek-${includeLogo ? `Logo-${companyTag}-` : ''}${project.contractNumber || 'Foresyndo'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    } catch (err) {
      console.warn('QR PNG download notice:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  /**
   * Download a complete Field Badge Card (1200x1600px) with headers, QR, and signatures
   */
  const handleDownloadCardPNG = async () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    try {
      setIsDownloading(true);
      const cardW = 1200;
      const cardH = 1600;
      const canvas = document.createElement('canvas');
      canvas.width = cardW;
      canvas.height = cardH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clean background with header banner
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, cardW, cardH);

      // Header gradient banner
      const grad = ctx.createLinearGradient(0, 0, cardW, 0);
      grad.addColorStop(0, '#0F172A');
      grad.addColorStop(0.5, '#1E3A8A');
      grad.addColorStop(1, '#0284C7');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cardW, 200);

      // Header Texts
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KARTU VERIFIKASI & AKSES INSPEKSI PROYEK', cardW / 2, 75);

      ctx.fillStyle = '#BAE6FD';
      ctx.font = '22px sans-serif';
      ctx.fillText('SISTEM MONITORING PEMBANGUNAN GEDUNG FORESYNDO 2', cardW / 2, 120);

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`NO. KONTRAK: ${project.contractNumber || '-'}`, cardW / 2, 160);

      // White Card Container for QR
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 12;
      ctx.beginPath();
      ctx.roundRect(100, 240, 1000, 1000, 36);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#E2E8F0';
      ctx.stroke();

      // Project Title inside card
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(project.name, cardW / 2, 310);

      ctx.fillStyle = '#64748B';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Owner: ${project.owner}  •  Kontraktor: ${project.contractorProfile?.companyName || project.contractor}`, cardW / 2, 350);

      // Draw QR in center of the card
      const qrSize = 650;
      const qrX = (cardW - qrSize) / 2;
      const qrY = 390;

      const svgData = new XMLSerializer().serializeToString(svg);
      const svgDataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      const qrImg = await loadImage(svgDataUri);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Draw Center Logo on QR
      if (includeLogo) {
        const logoToDraw = cachedBase64Logo || activeLogoUrl;
        const logoImg = await loadImage(logoToDraw);

        const qrCenterX = cardW / 2;
        const qrCenterY = qrY + qrSize / 2;
        const badgeSize = Math.round(qrSize * 0.23);
        const innerLogoSize = Math.round(badgeSize * 0.82);

        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 4;
        ctx.beginPath();
        ctx.roundRect(qrCenterX - badgeSize / 2, qrCenterY - badgeSize / 2, badgeSize, badgeSize, 20);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#E2E8F0';
        ctx.stroke();

        const aspect = (logoImg.naturalWidth || 1) / (logoImg.naturalHeight || 1);
        let drawW = innerLogoSize;
        let drawH = innerLogoSize;
        if (aspect > 1) {
          drawH = Math.round(innerLogoSize / aspect);
        } else {
          drawW = Math.round(innerLogoSize * aspect);
        }

        ctx.beginPath();
        ctx.roundRect(qrCenterX - drawW / 2, qrCenterY - drawH / 2, drawW, drawH, 10);
        ctx.clip();
        ctx.drawImage(logoImg, qrCenterX - drawW / 2, qrCenterY - drawH / 2, drawW, drawH);
        ctx.restore();
      }

      // Hash code stamp
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(verificationHash, cardW / 2, 1090);

      ctx.fillStyle = '#059669';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('✓ TERVERIFIKASI RESMI TRIPARTIT (OWNER • MK • KONTRAKTOR)', cardW / 2, 1125);

      // Meta Table at Bottom
      ctx.fillStyle = '#F1F5F9';
      ctx.beginPath();
      ctx.roundRect(100, 1270, 1000, 240, 24);
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Lokasi Proyek: ${project.location}`, 140, 1320);
      ctx.fillText(`Site Manager: ${project.siteManager}`, 140, 1370);
      ctx.fillText(`QC Engineer: ${project.qcEngineer}`, 140, 1420);

      ctx.textAlign = 'right';
      ctx.fillText(`Status: ${project.status}`, 1060, 1320);
      ctx.fillText(`Nilai Kontrak: ${formatIDR(project.contractValue)}`, 1060, 1370);
      ctx.fillText(`Jangka Waktu: ${project.startDate} s/d ${project.targetEndDate}`, 1060, 1420);

      // Download Card
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `Kartu-Inspeksi-QR-${project.contractNumber || 'Proyek'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    } catch (err) {
      console.warn('Card PNG download notice:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Download SVG
  const handleDownloadSVG = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.download = `QR-${project.contractNumber || 'Proyek'}.svg`;
    downloadLink.href = url;
    downloadLink.click();
    URL.revokeObjectURL(url);
  };

  // Print Field Badge / Sticker
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
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
                  <ShieldCheck className="w-3 h-3" /> Logo di Tengah Aktif
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                Akses cepat inspeksi lapangan &amp; verifikasi keabsahan data dengan logo perusahaan
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
            {/* Format Mode & Logo Selector Bar */}
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Left Column: The QR Code Card */}
              <div className="md:col-span-5 flex flex-col items-center justify-center">
                <div
                  ref={qrRef}
                  className="p-4 rounded-3xl bg-white border-2 border-indigo-100 dark:border-indigo-900/50 shadow-xl flex flex-col items-center justify-center relative group"
                >
                  {/* Container for QR with center logo guarantee */}
                  <div className="relative flex items-center justify-center">
                    <QRCodeSVG
                      value={qrValue}
                      size={210}
                      level="H"
                      includeMargin={true}
                      imageSettings={
                        includeLogo
                          ? {
                              src: cachedBase64Logo || activeLogoUrl,
                              x: undefined,
                              y: undefined,
                              height: 46,
                              width: 46,
                              excavate: true,
                            }
                          : undefined
                      }
                    />

                    {/* Visual Center Overlay Badge (Ensures preview always looks perfect on screen) */}
                    {includeLogo && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-xl bg-white shadow-md border border-slate-200 flex items-center justify-center p-1 pointer-events-none z-10 overflow-hidden">
                        <img
                          src={cachedBase64Logo || activeLogoUrl}
                          alt="Logo Tengah"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            // Fallback to building icon if image fails
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Stamp below QR */}
                  <div className="mt-3 text-center">
                    <span className="text-[11px] font-mono font-black text-slate-800 tracking-wider block">
                      {verificationHash}
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 block uppercase tracking-wide">
                      ✓ QR Resmi Berlogo &bull; Terverifikasi
                    </span>
                  </div>
                </div>

                {/* Center Logo Toggle & Configuration */}
                <div className="w-full mt-4 p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2.5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeLogo}
                      onChange={(e) => setIncludeLogo(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Sertakan Logo Perusahaan di Tengah QR</span>
                  </label>

                  {includeLogo && (
                    <div className="space-y-2 pt-1 border-t border-indigo-100 dark:border-indigo-900/50">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
                        Pilihan Logo Perusahaan:
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setLogoSource('owner')}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-left truncate transition-all cursor-pointer flex items-center gap-1.5 ${
                            logoSource === 'owner'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                          }`}
                          title="Logo Pemilik: PT Foresyndo Global Indonesia"
                        >
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Logo Owner (FGI)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setLogoSource('contractor')}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-left truncate transition-all cursor-pointer flex items-center gap-1.5 ${
                            logoSource === 'contractor'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                          }`}
                          title="Logo Kontraktor: PT Gong Mbe Link Pamungkas"
                        >
                          <HardHat className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Logo Kontraktor</span>
                        </button>
                      </div>

                      {/* Upload custom logo button */}
                      <div className="flex items-center justify-between pt-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png, image/jpeg, image/svg+xml"
                          className="hidden"
                          onChange={handleLogoUpload}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" /> Unggah Logo Perusahaan Kustom...
                        </button>
                        {logoSource === 'custom' && (
                          <span className="text-[10px] text-emerald-600 font-bold">
                            ✓ Kustom Aktif
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Project Context & Action Buttons */}
              <div className="md:col-span-7 space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Identitas Proyek Terverifikasi:
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold font-mono">
                      {project.contractNumber}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                    {project.name}
                  </h4>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-500 shrink-0" />
                      <span><strong>Pemberi Tugas (Owner):</strong> {project.owner}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HardHat className="w-4 h-4 text-amber-500 shrink-0" />
                      <span><strong>Kontraktor:</strong> {project.contractorProfile?.companyName || project.contractor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="truncate"><strong>Lokasi:</strong> {project.location}</span>
                    </div>
                  </div>
                </div>

                {/* Direct Link Input Box */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Tautan Langsung Aplikasi:</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Dapat dipindai dari kamera HP / Tablet
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

                {/* Main Action Buttons: Enhanced Download with Logo In Center */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Primary Button: PNG with center logo */}
                    <button
                      onClick={handleDownloadPNG}
                      disabled={isDownloading}
                      className="w-full py-3 px-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Unduh QR (PNG + Logo Tengah)</span>
                    </button>

                    {/* Secondary Button: Field Badge Card PNG */}
                    <button
                      onClick={handleDownloadCardPNG}
                      disabled={isDownloading}
                      className="w-full py-3 px-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Unduh Kartu Papan Proyek</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={handleDownloadSVG}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> Unduh Format SVG Vektor
                    </button>

                    <button
                      onClick={handlePrint}
                      className="w-full py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 dark:text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Cetak Kartu Lapangan
                    </button>
                  </div>
                </div>

                {/* Field Usage Instructions */}
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Kualitas Cetak Definisi Tinggi (1200 x 1200 px):
                  </span>
                  <p className="text-[11px] leading-relaxed text-emerald-800/90 dark:text-emerald-300/90">
                    File PNG yang diunduh beresolusi tajam dengan tingkat toleransi error Level H (30%), menjamin QR code tetap dapat dipindai dengan cepat oleh kamera HP meskipun logo perusahaan terpasang di bagian tengah.
                  </p>
                </div>
              </div>
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
            Ref: {verificationHash} &bull; Keamanan QR: Level H (30% Koreksi Kesalahan)
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
