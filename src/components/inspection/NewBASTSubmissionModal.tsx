import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Check,
  AlertCircle,
  Award,
  PenTool,
  RotateCcw,
  QrCode,
  FileText,
  Calendar,
  Building2,
  UserCheck,
  ShieldCheck,
  CheckSquare,
  Square,
  Layers,
  Percent,
  FileCheck2,
  Info,
  ChevronRight,
  ChevronLeft,
  Briefcase,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { WorkItem, ProjectInfo, UserRole, BASTSubmissionData, BASTAttachmentChecklist } from '../../types';

interface NewBASTSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workItems: WorkItem[];
  project: ProjectInfo;
  userRole: UserRole;
  currentSubmission?: BASTSubmissionData;
  onSubmitBAST: (newSubmission: BASTSubmissionData, selectedWorkItemIds: string[]) => void;
  onAddAuditLog: (action: string, details: string) => void;
}

export const NewBASTSubmissionModal: React.FC<NewBASTSubmissionModalProps> = ({
  isOpen,
  onClose,
  workItems,
  project,
  userRole,
  currentSubmission,
  onSubmitBAST,
  onAddAuditLog,
}) => {
  // Active Tab / Step inside Modal
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Format IDR Helper
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Filter completed items
  const completedWorkItems = workItems.filter(
    (w) => w.status === 'Selesai' || w.realizedProgressPercent >= 100
  );
  const ongoingWorkItems = workItems.filter(
    (w) => w.status !== 'Selesai' && w.realizedProgressPercent < 100
  );

  // State: Selected work item IDs (default to all completed items)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => {
    return completedWorkItems.map((w) => w.id);
  });

  // Keep selection up to date when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedItemIds(completedWorkItems.map((w) => w.id));
      setActiveStep(1);
    }
  }, [isOpen]);

  // Form Fields State
  const defaultSubNo = currentSubmission?.submissionNumber || `042/SP-BAST1/FGI-KTR/${new Date().getFullYear()}`;
  const [submissionNumber, setSubmissionNumber] = useState(defaultSubNo);
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().split('T')[0]);

  // Target handover date (+7 days from now by default)
  const defaultHandover = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [targetHandoverDate, setTargetHandoverDate] = useState(defaultHandover);

  const [maintenanceDays, setMaintenanceDays] = useState<number>(180);
  const [retentionPercent, setRetentionPercent] = useState<number>(5);

  const [contractorName, setContractorName] = useState(
    project.siteManager || currentSubmission?.contractorRepresentative || 'Ir. Agus Pratama'
  );
  const [contractorPosition, setContractorPosition] = useState(
    currentSubmission?.contractorPosition || 'Site Manager Pelaksana'
  );

  const [consultantName, setConsultantName] = useState(
    project.consultantMK || currentSubmission?.mkVerifiedBy || 'Ir. Hendra Gunawan, ST, IPU'
  );
  const [consultantPosition, setConsultantPosition] = useState(
    'Team Leader Konsultan MK / Pengawas Teknis'
  );

  const [contractorNotes, setContractorNotes] = useState(
    'Seluruh pekerjaan struktur, finishing, dan mekanikal/elektrikal pada sektor yang diajukan telah selesai 100% dan telah melalui uji fungsi (T&C). Siap untuk dilaksanakan Joint Inspection bersama Konsultan MK.'
  );

  // Mandatory Attachments checklist
  const [attachments, setAttachments] = useState<BASTAttachmentChecklist[]>(() => {
    if (currentSubmission?.attachments && currentSubmission.attachments.length > 0) {
      return currentSubmission.attachments;
    }
    return [
      {
        id: 'att-1',
        name: 'As-Built Drawing Terpasang (Arsitektur, Struktur, MEP)',
        description: 'Gambar pelaksanaan riil terpasang di lapangan (Format DWG & PDF bertandatangan)',
        fileReference: 'DWG-ASBUILT-KERTAJATI-REV03.pdf',
        isCompleted: true,
        verifiedByMK: true,
        required: true,
      },
      {
        id: 'att-2',
        name: 'Laporan Hasil Uji Laboratorium & Komisioning (T&C)',
        description: 'Hasil uji kuat tekan beton K-350, uji tarik besi, Megger Test elektrikal, uji tekan instalasi pipa',
        fileReference: 'TC-LAB-REPORT-FINAL-2026.pdf',
        isCompleted: true,
        verifiedByMK: true,
        required: true,
      },
      {
        id: 'att-3',
        name: 'Buku Manual Operasi & Pemeliharaan (O&M) + Garansi',
        description: 'Sertifikat garansi waterproofing, pompa air, genset, chiller, dan panel listrik utama',
        fileReference: 'OM-MANUAL-AND-WARRANTY-PACK.pdf',
        isCompleted: true,
        verifiedByMK: false,
        required: true,
      },
      {
        id: 'att-4',
        name: 'Berita Acara Rekonsiliasi Material & Opname Lapangan',
        description: 'Rekonsiliasi volume RAB kontrak vs realisasi akhir bersama Quantity Surveyor MK',
        fileReference: 'BA-OPNAME-VOLUME-FINAL-100.xlsx',
        isCompleted: true,
        verifiedByMK: true,
        required: true,
      },
      {
        id: 'att-5',
        name: 'Dokumentasi Foto Progress Fisik Lengkap (0% - 100%)',
        description: 'Album foto komparasi tahap nol hingga tuntas untuk seluruh sektor terlampir',
        fileReference: 'PHOTO-PROGRESS-ARCHIVE-FGI.pdf',
        isCompleted: true,
        verifiedByMK: true,
        required: true,
      },
      {
        id: 'att-6',
        name: 'Surat Bebas Tuntutan Upah & Subkontraktor',
        description: 'Pernyataan bermaterai pelunasan hak tenaga kerja & pihak ketiga tanpa sengketa',
        fileReference: 'SURAT-BEBAS-KLAIM-SUBKON-MTR.pdf',
        isCompleted: true,
        verifiedByMK: false,
        required: true,
      },
    ];
  });

  // Dual Digital Signatures States
  const [contractorSignatureData, setContractorSignatureData] = useState<string>(
    currentSubmission?.contractorSignature?.signatureData || ''
  );
  const [contractorSignedAt, setContractorSignedAt] = useState<string>(
    currentSubmission?.contractorSignature?.signedAt || ''
  );

  const [consultantSignatureData, setConsultantSignatureData] = useState<string>(
    currentSubmission?.mkSignature?.signatureData || ''
  );
  const [consultantSignedAt, setConsultantSignedAt] = useState<string>(
    currentSubmission?.mkSignature?.signedAt || ''
  );

  // Canvas Refs
  const contractorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const consultantCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawingContractor, setIsDrawingContractor] = useState(false);
  const [isDrawingConsultant, setIsDrawingConsultant] = useState(false);

  // Selected work items details
  const selectedItems = completedWorkItems.filter((w) => selectedItemIds.includes(w.id));
  const selectedNominal = selectedItems.reduce((sum, item) => sum + item.volumeTarget, 0);
  const selectedBobot = selectedItems.reduce((sum, item) => sum + item.bobotPercent, 0);

  // Calculate retention nominal
  const calculatedRetention = (selectedNominal * retentionPercent) / 100;

  // Toggle item selection
  const handleToggleItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAllCompleted = () => {
    setSelectedItemIds(completedWorkItems.map((w) => w.id));
  };

  const handleClearSelection = () => {
    setSelectedItemIds([]);
  };

  // Toggle attachment check
  const handleToggleAttachment = (id: string) => {
    setAttachments((prev) =>
      prev.map((att) => (att.id === id ? { ...att, isCompleted: !att.isCompleted } : att))
    );
  };

  // ------------------ Contractor Canvas Drawing ------------------
  const startDrawingContractor = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = contractorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawingContractor(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a';
  };

  const drawContractor = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingContractor) return;
    const canvas = contractorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingContractor = () => {
    if (!isDrawingContractor) return;
    setIsDrawingContractor(false);
    const canvas = contractorCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setContractorSignatureData(dataUrl);
      setContractorSignedAt(new Date().toLocaleString('id-ID'));
    }
  };

  const clearContractorCanvas = () => {
    const canvas = contractorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setContractorSignatureData('');
    setContractorSignedAt('');
  };

  const handleUsePresetContractorQR = () => {
    setContractorSignatureData('PRESET_VERIFIED_SM');
    setContractorSignedAt(new Date().toLocaleString('id-ID'));
  };

  // ------------------ Consultant MK Canvas Drawing ------------------
  const startDrawingConsultant = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = consultantCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawingConsultant(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#047857';
  };

  const drawConsultant = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingConsultant) return;
    const canvas = consultantCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingConsultant = () => {
    if (!isDrawingConsultant) return;
    setIsDrawingConsultant(false);
    const canvas = consultantCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setConsultantSignatureData(dataUrl);
      setConsultantSignedAt(new Date().toLocaleString('id-ID'));
    }
  };

  const clearConsultantCanvas = () => {
    const canvas = consultantCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setConsultantSignatureData('');
    setConsultantSignedAt('');
  };

  const handleUsePresetConsultantQR = () => {
    setConsultantSignatureData('PRESET_VERIFIED_MK');
    setConsultantSignedAt(new Date().toLocaleString('id-ID'));
  };

  // ------------------ Submit Handler ------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItemIds.length === 0) {
      alert('Pilih setidaknya 1 item pekerjaan yang telah berstatus Selesai untuk diajukan dalam BAST.');
      setActiveStep(1);
      return;
    }

    if (!submissionNumber.trim()) {
      alert('Nomor Surat Permohonan BAST wajib diisi.');
      setActiveStep(2);
      return;
    }

    // Calculate maintenance end date
    const start = new Date(targetHandoverDate);
    const end = new Date(start.getTime() + maintenanceDays * 24 * 60 * 60 * 1000);
    const maintenanceEndDate = end.toISOString().split('T')[0];

    const hasContractorSign = Boolean(contractorSignatureData);
    const hasConsultantSign = Boolean(consultantSignatureData);

    const updatedSubmission: BASTSubmissionData = {
      submissionId: currentSubmission?.submissionId || `sub-${Date.now()}`,
      submissionNumber: submissionNumber.trim(),
      submissionDate,
      targetHandoverDate,
      contractorRepresentative: contractorName,
      contractorPosition,
      contractorNotes: contractorNotes.trim(),
      // If both contractor and consultant signed right here in the modal, stage can be joint_inspection or mk_recommended
      stage: hasContractorSign && hasConsultantSign ? 'joint_inspection' : 'submitted',
      attachments,
      punchList: currentSubmission?.punchList || [],
      bastNumber: `BAST-1/FGI/${project.contractNumber}/2026`,
      handoverDate: targetHandoverDate,
      maintenancePeriodDays: maintenanceDays,
      maintenanceEndDate,
      retentionPercent,
      retentionValue: calculatedRetention,
      contractorSignature: {
        signed: hasContractorSign,
        name: contractorName,
        signedAt: contractorSignedAt || new Date().toLocaleString('id-ID'),
        signatureData: contractorSignatureData || (hasContractorSign ? 'PRESET_VERIFIED_SM' : ''),
      },
      mkSignature: {
        signed: hasConsultantSign,
        name: consultantName,
        signedAt: consultantSignedAt || (hasConsultantSign ? new Date().toLocaleString('id-ID') : ''),
        signatureData: consultantSignatureData || (hasConsultantSign ? 'PRESET_VERIFIED_MK' : ''),
      },
      ownerSignature: currentSubmission?.ownerSignature || {
        signed: false,
        name: project.director || 'H. Bambang S., M.T.',
        signedAt: '',
        signatureData: '',
      },
      isCompleted: false,
    };

    onSubmitBAST(updatedSubmission, selectedItemIds);
    onAddAuditLog(
      'Pengajuan BAST Baru',
      `Surat Permohonan BAST-1 No. ${submissionNumber} berhasil didaftarkan mencakup ${selectedItems.length} sektor pekerjaan selesai (${formatIDR(selectedNominal)}). Status tanda tangan: Kontraktor (${hasContractorSign ? 'Sudah' : 'Belum'}), Konsultan MK (${hasConsultantSign ? 'Sudah' : 'Belum'}).`
    );

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 text-white border-b border-blue-800/40 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white">
              Formulir Permohonan
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
              BAST-1 / Provisional Hand Over (PHO)
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-orange-400" /> Pengajuan BAST Baru
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
            Integrasi langsung dengan item pekerjaan yang telah selesai 100%, verifikasi berkas persyaratan, serta penandatanganan digital Kontraktor &amp; Konsultan Pengawas MK.
          </p>

          {/* Stepper Navigation */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <button
              onClick={() => setActiveStep(1)}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                activeStep === 1
                  ? 'bg-blue-500/20 border-blue-400 text-white shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                  activeStep === 1 ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                1
              </span>
              <div className="overflow-hidden">
                <span className="text-xs font-bold block truncate">Item Pekerjaan Selesai</span>
                <span className="text-[10px] text-slate-300 block truncate">
                  {selectedItemIds.length} Sektor Terpilih
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveStep(2)}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                activeStep === 2
                  ? 'bg-blue-500/20 border-blue-400 text-white shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                  activeStep === 2 ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                2
              </span>
              <div className="overflow-hidden">
                <span className="text-xs font-bold block truncate">Administrasi &amp; Lampiran</span>
                <span className="text-[10px] text-slate-300 block truncate">No. Surat &amp; Retensi 5%</span>
              </div>
            </button>

            <button
              onClick={() => setActiveStep(3)}
              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                activeStep === 3
                  ? 'bg-blue-500/20 border-blue-400 text-white shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                  activeStep === 3 ? 'bg-orange-500 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                3
              </span>
              <div className="overflow-hidden">
                <span className="text-xs font-bold block truncate">Tanda Tangan Digital</span>
                <span className="text-[10px] text-slate-300 block truncate">Kontraktor &amp; MK</span>
              </div>
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* ================= STEP 1: WORKITEMS INTEGRATION ================= */}
          {activeStep === 1 && (
            <div className="space-y-5">
              {/* Summary Stats Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Status Sektor Pekerjaan Selesai
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {completedWorkItems.length}
                    </span>
                    <span className="text-xs text-slate-500">dari total {workItems.length} Sektor</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${(completedWorkItems.length / workItems.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Nilai Anggaran Selesai Terpilih
                  </span>
                  <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                    {formatIDR(selectedNominal)}
                  </span>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 block mt-1">
                    Bobot: {selectedBobot.toFixed(2)}% dari Nilai Kontrak
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/40">
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">
                    Estimasi Retensi 5%
                  </span>
                  <span className="text-xl font-black text-orange-600 dark:text-orange-400 mt-1 block">
                    {formatIDR(calculatedRetention)}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                    Ditahan selama Masa Pemeliharaan {maintenanceDays} Hari
                  </span>
                </div>
              </div>

              {/* Notice & Control Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-semibold">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Item di bawah diambil otomatis dari database <strong>WorkItem</strong> yang telah berstatus{' '}
                    <strong className="text-emerald-600">Selesai (100%)</strong>.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleSelectAllCompleted}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition-all"
                  >
                    Pilih Semua ({completedWorkItems.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-all"
                  >
                    Hapus Pilihan
                  </button>
                </div>
              </div>

              {/* WorkItems Table Checklist */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Daftar Sektor Pekerjaan 100% Selesai:</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {selectedItemIds.length} dari {completedWorkItems.length} dipilih
                  </span>
                </h4>

                {completedWorkItems.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                    <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                      Belum Ada Item Pekerjaan Berstatus 'Selesai'
                    </h5>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Untuk mengajukan BAST, pastikan minimal satu sektor pekerjaan telah selesai 100% di modul Gantt Chart atau Time Schedule.
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                            <th className="p-3 w-12 text-center">Pilih</th>
                            <th className="p-3 w-14 text-center">No</th>
                            <th className="p-3">Nama Sektor Pekerjaan</th>
                            <th className="p-3 w-28">Kategori</th>
                            <th className="p-3 text-right w-36">Nilai RAB</th>
                            <th className="p-3 text-center w-20">Bobot</th>
                            <th className="p-3 text-center w-28">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {completedWorkItems.map((wi) => {
                            const isSelected = selectedItemIds.includes(wi.id);
                            return (
                              <tr
                                key={wi.id}
                                onClick={() => handleToggleItem(wi.id)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected
                                    ? 'bg-blue-50/70 dark:bg-blue-950/20 hover:bg-blue-100/70 dark:hover:bg-blue-950/30'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                              >
                                <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleItem(wi.id)}
                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                </td>
                                <td className="p-3 text-center font-bold text-slate-500">{wi.no}</td>
                                <td className="p-3 font-semibold text-slate-900 dark:text-white">
                                  <div className="flex items-center gap-2">
                                    <span>{wi.name}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    Target Selesai: {wi.endDate} • {wi.durationDays} hari kerja
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    {wi.category}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                                  {formatIDR(wi.volumeTarget)}
                                </td>
                                <td className="p-3 text-center font-bold text-blue-600 dark:text-blue-400 font-mono">
                                  {wi.bobotPercent.toFixed(2)}%
                                </td>
                                <td className="p-3 text-center">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <Check className="w-3 h-3" /> SELESAI
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Ongoing items notice */}
              {ongoingWorkItems.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>
                      Terdapat <strong>{ongoingWorkItems.length} sektor pekerjaan</strong> yang masih berstatus Sedang Berjalan / Belum 100% dan tidak disertakan dalam serah terima ini.
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 underline">
                    Serah Terima Parsial Diizinkan
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ================= STEP 2: ADMINISTRASI & LAMPIRAN ================= */}
          {activeStep === 2 && (
            <div className="space-y-6">
              {/* Form Input Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nomor Surat Permohonan BAST Kontraktor <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={submissionNumber}
                      onChange={(e) => setSubmissionNumber(e.target.value)}
                      placeholder="e.g. 042/SP-BAST1/FGI-KTR/IX/2026"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <FileText className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Format resmi korespondensi proyek antara Kontraktor dan MK
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tanggal Pengajuan Permohonan
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={submissionDate}
                      onChange={(e) => setSubmissionDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Target Tanggal Handover (PHO BAST-1)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={targetHandoverDate}
                      onChange={(e) => setTargetHandoverDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Estimasi tanggal opname bersama selesai &amp; BAST ditandatangani
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Masa Pemeliharaan / Warranty (Hari Kalender)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={maintenanceDays}
                      onChange={(e) => setMaintenanceDays(Number(e.target.value))}
                      className="w-32 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                    <span className="text-xs text-slate-500 font-semibold">
                      Hari Kalender (Standar: 180 hari / 6 bulan)
                    </span>
                  </div>
                </div>
              </div>

              {/* Representative inputs */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" /> Penanggung Jawab Pihak Pemohon &amp; Pengawas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Nama Perwakilan Kontraktor
                    </label>
                    <input
                      type="text"
                      value={contractorName}
                      onChange={(e) => setContractorName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Jabatan Perwakilan Kontraktor
                    </label>
                    <input
                      type="text"
                      value={contractorPosition}
                      onChange={(e) => setContractorPosition(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Nama Perwakilan Konsultan MK
                    </label>
                    <input
                      type="text"
                      value={consultantName}
                      onChange={(e) => setConsultantName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      Jabatan Konsultan MK
                    </label>
                    <input
                      type="text"
                      value={consultantPosition}
                      onChange={(e) => setConsultantPosition(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Notes Textarea */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Catatan / Ringkasan Pekerjaan Selesai
                </label>
                <textarea
                  rows={3}
                  value={contractorNotes}
                  onChange={(e) => setContractorNotes(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                />
              </div>

              {/* 6 Mandatory Attachments Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Checklist 6 Berkas Mandatori Lampiran BAST
                  </h4>
                  <span className="text-[11px] font-bold text-emerald-600">
                    {attachments.filter((a) => a.isCompleted).length} dari {attachments.length} Berkas Siap
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {attachments.map((att, idx) => (
                    <div
                      key={att.id}
                      onClick={() => handleToggleAttachment(att.id)}
                      className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                        att.isCompleted
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-slate-900 dark:text-white'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      <div className="mt-0.5">
                        {att.isCompleted ? (
                          <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-md border-2 border-slate-400 dark:border-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold block truncate">{att.name}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block line-clamp-1">
                          {att.description}
                        </span>
                        {att.fileReference && (
                          <span className="text-[9px] font-mono text-blue-600 dark:text-blue-400 block mt-0.5 truncate">
                            Berkas: {att.fileReference}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: DUAL DIGITAL SIGNATURES ================= */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-slate-800 dark:text-slate-200 flex items-start gap-3">
                <PenTool className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-blue-600 dark:text-blue-400 block">
                    Penandatanganan Digital Bersama (Kontraktor &amp; Konsultan Pengawas MK)
                  </strong>
                  <span>
                    Bubuhkan tanda tangan digital langsung pada kanvas di bawah menggunakan kursor mouse atau sentuhan layar sentuh (touchscreen). Anda juga dapat memilih opsi <strong>QR Verified</strong> untuk tanda tangan terenkripsi otomatis.
                  </span>
                </div>
              </div>

              {/* Dual Signature Pads Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. TANDA TANGAN KONTRAKTOR */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">
                        PIHAK 1: KONTRAKTOR PELAKSANA
                      </span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {contractorName}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {contractorPosition}
                      </span>
                    </div>
                    {contractorSignatureData ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Tertandatangani
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">
                        Belum Ditandatangani
                      </span>
                    )}
                  </div>

                  {/* Canvas Pad */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Tanda Tangan Digital Kontraktor:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={clearContractorCanvas}
                          className="text-[11px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Hapus
                        </button>
                        <button
                          type="button"
                          onClick={handleUsePresetContractorQR}
                          className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <QrCode className="w-3 h-3" /> QR Verified
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-1 relative overflow-hidden">
                      {contractorSignatureData === 'PRESET_VERIFIED_SM' ? (
                        <div className="h-32 flex flex-col items-center justify-center text-center p-3 bg-blue-50 text-blue-900 rounded-lg">
                          <QRCodeSVG
                            value={`FORESYNDO-BAST-SUBMISSION:${submissionNumber}:KTR:${contractorName}`}
                            size={52}
                            level="M"
                          />
                          <span className="text-[10px] font-mono font-black text-blue-900 mt-1">
                            VERIFIED DIGITAL QR SIGNATURE
                          </span>
                          <span className="text-[9px] text-blue-600 font-mono">
                            ID: KTR-{project.contractNumber}
                          </span>
                        </div>
                      ) : (
                        <canvas
                          ref={contractorCanvasRef}
                          width={360}
                          height={128}
                          onMouseDown={startDrawingContractor}
                          onMouseMove={drawContractor}
                          onMouseUp={stopDrawingContractor}
                          onTouchStart={startDrawingContractor}
                          onTouchMove={drawContractor}
                          onTouchEnd={stopDrawingContractor}
                          className="w-full h-32 touch-none cursor-crosshair bg-white rounded-lg"
                        />
                      )}
                    </div>
                    {contractorSignedAt && (
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                        Waktu TTD: {contractorSignedAt}
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. TANDA TANGAN KONSULTAN PENGAWAS MK */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">
                        PIHAK 2: KONSULTAN PENGAWAS MK
                      </span>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        {consultantName}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {consultantPosition}
                      </span>
                    </div>
                    {consultantSignatureData ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Tertandatangani
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">
                        Belum Ditandatangani
                      </span>
                    )}
                  </div>

                  {/* Canvas Pad */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        Tanda Tangan Digital Konsultan MK:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={clearConsultantCanvas}
                          className="text-[11px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Hapus
                        </button>
                        <button
                          type="button"
                          onClick={handleUsePresetConsultantQR}
                          className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <QrCode className="w-3 h-3" /> QR Verified
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-1 relative overflow-hidden">
                      {consultantSignatureData === 'PRESET_VERIFIED_MK' ? (
                        <div className="h-32 flex flex-col items-center justify-center text-center p-3 bg-emerald-50 text-emerald-900 rounded-lg">
                          <QRCodeSVG
                            value={`FORESYNDO-BAST-SUBMISSION:${submissionNumber}:MK:${consultantName}`}
                            size={52}
                            level="M"
                          />
                          <span className="text-[10px] font-mono font-black text-emerald-900 mt-1">
                            VERIFIED DIGITAL QR SIGNATURE
                          </span>
                          <span className="text-[9px] text-emerald-600 font-mono">
                            ID: MK-{project.contractNumber}
                          </span>
                        </div>
                      ) : (
                        <canvas
                          ref={consultantCanvasRef}
                          width={360}
                          height={128}
                          onMouseDown={startDrawingConsultant}
                          onMouseMove={drawConsultant}
                          onMouseUp={stopDrawingConsultant}
                          onTouchStart={startDrawingConsultant}
                          onTouchMove={drawConsultant}
                          onTouchEnd={stopDrawingConsultant}
                          className="w-full h-32 touch-none cursor-crosshair bg-white rounded-lg"
                        />
                      )}
                    </div>
                    {consultantSignedAt && (
                      <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                        Waktu TTD: {consultantSignedAt}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ready to Submit Banner */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Award className="w-4 h-4" /> Validasi Ringkasan Pengajuan BAST
                  </h4>
                  <span className="text-xs font-mono text-slate-300">
                    {submissionNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pengajuan akan mencakup <strong>{selectedItems.length} Sektor Pekerjaan</strong> senilai{' '}
                  <strong className="text-white">{formatIDR(selectedNominal)}</strong>, masa pemeliharaan <strong>{maintenanceDays} hari</strong>, dan jaminan retensi 5% senilai{' '}
                  <strong className="text-emerald-400">{formatIDR(calculatedRetention)}</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev - 1) as 1 | 2)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 flex items-center gap-1.5 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Kembali
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all"
            >
              Tutup
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {activeStep < 3 ? (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev + 1) as 2 | 3)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
              >
                Lanjut ke Langkah {activeStep + 1} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
              >
                <Check className="w-4 h-4" /> Simpan &amp; Daftarkan Pengajuan BAST
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
