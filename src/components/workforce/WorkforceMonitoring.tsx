import React, { useState, useMemo } from 'react';
import { WorkerItem, WorkItem, WorkerAllocation, UserRole, RolePermissions, DailyAttendance } from '../../types';
import {
  Users,
  Plus,
  CheckCircle2,
  UserCheck,
  DollarSign,
  Calendar,
  Briefcase,
  Clock,
  TrendingUp,
  BarChart2,
  Target,
  Search,
  Trash2,
  Edit3,
  Filter,
  Layers,
  AlertTriangle,
  X,
  Award,
  ArrowUpRight,
  Sparkles,
  Flame,
  HardHat,
  Wrench,
  Shield,
  Zap,
  Calculator,
  Wallet,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Download,
  Sliders,
  Eye,
  RefreshCw,
  Info,
  FileSpreadsheet,
  Scan,
  QrCode,
  Printer,
} from 'lucide-react';
import { formatIDR } from '../../utils/calculations';
import { WorkforceHeatmap } from './WorkforceHeatmap';
import { WorkerQRScannerModal } from './WorkerQRScannerModal';
import { WorkerBadgeCardModal } from './WorkerBadgeCardModal';

interface WorkforceMonitoringProps {
  workers: WorkerItem[];
  workItems?: WorkItem[];
  allocations?: WorkerAllocation[];
  userRole: UserRole;
  permissions?: RolePermissions;
  onAddWorker: (w: Omit<WorkerItem, 'id'>) => void;
  onAddAllocation?: (a: Omit<WorkerAllocation, 'id'>) => void;
  onUpdateAllocation?: (a: WorkerAllocation) => void;
  onDeleteAllocation?: (id: string) => void;
}

