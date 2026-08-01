import React, { useState } from 'react';
import { ProjectInfo, WorkItem, PaymentTerm, DailyLog, MaterialItem } from '../../types';
import { FileSpreadsheet, FileText, Download, Printer, CheckCircle2, Building2 } from 'lucide-react';
import { generatePDFReport, generateExcelReport } from '../../utils/exportEngine';
import { formatIDR, calculatePhysicalProgress, calculateTargetProgress, calculateDeviation } from '../../utils/calculations';

interface ReportCenterProps {
  project: ProjectInfo;
  workItems: WorkItem[];
  paymentTerms: PaymentTerm[];
  dailyLogs: DailyLog[];
  materials: MaterialItem[];
}

type ReportType = 'Harian' | 'Mingguan' | 'Bulanan' | 'Progress' | 'Termin' | 'Material' | 'Keuangan';

export const ReportCenter: React.FC<ReportCenterProps> = ({
  project,
  workItems,
  paymentTerms,
  dailyLogs,
  materials,
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('Progress');

  const reportTypes: { id: ReportType; label: string; desc: string }[] = [
    { id: 'Harian', label: 'Laporan Harian', desc: 'Rincian kegiatan, cuaca, dan tenaga kerja harian' },
    { id: 'Mingguan', label: 'Laporan Mingguan', desc: 'Rekapitulasi fisik dan deviasi mingguan' },
    { id: 'Bulanan', label: 'Laporan Bulanan', desc: 'Laporan eksekutif bulanan untuk Direktur/Owner' },
    { id: 'Progress', label: 'Laporan Progress', desc: 'Time Schedule lengkap dengan bobot & persentase' },
    { id: 'Termin', label: 'Laporan Termin', desc: 'Breakdown tagihan termin 1-5 dan potongan retensi 5%' },
    { id: 'Material', label: 'Laporan Material', desc: 'Stok bahan konstruksi dan daftar pengiriman supplier' },
    { id: 'Keuangan', label: 'Laporan Keuangan', desc: 'Arus kas proyek, total retensi, dan sisa pembayaran' },
  ];

  const handleExportPDF = () => {
    generatePDFReport(selectedReport, project, workItems, paymentTerms, dailyLogs, materials);
  };

  const handleExportExcel = () => {
    generateExcelReport(selectedReport, project, workItems, paymentTerms, dailyLogs, materials);
  };

  const handlePrint = () => {
    window.print();
  };

  const realizedFisik = calculatePhysicalProgress(workItems);
  const targetFisik = calculateTargetProgress(workItems);
  const deviasi = calculateDeviation(realizedFisik, targetFisik);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Pusat Laporan & Export Dokumen</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate otomatis Laporan PDF, Spreadsheet Excel, dan Cetak dengan Kop Resmi PT. FORESYNDO GLOBAL INDONESIA
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-red-500/20 transition-all"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Printer className="w-4 h-4 text-orange-400" /> Cetak
          </button>
        </div>
      </div>

      {/* Selector Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportTypes.map((rt) => {
          const isSelected = selectedReport === rt.id;

          return (
            <div
              key={rt.id}
              onClick={() => setSelectedReport(rt.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white border-orange-500 shadow-lg shadow-orange-500/20 scale-102'
                  : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-white' : 'text-orange-500'}`}>
                  {rt.id}
                </span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
              <h3 className="font-bold text-sm">{rt.label}</h3>
              <p className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                {rt.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Live Report Preview Box (Paper Replica with Letterhead) */}
      <div className="p-8 bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 max-w-4xl mx-auto space-y-6 printable-area">
        {/* Letterhead Kop Surat */}
        <div className="border-b-4 border-slate-900 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-10 h-10 text-orange-600 shrink-0" />
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">PT. FORESYNDO GLOBAL INDONESIA</h1>
              <p className="text-xs text-slate-600 font-medium">
                Kontraktor Utama & Real Estate Developer &bull; Proyek FORESYNDO 2
              </p>
              <p className="text-[10px] text-slate-500">Lokasi: {project.location}</p>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="font-bold block uppercase text-orange-600">LAPORAN MONITORING</span>
            <span className="text-[11px] text-slate-500">No. Dok: 048/LOK-FGI/VII/2026</span>
          </div>
        </div>

        {/* Project Info Table */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <span className="text-slate-500 block">Nama Proyek:</span>
            <strong className="text-slate-900">{project.name}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Pemilik (Owner):</span>
            <strong className="text-slate-900">{project.owner}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Nilai Kontrak:</span>
            <strong className="text-slate-900">{formatIDR(project.contractValue)}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Progress Fisik:</span>
            <strong className="text-emerald-600">{realizedFisik}%</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Target Schedule:</span>
            <strong className="text-orange-600">{targetFisik}%</strong>
          </div>
          <div>
            <span className="text-slate-500 block">Deviasi:</span>
            <strong className={deviasi < -5 ? 'text-red-600 font-black' : 'text-slate-900'}>
              {deviasi > 0 ? `+${deviasi}%` : `${deviasi}%`}
            </strong>
          </div>
        </div>

        {/* Dynamic Table Preview */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">
            PREVIEW: LAPORAN {selectedReport.toUpperCase()} MONITORING PROYEK
          </h3>

          <table className="w-full text-left text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-900 text-white font-bold text-[10px]">
                <th className="p-2.5">Item / Uraian</th>
                <th className="p-2.5 text-center">Status / Tgl</th>
                <th className="p-2.5 text-right">Nilai / Bobot / Vol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {selectedReport === 'Progress' &&
                workItems.slice(0, 7).map((wi) => (
                  <tr key={wi.id}>
                    <td className="p-2.5 font-semibold">{wi.name}</td>
                    <td className="p-2.5 text-center">{wi.status}</td>
                    <td className="p-2.5 text-right font-bold text-orange-600">{wi.realizedProgressPercent}%</td>
                  </tr>
                ))}

              {selectedReport === 'Termin' &&
                paymentTerms.map((t) => (
                  <tr key={t.termNumber}>
                    <td className="p-2.5 font-semibold">{t.title}</td>
                    <td className="p-2.5 text-center">{t.status}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-600">{formatIDR(t.netPayableValue)}</td>
                  </tr>
                ))}

              {(selectedReport === 'Harian' || selectedReport === 'Mingguan' || selectedReport === 'Bulanan') &&
                dailyLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="p-2.5 font-semibold">{log.activitySummary}</td>
                    <td className="p-2.5 text-center">{log.date}</td>
                    <td className="p-2.5 text-right font-bold">{log.volumeDone}</td>
                  </tr>
                ))}

              {selectedReport === 'Material' &&
                materials.map((m) => (
                  <tr key={m.id}>
                    <td className="p-2.5 font-semibold">{m.name}</td>
                    <td className="p-2.5 text-center">{m.supplier}</td>
                    <td className="p-2.5 text-right font-bold">
                      {m.stockRemaining} {m.unit} Sisa
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Signatures Block */}
        <div className="pt-8 border-t border-slate-200 flex justify-between text-xs font-bold text-slate-900">
          <div className="text-center">
            <p>Dibuat Oleh,</p>
            <p className="text-slate-500 font-normal">Site Manager Proyek</p>
            <div className="h-16" />
            <p>( Ir. Agus Pratama )</p>
          </div>

          <div className="text-center">
            <p>Disetujui Oleh,</p>
            <p className="text-slate-500 font-normal">Direktur PT. Foresyndo</p>
            <div className="h-16" />
            <p>( H. Bambang S. )</p>
          </div>
        </div>
      </div>
    </div>
  );
};
