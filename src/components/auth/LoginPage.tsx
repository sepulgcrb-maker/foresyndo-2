import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  HardHat,
  Eye,
  Lock,
  ArrowRight,
  UserCheck,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Layers,
  ChevronRight,
  Shield,
  Info,
} from 'lucide-react';
import { StakeholderRoleKey, StakeholderRoleProfile } from '../../types';

interface LoginPageProps {
  onLogin: (role: StakeholderRoleKey, userName: string) => void;
  stakeholderProfiles: Record<StakeholderRoleKey, StakeholderRoleProfile>;
  projectName?: string;
  projectLocation?: string;
  rolePins: Record<StakeholderRoleKey, string>;
}

interface AccountConfig {
  role: StakeholderRoleKey;
  label: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeBg: string;
  badgeText: string;
  borderActive: string;
  scopeDesc: string;
  isRestrictedNotice?: string;
}

const ACCOUNTS: AccountConfig[] = [
  {
    role: 'Owner',
    label: 'Pemberi Tugas (Owner)',
    title: 'Direksi & Kuasa Pengguna Anggaran',
    icon: ShieldCheck,
    badgeBg: 'bg-purple-500/20',
    badgeText: 'text-purple-400 border-purple-500/30',
    borderActive: 'border-purple-500 shadow-purple-500/20',
    scopeDesc: 'Otoritas tertinggi proyek, persetujuan pencairan termin, wewenang kelola seluruh hak akses & BAST.',
  },
  {
    role: 'Konsultan',
    label: 'Konsultan Pengawas (MK)',
    title: 'Manajemen Konstruksi & Lead QC',
    icon: CheckCircle2,
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-400 border-blue-500/30',
    borderActive: 'border-blue-500 shadow-blue-500/20',
    scopeDesc: 'Audit mutu lapangan, verifikasi opname fisik termin, inspeksi checklist QC, evaluasi DED & BAST.',
  },
  {
    role: 'Kontraktor',
    label: 'Kontraktor Pelaksana',
    title: 'Site Manager & Tim Lapangan',
    icon: HardHat,
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-400 border-amber-500/30',
    borderActive: 'border-amber-500 shadow-amber-500/20',
    scopeDesc: 'Pengisian laporan harian, material & logistik, absensi pekerja, upload gambar kerja & ajukan termin.',
    isRestrictedNotice: 'Terisolasi: Tidak memiliki akses dan tidak dapat melihat data peran Owner & Konsultan MK.',
  },
  {
    role: 'Viewer',
    label: 'Tamu Pengawas (Auditor)',
    title: 'Pengamat Independen Eksternal',
    icon: Eye,
    badgeBg: 'bg-slate-500/20',
    badgeText: 'text-slate-400 border-slate-500/30',
    borderActive: 'border-slate-500 shadow-slate-500/20',
    scopeDesc: 'Akses monitoring baca (read-only) untuk kurva S, jadwal, galeri foto, dan laporan umum.',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({
  onLogin,
  stakeholderProfiles,
  projectName = 'GEDUNG FORESYNDO 2',
  projectLocation = 'Jatitujuh, Majalengka, Jawa Barat',
  rolePins,
}) => {
  const [selectedRole, setSelectedRole] = useState<StakeholderRoleKey>('Kontraktor');
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const currentAccount = ACCOUNTS.find((a) => a.role === selectedRole)!;
  const currentProfile = stakeholderProfiles[selectedRole];

  const handleSelectAccount = (role: StakeholderRoleKey) => {
    setSelectedRole(role);
    setPinInput('');
    setErrorMessage('');
  };

  const handleDoLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // 1. Validasi Wajib PIN: Tidak boleh kosong
    if (!pinInput || !pinInput.trim()) {
      setErrorMessage('PIN keamanan wajib diisi. Anda tidak dapat masuk ke sistem tanpa memasukkan PIN yang valid.');
      return;
    }

    const expectedPin = rolePins ? rolePins[selectedRole] : undefined;
    if (!expectedPin) {
      setErrorMessage('PIN akses untuk peran ini belum diatur oleh Pemilik Proyek (Owner). Silakan hubungi Owner.');
      return;
    }

    // 2. Verifikasi ketat PIN yang telah diatur oleh Owner (tanpa backdoor)
    if (pinInput.trim() !== expectedPin) {
      setErrorMessage('PIN keamanan tidak sesuai. Akses ditolak. Silakan hubungi Pemilik Proyek (Owner) jika Anda belum memiliki atau lupa PIN peran.');
      return;
    }

    setErrorMessage('');
    onLogin(selectedRole, currentProfile?.personName || currentAccount.label);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Ambience & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-orange-950/30 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 border-b border-slate-800/80 px-4 sm:px-8 py-4 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-bold shadow-md shadow-orange-500/10">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                PT FORESYNDO GLOBAL INDONESIA
              </h1>
              <p className="text-[11px] text-slate-400 truncate">
                Proyek {projectName} &bull; {projectLocation}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/70 text-[11px] text-slate-300">
            <Shield className="w-3.5 h-3.5 text-orange-400" />
            <span>Sistem RBAC Terpadu Tripartit</span>
          </div>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-4 py-8 sm:py-12 flex flex-col items-center">
        <div className="text-center space-y-2 mb-8 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
            <KeyRound className="w-3.5 h-3.5" /> Portal Autentikasi Pengguna
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Pilih Peran & Masuk ke Sistem
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Akses sistem dikelola secara ketat berbasis peran Tripartit konstruksi. Setiap pihak memiliki ruang kerja dan wewenang terisolasi.
          </p>
        </div>

        {/* 2-Column Grid: Role Selector & Login Form */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Account Selection Cards (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <span>Daftar Entitas Tiga Pihak (Tripartit)</span>
              <span className="text-[11px] text-orange-400 lowercase font-normal">klik untuk memilih</span>
            </div>

            <div className="space-y-3">
              {ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                const isSelected = selectedRole === acc.role;
                const profile = stakeholderProfiles[acc.role];

                return (
                  <div
                    key={acc.role}
                    onClick={() => handleSelectAccount(acc.role)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? `bg-slate-900 ${acc.borderActive} border-2 shadow-xl`
                        : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-white">{acc.label}</h3>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${acc.badgeBg} ${acc.badgeText}`}
                            >
                              {acc.role}
                            </span>
                            {acc.role === 'Kontraktor' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                Mode Lapangan
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-300 font-semibold">
                            {profile?.personName || 'Penanggung Jawab'} &bull;{' '}
                            <span className="text-slate-400 font-normal">{profile?.position || acc.title}</span>
                          </div>

                          <div className="text-[11px] text-slate-500 truncate">{profile?.company || 'Instansi Terdaftar'}</div>

                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{acc.scopeDesc}</p>

                          {acc.isRestrictedNotice && (
                            <div className="mt-2 text-[10px] font-medium text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-lg p-1.5 flex items-center gap-1.5">
                              <Info className="w-3.5 h-3.5 shrink-0" />
                              <span>{acc.isRestrictedNotice}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selection State Indicator */}
                      <div
                        className={`shrink-0 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                            : 'bg-slate-800/80 text-slate-400 border-slate-700/80'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
                            <span>Terpilih</span>
                          </>
                        ) : (
                          <>
                            <span>Pilih</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute top-0 right-0 w-2 h-full bg-orange-500 rounded-r-2xl" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: PIN Authentication Box (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Header of Active Form */}
            <div className="space-y-2 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Konfirmasi Akses Peran</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${currentAccount.badgeBg} ${currentAccount.badgeText}`}>
                  {currentAccount.role}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{currentAccount.label}</h3>
              <div className="text-xs text-slate-300">
                Identitas: <span className="text-white font-bold">{currentProfile?.personName}</span> ({currentProfile?.position})
              </div>
            </div>

            {/* Error Message if wrong PIN */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form PIN */}
            <form onSubmit={handleDoLogin} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-orange-400" />
                    <span>PIN Keamanan / Sandi Akses</span>
                  </label>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-orange-400" /> Otoritas Owner
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="Masukkan PIN keamanan peran..."
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-2xl text-white font-mono text-sm tracking-wider focus:outline-none focus:border-orange-500 transition-colors pr-10"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-98 text-white font-bold text-sm shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Masuk Sebagai {currentAccount.label}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Security Isolation Notice */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 font-bold text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Aturan Hak Akses & PIN Sandi:</span>
              </div>
              <p className="leading-relaxed">
                Sistem mewajibkan input PIN keamanan yang valid untuk setiap peran. Pengguna tidak dapat masuk tanpa memasukkan PIN. Seluruh PIN peran dikonfigurasi secara eksklusif oleh <strong className="text-white">Pemilik Proyek (Owner)</strong> melalui menu Pengaturan Hak Akses & Peran.
              </p>
              {selectedRole === 'Kontraktor' ? (
                <p className="text-amber-300/90 font-medium leading-relaxed">
                  Perhatian: Saat Anda login sebagai Kontraktor Pelaksana, seluruh navigasi dan menu wewenang peran Owner dan Konsultan MK akan disembunyikan sepenuhnya dari pandangan Anda.
                </p>
              ) : (
                <p className="text-slate-400 leading-relaxed">
                  Setiap peran memiliki kredensial independen. Sesi masuk Anda akan disimpan secara aman pada peramban hingga Anda menekan tombol Keluar (Logout).
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 px-4 py-4 text-center text-slate-400 text-xs bg-slate-900/60 backdrop-blur-md">
        &copy; {new Date().getFullYear()} PT FORESYNDO GLOBAL INDONESIA &bull; Proyek Gedung Foresyndo 2 Jatitujuh &bull; Sistem Pengawasan Terpadu
      </footer>
    </div>
  );
};
