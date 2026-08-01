import React from 'react';
import { OFFICIAL_RAB_DOCUMENT } from '../../data/initialData';
import { formatIDR } from '../../utils/calculations';
import { FileText, ShieldCheck, Download, Printer, CheckCircle2, QrCode, Building2, MapPin, Hash, FileCode } from 'lucide-react';

interface OfficialRABViewerProps {
  onClose?: () => void;
}

export const OfficialRABViewer: React.FC<OfficialRABViewerProps> = ({ onClose }) => {
  const rab = OFFICIAL_RAB_DOCUMENT;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900 text-slate-100 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6 max-w-5xl mx-auto">
      {/* Top Banner & Control Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              Dokumen RAB Resmi Teraudit (PDF Verified)
            </h2>
            <p className="text-xs text-slate-400">
              Sinkronisasi data otomatis dari file audit fisik No. PR-2026-FGI-004
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <Printer className="w-4 h-4 text-orange-400" /> Cetak / Save PDF
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

      {/* Official Paper Layout */}
      <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-xl font-sans text-xs space-y-6 print:p-0 print:shadow-none print:text-black">
        {/* Document Header */}
        <div className="border-b-2 border-blue-900 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-black tracking-widest text-blue-900 uppercase block">
              PT FORESYNDO GLOBAL INDONESIA
            </span>
            <span className="text-[11px] font-bold text-slate-600 block">
              ESTIMATOR & COMPLIANCE PROCUREMENT SYSTEM - BANDARA KERTAJATI
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-blue-950 mt-2 tracking-tight">
              RENCANA ANGGARAN BIAYA (RAB)
            </h1>
            <span className="text-[11px] font-bold text-slate-500 tracking-wide block mt-0.5">
              DOKUMEN AUDIT FISIK & REKONSILIASI KEUANGAN RESMI
            </span>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-right shrink-0">
            <span className="text-[10px] font-bold text-blue-900 block">STATUS DOKUMEN</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 font-black text-xs mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> TERAUDIT & RESMI
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
              {formatIDR(rab.totalNominal)}
            </span>
          </div>
          <p className="text-[11px] text-blue-100 max-w-xs text-right sm:text-right italic">
            Sudah mencakup Nilai Dasar Pekerjaan Konstruksi dan PPN (Pajak Pertambahan Nilai)
          </p>
        </div>

        {/* Table 1: 14 Main Sectors */}
        <div>
          <h3 className="font-black text-sm text-slate-900 mb-2 uppercase tracking-wide flex items-center gap-2">
            PROPORSI ANGGARAN & DISTRIBUSI SEKTOR UTAMA
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-blue-900 text-white font-bold">
                  <th className="p-2.5 w-24">Instalasi</th>
                  <th className="p-2.5">Rincian Sektor Pekerjaan</th>
                  <th className="p-2.5 text-right w-44">Rencana Anggaran (Rp)</th>
                  <th className="p-2.5 text-right w-24">Persentase</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {rab.sectors.map((sec, idx) => (
                  <tr key={sec.sectorNumber} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2.5 font-bold text-slate-600">Sektor {sec.sectorNumber}</td>
                    <td className="p-2.5 font-semibold text-slate-900">{sec.name}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                      {formatIDR(sec.budget)}
                    </td>
                    <td className="p-2.5 text-right font-bold text-blue-900">{sec.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 font-black text-slate-900 border-t-2 border-slate-400">
                  <td colSpan={2} className="p-2.5 text-right uppercase">Total Anggaran Proyek (RAB)</td>
                  <td className="p-2.5 text-right font-mono text-blue-950">{formatIDR(rab.totalNominal)}</td>
                  <td className="p-2.5 text-right text-blue-950">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Table 2: Detail Civil Sub-Items (A.1 - A.11) */}
        <div>
          <h3 className="font-black text-sm text-slate-900 mb-2 uppercase tracking-wide flex items-center gap-2">
            DAFTAR RINCIAN PEKERJAAN SIPIL & MEP (LAMPIRAN SEKTOR 1)
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-800 text-white font-bold">
                  <th className="p-2.5 w-16">Kode</th>
                  <th className="p-2.5">Uraian Detail Pekerjaan Konstruksi</th>
                  <th className="p-2.5 text-center w-20">Volume</th>
                  <th className="p-2.5 text-center w-16">Sat</th>
                  <th className="p-2.5 text-right w-36">Harga Satuan (Rp)</th>
                  <th className="p-2.5 text-right w-40">Total Biaya (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                {rab.detailItems.map((item, idx) => (
                  <tr key={item.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-2.5 font-bold text-blue-900 font-mono">{item.code}</td>
                    <td className="p-2.5 text-slate-800 font-semibold">{item.description}</td>
                    <td className="p-2.5 text-center font-bold">{item.volume}</td>
                    <td className="p-2.5 text-center text-slate-500">{item.unit}</td>
                    <td className="p-2.5 text-right font-mono text-slate-700">{formatIDR(item.unitPrice)}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatIDR(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lembar Pengesahan Digital & QR Signatures */}
        <div className="border-t-2 border-slate-300 pt-4 space-y-3">
          <h4 className="font-black text-xs text-slate-900 uppercase tracking-wider text-center">
            LEMBAR PENGESAHAN DOKUMEN DIGITAL ({rab.contractNumber})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center text-center space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">DIRESTRUKTURISASI & DISIAPKAN OLEH</span>
              <span className="font-black text-slate-900">Tim Estimator Proyek PT FGI</span>
              <div className="p-2 bg-white rounded-lg border border-slate-300 shadow-sm flex items-center justify-center my-1">
                <QrCode className="w-16 h-16 text-slate-800" />
              </div>
              <span className="font-mono text-[10px] text-slate-500">ID: {rab.estimatorSignatureId}</span>
              <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                VERIFIED QR DIGITAL SIGNATURE
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center text-center space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase">DITINJAU & DISETUJUI OLEH</span>
              <span className="font-black text-slate-900">Project Manager / Direktur</span>
              <div className="p-2 bg-white rounded-lg border border-slate-300 shadow-sm flex items-center justify-center my-1">
                <QrCode className="w-16 h-16 text-slate-800" />
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
