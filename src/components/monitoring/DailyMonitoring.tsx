import React, { useState, useEffect } from 'react';
import { DailyLog, UserRole, WeatherCondition } from '../../types';
import { ClipboardList, Plus, Sun, Cloud, CloudRain, Users, Calendar, Camera, FileText, RefreshCw, Loader2, MapPin } from 'lucide-react';

interface DailyMonitoringProps {
  dailyLogs: DailyLog[];
  userRole: UserRole;
  onAddDailyLog: (log: Omit<DailyLog, 'id'>) => void;
}

export const DailyMonitoring: React.FC<DailyMonitoringProps> = ({ dailyLogs, userRole, onAddDailyLog }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weatherInfo, setWeatherInfo] = useState<{ temp?: number; condition?: WeatherCondition; error?: string } | null>(null);

  const [newLog, setNewLog] = useState<Omit<DailyLog, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    weather: 'Cerah',
    workerCount: 45,
    mandorName: 'Mandor Suparno',
    activitySummary: '',
    volumeDone: '',
    photos: [],
    notes: '',
    createdBy: 'Ir. Agus Pratama',
  });

  const [photoUrlInput, setPhotoUrlInput] = useState('');

  const canInput = userRole === 'Admin' || userRole === 'Site Manager' || userRole === 'Direktur';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.activitySummary) return;

    const logToSubmit = { ...newLog };
    if (photoUrlInput.trim()) {
      logToSubmit.photos = [photoUrlInput.trim()];
    }

    onAddDailyLog(logToSubmit);
    setIsModalOpen(false);
    setPhotoUrlInput('');
    setNewLog({
      date: new Date().toISOString().split('T')[0],
      weather: 'Cerah',
      workerCount: 45,
      mandorName: 'Mandor Suparno',
      activitySummary: '',
      volumeDone: '',
      photos: [],
      notes: '',
      createdBy: 'Ir. Agus Pratama',
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
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" /> Input Laporan Harian
          </button>
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
              <span className="text-xs text-slate-400 font-medium">Penginput: {log.createdBy} &bull; Mandor: {log.mandorName}</span>
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

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">Volume Pengerjaan:</h4>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                  {log.volumeDone || 'Sesuai Rincian Kegiatan'}
                </div>

                {log.photos && log.photos.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-orange-500" /> Dokumentasi Foto:
                    </h4>
                    <img
                      src={log.photos[0]}
                      alt="Foto Kegiatan"
                      className="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700 shadow-md hover:scale-102 transition-transform cursor-pointer"
                    />
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

              <div>
                <label className="block font-semibold mb-1">URL Foto Dokumentasi (Optional / Unsplash)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={photoUrlInput}
                  onChange={(e) => setPhotoUrlInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  Simpan Laporan Harian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
