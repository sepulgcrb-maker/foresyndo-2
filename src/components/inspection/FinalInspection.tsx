import React, { useState, useRef, useEffect } from 'react';
import { WorkItem, ProjectInfo, UserRole, AuditLog, BASTSubmissionData, RolePermissions } from '../../types';
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

export interface WorkItemInspectionState {
  [id: string]: {
    siteManagerApproved: boolean;
    directorApproved: boolean;
    notes: string;
    punchList: string;
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

const getInitialBastList = (project: ProjectInfo, primary: BASTSubmissionData): BASTSubmissionData[] => [
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

interface FinalInspectionProps {
  project: ProjectInfo;
  workItems: WorkItem[];
  userRole: UserRole;
  permissions?: RolePermissions;
  activeUserName?: string;
  onUpdateProjectStatus: (status: ProjectInfo['status']) => void;
  onAddAuditLog: (action: string, details: string) => void;
}

export const FinalInspection: React.FC<FinalInspectionProps> = ({
  project,
  workItems,
  userRole,
  permissions,
  activeUserName,
  onUpdateProjectStatus,
  onAddAuditLog,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'workflow' | 'daftar-bast' | 'checklist' | 'signatures' | 'bast'>('workflow');
  const [showNewBASTModal, setShowNewBASTModal] = useState(false);

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

  // Keep bastList synchronized with active submission
  useEffect(() => {
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
  const dirApprovedCount = workItems.filter((w) => inspections[w.id]?.directorApproved).length;
  const punchListCount = workItems.filter((w) => inspections[w.id]?.punchList?.trim()).length;

  const allSMApproved = smApprovedCount === totalItems;
  const allDirApproved = dirApprovedCount === totalItems;
  const isFullyApproved = allSMApproved && allDirApproved;

  // Inspection permissions
  const canSM =
    permissions?.canConductQCInspection ??
    (userRole === 'Kontraktor' ||
      userRole === 'Site Manager' ||
      userRole === 'Konsultan' ||
      userRole === 'Admin' ||
      userRole === 'Direktur' ||
      userRole === 'Owner');

  const canDir =
    permissions?.canApproveBAST ??
    (userRole === 'Owner' ||
      userRole === 'Direktur' ||
      userRole === 'Konsultan' ||
      userRole === 'Admin');

  // Toggle item inspection approval
  const handleToggleSMApprove = (id: string) => {
    if (!canSM) return;
    setInspections((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        siteManagerApproved: !prev[id]?.siteManagerApproved,
      },
    }));
  };

  const handleToggleDirApprove = (id: string) => {
    if (!canDir) return;
    setInspections((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        directorApproved: !prev[id]?.directorApproved,
      },
    }));
  };

  const handleUpdateNotes = (id: string, notes: string, punchList: string) => {
    setInspections((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        notes,
        punchList,
      },
    }));
  };

