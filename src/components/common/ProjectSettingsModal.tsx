import React, { useState } from 'react';
import { ProjectInfo, UserRole } from '../../types';
import {
  X,
  Settings,
  Building2,
  User,
  FileText,
  MapPin,
  CheckCircle2,
  Save,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  DollarSign,
  Briefcase,
} from 'lucide-react';
import { formatIDR } from '../../utils/calculations';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInfo;
  onUpdateProject: (updated: ProjectInfo) => void;
  currentRole: UserRole;
  userNameMap?: Record<UserRole, string>;
  onUpdateUserNameMap?: (newMap: Record<UserRole, string>) => void;
  onAddAuditLog?: (action: string, details: string) => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  currentRole,
  userNameMap = {
    Direktur: 'H. Bambang S., M.T.',
    'Site Manager': 'Ir. Agus Pratama',
    Admin: 'Siti Rahmawati, S.T.',
    Viewer: 'Tamu Pengawas',
  },
  onUpdateUserNameMap,
  onAddAuditLog,
}) => {
  const [activeTab, setActiveTab] = useState<'project' | 'roles' | 'contract'>('project');

  // Form State initialized with current project values
  const [name, setName] = useState(project.name);
  const [owner, setOwner] = useState(project.owner);
  const [contractor, setContractor] = useState(project.contractor || '');
  const [location, setLocation] = useState(project.location);
  const [contractNumber, setContractNumber] = useState(project.contractNumber);
  const [contractValue, setContractValue] = useState(project.contractValue);
  const [startDate, setStartDate] = useState(project.startDate);
  const [targetEndDate, setTargetEndDate] = useState(project.targetEndDate);
  const [status, setStatus] = useState(project.status);

  // User names state
  const [names, setNames] = useState<Record<UserRole, string>>(userNameMap);

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedProject: ProjectInfo = {
      ...project,
      name: name.trim() || project.name,
      owner: owner.trim() || project.owner,
      contractor: contractor.trim() || project.contractor,
      location: location.trim() || project.location,
      contractNumber: contractNumber.trim() || project.contractNumber,
      contractValue: Number(contractValue) || project.contractValue,
      startDate: startDate || project.startDate,
      targetEndDate: targetEndDate || project.targetEndDate,
      status,
    };

    onUpdateProject(updatedProject);

    if (onUpdateUserNameMap) {
      onUpdateUserNameMap(names);
    }

    if (onAddAuditLog) {
      onAddAuditLog(
        'Pengaturan Nama & Identitas Proyek',
        `Perubahan Nama Proyek: "${updatedProject.name}", Pemilik: "${updatedProject.owner}", Kontraktor: "${updatedProject.contractor}"`
      );
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleResetDefaults = () => {
    setName('Pembangunan Gedung 7 Lantai (Foresyndo 2)');
    setOwner('PT Foresyndo Global Indonesia');
    setContractor('PT Foresyndo Global Indonesia (Internal Construction Division)');
    setLocation('Jatitujuh, Majalengka, Jawa Barat');
    setContractNumber('PR-2026-FGI-004');
    setContractValue(14461760981);
    setNames({
      Direktur: 'H. Bambang S., M.T.',
      'Site Manager': 'Ir. Agus Pratama',
      Admin: 'Siti Rahmawati, S.T.',
      Viewer: 'Tamu Pengawas',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-8 text-slate-900 dark:text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-md">
            <Settings className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Pengaturan Nama &amp; Identitas Proyek
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold text-[10px] border border-orange-500/20">
                PROJ-SETTINGS
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ubah Nama Proyek, Perusahaan Pemilik, Pejabat Penanggung Jawab, dan Detail Kontrak Resmi
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-6 pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('project')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'project'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" /> Nama &amp; Informasi Proyek
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'roles'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-4 h-4" /> Nama Pejabat / Profil User
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contract')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'contract'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" /> Kontrak &amp; Jadwal
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="space-y-6">
          {/* TAB 1: NAMA & INFORMASI PROYEK */}
          {activeTab === 'project' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-orange-500" /> Nama Utama Proyek / Bangunan
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Pembangunan Gedung Hotel & Resort..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Nama ini akan muncul di Header Aplikasi, Laporan Cetak PDF, Laporan Excel, dan Sertifikat BAST.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500" /> Nama Pemilik Proyek / Client / Developer
                  </label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="Contoh: PT Foresyndo Global Indonesia"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Nama Kontraktor Pelaksana
                  </label>
                  <input
                    type="text"
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                    placeholder="Contoh: PT Karya Konstruksi Utama"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> Lokasi Proyek &amp; Alamat Site
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Contoh: Jatitujuh, Majalengka, Jawa Barat"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                />
              </div>
            </div>
          )}

          {/* TAB 2: NAMA PEJABAT / PROFIL USER */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Atur Nama Personel Penanggung Jawab untuk dimasukkan ke Lembar Tanda Tangan Digital BAST &amp; Audit Log.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Direktur Utama (Direktur)
                  </label>
                  <input
                    type="text"
                    value={names.Direktur}
                    onChange={(e) => setNames({ ...names, Direktur: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Site Manager / Kepala Lapangan
                  </label>
                  <input
                    type="text"
                    value={names['Site Manager']}
                    onChange={(e) => setNames({ ...names, 'Site Manager': e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Admin Logistik &amp; Keuangan
                  </label>
                  <input
                    type="text"
                    value={names.Admin}
                    onChange={(e) => setNames({ ...names, Admin: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Nama Tim Viewer / Pengawas Eksternal
                  </label>
                  <input
                    type="text"
                    value={names.Viewer}
                    onChange={(e) => setNames({ ...names, Viewer: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KONTRAK & JADWAL */}
          {activeTab === 'contract' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-500" /> Nomor Kontrak Resmi
                  </label>
                  <input
                    type="text"
                    value={contractNumber}
                    onChange={(e) => setContractNumber(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Total Nilai Kontrak (Rp)
                  </label>
                  <input
                    type="number"
                    value={contractValue}
                    onChange={(e) => setContractValue(Number(e.target.value))}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Format Terbaca: {formatIDR(contractValue)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tanggal Mulai Kontrak
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={targetEndDate}
                    onChange={(e) => setTargetEndDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Status Eksekusi
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectInfo['status'])}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="Belum Mulai">Belum Mulai</option>
                    <option value="Perencanaan">Perencanaan</option>
                    <option value="Berjalan">Berjalan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Ditunda">Ditunda</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Toast Alert */}
          {savedSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Pengaturan Nama &amp; Identitas Proyek Berhasil Diperbarui!</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-5">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> Reset Default
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" /> Simpan Perubahan Nama
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