export const WorkforceMonitoring: React.FC<WorkforceMonitoringProps> = ({
  workers,
  workItems = [],
  allocations = [],
  userRole,
  permissions,
  onAddWorker,
  onAddAllocation,
  onUpdateAllocation,
  onDeleteAllocation,
}) => {
  // Main Sub-Tab State: 'allocation' | 'heatmap' | 'roster'
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'allocation' | 'heatmap'>('allocation');

  // Allocation View Mode: 'table' | 'matrix' | 'heatmap'
  const [allocationViewMode, setAllocationViewMode] = useState<'table' | 'matrix' | 'heatmap'>('table');

  // Search & Filters for Allocation
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkItemFilter, setSelectedWorkItemFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modal States
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<WorkerAllocation | null>(null);

  // QR Code Scanner & Badge Modal States
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [selectedBadgeWorker, setSelectedBadgeWorker] = useState<WorkerItem | null>(null);

  // Today's Date String
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Daily Attendances State (Persistent in localStorage per date)
  const [dailyAttendances, setDailyAttendances] = useState<DailyAttendance[]>(() => {
    try {
      const saved = localStorage.getItem(`FORESYNDO_ATTENDANCE_${new Date().toISOString().split('T')[0]}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    // Default initial attendance seeded from workers (mark first 4 as present)
    return workers.map((w, idx) => ({
      id: `ATT-${w.id}-${new Date().toISOString().split('T')[0]}`,
      date: new Date().toISOString().split('T')[0],
      workerId: w.id,
      workerName: w.name,
      role: w.role,
      isPresent: idx < 4,
      overtimeHours: 0,
      checkInTime: idx < 4 ? '07:45 WIB' : undefined,
      scanMethod: idx < 4 ? 'qr_scanner' : undefined,
    }));
  });

  // Handler for validating attendance via QR Code Scanner or direct action
  const handleValidateAttendance = (
    workerId: string,
    checkInTimeStr?: string,
    customNote?: string
  ) => {
    const matchedWorker = workers.find((w) => w.id === workerId);
    if (!matchedWorker) {
      return { isNewCheckIn: false, error: 'Pekerja tidak ditemukan dalam daftar proyek' };
    }

    const now = new Date();
    const timeFormatted =
      checkInTimeStr ||
      `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} WIB`;

    // Check if worker has an allocation
    const workerAlloc = allocations.find((a) => a.workerId === workerId);

    // Update allocation if handler provided
    if (workerAlloc && onUpdateAllocation) {
      onUpdateAllocation({
        ...workerAlloc,
        isValidatedByQR: true,
        qrValidatedAt: timeFormatted,
        status: workerAlloc.status === 'Tertunda' ? 'Dalam Pengerjaan' : workerAlloc.status,
      });
    }

    let isNew = true;
    setDailyAttendances((prev) => {
      const existing = prev.find((a) => a.workerId === workerId);
      let updated: DailyAttendance[];
      if (existing) {
        isNew = !existing.isPresent;
        updated = prev.map((a) =>
          a.workerId === workerId
            ? {
                ...a,
                isPresent: true,
                checkInTime: a.checkInTime || timeFormatted,
                scanMethod: 'qr_scanner',
                validatedAllocationId: workerAlloc?.id,
                validatedWorkItemName: workerAlloc?.workItemName,
                notes: customNote || a.notes,
              }
            : a
        );
      } else {
        updated = [
          ...prev,
          {
            id: `ATT-${workerId}-${todayStr}`,
            date: todayStr,
            workerId: workerId,
            workerName: matchedWorker.name,
            role: matchedWorker.role,
            isPresent: true,
            overtimeHours: 0,
            checkInTime: timeFormatted,
            scanMethod: 'qr_scanner',
            validatedAllocationId: workerAlloc?.id,
            validatedWorkItemName: workerAlloc?.workItemName,
            notes: customNote,
          },
        ];
      }

      try {
        localStorage.setItem(`FORESYNDO_ATTENDANCE_${todayStr}`, JSON.stringify(updated));
      } catch {
        // Fallback
      }

      return updated;
    });

    return {
      worker: matchedWorker,
      allocation: workerAlloc,
      isNewCheckIn: isNew,
    };
  };

  // New Worker Form
  const [newWorker, setNewWorker] = useState<Omit<WorkerItem, 'id'>>({
    name: '',
    role: 'Tukang Batu',
    dailyWage: 170000,
    daysWorked: 1,
    status: 'Aktif',
  });

  // New Allocation Form
  const [newAlloc, setNewAlloc] = useState<Omit<WorkerAllocation, 'id'>>({
    workerId: workers[0]?.id || '',
    workerName: workers[0]?.name || '',
    workerRole: workers[0]?.role || '',
    workItemId: workItems[0]?.id || '',
    workItemName: workItems[0]?.name || '',
    workItemCategory: workItems[0]?.category || 'Struktur',
    allocatedHours: 8,
    assignedDate: new Date().toISOString().split('T')[0],
    targetOutput: 20,
    actualOutput: 18,
    unit: 'm²',
    status: 'Dalam Pengerjaan',
    notes: '',
  });

  const canEdit =
    permissions?.canManageWorkers ??
    (userRole === 'Kontraktor' ||
      userRole === 'Konsultan' ||
      userRole === 'Owner' ||
      userRole === 'Site Manager' ||
      userRole === 'Direktur' ||
      userRole === 'Admin');

  // Role Filter & Wage Simulation for Roster and Allocation
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [wageProjectionDays, setWageProjectionDays] = useState<number>(1);
  const [isRoleSummaryExpanded, setIsRoleSummaryExpanded] = useState<boolean>(true);
  const [copiedPayrollToast, setCopiedPayrollToast] = useState<boolean>(false);
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(false);

  // Roster Calculations
  const totalDailyPayroll = workers.reduce((acc, w) => acc + (w.status === 'Aktif' ? w.dailyWage : 0), 0);
  const totalAccumulatedPayroll = workers.reduce(
    (acc, w) => acc + (w.dailyWage || 0) * (w.daysWorked || 0),
    0
  );

  // Helper to categorize roles dynamically
  const getRoleCategory = (roleName: string): 'Mandor' | 'Tukang' | 'Helper' | 'Teknisi' | 'Lainnya' => {
    const r = (roleName || '').toLowerCase();
    if (r.includes('mandor')) return 'Mandor';
    if (r.includes('tukang')) return 'Tukang';
    if (
      r.includes('helper') ||
      r.includes('pembantu') ||
      r.includes('kenek') ||
      r.includes('buruh') ||
      r.includes('laden') ||
      r.includes('kuli')
    )
      return 'Helper';
    if (
      r.includes('teknisi') ||
      r.includes('mep') ||
      r.includes('listrik') ||
      r.includes('plumbing') ||
      r.includes('las') ||
      r.includes('operator') ||
      r.includes('surveyor') ||
      r.includes('drafter')
    )
      return 'Teknisi';
    return 'Lainnya';
  };

  // Real-time Role Breakdown & Wage Calculations
  const roleBreakdown = useMemo(() => {
    type RoleGroupData = {
      category: 'Mandor' | 'Tukang' | 'Helper' | 'Teknisi' | 'Lainnya';
      title: string;
      desc: string;
      totalCount: number;
      activeCount: number;
      cutiCount: number;
      nonAktifCount: number;
      allocatedCount: number;
      totalDailyWage: number;
      avgDailyWage: number;
      minDailyWage: number;
      maxDailyWage: number;
      totalAccumulatedWage: number;
      workers: WorkerItem[];
      roles: string[];
    };

    const groups: Record<'Mandor' | 'Tukang' | 'Helper' | 'Teknisi' | 'Lainnya', RoleGroupData> = {
      Mandor: {
        category: 'Mandor',
        title: 'Mandor',
        desc: 'Pengawas teknis lapangan & koordinasi kru',
        totalCount: 0,
        activeCount: 0,
        cutiCount: 0,
        nonAktifCount: 0,
        allocatedCount: 0,
        totalDailyWage: 0,
        avgDailyWage: 0,
        minDailyWage: 0,
        maxDailyWage: 0,
        totalAccumulatedWage: 0,
        workers: [],
        roles: [],
      },
      Tukang: {
        category: 'Tukang',
        title: 'Tukang (Ahli)',
        desc: 'Tenaga ahli spesialis batu, besi, cor, kayu',
        totalCount: 0,
        activeCount: 0,
        cutiCount: 0,
        nonAktifCount: 0,
        allocatedCount: 0,
        totalDailyWage: 0,
        avgDailyWage: 0,
        minDailyWage: 0,
        maxDailyWage: 0,
        totalAccumulatedWage: 0,
        workers: [],
        roles: [],
      },
      Helper: {
        category: 'Helper',
        title: 'Helper / Kenek',
        desc: 'Pekerja pembantu & lansir material lapangan',
        totalCount: 0,
        activeCount: 0,
        cutiCount: 0,
        nonAktifCount: 0,
        allocatedCount: 0,
        totalDailyWage: 0,
        avgDailyWage: 0,
        minDailyWage: 0,
        maxDailyWage: 0,
        totalAccumulatedWage: 0,
        workers: [],
        roles: [],
      },
      Teknisi: {
        category: 'Teknisi',
        title: 'Teknisi & MEP',
        desc: 'Spesialis instalasi kelistrikan & pemipaan',
        totalCount: 0,
        activeCount: 0,
        cutiCount: 0,
        nonAktifCount: 0,
        allocatedCount: 0,
        totalDailyWage: 0,
        avgDailyWage: 0,
        minDailyWage: 0,
        maxDailyWage: 0,
        totalAccumulatedWage: 0,
        workers: [],
        roles: [],
      },
      Lainnya: {
        category: 'Lainnya',
        title: 'Peran Lainnya',
        desc: 'Tenaga operasional tambahan lainnya',
        totalCount: 0,
        activeCount: 0,
        cutiCount: 0,
        nonAktifCount: 0,
        allocatedCount: 0,
        totalDailyWage: 0,
        avgDailyWage: 0,
        minDailyWage: 0,
        maxDailyWage: 0,
        totalAccumulatedWage: 0,
        workers: [],
        roles: [],
      },
    };

    const allocatedWorkerIds = new Set(allocations.map((a) => a.workerId));

    workers.forEach((w) => {
      const cat = getRoleCategory(w.role);
      const grp = groups[cat];
      grp.totalCount += 1;
      if (w.status === 'Aktif') {
        grp.activeCount += 1;
        grp.totalDailyWage += w.dailyWage;
        if (grp.minDailyWage === 0 || w.dailyWage < grp.minDailyWage) {
          grp.minDailyWage = w.dailyWage;
        }
        if (w.dailyWage > grp.maxDailyWage) {
          grp.maxDailyWage = w.dailyWage;
        }
      } else if (w.status === 'Cuti') {
        grp.cutiCount += 1;
      } else {
        grp.nonAktifCount += 1;
      }
      if (allocatedWorkerIds.has(w.id)) {
        grp.allocatedCount += 1;
      }
      grp.totalAccumulatedWage += w.dailyWage * (w.daysWorked || 0);
      grp.workers.push(w);
      if (!grp.roles.includes(w.role)) {
        grp.roles.push(w.role);
      }
    });

    Object.values(groups).forEach((grp) => {
      grp.avgDailyWage = grp.activeCount > 0 ? Math.round(grp.totalDailyWage / grp.activeCount) : 0;
    });

    // Return active groups, excluding 'Lainnya' if empty
    return Object.values(groups).filter(
      (g) => g.totalCount > 0 || g.category !== 'Lainnya'
    );
  }, [workers, allocations]);

  // Filtered Roster Workers based on selectedRoleFilter
  const filteredRosterWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (selectedRoleFilter === 'ALL') return true;
      return getRoleCategory(w.role) === selectedRoleFilter;
    });
  }, [workers, selectedRoleFilter]);

  // Allocation Calculations & Analytics
  const activeWorkerCount = workers.filter((w) => w.status === 'Aktif').length;
  const uniqueAllocatedWorkerIds = new Set(allocations.map((a) => a.workerId));
  const assignedWorkerCount = uniqueAllocatedWorkerIds.size;

  const totalTargetOutputSum = allocations.reduce((sum, a) => sum + (a.targetOutput || 0), 0);
  const totalActualOutputSum = allocations.reduce((sum, a) => sum + (a.actualOutput || 0), 0);

  const avgProductivityPercent =
    allocations.length > 0
      ? Math.round(
          allocations.reduce((sum, a) => {
            const score = a.targetOutput > 0 ? (a.actualOutput / a.targetOutput) * 100 : 100;
            return sum + score;
          }, 0) / allocations.length
        )
      : 100;

  const assignedWorkItemsCount = new Set(allocations.map((a) => a.workItemId)).size;

  // Filtered Allocations
  const filteredAllocations = allocations.filter((a) => {
    const matchesSearch =
      a.workerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.workerRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.workItemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.notes && a.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesWorkItem = selectedWorkItemFilter === 'ALL' || a.workItemId === selectedWorkItemFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || a.status === selectedStatusFilter;
    const matchesRole = selectedRoleFilter === 'ALL' || getRoleCategory(a.workerRole) === selectedRoleFilter;

    return matchesSearch && matchesWorkItem && matchesStatus && matchesRole;
  });

  // Copy Payroll Summary Text (for WA/Messages)
  const handleCopyPayrollSummary = () => {
    const lines = [
      `📋 REKAPITULASI UPAH TENAGA KERJA (REAL-TIME)`,
      `Proyek: Pembangunan Gedung 7 Lantai (Foresyndo 2)`,
      `Pemilik Proyek (Owner): PT. FORESYNDO GLOBAL INDONESIA`,
      `Direktur Utama (Owner): HASANUDIN`,
      `Kontraktor Pelaksana: PT. GONG MBE LINK PAMUNGKAS`,
      `Periode Simulasi: ${wageProjectionDays} Hari Kerja`,
      `Tanggal: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`,
      ``,
      `--- RINCIAN PER PERAN ---`,
    ];

    roleBreakdown.forEach((grp, idx) => {
      const projected = grp.totalDailyWage * wageProjectionDays;
      lines.push(
        `${idx + 1}. ${grp.title.toUpperCase()} (${grp.activeCount} Personil Aktif / ${grp.totalCount} Terdaftar):`
      );
      lines.push(`   - Tarif Upah Rata-rata : ${formatIDR(grp.avgDailyWage)}/hari`);
      lines.push(`   - Subtotal Upah Harian : ${formatIDR(grp.totalDailyWage)}/hari`);
      lines.push(`   - Estimasi Upah (${wageProjectionDays} Hari) : ${formatIDR(projected)}`);
      lines.push(`   - Personel : ${grp.workers.map((w) => w.name).join(', ') || '-'}`);
      lines.push(``);
    });

    const grandTotalProjected = totalDailyPayroll * wageProjectionDays;
    lines.push(`--- TOTAL KONSOLIDASI ---`);
    lines.push(`Total Tenaga Kerja Aktif : ${activeWorkerCount} Orang`);
    lines.push(`Total Upah Harian Proyek : ${formatIDR(totalDailyPayroll)}/hari`);
    lines.push(`💰 TOTAL ESTIMASI PAYROLL (${wageProjectionDays} HARI) : ${formatIDR(grandTotalProjected)}`);
    lines.push(``);
    lines.push(`*Dihitung otomatis secara real-time dari Sistem Monitoring Tenaga Kerja`);

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedPayrollToast(true);
    setTimeout(() => setCopiedPayrollToast(false), 3000);
  };

  // Export Payroll Summary to CSV
  const handleExportPayrollCSV = () => {
    const csvRows: (string | number)[][] = [
      ['\uFEFFREKAPITULASI UPAH TENAGA KERJA BERDASARKAN PERAN (REAL-TIME)'],
      ['Proyek', 'Pembangunan Gedung 7 Lantai (Foresyndo 2)'],
      ['Pemilik Proyek (Owner)', 'PT. FORESYNDO GLOBAL INDONESIA'],
      ['Direktur Utama (Owner)', 'HASANUDIN'],
      ['Kontraktor Pelaksana', 'PT. GONG MBE LINK PAMUNGKAS'],
      ['Tanggal Ekspor', new Date().toLocaleString('id-ID')],
      ['Simulasi Periode Hari', `${wageProjectionDays} Hari Kerja`],
      [],
      [
        'Kategori Peran',
        'Personel Terdaftar',
        'Personel Aktif',
        'Personel Cuti/Nonaktif',
        'Personel Dialokasikan',
        'Tarif Rata-rata/Hari (IDR)',
        'Upah Harian 1 Hari (IDR)',
        `Estimasi Upah ${wageProjectionDays} Hari (IDR)`,
        'Upah Mingguan 6 Hari (IDR)',
        'Upah Bulanan 25 Hari (IDR)',
        'Porsi Tenaga Kerja (%)',
        'Porsi Beban Upah (%)',
        'Daftar Personel',
      ],
    ];

    roleBreakdown.forEach((grp) => {
      const headcountShare = (
        (grp.totalCount / (workers.length || 1)) *
        100
      ).toFixed(1);
      const payrollShare =
        totalDailyPayroll > 0
          ? ((grp.totalDailyWage / totalDailyPayroll) * 100).toFixed(1)
          : '0';

      csvRows.push([
        `"${grp.title}"`,
        grp.totalCount,
        grp.activeCount,
        grp.cutiCount + grp.nonAktifCount,
        grp.allocatedCount,
        grp.avgDailyWage,
        grp.totalDailyWage,
        grp.totalDailyWage * wageProjectionDays,
        grp.totalDailyWage * 6,
        grp.totalDailyWage * 25,
        `"${headcountShare}%"`,
        `"${payrollShare}%"`,
        `"${grp.workers.map((w) => w.name).join('; ')}"`,
      ]);
    });

    csvRows.push([]);
    csvRows.push([
      '"TOTAL KONSOLIDASI"',
      workers.length,
      activeWorkerCount,
      workers.length - activeWorkerCount,
      assignedWorkerCount,
      Math.round(totalDailyPayroll / (activeWorkerCount || 1)),
      totalDailyPayroll,
      totalDailyPayroll * wageProjectionDays,
      totalDailyPayroll * 6,
      totalDailyPayroll * 25,
      '"100%"',
      '"100%"',
      '""',
    ]);

    const csvContent = csvRows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Rekapitulasi_Upah_Tenaga_Kerja_${wageProjectionDays}Hari_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handlers
  const handleAddWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorker.name) return;
    onAddWorker(newWorker);
    setIsWorkerModalOpen(false);
    setNewWorker({
      name: '',
      role: 'Tukang Batu',
      dailyWage: 170000,
      daysWorked: 1,
      status: 'Aktif',
    });
  };

  const handleOpenAllocModal = (preselectedWorkItemId?: string, preselectedDate?: string) => {
    if (workers.length > 0 && workItems.length > 0) {
      const selectedWorker = workers[0];
      const selectedItem = preselectedWorkItemId
        ? workItems.find((w) => w.id === preselectedWorkItemId) || workItems[0]
        : workItems[0];
      setNewAlloc({
        workerId: selectedWorker.id,
        workerName: selectedWorker.name,
        workerRole: selectedWorker.role,
        workItemId: selectedItem.id,
        workItemName: selectedItem.name,
        workItemCategory: selectedItem.category,
        allocatedHours: 8,
        assignedDate: preselectedDate || new Date().toISOString().split('T')[0],
        targetOutput: 20,
        actualOutput: 18,
        unit: selectedItem.unit === 'Rp' ? 'm²' : selectedItem.unit || 'm²',
        status: 'Dalam Pengerjaan',
        notes: '',
      });
    }
    setIsAllocModalOpen(true);
  };

  const handleWorkerSelectInModal = (workerId: string) => {
    const w = workers.find((item) => item.id === workerId);
    if (w) {
      setNewAlloc((prev) => ({
        ...prev,
        workerId: w.id,
        workerName: w.name,
        workerRole: w.role,
      }));
    }
  };

  const handleWorkItemSelectInModal = (workItemId: string) => {
    const item = workItems.find((w) => w.id === workItemId);
    if (item) {
      setNewAlloc((prev) => ({
        ...prev,
        workItemId: item.id,
        workItemName: item.name,
        workItemCategory: item.category,
        unit: item.unit === 'Rp' ? 'm²' : item.unit || 'm²',
      }));
    }
  };

  const handleAllocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddAllocation) return;

    // Determine automatic status based on productivity ratio if not set
    const ratio = newAlloc.targetOutput > 0 ? newAlloc.actualOutput / newAlloc.targetOutput : 1;
    let autoStatus = newAlloc.status;
    if (autoStatus !== 'Selesai' && autoStatus !== 'Tertunda') {
      if (ratio >= 0.95) autoStatus = 'Dalam Pengerjaan';
      else autoStatus = 'Di Bawah Target';
    }

    onAddAllocation({
      ...newAlloc,
      status: autoStatus,
    });

    setIsAllocModalOpen(false);
  };

  const handleSaveEditAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAllocation || !onUpdateAllocation) return;

    const ratio =
      editingAllocation.targetOutput > 0
        ? editingAllocation.actualOutput / editingAllocation.targetOutput
        : 1;

    let autoStatus = editingAllocation.status;
    if (autoStatus !== 'Selesai' && autoStatus !== 'Tertunda') {
      if (ratio >= 0.95) autoStatus = 'Dalam Pengerjaan';
      else autoStatus = 'Di Bawah Target';
    }

    onUpdateAllocation({
      ...editingAllocation,
      status: autoStatus,
    });

    setEditingAllocation(null);
  };

  // Helper for productivity badge styling
  const getProductivityBadge = (target: number, actual: number) => {
    if (target <= 0) return { label: 'N/A', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    const score = Math.round((actual / target) * 100);
    if (score >= 105) {
      return { label: `${score}% - Produktif Tinggi`, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' };
    } else if (score >= 90) {
      return { label: `${score}% - Sesuai Target`, color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' };
    } else {
      return { label: `${score}% - Di Bawah Target`, color: 'bg-red-500/10 text-red-500 border-red-500/30' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Monitoring Tenaga Kerja &amp; Alokasi
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold text-[10px] border border-orange-500/20">
                  PRODUCTIVITY-ENGINE
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pengelolaan mandor, tukang, alokasi per item pekerjaan Time Schedule, serta analisis produktivitas tenaga kerja
          </p>
        </div>

        {/* Top Sub-Tab Navigation */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setActiveSubTab('allocation')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'allocation'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Alokasi &amp; Produktivitas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white/20 text-white">
              {allocations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('heatmap')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'heatmap'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-300" />
            <span>Heatmap Kepadatan (30 Hari)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Bottlenecks
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('roster')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'roster'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Roster &amp; Daftar Pekerja</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {workers.length}
            </span>
          </button>

          {/* Quick QR Attendance Action Group */}
          <div className="flex items-center gap-1.5 pl-1 sm:border-l border-slate-200 dark:border-slate-700/80">
            <button
              type="button"
              onClick={() => setIsQRScannerOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
              title="Buka Pemindai QR Code untuk Absensi Harian & Validasi Alokasi Otomatis"
            >
              <Scan className="w-4 h-4" />
              <span>Scan QR Absensi</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white/20 text-white">
                {dailyAttendances.filter((a) => a.isPresent).length}/{workers.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedBadgeWorker(null);
                setIsBadgeModalOpen(true);
              }}
              className="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Cetak Kartu Tanda Pengenal ID Badge & QR Code Pekerja"
            >
              <Printer className="w-4 h-4 text-orange-500" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KARTU RINGKASAN PEMBAGIAN PEKERJA BERDASARKAN PERAN & KALKULASI UPAH (REAL-TIME) */}
      {/* ========================================================================= */}
      {activeSubTab !== 'heatmap' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
          {/* Header with Title, Period Switcher, and Action Controls */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-black shadow-lg shadow-orange-500/20 shrink-0">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Ringkasan Tenaga Kerja Berdasarkan Peran &amp; Kalkulator Upah
                  </h3>
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    REAL-TIME PAYROLL
                  </span>
                  {selectedRoleFilter !== 'ALL' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white flex items-center gap-1">
                      Filter: {selectedRoleFilter}
                      <button
                        type="button"
                        onClick={() => setSelectedRoleFilter('ALL')}
                        className="ml-0.5 hover:text-black font-black cursor-pointer"
                        title="Reset filter peran"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pembagian personil Tukang, Helper, Mandor, dan Teknisi secara otomatis untuk mempermudah perhitungan upah harian, mingguan, maupun bulanan proyek.
                </p>
              </div>
            </div>

            {/* Right Controls: Period Selector & Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start xl:self-center">
              {/* Wage Projection Days Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1 hidden sm:flex">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  Periode:
                </span>
                {[
                  { label: '1 Hari (Harian)', days: 1 },
                  { label: '6 Hari (Mingguan)', days: 6 },
                  { label: '14 Hari (2 Minggu)', days: 14 },
                  { label: '25 Hari (Bulanan)', days: 25 },
                ].map((p) => (
                  <button
                    key={p.days}
                    type="button"
                    onClick={() => setWageProjectionDays(p.days)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                      wageProjectionDays === p.days
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}

                {/* Custom Days Input Stepper */}
                <div className="flex items-center pl-1 sm:pl-2 border-l border-slate-300 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setWageProjectionDays((prev) => Math.max(1, prev - 1))}
                    className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                    title="Kurangi 1 hari"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={wageProjectionDays}
                    onChange={(e) => setWageProjectionDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-10 text-center font-mono font-black text-xs bg-transparent text-slate-900 dark:text-white outline-none"
                    title="Ketik jumlah hari kustom"
                  />
                  <span className="text-[10px] text-slate-400 mr-1">hr</span>
                  <button
                    type="button"
                    onClick={() => setWageProjectionDays((prev) => prev + 1)}
                    className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer"
                    title="Tambah 1 hari"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons: Copy, Export, Formula, Collapse */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyPayrollSummary}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    copiedPayrollToast
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                  title="Salin ringkasan upah ke clipboard untuk dibagikan via WhatsApp"
                >
                  {copiedPayrollToast ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedPayrollToast ? 'Tersalin!' : 'Salin Rekap (WA)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportPayrollCSV}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Unduh data perhitungan upah per peran sebagai file CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Unduh CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFormulaDetails((prev) => !prev)}
                  className={`p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                    showFormulaDetails
                      ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                  title="Tampilkan rincian rumus perhitungan"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsRoleSummaryExpanded((prev) => !prev)}
                  className="p-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                  title={isRoleSummaryExpanded ? 'Ciutkan kartu ringkasan' : 'Buka kartu ringkasan'}
                >
                  {isRoleSummaryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Copy Toast Alert */}
          {copiedPayrollToast && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                <strong>Berhasil disalin!</strong> Teks ringkasan upah ({wageProjectionDays} Hari Kerja) untuk Mandor, Tukang, dan Helper siap ditempel (paste) di WhatsApp atau dokumen proyek.
              </span>
            </div>
          )}

          {/* Expanded Content: 5 Role Summary Cards Grid */}
          {isRoleSummaryExpanded ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                {roleBreakdown.map((grp) => {
                  const isSelected = selectedRoleFilter === grp.category;
                  const projectedWage = grp.totalDailyWage * wageProjectionDays;
                  const headcountShare = (
                    (grp.totalCount / (workers.length || 1)) *
                    100
                  ).toFixed(0);
                  const payrollShare =
                    totalDailyPayroll > 0
                      ? ((grp.totalDailyWage / totalDailyPayroll) * 100).toFixed(0)
                      : '0';

                  // Style configs by role
                  const styleConfig = {
                    Mandor: {
                      badgeBg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
                      border: 'border-purple-200 dark:border-purple-900/60',
                      cardBg: 'bg-gradient-to-b from-purple-500/5 to-white dark:from-purple-950/20 dark:to-slate-900',
                      accentColor: 'text-purple-600 dark:text-purple-400',
                      barColor: 'bg-purple-500',
                      icon: <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
                    },
                    Tukang: {
                      badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
                      border: 'border-amber-200 dark:border-amber-900/60',
                      cardBg: 'bg-gradient-to-b from-amber-500/5 to-white dark:from-amber-950/20 dark:to-slate-900',
                      accentColor: 'text-amber-600 dark:text-amber-400',
                      barColor: 'bg-amber-500',
                      icon: <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
                    },
                    Helper: {
                      badgeBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
                      border: 'border-sky-200 dark:border-sky-900/60',
                      cardBg: 'bg-gradient-to-b from-sky-500/5 to-white dark:from-sky-950/20 dark:to-slate-900',
                      accentColor: 'text-sky-600 dark:text-sky-400',
                      barColor: 'bg-sky-500',
                      icon: <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
                    },
                    Teknisi: {
                      badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
                      border: 'border-emerald-200 dark:border-emerald-900/60',
                      cardBg: 'bg-gradient-to-b from-emerald-500/5 to-white dark:from-emerald-950/20 dark:to-slate-900',
                      accentColor: 'text-emerald-600 dark:text-emerald-400',
                      barColor: 'bg-emerald-500',
                      icon: <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
                    },
                    Lainnya: {
                      badgeBg: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
                      border: 'border-slate-200 dark:border-slate-800',
                      cardBg: 'bg-white dark:bg-slate-900',
                      accentColor: 'text-slate-600 dark:text-slate-400',
                      barColor: 'bg-slate-500',
                      icon: <HardHat className="w-4 h-4 text-slate-500" />,
                    },
                  }[grp.category];

                  return (
                    <div
                      key={grp.category}
                      onClick={() =>
                        setSelectedRoleFilter((prev) => (prev === grp.category ? 'ALL' : grp.category))
                      }
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        styleConfig.cardBg
                      } ${styleConfig.border} ${
                        isSelected
                          ? 'ring-2 ring-orange-500 shadow-lg scale-[1.02]'
                          : 'hover:shadow-md hover:border-orange-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div>
                        {/* Top Header */}
                        <div className="flex items-center justify-between gap-1.5 mb-2.5">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-xl ${styleConfig.badgeBg}`}>
                              {styleConfig.icon}
                            </div>
                            <div>
                              <span className="font-black text-sm text-slate-900 dark:text-white block">
                                {grp.title}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                                {grp.desc}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${styleConfig.badgeBg}`}
                          >
                            {grp.activeCount} Org
                          </span>
                        </div>

                        {/* Headcount Breakdown Stats */}
                        <div className="grid grid-cols-2 gap-1.5 mb-2.5 text-[10px]">
                          <div className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                            <span className="text-slate-400 block">Status:</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {grp.activeCount} Aktif {grp.cutiCount > 0 ? `(${grp.cutiCount} Cuti)` : ''}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
                            <span className="text-slate-400 block">Dialokasikan:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                              {grp.allocatedCount} Sektor
                            </span>
                          </div>
                        </div>

                        {/* Main Wage Display */}
                        <div className="space-y-1 my-2 bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-xs">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span>Estimasi Upah ({wageProjectionDays} Hari):</span>
                            <span className="font-mono font-bold text-slate-400">
                              {grp.activeCount} org × {wageProjectionDays} hr
                            </span>
                          </div>
                          <div className="text-lg sm:text-xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                            {formatIDR(projectedWage)}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                            <span>Tarif Rata-rata:</span>
                            <strong className="text-slate-800 dark:text-slate-200 font-mono">
                              {formatIDR(grp.avgDailyWage)}/hari
                            </strong>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Subtotal 1 Hari:</span>
                            <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                              {formatIDR(grp.totalDailyWage)}/hari
                            </span>
                          </div>
                        </div>

                        {/* Proportions & Progress Bar */}
                        <div className="space-y-1 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                          <div className="flex items-center justify-between">
                            <span>Porsi Tenaga Kerja:</span>
                            <strong className="text-slate-800 dark:text-slate-200">
                              {headcountShare}% ({grp.totalCount}/{workers.length})
                            </strong>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${styleConfig.barColor}`}
                              style={{ width: `${headcountShare}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-0.5">
                            <span>Porsi Beban Upah:</span>
                            <strong className="text-slate-800 dark:text-slate-200">{payrollShare}% Total</strong>
                          </div>
                        </div>

                        {/* Personnel Chips */}
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Personel ({grp.workers.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {grp.workers.map((w) => (
                              <span
                                key={w.id}
                                className="text-[9px] px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700 truncate max-w-[110px]"
                                title={`${w.name} - ${w.role} (${formatIDR(w.dailyWage)}/hari)`}
                              >
                                {w.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Filter Button */}
                      <div className="mt-3 pt-2">
                        <button
                          type="button"
                          className={`w-full py-1.5 px-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-orange-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <span>{isSelected ? 'Sedang Memfilter' : `Filter ${grp.title}`}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Card 5: Grand Total Consolidated Summary Card */}
                <div className="p-4 rounded-2xl border border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
                  <div>
                    {/* Top Header */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-black text-sm text-white block">
                            Total Konsolidasi
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Seluruh Peran Lapangan
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                        {activeWorkerCount} Org Aktif
                      </span>
                    </div>

                    {/* Grand Total Projected Wage */}
                    <div className="space-y-1 my-2 bg-white/10 dark:bg-black/30 p-3 rounded-xl border border-white/10 shadow-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-300">
                        <span>Total Estimasi ({wageProjectionDays} Hari Kerja):</span>
                        <span className="text-orange-400 font-bold">{wageProjectionDays} Hari</span>
                      </div>
                      <div className="text-xl sm:text-2xl font-black font-mono text-orange-400 tracking-tight">
                        {formatIDR(totalDailyPayroll * wageProjectionDays)}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1 border-t border-white/10">
                        <span>Payroll Harian (1 Hari):</span>
                        <strong className="font-mono text-white">{formatIDR(totalDailyPayroll)}</strong>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Rata-rata/Pekerja:</span>
                        <span className="font-mono text-slate-300">
                          {formatIDR(Math.round(totalDailyPayroll / (activeWorkerCount || 1)))}/hari
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Periods */}
                    <div className="space-y-1.5 text-[10px] text-slate-300 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Estimasi Mingguan (6 Hari):</span>
                        <span className="font-mono font-bold text-white">{formatIDR(totalDailyPayroll * 6)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Estimasi Bulanan (25 Hari):</span>
                        <span className="font-mono font-bold text-white">{formatIDR(totalDailyPayroll * 25)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-white/10">
                        <span className="text-slate-400">Akumulasi Realisasi Gaji:</span>
                        <span className="font-mono font-bold text-emerald-400">{formatIDR(totalAccumulatedPayroll)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Reset / All Roles Button */}
                  <div className="mt-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRoleFilter('ALL')}
                      className={`w-full py-1.5 px-2.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        selectedRoleFilter === 'ALL'
                          ? 'bg-orange-500 text-white shadow-xs'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      <span>{selectedRoleFilter === 'ALL' ? 'Menampilkan Semua Peran' : 'Tampilkan Semua Peran'}</span>
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Formula & Calculation Transparency Drawer */}
              {showFormulaDetails && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-xs">
                    <Info className="w-4 h-4 text-orange-500" />
                    <span>Rumus Transparansi Perhitungan Upah ({wageProjectionDays} Hari Kerja):</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                    {roleBreakdown.map((grp) => (
                      <div
                        key={grp.category}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1"
                      >
                        <span className="font-sans font-bold text-slate-900 dark:text-white block">
                          {grp.title}:
                        </span>
                        <div className="text-slate-600 dark:text-slate-400 text-[10px]">
                          {grp.activeCount} org × {formatIDR(grp.avgDailyWage)} × {wageProjectionDays} hari
                        </div>
                        <div className="font-black text-orange-500">
                          = {formatIDR(grp.totalDailyWage * wageProjectionDays)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 italic pt-1">
                    *Kalkulasi upah ini dihitung secara real-time berdasarkan tarif harian aktif masing-masing pekerja untuk membantu Site Manager dan Mandor memverifikasi kasbon dan laporan payroll mingguan.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Minimized Ribbon View */
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Ringkasan Peran ({wageProjectionDays} Hari):
                </span>
                {roleBreakdown.map((grp) => (
                  <span
                    key={grp.category}
                    onClick={() => setSelectedRoleFilter(grp.category)}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] cursor-pointer hover:border-orange-500"
                  >
                    <strong>{grp.title}:</strong> {grp.activeCount} org ({formatIDR(grp.totalDailyWage * wageProjectionDays)})
                  </span>
                ))}
                <span className="font-black text-orange-500 font-mono">
                  Total: {formatIDR(totalDailyPayroll * wageProjectionDays)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsRoleSummaryExpanded(true)}
                className="text-xs font-bold text-orange-500 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Buka Detail Ringkasan</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================== SUB-TAB 1: ALOKASI PEKERJAAN & PRODUKTIVITAS ==================== */}
      {activeSubTab === 'allocation' && (
        <div className="space-y-6">
          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pekerja Ter-Alokasi</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                  <UserCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{assignedWorkerCount}</span>
                <span className="text-xs text-slate-400 font-semibold">dari {activeWorkerCount} Pekerja Aktif</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((assignedWorkerCount / (activeWorkerCount || 1)) * 100))}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Rata-rata Produktivitas</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black ${avgProductivityPercent >= 95 ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {avgProductivityPercent}%
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {avgProductivityPercent >= 100 ? 'Sangat Produktif' : avgProductivityPercent >= 85 ? 'Baik' : 'Evaluasi'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Dihitung berdasarkan rasio Realisasi Output / Target Harian</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Sektor Pekerjaan Terisi</span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{assignedWorkItemsCount}</span>
                <span className="text-xs text-slate-400 font-semibold">Sektor Time Schedule</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Daftar item pekerjaan yang sedang dikerjakan tenaga kerja</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Alokasi Tugas</span>
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                  <BarChart2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-orange-500">{allocations.length}</span>
                <span className="text-xs text-slate-400 font-semibold">Penugasan Aktif</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">Penugasan spesifik per pekerja di lapangan</p>
            </div>
          </div>

          {/* Active Role Filter Banner if filtered */}
          {selectedRoleFilter !== 'ALL' && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 rounded-lg bg-orange-500 text-white font-black text-[10px] tracking-wider uppercase">
                  FILTER AKTIF: {selectedRoleFilter}
                </span>
                <span className="text-slate-800 dark:text-slate-200">
                  Menampilkan penugasan Time Schedule khusus kategori peran <strong>{selectedRoleFilter}</strong> (
                  {roleBreakdown.find((r) => r.category === selectedRoleFilter)?.activeCount || 0} personil aktif)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRoleFilter('ALL')}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-orange-600 dark:text-orange-400 font-bold border border-orange-200 dark:border-orange-900/50 transition-all cursor-pointer text-xs shrink-0 self-start sm:self-auto"
              >
                Reset Filter (Tampilkan Semua)
              </button>
            </div>
          )}

          {/* Filter & Controls Toolbar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search & Select Filters */}
            <div className="flex flex-1 flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari pekerja, role, atau pekerjaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              {/* Work Item Filter */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedWorkItemFilter}
                  onChange={(e) => setSelectedWorkItemFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="ALL">Semua Pekerjaan Time Schedule</option>
                  {workItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="Dalam Pengerjaan">Dalam Pengerjaan</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Di Bawah Target">Di Bawah Target</option>
                  <option value="Tertunda">Tertunda</option>
                </select>
              </div>
            </div>

            {/* Action & View Mode Buttons */}
            <div className="flex items-center gap-2 justify-end">
              {/* View Mode Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setAllocationViewMode('table')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    allocationViewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tampilan Tabel Detail Alokasi"
                >
                  <Layers className="w-3.5 h-3.5" /> Tabel
                </button>
                <button
                  onClick={() => setAllocationViewMode('matrix')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    allocationViewMode === 'matrix'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tampilan Kelompok Matriks Pekerjaan"
                >
                  <Briefcase className="w-3.5 h-3.5" /> Matriks Sektor
                </button>
                <button
                  onClick={() => setAllocationViewMode('heatmap')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    allocationViewMode === 'heatmap'
                      ? 'bg-white dark:bg-slate-900 text-orange-500 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tampilan Visual Heatmap Kepadatan 30 Hari & Analisis Hambatan"
                >
                  <Flame className="w-3.5 h-3.5 text-orange-500" /> Heatmap 30 Hari
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsQRScannerOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 shrink-0 cursor-pointer"
                title="Pindai QR Code untuk memvalidasi alokasi kehadiran harian"
              >
                <Scan className="w-4 h-4" /> Pindai QR Absensi
              </button>

              {canEdit && (
                <button
                  onClick={handleOpenAllocModal}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Alokasikan Pekerja
                </button>
              )}
            </div>
          </div>

          {/* VIEW MODE 1: ALLOCATION TABLE */}
          {allocationViewMode === 'table' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">Nama Pekerja &amp; Role</th>
                      <th className="py-3.5 px-4">Pekerjaan Time Schedule</th>
                      <th className="py-3.5 px-4 text-center">Alokasi Jam / Tgl</th>
                      <th className="py-3.5 px-4 text-center">Target vs Realisasi Output</th>
                      <th className="py-3.5 px-4 text-center">Skor &amp; Efisiensi Upah</th>
                      <th className="py-3.5 px-4 text-center">Status &amp; Validasi QR</th>
                      {canEdit && <th className="py-3.5 px-4 text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredAllocations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                          <Target className="w-8 h-8 mx-auto text-slate-500 mb-2 opacity-50" />
                          Belum ada data alokasi pekerja yang sesuai dengan filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAllocations.map((alloc) => {
                        const matchedWorker = workers.find((w) => w.id === alloc.workerId);
                        const dailyWage = matchedWorker?.dailyWage || 170000;
                        const badge = getProductivityBadge(alloc.targetOutput, alloc.actualOutput);
                        const outputRatio = alloc.targetOutput > 0 ? (alloc.actualOutput / alloc.targetOutput) * 100 : 100;
                        const costPerUnit = alloc.actualOutput > 0 ? Math.round(dailyWage / alloc.actualOutput) : 0;

                        return (
                          <tr key={alloc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            {/* Worker Info */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center font-black text-xs shrink-0">
                                  {alloc.workerName.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                    {alloc.workerName}
                                  </div>
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                    <span>{alloc.workerRole}</span>
                                    <span>&bull;</span>
                                    <span className="text-emerald-500 font-semibold">{formatIDR(dailyWage)}/hari</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Work Item */}
                            <td className="py-3.5 px-4 max-w-xs">
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 font-extrabold text-[9px] uppercase border border-blue-500/20 mb-1 inline-block">
                                {alloc.workItemCategory || 'Sektor'}
                              </span>
                              <div className="font-bold text-slate-800 dark:text-slate-200 truncate" title={alloc.workItemName}>
                                {alloc.workItemName}
                              </div>
                              {alloc.notes && (
                                <p className="text-[10px] text-slate-400 italic truncate mt-0.5" title={alloc.notes}>
                                  "{alloc.notes}"
                                </p>
                              )}
                            </td>

                            {/* Allocated Hours & Date */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-orange-500" />
                                {alloc.allocatedHours} Jam / Hari
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {alloc.assignedDate}
                              </div>
                            </td>

                            {/* Target vs Actual Output */}
                            <td className="py-3.5 px-4 text-center">
                              <div className="font-black text-slate-900 dark:text-white text-xs">
                                <span className="text-emerald-500">{alloc.actualOutput}</span> /{' '}
                                <span className="text-slate-400">{alloc.targetOutput}</span>{' '}
                                <span className="text-[10px] font-semibold text-slate-400">{alloc.unit}</span>
                              </div>
                              {/* Visual Progress Bar */}
                              <div className="w-28 mx-auto bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    outputRatio >= 100
                                      ? 'bg-emerald-500'
                                      : outputRatio >= 85
                                      ? 'bg-blue-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(100, outputRatio)}%` }}
                                />
                              </div>
                            </td>

                            {/* Productivity Score & Cost Efficiency */}
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${badge.color} inline-block`}
                              >
                                {badge.label}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-1">
                                Est. Biaya Upah: <strong className="text-slate-200">{formatIDR(costPerUnit)}</strong> / {alloc.unit}
                              </div>
                            </td>

                            {/* Status & Validasi QR */}
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border block ${
                                  alloc.status === 'Selesai'
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                                    : alloc.status === 'Di Bawah Target'
                                    ? 'bg-red-500/10 text-red-500 border-red-500/30'
                                    : alloc.status === 'Tertunda'
                                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                    : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                                }`}
                              >
                                {alloc.status}
                              </span>

                              {/* QR Code Validation status */}
                              {alloc.isValidatedByQR || dailyAttendances.some((att) => att.workerId === alloc.workerId && att.isPresent) ? (
                                <span className="mt-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-black border border-emerald-500/30 flex items-center justify-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                  QR VALID ({alloc.qrValidatedAt || dailyAttendances.find((a) => a.workerId === alloc.workerId)?.checkInTime || 'Hadir'})
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleValidateAttendance(alloc.workerId)}
                                  className="mt-1 px-1.5 py-0.5 rounded-md bg-orange-500/10 hover:bg-orange-500 hover:text-white text-orange-600 dark:text-orange-400 font-mono text-[9px] font-bold border border-orange-500/30 flex items-center justify-center gap-1 cursor-pointer transition-all mx-auto"
                                  title="Validasi absensi pekerja ini via QR"
                                >
                                  <Scan className="w-2.5 h-2.5" />
                                  Validasi QR
                                </button>
                              )}
                            </td>

                            {/* Actions */}
                            {canEdit && (
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const w = workers.find((item) => item.id === alloc.workerId);
                                      if (w) {
                                        setSelectedBadgeWorker(w);
                                        setIsBadgeModalOpen(true);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-400 transition-colors cursor-pointer"
                                    title="Lihat &amp; Cetak Kartu ID Badge QR Pekerja"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setEditingAllocation(alloc)}
                                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-400 transition-colors"
                                    title="Edit Realisasi Output / Status"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>

                                  {onDeleteAllocation && (
                                    <button
                                      onClick={() => onDeleteAllocation(alloc.id)}
                                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 transition-colors"
                                      title="Hapus Penugasan Pekerja"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: WORK ITEM MATRIX (Grouped by Work Item) */}
          {allocationViewMode === 'matrix' && (
            <div className="space-y-4">
              {workItems.map((item) => {
                const itemAllocations = filteredAllocations.filter((a) => a.workItemId === item.id);
                const totalItemDailyWages = itemAllocations.reduce((sum, a) => {
                  const w = workers.find((wrk) => wrk.id === a.workerId);
                  return sum + (w?.dailyWage || 170000);
                }, 0);

                const itemAvgProductivity =
                  itemAllocations.length > 0
                    ? Math.round(
                        itemAllocations.reduce((sum, a) => {
                          const ratio = a.targetOutput > 0 ? (a.actualOutput / a.targetOutput) * 100 : 100;
                          return sum + ratio;
                        }, 0) / itemAllocations.length
                      )
                    : 0;

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4"
                  >
                    {/* Sector Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-orange-500/10 text-orange-500 font-black text-[10px] border border-orange-500/20">
                            SEKTOR {item.no} &bull; {item.category.toUpperCase()}
                          </span>
                          <span className="text-xs font-bold text-slate-400">
                            {item.durationDays} Hari ({item.startDate} s/d {item.endDate})
                          </span>
                        </div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">{item.name}</h3>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 block">Total Payroll Harian Sektor</span>
                          <span className="text-xs font-black text-emerald-500">{formatIDR(totalItemDailyWages)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 block">Produktivitas Sektor</span>
                          <span
                            className={`text-xs font-black ${
                              itemAvgProductivity >= 95
                                ? 'text-emerald-500'
                                : itemAvgProductivity > 0
                                ? 'text-amber-500'
                                : 'text-slate-400'
                            }`}
                          >
                            {itemAllocations.length > 0 ? `${itemAvgProductivity}%` : 'Belum Ada Pekerja'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Workers Grid inside Sector */}
                    {itemAllocations.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                        Belum ada pekerja yang dialokasikan ke sektor ini. Klik "+ Alokasikan Pekerja" untuk menugaskan.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {itemAllocations.map((alloc) => {
                          const w = workers.find((wrk) => wrk.id === alloc.workerId);
                          const wage = w?.dailyWage || 170000;
                          const ratio = alloc.targetOutput > 0 ? Math.round((alloc.actualOutput / alloc.targetOutput) * 100) : 100;

                          return (
                            <div
                              key={alloc.id}
                              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 relative space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center">
                                    {alloc.workerName.charAt(0)}
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{alloc.workerName}</h4>
                                    <span className="text-[10px] text-slate-400 block">{alloc.workerRole}</span>
                                  </div>
                                </div>
                                <span className="text-[10px] font-black text-emerald-500">{formatIDR(wage)}/hari</span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700">
                                <span className="text-slate-400">Target vs Realisasi:</span>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {alloc.actualOutput} / {alloc.targetOutput} {alloc.unit}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-400">Skor Produktivitas:</span>
                                <span
                                  className={`font-black ${
                                    ratio >= 100
                                      ? 'text-emerald-500'
                                      : ratio >= 85
                                      ? 'text-blue-500'
                                      : 'text-red-500'
                                  }`}
                                >
                                  {ratio}%
                                </span>
                              </div>

                              {alloc.notes && (
                                <p className="text-[10px] text-slate-400 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 mt-1">
                                  "{alloc.notes}"
                                </p>
                              )}

                              {canEdit && (
                                <div className="flex items-center justify-end gap-1 pt-1">
                                  <button
                                    onClick={() => setEditingAllocation(alloc)}
                                    className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-orange-500 hover:text-white text-slate-400 text-[10px] font-bold transition-all flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3" /> Edit Output
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW MODE 3: HEATMAP VIEW */}
          {allocationViewMode === 'heatmap' && (
            <WorkforceHeatmap
              workItems={workItems}
              allocations={allocations}
              workers={workers}
              userRole={userRole}
              canEdit={canEdit}
              onOpenAllocModal={handleOpenAllocModal}
            />
          )}
        </div>
      )}

      {/* ==================== SUB-TAB 3: HEATMAP KEPADATAN 30 HARI ==================== */}
      {activeSubTab === 'heatmap' && (
        <WorkforceHeatmap
          workItems={workItems}
          allocations={allocations}
          workers={workers}
          userRole={userRole}
          canEdit={canEdit}
          onOpenAllocModal={handleOpenAllocModal}
        />
      )}

      {/* ==================== SUB-TAB 2: ROSTER & DAFTAR PEKERJA (Original View) ==================== */}
      {activeSubTab === 'roster' && (
        <div className="space-y-6">
          {/* Roster & Payroll Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <span className="text-xs font-semibold text-slate-400 block">Total Tenaga Kerja Aktif</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {workers.filter((w) => w.status === 'Aktif').length}
                </span>
                <span className="text-xs text-slate-400 font-semibold">dari {workers.length} Terdaftar</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <span className="text-xs font-semibold text-slate-400 block">Estimasi Payroll Harian</span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">{formatIDR(totalDailyPayroll)}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <span className="text-xs font-semibold text-slate-400 block">Rata-rata Upah Harian</span>
              <span className="text-2xl font-black text-orange-500 mt-1 block">
                {formatIDR(Math.round(totalDailyPayroll / (workers.length || 1)))}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <span className="text-xs font-semibold text-slate-400 block">Akumulasi Realisasi Gaji</span>
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
                {formatIDR(totalAccumulatedPayroll)}
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* KARTU RINGKASAN PEMBAGIAN PEKERJA BERDASARKAN PERAN & KALKULASI UPAH */}
          {/* ========================================================================= */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            {/* Header of Matrix Table */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                  <span>Matriks Komparasi Upah &amp; Beban Payroll Antar Peran</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tabel rincian komparasi beban upah personil Tukang, Helper, Mandor, dan Teknisi berdasarkan durasi kerja proyek
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportPayrollCSV}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>

            {/* Quick Wage Calculation Summary Matrix Table */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Tabel Rekapitulasi &amp; Estimasi Upah Berdasarkan Peran
                  </span>
                </div>
                {selectedRoleFilter !== 'ALL' && (
                  <button
                    onClick={() => setSelectedRoleFilter('ALL')}
                    className="text-xs font-bold text-orange-500 hover:underline cursor-pointer"
                  >
                    Reset Filter (Tampilkan Semua Peran)
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Kategori Peran</th>
                      <th className="py-2.5 px-3 text-center">Personel Aktif</th>
                      <th className="py-2.5 px-3 text-right">Upah Rata-rata / Hari</th>
                      <th className="py-2.5 px-3 text-right">Subtotal Harian (1 Hari)</th>
                      <th className="py-2.5 px-3 text-right">Mingguan (6 Hari)</th>
                      <th className="py-2.5 px-3 text-right">Bulanan (25 Hari)</th>
                      <th className="py-2.5 px-3 text-right">Akumulasi Realisasi Gaji</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono text-[11px]">
                    {roleBreakdown.map((grp) => (
                      <tr
                        key={grp.category}
                        onClick={() =>
                          setSelectedRoleFilter((prev) => (prev === grp.category ? 'ALL' : grp.category))
                        }
                        className={`cursor-pointer transition-colors ${
                          selectedRoleFilter === grp.category
                            ? 'bg-orange-500/10 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              grp.category === 'Mandor'
                                ? 'bg-purple-500'
                                : grp.category === 'Tukang'
                                ? 'bg-amber-500'
                                : grp.category === 'Helper'
                                ? 'bg-sky-500'
                                : grp.category === 'Teknisi'
                                ? 'bg-emerald-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span>{grp.title}</span>
                        </td>
                        <td className="py-2 px-3 text-center text-slate-700 dark:text-slate-300">
                          {grp.activeCount} Orang
                        </td>
                        <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">
                          {formatIDR(grp.avgDailyWage)}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-slate-900 dark:text-white">
                          {formatIDR(grp.totalDailyWage)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                          {formatIDR(grp.totalDailyWage * 6)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                          {formatIDR(grp.totalDailyWage * 25)}
                        </td>
                        <td className="py-2 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                          {formatIDR(grp.totalAccumulatedWage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-700 text-[11px] font-mono">
                      <td className="py-2.5 px-3 font-sans font-black text-orange-400 uppercase">
                        TOTAL ESTIMASI PAYROLL
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans font-black text-orange-400">
                        {activeWorkerCount} Orang
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans text-slate-300">
                        {formatIDR(Math.round(totalDailyPayroll / (activeWorkerCount || 1)))}/org
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-orange-400">
                        {formatIDR(totalDailyPayroll)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        {formatIDR(totalDailyPayroll * 6)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white">
                        {formatIDR(totalDailyPayroll * 25)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-400">
                        {formatIDR(totalAccumulatedPayroll)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Action Bar for Workers */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Daftar Roster &amp; Upah Personel Lapangan
                </h3>
                {selectedRoleFilter !== 'ALL' ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
                    <span>Filter: {selectedRoleFilter} ({filteredRosterWorkers.length} Orang)</span>
                    <button
                      type="button"
                      onClick={() => setSelectedRoleFilter('ALL')}
                      className="hover:text-red-500 cursor-pointer font-black"
                    >
                      &times;
                    </button>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                    Semua Peran ({workers.length} Orang)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Gaji harian, peran klasifikasi, dan akumulasi hari kerja tenaga kerja aktif proyek
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap sm:flex-nowrap">
              {selectedRoleFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedRoleFilter('ALL')}
                  className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsQRScannerOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 shrink-0 cursor-pointer"
              >
                <Scan className="w-4 h-4" /> Pindai QR Absensi
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedBadgeWorker(null);
                  setIsBadgeModalOpen(true);
                }}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all shrink-0 cursor-pointer"
                title="Cetak Kartu Tanda Pengenal & QR Code"
              >
                <Printer className="w-3.5 h-3.5 text-orange-500" /> Cetak ID Card &amp; QR
              </button>
              {canEdit && (
                <button
                  onClick={() => setIsWorkerModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Tambah Tenaga Kerja
                </button>
              )}
            </div>
          </div>

          {/* Workers Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white border-b border-slate-800 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Nama Pekerja</th>
                    <th className="py-3 px-3">Klasifikasi &amp; Role</th>
                    <th className="py-3 px-3 text-right">Hari Kerja</th>
                    <th className="py-3 px-3 text-right">Upah Harian</th>
                    <th className="py-3 px-3 text-right">Total Akumulasi Gaji</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Absensi Hari Ini (QR)</th>
                    <th className="py-3 px-3 text-center">ID Badge &amp; QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredRosterWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 font-medium">
                        Tidak ada pekerja yang terdaftar dengan kategori peran "{selectedRoleFilter}".
                        <button
                          type="button"
                          onClick={() => setSelectedRoleFilter('ALL')}
                          className="text-orange-500 hover:underline font-bold ml-2 cursor-pointer"
                        >
                          Reset Filter
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredRosterWorkers.map((w) => {
                      const cat = getRoleCategory(w.role);
                      const att = dailyAttendances.find((a) => a.workerId === w.id);
                      const isPresent = !!att?.isPresent;

                      return (
                        <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                  cat === 'Mandor'
                                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                                    : cat === 'Tukang'
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                    : cat === 'Helper'
                                    ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                                    : cat === 'Teknisi'
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {w.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white block">{w.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{w.id}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                                  cat === 'Mandor'
                                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                                    : cat === 'Tukang'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                    : cat === 'Helper'
                                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                                    : cat === 'Teknisi'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                {cat}
                              </span>
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{w.role}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-medium">{w.daysWorked} Hari</td>
                          <td className="py-3 px-3 text-right font-semibold">{formatIDR(w.dailyWage)}</td>
                          <td className="py-3 px-3 text-right font-black text-emerald-500">
                            {formatIDR(w.dailyWage * w.daysWorked)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/30">
                              {w.status}
                            </span>
                          </td>
                          {/* Daily Attendance Column */}
                          <td className="py-3 px-3 text-center">
                            {isPresent ? (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] border border-emerald-500/30 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                Hadir ({att?.checkInTime || 'QR Valid'})
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleValidateAttendance(w.id)}
                                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-orange-500 hover:text-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700 cursor-pointer inline-flex items-center gap-1 transition-all"
                              >
                                <Scan className="w-2.5 h-2.5" />
                                Belum Absen (Pindai)
                              </button>
                            )}
                          </td>
                          {/* ID Badge & QR Column */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBadgeWorker(w);
                                setIsBadgeModalOpen(true);
                              }}
                              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer inline-flex items-center gap-1 text-[10px] font-bold"
                              title="Lihat &amp; Cetak Kartu ID Badge QR"
                            >
                              <QrCode className="w-3.5 h-3.5 text-orange-500" />
                              <span>Kartu QR</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 1: TAMBAH PEKERJA BARU ==================== */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsWorkerModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              Tambah Tenaga Kerja Baru
            </h3>

            <form onSubmit={handleAddWorkerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Nama Lengkap Pekerja</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Supriadi"
                  value={newWorker.name}
                  onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Jabatan / Kualifikasi</label>
                <input
                  type="text"
                  placeholder="Mandor, Tukang Besi, Tukang Batu, Safety Officer"
                  value={newWorker.role}
                  onChange={(e) => setNewWorker({ ...newWorker, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Upah Harian (Rp)</label>
                <input
                  type="number"
                  value={newWorker.dailyWage}
                  onChange={(e) => setNewWorker({ ...newWorker, dailyWage: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWorkerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-500/20"
                >
                  Simpan Pekerja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: ALOKASIKAN PEKERJA KE ITEM TIME SCHEDULE ==================== */}
      {isAllocModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative my-8 text-slate-900 dark:text-white">
            <button
              onClick={() => setIsAllocModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black">Alokasikan Pekerja ke Time Schedule</h3>
                <p className="text-xs text-slate-400">Tentukan penugasan tenaga kerja &amp; target produktivitas harian</p>
              </div>
            </div>

            <form onSubmit={handleAllocSubmit} className="space-y-4 text-xs">
              {/* Select Worker */}
              <div>
                <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-orange-500" /> Pilih Tenaga Kerja / Mandor
                </label>
                <select
                  value={newAlloc.workerId}
                  onChange={(e) => handleWorkerSelectInModal(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {workers.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} &bull; {w.role} ({formatIDR(w.dailyWage)}/hari)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Work Item */}
              <div>
                <label className="block font-bold mb-1.5 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-500" /> Pilih Pekerjaan Time Schedule
                </label>
                <select
                  value={newAlloc.workItemId}
                  onChange={(e) => handleWorkItemSelectInModal(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {workItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} [{item.category}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Allocated Hours */}
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-500" /> Alokasi Jam (per hari)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={24}
                    value={newAlloc.allocatedHours}
                    onChange={(e) => setNewAlloc({ ...newAlloc, allocatedHours: Number(e.target.value) || 8 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  />
                </div>

                {/* Assigned Date */}
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Tanggal Penugasan
                  </label>
                  <input
                    type="date"
                    required
                    value={newAlloc.assignedDate}
                    onChange={(e) => setNewAlloc({ ...newAlloc, assignedDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  />
                </div>
              </div>

              {/* Output Targets & Units */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Target Output Harian</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={newAlloc.targetOutput}
                    onChange={(e) => setNewAlloc({ ...newAlloc, targetOutput: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Realisasi Output Lapangan</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={newAlloc.actualOutput}
                    onChange={(e) => setNewAlloc({ ...newAlloc, actualOutput: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Satuan Output</label>
                  <input
                    type="text"
                    required
                    placeholder="m², m³, kg, titik"
                    value={newAlloc.unit}
                    onChange={(e) => setNewAlloc({ ...newAlloc, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  />
                </div>
              </div>

              {/* Live Productivity Preview Box */}
              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block">Estimasi Skor Produktivitas:</span>
                  <span
                    className={`text-sm font-black ${
                      newAlloc.targetOutput > 0 && newAlloc.actualOutput / newAlloc.targetOutput >= 0.95
                        ? 'text-emerald-500'
                        : 'text-amber-500'
                    }`}
                  >
                    {newAlloc.targetOutput > 0
                      ? `${Math.round((newAlloc.actualOutput / newAlloc.targetOutput) * 100)}%`
                      : '0%'}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block">Status Penugasan:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-black text-[10px] border border-orange-500/20">
                    {newAlloc.status}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Catatan / Area Penugasan Khusus</label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Fabrikasi rebar kolom zona A2 lantai 1..."
                  value={newAlloc.notes}
                  onChange={(e) => setNewAlloc({ ...newAlloc, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAllocModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Simpan Alokasi Pekerja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: EDIT REALISASI OUTPUT ALOKASI ==================== */}
      {editingAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative my-8 text-slate-900 dark:text-white">
            <button
              onClick={() => setEditingAllocation(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black">Update Realisasi &amp; Produktivitas</h3>
                <p className="text-xs text-slate-400">
                  {editingAllocation.workerName} &bull; {editingAllocation.workItemName}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveEditAllocation} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Target Output</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingAllocation.targetOutput}
                    onChange={(e) =>
                      setEditingAllocation({
                        ...editingAllocation,
                        targetOutput: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Realisasi Output Lapangan</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingAllocation.actualOutput}
                    onChange={(e) =>
                      setEditingAllocation({
                        ...editingAllocation,
                        actualOutput: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold text-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Satuan</label>
                  <input
                    type="text"
                    required
                    value={editingAllocation.unit}
                    onChange={(e) => setEditingAllocation({ ...editingAllocation, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Status Penugasan</label>
                  <select
                    value={editingAllocation.status}
                    onChange={(e) =>
                      setEditingAllocation({
                        ...editingAllocation,
                        status: e.target.value as WorkerAllocation['status'],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold"
                  >
                    <option value="Dalam Pengerjaan">Dalam Pengerjaan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Di Bawah Target">Di Bawah Target</option>
                    <option value="Tertunda">Tertunda</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Catatan Lapangan</label>
                <textarea
                  rows={2}
                  value={editingAllocation.notes || ''}
                  onChange={(e) => setEditingAllocation({ ...editingAllocation, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAllocation(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-500/20"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 4: PEMINDAI QR CODE ABSENSI HARIAN PEKERJA ==================== */}
      <WorkerQRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        workers={workers}
        allocations={allocations}
        workItems={workItems}
        todayAttendances={dailyAttendances}
        onValidateAttendance={handleValidateAttendance}
        onOpenWorkerBadge={(worker) => {
          setSelectedBadgeWorker(worker);
          setIsBadgeModalOpen(true);
        }}
      />

      {/* ==================== MODAL 5: CETAK KARTU ID BADGE & QR CODE ==================== */}
      <WorkerBadgeCardModal
        isOpen={isBadgeModalOpen}
        onClose={() => setIsBadgeModalOpen(false)}
        workers={workers}
        selectedWorker={selectedBadgeWorker}
        allocations={allocations}
      />
    </div>
  );
};
