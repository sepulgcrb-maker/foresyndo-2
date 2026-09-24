import React, { useState } from 'react';
import {
  ProjectInfo,
  UserRole,
  ContractorProfile,
  WorkItem,
  CalendarEvent,
  PaymentTerm,
  MaterialItem,
  WorkerAllocation,
  DailyLog,
} from '../../types';
import { INITIAL_CONTRACTOR_PROFILE } from '../../data/initialData';
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
  ImageIcon,
  Upload,
  HardHat,
  Users,
  Phone,
  Mail,
  FileCheck2,
  CreditCard,
  Lock,
  CalendarDays,
} from 'lucide-react';
import { formatIDR } from '../../utils/calculations';
import { computeDaysOffset, syncAllProjectSchedules } from '../../utils/dateScheduleSync';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInfo;
  onUpdateProject: (updated: ProjectInfo) => void;
  currentRole: UserRole;
  userNameMap?: Record<UserRole, string>;
  onUpdateUserNameMap?: (newMap: Record<UserRole, string>) => void;
  onAddAuditLog?: (action: string, details: string) => void;
  workItems?: WorkItem[];
  calendarEvents?: CalendarEvent[];
  paymentTerms?: PaymentTerm[];
  materials?: MaterialItem[];
  allocations?: WorkerAllocation[];
  dailyLogs?: DailyLog[];
  onApplyStartDateSync?: (result: any) => void;
}

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  currentRole,
  userNameMap = {
    Owner: 'HASANUDIN',
    Konsultan: 'SAEPUL ANWAR',
    Kontraktor: 'Rohman Priyambodo',
    Direktur: 'HASANUDIN',
    'Site Manager': 'EKO YULIANTO',
    Admin: 'COKRO',
    Viewer: 'Tamu Pengawas',
  },
  onUpdateUserNameMap,
  onAddAuditLog,
  workItems,
  calendarEvents,
  paymentTerms,
  materials,
  allocations,
  dailyLogs,
  onApplyStartDateSync,
}) => {
  const [activeTab, setActiveTab] = useState<'project' | 'contractor' | 'roles' | 'contract'>('project');
  const [syncAllSchedules, setSyncAllSchedules] = useState(true);

  // Role permissions: Kontraktor tidak dapat mengubah logo perusahaan Owner
  const isOwnerRole = currentRole === 'Owner' || currentRole === 'Direktur' || currentRole === 'Admin';
  const isContractorRole = currentRole === 'Kontraktor' || currentRole === 'Site Manager';

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
  const [logoUrl, setLogoUrl] = useState(project.logoUrl || '/assets/logo.png');

  // Contractor Profile fields
  const initContractor = project.contractorProfile || INITIAL_CONTRACTOR_PROFILE;
  const [contractorAddress, setContractorAddress] = useState(initContractor.address || 'Bukit Cimanggu City, Jl. Raya Baru Ruko No. 5, Desa Cibadak Kec. Tanah Sereal');
  const [contractorCity, setContractorCity] = useState(initContractor.city || 'Bogor');
  const [contractorProvince, setContractorProvince] = useState(initContractor.province || 'Jawa Barat');
  const [contractorPostalCode, setContractorPostalCode] = useState(initContractor.postalCode || '16168');
  const [contractorPhone, setContractorPhone] = useState(initContractor.phone || '0');
  const [contractorWhatsapp, setContractorWhatsapp] = useState(initContractor.whatsapp || '+62 812 - 8807 - 7097');
  const [contractorEmail, setContractorEmail] = useState(initContractor.email || 'pt.gmp12@gmail.com');
  const [contractorNpwp, setContractorNpwp] = useState(initContractor.npwp || '61.289.845.2-404.000');
  const [contractorNib, setContractorNib] = useState(initContractor.nib || '1410220080338');
  const [contractorIujk, setContractorIujk] = useState(initContractor.iujkNumber || '141022008033803380001');
  const [contractorSbu, setContractorSbu] = useState(initContractor.sbuNumber || '141022008033800050001 (BG003)');
  const [contractorClassification, setContractorClassification] = useState(
    initContractor.classification || 'Kualifikasi Menengah (M1) - Subklasifikasi BG003 Gedung Hunian'
  );
  const [contractorLogoUrl, setContractorLogoUrl] = useState(initContractor.logoUrl || '/assets/logo.png');
  const [contractorHseOfficer, setContractorHseOfficer] = useState(
    initContractor.management?.hseOfficer || 'Ahmad Fauzi, S.Si (Ahli K3 Konstruksi)'
  );
  const [contractorSiteEngineer, setContractorSiteEngineer] = useState(
    initContractor.management?.siteEngineer || 'EKO YULIANTO '
  );
  const [contractorBankName, setContractorBankName] = useState(initContractor.bankName || 'Bank Mandiri (Persero) Tbk');
  const [contractorBankAccountNumber, setContractorBankAccountNumber] = useState(
    initContractor.bankAccountNumber || '131-00-998822-1'
  );
  const [contractorBankAccountHolder, setContractorBankAccountHolder] = useState(
    initContractor.bankAccountHolder || 'PT GONG MBE LINK PAMUNGKAS'
  );

  // Official names state
  const [director, setDirector] = useState(project.director || userNameMap.Direktur || userNameMap.Owner || 'HASANUDIN');
  const [consultantMK, setConsultantMK] = useState(project.consultantMK || userNameMap.Konsultan || 'SAEPUL ANWAR');
  const [siteManager, setSiteManager] = useState(project.siteManager || userNameMap['Site Manager'] || 'EKO YULIANTO ');
  const [qcEngineer, setQcEngineer] = useState(project.qcEngineer || 'KIKI ');
  const [financeAdmin, setFinanceAdmin] = useState(project.financeAdmin || userNameMap.Admin || 'COKRO ');
  const [inspector, setInspector] = useState(project.inspector || userNameMap.Viewer || 'Tamu Pengawas');
  const [estimator, setEstimator] = useState(project.estimator || 'IHSAN ');
  const [projectManager, setProjectManager] = useState(project.projectManager || 'JAKA SEPTIANDANA ');

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const currentContractorProfile: ContractorProfile = {
      companyName: contractor.trim() || 'PT. GONG MBE LINK PAMUNGKAS',
      brandName: contractor.trim() || 'PT. GONG MBE LINK PAMUNGKAS',
      address: contractorAddress.trim() || 'Bukit Cimanggu City, Jl. Raya Baru Ruko No. 5, Desa Cibadak Kec. Tanah Sereal',
      city: contractorCity.trim() || 'Bogor',
      province: contractorProvince.trim() || 'Jawa Barat',
      postalCode: contractorPostalCode.trim() || '16168',
      phone: contractorPhone.trim() || '0',
      whatsapp: contractorWhatsapp.trim() || '+62 812 - 8807 - 7097',
      email: contractorEmail.trim() || 'pt.gmp12@gmail.com',
      website: initContractor.website || '-',
      npwp: contractorNpwp.trim() || '61.289.845.2-404.000',
      nib: contractorNib.trim() || '1410220080338',
      iujkNumber: contractorIujk.trim() || '141022008033803380001',
      sbuNumber: contractorSbu.trim() || '141022008033800050001 (BG003)',
      classification: contractorClassification.trim() || 'Kualifikasi Menengah (M1) - BG004 & BG009',
      logoUrl: contractorLogoUrl.trim() || logoUrl.trim() || '/assets/logo.png',
      bankName: contractorBankName.trim() || 'Bank Mandiri (Persero) Tbk',
      bankAccountNumber: contractorBankAccountNumber.trim() || '131-00-998822-1',
      bankAccountHolder: contractorBankAccountHolder.trim() || 'PT GONG MBE LINK PAMUNGKAS',
      notes: initContractor.notes || '',
      management: {
        director: director.trim() || 'Rohman Priyambodo',
        projectManager: projectManager.trim() || 'JAKA SEPTIANDANA ',
        siteManager: siteManager.trim() || 'EKO YULIANTO ',
        qcEngineer: qcEngineer.trim() || 'KIKI ',
        hseOfficer: contractorHseOfficer.trim() || 'Ahmad Fauzi, S.Si (Ahli K3 Konstruksi)',
        estimatorQS: estimator.trim() || 'IHSAN',
        financeAdmin: financeAdmin.trim() || 'COKRO',
        siteEngineer: contractorSiteEngineer.trim() || 'HARUN ARRASID ',
      },
    };

    // Hak Akses Ketat: Kontraktor TIDAK BISA merubah logo perusahaan Owner!
    // Hanya Owner / Direktur / Admin yang berwenang merubah logoUrl dan identitas pemilik proyek.
    const finalOwnerLogo = isOwnerRole ? (logoUrl.trim() || '/assets/logo.png') : (project.logoUrl || '/assets/logo.png');
    const finalOwnerName = isOwnerRole ? (owner.trim() || project.owner) : project.owner;

    const updatedProject: ProjectInfo = {
      ...project,
      name: name.trim() || project.name,
      owner: finalOwnerName,
      contractor: contractor.trim() || project.contractor,
      contractorProfile: currentContractorProfile,
      location: location.trim() || project.location,
      contractNumber: contractNumber.trim() || project.contractNumber,
      contractValue: Number(contractValue) || project.contractValue,
      startDate: startDate || project.startDate,
      targetEndDate: targetEndDate || project.targetEndDate,
      status,
      logoUrl: finalOwnerLogo,
      director: director.trim() || 'HASANUDIN',
      consultantMK: consultantMK.trim() || 'SAEPUL ANWAR',
      siteManager: siteManager.trim() || 'EKO YULIANTO',
      qcEngineer: qcEngineer.trim() || 'KIKI ',
      financeAdmin: financeAdmin.trim() || 'COKRO ',
      inspector: inspector.trim() || 'Tamu Pengawas',
      estimator: estimator.trim() || 'IHSAN ',
      projectManager: projectManager.trim() || 'JAKA SEPTIANDANA',
    };

    if (
      startDate &&
      startDate !== project.startDate &&
      syncAllSchedules &&
      onApplyStartDateSync &&
      workItems &&
      workItems.length > 0
    ) {
      const syncResult = syncAllProjectSchedules({
        newStartDate: startDate,
        project: updatedProject,
        workItems,
        calendarEvents: calendarEvents || [],
        paymentTerms: paymentTerms || [],
        materials: materials || [],
        allocations: allocations || [],
        dailyLogs: dailyLogs || [],
        options: {
          syncWorkItems: true,
          syncTargetEndDate: true,
          syncCalendarEvents: true,
          syncPaymentTerms: true,
          syncMaterials: true,
          syncAllocations: true,
        },
      });
      onApplyStartDateSync(syncResult);
    } else {
      onUpdateProject(updatedProject);
    }

    if (onUpdateUserNameMap) {
      onUpdateUserNameMap({
        Owner: director.trim() || 'HASANUDIN',
        Direktur: director.trim() || 'HASANUDIN',
        Konsultan: consultantMK.trim() || 'SAEPUL ANWAR',
        Kontraktor: (project.contractorProfile?.management?.director || 'Rohman Priyambodo').trim(),
        'Site Manager': siteManager.trim() || 'EKO YULIANTO',
        Admin: financeAdmin.trim() || 'COKRO',
        Viewer: inspector.trim() || 'Tamu Pengawas',
      });
    }

    if (onAddAuditLog) {
      onAddAuditLog(
        'Pengaturan Nama Pejabat & Identitas Proyek',
        `Perubahan Pejabat: Direktur (${updatedProject.director}), MK (${updatedProject.consultantMK}), SM (${updatedProject.siteManager}), QC (${updatedProject.qcEngineer}), Admin (${updatedProject.financeAdmin}), QS (${updatedProject.estimator}), PM (${updatedProject.projectManager})`
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
    setOwner('PT. FORESYNDO GLOBAL INDONESIA');
    setContractor('PT. GONG MBE LINK PAMUNGKAS');
    setLocation('Jatitujuh, Majalengka, Jawa Barat');
    setContractNumber('PR-2026-FGI-004');
    setContractValue(14461760981);
    setDirector('HASANUDIN');
    setConsultantMK('SAEPUL ANWAR');
    setSiteManager('EKO YULIANTO');
    setQcEngineer('KIKI');
    setFinanceAdmin('COKRO');
    setInspector('Tamu Pengawas');
    setEstimator('IHSAN');
    setProjectManager('JAKA SEPTIANDANA');
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
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'project'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" /> Nama &amp; Informasi Proyek
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contractor')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'contractor'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HardHat className="w-4 h-4 text-amber-300" /> Profil Kontraktor (NPWP, NIB, dll)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
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
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-500" /> Nama Pemilik Proyek (Owner)
                    </label>
                    {!isOwnerRole && (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Terkunci
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => isOwnerRole && setOwner(e.target.value)}
                    placeholder="Contoh: PT Foresyndo Global Indonesia"
                    required
                    disabled={!isOwnerRole}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold outline-none transition-all ${
                      isOwnerRole
                        ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                    }`}
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
                    placeholder="PT. GONG MBE LINK PAMUNGKAS"
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

              {/* Logo Perusahaan Pemilik (Owner) - Restricted to Owner/Direktur only */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isOwnerRole
                  ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50'
                  : 'border-amber-300/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20'
              }`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-500" /> Logo Resmi Perusahaan Pemilik (Owner)
                  </label>
                  {!isOwnerRole ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[10px] font-bold flex items-center gap-1 border border-amber-300 dark:border-amber-700">
                      <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Terkunci (Khusus Owner / Direktur)
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ Wewenang Owner
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                    <img
                      src={isOwnerRole ? (logoUrl || '/assets/logo.png') : (project.logoUrl || '/assets/logo.png')}
                      alt="Logo Owner Proyek"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={isOwnerRole ? logoUrl : (project.logoUrl || '/assets/logo.png')}
                      onChange={(e) => isOwnerRole && setLogoUrl(e.target.value)}
                      disabled={!isOwnerRole}
                      placeholder="/assets/logo.png"
                      className={`w-full px-3 py-2 rounded-xl border text-xs font-mono outline-none ${
                        isOwnerRole
                          ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      }`}
                    />
                    {isOwnerRole ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLogoUrl('/assets/logo.png')}
                          className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                        >
                          Gunakan Logo FGI Default (/assets/logo.png)
                        </button>
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5 font-medium bg-white/80 dark:bg-slate-900/60 p-2 rounded-xl border border-amber-200 dark:border-amber-800/80">
                        <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Proteksi Akses:</strong> Logo perusahaan Owner tidak bisa diubah oleh kontraktor. Kontraktor hanya dapat mengubah logo resmi kontraktor sendiri pada tab <strong>Profil Kontraktor</strong>.
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PROFIL & LEGALITAS KONTRAKTOR */}
          {activeTab === 'contractor' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 font-medium">
                Kelola identitas resmi kontraktor pelaksana: susunan manajemen lapangan, domisili kantor, NPWP, NIB, dan logo perusahaan untuk dokumen resmi BAST-1 serta penagihan termin.
              </div>

              {/* Nama & Brand */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-500" /> Nama Badan Usaha Kontraktor (PT/CV)
                  </label>
                  <input
                    type="text"
                    value={contractor}
                    onChange={(e) => setContractor(e.target.value)}
                    placeholder="PT. GONG MBE LINK PAMUNGKAS"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-500" /> Klasifikasi &amp; Kualifikasi Jasa Konstruksi
                  </label>
                  <input
                    type="text"
                    value={contractorClassification}
                    onChange={(e) => setContractorClassification(e.target.value)}
                    placeholder="M1 - Subklasifikasi BG004 & BG009"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Legalitas: NPWP, NIB, IUJK, SBU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-sky-500" /> NPWP Perusahaan
                  </label>
                  <input
                    type="text"
                    value={contractorNpwp}
                    onChange={(e) => setContractorNpwp(e.target.value)}
                    placeholder="61.289.845.2-404.000"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> NIB (Nomor Induk Berusaha) OSS
                  </label>
                  <input
                    type="text"
                    value={contractorNib}
                    onChange={(e) => setContractorNib(e.target.value)}
                    placeholder="1410220080338"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. IUJK / PB-UMKU
                  </label>
                  <input
                    type="text"
                    value={contractorIujk}
                    onChange={(e) => setContractorIujk(e.target.value)}
                    placeholder="141022008033803380001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    No. Sertifikat Badan Usaha (SBU)
                  </label>
                  <input
                    type="text"
                    value={contractorSbu}
                    onChange={(e) => setContractorSbu(e.target.value)}
                    placeholder="141022008033800050001 (BG003)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Alamat & Domisili */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> Alamat Kantor / Domisili Kontraktor
                </label>
                <input
                  type="text"
                  value={contractorAddress}
                  onChange={(e) => setContractorAddress(e.target.value)}
                  placeholder="Bukit Cimanggu City, Jl. Raya Baru Ruko No. 5, Desa Cibadak Kec. Tanah Sereal"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kota / Kabupaten
                  </label>
                  <input
                    type="text"
                    value={contractorCity}
                    onChange={(e) => setContractorCity(e.target.value)}
                    placeholder="Bogor"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    value={contractorProvince}
                    onChange={(e) => setContractorProvince(e.target.value)}
                    placeholder="Jawa Barat"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    value={contractorPostalCode}
                    onChange={(e) => setContractorPostalCode(e.target.value)}
                    placeholder="16168"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Kontak */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-sky-500" /> Telepon Kantor
                  </label>
                  <input
                    type="text"
                    value={contractorPhone}
                    onChange={(e) => setContractorPhone(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-500" /> WhatsApp Hotline
                  </label>
                  <input
                    type="text"
                    value={contractorWhatsapp}
                    onChange={(e) => setContractorWhatsapp(e.target.value)}
                    placeholder="+62 812 - 8807 - 7097"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-rose-500" /> Email Resmi
                  </label>
                  <input
                    type="email"
                    value={contractorEmail}
                    onChange={(e) => setContractorEmail(e.target.value)}
                    placeholder="pt.gmp12@gmail.com"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              {/* Rekening Bank */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-y-2.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-500" /> Rekening Bank Pembayaran Proyek
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nama Bank</label>
                    <input
                      type="text"
                      value={contractorBankName}
                      onChange={(e) => setContractorBankName(e.target.value)}
                      placeholder="Bank Mandiri"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">No. Rekening</label>
                    <input
                      type="text"
                      value={contractorBankAccountNumber}
                      onChange={(e) => setContractorBankAccountNumber(e.target.value)}
                      placeholder="131-00-998822-1"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Atas Nama</label>
                    <input
                      type="text"
                      value={contractorBankAccountHolder}
                      onChange={(e) => setContractorBankAccountHolder(e.target.value)}
                      placeholder="PT. GONG MBE LINK PAMUNGKAS"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Logo Kontraktor Preview & Upload */}
              <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-500" /> Logo Resmi Kontraktor Pelaksana
                  </label>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1 border border-emerald-300 dark:border-emerald-700">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Hak Akses Kontraktor
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                    <img
                      src={contractorLogoUrl || '/assets/logo.png'}
                      alt="Logo Kontraktor"
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      value={contractorLogoUrl}
                      onChange={(e) => setContractorLogoUrl(e.target.value)}
                      placeholder="/assets/logo.png atau data:image/..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors">
                        <Upload className="w-3 h-3" /> Unggah File Logo
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                if (evt.target?.result) {
                                  setContractorLogoUrl(evt.target.result as string);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setContractorLogoUrl('/assets/logo.png')}
                        className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                      >
                        Default (/assets/logo.png)
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                  * Logo ini digunakan pada kop dokumen penyerahan BAST, kartu profil pelaksana, dan surat permohonan PHO kontraktor.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: NAMA PEJABAT / PROFIL USER */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Atur Nama Personel Penanggung Jawab Proyek. Setiap perubahan nama di sini akan otomatis diterapkan pada seluruh file export (PDF Kurva-S, PDF Termin, PDF RAB Resmi, PDF Laporan &amp; Rekapitulasi Excel).</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Nama Direktur Utama Owner (PT. FORESYNDO GLOBAL INDONESIA)</span>
                    <span className="text-[10px] text-orange-500 font-normal">Pengesahan / Approval</span>
                  </label>
                  <input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    required
                    placeholder="Contoh: HASANUDIN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Muncul pada TTD Direktur Owner di Kurva-S, BAST, Termin, RAB, Laporan &amp; Excel.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Nama Kuasa Direktur Konsultan MK (PT. BENNATIN SURYA CIPTA)</span>
                    <span className="text-[10px] text-sky-500 font-normal">Pengawas / MK</span>
                  </label>
                  <input
                    type="text"
                    value={consultantMK}
                    onChange={(e) => setConsultantMK(e.target.value)}
                    required
                    placeholder="Contoh: SAEPUL ANWAR"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Muncul pada TTD Kuasa Direktur Konsultan MK di Kurva-S, BAST, dan Dokumen Proyek.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Nama Site Manager / Kepala Lapangan</span>
                    <span className="text-[10px] text-blue-500 font-normal">Pembuat / Pelaksana</span>
                  </label>
                  <input
                    type="text"
                    value={siteManager}
                    onChange={(e) => setSiteManager(e.target.value)}
                    required
                    placeholder="EKO YULIANTO"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Muncul pada TTD Site Manager di Kurva-S, BAST, Termin &amp; Laporan Harian/Mingguan.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Lead QC Engineer / Project Engineer</span>
                    <span className="text-[10px] text-purple-500 font-normal">Pemeriksa Mutu</span>
                  </label>
                  <input
                    type="text"
                    value={qcEngineer}
                    onChange={(e) => setQcEngineer(e.target.value)}
                    required
                    placeholder="KIKI"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Muncul pada kolom "Diperiksa Oleh" di Analisis Kurva-S &amp; Excel Summary.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Nama Admin Logistik &amp; Keuangan</span>
                    <span className="text-[10px] text-emerald-500 font-normal">Verifikasi Finansial</span>
                  </label>
                  <input
                    type="text"
                    value={financeAdmin}
                    onChange={(e) => setFinanceAdmin(e.target.value)}
                    required
                    placeholder="Contoh: COKRO"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Muncul pada verifikasi voucher termin &amp; laporan arus kas material.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Lead Quantity Surveyor (QS) / Estimator RAB</span>
                    <span className="text-[10px] text-indigo-500 font-normal">Perencana Biaya</span>
                  </label>
                  <input
                    type="text"
                    value={estimator}
                    onChange={(e) => setEstimator(e.target.value)}
                    required
                    placeholder="Contoh:IHSAN"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Muncul pada "Dibuat &amp; Dihitung" di Dokumen Resmi RAB &amp; Excel.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Project Manager Lapangan</span>
                    <span className="text-[10px] text-amber-500 font-normal">Verifikasi Teknis</span>
                  </label>
                  <input
                    type="text"
                    value={projectManager}
                    onChange={(e) => setProjectManager(e.target.value)}
                    required
                    placeholder="Contoh: JAKA SEPTIANDANA"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Muncul pada "Diperiksa Oleh" di Dokumen RAB &amp; Excel.
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Tim Viewer / Pengawas Eksternal / Konsultan MK</span>
                    <span className="text-[10px] text-slate-400 font-normal">Auditor Tamu</span>
                  </label>
                  <input
                    type="text"
                    value={inspector}
                    onChange={(e) => setInspector(e.target.value)}
                    required
                    placeholder="Contoh: Tamu Pengawas"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Profil nama untuk akses pengawas eksternal / konsultasi publik.
                  </span>
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

              {/* Deteksi Perubahan Tanggal Mulai Proyek */}
              {startDate && startDate !== project.startDate && (
                <div className="p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-950 dark:text-orange-200 space-y-2 animate-in fade-in">
                  <div className="font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-orange-700 dark:text-orange-300">
                      <CalendarDays className="w-4 h-4 text-orange-500" />
                      Deteksi Perubahan Tanggal Mulai Pekerjaan
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-200 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
                      {computeDaysOffset(project.startDate, startDate) > 0
                        ? `+${computeDaysOffset(project.startDate, startDate)} Hari (Mundur)`
                        : `${computeDaysOffset(project.startDate, startDate)} Hari (Maju)`}
                    </span>
                  </div>
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={syncAllSchedules}
                      onChange={(e) => setSyncAllSchedules(e.target.checked)}
                      className="mt-0.5 rounded text-orange-500 focus:ring-orange-500"
                    />
                    <span>
                      Sinkronisasikan seluruh jadwal (Time Schedule, Kurva S, Kalender &amp; Termin Pembayaran) mengikuti tanggal mulai baru
                    </span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
                    Durasi tiap item pekerjaan akan tetap terjaga 100%. Tanggal mulai dan selesai pekerjaan bergeser secara proporsional.
                  </p>
                </div>
              )}
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
