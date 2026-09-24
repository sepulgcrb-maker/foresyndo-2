import React, { useState, useRef, useEffect } from 'react';
import { ProjectInfo, ContractorProfile, UserRole } from '../../types';
import { INITIAL_CONTRACTOR_PROFILE } from '../../data/initialData';
import {
  X,
  HardHat,
  Building2,
  Users,
  MapPin,
  FileCheck2,
  CreditCard,
  ImageIcon,
  Save,
  RotateCcw,
  CheckCircle2,
  Mail,
  Phone,
  Globe,
  Briefcase,
  ShieldCheck,
  FileText,
  Printer,
  ExternalLink,
  Upload,
  UploadCloud,
  Check,
  Trash2,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface ContractorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectInfo;
  onUpdateProject: (updated: ProjectInfo) => void;
  currentRole?: UserRole;
  onAddAuditLog?: (action: string, details: string) => void;
  onUpdateUserNameMap?: (newMap: Record<UserRole, string>) => void;
  userNameMap?: Record<UserRole, string>;
  darkMode?: boolean;
}

export const ContractorSettingsModal: React.FC<ContractorSettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  currentRole = 'Kontraktor',
  onAddAuditLog,
  onUpdateUserNameMap,
  userNameMap,
  darkMode = false,
}) => {
  const [activeTab, setActiveTab] = useState<
    'identitas' | 'manajemen' | 'alamat_kontak' | 'logo_bank' | 'preview_kop'
  >('identitas');

  // Fallback initial data
  const initial = project.contractorProfile || INITIAL_CONTRACTOR_PROFILE;

  // Form State
  const [companyName, setCompanyName] = useState(initial.companyName || project.contractor || '');
  const [brandName, setBrandName] = useState(initial.brandName || '');
  const [address, setAddress] = useState(initial.address || '');
  const [city, setCity] = useState(initial.city || '');
  const [province, setProvince] = useState(initial.province || '');
  const [postalCode, setPostalCode] = useState(initial.postalCode || '');
  const [phone, setPhone] = useState(initial.phone || '');
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp || '');
  const [email, setEmail] = useState(initial.email || '');
  const [website, setWebsite] = useState(initial.website || '');
  const [npwp, setNpwp] = useState(initial.npwp || '');
  const [nib, setNib] = useState(initial.nib || '');
  const [iujkNumber, setIujkNumber] = useState(initial.iujkNumber || '');
  const [sbuNumber, setSbuNumber] = useState(initial.sbuNumber || '');
  const [classification, setClassification] = useState(initial.classification || '');
  // Logo Resmi Kontraktor Pelaksana (Hanya mengubah logo kontraktor, bukan logo perusahaan owner)
  const [logoUrl, setLogoUrl] = useState(
    initial.logoUrl || project.contractorProfile?.logoUrl || '/assets/logo.png'
  );
  const [bankName, setBankName] = useState(initial.bankName || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(initial.bankAccountNumber || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(initial.bankAccountHolder || '');
  const [notes, setNotes] = useState(initial.notes || '');

  // Management Team
  const [director, setDirector] = useState(initial.management?.director || project.director || 'ROHMAN PRIYAMBODO');
  const [projectManager, setProjectManager] = useState(
    initial.management?.projectManager || project.projectManager || 'JAKA SEPTIANDANA'
  );
  const [siteManager, setSiteManager] = useState(
    initial.management?.siteManager || project.siteManager || 'EKO YULIANTO '
  );
  const [qcEngineer, setQcEngineer] = useState(
    initial.management?.qcEngineer || project.qcEngineer || 'KIKI'
  );
  const [hseOfficer, setHseOfficer] = useState(
    initial.management?.hseOfficer || 'Ahmad Fauzi, S.Si (Ahli K3 Konstruksi)'
  );
  const [estimatorQS, setEstimatorQS] = useState(
    initial.management?.estimatorQS || project.estimator || 'IHSAN'
  );
  const [financeAdmin, setFinanceAdmin] = useState(
    initial.management?.financeAdmin || project.financeAdmin || 'COKRO'
  );
  const [siteEngineer, setSiteEngineer] = useState(
    initial.management?.siteEngineer || 'HARUN ARRASID'
  );

  useEffect(() => {
    if (isOpen) {
      const prof = project.contractorProfile || INITIAL_CONTRACTOR_PROFILE;
      setCompanyName(prof.companyName || project.contractor || '');
      setBrandName(prof.brandName || '');
      setAddress(prof.address || '');
      setCity(prof.city || '');
      setProvince(prof.province || '');
      setPostalCode(prof.postalCode || '');
      setPhone(prof.phone || '');
      setWhatsapp(prof.whatsapp || '');
      setEmail(prof.email || '');
      setWebsite(prof.website || '');
      setNpwp(prof.npwp || '');
      setNib(prof.nib || '');
      setIujkNumber(prof.iujkNumber || '');
      setSbuNumber(prof.sbuNumber || '');
      setClassification(prof.classification || '');
      setLogoUrl(prof.logoUrl || '/assets/logo.png');
      setBankName(prof.bankName || '');
      setBankAccountNumber(prof.bankAccountNumber || '');
      setBankAccountHolder(prof.bankAccountHolder || '');
      setNotes(prof.notes || '');

      const mgmt = prof.management || INITIAL_CONTRACTOR_PROFILE.management;
      setDirector(mgmt.director || project.director || 'ROHMAN PRIYAMBODO');
      setProjectManager(mgmt.projectManager || project.projectManager || 'JAKA SEPTIANDANA');
      setSiteManager(mgmt.siteManager || project.siteManager || 'EKO YULIANTO');
      setQcEngineer(mgmt.qcEngineer || project.qcEngineer || 'KIKI');
      setHseOfficer(mgmt.hseOfficer || 'Ahmad Fauzi, S.Si (Ahli K3 Konstruksi)');
      setEstimatorQS(mgmt.estimatorQS || project.estimator || 'IHSAN');
      setFinanceAdmin(mgmt.financeAdmin || project.financeAdmin || 'COKRO');
      setSiteEngineer(mgmt.siteEngineer || 'HARUN ARRASID');
    }
  }, [isOpen, project]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{
    name: string;
    sizeKb: number;
    dimensions?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageFile = (file: File) => {
    setUploadError(null);

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      setUploadError('Berkas harus berupa gambar (PNG, JPG, JPEG, WEBP, atau SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) {
        setUploadError('Gagal membaca berkas gambar.');
        return;
      }

      // Optimize image dimensions if large to prevent localStorage bloat
      const img = new Image();
      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;
        const dimStr = `${width} × ${height} px`;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const optimizedDataUrl = canvas.toDataURL(mime, 0.92);
            setLogoUrl(optimizedDataUrl);
            setUploadedFileInfo({
              name: file.name,
              sizeKb: Math.round((optimizedDataUrl.length * 0.75) / 1024),
              dimensions: `${width} × ${height} px (dioptimasi)`,
            });
            return;
          }
        }

        setLogoUrl(result);
        setUploadedFileInfo({
          name: file.name,
          sizeKb: Math.round(file.size / 1024),
          dimensions: dimStr,
        });
      };
      img.onerror = () => {
        setLogoUrl(result);
        setUploadedFileInfo({
          name: file.name,
          sizeKb: Math.round(file.size / 1024),
        });
      };
      img.src = result;
    };
    reader.onerror = () => {
      setUploadError('Terjadi kesalahan saat memproses berkas gambar.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedProfile: ContractorProfile = {
      companyName: companyName.trim() || 'PT GONG MBE LINK PAMUNGKAS',
      brandName: brandName.trim() || 'PT GONG MBE LINK PAMUNGKAS',
      address: address.trim() || 'Bukit Cimanggu City, Jl. Raya Baru Ruko No. 05, Desa Cibadak Kec. Tanah Sereal',
      city: city.trim() || 'Bogor',
      province: province.trim() || 'Jawa Barat',
      postalCode: postalCode.trim() || '16168',
      phone: phone.trim() || '(0233) 881900',
      whatsapp: whatsapp.trim() || '+62 8126607-7097',
      email: email.trim() || 'pt.gmp12@gmail.com',
      website: website.trim() || 'o',
      npwp: npwp.trim() || '61.289.845.2-404.000',
      nib: nib.trim() || '1410220080338',
      iujkNumber: iujkNumber.trim() || '14102200803380001',
      sbuNumber: sbuNumber.trim() || '141022008033800050001(BG003)',
      classification: classification.trim() || 'Kualifikasi Menengah (M1) - BG004 & BG009',
      logoUrl: logoUrl.trim() || '/assets/logo.png',
      bankName: bankName.trim() || 'Bank Mandiri (Persero) Tbk',
      bankAccountNumber: bankAccountNumber.trim() || '0',
      bankAccountHolder: bankAccountHolder.trim() || 'PT GONG MBE LINK PAMUNGKAS',
      notes: notes.trim(),
      management: {
        director: director.trim() || 'ROHMAN PRIYAMBODO',
        projectManager: projectManager.trim() || 'JAKA SEPTIANDANA',
        siteManager: siteManager.trim() || 'EKO YULIANTO',
        qcEngineer: qcEngineer.trim() || 'KIKI',
        hseOfficer: hseOfficer.trim() || 'Ahmad Fauzi, S.Si (Ahli K3 Konstruksi)',
        estimatorQS: estimatorQS.trim() || 'IHSAN',
        financeAdmin: financeAdmin.trim() || 'COKRO',
        siteEngineer: siteEngineer.trim() || 'HARUN ARRASID',
      },
    };

    const updatedProject: ProjectInfo = {
      ...project,
      contractor: updatedProfile.companyName,
      contractorProfile: updatedProfile,
      director: updatedProfile.management.director,
      siteManager: updatedProfile.management.siteManager,
      qcEngineer: updatedProfile.management.qcEngineer,
      projectManager: updatedProfile.management.projectManager,
      estimator: updatedProfile.management.estimatorQS,
      financeAdmin: updatedProfile.management.financeAdmin,
      // PENTING: Logo perusahaan Owner TIDAK BOLEH dirubah oleh Kontraktor!
      // Kontraktor hanya mengubah updatedProfile.logoUrl (logo kontraktor).
      logoUrl: project.logoUrl || '/assets/logo.png',
    };

    onUpdateProject(updatedProject);

    if (onUpdateUserNameMap && userNameMap) {
      onUpdateUserNameMap({
        ...userNameMap,
        'Site Manager': updatedProfile.management.siteManager,
        Direktur: updatedProfile.management.director,
        Admin: updatedProfile.management.financeAdmin,
      });
    }

    if (onAddAuditLog) {
      onAddAuditLog(
        'Pembaruan Profil & Legalitas Kontraktor',
        `Perubahan data Kontraktor: ${updatedProfile.companyName} | NPWP: ${updatedProfile.npwp} | NIB: ${updatedProfile.nib} | SM: ${updatedProfile.management.siteManager} | PM: ${updatedProfile.management.projectManager}`
      );
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleResetDefaults = () => {
    setCompanyName(INITIAL_CONTRACTOR_PROFILE.companyName);
    setBrandName(INITIAL_CONTRACTOR_PROFILE.brandName || '');
    setAddress(INITIAL_CONTRACTOR_PROFILE.address);
    setCity(INITIAL_CONTRACTOR_PROFILE.city);
    setProvince(INITIAL_CONTRACTOR_PROFILE.province);
    setPostalCode(INITIAL_CONTRACTOR_PROFILE.postalCode);
    setPhone(INITIAL_CONTRACTOR_PROFILE.phone);
    setWhatsapp(INITIAL_CONTRACTOR_PROFILE.whatsapp || '');
    setEmail(INITIAL_CONTRACTOR_PROFILE.email);
    setWebsite(INITIAL_CONTRACTOR_PROFILE.website || '');
    setNpwp(INITIAL_CONTRACTOR_PROFILE.npwp);
    setNib(INITIAL_CONTRACTOR_PROFILE.nib);
    setIujkNumber(INITIAL_CONTRACTOR_PROFILE.iujkNumber);
    setSbuNumber(INITIAL_CONTRACTOR_PROFILE.sbuNumber || '');
    setClassification(INITIAL_CONTRACTOR_PROFILE.classification || '');
    setLogoUrl(INITIAL_CONTRACTOR_PROFILE.logoUrl || '/assets/logo.png');
    setBankName(INITIAL_CONTRACTOR_PROFILE.bankName || '');
    setBankAccountNumber(INITIAL_CONTRACTOR_PROFILE.bankAccountNumber || '');
    setBankAccountHolder(INITIAL_CONTRACTOR_PROFILE.bankAccountHolder || '');
    setNotes(INITIAL_CONTRACTOR_PROFILE.notes || '');

    setDirector(INITIAL_CONTRACTOR_PROFILE.management.director);
    setProjectManager(INITIAL_CONTRACTOR_PROFILE.management.projectManager);
    setSiteManager(INITIAL_CONTRACTOR_PROFILE.management.siteManager);
    setQcEngineer(INITIAL_CONTRACTOR_PROFILE.management.qcEngineer);
    setHseOfficer(INITIAL_CONTRACTOR_PROFILE.management.hseOfficer);
    setEstimatorQS(INITIAL_CONTRACTOR_PROFILE.management.estimatorQS);
    setFinanceAdmin(INITIAL_CONTRACTOR_PROFILE.management.financeAdmin);
    setSiteEngineer(INITIAL_CONTRACTOR_PROFILE.management.siteEngineer || '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl relative my-8 text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-md">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Pengaturan Profil &amp; Legalitas Kontraktor
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold text-[10px] border border-amber-500/20">
                GENERAL CONTRACTOR
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Kelola Nama Manajemen, Alamat Domisili, NPWP, NIB, Izin Usaha, Logo Resmi, dan Rekening Operasional
            </p>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 mb-5 pb-2 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('identitas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'identitas'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" /> Identitas &amp; Legalitas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manajemen')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'manajemen'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Nama Tim Manajemen
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alamat_kontak')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'alamat_kontak'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> Alamat &amp; Kontak
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logo_bank')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'logo_bank'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" /> Logo &amp; Rekening Bank
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview_kop')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'preview_kop'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Pratinjau Kop Surat
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto pr-1 space-y-5">
          {/* TAB 1: IDENTITAS & LEGALITAS */}
          {activeTab === 'identitas' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/20 text-xs text-amber-900 dark:text-amber-200">
                Data legalitas ini otomatis terisi pada formulir Berita Acara Serah Terima (BAST-1), Surat Permohonan Resmi, Dokumen Penagihan Termin, dan Surat Perjanjian Kerja Kontraktor.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" /> Nama Badan Usaha Kontraktor (PT / CV / KSO)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Contoh: PT GONG MBE LINK PAMUNGKAS"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-amber-500" /> Nama Merk / Divisi Pelaksana (Brand Display)
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Contoh: PT GONG MBE LINK PAMUNGKAS"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-sky-500" /> NPWP (Nomor Pokok Wajib Pajak Perusahaan)
                  </label>
                  <input
                    type="text"
                    value={npwp}
                    onChange={(e) => setNpwp(e.target.value)}
                    placeholder="Contoh: 01.889.345.2-438.000"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Format: 15 / 16 digit NPWP resmi</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> NIB (Nomor Induk Berusaha) OSS
                  </label>
                  <input
                    type="text"
                    value={nib}
                    onChange={(e) => setNib(e.target.value)}
                    placeholder="Contoh: 9120003481902"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">13 digit NIB Kementerian Investasi / BKPM</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" /> No. IUJK / PB-UMKU Izin Usaha Jasa Konstruksi
                  </label>
                  <input
                    type="text"
                    value={iujkNumber}
                    onChange={(e) => setIujkNumber(e.target.value)}
                    placeholder="Contoh: 1-0233-2-0045-1-3210-998822"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-purple-500" /> No. Sertifikat Badan Usaha (SBU)
                  </label>
                  <input
                    type="text"
                    value={sbuNumber}
                    onChange={(e) => setSbuNumber(e.target.value)}
                    placeholder="Contoh: 0-3210-07-002-1-10-918234 (BG004)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Klasifikasi &amp; Kualifikasi Perusahaan
                </label>
                <input
                  type="text"
                  value={classification}
                  onChange={(e) => setClassification(e.target.value)}
                  placeholder="Contoh: Kualifikasi Menengah (M1) - Subklasifikasi BG004 Gedung Komersial"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan / Spesialisasi Tambahan Kontraktor
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Spesialisasi beton bertulang, struktur baja bentang lebar, fasad ACP & curtain wall..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: SUSUNAN TIM MANAJEMEN */}
          {activeTab === 'manajemen' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl border border-sky-200/80 dark:border-sky-900/30 bg-sky-50/50 dark:bg-sky-950/20 text-xs text-sky-900 dark:text-sky-200">
                Nama-nama pejabat manajemen berikut akan muncul secara otomatis sebagai penanggung jawab penandatangan Berita Acara, Kurva-S, Pengajuan Termin, dan Laporan Harian/Mingguan.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Direktur Utama / Direktur Operasional
                  </label>
                  <input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    placeholder="Nama Lengkap + Gelar"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Penandatangan Kontrak &amp; BAST Utama</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Project Manager (PM) Kontraktor
                  </label>
                  <input
                    type="text"
                    value={projectManager}
                    onChange={(e) => setProjectManager(e.target.value)}
                    placeholder="Nama Lengkap PM + Gelar"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Penanggung jawab operasional proyek</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Site Manager (SM) / Kepala Pelaksana
                  </label>
                  <input
                    type="text"
                    value={siteManager}
                    onChange={(e) => setSiteManager(e.target.value)}
                    placeholder="Nama Site Manager + Gelar"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Penandatangan harian lapangan &amp; Opname</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lead QC Engineer / Pengawas Mutu
                  </label>
                  <input
                    type="text"
                    value={qcEngineer}
                    onChange={(e) => setQcEngineer(e.target.value)}
                    placeholder="Nama Lead QC + Gelar"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Pemeriksa tes slump, kuat tekan, &amp; punch list</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ahli K3 Konstruksi / HSE Officer
                  </label>
                  <input
                    type="text"
                    value={hseOfficer}
                    onChange={(e) => setHseOfficer(e.target.value)}
                    placeholder="Nama HSE Officer + Sertifikasi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Penanggung jawab keselamatan kerja (SMK3)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lead Quantity Surveyor (QS) / Estimator
                  </label>
                  <input
                    type="text"
                    value={estimatorQS}
                    onChange={(e) => setEstimatorQS(e.target.value)}
                    placeholder="Nama Estimator / QS"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Perhitungan volume opname &amp; back-up data</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Admin Proyek &amp; Keuangan / Logistik
                  </label>
                  <input
                    type="text"
                    value={financeAdmin}
                    onChange={(e) => setFinanceAdmin(e.target.value)}
                    placeholder="Nama Admin Proyek"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Pengelola arsip surat &amp; laporan material</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Site Engineer / Drafter Pelaksana
                  </label>
                  <input
                    type="text"
                    value={siteEngineer}
                    onChange={(e) => setSiteEngineer(e.target.value)}
                    placeholder="Nama Site Engineer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Penyusun shop drawing &amp; as-built drawings</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALAMAT & KONTAK */}
          {activeTab === 'alamat_kontak' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" /> Alamat Kantor Pusat / Domisili Kontraktor
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder="Contoh: Jl. Raya Jatitujuh No. 88, Blok Babakan, Desa Jatitujuh..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kota / Kabupaten
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Majalengka"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Provinsi
                  </label>
                  <input
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    placeholder="Jawa Barat"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="45458"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-500" /> Nomor Telepon Kantor
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(0233) 881900"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp Hotline Proyek
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+62 811-3344-5566"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-rose-500" /> Email Resmi Perusahaan
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="konstruksi@foresyndo.co.id"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-500" /> Website Perusahaan
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://foresyndo.co.id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LOGO & REKENING BANK */}
          {activeTab === 'logo_bank' && (
            <div className="space-y-5">
              {/* Otoritas & Proteksi Logo Banner */}
              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-slate-800 dark:text-slate-200 space-y-1.5 shadow-xs">
                <div className="flex items-center gap-2 font-bold text-sky-900 dark:text-sky-300">
                  <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                  <span>Kebijakan Otoritas Logo Proyek &amp; Perusahaan:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Logo Perusahaan Pemilik (Owner):</span>
                      <span className="text-slate-500 dark:text-slate-400">Terkunci &amp; terlindungi. Kontraktor tidak dapat mengubah logo perusahaan pemilik ({project.owner}).</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-900 dark:text-amber-200 block">Logo Kontraktor Pelaksana:</span>
                      <span className="text-amber-800 dark:text-amber-300">Kontraktor berwenang penuh mengubah logo resmi kontraktor sendiri di bawah ini.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner Logo Reference Display (Read-Only) */}
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-900/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-xs">
                    <img
                      src={project.logoUrl || '/assets/logo.png'}
                      alt="Logo Owner Proyek"
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Logo Perusahaan Pemilik (Owner Proyek)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3 text-slate-500" /> Terkunci (Khusus Owner)
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      {project.owner} &bull; Digunakan pada header aplikasi, laporan owner, dan sertifikat resmi
                    </span>
                  </div>
                </div>
              </div>

              {/* Logo Settings with File Upload & Drag-and-Drop */}
              <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-500" /> Logo Resmi Kontraktor Pelaksana
                  </label>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                    Format: PNG, JPG, WEBP, SVG (Maks. 5 MB)
                  </span>
                </div>

                {/* Dropzone & Preview Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Preview Card */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-28 h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 flex items-center justify-center shadow-xs overflow-hidden">
                      <img
                        src={logoUrl || '/assets/logo.png'}
                        alt="Logo Kontraktor"
                        className="max-w-full max-h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Pratinjau Logo Aktif
                      </span>
                      {uploadedFileInfo ? (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                          ✓ {uploadedFileInfo.name} ({uploadedFileInfo.sizeKb} KB)
                          {uploadedFileInfo.dimensions && (
                            <span className="block text-slate-400 font-mono text-[9px]">
                              {uploadedFileInfo.dimensions}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {logoUrl.startsWith('data:') ? 'Custom Upload (Data URL)' : logoUrl}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Drag & Drop Upload Target */}
                  <div className="md:col-span-2 space-y-3">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
                        isDragging
                          ? 'border-amber-500 bg-amber-500/10 scale-[0.99]'
                          : 'border-slate-300 dark:border-slate-700 hover:border-amber-400 hover:bg-slate-100/50 dark:hover:bg-slate-800/80 bg-white dark:bg-slate-900/60'
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                      />
                      <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          Tarik &amp; Letakkan Gambar Logo di Sini, atau{' '}
                          <span className="text-amber-600 dark:text-amber-400 underline">Pilih Berkas</span>
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          Mendukung PNG transparan, JPG tajam, atau SVG vektor logo perusahaan
                        </span>
                      </div>
                    </div>

                    {uploadError && (
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    {/* Quick Presets & Options */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" /> Unggah dari Perangkat
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLogoUrl('/assets/logo.png');
                          setUploadedFileInfo(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Default (/assets/logo.png)
                      </button>
                    </div>

                    {/* Fallback URL Input */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                      <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        Atau Masukkan Jalur / URL Gambar:
                      </label>
                      <input
                        type="text"
                        value={logoUrl}
                        onChange={(e) => {
                          setLogoUrl(e.target.value);
                          setUploadedFileInfo(null);
                        }}
                        placeholder="/assets/logo.png"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-mono text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  💡 <strong>Catatan:</strong> Gambar logo yang diunggah akan otomatis disinkronkan ke seluruh aplikasi, termasuk kop surat resmi BAST-1, dokumen teknis permohonan PHO, laporan berkala, dan modal inspeksi akhir.
                </p>
              </div>

              {/* Rekening Bank */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 space-y-3">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-500" /> Rekening Bank Pembayaran Proyek
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Nama Bank
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Bank Mandiri (Persero) Tbk"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Nomor Rekening
                    </label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="131-00-998822-1"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Atas Nama Rekening
                    </label>
                    <input
                      type="text"
                      value={bankAccountHolder}
                      onChange={(e) => setBankAccountHolder(e.target.value)}
                      placeholder="PT GONG MBE LINK PAMUNGKAS"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PRATINJAU KOP SURAT */}
          {activeTab === 'preview_kop' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 text-xs flex items-center justify-between border border-blue-200 dark:border-blue-900">
                <span>Pratinjau langsung Kop Surat Resmi Kontraktor Pelaksana yang terintegrasi dengan Dokumen BAST &amp; Penagihan:</span>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-blue-700"
                >
                  <Printer className="w-3 h-3" /> Cetak Tes
                </button>
              </div>

              {/* Printable Kop Surat Simulation Card */}
              <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-md border-2 border-slate-200 text-xs space-y-4 font-sans">
                {/* Kop Surat Header */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={logoUrl || '/assets/logo.png'}
                      alt="Logo Kontraktor"
                      className="w-14 h-14 object-contain shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="text-sm sm:text-base font-black tracking-tight text-slate-900 uppercase">
                        {companyName || 'PT GONG MBE LINK PAMUNGKAS'}
                      </h4>
                      <p className="text-[11px] font-bold text-amber-700">
                        {classification || 'GENERAL CONTRACTOR & REKAYASA STRUKTUR BANGUNAN GEDUNG'}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {address || 'Bukit Cimanggu City, Jl. Raya Baru Ruko No. 5, Desa Cibadak Kec. Tanah sereal'}, {city || 'Bogor'}, {province || 'Jawa Barat'} {postalCode ? ` - ${postalCode}` : ''}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Telp: {phone || '0'} | WA: {whatsapp || '+62 8126-6077-097'} | Email: {email || 'pt.gmp12@gmail.com'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[10px] font-mono shrink-0 border-l pl-3 border-slate-300">
                    <div><strong>NPWP:</strong> {npwp || '61.289.845.2-404.000'}</div>
                    <div><strong>NIB:</strong> {nib || '1410220080338'}</div>
                    <div><strong>IUJK:</strong> {iujkNumber || '14102200803380001'}</div>
                  </div>
                </div>

                {/* Simulation Content Body */}
                <div className="py-2 space-y-2 text-[11px] text-slate-700">
                  <div className="text-center font-bold text-slate-900 underline text-xs">
                    SURAT KETERANGAN PENUGASAN MANAJEMEN PELAKSANA
                  </div>
                  <p>
                    Bersama ini diterangkan susunan tim manajemen kontraktor pelaksana pada proyek{' '}
                    <strong>{project.name}</strong>:
                  </p>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px]">
                    <div>&bull; Direktur Utama: <strong>{director}</strong></div>
                    <div>&bull; Project Manager: <strong>{projectManager}</strong></div>
                    <div>&bull; Site Manager: <strong>{siteManager}</strong></div>
                    <div>&bull; Lead QC Engineer: <strong>{qcEngineer}</strong></div>
                    <div>&bull; Ahli K3 (HSE): <strong>{hseOfficer}</strong></div>
                    <div>&bull; Estimator / QS: <strong>{estimatorQS}</strong></div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    Rekening Operasional: {bankName || 'Bank Mandiri'} a.n. {bankAccountHolder || companyName} (No. {bankAccountNumber || '-'})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Kembalikan Default FGI
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 text-xs font-bold transition-all"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={savedSuccess}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Tersimpan!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Simpan Profil Kontraktor
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
