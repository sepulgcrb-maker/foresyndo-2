import React, { useState } from 'react';
import {
  UserRole,
  ProjectInfo,
  StakeholderRoleProfile,
  StakeholderRoleKey,
  RolePermissions,
  ActiveTab,
} from '../../types';
import { ALL_PROJECT_TABS, INITIAL_STAKEHOLDER_PROFILES } from '../../data/initialData';
import {
  ShieldCheck,
  HardHat,
  Award,
  Compass,
  CheckCircle2,
  X,
  Edit3,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  Building2,
  UserCheck,
  Mail,
  Phone,
  FileCheck2,
  Info,
  ArrowRight,
  Lock,
  Unlock,
  Layers,
  FileSpreadsheet,
  LayoutDashboard,
  CalendarDays,
  LineChart,
  BarChart3,
  ClipboardList,
  Camera,
  CreditCard,
  Boxes,
  Users,
  Truck,
  ShieldAlert,
  Sliders,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  KeyRound,
  Files,
} from 'lucide-react';
import { RoleBadge } from './RoleBadge';
import { SafeImage } from './SafeImage';

interface RoleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  profiles: Record<StakeholderRoleKey, StakeholderRoleProfile>;
  onUpdateProfiles: (profiles: Record<StakeholderRoleKey, StakeholderRoleProfile>) => void;
  project: ProjectInfo;
  onUpdateProjectSignatories?: (signatories: Partial<ProjectInfo>) => void;
  onAddAuditLog?: (action: string, detail: string) => void;
  initialSubTab?: 'profiles' | 'permissions' | 'matrix' | 'workflow' | 'pins';
  rolePins: Record<StakeholderRoleKey, string>;
  onUpdateRolePins: (pins: Record<StakeholderRoleKey, string>) => void;
}

