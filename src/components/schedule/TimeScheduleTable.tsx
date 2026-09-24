import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  GripVertical,
  MoveUp,
  MoveDown,
  ArrowUpDown,
  Calendar,
  Sliders,
} from 'lucide-react';
import {
  WorkItem,
  UserRole,
  CategoryPekerjaan,
  RolePermissions,
  ProjectInfo,
  CalendarEvent,
  PaymentTerm,
  MaterialItem,
  WorkerAllocation,
  DailyLog,
} from '../../types';
import { calculatePhysicalProgress, calculateTargetProgress } from '../../utils/calculations';
import { StartDateSyncModal } from './StartDateSyncModal';

interface TimeScheduleTableProps {
  workItems: WorkItem[];
  userRole: UserRole;
  permissions?: RolePermissions;
  project?: ProjectInfo;
  calendarEvents?: CalendarEvent[];
  paymentTerms?: PaymentTerm[];
  materials?: MaterialItem[];
  allocations?: WorkerAllocation[];
  dailyLogs?: DailyLog[];
  onUpdateWorkItem: (item: WorkItem) => void;
  onAddWorkItem: (item: Omit<WorkItem, 'id'>) => void;
  onDeleteWorkItem: (id: string) => void;
  onReorderWorkItems?: (reorderedItems: WorkItem[]) => void;
  onApplyStartDateSync?: (result: any) => void;
}

