import React, { useState, useEffect, useRef } from 'react';
import { DailyLog, UserRole, WeatherCondition, RolePermissions } from '../../types';
import {
  ClipboardList,
  Plus,
  Sun,
  Cloud,
  CloudRain,
  Users,
  Calendar,
  Camera,
  FileText,
  RefreshCw,
  Loader2,
  MapPin,
  Upload,
  Trash2,
  ZoomIn,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ProgressCameraModal } from './ProgressCameraModal';
import { PhotoPreviewModal } from './PhotoPreviewModal';
import { SafeImage } from '../common/SafeImage';

interface DailyMonitoringProps {
  dailyLogs: DailyLog[];
  userRole: UserRole;
  permissions?: RolePermissions;
  activeUserName?: string;
  onAddDailyLog: (log: Omit<DailyLog, 'id'>) => void;
}

export const DailyMonitoring: React.FC<DailyMonitoringProps> = ({
  dailyLogs,
  userRole,
  permissions,
  activeUserName,
  onAddDailyLog,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState<{ temp?: number; condition?: WeatherCondition; error?: string } | null>(null);

  // Photo Preview / Lightbox state
  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string;
    title: string;
    date: string;
    author: string;
    notes?: string;
  } | null>(null);

  // Direct file input ref for uploading from local storage inside form
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const defaultCreator =
    activeUserName ||
    (userRole === 'Konsultan'
      ? 'SAEPUL ANWAR (Konsultan MK)'
      : userRole === 'Kontraktor'
      ? 'EKO YULIANTO (Kontraktor Pelaksana)'
      : userRole === 'Owner' || userRole === 'Direktur'
      ? 'HASANUDIN (Owner)'
      : 'EKO YULIANTO');

  const [newLog, setNewLog] = useState<Omit<DailyLog, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    weather: 'Cerah',
    workerCount: 45,
    mandorName: 'Mandor Suparno',
    activitySummary: '',
    volumeDone: '',
    photos: [],
    notes: '',
    createdBy: defaultCreator,
  });

  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Allow Kontraktor, Konsultan Pengawas, Owner, and internal roles to input daily logs
  const canInput =
    permissions?.canInputDailyLog ??
    (userRole === 'Kontraktor' ||
      userRole === 'Konsultan' ||
      userRole === 'Owner' ||
      userRole === 'Site Manager' ||
      userRole === 'Direktur' ||
      userRole === 'Admin');

  // Function to fetch realtime weather from Open-Meteo API for Jatitujuh, Majalengka (-6.6575, 108.2256)
  const fetchJatitujuhWeather = async () => {
    setIsFetchingWeather(true);
    setWeatherInfo(null);
    try {
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=-6.6575&longitude=108.2256&current_weather=true'
      );
      if (!response.ok) throw new Error('Respon server cuaca tidak valid');
      const data = await response.json();
      const code = data.current_weather?.weathercode;
      const temp = data.current_weather?.temperature;

      let mappedCondition: WeatherCondition = 'Cerah';
      if (code === 0) {
        mappedCondition = 'Cerah';
      } else if ([1, 2, 3, 45, 48].includes(code)) {
        mappedCondition = 'Berawan';
      } else if ([51, 53, 55, 56, 57, 61, 63, 80, 81].includes(code)) {
        mappedCondition = 'Hujan Gerimis';
      } else if ([65, 66, 67, 71, 73, 75, 77, 82, 85, 86, 95, 96, 99].includes(code)) {
        mappedCondition = 'Hujan Lebat';
      }

      setNewLog((prev) => ({ ...prev, weather: mappedCondition }));
      setWeatherInfo({ temp, condition: mappedCondition });
    } catch (err) {
      console.error('Weather fetch error:', err);
      setWeatherInfo({ error: 'Gagal memuat cuaca otomatis (Gunakan opsi manual)' });
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    fetchJatitujuhWeather();
  };

  // Quick action from header to snap photo immediately then open form
  const handleQuickCamera = () => {
    setIsCameraModalOpen(true);
  };

  // Callback when a photo is captured via ProgressCameraModal
  const handleCameraCapture = (photoDataUrl: string, caption?: string) => {
    setNewLog((prev) => {
      const updatedPhotos = [photoDataUrl, ...(prev.photos || [])];
      let updatedSummary = prev.activitySummary;
      if (!updatedSummary && caption) {
        updatedSummary = `Pekerjaan: ${caption}`;
      }
      return {
        ...prev,
        photos: updatedPhotos,
        activitySummary: updatedSummary,
      };
    });

    // Ensure form modal is open so the user can verify and complete the log details
    if (!isModalOpen) {
      setIsModalOpen(true);
      fetchJatitujuhWeather();
    }
  };

  // Remove attached photo from form
  const handleRemovePhoto = (indexToRemove: number) => {
    setNewLog((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== indexToRemove),
    }));
  };

  // Handle direct file upload from form
  const handleDirectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setNewLog((prev) => ({
          ...prev,
          photos: [dataUrl, ...(prev.photos || [])],
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Add URL photo manually
  const handleAddUrlPhoto = () => {
    if (!photoUrlInput.trim()) return;
    setNewLog((prev) => ({
      ...prev,
      photos: [photoUrlInput.trim(), ...(prev.photos || [])],
    }));
    setPhotoUrlInput('');
    setShowUrlInput(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.activitySummary) return;

    const logToSubmit = { ...newLog };
    if (photoUrlInput.trim() && !logToSubmit.photos.includes(photoUrlInput.trim())) {
      logToSubmit.photos = [photoUrlInput.trim(), ...(logToSubmit.photos || [])];
    }

    onAddDailyLog(logToSubmit);
    setIsModalOpen(false);
    setPhotoUrlInput('');
    setShowUrlInput(false);
    setNewLog({
      date: new Date().toISOString().split('T')[0],
      weather: 'Cerah',
      workerCount: 45,
      mandorName: 'Mandor Suparno',
      activitySummary: '',
      volumeDone: '',
      photos: [],
      notes: '',
      createdBy: defaultCreator,
    });
  };

  const getWeatherIcon = (weather: WeatherCondition) => {
    switch (weather) {
      case 'Cerah':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'Berawan':
        return <Cloud className="w-4 h-4 text-slate-400" />;
      case 'Hujan Gerimis':
      case 'Hujan Lebat':
        return <CloudRain className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
              <ClipboardList className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Monitoring Harian Pekerjaan</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pencatatan kondisi cuaca, tenaga kerja, volume pekerjaan, dan kegiatan harian di proyek FORESYNDO 2
          </p>
        </div>

        {canInput && (
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleQuickCamera}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 shadow-md transition-all shrink-0 cursor-pointer"
              title="Buka kamera langsung untuk foto progress fisik dan buat laporan harian"
            >
              <Camera className="w-4 h-4 text-orange-400" /> Foto Progres (Kamera)
            </button>

            <button
              onClick={handleOpenModal}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Input Laporan Harian
            </button>
          </div>
        )}
      </div>

      {/* Daily Logs List */}
      <div className="space-y-4">
        {dailyLogs.map((log) => (
          <div
            key={log.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" /> {log.date}
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {getWeatherIcon(log.weather)} {log.weather}
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                  <Users className="w-3.5 h-3.5" /> {log.workerCount} Pekerja
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Penginput: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{log.createdBy}</strong> &bull; Mandor: {log.mandorName}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-orange-500" /> Ringkasan Kegiatan Harian:
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {log.activitySummary}
                </p>

                {log.notes && (
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    *Catatan Tambahan: {log.notes}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Volume Pengerjaan:</h4>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                    {log.volumeDone || 'Sesuai Rincian Kegiatan'}
                  </div>
                </div>

                {log.photos && log.photos.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-orange-500" /> Dokumentasi Foto:
                      </h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400">
                        {log.photos.length} Foto
                      </span>
                    </div>

                    <div className={`grid gap-2 ${log.photos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      {log.photos.map((photoUrl, pIdx) => (
                        <div
                          key={pIdx}
                          onClick={() =>
                            setPreviewPhoto({
                              url: photoUrl,
                              title: `Dokumentasi Laporan Harian - ${log.date} (Foto #${pIdx + 1})`,
                              date: log.date,
                              author: log.createdBy,
                              notes: log.activitySummary,
                            })
                          }
                          className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-950 cursor-pointer shadow-sm hover:shadow-md transition-all"
                        >
                          <SafeImage
                            src={photoUrl}
                            alt={`Dokumentasi ${log.date} #${pIdx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <ZoomIn className="w-5 h-5 drop-shadow-md" />
                          </div>
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white font-mono text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                            #{pIdx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Input Daily Log */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Input Laporan Harian Proyek</h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={newLog.date}
                    onChange={(e) => setNewLog({ ...newLog, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold flex items-center gap-1">
                      Kondisi Cuaca
                    </label>
                    <button
                      type="button"
                      onClick={fetchJatitujuhWeather}
                      disabled={isFetchingWeather}
                      className="text-[10px] text-orange-500 hover:text-orange-600 font-bold flex items-center gap-1 disabled:opacity-50"
                      title="Sinkronkan cuaca terkini Jatitujuh, Majalengka"
                    >
                      {isFetchingWeather ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      Cek Realtime
                    </button>
                  </div>
                  <select
                    value={newLog.weather}
                    onChange={(e) => setNewLog({ ...newLog, weather: e.target.value as WeatherCondition })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
                  >
                    <option value="Cerah">Cerah</option>
                    <option value="Berawan">Berawan</option>
                    <option value="Hujan Gerimis">Hujan Gerimis</option>
                    <option value="Hujan Lebat">Hujan Lebat</option>
                  </select>
                </div>
              </div>

              {/* Realtime Weather Info Card */}
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span className="font-semibold">Lokasi Proyek:</span> Jatitujuh, Majalengka
                </div>
                {isFetchingWeather ? (
                  <span className="text-orange-500 font-medium flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Mengambil cuaca...
                  </span>
                ) : weatherInfo?.temp !== undefined ? (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {weatherInfo.temp}°C ({weatherInfo.condition})
                  </span>
                ) : weatherInfo?.error ? (
                  <span className="text-amber-500 text-[10px]">{weatherInfo.error}</span>
                ) : (
                  <span className="text-slate-400 text-[10px]">Cuaca otomatis via Open-Meteo API</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Jumlah Pekerja</label>
                  <input
                    type="number"
                    value={newLog.workerCount}
                    onChange={(e) => setNewLog({ ...newLog, workerCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Nama Mandor / Penanggung Jawab</label>
                  <input
                    type="text"
                    value={newLog.mandorName}
                    onChange={(e) => setNewLog({ ...newLog, mandorName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Rincian Kegiatan Utama</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Deskripsikan pekerjaan cor, pasang bata, pembesian..."
                  value={newLog.activitySummary}
                  onChange={(e) => setNewLog({ ...newLog, activitySummary: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Volume Pekerjaan Terpenuhi</label>
                <input
                  type="text"
                  placeholder="Contoh: 85 m³ cor, 120 m² bata ringan"
                  value={newLog.volumeDone}
                  onChange={(e) => setNewLog({ ...newLog, volumeDone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>

              {/* Photo Documentation & Camera Integration */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-orange-500" />
                    Dokumentasi Foto Progres Fisik
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {newLog.photos?.length || 0} Foto Terlampir
                  </span>
                </div>

                {/* Action Buttons: Camera, File Upload, URL */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" /> Ambil Foto via Kamera
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" /> Upload Berkas / Galeri
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> {showUrlInput ? 'Tutup URL' : 'Tambah Link URL'}
                  </button>
                </div>

                {/* Optional URL Input */}
                {showUrlInput && (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddUrlPhoto}
                      disabled={!photoUrlInput.trim()}
                      className="px-3 py-1.5 rounded-xl bg-orange-500 text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
                    >
                      Lampirkan
                    </button>
                  </div>
                )}

                {/* Attached Photos Preview Grid */}
                {newLog.photos && newLog.photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {newLog.photos.map((photoUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-950 shadow-sm"
                      >
                        <SafeImage
                          src={photoUrl}
                          alt={`Lampiran Foto #${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 bg-black/70 text-white font-mono text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                          Foto #{idx + 1}
                        </div>

                        {/* Action Overlays */}
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewPhoto({
                                url: photoUrl,
                                title: `Foto Lampiran #${idx + 1}`,
                                date: newLog.date,
                                author: newLog.createdBy,
                                notes: newLog.activitySummary,
                              })
                            }
                            className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm cursor-pointer"
                            title="Pratinjau Foto"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="p-1.5 rounded-lg bg-red-600/80 text-white hover:bg-red-600 backdrop-blur-sm cursor-pointer"
                            title="Hapus Foto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-400 text-[11px] flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    <span>Belum ada foto progres. Tekan <strong>"Ambil Foto via Kamera"</strong> untuk memfoto kondisi fisik site saat ini.</span>
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleDirectFileUpload}
                className="hidden"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" /> Simpan Laporan Harian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real-time Progress Camera Modal */}
      <ProgressCameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
        logDate={newLog.date}
        defaultCaption={newLog.activitySummary}
      />

      {/* Fullscreen Photo Lightbox Modal */}
      <PhotoPreviewModal
        isOpen={!!previewPhoto}
        onClose={() => setPreviewPhoto(null)}
        photoUrl={previewPhoto?.url || null}
        title={previewPhoto?.title}
        date={previewPhoto?.date}
        author={previewPhoto?.author}
        notes={previewPhoto?.notes}
      />
    </div>
  );
};
