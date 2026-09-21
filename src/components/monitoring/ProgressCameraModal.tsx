import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Upload,
  Check,
  Zap,
  ZapOff,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle,
  FileImage,
} from 'lucide-react';

interface ProgressCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string, caption?: string) => void;
  logDate?: string;
  defaultCaption?: string;
  title?: string;
  badgeLabel?: string;
  buttonLabel?: string;
}

export const ProgressCameraModal: React.FC<ProgressCameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  logDate,
  defaultCaption = '',
  title = 'Kamera Progres Fisik Proyek',
  badgeLabel = 'Dokumentasi Proyek',
  buttonLabel = 'Gunakan Foto Ini',
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isCameraStreaming, setIsCameraStreaming] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState(defaultCaption);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorchSupport, setHasTorchSupport] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop current video stream
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    setIsCameraStreaming(false);
    setTorchEnabled(false);
    setHasTorchSupport(false);
  };

  // Start camera stream
  const startCameraStream = async (facing: 'environment' | 'user') => {
    stopCameraStream();
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Kamera tidak didukung oleh browser atau koneksi tidak aman (HTTPS dibutuhkan).');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setIsCameraStreaming(true);
        };
      }

      // Check torch / flash capability on video track
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities && (videoTrack.getCapabilities() as { torch?: boolean })) || {};
        if (capabilities.torch) {
          setHasTorchSupport(true);
        }
      }
    } catch (err: unknown) {
      console.warn('Camera access warning/error:', err);
      const errorMsg =
        err instanceof Error && err.name === 'NotAllowedError'
          ? 'Izin akses kamera ditolak. Silakan izinkan akses kamera di pengaturan browser atau gunakan tab "Upload Berkas / Galeri".'
          : 'Kamera tidak dapat diakses atau sedang digunakan aplikasi lain. Anda dapat mengunggah foto melalui tombol "Upload Berkas / Galeri".';
      setCameraError(errorMsg);
      setIsCameraStreaming(false);
    }
  };

  // Switch facing mode
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (activeTab === 'camera' && !capturedImage) {
      startCameraStream(nextFacing);
    }
  };

  // Toggle torch / flash
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const nextTorch = !torchEnabled;
      const trackWithTorch = videoTrack as MediaStreamTrack & {
        applyConstraints: (constraints: unknown) => Promise<void>;
      };
      await trackWithTorch.applyConstraints({ advanced: [{ torch: nextTorch }] });
      setTorchEnabled(nextTorch);
    } catch (err) {
      console.warn('Torch toggle failed:', err);
    }
  };

  // Lifecycle when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCapturedImage(null);
      setCaption(defaultCaption);
      setCameraError(null);
      if (activeTab === 'camera') {
        startCameraStream(cameraFacing);
      }
    } else {
      stopCameraStream();
      setCapturedImage(null);
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen, activeTab]);

  // Capture current frame from video and optionally apply construction site stamp watermark
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Draw the video frame
      ctx.drawImage(video, 0, 0, width, height);

      // Apply Construction Site Watermark Stamp if selected
      if (includeWatermark) {
        applyConstructionWatermark(ctx, width, height, logDate);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCameraStream();
    } catch (err) {
      console.error('Error capturing snapshot:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply high-contrast authentic Indonesian construction site stamp
  const applyConstructionWatermark = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    customDate?: string
  ) => {
    const bannerHeight = Math.max(70, Math.floor(height * 0.12));
    const bannerY = height - bannerHeight;

    // Semi-transparent dark banner background
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(0, bannerY, width, bannerHeight);

    // Orange accent border on top of the banner
    ctx.fillStyle = '#f97316';
    ctx.fillRect(0, bannerY, width, Math.max(4, Math.floor(bannerHeight * 0.05)));

    // Date & Time formatting
    const now = new Date();
    const dateStr = customDate || now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0] + ' WIB';
    const displayTimestamp = `${dateStr} • ${timeStr}`;

    const padLeft = Math.floor(width * 0.03);
    const fontSizeTitle = Math.max(14, Math.floor(bannerHeight * 0.22));
    const fontSizeSub = Math.max(11, Math.floor(bannerHeight * 0.18));
    const fontSizeBadge = Math.max(10, Math.floor(bannerHeight * 0.16));

    // Left Column: Project Name & Location
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${fontSizeTitle}px sans-serif`;
    ctx.fillText('PT FORESYNDO GLOBAL INDONESIA', padLeft, bannerY + bannerHeight * 0.38);

    ctx.fillStyle = '#fb923c'; // Orange-400
    ctx.font = `600 ${fontSizeSub}px sans-serif`;
    ctx.fillText('PROYEK PEMBANGUNAN GEDUNG JATITUJUH, MAJALENGKA', padLeft, bannerY + bannerHeight * 0.65);

    ctx.fillStyle = '#cbd5e1'; // Slate-300
    ctx.font = `500 ${fontSizeBadge}px sans-serif`;
    ctx.fillText('📍 Kordinat Site: -6.6575° S, 108.2256° E | DOKUMENTASI LAPORAN HARIAN', padLeft, bannerY + bannerHeight * 0.88);

    // Right Column: Live Timestamp & Tag
    const rightText1 = 'DOKUMENTASI FISIK LAPANGAN';
    const rightText2 = displayTimestamp;

    ctx.font = `bold ${fontSizeTitle}px sans-serif`;
    const rightWidth1 = ctx.measureText(rightText1).width;
    ctx.fillStyle = '#38bdf8'; // Sky-400
    ctx.fillText(rightText1, width - rightWidth1 - padLeft, bannerY + bannerHeight * 0.42);

    ctx.font = `600 ${fontSizeSub}px monospace`;
    const rightWidth2 = ctx.measureText(rightText2).width;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(rightText2, width - rightWidth2 - padLeft, bannerY + bannerHeight * 0.75);
  };

  // File Upload Handler (Fallback or Gallery Import)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const width = img.width;
        const height = img.height;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          if (includeWatermark) {
            applyConstructionWatermark(ctx, width, height, logDate);
          }
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setCapturedImage(dataUrl);
        }
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    if (activeTab === 'camera') {
      startCameraStream(cameraFacing);
    }
  };

  // Confirm and attach photo to daily log
  const handleConfirmAttach = () => {
    if (!capturedImage) return;
    onCapture(capturedImage, caption.trim() || undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl relative space-y-4 my-auto max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                {title}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  {badgeLabel}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ambil foto langsung dari lokasi proyek atau unggah berkas dokumentasi fisik
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection (only when not viewing captured image) */}
        {!capturedImage && (
          <div className="flex items-center justify-between gap-2 shrink-0">
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('camera');
                  setCameraError(null);
                  startCameraStream(cameraFacing);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'camera'
                    ? 'bg-white dark:bg-slate-900 text-orange-500 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" /> Kamera Langsung
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('upload');
                  stopCameraStream();
                  setCameraError(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-orange-500 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" /> Galeri / File
              </button>
            </div>

            {/* Watermark toggle */}
            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeWatermark}
                onChange={(e) => setIncludeWatermark(e.target.checked)}
                className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-slate-300"
              />
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Stempel Lokasi &amp; Tanggal Resmi
              </span>
            </label>
          </div>
        )}

        {/* Viewport Area */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-center min-h-[280px]">
          {/* Captured Image Review State */}
          {capturedImage ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border-2 border-orange-500/50 shadow-xl bg-slate-950 flex items-center justify-center max-h-[380px]">
                <img
                  src={capturedImage}
                  alt="Hasil Foto Progres"
                  className="w-full h-auto max-h-[380px] object-contain"
                />
                <div className="absolute top-3 left-3 bg-emerald-600 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                  <Check className="w-3 h-3" /> Foto Siap Dilampirkan
                </div>
              </div>

              {/* Caption / Keterangan Pekerjaan Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Keterangan Foto Progres (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pembesian Balok B2 Lantai 2 / Pengecoran Kolom K1 Zona A"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                />
              </div>

              {/* Actions for captured image */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Ambil Ulang Foto
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAttach}
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" /> {buttonLabel}
                </button>
              </div>
            </div>
          ) : activeTab === 'camera' ? (
            /* Live Camera Viewfinder */
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 flex flex-col items-center justify-center min-h-[320px]">
              {cameraError ? (
                <div className="p-6 text-center space-y-3 max-w-md">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Tidak Dapat Mengakses Kamera</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('upload');
                      fileInputRef.current?.click();
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4" /> Pilih Foto dari Galeri / Berkas
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-[320px] sm:h-[360px] object-cover bg-black"
                  />

                  {/* Viewfinder Rule-of-Thirds Grid */}
                  <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25">
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-r border-b border-white"></div>
                    <div className="border-b border-white"></div>
                    <div className="border-r border-white"></div>
                    <div className="border-r border-white"></div>
                    <div></div>
                  </div>

                  {/* Corner Targets */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-orange-500 pointer-events-none"></div>
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-orange-500 pointer-events-none"></div>
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-orange-500 pointer-events-none"></div>
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-orange-500 pointer-events-none"></div>

                  {/* Top Status & Camera Flip Overlay */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-auto">
                    <span className="px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-white font-mono text-[10px] font-bold flex items-center gap-1.5 border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      LIVE SITE CAMERA
                    </span>

                    <div className="flex items-center gap-1.5">
                      {hasTorchSupport && (
                        <button
                          type="button"
                          onClick={toggleTorch}
                          className="p-2 rounded-full bg-slate-900/80 backdrop-blur-md text-white hover:bg-slate-800 border border-white/10 cursor-pointer"
                          title="Flashlight / Torch"
                        >
                          {torchEnabled ? (
                            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                          ) : (
                            <ZapOff className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={toggleCameraFacing}
                        className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white hover:bg-slate-800 border border-white/10 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
                        title="Ganti Kamera Depan / Belakang"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
                        {cameraFacing === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}
                      </button>
                    </div>
                  </div>

                  {/* Bottom Snap Button & Location Tag */}
                  <div className="absolute bottom-4 inset-x-0 flex flex-col items-center gap-2 pointer-events-auto">
                    {includeWatermark && (
                      <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] text-slate-200 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-orange-500" />
                        <span>Jatitujuh, Majalengka • Stempel Proyek Aktif</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      {/* File upload shortcut */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 rounded-full bg-slate-900/80 backdrop-blur-md text-white hover:bg-slate-800 border border-white/15 cursor-pointer shadow-lg"
                        title="Pilih dari galeri foto HP"
                      >
                        <ImageIcon className="w-5 h-5 text-slate-200" />
                      </button>

                      {/* Giant Shutter Button */}
                      <button
                        type="button"
                        onClick={takeSnapshot}
                        disabled={!isCameraStreaming || isProcessing}
                        className="w-16 h-16 rounded-full border-4 border-white bg-orange-500 hover:bg-orange-600 active:scale-95 text-white flex items-center justify-center shadow-2xl transition-all cursor-pointer disabled:opacity-50"
                        title="Jepret Foto Progres Fisik"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                      </button>

                      {/* Flip Camera shortcut */}
                      <button
                        type="button"
                        onClick={toggleCameraFacing}
                        className="p-3 rounded-full bg-slate-900/80 backdrop-blur-md text-white hover:bg-slate-800 border border-white/15 cursor-pointer shadow-lg"
                        title="Balik Lensa Kamera"
                      >
                        <RefreshCw className="w-5 h-5 text-orange-400" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Upload / Gallery State */
            <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto">
                <FileImage className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pilih Foto Dokumentasi dari Perangkat
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Unggah berkas foto progres (JPG, PNG, WebP). Watermark resmi stempel site akan otomatis disematkan pada foto.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold inline-flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" /> Buka Galeri / Pilih Berkas Foto
              </button>
            </div>
          )}
        </div>

        {/* Hidden file input for camera tab file shortcut */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
};
