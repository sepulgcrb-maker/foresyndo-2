import React, { useState } from 'react';
import {
  ProjectInfo,
  WorkItem,
  UserRole,
  BASTSubmissionData,
  BASTWorkflowStage,
  BASTAttachmentChecklist,
  BASTPunchListItem,
} from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  FileCheck2,
  Send,
  AlertTriangle,
  FileText,
  Building2,
  UserCheck,
  Award,
  PenTool,
  Check,
  ExternalLink,
  Info,
  ChevronRight,
  Plus,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  HelpCircle,
  FilePlus2,
  Eye,
  HardHat,
  RotateCcw,
} from 'lucide-react';
import { formatIDR, calculatePhysicalProgress } from '../../utils/calculations';
import { BASTDocumentList } from './BASTDocumentList';

export const INITIAL_BAST_ATTACHMENTS: BASTAttachmentChecklist[] = [
  {
    id: 'att-1',
    name: 'Surat Permohonan Serah Terima Pertama (PHO)',
    description: 'Surat resmi permohonan BAST-1 bertandatangan Project Manager / Site Manager Kontraktor',
    fileReference: 'SRT-PHO-FGI-042.pdf',
    isCompleted: true,
    verifiedByMK: true,
    required: true,
  },
  {
    id: 'att-2',
    name: 'As-Built Drawings (Gambar Terlaksana Lengkap)',
    description: 'Gambar akhir terlaksana mencakup Struktur, Arsitektur, Mekanikal, Elektrikal, dan Plumbing',
    fileReference: 'ABD-FORESYNDO-REV04.dwg',
    isCompleted: true,
    verifiedByMK: true,
    required: true,
  },
  {
    id: 'att-3',
    name: 'Berita Acara Testing & Commissioning (T&C)',
    description: 'Hasil uji beban trafo, genset 250kVA, instalasi fire alarm, elevator, dan pompa hydran',
    fileReference: 'TC-REPORT-MEP-2026.pdf',
    isCompleted: true,
    verifiedByMK: true,
    required: true,
  },
  {
    id: 'att-4',
    name: 'Sertifikat Garansi Material & Peralatan Utama',
    description: 'Buku garansi AC Chiller, genset, waterproofing membran bakar, dan cat eksterior tahan cuaca',
    fileReference: 'WARRANTY-CERTIFICATES.pdf',
    isCompleted: true,
    verifiedByMK: true,
    required: true,
  },
  {
    id: 'att-5',
    name: 'Manual Operasional & Pemeliharaan (O&M Manual)',
    description: 'Panduan manual operasional kelistrikan gedung, sistem sanitasi, dan tata udara (HVAC)',
    fileReference: 'OM-MANUAL-FORESYNDO.pdf',
    isCompleted: true,
    verifiedByMK: true,
    required: true,
  },
  {
    id: 'att-6',
    name: 'Rekapitulasi Laporan Harian & Mingguan Fisik 100%',
    description: 'Laporan kumulatif progress fisik 100% dari minggu ke-1 sampai minggu ke-48',
    fileReference: 'WEEKLY-SUMMARY-PROGRESS-100.xlsx',
    isCompleted: true,
    verifiedByMK: true,
    required: true,
  },
  {
    id: 'att-7',
    name: 'Album Dokumentasi Foto Pelaksanaan 0% - 100%',
    description: 'Koleksi dokumentasi foto tahapan pondasi, struktur, MEP, hingga finishing arsitektur',
    fileReference: 'PHOTO-ALBUM-CONSTRUCTION.pdf',
    isCompleted: true,
    verifiedByMK: true,
    required: true,
  },
];

export const INITIAL_PUNCH_LIST: BASTPunchListItem[] = [
  {
    id: 'punch-1',
    sectorName: 'Pekerjaan Pengecatan & Finishing',
    description: 'Perapihan noda cat pada plint lantai koridor lantai 2 sisi timur',
    severity: 'Ringan',
    deadlineDate: '2026-09-20',
    isResolved: true,
    resolvedDate: '2026-09-18',
    verifiedByMK: true,
  },
  {
    id: 'punch-2',
    sectorName: 'Pekerjaan Elektrikal & Lighting',
    description: 'Penggantian 1 unit armature downlight LED di ruang rapat direksi yang berkedip',
    severity: 'Ringan',
    deadlineDate: '2026-09-22',
    isResolved: true,
    resolvedDate: '2026-09-19',
    verifiedByMK: true,
  },
  {
    id: 'punch-3',
    sectorName: 'Pekerjaan Sanitasi & Plumbing',
    description: 'Penyetelan tekanan debit kran wastafel toilet lantai 1',
    severity: 'Ringan',
    deadlineDate: '2026-09-25',
    isResolved: false,
    verifiedByMK: false,
  },
];

interface ContractorBASTWorkflowProps {
  project: ProjectInfo;
  workItems: WorkItem[];
  userRole: UserRole;
  submission: BASTSubmissionData;
  onUpdateSubmission: (updated: BASTSubmissionData) => void;
  onGoToOfficialBAST: () => void;
  onGoToChecklist: () => void;
  onAddAuditLog: (action: string, details: string) => void;
  onOpenNewBASTModal?: () => void;
  onOpenContractorSettings?: () => void;
  bastList?: BASTSubmissionData[];
  onSelectSubmission?: (submission: BASTSubmissionData) => void;
  onResetWorkflow?: () => void;
}

