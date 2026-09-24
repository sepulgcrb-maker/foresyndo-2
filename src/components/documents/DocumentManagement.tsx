import React, { useState, useMemo, useEffect } from 'react';
import {
  Files,
  FileText,
  Upload,
  Search,
  Filter,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCode,
  FileSpreadsheet,
  FileCheck,
  Shield,
  Trash2,
  MessageSquare,
  Plus,
  X,
  ExternalLink,
  ChevronDown,
  Layers,
  Lock,
  Unlock,
  Check,
  Building,
  UserCheck,
  Info,
  Calendar,
  Tag,
  ShieldCheck,
  ShieldAlert,
  HardHat,
  PenTool,
  Bell,
  Image as ImageIcon,
} from 'lucide-react';
import { DocumentVisualViewer } from './DocumentVisualViewer';
import {
  ProjectDocument,
  DocumentCategory,
  DocumentStatus,
  DocumentConfidentiality,
  UserRole,
  RolePermissions,
  DocumentReviewNote,
  ProjectInfo,
} from '../../types';
import { RoleBadge } from '../common/RoleBadge';
import { generateProjectDocumentPDF } from '../../utils/exportEngine';

interface DocumentManagementProps {
  documents: ProjectDocument[];
  userRole: UserRole;
  permissions?: RolePermissions;
  activeUserName?: string;
  project?: Partial<ProjectInfo>;
  onAddDocument: (doc: ProjectDocument) => void;
  onUpdateDocument: (doc: ProjectDocument) => void;
  onDeleteDocument: (id: string) => void;
  onAddAuditLog?: (action: string, detail: string) => void;
  onSimulateMKDocument?: () => void;
  onSimulateOwnerDocument?: () => void;
}

const CATEGORY_TABS: { id: DocumentCategory | 'all'; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'all', label: 'Semua Dokumen', icon: Files },
  { id: 'contract', label: 'Kontrak & SPK', icon: FileCheck },
  { id: 'drawing', label: 'Gambar Teknis (DED & Shop Drawing)', icon: PenTool },
  { id: 'meeting_minute', label: 'Notulen Rapat & SCM', icon: MessageSquare },
  { id: 'legal_permit', label: 'Legalitas & PBG/IMB', icon: ShieldCheck },
];

