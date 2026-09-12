export type UserRole =
  | 'Owner'
  | 'Konsultan'
  | 'Kontraktor'
  | 'Direktur'
  | 'Site Manager'
  | 'Admin'
  | 'Viewer';

export type ActiveTab =
  | 'dashboard'
  | 'schedule'
  | 'calendar'
  | 'scurve'
  | 'gantt'
  | 'daily'
  | 'photos'
  | 'termin'
  | 'materials'
  | 'workforce'
  | 'equipment'
  | 'documents'
  | 'reports'
  | 'inspection';

export interface RolePermissions {
  canApproveTermin: boolean; // Pengesahan pencairan dana termin
  canVerifyOpname: boolean; // Verifikasi fisik/opname lapangan
  canSubmitTermin: boolean; // Pengajuan tagihan klaim termin
  canEditSchedule: boolean; // Perubahan jadwal / Time Schedule
  canInputDailyLog: boolean; // Pengisian laporan harian pekerjaan
  canManageMaterial: boolean; // Penerimaan & input stok material
  canManageWorkers: boolean; // Roster & alokasi tenaga kerja
  canManageEquipment: boolean; // Monitoring alat berat
  canConductQCInspection: boolean; // Audit mutu & inspeksi checklist
  canCreatePunchList: boolean; // Penerbitan defect / punch list
  canApproveBAST: boolean; // Pengesahan BAST Serah Terima
  canUploadDocumentation: boolean; // Upload foto dokumentasi progres
  canExportOfficialReports: boolean; // Ekspor laporan PDF / Excel
  canEditProjectBudget: boolean; // Modifikasi RAB & nilai kontrak
  canUploadDocuments: boolean; // Unggah dokumen kontrak, gambar, notulen
  canApproveDocuments: boolean; // Verifikasi & persetujuan dokumen teknis/drawing
  canDeleteDocuments: boolean; // Menghapus dokumen dari repositori proyek
  allowedTabs: ActiveTab[]; // Daftar modul navigasi yang diizinkan untuk diakses
}

export type StakeholderRoleKey = 'Owner' | 'Konsultan' | 'Kontraktor' | 'Viewer';

export interface StakeholderRoleProfile {
  role: StakeholderRoleKey;
  roleName: string; // e.g. "Pemilik Proyek (Owner)", "Konsultan Pengawas / MK", "Kontraktor Pelaksana"
  company: string; // Nama badan usaha / entitas resmi
  personName: string; // Nama personil penanggung jawab + gelar
  position: string; // Jabatan resmi (e.g. Direktur Utama, Team Leader MK, Site Manager)
  email: string;
  phone: string;
  skNumber?: string; // No. SK Penunjukan / Izin Usaha Jasa Konstruksi (IUJK)
  digitalSignatureActive: boolean;
  avatarUrl?: string;
  permissions: RolePermissions;
}

export interface ProjectInfo {
  id: string;
  name: string;
  owner: string;
  location: string;
  contractValue: number; // in IDR, e.g. 14406200000
  startDate: string; // ISO date '2026-09-01'
  targetEndDate: string; // ISO date '2027-06-01'
  status: 'Belum Mulai' | 'Perencanaan' | 'Berjalan' | 'Selesai' | 'Ditunda';
  logoUrl?: string;
  contractNumber: string;
  contractor: string;
  director?: string; // Direktur Utama
  siteManager?: string; // Site Manager / Kepala Proyek
  qcEngineer?: string; // Lead QC Engineer / Pengawas Mutu
  financeAdmin?: string; // Admin Logistik & Keuangan
  inspector?: string; // Konsultan Pengawas / Tamu Pengawas
  consultantMK?: string; // Konsultan Pengawas / Manajemen Konstruksi
  estimator?: string; // Lead Quantity Surveyor / Estimator RAB
  projectManager?: string; // Project Manager Lapangan
}

export type CategoryPekerjaan =
  | 'Persiapan'
  | 'Pondasi'
  | 'Struktur'
  | 'Kolom'
  | 'Balok'
  | 'Lantai'
  | 'Tangga'
  | 'Dinding'
  | 'Atap'
  | 'MEP'
  | 'Finishing'
  | 'Landscape'
  | 'Serah Terima';

export interface WorkItem {
  id: string;
  no: number;
  category: CategoryPekerjaan;
  name: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  bobotPercent: number; // weight % of contract value
  targetProgressPercent: number; // target % at current date
  realizedProgressPercent: number; // actual % progress
  volumeTarget: number;
  volumeRealized: number;
  unit: string;
  status: 'Belum Mulai' | 'Berjalan' | 'Terlambat' | 'Selesai';
  notes: string;
  updatedAt: string;
}

