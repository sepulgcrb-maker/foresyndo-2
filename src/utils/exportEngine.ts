import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ProjectInfo, WorkItem, PaymentTerm, DailyLog, MaterialItem } from '../types';
import { formatIDR, calculatePhysicalProgress, calculateTargetProgress, calculateDeviation } from './calculations';

/**
 * Generate PDF Report with official PT. FORESYNDO GLOBAL INDONESIA letterhead
 */
export function generatePDFReport(
  reportType: 'Harian' | 'Mingguan' | 'Bulanan' | 'Progress' | 'Termin' | 'Material' | 'Keuangan',
  project: ProjectInfo,
  workItems: WorkItem[],
  terms: PaymentTerm[],
  dailyLogs: DailyLog[],
  materials: MaterialItem[]
) {
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

  let startY = 80;

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
  } else if (reportType === 'Termin' || reportType === 'Keuangan') {
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
  reportType: 'Harian' | 'Mingguan' | 'Bulanan' | 'Progress' | 'Termin' | 'Material' | 'Keuangan',
  project: ProjectInfo,
  workItems: WorkItem[],
  terms: PaymentTerm[],
  dailyLogs: DailyLog[],
  materials: MaterialItem[]
) {
  const wb = XLSX.utils.book_new();

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
