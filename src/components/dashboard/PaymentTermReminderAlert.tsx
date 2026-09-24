import React, { useState, useMemo, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  ChevronRight,
  ExternalLink,
  Send,
  Sparkles,
  ArrowUpRight,
  FileCheck2,
  ShieldCheck,
  Percent,
  Wallet,
  X,
  Share2,
  MessageSquare,
  Mail,
  Edit3,
  Check,
} from 'lucide-react';
import { PaymentTerm, ProjectInfo, UserRole, NotificationItem } from '../../types';
import { ActiveTab } from '../layout/Sidebar';
import { formatIDR } from '../../utils/calculations';

interface PaymentTermReminderAlertProps {
  project: ProjectInfo;
  paymentTerms: PaymentTerm[];
  physicalProgress: number;
  currentRole?: UserRole;
  onNavigateTab: (tab: ActiveTab) => void;
  onAddNotification?: (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => void;
  onAddAuditLog?: (action: string, details: string) => void;
  darkMode?: boolean;
}

interface TerminDueAnalysis {
  term: PaymentTerm;
  dueDate: string;
  diffDays: number;
  urgency: 'overdue' | 'today' | 'critical' | 'upcoming' | 'normal' | 'paid';
  urgencyLabel: string;
  isPhysicalReady: boolean;
  progressGap: number;
}

export const PaymentTermReminderAlert: React.FC<PaymentTermReminderAlertProps> = ({
  project,
  paymentTerms,
  physicalProgress,
  currentRole = 'Direktur',
  onNavigateTab,
  onAddNotification,
  onAddAuditLog,
  darkMode = false,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedTermForShare, setSelectedTermForShare] = useState<PaymentTerm | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [hasAutoNotified, setHasAutoNotified] = useState(false);

  // Today reference date (matching project timeline / system date)
  const today = useMemo(() => {
    // Standardize to project date reference
    return new Date();
  }, []);

  // Analysis of all payment terms with their due dates & urgency
  const termsAnalysis = useMemo<TerminDueAnalysis[]>(() => {
    return paymentTerms.map((term) => {
      // Determine due date fallback if not set
      let effectiveDueDate = term.dueDate || term.paymentDate;
      if (!effectiveDueDate) {
        if (term.termNumber === 1) effectiveDueDate = '2026-09-30';
        else if (term.termNumber === 2) effectiveDueDate = '2026-11-15';
        else if (term.termNumber === 3) effectiveDueDate = '2027-01-10';
        else if (term.termNumber === 4) effectiveDueDate = '2027-03-31';
        else if (term.termNumber === 5) effectiveDueDate = '2027-06-30';
        else effectiveDueDate = '2026-12-31';
      }

      if (term.status === 'Dibayar') {
        return {
          term,
          dueDate: effectiveDueDate,
          diffDays: 0,
          urgency: 'paid',
          urgencyLabel: 'Lunas & Dicairkan',
          isPhysicalReady: true,
          progressGap: 0,
        };
      }

      // Calculate difference in days
      const dueObj = new Date(effectiveDueDate);
      // Reset hours to start of day for clean diff
      const dueTime = new Date(dueObj.getFullYear(), dueObj.getMonth(), dueObj.getDate()).getTime();
      const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const diffTime = dueTime - todayTime;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const isPhysicalReady = physicalProgress >= term.targetProgressPercent;
      const progressGap = Number((term.targetProgressPercent - physicalProgress).toFixed(2));

      let urgency: TerminDueAnalysis['urgency'] = 'normal';
      let urgencyLabel = `Jatuh tempo ${diffDays} hari lagi`;

      if (diffDays < 0) {
        urgency = 'overdue';
        urgencyLabel = `Lewat jatuh tempo ${Math.abs(diffDays)} hari`;
      } else if (diffDays === 0) {
        urgency = 'today';
        urgencyLabel = 'Jatuh tempo hari ini!';
      } else if (diffDays <= 7) {
        urgency = 'critical';
        urgencyLabel = `Mendekati jatuh tempo (H-${diffDays} hari)`;
      } else if (diffDays <= 14) {
        urgency = 'upcoming';
        urgencyLabel = `Jatuh tempo segera (H-${diffDays} hari)`;
      } else {
        urgency = 'normal';
        urgencyLabel = `Jatuh tempo ${diffDays} hari lagi`;
      }

      return {
        term,
        dueDate: effectiveDueDate,
        diffDays,
        urgency,
        urgencyLabel,
        isPhysicalReady,
        progressGap,
      };
    });
  }, [paymentTerms, physicalProgress, today]);

  // Filter urgent / upcoming terms that require attention
  const activeAlerts = useMemo(() => {
    return termsAnalysis.filter(
      (item) => item.urgency === 'overdue' || item.urgency === 'today' || item.urgency === 'critical' || item.urgency === 'upcoming'
    );
  }, [termsAnalysis]);

  // Primary urgent item (highest priority)
  const primaryAlert = useMemo(() => {
    if (activeAlerts.length === 0) return null;
    // Prioritize overdue, then today, then critical, then upcoming
    const sorted = [...activeAlerts].sort((a, b) => a.diffDays - b.diffDays);
    return sorted[0];
  }, [activeAlerts]);

  // Auto-send in-app notification when mounting if any term is critical/overdue
  useEffect(() => {
    if (!hasAutoNotified && primaryAlert && onAddNotification) {
      const sessionKey = `fgi_notified_term_${primaryAlert.term.termNumber}_${primaryAlert.dueDate}`;
      const alreadyNotifiedThisSession = sessionStorage.getItem(sessionKey);

      if (!alreadyNotifiedThisSession) {
        sessionStorage.setItem(sessionKey, 'true');
        setHasAutoNotified(true);

        const isOverdue = primaryAlert.diffDays < 0;
        onAddNotification({
          type: isOverdue ? 'alert' : 'warning',
          title: `Pengingat Pembayaran: ${primaryAlert.term.title}`,
          message: `${primaryAlert.urgencyLabel.toUpperCase()}. Nilai bersih ${formatIDR(
            primaryAlert.term.netPayableValue
          )}. Target progress: ${primaryAlert.term.targetProgressPercent}%. Segera koordinasikan dengan Konsultan MK & Kontraktor.`,
        });

        if (onAddAuditLog) {
          onAddAuditLog(
            'Pengingat Otomatis Termin Dashboard',
            `Notifikasi sistem diterbitkan untuk ${primaryAlert.term.title} (${primaryAlert.urgencyLabel})`
          );
        }
      }
    }
  }, [primaryAlert, hasAutoNotified, onAddNotification, onAddAuditLog]);

  if (isDismissed || !primaryAlert) {
    return null;
  }

  // Format share message for WhatsApp / Email
  const generateReminderMessage = (analysis: TerminDueAnalysis) => {
    const contractorName = project.contractorProfile?.companyName || project.contractor || 'PT. GONG MBE LINK PAMUNGKAS';
    const bankInfo = project.contractorProfile?.bankAccountNumber
      ? `${project.contractorProfile.bankName || 'Bank'} No. Rek: ${project.contractorProfile.bankAccountNumber} a.n ${project.contractorProfile.bankAccountHolder || contractorName}`
      : 'Bank Mandiri No. Rek: 137-00-1234567-8 a.n PT GONG MBE LINK PAMUNGKAS';

    return `*PENGINGAT RESMI TERMIN PEMBAYARAN PROYEK*
*${project.name}*
----------------------------------------
📌 *Nama Termin:* ${analysis.term.title}
📑 *No. Kontrak:* ${project.contractNumber}
📅 *Tanggal Jatuh Tempo:* ${analysis.dueDate} (*${analysis.urgencyLabel}*)
🎯 *Syarat Progress Fisik:* ${analysis.term.targetProgressPercent}%
📊 *Realisasi Progress Saat Ini:* ${physicalProgress.toFixed(2)}%
💰 *Nilai Bersih Pembayaran:* ${formatIDR(analysis.term.netPayableValue)}
🏢 *Penerima (Kontraktor):* ${contractorName}
💳 *Rekening Pembayaran:* ${bankInfo}
----------------------------------------
*Catatan Penting:*
1. Berkas opname fisik lapangan dan verifikasi Konsultan MK telah disiapkan.
2. Mohon Bagian Keuangan Owner / Direktur dapat memvalidasi invoice resmi & BAP Termin sebelum tanggal jatuh tempo.
_Sistem Monitoring Konstruksi Terpadu Foresyndo_`;
  };

  const handleOpenShareModal = (termAnalysis: TerminDueAnalysis) => {
    setSelectedTermForShare(termAnalysis.term);
    setIsShareModalOpen(true);
    setCopiedText(false);
  };

  const handleCopyMessage = async (msg: string) => {
    try {
      await navigator.clipboard.writeText(msg);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleSendWhatsApp = (msg: string) => {
    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleSendEmail = (analysis: TerminDueAnalysis, msg: string) => {
    const subject = encodeURIComponent(
      `[PENGINGAT TERMIN] ${analysis.term.title} - Proyek ${project.name} (${analysis.dueDate})`
    );
    const body = encodeURIComponent(msg);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const isOverdue = primaryAlert.diffDays < 0;
  const isToday = primaryAlert.diffDays === 0;
  const isCritical = primaryAlert.diffDays > 0 && primaryAlert.diffDays <= 7;

  return (
    <>
      <div
        className={`rounded-3xl border-2 shadow-xl p-5 sm:p-6 relative overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
          isOverdue
            ? 'bg-gradient-to-br from-red-500/10 via-rose-500/5 to-slate-900/10 border-red-500/40 text-slate-900 dark:text-white'
            : isToday || isCritical
            ? 'bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-slate-900/10 border-amber-500/40 text-slate-900 dark:text-white'
            : 'bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-slate-900/10 border-blue-500/30 text-slate-900 dark:text-white'
        } ${darkMode ? 'bg-slate-900' : 'bg-white'}`}
      >
        {/* Glow accent */}
        <div
          className={`absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-40 ${
            isOverdue
              ? 'bg-red-500'
              : isToday || isCritical
              ? 'bg-amber-500'
              : 'bg-blue-500'
          }`}
        />

        {/* Top bar: Badge & Dismiss */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-slate-200 dark:border-slate-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border shadow-md ${
                isOverdue
                  ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                  : isToday || isCritical
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse'
                  : 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30'
              }`}
            >
              <BellRing className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${
                    isOverdue
                      ? 'bg-red-500/20 text-red-600 dark:text-red-300 border-red-500/40'
                      : isToday || isCritical
                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                      : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {isOverdue
                    ? 'LEWAT JATUH TEMPO'
                    : isToday
                    ? 'JATUH TEMPO HARI INI'
                    : `JATUH TEMPO H-${primaryAlert.diffDays} HARI`}
                </span>

                <span className="text-xs font-black tracking-tight text-slate-800 dark:text-slate-200">
                  PENGINGAT OTOMATIS JATUH TEMPO TERMIN PEMBAYARAN
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Terdeteksi termin pembayaran aktif yang memerlukan konfirmasi opname &amp; persiapan likuiditas kas proyek
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => handleOpenShareModal(primaryAlert)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Bagikan / Kirim Pengingat via WhatsApp atau Email"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Kirim Pengingat</span>
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Tutup Pengingat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body: Primary Term Summary & Quick Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-4 relative z-10 items-center">
          {/* Main Info Box */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{primaryAlert.term.title}</span>
                  <span className="text-xs font-mono font-normal text-slate-500 dark:text-slate-400">
                    ({primaryAlert.term.invoiceNumber || `TERMIN-${primaryAlert.term.termNumber}`})
                  </span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Syarat pencairan: Capaian progress fisik minimal{' '}
                  <strong className="text-indigo-600 dark:text-indigo-400 font-black">
                    {primaryAlert.term.targetProgressPercent}%
                  </strong>{' '}
                  dan verifikasi Berita Acara Prestasi Pekerjaan (BAPP).
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                  Target Jatuh Tempo:
                </span>
                <span
                  className={`text-xs font-black font-mono flex items-center sm:justify-end gap-1 ${
                    isOverdue
                      ? 'text-red-600 dark:text-red-400'
                      : isToday || isCritical
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {primaryAlert.dueDate} ({primaryAlert.urgencyLabel})
                </span>
              </div>
            </div>

            {/* Financial Highlights Pill Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  Nilai Bersih Termin:
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono block truncate">
                  {formatIDR(primaryAlert.term.netPayableValue)}
                </span>
                <span className="text-[9px] text-slate-400">
                  Termin {primaryAlert.term.termValuePercent}% (Net)
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  Potongan Retensi (5%):
                </span>
                <span className="text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400 font-mono block truncate">
                  {formatIDR(primaryAlert.term.retentionValue)}
                </span>
                <span className="text-[9px] text-slate-400">Jaminan Pemeliharaan</span>
              </div>

              <div className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  Status Verifikasi:
                </span>
                <span
                  className={`text-xs font-black block truncate ${
                    primaryAlert.term.status === 'Menunggu Approval'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {primaryAlert.term.status}
                </span>
                <span className="text-[9px] text-slate-400">
                  {primaryAlert.term.status === 'Menunggu Approval'
                    ? 'Butuh TTD Direktur'
                    : 'Belum Diajukan'}
                </span>
              </div>

              <div className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                  Kesiapan Fisik Proyek:
                </span>
                <span
                  className={`text-xs font-black block truncate ${
                    primaryAlert.isPhysicalReady
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-orange-600 dark:text-orange-400'
                  }`}
                >
                  {primaryAlert.isPhysicalReady ? '✓ Siap Dicairkan' : `Kurang ${primaryAlert.progressGap}%`}
                </span>
                <span className="text-[9px] text-slate-400">
                  Progress riil: {physicalProgress.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Progress Bar comparison */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-600 dark:text-slate-400">
                  Progress Fisik vs Syarat {primaryAlert.term.targetProgressPercent}%:
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {physicalProgress.toFixed(1)}% / {primaryAlert.term.targetProgressPercent}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-500 ${
                    primaryAlert.isPhysicalReady ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (physicalProgress / primaryAlert.term.targetProgressPercent) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action CTAs Column */}
          <div className="lg:col-span-4 flex flex-col gap-2 pt-2 lg:pt-0 lg:border-l lg:border-slate-200 lg:dark:border-slate-800 lg:pl-5">
            <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-1">
              <span className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Penerima: {project.contractorProfile?.companyName || project.contractor}</span>
              </span>
              <p className="text-[10px] text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                {currentRole === 'Direktur' || currentRole === 'Admin'
                  ? 'Pastikan alokasi kas siap di rekening giro FGI untuk pembayaran termin tepat waktu.'
                  : 'Siapkan lampiran opname volume, foto dokumentasi, dan BAP untuk disahkan Konsultan MK.'}
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('termin')}
              className="w-full py-2.5 px-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Buka Menu Termin Pembayaran</span>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </button>

            <button
              onClick={() => onNavigateTab('contractor-finance')}
              className="w-full py-2 px-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-500" />
              <span>Cek Arus Kas Proyek (Cash Flow)</span>
            </button>
          </div>
        </div>

        {/* Secondary Alert Accordion (If more than 1 term is coming up) */}
        {activeAlerts.length > 1 && (
          <div className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Termin berikutnya yang mendekati jadwal:
              </span>
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {activeAlerts.slice(1).map((item) => (
                <div
                  key={item.term.termNumber}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <span>{item.term.title}</span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">
                    {formatIDR(item.term.netPayableValue)}
                  </span>
                  <span className="text-[10px] text-slate-400">({item.dueDate})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share / WhatsApp & Email Notification Modal */}
      {isShareModalOpen && selectedTermForShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    Kirim Pengingat Termin Pembayaran
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Kirim notifikasi otomatis via WhatsApp atau Email Resmi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Pratinjau Pesan Notifikasi:
                </label>
                <textarea
                  readOnly
                  rows={9}
                  value={generateReminderMessage(primaryAlert)}
                  className="w-full p-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed outline-none select-all"
                />
              </div>

              {/* Quick Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(generateReminderMessage(primaryAlert))}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Kirim via WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSendEmail(primaryAlert, generateReminderMessage(primaryAlert))}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <Mail className="w-4 h-4" />
                  <span>Kirim via Email Resmi</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => handleCopyMessage(generateReminderMessage(primaryAlert))}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedText
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {copiedText ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Teks Berhasil Disalin!' : 'Salin Teks Pesan'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-300 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