export type PhotoCategory =
  | 'Pondasi'
  | 'Struktur'
  | 'Lantai'
  | 'Atap'
  | 'Finishing'
  | 'MEP'
  | 'Progress Hari Ini';

export interface PhotoItem {
  id: string;
  date: string;
  category: PhotoCategory;
  title: string;
  url: string;
  uploadedBy: string;
  notes?: string;
}

export type WeatherCondition = 'Cerah' | 'Berawan' | 'Hujan Gerimis' | 'Hujan Lebat';

export interface DailyLog {
  id: string;
  date: string;
  weather: WeatherCondition;
  workerCount: number;
  mandorName: string;
  activitySummary: string;
  volumeDone: string;
  photos: string[];
  notes: string;
  createdBy: string;
}

export interface PaymentTerm {
  termNumber: number; // 1 to 5
  title: string;
  targetProgressPercent: number; // 25, 50, 75, 100, retention
  termValuePercent: number; // 25% or 5%
  grossValue: number; // termValuePercent * totalContract
  retentionPercent: number; // 5%
  retentionValue: number; // 5% of grossValue
  netPayableValue: number; // grossValue - retentionValue (or full retention release for term 5)
  status: 'Belum Dibayar' | 'Menunggu Approval' | 'Dibayar';
  paymentDate?: string;
  proofUrl?: string;
  notes?: string;
  approvedBy?: string;
}

export interface MaterialItem {
  id: string;
  name: string;
  volumeTotal: number;
  volumeUsed: number;
  unit: string;
  pricePerUnit: number;
  supplier: string;
  arrivalDate: string;
  usageDate?: string;
  stockRemaining: number;
  minAlertStock: number;
  leadTimeDays?: number;
  dailyBurnRate?: number;
  relatedSectorNos?: number[];
  category?: string;
}

export interface MaterialProjection {
  materialId: string;
  materialName: string;
  unit: string;
  pricePerUnit: number;
  supplier: string;
  currentStock: number;
  minAlertStock: number;
  leadTimeDays: number;
  dailyBurnRate: number;
  relatedWorkItemNames: string[];
  relatedSectors: string[];
  avgRemainingProgressPercent: number;
  projectedTotalDemand: number;
  projectedRemainingDemand: number;
  stockDifference: number; // positive = surplus, negative = deficit
  isDeficit: boolean;
  shortageQuantity: number;
  shortageCostIDR: number;
  daysOfStockRemaining: number; // days until stockout at current burn rate
  estimatedStockoutDate: string;
  recommendedOrderDate: string;
  urgencyStatus: 'Kritis' | 'Waspada' | 'Aman';
  urgencyReason: string;
  recommendedOrderQuantity: number;
}

export interface MaterialProjectionConfig {
  speedMultiplier: number; // e.g. 1.0 (normal), 1.25, 1.5 (lembur/rush)
  wasteContingencyPercent: number; // e.g. 5%
  alertThresholdDays: number; // e.g. 14 days
}

export interface WorkerAllocation {
  id: string;
  workerId: string;
  workerName: string;
  workerRole: string;
  workItemId: string;
  workItemName: string;
  workItemCategory?: string;
  allocatedHours: number;
  assignedDate: string;
  targetOutput: number;
  actualOutput: number;
  unit: string;
  status: 'Dalam Pengerjaan' | 'Selesai' | 'Di Bawah Target' | 'Tertunda';
  notes?: string;
}

export interface WorkerItem {
  id: string;
  name: string;
  role: string; // e.g. Mandor, Tukang Batu, Pekerja, Safety
  dailyWage: number;
  daysWorked: number;
  status: 'Aktif' | 'Cuti' | 'Non-Aktif';
}

export interface DailyAttendance {
  id: string;
  date: string;
  workerId: string;
  workerName: string;
  role: string;
  isPresent: boolean;
  overtimeHours: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  condition: 'Baik' | 'Perlu Maintenance' | 'Rusak';
  operator: string;
  workHoursHM: number;
  lastMaintenance: string;
  notes: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
}

export interface NotificationItem {
  id: string;
  timestamp: string;
  type: 'warning' | 'alert' | 'reminder' | 'info';
  title: string;
  message: string;
  isRead: boolean;
}

export interface SCurveDataPoint {
  weekLabel: string;
  date: string;
  targetCumulativePercent: number;
  realizedCumulativePercent: number;
  deviationPercent: number;
}

export type CalendarEventType =
  | 'milestone'
  | 'payment'
  | 'inspection'
  | 'material'
  | 'meeting';

