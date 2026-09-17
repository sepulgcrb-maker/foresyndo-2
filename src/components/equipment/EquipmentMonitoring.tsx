import React, { useState } from 'react';
import { EquipmentItem, UserRole, RolePermissions } from '../../types';
import { Truck, Plus, Wrench, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface EquipmentMonitoringProps {
  equipments: EquipmentItem[];
  userRole: UserRole;
  permissions?: RolePermissions;
  onAddEquipment: (eq: Omit<EquipmentItem, 'id'>) => void;
}

export const EquipmentMonitoring: React.FC<EquipmentMonitoringProps> = ({
  equipments,
  userRole,
  permissions,
  onAddEquipment,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEq, setNewEq] = useState<Omit<EquipmentItem, 'id'>>({
    name: '',
    quantity: 1,
    condition: 'Baik',
    operator: '',
    workHoursHM: 100,
    lastMaintenance: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const canEdit =
    permissions?.canManageEquipment ??
    (userRole === 'Kontraktor' ||
      userRole === 'Konsultan' ||
      userRole === 'Owner' ||
      userRole === 'Site Manager' ||
      userRole === 'Direktur' ||
      userRole === 'Admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEq.name) return;
    onAddEquipment(newEq);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Truck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Monitoring Alat Berat & Fasilitas Site</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pengelolaan unit alat berat, jam kerja HM (Hour Meter), operator, dan jadwal pemeliharaan (maintenance)
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" /> Tambah Unit Alat
          </button>
        )}
      </div>

      {/* Grid of Equipment */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {equipments.map((eq) => (
          <div
            key={eq.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">{eq.name}</h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                    eq.condition === 'Baik'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      : eq.condition === 'Perlu Maintenance'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : 'bg-red-500/10 text-red-500 border-red-500/30'
                  }`}
                >
                  {eq.condition}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Jumlah Unit:</span>
                  <strong className="text-slate-900 dark:text-white">{eq.quantity} Unit</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Operator:</span>
                  <strong className="text-slate-900 dark:text-white">{eq.operator}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Jam Kerja (HM):</span>
                  <strong className="text-orange-500">{eq.workHoursHM} Jam HM</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>Servis Terakhir:</span>
                  <strong className="text-slate-900 dark:text-white">{eq.lastMaintenance}</strong>
                </div>
              </div>
            </div>

            {eq.notes && (
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400">
                Catatan: {eq.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Tambah Unit Alat Berat</h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nama Alat Berat / Mesin</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tower Crane 50m Boom"
                  value={newEq.name}
                  onChange={(e) => setNewEq({ ...newEq, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Jumlah Unit</label>
                  <input
                    type="number"
                    value={newEq.quantity}
                    onChange={(e) => setNewEq({ ...newEq, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Kondisi Saat Ini</label>
                  <select
                    value={newEq.condition}
                    onChange={(e) => setNewEq({ ...newEq, condition: e.target.value as EquipmentItem['condition'] })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Perlu Maintenance">Perlu Maintenance</option>
                    <option value="Rusak">Rusak</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Nama Operator</label>
                <input
                  type="text"
                  placeholder="Joko Widodo"
                  value={newEq.operator}
                  onChange={(e) => setNewEq({ ...newEq, operator: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
                >
                  Simpan Alat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