interface ModuleItem {
  id: ActiveTab;
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MODULE_ITEMS: ModuleItem[] = [
  { id: 'dashboard', label: 'Dashboard Utama', desc: 'Ringkasan progres fisik, deviasi, keuangan, & cuaca', icon: LayoutDashboard },
  { id: 'schedule', label: 'Time Schedule', desc: 'Daftar bobot, target, & progres realisasi sektor pekerjaan', icon: CalendarDays },
  { id: 'calendar', label: 'Kalender Proyek', desc: 'Jadwal milestone, rapat koordinasi, & agenda krusial', icon: CalendarDays },
  { id: 'scurve', label: 'Grafik Kurva S', desc: 'Visualisasi kurva rencana vs realisasi & deviasi progres', icon: LineChart },
  { id: 'gantt', label: 'Gantt Chart', desc: 'Timeline bar chart jadwal pelaksanaan per item pekerjaan', icon: BarChart3 },
  { id: 'daily', label: 'Monitoring Harian', desc: 'Log cuaca, presensi mandor, & ringkasan aktivitas fisik', icon: ClipboardList },
  { id: 'photos', label: 'Dokumentasi Foto', desc: 'Galeri dokumentasi progres fisik mingguan di lapangan', icon: Camera },
  { id: 'termin', label: 'Pembayaran Termin', desc: 'Klaim termin, verifikasi opname, & pencairan dana proyek', icon: CreditCard },
  { id: 'contractor-finance', label: 'Keuangan Proyek Kontraktor', desc: 'Arus kas (Cash Flow) proyek, pencairan termin vs realisasi pengeluaran, & laba/rugi', icon: CreditCard },
  { id: 'suppliers', label: 'Rekanan Supplier & PO', desc: 'Direktori mitra pemasok bahan, purchase order (PO), & riwayat pengiriman material', icon: Boxes },
  { id: 'materials', label: 'Monitoring Material', desc: 'Inventaris bahan bangunan, SPB, & deteksi dini defisit stok', icon: Boxes },
  { id: 'workforce', label: 'Tenaga Kerja', desc: 'Alokasi tukang/mandor, jam kerja, & perhitungan upah harian', icon: Users },
  { id: 'equipment', label: 'Monitoring Alat', desc: 'Jam operasional (HM), kondisi, & perawatan alat berat', icon: Truck },
  { id: 'documents', label: 'Manajemen Dokumen Proyek', desc: 'Arsip PDF kontrak, gambar teknis DED/Shop Drawing, & notulen rapat SCM', icon: Files },
  { id: 'inspection', label: 'Inspeksi & BAST Akhir', desc: 'Audit mutu, punch list cacat, & penandatanganan BAST PHO/FHO', icon: ShieldCheck },
  { id: 'reports', label: 'Pusat Laporan Resmi', desc: 'Ekspor laporan mingguan/bulanan berformat PDF & Excel', icon: FileSpreadsheet },
];

interface ActionPermissionDef {
  key: keyof Omit<RolePermissions, 'allowedTabs'>;
  label: string;
  desc: string;
  category: 'financial' | 'operations' | 'quality';
}

const ACTION_PERMISSIONS: ActionPermissionDef[] = [
  // Finansial & Kontrak
  {
    key: 'canApproveTermin',
    label: 'Otorisasi Pencairan Dana Termin',
    desc: 'Kuasa persetujuan final untuk mencairkan voucher pembayaran termin dari kas proyek',
    category: 'financial',
  },
  {
    key: 'canVerifyOpname',
    label: 'Verifikasi Fisik & Opname Lapangan',
    desc: 'Kewenangan mengaudit dan memvalidasi Berita Acara Opname fisik sebagai syarat termin',
    category: 'financial',
  },
  {
    key: 'canSubmitTermin',
    label: 'Pengajuan Berkas Tagihan Termin',
    desc: 'Hak mengajukan berkas invoice klaim pembayaran termin berserta lampiran progres',
    category: 'financial',
  },
  {
    key: 'canEditProjectBudget',
    label: 'Modifikasi Nilai Kontrak & RAB Addendum',
    desc: 'Wewenang mengubah anggaran kontrak, volume item RAB, dan menyetujui CCO (Change Order)',
    category: 'financial',
  },

  // Operasional & Pelaksanaan Lapangan
  {
    key: 'canInputDailyLog',
    label: 'Pengisian Laporan Harian Pekerjaan',
    desc: 'Hak menginput log harian, catatan cuaca shift, alat aktif, dan catatan mandor',
    category: 'operations',
  },
  {
    key: 'canEditSchedule',
    label: 'Modifikasi Time Schedule & Bobot',
    desc: 'Hak menambah item pekerjaan, menggeser tanggal milestone, dan mengubah bobot kurva',
    category: 'operations',
  },
  {
    key: 'canManageMaterial',
    label: 'Pengendalian Stok & SPB Logistik',
    desc: 'Hak mencatat surat jalan material masuk, pemakaian di lapangan, dan pemesanan darurat',
    category: 'operations',
  },
  {
    key: 'canManageWorkers',
    label: 'Alokasi Roster & Presensi Pekerja',
    desc: 'Hak mengelola kehadiran tukang, mandor, jam lembur, dan pembagian upah harian',
    category: 'operations',
  },
  {
    key: 'canManageEquipment',
    label: 'Monitoring & Jam Operasi Alat Berat',
    desc: 'Hak input catatan jam kerja (Hour Meter), status BBM, dan jadwal servis excavator/crane',
    category: 'operations',
  },
  {
    key: 'canUploadDocumentation',
    label: 'Unggah Foto Dokumentasi Lapangan',
    desc: 'Hak mengunggah foto progres mingguan beresolusi tinggi ke galeri resmi proyek',
    category: 'operations',
  },
  {
    key: 'canUploadDocuments',
    label: 'Unggah Dokumen, Gambar & Notulen',
    desc: 'Hak mengunggah arsip PDF kontrak, gambar shop drawing/as-built, dan notulen rapat SCM',
    category: 'operations',
  },
  {
    key: 'canDeleteDocuments',
    label: 'Penghapusan Arsip Dokumen Proyek',
    desc: 'Wewenang menghapus arsip berkas dokumen atau gambar kerja dari repositori proyek',
    category: 'operations',
  },

  // Pengawasan Mutu & BAST
  {
    key: 'canApproveDocuments',
    label: 'Verifikasi & Approval Dokumen Teknis',
    desc: 'Kewenangan menyetujui, meminta revisi, dan menandatangani review shop drawing & berita acara',
    category: 'quality',
  },
  {
    key: 'canConductQCInspection',
    label: 'Audit Mutu & Checklist Inspeksi QC',
    desc: 'Hak melakukan audit checklist mutu pembesian, pengecoran, arsitektur, dan MEP',
    category: 'quality',
  },
  {
    key: 'canCreatePunchList',
    label: 'Penerbitan Catatan Cacat / Punch List',
    desc: 'Hak menerbitkan daftar defect atau cacat mutu yang wajib diperbaiki sebelum serah terima',
    category: 'quality',
  },
  {
    key: 'canApproveBAST',
    label: 'Pengesahan BAST I (PHO) & BAST II (FHO)',
    desc: 'Kewenangan menandatangani Berita Acara Serah Terima Pertama & Akhir secara digital',
    category: 'quality',
  },
  {
    key: 'canExportOfficialReports',
    label: 'Ekspor Berkas Laporan Resmi (PDF/Excel)',
    desc: 'Izin mengunduh dan mencetak dokumen eksekutif berstempel resmi untuk pelaporan',
    category: 'quality',
  },
];

export const RoleManagementModal: React.FC<RoleManagementModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onRoleChange,
  profiles,
  onUpdateProfiles,
  project,
  onUpdateProjectSignatories,
  onAddAuditLog,
  initialSubTab = 'profiles',
  rolePins,
  onUpdateRolePins,
}) => {
  const [activeTab, setActiveTab] = useState<'profiles' | 'permissions' | 'matrix' | 'workflow' | 'pins'>(initialSubTab);
  const [editingRole, setEditingRole] = useState<StakeholderRoleKey | null>(null);

  // Buffer state for role permissions editor
  const [selectedPermRole, setSelectedPermRole] = useState<StakeholderRoleKey>('Kontraktor');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form edit buffer for profile credentials
  const [formData, setFormData] = useState<StakeholderRoleProfile | null>(null);

  // PIN Management State (Owner Exclusive)
  const [editingPinRole, setEditingPinRole] = useState<StakeholderRoleKey | null>(null);
  const [newPinValue, setNewPinValue] = useState<string>('');
  const [pinVisibility, setPinVisibility] = useState<Record<StakeholderRoleKey, boolean>>({
    Owner: false,
    Konsultan: false,
    Kontraktor: false,
    Viewer: false,
  });
  const [copiedRole, setCopiedRole] = useState<StakeholderRoleKey | null>(null);

  // KONTRAKTOR STRICTLY CANNOT VIEW OR ACCESS ROLE MANAGEMENT MODAL
  if (!isOpen || currentRole === 'Kontraktor' || currentRole === 'Site Manager') return null;

  const isOwner = currentRole === 'Owner' || currentRole === 'Direktur';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const togglePinVisibility = (role: StakeholderRoleKey) => {
    setPinVisibility((prev) => ({ ...prev, [role]: !prev[role] }));
  };

  const handleStartEditPin = (role: StakeholderRoleKey) => {
    if (!isOwner) return;
    setEditingPinRole(role);
    setNewPinValue(rolePins[role] || '');
  };

  const handleCancelEditPin = () => {
    setEditingPinRole(null);
    setNewPinValue('');
  };

  const handleSavePin = (role: StakeholderRoleKey) => {
    if (!isOwner) return;
    const cleanPin = newPinValue.trim();
    if (!cleanPin) {
      showToast('PIN tidak boleh kosong. Masukkan minimal 4 karakter.');
      return;
    }
    if (cleanPin.length < 4) {
      showToast('PIN terlalu pendek. Minimal 4 karakter demi keamanan.');
      return;
    }

    const updatedPins = {
      ...rolePins,
      [role]: cleanPin,
    };
    onUpdateRolePins(updatedPins);
    onAddAuditLog?.('Update PIN Keamanan', `Owner memperbarui sandi PIN akses untuk peran ${role}`);
    showToast(`PIN keamanan untuk ${role} berhasil diperbarui dan disimpan.`);
    setEditingPinRole(null);
    setNewPinValue('');
  };

  const handleGenerateRandomPin = () => {
    if (!isOwner) return;
    const randomNum = Math.floor(100000 + Math.random() * 900000).toString();
    setNewPinValue(randomNum);
  };

  const handleCopyPin = (role: StakeholderRoleKey, pinValue: string) => {
    navigator.clipboard.writeText(pinValue);
    setCopiedRole(role);
    showToast(`PIN ${role} berhasil disalin ke clipboard.`);
    setTimeout(() => setCopiedRole(null), 2500);
  };

  const handleStartEdit = (role: StakeholderRoleKey) => {
    setEditingRole(role);
    setFormData({ ...profiles[role] });
  };

  const handleCancelEdit = () => {
    setEditingRole(null);
    setFormData(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !formData) return;

    const updated = {
      ...profiles,
      [editingRole]: formData,
    };

    onUpdateProfiles(updated);

    // Synchronize with project metadata for PDF exports & BAST
    if (onUpdateProjectSignatories) {
      if (editingRole === 'Owner') {
        onUpdateProjectSignatories({
          owner: formData.company,
          director: formData.personName,
        });
      } else if (editingRole === 'Konsultan') {
        onUpdateProjectSignatories({
          inspector: formData.personName,
          qcEngineer: formData.personName,
        });
      } else if (editingRole === 'Kontraktor') {
        onUpdateProjectSignatories({
          contractor: formData.company,
          siteManager: formData.personName,
        });
      }
    }

    if (onAddAuditLog) {
      onAddAuditLog(
        `Update Profil ${editingRole}`,
        `Mengubah personil ${editingRole} menjadi ${formData.personName} (${formData.company})`
      );
    }

    showToast(`Profil personil ${editingRole} berhasil diperbarui.`);
    setEditingRole(null);
    setFormData(null);
  };

  const handleSelectRole = (role: UserRole) => {
    onRoleChange(role);
    if (onAddAuditLog) {
      onAddAuditLog('Switch Active Role', `Beralih peran aktif menjadi: ${role}`);
    }
  };

  // Permission Modification Handlers (Owner Only)
  const handleToggleModuleTab = (tabId: ActiveTab) => {
    if (!isOwner) return;
    const targetProfile = profiles[selectedPermRole];
    if (!targetProfile) return;

    const currentAllowed = targetProfile.permissions.allowedTabs || ALL_PROJECT_TABS;
    const isCurrentlyAllowed = currentAllowed.includes(tabId);

    let newAllowed: ActiveTab[];
    if (isCurrentlyAllowed) {
      // Don't allow removing dashboard completely to prevent blank screen trap
      if (tabId === 'dashboard') {
        showToast('Modul Dashboard Utama harus tetap aktif untuk navigasi dasar.');
        return;
      }
      newAllowed = currentAllowed.filter((t) => t !== tabId);
    } else {
      newAllowed = [...currentAllowed, tabId];
    }

    const updated: Record<StakeholderRoleKey, StakeholderRoleProfile> = {
      ...profiles,
      [selectedPermRole]: {
        ...targetProfile,
        permissions: {
          ...targetProfile.permissions,
          allowedTabs: newAllowed,
        },
      },
    };

    onUpdateProfiles(updated);
    const actionDesc = !isCurrentlyAllowed ? 'mengaktifkan modul' : 'membatasi modul';
    showToast(`Owner ${actionDesc} "${tabId}" untuk ${selectedPermRole}`);
    onAddAuditLog?.('Kelola Akses Modul', `Owner ${actionDesc} [${tabId}] untuk role ${selectedPermRole}`);
  };

  const handleToggleActionPermission = (permKey: keyof Omit<RolePermissions, 'allowedTabs'>) => {
    if (!isOwner) return;
    const targetProfile = profiles[selectedPermRole];
    if (!targetProfile) return;

    const currentVal = targetProfile.permissions[permKey];
    const updated: Record<StakeholderRoleKey, StakeholderRoleProfile> = {
      ...profiles,
      [selectedPermRole]: {
        ...targetProfile,
        permissions: {
          ...targetProfile.permissions,
          [permKey]: !currentVal,
        },
      },
    };

    onUpdateProfiles(updated);
    const stateStr = !currentVal ? 'DIIZINKAN' : 'DIBATASI';
    showToast(`Hak akses "${String(permKey)}" untuk ${selectedPermRole} sekarang ${stateStr}`);
    onAddAuditLog?.('Kelola Izin Aksi', `Owner mengubah izin ${String(permKey)} pada role ${selectedPermRole} menjadi ${stateStr}`);
  };

  const handleGrantFullAccess = (targetRole: StakeholderRoleKey) => {
    if (!isOwner) return;
    const targetProfile = profiles[targetRole];
    if (!targetProfile) return;

    const fullPermissions: RolePermissions = {
      canApproveTermin: true,
      canVerifyOpname: true,
      canSubmitTermin: true,
      canEditSchedule: true,
      canInputDailyLog: true,
      canManageMaterial: true,
      canManageWorkers: true,
      canManageEquipment: true,
      canConductQCInspection: true,
      canCreatePunchList: true,
      canApproveBAST: true,
      canUploadDocumentation: true,
      canExportOfficialReports: true,
      canEditProjectBudget: true,
      canUploadDocuments: true,
      canApproveDocuments: true,
      canDeleteDocuments: true,
      allowedTabs: [...ALL_PROJECT_TABS],
    };

    const updated: Record<StakeholderRoleKey, StakeholderRoleProfile> = {
      ...profiles,
      [targetRole]: {
        ...targetProfile,
        permissions: fullPermissions,
      },
    };

    onUpdateProfiles(updated);
    showToast(`Seluruh modul dan kewenangan aksi telah dibuka untuk ${targetRole}.`);
    onAddAuditLog?.('Beri Akses Penuh', `Owner memberikan full permissions untuk role ${targetRole}`);
  };

  const handleSetReadOnlyAccess = (targetRole: StakeholderRoleKey) => {
    if (!isOwner) return;
    const targetProfile = profiles[targetRole];
    if (!targetProfile) return;

    const readOnlyPermissions: RolePermissions = {
      canApproveTermin: false,
      canVerifyOpname: false,
      canSubmitTermin: false,
      canEditSchedule: false,
      canInputDailyLog: false,
      canManageMaterial: false,
      canManageWorkers: false,
      canManageEquipment: false,
      canConductQCInspection: false,
      canCreatePunchList: false,
      canApproveBAST: false,
      canUploadDocumentation: false,
      canExportOfficialReports: true,
      canEditProjectBudget: false,
      canUploadDocuments: false,
      canApproveDocuments: false,
      canDeleteDocuments: false,
      allowedTabs: ['dashboard', 'schedule', 'calendar', 'scurve', 'gantt', 'photos', 'documents', 'reports'],
    };

    const updated: Record<StakeholderRoleKey, StakeholderRoleProfile> = {
      ...profiles,
      [targetRole]: {
        ...targetProfile,
        permissions: readOnlyPermissions,
      },
    };

    onUpdateProfiles(updated);
    showToast(`Role ${targetRole} diatur ke Mode Hanya Baca (Read-Only).`);
    onAddAuditLog?.('Mode Read-Only', `Owner mengubah role ${targetRole} menjadi mode pengawas / hanya baca`);
  };

  const handleResetToStandardSOP = (targetRole: StakeholderRoleKey) => {
    if (!isOwner) return;
    const initialForRole = INITIAL_STAKEHOLDER_PROFILES[targetRole]?.permissions;
    if (!initialForRole) return;

    const updated: Record<StakeholderRoleKey, StakeholderRoleProfile> = {
      ...profiles,
      [targetRole]: {
        ...profiles[targetRole],
        permissions: { ...initialForRole },
      },
    };

    onUpdateProfiles(updated);
    showToast(`Hak akses ${targetRole} telah direset ke Standar SOP FIDIC/PUPR.`);
    onAddAuditLog?.('Reset SOP', `Owner me-reset hak akses role ${targetRole} ke standar acuan`);
  };

  const handleSelectAllModules = () => {
    if (!isOwner) return;
    const targetProfile = profiles[selectedPermRole];
    if (!targetProfile) return;

    const updated: Record<StakeholderRoleKey, StakeholderRoleProfile> = {
      ...profiles,
      [selectedPermRole]: {
        ...targetProfile,
        permissions: {
          ...targetProfile.permissions,
          allowedTabs: [...ALL_PROJECT_TABS],
        },
      },
    };

    onUpdateProfiles(updated);
    showToast(`Seluruh 13 modul proyek kini dapat diakses oleh ${selectedPermRole}.`);
  };

  const handleRestrictAllModules = () => {
    if (!isOwner) return;
    const targetProfile = profiles[selectedPermRole];
    if (!targetProfile) return;

    // Keep dashboard only
    const updated: Record<StakeholderRoleKey, StakeholderRoleProfile> = {
      ...profiles,
      [selectedPermRole]: {
        ...targetProfile,
        permissions: {
          ...targetProfile.permissions,
          allowedTabs: ['dashboard'],
        },
      },
    };

    onUpdateProfiles(updated);
    showToast(`Akses modul untuk ${selectedPermRole} dibatasi hanya ke Dashboard Utama.`);
  };

  // Matrix data for RACI
  const matrixItems = [
    {
      task: 'Penyusunan Jadwal Induk (Master Time Schedule & Kurva S)',
      owner: 'A (Menyetujui Jadwal Final)',
      konsultan: 'C (Review Teknis Kelayakan Waktu)',
      kontraktor: 'R (Menyusun Rencana Metode Kerja & Jadwal)',
    },
    {
      task: 'Pengisian Laporan Harian & Cuaca',
      owner: 'I (Melihat Laporan)',
      konsultan: 'C (Verifikasi Checklist Lapangan)',
      kontraktor: 'R (Mengisi Log Tenaga Kerja, Alat, Cuaca)',
    },
    {
      task: 'Opname Fisik Lapangan (Mutual Check Progres)',
      owner: 'I (Menerima Berita Acara)',
      konsultan: 'A (Validasi Hasil Ukur & Kualitas)',
      kontraktor: 'R (Menyiapkan Pengukuran Bersama)',
    },
    {
      task: 'Pengajuan & Pencairan Termin',
      owner: 'A (Otorisasi Pembayaran Bank)',
      konsultan: 'C (Menerbitkan Rekomendasi Teknis)',
      kontraktor: 'R (Mengajukan Berkas Klaim Tagihan)',
    },
    {
      task: 'Audit Mutu & Checklist Inspeksi (QC)',
      owner: 'I (Laporan Hasil Mutu)',
      konsultan: 'R/A (Inspeksi Struktur, Arsitektur, MEP)',
      kontraktor: 'R (Mempersiapkan Benda Uji & Lokasi)',
    },
    {
      task: 'Penerbitan Punch List Cacat Pekerjaan',
      owner: 'I (Memonitor Realisasi Perbaikan)',
      konsultan: 'R/A (Menerbitkan Daftar Cacat Mutu)',
      kontraktor: 'R (Memperbaiki Seluruh Cacat Sebelum Serah Terima)',
    },
    {
      task: 'Serah Terima Pertama (BAST-1 / PHO)',
      owner: 'A (Menandatangani BAST I Resmi)',
      konsultan: 'C (Menyatakan Kelayakan Fisik 100%)',
      kontraktor: 'R (Menyerahkan Hasil Pekerjaan Lengkap)',
    },
    {
      task: 'Addendum Kontrak & Perubahan Nilai RAB (CCO)',
      owner: 'A (Persetujuan Dana Tambah/Kurang)',
      konsultan: 'C (Justifikasi Teknis Lapangan)',
      kontraktor: 'R (Mengusulkan Harga Satuan Tambahan)',
    },
  ];

  const currentPermProfile = profiles[selectedPermRole] || INITIAL_STAKEHOLDER_PROFILES[selectedPermRole];
  const currentAllowedTabs = currentPermProfile?.permissions?.allowedTabs || ALL_PROJECT_TABS;

  // Count active action permissions
  const activeActionPermCount = currentPermProfile?.permissions
    ? Object.entries(currentPermProfile.permissions).filter(([k, v]) => k !== 'allowedTabs' && v === true).length
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Manajemen Peran & Pengaturan Hak Akses
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Tripartit + Kendali Owner
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pusat Tata Kelola Proyek: Profil Badan Usaha, Konfigurasi Hak Akses Owner, dan Matriks RACI
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 py-3">
            <button
              onClick={() => setActiveTab('profiles')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'profiles'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Profil Tiga Pihak</span>
            </button>

            {/* TAB: ATUR HAK AKSES (OWNER) */}
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'permissions'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Atur Hak Akses Role</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                activeTab === 'permissions' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
              }`}>
                Wewenang Owner
              </span>
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Matriks RACI</span>
            </button>

            <button
              onClick={() => setActiveTab('workflow')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'workflow'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Alur Kerja & SOP</span>
            </button>

            {/* TAB 5: ATUR PIN KEAMANAN (OWNER) */}
            <button
              onClick={() => setActiveTab('pins')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'pins'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Atur PIN Keamanan</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-black uppercase ${
                activeTab === 'pins' ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
              }`}>
                Wewenang Owner
              </span>
            </button>
          </div>

          {/* Current Active Role Pill */}
          <div className="hidden md:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 shrink-0">
            <span className="text-[11px] text-slate-400">Role Anda:</span>
            <RoleBadge role={currentRole} />
          </div>
        </div>

        {/* Notification Toast */}
        {toastMessage && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-amber-300 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-semibold">{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-amber-400/80 hover:text-white text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* ============================================================== */}
          {/* TAB 1: PROFILES */}
          {/* ============================================================== */}
          {activeTab === 'profiles' && (
            <div className="space-y-6">
              {/* Quick Switch Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Simulasi Interaktif Hak Akses</h4>
                    <p className="text-[11px] text-slate-400">
                      Pilih kartu di bawah ini untuk beralih mode wewenang atau perbarui data penanggung jawab resmi.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="text-[11px] text-slate-400 mr-1 font-medium">Beralih Cepat:</span>
                  {(['Owner', 'Konsultan', 'Kontraktor', 'Viewer'] as const).map((r) => {
                    const isSelected =
                      currentRole === r ||
                      (r === 'Owner' && currentRole === 'Direktur') ||
                      (r === 'Kontraktor' && currentRole === 'Site Manager');
                    return (
                      <button
                        key={r}
                        onClick={() => handleSelectRole(r)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-500 text-white shadow-md'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stakeholder Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['Owner', 'Konsultan', 'Kontraktor'] as const).map((roleKey) => {
                  const p = profiles[roleKey] || INITIAL_STAKEHOLDER_PROFILES[roleKey];
                  const isActive =
                    currentRole === roleKey ||
                    (roleKey === 'Owner' && currentRole === 'Direktur') ||
                    (roleKey === 'Kontraktor' && currentRole === 'Site Manager');

                  const allowedCount = p.permissions.allowedTabs ? p.permissions.allowedTabs.length : 13;

                  return (
                    <div
                      key={roleKey}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                        isActive
                          ? 'bg-slate-800/90 border-orange-500 ring-2 ring-orange-500/20 shadow-xl'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Role Header */}
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <SafeImage
                                src={p.avatarUrl}
                                alt={p.personName}
                                className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-700"
                              />
                              {p.digitalSignatureActive && (
                                <div
                                  className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow"
                                  title="Tanda Tangan Digital Tersertifikasi"
                                >
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5">
                                <RoleBadge role={roleKey} />
                                {isActive && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-white mt-1 leading-tight">{p.personName}</h4>
                              <p className="text-[11px] text-slate-400">{p.position}</p>
                            </div>
                          </div>
                        </div>

                        {/* Company & Contact Details */}
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Entitas Resmi:</span>
                            <p className="font-semibold text-slate-200 truncate">{p.company}</p>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 space-y-1">
                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              <span className="truncate">{p.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              <span>{p.phone}</span>
                            </div>
                            {p.skNumber && (
                              <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                                <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
                                <span className="truncate">SK: {p.skNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Allowed Modules & Permissions Badge */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-400 uppercase tracking-wider">Akses Modul:</span>
                            <span className="text-amber-400 font-bold">{allowedCount} / 13 Modul</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full transition-all"
                              style={{ width: `${(allowedCount / 13) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2 mt-4">
                        <button
                          onClick={() => handleStartEdit(roleKey)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-orange-400" />
                          <span>Edit Personil</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedPermRole(roleKey);
                            setActiveTab('permissions');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-bold border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Atur Izin</span>
                        </button>

                        {!isActive ? (
                          <button
                            onClick={() => handleSelectRole(roleKey)}
                            className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer"
                          >
                            Pilih
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Aktif
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Edit Modal Dialog for Profile Info */}
              {editingRole && formData && (
                <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4 animate-in fade-in">
                  <form
                    onSubmit={handleSaveEdit}
                    className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <RoleBadge role={editingRole} />
                        <h4 className="font-bold text-white text-sm">Edit Data Pejabat Resmi</h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Nama Pejabat / Penanggung Jawab:</label>
                        <input
                          type="text"
                          required
                          value={formData.personName}
                          onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Jabatan Resmi Proyek:</label>
                        <input
                          type="text"
                          required
                          value={formData.position}
                          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Nama Badan Usaha / Perusahaan:</label>
                        <input
                          type="text"
                          required
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-400 mb-1 font-semibold">Email:</label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-1 font-semibold">Nomor Telepon / WA:</label>
                          <input
                            type="text"
                            required
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">No. SK / Penunjukan / IUJK:</label>
                        <input
                          type="text"
                          value={formData.skNumber || ''}
                          onChange={(e) => setFormData({ ...formData, skNumber: e.target.value })}
                          placeholder="e.g. SK-DIR/FGI/2026/001"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white">Status Tanda Tangan Digital Resmi</p>
                          <p className="text-[10px] text-slate-400">Aktifkan verifikasi digital pada BAST dan voucher</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.digitalSignatureActive}
                          onChange={(e) => setFormData({ ...formData, digitalSignatureActive: e.target.checked })}
                          className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Save className="w-4 h-4" /> Simpan Perubahan
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: ATUR HAK AKSES ROLE (OWNER ONLY) */}
          {/* ============================================================== */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              {/* Owner Authority Banner / Lock Guard */}
              {isOwner ? (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950">
                          Mode Kontrol Owner Aktif
                        </span>
                        <span className="text-xs text-slate-300 font-semibold">
                          Otoritas: {profiles.Owner.personName}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-black text-white mt-1">
                        Kendali Penuh Akses & Wewenang Proyek
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed max-w-2xl">
                        Sebagai Pemilik Proyek, Anda berhak mengatur visibilitas 13 modul navigasi dan mengaktifkan/menonaktifkan
                        14 kewenangan aksi untuk Konsultan, Kontraktor, dan Viewer secara real-time.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => handleGrantFullAccess(selectedPermRole)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Beri hak akses semua modul dan semua tindakan"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Beri Akses Penuh</span>
                    </button>

                    <button
                      onClick={() => handleSetReadOnlyAccess(selectedPermRole)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Atur hanya bisa melihat data tanpa izin ubah atau approve"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Hanya Lihat (Read-Only)</span>
                    </button>

                    <button
                      onClick={() => handleResetToStandardSOP(selectedPermRole)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Kembalikan ke standar SOP konstruksi FIDIC/PUPR"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset SOP Standar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Akses Terbatas: Read-Only
                        </span>
                        <span className="text-xs text-slate-300">
                          Role Aktif: <strong>{currentRole}</strong>
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-white mt-1">
                        Pengaturan Hak Akses Hanya Dapat Diubah oleh Owner Proyek
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Anda sedang melihat pengaturan dalam mode pratinjau. Untuk mengubah hak akses atau membuka modul yang dibatasi,
                        beralihlah ke simulasi role Owner di bawah ini.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectRole('Owner')}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer shrink-0"
                  >
                    <Award className="w-4 h-4" />
                    <span>Beralih ke Role Owner</span>
                  </button>
                </div>
              )}

              {/* Stakeholder Target Role Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-orange-400" />
                    <span>Pilih Role yang Akan Dikelola Aksesnya:</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Sedang Mengatur: <strong className="text-white">{profiles[selectedPermRole]?.roleName}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(['Owner', 'Konsultan', 'Kontraktor', 'Viewer'] as const).map((rKey) => {
                    const profile = profiles[rKey] || INITIAL_STAKEHOLDER_PROFILES[rKey];
                    const isSelected = selectedPermRole === rKey;
                    const tabsCount = profile.permissions.allowedTabs ? profile.permissions.allowedTabs.length : 13;

                    return (
                      <button
                        key={rKey}
                        onClick={() => setSelectedPermRole(rKey)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-slate-800 border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <RoleBadge role={rKey} />
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs font-bold text-white truncate mt-1">{profile.personName}</p>
                        <p className="text-[10px] text-slate-400 truncate">{profile.company}</p>
                        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Modul:</span>
                          <span className="font-bold text-amber-400">{tabsCount}/13</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================== */}
              {/* SECTION 1: MODULE NAVIGATION ACCESS (13 TABS) */}
              {/* ============================================================== */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                        1
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        Hak Akses Halaman & Modul Proyek ({currentAllowedTabs.length} / 13 Modul Aktif)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Pilih modul navigasi mana saja yang diizinkan untuk dibuka dan dilihat oleh role{' '}
                      <strong className="text-white">{selectedPermRole}</strong>.
                    </p>
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={handleSelectAllModules}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer transition-all"
                      >
                        Pilih Semua Modul
                      </button>
                      <button
                        onClick={handleRestrictAllModules}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer transition-all"
                      >
                        Batasi Semua (Dashboard Saja)
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {MODULE_ITEMS.map((mod) => {
                    const Icon = mod.icon;
                    const isAllowed = currentAllowedTabs.includes(mod.id);
                    const isDashboard = mod.id === 'dashboard';

                    return (
                      <div
                        key={mod.id}
                        onClick={() => {
                          if (isOwner && !isDashboard) {
                            handleToggleModuleTab(mod.id);
                          }
                        }}
                        className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isAllowed
                            ? 'bg-slate-900/90 border-slate-700 hover:border-slate-600'
                            : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        } ${isOwner && !isDashboard ? 'cursor-pointer hover:bg-slate-900' : ''}`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div
                            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                              isAllowed
                                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-xs font-bold truncate ${isAllowed ? 'text-white' : 'text-slate-500'}`}>
                                {mod.label}
                              </p>
                              {isDashboard && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-bold">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                              {mod.desc}
                            </p>
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <div className="shrink-0 pt-0.5">
                          <button
                            type="button"
                            disabled={!isOwner || isDashboard}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleModuleTab(mod.id);
                            }}
                            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              !isOwner || isDashboard ? 'cursor-not-allowed' : 'cursor-pointer'
                            } ${isAllowed ? 'bg-amber-500' : 'bg-slate-700'}`}
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                isAllowed ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================== */}
              {/* SECTION 2: FINANCIAL & CONTRACT PERMISSIONS */}
              {/* ============================================================== */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    2
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Kewenangan Finansial & Dokumen Kontrak</h4>
                    <p className="text-xs text-slate-400">
                      Izin pengesahan voucher pembayaran termin, verifikasi opname fisik, dan perubahan anggaran RAB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ACTION_PERMISSIONS.filter((p) => p.category === 'financial').map((action) => {
                    const isAllowed = Boolean(currentPermProfile.permissions[action.key]);

                    return (
                      <div
                        key={action.key}
                        onClick={() => {
                          if (isOwner) handleToggleActionPermission(action.key);
                        }}
                        className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isAllowed
                            ? 'bg-slate-900/90 border-slate-700 hover:border-slate-600'
                            : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        } ${isOwner ? 'cursor-pointer hover:bg-slate-900' : ''}`}
                      >
                        <div className="space-y-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${isAllowed ? 'bg-amber-400' : 'bg-slate-600'}`}
                            />
                            <h5 className={`text-xs font-bold ${isAllowed ? 'text-white' : 'text-slate-400'}`}>
                              {action.label}
                            </h5>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed pl-4">{action.desc}</p>
                        </div>

                        <button
                          type="button"
                          disabled={!isOwner}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActionPermission(action.key);
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            !isOwner ? 'cursor-not-allowed' : 'cursor-pointer'
                          } ${isAllowed ? 'bg-amber-500' : 'bg-slate-700'}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              isAllowed ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================== */}
              {/* SECTION 3: OPERATIONS & FIELD EXECUTION */}
              {/* ============================================================== */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    3
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Kewenangan Operasional & Pelaksanaan Lapangan</h4>
                    <p className="text-xs text-slate-400">
                      Izin pengisian log harian, modifikasi time schedule, inventaris material, alokasi tukang, dan alat berat.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ACTION_PERMISSIONS.filter((p) => p.category === 'operations').map((action) => {
                    const isAllowed = Boolean(currentPermProfile.permissions[action.key]);

                    return (
                      <div
                        key={action.key}
                        onClick={() => {
                          if (isOwner) handleToggleActionPermission(action.key);
                        }}
                        className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isAllowed
                            ? 'bg-slate-900/90 border-slate-700 hover:border-slate-600'
                            : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        } ${isOwner ? 'cursor-pointer hover:bg-slate-900' : ''}`}
                      >
                        <div className="space-y-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${isAllowed ? 'bg-emerald-400' : 'bg-slate-600'}`}
                            />
                            <h5 className={`text-xs font-bold ${isAllowed ? 'text-white' : 'text-slate-400'}`}>
                              {action.label}
                            </h5>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed pl-4">{action.desc}</p>
                        </div>

                        <button
                          type="button"
                          disabled={!isOwner}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActionPermission(action.key);
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            !isOwner ? 'cursor-not-allowed' : 'cursor-pointer'
                          } ${isAllowed ? 'bg-emerald-500' : 'bg-slate-700'}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              isAllowed ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ============================================================== */}
              {/* SECTION 4: QUALITY CONTROL & BAST */}
              {/* ============================================================== */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    4
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">Kewenangan Pengawasan Mutu (QC), Punch List, & BAST</h4>
                    <p className="text-xs text-slate-400">
                      Izin audit checklist mutu, penerbitan defect list, tanda tangan BAST serah terima, dan ekspor laporan resmi.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ACTION_PERMISSIONS.filter((p) => p.category === 'quality').map((action) => {
                    const isAllowed = Boolean(currentPermProfile.permissions[action.key]);

                    return (
                      <div
                        key={action.key}
                        onClick={() => {
                          if (isOwner) handleToggleActionPermission(action.key);
                        }}
                        className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                          isAllowed
                            ? 'bg-slate-900/90 border-slate-700 hover:border-slate-600'
                            : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        } ${isOwner ? 'cursor-pointer hover:bg-slate-900' : ''}`}
                      >
                        <div className="space-y-1 pr-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${isAllowed ? 'bg-indigo-400' : 'bg-slate-600'}`}
                            />
                            <h5 className={`text-xs font-bold ${isAllowed ? 'text-white' : 'text-slate-400'}`}>
                              {action.label}
                            </h5>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-relaxed pl-4">{action.desc}</p>
                        </div>

                        <button
                          type="button"
                          disabled={!isOwner}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActionPermission(action.key);
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            !isOwner ? 'cursor-not-allowed' : 'cursor-pointer'
                          } ${isAllowed ? 'bg-indigo-500' : 'bg-slate-700'}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              isAllowed ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: RACI MATRIX */}
          {/* ============================================================== */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h4 className="font-bold text-white">Matriks Hak Akses & Tanggung Jawab (RACI Proyek)</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    R = Responsible (Pelaksana), A = Accountable (Pengambil Keputusan/Approval), C = Consulted (Penasihat/Audit), I = Informed (Penerima Laporan)
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">R = Pelaksana</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">A = Otoritas / Approval</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">C = Konsultasi / QC</span>
                  <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px] font-bold">I = Informasi</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                      <th className="p-3.5">Aktivitas / Alur Kerja Konstruksi</th>
                      <th className="p-3.5 text-center bg-amber-950/20 border-l border-r border-slate-800">
                        <span className="text-amber-400 font-black">1. OWNER</span>
                        <p className="text-[10px] text-slate-400 font-normal">Pemberi Tugas</p>
                      </th>
                      <th className="p-3.5 text-center bg-indigo-950/20 border-r border-slate-800">
                        <span className="text-indigo-400 font-black">2. KONSULTAN MK</span>
                        <p className="text-[10px] text-slate-400 font-normal">Pengawas Lapangan</p>
                      </th>
                      <th className="p-3.5 text-center bg-emerald-950/20">
                        <span className="text-emerald-400 font-black">3. KONTRAKTOR</span>
                        <p className="text-[10px] text-slate-400 font-normal">Pelaksana Fisik</p>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {matrixItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-semibold text-slate-200">{item.task}</td>
                        <td className="p-3.5 text-center bg-amber-950/10 border-l border-r border-slate-800 text-slate-300">
                          {item.owner}
                        </td>
                        <td className="p-3.5 text-center bg-indigo-950/10 border-r border-slate-800 text-slate-300">
                          {item.konsultan}
                        </td>
                        <td className="p-3.5 text-center bg-emerald-950/10 text-slate-300">
                          {item.kontraktor}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 4: WORKFLOW & SOP */}
          {/* ============================================================== */}
          {activeTab === 'workflow' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1: Kontraktor */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-emerald-500/30 space-y-3 relative">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center text-sm">
                    1
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Tahap Pelaksanaan Fisik</span>
                    <h4 className="text-sm font-black text-white">Kontraktor Pelaksana</h4>
                  </div>
                  <ul className="space-y-2 text-slate-300 list-disc list-inside text-[11px] leading-relaxed">
                    <li>Mengisi laporan log harian, absensi mandor, dan kondisi cuaca lapangan.</li>
                    <li>Melaksanakan pekerjaan fisik sesuai shop drawing dan jadwal Time Schedule.</li>
                    <li>Mengunggah foto dokumentasi bukti progres mingguan.</li>
                    <li>Mengajukan berkas permohonan klaim pembayaran termin setelah progres tercapai.</li>
                  </ul>
                </div>

                {/* Step 2: Konsultan MK */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-indigo-500/30 space-y-3 relative">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 font-black flex items-center justify-center text-sm">
                    2
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Tahap Pengawasan & Audit</span>
                    <h4 className="text-sm font-black text-white">Konsultan Pengawas (MK)</h4>
                  </div>
                  <ul className="space-y-2 text-slate-300 list-disc list-inside text-[11px] leading-relaxed">
                    <li>Melakukan audit checklist inspeksi mutu (Quality Control) pembesian & cor beton.</li>
                    <li>Melaksanakan opname fisik bersama untuk memverifikasi volume klaim termin.</li>
                    <li>Menerbitkan catatan cacat (Punch List) yang harus diperbaiki oleh kontraktor.</li>
                    <li>Menerbitkan surat rekomendasi kelayakan teknis pencairan termin kepada Owner.</li>
                  </ul>
                </div>

                {/* Step 3: Owner */}
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-amber-500/30 space-y-3 relative">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 font-black flex items-center justify-center text-sm">
                    3
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Tahap Otorisasi & Pembayaran</span>
                    <h4 className="text-sm font-black text-white">Owner (Pemilik Proyek)</h4>
                  </div>
                  <ul className="space-y-2 text-slate-300 list-disc list-inside text-[11px] leading-relaxed">
                    <li>Menerima rekomendasi teknis & verifikasi opname dari Konsultan MK.</li>
                    <li>Menyetujui (Approve) status pencairan voucher pembayaran termin.</li>
                    <li>Mengatur hak akses dan batas modul untuk setiap role di proyek ini.</li>
                    <li>Menandatangani Berita Acara Serah Terima Akhir (BAST I PHO & BAST II FHO).</li>
                  </ul>
                </div>
              </div>

              {/* Legal & Standard Box */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-bold text-white text-xs">Ketentuan Standar Kontrak Konstruksi (FIDIC & Permen PUPR)</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Struktur koordinasi tripartit ini memastikan tidak adanya konflik kepentingan (conflict of interest) antara pihak yang melaksanakan fisik, pihak yang mengawasi mutu, dan pihak yang mendanai proyek. Seluruh konfigurasi hak akses yang ditetapkan oleh Owner tersimpan dan terekam dalam audit log sistem.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 5: PINS MANAGEMENT (OWNER EXCLUSIVE) */}
          {/* ============================================================== */}
          {activeTab === 'pins' && (
            <div className="space-y-6">
              {/* Header Banner: Owner Authority */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 shrink-0">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-white tracking-tight">
                        Pusat Otoritas PIN Sandi Akses Peran
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Wewenang Eksklusif Owner
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      Sistem mengharuskan setiap pengguna memasukkan PIN resmi. Hanya Pemilik Proyek (Owner) yang berwenang menetapkan, mengubah, dan membagikan PIN akses ke masing-masing pihak.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Login Wajib PIN Aktif</span>
                  </div>
                </div>
              </div>

              {/* Policy Banner: No Bypass */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                <Info className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h5 className="font-bold text-white">Ketentuan Keamanan Login & Hapus PIN Default</h5>
                  <p className="text-slate-400 leading-relaxed text-[11px]">
                    Seluruh tombol pintas demo dan tombol isi otomatis PIN default telah dihapus secara permanen dari halaman login. Setiap pihak (Konsultan MK, Kontraktor Pelaksana, dan Pengawas) wajib memasukkan PIN resmi yang telah Anda tentukan di bawah ini. Tanpa PIN yang cocok, akses ditolak sepenuhnya.
                  </p>
                </div>
              </div>

              {!isOwner ? (
                /* Non-Owner Denied Box */
                <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-2">
                  <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto" />
                  <h4 className="text-sm font-bold text-rose-300">Wewenang Terbatas</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Hanya pengguna dengan peran <strong className="text-white">Owner / Direktur</strong> yang memiliki wewenang untuk mengatur atau mengubah PIN sandi akses peran. Anda saat ini login sebagai <strong className="text-amber-300">{currentRole}</strong>.
                  </p>
                </div>
              ) : (
                /* PIN Cards for 4 Stakeholders */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['Owner', 'Konsultan', 'Kontraktor', 'Viewer'] as const).map((roleKey) => {
                    const prof = profiles[roleKey] || INITIAL_STAKEHOLDER_PROFILES[roleKey];
                    const currentPin = rolePins[roleKey] || '';
                    const isEditing = editingPinRole === roleKey;
                    const isVisible = pinVisibility[roleKey];
                    const isCopied = copiedRole === roleKey;

                    return (
                      <div
                        key={roleKey}
                        className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4 relative overflow-hidden"
                      >
                        {/* Role Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-orange-400 font-bold">
                              {roleKey === 'Owner' && <ShieldCheck className="w-5 h-5 text-purple-400" />}
                              {roleKey === 'Konsultan' && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                              {roleKey === 'Kontraktor' && <HardHat className="w-5 h-5 text-amber-400" />}
                              {roleKey === 'Viewer' && <Eye className="w-5 h-5 text-slate-400" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-sm text-white">{prof.roleName || roleKey}</h5>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {roleKey}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">
                                {prof.personName} &bull; {prof.position}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Wajib PIN
                          </span>
                        </div>

                        {/* PIN Display or Edit Mode */}
                        {isEditing ? (
                          <div className="space-y-3 p-3.5 rounded-xl bg-slate-900 border border-amber-500/40">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                                <KeyRound className="w-3.5 h-3.5" /> Masukkan PIN Baru {roleKey}:
                              </label>
                              <button
                                type="button"
                                onClick={handleGenerateRandomPin}
                                className="text-[10px] font-bold text-orange-400 hover:text-orange-300 underline cursor-pointer"
                              >
                                Generate Acak (6 Digit)
                              </button>
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                value={newPinValue}
                                onChange={(e) => setNewPinValue(e.target.value)}
                                placeholder="Contoh: 889900"
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm font-bold tracking-widest focus:outline-none focus:border-amber-500"
                                autoFocus
                              />
                            </div>
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={handleCancelEditPin}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSavePin(roleKey)}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Simpan PIN</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                                <Lock className="w-4 h-4 text-orange-400" />
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                  Sandi PIN Akses:
                                </span>
                                <span className="font-mono text-base font-black text-white tracking-widest">
                                  {isVisible ? currentPin : '••••••'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => togglePinVisibility(roleKey)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                title={isVisible ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                              >
                                {isVisible ? <EyeOff className="w-4 h-4 text-orange-400" /> : <Eye className="w-4 h-4" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyPin(roleKey, currentPin)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                                title="Salin PIN ke Clipboard"
                              >
                                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                              </button>

                              {isOwner && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditPin(roleKey)}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Ubah PIN</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-500 flex items-center justify-between">
                          <span>Status: <strong className="text-slate-400">Aktif Wajib Diisi</strong></span>
                          <span>Wewenang: <strong className="text-amber-400">Hanya Owner yang dapat ubah</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Konfigurasi hak akses tersimpan otomatis dan berlaku seketika untuk semua pengguna</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all shadow-md cursor-pointer"
            >
              Tutup & Terapkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
