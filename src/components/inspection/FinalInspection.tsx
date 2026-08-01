import React, { useState, useRef, useEffect } from 'react';
import { WorkItem, ProjectInfo, UserRole, AuditLog } from '../../types';
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
} from 'lucide-react';
import { formatIDR, calculatePhysicalProgress } from '../../utils/calculations';

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
  directorName: string;
  directorSignedAt: string;
  directorSignatureData: string; // canvas base64 or verified badge
  isCompleted: boolean;
}

interface FinalInspectionProps {
  project: ProjectInfo;
  workItems: WorkItem[];
  userRole: UserRole;
  onUpdateProjectStatus: (status: ProjectInfo['status']) => void;
  onAddAuditLog: (action: string, details: string) => void;
}

export const FinalInspection: React.FC<FinalInspectionProps> = ({
  project,
  workItems,
  userRole,
  onUpdateProjectStatus,
  onAddAuditLog,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'checklist' | 'signatures' | 'bast'>('checklist');

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
    if (saved) return JSON.parse(saved);

    return {
      bastNumber: `BAST-1/FGI/${project.contractNumber}/2027`,
      handoverDate: new Date().toISOString().split('T')[0],
      siteManagerName: 'Ir. Agus Pratama',
      siteManagerSignedAt: '',
      siteManagerSignatureData: '',
      directorName: 'H. Bambang S.',
      directorSignedAt: '',
      directorSignatureData: '',
      isCompleted: project.status === 'Selesai',
    };
  });

  // Canvas Refs for Drawing Signatures
  const smCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dirCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDrawingSM, setIsDrawingSM] = useState(false);
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

  // Toggle item inspection approval
  const handleToggleSMApprove = (id: string) => {
    if (userRole !== 'Site Manager' && userRole !== 'Direktur' && userRole !== 'Admin') return;
    setInspections((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        siteManagerApproved: !prev[id]?.siteManagerApproved,
      },
    }));
  };

  const handleToggleDirApprove = (id: string) => {
    if (userRole !== 'Direktur' && userRole !== 'Admin') return;
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

    onUpdateProjectStatus('Selesai');
    onAddAuditLog(
      'Pengesahan BAST-1 Final Handover',
      `Berita Acara Serah Terima No. ${bastData.bastNumber} disahkan resmi oleh Direktur (${bastData.directorName}) dan Site Manager (${bastData.siteManagerName}). Status Proyek: SELESAI.`
    );

    setActiveSubTab('bast');
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
              Verifikasi kelayakan mutu fisik setiap sektor &amp; otorisasi tanda tangan digital ganda (Site Manager &amp; Direktur)
            </p>
          </div>

          {/* Subtab Toggle Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveSubTab('checklist')}
              className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeSubTab === 'checklist'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" /> Checklist Sektor
            </button>
            <button
              onClick={() => setActiveSubTab('signatures')}
              className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeSubTab === 'signatures'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <PenTool className="w-4 h-4" /> Tanda Tangan Digital
            </button>
            <button
              onClick={() => setActiveSubTab('bast')}
              className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeSubTab === 'bast'
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <FileCheck2 className="w-4 h-4" /> Dokumen Resmi BAST-1
            </button>
          </div>
        </div>

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
              {(userRole === 'Direktur' || userRole === 'Site Manager' || userRole === 'Admin') && (
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
                            disabled={userRole !== 'Site Manager' && userRole !== 'Direktur' && userRole !== 'Admin'}
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
                            disabled={userRole !== 'Direktur' && userRole !== 'Admin'}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Site Manager Signature Pad */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block">
                      TANDA TANGAN OTORISASI 1
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Site Manager (Penanggung Jawab Lapangan)</h3>
                  </div>
                  {bastData.siteManagerSignatureData && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Tanda Tangan Ada
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
                      Gambar Tanda Tangan Digital di bawah:
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
                        className="text-[11px] font-bold text-orange-500 hover:underline"
                      >
                        Gunakan QR Verified Badge
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-1 relative overflow-hidden">
                    {bastData.siteManagerSignatureData === 'PRESET_VERIFIED_SM' ? (
                      <div className="h-32 flex flex-col items-center justify-center text-center p-3 bg-blue-50 text-blue-900 rounded-lg">
                        <QrCode className="w-10 h-10 text-blue-700 mb-1" />
                        <span className="text-xs font-black">VERIFIED DIGITAL QR SIGNATURE</span>
                        <span className="text-[10px] text-blue-600 font-mono">ID: SM-FORESYNDO-AP2026</span>
                      </div>
                    ) : (
                      <canvas
                        ref={smCanvasRef}
                        width={350}
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

              {/* Direktur Signature Pad */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider block">
                      TANDA TANGAN OTORISASI 2
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">Direktur Utama (Pemilik / Developer)</h3>
                  </div>
                  {bastData.directorSignatureData && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Tanda Tangan Ada
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
                      Gambar Tanda Tangan Digital di bawah:
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
                        className="text-[11px] font-bold text-orange-500 hover:underline"
                      >
                        Gunakan QR Verified Badge
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-1 relative overflow-hidden">
                    {bastData.directorSignatureData === 'PRESET_VERIFIED_DIR' ? (
                      <div className="h-32 flex flex-col items-center justify-center text-center p-3 bg-emerald-50 text-emerald-900 rounded-lg">
                        <QrCode className="w-10 h-10 text-emerald-700 mb-1" />
                        <span className="text-xs font-black">VERIFIED DIGITAL QR SIGNATURE</span>
                        <span className="text-[10px] text-emerald-600 font-mono">ID: DIR-FORESYNDO-BS2026</span>
                      </div>
                    ) : (
                      <canvas
                        ref={dirCanvasRef}
                        width={350}
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
                  <Award className="w-4 h-4" /> Checklist Syarat Handover BAST-1 Selesai Proyek
                </h4>
                <span className="text-xs font-bold text-slate-400">
                  Nomor BAST: <span className="text-white font-mono">{bastData.bastNumber}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-semibold">
                <div className={`p-3 rounded-xl border ${allSMApproved ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {allSMApproved ? '✓ 14 Sektor Lulus SM' : '✗ Belum Semua Sektor Disetujui SM'}
                </div>
                <div className={`p-3 rounded-xl border ${allDirApproved ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {allDirApproved ? '✓ 14 Sektor Lulus Direktur' : '✗ Belum Semua Sektor Disetujui Direktur'}
                </div>
                <div className={`p-3 rounded-xl border ${bastData.siteManagerSignatureData ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {bastData.siteManagerSignatureData ? '✓ TTD Site Manager Siap' : '✗ TTD Site Manager Belum ADA'}
                </div>
                <div className={`p-3 rounded-xl border ${bastData.directorSignatureData ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                  {bastData.directorSignatureData ? '✓ TTD Direktur Siap' : '✗ TTD Direktur Belum ADA'}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800">
                <p className="text-xs text-slate-400">
                  Dengan menekan tombol di bawah, Anda mengonfirmasi penyerahan BAST-1 resmi dan mengubah status proyek secara permanen menjadi <strong className="text-emerald-400">SELESAI</strong>.
                </p>

                <button
                  onClick={handleFinalizeBAST}
                  disabled={!bastData.siteManagerSignatureData || !bastData.directorSignatureData || !isFullyApproved}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all shrink-0"
                >
                  <Award className="w-5 h-5" /> Sahkan BAST-1 &amp; Selesaikan Proyek
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OFFICIAL PRINTABLE BAST-1 DOCUMENT */}
        {activeSubTab === 'bast' && (
          <div className="space-y-4">
            <div className="flex justify-end print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all"
              >
                <Printer className="w-4 h-4 text-orange-400" /> Cetak / Export Dokumen BAST-1
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
                    DOKUMEN HUKUM RESMI
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
              </div>

              {/* Statement Body */}
              <div className="space-y-3 leading-relaxed text-slate-800">
                <p>
                  Pada hari ini, <strong className="text-slate-900">Sabtu</strong> tanggal <strong className="text-slate-900">{bastData.handoverDate}</strong>, kami yang bertanda tangan di bawah ini:
                </p>

                <div className="pl-4 space-y-2 border-l-2 border-blue-900">
                  <div>
                    <span className="font-bold text-slate-900 block">1. {bastData.siteManagerName}</span>
                    <span className="text-slate-600 text-[11px]">
                      Jabatan: Site Manager / Tim Pelaksana Lapangan PT Foresyndo Global Indonesia, selanjutnya disebut <strong className="text-slate-900">PIHAK PERTAMA (KONTRAKTOR)</strong>.
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">2. {bastData.directorName}</span>
                    <span className="text-slate-600 text-[11px]">
                      Jabatan: Direktur Utama PT Foresyndo Global Indonesia, selanjutnya disebut <strong className="text-slate-900">PIHAK KEDUA (PEMILIK/PENGEMBANG)</strong>.
                    </span>
                  </div>
                </div>

                <p>
                  Menerangkan bahwa PIHAK PERTAMA telah menyelesaikan seluruh rangkaian Pekerjaan Konstruksi <strong className="text-slate-900">{project.name}</strong> di lokasi <strong className="text-slate-900">{project.location}</strong> sesuai dengan spesifikasi teknis, gambar kerja, dan Lampiran RAB Teraudit No. <strong className="text-slate-900">{project.contractNumber}</strong> dengan pencapaian progress fisik <strong className="text-emerald-700 font-bold">100.0% (Lulus Inspeksi Akhir)</strong>.
                </p>
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

              {/* Signatures Dual Block */}
              <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-center">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">PIHAK PERTAMA (KONTRAKTOR)</span>
                  <span className="font-bold text-slate-900 block">{bastData.siteManagerName}</span>
                  <div className="h-24 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 p-2">
                    {bastData.siteManagerSignatureData === 'PRESET_VERIFIED_SM' ? (
                      <div className="flex flex-col items-center">
                        <QrCode className="w-10 h-10 text-blue-900" />
                        <span className="text-[8px] font-mono font-bold text-blue-900">VERIFIED QR SIGNATURE</span>
                      </div>
                    ) : bastData.siteManagerSignatureData ? (
                      <img src={bastData.siteManagerSignatureData} alt="TTD SM" className="max-h-20 max-w-full object-contain" />
                    ) : (
                      <span className="text-slate-400 italic text-[10px]">[ Belum Ditandatangani ]</span>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono block">Site Manager</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">PIHAK KEDUA (DIREKTUR)</span>
                  <span className="font-bold text-slate-900 block">{bastData.directorName}</span>
                  <div className="h-24 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 p-2">
                    {bastData.directorSignatureData === 'PRESET_VERIFIED_DIR' ? (
                      <div className="flex flex-col items-center">
                        <QrCode className="w-10 h-10 text-emerald-900" />
                        <span className="text-[8px] font-mono font-bold text-emerald-900">VERIFIED QR SIGNATURE</span>
                      </div>
                    ) : bastData.directorSignatureData ? (
                      <img src={bastData.directorSignatureData} alt="TTD Direktur" className="max-h-20 max-w-full object-contain" />
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
    </div>
  );
};
