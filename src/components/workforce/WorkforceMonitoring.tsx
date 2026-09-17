import React, { useState } from 'react';
import { WorkerItem, WorkItem, WorkerAllocation, UserRole, RolePermissions } from '../../types';
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
} from 'lucide-react';
import { formatIDR } from '../../utils/calculations';

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
  // Main Sub-Tab State: 'roster' (Daftar & Absensi) | 'allocation' (Alokasi Sumber Daya)
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'allocation'>('allocation');

  // Allocation View Mode: 'table' | 'matrix'
  const [allocationViewMode, setAllocationViewMode] = useState<'table' | 'matrix'>('table');

  // Search & Filters for Allocation
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkItemFilter, setSelectedWorkItemFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Modal States
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<WorkerAllocation | null>(null);

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

  // Roster Calculations
  const totalDailyPayroll = workers.reduce((acc, w) => acc + (w.status === 'Aktif' ? w.dailyWage : 0), 0);

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

    return matchesSearch && matchesWorkItem && matchesStatus;
  });

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

  const handleOpenAllocModal = () => {
    if (workers.length > 0 && workItems.length > 0) {
      const selectedWorker = workers[0];
      const selectedItem = workItems[0];
      setNewAlloc({
        workerId: selectedWorker.id,
        workerName: selectedWorker.name,
        workerRole: selectedWorker.role,
        workItemId: selectedItem.id,
        workItemName: selectedItem.name,
        workItemCategory: selectedItem.category,
        allocatedHours: 8,
        assignedDate: new Date().toISOString().split('T')[0],
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
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shrink-0">
          <button
            onClick={() => setActiveSubTab('allocation')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'allocation'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Alokasi Pekerjaan &amp; Produktivitas</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-white/20 text-white">
              {allocations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('roster')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
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
        </div>
      </div>

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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    allocationViewMode === 'matrix'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tampilan Kelompok Matriks Pekerjaan"
                >
                  <Briefcase className="w-3.5 h-3.5" /> Matriks Sektor
                </button>
              </div>

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
                      <th className="py-3.5 px-4 text-center">Status</th>
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

                            {/* Status */}
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border ${
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
                            </td>

                            {/* Actions */}
                            {canEdit && (
                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
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
        </div>
      )}

      {/* ==================== SUB-TAB 2: ROSTER & DAFTAR PEKERJA (Original View) ==================== */}
      {activeSubTab === 'roster' && (
        <div className="space-y-6">
          {/* Roster & Payroll Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <span className="text-xs font-semibold text-slate-400 block">Total Tenaga Kerja Aktif</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
                {workers.filter((w) => w.status === 'Aktif').length} Orang
              </span>
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
          </div>

          {/* Action Bar for Workers */}
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Daftar Roster &amp; Upah Personel Lapangan</h3>
              <p className="text-xs text-slate-400">Gaji dan akumulasi hari kerja tenaga kerja aktif proyek</p>
            </div>

            {canEdit && (
              <button
                onClick={() => setIsWorkerModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 shrink-0"
              >
                <Plus className="w-4 h-4" /> Tambah Tenaga Kerja
              </button>
            )}
          </div>

          {/* Workers Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white border-b border-slate-800 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Nama Pekerja</th>
                    <th className="py-3 px-3">Jabatan / Role</th>
                    <th className="py-3 px-3 text-right">Hari Kerja</th>
                    <th className="py-3 px-3 text-right">Upah Harian</th>
                    <th className="py-3 px-3 text-right">Total Akumulasi Gaji</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {workers.map((w) => (
                    <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{w.name}</td>
                      <td className="py-3 px-3 text-slate-400">{w.role}</td>
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
                    </tr>
                  ))}
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
    </div>
  );
};
