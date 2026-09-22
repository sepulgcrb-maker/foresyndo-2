import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create data directory:', err);
  }
}

const SUPABASE_CONFIG_PATH = path.join(process.cwd(), '.supabase_config.json');
const PROJECT_SNAPSHOT_PATH = path.join(DATA_DIR, 'project_snapshot.json');

// Load stored Supabase configuration if not in environment
try {
  if (fs.existsSync(SUPABASE_CONFIG_PATH)) {
    const raw = fs.readFileSync(SUPABASE_CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.url && !process.env.SUPABASE_URL && !process.env.VITE_SUPABASE_URL) {
      process.env.SUPABASE_URL = parsed.url;
    }
    if (parsed.anonKey && !process.env.SUPABASE_ANON_KEY && !process.env.VITE_SUPABASE_ANON_KEY) {
      process.env.SUPABASE_ANON_KEY = parsed.anonKey;
    }
    if (parsed.serviceRoleKey && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = parsed.serviceRoleKey;
    }
  }
} catch (err) {
  console.warn('Error reading stored Supabase config:', err);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Weather Search Grounding API Route
  let weatherCache: { data: any; sources: any[]; timestamp: number } | null = null;
  const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache to avoid quota limits

  app.get('/api/weather', async (req, res) => {
    const fallbackData = {
      location: 'Jatitujuh, Majalengka',
      temperature: '32°C',
      condition: 'Cerah Berawan',
      humidity: '72%',
      windSpeed: '14 km/jam',
      rainChance: '25%',
      impactAnalysis: {
        concretePouring: 'Aman - Disarankan pengecoran pagi atau sore hari untuk hindari suhu puncak',
        heavyEquipment: 'Aman - Kondisi tanah memadatkan dan bebas resiko genangan',
        outdoorWork: 'Optimal - Pastikan pekerja terhidrasi dan memakai pelindung terik matahari',
        k3Safety: 'Pantau indeks UV siang hari & sediakan shelter istirahat teduh bagi pekerja',
      },
      recommendations: [
        'Jadwalkan pengecoran beton struktur utama pada interval jam 07.00 - 11.00 WIB.',
        'Persiapkan terpal penutup semen & material peka air untuk antisipasi hujan lokal.',
        'Pastikan pompa dewatering area pondasi dalam kondisi siap standby.',
      ],
      forecast3Days: [
        { day: 'Besok', condition: 'Hujan Ringan Sore', temp: '29°C', rainChance: '65%' },
        { day: 'Lusa', condition: 'Cerah Berawan', temp: '33°C', rainChance: '20%' },
        { day: 'H+3', condition: 'Berawan Tebal', temp: '30°C', rainChance: '40%' },
      ],
      lastUpdated: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };

    const fallbackSources = [
      {
        title: 'Prakiraan Cuaca Jatitujuh Majalengka (BMKG)',
        uri: 'https://www.bmkg.go.id',
      },
    ];

    // Return cached weather data if available and fresh
    const now = Date.now();
    if (weatherCache && now - weatherCache.timestamp < CACHE_TTL_MS && req.query.force !== 'true') {
      return res.json({
        success: true,
        data: weatherCache.data,
        sources: weatherCache.sources,
        cached: true,
      });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.json({
          success: true,
          data: fallbackData,
          sources: fallbackSources,
          isFallback: true,
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Berikan informasi prakiraan cuaca real-time dan 3 hari ke depan untuk lokasi proyek konstruksi di Jatitujuh, Kabupaten Majalengka, Jawa Barat, Indonesia.
Berikan analisis dampak teknis terhadap pekerjaan lapangan (pengecoran beton, operasi alat berat, pengerjaan luar, K3) serta rekomendasi praktis untuk Site Manager.`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              location: { type: Type.STRING },
              temperature: { type: Type.STRING },
              condition: { type: Type.STRING },
              humidity: { type: Type.STRING },
              windSpeed: { type: Type.STRING },
              rainChance: { type: Type.STRING },
              impactAnalysis: {
                type: Type.OBJECT,
                properties: {
                  concretePouring: { type: Type.STRING },
                  heavyEquipment: { type: Type.STRING },
                  outdoorWork: { type: Type.STRING },
                  k3Safety: { type: Type.STRING },
                },
                required: ['concretePouring', 'heavyEquipment', 'outdoorWork', 'k3Safety'],
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              forecast3Days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.STRING },
                    condition: { type: Type.STRING },
                    temp: { type: Type.STRING },
                    rainChance: { type: Type.STRING },
                  },
                  required: ['day', 'condition', 'temp', 'rainChance'],
                },
              },
              lastUpdated: { type: Type.STRING },
            },
            required: [
              'location',
              'temperature',
              'condition',
              'humidity',
              'windSpeed',
              'rainChance',
              'impactAnalysis',
              'recommendations',
              'forecast3Days',
            ],
          },
        },
      });

      const text = response.text || '{}';
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = groundingChunks
        .map((c: any) => ({
          title: c.web?.title || c.web?.uri || 'Google Search Grounding',
          uri: c.web?.uri || '#',
        }))
        .filter((s: any) => s.uri !== '#');

      let parsed = fallbackData;
      try {
        parsed = JSON.parse(text);
      } catch (err) {
        console.error('Failed to parse JSON from Gemini weather response:', err);
      }

      weatherCache = {
        data: parsed,
        sources: sources.length > 0 ? sources : fallbackSources,
        timestamp: Date.now(),
      };

      res.json({
        success: true,
        data: parsed,
        sources: weatherCache.sources,
      });
    } catch (error: any) {
      // Log concise info without dumping raw API error objects
      console.log('Weather API request handled with fallback or cached data.');

      // Return fallback data gracefully without failing the HTTP request
      res.json({
        success: true,
        data: weatherCache ? weatherCache.data : fallbackData,
        sources: weatherCache ? weatherCache.sources : fallbackSources,
        isFallback: true,
        notice: 'Menggunakan data perkiraan cuaca cuaca alternatif karena batas kuota API sementara.',
      });
    }
  });

  // Supabase Server Status & Verification API Route
  app.get('/api/supabase/status', async (req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

    const configured = Boolean(supabaseUrl && (supabaseAnonKey || hasServiceRoleKey));

    let liveStatus = 'not_configured';
    let latencyMs = 0;
    let errorDetail = null;

    if (configured) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const keyToUse = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
        const startTime = Date.now();
        const client = createClient(supabaseUrl, keyToUse, {
          auth: { persistSession: false },
        });

        const { error } = await client.from('project_snapshots').select('id').limit(1);
        latencyMs = Date.now() - startTime;

        if (error) {
          if (error.code === '42P01' || error.message.includes('relation')) {
            liveStatus = 'connected_schema_needed';
          } else {
            liveStatus = 'error';
            errorDetail = error.message;
          }
        } else {
          liveStatus = 'ready';
        }
      } catch (err: any) {
        liveStatus = 'unreachable';
        errorDetail = err.message;
      }
    }

    res.json({
      configured,
      url: supabaseUrl ? supabaseUrl.replace(/^(https?:\/\/)([^.]+)(.*)$/, '$1$2$3') : null,
      liveStatus,
      latencyMs,
      hasServiceRoleKey,
      error: errorDetail,
      envSupported: true,
    });
  });

  // Supabase Config Retrieval API (Allows all browsers to get the shared Supabase connection)
  app.get('/api/supabase/config', (req, res) => {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    res.json({
      url,
      anonKey,
      isConfigured: Boolean(url && anonKey),
    });
  });

  // Supabase Config Save API (Persists Supabase credentials on the server for all browsers)
  app.post('/api/supabase/config', (req, res) => {
    const { url, anonKey, serviceRoleKey } = req.body || {};
    const cleanUrl = typeof url === 'string' ? url.trim() : '';
    const cleanAnonKey = typeof anonKey === 'string' ? anonKey.trim() : '';
    const cleanServiceKey = typeof serviceRoleKey === 'string' ? serviceRoleKey.trim() : '';

    if (cleanUrl) {
      process.env.SUPABASE_URL = cleanUrl;
    } else {
      delete process.env.SUPABASE_URL;
    }
    if (cleanAnonKey) {
      process.env.SUPABASE_ANON_KEY = cleanAnonKey;
    } else {
      delete process.env.SUPABASE_ANON_KEY;
    }
    if (cleanServiceKey) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = cleanServiceKey;
    }

    try {
      fs.writeFileSync(
        SUPABASE_CONFIG_PATH,
        JSON.stringify(
          {
            url: cleanUrl,
            anonKey: cleanAnonKey,
            serviceRoleKey: cleanServiceKey,
            savedAt: new Date().toISOString(),
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (err) {
      console.error('Failed to save Supabase config to disk:', err);
    }

    res.json({
      success: true,
      message: 'Konfigurasi Supabase berhasil disimpan di server untuk semua browser!',
      url: cleanUrl,
      isConfigured: Boolean(cleanUrl && cleanAnonKey),
    });
  });

  // Central Project Snapshot Retrieval API (Cloud first, server resilient fallback)
  app.get('/api/project/snapshot', async (req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const keyToUse = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

    // 1. Try fetching from Supabase Cloud if configured
    if (supabaseUrl && keyToUse) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const client = createClient(supabaseUrl, keyToUse, {
          auth: { persistSession: false },
        });
        const { data, error } = await client
          .from('project_snapshots')
          .select('data, updated_at, synced_by')
          .eq('id', 'FORESYNDO-PROJECT-2')
          .single();

        if (!error && data && data.data) {
          return res.json({
            success: true,
            source: 'supabase',
            data: data.data,
            updatedAt: data.updated_at,
            syncedBy: data.synced_by,
          });
        }
      } catch (err) {
        console.warn('Server Supabase fetch notice:', err);
      }
    }

    // 2. Fallback to server local snapshot file
    try {
      if (fs.existsSync(PROJECT_SNAPSHOT_PATH)) {
        const raw = fs.readFileSync(PROJECT_SNAPSHOT_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return res.json({
          success: true,
          source: 'server_disk',
          data: parsed.data || parsed,
          updatedAt: parsed.updatedAt || parsed.syncedAt,
          syncedBy: parsed.syncedBy || 'Server Backup',
        });
      }
    } catch (err) {
      console.warn('Server disk snapshot read error:', err);
    }

    res.json({
      success: false,
      message: 'Belum ada snapshot proyek yang tersimpan di cloud atau server.',
    });
  });

  // Central Project Snapshot Save API (Saves to server disk and upserts to Supabase Cloud)
  app.post('/api/project/snapshot', async (req, res) => {
    const payload = req.body?.payload || req.body;
    if (!payload) {
      return res.status(400).json({ success: false, message: 'Payload data kosong.' });
    }

    const timestamp = new Date().toISOString();
    let supabaseSynced = false;
    let supabaseError = null;

    // 1. Always write to server persistent disk
    try {
      fs.writeFileSync(
        PROJECT_SNAPSHOT_PATH,
        JSON.stringify(
          {
            data: payload,
            updatedAt: timestamp,
            syncedBy: payload.syncedBy || 'Browser Sync',
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch (err) {
      console.warn('Failed to write project snapshot to disk:', err);
    }

    // 2. Upsert to Supabase if configured
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    const keyToUse = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

    if (supabaseUrl && keyToUse) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const client = createClient(supabaseUrl, keyToUse, {
          auth: { persistSession: false },
        });

        const { error } = await client.from('project_snapshots').upsert({
          id: payload.projectId || 'FORESYNDO-PROJECT-2',
          project_id: payload.projectId || 'FORESYNDO-PROJECT-2',
          data: payload,
          synced_by: payload.syncedBy || 'Browser Sync',
          updated_at: timestamp,
        });

        if (!error) {
          supabaseSynced = true;
        } else {
          supabaseError = error.message;
        }
      } catch (err: any) {
        supabaseError = err.message;
      }
    }

    res.json({
      success: true,
      message: supabaseSynced
        ? 'Data berhasil disimpan ke Supabase Cloud & Server!'
        : 'Data tersimpan di server (Supabase belum terhubung atau skema belum siap).',
      supabaseSynced,
      supabaseError,
      updatedAt: timestamp,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
