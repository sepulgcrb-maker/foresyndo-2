import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ProjectInfo, WorkItem, PaymentTerm, DailyLog, MaterialItem } from '../types';
import { OFFICIAL_RAB_DOCUMENT, OfficialRABDocument } from '../data/initialData';
import {
  formatIDR,
  calculatePhysicalProgress,
  calculateTargetProgress,
  calculateDeviation,
  calculateFinancialSummary,
  generateSCurveData,
} from './calculations';

/**
 * Generate official comprehensive Analisis Kurva-S PDF Document with embedded vector plot & weekly progression
 */
export function generateSCurvePDF(
  project: ProjectInfo,
  workItems: WorkItem[],
  viewGranularity: 'Weekly' | 'Monthly' = 'Weekly'
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const navyColor: [number, number, number] = [15, 23, 42]; // #0F172A
  const orangeColor: [number, number, number] = [249, 115, 22]; // #F97316
  const emeraldColor: [number, number, number] = [16, 185, 129];
  const redColor: [number, number, number] = [239, 68, 68];
  const grayColor: [number, number, number] = [100, 116, 139];

  // Letterhead Header
  doc.setFillColor(...navyColor);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFillColor(...orangeColor);
  doc.rect(0, 26, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.text('PT. FORESYNDO GLOBAL INDONESIA', 14, 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Aplikasi Sistem Monitoring Pembangunan Proyek Gedung FORESYNDO 2', 14, 17);
  doc.text(`Lokasi: ${project.location} | Kontrak: ${project.contractNumber || 'PR-2026-FGI-004'}`, 14, 22);

  // Title
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LAPORAN ANALISIS KURVA-S & EVALUASI SCHEDULE VARIANCE', 14, 37);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  const printDateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Tanggal Cetak: ${printDateStr}`, pageWidth - 14, 37, { align: 'right' });

  // Progress metrics
  const realizedFisik = calculatePhysicalProgress(workItems);
  const targetFisik = calculateTargetProgress(workItems);
  const deviasi = calculateDeviation(realizedFisik, targetFisik);
  const spi = targetFisik > 0 ? (realizedFisik / targetFisik).toFixed(2) : '1.00';
  const isDelayed = deviasi < -5;

  // KPI Summary Card Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 43, pageWidth - 28, 30, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 43, pageWidth - 28, 30, 2, 2, 'D');

  doc.setFontSize(8.5);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan Evaluasi Kinerja Jadwal (Earned Value Metrics):', 18, 49);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Target Kumulatif Jadwal: ${targetFisik}%`, 18, 56);
  doc.text(`Realisasi Fisik Terverifikasi: ${realizedFisik}%`, 18, 62);
  doc.text(`Status Waktu: ${isDelayed ? 'Terlambat (>5%) - Perlu Percepatan' : 'Berjalan Sesuai Target'}`, 18, 68);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isDelayed ? 220 : 16, isDelayed ? 38 : 185, isDelayed ? 38 : 129);
  doc.text(`Deviasi Progres: ${deviasi > 0 ? '+' : ''}${deviasi}% (${isDelayed ? 'KETERLAMBATAN' : 'ON SCHEDULE'})`, 112, 56);

  doc.setTextColor(...navyColor);
  doc.text(`Schedule Performance Index (SPI): ${spi}`, 112, 62);
  doc.setTextColor(...grayColor);
  doc.text(`Target Selesai: ${project.targetEndDate} | Status: ${project.status}`, 112, 68);

  // Vector S-Curve Graphical Plot Area
  const chartX = 14;
  const chartY = 77;
  const chartW = pageWidth - 28;
  const chartH = 68;

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(chartX, chartY, chartW, chartH, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(chartX, chartY, chartW, chartH, 2, 2, 'D');

  // Chart Title
  doc.setFontSize(8);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAFIK KURVA-S (TARGET RENCANA VS REALISASI FISIK VS DEVIASI)', chartX + 4, chartY + 6);

  // Legend
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setFillColor(...orangeColor);
  doc.circle(chartX + chartW - 75, chartY + 5, 1.5, 'F');
  doc.setTextColor(71, 85, 105);
  doc.text('Target (%)', chartX + chartW - 71, chartY + 6);

  doc.setFillColor(...emeraldColor);
  doc.circle(chartX + chartW - 50, chartY + 5, 1.5, 'F');
  doc.text('Realisasi (%)', chartX + chartW - 46, chartY + 6);

  doc.setFillColor(...redColor);
  doc.rect(chartX + chartW - 25, chartY + 4, 3, 3, 'F');
  doc.text('Deviasi', chartX + chartW - 20, chartY + 6);

  // Plot Coordinates
  const plotLeft = chartX + 14;
  const plotTop = chartY + 12;
  const plotWidth = chartW - 20;
  const plotHeight = chartH - 20;
  const plotBottom = plotTop + plotHeight;

  // Gridlines & Y-Axis labels (0%, 25%, 50%, 75%, 100%)
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(0.2);
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);

  [0, 25, 50, 75, 100].forEach((pct) => {
    const y = plotBottom - (pct / 100) * plotHeight;
    doc.line(plotLeft, y, plotLeft + plotWidth, y);
    doc.text(`${pct}%`, chartX + 3, y + 1);
  });

  const rawData = generateSCurveData(workItems);
  const numPoints = rawData.length;

  // Draw X-Axis ticks every 5 weeks
  for (let i = 0; i < numPoints; i += 5) {
    const pt = rawData[i];
    const x = plotLeft + (i / (numPoints - 1)) * plotWidth;
    doc.text(pt.weekLabel, x - 2, plotBottom + 4);
  }

  // Draw Deviation Bars
  rawData.forEach((pt, i) => {
    if (pt.deviationPercent !== undefined && pt.deviationPercent !== null) {
      const x = plotLeft + (i / (numPoints - 1)) * plotWidth;
      const barH = Math.min(plotHeight * 0.4, Math.abs(pt.deviationPercent) * 0.5);
      if (barH > 0) {
        doc.setFillColor(pt.deviationPercent < 0 ? 239 : 16, pt.deviationPercent < 0 ? 68 : 185, pt.deviationPercent < 0 ? 68 : 129);
        doc.rect(x - 0.7, plotBottom - barH, 1.4, barH, 'F');
      }
    }
  });

  // Draw Target S-Curve Line (Orange)
  doc.setDrawColor(...orangeColor);
  doc.setLineWidth(0.6);
  for (let i = 0; i < numPoints - 1; i++) {
    const x1 = plotLeft + (i / (numPoints - 1)) * plotWidth;
    const y1 = plotBottom - (rawData[i].targetCumulativePercent / 100) * plotHeight;
    const x2 = plotLeft + ((i + 1) / (numPoints - 1)) * plotWidth;
    const y2 = plotBottom - (rawData[i + 1].targetCumulativePercent / 100) * plotHeight;
    doc.line(x1, y1, x2, y2);
  }

  // Draw Realized S-Curve Line (Emerald Green)
  doc.setDrawColor(...emeraldColor);
  doc.setLineWidth(0.8);
  const realizedPoints = rawData.filter((p) => p.realizedCumulativePercent !== undefined && p.realizedCumulativePercent !== null);
  for (let i = 0; i < realizedPoints.length - 1; i++) {
    const origIndex1 = rawData.indexOf(realizedPoints[i]);
    const origIndex2 = rawData.indexOf(realizedPoints[i + 1]);
    const x1 = plotLeft + (origIndex1 / (numPoints - 1)) * plotWidth;
    const y1 = plotBottom - (realizedPoints[i].realizedCumulativePercent / 100) * plotHeight;
    const x2 = plotLeft + (origIndex2 / (numPoints - 1)) * plotWidth;
    const y2 = plotBottom - (realizedPoints[i + 1].realizedCumulativePercent / 100) * plotHeight;
    doc.line(x1, y1, x2, y2);
  }

  // AutoTable: Progression Table
  const tableStartY = chartY + chartH + 5;

  const tableRows = rawData
    .filter((_, idx) => idx % (viewGranularity === 'Monthly' ? 4 : 2) === 0 || idx === rawData.length - 1)
    .map((pt) => {
      const isDevNeg = pt.deviationPercent !== undefined && pt.deviationPercent < 0;
      const statusText =
        pt.realizedCumulativePercent === undefined
          ? 'Rencana Ke Depan'
          : isDevNeg
          ? `Deviasi ${pt.deviationPercent}% (Perlu Kejar)`
          : 'Sesuai Rencana';

      return [
        pt.weekLabel,
        pt.date,
        `${pt.targetCumulativePercent.toFixed(1)}%`,
        pt.realizedCumulativePercent !== undefined ? `${pt.realizedCumulativePercent.toFixed(1)}%` : '-',
        pt.deviationPercent !== undefined ? `${pt.deviationPercent > 0 ? '+' : ''}${pt.deviationPercent.toFixed(1)}%` : '-',
        statusText,
      ];
    });

  autoTable(doc, {
    startY: tableStartY,
    head: [['Minggu', 'Tanggal Opname', 'Target Kumulatif (%)', 'Realisasi Fisik (%)', 'Deviasi (%)', 'Evaluasi Kinerja']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: navyColor,
      textColor: 255,
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: { fontSize: 6.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 32, halign: 'right', fontStyle: 'bold', textColor: [234, 88, 12] },
      3: { cellWidth: 32, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] },
      4: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 44, halign: 'left' },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 6 : 220;

  if (currentY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  }

  // Action Plan Note Box
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(14, currentY, pageWidth - 28, 18, 1.5, 1.5, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(14, currentY, pageWidth - 28, 18, 1.5, 1.5, 'D');

  doc.setFontSize(7.5);
  doc.setTextColor(185, 28, 28);
  doc.setFont('helvetica', 'bold');
  doc.text('CATATAN EVALUASI & REKOMENDASI PERCEPATAN (ACTION PLAN):', 18, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(127, 29, 29);
  doc.text('1. Lakukan penambahan jam kerja lembur malam (shift 2) untuk pekerjaan struktur lantai 2 & dinding.', 18, currentY + 9.5);
  doc.text('2. Prioritaskan pengadaan material besi D10 & Semen PCC melalui modul peringatan dini stok.', 18, currentY + 14);

  // Signatures
  const sigY = currentY + 23;
  if (sigY + 24 < pageHeight) {
    doc.setFontSize(7.5);
    doc.setTextColor(...navyColor);
    doc.setFont('helvetica', 'bold');

    doc.text('Dibuat Oleh,', 20, sigY);
    doc.text('Site Manager Proyek', 20, sigY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text('( Ir. Agus Pratama )', 20, sigY + 19);

    doc.setFont('helvetica', 'bold');
    doc.text('Diperiksa Oleh,', pageWidth / 2 - 15, sigY);
    doc.text('Lead Project Engineer / QC', pageWidth / 2 - 15, sigY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text('( Hendra Gunawan, ST )', pageWidth / 2 - 15, sigY + 19);

    doc.setFont('helvetica', 'bold');
    doc.text('Disetujui Oleh,', pageWidth - 60, sigY);
    doc.text('Direktur PT. Foresyndo', pageWidth - 60, sigY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text('( H. Bambang S. )', pageWidth - 60, sigY + 19);
  }

  doc.save(`Analisis_Kurva_S_FORESYNDO2_${viewGranularity}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generate comprehensive Termin Pembayaran PDF Report with official PT. FORESYNDO GLOBAL INDONESIA letterhead
 */
export function generateTerminPDF(
  project: ProjectInfo,
  terms: PaymentTerm[],
  workItems: WorkItem[]
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const navyColor: [number, number, number] = [15, 23, 42]; // #0F172A
  const orangeColor: [number, number, number] = [249, 115, 22]; // #F97316
  const emeraldColor: [number, number, number] = [16, 185, 129];
  const grayColor: [number, number, number] = [100, 116, 139];

  // Letterhead Header
  doc.setFillColor(...navyColor);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFillColor(...orangeColor);
  doc.rect(0, 26, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('PT. FORESYNDO GLOBAL INDONESIA', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Aplikasi Sistem Monitoring Pembangunan Gedung FORESYNDO 2', 14, 17);
  doc.text(`Lokasi: ${project.location} | Kontrak: ${project.contractNumber || 'PR-2026-FGI-004'}`, 14, 22);

  // Document Title & Timestamp
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('LAPORAN STATUS PEMBAYARAN TERMIN & RETENSI PROYEK', 14, 37);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayColor);
  const printDateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Dicetak pada: ${printDateStr}`, pageWidth - 14, 37, { align: 'right' });

  // Summary Financial Calculations
  const realizedFisik = calculatePhysicalProgress(workItems);
  const targetFisik = calculateTargetProgress(workItems);
  const deviasi = calculateDeviation(realizedFisik, targetFisik);
  const summary = calculateFinancialSummary(project.contractValue, terms);

  // Project & Financial KPI Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 43, pageWidth - 28, 38, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 43, pageWidth - 28, 38, 2, 2, 'D');

  doc.setFontSize(9);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Ringkasan Informasi & Rekonsiliasi Finansial:', 18, 49);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Nama Proyek: ${project.name}`, 18, 55);
  doc.text(`Pemilik (Owner): ${project.owner}`, 18, 60);
  doc.text(`Nilai Kontrak: ${formatIDR(project.contractValue)}`, 18, 65);
  doc.text(`Skema Termin: Setiap 25% Progres + Retensi 5% (Masa Pemeliharaan)`, 18, 70);
  doc.text(`Sisa Pembayaran: ${formatIDR(summary.remainingContractValue)}`, 18, 75);

  doc.setFont('helvetica', 'bold');
  doc.text(`Progress Fisik Riil: ${realizedFisik}%`, 112, 55);
  doc.text(`Target S-Curve: ${targetFisik}%`, 112, 60);
  doc.setTextColor(deviasi < -5 ? 220 : 16, deviasi < -5 ? 38 : 185, deviasi < -5 ? 38 : 129);
  doc.text(`Deviasi: ${deviasi > 0 ? '+' : ''}${deviasi}%`, 112, 65);
  
  doc.setTextColor(...navyColor);
  doc.text(`Total Dana Cair (Netto): ${formatIDR(summary.totalPaidNet)}`, 112, 70);
  doc.setTextColor(147, 51, 234); // purple
  doc.text(`Total Retensi Tertahan (5%): ${formatIDR(summary.totalRetentionHeld)}`, 112, 75);

  // Termin Table
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Rincian Jadwal, Nilai & Realisasi Pembayaran Termin:', 14, 88);

  const tableData = terms.map((t) => [
    `T-${t.termNumber}\n${t.title}`,
    `${t.targetProgressPercent}%\n(Realisasi: ${realizedFisik}%)`,
    formatIDR(t.grossValue),
    `-${formatIDR(t.retentionValue)}\n(5%)`,
    formatIDR(t.netPayableValue),
    t.status,
    t.paymentDate ? `${t.paymentDate}\n${t.approvedBy || '-'}` : 'Belum Bayar',
    t.notes || '-',
  ]);

  autoTable(doc, {
    startY: 92,
    head: [
      [
        'Termin',
        'Syarat Progres',
        'Nilai Bruto (Rp)',
        'Retensi 5% (Rp)',
        'Netto Cair (Rp)',
        'Status',
        'Tgl & Otorisasi',
        'Keterangan',
      ],
    ],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: navyColor,
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 26, halign: 'right' },
      3: { cellWidth: 24, halign: 'right', textColor: [147, 51, 234] },
      4: { cellWidth: 28, halign: 'right', fontStyle: 'bold', textColor: [16, 140, 90] },
      5: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 28, fontSize: 6.5 },
      7: { cellWidth: 22, fontSize: 6.5 },
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw as string;
        if (val === 'Dibayar') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (val === 'Menunggu Approval') {
          data.cell.styles.textColor = [217, 119, 6];
        } else {
          data.cell.styles.textColor = [100, 116, 139];
        }
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastTableY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 170;

  // Terms & Conditions note
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(14, lastTableY, pageWidth - 28, 22, 1.5, 1.5, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(14, lastTableY, pageWidth - 28, 22, 1.5, 1.5, 'D');

  doc.setFontSize(7.5);
  doc.setTextColor(146, 64, 14);
  doc.setFont('helvetica', 'bold');
  doc.text('Ketentuan & Regulasi Pencairan Termin (PT. Foresyndo Global Indonesia):', 18, lastTableY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    '1. Setiap pengajuan termin wajib melampirkan Berita Acara Opname Fisik & Laporan Prestasi Pekerjaan lapangan.',
    18,
    lastTableY + 9.5
  );
  doc.text(
    '2. Retensi 5% dipotong pada setiap termin dan dicairkan pada Termin 5 setelah masa pemeliharaan 180 hari (BAST II).',
    18,
    lastTableY + 14
  );
  doc.text(
    '3. Seluruh pembayaran ditransfer ke Rekening Resmi Perusahaan dan diverifikasi oleh Direktur.',
    18,
    lastTableY + 18.5
  );

  // Signatures Section at bottom
  const sigY = Math.min(pageHeight - 35, lastTableY + 28);

  doc.setFontSize(8);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');

  // Left Signature - Site Manager & Finance
  doc.text('Dibuat & Diverifikasi Oleh,', 25, sigY);
  doc.text('Site Manager Proyek', 25, sigY + 4);
  doc.setFont('helvetica', 'normal');
  doc.text('Ir. Agus Pratama', 25, sigY + 22);
  doc.setFontSize(6.5);
  doc.setTextColor(...grayColor);
  doc.text('Site Engineer & Cost Control', 25, sigY + 25);

  // Right Signature - Direktur Owner
  doc.setFontSize(8);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Disetujui Oleh,', pageWidth - 65, sigY);
  doc.text('Direktur PT. Foresyndo', pageWidth - 65, sigY + 4);
  doc.setFont('helvetica', 'normal');
  doc.text('H. Bambang S.', pageWidth - 65, sigY + 22);
  doc.setFontSize(6.5);
  doc.setTextColor(...grayColor);
  doc.text('Direktur Utama & Pengembang', pageWidth - 65, sigY + 25);

  // Digital Verification Stamp
  doc.setDrawColor(...emeraldColor);
  doc.setLineWidth(0.4);
  doc.roundedRect(pageWidth / 2 - 25, sigY - 2, 50, 24, 2, 2, 'D');
  doc.setFontSize(7);
  doc.setTextColor(...emeraldColor);
  doc.setFont('helvetica', 'bold');
  doc.text('VERIFIKASI DIGITAL', pageWidth / 2, sigY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('PT. FORESYNDO GLOBAL INDONESIA', pageWidth / 2, sigY + 8, { align: 'center' });
  doc.text(`ID: VCR-FGI-${new Date().getFullYear()}-004`, pageWidth / 2, sigY + 12, { align: 'center' });
  doc.text('STATUS: RESMI & SAH', pageWidth / 2, sigY + 16, { align: 'center' });
  doc.text(`Hash: ${Math.random().toString(36).substring(2, 10).toUpperCase()}`, pageWidth / 2, sigY + 20, { align: 'center' });

  doc.save(`Laporan_Termin_Pembayaran_FORESYNDO2_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generate official Single Voucher Pencairan Termin PDF
 */
export function generateTerminVoucherPDF(term: PaymentTerm, project: ProjectInfo) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  const navyColor: [number, number, number] = [15, 23, 42];
  const orangeColor: [number, number, number] = [249, 115, 22];
  const emeraldColor: [number, number, number] = [16, 185, 129];
  const grayColor: [number, number, number] = [100, 116, 139];

  // Header Box
  doc.setFillColor(...navyColor);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(...orangeColor);
  doc.rect(0, 28, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('PT. FORESYNDO GLOBAL INDONESIA', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Divisi Keuangan & Manajemen Proyek Konstruksi', 14, 18);
  doc.text(`Alamat Proyek: ${project.location}`, 14, 23);

  // Voucher Title
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('VOUCHER PENCAIRAN TERMIN PEMBAYARAN', 14, 40);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...grayColor);
  doc.text(`No. Voucher: VCR/TRM-${term.termNumber}/FGI/${new Date().getFullYear()}`, 14, 46);
  doc.text(`Tanggal: ${term.paymentDate || new Date().toISOString().split('T')[0]}`, pageWidth - 14, 46, { align: 'right' });

  // Main Info Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 52, pageWidth - 28, 56, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 52, pageWidth - 28, 56, 2, 2, 'D');

  doc.setFontSize(9);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text('DATA PENCAIRAN TERMIN:', 18, 59);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Nama Proyek : ${project.name}`, 18, 66);
  doc.text(`Nomor Kontrak : ${project.contractNumber || 'PR-2026-FGI-004'}`, 18, 72);
  doc.text(`Penerima Dana : PT. Foresyndo Global Indonesia`, 18, 78);
  doc.text(`Bank / Rekening : PT Bank Mandiri (Persero) Tbk - Rek. 131-00-982341-9`, 18, 84);
  doc.text(`Keterangan Termin : ${term.title} (Target Progres Fisik: ${term.targetProgressPercent}%)`, 18, 90);
  doc.text(`Status Verifikasi : ${term.status} (Disetujui: ${term.approvedBy || 'Direktur'})`, 18, 96);
  doc.text(`Catatan Lapangan : ${term.notes || 'Sesuai opname progress fisik konsultan pengawas'}`, 18, 102);

  // Financial Breakdown Box
  doc.setFillColor(...navyColor);
  doc.roundedRect(14, 114, pageWidth - 28, 50, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('RINCIAN PERHITUNGAN DANA TERMIN:', 20, 123);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('1. Nilai Bruto Termin:', 20, 131);
  doc.text(formatIDR(term.grossValue), pageWidth - 20, 131, { align: 'right' });

  doc.setTextColor(251, 146, 60); // orange
  doc.text(`2. Potongan Retensi (${term.retentionPercent}% Masa Pemeliharaan):`, 20, 138);
  doc.text(`-${formatIDR(term.retentionValue)}`, pageWidth - 20, 138, { align: 'right' });

  // Divider
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);
  doc.line(20, 144, pageWidth - 20, 144);

  doc.setTextColor(...emeraldColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL NETTO DICAIRKAN / DITERIMA:', 20, 153);
  doc.text(formatIDR(term.netPayableValue), pageWidth - 20, 153, { align: 'right' });

  // Signatures
  const sigY = 180;
  doc.setFontSize(8.5);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');

  doc.text('Dibuat & Diverifikasi,', 25, sigY);
  doc.text('Finance & Site Manager', 25, sigY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Ir. Agus Pratama', 25, sigY + 26);

  doc.setFont('helvetica', 'bold');
  doc.text('Disetujui Oleh,', pageWidth - 65, sigY);
  doc.text('Direktur PT. Foresyndo', pageWidth - 65, sigY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(term.approvedBy || 'H. Bambang S.', pageWidth - 65, sigY + 26);

  doc.save(`Voucher_Termin_${term.termNumber}_FORESYNDO2_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generate official comprehensive Rencana Anggaran Biaya (RAB) PDF Document
 */
export function generateOfficialRABPDF(
  rabDoc: OfficialRABDocument = OFFICIAL_RAB_DOCUMENT,
  project?: ProjectInfo
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const navyColor: [number, number, number] = [15, 23, 42];
  const orangeColor: [number, number, number] = [249, 115, 22];
  const emeraldColor: [number, number, number] = [16, 185, 129];
  const grayColor: [number, number, number] = [100, 116, 139];

  // Header on Page 1
  doc.setFillColor(...navyColor);
  doc.rect(0, 0, pageWidth, 26, 'F');
  doc.setFillColor(...orangeColor);
  doc.rect(0, 26, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PT. FORESYNDO GLOBAL INDONESIA', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('DOKUMEN RENCANA ANGGARAN BIAYA (RAB) RESMI TERVERIFIKASI', 14, 16.5);
  doc.text(`NIB: ${rabDoc.nib} | NPWP: ${rabDoc.npwp} | Lokasi: ${rabDoc.auditLocation}`, 14, 21.5);

  // Document Title
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('RENCANA ANGGARAN BIAYA (RAB) PEMBANGUNAN GEDUNG', 14, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(`No. Dokumen: ${rabDoc.contractNumber} / RAB-REV-02`, 14, 41);
  doc.text(`Tanggal Audit: ${rabDoc.issueDate}`, pageWidth - 14, 41, { align: 'right' });

  // RAB Meta Info Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 45, pageWidth - 28, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 45, pageWidth - 28, 22, 2, 2, 'D');

  doc.setFontSize(7.5);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nama Proyek: ${rabDoc.projectName}`, 18, 51);
  doc.text(`Pengembang: ${rabDoc.developer}`, 18, 56);
  doc.text(`Toleransi Biaya: ${rabDoc.tolerance}`, 18, 61);

  doc.text(`Total Anggaran RAB: ${formatIDR(rabDoc.totalNominal)}`, 115, 51);
  doc.text(`Jumlah Sektor: ${rabDoc.sectors.length} Sektor Utama`, 115, 56);
  doc.setTextColor(...emeraldColor);
  doc.text('Status: TERVERIFIKASI 100% (AUDITED)', 115, 61);

  // Section 1: Rekapitulasi Sektoral
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('I. REKAPITULASI BIAYA PER SEKTOR PEKERJAAN (14 SEKTOR):', 14, 73);

  const sectorTableData = rabDoc.sectors.map((s) => [
    `Sektor ${s.sectorNumber}`,
    s.name,
    formatIDR(s.budget),
    `${s.percentage.toFixed(2)}%`,
  ]);

  autoTable(doc, {
    startY: 76,
    head: [['No. Sektor', 'Uraian Sektor Pekerjaan', 'Anggaran Sektoral (Rp)', 'Bobot (%)']],
    body: sectorTableData,
    foot: [['', 'TOTAL ANGGARAN KESELURUHAN SEKTOR', formatIDR(rabDoc.totalNominal), '100.00%']],
    theme: 'grid',
    headStyles: {
      fillColor: navyColor,
      textColor: 255,
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: navyColor,
      fontSize: 7,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 6.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 90 },
      2: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 170;

  // Add Section 2: Detailed items table
  if (currentY > pageHeight - 50) {
    doc.addPage();
    currentY = 20;
  }

  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('II. RINCIAN SUB-ITEM PEKERJAAN, HARGA SATUAN & BOBOT PROGRES:', 14, currentY);

  const detailTableData = rabDoc.detailItems.map((item) => [
    item.code,
    `Sektor ${item.sectorNumber}`,
    item.description,
    `${item.volume} ${item.unit}`,
    formatIDR(item.unitPrice),
    formatIDR(item.totalPrice),
    `${item.bobotPercent.toFixed(3)}%`,
    item.targetProgress25Percent ? `${item.targetProgress25Percent}%` : '-',
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [
      [
        'Kode',
        'Sektor',
        'Deskripsi Item Pekerjaan',
        'Volume',
        'Harga Satuan (Rp)',
        'Total Harga (Rp)',
        'Bobot %',
        'Target 25%',
      ],
    ],
    body: detailTableData,
    theme: 'grid',
    headStyles: {
      fillColor: navyColor,
      textColor: 255,
      fontSize: 6.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: { fontSize: 6, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 54 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 15, halign: 'right' },
      7: { cellWidth: 13, halign: 'center', textColor: [234, 88, 12] },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastDetailY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 8 : 220;

  // Check if we need new page for signatures
  if (lastDetailY > pageHeight - 45) {
    doc.addPage();
    currentY = 20;
  } else {
    currentY = lastDetailY;
  }

  // Verification & Signatures block
  doc.setFontSize(7.5);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');

  // Left
  doc.text('Dibuat & Dihitung Oleh,', 20, currentY + 6);
  doc.text('Lead Quantity Surveyor / Estimator', 20, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text('( Ir. Agus Pratama )', 20, currentY + 25);

  // Center
  doc.setFont('helvetica', 'bold');
  doc.text('Diperiksa Oleh,', pageWidth / 2 - 15, currentY + 6);
  doc.text('Project Manager Lapangan', pageWidth / 2 - 15, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text('( Hendra Wijaya, ST )', pageWidth / 2 - 15, currentY + 25);

  // Right
  doc.setFont('helvetica', 'bold');
  doc.text('Disetujui & Disahkan Oleh,', pageWidth - 60, currentY + 6);
  doc.text('Direktur PT. Foresyndo', pageWidth - 60, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text('( H. Bambang S. )', pageWidth - 60, currentY + 25);

  doc.save(`Dokumen_RAB_Resmi_FORESYNDO2_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generate standard Multi-type PDF Report with official PT. FORESYNDO GLOBAL INDONESIA letterhead
 */
export function generatePDFReport(
  reportType: 'Harian' | 'Mingguan' | 'Bulanan' | 'Progress' | 'Termin' | 'Material' | 'Keuangan' | 'RAB' | 'Kurva-S',
  project: ProjectInfo,
  workItems: WorkItem[],
  terms: PaymentTerm[],
  dailyLogs: DailyLog[],
  materials: MaterialItem[],
  rabDoc?: OfficialRABDocument
) {
  if (reportType === 'Kurva-S') {
    generateSCurvePDF(project, workItems, 'Weekly');
    return;
  }

  if (reportType === 'Termin') {
    generateTerminPDF(project, terms, workItems);
    return;
  }

  if (reportType === 'RAB') {
    generateOfficialRABPDF(rabDoc || OFFICIAL_RAB_DOCUMENT, project);
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Colors (Navy & Dark Slate)
  const navyColor: [number, number, number] = [15, 23, 42]; // #0F172A
  const orangeColor: [number, number, number] = [249, 115, 22]; // #F97316
  const grayColor: [number, number, number] = [100, 116, 139];

  // Letterhead Header
  doc.setFillColor(...navyColor);
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Accent line
  doc.setFillColor(...orangeColor);
  doc.rect(0, 26, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('PT. FORESYNDO GLOBAL INDONESIA', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Aplikasi Sistem Monitoring Pembangunan Proyek Gedung - FORESYNDO 2', 14, 18);
  doc.text(`Lokasi: ${project.location}`, 14, 23);

  // Document Title & Timestamp
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const titleText = `LAPORAN ${reportType.toUpperCase()} MONITORING PROYEK`;
  doc.text(titleText, 14, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Dicetak pada: ${dateStr}`, pageWidth - 14, 38, { align: 'right' });

  // Project Info Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 44, pageWidth - 28, 28, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 44, pageWidth - 28, 28, 2, 2, 'D');

  doc.setFontSize(9);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Informasi Proyek:', 18, 50);

  doc.setFont('helvetica', 'normal');
  doc.text(`Nama Proyek: ${project.name}`, 18, 56);
  doc.text(`Pemilik (Owner): ${project.owner}`, 18, 61);
  doc.text(`Nilai Kontrak: ${formatIDR(project.contractValue)}`, 18, 66);

  const realizedFisik = calculatePhysicalProgress(workItems);
  const targetFisik = calculateTargetProgress(workItems);
  const deviasi = calculateDeviation(realizedFisik, targetFisik);

  doc.setFont('helvetica', 'bold');
  doc.text(`Progress Fisik: ${realizedFisik}%`, 110, 56);
  doc.text(`Target Schedule: ${targetFisik}%`, 110, 61);
  doc.setTextColor(deviasi < -5 ? 220 : 16, deviasi < -5 ? 38 : 185, deviasi < -5 ? 38 : 129);
  doc.text(`Deviasi: ${deviasi > 0 ? '+' : ''}${deviasi}%`, 110, 66);

  const startY = 80;

  // Dynamic Content according to reportType
  if (reportType === 'Progress' || reportType === 'Mingguan' || reportType === 'Bulanan') {
    doc.setTextColor(...navyColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Rincian Progress Item Pekerjaan (Time Schedule)', 14, startY);

    const tableData = workItems.map((item) => [
      item.no,
      item.name,
      item.startDate,
      item.endDate,
      `${item.bobotPercent}%`,
      `${item.targetProgressPercent}%`,
      `${item.realizedProgressPercent}%`,
      item.status,
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [['No', 'Item Pekerjaan', 'Mulai', 'Selesai', 'Bobot', 'Target', 'Progress', 'Status']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: navyColor, textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 65 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 15, halign: 'right' },
        5: { cellWidth: 15, halign: 'right' },
        6: { cellWidth: 15, halign: 'right' },
        7: { cellWidth: 20, halign: 'center' },
      },
    });
  } else if (reportType === 'Keuangan') {
    doc.setTextColor(...navyColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Jadwal & Status Pembayaran Termin Proyek', 14, startY);

    const tableData = terms.map((t) => [
      t.title,
      `${t.targetProgressPercent}%`,
      formatIDR(t.grossValue),
      formatIDR(t.retentionValue),
      formatIDR(t.netPayableValue),
      t.status,
      t.paymentDate || '-',
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [['Termin', 'Target Progress', 'Nilai Bruto', 'Retensi (5%)', 'Nilai Netto', 'Status', 'Tgl Bayar']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: navyColor, textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
    });
  } else if (reportType === 'Material') {
    doc.setTextColor(...navyColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Laporan Stok & Penggunaan Material Konstruksi', 14, startY);

    const tableData = materials.map((m) => [
      m.name,
      `${m.volumeTotal} ${m.unit}`,
      `${m.volumeUsed} ${m.unit}`,
      `${m.stockRemaining} ${m.unit}`,
      formatIDR(m.pricePerUnit),
      m.supplier,
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [['Material', 'Total Terima', 'Terpakai', 'Sisa Stok', 'Harga Satuan', 'Supplier']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: navyColor, textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
    });
  } else {
    // Daily log summary
    doc.setTextColor(...navyColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Catatan Monitoring Harian Proyek (Terakhir)', 14, startY);

    const tableData = dailyLogs.map((log) => [
      log.date,
      log.weather,
      `${log.workerCount} Org`,
      log.mandorName,
      log.activitySummary,
      log.volumeDone,
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [['Tanggal', 'Cuaca', 'Pekerja', 'Mandor', 'Kegiatan Utama', 'Volume']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: navyColor, textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
    });
  }

  // Signatures Section at bottom
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : startY + 60;
  const pageHeight = doc.internal.pageSize.getHeight();

  const sigY = finalY + 45 > pageHeight ? pageHeight - 40 : finalY;

  doc.setFontSize(9);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');

  // Left Signature - Site Manager
  doc.text('Dibuat Oleh,', 25, sigY);
  doc.text('Site Manager Proyek', 25, sigY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('( Ir. Agus Pratama )', 25, sigY + 25);

  // Right Signature - Direktur Owner
  doc.setFont('helvetica', 'bold');
  doc.text('Disetujui Oleh,', pageWidth - 65, sigY);
  doc.text('Direktur PT. Foresyndo', pageWidth - 65, sigY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('( H. Bambang S. )', pageWidth - 65, sigY + 25);

  doc.save(`Laporan_${reportType}_FORESYNDO2_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Export Excel File (.xlsx)
 */
export function generateExcelReport(
  reportType: 'Harian' | 'Mingguan' | 'Bulanan' | 'Progress' | 'Termin' | 'Material' | 'Keuangan' | 'RAB' | 'Kurva-S',
  project: ProjectInfo,
  workItems: WorkItem[],
  terms: PaymentTerm[],
  dailyLogs: DailyLog[],
  materials: MaterialItem[],
  rabDoc?: OfficialRABDocument
) {
  const wb = XLSX.utils.book_new();
  const rabData = rabDoc || OFFICIAL_RAB_DOCUMENT;

  // Project Info sheet
  const projectSummary = [
    ['NAMA PROYEK', project.name],
    ['OWNER', project.owner],
    ['LOKASI', project.location],
    ['NILAI KONTRAK', project.contractValue],
    ['TANGGAL MULAI', project.startDate],
    ['TARGET SELESAI', project.targetEndDate],
    ['STATUS', project.status],
    ['PROGRESS FISIK (%)', calculatePhysicalProgress(workItems)],
    ['TARGET SCHEDULE (%)', calculateTargetProgress(workItems)],
    ['DEVIASI (%)', calculateDeviation(calculatePhysicalProgress(workItems), calculateTargetProgress(workItems))],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(projectSummary);
  XLSX.utils.book_append_sheet(wb, wsInfo, 'Summary Proyek');

  // S-Curve Sheet
  const scurveData = generateSCurveData(workItems);
  const scurveRows = scurveData.map((pt) => ({
    'Minggu': pt.weekLabel,
    'Tanggal Opname': pt.date,
    'Target Kumulatif (%)': pt.targetCumulativePercent,
    'Realisasi Fisik Kumulatif (%)': pt.realizedCumulativePercent ?? '',
    'Deviasi (%)': pt.deviationPercent ?? '',
  }));
  const wsSCurve = XLSX.utils.json_to_sheet(scurveRows);
  XLSX.utils.book_append_sheet(wb, wsSCurve, 'Analisis Kurva-S');

  // RAB Detail Sheet
  const rabSectorRows = rabData.sectors.map((s) => ({
    'No Sektor': s.sectorNumber,
    'Nama Sektor': s.name,
    'Anggaran (Rp)': s.budget,
    'Bobot (%)': s.percentage,
  }));
  const wsRABSectors = XLSX.utils.json_to_sheet(rabSectorRows);
  XLSX.utils.book_append_sheet(wb, wsRABSectors, 'RAB Rekap Sektor');

  const rabItemRows = rabData.detailItems.map((item) => ({
    Kode: item.code,
    'Sektor No': item.sectorNumber,
    'Uraian Pekerjaan': item.description,
    Volume: item.volume,
    Satuan: item.unit,
    'Harga Satuan (Rp)': item.unitPrice,
    'Total Harga (Rp)': item.totalPrice,
    'Bobot (%)': item.bobotPercent,
    'Target 25% (%)': item.targetProgress25Percent || 0,
  }));
  const wsRABItems = XLSX.utils.json_to_sheet(rabItemRows);
  XLSX.utils.book_append_sheet(wb, wsRABItems, 'RAB Rincian Sub-Item');

  // Time Schedule Sheet
  const workScheduleRows = workItems.map((item) => ({
    No: item.no,
    Kategori: item.category,
    'Item Pekerjaan': item.name,
    Mulai: item.startDate,
    Selesai: item.endDate,
    'Durasi (Hari)': item.durationDays,
    'Bobot (%)': item.bobotPercent,
    'Target (%)': item.targetProgressPercent,
    'Realisasi (%)': item.realizedProgressPercent,
    Volume: `${item.volumeRealized} / ${item.volumeTarget} ${item.unit}`,
    Status: item.status,
    Keterangan: item.notes,
  }));
  const wsSchedule = XLSX.utils.json_to_sheet(workScheduleRows);
  XLSX.utils.book_append_sheet(wb, wsSchedule, 'Time Schedule');

  // Payment Terms Sheet
  const termsRows = terms.map((t) => ({
    Termin: t.title,
    'Target Progress': `${t.targetProgressPercent}%`,
    'Nilai Bruto (Rp)': t.grossValue,
    'Retensi 5% (Rp)': t.retentionValue,
    'Nilai Netto (Rp)': t.netPayableValue,
    Status: t.status,
    'Tanggal Bayar': t.paymentDate || '-',
    Catatan: t.notes || '',
  }));
  const wsTerms = XLSX.utils.json_to_sheet(termsRows);
  XLSX.utils.book_append_sheet(wb, wsTerms, 'Pembayaran Termin');

  // Daily Logs Sheet
  const dailyRows = dailyLogs.map((log) => ({
    Tanggal: log.date,
    Cuaca: log.weather,
    'Jumlah Pekerja': log.workerCount,
    Mandor: log.mandorName,
    Kegiatan: log.activitySummary,
    Volume: log.volumeDone,
    Catatan: log.notes,
  }));
  const wsDaily = XLSX.utils.json_to_sheet(dailyRows);
  XLSX.utils.book_append_sheet(wb, wsDaily, 'Monitoring Harian');

  // Materials Sheet
  const matRows = materials.map((m) => ({
    Material: m.name,
    'Total Volume': m.volumeTotal,
    Terpakai: m.volumeUsed,
    'Sisa Stok': m.stockRemaining,
    Satuan: m.unit,
    'Harga Satuan': m.pricePerUnit,
    Supplier: m.supplier,
  }));
  const wsMat = XLSX.utils.json_to_sheet(matRows);
  XLSX.utils.book_append_sheet(wb, wsMat, 'Material');

  XLSX.writeFile(wb, `Monitoring_Proyek_FORESYNDO2_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

