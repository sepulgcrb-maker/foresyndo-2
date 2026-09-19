import React, { useState, useRef, useEffect } from 'react';
import { WorkItem, ProjectInfo, UserRole, AuditLog, BASTSubmissionData, RolePermissions, BASTWorkflowStage } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  PenTool,
  Printer,
  RotateCcw,
  QrCode,
  Award,
  ClipboardCheck,
  Clock,
  UserCheck,
  Building2,
  FileText,
  AlertTriangle,
  Sparkles,
  Check,
  Layers,
  Send,
  FilePlus2,
  FileDown,
  Search,
  Filter,
  CheckCheck,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  FileEdit,
  Trash2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BarcodeSVG } from '../common/BarcodeSVG';
import { formatIDR, calculatePhysicalProgress } from '../../utils/calculations';
import { generateBASTPDF } from '../../utils/exportEngine';
import {
  ContractorBASTWorkflow,
  INITIAL_BAST_ATTACHMENTS,
  INITIAL_PUNCH_LIST,
} from './ContractorBASTWorkflow';
import { NewBASTSubmissionModal } from './NewBASTSubmissionModal';
import { BASTDocumentList } from './BASTDocumentList';
import { ResetInspectionModal, ResetOptions } from './ResetInspectionModal';

export interface WorkItemInspectionState {
  [id: string]: {
    siteManagerApproved: boolean;
    consultantApproved?: boolean;
    directorApproved: boolean;
    notes: string;
    punchList: string;
    punchListSeverity?: 'minor' | 'moderate' | 'critical';
    consultantVerifiedAt?: string;
    consultantVerifiedBy?: string;
    directorApprovedAt?: string;
    directorApprovedBy?: string;
  };
}

export interface BASTDocumentData {
  bastNumber: string;
  handoverDate: string;
  siteManagerName: string;
  siteManagerSignedAt: string;
  siteManagerSignatureData: string; // canvas base64 or verified badge
  consultantMKName?: string;
  consultantMKSignedAt?: string;
  consultantMKSignatureData?: string;
  directorName: string;
  directorSignedAt: string;
  directorSignatureData: string; // canvas base64 or verified badge
  isCompleted: boolean;
}

const getInitialBastList = (project: ProjectInfo, primary: BASTSubmissionData): BASTSubmissionData[] => {
  // Sesuai ketentuan: Kosongkan seluruh daftar dokumen BAST & status tanda tangan digital jika pekerjaan belum dimulai
  if (project.status === 'Belum Mulai') {
    return [];
  }

  return [
  {
    ...primary,
    title: 'BAST-1 Utama Proyek (Serah Terima Pertama PHO)',
    scopeDescription: 'Seluruh 14 sektor pekerjaan konstruksi fisik Gedung Foresyndo 2 Bandara Kertajati (100% Selesai)',
    contractNominal: project.contractValue,
  },
  {
    submissionId: `SUB-PARSIAL-01-${project.contractNumber}`,
    submissionNumber: '018/SP-BAST/FGI-KTR/V/2026',
    submissionDate: '2026-05-10',
    targetHandoverDate: '2026-05-20',
    contractorRepresentative: project.siteManager || 'Ir. Agus Pratama',
    contractorPosition: 'Site Manager Lapangan',
    contractorNotes: 'Serah terima pekerjaan struktur bawah mencakup pondasi tiang pancang, bore pile, dan pile cap.',
    stage: 'finalized',
    title: 'BAST-1 Parsial Tahap 1 (Substruktur)',
    scopeDescription: 'Pekerjaan Tanah, Pondasi Tiang Pancang Bore Pile, Pile Cap, & Tie Beam',
    contractNominal: 3601550000,
    bastNumber: 'BAST-PARSIAL-01/FGI/STR/2026',
    handoverDate: '2026-05-20',
    maintenancePeriodDays: 180,
    maintenanceEndDate: '2026-11-16',
    retentionPercent: 5,
    retentionValue: 3601550000 * 0.05,
    attachments: INITIAL_BAST_ATTACHMENTS.map((a) => ({ ...a, isCompleted: true, verifiedByMK: true })),
    punchList: [],
    contractorSignature: {
      signed: true,
      name: project.siteManager || 'Ir. Agus Pratama',
      signedAt: '2026-05-18 14:30 WIB',
      signatureData: 'PRESET_VERIFIED_SM',
    },
    mkSignature: {
      signed: true,
      name: project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU',
      signedAt: '2026-05-19 10:15 WIB',
      signatureData: 'PRESET_VERIFIED_MK',
    },
    ownerSignature: {
      signed: true,
      name: project.director || 'H. Bambang S., M.T.',
      signedAt: '2026-05-20 09:00 WIB',
      signatureData: 'PRESET_VERIFIED_OWNER',
    },
    isCompleted: true,
  },
  {
    submissionId: `SUB-PARSIAL-02-${project.contractNumber}`,
    submissionNumber: '029/SP-BAST/FGI-KTR/VII/2026',
    submissionDate: '2026-07-20',
    targetHandoverDate: '2026-07-31',
    contractorRepresentative: project.siteManager || 'Ir. Agus Pratama',
    contractorPosition: 'Site Manager Lapangan',
    contractorNotes: 'Penyelesaian pekerjaan struktur utama lantai 1-4 dan dinding precast.',
    stage: 'mk_recommended',
    title: 'BAST-1 Parsial Tahap 2 (Superstruktur)',
    scopeDescription: 'Kolom Struktur, Balok, Plat Lantai 1 s/d 4, & Tangga Darurat',
    contractNominal: 4250000000,
    bastNumber: 'BAST-PARSIAL-02/FGI/STR-ARK/2026',
    handoverDate: '2026-07-31',
    maintenancePeriodDays: 180,
    maintenanceEndDate: '2027-01-27',
    retentionPercent: 5,
    retentionValue: 4250000000 * 0.05,
    attachments: INITIAL_BAST_ATTACHMENTS.map((a) => ({ ...a, isCompleted: true, verifiedByMK: true })),
    punchList: [],
    contractorSignature: {
      signed: true,
      name: project.siteManager || 'Ir. Agus Pratama',
      signedAt: '2026-07-28 11:20 WIB',
      signatureData: 'PRESET_VERIFIED_SM',
    },
    mkSignature: {
      signed: true,
      name: project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU',
      signedAt: '2026-07-30 16:45 WIB',
      signatureData: 'PRESET_VERIFIED_MK',
    },
    ownerSignature: {
      signed: false,
      name: project.director || 'H. Bambang S., M.T.',
      signedAt: '',
      signatureData: '',
    },
    isCompleted: false,
  },
  {
    submissionId: `SUB-MEP-TC-${project.contractNumber}`,
    submissionNumber: '035/SP-BAST/FGI-KTR/VIII/2026',
    submissionDate: '2026-08-15',
    targetHandoverDate: '2026-08-25',
    contractorRepresentative: project.siteManager || 'Ir. Agus Pratama',
    contractorPosition: 'Site Manager Lapangan',
    contractorNotes: 'Pengujian beban genset 250kVA, trafo TM, lift penumpang, dan sprinkler kebakaran.',
    stage: 'submitted',
    title: 'BAST Pengujian & Komisioning MEP Utilitas',
    scopeDescription: 'Testing & Commissioning Genset, Chiller HVAC, Trafo, & Fire Hydrant System',
    contractNominal: 2850000000,
    bastNumber: 'BAST-MEP-TC/FGI/2026/04',
    handoverDate: '2026-08-25',
    maintenancePeriodDays: 180,
    maintenanceEndDate: '2027-02-21',
    retentionPercent: 5,
    retentionValue: 2850000000 * 0.05,
    attachments: INITIAL_BAST_ATTACHMENTS.map((a, i) => ({ ...a, isCompleted: i < 5, verifiedByMK: i < 3 })),
    punchList: INITIAL_PUNCH_LIST,
    contractorSignature: {
      signed: true,
      name: project.siteManager || 'Ir. Agus Pratama',
      signedAt: '2026-08-20 09:40 WIB',
      signatureData: 'PRESET_VERIFIED_SM',
    },
    mkSignature: {
      signed: false,
      name: project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU',
      signedAt: '',
      signatureData: '',
    },
    ownerSignature: {
      signed: false,
      name: project.director || 'H. Bambang S., M.T.',
      signedAt: '',
      signatureData: '',
    },
    isCompleted: false,
  },
  {
    submissionId: `SUB-LANS-01-${project.contractNumber}`,
    submissionNumber: '044/SP-BAST/FGI-KTR/IX/2026',
    submissionDate: '2026-09-08',
    targetHandoverDate: '2026-09-30',
    contractorRepresentative: project.siteManager || 'Ir. Agus Pratama',
    contractorPosition: 'Site Manager Lapangan',
    contractorNotes: 'Pekerjaan perkerasan jalan lingkungan, paving block drop-off, dan lansekap.',
    stage: 'draft',
    title: 'BAST Pekerjaan Lansekap & Drainase Kawasan (Draft)',
    scopeDescription: 'Paving Block Akses Utama, Saluran U-Ditch Keliling, & Taman Depan Lobby',
    contractNominal: 950000000,
    bastNumber: 'BAST-LANS-01/FGI/2026',
    handoverDate: '2026-09-30',
    maintenancePeriodDays: 180,
    maintenanceEndDate: '2027-03-29',
    retentionPercent: 5,
    retentionValue: 950000000 * 0.05,
    attachments: INITIAL_BAST_ATTACHMENTS.map((a, i) => ({ ...a, isCompleted: i < 2, verifiedByMK: false })),
    punchList: [],
    contractorSignature: {
      signed: false,
      name: project.siteManager || 'Ir. Agus Pratama',
      signedAt: '',
      signatureData: '',
    },
    mkSignature: {
      signed: false,
      name: project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU',
      signedAt: '',
      signatureData: '',
    },
    ownerSignature: {
      signed: false,
      name: project.director || 'H. Bambang S., M.T.',
      signedAt: '',
      signatureData: '',
    },
    isCompleted: false,
  },
];
};

interface FinalInspectionProps {
  project: ProjectInfo;
  workItems: WorkItem[];
  userRole: UserRole;
  permissions?: RolePermissions;
  activeUserName?: string;
  onUpdateProjectStatus: (status: ProjectInfo['status']) => void;
  onAddAuditLog: (action: string, details: string) => void;
  onOpenContractorSettings?: () => void;
  onOpenQrModal?: () => void;
}

