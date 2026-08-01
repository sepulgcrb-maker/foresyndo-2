export type UserRole = 'Direktur' | 'Site Manager' | 'Admin' | 'Viewer';

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