export const DocumentManagement: React.FC<DocumentManagementProps> = ({
  documents,
  userRole,
  permissions,
  activeUserName = 'Site Manager',
  project,
  onAddDocument,
  onUpdateDocument,
  onDeleteDocument,
  onAddAuditLog,
  onSimulateMKDocument,
  onSimulateOwnerDocument,
}) => {
  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocForPreview, setSelectedDocForPreview] = useState<ProjectDocument | null>(null);
  const [selectedDocForReview, setSelectedDocForReview] = useState<ProjectDocument | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Review form state
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStatusChoice, setReviewStatusChoice] = useState<DocumentStatus>('Approved');

  // Upload Form State
  const [uploadForm, setUploadForm] = useState<{
    title: string;
    documentNumber: string;
    category: DocumentCategory;
    fileType: 'pdf' | 'dwg' | 'xlsx' | 'docx' | 'image' | 'png' | 'jpg' | 'jpeg';
    fileSize: string;
    fileName: string;
    fileUrl?: string;
    version: string;
    confidentiality: DocumentConfidentiality;
    description: string;
    tagsInput: string;
  }>({
    title: '',
    documentNumber: '',
    category: 'drawing',
    fileType: 'pdf',
    fileSize: '3.5 MB',
    fileName: '',
    fileUrl: undefined,
    version: 'Rev.00',
    confidentiality: 'Khusus Tripartit (Owner-MK-Kontraktor)',
    description: '',
    tagsInput: 'Struktur, Shop Drawing',
  });
  const [isDragging, setIsDragging] = useState(false);
  const [fakeFileSelected, setFakeFileSelected] = useState<string | null>(null);

  // Role classification & Permission checks
  const isKontraktor = userRole === 'Kontraktor' || userRole === 'Site Manager';
  const canUpload = permissions?.canUploadDocuments ?? (userRole !== 'Viewer');
  const canApprove = permissions?.canApproveDocuments ?? (userRole === 'Owner' || userRole === 'Direktur' || userRole === 'Konsultan');
  const canDelete = permissions?.canDeleteDocuments ?? (userRole === 'Owner' || userRole === 'Direktur');

  // Check if a document is classified as Legalitas or PBG / IMB
  const isLegalOrPBGDoc = (doc: ProjectDocument): boolean => {
    if (doc.category === 'legal_permit') return true;
    const title = (doc.title || '').toLowerCase();
    const desc = (doc.description || '').toLowerCase();
    const num = (doc.documentNumber || '').toLowerCase();
    const tags = (doc.tags || []).map((t) => t.toLowerCase());
    return (
      title.includes('pbg') ||
      title.includes('imb') ||
      title.includes('legalitas') ||
      title.includes('perizinan') ||
      title.includes('persetujuan bangunan') ||
      desc.includes('pbg') ||
      desc.includes('imb') ||
      desc.includes('legalitas') ||
      desc.includes('perizinan') ||
      num.includes('pbg') ||
      tags.some((t) => t.includes('pbg') || t.includes('imb') || t.includes('legalitas') || t.includes('perizinan'))
    );
  };

  // Check if a document is accessible to the current active user
  const isDocAccessibleToUser = (doc: ProjectDocument): boolean => {
    // Kebijakan: Kontraktor TIDAK BISA melihat dokumen Legalitas dan PBG
    if (isKontraktor && isLegalOrPBGDoc(doc)) {
      return false;
    }
    // Confidentiality filter: Kontraktor and Viewer cannot see documents marked 'Rahasia (Owner & Konsultan MK)'
    if (
      (isKontraktor || userRole === 'Viewer') &&
      doc.confidentiality === 'Rahasia (Owner & Konsultan MK)'
    ) {
      return false;
    }
    return true;
  };

  // Check if a document is a drawing (DED, Shop Drawing, Detail Arsitektur/Struktur)
  const isDrawingDoc = (doc: ProjectDocument): boolean => {
    return (
      doc.category === 'drawing' ||
      doc.fileType === 'dwg' ||
      doc.fileType === 'image' ||
      doc.fileType === 'png' ||
      doc.fileType === 'jpg' ||
      doc.fileType === 'jpeg'
    );
  };

  // Check if a document is uploaded by Owner or Konsultan MK
  const isUploadedByOwnerOrMK = (doc: ProjectDocument): boolean => {
    const role = doc.uploadedByRole;
    if (role === 'Owner' || role === 'Direktur' || role === 'Konsultan') {
      return true;
    }
    const uploader = (doc.uploadedBy || '').toLowerCase();
    return (
      uploader.includes('owner') ||
      uploader.includes('direktur') ||
      uploader.includes('mk') ||
      uploader.includes('konsultan') ||
      uploader.includes('bambang') ||
      uploader.includes('hendra')
    );
  };

  // Check if user has permission to review this document
  // Owner & MK can review/approve all documents; Kontraktor can review drawings uploaded by Owner and MK
  const canUserReviewDoc = (doc: ProjectDocument): boolean => {
    if (canApprove) {
      return true;
    }
    if (isKontraktor) {
      return isDrawingDoc(doc) && isUploadedByOwnerOrMK(doc);
    }
    return false;
  };

  // Auto-reset category filter if Kontraktor tries to access legal_permit
  useEffect(() => {
    if (isKontraktor && selectedCategory === 'legal_permit') {
      setSelectedCategory('all');
    }
  }, [isKontraktor, selectedCategory]);

  // Category tabs accessible to the active role (Kontraktor does not see Legalitas & PBG tab)
  const visibleCategoryTabs = useMemo(() => {
    if (isKontraktor) {
      return CATEGORY_TABS.filter((tab) => tab.id !== 'legal_permit');
    }
    return CATEGORY_TABS;
  }, [isKontraktor]);

  // Documents accessible to the current user
  const accessibleDocuments = useMemo(() => {
    return documents.filter(isDocAccessibleToUser);
  }, [documents, isKontraktor, userRole]);

  // Filtered documents for active view
  const filteredDocuments = useMemo(() => {
    return accessibleDocuments.filter((doc) => {
      // Category filter
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && doc.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = doc.title.toLowerCase().includes(query);
        const matchNumber = doc.documentNumber.toLowerCase().includes(query);
        const matchUploader = doc.uploadedBy.toLowerCase().includes(query);
        const matchTags = doc.tags.some((t) => t.toLowerCase().includes(query));
        const matchDesc = doc.description.toLowerCase().includes(query);
        if (!matchTitle && !matchNumber && !matchUploader && !matchTags && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [accessibleDocuments, selectedCategory, statusFilter, searchQuery]);

  // Summary counts
  const stats = useMemo(() => {
    const ownerOrMKDrawings = accessibleDocuments.filter(
      (d) => isDrawingDoc(d) && isUploadedByOwnerOrMK(d)
    );
    return {
      total: accessibleDocuments.length,
      contracts: accessibleDocuments.filter((d) => d.category === 'contract').length,
      drawings: accessibleDocuments.filter((d) => d.category === 'drawing').length,
      minutes: accessibleDocuments.filter((d) => d.category === 'meeting_minute').length,
      legal: accessibleDocuments.filter((d) => d.category === 'legal_permit').length,
      pendingReview: accessibleDocuments.filter((d) => d.status === 'Review' || d.status === 'Revision').length,
      approved: accessibleDocuments.filter((d) => d.status === 'Approved').length,
      ownerOrMKDrawingsCount: ownerOrMKDrawings.length,
    };
  }, [accessibleDocuments]);

  // Helper for generating document number recommendation
  const handleCategoryChangeInUpload = (cat: DocumentCategory) => {
    let prefix = 'DOC';
    let sample = '';
    if (cat === 'contract') {
      prefix = 'SPK';
      sample = `SPK-0${documents.length + 1}/FGI-DIR/2026`;
    } else if (cat === 'drawing') {
      prefix = 'SHD';
      sample = `SHD-STR-0${documents.length + 1}-REV0`;
    } else if (cat === 'meeting_minute') {
      prefix = 'MOM';
      sample = `MOM-SCM-W${documents.length + 1}/2026`;
    } else {
      prefix = 'LEG';
      sample = `BA-SK-0${documents.length + 1}/2026`;
    }
    setUploadForm((prev) => ({
      ...prev,
      category: cat,
      documentNumber: prev.documentNumber ? prev.documentNumber : sample,
    }));
  };

  // Process selected or dropped file with real FileReader
  const processSelectedFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    let type: 'pdf' | 'dwg' | 'xlsx' | 'docx' | 'image' = 'pdf';
    if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp'].includes(ext || '')) {
      type = 'image';
    } else if (ext === 'dwg') {
      type = 'dwg';
    } else if (ext === 'xlsx' || ext === 'xls') {
      type = 'xlsx';
    } else if (ext === 'docx' || ext === 'doc') {
      type = 'docx';
    } else {
      type = 'pdf';
    }

    const sizeStr =
      file.size > 1024 * 1024
        ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
        : (file.size / 1024).toFixed(0) + ' KB';

    setFakeFileSelected(file.name);

    // Read real file data URL for PDF/Image preview & download
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;

      // Optimasi gambar besar via HTML5 canvas agar tidak membengkak di snapshot/Supabase
      if (type === 'image' && dataUrl && dataUrl.length > 250000) {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            const compSizeKb = Math.round((compressed.length * 0.75) / 1024);
            setUploadForm((prev) => ({
              ...prev,
              fileName: file.name,
              title:
                prev.title ||
                file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
              fileType: type,
              fileSize: `${compSizeKb} KB`,
              fileUrl: compressed,
            }));
            return;
          }
          setUploadForm((prev) => ({
            ...prev,
            fileName: file.name,
            title:
              prev.title ||
              file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
            fileType: type,
            fileSize: sizeStr,
            fileUrl: dataUrl,
          }));
        };
        img.onerror = () => {
          setUploadForm((prev) => ({
            ...prev,
            fileName: file.name,
            title:
              prev.title ||
              file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
            fileType: type,
            fileSize: sizeStr,
            fileUrl: dataUrl,
          }));
        };
        img.src = dataUrl;
      } else {
        setUploadForm((prev) => ({
          ...prev,
          fileName: file.name,
          title:
            prev.title ||
            file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
          fileType: type,
          fileSize: sizeStr,
          fileUrl: dataUrl,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleLoadSampleImage = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="900" height="600">
      <rect width="900" height="600" fill="#0f172a" />
      <pattern id="cadgrid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" stroke-width="0.8" />
      </pattern>
      <rect width="900" height="600" fill="url(#cadgrid)" />
      <rect x="40" y="40" width="820" height="520" fill="none" stroke="#38bdf8" stroke-width="2" />
      <text x="450" y="80" fill="#f8fafc" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">PROYEK GEDUNG FORESYNDO 2 - GAMBAR ELEVASI &amp; FASADE UTAMA</text>
      <text x="450" y="105" fill="#94a3b8" font-size="13" font-family="sans-serif" text-anchor="middle">SKALA 1:50 | KONSULTAN MK: PT BINA MANDIRI KONSULTAN | TANGGAL: 14 SEPTEMBER 2026</text>
      <rect x="180" y="140" width="540" height="340" fill="#1e293b" stroke="#38bdf8" stroke-width="2.5" />
      <rect x="220" y="180" width="100" height="80" fill="#0284c7" fill-opacity="0.4" stroke="#38bdf8" stroke-width="1.5" />
      <rect x="360" y="180" width="180" height="80" fill="#0284c7" fill-opacity="0.4" stroke="#38bdf8" stroke-width="1.5" />
      <rect x="580" y="180" width="100" height="80" fill="#0284c7" fill-opacity="0.4" stroke="#38bdf8" stroke-width="1.5" />
      <rect x="220" y="300" width="100" height="80" fill="#0284c7" fill-opacity="0.4" stroke="#38bdf8" stroke-width="1.5" />
      <rect x="360" y="300" width="180" height="80" fill="#0284c7" fill-opacity="0.4" stroke="#38bdf8" stroke-width="1.5" />
      <rect x="580" y="300" width="100" height="80" fill="#0284c7" fill-opacity="0.4" stroke="#38bdf8" stroke-width="1.5" />
      <polygon points="320,420 580,420 600,435 300,435" fill="#f59e0b" stroke="#d97706" stroke-width="2" />
      <rect x="380" y="435" width="140" height="45" fill="#0f172a" stroke="#e2e8f0" stroke-width="2" />
      <line x1="120" y1="140" x2="170" y2="140" stroke="#f43f5e" stroke-width="2" />
      <text x="110" y="145" fill="#f43f5e" font-size="12" font-family="monospace" font-weight="bold" text-anchor="end">EL. +12.00 (ROOF)</text>
      <line x1="120" y1="280" x2="170" y2="280" stroke="#f43f5e" stroke-width="2" />
      <text x="110" y="285" fill="#f43f5e" font-size="12" font-family="monospace" font-weight="bold" text-anchor="end">EL. +6.00 (LT. 2)</text>
      <line x1="120" y1="480" x2="170" y2="480" stroke="#f43f5e" stroke-width="2" />
      <text x="110" y="485" fill="#f43f5e" font-size="12" font-family="monospace" font-weight="bold" text-anchor="end">EL. ±0.00 (GROUND)</text>
      <line x1="180" y1="510" x2="720" y2="510" stroke="#38bdf8" stroke-width="1.5" />
      <line x1="180" y1="500" x2="180" y2="520" stroke="#38bdf8" stroke-width="2" />
      <line x1="720" y1="500" x2="720" y2="520" stroke="#38bdf8" stroke-width="2" />
      <text x="450" y="530" fill="#38bdf8" font-size="13" font-family="monospace" font-weight="bold" text-anchor="middle">LEBAR FASADE BANGUNAN = 18.000 MM</text>
      <rect x="680" y="470" width="160" height="70" fill="#047857" fill-opacity="0.2" stroke="#10b981" stroke-width="2" rx="6" />
      <text x="760" y="495" fill="#34d399" font-size="11" font-family="sans-serif" font-weight="bold" text-anchor="middle">DISETUJUI OLEH MK</text>
      <text x="760" y="515" fill="#a7f3d0" font-size="9" font-family="sans-serif" text-anchor="middle">IR. HENDRA GUNAWAN</text>
      <text x="760" y="530" fill="#a7f3d0" font-size="9" font-family="monospace" text-anchor="middle">REV. 02 - VALID</text>
    </svg>`;
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
    setFakeFileSelected('DED_Fasade_Arsitektur_Rev02.png');
    setUploadForm((prev) => ({
      ...prev,
      title: 'Gambar DED Arsitektur Fasade Utama & Kanopi Drop-Off',
      documentNumber: 'DED-ARS-FASADE-02',
      category: 'drawing',
      fileType: 'image',
      fileSize: '3.4 MB',
      fileName: 'DED_Fasade_Arsitektur_Rev02.png',
      fileUrl: dataUrl,
      version: 'Rev.02',
      description: 'Gambar kerja arsitektur tampak depan & potongan curtain wall kaca gedung utama, kisi aluminium louver, dan kanopi entrance.',
    }));
  };

  const handleLoadSamplePdf = () => {
    setFakeFileSelected('Surat_Instruksi_MK_Pengawasan_Pengecoran.pdf');
    setUploadForm((prev) => ({
      ...prev,
      title: 'Surat Instruksi Lapangan MK: Prosedur Pengecoran Pelat Lantai 2',
      documentNumber: 'INS-MK-COR-008',
      category: 'drawing',
      fileType: 'pdf',
      fileSize: '1.6 MB',
      fileName: 'Surat_Instruksi_MK_Pengawasan_Pengecoran.pdf',
      version: 'v1.0',
      description: 'Instruksi teknis pengawasan pengecoran pelat lantai 2 menggunakan beton ready mix K-350 dengan slump test 12±2 cm dan penggunaan vibrator merata.',
    }));
  };

  // Submit Upload
  const handleSubmitUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title.trim() || !uploadForm.documentNumber.trim()) {
      alert('Mohon lengkapi Judul dan Nomor Dokumen.');
      return;
    }

    const tags = uploadForm.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newDoc: ProjectDocument = {
      id: `DOC-${Date.now()}`,
      title: uploadForm.title.trim(),
      documentNumber: uploadForm.documentNumber.trim(),
      category: uploadForm.category,
      fileType: uploadForm.fileType,
      fileSize: uploadForm.fileSize || '2.4 MB',
      fileName: uploadForm.fileName || `${uploadForm.documentNumber}.${uploadForm.fileType}`,
      fileUrl: uploadForm.fileUrl,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: activeUserName,
      uploadedByRole: userRole,
      version: uploadForm.version.trim() || 'v1.0',
      status: userRole === 'Owner' || userRole === 'Direktur' ? 'Approved' : 'Review',
      description: uploadForm.description.trim() || 'Dokumen resmi konstruksi diunggah ke repositori sistem.',
      tags: tags.length > 0 ? tags : ['Konstruksi'],
      confidentiality: uploadForm.confidentiality,
      signatories: [
        {
          role: userRole === 'Owner' || userRole === 'Direktur' ? 'Owner' : userRole === 'Konsultan' ? 'Konsultan' : 'Kontraktor',
          name: activeUserName,
          signed: true,
          signedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        },
      ],
      reviewNotes: [],
    };

    onAddDocument(newDoc);
    onAddAuditLog?.(
      'Unggah Dokumen Proyek',
      `Menambahkan ${newDoc.category}: ${newDoc.documentNumber} - ${newDoc.title} (${newDoc.version})`
    );

    setIsUploadModalOpen(false);
    setFakeFileSelected(null);
    setUploadForm({
      title: '',
      documentNumber: '',
      category: 'drawing',
      fileType: 'pdf',
      fileSize: '3.5 MB',
      fileName: '',
      fileUrl: undefined,
      version: 'Rev.00',
      confidentiality: 'Khusus Tripartit (Owner-MK-Kontraktor)',
      description: '',
      tagsInput: 'Struktur, Shop Drawing',
    });
  };

  // Submit Review Note & Approval
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDocForReview) return;
    if (!reviewComment.trim()) {
      alert('Mohon tuliskan catatan review teknis.');
      return;
    }

    const newNote: DocumentReviewNote = {
      id: `RN-${Date.now()}`,
      authorName: activeUserName,
      authorRole: userRole,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      comment: reviewComment.trim(),
      statusChange: reviewStatusChoice,
    };

    const updatedDoc: ProjectDocument = {
      ...selectedDocForReview,
      status: reviewStatusChoice,
      reviewNotes: [...(selectedDocForReview.reviewNotes || []), newNote],
    };

    onUpdateDocument(updatedDoc);
    if (isKontraktor) {
      onAddAuditLog?.(
        'Review Gambar Kerja oleh Kontraktor',
        `Kontraktor Pelaksana (${activeUserName}) memberikan review teknis pada gambar ${updatedDoc.documentNumber} (${updatedDoc.title}) status: "${reviewStatusChoice}": "${reviewComment}"`
      );
    } else {
      onAddAuditLog?.(
        'Review & Verifikasi Dokumen',
        `Memperbarui status ${updatedDoc.documentNumber} menjadi "${reviewStatusChoice}": "${reviewComment}"`
      );
    }

    setSelectedDocForReview(null);
    setReviewComment('');
  };

  // Handle Document File Download (PDF generation or original file)
  const handleDownloadDocument = (doc: ProjectDocument, format: 'pdf' | 'original' = 'pdf') => {
    if (format === 'original' && doc.fileUrl) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = doc.fileName || `${doc.documentNumber}.${doc.fileType}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onAddAuditLog?.('Unduh Berkas Asli', `Mengunduh berkas asli ${doc.documentNumber} (${doc.fileName})`);
      return;
    }

    // If uploaded PDF exists and user requests PDF, download it directly
    if (
      doc.fileUrl &&
      (doc.fileUrl.startsWith('data:application/pdf') || doc.fileType === 'pdf') &&
      doc.fileUrl.startsWith('data:')
    ) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      const pdfName = doc.fileName.toLowerCase().endsWith('.pdf')
        ? doc.fileName
        : `${doc.fileName || doc.documentNumber}.pdf`;
      link.download = pdfName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      onAddAuditLog?.('Unduh Dokumen PDF', `Mengunduh berkas PDF ${doc.documentNumber} (${doc.title})`);
      return;
    }

    // Generate high quality official project PDF with letterhead, signatures & stamp
    try {
      generateProjectDocumentPDF(doc, project);
      onAddAuditLog?.('Unduh Dokumen PDF Resmi', `Mengunduh arsip PDF resmi ${doc.documentNumber} (${doc.title})`);
    } catch (err) {
      console.error('Gagal generate PDF:', err);
      alert('Gagal menghasilkan dokumen PDF. Silakan periksa kembali.');
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui
          </span>
        );
      case 'Review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Dalam Review
          </span>
        );
      case 'Revision':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> Butuh Revisi
          </span>
        );
      case 'Draft':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30">
            <FileText className="w-3.5 h-3.5" /> Konsep (Draft)
          </span>
        );
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return (
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold shrink-0">
            <span className="text-xs font-black">PDF</span>
          </div>
        );
      case 'image':
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
        return (
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold shrink-0">
            <span className="text-[10px] font-black">IMG</span>
          </div>
        );
      case 'dwg':
        return (
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold shrink-0">
            <span className="text-xs font-black">DWG</span>
          </div>
        );
      case 'xlsx':
      case 'xls':
        return (
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
            <span className="text-xs font-black">XLS</span>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shrink-0">
            <span className="text-xs font-black">DOC</span>
          </div>
        );
    }
  };

  const getCategoryLabel = (cat: DocumentCategory) => {
    switch (cat) {
      case 'contract':
        return 'Kontrak & SPK';
      case 'drawing':
        return 'Gambar Teknis';
      case 'meeting_minute':
        return 'Notulen Rapat SCM';
      case 'legal_permit':
        return 'Legalitas & PBG';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
              <Files className="w-3 h-3" /> Repositori Dokumen Konstruksi
            </span>
            <span className="text-xs text-slate-400">Proyek Gedung Foresyndo 2 &bull; Majalengka</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Manajemen Dokumen & Gambar Teknis
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Pusat penyimpanan terpadu PDF Kontrak Induk, Shop Drawing, As-Built Drawing, Notulen Rapat SCM, dan Legalitas PBG
            dengan kontrol wewenang berbasis peran Tripartit (Owner, Konsultan MK, Kontraktor).
          </p>
        </div>

        {/* Action Button & Role Indicator */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 z-10">
          <div className="bg-slate-800/80 px-3 py-2 rounded-2xl border border-slate-700/80 flex items-center gap-2">
            <RoleBadge role={userRole} />
            <div className="text-[11px] text-slate-400">
              {canUpload ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Izin Unggah Aktif
                </span>
              ) : (
                <span className="text-slate-500 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Mode Hanya Baca
                </span>
              )}
            </div>
          </div>

          {/* Quick Simulation Buttons for testing bell badge */}
          {(onSimulateMKDocument || onSimulateOwnerDocument) && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-2xl border border-sky-400/30">
              <span className="text-[10px] font-bold text-sky-400 px-2 flex items-center gap-1">
                <Bell className="w-3 h-3 text-sky-400" /> Uji Lonceng:
              </span>
              {onSimulateMKDocument && (
                <button
                  onClick={onSimulateMKDocument}
                  className="px-2.5 py-1.5 rounded-xl bg-sky-600/30 hover:bg-sky-600 text-sky-200 hover:text-white text-[11px] font-bold border border-sky-500/40 transition-all cursor-pointer"
                  title="Simulasi: Konsultan MK mengunggah gambar kerja baru (Badge Lonceng akan terupdate)"
                >
                  + Upload MK
                </button>
              )}
              {onSimulateOwnerDocument && (
                <button
                  onClick={onSimulateOwnerDocument}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-[11px] font-bold border border-indigo-500/40 transition-all cursor-pointer"
                  title="Simulasi: Owner menerbitkan instruksi lapangan baru (Badge Lonceng akan terupdate)"
                >
                  + Upload Owner
                </button>
              )}
            </div>
          )}

          {canUpload ? (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-bold shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Unggah Dokumen Baru
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 text-slate-500 text-xs font-bold border border-slate-700 cursor-not-allowed opacity-75"
              title="Unggah dibatasi untuk peran Viewer"
            >
              <Lock className="w-4 h-4" /> Unggah Dibatasi
            </button>
          )}
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Kontraktor Access Policy Notification Banner */}
      {isKontraktor && (
        <div className="flex items-start sm:items-center gap-3.5 p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-slate-900 border border-amber-500/30 text-amber-200 shadow-lg">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/30">
            <HardHat className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1 text-xs">
            <div className="font-bold text-white flex items-center gap-2 flex-wrap">
              <span>Kebijakan Otoritas Dokumen: Kontraktor Pelaksana</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SOP Lapangan Aktif
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              &bull; <strong className="text-amber-300">Dokumen Legalitas & PBG:</strong> Dibatasi dan disembunyikan secara otomatis sesuai proteksi dokumen izin internal Owner & Konsultan MK.<br />
              &bull; <strong className="text-cyan-300">Review Gambar Kerja Teknis:</strong> Anda memiliki wewenang untuk meninjau (review), memeriksa kesiapan lapangan, serta memberikan catatan persetujuan/revisi pada seluruh <strong>Gambar Teknis (DED & Shop Drawing)</strong> yang diterbitkan oleh <strong>Owner</strong> dan <strong>Konsultan MK</strong>.
            </p>
          </div>
        </div>
      )}

      {/* KPI Counters Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Total Dokumen</span>
            <Files className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats.total}</div>
          <div className="text-[10px] text-slate-500">
            {isKontraktor ? 'Akses dokumen Kontraktor' : 'Arsip aktif dalam sistem'}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Kontrak & SPK</span>
            <FileCheck className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">{stats.contracts}</div>
          <div className="text-[10px] text-slate-500">SPK & Addendum RAB</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Gambar Teknis</span>
            <PenTool className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-cyan-400">{stats.drawings}</div>
          <div className="text-[10px] text-slate-500">DED & Shop Drawings</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Notulen Rapat SCM</span>
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.minutes}</div>
          <div className="text-[10px] text-slate-500">PCM & SCM mingguan</div>
        </div>

        {isKontraktor ? (
          <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-3.5 space-y-1 bg-amber-500/5">
            <div className="text-[11px] text-amber-300 font-medium flex items-center justify-between">
              <span>Gambar Owner & MK</span>
              <HardHat className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{stats.ownerOrMKDrawingsCount}</div>
            <div className="text-[10px] text-amber-400/80 font-semibold">Bisa direview Kontraktor</div>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>Legalitas & PBG</span>
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-purple-400">{stats.legal}</div>
            <div className="text-[10px] text-slate-500">Izin IMB & AMDAL</div>
          </div>
        )}

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
          <div className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
            <span>Telah Disetujui</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{stats.approved}</div>
          <div className="text-[10px] text-slate-500">Status final terverifikasi</div>
        </div>
      </div>

      {/* Category Tabs & Search Filter Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-lg">
        {/* Category Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {visibleCategoryTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedCategory === tab.id;
            const count =
              tab.id === 'all'
                ? accessibleDocuments.length
                : accessibleDocuments.filter((d) => d.category === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Status Filter & View Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul, nomor dokumen, pengunggah, atau tag..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800/90 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
              >
                &times;
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded-2xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-400 hidden sm:inline">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'all')}
                className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">Semua Status</option>
                <option value="Approved" className="bg-slate-900 text-emerald-400">Disetujui (Approved)</option>
                <option value="Review" className="bg-slate-900 text-amber-400">Dalam Review</option>
                <option value="Revision" className="bg-slate-900 text-rose-400">Butuh Revisi</option>
                <option value="Draft" className="bg-slate-900 text-slate-400">Konsep (Draft)</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-2xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-orange-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Grid Card"
              >
                <Layers className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-orange-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Tabel Rinci"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Document Content List / Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Files className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white">Tidak Ada Dokumen yang Ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Tidak ada dokumen yang cocok dengan filter atau kata kunci pencarian Anda. Coba sesuaikan kata kunci atau reset filter.
          </p>
          {(searchQuery || statusFilter !== 'all' || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-semibold transition-all cursor-pointer"
            >
              Reset Semua Filter
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 shadow-lg flex flex-col justify-between transition-all hover:shadow-2xl group space-y-4 relative"
            >
              {/* Card Header: Icon + Category + Status */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {getFileTypeIcon(doc.fileType)}
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          {getCategoryLabel(doc.category)}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-500/15 text-orange-400 border border-orange-500/30">
                          {doc.version}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-300 font-mono mt-1 tracking-tight">
                        {doc.documentNumber}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">{getStatusBadge(doc.status)}</div>
                </div>

                {/* Title and Description */}
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-2 leading-snug">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {doc.description}
                  </p>
                </div>

                {/* Tags */}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Owner/MK Drawing Indicator */}
                {isDrawingDoc(doc) && isUploadedByOwnerOrMK(doc) && (
                  <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-medium">
                    <div className="flex items-center gap-1.5 truncate">
                      <PenTool className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">Terbitan {doc.uploadedByRole === 'Owner' || doc.uploadedByRole === 'Direktur' ? 'Owner Proyek' : 'Konsultan Pengawas (MK)'}</span>
                    </div>
                    {isKontraktor && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Bisa Direview
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer: Metadata & Actions */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <RoleBadge role={doc.uploadedByRole} showIcon={false} />
                    <span className="truncate text-slate-300">{doc.uploadedBy}</span>
                  </div>
                  <div className="shrink-0 text-slate-500 font-mono text-[10px]">{doc.uploadDate}</div>
                </div>

                {/* Actions Grid */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedDocForPreview(doc)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-orange-400" /> Pratinjau
                  </button>

                  <button
                    onClick={() => handleDownloadDocument(doc)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
                    title="Unduh Berkas Resmi (PDF/Dokumen)"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {canUserReviewDoc(doc) && (
                    <button
                      onClick={() => {
                        setSelectedDocForReview(doc);
                        setReviewStatusChoice(doc.status === 'Review' ? 'Approved' : doc.status);
                        setReviewComment('');
                      }}
                      className={`p-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                        isKontraktor
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3'
                          : 'bg-slate-800 hover:bg-amber-500/20 text-amber-400'
                      }`}
                      title={
                        isKontraktor
                          ? 'Review Gambar Kerja (dari Owner / MK)'
                          : 'Verifikasi & Beri Catatan Approval'
                      }
                    >
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      {isKontraktor && <span className="text-[11px] font-bold">Review</span>}
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => setDeleteConfirmId(doc.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tipe & No. Dokumen</th>
                  <th className="py-3 px-4">Judul Dokumen</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Versi</th>
                  <th className="py-3 px-4">Pengunggah</th>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {getFileTypeIcon(doc.fileType)}
                        <div>
                          <div className="font-bold text-white font-mono">{doc.documentNumber}</div>
                          <div className="text-[10px] text-slate-500">{doc.fileSize}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-white hover:text-orange-400 transition-colors line-clamp-1">
                        {doc.title}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">{doc.description}</div>
                      {isDrawingDoc(doc) && isUploadedByOwnerOrMK(doc) && (
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            <PenTool className="w-2.5 h-2.5" /> Terbitan {doc.uploadedByRole === 'Owner' || doc.uploadedByRole === 'Direktur' ? 'Owner' : 'Konsultan MK'}
                          </span>
                          {isKontraktor && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Bisa Direview
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {getCategoryLabel(doc.category)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-orange-400 font-bold">{doc.version}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <RoleBadge role={doc.uploadedByRole} showIcon={false} />
                        <span className="truncate max-w-[120px]">{doc.uploadedBy}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">{doc.uploadDate}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(doc.status)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedDocForPreview(doc)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-orange-400 transition-colors"
                          title="Pratinjau"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadDocument(doc)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                          title="Unduh Berkas"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {canUserReviewDoc(doc) && (
                          <button
                            onClick={() => {
                              setSelectedDocForReview(doc);
                              setReviewStatusChoice(doc.status === 'Review' ? 'Approved' : doc.status);
                              setReviewComment('');
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isKontraktor
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 hover:bg-amber-500/20 text-amber-400'
                            }`}
                            title={
                              isKontraktor
                                ? 'Review Gambar Kerja yang Diunggah Owner / MK'
                                : 'Approval / Review Dokumen'
                            }
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteConfirmId(doc.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PREVIEW & DETAILS MODAL */}
      {/* ========================================================================= */}
      {selectedDocForPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          {isKontraktor && isLegalOrPBGDoc(selectedDocForPreview) ? (
            <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">Akses Dokumen Dibatasi</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sesuai tata kelola proyek, <strong>Kontraktor Pelaksana tidak memiliki izin akses</strong> untuk berkas Legalitas, Izin PBG, dan AMDAL. Dokumen ini merupakan arsip tertutup khusus <strong>Owner</strong> dan <strong>Konsultan MK</strong>.
                </p>
              </div>
              <button
                onClick={() => setSelectedDocForPreview(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {getFileTypeIcon(selectedDocForPreview.fileType)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-orange-400">
                      {selectedDocForPreview.documentNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {selectedDocForPreview.version}
                    </span>
                    {getStatusBadge(selectedDocForPreview.status)}
                  </div>
                  <h2 className="text-base font-bold text-white line-clamp-1">{selectedDocForPreview.title}</h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadDocument(selectedDocForPreview, 'pdf')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer"
                  title="Unduh Dokumen PDF Resmi Proyek"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Dokumen (PDF)
                </button>
                {selectedDocForPreview.fileUrl && (
                  <button
                    onClick={() => handleDownloadDocument(selectedDocForPreview, 'original')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                    title="Unduh Berkas Asli yang Diunggah"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Berkas Asli ({selectedDocForPreview.fileType.toUpperCase()})
                  </button>
                )}
                <button
                  onClick={() => setSelectedDocForPreview(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Document Preview Letterhead & Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-xs">
              {/* Document Visual Viewer (High-res Images, PDFs, CAD Blueprints & Official Legal Docs) */}
              <DocumentVisualViewer
                document={selectedDocForPreview}
                onDownloadPdf={() => handleDownloadDocument(selectedDocForPreview, 'pdf')}
                onDownloadOriginal={() => handleDownloadDocument(selectedDocForPreview, 'original')}
              />

              {/* Simulated Paper Letterhead */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-inner relative">
                {/* Official Letterhead Header */}
                <div className="border-b-2 border-slate-700 pb-4 text-center space-y-1">
                  <div className="text-xs font-black tracking-widest text-orange-400 uppercase">
                    PT FORESYNDO GLOBAL INDONESIA
                  </div>
                  <div className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
                    PROYEK PEMBANGUNAN GEDUNG FORESYNDO 2
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Lokasi: Kec. Jatitujuh, Kabupaten Majalengka, Jawa Barat &bull; Nilai Kontrak: Rp 14.461.760.981
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Kategori Dokumen</span>
                    <span className="font-bold text-white">{getCategoryLabel(selectedDocForPreview.category)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Klasifikasi Akses</span>
                    <span className="font-bold text-amber-400">{selectedDocForPreview.confidentiality}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Pengunggah Dokumen</span>
                    <span className="font-bold text-white">{selectedDocForPreview.uploadedBy}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-bold">Tanggal Penerbitan</span>
                    <span className="font-bold text-white font-mono">{selectedDocForPreview.uploadDate}</span>
                  </div>
                </div>

                {/* Document Description / Text */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-orange-400" /> Ringkasan & Spesifikasi Teknis:
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 leading-relaxed text-slate-300">
                    {selectedDocForPreview.description}
                  </div>
                </div>

                {/* Tripartit Signatures Stamp Box */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Pengesahan & Tanda Tangan Digital Tripartit:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Owner Box */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Pemberi Tugas (Owner)</div>
                      <div className="py-2 flex items-center justify-center">
                        <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                          [TERVERIFIKASI DIGITAL]
                        </div>
                      </div>
                      <div className="font-bold text-white text-xs">{project?.director || 'HASANUDIN'}</div>
                      <div className="text-[10px] text-slate-500">Direktur Utama PT. FORESYNDO GLOBAL INDONESIA</div>
                    </div>

                    {/* Konsultan MK Box */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Konsultan Pengawas (MK)</div>
                      <div className="py-2 flex items-center justify-center">
                        <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                          [TERVERIFIKASI DIGITAL]
                        </div>
                      </div>
                      <div className="font-bold text-white text-xs">{project?.consultantMK || 'SAEPUL ANWAR'}</div>
                      <div className="text-[10px] text-slate-500">Kuasa Direktur PT. BENNATIN SURYA CIPTA</div>
                    </div>

                    {/* Kontraktor Box */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-center">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Kontraktor Pelaksana</div>
                      <div className="py-2 flex items-center justify-center">
                        <div className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                          [TERVERIFIKASI DIGITAL]
                        </div>
                      </div>
                      <div className="font-bold text-white text-xs">{project?.siteManager || 'EKO YULIANTO'}</div>
                      <div className="text-[10px] text-slate-500">PT. GONG MBE LINK PAMUNGKAS</div>
                    </div>
                  </div>
                </div>

                {/* Review Notes History */}
                {selectedDocForPreview.reviewNotes && selectedDocForPreview.reviewNotes.length > 0 && (
                  <div className="space-y-2 pt-4 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Riwayat Audit & Review Teknis:
                    </h4>
                    <div className="space-y-2">
                      {selectedDocForPreview.reviewNotes.map((rn) => (
                        <div key={rn.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-orange-400 flex items-center gap-1.5">
                              <RoleBadge role={rn.authorRole} showIcon={false} />
                              {rn.authorName}
                            </span>
                            <span className="text-slate-500 font-mono">{rn.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-300 italic">"{rn.comment}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Berkas: <span className="font-mono text-slate-200">{selectedDocForPreview.fileName}</span> ({selectedDocForPreview.fileSize})
              </span>
              <div className="flex items-center gap-2">
                {canUserReviewDoc(selectedDocForPreview) && (
                  <button
                    onClick={() => {
                      const doc = selectedDocForPreview;
                      setSelectedDocForPreview(null);
                      setSelectedDocForReview(doc);
                      setReviewStatusChoice(doc.status === 'Review' ? 'Approved' : doc.status);
                      setReviewComment('');
                    }}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md ${
                      isKontraktor
                        ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/25'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isKontraktor ? 'Review Gambar Kerja Ini' : 'Beri Catatan Approval'}
                  </button>
                )}
                <button
                  onClick={() => setSelectedDocForPreview(null)}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* REVIEW & APPROVAL MODAL */}
      {/* ========================================================================= */}
      {selectedDocForReview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isKontraktor ? (
                  <HardHat className="w-5 h-5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                )}
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {isKontraktor
                      ? 'Review Gambar Kerja (Owner & MK)'
                      : 'Verifikasi & Approval Dokumen'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {isKontraktor
                      ? 'Tinjauan teknis lapangan oleh Kontraktor terhadap gambar terbitan Owner/Konsultan MK'
                      : 'Audit dan pengesahan dokumen proyek konstruksi'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocForReview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-1">
                <div className="text-[11px] text-slate-400">Dokumen yang ditinjau:</div>
                <div className="font-bold text-white text-xs">{selectedDocForReview.title}</div>
                <div className="flex items-center gap-2 flex-wrap text-[10px]">
                  <span className="font-mono text-orange-400">{selectedDocForReview.documentNumber} ({selectedDocForReview.version})</span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="text-slate-300">Diupload oleh: <strong>{selectedDocForReview.uploadedBy}</strong> ({selectedDocForReview.uploadedByRole})</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  {isKontraktor ? 'Hasil Review Gambar Lapangan' : 'Keputusan Status Dokumen'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatusChoice('Approved')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      reviewStatusChoice === 'Approved'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {isKontraktor ? 'Disetujui Kontraktor' : 'Setujui (Approved)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatusChoice('Revision')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      reviewStatusChoice === 'Revision'
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {isKontraktor ? 'Usul Revisi Lapangan' : 'Minta Revisi'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatusChoice('Review')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      reviewStatusChoice === 'Review'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    Tinjau Kembali
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  {isKontraktor
                    ? 'Catatan Teknis Lapangan / Respon Kontraktor'
                    : 'Catatan Review Teknis / Arahan Lapangan'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder={
                    isKontraktor
                      ? 'Tuliskan hasil pengecekan dimensi gambar kerja, kesiapan material/bekisting di lapangan, atau catatan khusus sebelum eksekusi pekerjaan...'
                      : 'Tuliskan catatan teknis, instruksi revisi, atau konfirmasi persetujuan dokumen ini...'
                  }
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDocForReview(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/25 transition-all cursor-pointer"
                >
                  {isKontraktor ? 'Kirim Review Gambar' : 'Simpan Keputusan Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* UPLOAD DOCUMENT MODAL */}
      {/* ========================================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-white text-sm">Unggah Dokumen Konstruksi Baru</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitUpload} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Automatic notification alert for MK / Owner */}
              {(userRole === 'Konsultan' || userRole === 'Owner' || userRole === 'Direktur') && (
                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-start gap-2 text-sky-200 text-xs">
                  <Bell className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold text-sky-300">Pemberitahuan Otomatis: </span>
                    Dokumen yang Anda unggah sebagai{' '}
                    <strong className="text-white font-bold">
                      {userRole === 'Konsultan' ? 'Konsultan MK' : 'Owner Proyek'}
                    </strong>{' '}
                    akan langsung memicu pembaruan <span className="text-amber-300 font-bold">badge notifikasi pada ikon lonceng</span> seluruh tim proyek secara otomatis.
                  </div>
                </div>
              )}

              {/* Drag & Drop File Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processSelectedFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                  isDragging
                    ? 'border-orange-500 bg-orange-500/10'
                    : fakeFileSelected
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                }`}
              >
                <input
                  type="file"
                  id="doc-file-input"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,image/png,image/jpeg,image/jpg,image/webp,.dwg,.xlsx,.xls,.docx,.doc"
                />
                <label htmlFor="doc-file-input" className="cursor-pointer space-y-2 block">
                  {uploadForm.fileUrl && (uploadForm.fileType === 'image' || uploadForm.fileUrl.startsWith('data:image')) ? (
                    <div className="space-y-2">
                      <div className="max-h-36 overflow-hidden rounded-xl border border-emerald-500/30 mx-auto inline-block">
                        <img
                          src={uploadForm.fileUrl}
                          alt="Thumbnail Pratinjau"
                          className="max-h-36 object-contain mx-auto rounded-lg"
                        />
                      </div>
                      <div className="font-bold text-emerald-400 text-xs">{fakeFileSelected} ({uploadForm.fileSize})</div>
                      <div className="text-[11px] text-slate-400">Klik atau seret untuk mengganti berkas gambar</div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400">
                        <Upload className="w-6 h-6" />
                      </div>
                      {fakeFileSelected ? (
                        <div>
                          <div className="font-bold text-emerald-400 text-sm">{fakeFileSelected} ({uploadForm.fileSize})</div>
                          <div className="text-[11px] text-slate-400">Klik untuk mengganti berkas yang dipilih</div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-white text-sm">Tarik & Jatuhkan Berkas PDF atau Gambar di sini</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            atau <span className="text-orange-400 underline font-bold">Pilih Berkas dari Komputer</span> (Mendukung .pdf, .png, .jpg, .dwg, .xlsx, .docx maks. 25 MB)
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </label>
              </div>

              {/* Quick Sample Presets for Testing Image & Document Upload */}
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400">Pilihan Cepat Berkas Uji Coba:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSampleImage}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Muat Contoh Gambar DED Arsitektur Fasade"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" /> Muat Contoh Gambar (.png)
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSamplePdf}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Muat Contoh PDF Instruksi Pengawasan"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-400" /> Muat Contoh Berkas (.pdf)
                  </button>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Kategori Dokumen *</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => handleCategoryChangeInUpload(e.target.value as DocumentCategory)}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-orange-500"
                  >
                    <option value="drawing">Gambar Teknis (DED & Shop Drawing)</option>
                    <option value="contract">Kontrak & SPK / Addendum</option>
                    <option value="meeting_minute">Notulen Rapat PCM & SCM</option>
                    {!isKontraktor && <option value="legal_permit">Legalitas & PBG/IMB</option>}
                  </select>
                </div>

                {/* Document Number */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Nomor Dokumen / No. Gambar *</label>
                  <input
                    type="text"
                    required
                    value={uploadForm.documentNumber}
                    onChange={(e) => setUploadForm({ ...uploadForm, documentNumber: e.target.value })}
                    placeholder="Contoh: SHD-STR-001 / SPK-04/DIR/2026"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Judul Dokumen Lengkap *</label>
                <input
                  type="text"
                  required
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="Contoh: Shop Drawing Pembesian Kolom K1 & Balok B1 Lantai 1"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* File Type */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Tipe Format Berkas</label>
                  <select
                    value={uploadForm.fileType}
                    onChange={(e) => setUploadForm({ ...uploadForm, fileType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500 font-mono"
                  >
                    <option value="pdf">PDF Document (.pdf)</option>
                    <option value="image">Gambar / Foto Desain (.png, .jpg, .webp)</option>
                    <option value="dwg">AutoCAD Drawing (.dwg)</option>
                    <option value="xlsx">Excel Spreadsheet (.xlsx)</option>
                    <option value="docx">Word Document (.docx)</option>
                  </select>
                </div>

                {/* Version */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Nomor Versi / Revisi</label>
                  <input
                    type="text"
                    value={uploadForm.version}
                    onChange={(e) => setUploadForm({ ...uploadForm, version: e.target.value })}
                    placeholder="Contoh: Rev.01, v1.0"
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Confidentiality */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300">Hak Akses / Kerahasiaan</label>
                  <select
                    value={uploadForm.confidentiality}
                    onChange={(e) => setUploadForm({ ...uploadForm, confidentiality: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Semua Pihak (Publik Proyek)">Semua Pihak (Publik Proyek)</option>
                    <option value="Khusus Tripartit (Owner-MK-Kontraktor)">Khusus Tripartit</option>
                    <option value="Rahasia (Owner & Konsultan MK)">Rahasia (Owner-MK)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Deskripsi / Catatan Teknis</label>
                <textarea
                  rows={3}
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Uraikan rincian teknis, referensi sektor pekerjaan, atau catatan penting terkait dokumen ini..."
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Tag & Label (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={uploadForm.tagsInput}
                  onChange={(e) => setUploadForm({ ...uploadForm, tagsInput: e.target.value })}
                  placeholder="Contoh: Struktur, Sektor 3, Pembesian, Termin 2"
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/25 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Simpan & Terbitkan Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Hapus Dokumen Proyek?</h3>
              <p className="text-xs text-slate-400">
                Tindakan ini akan menghapus arsip dokumen dari repositori dan tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const targetDoc = documents.find((d) => d.id === deleteConfirmId);
                  onDeleteDocument(deleteConfirmId);
                  onAddAuditLog?.('Hapus Dokumen Proyek', `Menghapus arsip ${targetDoc?.documentNumber || deleteConfirmId}`);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Ya, Hapus Dokumen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