export const ContractorBASTWorkflow: React.FC<ContractorBASTWorkflowProps> = ({
  project,
  workItems,
  userRole,
  submission,
  onUpdateSubmission,
  onGoToOfficialBAST,
  onGoToChecklist,
  onAddAuditLog,
  onOpenNewBASTModal,
  onOpenContractorSettings,
  bastList,
  onSelectSubmission,
  onResetWorkflow,
}) => {
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'overview' | 'list' | 'form' | 'attachments' | 'punchlist' | 'letter'>('overview');
  const [showNewPunchModal, setShowNewPunchModal] = useState(false);
  const [newPunchSector, setNewPunchSector] = useState(workItems[0]?.name || 'Pekerjaan Finishing');
  const [newPunchDesc, setNewPunchDesc] = useState('');
  const [newPunchSeverity, setNewPunchSeverity] = useState<'Ringan' | 'Sedang' | 'Kritis'>('Ringan');
  const [newPunchDeadline, setNewPunchDeadline] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const physicalProgress = calculatePhysicalProgress(workItems);
  const isContractor = userRole === 'Kontraktor' || userRole === 'Site Manager';
  const isMK = userRole === 'Konsultan';
  const isOwner = userRole === 'Owner' || userRole === 'Direktur';

  // Statistics
  const totalAttachments = submission.attachments.length;
  const completedAttachments = submission.attachments.filter((a) => a.isCompleted).length;
  const verifiedAttachments = submission.attachments.filter((a) => a.verifiedByMK).length;
  const allAttachmentsReady = totalAttachments > 0 && completedAttachments === totalAttachments;

  const totalPunch = submission.punchList.length;
  const resolvedPunch = submission.punchList.filter((p) => p.isResolved).length;
  const verifiedPunch = submission.punchList.filter((p) => p.verifiedByMK).length;
  const allPunchResolved = totalPunch === 0 || resolvedPunch === totalPunch;

  // Stages configuration
  const stages: {
    key: BASTWorkflowStage;
    number: number;
    title: string;
    party: string;
    description: string;
    badge: string;
  }[] = [
    {
      key: 'draft',
      number: 1,
      title: 'Kelengkapan Berkas & Permohonan',
      party: 'Kontraktor Pelaksana',
      description: 'Penyusunan berkas As-Built Drawing, T&C, Garansi, dan Surat Permohonan BAST-1',
      badge: 'Tahap 1',
    },
    {
      key: 'submitted',
      number: 2,
      title: 'Pengajuan Resmi ke Konsultan MK',
      party: 'Kontraktor & MK',
      description: 'Pengiriman berkas permohonan PHO kepada Konsultan Pengawas MK untuk review',
      badge: 'Tahap 2',
    },
    {
      key: 'joint_inspection',
      number: 3,
      title: 'Opname Bersama & Verifikasi Punch List',
      party: 'Konsultan MK & Kontraktor',
      description: 'Joint inspection lapangan 14 sektor pekerjaan dan penyelesaian perbaikan cacat mutu',
      badge: 'Tahap 3',
    },
    {
      key: 'mk_recommended',
      number: 4,
      title: 'Rekomendasi Teknis Kelayakan PHO',
      party: 'Konsultan MK',
      description: 'Konsultan MK menerbitkan Surat Rekomendasi Teknis kelulusan opname fisik 100%',
      badge: 'Tahap 4',
    },
    {
      key: 'owner_approved',
      number: 5,
      title: 'Persetujuan & Validasi Owner',
      party: 'Pemberi Tugas (Owner)',
      description: 'Owner menyetujui BAST-1 dan otorisasi masa pemeliharaan serta dana retensi 5%',
      badge: 'Tahap 5',
    },
    {
      key: 'finalized',
      number: 6,
      title: 'Pengesahan BAST-1 Tripartit & Retensi',
      party: '3 Pihak (Owner-MK-Kontraktor)',
      description: 'Penandatanganan digital 3 pihak, masa garansi 180 hari aktif, proyek resmi Selesai',
      badge: 'Selesai',
    },
  ];

  const getStageIndex = (stage: BASTWorkflowStage) => {
    switch (stage) {
      case 'draft':
        return 0;
      case 'submitted':
        return 1;
      case 'joint_inspection':
        return 2;
      case 'mk_recommended':
        return 3;
      case 'owner_approved':
        return 4;
      case 'finalized':
        return 5;
      default:
        return 0;
    }
  };

  const currentStageIdx = getStageIndex(submission.stage);

  // Workflow Action Handlers
  const handleContractorSubmit = () => {
    if (!allAttachmentsReady) {
      alert('Mohon lengkapi semua dokumen prasyarat lampiran BAST-1 sebelum mengajukan ke Konsultan MK.');
      return;
    }

    const updated: BASTSubmissionData = {
      ...submission,
      stage: 'submitted',
      submissionDate: new Date().toISOString().split('T')[0],
      contractorSignature: {
        ...submission.contractorSignature,
        signed: true,
        name: submission.contractorRepresentative || project.siteManager || 'EKO YULIANTO',
        signedAt: new Date().toLocaleString('id-ID'),
        signatureData: submission.contractorSignature.signatureData || 'PRESET_VERIFIED_SM',
      },
    };

    onUpdateSubmission(updated);
    onAddAuditLog(
      'Pengajuan BAST-1 oleh Kontraktor',
      `Kontraktor (${updated.contractorRepresentative}) mengajukan Surat Permohonan BAST-1 No. ${updated.submissionNumber} kepada Konsultan MK.`
    );
    alert('Pengajuan BAST-1 berhasil dikirimkan ke Konsultan Pengawas (MK) untuk proses Joint Opname Lapangan!');
  };

  const handleStartJointInspection = () => {
    const updated: BASTSubmissionData = {
      ...submission,
      stage: 'joint_inspection',
    };
    onUpdateSubmission(updated);
    onAddAuditLog(
      'Mulai Opname Bersama BAST-1',
      'Konsultan MK dan Kontraktor memulai pemeriksaan lapangan dan pencatatan Punch List.'
    );
  };

  const handleMKIssueRecommendation = () => {
    if (!allPunchResolved) {
      alert('Masih terdapat temuan cacat mutu (Punch List) yang belum diperbaiki oleh Kontraktor.');
      return;
    }

    const recNo = `REK-PHO/MK/${project.contractNumber}/2026`;
    const updated: BASTSubmissionData = {
      ...submission,
      stage: 'mk_recommended',
      mkRecommendationLetterNo: recNo,
      mkRecommendationDate: new Date().toISOString().split('T')[0],
      mkVerifiedBy: project.consultantMK || 'SAEPUL ANWAR',
      mkSignature: {
        ...submission.mkSignature,
        signed: true,
        name: project.consultantMK || 'SAEPUL ANWAR',
        signedAt: new Date().toLocaleString('id-ID'),
        signatureData: submission.mkSignature.signatureData || 'PRESET_VERIFIED_MK',
      },
    };

    onUpdateSubmission(updated);
    onAddAuditLog(
      'Penerbitan Rekomendasi Teknis PHO oleh MK',
      `Konsultan Pengawas MK menerbitkan rekomendasi kelayakan teknis BAST-1 No. ${recNo} kepada Owner.`
    );
    alert('Surat Rekomendasi Teknis Kelayakan PHO berhasil diterbitkan oleh Konsultan MK dan diteruskan ke Owner!');
  };

  const handleOwnerApprove = () => {
    const updated: BASTSubmissionData = {
      ...submission,
      stage: 'owner_approved',
      ownerApprovalDate: new Date().toISOString().split('T')[0],
      ownerApprovedBy: project.director || 'HASANUDIN',
      ownerSignature: {
        ...submission.ownerSignature,
        signed: true,
        name: project.director || 'HASANUDIN',
        signedAt: new Date().toLocaleString('id-ID'),
        signatureData: submission.ownerSignature.signatureData || 'PRESET_VERIFIED_DIR',
      },
    };

    onUpdateSubmission(updated);
    onAddAuditLog(
      'Persetujuan BAST-1 oleh Owner',
      `Pemberi Tugas / Owner (${updated.ownerApprovedBy}) menyetujui pengesahan BAST-1 dan penetapan masa retensi 5%.`
    );
    alert('BAST-1 telah disetujui Owner. Langkah terakhir adalah pengesahan tripartit resmi.');
  };

  const handleFinalizeTripartiteBAST = () => {
    const now = new Date();
    const endDate = new Date(now.getTime() + (submission.maintenancePeriodDays || 180) * 24 * 60 * 60 * 1000);

    const updated: BASTSubmissionData = {
      ...submission,
      stage: 'finalized',
      isCompleted: true,
      handoverDate: now.toISOString().split('T')[0],
      maintenanceEndDate: endDate.toISOString().split('T')[0],
      contractorSignature: {
        ...submission.contractorSignature,
        signed: true,
        name: submission.contractorRepresentative || project.siteManager || 'EKO YULIANTO',
        signedAt: submission.contractorSignature.signedAt || new Date().toLocaleString('id-ID'),
        signatureData: submission.contractorSignature.signatureData || 'PRESET_VERIFIED_SM',
      },
      mkSignature: {
        ...submission.mkSignature,
        signed: true,
        name: project.consultantMK || 'SAEPUL ANWAR',
        signedAt: submission.mkSignature.signedAt || new Date().toLocaleString('id-ID'),
        signatureData: submission.mkSignature.signatureData || 'PRESET_VERIFIED_MK',
      },
      ownerSignature: {
        ...submission.ownerSignature,
        signed: true,
        name: project.director || 'HASANUDIN',
        signedAt: submission.ownerSignature.signedAt || new Date().toLocaleString('id-ID'),
        signatureData: submission.ownerSignature.signatureData || 'PRESET_VERIFIED_DIR',
      },
    };

    onUpdateSubmission(updated);
    onAddAuditLog(
      'Pengesahan Resmi BAST-1 Tripartit',
      `BAST-1 No. ${updated.bastNumber} disahkan resmi oleh Kontraktor, Konsultan MK, dan Owner. Masa Pemeliharaan 180 hari aktif.`
    );
    alert('Selamat! Berita Acara Serah Terima Pertama (BAST-1) telah resmi disahkan oleh ketiga pihak.');
  };

  // Toggle attachment completed
  const handleToggleAttachment = (id: string) => {
    const updated = submission.attachments.map((att) => {
      if (att.id === id) {
        return { ...att, isCompleted: !att.isCompleted };
      }
      return att;
    });
    onUpdateSubmission({ ...submission, attachments: updated });
  };

  // Toggle attachment verified by MK
  const handleToggleAttachmentMK = (id: string) => {
    if (!isMK && !isOwner) {
      alert('Hanya Konsultan MK atau Owner yang berhak memverifikasi kelayakan dokumen teknis.');
      return;
    }
    const updated = submission.attachments.map((att) => {
      if (att.id === id) {
        return { ...att, verifiedByMK: !att.verifiedByMK };
      }
      return att;
    });
    onUpdateSubmission({ ...submission, attachments: updated });
  };

  // Toggle punch list resolved
  const handleTogglePunchResolved = (id: string) => {
    const updated = submission.punchList.map((p) => {
      if (p.id === id) {
        const nextResolved = !p.isResolved;
        return {
          ...p,
          isResolved: nextResolved,
          resolvedDate: nextResolved ? new Date().toISOString().split('T')[0] : undefined,
          verifiedByMK: nextResolved ? p.verifiedByMK : false,
        };
      }
      return p;
    });
    onUpdateSubmission({ ...submission, punchList: updated });
  };

  // Toggle punch list verified by MK
  const handleTogglePunchMK = (id: string) => {
    if (!isMK && !isOwner) {
      alert('Hanya Konsultan Pengawas MK yang dapat memvalidasi perbaikan Punch List.');
      return;
    }
    const updated = submission.punchList.map((p) => {
      if (p.id === id) {
        return { ...p, verifiedByMK: !p.verifiedByMK };
      }
      return p;
    });
    onUpdateSubmission({ ...submission, punchList: updated });
  };

  // Add new punch item
  const handleAddPunchItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPunchDesc.trim()) return;

    const newItem: BASTPunchListItem = {
      id: `punch-${Date.now()}`,
      sectorName: newPunchSector,
      description: newPunchDesc.trim(),
      severity: newPunchSeverity,
      deadlineDate: newPunchDeadline,
      isResolved: false,
      verifiedByMK: false,
    };

    onUpdateSubmission({
      ...submission,
      punchList: [...submission.punchList, newItem],
    });
    setNewPunchDesc('');
    setShowNewPunchModal(false);
    onAddAuditLog('Penambahan Punch List', `Temuan cacat mutu baru pada ${newPunchSector}: ${newItem.description}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner: Alur Pengajuan BAST Kontraktor */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border border-blue-800/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-orange-500 text-white">
                Standar Tripartit Konstruksi
              </span>
              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Provisional Hand Over (PHO - BAST 1)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              Alur Pengajuan BAST untuk Kontraktor
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Panduan terstruktur bagi Kontraktor Pelaksana untuk melengkapi berkas syarat PHO, mengirimkan surat permohonan resmi,
              menjalani opname bersama Konsultan MK, hingga pengesahan Berita Acara Serah Terima Pertama.
            </p>
          </div>

          {/* Quick Status Badge */}
          <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl shrink-0 min-w-[220px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Pengajuan</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-3 h-3 rounded-full animate-pulse ${
                  submission.stage === 'finalized'
                    ? 'bg-emerald-500'
                    : submission.stage === 'owner_approved' || submission.stage === 'mk_recommended'
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`}
              />
              <span className="text-sm font-black text-amber-400">
                {submission.stage === 'draft' && 'DRAFT PERSIAPAN'}
                {submission.stage === 'submitted' && 'DIAJUKAN KE MK'}
                {submission.stage === 'joint_inspection' && 'OPNAME BERSAMA MK'}
                {submission.stage === 'mk_recommended' && 'REKOMENDASI MK TERBIT'}
                {submission.stage === 'owner_approved' && 'DISETUJUI OWNER'}
                {submission.stage === 'finalized' && '✓ BAST-1 SAH RESMI'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block mt-1">
              No. Surat: {submission.submissionNumber}
            </span>
            {onOpenNewBASTModal && (
              <button
                type="button"
                onClick={onOpenNewBASTModal}
                className="mt-2.5 w-full px-3 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
              >
                <FilePlus2 className="w-3.5 h-3.5" /> + Pengajuan BAST Baru
              </button>
            )}
            {onResetWorkflow && (
              <button
                type="button"
                onClick={onResetWorkflow}
                className="mt-1.5 w-full px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-950/60 text-slate-300 hover:text-rose-200 border border-slate-700/80 hover:border-rose-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Reset alur pengajuan BAST aktif kembali ke status Draft awal"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" /> Reset Alur BAST
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role Notice & Guidance */}
      {isContractor && (
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-slate-800 dark:text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500 text-white shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <strong className="font-bold text-orange-600 dark:text-orange-400 block">
                Anda Masuk sebagai Kontraktor Pelaksana ({project.siteManager || 'EKO YULIANTO'})
              </strong>
              <span>
                Pastikan progress fisik lapangan 100%, checklist berkas prasyarat tercentang lengkap, lalu kirim Surat Permohonan BAST-1 ke Konsultan MK.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onResetWorkflow && (
              <button
                type="button"
                onClick={onResetWorkflow}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Kembalikan tahapan pengajuan BAST ke status Draft"
              >
                <RotateCcw className="w-4 h-4 text-rose-500" /> Reset Alur ke Draft
              </button>
            )}
            {onOpenContractorSettings && (
              <button
                type="button"
                onClick={onOpenContractorSettings}
                className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Pengaturan Legalitas, NPWP, NIB, Tim Manajemen & Logo Kontraktor"
              >
                <HardHat className="w-4 h-4" /> Profil Kontraktor
              </button>
            )}
            {onOpenNewBASTModal && (
              <button
                type="button"
                onClick={onOpenNewBASTModal}
                className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-950 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 shadow-sm transition-all cursor-pointer"
              >
                <FilePlus2 className="w-4 h-4 text-orange-400" /> Modal Pengajuan BAST
              </button>
            )}
            {submission.stage === 'draft' && (
              <button
                onClick={handleContractorSubmit}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shrink-0 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" /> Kirim Pengajuan ke MK
              </button>
            )}
          </div>
        </div>
      )}

      {isMK && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-slate-800 dark:text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500 text-white shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <strong className="font-bold text-blue-600 dark:text-blue-400 block">
                Anda Masuk sebagai Konsultan Pengawas MK ({project.consultantMK || 'SAEPUL ANWAR'})
              </strong>
              <span>
                Lakukan Opname Bersama di lapangan, periksa daftar cacat mutu (Punch List), dan terbitkan Rekomendasi Teknis Kelayakan PHO.
              </span>
            </div>
          </div>
          {submission.stage === 'joint_inspection' && (
            <button
              onClick={handleMKIssueRecommendation}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shrink-0 transition-all"
            >
              <Award className="w-4 h-4" /> Terbitkan Rekomendasi MK
            </button>
          )}
        </div>
      )}

      {isOwner && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-800 dark:text-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500 text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <strong className="font-bold text-emerald-600 dark:text-emerald-400 block">
                Anda Masuk sebagai Pemberi Tugas / Owner ({project.director || 'HASANUDIN'})
              </strong>
              <span>
                Periksa rekomendasi teknis Konsultan MK, validasi klausul retensi 5%, dan lakukan otorisasi persetujuan serah terima BAST-1.
              </span>
            </div>
          </div>
          {submission.stage === 'mk_recommended' && (
            <button
              onClick={handleOwnerApprove}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shrink-0 transition-all"
            >
              <Check className="w-4 h-4" /> Setujui Pengajuan BAST-1
            </button>
          )}
        </div>
      )}

      {/* 4-Step Interactive Visual Stepper */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-500" /> Tahapan Siklus Alur Pengajuan BAST-1 (PHO)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map((st, idx) => {
            const isPassed = idx < currentStageIdx;
            const isCurrent = idx === currentStageIdx;
            const isFuture = idx > currentStageIdx;

            return (
              <div
                key={st.key}
                className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all relative ${
                  isCurrent
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                    : isPassed
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40 text-emerald-900 dark:text-emerald-300'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isCurrent
                          ? 'bg-blue-600 text-white'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isPassed ? '✓ ' + st.badge : st.badge}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">Step {st.number}</span>
                  </div>

                  <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug">
                    {st.title}
                  </h4>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 block mt-1">
                    {st.party}
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal line-clamp-2">
                    {st.description}
                  </p>
                </div>

                {isCurrent && (
                  <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-900/50 flex items-center justify-between text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    <span>Sedang Berjalan</span>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Workflow Navigation Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveWorkflowTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeWorkflowTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" /> Ringkasan &amp; Dashboard Alur
        </button>
        <button
          onClick={() => setActiveWorkflowTab('list')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeWorkflowTab === 'list'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-emerald-400" /> Daftar Dokumen BAST &amp; Tanda Tangan ({bastList?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveWorkflowTab('form')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeWorkflowTab === 'form'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" /> Form Surat Permohonan Kontraktor
        </button>
        <button
          onClick={() => setActiveWorkflowTab('attachments')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeWorkflowTab === 'attachments'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" /> Dokumen Lampiran Syarat PHO ({completedAttachments}/{totalAttachments})
        </button>
        <button
          onClick={() => setActiveWorkflowTab('punchlist')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeWorkflowTab === 'punchlist'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Verifikasi Opname &amp; Punch List ({resolvedPunch}/{totalPunch})
        </button>
        <button
          onClick={() => setActiveWorkflowTab('letter')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeWorkflowTab === 'letter'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Printer className="w-4 h-4" /> Pratinjau Surat Permohonan BAST-1
        </button>
      </div>

      {/* TAB CONTENT 1: OVERVIEW & DASHBOARD ALUR */}
      {activeWorkflowTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Checklist Kesiapan & Kontrol Aksi */}
          <div className="lg:col-span-2 space-y-5">
            {/* Prerequisite Readiness Checker */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Pengecekan Prasyarat Pengajuan BAST-1
                </h4>
                <span className="text-[10px] font-bold text-slate-400">Standar Permen PUPR No. 14/2020</span>
              </div>

              <div className="space-y-2.5">
                {/* 1. Progres Fisik */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${physicalProgress >= 100 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Pencapaian Progres Fisik Konstruksi
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Syarat: Minimal 100% fisik siap fungsi sesuai kontrak
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 dark:text-white block">
                      {physicalProgress.toFixed(1)}%
                    </span>
                    <span className={`text-[10px] font-bold ${physicalProgress >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {physicalProgress >= 100 ? '✓ MEMENUHI SYARAT' : 'SIAP INSPEKSI AKHIR'}
                    </span>
                  </div>
                </div>

                {/* 2. Berkas Lampiran Teknis */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${allAttachmentsReady ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      <FileCheck2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Kelengkapan 7 Dokumen Pendukung PHO
                      </span>
                      <span className="text-[10px] text-slate-400">
                        As-Built Drawing, Hasil T&amp;C, Garansi, O&amp;M Manual, dan Laporan Kumulatif
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 dark:text-white block">
                      {completedAttachments} / {totalAttachments} Berkas
                    </span>
                    <span className={`text-[10px] font-bold ${allAttachmentsReady ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {allAttachmentsReady ? '✓ DOKUMEN LENGKAP' : 'BELUM LENGKAP'}
                    </span>
                  </div>
                </div>

                {/* 3. Punch List Status */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${allPunchResolved ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        Daftar Cacat Mutu Lapangan (Punch List)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Perapihan cacat minor wajib diselesaikan sebelum pengesahan final
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 dark:text-white block">
                      {resolvedPunch} / {totalPunch} Terperbaiki
                    </span>
                    <span className={`text-[10px] font-bold ${allPunchResolved ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {allPunchResolved ? '✓ CLEAR MUTU' : 'DALAM PERBAIKAN'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Flow Control Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Award className="w-4 h-4" /> Aksi Progres Tahapan Selanjutnya
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Langkah yang harus dieksekusi oleh entitas terkait berdasarkan tahapan saat ini.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-300">
                  Tahap {currentStageIdx + 1} dari 6
                </span>
              </div>

              {/* Dynamic Action Buttons based on stage */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 space-y-3">
                {submission.stage === 'draft' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400 shrink-0">
                        <Send className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Langkah 1: Pengiriman Surat Permohonan BAST-1</h5>
                        <p className="text-[11px] text-slate-300 mt-1">
                          Kontraktor Pelaksana memeriksa formulir nomor surat, memastikan dokumen lampiran lengkap,
                          lalu mengirimkan berkas kepada Konsultan MK.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-700">
                      <button
                        onClick={() => setActiveWorkflowTab('form')}
                        className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition-all flex items-center gap-1.5"
                      >
                        <FileText className="w-4 h-4 text-orange-400" /> Edit Form Surat
                      </button>
                      <button
                        onClick={() => setActiveWorkflowTab('attachments')}
                        className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white transition-all flex items-center gap-1.5"
                      >
                        <FileCheck2 className="w-4 h-4 text-blue-400" /> Cek Lampiran
                      </button>
                      <button
                        onClick={handleContractorSubmit}
                        className="ml-auto px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-xs font-black text-white transition-all flex items-center gap-1.5 shadow-lg shadow-orange-500/20"
                      >
                        <Send className="w-4 h-4" /> Kirim Pengajuan Resmi ke MK
                      </button>
                    </div>
                  </div>
                )}

                {submission.stage === 'submitted' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Langkah 2: Dijadwalkan Opname Bersama oleh MK</h5>
                        <p className="text-[11px] text-slate-300 mt-1">
                          Surat permohonan telah diterima oleh Konsultan MK. Langkah berikutnya adalah pelaksanaan Joint Opname di lapangan.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                      <span className="text-[11px] text-slate-400">
                        Tanggal Pengajuan: <strong className="text-white font-mono">{submission.submissionDate}</strong>
                      </span>
                      <button
                        onClick={handleStartJointInspection}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-black text-white transition-all flex items-center gap-1.5"
                      >
                        Mulai Opname Bersama &amp; Punch List
                      </button>
                    </div>
                  </div>
                )}

                {submission.stage === 'joint_inspection' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Langkah 3: Penyelesaian Punch List &amp; Rekomendasi MK</h5>
                        <p className="text-[11px] text-slate-300 mt-1">
                          Kontraktor menyelesaikan perbaikan cacat mutu minor. Setelah seluruh perbaikan terverifikasi, Konsultan MK menerbitkan Surat Rekomendasi Teknis PHO.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                      <button
                        onClick={() => setActiveWorkflowTab('punchlist')}
                        className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white flex items-center gap-1.5"
                      >
                        Buka Manajemen Punch List ({resolvedPunch}/{totalPunch})
                      </button>
                      <button
                        onClick={handleMKIssueRecommendation}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-black text-white transition-all flex items-center gap-1.5"
                      >
                        <Award className="w-4 h-4" /> Terbitkan Rekomendasi PHO (MK)
                      </button>
                    </div>
                  </div>
                )}

                {submission.stage === 'mk_recommended' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Langkah 4: Validasi &amp; Persetujuan Owner</h5>
                        <p className="text-[11px] text-slate-300 mt-1">
                          Konsultan MK telah menerbitkan Surat Rekomendasi No. {submission.mkRecommendationLetterNo}. Menunggu persetujuan Owner.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                      <span className="text-[11px] text-slate-400">
                        Direkomendasikan oleh: <strong className="text-white">{submission.mkVerifiedBy}</strong>
                      </span>
                      <button
                        onClick={handleOwnerApprove}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Otorisasi Persetujuan Owner
                      </button>
                    </div>
                  </div>
                )}

                {submission.stage === 'owner_approved' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                        <PenTool className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-white">Langkah 5: Penandatanganan Digital Tripartit</h5>
                        <p className="text-[11px] text-slate-300 mt-1">
                          Seluruh pihak (Owner, MK, Kontraktor) siap menandatangani Berita Acara Serah Terima Pertama (BAST-1) secara resmi.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                      <button
                        onClick={onGoToOfficialBAST}
                        className="px-3.5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold text-white flex items-center gap-1.5"
                      >
                        <FileCheck2 className="w-4 h-4" /> Lihat Format Dokumen BAST
                      </button>
                      <button
                        onClick={handleFinalizeTripartiteBAST}
                        className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-black text-white transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20"
                      >
                        <Award className="w-4 h-4" /> Sahkan BAST-1 Tripartit &amp; Mulai Masa Garansi
                      </button>
                    </div>
                  </div>
                )}

                {submission.stage === 'finalized' && (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500 text-white shrink-0">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                          BAST-1 RESMI DISAHKAN &amp; TERAUDIT
                        </h5>
                        <p className="text-[11px] text-slate-300 mt-1">
                          Proyek Gedung Foresyndo 2 telah resmi diserahterimakan pertama kali. Masa pemeliharaan (180 hari)
                          berjalan hingga tanggal <strong className="text-white font-mono">{submission.maintenanceEndDate}</strong>.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                      <span className="text-[11px] font-mono text-emerald-400">
                        No. Dokumen: {submission.bastNumber}
                      </span>
                      <button
                        onClick={onGoToOfficialBAST}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white flex items-center gap-1.5 shadow-md"
                      >
                        <Printer className="w-4 h-4" /> Buka &amp; Cetak BAST-1
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Ringkasan Nilai Kontrak, Retensi & Masa Pemeliharaan */}
          <div className="space-y-4">
            {/* Warranty & Retention Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                Masa Pemeliharaan &amp; Dana Retensi
              </h4>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Nilai Kontrak Pekerjaan</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block font-mono">
                    {formatIDR(project.contractValue)}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-blue-600 dark:text-blue-300 font-bold uppercase">Dana Retensi (5%)</span>
                    <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded">Jaminan Pemeliharaan</span>
                  </div>
                  <span className="text-sm font-black text-blue-700 dark:text-blue-300 mt-1 block font-mono">
                    {formatIDR(submission.retentionValue || project.contractValue * 0.05)}
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    Dana ditahan atau diganti Bank Garansi Pemeliharaan hingga terbit BAST-2 (FHO).
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                  <span className="text-[10px] text-orange-600 dark:text-orange-300 font-bold uppercase block">
                    Durasi Masa Pemeliharaan
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-base font-black text-orange-700 dark:text-orange-400">
                      {submission.maintenancePeriodDays || 180} Hari Kalender
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">(6 Bulan)</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-1">
                    Hingga Target BAST-2: <strong className="text-slate-900 dark:text-white font-mono">{submission.maintenanceEndDate}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Tripartite Signatory Status */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <PenTool className="w-4 h-4 text-blue-500" /> Otorisasi 3 Pihak (Tripartit)
              </h4>

              <div className="space-y-2 text-xs">
                {/* 1. Kontraktor */}
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-orange-500 block">PIHAK KONTRAKTOR</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {submission.contractorRepresentative || project.contractorProfile?.management?.siteManager || project.siteManager || 'EKO YULIANTO'}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      submission.contractorSignature.signed
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {submission.contractorSignature.signed ? '✓ SIGNED' : 'MENUNGGU'}
                  </span>
                </div>

                {/* 2. Konsultan MK */}
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-500 block">PIHAK KONSULTAN MK</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {project.consultantMK || 'SAEPUL ANWAR'}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      submission.mkSignature.signed
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {submission.mkSignature.signed ? '✓ SIGNED' : 'MENUNGGU'}
                  </span>
                </div>

                {/* 3. Owner */}
                <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-500 block">PIHAK OWNER / DIREKSI</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {project.director || 'HASANUDIN'}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      submission.ownerSignature.signed
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {submission.ownerSignature.signed ? '✓ SIGNED' : 'MENUNGGU'}
                  </span>
                </div>
              </div>
            </div>

            {/* Profil & Legalitas Kontraktor Pelaksana */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/30 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-amber-500" /> Profil Kontraktor Pelaksana
                </h4>
                {onOpenContractorSettings && (
                  <button
                    onClick={onOpenContractorSettings}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1 cursor-pointer"
                  >
                    Edit Data <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                  <img
                    src={project.contractorProfile?.logoUrl || project.logoUrl || '/assets/logo.png'}
                    alt="Logo"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {project.contractorProfile?.companyName || project.contractor}
                  </h5>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                    {project.contractorProfile?.brandName || 'PT FORESYNDO GLOBAL INDONESIA'}
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                      NPWP: {project.contractorProfile?.npwp || '61.289.845.2-404.000'}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                      NIB: {project.contractorProfile?.nib || '1410220080338'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Direktur Utama:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{project.contractorProfile?.management?.director || 'Rohman Priyambodo'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Project Manager (PM):</span>
                  <strong className="text-slate-800 dark:text-slate-200">{project.contractorProfile?.management?.projectManager || project.projectManager || 'JAKA SEPTIANDANA'}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Site Manager (SM):</span>
                  <strong className="text-slate-800 dark:text-slate-200">{project.contractorProfile?.management?.siteManager || project.siteManager || 'EKO YULIANTO'}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Lead QC Engineer:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{project.contractorProfile?.management?.qcEngineer || project.qcEngineer || 'KIKI'}</strong>
                </div>
              </div>

              {onOpenContractorSettings && (
                <button
                  type="button"
                  onClick={onOpenContractorSettings}
                  className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <HardHat className="w-3.5 h-3.5" /> Atur Legalitas, Tim &amp; Logo Kontraktor
                </button>
              )}
            </div>

            {/* Pratinjau Cepat Status Tanda Tangan Digital Dokumen BAST */}
            {bastList && bastList.length > 0 ? (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-orange-500" /> Pratinjau TTD Dokumen BAST
                  </h4>
                  <button
                    onClick={() => setActiveWorkflowTab('list')}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                  >
                    Buka Lengkap ({bastList.length}) <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Status tanda tangan digital Kontraktor &amp; Konsultan MK per berkas:
                </p>

                <div className="space-y-2">
                  {bastList.map((doc) => {
                    const isSelected = doc.submissionId === submission.submissionId;
                    return (
                      <div
                        key={doc.submissionId}
                        onClick={() => onSelectSubmission && onSelectSubmission(doc)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 shadow-xs'
                            : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate font-mono">
                              {doc.bastNumber}
                            </span>
                            {isSelected && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-600 text-white">
                                AKTIF
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                            {doc.title || doc.submissionNumber}
                          </span>
                        </div>

                        {/* Status Tanda Tangan: Kontraktor & Konsultan */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Kontraktor */}
                          <div
                            title={`Kontraktor: ${doc.contractorSignature.signed ? 'Sudah TTD' : 'Belum TTD'}`}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
                              doc.contractorSignature.signed
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            }`}
                          >
                            <span className="text-[9px] font-extrabold">KTR</span>
                            {doc.contractorSignature.signed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                            )}
                          </div>

                          {/* Konsultan MK */}
                          <div
                            title={`Konsultan MK: ${doc.mkSignature.signed ? 'Sudah TTD' : 'Belum TTD'}`}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
                              doc.mkSignature.signed
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                            }`}
                          >
                            <span className="text-[9px] font-extrabold">MK</span>
                            {doc.mkSignature.signed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2.5">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <PenTool className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Daftar Dokumen BAST &amp; TTD Belum Diterbitkan
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Pekerjaan konstruksi fisik belum dimulai atau belum ada berkas BAST yang diterbitkan. Daftar dokumen dan status tanda tangan digital akan tampil di sini setelah pengajuan serah terima dibuat.
                </p>
                <button
                  onClick={() => setActiveWorkflowTab('list')}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer pt-1"
                >
                  Lihat Status Daftar BAST <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: DAFTAR DOKUMEN BAST LENGKAP DENGAN PRATINJAU TANDA TANGAN */}
      {activeWorkflowTab === 'list' && bastList && (
        <BASTDocumentList
          project={project}
          userRole={userRole}
          bastList={bastList}
          currentSubmissionId={submission.submissionId}
          workItems={workItems}
          onSelectSubmission={(selected) => {
            if (onSelectSubmission) onSelectSubmission(selected);
            setActiveWorkflowTab('overview');
          }}
          onGoToOfficialBAST={onGoToOfficialBAST}
          onOpenNewBASTModal={onOpenNewBASTModal}
        />
      )}

      {/* TAB CONTENT 2: FORM SURAT PERMOHONAN KONTRAKTOR */}
      {activeWorkflowTab === 'form' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Formulir Surat Permohonan Serah Terima Pertama (PHO - BAST 1)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Data permohonan resmi yang diterbitkan Kontraktor Pelaksana kepada Konsultan Pengawas dan Owner.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start">
              {onOpenNewBASTModal && (
                <button
                  type="button"
                  onClick={onOpenNewBASTModal}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <FilePlus2 className="w-4 h-4" /> Buka Modal BAST Terintegrasi
                </button>
              )}
              <button
                onClick={() => setActiveWorkflowTab('letter')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-4 h-4 text-orange-500" /> Lihat Pratinjau Surat
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor Surat Permohonan Kontraktor *
              </label>
              <input
                type="text"
                value={submission.submissionNumber}
                onChange={(e) => onUpdateSubmission({ ...submission, submissionNumber: e.target.value })}
                placeholder="Contoh: 042/FGI-KONT/BAST-1/IX/2026"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Pengajuan Permohonan *
              </label>
              <input
                type="date"
                value={submission.submissionDate}
                onChange={(e) => onUpdateSubmission({ ...submission, submissionDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Tanggal Pelaksanaan Handover (PHO) *
              </label>
              <input
                type="date"
                value={submission.targetHandoverDate}
                onChange={(e) => onUpdateSubmission({ ...submission, targetHandoverDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Penanggung Jawab Kontraktor (Site Manager) *
              </label>
              <input
                type="text"
                value={submission.contractorRepresentative}
                onChange={(e) => onUpdateSubmission({ ...submission, contractorRepresentative: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Catatan &amp; Komitmen Kontraktor dalam Pengajuan
              </label>
              <textarea
                rows={3}
                value={submission.contractorNotes}
                onChange={(e) => onUpdateSubmission({ ...submission, contractorNotes: e.target.value })}
                placeholder="Tuliskan pernyataan kesiapan fisik 100%, kesiapan mendampingi Joint Opname, dan komitmen penanganan cacat mutu..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Perubahan pada form otomatis tersimpan dalam sesi proyek.
            </span>
            <button
              onClick={handleContractorSubmit}
              disabled={submission.stage !== 'draft'}
              className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
            >
              <Send className="w-4 h-4" /> Kirimkan Permohonan ke Konsultan MK
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: LAMPIRAN SYARAT PHO */}
      {activeWorkflowTab === 'attachments' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-500" />
                Daftar Dokumen Lampiran Prasyarat Serah Terima (PHO)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kontraktor wajib melengkapi seluruh dokumen prasyarat teknis ini untuk diverifikasi oleh Konsultan Pengawas MK.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Kelengkapan: <strong className="text-blue-600 dark:text-blue-400">{completedAttachments} dari {totalAttachments}</strong>
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {submission.attachments.map((att, idx) => (
              <div
                key={att.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-all"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleToggleAttachment(att.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                      att.isCompleted
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'border-2 border-slate-300 dark:border-slate-600 hover:border-orange-500'
                    }`}
                  >
                    {att.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{idx + 1}. {att.name}</span>
                      {att.required && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">
                          Wajib
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {att.description}
                    </p>
                    {att.fileReference && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-1 inline-flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Berkas: {att.fileReference}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => handleToggleAttachment(att.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      att.isCompleted
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {att.isCompleted ? '✓ Siap Dilampirkan' : 'Tandai Siap'}
                  </button>

                  <button
                    onClick={() => handleToggleAttachmentMK(att.id)}
                    title="Verifikasi oleh Konsultan MK"
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      att.verifiedByMK
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-blue-500'
                    }`}
                  >
                    {att.verifiedByMK ? '✓ Diverifikasi MK' : 'Verifikasi MK'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: OPNAME & PUNCH LIST */}
      {activeWorkflowTab === 'punchlist' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Daftar Cacat Mutu Lapangan (Punch List / Defect List)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Catatan temuan inspeksi bersama Konsultan MK yang wajib diperbaiki Kontraktor sebelum BAST-1 resmi disahkan.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewPunchModal(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> Catat Temuan Baru
              </button>
            </div>
          </div>

          {/* Punch List Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3 w-12 text-center">Status</th>
                  <th className="p-3 w-56">Sektor Pekerjaan</th>
                  <th className="p-3">Uraian Cacat Mutu / Temuan</th>
                  <th className="p-3 w-28 text-center">Tingkat</th>
                  <th className="p-3 w-32">Batas Perbaikan</th>
                  <th className="p-3 w-36 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {submission.punchList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Tidak ada temuan cacat mutu (Punch List kosong). Seluruh pekerjaan telah memenuhi standar mutu!
                    </td>
                  </tr>
                ) : (
                  submission.punchList.map((punch) => (
                    <tr key={punch.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleTogglePunchResolved(punch.id)}
                          className={`w-6 h-6 rounded-md flex items-center justify-center mx-auto transition-all ${
                            punch.isResolved
                              ? 'bg-emerald-500 text-white shadow-sm'
                              : 'border-2 border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                          }`}
                          title={punch.isResolved ? 'Selesai Diperbaiki' : 'Klik jika sudah diperbaiki'}
                        >
                          {punch.isResolved && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>
                      </td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">
                        {punch.sectorName}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {punch.description}
                        {punch.resolvedDate && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                            ✓ Diperbaiki pada: {punch.resolvedDate}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            punch.severity === 'Kritis'
                              ? 'bg-red-500/10 text-red-600'
                              : punch.severity === 'Sedang'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-blue-500/10 text-blue-600'
                          }`}
                        >
                          {punch.severity}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                        {punch.deadlineDate}
                      </td>
                      <td className="p-3 text-center space-x-1">
                        <button
                          onClick={() => handleTogglePunchResolved(punch.id)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                            punch.isResolved
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                              : 'bg-orange-500 text-white hover:bg-orange-600'
                          }`}
                        >
                          {punch.isResolved ? 'Selesai' : 'Perbaiki'}
                        </button>
                        <button
                          onClick={() => handleTogglePunchMK(punch.id)}
                          title="Validasi oleh MK"
                          className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                            punch.verifiedByMK
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {punch.verifiedByMK ? '✓ Lulus MK' : 'Cek MK'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: FORMAL SUBMISSION LETTER PREVIEW */}
      {activeWorkflowTab === 'letter' && (
        <div className="space-y-4">
          <div className="flex justify-end print:hidden">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all"
            >
              <Printer className="w-4 h-4 text-orange-400" /> Cetak Surat Permohonan BAST-1 Kontraktor
            </button>
          </div>

          {/* Official Printable Contractor Submission Letter Sheet */}
          <div className="bg-white text-slate-900 rounded-2xl p-8 sm:p-12 shadow-2xl font-sans text-xs space-y-6 max-w-4xl mx-auto border border-slate-200 print:p-0 print:shadow-none print:border-none">
            {/* Kop Surat Kontraktor */}
            <div className="border-b-2 border-blue-950 pb-4 flex justify-between items-start gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                  <img
                    src={project.contractorProfile?.logoUrl || project.logoUrl || '/assets/logo.png'}
                    alt="Logo Kontraktor"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <span className="text-sm font-black tracking-wider text-blue-950 uppercase block">
                    {project.contractorProfile?.companyName || project.contractor || 'PT. GONG MBE LINK PAMUNGKAS'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-700 block">
                    {project.contractorProfile?.classification || 'Kualifikasi Menengah (M1) - BG004 & BG009'}
                  </span>
                  <span className="text-[10px] text-slate-600 block mt-0.5">
                    {project.contractorProfile?.address || 'Bukit Cimanggu City, Jl. Raya Baru Ruko No. 5'}, {project.contractorProfile?.city || 'Bogor'} | Telp: {project.contractorProfile?.whatsapp || '+62 812-8807-7097'} | Email: {project.contractorProfile?.email || 'pt.gmp12@gmail.com'}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 block">
                    NPWP: {project.contractorProfile?.npwp || '61.289.845.2-404.000'} | NIB: {project.contractorProfile?.nib || '1410220080338'} | IUJK: {project.contractorProfile?.iujkNumber || '141022008033803380001'}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[9px] font-black uppercase bg-blue-950 text-white px-2.5 py-1 rounded shadow-xs">
                  SURAT RESMI KONTRAKTOR
                </span>
                <span className="text-[10px] text-slate-500 font-mono block mt-1">
                  {submission.submissionNumber}
                </span>
              </div>
            </div>

            {/* Letter Head metadata */}
            <div className="flex justify-between items-start text-[11px] leading-relaxed">
              <div className="space-y-1">
                <div><strong>Nomor :</strong> {submission.submissionNumber}</div>
                <div><strong>Lampiran :</strong> 1 (Satu) Berkas Lengkap Syarat PHO</div>
                <div><strong>Perihal :</strong> <span className="font-bold underline">Permohonan Serah Terima Pertama Pekerjaan (PHO - BAST 1)</span></div>
              </div>
              <div className="text-right">
                <span>Majalengka, {submission.submissionDate || new Date().toLocaleDateString('id-ID')}</span>
              </div>
            </div>

            {/* Letter Recipient */}
            <div className="text-[11px] leading-relaxed space-y-1">
              <div>Kepada Yth.</div>
              <div className="font-bold">1. Direksi / Pemberi Tugas ({project.director || 'HASANUDIN'})</div>
              <div className="font-bold">2. Konsultan Pengawas MK ({project.consultantMK || 'SAEPUL ANWAR'})</div>
              <div>Di Tempat.-</div>
            </div>

            {/* Letter Body */}
            <div className="space-y-3 leading-relaxed text-[11px] text-slate-800 text-justify">
              <p>Dengan hormat,</p>
              <p>
                Sehubungan dengan pelaksanaan pekerjaan konstruksi <strong className="text-slate-900">{project.name}</strong> berdasarkan
                Surat Perjanjian Pemborongan (Kontrak) Nomor: <strong className="text-slate-900">{project.contractNumber}</strong> tertanggal
                {' '}<strong className="text-slate-900">{project.contractDate}</strong> dengan nilai kontrak sebesar <strong className="text-slate-900">{formatIDR(project.contractValue)}</strong>, bersama surat ini kami sampaikan bahwa:
              </p>

              <ol className="list-decimal pl-5 space-y-1.5">
                <li>
                  Seluruh lingkup pekerjaan fisik di lapangan telah selesai dikerjakan 100% (seratus persen) sesuai spesifikasi teknis dan gambar kerja.
                </li>
                <li>
                  Pekerjaan Testing &amp; Commissioning seluruh sistem Mekanikal, Elektrikal, dan Plumbing (MEP) telah lulus uji beban dan berfungsi baik.
                </li>
                <li>
                  Gambar Terlaksana (As-Built Drawings), Manual Operasional, dan Sertifikat Garansi terlampir secara lengkap.
                </li>
              </ol>

              <p>
                Berdasarkan hal-hal di atas, kami mengajukan permohonan untuk dilaksanakannya <strong>Pemeriksaan Bersama (Joint Opname)</strong> guna
                penerbitan <strong>Berita Acara Serah Terima Pertama Pekerjaan (BAST - 1)</strong> pada tanggal <strong className="text-slate-900">{submission.targetHandoverDate}</strong>.
              </p>

              <p>
                Kami juga menyatakan komitmen penuh untuk menuntaskan perbaikan cacat mutu minor (Punch List) serta mematuhi seluruh ketentuan
                Masa Pemeliharaan selama <strong className="text-slate-900">{submission.maintenancePeriodDays || 180} hari kalender</strong> terhitung sejak penandatanganan BAST-1.
              </p>

              <p>Demikian surat permohonan ini kami sampaikan. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.</p>
            </div>

            {/* Signature Block */}
            <div className="pt-6 border-t border-slate-300 flex justify-end">
              <div className="text-center w-64 space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Hormat kami,<br />KONTRAKTOR PELAKSANA
                </span>
                <span className="text-[10px] font-bold text-slate-900 block">
                  {project.contractorProfile?.companyName || project.contractor || 'PT. GONG MBE LINK PAMUNGKAS'}
                </span>
                <div className="h-24 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 p-2">
                  <span className="text-[10px] font-mono font-bold text-blue-900">
                    [ TANDA TANGAN DIGITAL KONTRAKTOR ]
                  </span>
                </div>
                <span className="font-bold text-slate-900 block underline">
                  {submission.contractorRepresentative || project.contractorProfile?.management?.siteManager || project.siteManager || 'EKO YULIANTO'}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Site Manager {project.contractorProfile?.management?.projectManager ? `/ PM: ${project.contractorProfile.management.projectManager}` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Catat Temuan Punch List Baru */}
      {showNewPunchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Catat Temuan Punch List Baru
              </h4>
              <button
                onClick={() => setShowNewPunchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPunchItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sektor / Lokasi Pekerjaan
                </label>
                <select
                  value={newPunchSector}
                  onChange={(e) => setNewPunchSector(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                >
                  {workItems.map((wi) => (
                    <option key={wi.id} value={wi.name}>
                      {wi.no}. {wi.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Uraian Temuan / Cacat Mutu *
                </label>
                <textarea
                  rows={3}
                  required
                  value={newPunchDesc}
                  onChange={(e) => setNewPunchDesc(e.target.value)}
                  placeholder="Misal: Perapihan nat keramik, perbaikan cat dinding tergores..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tingkat Urgensi
                  </label>
                  <select
                    value={newPunchSeverity}
                    onChange={(e) => setNewPunchSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Ringan">Ringan</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Kritis">Kritis</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Target Selesai
                  </label>
                  <input
                    type="date"
                    value={newPunchDeadline}
                    onChange={(e) => setNewPunchDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewPunchModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md"
                >
                  Simpan Temuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