  const handleApproveAll = () => {
    const updated: WorkItemInspectionState = {};
    workItems.forEach((wi) => {
      updated[wi.id] = {
        siteManagerApproved: true,
        directorApproved: true,
        notes: wi.notes || 'Lulus inspeksi akhir kelayakan struktur & finishing',
        punchList: '',
      };
    });
    setInspections(updated);
    onAddAuditLog(
      'Bulk Inspeksi Akhir Approved',
      'Persetujuan massal kelayakan fisik 100% untuk seluruh sektor pekerjaan oleh Direktur/Site Manager'
    );
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
          </div>
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500">
            <ClipboardCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Verifikasi Inspeksi SM
            </span>
            <span className="text-2xl font-black text-blue-500 mt-1 block">
              {smApprovedCount} / {totalItems} Sektor
            </span>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Persetujuan Direktur
            </span>
            <span className="text-2xl font-black text-emerald-500 mt-1 block">
              {dirApprovedCount} / {totalItems} Sektor
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
            <span className="text-sm font-black text-amber-300 mt-1 block">
              {bastData.isCompleted ? '✓ SELESAI & TERAUDIT' : 'MENUNGGU PENGESAHAN'}
            </span>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl">
            <Award className="w-8 h-8 text-amber-400" />
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

          {/* Subtab Toggle Buttons & New BAST Modal Trigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
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
                <ClipboardCheck className="w-4 h-4" /> Checklist Sektor
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

        {/* TAB 1: CHECKLIST INSPEKSI SEKTOR */}
        {activeSubTab === 'checklist' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                <Sparkles className="w-4 h-4 text-orange-500 shrink-0" />
                <span>
                  Lakukan pemeriksaan berkala untuk memastikan tidak ada cacat fisik (Punch List) sebelum penandatanganan Berita Acara Serah Terima.
                </span>
              </div>
              {(canSM || canDir) && (
                <button
                  onClick={handleApproveAll}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shrink-0 shadow-sm transition-all"
                >
                  ✓ Disetujui Semua (Inspeksi Lulus 100%)
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[10px] font-bold">
                    <th className="py-3 px-3 text-center w-12">No</th>
                    <th className="py-3 px-3">Sektor Pekerjaan</th>
                    <th className="py-3 px-3 text-center w-24">Kategori</th>
                    <th className="py-3 px-3 text-right w-24">Progress</th>
                    <th className="py-3 px-3 text-center w-36">Verifikasi SM</th>
                    <th className="py-3 px-3 text-center w-36">Persetujuan Direktur</th>
                    <th className="py-3 px-3">Catatan Inspeksi / Punch List</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {workItems.map((wi) => {
                    const insp = inspections[wi.id] || {
                      siteManagerApproved: false,
                      directorApproved: false,
                      notes: '',
                      punchList: '',
                    };

                    return (
                      <tr key={wi.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3 text-center font-bold text-slate-500">{wi.no}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {wi.name}
                          <span className="block text-[10px] text-slate-400 font-mono font-normal">
                            Target: {wi.startDate} s/d {wi.endDate}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-[10px]">
                            {wi.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold">
                          <span className={wi.realizedProgressPercent >= 100 ? 'text-emerald-500' : 'text-orange-500'}>
                            {wi.realizedProgressPercent}%
                          </span>
                        </td>

                        {/* Site Manager Toggle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleToggleSMApprove(wi.id)}
                            disabled={!canSM}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 mx-auto transition-all ${
                              insp.siteManagerApproved
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${insp.siteManagerApproved ? 'text-blue-500' : 'text-slate-400'}`} />
                            {insp.siteManagerApproved ? 'Lulus SM' : 'Belum SM'}
                          </button>
                        </td>

                        {/* Direktur Toggle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleToggleDirApprove(wi.id)}
                            disabled={!canDir}
                            className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 mx-auto transition-all ${
                              insp.directorApproved
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                          >
                            <ShieldCheck className={`w-3.5 h-3.5 ${insp.directorApproved ? 'text-emerald-500' : 'text-slate-400'}`} />
                            {insp.directorApproved ? 'Disetujui Direktur' : 'Belum Direktur'}
                          </button>
                        </td>

                        {/* Notes Input */}
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            placeholder="Catatan hasil audit kelayakan / defect..."
                            value={insp.notes}
                            onChange={(e) => handleUpdateNotes(wi.id, e.target.value, insp.punchList)}
                            className="w-full px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveSubTab('signatures')}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
              >
                Lanjut ke Penandatanganan Digital <PenTool className="w-4 h-4" />
              </button>
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

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  Dengan menekan tombol di bawah, pengesahan BAST-1 resmi dituntaskan dan status proyek otomatis diperbarui menjadi <strong className="text-emerald-400 font-bold">SELESAI</strong>.
                </p>

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
                <div>
                  <span className="text-xs font-black tracking-widest text-blue-900 uppercase block">
                    PT FORESYNDO GLOBAL INDONESIA
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 block">
                    DEVELOPMENT &amp; GENERAL CONTRACTOR - BANDARA KERTAJATI
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Jl. Raya Jatitujuh No. 88, Majalengka, Jawa Barat | Telp: (0233) 881900
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-blue-950 uppercase border border-blue-900 px-2 py-1 rounded">
                    DOKUMEN RESMI TRIPARTIT
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1 font-mono">{bastData.bastNumber}</span>
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
    </div>
  );
};