export const TimeScheduleTable: React.FC<TimeScheduleTableProps> = ({
  workItems,
  userRole,
  permissions,
  project,
  calendarEvents = [],
  paymentTerms = [],
  materials = [],
  allocations = [],
  dailyLogs = [],
  onUpdateWorkItem,
  onAddWorkItem,
  onDeleteWorkItem,
  onReorderWorkItems,
  onApplyStartDateSync,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<WorkItem>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Drag & Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // New item form state
  const [newItem, setNewItem] = useState<Omit<WorkItem, 'id'>>({
    no: workItems.length + 1,
    category: 'Struktur',
    name: '',
    startDate: project?.startDate || '2026-09-01',
    endDate: project?.targetEndDate || '2026-10-01',
    durationDays: 31,
    bobotPercent: 5.0,
    targetProgressPercent: 0,
    realizedProgressPercent: 0,
    volumeTarget: 100,
    volumeRealized: 0,
    unit: 'm³',
    status: 'Belum Mulai',
    notes: '',
    updatedAt: new Date().toISOString().split('T')[0],
  });

  const canEdit =
    permissions?.canEditSchedule ??
    (userRole === 'Kontraktor' ||
      userRole === 'Konsultan' ||
      userRole === 'Owner' ||
      userRole === 'Direktur' ||
      userRole === 'Site Manager' ||
      userRole === 'Admin');

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!canEdit || searchTerm) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (!canEdit || searchTerm) return;
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (!canEdit || searchTerm) return;
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...workItems];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, movedItem);

    const reindexed = updated.map((item, idx) => ({
      ...item,
      no: idx + 1,
    }));

    if (onReorderWorkItems) {
      onReorderWorkItems(reindexed);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0 || !onReorderWorkItems) return;
    const updated = [...workItems];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;

    const reindexed = updated.map((item, idx) => ({
      ...item,
      no: idx + 1,
    }));

    onReorderWorkItems(reindexed);
  };

  const handleMoveDown = (index: number) => {
    if (index >= workItems.length - 1 || !onReorderWorkItems) return;
    const updated = [...workItems];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;

    const reindexed = updated.map((item, idx) => ({
      ...item,
      no: idx + 1,
    }));

    onReorderWorkItems(reindexed);
  };

  const handleStartEdit = (item: WorkItem) => {
    if (!canEdit) return;
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSaveEdit = () => {
    if (editingId && editForm) {
      onUpdateWorkItem(editForm as WorkItem);
      setEditingId(null);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name) return;
    onAddWorkItem(newItem);
    setIsAddModalOpen(false);
    setNewItem({
      no: workItems.length + 2,
      category: 'Finishing',
      name: '',
      startDate: '2026-08-15',
      endDate: '2026-09-15',
      durationDays: 31,
      bobotPercent: 2.0,
      targetProgressPercent: 0,
      realizedProgressPercent: 0,
      volumeTarget: 100,
      volumeRealized: 0,
      unit: 'm²',
      status: 'Belum Mulai',
      notes: '',
      updatedAt: new Date().toISOString().split('T')[0],
    });
  };

  const filteredItems = workItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalBobot = workItems.reduce((acc, i) => acc + i.bobotPercent, 0);
  const totalPhysicalProgress = calculatePhysicalProgress(workItems);
  const totalTargetProgress = calculateTargetProgress(workItems);

  const categories: CategoryPekerjaan[] = [
    'Persiapan',
    'Pondasi',
    'Struktur',
    'Kolom',
    'Balok',
    'Lantai',
    'Tangga',
    'Dinding',
    'Atap',
    'MEP',
    'Finishing',
    'Landscape',
    'Serah Terima',
  ];

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <CalendarDays className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Time Schedule Proyek (Microsoft Project Style)</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manajemen rincian bobot, tenggat waktu, dan persentase progress fisik realisasi
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari item pekerjaan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSyncModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-orange-100 hover:bg-orange-200 dark:bg-orange-950/40 dark:hover:bg-orange-900/60 text-orange-700 dark:text-orange-300 text-xs font-bold flex items-center gap-1.5 shrink-0 border border-orange-300 dark:border-orange-800/60 transition-all shadow-sm"
                title="Atur Tanggal Mulai Proyek & Sinkronisasikan Seluruh Jadwal"
              >
                <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>Atur Tanggal Mulai</span>
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-lg shadow-orange-500/20 transition-all"
              >
                <Plus className="w-4 h-4" /> Tambah Pekerjaan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
        {canEdit && !searchTerm && (
          <div className="px-4 py-2 bg-orange-500/10 border-b border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-semibold flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <GripVertical className="w-4 h-4 text-orange-500 shrink-0" />
              Tarik &amp; lepas (drag and drop) baris pekerjaan menggunakan ikon titik enam atau tombol panah untuk mengatur ulang urutan sekuensi proyek.
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Urutan otomatis disinkronkan ke Kurva-S &amp; Gantt Chart
            </span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white border-b border-slate-800 font-bold uppercase text-[11px] tracking-wider">
                {canEdit && <th className="py-3.5 px-2 text-center w-8"></th>}
                <th className="py-3.5 px-3 text-center w-12">No</th>
                <th className="py-3.5 px-3">Item Pekerjaan</th>
                <th className="py-3.5 px-3">Mulai</th>
                <th className="py-3.5 px-3">Selesai</th>
                <th className="py-3.5 px-3 text-center">Durasi</th>
                <th className="py-3.5 px-3 text-right">Bobot</th>
                <th className="py-3.5 px-3 text-right">Target</th>
                <th className="py-3.5 px-3 text-right">Progress</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-3">Keterangan</th>
                {canEdit && <th className="py-3.5 px-3 text-center w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredItems.map((item, idx) => {
                const isEditing = editingId === item.id;
                const originalIndex = workItems.findIndex((w) => w.id === item.id);
                const isDragging = draggedIndex === originalIndex;
                const isDragOver = dragOverIndex === originalIndex;

                return (
                  <tr
                    key={item.id}
                    draggable={canEdit && !searchTerm && !isEditing}
                    onDragStart={(e) => handleDragStart(e, originalIndex)}
                    onDragOver={(e) => handleDragOver(e, originalIndex)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => handleDrop(e, originalIndex)}
                    className={`transition-all ${
                      isEditing
                        ? 'bg-orange-500/10 dark:bg-orange-500/20'
                        : isDragging
                        ? 'opacity-40 bg-orange-500/10 scale-[0.99]'
                        : isDragOver
                        ? 'border-t-2 border-orange-500 bg-orange-500/15 dark:bg-orange-500/25'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Drag Handle Column */}
                    {canEdit && (
                      <td className="py-3 px-1 text-center">
                        {!searchTerm && !isEditing && (
                          <div
                            className="p-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-orange-500 inline-block rounded transition-colors"
                            title="Tarik untuk mengubah urutan"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                    )}

                    {/* No */}
                    <td className="py-3 px-3 text-center font-bold text-slate-500 dark:text-slate-400">
                      {item.no}
                    </td>

                    {/* Item Pekerjaan */}
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white max-w-xs">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs"
                        />
                      ) : (
                        <div>
                          <span>{item.name}</span>
                          <span className="block text-[10px] text-slate-400 font-normal mt-0.5">
                            Kategori: {item.category} &bull; Vol: {item.volumeRealized}/{item.volumeTarget} {item.unit}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Mulai */}
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.startDate || ''}
                          onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                          className="px-2 py-1 rounded bg-white dark:bg-slate-800 border text-xs"
                        />
                      ) : (
                        item.startDate
                      )}
                    </td>

                    {/* Selesai */}
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.endDate || ''}
                          onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                          className="px-2 py-1 rounded bg-white dark:bg-slate-800 border text-xs"
                        />
                      ) : (
                        item.endDate
                      )}
                    </td>

                    {/* Durasi */}
                    <td className="py-3 px-3 text-center font-medium">
                      {item.durationDays} Hari
                    </td>

                    {/* Bobot */}
                    <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.1"
                          value={editForm.bobotPercent ?? 0}
                          onChange={(e) => setEditForm({ ...editForm, bobotPercent: parseFloat(e.target.value) || 0 })}
                          className="w-16 px-1.5 py-1 text-right rounded bg-white dark:bg-slate-800 border text-xs"
                        />
                      ) : (
                        `${item.bobotPercent}%`
                      )}
                    </td>

                    {/* Target */}
                    <td className="py-3 px-3 text-right font-semibold text-slate-500">
                      {item.targetProgressPercent}%
                    </td>

                    {/* Progress */}
                    <td className="py-3 px-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={editForm.realizedProgressPercent ?? 0}
                            onChange={(e) =>
                              setEditForm({ ...editForm, realizedProgressPercent: parseInt(e.target.value) || 0 })
                            }
                            className="w-16 px-1.5 py-1 text-right font-bold rounded bg-white dark:bg-slate-800 border text-xs text-orange-500"
                          />
                          <span>%</span>
                        </div>
                      ) : (
                        <span
                          className={`font-black text-sm ${
                            item.realizedProgressPercent >= item.targetProgressPercent
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {item.realizedProgressPercent}%
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          item.status === 'Selesai'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                            : item.status === 'Terlambat'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                            : item.status === 'Berjalan'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                            : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Keterangan */}
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.notes || ''}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-white dark:bg-slate-800 border text-xs"
                        />
                      ) : (
                        item.notes || '-'
                      )}
                    </td>

                    {/* Aksi */}
                    {canEdit && (
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600"
                              title="Simpan"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg bg-slate-400 text-white hover:bg-slate-500"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-0.5">
                            {/* Reorder Up/Down Quick Buttons */}
                            {!searchTerm && (
                              <>
                                <button
                                  onClick={() => handleMoveUp(originalIndex)}
                                  disabled={originalIndex === 0}
                                  className="p-1 rounded text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 disabled:opacity-20 disabled:hover:bg-transparent"
                                  title="Naikkan Urutan"
                                >
                                  <MoveUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleMoveDown(originalIndex)}
                                  disabled={originalIndex === workItems.length - 1}
                                  className="p-1 rounded text-slate-400 hover:text-orange-500 hover:bg-orange-500/10 disabled:opacity-20 disabled:hover:bg-transparent"
                                  title="Turunkan Urutan"
                                >
                                  <MoveDown className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleStartEdit(item)}
                              className="p-1 rounded text-slate-400 hover:text-orange-500 hover:bg-orange-500/10"
                              title="Edit Pekerjaan"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteWorkItem(item.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10"
                              title="Hapus Pekerjaan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold border-t border-slate-800 text-xs">
                <td colSpan={canEdit ? 6 : 5} className="py-3 px-3 text-right uppercase">
                  TOTAL BOBOT & PROGRESS PROYEK:
                </td>
                <td className="py-3 px-3 text-right text-amber-400 text-sm">{totalBobot.toFixed(1)}%</td>
                <td className="py-3 px-3 text-right text-slate-300">{totalTargetProgress.toFixed(1)}%</td>
                <td className="py-3 px-3 text-right text-emerald-400 text-base">{totalPhysicalProgress.toFixed(1)}%</td>
                <td colSpan={canEdit ? 3 : 2} className="py-3 px-3 text-slate-400 font-normal italic text-[11px]">
                  *Otomatis update Kurva-S & Dashboard
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Tambah Item Pekerjaan Baru</h3>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                <select
                  value={newItem.category}
                  onChange={(e) => setNewItem({ ...newItem, category: e.target.value as CategoryPekerjaan })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Pekerjaan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pekerjaan Pengecoran Balok Lantai 3"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={newItem.startDate}
                    onChange={(e) => setNewItem({ ...newItem, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={newItem.endDate}
                    onChange={(e) => setNewItem({ ...newItem, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Bobot (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItem.bobotPercent}
                    onChange={(e) => setNewItem({ ...newItem, bobotPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Satuan Volume</label>
                  <input
                    type="text"
                    placeholder="m³, m², Lump Sum"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
                >
                  Simpan Pekerjaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Date Sync Modal */}
      {project && (
        <StartDateSyncModal
          isOpen={isSyncModalOpen}
          onClose={() => setIsSyncModalOpen(false)}
          project={project}
          workItems={workItems}
          calendarEvents={calendarEvents}
          paymentTerms={paymentTerms}
          materials={materials}
          allocations={allocations}
          dailyLogs={dailyLogs}
          onApplySync={(res) => {
            if (onApplyStartDateSync) {
              onApplyStartDateSync(res);
            }
          }}
        />
      )}
    </div>
  );
};
