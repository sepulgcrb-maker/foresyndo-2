import React, { useState, useEffect } from 'react';
import {
  CloudSun,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Thermometer,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Sparkles,
  MapPin,
  HardHat,
  Truck,
  Building,
} from 'lucide-react';

interface WeatherData {
  location: string;
  temperature: string;
  condition: string;
  humidity: string;
  windSpeed: string;
  rainChance: string;
  impactAnalysis: {
    concretePouring: string;
    heavyEquipment: string;
    outdoorWork: string;
    k3Safety: string;
  };
  recommendations: string[];
  forecast3Days: {
    day: string;
    condition: string;
    temp: string;
    rainChance: string;
  }[];
  lastUpdated: string;
}

interface SourceCitation {
  title: string;
  uri: string;
}

export const WeatherWidget: React.FC = () => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [sources, setSources] = useState<SourceCitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/weather');
      const json = await res.json();

      if (json.success && json.data) {
        setData(json.data);
        if (json.sources) {
          setSources(json.sources);
        }
      } else {
        setError(json.error || 'Gagal memuat data cuaca.');
      }
    } catch (err: any) {
      setError('Gagal menghubungkan ke server cuaca.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchWeather();
  };

  const getWeatherIcon = (conditionStr: string = '') => {
    const c = conditionStr.toLowerCase();
    if (c.includes('hujan')) return <CloudRain className="w-8 h-8 text-blue-400 animate-pulse" />;
    if (c.includes('cerah')) return <Sun className="w-8 h-8 text-amber-400 animate-spin-slow" />;
    return <CloudSun className="w-8 h-8 text-orange-400" />;
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl space-y-6 relative overflow-hidden">
      {/* Decorative ambient background gradient */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-to-br from-orange-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <CloudSun className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Prakiraan Cuaca Real-Time Proyek
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-extrabold text-[10px] border border-sky-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-sky-400" /> SEARCH GROUNDED
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-orange-400" />
              <span>Lokasi Proyek: </span>
              <strong className="text-slate-200">Jatitujuh, Majalengka (Jawa Barat)</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {data && (
            <span className="text-[11px] font-bold text-slate-400">
              Diperbarui: <span className="text-slate-200">{data.lastUpdated}</span>
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading || isRefreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
            title="Muat ulang cuaca terkini"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || loading ? 'animate-spin text-orange-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
          <p className="text-xs font-medium animate-pulse">Mengambil data cuaca terkini Jatitujuh dari Google Search Grounding...</p>
        </div>
      ) : error && !data ? (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <div>
            <p className="font-bold">{error}</p>
            <button onClick={handleRefresh} className="mt-1 underline text-[11px]">
              Coba Lagi
            </button>
          </div>
        </div>
      ) : data ? (
        <div className="space-y-6 relative z-10">
          {/* Main Weather Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Primary Current Temperature Block */}
            <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    KONDISI SAAT INI
                  </span>
                  <h4 className="text-2xl font-black text-white mt-1">{data.condition}</h4>
                </div>
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700/50">
                  {getWeatherIcon(data.condition)}
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-orange-400">{data.temperature}</span>
                <span className="text-xs text-slate-400 font-medium">Suhu Udara Lapangan</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700/50 text-xs">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-sky-400" /> Kelembapan
                  </span>
                  <span className="font-bold text-slate-200 mt-0.5">{data.humidity}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Wind className="w-3 h-3 text-emerald-400" /> Angin
                  </span>
                  <span className="font-bold text-slate-200 mt-0.5">{data.windSpeed}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-blue-400" /> Potensi Hujan
                  </span>
                  <span className="font-bold text-amber-400 mt-0.5">{data.rainChance}</span>
                </div>
              </div>
            </div>

            {/* Impact Analysis for Field Operations */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
                <h4 className="text-xs font-extrabold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-orange-400" />
                  Analisis Dampak Operasional Lapangan
                </h4>
                <span className="text-[10px] text-slate-400 font-medium">Site Manager Guidance</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <Building className="w-3.5 h-3.5 text-orange-400" />
                    <span>Pengecoran Beton Structure:</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {data.impactAnalysis?.concretePouring}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <Truck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Operasi Alat Berat & Excavator:</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {data.impactAnalysis?.heavyEquipment}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <HardHat className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pekerjaan Ketinggian & Luar:</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {data.impactAnalysis?.outdoorWork}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Prosedur Keselamatan K3:</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {data.impactAnalysis?.k3Safety}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3-Day Forecast Cards & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 3 Days Forecast */}
            <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
              <h5 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <CloudSun className="w-4 h-4 text-sky-400" />
                Prakiraan 3 Hari Ke Depan
              </h5>
              <div className="space-y-2">
                {data.forecast3Days?.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-orange-400 block">{f.day}</span>
                      <span className="text-slate-300 text-[11px]">{f.condition}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-100 block">{f.temp}</span>
                      <span className="text-[10px] text-blue-400">Peluang Hujan: {f.rainChance}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Site Manager Action Recommendations */}
            <div className="lg:col-span-2 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-3">
              <h5 className="text-xs font-extrabold text-orange-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Rekomendasi Tindakan Lapangan (Site Manager)
              </h5>
              <ul className="space-y-2 text-xs text-slate-200">
                {data.recommendations?.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/40 border border-slate-800/80">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-black text-[11px] flex items-center justify-center border border-orange-500/30">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed text-[11px] pt-0.5">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Search Grounding Citations */}
          {sources && sources.length > 0 && (
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider text-[10px]">
                Sumber Referensi Grounding:
              </span>
              {sources.map((src, i) => (
                <a
                  key={i}
                  href={src.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-sky-300 border border-slate-700 flex items-center gap-1 transition-all"
                >
                  <span className="truncate max-w-[200px]">{src.title}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
