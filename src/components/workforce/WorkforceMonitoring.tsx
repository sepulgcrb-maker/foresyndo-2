import React, { useState } from 'react';
import { WorkerItem, UserRole } from '../../types';
import { Users, Plus, CheckCircle2, UserCheck, DollarSign, Calendar } from 'lucide-react';
import { formatIDR } from '../../utils/calculations';

interface WorkforceMonitoringProps {
  workers: WorkerItem[];
  userRole: UserRole;
  onAddWorker: (w: Omit<WorkerItem, 'id'>) => void;
}

export const WorkforceMonitoring: React.FC<WorkforceMonitoringProps> = ({ workers, userRole, onAddWorker }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWorker, setNewWorker] = useState<Omit<WorkerItem, 'id'>>({
    name: '',
    role: 'Tukang Batu',
    dailyWage: 170000,
    daysWorked: 1,
    status: 'Aktif',
  });

  const canEdit = userRole === 'Admin' || userRole === 'Site Manager' || userRole === 'Direktur';

  const totalDailyPayroll = workers.reduce((acc, w) => acc + (w.status === 'Aktif' ? w.dailyWage : 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorker.name) return;
    onAddWorker(newWorker);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Monitoring Tenaga Kerja & Absensi</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data mandor, tukang, pekerja, upah harian, dan absensi lapangan proyek FORESYNDO 2
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" /> Tambah Tenaga Kerja
          </button>
        )}
      </div>

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

      {/* Modal Add Worker */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Tambah Tenaga Kerja Baru</h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nama Lengkap Pekerja</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Supriadi"
                  value={newWorker.name}
                  onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Jabatan / Kualifikasi</label>
                <input
                  type="text"
                  placeholder="Mandor, Tukang Besi, Tukang Batu, Safety Officer"
                  value={newWorker.role}
                  onChange={(e) => setNewWorker({ ...newWorker, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Upah Harian (Rp)</label>
                <input
                  type="number"
                  value={newWorker.dailyWage}
                  onChange={(e) => setNewWorker({ ...newWorker, dailyWage: parseFloat(e.target.value) || 0 })}
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
                  Simpan Pekerja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
