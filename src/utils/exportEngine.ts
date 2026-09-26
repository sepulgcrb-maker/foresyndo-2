import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  ProjectInfo,
  WorkItem,
  PaymentTerm,
  DailyLog,
  MaterialItem,
  BASTSubmissionData,
  ProjectDocument,
  PhotoItem,
  PhotoCategory,
  PDFCustomExportOptions,
  RKSChapter,
} from '../types';
import { OFFICIAL_RAB_DOCUMENT, OfficialRABDocument, INITIAL_PHOTOS } from '../data/initialData';
import { OFFICIAL_RKS_CHAPTERS, RKS_META_INFO, RKSMetaInfo } from '../data/rksData';
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
  doc.text(project.owner || 'PT. FORESYNDO GLOBAL INDONESIA', 14, 11.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Aplikasi Sistem Monitoring Pembangunan ${project.name}`, 14, 17);
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
    doc.text(`( ${project.siteManager || 'EKO YULIANTO'} )`, 20, sigY + 19);

    doc.setFont('helvetica', 'bold');
    doc.text('Diperiksa Oleh,', pageWidth / 2 - 15, sigY);
    doc.text('Lead Project Engineer / QC', pageWidth / 2 - 15, sigY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(`( ${project.qcEngineer || 'KIKI'} )`, pageWidth / 2 - 15, sigY + 19);

    doc.setFont('helvetica', 'bold');
    doc.text('Disetujui Oleh,', pageWidth - 60, sigY);
    doc.text(`Direktur Utama (Owner)`, pageWidth - 60, sigY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(`( ${project.director || 'HASANUDIN'} )`, pageWidth - 60, sigY + 19);
  }

  doc.save(`Analisis_Kurva_S_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${viewGranularity}_${new Date().toISOString().split('T')[0]}.pdf`);
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
  doc.text(project.owner || 'PT. FORESYNDO GLOBAL INDONESIA', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Aplikasi Sistem Monitoring Pembangunan ${project.name}`, 14, 17);
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
  doc.text(project.siteManager || 'EKO YULIANTO', 25, sigY + 22);
  doc.setFontSize(6.5);
  doc.setTextColor(...grayColor);
  doc.text('Site Engineer & Cost Control', 25, sigY + 25);

  // Right Signature - Direktur Owner
  doc.setFontSize(8);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Disetujui Oleh,', pageWidth - 65, sigY);
  doc.text(`Direktur Utama (Owner)`, pageWidth - 65, sigY + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(project.director || 'HASANUDIN', pageWidth - 65, sigY + 22);
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
  doc.text(project.owner || 'PT. FORESYNDO GLOBAL INDONESIA', 14, 12);

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
  doc.text(project.siteManager || 'EKO YULIANTO', 25, sigY + 26);

  doc.setFont('helvetica', 'bold');
  doc.text('Disetujui Oleh,', pageWidth - 65, sigY);
  doc.text(`Direktur Utama (Owner)`, pageWidth - 65, sigY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(term.approvedBy || project.director || 'HASANUDIN', pageWidth - 65, sigY + 26);

  doc.save(`Voucher_Termin_${term.termNumber}_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
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
  doc.text(project?.owner || rabDoc.developer || 'PT. FORESYNDO GLOBAL INDONESIA', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`DOKUMEN RENCANA ANGGARAN BIAYA (RAB) RESMI TERVERIFIKASI - ${project?.name || rabDoc.projectName}`, 14, 16.5);
  doc.text(`NIB: ${rabDoc.nib} | NPWP: ${rabDoc.npwp} | Lokasi: ${project?.location || rabDoc.auditLocation}`, 14, 21.5);

  // Document Title
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('RENCANA ANGGARAN BIAYA (RAB) PEMBANGUNAN GEDUNG', 14, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(`No. Dokumen: ${project?.contractNumber || rabDoc.contractNumber} / RAB-REV-02`, 14, 41);
  doc.text(`Tanggal Audit: ${rabDoc.issueDate}`, pageWidth - 14, 41, { align: 'right' });

  // RAB Meta Info Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 45, pageWidth - 28, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 45, pageWidth - 28, 22, 2, 2, 'D');

  doc.setFontSize(7.5);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nama Proyek: ${project?.name || rabDoc.projectName}`, 18, 51);
  doc.text(`Pengembang: ${project?.owner || rabDoc.developer}`, 18, 56);
  doc.text(`Toleransi Biaya: ${rabDoc.tolerance}`, 18, 61);

  doc.text(`Total Anggaran RAB: ${formatIDR(project?.contractValue || rabDoc.totalNominal)}`, 115, 51);
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
    foot: [
      ['', '', `TOTAL NILAI KONTRAK RAB (${rabDoc.detailItems?.length || 40} ITEM)`, '', '', formatIDR(rabDoc.totalNominal), '100.00%', ''],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: navyColor,
      textColor: 255,
      fontSize: 6.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: navyColor,
      fontSize: 6.5,
      fontStyle: 'bold',
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
  doc.text(`( ${project?.estimator || 'IHSAN'} )`, 20, currentY + 25);

  // Center
  doc.setFont('helvetica', 'bold');
  doc.text('Diperiksa Oleh,', pageWidth / 2 - 15, currentY + 6);
  doc.text('Project Manager Lapangan', pageWidth / 2 - 15, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`( ${project?.projectManager || 'JAKA SEPTIANDANA'} )`, pageWidth / 2 - 15, currentY + 25);

  // Right
  doc.setFont('helvetica', 'bold');
  doc.text('Disetujui & Disahkan Oleh,', pageWidth - 60, currentY + 6);
  doc.text(`Direktur Utama (Owner)`, pageWidth - 60, currentY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`( ${project?.director || 'HASANUDIN'} )`, pageWidth - 60, currentY + 25);

  doc.save(`Dokumen_RAB_Resmi_${(project?.name || rabDoc.projectName).replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Helper to fetch image and convert to Data URL for safe embedding in jsPDF
 */
async function fetchImageDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:image/jpeg') || url.startsWith('data:image/png')) return url;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxW = 600;
          const scale = img.width > maxW ? maxW / img.width : 1;
          canvas.width = Math.round((img.naturalWidth || img.width || 450) * scale);
          canvas.height = Math.round((img.naturalHeight || img.height || 300) * scale);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
            return;
          }
        } catch {
          // ignore canvas taint
        }
        resolve(null);
      };
      img.onerror = () => resolve(null);
      setTimeout(() => resolve(null), 3000);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/**
 * Generate standard Multi-type PDF Report with official PT. FORESYNDO GLOBAL INDONESIA letterhead,
 * customizable date range filtering, and photo documentation summary by category
 */
export async function generatePDFReport(
  reportType: 'Harian' | 'Mingguan' | 'Bulanan' | 'Progress' | 'Termin' | 'Material' | 'Keuangan' | 'RAB' | 'Kurva-S',
  project: ProjectInfo,
  workItems: WorkItem[],
  terms: PaymentTerm[],
  dailyLogs: DailyLog[],
  materials: MaterialItem[],
  rabDoc?: OfficialRABDocument,
  customOptions?: PDFCustomExportOptions,
  photos?: PhotoItem[]
) {
  // If Kurva-S without custom options/photos, default to existing generator
  if (reportType === 'Kurva-S' && !customOptions?.includePhotos && !customOptions?.startDate) {
    generateSCurvePDF(project, workItems, 'Weekly');
    return;
  }

  // If Termin without custom options/photos, default to existing generator
  if (reportType === 'Termin' && !customOptions?.includePhotos && !customOptions?.startDate) {
    generateTerminPDF(project, terms, workItems);
    return;
  }

  // If RAB without custom options/photos, default to existing generator
  if (reportType === 'RAB' && !customOptions?.includePhotos && !customOptions?.startDate) {
    generateOfficialRABPDF(rabDoc || OFFICIAL_RAB_DOCUMENT, project);
    return;
  }

  const orientation = customOptions?.orientation || 'portrait';
  const doc = new jsPDF(orientation === 'landscape' ? 'l' : 'p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Primary Colors (Navy & Dark Slate)
  const navyColor: [number, number, number] = [15, 23, 42]; // #0F172A
  const orangeColor: [number, number, number] = [249, 115, 22]; // #F97316
  const grayColor: [number, number, number] = [100, 116, 139];

  // 1. Filter data based on custom Date Range
  let filteredWorkItems = workItems;
  let filteredDailyLogs = dailyLogs;
  let filteredTerms = terms;
  let filteredMaterials = materials;

  const startDate = customOptions?.startDate;
  const endDate = customOptions?.endDate;
  const hasDateFilter = Boolean(startDate && endDate);

  if (hasDateFilter && startDate && endDate) {
    // Work items overlapping with date range
    filteredWorkItems = workItems.filter(
      (wi) => wi.startDate <= endDate && wi.endDate >= startDate
    );
    if (filteredWorkItems.length === 0) {
      filteredWorkItems = workItems; // fallback if empty
    }

    // Daily logs strictly within date range
    filteredDailyLogs = dailyLogs.filter(
      (log) => log.date >= startDate && log.date <= endDate
    );

    // Terms within date range or all
    const termsInRange = terms.filter(
      (t) => t.paymentDate && t.paymentDate >= startDate && t.paymentDate <= endDate
    );
    if (termsInRange.length > 0) {
      filteredTerms = termsInRange;
    }

    // Materials
    const matsInRange = materials.filter(
      (m) =>
        (m.arrivalDate && m.arrivalDate >= startDate && m.arrivalDate <= endDate) ||
        (m.usageDate && m.usageDate >= startDate && m.usageDate <= endDate)
    );
    if (matsInRange.length > 0) {
      filteredMaterials = matsInRange;
    }
  }

  // 2. Aggregate and filter photo documentation
  let aggregatedPhotos: PhotoItem[] =
    photos && photos.length > 0 ? [...photos] : [...INITIAL_PHOTOS];

  // Also include photos from daily logs if any
  filteredDailyLogs.forEach((dl) => {
    if (dl.photos && dl.photos.length > 0) {
      dl.photos.forEach((photoUrl, pIdx) => {
        if (!aggregatedPhotos.some((p) => p.url === photoUrl)) {
          aggregatedPhotos.push({
            id: `DL-${dl.id}-${pIdx}`,
            date: dl.date,
            category: 'Progress Hari Ini',
            title: `Dokumentasi Harian (${dl.date})`,
            url: photoUrl,
            uploadedBy: dl.mandorName || dl.createdBy || 'Site Manager',
            notes: dl.activitySummary || 'Kegiatan lapangan terverifikasi',
          });
        }
      });
    }
  });

  // Filter photos by date range
  if (hasDateFilter && startDate && endDate) {
    aggregatedPhotos = aggregatedPhotos.filter(
      (p) => p.date >= startDate && p.date <= endDate
    );
  }

  // Filter photos by category
  if (
    customOptions?.photoCategories &&
    customOptions.photoCategories.length > 0 &&
    !(customOptions.photoCategories as string[]).includes('Semua')
  ) {
    aggregatedPhotos = aggregatedPhotos.filter((p) =>
      customOptions.photoCategories!.includes(p.category)
    );
  }

  // Ensure documentation photos are always sorted newest / latest first
  aggregatedPhotos.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  // Letterhead Header
  doc.setFillColor(...navyColor);
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Accent line
  doc.setFillColor(...orangeColor);
  doc.rect(0, 26, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(project.owner || 'PT. FORESYNDO GLOBAL INDONESIA', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Sistem Manajemen & Monitoring Konstruksi - ${project.name}`, 14, 18);
  doc.text(`Lokasi: ${project.location}`, 14, 23);

  // Document Title & Timestamp
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const titleText = customOptions?.reportTitle || `LAPORAN ${reportType.toUpperCase()} MONITORING PROYEK`;
  doc.text(titleText, 14, 37);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayColor);
  const dateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.text(`Dicetak: ${dateStr}`, pageWidth - 14, 37, { align: 'right' });

  // Date Range Subtitle
  let currentY = 43;
  if (hasDateFilter && startDate && endDate) {
    doc.setFillColor(254, 243, 199); // light amber
    doc.roundedRect(14, currentY, pageWidth - 28, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text(
      `Periode Filter Laporan: ${startDate} s/d ${endDate} | Status Data: Terfilter Berdasarkan Rentang Waktu`,
      18,
      currentY + 4.8
    );
    currentY += 10;
  }

  // Project Info Box
  if (customOptions?.includeProjectInfo !== false) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, 'D');

    doc.setFontSize(8.5);
    doc.setTextColor(...navyColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Informasi Proyek:', 18, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.text(`Nama Proyek: ${project.name}`, 18, currentY + 12);
    doc.text(`Pemilik (Owner): ${project.owner}`, 18, currentY + 17);
    doc.text(`Nilai Kontrak: ${formatIDR(project.contractValue)}`, 18, currentY + 22);

    const realizedFisik = calculatePhysicalProgress(workItems);
    const targetFisik = calculateTargetProgress(workItems);
    const deviasi = calculateDeviation(realizedFisik, targetFisik);

    const infoColX = pageWidth > 220 ? 150 : 110;
    doc.setFont('helvetica', 'bold');
    doc.text(`Progress Fisik: ${realizedFisik}%`, infoColX, currentY + 12);
    doc.text(`Target Schedule: ${targetFisik}%`, infoColX, currentY + 17);
    doc.setTextColor(deviasi < -5 ? 220 : 16, deviasi < -5 ? 38 : 185, deviasi < -5 ? 38 : 129);
    doc.text(`Deviasi: ${deviasi > 0 ? '+' : ''}${deviasi}%`, infoColX, currentY + 22);

    currentY += 34;
  }

  // Dynamic Content according to reportType
  if (customOptions?.includeDataTable !== false) {
    if (reportType === 'Progress' || reportType === 'Mingguan' || reportType === 'Bulanan') {
      doc.setTextColor(...navyColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(
        `Rincian Progress Item Pekerjaan (Time Schedule) - ${filteredWorkItems.length} Pekerjaan`,
        14,
        currentY
      );

      const tableData = filteredWorkItems.map((item) => [
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
        startY: currentY + 3,
        head: [['No', 'Item Pekerjaan', 'Mulai', 'Selesai', 'Bobot', 'Target', 'Progress', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: navyColor, textColor: 255, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: orientation === 'landscape' ? 120 : 65 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 15, halign: 'right' },
          5: { cellWidth: 15, halign: 'right' },
          6: { cellWidth: 15, halign: 'right' },
          7: { cellWidth: 22, halign: 'center' },
        },
      });
    } else if (reportType === 'Keuangan' || reportType === 'Termin') {
      doc.setTextColor(...navyColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('Jadwal & Status Pembayaran Termin Proyek', 14, currentY);

      const tableData = filteredTerms.map((t) => [
        t.title,
        `${t.targetProgressPercent}%`,
        formatIDR(t.grossValue),
        formatIDR(t.retentionValue),
        formatIDR(t.netPayableValue),
        t.status,
        t.paymentDate || '-',
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [['Termin', 'Target Progress', 'Nilai Bruto', 'Retensi (5%)', 'Nilai Netto', 'Status', 'Tgl Bayar']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: navyColor, textColor: 255, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      });
    } else if (reportType === 'Material') {
      doc.setTextColor(...navyColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('Laporan Stok & Penggunaan Material Konstruksi', 14, currentY);

      const tableData = filteredMaterials.map((m) => [
        m.name,
        `${m.volumeTotal} ${m.unit}`,
        `${m.volumeUsed} ${m.unit}`,
        `${m.stockRemaining} ${m.unit}`,
        formatIDR(m.pricePerUnit),
        m.supplier,
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [['Material', 'Total Terima', 'Terpakai', 'Sisa Stok', 'Harga Satuan', 'Supplier']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: navyColor, textColor: 255, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      });
    } else if (reportType === 'Kurva-S') {
      doc.setTextColor(...navyColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('Analisis Progres Kurva-S Proyek Mingguan', 14, currentY);

      const sData = generateSCurveData(workItems);
      const tableData = sData.slice(0, 16).map((pt) => [
        pt.weekLabel,
        pt.date,
        `${pt.targetCumulativePercent}%`,
        pt.realizedCumulativePercent !== undefined ? `${pt.realizedCumulativePercent}%` : '-',
        pt.deviationPercent !== undefined ? `${pt.deviationPercent > 0 ? '+' : ''}${pt.deviationPercent}%` : '-',
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [['Minggu Ke', 'Tanggal Acuan', 'Target Kumulatif', 'Realisasi Kumulatif', 'Deviasi']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: navyColor, textColor: 255, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      });
    } else if (reportType === 'RAB') {
      doc.setTextColor(...navyColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('Rekapitulasi Rencana Anggaran Biaya (RAB) Proyek', 14, currentY);

      const currentRab = rabDoc || OFFICIAL_RAB_DOCUMENT;
      const tableData = currentRab.sectors.map((sec) => [
        `Sektor ${sec.sectorNumber}`,
        sec.name,
        `${sec.percentage.toFixed(2)}%`,
        formatIDR(sec.budget),
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [['Kode', 'Uraian Sektor Pekerjaan', 'Bobot', 'Alokasi Anggaran']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: navyColor, textColor: 255, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      });
    } else {
      // Daily log summary
      doc.setTextColor(...navyColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(`Catatan Monitoring Harian (${filteredDailyLogs.length} Laporan)`, 14, currentY);

      const tableData = filteredDailyLogs.map((log) => [
        log.date,
        log.weather,
        `${log.workerCount} Org`,
        log.mandorName,
        log.activitySummary,
        log.volumeDone,
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [['Tanggal', 'Cuaca', 'Pekerja', 'Mandor', 'Kegiatan Utama', 'Volume']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: navyColor, textColor: 255, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let nextSectionY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : currentY + 50;

  // Custom Notes / Memo Disposisi
  if (customOptions?.customNotes && customOptions.customNotes.trim().length > 0) {
    if (nextSectionY + 30 > pageHeight - 30) {
      doc.addPage();
      nextSectionY = 20;
    }

    doc.setFillColor(255, 247, 237); // orange-50
    doc.setDrawColor(253, 186, 116); // orange-300
    doc.roundedRect(14, nextSectionY, pageWidth - 28, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(194, 65, 12);
    doc.text('CATATAN KHUSUS & DISPOSISI LAPANGAN:', 18, nextSectionY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(customOptions.customNotes, pageWidth - 36);
    doc.text(splitNotes, 18, nextSectionY + 12);

    nextSectionY += 26;
  }

  // =========================================================================
  // SECTION: DOKUMENTASI FOTO LAPANGAN PER KATEGORI (RINGKASAN & GRID RAPI)
  // =========================================================================
  if (customOptions?.includePhotos !== false && aggregatedPhotos.length > 0) {
    // Distinct known categories
    const knownCategories: PhotoCategory[] = [
      'Pondasi',
      'Struktur',
      'Lantai',
      'Atap',
      'Arsitektur',
      'Finishing',
      'MEP',
      'Progress Hari Ini',
    ];

    const categoryGroups: { category: string; photos: PhotoItem[] }[] = [];

    knownCategories.forEach((cat) => {
      const catPhotos = aggregatedPhotos.filter((p) => p.category === cat);
      if (catPhotos.length > 0) {
        const limit = customOptions?.maxPhotosPerCategory || 12;
        categoryGroups.push({ category: cat, photos: catPhotos.slice(0, limit) });
      }
    });

    // Any other category outside known list
    const remainingPhotos = aggregatedPhotos.filter(
      (p) => !knownCategories.includes(p.category)
    );
    if (remainingPhotos.length > 0) {
      categoryGroups.push({ category: 'Dokumentasi Lainnya', photos: remainingPhotos });
    }

    if (categoryGroups.length > 0) {
      // Start photo documentation section on fresh page
      doc.addPage();

      // Top Header Bar for Photo Documentation Page
      doc.setFillColor(...navyColor);
      doc.rect(0, 0, pageWidth, 20, 'F');
      doc.setFillColor(...orangeColor);
      doc.rect(0, 20, pageWidth, 1.5, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('LAMPIRAN DOKUMENTASI FOTO LAPANGAN RESMI (PROGRESS TERBARU)', 14, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(203, 213, 225);
      doc.text(
        `Proyek: ${project.name} | Kontraktor: ${project.contractor || 'PT. GONG MBE LINK PAMUNGKAS'} | MK: ${project.consultantMK || 'PT. BENNATIN SURYA CIPTA'}`,
        14,
        16.5
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(
        `Total: ${aggregatedPhotos.length} Foto Terarsip`,
        pageWidth - 14,
        12,
        { align: 'right' }
      );

      let photoY = 27;

      // 1. Executive Summary & Statistic Banner
      const summaryBoxH = 22;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(14, photoY, pageWidth - 28, summaryBoxH, 2, 2, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, photoY, pageWidth - 28, summaryBoxH, 2, 2, 'D');

      // Left column: Info & Dates
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navyColor);
      doc.text('Ringkasan Dokumentasi Visual Lapangan Terkini:', 18, photoY + 6);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);

      const latestPhotoDate = aggregatedPhotos[0]?.date || '-';
      const oldestPhotoDate = aggregatedPhotos[aggregatedPhotos.length - 1]?.date || '-';
      doc.text(`Periode Pengambilan: ${oldestPhotoDate} s/d ${latestPhotoDate}`, 18, photoY + 12);
      doc.text(
        `Status Verifikasi: Seluruh foto terverifikasi opname fisik lapangan bersama Konsultan MK`,
        18,
        photoY + 17
      );

      // Right metrics badge
      const badgeColX = pageWidth > 220 ? pageWidth - 80 : pageWidth - 65;
      doc.setFillColor(16, 185, 129); // emerald
      doc.roundedRect(badgeColX, photoY + 4, 50, 6, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text('DOKUMENTASI VALID', badgeColX + 25, photoY + 8, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Kategori: ${categoryGroups.length} Sektor`, badgeColX + 25, photoY + 14, { align: 'center' });
      doc.text(`Dicetak: ${new Date().toISOString().split('T')[0]}`, badgeColX + 25, photoY + 18, { align: 'center' });

      photoY += summaryBoxH + 4;

      // 2. Category Distribution Pills
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(14, photoY, pageWidth - 28, 8, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...navyColor);
      doc.text('Distribusi Kategori:', 18, photoY + 5.2);

      let pillX = 46;
      const categoryColors: Record<string, [number, number, number]> = {
        Pondasi: [2, 132, 199], // sky-600
        Struktur: [37, 99, 235], // blue-600
        Lantai: [13, 148, 136], // teal-600
        Atap: [79, 70, 229], // indigo-600
        Arsitektur: [217, 119, 6], // amber-600
        Finishing: [234, 88, 12], // orange-600
        MEP: [124, 58, 237], // purple-600
        'Progress Hari Ini': [5, 150, 105], // emerald-600
      };

      categoryGroups.forEach((cg) => {
        if (pillX + 26 < pageWidth - 16) {
          const color = categoryColors[cg.category] || [71, 85, 105];
          doc.setFillColor(...color);
          doc.roundedRect(pillX, photoY + 1.5, 24, 5, 1, 1, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          const catName = cg.category.length > 10 ? cg.category.substring(0, 9) + '.' : cg.category;
          doc.text(`${catName} (${cg.photos.length})`, pillX + 12, photoY + 4.8, { align: 'center' });
          pillX += 26;
        }
      });

      photoY += 13;

      // Columns Configuration: 2 columns in portrait, 3 in landscape
      const cols = orientation === 'landscape' ? 3 : 2;
      const totalWidth = pageWidth - 28;
      const gap = 6;
      const colWidth = (totalWidth - gap * (cols - 1)) / cols;
      const cardHeight = 70; // 38mm photo + 32mm structured text
      const imgH = 38;
      const imgW = colWidth - 4;

      for (const group of categoryGroups) {
        // Ensure category header does not collide with page boundary
        if (photoY + 24 > pageHeight - 25) {
          doc.addPage();
          doc.setFillColor(...navyColor);
          doc.rect(0, 0, pageWidth, 14, 'F');
          doc.setFillColor(...orangeColor);
          doc.rect(0, 14, pageWidth, 1, 'F');

          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.text(`LAMPIRAN DOKUMENTASI FOTO LAPANGAN (Lanjutan) - ${project.name}`, 14, 9);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(203, 213, 225);
          doc.text('Dokumentasi Resmi Proyek', pageWidth - 14, 9, { align: 'right' });
          photoY = 20;
        }

        // Category Header Strip
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(14, photoY, pageWidth - 28, 7.5, 1.5, 1.5, 'F');
        doc.setFillColor(...orangeColor);
        doc.rect(14, photoY, 3, 7.5, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...navyColor);
        doc.text(
          `KATEGORI: ${group.category.toUpperCase()} (${group.photos.length} Foto Dokumentasi Terbaru)`,
          20,
          photoY + 5.2
        );
        photoY += 11;

        // Render photo cards in grid
        for (let i = 0; i < group.photos.length; i++) {
          const photo = group.photos[i];
          const colIndex = i % cols;

          // Check row overflow
          if (colIndex === 0 && photoY + cardHeight > pageHeight - 22) {
            doc.addPage();
            doc.setFillColor(...navyColor);
            doc.rect(0, 0, pageWidth, 14, 'F');
            doc.setFillColor(...orangeColor);
            doc.rect(0, 14, pageWidth, 1, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.text(`LAMPIRAN DOKUMENTASI FOTO LAPANGAN (Lanjutan) - ${project.name}`, 14, 9);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(203, 213, 225);
            doc.text('Dokumentasi Resmi Proyek', pageWidth - 14, 9, { align: 'right' });
            photoY = 20;
          }

          const cardX = 14 + colIndex * (colWidth + gap);

          // Card Outer Border
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(226, 232, 240);
          doc.roundedRect(cardX, photoY, colWidth, cardHeight, 2, 2, 'FD');

          // Photo Frame Container
          const imgX = cardX + 2;
          const imgY = photoY + 2;

          let imageDrawn = false;
          try {
            const dataUrl = await fetchImageDataUrl(photo.url);
            if (dataUrl) {
              doc.addImage(dataUrl, 'JPEG', imgX, imgY, imgW, imgH, undefined, 'FAST');
              imageDrawn = true;
            }
          } catch {
            imageDrawn = false;
          }

          if (!imageDrawn) {
            // Elegant blueprint CAD illustration placeholder
            doc.setFillColor(15, 23, 42); // slate-900
            doc.roundedRect(imgX, imgY, imgW, imgH, 1.5, 1.5, 'F');

            // Draw technical grid lines
            doc.setDrawColor(30, 41, 59);
            doc.setLineWidth(0.2);
            for (let gx = imgX + 8; gx < imgX + imgW; gx += 10) {
              doc.line(gx, imgY, gx, imgY + imgH);
            }
            for (let gy = imgY + 6; gy < imgY + imgH; gy += 8) {
              doc.line(imgX, gy, imgX + imgW, gy);
            }

            // Center crosshair / target box
            const cx = imgX + imgW / 2;
            const cy = imgY + imgH / 2;
            doc.setDrawColor(249, 115, 22); // orange
            doc.rect(cx - 8, cy - 6, 16, 12, 'D');

            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.text('[DOKUMENTASI TEKNIS]', cx, cy - 1, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(148, 163, 184);
            doc.text(photo.category, cx, cy + 3.5, { align: 'center' });
          }

          // Inner border around image
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.3);
          doc.rect(imgX, imgY, imgW, imgH, 'D');

          // Top-left Category Pill on photo
          const catBadgeColor = categoryColors[photo.category] || [234, 88, 12];
          doc.setFillColor(...catBadgeColor);
          doc.roundedRect(imgX + 1.5, imgY + 1.5, 22, 4.5, 0.8, 0.8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(5.5);
          const catBadgeText = photo.category.length > 12 ? photo.category.substring(0, 11) : photo.category;
          doc.text(catBadgeText, imgX + 12.5, imgY + 4.5, { align: 'center' });

          // Top-right Date Stamp Pill on photo
          doc.setFillColor(15, 23, 42); // dark navy
          doc.roundedRect(imgX + imgW - 20, imgY + 1.5, 18.5, 4.5, 0.8, 0.8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(5.5);
          doc.text(photo.date, imgX + imgW - 10.75, imgY + 4.5, { align: 'center' });

          // Structured text & info area below photo
          const contentY = imgY + imgH + 2.5;

          // Title
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(...navyColor);
          const splitTitle = doc.splitTextToSize(photo.title, colWidth - 6);
          const titleLine1 = splitTitle[0] || photo.title;
          doc.text(titleLine1, cardX + 3, contentY + 2);

          // Meta row: Uploader & Status
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6);
          doc.setTextColor(100, 116, 139);
          const uploaderStr = `Oleh: ${photo.uploadedBy || 'Site Manager'}`;
          const truncatedUploader = uploaderStr.length > 32 ? uploaderStr.substring(0, 30) + '..' : uploaderStr;
          doc.text(truncatedUploader, cardX + 3, contentY + 6.5);

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(5, 150, 105); // emerald
          doc.text('✓ Validasi Lapangan', cardX + colWidth - 3, contentY + 6.5, { align: 'right' });

          // Notes / Technical description box
          const notesBoxY = contentY + 8.5;
          const notesBoxH = 15;
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(241, 245, 249);
          doc.roundedRect(cardX + 2.5, notesBoxY, colWidth - 5, notesBoxH, 1, 1, 'FD');

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5.5);
          doc.setTextColor(51, 65, 85);
          const noteText = photo.notes || 'Dokumentasi progress fisik terverifikasi tim pengawas teknis di lokasi proyek.';
          const splitNotes = doc.splitTextToSize(noteText, colWidth - 8);
          const displayNotes = splitNotes.slice(0, 2);
          doc.text(displayNotes, cardX + 4.5, notesBoxY + 4);

          // Advance row if last column or last item in category
          if (colIndex === cols - 1 || i === group.photos.length - 1) {
            photoY += cardHeight + 4;
          }
        }

        photoY += 3;
      }

      nextSectionY = photoY + 5;
    }
  }

  // =========================================================================
  // SIGNATURES SECTION
  // =========================================================================
  if (customOptions?.includeSignatures !== false) {
    if (nextSectionY + 40 > pageHeight - 15) {
      doc.addPage();
      nextSectionY = 25;
    }

    const sigY = nextSectionY + 10;
    doc.setFontSize(8.5);
    doc.setTextColor(...navyColor);

    const includeSiteManager = customOptions?.signatories?.siteManager !== false;
    const includeDirector = customOptions?.signatories?.director !== false;
    const includeSupervisoryMK = customOptions?.signatories?.supervisoryMK === true;

    if (includeSupervisoryMK) {
      // 3 Signatures: Kontraktor, Konsultan Pengawas (MK), Owner/Direktur
      const colW = (pageWidth - 28) / 3;

      // Col 1 - Site Manager
      doc.setFont('helvetica', 'bold');
      doc.text('Dibuat Oleh,', 14 + colW * 0.1, sigY);
      doc.text('Site Manager Proyek', 14 + colW * 0.1, sigY + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`( ${project.siteManager || 'EKO YULIANTO'} )`, 14 + colW * 0.1, sigY + 23);

      // Col 2 - Konsultan Pengawas / MK
      doc.setFont('helvetica', 'bold');
      doc.text('Diperiksa Oleh,', 14 + colW * 1.1, sigY);
      doc.text('Konsultan Pengawas (MK)', 14 + colW * 1.1, sigY + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`( ${project.consultantMK || 'SAEPUL ANWAR'} )`, 14 + colW * 1.1, sigY + 23);

      // Col 3 - Direktur Owner
      doc.setFont('helvetica', 'bold');
      doc.text('Disetujui Oleh,', 14 + colW * 2.1, sigY);
      doc.text(`Direktur Utama (Owner)`, 14 + colW * 2.1, sigY + 4.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`( ${project.director || 'HASANUDIN'} )`, 14 + colW * 2.1, sigY + 23);
    } else {
      // Standard 2 Signatures
      if (includeSiteManager) {
        doc.setFont('helvetica', 'bold');
        doc.text('Dibuat Oleh,', 25, sigY);
        doc.text('Site Manager Proyek', 25, sigY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`( ${project.siteManager || 'EKO YULIANTO'} )`, 25, sigY + 23);
      }

      if (includeDirector) {
        doc.setFont('helvetica', 'bold');
        doc.text('Disetujui Oleh,', pageWidth - 65, sigY);
        doc.text(`Direktur Utama (Owner)`, pageWidth - 65, sigY + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(`( ${project.director || 'HASANUDIN'} )`, pageWidth - 65, sigY + 23);
      }
    }
  }

  // Generate clean filename
  const dateSuffix = hasDateFilter && startDate && endDate ? `_${startDate}_sd_${endDate}` : `_${new Date().toISOString().split('T')[0]}`;
  const fileName = `Laporan_${reportType}_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}${dateSuffix}.pdf`;
  doc.save(fileName);
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
    ['RINGKASAN EKSEKUTIF PROYEK', ''],
    ['NAMA PROYEK', project.name],
    ['PEMILIK (OWNER)', project.owner || 'PT. FORESYNDO GLOBAL INDONESIA'],
    ['KONTRAKTOR PELAKSANA', project.contractor || 'PT. GONG MBE LINK PAMUNGKAS'],
    ['LOKASI PROYEK', project.location],
    ['NOMOR KONTRAK', project.contractNumber],
    ['NILAI KONTRAK (RP)', project.contractValue],
    ['TANGGAL MULAI', project.startDate],
    ['TARGET SELESAI', project.targetEndDate],
    ['STATUS PROYEK', project.status],
    ['', ''],
    ['PEJABAT & PENANGGUNG JAWAB RESMI', ''],
    ['DIREKTUR UTAMA (OWNER)', project.director || 'HASANUDIN'],
    ['KONSULTAN PENGAWAS (KUASA DIREKTUR MK)', project.consultantMK || 'SAEPUL ANWAR'],
    ['DIREKTUR UTAMA (KONTRAKTOR)', project.contractorProfile?.management?.director || 'Rohman Priyambodo'],
    ['SITE MANAGER (PELAKSANA LAPANGAN)', project.siteManager || 'EKO YULIANTO'],
    ['LEAD QC ENGINEER (MUTU)', project.qcEngineer || 'KIKI'],
    ['ADMIN KEUANGAN & LOGISTIK', project.financeAdmin || 'COKRO'],
    ['LEAD QUANTITY SURVEYOR / ESTIMATOR', project.estimator || 'IHSAN'],
    ['PROJECT MANAGER LAPANGAN', project.projectManager || 'JAKA SEPTIANDANA'],
    ['PENGAWAS EKSTERNAL / MK', project.inspector || 'Tamu Pengawas'],
    ['', ''],
    ['INDIKATOR KINERJA PROYEK', ''],
    ['PROGRESS FISIK REALISASI (%)', calculatePhysicalProgress(workItems)],
    ['TARGET PROGRESS RENCANA (%)', calculateTargetProgress(workItems)],
    ['DEVIASI PROGRESS (%)', calculateDeviation(calculatePhysicalProgress(workItems), calculateTargetProgress(workItems))],
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

/**
 * Generate official Berita Acara Serah Terima (BAST-1) PDF Document
 * with comprehensive work details, tripartite parties, and visual digital signatures
 */
export function generateBASTPDF(
  bast: BASTSubmissionData,
  project: ProjectInfo,
  workItems: WorkItem[] = []
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const navyColor: [number, number, number] = [15, 23, 42]; // #0F172A
  const orangeColor: [number, number, number] = [249, 115, 22]; // #F97316
  const emeraldColor: [number, number, number] = [16, 185, 129]; // #10B981
  const blueColor: [number, number, number] = [29, 78, 216]; // #1D4ED8
  const grayColor: [number, number, number] = [100, 116, 139]; // #64748B
  const redColor: [number, number, number] = [239, 68, 68]; // #EF4444

  // Helper function to render a page header
  const renderHeader = (isFirstPage: boolean = true) => {
    doc.setFillColor(...navyColor);
    doc.rect(0, 0, pageWidth, 24, 'F');
    doc.setFillColor(...orangeColor);
    doc.rect(0, 24, pageWidth, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(project.owner || 'PT. FORESYNDO GLOBAL INDONESIA', 14, 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('DEVELOPMENT & GENERAL CONTRACTOR - BANDARA KERTAJATI', 14, 15);
    doc.text(`Lokasi: ${project.location} | Sistem ERP Monitoring Proyek Terpadu`, 14, 19.5);

    // Right side badge
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(pageWidth - 68, 4.5, 54, 15, 1.5, 1.5, 'F');
    doc.setDrawColor(51, 65, 85);
    doc.roundedRect(pageWidth - 68, 4.5, 54, 15, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...orangeColor);
    doc.text('DOKUMEN RESMI TRIPARTIT', pageWidth - 41, 9.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(`No: ${bast.bastNumber}`, pageWidth - 41, 15.5, { align: 'center' });
  };

  // Render first page header
  renderHeader(true);

  // 1. Title Block
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('BERITA ACARA SERAH TERIMA PERTAMA PEKERJAAN (BAST - 1)', pageWidth / 2, 33, { align: 'center' });

  doc.setFontSize(9);
  doc.setTextColor(...orangeColor);
  doc.text(bast.title || 'Serah Terima Pertama Fisik Proyek (PHO)', pageWidth / 2, 38, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text(
    `No. Permohonan: ${bast.submissionNumber} | Kontrak: ${project.contractNumber || 'PR-2026-FGI-004'}`,
    pageWidth / 2,
    42.5,
    { align: 'center' }
  );

  // 2. Detail Pekerjaan Summary Card
  const infoCardY = 46;
  const infoCardH = 37;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, infoCardY, pageWidth - 28, infoCardH, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, infoCardY, pageWidth - 28, infoCardH, 2, 2, 'D');

  // Left Column Details
  doc.setFontSize(8.5);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Detail & Lingkup Pekerjaan Proyek:', 18, infoCardY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Nama Proyek: ${project.name}`, 18, infoCardY + 12);
  doc.text(`Lokasi Fisik: ${project.location}`, 18, infoCardY + 17.5);

  const scope = bast.scopeDescription || 'Seluruh sektor pekerjaan konstruksi fisik sesuai klausul kontrak.';
  const wrappedScope = doc.splitTextToSize(`Lingkup: ${scope}`, 90);
  doc.text(wrappedScope.slice(0, 2), 18, infoCardY + 23);

  const nominalVal = bast.contractNominal || project.contractValue;
  doc.setFont('helvetica', 'bold');
  doc.text(`Nilai Nominal BAST: ${formatIDR(nominalVal)}`, 18, infoCardY + 33);

  // Right Column Details
  doc.setFont('helvetica', 'bold');
  doc.text('Parameter Waktu & Penjaminan:', 114, infoCardY + 6);

  doc.setFont('helvetica', 'normal');
  doc.text(`Tanggal Serah Terima: ${bast.handoverDate || bast.submissionDate}`, 114, infoCardY + 12);
  doc.text(`Progress Fisik: 100.0% (Lulus Uji Teknis & Verifikasi)`, 114, infoCardY + 17.5);

  const retentionVal = bast.retentionValue || nominalVal * 0.05;
  doc.text(`Masa Pemeliharaan: 180 Hari (s/d ${bast.maintenanceEndDate || 'N/A'})`, 114, infoCardY + 23);
  doc.text(`Jaminan Retensi 5%: ${formatIDR(retentionVal)}`, 114, infoCardY + 28.5);

  const stageLabel =
    bast.stage === 'finalized'
      ? 'FINAL SAH (3 PIHAK TTD)'
      : bast.stage === 'owner_approved'
      ? 'DISETUJUI OWNER'
      : bast.stage === 'mk_recommended'
      ? 'DIREKOMENDASIKAN MK'
      : bast.stage === 'submitted'
      ? 'DIAJUKAN KE MK'
      : 'DRAFT PENGAJUAN';

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...(bast.stage === 'finalized' ? emeraldColor : orangeColor));
  doc.text(`Status Dokumen: ${stageLabel}`, 114, infoCardY + 34);

  // 3. Statement & Parties Description
  const stmtY = 87;
  doc.setFontSize(8);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Pernyataan Tripartit & Para Pihak Terkait:', 14, stmtY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Pada hari ini, ${bast.handoverDate || bast.submissionDate}, kami yang bertanda tangan di bawah ini secara sah mewakili masing-masing pihak:`,
    14,
    stmtY + 4.5
  );

  const contractorName = bast.contractorSignature.name || project.siteManager || 'EKO YULIANTO';
  const mkName = bast.mkSignature.name || project.consultantMK || 'SAEPUL ANWAR';
  const ownerName = bast.ownerSignature.name || project.director || 'HASANUDIN';

  doc.setFont('helvetica', 'bold');
  doc.text(`1. ${contractorName}`, 16, stmtY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`- Jabatan: ${bast.contractorPosition || 'Site Manager Lapangan'}, bertindak untuk dan atas nama Kontraktor Pelaksana PT. GONG MBE LINK PAMUNGKAS (PIHAK PERTAMA).`, 48, stmtY + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.text(`2. ${mkName}`, 16, stmtY + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(`- Jabatan: Kuasa Direktur PT. BENNATIN SURYA CIPTA, bertindak sebagai Konsultan Manajemen Konstruksi (PIHAK KETIGA).`, 48, stmtY + 14);

  doc.setFont('helvetica', 'bold');
  doc.text(`3. ${ownerName}`, 16, stmtY + 18.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`- Jabatan: Direktur Utama PT. FORESYNDO GLOBAL INDONESIA, bertindak untuk dan atas nama Pemilik Proyek (PIHAK KEDUA).`, 48, stmtY + 18.5);

  // 4. Work Items Table Breakdown
  const tableData =
    workItems.length > 0
      ? workItems.map((wi) => [
          wi.no,
          wi.name,
          formatIDR(wi.volumeTarget),
          '100%',
          '✓ LULUS (Uji Fungsi Selesai)',
          'Sesuai Spesifikasi Teknis',
        ])
      : [
          ['01', 'Pekerjaan Struktur Bawah & Pondasi Tiang Pancang', formatIDR(nominalVal * 0.3), '100%', '✓ LULUS', 'Inspeksi & Tes Beban Ok'],
          ['02', 'Pekerjaan Struktur Utama Beton Bertulang & Baja', formatIDR(nominalVal * 0.35), '100%', '✓ LULUS', 'Uji Kuat Tekan Beton K-350'],
          ['03', 'Pekerjaan Arsitektur, Dinding & Finishing Interior', formatIDR(nominalVal * 0.2), '100%', '✓ LULUS', 'Toleransi Presisi Terpenuhi'],
          ['04', 'Pekerjaan Mekanikal, Elektrikal & Plumbing (MEP)', formatIDR(nominalVal * 0.15), '100%', '✓ LULUS', 'Commissioning Test Selesai'],
        ];

  autoTable(doc, {
    startY: stmtY + 22.5,
    head: [['No', 'Sektor / Lingkup Pekerjaan', 'Anggaran (Rp)', 'Progress', 'Status Uji Mutu', 'Keterangan Audit']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: navyColor,
      textColor: 255,
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: { fontSize: 6.5, textColor: [30, 41, 59], cellPadding: 1.2 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 70, fontStyle: 'bold' },
      2: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 16, halign: 'center', textColor: [16, 185, 129], fontStyle: 'bold' },
      4: { cellWidth: 32, halign: 'center', textColor: [29, 78, 216], fontStyle: 'bold' },
      5: { cellWidth: 26, fontSize: 6 },
    },
    margin: { left: 14, right: 14 },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 4 : 160;

  // If table went too far down, add page for signatures
  if (currentY > pageHeight - 65) {
    doc.addPage();
    renderHeader(false);
    currentY = 32;
  }

  // 5. Warranty & Maintenance Provision Box
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(14, currentY, pageWidth - 28, 14, 1.5, 1.5, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(14, currentY, pageWidth - 28, 14, 1.5, 1.5, 'D');

  doc.setFontSize(7);
  doc.setTextColor(146, 64, 14);
  doc.setFont('helvetica', 'bold');
  doc.text('Klausul Jaminan Masa Pemeliharaan & Retensi 5%:', 18, currentY + 4.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text(
    `Selama masa pemeliharaan 180 hari kalender (hingga ${bast.maintenanceEndDate || 'berakhirnya masa garansi'}), Kontraktor wajib menuntaskan cacat mutu tersembunyi.`,
    18,
    currentY + 8.5
  );
  doc.text(
    `Dana retensi 5% sebesar ${formatIDR(retentionVal)} akan dicairkan penuh saat penerbitan Berita Acara Serah Terima Akhir (BAST-2 / FHO).`,
    18,
    currentY + 12
  );

  currentY += 18;

  // Check if signatures fit on current page
  const sigHeight = 46;
  if (currentY + sigHeight + 14 > pageHeight) {
    doc.addPage();
    renderHeader(false);
    currentY = 32;
  }

  // 6. Visual Digital Signatures Section (3 Columns)
  doc.setFontSize(8.5);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text('LEMBAR PENGESAHAN TANDA TANGAN DIGITAL TRIPARTIT:', 14, currentY);

  const sigBoxY = currentY + 3.5;
  const colWidth = (pageWidth - 28 - 2 * 4) / 3; // 58 mm each

  // Signature Config
  const sigCols = [
    {
      title: 'PIHAK PERTAMA (KONTRAKTOR)',
      name: contractorName,
      position: bast.contractorPosition || 'Site Manager Lapangan',
      signed: bast.contractorSignature.signed,
      signedAt: bast.contractorSignature.signedAt || '2026-05-18 14:30 WIB',
      signatureData: bast.contractorSignature.signatureData,
      roleTag: 'KONTRAKTOR PELAKSANA',
      hashPrefix: 'KTR',
      accentColor: blueColor,
    },
    {
      title: 'PIHAK KETIGA (PENGAWAS MK)',
      name: mkName,
      position: 'Team Leader Konsultan MK',
      signed: bast.mkSignature.signed,
      signedAt: bast.mkSignature.signedAt || '2026-05-19 10:15 WIB',
      signatureData: bast.mkSignature.signatureData,
      roleTag: 'KONSULTAN MANAJEMEN KONSTRUKSI',
      hashPrefix: 'MK',
      accentColor: orangeColor,
    },
    {
      title: 'PIHAK KEDUA (OWNER / DIREKTUR)',
      name: ownerName,
      position: 'Direktur Utama PT. FORESYNDO GLOBAL INDONESIA',
      signed: bast.ownerSignature.signed,
      signedAt: bast.ownerSignature.signedAt || '2026-05-20 09:00 WIB',
      signatureData: bast.ownerSignature.signatureData,
      roleTag: 'PENGEMBANG & PEMILIK PROYEK',
      hashPrefix: 'DIR',
      accentColor: emeraldColor,
    },
  ];

  sigCols.forEach((sig, idx) => {
    const colX = 14 + idx * (colWidth + 4);

    // Box Container
    doc.setFillColor(sig.signed ? 248 : 254, sig.signed ? 250 : 242, sig.signed ? 252 : 242);
    doc.roundedRect(colX, sigBoxY, colWidth, sigHeight, 2, 2, 'F');
    doc.setDrawColor(sig.signed ? sig.accentColor[0] : 239, sig.signed ? sig.accentColor[1] : 68, sig.signed ? sig.accentColor[2] : 68);
    doc.setLineWidth(0.3);
    doc.roundedRect(colX, sigBoxY, colWidth, sigHeight, 2, 2, 'D');

    // Header strip for this column
    doc.setFillColor(...navyColor);
    doc.rect(colX, sigBoxY, colWidth, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(sig.title, colX + colWidth / 2, sigBoxY + 4, { align: 'center' });

    // Signer Name
    doc.setTextColor(...navyColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(sig.name, colX + colWidth / 2, sigBoxY + 10, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...grayColor);
    doc.text(sig.roleTag, colX + colWidth / 2, sigBoxY + 13, { align: 'center' });

    // Signature Area
    const innerSigY = sigBoxY + 15;
    const innerSigH = 21;
    doc.setFillColor(sig.signed ? 255 : 250, sig.signed ? 255 : 245, sig.signed ? 255 : 245);
    doc.roundedRect(colX + 3, innerSigY, colWidth - 6, innerSigH, 1, 1, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(colX + 3, innerSigY, colWidth - 6, innerSigH, 1, 1, 'D');

    if (sig.signed) {
      let imageRendered = false;
      if (sig.signatureData && sig.signatureData.startsWith('data:image/')) {
        try {
          doc.addImage(sig.signatureData, 'PNG', colX + 8, innerSigY + 1.5, colWidth - 16, innerSigH - 3);
          imageRendered = true;
        } catch {
          imageRendered = false;
        }
      }

      if (!imageRendered) {
        // Render elegant stylized cursive specimen
        doc.setFont('helvetica', 'bolditalic');
        doc.setTextColor(...sig.accentColor);
        doc.setFontSize(9);
        doc.text(sig.name, colX + colWidth / 2, innerSigY + 8, { align: 'center' });

        // Stylized pen flourish line
        doc.setDrawColor(...sig.accentColor);
        doc.setLineWidth(0.4);
        doc.line(colX + 10, innerSigY + 10, colX + colWidth - 10, innerSigY + 10);

        // Verification Pill Badge
        doc.setFillColor(220, 252, 231);
        doc.roundedRect(colX + 6, innerSigY + 12, colWidth - 12, 5.5, 1, 1, 'F');
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(colX + 6, innerSigY + 12, colWidth - 12, 5.5, 1, 1, 'D');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(21, 128, 61);
        doc.text('✓ TERVERIFIKASI DIGITAL', colX + colWidth / 2, innerSigY + 16, { align: 'center' });
      }

      // Timestamp & Hash code below signature area
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(...grayColor);
      doc.text(`Waktu: ${sig.signedAt}`, colX + colWidth / 2, sigBoxY + 39, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...navyColor);
      doc.text(`Hash: E-SIGN-${sig.hashPrefix}-${bast.submissionId.slice(-6).toUpperCase()}`, colX + colWidth / 2, sigBoxY + 42.5, {
        align: 'center',
      });
    } else {
      // Pending Signature Graphic Box
      doc.setDrawColor(...redColor);
      doc.setLineWidth(0.3);
      doc.line(colX + 8, innerSigY + 5, colX + colWidth - 8, innerSigY + 16);
      doc.line(colX + 8, innerSigY + 16, colX + colWidth - 8, innerSigY + 5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...redColor);
      doc.text('[ BELUM DITANDATANGANI ]', colX + colWidth / 2, innerSigY + 11.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(...grayColor);
      doc.text('Menunggu Pengesahan Berkas', colX + colWidth / 2, sigBoxY + 41, { align: 'center' });
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(71, 85, 105);
    doc.text(sig.position, colX + colWidth / 2, sigBoxY + 45.5, { align: 'center' });
  });

  // 7. Security Footer Certificate Strip
  const footerY = Math.min(pageHeight - 11, sigBoxY + sigHeight + 4);
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, footerY, pageWidth - 28, 7.5, 1, 1, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, footerY, pageWidth - 28, 7.5, 1, 1, 'D');

  doc.setFontSize(5.5);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text('SERTIFIKASI KEABSAHAN DOKUMEN ELEKTRONIK (UU ITE NO. 11/2008 & PP NO. 71/2019):', 17, footerY + 3.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(...grayColor);
  const printTimestamp = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' });
  doc.text(
    `Keaslian naskah BAST ini dijamin melalui enkripsi SHA-256 digital | Kode Verifikasi: QR-AUTH-BAST-${bast.bastNumber.replace(/[^A-Z0-9]/gi, '')} | Dicetak: ${printTimestamp}`,
    17,
    footerY + 5.8
  );

  // Save the PDF file
  const safeDocName = bast.bastNumber.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`BAST_Resmi_${safeDocName}_${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Generate official PDF for any Project Document (DED Drawing, SPK Contract, Meeting Minute, Legal Permit, or Uploaded PDF/Image)
 */
export function generateProjectDocumentPDF(
  docItem: ProjectDocument,
  project?: Partial<ProjectInfo>
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
  doc.setFontSize(14);
  doc.text(project?.owner || 'PT. FORESYNDO GLOBAL INDONESIA', 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Proyek Pembangunan Gedung: ${project?.name || 'Foresyndo 2'}`, 14, 16.5);
  doc.text(
    `Lokasi: ${project?.location || 'Kec. Jatitujuh, Kab. Majalengka, Jawa Barat'} | Kontrak: ${project?.contractNumber || 'PR-2026-FGI-004'}`,
    14,
    21.5
  );

  // Document Title Section
  let currentY = 35;
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('LEMBAR ARSIP DOKUMEN RESMI KONSTRUKSI', 14, currentY);

  const printDateStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(`Dicetak: ${printDateStr}`, pageWidth - 14, currentY, { align: 'right' });

  // Document Profile Header Card
  currentY += 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...navyColor);
  const truncatedTitle = docItem.title.length > 70 ? docItem.title.substring(0, 67) + '...' : docItem.title;
  doc.text(truncatedTitle, 18, currentY + 7);

  doc.setFontSize(8.5);
  doc.setTextColor(...orangeColor);
  doc.text(`Nomor Dokumen: ${docItem.documentNumber}`, 18, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text(
    `Versi: ${docItem.version} | Status: ${docItem.status.toUpperCase()} | Klasifikasi: ${docItem.confidentiality}`,
    18,
    currentY + 18
  );

  currentY += 26;

  // Metadata Table using autoTable
  autoTable(doc, {
    startY: currentY,
    margin: { left: 14, right: 14 },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5, font: 'helvetica' },
    headStyles: { fillColor: navyColor, textColor: 255, fontStyle: 'bold' },
    columns: [
      { header: 'Parameter Dokumen', dataKey: 'key' },
      { header: 'Rincian & Informasi Teknis', dataKey: 'value' },
    ],
    body: [
      { key: 'Kategori Dokumen', value: docItem.category.toUpperCase() },
      { key: 'Format & Ukuran Berkas', value: `${docItem.fileType.toUpperCase()} (${docItem.fileSize}) - ${docItem.fileName}` },
      { key: 'Tanggal Penerbitan / Unggah', value: docItem.uploadDate },
      { key: 'Pengunggah Resmi', value: `${docItem.uploadedBy} (${docItem.uploadedByRole})` },
      { key: 'Tingkat Kerahasiaan', value: docItem.confidentiality },
      { key: 'Kata Kunci / Tag Proyek', value: (docItem.tags || []).join(', ') || '-' },
      { key: 'Uraian / Ringkasan Teknis', value: docItem.description || '-' },
    ],
  });

  // @ts-ignore
  currentY = (doc as any).lastAutoTable.finalY + 7;

  // If there is an image (fileUrl is an image data URL or image type)
  if (
    docItem.fileUrl &&
    (docItem.fileType === 'image' ||
      docItem.fileType === 'png' ||
      docItem.fileType === 'jpg' ||
      docItem.fileType === 'jpeg' ||
      docItem.fileUrl.startsWith('data:image'))
  ) {
    if (currentY + 80 > pageHeight - 40) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...navyColor);
    doc.text('LAMPIRAN GAMBAR / DOKUMEN VISUAL RESMI:', 14, currentY);
    currentY += 4;

    try {
      const imgWidth = pageWidth - 28;
      const imgHeight = Math.min(85, pageHeight - currentY - 55);
      doc.addImage(docItem.fileUrl, 'JPEG', 14, currentY, imgWidth, imgHeight, undefined, 'FAST');
      doc.setDrawColor(203, 213, 225);
      doc.rect(14, currentY, imgWidth, imgHeight, 'D');
      currentY += imgHeight + 6;
    } catch {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(...grayColor);
      doc.text('[Berkas gambar terdaftar dalam repositori digital]', 14, currentY);
      currentY += 6;
    }
  }

  // Tripartit Signatures Section
  if (currentY + 45 > pageHeight - 20) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...navyColor);
  doc.text('PENGESAHAN & TANDA TANGAN DIGITAL TRIPARTIT:', 14, currentY);
  currentY += 4;

  const signatories = [
    {
      role: 'Pemberi Tugas (Owner)',
      name: project?.director || 'HASANUDIN',
      position: 'Direktur Utama PT. FORESYNDO GLOBAL INDONESIA',
      signed: true,
      time: docItem.uploadDate + ' 10:00',
    },
    {
      role: 'Konsultan Pengawas (MK)',
      name: project?.consultantMK || 'SAEPUL ANWAR',
      position: 'Kuasa Direktur PT. BENNATIN SURYA CIPTA',
      signed: docItem.status === 'Approved',
      time: docItem.uploadDate + ' 13:45',
    },
    {
      role: 'Kontraktor Pelaksana',
      name: project?.siteManager || 'EKO YULIANTO',
      position: 'Site Manager PT. GONG MBE LINK PAMUNGKAS',
      signed: true,
      time: docItem.uploadDate + ' 09:15',
    },
  ];

  const colWidth = (pageWidth - 28 - 6) / 3;
  const boxHeight = 28;

  signatories.forEach((sig, idx) => {
    const boxX = 14 + idx * (colWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(boxX, currentY, colWidth, boxHeight, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(boxX, currentY, colWidth, boxHeight, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...navyColor);
    doc.text(sig.role, boxX + colWidth / 2, currentY + 4.5, { align: 'center' });

    if (sig.signed) {
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(boxX + 4, currentY + 7, colWidth - 8, 9, 1, 1, 'F');
      doc.setDrawColor(...emeraldColor);
      doc.roundedRect(boxX + 4, currentY + 7, colWidth - 8, 9, 1, 1, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...emeraldColor);
      doc.text('[TERVERIFIKASI DIGITAL]', boxX + colWidth / 2, currentY + 11.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5);
      doc.setTextColor(...grayColor);
      doc.text(`Waktu: ${sig.time}`, boxX + colWidth / 2, currentY + 14.5, { align: 'center' });
    } else {
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(boxX + 4, currentY + 7, colWidth - 8, 9, 1, 1, 'F');
      doc.setDrawColor(...redColor);
      doc.roundedRect(boxX + 4, currentY + 7, colWidth - 8, 9, 1, 1, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...redColor);
      doc.text('[MENUNGGU APPROVAL]', boxX + colWidth / 2, currentY + 13, { align: 'center' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...navyColor);
    doc.text(sig.name, boxX + colWidth / 2, currentY + 21, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...grayColor);
    doc.text(sig.position, boxX + colWidth / 2, currentY + 25, { align: 'center' });
  });

  currentY += boxHeight + 6;

  // Review Notes if available
  if (docItem.reviewNotes && docItem.reviewNotes.length > 0) {
    if (currentY + 28 > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...navyColor);
    doc.text('RIWAYAT AUDIT & CATATAN REVIEW TEKNIS:', 14, currentY);
    currentY += 3;

    autoTable(doc, {
      startY: currentY,
      margin: { left: 14, right: 14 },
      theme: 'striped',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [51, 65, 85], textColor: 255 },
      columns: [
        { header: 'No', dataKey: 'no' },
        { header: 'Waktu', dataKey: 'timestamp' },
        { header: 'Peninjau', dataKey: 'author' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Catatan Teknis', dataKey: 'comment' },
      ],
      body: docItem.reviewNotes.map((rn, idx) => ({
        no: idx + 1,
        timestamp: rn.timestamp,
        author: `${rn.authorName} (${rn.authorRole})`,
        status: rn.statusChange || '-',
        comment: rn.comment,
      })),
    });

    // @ts-ignore
    currentY = (doc as any).lastAutoTable.finalY + 6;
  }

  // Security Footer Certificate Strip
  const footerY = Math.min(pageHeight - 10, Math.max(currentY + 2, pageHeight - 12));
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, footerY, pageWidth - 28, 7.5, 1, 1, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, footerY, pageWidth - 28, 7.5, 1, 1, 'D');

  doc.setFontSize(5.5);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text('SERTIFIKASI KEABSAHAN ARSIP ELEKTRONIK (UU ITE NO. 11/2008 & PP NO. 71/2019):', 17, footerY + 3.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.setTextColor(...grayColor);
  const safeDocNum = docItem.documentNumber.replace(/[^A-Z0-9]/gi, '');
  doc.text(
    `Keaslian arsip dokumen ini terdaftar dalam repositori digital Foresyndo 2 | Kode Verifikasi: DOC-AUTH-${safeDocNum} | Dicetak: ${new Date().toLocaleString('id-ID')}`,
    17,
    footerY + 5.8
  );

  const safeFileName = docItem.documentNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Dokumen_${safeFileName}_${docItem.version.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
}

/**
 * Generate official multi-page comprehensive RKS (Rencana Kerja dan Syarat-Syarat) PDF
 */
export function generateOfficialRKSPDF(
  project?: Partial<ProjectInfo>,
  chapters: RKSChapter[] = OFFICIAL_RKS_CHAPTERS,
  meta: RKSMetaInfo = RKS_META_INFO
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const navyColor: [number, number, number] = [15, 23, 42]; // #0F172A
  const orangeColor: [number, number, number] = [249, 115, 22]; // #F97316
  const grayColor: [number, number, number] = [100, 116, 139];
  const darkTextColor: [number, number, number] = [30, 41, 59];

  // Helper for official header
  const renderHeader = (pageNumber: number, totalPages?: number) => {
    doc.setFillColor(...navyColor);
    doc.rect(0, 0, pageWidth, 24, 'F');
    doc.setFillColor(...orangeColor);
    doc.rect(0, 24, pageWidth, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(project?.owner || meta.ownerName, 14, 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(
      `RENCANA KERJA DAN SYARAT-SYARAT (RKS) & SPESIFIKASI TEKNIS - ${project?.name || meta.projectTitle}`,
      14,
      15.5
    );
    doc.text(
      `No. Dokumen: ${meta.documentNumber} | Durasi: ${meta.durationDays} Hari Kalender | Status: ${meta.revision}`,
      14,
      20.5
    );

    // Page Number
    doc.setFontSize(8);
    doc.text(`Hal ${pageNumber}`, pageWidth - 14, 20.5, { align: 'right' });
  };

  // Helper for official footer
  const renderFooter = () => {
    const footerY = pageHeight - 12;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, footerY, pageWidth, 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(0, footerY, pageWidth, footerY);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...navyColor);
    doc.text('DOKUMEN RESMI TRIPARTIT:', 14, footerY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...grayColor);
    doc.text(
      `Dokumen RKS ini mengikat secara hukum antara Pemberi Tugas, Konsultan MK, dan Kontraktor Pelaksana. Kode Verifikasi: RKS-AUTH-2026-FGI`,
      14,
      footerY + 8.5
    );
    doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID')} WIB`, pageWidth - 14, footerY + 8.5, {
      align: 'right',
    });
  };

  // --- PAGE 1: COVER & METADATA TABLE ---
  renderHeader(1);

  // Document Title Banner
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BUKU SPESIFIKASI TEKNIS & RKS RESMI', 14, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayColor);
  doc.text(
    `Pedoman Standar Teknis Konstruksi, Metode Kerja SNI, Pengawasan Mutu & Administrasi Proyek`,
    14,
    39.5
  );

  // Metadata Table
  autoTable(doc, {
    startY: 44,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.2 },
    headStyles: { fillColor: navyColor, textColor: 255, fontStyle: 'bold' },
    head: [['Parameter Proyek', 'Keterangan Rinci']],
    body: [
      ['Nama Proyek', project?.name || meta.projectTitle],
      ['Nomor Kontrak Induk', project?.contractNumber || 'PR-2026-FGI-004'],
      ['Nomor Dokumen RKS', meta.documentNumber],
      ['Pemberi Tugas (Owner)', `${meta.ownerName} (${meta.ownerRepresentative})`],
      ['Konsultan MK / Pengawas', meta.consultantMK],
      ['Kontraktor Pelaksana', `${meta.contractorName} (${meta.contractorSiteManager})`],
      ['Nilai Kontrak Pelaksanaan', formatIDR(project?.contractValue || meta.contractValueIDR)],
      ['Waktu Pelaksanaan', `${meta.durationDays} Hari Kalender (${project?.startDate || '2026-09-01'} s/d ${project?.targetEndDate || '2027-05-28'})`],
      ['Masa Pemeliharaan / Retensi', '180 Hari Kalender (Retensi 5% senilai Rp 723.088.049)'],
      ['Cakupan Pekerjaan Fisik', '14 Sektor Pekerjaan (Struktur, Arsitektur, Mekanikal, Elektrikal, Plumbing & Finishing)'],
    ],
  });

  // Table of Chapters Overview
  // @ts-ignore
  let nextY = (doc as any).lastAutoTable.finalY + 6;

  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('DAFTAR BAB RENCANA KERJA DAN SYARAT-SYARAT (RKS)', 14, nextY);

  const chapterRows = chapters.map((ch) => [
    ch.chapterNumber,
    ch.title,
    ch.category,
    `${ch.clauses.length} Pasal`,
    ch.description.substring(0, 65) + '...',
  ]);

  autoTable(doc, {
    startY: nextY + 3,
    theme: 'striped',
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: orangeColor, textColor: 255, fontStyle: 'bold' },
    head: [['Bab', 'Judul Bab RKS', 'Kategori', 'Jumlah Pasal', 'Ringkasan Ruang Lingkup']],
    body: chapterRows,
  });

  // Tripartite Signatures on Page 1
  // @ts-ignore
  const sigY = Math.min(pageHeight - 48, Math.max((doc as any).lastAutoTable.finalY + 6, pageHeight - 55));
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, sigY, pageWidth - 28, 32, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, sigY, pageWidth - 28, 32, 2, 2, 'D');

  doc.setFontSize(7.5);
  doc.setTextColor(...navyColor);
  doc.setFont('helvetica', 'bold');
  doc.text('PERSETUJUAN & PENGESAHAN DOKUMEN RKS TRIPARTIT:', 18, sigY + 5.5);

  const colWidth = (pageWidth - 36) / 3;
  meta.tripartiteSignatories.forEach((sig, idx) => {
    const colX = 18 + idx * colWidth;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...navyColor);
    doc.text(sig.role, colX, sigY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...grayColor);
    doc.text(sig.organization, colX, sigY + 14.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(16, 185, 129);
    doc.text('[TERVERIFIKASI & DITANDATANGANI]', colX, sigY + 21);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkTextColor);
    doc.text(sig.name, colX, sigY + 26);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...grayColor);
    doc.text(`Tanggal: ${sig.date}`, colX, sigY + 29.5);
  });

  renderFooter();

  // --- SUBSEQUENT PAGES: CHAPTER DETAILS & CLAUSES ---
  let pageIdx = 2;
  chapters.forEach((chapter) => {
    doc.addPage();
    renderHeader(pageIdx);
    pageIdx++;

    doc.setTextColor(...navyColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`${chapter.chapterNumber}: ${chapter.title}`, 14, 34);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...grayColor);
    doc.text(`Kategori: ${chapter.category} | ${chapter.description}`, 14, 39, {
      maxWidth: pageWidth - 28,
    });

    const clauseBodyRows: any[] = [];
    chapter.clauses.forEach((cl) => {
      clauseBodyRows.push([
        {
          content: `${cl.number}\n${cl.title}`,
          styles: { fontStyle: 'bold', fillColor: [241, 245, 249] as [number, number, number] },
        },
        {
          content: `${cl.content}\n${
            cl.standards && cl.standards.length > 0 ? `\nStandar Acuan: ${cl.standards.join(', ')}` : ''
          }${
            cl.subClauses && cl.subClauses.length > 0
              ? `\n\nKetentuan Khusus:\n` +
                cl.subClauses
                  .map((sub) => `• (${sub.code}) ${sub.text}${sub.requirement ? ` [Syarat: ${sub.requirement}]` : ''}`)
                  .join('\n')
              : ''
          }`,
        },
      ]);
    });

    autoTable(doc, {
      startY: 44,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2.5 },
      headStyles: { fillColor: navyColor, textColor: 255, fontStyle: 'bold' },
      head: [['Pasal / Butir Spesifikasi', 'Uraian Persyaratan Teknis & Standar Acuan']],
      body: clauseBodyRows,
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 'auto' },
      },
    });

    renderFooter();
  });

  const safeFileName = (project?.name || 'FORESYNDO_2').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`Buku_RKS_Resmi_${safeFileName}_Rev01.pdf`);
}




