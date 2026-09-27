import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { WorkerItem, WorkerAllocation, WorkItem, DailyAttendance } from '../../types';
import {
  Camera,
  X,
  Scan,
  RefreshCw,
  Upload,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
  History,
  Check,
  ShieldCheck,
  UserCheck,
  HardHat,
  Clock,
  Calendar,
  Briefcase,
  Layers,
  ArrowRight,
  Printer,
  ChevronRight,
  Info,
} from 'lucide-react';
import { formatIDR } from '../../utils/calculations';

export interface WorkerScanHistoryItem {
  id: string;
  workerId: string;
  workerName: string;
  workerRole: string;
  checkInTime: string;
  allocatedTaskName: string;
  isFirstCheckInToday: boolean;
  timestamp: number;
}

interface WorkerQRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: WorkerItem[];
  allocations: WorkerAllocation[];
  workItems: WorkItem[];
  todayAttendances: DailyAttendance[];
  onValidateAttendance: (
    workerId: string,
    checkInTime?: string,
    customNote?: string
  ) => { worker?: WorkerItem; allocation?: WorkerAllocation; isNewCheckIn: boolean; error?: string };
  onOpenWorkerBadge?: (worker: WorkerItem) => void;
}

export const WorkerQRScannerModal: React.FC<WorkerQRScannerModalProps> = ({
  isOpen,
  onClose,
  workers,
  allocations,
  workItems,
  todayAttendances,
  onValidateAttendance,
  onOpenWorkerBadge,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>('camera');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Scanned validation feedback
  const [lastScannedResult, setLastScannedResult] = useState<{
    worker: WorkerItem;
    allocation?: WorkerAllocation;
    checkInTime: string;
    isNewCheckIn: boolean;
    alreadyCheckedInNotice?: string;
  } | null>(null);

  // Manual input state
  const [manualInput, setManualInput] = useState<string>('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Real-time Scan Session History
  const [scanHistory, setScanHistory] = useState<WorkerScanHistoryItem[]>([]);

  // Flash card overlay for immediate visual reward
  const [successBanner, setSuccessBanner] = useState<{
    workerName: string;
    role: string;
    taskName: string;
    timeStr: string;
  } | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastScannedTimeRef = useRef<{ [code: string]: number }>({});

  // Audio synthesizer: Success Beep (880Hz -> 1320Hz)
  const playSuccessChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // Audio autoplay policy
    }
  };

  // Audio synthesizer: Error Buzz (220Hz low tone)
  const playErrorBuzz = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch {
      // Audio error fallback
    }
  };

  // Parse scanned raw string to identify worker
  const parseWorkerFromCode = (rawCode: string): WorkerItem | null => {
    const trimmed = rawCode.trim();
    if (!trimmed) return null;

    // 1. Check direct ID match (e.g. "WRK-01", "W-01", "WRK-12345")
    let match = workers.find((w) => w.id.toLowerCase() === trimmed.toLowerCase());
    if (match) return match;

    // 2. Check prefixed format "WRK-QR:WRK-01" or "QR-WRK-01" or "ATTENDANCE:WRK-01"
    const prefixMatch = trimmed.match(/(?:WRK-QR:|QR-WORKER:|ATTENDANCE:|QR:)?(WRK-[\w-]+|W-[\w-]+)/i);
    if (prefixMatch && prefixMatch[1]) {
      const candidateId = prefixMatch[1].toUpperCase();
      match = workers.find((w) => w.id.toLowerCase() === candidateId.toLowerCase());
      if (match) return match;
    }

    // 3. Check JSON format: { "type": "WORKER_ATTENDANCE", "workerId": "WRK-01", ... }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        const targetId = parsed.workerId || parsed.id;
        if (targetId) {
          match = workers.find((w) => w.id.toLowerCase() === String(targetId).toLowerCase());
          if (match) return match;
        }
      } catch {
        // Not JSON
      }
    }

    // 4. Fallback search by worker name
    match = workers.find((w) => w.name.toLowerCase() === trimmed.toLowerCase() || trimmed.toLowerCase().includes(w.name.toLowerCase()));
    if (match) return match;

    return null;
  };

  // Process validated scan
  const handleProcessScan = (rawText: string) => {
    const now = Date.now();
    // Debounce scan of same worker within 2.5 seconds to avoid double-triggers
    if (lastScannedTimeRef.current[rawText] && now - lastScannedTimeRef.current[rawText] < 2500) {
      return;
    }
    lastScannedTimeRef.current[rawText] = now;

    const matchedWorker = parseWorkerFromCode(rawText);

    if (!matchedWorker) {
      playErrorBuzz();
      setManualError(`Pekerja dengan kode "${rawText}" tidak ditemukan dalam database roster proyek.`);
      return;
    }

    setManualError(null);
    playSuccessChime();

    // Trigger vibration on supported devices
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {
        // Haptic fallback
      }
    }

    // Now format time
    const dateObj = new Date();
    const timeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}:${String(dateObj.getSeconds()).padStart(2, '0')} WIB`;

    // Call validation handler
    const result = onValidateAttendance(matchedWorker.id, timeStr);

    const relatedAlloc = result.allocation || allocations.find((a) => a.workerId === matchedWorker.id);
    const taskName = relatedAlloc?.workItemName || 'Sektor Utama Lapangan (Tervalidasi Hari Ini)';

    setLastScannedResult({
      worker: matchedWorker,
      allocation: relatedAlloc,
      checkInTime: timeStr,
      isNewCheckIn: result.isNewCheckIn,
      alreadyCheckedInNotice: result.isNewCheckIn
        ? undefined
        : 'Pekerja ini telah tercatat absen sebelumnya hari ini. Status alokasi diperbarui.',
    });

    // Add to session log
    setScanHistory((prev) => [
      {
        id: `SCAN-${Date.now()}`,
        workerId: matchedWorker.id,
        workerName: matchedWorker.name,
        workerRole: matchedWorker.role,
        checkInTime: timeStr,
        allocatedTaskName: taskName,
        isFirstCheckInToday: result.isNewCheckIn,
        timestamp: Date.now(),
      },
      ...prev.slice(0, 19), // Keep last 20
    ]);

    // Show temporary celebratory flash banner
    setSuccessBanner({
      workerName: matchedWorker.name,
      role: matchedWorker.role,
      taskName,
      timeStr,
    });

    setTimeout(() => {
      setSuccessBanner(null);
    }, 4000);
  };

  // Setup / Clean Html5Qrcode Scanner
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCameraScanner();
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      try {
        // Ensure DOM container exists
        const element = document.getElementById('worker-qr-reader');
        if (!element) return;

        if (html5QrCodeRef.current) {
          await stopCameraScanner();
        }

        const scanner = new Html5Qrcode('worker-qr-reader', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
          ],
          verbose: false,
        });

        html5QrCodeRef.current = scanner;

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        };

        await scanner.start(
          { facingMode: cameraFacing },
          config,
          (decodedText) => {
            if (isMounted) {
              handleProcessScan(decodedText);
            }
          },
          () => {
            // Frame scan without QR (ignore)
          }
        );

        if (isMounted) {
          setIsCameraActive(true);
          setCameraError(null);
        }
      } catch (err: any) {
        console.warn('Camera start issue:', err);
        if (isMounted) {
          setIsCameraActive(false);
          setCameraError(
            err?.message ||
              'Tidak dapat mengakses kamera. Pastikan izin kamera aktif, atau gunakan mode "Unggah Berkas QR" / "Simulasi Cepat".'
          );
        }
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopCameraScanner();
    };
  }, [isOpen, activeTab, cameraFacing]);

  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('Error stopping scanner:', e);
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = async () => {
    await stopCameraScanner();
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Handle file upload scanning
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('worker-qr-file-dummy', false);
      const decodedText = await html5QrCode.scanFile(file, true);
      handleProcessScan(decodedText);
      await html5QrCode.clear();
    } catch (err: any) {
      playErrorBuzz();
      setManualError('Tidak terdeteksi QR Code valid pada berkas foto yang diunggah. Coba foto lain dengan kontras jelas.');
    }
  };

  // Handle Manual Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleProcessScan(manualInput.trim());
    setManualInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      {/* Hidden container for file scan processing */}
      <div id="worker-qr-file-dummy" className="hidden" />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl relative my-6 text-slate-900 dark:text-white flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 shrink-0">
              <Scan className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Pemindai QR Code Absensi Lapangan
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  AUTO-VALIDASI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pindai kartu ID pekerja untuk mengonfirmasi kehadiran harian dan memvalidasi alokasi tugas Time Schedule secara otomatis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
              title={soundEnabled ? 'Matikan Suara Beep' : 'Aktifkan Suara Beep'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              type="button"
              onClick={() => {
                stopCameraScanner();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
              title="Tutup Pemindai"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Flash Banner */}
        {successBanner && (
          <div className="bg-emerald-500 text-white px-4 py-3 flex items-center justify-between gap-3 animate-fadeIn shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-white/20">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-black tracking-wide">
                  ABSENSI BERHASIL: {successBanner.workerName} ({successBanner.role})
                </p>
                <p className="text-[11px] text-emerald-100 flex items-center gap-2">
                  <span>Pukul: {successBanner.timeStr}</span>
                  <span>&bull;</span>
                  <span>Alokasi: {successBanner.taskName}</span>
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white text-emerald-800">
              TERVALIDASI ✓
            </span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 pt-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'camera'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Kamera Langsung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'upload'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Unggah Foto QR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'manual'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Simulasi Cepat &amp; Manual
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: LIVE CAMERA */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <div className="relative rounded-2xl bg-black overflow-hidden flex flex-col items-center justify-center min-h-[300px] border border-slate-800 shadow-inner">
                {/* Html5Qrcode video mount point */}
                <div id="worker-qr-reader" className="w-full max-w-[420px]" />

                {/* Camera reticle overlay with laser line */}
                {isCameraActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-orange-500/80 rounded-2xl relative shadow-2xl shadow-orange-500/30">
                      {/* Corner Highlights */}
                      <span className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-orange-400 rounded-tl-lg" />
                      <span className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-orange-400 rounded-tr-lg" />
                      <span className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-orange-400 rounded-bl-lg" />
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-orange-400 rounded-br-lg" />
                      {/* Scanning laser animation */}
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_12px_#f97316] animate-bounce" />
                    </div>
                  </div>
                )}

                {/* Camera Error or Loading state */}
                {!isCameraActive && (
                  <div className="p-6 text-center text-slate-300 space-y-3 z-10 max-w-md">
                    {cameraError ? (
                      <>
                        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                        <p className="text-xs font-semibold text-rose-300">{cameraError}</p>
                        <p className="text-[11px] text-slate-400">
                          Anda tetap dapat melakukan absensi melalui tab <strong>"Simulasi Cepat &amp; Manual"</strong> atau mengunggah foto kartu QR pekerja.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full border-3 border-orange-500 border-t-transparent animate-spin mx-auto" />
                        <p className="text-xs font-semibold">Menginisialisasi Kamera Lapangan...</p>
                        <p className="text-[11px] text-slate-400">Pastikan Anda telah memberikan izin akses kamera pada browser.</p>
                      </>
                    )}
                  </div>
                )}

                {/* Floating controls inside camera */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white backdrop-blur-md border border-white/20 text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
                    title="Ganti Kamera Depan / Belakang"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px] font-bold">
                      {cameraFacing === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}
                    </span>
                  </button>
                </div>

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300 bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 z-20">
                  <span className="flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5 text-orange-400" />
                    Arahkan QR ID Badge Pekerja ke dalam bingkai
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">15 FPS &bull; REALTIME</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD QR IMAGE */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-orange-500 rounded-2xl p-8 text-center cursor-pointer transition-all bg-slate-50 dark:bg-slate-800/40 hover:bg-orange-500/5 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Klik untuk Memilih Foto / Screenshot QR Code
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Mendukung format PNG, JPG, JPEG, atau WebP dari hasil foto kartu pengenal pekerja lapangan.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {manualError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{manualError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: QUICK SIMULATION & MANUAL INPUT */}
          {activeTab === 'manual' && (
            <div className="space-y-4">
              {/* Form Input Manual */}
              <form onSubmit={handleManualSubmit} className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Input ID Pekerja / Kode QR Manual:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Contoh: WRK-01 atau nama pekerja (Suparno)"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Validasi
                  </button>
                </div>
                {manualError && (
                  <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {manualError}
                  </p>
                )}
              </form>

              {/* 1-Click Worker Quick Scan Simulator */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Simulasi Scan Cepat Personel Proyek:
                  </span>
                  <span className="text-[10px] text-slate-400">Klik salah satu untuk simulasi pindai QR</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {workers.map((w) => {
                    const isAttended = todayAttendances.some((att) => att.workerId === w.id && att.isPresent);
                    const workerAlloc = allocations.find((a) => a.workerId === w.id);

                    return (
                      <div
                        key={w.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 ${
                          isAttended
                            ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-500/10'
                            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-orange-500'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {w.name}
                            </span>
                            <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold shrink-0">
                              {w.id}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                            {w.role} &bull; {formatIDR(w.dailyWage)}/hari
                          </span>
                          <span className="text-[9px] text-slate-400 truncate block mt-0.5">
                            {workerAlloc ? `Tugas: ${workerAlloc.workItemName}` : 'Belum ada alokasi Time Schedule'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isAttended && (
                            <span className="p-1 rounded-lg bg-emerald-500 text-white" title="Sudah Absen Hari Ini">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleProcessScan(w.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <Scan className="w-3 h-3" />
                            <span>Pindai</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* LAST SCANNED RESULT CARD */}
          {lastScannedResult && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white border border-slate-700/80 shadow-xl space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-700/70 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500 text-white">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white block">
                      Hasil Verifikasi Lapangan Terakhir
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Check-in pkl {lastScannedResult.checkInTime} &bull; Validasi Alokasi Otomatis
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    lastScannedResult.isNewCheckIn
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {lastScannedResult.isNewCheckIn ? 'BARU MASUK (VALID)' : 'SUDAH TERVERIFIKASI'}
                </span>
              </div>

              {lastScannedResult.alreadyCheckedInNotice && (
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-1.5 font-medium">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>{lastScannedResult.alreadyCheckedInNotice}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Worker Identity */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Identitas Pekerja:
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm text-white">{lastScannedResult.worker.name}</span>
                    <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-white/20 text-white">
                      {lastScannedResult.worker.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-orange-400 font-semibold">{lastScannedResult.worker.role}</p>
                  <p className="text-[10px] text-slate-400">
                    Tarif Harian: <strong className="text-slate-200">{formatIDR(lastScannedResult.worker.dailyWage)}</strong> &bull; Total Hadir: {lastScannedResult.worker.daysWorked} hari
                  </p>
                </div>

                {/* Auto-Validated Allocation */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Alokasi Tugas Time Schedule:
                  </span>
                  <p className="font-bold text-xs text-white line-clamp-2">
                    {lastScannedResult.allocation?.workItemName || 'Sektor 1: Pekerjaan Lapangan Konstruksi Foresyndo 2'}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-300 mt-1">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      Status: {lastScannedResult.allocation?.status || 'Dalam Pengerjaan'}
                    </span>
                    <span>Output Target: {lastScannedResult.allocation?.targetOutput || 20} {lastScannedResult.allocation?.unit || 'm²'}</span>
                  </div>
                  <p className="text-[9px] text-emerald-300 italic mt-0.5">
                    ✓ Validasi kehadiran otomatis terhubung ke perhitungan upah harian.
                  </p>
                </div>
              </div>

              {onOpenWorkerBadge && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenWorkerBadge(lastScannedResult.worker);
                    }}
                    className="text-[11px] text-orange-400 hover:text-orange-300 flex items-center gap-1 font-bold underline cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Lihat &amp; Cetak Kartu ID Badge ({lastScannedResult.worker.name})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SCAN SESSION RECENT LOG */}
          {scanHistory.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  Riwayat Pemindaian Sesi Ini ({scanHistory.length} scan):
                </span>
                <button
                  type="button"
                  onClick={() => setScanHistory([])}
                  className="text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer"
                >
                  Bersihkan Riwayat
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-36 overflow-y-auto text-xs">
                {scanHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white truncate block">
                          {item.workerName}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block">
                          {item.workerRole} &bull; {item.allocatedTaskName}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 block">
                        {item.checkInTime}
                      </span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Tervalidasi ✓
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Tervalidasi hari ini: <strong className="text-slate-900 dark:text-white font-bold">{todayAttendances.filter((a) => a.isPresent).length}</strong> dari {workers.length} pekerja
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                stopCameraScanner();
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Tutup Pemindai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
