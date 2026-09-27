import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { WorkerItem, WorkerAllocation } from '../../types';
import {
  X,
  Printer,
  QrCode,
  HardHat,
  ShieldCheck,
  Building,
  User,
  CheckCircle2,
  Calendar,
  Wallet,
  Download,
} from 'lucide-react';
import { formatIDR } from '../../utils/calculations';

interface WorkerBadgeCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: WorkerItem[];
  selectedWorker?: WorkerItem | null;
  allocations: WorkerAllocation[];
}

export const WorkerBadgeCardModal: React.FC<WorkerBadgeCardModalProps> = ({
  isOpen,
  onClose,
  workers,
  selectedWorker,
  allocations,
}) => {
  const [viewMode, setViewMode] = useState<'single' | 'all'>(selectedWorker ? 'single' : 'all');
  const [activeWorkerId, setActiveWorkerId] = useState<string>(selectedWorker?.id || workers[0]?.id || '');

  if (!isOpen) return null;

  const currentWorker = workers.find((w) => w.id === activeWorkerId) || workers[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl relative my-6 text-slate-900 dark:text-white flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Kartu Tanda Pengenal &amp; QR Code Absensi Pekerja
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cetak kartu tanda pengenal resmi pekerja lapangan untuk pemindaian absensi harian dan validasi alokasi tugas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kartu</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Toggle Bar */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-orange-500'
              }`}
            >
              Kartu Tunggal
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-orange-500'
              }`}
            >
              Semua Pekerja ({workers.length})
            </button>
          </div>

          {viewMode === 'single' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Pilih Pekerja:</span>
              <select
                value={activeWorkerId}
                onChange={(e) => setActiveWorkerId(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
              >
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.role}) - {w.id}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Modal Printable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {viewMode === 'single' && currentWorker && (
            <div className="flex flex-col items-center justify-center py-4">
              {/* Official Worker Badge Card */}
              <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-white border-2 border-orange-500/50 shadow-2xl p-6 relative overflow-hidden space-y-4">
                {/* Lanyard Slot simulation */}
                <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto border border-slate-700 shadow-inner" />

                {/* Company & Project Header */}
                <div className="text-center border-b border-slate-700/80 pb-3 space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-black tracking-widest text-orange-400 uppercase">
                    <Building className="w-3.5 h-3.5" />
                    <span>PT. FORESYNDO GLOBAL INDONESIA</span>
                  </div>
                  <h4 className="text-xs font-black tracking-wide text-white uppercase">
                    PROYEK GEDUNG FORESYNDO 2
                  </h4>
                  <p className="text-[9px] text-slate-400">
                    Pelaksana: PT. GONG MBE LINK PAMUNGKAS
                  </p>
                </div>

                {/* Worker Avatar & Info */}
                <div className="flex items-center gap-3.5 bg-white/5 p-3 rounded-2xl border border-white/10">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                    <HardHat className="w-8 h-8" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      ID: {currentWorker.id}
                    </span>
                    <h3 className="text-base font-black text-white truncate">
                      {currentWorker.name}
                    </h3>
                    <span className="text-xs font-bold text-orange-400 block truncate">
                      {currentWorker.role}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">
                      Status: {currentWorker.status} &bull; {currentWorker.daysWorked} Hari Kerja
                    </span>
                  </div>
                </div>

                {/* Official QR Code Box */}
                <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-lg border-2 border-slate-200">
                  <QRCodeSVG
                    value={currentWorker.id}
                    size={150}
                    level="H"
                    includeMargin={false}
                  />
                  <span className="font-mono text-xs font-black text-slate-900 tracking-wider mt-2">
                    {currentWorker.id}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                    PINDAI UNTUK ABSENSI HARIAN
                  </span>
                </div>

                {/* Footer Security Badge */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[9px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Terverifikasi Mandor
                  </span>
                  <span className="font-mono">VALID SITE PASS</span>
                </div>
              </div>
            </div>
          )}

          {/* ALL WORKERS GRID SHEET */}
          {viewMode === 'all' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {workers.map((w) => (
                <div
                  key={w.id}
                  className="rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-4 shadow-md flex flex-col justify-between space-y-3 relative overflow-hidden"
                >
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-2">
                    <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest block">
                      PT. FORESYNDO GLOBAL INDONESIA
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block truncate">
                      KARTU TANDA PENGENAL PEKERJA
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0">
                      <HardHat className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-xs text-slate-900 dark:text-white truncate">
                        {w.name}
                      </h4>
                      <p className="text-[10px] text-orange-600 dark:text-orange-400 font-bold truncate">
                        {w.role}
                      </p>
                      <span className="font-mono text-[9px] text-slate-400">
                        {w.id}
                      </span>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="bg-white p-3 rounded-xl flex flex-col items-center justify-center border border-slate-200 shadow-inner">
                    <QRCodeSVG
                      value={w.id}
                      size={100}
                      level="M"
                      includeMargin={false}
                    />
                    <span className="font-mono text-[10px] font-bold text-slate-800 mt-1">
                      {w.id}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 text-[9px] text-slate-400 flex items-center justify-between">
                    <span>Proyek Foresyndo 2</span>
                    <span className="text-emerald-500 font-bold">Resmi ✓</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between gap-3 print:hidden">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dapat dicetak pada kertas A4 / PVC kartu pengenal untuk dipasang pada rompi atau helm pekerja.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