export const FinalInspection: React.FC<FinalInspectionProps> = ({
  project,
  workItems,
  userRole,
  permissions,
  activeUserName,
  onUpdateProjectStatus,
  onAddAuditLog,
  onOpenContractorSettings,
  onOpenQrModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'workflow' | 'daftar-bast' | 'checklist' | 'signatures' | 'bast'>('workflow');
  const [showNewBASTModal, setShowNewBASTModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSuccessToast, setResetSuccessToast] = useState<string | null>(null);

  // BAST Contractor Workflow Submission State
  const [submission, setSubmission] = useState<BASTSubmissionData>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_BAST_SUBMISSION');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse BAST submission state', e);
      }
    }
    return {
      submissionId: `SUB-PHO-${project.contractNumber}`,
      submissionNumber: `042/FGI-KONT/BAST-1/IX/2026`,
      submissionDate: new Date().toISOString().split('T')[0],
      targetHandoverDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contractorRepresentative: project.siteManager || 'Ir. Agus Pratama',
      contractorPosition: 'Site Manager Lapangan',
      contractorNotes:
        'Seluruh pekerjaan konstruksi fisik 14 sektor telah terselesaikan 100%. As-Built Drawing dan hasil uji coba T&C terlampir lengkap.',
      stage: project.status === 'Selesai' ? 'finalized' : 'draft',
      attachments: INITIAL_BAST_ATTACHMENTS,
      punchList: INITIAL_PUNCH_LIST,
      mkRecommendationLetterNo: `REK-PHO/MK/${project.contractNumber}/2026`,
      mkRecommendationDate: '',
      mkRecommendationNotes:
        'Pekerjaan fisik dinilai telah memenuhi spesifikasi teknis dan gambar terlaksana.',
      mkVerifiedBy: project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU',
      ownerApprovalDate: '',
      ownerApprovalNotes:
        'Disetujui untuk penerbitan BAST-1 dan pelaksanaan retensi 5%.',
      ownerApprovedBy: project.director || 'H. Bambang S., M.T.',
      bastNumber: `BAST-1/FGI/${project.contractNumber}/2026`,
      handoverDate: new Date().toISOString().split('T')[0],
      maintenancePeriodDays: 180,
      maintenanceEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      retentionPercent: 5,
      retentionValue: project.contractValue * 0.05,
      contractorSignature: {
        signed: false,
        name: project.siteManager || 'Ir. Agus Pratama',
        signedAt: '',
        signatureData: '',
      },
      mkSignature: {
        signed: false,
        name: project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU',
        signedAt: '',
        signatureData: '',
      },
      ownerSignature: {
        signed: false,
        name: project.director || 'H. Bambang S., M.T.',
        signedAt: '',
        signatureData: '',
      },
      isCompleted: project.status === 'Selesai',
    };
  });

  // Save submission to localStorage
  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_BAST_SUBMISSION', JSON.stringify(submission));
  }, [submission]);

  // Master BAST Documents List (with digital signature tracking)
  const [bastList, setBastList] = useState<BASTSubmissionData[]>(() => {
    // KOSONGKAN JIKA BELUM DIMULAI PEKERJAAN:
    // Sesuai instruksi: Jika proyek berstatus 'Belum Mulai', maka daftar dokumen BAST & status TTD harus kosong []
    if (project.status === 'Belum Mulai') {
      return [];
    }

    const saved = localStorage.getItem('FORESYNDO_V3_BAST_LIST');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse BAST list state', e);
      }
    }
    return getInitialBastList(project, submission);
  });

  // Sinkronisasi status proyek: Jika pekerjaan belum dimulai, pastikan daftar BAST dikosongkan
  useEffect(() => {
    if (project.status === 'Belum Mulai') {
      if (bastList.length > 0) {
        setBastList([]);
        localStorage.removeItem('FORESYNDO_V3_BAST_LIST');
      }
    }
  }, [project.status, bastList.length]);

  // Keep bastList synchronized with active submission (only if active submission exists in the list)
  useEffect(() => {
    if (bastList.length === 0) return;
    setBastList((prev) =>
      prev.map((item) =>
        item.submissionId === submission.submissionId ? { ...item, ...submission } : item
      )
    );
  }, [submission]);

  // Save bastList to localStorage
  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_BAST_LIST', JSON.stringify(bastList));
  }, [bastList]);

  // Inspection Checklist State (persistent in localStorage)
  const [inspections, setInspections] = useState<WorkItemInspectionState>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_INSPECTIONS');
    if (saved) return JSON.parse(saved);

    // Initial state derived from workItems
    const initial: WorkItemInspectionState = {};
    workItems.forEach((wi) => {
      initial[wi.id] = {
        siteManagerApproved: wi.realizedProgressPercent >= 100,
        directorApproved: wi.realizedProgressPercent >= 100 && wi.status === 'Selesai',
        notes: wi.notes || '',
        punchList: '',
      };
    });
    return initial;
  });

  // BAST Handover Signatures & Document State
  const [bastData, setBastData] = useState<BASTDocumentData>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_BAST_DATA');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        siteManagerName: project.siteManager || parsed.siteManagerName || 'Ir. Agus Pratama',
        consultantMKName: project.consultantMK || parsed.consultantMKName || 'Ir. Hendra Gunawan, ST, IPU',
        directorName: project.director || parsed.directorName || 'H. Bambang S., M.T.',
      };
    }

    return {
      bastNumber: `BAST-1/FGI/${project.contractNumber}/2026`,
      handoverDate: new Date().toISOString().split('T')[0],
      siteManagerName: project.siteManager || 'Ir. Agus Pratama',
      siteManagerSignedAt: '',
      siteManagerSignatureData: '',
      consultantMKName: project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU',
      consultantMKSignedAt: '',
      consultantMKSignatureData: '',
      directorName: project.director || 'H. Bambang S., M.T.',
      directorSignedAt: '',
      directorSignatureData: '',
      isCompleted: project.status === 'Selesai',
    };
  });

  // Keep BAST official names in sync with project settings updates
  useEffect(() => {
    if (project.siteManager || project.director || project.consultantMK) {
      setBastData((prev) => ({
        ...prev,
        siteManagerName: project.siteManager || prev.siteManagerName || 'Ir. Agus Pratama',
        consultantMKName: project.consultantMK || prev.consultantMKName || 'Ir. Hendra Gunawan, ST, IPU',
        directorName: project.director || prev.directorName || 'H. Bambang S., M.T.',
      }));
    }
  }, [project.siteManager, project.director, project.consultantMK]);

  // Canvas Refs for Drawing Signatures
  const smCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mkCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dirCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawingSM, setIsDrawingSM] = useState(false);
  const [isDrawingMK, setIsDrawingMK] = useState(false);
  const [isDrawingDir, setIsDrawingDir] = useState(false);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_INSPECTIONS', JSON.stringify(inspections));
  }, [inspections]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_BAST_DATA', JSON.stringify(bastData));
  }, [bastData]);

  // Overall Physical Progress
  const totalPhysicalProgress = calculatePhysicalProgress(workItems);

  // Inspection statistics
  const totalItems = workItems.length;
  const smApprovedCount = workItems.filter((w) => inspections[w.id]?.siteManagerApproved).length;
  const consultantApprovedCount = workItems.filter((w) => inspections[w.id]?.consultantApproved).length;
  const dirApprovedCount = workItems.filter((w) => inspections[w.id]?.directorApproved).length;
  const bothApprovedCount = workItems.filter((w) => inspections[w.id]?.consultantApproved && inspections[w.id]?.directorApproved).length;
  const punchListCount = workItems.filter((w) => inspections[w.id]?.punchList?.trim()).length;

  const allSMApproved = smApprovedCount === totalItems;
  const allConsultantApproved = consultantApprovedCount === totalItems;
  const allDirApproved = dirApprovedCount === totalItems;
  const isFullyApproved = allSMApproved && allConsultantApproved && allDirApproved;

  const smPercent = totalItems > 0 ? Math.round((smApprovedCount / totalItems) * 100) : 0;
  const consultantPercent = totalItems > 0 ? Math.round((consultantApprovedCount / totalItems) * 100) : 0;
  const dirPercent = totalItems > 0 ? Math.round((dirApprovedCount / totalItems) * 100) : 0;
  const bothPercent = totalItems > 0 ? Math.round((bothApprovedCount / totalItems) * 100) : 0;

  // Role permissions
  const isConsultantRole = userRole === 'Konsultan' || userRole === 'Admin';
  const isOwnerRole = userRole === 'Owner' || userRole === 'Direktur' || userRole === 'Admin';
  const isContractorRole = userRole === 'Kontraktor' || userRole === 'Site Manager' || userRole === 'Admin';

  const canSM =
    permissions?.canConductQCInspection ??
    (userRole === 'Kontraktor' ||
      userRole === 'Site Manager' ||
      userRole === 'Konsultan' ||
      userRole === 'Admin' ||
      userRole === 'Direktur' ||
      userRole === 'Owner');

  const canConsultant =
    permissions?.canConductQCInspection ??
    (userRole === 'Konsultan' ||
      userRole === 'Admin' ||
      userRole === 'Direktur' ||
      userRole === 'Owner');

  const canDir =
    permissions?.canApproveBAST ??
    (userRole === 'Owner' ||
      userRole === 'Direktur' ||
      userRole === 'Admin');

  // Dynamic Checklist & Document Status Auto-Sync State
  const [autoSyncDocumentStatus, setAutoSyncDocumentStatus] = useState<boolean>(true);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(() => {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  });
  const [syncFeedback, setSyncFeedback] = useState<{ message: string; stage: BASTWorkflowStage } | null>(null);

  // Search, Category, and Status Filters for Checklist
  const [checklistSearch, setChecklistSearch] = useState('');
  const [checklistCategory, setChecklistCategory] = useState<string>('all');
  const [checklistStatusFilter, setChecklistStatusFilter] = useState<'all' | 'mk_verified' | 'owner_approved' | 'both_approved' | 'pending' | 'punch_list'>('all');
  const [expandedDefectItemId, setExpandedDefectItemId] = useState<string | null>(null);

  // Auto-sync function: Syncs checklist inspection states directly with the project document status (submission & bastData)
  const syncWithDocumentStatus = (
    currentInspections: WorkItemInspectionState,
    triggerSource: 'consultant' | 'owner' | 'manual' | 'notes'
  ) => {
    const total = workItems.length;
    if (total === 0) return;

    const mkCount = workItems.filter((w) => currentInspections[w.id]?.consultantApproved).length;
    const ownerCount = workItems.filter((w) => currentInspections[w.id]?.directorApproved).length;
    const itemsWithPunch = workItems.filter((w) => currentInspections[w.id]?.punchList?.trim());

    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';
    setLastSyncTimestamp(timeStr);

    setSubmission((prevSub) => {
      let nextStage: BASTWorkflowStage = prevSub.stage;
      let stageMsg = '';

      // Determine next stage
      if (mkCount === total && ownerCount === total) {
        if (prevSub.stage !== 'finalized') {
          nextStage = 'owner_approved';
          stageMsg = 'Status Dokumen: Disetujui Owner (100% Sektor Selesai & Terverifikasi Tripartit)';
        }
      } else if (mkCount === total) {
        if (itemsWithPunch.length === 0) {
          if (prevSub.stage === 'draft' || prevSub.stage === 'submitted' || prevSub.stage === 'joint_inspection') {
            nextStage = 'mk_recommended';
            stageMsg = 'Status Dokumen: Rekomendasi MK Terbit (Opname Fisik Lapangan 100% Lulus)';
          }
        } else {
          if (prevSub.stage === 'draft' || prevSub.stage === 'submitted') {
            nextStage = 'joint_inspection';
            stageMsg = 'Status Dokumen: Opname Bersama (Terdapat Catatan Cacat Punch List)';
          }
        }
      } else if (mkCount > 0 || ownerCount > 0) {
        if (prevSub.stage === 'draft' || prevSub.stage === 'submitted') {
          nextStage = 'joint_inspection';
          stageMsg = `Status Dokumen: Opname Bersama Aktif (${mkCount}/${total} Sektor Diverifikasi Konsultan MK)`;
        }
      }

      // Sync punch lists from checklist into submission.punchList
      const mergedPunchList = [...prevSub.punchList];
      itemsWithPunch.forEach((wi) => {
        const defect = currentInspections[wi.id].punchList.trim();
        const severity = currentInspections[wi.id].punchListSeverity || 'moderate';
        const isMkVerified = !!currentInspections[wi.id].consultantApproved;

        const idx = mergedPunchList.findIndex((p) => p.sector === wi.name || p.id === `punch-${wi.id}`);
        if (idx >= 0) {
          mergedPunchList[idx] = {
            ...mergedPunchList[idx],
            description: defect,
            severity,
            verifiedByMK: isMkVerified,
          };
        } else {
          mergedPunchList.push({
            id: `punch-${wi.id}`,
            itemNumber: wi.no,
            sector: wi.name,
            description: defect,
            severity,
            location: `Sektor ${wi.category} - Lantai Kerja`,
            photoUrl: '',
            isResolved: false,
            contractorTargetDate: wi.endDate,
            verifiedByMK: isMkVerified,
          });
        }
      });

      // Sync joint inspection attachment
      const updatedAttachments = prevSub.attachments.map((att) => {
        if (att.id === 'att-5' || att.name.toLowerCase().includes('pemeriksaan bersama')) {
          return {
            ...att,
            isCompleted: mkCount > 0,
            verifiedByMK: mkCount === total,
          };
        }
        return att;
      });

      if (stageMsg) {
        setSyncFeedback({ message: stageMsg, stage: nextStage });
        setTimeout(() => setSyncFeedback(null), 4500);
      }

      return {
        ...prevSub,
        stage: nextStage,
        punchList: mergedPunchList,
        attachments: updatedAttachments,
      };
    });

    // Auto-sync official BAST data if 100% tripartit
    if (mkCount === total && ownerCount === total) {
      setBastData((prev) => ({ ...prev, isCompleted: true }));
      if (project.status !== 'Selesai' && project.status !== 'Belum Mulai') {
        onUpdateProjectStatus('Selesai');
      }
    }
  };

  // Toggle item inspection approval - Site Manager (Kontraktor)
  const handleToggleSMApprove = (id: string) => {
    if (!canSM) return;
    const current = inspections[id];
    const willBe = !current?.siteManagerApproved;
    const updated = {
      ...inspections,
      [id]: {
        ...current,
        siteManagerApproved: willBe,
      },
    };
    setInspections(updated);
    if (autoSyncDocumentStatus) {
      syncWithDocumentStatus(updated, 'manual');
    }
  };

  // Toggle item inspection approval - Konsultan MK (Joint Inspection)
  const handleToggleConsultantApprove = (id: string) => {
    if (!canConsultant) return;
    const current = inspections[id];
    const willBeApproved = !current?.consultantApproved;
    const now = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    const consultantName = activeUserName || project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU';

    const updated: WorkItemInspectionState = {
      ...inspections,
      [id]: {
        ...current,
        consultantApproved: willBeApproved,
        consultantVerifiedAt: willBeApproved ? now : undefined,
        consultantVerifiedBy: willBeApproved ? consultantName : undefined,
      },
    };
    setInspections(updated);

    if (autoSyncDocumentStatus) {
      syncWithDocumentStatus(updated, 'consultant');
    }

    onAddAuditLog(
      willBeApproved ? 'Verifikasi Item MK Disetujui' : 'Verifikasi Item MK Dibatalkan',
      `${consultantName} ${willBeApproved ? 'memverifikasi' : 'membatalkan verifikasi'} kelayakan sektor: ${workItems.find((w) => w.id === id)?.name || id}`
    );
  };

  // Toggle item inspection approval - Owner / Direktur (Persetujuan Akhir)
  const handleToggleDirApprove = (id: string) => {
    if (!canDir) return;
    const current = inspections[id];
    const willBeApproved = !current?.directorApproved;
    const now = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    const ownerName = activeUserName || project.director || 'H. Bambang S., M.T.';

    const updated: WorkItemInspectionState = {
      ...inspections,
      [id]: {
        ...current,
        directorApproved: willBeApproved,
        directorApprovedAt: willBeApproved ? now : undefined,
        directorApprovedBy: willBeApproved ? ownerName : undefined,
      },
    };
    setInspections(updated);

    if (autoSyncDocumentStatus) {
      syncWithDocumentStatus(updated, 'owner');
    }

    onAddAuditLog(
      willBeApproved ? 'Persetujuan Item Owner Diberikan' : 'Persetujuan Item Owner Ditarik',
      `${ownerName} ${willBeApproved ? 'menyetujui' : 'menarik persetujuan'} sektor: ${workItems.find((w) => w.id === id)?.name || id}`
    );
  };

  const handleUpdateNotes = (
    id: string,
    notes: string,
    punchList: string,
    punchListSeverity?: 'minor' | 'moderate' | 'critical'
  ) => {
    const updated: WorkItemInspectionState = {
      ...inspections,
      [id]: {
        ...inspections[id],
        notes,
        punchList,
        punchListSeverity: punchListSeverity ?? inspections[id]?.punchListSeverity ?? 'moderate',
      },
    };
    setInspections(updated);
    if (autoSyncDocumentStatus && punchList !== inspections[id]?.punchList) {
      syncWithDocumentStatus(updated, 'notes');
    }
  };

  // Bulk Approve - Konsultan MK
  const handleApproveAllConsultant = () => {
    if (!canConsultant) return;
    const now = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    const consultantName = activeUserName || project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU';

    const updated: WorkItemInspectionState = { ...inspections };
    workItems.forEach((wi) => {
      updated[wi.id] = {
        ...(updated[wi.id] || { notes: '', punchList: '', siteManagerApproved: true, directorApproved: false }),
        consultantApproved: true,
        consultantVerifiedAt: now,
        consultantVerifiedBy: consultantName,
      };
    });
    setInspections(updated);
    syncWithDocumentStatus(updated, 'consultant');
    onAddAuditLog(
      'Bulk Verifikasi Konsultan MK 100%',
      `Konsultan MK (${consultantName}) memverifikasi kelayakan fisik seluruh 14 sektor pekerjaan konstruksi.`
    );
  };

  // Bulk Approve - Owner / Direktur
  const handleApproveAllOwner = () => {
    if (!canDir) return;
    const now = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    const ownerName = activeUserName || project.director || 'H. Bambang S., M.T.';

    const updated: WorkItemInspectionState = { ...inspections };
    workItems.forEach((wi) => {
      updated[wi.id] = {
        ...(updated[wi.id] || { notes: '', punchList: '', siteManagerApproved: true, consultantApproved: true }),
        directorApproved: true,
        directorApprovedAt: now,
        directorApprovedBy: ownerName,
      };
    });
    setInspections(updated);
    syncWithDocumentStatus(updated, 'owner');
    onAddAuditLog(
      'Bulk Persetujuan Owner 100%',
      `Owner/Direktur (${ownerName}) memberikan pengesahan kelayakan seluruh 14 sektor pekerjaan konstruksi.`
    );
  };

  // Bulk Approve - Tripartit Lulus 100%
  const handleApproveAll = () => {
    const now = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    const consultantName = activeUserName || project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU';
    const ownerName = activeUserName || project.director || 'H. Bambang S., M.T.';

    const updated: WorkItemInspectionState = {};
    workItems.forEach((wi) => {
      updated[wi.id] = {
        siteManagerApproved: true,
        consultantApproved: true,
        directorApproved: true,
        consultantVerifiedAt: now,
        consultantVerifiedBy: consultantName,
        directorApprovedAt: now,
        directorApprovedBy: ownerName,
        notes: wi.notes || 'Lulus inspeksi akhir kelayakan struktur & finishing',
        punchList: '',
      };
    });
    setInspections(updated);
    syncWithDocumentStatus(updated, 'owner');
    onAddAuditLog(
      'Bulk Inspeksi Akhir Tripartit Approved',
      'Persetujuan massal kelayakan fisik 100% untuk seluruh sektor pekerjaan oleh Konsultan MK dan Direktur/Owner'
    );
  };

  // Manual Trigger Sync
  const handleManualSync = () => {
    syncWithDocumentStatus(inspections, 'manual');
    setResetSuccessToast(`Status dokumen berhasil disinkronkan dengan ${totalItems} item inspeksi`);
    setTimeout(() => setResetSuccessToast(null), 3000);
  };

  // Canvas Drawing Handlers - Site Manager
  const startDrawingSM = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = smCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawingSM(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a';
  };

  const drawSM = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSM) return;
    const canvas = smCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingSM = () => {
    if (!isDrawingSM) return;
    setIsDrawingSM(false);
    const canvas = smCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setBastData((prev) => ({
        ...prev,
        siteManagerSignatureData: dataUrl,
        siteManagerSignedAt: new Date().toLocaleString('id-ID'),
      }));
    }
  };

  const clearCanvasSM = () => {
    const canvas = smCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setBastData((prev) => ({
      ...prev,
      siteManagerSignatureData: '',
      siteManagerSignedAt: '',
    }));
  };

  // Canvas Drawing Handlers - Konsultan Pengawas MK
  const startDrawingMK = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = mkCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawingMK(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a';
  };

  const drawMK = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingMK) return;
    const canvas = mkCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingMK = () => {
    if (!isDrawingMK) return;
    setIsDrawingMK(false);
    const canvas = mkCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setBastData((prev) => ({
        ...prev,
        consultantMKSignatureData: dataUrl,
        consultantMKSignedAt: new Date().toLocaleString('id-ID'),
      }));
    }
  };

  const clearCanvasMK = () => {
    const canvas = mkCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setBastData((prev) => ({
      ...prev,
      consultantMKSignatureData: '',
      consultantMKSignedAt: '',
    }));
  };

  // Canvas Drawing Handlers - Direktur
  const startDrawingDir = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = dirCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawingDir(true);
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a';
  };

  const drawDir = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingDir) return;
    const canvas = dirCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawingDir = () => {
    if (!isDrawingDir) return;
    setIsDrawingDir(false);
    const canvas = dirCanvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL();
      setBastData((prev) => ({
        ...prev,
        directorSignatureData: dataUrl,
        directorSignedAt: new Date().toLocaleString('id-ID'),
      }));
    }
  };

  const clearCanvasDir = () => {
    const canvas = dirCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setBastData((prev) => ({
      ...prev,
      directorSignatureData: '',
      directorSignedAt: '',
    }));
  };

  // Quick preset signature verification (for convenience)
  const handleUsePresetSMSignature = () => {
    const now = new Date().toLocaleString('id-ID');
    setBastData((prev) => ({
      ...prev,
      siteManagerSignatureData: 'PRESET_VERIFIED_SM',
      siteManagerSignedAt: now,
    }));
  };

  const handleUsePresetMKSignature = () => {
    const now = new Date().toLocaleString('id-ID');
    setBastData((prev) => ({
      ...prev,
      consultantMKSignatureData: 'PRESET_VERIFIED_MK',
      consultantMKSignedAt: now,
    }));
  };

  const handleUsePresetDirSignature = () => {
    const now = new Date().toLocaleString('id-ID');
    setBastData((prev) => ({
      ...prev,
      directorSignatureData: 'PRESET_VERIFIED_DIR',
      directorSignedAt: now,
    }));
  };

  // Helper to create clean initial inspection checklist (0% approval)
  const getCleanInspections = (): WorkItemInspectionState => {
    const clean: WorkItemInspectionState = {};
    workItems.forEach((wi) => {
      clean[wi.id] = {
        siteManagerApproved: false,
        consultantApproved: false,
        directorApproved: false,
        notes: '',
        punchList: '',
      };
    });
    return clean;
  };

  // Helper to create clean initial BAST submission
  const getCleanSubmission = (): BASTSubmissionData => ({
    submissionId: `SUB-PHO-${project.contractNumber}`,
    submissionNumber: `042/FGI-KONT/BAST-1/IX/2026`,
    submissionDate: new Date().toISOString().split('T')[0],
    targetHandoverDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    contractorRepresentative: project.siteManager || 'Ir. Agus Pratama',
    contractorPosition: 'Site Manager Lapangan',
    contractorNotes:
      'Seluruh pekerjaan konstruksi fisik 14 sektor telah terselesaikan 100%. As-Built Drawing dan hasil uji coba T&C terlampir lengkap.',
    stage: 'draft',
    attachments: INITIAL_BAST_ATTACHMENTS.map((a) => ({ ...a, isCompleted: false, verifiedByMK: false })),
    punchList: INITIAL_PUNCH_LIST.map((p) => ({ ...p, isResolved: false, verifiedByMK: false })),
    mkRecommendationLetterNo: `REK-PHO/MK/${project.contractNumber}/2026`,
    mkRecommendationDate: '',
    mkRecommendationNotes: '',
    mkVerifiedBy: project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU',
    ownerApprovalDate: '',
    ownerApprovalNotes: '',
    ownerApprovedBy: project.director || 'H. Bambang S., M.T.',
    bastNumber: `BAST-1/FGI/${project.contractNumber}/2026`,
    handoverDate: new Date().toISOString().split('T')[0],
    maintenancePeriodDays: 180,
    maintenanceEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    retentionPercent: 5,
    retentionValue: project.contractValue * 0.05,
    contractorSignature: {
      signed: false,
      name: project.siteManager || 'Ir. Agus Pratama',
      signedAt: '',
      signatureData: '',
    },
    mkSignature: {
      signed: false,
      name: project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU',
      signedAt: '',
      signatureData: '',
    },
    ownerSignature: {
      signed: false,
      name: project.director || 'H. Bambang S., M.T.',
      signedAt: '',
      signatureData: '',
    },
    isCompleted: false,
  });

  // Comprehensive Reset Handler
  const handleConfirmReset = (options: ResetOptions) => {
    const actionsDone: string[] = [];

    if (options.resetChecklist) {
      const clean = getCleanInspections();
      setInspections(clean);
      localStorage.removeItem('FORESYNDO_V3_INSPECTIONS');
      actionsDone.push('Checklist 14 Sektor (0%)');
    }

    if (options.resetWorkflow) {
      const cleanSub = getCleanSubmission();
      setSubmission(cleanSub);
      localStorage.removeItem('FORESYNDO_V3_BAST_SUBMISSION');

      const cleanList = getInitialBastList(project, cleanSub);
      setBastList(cleanList);
      localStorage.removeItem('FORESYNDO_V3_BAST_LIST');
      actionsDone.push('Alur BAST Kontraktor ke Draft');
    }

    if (options.resetSignatures) {
      clearCanvasSM();
      clearCanvasMK();
      clearCanvasDir();

      const cleanBast: BASTDocumentData = {
        bastNumber: `BAST-1/FGI/${project.contractNumber}/2026`,
        handoverDate: new Date().toISOString().split('T')[0],
        siteManagerName: project.siteManager || 'Ir. Agus Pratama',
        siteManagerSignedAt: '',
        siteManagerSignatureData: '',
        consultantMKName: project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU',
        consultantMKSignedAt: '',
        consultantMKSignatureData: '',
        directorName: project.director || 'H. Bambang S., M.T.',
        directorSignedAt: '',
        directorSignatureData: '',
        isCompleted: false,
      };
      setBastData(cleanBast);
      localStorage.removeItem('FORESYNDO_V3_BAST_DATA');
      actionsDone.push('Tanda Tangan & Kanvas Tripartit');
    }

    if (options.revertProjectStatus && project.status === 'Selesai') {
      onUpdateProjectStatus('Dalam Pengerjaan');
      actionsDone.push('Status Proyek ke "Dalam Pengerjaan"');
    }

    onAddAuditLog(
      'Reset Modul Inspeksi & BAST Akhir',
      `Data modul inspeksi dan BAST direset oleh ${userRole}. Komponen yang direset: ${actionsDone.join(', ')}.`
    );

    setShowResetModal(false);
    setResetSuccessToast(`Berhasil mereset: ${actionsDone.join(', ')}`);
    setTimeout(() => {
      setResetSuccessToast(null);
    }, 4500);
  };

  // Quick Reset Checklist
  const handleResetChecklist = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset seluruh checklist inspeksi 14 sektor ke status 0% (belum lulus)?')) {
      const clean = getCleanInspections();
      setInspections(clean);
      localStorage.removeItem('FORESYNDO_V3_INSPECTIONS');
      onAddAuditLog('Reset Checklist Inspeksi Sektor', 'Semua persetujuan inspeksi 14 sektor diatur ulang ke 0%.');
      setResetSuccessToast('Seluruh checklist inspeksi 14 sektor berhasil direset ke 0%');
      setTimeout(() => setResetSuccessToast(null), 3500);
    }
  };

  // Quick Reset Signatures
  const handleResetSignatures = () => {
    if (window.confirm('Apakah Anda yakin ingin mengosongkan seluruh tanda tangan digital dan coretan kanvas 3 pihak?')) {
      clearCanvasSM();
      clearCanvasMK();
      clearCanvasDir();
      setBastData((prev) => ({
        ...prev,
        siteManagerSignatureData: '',
        siteManagerSignedAt: '',
        consultantMKSignatureData: '',
        consultantMKSignedAt: '',
        directorSignatureData: '',
        directorSignedAt: '',
        isCompleted: false,
      }));
      localStorage.removeItem('FORESYNDO_V3_BAST_DATA');
      onAddAuditLog('Reset Tanda Tangan Tripartit', 'Semua tanda tangan digital dan goresan kanvas BAST-1 berhasil dikosongkan.');
      setResetSuccessToast('Seluruh tanda tangan digital Tripartit berhasil dikosongkan');
      setTimeout(() => setResetSuccessToast(null), 3500);
    }
  };

  // Quick Reset Workflow
  const handleResetWorkflow = () => {
    if (window.confirm('Kembalikan tahapan pengajuan BAST aktif ke status Draft awal?')) {
      const clean = getCleanSubmission();
      setSubmission(clean);
      localStorage.removeItem('FORESYNDO_V3_BAST_SUBMISSION');
      onAddAuditLog('Reset Alur BAST ke Draft', 'Tahapan pengajuan BAST dikembalikan ke Draft awal.');
      setResetSuccessToast('Pengajuan BAST berhasil dikembalikan ke status Draft awal');
      setTimeout(() => setResetSuccessToast(null), 3500);
    }
  };

  // Final Handover Execution
  const handleFinalizeBAST = () => {
    if (!bastData.siteManagerSignatureData || !bastData.directorSignatureData) {
      alert('Tanda tangan digital Site Manager dan Direktur wajib diisi sebelum pengesahan BAST-1.');
      return;
    }

    if (!isFullyApproved) {
      alert('Semua sektor pekerjaan harus lulus inspeksi Site Manager & Direktur.');
      return;
    }

    setBastData((prev) => ({
      ...prev,
      isCompleted: true,
    }));

    setSubmission((prev) => ({
      ...prev,
      stage: 'finalized',
      isCompleted: true,
      ownerSignature: {
        signed: true,
        name: bastData.directorName,
        signedAt: new Date().toLocaleString('id-ID'),
        signatureData: bastData.directorSignatureData,
      },
      contractorSignature: {
        signed: true,
        name: bastData.siteManagerName,
        signedAt: new Date().toLocaleString('id-ID'),
        signatureData: bastData.siteManagerSignatureData,
      },
      mkSignature: {
        signed: true,
        name: bastData.consultantMKName || project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU',
        signedAt: new Date().toLocaleString('id-ID'),
        signatureData: bastData.consultantMKSignatureData || 'PRESET_VERIFIED_MK',
      },
    }));

    onUpdateProjectStatus('Selesai');
    onAddAuditLog(
      'Pengesahan BAST-1 Final Handover',
      `Berita Acara Serah Terima No. ${bastData.bastNumber} disahkan resmi oleh Tripartit (Kontraktor: ${bastData.siteManagerName}, Konsultan MK: ${bastData.consultantMKName || 'Ir. Hendra Gunawan'}, Owner: ${bastData.directorName}). Status Proyek: SELESAI.`
    );

    setActiveSubTab('bast');
  };

  const handleNewBASTSubmitted = (newSubmission: BASTSubmissionData, selectedWorkItemIds: string[]) => {
    setSubmission(newSubmission);
    setBastList((prev) => [
      newSubmission,
      ...prev.filter((b) => b.submissionId !== newSubmission.submissionId),
    ]);
    setBastData((prev) => ({
      ...prev,
      bastNumber: newSubmission.bastNumber,
      handoverDate: newSubmission.handoverDate,
      siteManagerName: newSubmission.contractorSignature.name || prev.siteManagerName,
      siteManagerSignatureData: newSubmission.contractorSignature.signatureData || prev.siteManagerSignatureData,
      siteManagerSignedAt: newSubmission.contractorSignature.signedAt || prev.siteManagerSignedAt,
      consultantMKName: newSubmission.mkSignature.name || prev.consultantMKName,
      consultantMKSignatureData: newSubmission.mkSignature.signatureData || prev.consultantMKSignatureData,
      consultantMKSignedAt: newSubmission.mkSignature.signedAt || prev.consultantMKSignedAt,
    }));
    setActiveSubTab('daftar-bast');
  };

  // Categories present in workItems
  const availableCategories = Array.from(new Set(workItems.map((wi) => wi.category)));

  // Filtered work items for dynamic checklist
  const filteredWorkItems = workItems.filter((wi) => {
    // Search filter
    const matchesSearch =
      checklistSearch.trim() === '' ||
      wi.name.toLowerCase().includes(checklistSearch.toLowerCase()) ||
      wi.category.toLowerCase().includes(checklistSearch.toLowerCase()) ||
      (inspections[wi.id]?.notes || '').toLowerCase().includes(checklistSearch.toLowerCase()) ||
      (inspections[wi.id]?.punchList || '').toLowerCase().includes(checklistSearch.toLowerCase()) ||
      (inspections[wi.id]?.consultantVerifiedBy || '').toLowerCase().includes(checklistSearch.toLowerCase()) ||
      (inspections[wi.id]?.directorApprovedBy || '').toLowerCase().includes(checklistSearch.toLowerCase());

    // Category filter
    const matchesCategory = checklistCategory === 'all' || wi.category === checklistCategory;

    // Status filter
    const insp = inspections[wi.id];
    let matchesStatus = true;
    if (checklistStatusFilter === 'mk_verified') {
      matchesStatus = !!insp?.consultantApproved;
    } else if (checklistStatusFilter === 'owner_approved') {
      matchesStatus = !!insp?.directorApproved;
    } else if (checklistStatusFilter === 'both_approved') {
      matchesStatus = !!(insp?.consultantApproved && insp?.directorApproved);
    } else if (checklistStatusFilter === 'pending') {
      matchesStatus = !(insp?.consultantApproved && insp?.directorApproved);
    } else if (checklistStatusFilter === 'punch_list') {
      matchesStatus = !!insp?.punchList?.trim();
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Progress Fisik Lapangan
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
              {totalPhysicalProgress.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {workItems.filter((w) => w.realizedProgressPercent >= 100).length} / {totalItems} Sektor Selesai 100%
            </span>
          </div>
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Verifikasi Konsultan MK
            </span>
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
              {consultantApprovedCount} / {totalItems} Sektor
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {consultantPercent}% terverifikasi opname fisik
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Persetujuan Owner / Direktur
            </span>
            <span className="text-2xl font-black text-emerald-500 mt-1 block">
              {dirApprovedCount} / {totalItems} Sektor
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {dirPercent}% disetujui sah untuk BAST
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">
              Status BAST-1 Handover
            </span>
            <span className="text-sm font-black mt-1 block tracking-tight">
              {submission.stage === 'finalized'
                ? '✓ BAST-1 SAH RESMI'
                : submission.stage === 'owner_approved'
                ? 'Disetujui Owner'
                : submission.stage === 'mk_recommended'
                ? 'Rekomendasi MK'
                : submission.stage === 'joint_inspection'
                ? 'Opname Bersama MK'
                : submission.stage === 'submitted'
                ? 'Diajukan ke MK'
                : 'Draft Persiapan'}
            </span>
            <span className="text-[10px] text-blue-200 block mt-0.5 font-mono truncate max-w-[160px]">
              {submission.bastNumber || submission.submissionNumber}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-white/10 text-white shrink-0">
            <FileCheck2 className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* Main Container & Subtab Navigation */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Modul Inspeksi Akhir &amp; Pengesahan BAST-1 Proyek
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Alur pengajuan BAST-1 Kontraktor, verifikasi teknis konsultan MK, opname sektor &amp; otorisasi Tripartit resmi (Kontraktor - MK - Owner)
            </p>
          </div>

          {/* Subtab Toggle Buttons, Reset & New BAST Modal Trigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
              title="Reset data checklist inspeksi, pengajuan BAST, dan tanda tangan digital"
            >
              <RotateCcw className="w-4 h-4 text-rose-500" /> Reset Inspeksi &amp; BAST
            </button>

            {onOpenQrModal && (
              <button
                onClick={onOpenQrModal}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all shrink-0 cursor-pointer"
                title="Buka QR Code Verifikasi Proyek & Akses Lapangan"
              >
                <QrCode className="w-4 h-4 text-indigo-500" /> QR Verifikasi
              </button>
            )}

            <button
              onClick={() => setShowNewBASTModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all shrink-0 cursor-pointer"
            >
              <FilePlus2 className="w-4 h-4" /> Buat Pengajuan BAST Baru
            </button>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
              <button
                onClick={() => setActiveSubTab('workflow')}
                className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
                  activeSubTab === 'workflow'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Send className="w-4 h-4" /> Alur Pengajuan BAST
              </button>
              <button
                onClick={() => setActiveSubTab('daftar-bast')}
                className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
                  activeSubTab === 'daftar-bast'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" /> Daftar Dokumen BAST ({bastList.length})
              </button>
              <button
                onClick={() => setActiveSubTab('checklist')}
                className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
                  activeSubTab === 'checklist'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" /> Checklist Sektor Dinamis
                {autoSyncDocumentStatus && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Sinkronisasi Dokumen Aktif" />
                )}
              </button>
              <button
                onClick={() => setActiveSubTab('signatures')}
                className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
                  activeSubTab === 'signatures'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <PenTool className="w-4 h-4" /> Tanda Tangan Tripartit
              </button>
              <button
                onClick={() => setActiveSubTab('bast')}
                className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-all ${
                  activeSubTab === 'bast'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <FileCheck2 className="w-4 h-4" /> Dokumen Resmi BAST-1
              </button>
            </div>
          </div>
        </div>

        {/* Reset Success Toast Alert */}
        {resetSuccessToast && (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{resetSuccessToast}</span>
            </div>
            <button
              onClick={() => setResetSuccessToast(null)}
              className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 text-xs font-bold px-2 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* TAB 0: ALUR PENGAJUAN BAST KONTRAKTOR */}
        {activeSubTab === 'workflow' && (
          <ContractorBASTWorkflow
            project={project}
            workItems={workItems}
            userRole={userRole}
            submission={submission}
            bastList={bastList}
            onSelectSubmission={(selected) => setSubmission(selected)}
            onUpdateSubmission={(updated) => {
              setSubmission(updated);
              if (updated.stage === 'finalized' && !bastData.isCompleted) {
                setBastData((prev) => ({ ...prev, isCompleted: true }));
                onUpdateProjectStatus('Selesai');
              }
            }}
            onGoToOfficialBAST={() => setActiveSubTab('bast')}
            onGoToChecklist={() => setActiveSubTab('checklist')}
            onAddAuditLog={onAddAuditLog}
            onOpenNewBASTModal={() => setShowNewBASTModal(true)}
            onOpenContractorSettings={onOpenContractorSettings}
            onResetWorkflow={handleResetWorkflow}
          />
        )}

        {/* TAB DAFTAR DOKUMEN BAST DENGAN PRATINJAU STATUS TANDA TANGAN DIGITAL */}
        {activeSubTab === 'daftar-bast' && (
          <BASTDocumentList
            project={project}
            userRole={userRole}
            bastList={bastList}
            currentSubmissionId={submission.submissionId}
            workItems={workItems}
            onSelectSubmission={(selected) => {
              setSubmission(selected);
              setActiveSubTab('workflow');
            }}
            onGoToOfficialBAST={(selected) => {
              if (selected) {
                setSubmission(selected);
                setBastData((prev) => ({
                  ...prev,
                  bastNumber: selected.bastNumber,
                  handoverDate: selected.handoverDate || selected.submissionDate,
                  siteManagerName: selected.contractorSignature.name || prev.siteManagerName,
                  siteManagerSignatureData: selected.contractorSignature.signatureData || prev.siteManagerSignatureData,
                  siteManagerSignedAt: selected.contractorSignature.signedAt || prev.siteManagerSignedAt,
                  consultantMKName: selected.mkSignature.name || prev.consultantMKName,
                  consultantMKSignatureData: selected.mkSignature.signatureData || prev.consultantMKSignatureData,
                  consultantMKSignedAt: selected.mkSignature.signedAt || prev.consultantMKSignedAt,
                  directorName: selected.ownerSignature.name || prev.directorName,
                  directorSignatureData: selected.ownerSignature.signatureData || prev.directorSignatureData,
                  directorSignedAt: selected.ownerSignature.signedAt || prev.directorSignedAt,
                  isCompleted: selected.stage === 'finalized',
                }));
              }
              setActiveSubTab('bast');
            }}
            onOpenNewBASTModal={() => setShowNewBASTModal(true)}
          />
        )}

        {/* TAB 1: CHECKLIST DINAMIS INSPEKSI SEKTOR */}
        {activeSubTab === 'checklist' && (
          <div className="space-y-6">
            {/* Dynamic Document Sync & Workflow Stage Header */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md border border-slate-700/60 space-y-3.5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider">
                      Dynamic Inspection Checklist
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                      Sinkronisasi Dokumen Terintegrasi
                    </span>
                  </div>
                  <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-orange-400" />
                    Verifikasi Sektor Konstruksi oleh Owner & Konsultan MK
                  </h3>
                  <p className="text-xs text-slate-300">
                    Setiap verifikasi item pekerjaan oleh Konsultan MK atau Owner secara otomatis memperbarui status opname lapangan, lampiran pemeriksaan fisik bersama, dan tahapan dokumen BAST ({submission.bastNumber || submission.submissionNumber}).
                  </p>
                </div>

                {/* Auto Sync Toggle & Manual Trigger */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                  <button
                    onClick={() => setAutoSyncDocumentStatus(!autoSyncDocumentStatus)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      autoSyncDocumentStatus
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-700 text-slate-400 border border-slate-600'
                    }`}
                    title="Aktifkan/nonaktifkan sinkronisasi otomatis status dokumen dengan checklist"
                  >
                    <span className={`w-2 h-2 rounded-full ${autoSyncDocumentStatus ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                    {autoSyncDocumentStatus ? 'Auto-Sync: Aktif' : 'Auto-Sync: Manual'}
                  </button>

                  <button
                    onClick={handleManualSync}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    title="Sinkronkan checklist dengan status dokumen BAST saat ini"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-200" />
                    Sinkronkan Dokumen
                  </button>

                  {lastSyncTimestamp && (
                    <span className="text-[10px] text-slate-400 hidden xl:inline font-mono">
                      {lastSyncTimestamp}
                    </span>
                  )}
                </div>
              </div>

              {/* Dynamic Pipeline Progress Indicator */}
              <div className="pt-2 border-t border-slate-700/80">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    Status Dokumen Terkait:
                    <span className="font-bold text-white uppercase ml-1">
                      {submission.stage === 'finalized'
                        ? 'BAST-1 Sah & Tuntas'
                        : submission.stage === 'owner_approved'
                        ? 'Disetujui Owner (Siap Tanda Tangan BAST)'
                        : submission.stage === 'mk_recommended'
                        ? 'Rekomendasi MK Terbit'
                        : submission.stage === 'joint_inspection'
                        ? 'Opname Bersama Lapangan (In Progress)'
                        : submission.stage === 'submitted'
                        ? 'Diajukan ke Konsultan MK'
                        : 'Draft Pengajuan PHO'}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Tripartit: {bothApprovedCount}/{totalItems} Sektor Lengkap ({bothPercent}%)
                  </span>
                </div>

                {/* Progress bar representing 6 BAST Stages */}
                <div className="grid grid-cols-6 gap-1 text-center text-[10px]">
                  {[
                    { key: 'draft', label: '1. Draft' },
                    { key: 'submitted', label: '2. Diajukan' },
                    { key: 'joint_inspection', label: '3. Opname MK' },
                    { key: 'mk_recommended', label: '4. Rekomendasi' },
                    { key: 'owner_approved', label: '5. Setuju Owner' },
                    { key: 'finalized', label: '6. BAST Sah' },
                  ].map((st, idx) => {
                    const stageOrder: Record<BASTWorkflowStage, number> = {
                      draft: 1,
                      submitted: 2,
                      joint_inspection: 3,
                      mk_recommended: 4,
                      owner_approved: 5,
                      finalized: 6,
                    };
                    const currentOrder = stageOrder[submission.stage] || 1;
                    const isPassed = currentOrder >= idx + 1;
                    const isCurrent = currentOrder === idx + 1;

                    return (
                      <div
                        key={st.key}
                        className={`py-1 rounded px-1 font-medium transition-all ${
                          isCurrent
                            ? 'bg-orange-500 text-white font-bold ring-2 ring-orange-300/50'
                            : isPassed
                            ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {st.label}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sync Feedback Toast inside card */}
              {syncFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{syncFeedback.message}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/30 text-white">
                    Auto-Synced
                  </span>
                </div>
              )}
            </div>

            {/* 3 Verification Cards: Konsultan MK, Owner, and Tripartite Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Konsultan MK Opname Card */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                      Peran: Konsultan MK
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      Verifikasi Opname & Mutu
                    </h4>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-blue-500 text-white font-black text-xs">
                    {consultantPercent}%
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Terverifikasi Lapangan:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{consultantApprovedCount} / {totalItems} Sektor</span>
                  </div>
                  <div className="w-full h-2 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${consultantPercent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU'}
                  </span>
                  {canConsultant && (
                    <button
                      onClick={handleApproveAllConsultant}
                      disabled={allConsultantApproved}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-[11px] shrink-0 transition-all cursor-pointer"
                      title="Verifikasi seluruh 14 sektor pekerjaan fisik sebagai Konsultan MK"
                    >
                      {allConsultantApproved ? '✓ Terverifikasi 100%' : '✓ Verifikasi Semua'}
                    </button>
                  )}
                </div>
              </div>

              {/* Owner / Direktur Persetujuan Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                      Peran: Owner / Direktur
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      Persetujuan Hasil Konstruksi
                    </h4>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-emerald-500 text-white font-black text-xs">
                    {dirPercent}%
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Disetujui Sah:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{dirApprovedCount} / {totalItems} Sektor</span>
                  </div>
                  <div className="w-full h-2 bg-emerald-200 dark:bg-emerald-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${dirPercent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {project.director || 'H. Bambang S., M.T.'}
                  </span>
                  {canDir && (
                    <button
                      onClick={handleApproveAllOwner}
                      disabled={allDirApproved}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[11px] shrink-0 transition-all cursor-pointer"
                      title="Setujui seluruh sektor pekerjaan fisik sebagai Owner / Direktur"
                    >
                      {allDirApproved ? '✓ Disetujui 100%' : '✓ Setujui Semua'}
                    </button>
                  )}
                </div>
              </div>

              {/* Status Tripartit & Punch List Card */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                      Status Kelayakan Bersama
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      Kelulusan Tripartit & Punch List
                    </h4>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-amber-500 text-white font-black text-xs">
                    {bothApprovedCount}/{totalItems}
                  </span>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Sektor Bebas Defect:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{totalItems - punchListCount} Sektor</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>Catatan Punch List:</span>
                    <span className={`font-bold ${punchListCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                      {punchListCount} Sektor Defect
                    </span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-end gap-2">
                  <button
                    onClick={handleApproveAll}
                    disabled={isFullyApproved}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-[11px] shrink-0 transition-all cursor-pointer shadow-sm"
                    title="Luluskan kelayakan 100% secara tripartit (Konsultan MK + Owner)"
                  >
                    {isFullyApproved ? '★ Lulus Tripartit 100%' : '★ Luluskan Semua (Tripartit)'}
                  </button>
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                {/* Search Bar */}
                <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={checklistSearch}
                    onChange={(e) => setChecklistSearch(e.target.value)}
                    placeholder="Cari sektor / catatan / punch list..."
                    className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  {checklistSearch && (
                    <button
                      onClick={() => setChecklistSearch('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Category Dropdown */}
                <select
                  value={checklistCategory}
                  onChange={(e) => setChecklistCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  <option value="all">Semua Kategori ({workItems.length})</option>
                  {availableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} ({workItems.filter((w) => w.category === cat).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: `Semua (${workItems.length})` },
                  { id: 'mk_verified', label: `Lulus MK (${consultantApprovedCount})` },
                  { id: 'owner_approved', label: `Setuju Owner (${dirApprovedCount})` },
                  { id: 'both_approved', label: `★ Tripartit (${bothApprovedCount})` },
                  { id: 'pending', label: `Pending (${totalItems - bothApprovedCount})` },
                  { id: 'punch_list', label: `Defect (${punchListCount})` },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    onClick={() => setChecklistStatusFilter(chip.id as typeof checklistStatusFilter)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      checklistStatusFilter === chip.id
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}

                <button
                  onClick={handleResetChecklist}
                  className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 font-bold text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1 ml-1"
                  title="Reset seluruh checklist inspeksi 14 sektor ke status belum lulus (0%)"
                >
                  <RotateCcw className="w-3 h-3 text-rose-500" /> Reset
                </button>
              </div>
            </div>

            {/* Checklist Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-3 min-w-[220px]">Sektor Pekerjaan Konstruksi</th>
                    <th className="py-3 px-3 text-center w-24">Kategori</th>
                    <th className="py-3 px-3 text-center w-28">Progress Fisik</th>
                    <th className="py-3 px-3 text-center w-36">
                      <div className="flex flex-col items-center">
                        <span>Verifikasi MK</span>
                        <span className="text-[9px] text-blue-300 lowercase font-normal">(konsultan mk)</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center w-36">
                      <div className="flex flex-col items-center">
                        <span>Persetujuan Owner</span>
                        <span className="text-[9px] text-emerald-300 lowercase font-normal">(direktur / owner)</span>
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center w-32">Status Tripartit</th>
                    <th className="py-3 px-3 min-w-[240px]">Catatan &amp; Punch List Defect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {filteredWorkItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        <Filter className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                        Tidak ada sektor pekerjaan yang sesuai dengan filter atau pencarian Anda.
                      </td>
                    </tr>
                  ) : (
                    filteredWorkItems.map((wi) => {
                      const insp = inspections[wi.id] || {
                        siteManagerApproved: false,
                        consultantApproved: false,
                        directorApproved: false,
                        notes: '',
                        punchList: '',
                        punchListSeverity: 'moderate',
                      };

                      const hasPunchList = !!insp.punchList?.trim();
                      const isBoth = insp.consultantApproved && insp.directorApproved;
                      const isExpanded = expandedDefectItemId === wi.id;

                      return (
                        <React.Fragment key={wi.id}>
                          <tr className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${isExpanded ? 'bg-orange-50/40 dark:bg-orange-950/20' : ''}`}>
                            <td className="py-3 px-3 text-center font-bold text-slate-500">{wi.no}</td>
                            
                            {/* Work Item Name & Specs */}
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {wi.name}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400 font-mono">
                                <span>Bobot: {wi.bobotPercent}%</span>
                                <span>•</span>
                                <span>Target: {wi.startDate} s/d {wi.endDate}</span>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[10px]">
                                {wi.category}
                              </span>
                            </td>

                            {/* Progress Fisik */}
                            <td className="py-3 px-3 text-center font-mono">
                              <span className={`font-black text-xs ${wi.realizedProgressPercent >= 100 ? 'text-emerald-500' : 'text-orange-500'}`}>
                                {wi.realizedProgressPercent}%
                              </span>
                              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-1 overflow-hidden">
                                <div
                                  className={`h-full ${wi.realizedProgressPercent >= 100 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                                  style={{ width: `${Math.min(wi.realizedProgressPercent, 100)}%` }}
                                />
                              </div>
                            </td>

                            {/* Konsultan MK Verification Toggle */}
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleToggleConsultantApprove(wi.id)}
                                disabled={!canConsultant}
                                className={`w-full max-w-[130px] px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex flex-col items-center justify-center gap-0.5 mx-auto transition-all cursor-pointer ${
                                  insp.consultantApproved
                                    ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/40 shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-transparent'
                                } ${!canConsultant ? 'opacity-60 cursor-not-allowed' : ''}`}
                                title={
                                  insp.consultantApproved
                                    ? `Diverifikasi oleh: ${insp.consultantVerifiedBy || 'Konsultan MK'} (${insp.consultantVerifiedAt || 'Sah'})`
                                    : canConsultant
                                    ? 'Klik untuk verifikasi kelayakan sektor ini sebagai Konsultan MK'
                                    : 'Hanya Konsultan MK / Admin yang dapat memverifikasi'
                                }
                              >
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className={`w-3.5 h-3.5 ${insp.consultantApproved ? 'text-blue-500' : 'text-slate-400'}`} />
                                  <span>{insp.consultantApproved ? '✓ Lulus MK' : 'Verifikasi MK'}</span>
                                </div>
                                {insp.consultantApproved && insp.consultantVerifiedAt && (
                                  <span className="text-[9px] font-mono text-blue-500/80 dark:text-blue-400/80 truncate max-w-[110px]">
                                    {insp.consultantVerifiedAt}
                                  </span>
                                )}
                              </button>
                            </td>

                            {/* Owner / Direktur Approval Toggle */}
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={() => handleToggleDirApprove(wi.id)}
                                disabled={!canDir}
                                className={`w-full max-w-[130px] px-2.5 py-1.5 rounded-xl font-bold text-[11px] flex flex-col items-center justify-center gap-0.5 mx-auto transition-all cursor-pointer ${
                                  insp.directorApproved
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-transparent'
                                } ${!canDir ? 'opacity-60 cursor-not-allowed' : ''}`}
                                title={
                                  insp.directorApproved
                                    ? `Disetujui oleh: ${insp.directorApprovedBy || 'Owner / Direktur'} (${insp.directorApprovedAt || 'Sah'})`
                                    : canDir
                                    ? 'Klik untuk memberikan pengesahan kelayakan sektor ini sebagai Owner'
                                    : 'Hanya Owner / Direktur / Admin yang dapat mengesahkan'
                                }
                              >
                                <div className="flex items-center gap-1">
                                  <ShieldCheck className={`w-3.5 h-3.5 ${insp.directorApproved ? 'text-emerald-500' : 'text-slate-400'}`} />
                                  <span>{insp.directorApproved ? '✓ Disetujui' : 'Setujui Owner'}</span>
                                </div>
                                {insp.directorApproved && insp.directorApprovedAt && (
                                  <span className="text-[9px] font-mono text-emerald-600/80 dark:text-emerald-400/80 truncate max-w-[110px]">
                                    {insp.directorApprovedAt}
                                  </span>
                                )}
                              </button>
                            </td>

                            {/* Status Tripartit Combined Badge */}
                            <td className="py-3 px-3 text-center">
                              {isBoth ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black text-[10px] border border-emerald-500/30">
                                  <Check className="w-3 h-3 text-emerald-500" />
                                  Tripartit Sah
                                </span>
                              ) : insp.consultantApproved ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-[10px]">
                                  Tunggu Owner
                                </span>
                              ) : insp.directorApproved ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-[10px]">
                                  Tunggu MK
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium text-[10px]">
                                  Belum Audit
                                </span>
                              )}
                            </td>

                            {/* Notes & Punch List Trigger */}
                            <td className="py-3 px-3">
                              <div className="space-y-1.5">
                                <input
                                  type="text"
                                  placeholder="Catatan inspeksi fisik / rekomendasi..."
                                  value={insp.notes}
                                  onChange={(e) =>
                                    handleUpdateNotes(wi.id, e.target.value, insp.punchList, insp.punchListSeverity)
                                  }
                                  className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                />

                                <div className="flex items-center justify-between gap-1.5">
                                  {hasPunchList ? (
                                    <button
                                      onClick={() => setExpandedDefectItemId(isExpanded ? null : wi.id)}
                                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                        insp.punchListSeverity === 'critical'
                                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                      }`}
                                    >
                                      <AlertTriangle className="w-3 h-3" />
                                      Defect ({insp.punchListSeverity || 'moderate'}): {insp.punchList.slice(0, 24)}...
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => setExpandedDefectItemId(isExpanded ? null : wi.id)}
                                      className="text-[10px] text-slate-400 hover:text-orange-500 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                                    >
                                      <FileEdit className="w-3 h-3" /> + Catat Punch List Defect
                                    </button>
                                  )}

                                  {isExpanded && (
                                    <span className="text-[10px] text-orange-500 font-bold">
                                      Sedang Mengedit
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Defect Editor Row */}
                          {isExpanded && (
                            <tr className="bg-orange-50/60 dark:bg-orange-950/20 border-b border-orange-200 dark:border-orange-900/40">
                              <td colSpan={8} className="p-4">
                                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-800 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                                        Pencatatan Cacat Fisik / Punch List (Sektor {wi.no}: {wi.name})
                                      </h5>
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                      Sinkron otomatis ke Lampiran Dokumen BAST &amp; Berita Acara Pemeriksaan Fisik
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold uppercase text-slate-500 block">
                                        Tingkat Keparahan Cacat
                                      </label>
                                      <select
                                        value={insp.punchListSeverity || 'moderate'}
                                        onChange={(e) =>
                                          handleUpdateNotes(
                                            wi.id,
                                            insp.notes,
                                            insp.punchList,
                                            e.target.value as 'minor' | 'moderate' | 'critical'
                                          )
                                        }
                                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white"
                                      >
                                        <option value="minor">Ringan (Minor - Cat/Finishing)</option>
                                        <option value="moderate">Sedang (Moderate - Celah/Renggang)</option>
                                        <option value="critical">Kritis (Critical - Fungsi/Struktur)</option>
                                      </select>
                                    </div>

                                    <div className="sm:col-span-3 space-y-1">
                                      <label className="text-[10px] font-bold uppercase text-slate-500 block">
                                        Deskripsi Detail Cacat / Pekerjaan Perbaikan Wajib
                                      </label>
                                      <textarea
                                        rows={2}
                                        placeholder="Contoh: Terdapat keretakan rambut pada plesteran dinding sisi barat dan cat terkelupas pada lisplank..."
                                        value={insp.punchList}
                                        onChange={(e) =>
                                          handleUpdateNotes(wi.id, insp.notes, e.target.value, insp.punchListSeverity)
                                        }
                                        className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-1">
                                    <button
                                      onClick={() => {
                                        handleUpdateNotes(wi.id, insp.notes, '', 'minor');
                                        setExpandedDefectItemId(null);
                                      }}
                                      className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Hapus Defect / Selesai Diperbaiki
                                    </button>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => setExpandedDefectItemId(null)}
                                        className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                                      >
                                        Tutup
                                      </button>
                                      <button
                                        onClick={() => {
                                          syncWithDocumentStatus(inspections, 'notes');
                                          setExpandedDefectItemId(null);
                                        }}
                                        className="px-3.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                                      >
                                        <Check className="w-3.5 h-3.5" /> Simpan &amp; Sinkronkan ke BAST
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Checklist Footer Summary & Flow Navigation */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <span className="font-bold">
                  Total Terverifikasi:
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold">
                  MK: {consultantApprovedCount}/{totalItems}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-semibold">
                  Owner: {dirApprovedCount}/{totalItems}
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 font-bold">
                  Tripartit: {bothApprovedCount}/{totalItems} ({bothPercent}%)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSubTab('workflow')}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-orange-500" /> Lihat Alur BAST
                </button>
                <button
                  onClick={() => setActiveSubTab('signatures')}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                >
                  Lanjut ke Penandatanganan Digital <PenTool className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DIGITAL SIGNATURES BLOCK */}
        {activeSubTab === 'signatures' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1. Site Manager Signature Pad (Kontraktor) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">
                      OTORISASI 1: KONTRAKTOR
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Site Manager Pelaksana</h3>
                  </div>
                  {bastData.siteManagerSignatureData && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Siap
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nama Site Manager</label>
                  <input
                    type="text"
                    value={bastData.siteManagerName}
                    onChange={(e) => setBastData({ ...bastData, siteManagerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                {/* Canvas Box */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Tanda Tangan Digital SM:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={clearCanvasSM}
                        className="text-[11px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Hapus
                      </button>
                      <button
                        onClick={handleUsePresetSMSignature}
                        className="text-[11px] font-bold text-blue-500 hover:underline"
                      >
                        QR Verified
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-1 relative overflow-hidden">
                    {bastData.siteManagerSignatureData === 'PRESET_VERIFIED_SM' ? (
                      <div className="h-32 flex flex-col items-center justify-center text-center p-3 bg-blue-50 text-blue-900 rounded-lg">
                        <QrCode className="w-10 h-10 text-blue-700 mb-1" />
                        <span className="text-xs font-black">VERIFIED QR SIGNATURE</span>
                        <span className="text-[10px] text-blue-600 font-mono">ID: SM-FORESYNDO-AP2026</span>
                      </div>
                    ) : (
                      <canvas
                        ref={smCanvasRef}
                        width={320}
                        height={128}
                        onMouseDown={startDrawingSM}
                        onMouseMove={drawSM}
                        onMouseUp={stopDrawingSM}
                        onTouchStart={startDrawingSM}
                        onTouchMove={drawSM}
                        onTouchEnd={stopDrawingSM}
                        className="w-full h-32 touch-none cursor-crosshair bg-white rounded-lg"
                      />
                    )}
                  </div>
                  {bastData.siteManagerSignedAt && (
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      Waktu TTD: {bastData.siteManagerSignedAt}
                    </span>
                  )}
                </div>
              </div>

              {/* 2. Konsultan Pengawas MK Signature Pad */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block">
                      OTORISASI 2: PENGAWAS MK
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Konsultan Manajemen Konstruksi</h3>
                  </div>
                  {bastData.consultantMKSignatureData && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Siap
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nama Team Leader MK</label>
                  <input
                    type="text"
                    value={bastData.consultantMKName || 'Ir. Hendra Gunawan, ST, IPU'}
                    onChange={(e) => setBastData({ ...bastData, consultantMKName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                {/* Canvas Box */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Tanda Tangan Digital MK:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={clearCanvasMK}
                        className="text-[11px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Hapus
                      </button>
                      <button
                        onClick={handleUsePresetMKSignature}
                        className="text-[11px] font-bold text-amber-500 hover:underline"
                      >
                        QR Verified
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-1 relative overflow-hidden">
                    {bastData.consultantMKSignatureData === 'PRESET_VERIFIED_MK' ? (
                      <div className="h-32 flex flex-col items-center justify-center text-center p-3 bg-amber-50 text-amber-900 rounded-lg">
                        <QrCode className="w-10 h-10 text-amber-700 mb-1" />
                        <span className="text-xs font-black">VERIFIED QR SIGNATURE</span>
                        <span className="text-[10px] text-amber-600 font-mono">ID: MK-FORESYNDO-HG2026</span>
                      </div>
                    ) : (
                      <canvas
                        ref={mkCanvasRef}
                        width={320}
                        height={128}
                        onMouseDown={startDrawingMK}
                        onMouseMove={drawMK}
                        onMouseUp={stopDrawingMK}
                        onTouchStart={startDrawingMK}
                        onTouchMove={drawMK}
                        onTouchEnd={stopDrawingMK}
                        className="w-full h-32 touch-none cursor-crosshair bg-white rounded-lg"
                      />
                    )}
                  </div>
                  {bastData.consultantMKSignedAt && (
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      Waktu TTD: {bastData.consultantMKSignedAt}
                    </span>
                  )}
                </div>
              </div>

              {/* 3. Direktur Utama Signature Pad (Owner) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">
                      OTORISASI 3: OWNER / PEMBERI TUGAS
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Direktur Utama (Owner)</h3>
                  </div>
                  {bastData.directorSignatureData && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Siap
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Nama Direktur</label>
                  <input
                    type="text"
                    value={bastData.directorName}
                    onChange={(e) => setBastData({ ...bastData, directorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                {/* Canvas Box */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Tanda Tangan Digital Direktur:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={clearCanvasDir}
                        className="text-[11px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Hapus
                      </button>
                      <button
                        onClick={handleUsePresetDirSignature}
                        className="text-[11px] font-bold text-emerald-500 hover:underline"
                      >
                        QR Verified
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-1 relative overflow-hidden">
                    {bastData.directorSignatureData === 'PRESET_VERIFIED_DIR' ? (
                      <div className="h-32 flex flex-col items-center justify-center text-center p-3 bg-emerald-50 text-emerald-900 rounded-lg">
                        <QrCode className="w-10 h-10 text-emerald-700 mb-1" />
                        <span className="text-xs font-black">VERIFIED QR SIGNATURE</span>
                        <span className="text-[10px] text-emerald-600 font-mono">ID: DIR-FORESYNDO-BS2026</span>
                      </div>
                    ) : (
                      <canvas
                        ref={dirCanvasRef}
                        width={320}
                        height={128}
                        onMouseDown={startDrawingDir}
                        onMouseMove={drawDir}
                        onMouseUp={stopDrawingDir}
                        onTouchStart={startDrawingDir}
                        onTouchMove={drawDir}
                        onTouchEnd={stopDrawingDir}
                        className="w-full h-32 touch-none cursor-crosshair bg-white rounded-lg"
                      />
                    )}
                  </div>
                  {bastData.directorSignedAt && (
                    <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                      Waktu TTD: {bastData.directorSignedAt}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Validation & Handover Action Card */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Award className="w-4 h-4" /> Checklist Syarat Handover BAST-1 Tripartit Selesai Proyek
                </h4>
                <span className="text-xs font-bold text-slate-400">
                  Nomor BAST: <span className="text-white font-mono">{bastData.bastNumber}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-semibold">
                <div className={`p-3 rounded-xl border ${allSMApproved ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {allSMApproved ? '✓ 14 Sektor Lulus SM' : '✗ Belum Semua Sektor Lulus SM'}
                </div>
                <div className={`p-3 rounded-xl border ${allDirApproved ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {allDirApproved ? '✓ 14 Sektor Lulus Direktur' : '✗ Belum Semua Sektor Lulus Direktur'}
                </div>
                <div className={`p-3 rounded-xl border ${bastData.siteManagerSignatureData ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {bastData.siteManagerSignatureData ? '✓ TTD Kontraktor Siap' : '✗ TTD Kontraktor Belum Ada'}
                </div>
                <div className={`p-3 rounded-xl border ${bastData.directorSignatureData ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {bastData.directorSignatureData ? '✓ TTD Direktur Siap' : '✗ TTD Direktur Belum Ada'}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetSignatures}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                    title="Kosongkan seluruh tanda tangan digital dan coretan kanvas Tripartit"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" /> Reset Tanda Tangan
                  </button>
                  <p className="text-xs text-slate-400">
                    Dengan menekan tombol di samping, pengesahan BAST-1 resmi dituntaskan dan status proyek otomatis diperbarui menjadi <strong className="text-emerald-400 font-bold">SELESAI</strong>.
                  </p>
                </div>

                <button
                  onClick={handleFinalizeBAST}
                  disabled={!bastData.siteManagerSignatureData || !bastData.directorSignatureData || !isFullyApproved}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all shrink-0"
                >
                  <Award className="w-5 h-5" /> Sahkan BAST-1 Tripartit &amp; Selesaikan Proyek
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OFFICIAL PRINTABLE BAST-1 DOCUMENT */}
        {activeSubTab === 'bast' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => {
                  generateBASTPDF(submission, project, workItems);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <FileDown className="w-4 h-4" /> Unduh Dokumen PDF Resmi
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 text-orange-400" /> Cetak / Print Halaman
              </button>
            </div>

            {/* Official BAST-1 Document Sheet */}
            <div className="bg-white text-slate-900 rounded-2xl p-8 shadow-2xl font-sans text-xs space-y-6 print:p-0 print:shadow-none print:text-black max-w-4xl mx-auto border border-slate-200">
              {/* Kop Surat / Header */}
              <div className="border-b-2 border-blue-900 pb-4 flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <img
                    src={project.logoUrl || '/assets/logo.png'}
                    alt={project.owner || 'Logo Perusahaan Pemilik (Owner)'}
                    className="w-12 h-12 object-contain shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-xs font-black tracking-widest text-blue-900 uppercase block">
                      {project.owner || 'PT FORESYNDO GLOBAL INDONESIA'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 block">
                      {project.name} &bull; PEMILIK PROYEK
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      {project.location}
                    </span>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <div>
                    <span className="text-[10px] font-black text-blue-950 uppercase border border-blue-900 px-2 py-1 rounded inline-block">
                      DOKUMEN RESMI TRIPARTIT
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1 font-mono">{bastData.bastNumber}</span>
                  </div>
                  {project.contractorProfile?.logoUrl && (
                    <div className="text-center">
                      <img
                        src={project.contractorProfile.logoUrl}
                        alt="Logo Kontraktor Pelaksana"
                        className="w-11 h-11 object-contain shrink-0 border border-slate-200 p-0.5 rounded bg-white shadow-2xs"
                        referrerPolicy="no-referrer"
                        title={`Kontraktor Pelaksana: ${project.contractorProfile.companyName || project.contractor}`}
                      />
                      <span className="text-[8px] font-bold text-slate-500 block mt-0.5 uppercase">Kontraktor</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h1 className="text-lg font-black text-blue-950 uppercase tracking-tight">
                  BERITA ACARA SERAH TERIMA PERTAMA PEKERJAAN (BAST - 1)
                </h1>
                <p className="text-[11px] font-bold text-slate-600">
                  NO. KONTRAK: {project.contractNumber} | NILAI KONTRAK: {formatIDR(project.contractValue)}
                </p>
                <span className="inline-block text-[10px] bg-blue-50 text-blue-800 font-semibold px-3 py-0.5 rounded-full border border-blue-200">
                  Rujukan Surat Permohonan Kontraktor No: {submission.submissionNumber}
                </span>
              </div>

              {/* Statement Body */}
              <div className="space-y-3 leading-relaxed text-slate-800">
                <p>
                  Pada hari ini, <strong className="text-slate-900">Sabtu</strong> tanggal <strong className="text-slate-900">{bastData.handoverDate}</strong>, kami yang bertanda tangan di bawah ini secara sah mewakili masing-masing pihak:
                </p>

                <div className="pl-4 space-y-2 border-l-2 border-blue-900">
                  <div>
                    <span className="font-bold text-slate-900 block">1. {bastData.siteManagerName}</span>
                    <span className="text-slate-600 text-[11px]">
                      Jabatan: Site Manager PT Foresyndo Global Indonesia, bertindak untuk dan atas nama Kontraktor Pelaksana, selanjutnya disebut <strong className="text-slate-900">PIHAK PERTAMA (KONTRAKTOR)</strong>.
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">2. {bastData.consultantMKName || project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU'}</span>
                    <span className="text-slate-600 text-[11px]">
                      Jabatan: Team Leader Konsultan Manajemen Konstruksi (MK), bertindak sebagai Pengawas Teknis Lapangan, selanjutnya disebut <strong className="text-slate-900">PIHAK KETIGA (PENGAWAS MK)</strong>.
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">3. {bastData.directorName}</span>
                    <span className="text-slate-600 text-[11px]">
                      Jabatan: Direktur Utama PT Foresyndo Global Indonesia, bertindak untuk dan atas nama Pemilik Proyek, selanjutnya disebut <strong className="text-slate-900">PIHAK KEDUA (PEMILIK/OWNER)</strong>.
                    </span>
                  </div>
                </div>

                <p>
                  Menyatakan dengan sesungguhnya bahwa PIHAK PERTAMA telah merampungkan seluruh lingkup Pekerjaan Konstruksi <strong className="text-slate-900">{project.name}</strong> di lokasi <strong className="text-slate-900">{project.location}</strong> sesuai dengan spesifikasi teknis, dokumen kontrak No. <strong className="text-slate-900">{project.contractNumber}</strong>, serta Surat Rekomendasi Teknis MK No. <strong className="text-slate-900">{submission.mkRecommendationLetterNo}</strong> dengan pencapaian progress fisik <strong className="text-emerald-700 font-bold">100.0% (Lulus Uji Fungsi &amp; Inspeksi Akhir)</strong>.
                </p>

                {/* Masa Pemeliharaan & Retensi */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-700" />
                    Ketentuan Masa Pemeliharaan &amp; Jaminan Retensi (Warranty):
                  </div>
                  <ul className="list-disc pl-5 text-slate-700 space-y-0.5">
                    <li>
                      <strong>Masa Pemeliharaan:</strong> 180 (seratus delapan puluh) hari kalender, terhitung sejak tanggal BAST-1 ini hingga <strong>{submission.maintenanceEndDate}</strong>.
                    </li>
                    <li>
                      <strong>Jaminan Retensi 5%:</strong> Sebesar <strong>{formatIDR(submission.retentionValue)}</strong> ditahan sebagai jaminan perbaikan cacat tersembunyi hingga diterbitkannya BAST-2 (FHO).
                    </li>
                  </ul>
                </div>
              </div>

              {/* 14 Sectors Table Breakdown */}
              <div className="space-y-2">
                <h3 className="font-black text-xs text-blue-950 uppercase">
                  REKAPITULASI 14 SEKTOR PEKERJAAN TERINSPEKSI:
                </h3>
                <div className="overflow-x-auto border border-slate-300 rounded-lg">
                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-blue-950 text-white font-bold">
                        <th className="p-1.5 w-12 text-center">No</th>
                        <th className="p-1.5">Sektor Pekerjaan</th>
                        <th className="p-1.5 text-right w-28">Anggaran (Rp)</th>
                        <th className="p-1.5 text-center w-20">Progress</th>
                        <th className="p-1.5 text-center w-24">Status Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {workItems.map((wi) => (
                        <tr key={wi.id} className="odd:bg-white even:bg-slate-50">
                          <td className="p-1.5 text-center font-bold">{wi.no}</td>
                          <td className="p-1.5 font-semibold text-slate-900">{wi.name}</td>
                          <td className="p-1.5 text-right font-mono">{formatIDR(wi.volumeTarget)}</td>
                          <td className="p-1.5 text-center font-bold text-emerald-700">100%</td>
                          <td className="p-1.5 text-center font-bold text-blue-900">✓ LULUS</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Signatures Tripartite Block (3 columns) */}
              <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-3 gap-4 text-center">
                {/* 1. Kontraktor */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">PIHAK PERTAMA (KONTRAKTOR)</span>
                  <span className="font-bold text-slate-900 block text-[11px]">{bastData.siteManagerName}</span>
                  <div className="h-28 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 p-2">
                    {bastData.siteManagerSignatureData === 'PRESET_VERIFIED_SM' ? (
                      <div className="flex flex-col items-center space-y-1">
                        <QRCodeSVG value={`FORESYNDO-BAST-SIGN:${bastData.bastNumber}:SM`} size={54} level="M" />
                        <span className="text-[8px] font-mono font-black text-blue-900 tracking-tight">
                          VERIFIED QR SIGNATURE
                        </span>
                      </div>
                    ) : bastData.siteManagerSignatureData ? (
                      <img src={bastData.siteManagerSignatureData} alt="TTD SM" className="max-h-24 max-w-full object-contain" />
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">[ Belum Ditandatangani ]</span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono block">Site Manager Pelaksana</span>
                </div>

                {/* 2. Konsultan MK */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">PIHAK KETIGA (PENGAWAS MK)</span>
                  <span className="font-bold text-slate-900 block text-[11px]">{bastData.consultantMKName || project.consultantMK || 'Ir. Hendra Gunawan, ST, IPU'}</span>
                  <div className="h-28 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 p-2">
                    {bastData.consultantMKSignatureData === 'PRESET_VERIFIED_MK' || !bastData.consultantMKSignatureData ? (
                      <div className="flex flex-col items-center space-y-1">
                        <QRCodeSVG value={`FORESYNDO-BAST-SIGN:${bastData.bastNumber}:MK`} size={54} level="M" />
                        <span className="text-[8px] font-mono font-black text-amber-900 tracking-tight">
                          VERIFIED QR SIGNATURE
                        </span>
                      </div>
                    ) : (
                      <img src={bastData.consultantMKSignatureData} alt="TTD MK" className="max-h-24 max-w-full object-contain" />
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono block">Team Leader Konsultan MK</span>
                </div>

                {/* 3. Owner */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">PIHAK KEDUA (OWNER / DIREKTUR)</span>
                  <span className="font-bold text-slate-900 block text-[11px]">{bastData.directorName}</span>
                  <div className="h-28 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 p-2">
                    {bastData.directorSignatureData === 'PRESET_VERIFIED_DIR' ? (
                      <div className="flex flex-col items-center space-y-1">
                        <QRCodeSVG value={`FORESYNDO-BAST-SIGN:${bastData.bastNumber}:DIR`} size={54} level="M" />
                        <span className="text-[8px] font-mono font-black text-emerald-900 tracking-tight">
                          VERIFIED QR SIGNATURE
                        </span>
                      </div>
                    ) : bastData.directorSignatureData ? (
                      <img src={bastData.directorSignatureData} alt="TTD Direktur" className="max-h-24 max-w-full object-contain" />
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">[ Belum Ditandatangani ]</span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono block">Direktur Utama</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Pengajuan BAST Baru (Terintegrasi WorkItem Selesai & TTD Kontraktor-MK) */}
      <NewBASTSubmissionModal
        isOpen={showNewBASTModal}
        onClose={() => setShowNewBASTModal(false)}
        workItems={workItems}
        project={project}
        userRole={userRole}
        currentSubmission={submission}
        onSubmitBAST={handleNewBASTSubmitted}
        onAddAuditLog={onAddAuditLog}
      />

      {/* Modal Reset Modul Inspeksi Akhir & Pengesahan BAST-1 */}
      <ResetInspectionModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirmReset={handleConfirmReset}
        isProjectCompleted={project.status === 'Selesai'}
        currentStage={submission.stage}
      />
    </div>
  );
};
