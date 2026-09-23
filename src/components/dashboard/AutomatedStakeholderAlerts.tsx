import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Mail,
  Send,
  ShieldAlert,
  CheckCircle2,
  UserCheck,
  Smartphone,
  AlertTriangle,
  Eye,
  History,
  Clock,
  Sparkles,
  X,
  Radio,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { ProjectInfo, WorkItem, PaymentTerm, NotificationItem, UserRole } from '../../types';
import { formatIDR } from '../../utils/calculations';

interface Stakeholder {
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  receiveDelayAlerts: boolean;
  receiveBudgetAlerts: boolean;
  pushEnabled: boolean;
}

interface AlertLogRecord {
  id: string;
  timestamp: string;
  type: 'delay' | 'budget' | 'combined';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  subject: string;
  recipientRoles: UserRole[];
  recipientsCount: number;
  deliveryMethods: string[];
  status: 'DELIVERED' | 'PENDING';
}

interface AutomatedStakeholderAlertsProps {
  project: ProjectInfo;
  workItems: WorkItem[];
  paymentTerms: PaymentTerm[];
  currentRole: UserRole;
  deviation: number;
  isProjectedOverdue: boolean;
  projectedDelayDays: number;
  dailyVelocity: number;
  physicalProgress: number;
  targetProgress: number;
  finance: {
    totalPaidGross: number;
    remainingContractValue: number;
    financialProgressPercent: number;
  };
  onAddNotification?: (notif: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => void;
  onAddAuditLog?: (action: string, details: string) => void;
}

export const AutomatedStakeholderAlerts: React.FC<AutomatedStakeholderAlertsProps> = ({
  project,
  workItems,
  paymentTerms,
  currentRole,
  deviation,
  isProjectedOverdue,
  projectedDelayDays,
  dailyVelocity,
  physicalProgress,
  targetProgress,
  finance,
  onAddNotification,
  onAddAuditLog,
}) => {
  // Stakeholders database state
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([
    {
      role: 'Direktur',
      name: 'HASANUDIN',
      email: 'foresyndo@gmail.com',
      phone: '+62 813 - 9554 - 5025',
      receiveDelayAlerts: true,
      receiveBudgetAlerts: true,
      pushEnabled: true,
    },
    {
      role: 'Site Manager',
      name: 'EKO YULIANTO',
      email: 'arrash868@gmail.com',
      phone: '+62 811-9876-5432',
      receiveDelayAlerts: true,
      receiveBudgetAlerts: true,
      pushEnabled: true,
    },
    {
      role: 'Admin',
      name: 'COKRO ',
      email: 'siti.admin@foresyndo.co.id',
      phone: '+62 813-1122-3344',
      receiveDelayAlerts: false,
      receiveBudgetAlerts: true,
      pushEnabled: true,
    },
    {
      role: 'Viewer',
      name: 'Tamu Pengawas MK',
      email: 'pengawas.mk@foresyndo.co.id',
      phone: '+62 857-9988-7766',
      receiveDelayAlerts: true,
      receiveBudgetAlerts: false,
      pushEnabled: false,
    },
  ]);

  // Automated monitoring switch
  const [autoAlertEnabled, setAutoAlertEnabled] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [lastDispatchedTime, setLastDispatchedTime] = useState<string | null>(null);

  // Sent Alert Logs History
  const [alertLogs, setAlertLogs] = useState<AlertLogRecord[]>([
    {
      id: 'ALT-1001',
      timestamp: new Date(Date.now() - 86400000).toLocaleString('id-ID'),
      type: 'delay',
      severity: 'WARNING',
      subject: '[ALERT AUTOMATED] Terdeteksi Deviasi Proyek Jatitujuh Majalengka',
      recipientRoles: ['Direktur', 'Site Manager'],
      recipientsCount: 2,
      deliveryMethods: ['Email SMTP', 'WebPush'],
      status: 'DELIVERED',
    },
  ]);

  // Analyze Risk Statuses
  const isCriticalDelay = deviation < -5 || (isProjectedOverdue && projectedDelayDays >= 7);
  const isWarningDelay = deviation < -2 || isProjectedOverdue;
  const isFinancialRisk = finance.financialProgressPercent > physicalProgress + 15;

  const hasAnyCriticalRisk = isCriticalDelay || isFinancialRisk;
  const hasAnyWarningRisk = isWarningDelay || isFinancialRisk;

  // Filter relevant stakeholders for current active risk
  const getRelevantStakeholders = (riskType: 'delay' | 'budget' | 'combined') => {
    return stakeholders.filter((s) => {
      if (riskType === 'delay') return s.receiveDelayAlerts;
      if (riskType === 'budget') return s.receiveBudgetAlerts;
      return s.receiveDelayAlerts || s.receiveBudgetAlerts;
    });
  };

  const targetRiskType: 'delay' | 'budget' | 'combined' =
    hasAnyCriticalRisk && isFinancialRisk ? 'combined' : isFinancialRisk ? 'budget' : 'delay';

  const relevantRecipients = getRelevantStakeholders(targetRiskType);

  // Trigger real browser push notification if permission granted
  const triggerBrowserPushNotification = (title: string, body: string) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification(title, { body, icon: '/favicon.ico' });
          }
        });
      }
    }
  };

  // Dispatch Action Handler
  const handleDispatchAlerts = () => {
    const nowStr = new Date().toLocaleString('id-ID');
    const alertSubject = isCriticalDelay
      ? `[ALERT KRITIS] Proyek Berisiko Terlambat +${projectedDelayDays} Hari (Deviasi: ${deviation}%)`
      : isFinancialRisk
      ? `[ALERT KEUANGAN] Ketidakseimbangan Pencairan Termin vs Progress Fisik`
      : `[INFORMASI PERINGATAN] Laporan Evaluasi Kinerja Proyek ${project.name}`;

    const alertMessage = `Terdeteksi kondisi perhatian pada Executive Dashboard: Progress Fisik ${physicalProgress}% (Target ${targetProgress}%), Deviasi ${deviation}%. Proyeksi kecepatan ${dailyVelocity.toFixed(2)}%/hari.`;

    // 1. Add notification in app state
    if (onAddNotification) {
      onAddNotification({
        type: isCriticalDelay || isFinancialRisk ? 'alert' : 'warning',
        title: alertSubject,
        message: `${alertMessage} Notifikasi email & push dikirim ke ${relevantRecipients.length} stakeholder (${relevantRecipients.map((r) => r.role).join(', ')}).`,
      });
    }

    // 2. Add audit log
    if (onAddAuditLog) {
      onAddAuditLog(
        'Kirim Alert Stakeholder Otomatis',
        `Pemicu alert otomatis dikirim ke: ${relevantRecipients.map((r) => `${r.name} (${r.role})`).join(', ')} via Email & WebPush`
      );
    }

    // 3. Browser push notification simulation
    triggerBrowserPushNotification(alertSubject, alertMessage);

    // 4. Record Log
    const newRecord: AlertLogRecord = {
      id: `ALT-${Date.now()}`,
      timestamp: nowStr,
      type: targetRiskType,
      severity: isCriticalDelay || isFinancialRisk ? 'CRITICAL' : 'WARNING',
      subject: alertSubject,
      recipientRoles: relevantRecipients.map((r) => r.role),
      recipientsCount: relevantRecipients.length,
      deliveryMethods: ['Email SMTP (SendGrid/Vercel)', 'Browser WebPush'],
      status: 'DELIVERED',
    };

    setAlertLogs((prev) => [newRecord, ...prev]);
    setLastDispatchedTime(nowStr);
    setIsPreviewModalOpen(false);

    alert(`✅ Alert Otomatis Berhasil Dikirim!\n\nSubjek: ${alertSubject}\nPenerima: ${relevantRecipients.length} Stakeholder (${relevantRecipients.map((r) => r.role).join(', ')})\nNotifikasi WebPush & Email SMTP telah disimulasikan.`);
  };

  return (
    <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl space-y-4 relative overflow-hidden">
      {/* Background Accent glow */}
      <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
        hasAnyCriticalRisk ? 'bg-red-500/10' : 'bg-orange-500/10'
      }`} />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${
            hasAnyCriticalRisk
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
          }`}>
            <BellRing className={`w-5 h-5 ${hasAnyCriticalRisk ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white tracking-tight">
                SISTEM ALERT OTOMATIS STAKEHOLDER
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border ${
                autoAlertEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-700 text-slate-400 border-slate-600'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${autoAlertEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`} />
                {autoAlertEnabled ? 'MONITORING REAL-TIME' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Pengiriman otomatis notifikasi email &amp; push saat terdeteksi deviasi keterlambatan atau resiko anggaran
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Toggle Auto Monitoring */}
          <button
            onClick={() => setAutoAlertEnabled(!autoAlertEnabled)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              autoAlertEnabled
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            {autoAlertEnabled ? 'Jeda Monitoring' : 'Aktifkan Monitoring'}
          </button>

          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1"
            title="Riwayat Log Alert"
          >
            <History className="w-4 h-4 text-orange-400" />
          </button>
        </div>
      </div>

      {/* Main Alert Trigger Banner Status */}
      <div className={`p-4 rounded-2xl border transition-all relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        hasAnyCriticalRisk
          ? 'bg-red-950/30 border-red-500/40 text-red-200'
          : hasAnyWarningRisk
          ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
          : 'bg-slate-800/50 border-slate-700/80 text-slate-300'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {hasAnyCriticalRisk ? (
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
            ) : hasAnyWarningRisk ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <span className="font-extrabold text-sm uppercase tracking-wide">
              {hasAnyCriticalRisk
                ? 'TERDETEKSI KONDISI KRITIS PROYEK'
                : hasAnyWarningRisk
                ? 'PERATAN EVALUASI JADWAL TERDETEKSI'
                : 'KINERJA PROYEK DALAM BATAS AMAN OPERASIONAL'}
            </span>
          </div>

          <p className="text-xs text-slate-300 pl-7">
            {isCriticalDelay && (
              <span>
                Deviasi negatif <strong>{deviation}%</strong> &amp; proyeksi keterlambatan <strong>+{projectedDelayDays} hari</strong> berdasarkan kecepatan kerja saat ini ({dailyVelocity.toFixed(2)}%/hari).
              </span>
            )}
            {isFinancialRisk && (
              <span className="block mt-0.5">
                Pencairan finansial ({finance.financialProgressPercent}%) melampaui progress fisik ({physicalProgress}%).
              </span>
            )}
            {!hasAnyWarningRisk && (
              <span>
                Semua parameter progress fisik, time schedule, dan anggaran berada dalam margin toleransi aman.
              </span>
            )}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 pl-7 md:pl-0">
          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all ${
              hasAnyCriticalRisk
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-950/40'
            }`}
          >
            <Send className="w-3.5 h-3.5" /> Kirim Alert ke Stakeholder Relevant
          </button>
        </div>
      </div>

      {/* Relevant Stakeholder Badges Summary */}
      <div className="pt-1 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-t border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-300 flex items-center gap-1 text-[11px]">
            <UserCheck className="w-3.5 h-3.5 text-orange-400" /> Stakeholders Terdaftar ({stakeholders.length}):
          </span>
          {stakeholders.map((s) => {
            const isTarget = relevantRecipients.some((r) => r.role === s.role);
            return (
              <span
                key={s.role}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                  isTarget
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                    : 'bg-slate-800 text-slate-500 border-slate-700/60'
                }`}
              >
                <Mail className="w-3 h-3" />
                {s.role} ({s.name.split(',')[0]})
                {isTarget && <span className="text-[9px] text-orange-400 font-mono">&bull; TARGET</span>}
              </span>
            );
          })}
        </div>

        {lastDispatchedTime && (
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" /> Terakhir Dikirim: {lastDispatchedTime}
          </span>
        )}
      </div>

      {/* PREVIEW & DISPATCH EMAIL / PUSH MODAL */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-500">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Preview Alert Email &amp; WebPush Stakeholder
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Sistem otomatis menyaring stakeholder penerima berdasarkan matriks kewenangan role
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipients Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-orange-500" /> Stakeholder Terpilih (Disesuaikan Per Role):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stakeholders.map((s) => {
                  const isTarget = relevantRecipients.some((r) => r.role === s.role);
                  return (
                    <div
                      key={s.role}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        isTarget
                          ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-500/40 text-slate-900 dark:text-white'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400'
                      }`}
                    >
                      <div>
                        <div className="font-extrabold flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                            {s.role}
                          </span>
                          {s.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          {s.email}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={isTarget}
                        onChange={() => {
                          if (isTarget) {
                            setStakeholders((prev) =>
                              prev.map((item) =>
                                item.role === s.role
                                  ? { ...item, receiveDelayAlerts: false, receiveBudgetAlerts: false }
                                  : item
                              )
                            );
                          } else {
                            setStakeholders((prev) =>
                              prev.map((item) =>
                                item.role === s.role
                                  ? { ...item, receiveDelayAlerts: true, receiveBudgetAlerts: true }
                                  : item
                              )
                            );
                          }
                        }}
                        className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-400"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Email Payload Preview Box */}
            <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 border border-slate-800 space-y-3 text-xs font-sans">
              <div className="border-b border-slate-800 pb-2 space-y-1 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500">DARI:</span> system-alerts@foresyndo.co.id (SMTP Server)
                </div>
                <div>
                  <span className="text-slate-500">KEPADA:</span>{' '}
                  <span className="text-orange-400 font-bold">
                    {relevantRecipients.map((r) => `${r.name} <${r.email}>`).join('; ')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">SUBJEK:</span>{' '}
                  <span className="font-bold text-white">
                    {isCriticalDelay
                      ? `[ALERT KRITIS] Keterlambatan Proyek ${project.name} (Deviasi: ${deviation}%)`
                      : `[Laporan Kinerja] Updates Status Proyek ${project.name}`}
                  </span>
                </div>
              </div>

              <div className="space-y-2 leading-relaxed">
                <p>Yth. Bapak/Ibu Stakeholder PT Foresyndo Global Indonesia,</p>
                <p>
                  Sistem Executive Dashboard mendeteksi pembaruan indikator kinerja utama proyek{' '}
                  <strong className="text-white">{project.name}</strong> ({project.contractNumber}):
                </p>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>Progress Realisasi Fisik:</span>
                    <span className="font-bold text-emerald-400">{physicalProgress}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Planned Schedule:</span>
                    <span className="font-bold text-amber-400">{targetProgress}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deviasi Waktu:</span>
                    <span className={`font-bold ${deviation >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {deviation}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimasi Proyeksi Keterlambatan:</span>
                    <span className="font-bold text-red-400">+{projectedDelayDays} Hari Selesai</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kecepatan Kerja Lapangan (Velocity):</span>
                    <span className="font-bold text-sky-400">{dailyVelocity.toFixed(2)}% / hari</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  *Pesan ini dikirimkan secara otomatis oleh Foresyndo Construction Intelligence Engine. Mohon Site Manager dan Direktur segera meninjau time schedule mitigasi pada aplikasi.
                </p>
              </div>
            </div>

            {/* Delivery Channels */}
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
              <span className="font-bold flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-orange-500" /> Kanal Pengiriman Aktif:
              </span>
              <div className="flex items-center gap-3 font-mono font-bold text-[11px]">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400">
                  Email SMTP (SSL)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  Browser WebPush API
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleDispatchAlerts}
                className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-orange-500/30"
              >
                <Send className="w-4 h-4" /> Eksekusi Pengiriman Notifikasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ALERT HISTORY LOG MODAL */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-500">
                  <History className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Riwayat Pengiriman Alert Stakeholder
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Log audit pengiriman email &amp; browser webpush otomatis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {alertLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      ID: {log.id} &bull; {log.timestamp}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] uppercase border border-emerald-500/30">
                      {log.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{log.subject}</h4>
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      Penerima Role: <strong>{log.recipientRoles.join(', ')}</strong> ({log.recipientsCount} orang)
                    </span>
                    <span className="font-mono text-[10px] text-orange-500">
                      {log.deliveryMethods.join(' & ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
