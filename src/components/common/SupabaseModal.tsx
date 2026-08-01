import React, { useState } from 'react';
import { X, Database, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { isSupabaseConnected, saveSupabaseConfig } from '../../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({ isOpen, onClose }) => {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  const [url, setUrl] = useState(env?.VITE_SUPABASE_URL || localStorage.getItem('FORESYNDO_SUPABASE_URL') || '');
  const [key, setKey] = useState(env?.VITE_SUPABASE_ANON_KEY || localStorage.getItem('FORESYNDO_SUPABASE_ANON_KEY') || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(url.trim(), key.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const connected = isSupabaseConnected();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pengaturan Supabase Realtime</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Integrasi Database & Storage untuk sinkronisasi proyek FORESYNDO 2
            </p>
          </div>
        </div>

        <div className="mb-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-300 font-medium">Status Koneksi Database:</span>
          {connected ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" /> Supabase Aktif
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
              <AlertCircle className="w-4 h-4" /> Mode Local Persistent Storage
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Anon Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            *Jika tidak diisi, aplikasi tetap berjalan 100% normal dengan penyimpanan lokal yang aman (IndexedDB / LocalStorage) dan simulasi real-time.
          </p>

          {savedSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium text-center">
              Konfigurasi Supabase Berhasil Disimpan!
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 transition-colors"
            >
              <Save className="w-4 h-4" /> Simpan Konfigurasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
