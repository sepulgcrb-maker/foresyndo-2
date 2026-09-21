import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { MaterialItem } from '../../types';
import {
  Camera,
  X,
  Scan,
  RefreshCw,
  Upload,
  QrCode,
  Barcode as BarcodeIcon,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  Plus,
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX,
  Zap,
  History,
  Check,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { formatIDR } from '../../utils/calculations';

export interface ScanSessionLog {
  id: string;
  code: string;
  materialName: string;
  unit: string;
  action: 'use' | 'add';
  amount: number;
  newStock: number;
  timestamp: string;
}

interface MaterialBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: MaterialItem[];
  onSelectMaterial: (material: MaterialItem) => void;
  onQuickStockAdjust?: (material: MaterialItem, type: 'add' | 'use', amount: number, notes: string) => void;
  onOpenAddModalWithBarcode?: (barcode: string) => void;
  onAddMaterialWithBarcode?: (barcode: string) => void;
  onFillBarcodeToForm?: (barcode: string) => void;
  onFillBarcode?: (barcode: string) => void;
  initialMode?: 'camera' | 'upload' | 'manual';
  targetContext?: 'inventory' | 'fill_form';
}

export const MaterialBarcodeScannerModal: React.FC<MaterialBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  materials,
  onSelectMaterial,
  onQuickStockAdjust,
  onOpenAddModalWithBarcode,
  onAddMaterialWithBarcode,
  onFillBarcodeToForm,
  onFillBarcode,
  initialMode = 'camera',
  targetContext = 'inventory',
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual'>(initialMode);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string>('');
  const [matchedMaterial, setMatchedMaterial] = useState<MaterialItem | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Auto-Update Mode State
  const [autoUpdateMode, setAutoUpdateMode] = useState<boolean>(true);
  const [autoAction, setAutoAction] = useState<'use' | 'add'>('use');
  const [autoAmount, setAutoAmount] = useState<number>(1);
  const [scanHistory, setScanHistory] = useState<ScanSessionLog[]>([]);
  const [autoFlashBadge, setAutoFlashBadge] = useState<{
    title: string;
    detail: string;
    newStock: number;
    unit: string;
    type: 'add' | 'use';
  } | null>(null);

  // Manual Adjust State inside matched card
  const [adjustType, setAdjustType] = useState<'add' | 'use'>('use');
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState<string>('');

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const lastScannedTimeRef = useRef<{ [code: string]: number }>({});

  const handleAddWithBarcode = onOpenAddModalWithBarcode || onAddMaterialWithBarcode;
  const handleFillCode = onFillBarcodeToForm || onFillBarcode;

  // Sound generator: Standard Beep (880Hz)
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } catch {
      // Audio context restricted before user interaction
    }
  };

  // Sound generator: Positive Success Chime for Stock Update (C5 - E5 - G5)
  const playSuccessChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Note 1: C5
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Note 2: E5
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(659.25, now + 0.08);
      gain2.gain.setValueAtTime(0.14, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.22);

      // Note 3: G5
      const osc3 = audioCtx.createOscillator();
      const gain3 = audioCtx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(783.99, now + 0.16);
      gain3.gain.setValueAtTime(0.16, now + 0.16);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc3.connect(gain3);
      gain3.connect(audioCtx.destination);
      osc3.start(now + 0.16);
      osc3.stop(now + 0.38);
    } catch {
      // Audio context restricted
    }
  };

  // Find material by code with intelligent payload extraction
  const findMaterialByCode = (code: string): MaterialItem | null => {
    if (!code) return null;
    const clean = code.trim().toLowerCase();

    // 1. Direct match with id
    let found = materials.find((m) => m.id.toLowerCase() === clean);
    if (found) return found;

    // 2. Direct match with barcode
    found = materials.find((m) => m.barcode && m.barcode.toLowerCase() === clean);
    if (found) return found;

    // 3. Match with FORESYNDO-MAT:MAT-01 format (QR Label format)
    if (clean.includes('foresyndo-mat:')) {
      const extractedId = clean.replace('foresyndo-mat:', '').trim();
      found = materials.find((m) => m.id.toLowerCase() === extractedId);
      if (found) return found;
      found = materials.find((m) => m.barcode && m.barcode.toLowerCase() === extractedId);
      if (found) return found;
    }

    // 4. Safe JSON payload parsing (e.g. {"id":"MAT-01", ...})
    try {
      if (code.trim().startsWith('{') && code.trim().endsWith('}')) {
        const parsed = JSON.parse(code.trim());
        const targetId = (parsed.id || parsed.matId || parsed.code || '').toString().toLowerCase();
        const targetBarcode = (parsed.barcode || '').toString().toLowerCase();
        if (targetId) {
          found = materials.find((m) => m.id.toLowerCase() === targetId);
          if (found) return found;
        }
        if (targetBarcode) {
          found = materials.find((m) => m.barcode && m.barcode.toLowerCase() === targetBarcode);
          if (found) return found;
        }
      }
    } catch {
      // Ignore non-json
    }

    // 5. URL based QR codes (e.g. https://.../material/MAT-01)
    if (clean.includes('/material/') || clean.includes('/materials/')) {
      const parts = clean.split(/materials?\//);
      if (parts.length > 1) {
        const candidate = parts[1].split('?')[0].split('#')[0].trim();
        found = materials.find((m) => m.id.toLowerCase() === candidate);
        if (found) return found;
      }
    }

    // 6. Fuzzy match with material name or partial code
    found = materials.find(
      (m) =>
        m.name.toLowerCase().includes(clean) ||
        (m.barcode && m.barcode.toLowerCase().includes(clean)) ||
        clean.includes(m.id.toLowerCase())
    );
    return found || null;
  };

  // Handle scanned code event
  const handleDecodedCode = (code: string) => {
    if (!code) return;
    const clean = code.trim();

    // Debounce guard for continuous camera scanning (2.2 seconds per code)
    const now = Date.now();
    const lastScan = lastScannedTimeRef.current[clean] || 0;
    if (now - lastScan < 2200) {
      return; // Skip duplicate scan in cooldown window
    }
    lastScannedTimeRef.current[clean] = now;

    setScannedCode(clean);

    // If used as form helper (e.g. from Add Material form)
    if (targetContext === 'fill_form' && handleFillCode) {
      playBeep();
      if (navigator.vibrate) navigator.vibrate([60]);
      handleFillCode(clean);
      onClose();
      return;
    }

    // Otherwise check in inventory
    const match = findMaterialByCode(clean);
    setMatchedMaterial(match);

    if (match) {
      const isApproved = (match.approvalStatus || 'Disetujui') === 'Disetujui';

      // Check consultant approval requirement: Must be approved before entering warehouse stock!
      if (!isApproved) {
        playBeep();
        if (navigator.vibrate) navigator.vibrate([120, 80, 120]);

        setAutoFlashBadge({
          title: match.name,
          detail: `⚠️ DITAHAN: Belum Disetujui Konsultan MK (Izin Masuk Gudang & Barcode Belum Sah)`,
          newStock: match.stockRemaining,
          unit: match.unit,
          type: 'use',
        });

        setTimeout(() => {
          setAutoFlashBadge(null);
        }, 3800);
        return;
      }

      // Auto-Update Mode: Immediately adjust stock without requiring extra confirmation clicks!
      if (autoUpdateMode && onQuickStockAdjust) {
        playSuccessChime();
        if (navigator.vibrate) navigator.vibrate([80, 40, 80]);

        const changeAmount = autoAmount > 0 ? autoAmount : 1;
        const currentStock = match.stockRemaining;
        const newStock =
          autoAction === 'use'
            ? Math.max(0, currentStock - changeAmount)
            : currentStock + changeAmount;

        // Perform stock update
        onQuickStockAdjust(
          match,
          autoAction,
          changeAmount,
          `Pemindaian QR Label (${clean}) - Mode Auto-Update Lapangan`
        );

        // Flash in-camera notification
        setAutoFlashBadge({
          title: match.name,
          detail: `${autoAction === 'add' ? '+ Terima Pasokan' : '- Catat Pemakaian'} ${changeAmount} ${match.unit}`,
          newStock,
          unit: match.unit,
          type: autoAction,
        });

        // Add to session scan history
        const newEntry: ScanSessionLog = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          code: clean,
          materialName: match.name,
          unit: match.unit,
          action: autoAction,
          amount: changeAmount,
          newStock,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        setScanHistory((prev) => [newEntry, ...prev.slice(0, 9)]);

        // Clear flash badge after 3.2 seconds
        setTimeout(() => {
          setAutoFlashBadge(null);
        }, 3200);
      } else {
        // Manual mode: Just play beep and open confirmation card
        playBeep();
        if (navigator.vibrate) navigator.vibrate([60]);
      }
    } else {
      // Not registered yet
      playBeep();
    }
  };

  // Start Real Camera Scanner via Html5Qrcode
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
      return;
    }

    let isMounted = true;
    const elementId = 'foresyndo-qr-barcode-scanner-viewfinder';

    const startCamera = async () => {
      setCameraError(null);
      try {
        await new Promise((r) => setTimeout(r, 150));
        if (!document.getElementById(elementId)) return;

        if (html5QrCodeRef.current) {
          try {
            await html5QrCodeRef.current.stop();
          } catch {
            // ignore
          }
        }

        const formatsToSupport = [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ];

        const html5QrCode = new Html5Qrcode(elementId, {
          formatsToSupport,
          verbose: false,
        });
        html5QrCodeRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: cameraFacing },
          config,
          (decodedText) => {
            if (isMounted) {
              handleDecodedCode(decodedText);
            }
          },
          () => {
            // frame scanning (no detection)
          }
        );

        if (isMounted) {
          setIsCameraActive(true);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setIsCameraActive(false);
          const errorMsg =
            err instanceof Error
              ? err.message
              : 'Gagal mengakses kamera. Periksa izin kamera browser atau gunakan mode Upload / Manual.';
          setCameraError(errorMsg);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, activeTab, cameraFacing, autoUpdateMode, autoAction, autoAmount]);

  const stopCamera = async () => {
    if (html5QrCodeRef.current && isCameraActive) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {
        // Already stopped
      } finally {
        setIsCameraActive(false);
      }
    }
  };

  // Handle Image File Upload for QR / Barcode Scan
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode('foresyndo-qr-file-reader-dummy', {
        verbose: false,
      });
      const decodedText = await html5QrCode.scanFile(file, true);
      handleDecodedCode(decodedText);
    } catch {
      alert('Tidak dapat mendeteksi QR Code atau Barcode pada foto. Pastikan pencahayaan cukup dan gambar fokus.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Manual adjust apply
  const handleApplyManualAdjust = () => {
    if (!matchedMaterial || !onQuickStockAdjust) return;
    onQuickStockAdjust(
      matchedMaterial,
      adjustType,
      adjustAmount,
      `Pembaruan Stok Cepat via Scanner QR (${scannedCode})`
    );
    setAdjustSuccessMsg(
      `Berhasil ${adjustType === 'add' ? 'menambah' : 'mencatat pemakaian'} ${adjustAmount} ${matchedMaterial.unit}!`
    );
    playSuccessChime();
    setTimeout(() => {
      setAdjustSuccessMsg('');
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <QrCode className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {targetContext === 'fill_form'
                    ? 'Scan QR / Barcode untuk Input Form Material'
                    : 'Pemindai QR Code & Label Material'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/20 text-orange-500 dark:text-orange-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pindai QR Code label 2D atau Barcode 1D & update stok instan di lapangan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Matikan Suara Beep & Chime' : 'Aktifkan Suara Beep & Chime'}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Auto-Update Stok Setting (Banner Utama) */}
        {targetContext === 'inventory' && onQuickStockAdjust && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${autoUpdateMode ? 'bg-orange-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      Mode Auto-Update Stok (Instan)
                    </span>
                    {autoUpdateMode && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {autoUpdateMode
                      ? 'Setiap QR label yang terdeteksi akan langsung mengupdate stok otomatis tanpa perlu konfirmasi manual.'
                      : 'Scan akan memunculkan kartu informasi material dan tombol konfirmasi perubahan stok.'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setAutoUpdateMode(!autoUpdateMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autoUpdateMode ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    autoUpdateMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* If Auto-Update is Active, configure Quick Action */}
            {autoUpdateMode && (
              <div className="pt-2 border-t border-orange-500/15 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Aksi Otomatis:</span>
                  <div className="flex rounded-lg overflow-hidden border border-orange-500/30 p-0.5 bg-white dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={() => setAutoAction('use')}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                        autoAction === 'use'
                          ? 'bg-orange-500 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:text-orange-500'
                      }`}
                    >
                      - Catat Pemakaian
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoAction('add')}
                      className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                        autoAction === 'add'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:text-emerald-500'
                      }`}
                    >
                      + Terima Pasokan
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">Qty / Scan:</span>
                  <div className="flex items-center gap-1">
                    {[1, 5, 10, 20].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAutoAmount(val)}
                        className={`px-2 py-1 rounded text-[10px] font-bold border transition-all ${
                          autoAmount === val
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-orange-500'
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      value={autoAmount}
                      onChange={(e) => setAutoAmount(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-14 px-2 py-1 text-[11px] font-bold text-center rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                      title="Ketik jumlah manual per scan"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Kamera Pemindai (QR &amp; Barcode)
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('upload');
            }}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload Foto Label
          </button>
          <button
            onClick={() => {
              stopCamera();
              setActiveTab('manual');
            }}
            className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarcodeIcon className="w-3.5 h-3.5" /> Daftar Material
          </button>
        </div>

        {/* Hidden dummy div for image scanning */}
        <div id="foresyndo-qr-file-reader-dummy" className="hidden" />

        {/* Tab 1: Live Camera Scanner */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            <div className="relative min-h-[260px] max-h-[340px] bg-slate-950 rounded-2xl overflow-hidden border-2 border-orange-500/70 flex flex-col items-center justify-center text-center shadow-inner">
              {/* Corner Frame Target Overlays (QR Scanner Reticle) */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-orange-500 z-10 pointer-events-none rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-orange-500 z-10 pointer-events-none rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-orange-500 z-10 pointer-events-none rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-orange-500 z-10 pointer-events-none rounded-br-lg" />

              {/* QR Center Target Marker */}
              <div className="absolute w-44 h-44 border border-dashed border-orange-400/50 rounded-2xl pointer-events-none z-10 flex items-center justify-center">
                <div className="w-3 h-3 border border-orange-400/70 rounded-full" />
              </div>

              {/* Laser Scanning Line */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_20px_#f97316] animate-pulse top-1/2 -translate-y-1/2 z-10 pointer-events-none" />

              {/* Viewfinder Video Container */}
              <div
                id="foresyndo-qr-barcode-scanner-viewfinder"
                className="w-full h-full min-h-[260px] flex items-center justify-center overflow-hidden"
              />

              {/* Camera Header Overlays */}
              <div className="absolute top-3 inset-x-3 flex justify-between items-center z-20 pointer-events-auto">
                <span className="px-2.5 py-1 rounded-full bg-slate-900/85 border border-slate-700/80 text-white font-mono text-[9px] font-bold flex items-center gap-1.5 shadow-md">
                  <span className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
                  {isCameraActive ? 'KAMERA AKTIF (AUTO-FOCUS)' : 'MENYIAPKAN KAMERA...'}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'))
                  }
                  className="px-2.5 py-1 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1.5 shadow-md transition-colors"
                >
                  <RefreshCw className="w-3 h-3 text-orange-400" />
                  {cameraFacing === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}
                </button>
              </div>

              {/* Auto-Update Flash Success Toast (In-Viewfinder Notification) */}
              {autoFlashBadge && (
                <div className="absolute bottom-4 inset-x-4 z-30 animate-in fade-in slide-in-from-bottom-3 duration-200">
                  <div className="p-3 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 shadow-2xl backdrop-blur-md text-left flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 shrink-0 font-black">
                      <Check className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                          STOK BERHASIL DIUPDATE OTOMATIS!
                        </span>
                        <span className="text-xs font-black text-white bg-emerald-500/30 px-2 py-0.5 rounded-full border border-emerald-500/40">
                          Sisa: {autoFlashBadge.newStock} {autoFlashBadge.unit}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">
                        {autoFlashBadge.title}
                      </h4>
                      <p className="text-[11px] text-emerald-200 font-medium mt-0.5">
                        {autoFlashBadge.detail}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-30 space-y-2">
                  <AlertTriangle className="w-8 h-8 text-amber-400" />
                  <span className="text-xs font-bold text-white">Kamera Belum Terhubung / Izin Belum Aktif</span>
                  <p className="text-[11px] text-slate-400 max-w-sm">
                    {cameraError}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setActiveTab('upload')}
                      className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" /> Ambil dari Foto
                    </button>
                    <button
                      onClick={() => setActiveTab('manual')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
                    >
                      Pilih dari Daftar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
              <span>* Arahkan ke QR code label material atau Barcode kemasan.</span>
              <span className="font-semibold text-orange-500">QR 2D + Barcode 1D Aktif</span>
            </div>
          </div>
        )}

        {/* Tab 2: Upload File / Gallery */}
        {activeTab === 'upload' && (
          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 mx-auto flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Unggah Foto QR Code atau Barcode Label
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pilih foto stiker label QR material, surat jalan, atau kemasan fisik
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
              id="qr-file-upload-input"
            />

            <label
              htmlFor="qr-file-upload-input"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              <Camera className="w-4 h-4" /> Buka Galeri / Jepret Foto
            </label>
          </div>
        )}

        {/* Tab 3: Manual Input & Instant Material Samples */}
        {activeTab === 'manual' && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ketik QR Code / ID (Contoh: FORESYNDO-MAT:MAT-01 atau MAT-01)..."
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualInput.trim()) {
                    handleDecodedCode(manualInput.trim());
                  }
                }}
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => manualInput.trim() && handleDecodedCode(manualInput.trim())}
                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer"
              >
                <Scan className="w-4 h-4" /> Cari
              </button>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Pilih Material Proyek untuk Pindai Langsung:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {materials.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleDecodedCode(`FORESYNDO-MAT:${m.id}`)}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-orange-500/10 hover:border-orange-500/40 border border-slate-200 dark:border-slate-700/80 text-left transition-all group cursor-pointer"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-mono font-bold text-orange-500">FORESYNDO-MAT:{m.id}</span>
                      <span className="font-bold text-emerald-500">{m.stockRemaining} {m.unit}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-orange-500 mt-0.5">
                      {m.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scanned Result Banner & Non-Auto-Update Details Card */}
        {scannedCode && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Kode Label Terdeteksi
                  </span>
                  <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                    {scannedCode}
                  </span>
                </div>
              </div>

              {targetContext === 'fill_form' && handleFillCode && (
                <button
                  onClick={() => {
                    handleFillCode(scannedCode);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer"
                >
                  <PackageCheck className="w-3.5 h-3.5" /> Gunakan Kode Ini
                </button>
              )}
            </div>

            {/* If Match Found & (Manual confirmation mode or detail inspection) */}
            {matchedMaterial ? (
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] text-orange-500 font-black block">
                        {matchedMaterial.id} • {matchedMaterial.category || 'Konstruksi'}
                      </span>
                      {matchedMaterial.approvalStatus === 'Menunggu Approval' && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-black inline-flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Butuh Approval MK
                        </span>
                      )}
                      {matchedMaterial.approvalStatus === 'Ditolak' && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 text-[9px] font-black">
                          Ditolak MK
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {matchedMaterial.name}
                    </h4>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Supplier: {matchedMaterial.supplier} {matchedMaterial.locationRack ? `• ${matchedMaterial.locationRack}` : ''}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Sisa Stok</span>
                    <span className="text-base font-black text-emerald-500">
                      {matchedMaterial.stockRemaining} {matchedMaterial.unit}
                    </span>
                  </div>
                </div>

                {(matchedMaterial.approvalStatus || 'Disetujui') !== 'Disetujui' ? (
                  /* Blocked: Needs Consultant Approval */
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 font-black text-xs text-amber-700 dark:text-amber-300">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>Izin Masuk Gudang Tertahan (Menunggu Approval Konsultan MK)</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Sesuai SOP pengawasan mutu, material belum boleh ditempatkan di rak gudang dan barcode belum sah sebelum disetujui oleh Konsultan MK.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectMaterial(matchedMaterial);
                        stopCamera();
                        onClose();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                    >
                      <ShieldCheck className="w-4 h-4" /> Buka Tinjauan &amp; Form Approval Konsultan MK
                    </button>
                  </div>
                ) : (
                  <>
                    {adjustSuccessMsg && (
                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold text-center">
                        {adjustSuccessMsg}
                      </div>
                    )}

                    {/* Direct Manual Adjustment Controls */}
                    {onQuickStockAdjust && !autoUpdateMode && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                          Konfirmasi Update Stok:
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="flex rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => setAdjustType('use')}
                              className={`px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                                adjustType === 'use'
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              - Pemakaian
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdjustType('add')}
                              className={`px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                                adjustType === 'add'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              + Pasokan Baru
                            </button>
                          </div>

                          <input
                            type="number"
                            min={1}
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                          />

                          <button
                            type="button"
                            onClick={handleApplyManualAdjust}
                            className="flex-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            Simpan Stok
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => {
                          onSelectMaterial(matchedMaterial);
                          stopCamera();
                          onClose();
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <span>Buka Detail &amp; Cetak QR Label</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* If No Match Found */
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold block">Material Belum Terdaftar</span>
                    <span>
                      Label <span className="font-mono font-bold">{scannedCode}</span> belum ditemukan dalam database material.
                    </span>
                  </div>
                </div>

                {handleAddWithBarcode && (
                  <button
                    onClick={() => {
                      stopCamera();
                      onClose();
                      handleAddWithBarcode(scannedCode);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Daftarkan Sebagai Material Baru</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Riwayat Pemindaian & Update Sesi Ini (Live Audit Trail) */}
        {scanHistory.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-orange-500" /> Riwayat Update Stok Sesi Ini ({scanHistory.length})
              </span>
              <button
                type="button"
                onClick={() => setScanHistory([])}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Hapus Riwayat
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {scanHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-slate-900 dark:text-white truncate block">
                      {item.materialName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {item.timestamp} • {item.code}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-black text-xs block ${
                        item.action === 'add' ? 'text-emerald-500' : 'text-orange-500'
                      }`}
                    >
                      {item.action === 'add' ? '+' : '-'}{item.amount} {item.unit}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Sisa: {item.newStock} {item.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
