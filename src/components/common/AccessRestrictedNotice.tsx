import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, UserCheck, Award } from 'lucide-react';
import { UserRole, ActiveTab } from '../../types';

interface AccessRestrictedNoticeProps {
  tab: ActiveTab;
  currentRole: UserRole;
  ownerName?: string;
  onGoBackToDashboard: () => void;
  onSwitchToOwner: () => void;
  onOpenRoleModal: () => void;
}

const TAB_LABELS: Record<ActiveTab, string> = {
  dashboard: 'Dashboard Utama',
  schedule: 'Time Schedule',
  calendar: 'Kalender Proyek',
  scurve: 'Grafik Kurva S',
  gantt: 'Gantt Chart',
  daily: 'Monitoring Harian',
  photos: 'Dokumentasi Foto',
  termin: 'Pembayaran Termin',
  'contractor-finance': 'Keuangan Proyek Kontraktor',
  suppliers: 'Rekanan Supplier & PO',
  materials: 'Monitoring Material',
  workforce: 'Tenaga Kerja',
  equipment: 'Monitoring Alat Berat',
  documents: 'Manajemen Dokumen & Gambar Kerja',
  inspection: 'Inspeksi & BAST Akhir',
  reports: 'Pusat Laporan Resmi',
};

export const AccessRestrictedNotice: React.FC<AccessRestrictedNoticeProps> = ({
  tab,
  currentRole,
  ownerName = 'HASANUDIN (Direktur Utama PT Foresyndo Global Indonesia)',
  onGoBackToDashboard,
  onSwitchToOwner,
  onOpenRoleModal,
}) => {
  const tabTitle = TAB_LABELS[tab] || tab;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div className="rounded-3xl bg-slate-900/90 border border-amber-500/30 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start gap-5 relative z-10">
          <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Akses Dibatasi oleh Owner
              </span>
              <span className="text-xs text-slate-400">Modul: {tabTitle}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white">
              Halaman Ini Memerlukan Izin Akses dari Owner Proyek
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Role aktif Anda saat ini adalah <strong className="text-amber-400 font-bold">{currentRole}</strong>.
              Berdasarkan konfigurasi matriks wewenang yang dikelola oleh Owner Proyek (
              <span className="text-white font-semibold">{ownerName}</span>
              ), akses menuju modul <strong className="text-white font-bold">{tabTitle}</strong> sedang dibatasi.
            </p>

            {/* Info Box */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Award className="w-4 h-4" /> Kebijakan Kontrol Akses Owner
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {currentRole === 'Kontraktor' || currentRole === 'Site Manager'
                  ? 'Modul ini dilindungi oleh kebijakan hak akses proyek. Kontraktor Pelaksana hanya dapat mengakses modul yang telah diizinkan oleh Pemberi Tugas (Owner).'
                  : 'Hanya Owner / Pemberi Tugas yang berhak mengaktifkan atau menonaktifkan visibilitas modul dan wewenang eksekusi untuk Konsultan, Kontraktor, dan Viewer.'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              {currentRole !== 'Kontraktor' && currentRole !== 'Site Manager' && (
                <>
                  <button
                    onClick={onSwitchToOwner}
                    className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Beralih ke Role Owner & Kelola Akses</span>
                  </button>

                  <button
                    onClick={onOpenRoleModal}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4 text-indigo-400" />
                    <span>Lihat Matriks Role & Izin</span>
                  </button>
                </>
              )}

              <button
                onClick={onGoBackToDashboard}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-orange-500/20"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Dashboard Utama</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