export type CalendarEventStatus = 'Kritis' | 'Mendatang' | 'Selesai' | 'Perlu Perhatian';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  endDate?: string;
  type: CalendarEventType;
  status: CalendarEventStatus;
  description?: string;
  location?: string;
  assignedRole?: string;
  isCustom?: boolean;
}

export type DocumentCategory =
  | 'contract' // Kontrak, SPK, Addendum, Syarat Teknis
  | 'drawing' // Gambar DED, Shop Drawing, As-Built Drawing
  | 'meeting_minute' // Notulen Rapat PCM, SCM, Site Coordination
  | 'legal_permit'; // IMB/PBG, Amdal, Legalitas, SK

export type DocumentStatus = 'Approved' | 'Review' | 'Draft' | 'Revision';

export type DocumentConfidentiality =
  | 'Semua Pihak (Publik Proyek)'
  | 'Khusus Tripartit (Owner-MK-Kontraktor)'
  | 'Rahasia (Owner & Konsultan MK)';

export interface DocumentReviewNote {
  id: string;
  authorName: string;
  authorRole: UserRole;
  timestamp: string;
  comment: string;
  statusChange?: DocumentStatus;
}

export interface ProjectDocument {
  id: string;
  title: string;
  documentNumber: string;
  category: DocumentCategory;
  fileType: 'pdf' | 'dwg' | 'xlsx' | 'docx';
  fileSize: string;
  fileName: string;
  fileUrl?: string;
  uploadDate: string; // YYYY-MM-DD
  uploadedBy: string;
  uploadedByRole: UserRole;
  version: string; // e.g. "v1.0", "Rev.02"
  status: DocumentStatus;
  description: string;
  tags: string[];
  confidentiality: DocumentConfidentiality;
  reviewNotes?: DocumentReviewNote[];
  signatories?: {
    role: StakeholderRoleKey;
    name: string;
    signed: boolean;
    signedAt?: string;
  }[];
}

export interface AuthAccount {
  role: StakeholderRoleKey;
  pin?: string;
  name: string;
  company: string;
  position: string;
  description: string;
  badgeColor: string;
}

export interface AuthSession {
  isAuthenticated: boolean;
  role: StakeholderRoleKey;
  userName: string;
  loginTime: string;
}

export type BASTWorkflowStage =
  | 'draft' // Kontraktor menyusun kelengkapan berkas
  | 'submitted' // Diajukan Kontraktor ke Konsultan MK
  | 'joint_inspection' // Opname Bersama & Pemeriksaan Cacat Mutu (MK)
  | 'mk_recommended' // Lulus evaluasi MK & rekomendasi diterbitkan
  | 'owner_approved' // Disetujui Owner / Pemberi Tugas
  | 'finalized'; // BAST-1 Sah Ditandatangani 3 Pihak (Tripartit)

export interface BASTAttachmentChecklist {
  id: string;
  name: string;
  description: string;
  fileReference?: string;
  isCompleted: boolean;
  verifiedByMK: boolean;
  required: boolean;
}

export interface BASTPunchListItem {
  id: string;
  sectorName: string;
  description: string;
  severity: 'Ringan' | 'Sedang' | 'Kritis';
  deadlineDate: string;
  isResolved: boolean;
  resolvedDate?: string;
  verifiedByMK: boolean;
  photoUrl?: string;
}

export interface BASTSubmissionData {
  submissionId: string;
  submissionNumber: string; // e.g. 042/FGI-KONT/BAST-1/IX/2026
  submissionDate: string;
  targetHandoverDate: string;
  contractorRepresentative: string;
  contractorPosition: string;
  contractorNotes: string;
  stage: BASTWorkflowStage;
  attachments: BASTAttachmentChecklist[];
  punchList: BASTPunchListItem[];
  mkRecommendationLetterNo?: string;
  mkRecommendationDate?: string;
  mkRecommendationNotes?: string;
  mkVerifiedBy?: string;
  ownerApprovalDate?: string;
  ownerApprovalNotes?: string;
  ownerApprovedBy?: string;
  bastNumber: string;
  title?: string;
  scopeDescription?: string;
  contractNominal?: number;
  handoverDate: string;
  maintenancePeriodDays: number;
  maintenanceEndDate: string;
  retentionPercent: number;
  retentionValue: number;
  contractorSignature: {
    signed: boolean;
    name: string;
    signedAt: string;
    signatureData: string;
  };
  mkSignature: {
    signed: boolean;
    name: string;
    signedAt: string;
    signatureData: string;
  };
  ownerSignature: {
    signed: boolean;
    name: string;
    signedAt: string;
    signatureData: string;
  };
  isCompleted: boolean;
}

