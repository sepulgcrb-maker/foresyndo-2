/**
 * Primary Project State Persistence & Session Cache Synchronization Manager
 * PT Foresyndo Global Indonesia - Monitoring Konstruksi Terpadu
 */

export const SYNC_STORAGE_KEYS = {
  STATE_META: 'FORESYNDO_V3_STATE_META',
  PROJECT_INFO: 'FORESYNDO_V3_PROJECT_INFO',
  WORK_ITEMS: 'FORESYNDO_V3_WORK_ITEMS',
  PAYMENT_TERMS: 'FORESYNDO_V3_PAYMENT_TERMS',
  DAILY_LOGS: 'FORESYNDO_V3_DAILY_LOGS',
  PHOTOS: 'FORESYNDO_V3_PHOTOS',
  MATERIALS: 'FORESYNDO_V3_MATERIALS',
  WORKERS: 'FORESYNDO_V3_WORKERS',
  ALLOCATIONS: 'FORESYNDO_V3_ALLOCATIONS',
  EQUIPMENT: 'FORESYNDO_V3_EQUIPMENT',
  AUDIT_LOGS: 'FORESYNDO_V3_AUDIT_LOGS',
  NOTIFICATIONS: 'FORESYNDO_V3_NOTIFICATIONS',
  CALENDAR_EVENTS: 'FORESYNDO_V3_CALENDAR_EVENTS',
  PROJECT_DOCUMENTS: 'FORESYNDO_V3_PROJECT_DOCUMENTS',
  USER_NAMES: 'FORESYNDO_V3_USER_NAMES',
} as const;

export const SYNC_CHANNEL_NAME = 'foresyndo_sync_bus';

export interface StateMeta {
  version: number;
  lastUpdated: string;
  updatedByRole: string;
  updatedByName?: string;
  action: string;
  sessionId: string;
  checksum: string;
}

export interface SyncStatusResult {
  isOutOfSync: boolean;
  sessionVersion: number;
  primaryVersion: number;
  lastUpdated: string;
  updatedByRole: string;
  updatedByName?: string;
  action: string;
  diffDescription?: string;
}

// Generate unique ID for this browser tab/session instance
export const CLIENT_SESSION_ID = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

/**
 * Creates a simple hash from string
 */
export function calculateChecksum(dataStr: string): string {
  let hash = 0;
  for (let i = 0; i < dataStr.length; i++) {
    const char = dataStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Read current primary state metadata from localStorage
 */
export function getPrimaryStateMeta(): StateMeta {
  try {
    const raw = localStorage.getItem(SYNC_STORAGE_KEYS.STATE_META);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.version === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[SyncManager] Failed to read state meta:', err);
  }

  // Default fallback meta
  const fallbackMeta: StateMeta = {
    version: 1,
    lastUpdated: new Date().toLocaleString('id-ID'),
    updatedByRole: 'Sistem',
    updatedByName: 'Inisialisasi',
    action: 'Muat Awal Sistem',
    sessionId: CLIENT_SESSION_ID,
    checksum: 'init_v1',
  };
  return fallbackMeta;
}

/**
 * Update primary state meta whenever local user makes a project update
 */
export function recordPrimaryStateUpdate(
  action: string,
  updatedByRole = 'User',
  updatedByName?: string
): StateMeta {
  const current = getPrimaryStateMeta();
  const newVersion = current.version + 1;
  const nowStr = new Date().toLocaleString('id-ID');

  const newMeta: StateMeta = {
    version: newVersion,
    lastUpdated: nowStr,
    updatedByRole,
    updatedByName: updatedByName || updatedByRole,
    action,
    sessionId: CLIENT_SESSION_ID,
    checksum: `${newVersion}_${Date.now().toString(36)}`,
  };

  try {
    localStorage.setItem(SYNC_STORAGE_KEYS.STATE_META, JSON.stringify(newMeta));

    // Broadcast update to all other tabs via BroadcastChannel if supported
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
      bc.postMessage({
        type: 'STATE_UPDATED',
        meta: newMeta,
      });
      bc.close();
    }
  } catch (err) {
    console.warn('[SyncManager] Failed to record state update:', err);
  }

  return newMeta;
}

/**
 * Compare a given session version against the primary stored version
 */
export function evaluateSyncStatus(currentSessionVersion: number): SyncStatusResult {
  const primaryMeta = getPrimaryStateMeta();

  // If primary version is higher and was saved by a different session, session is out of sync
  const isOutOfSync =
    primaryMeta.version > currentSessionVersion && primaryMeta.sessionId !== CLIENT_SESSION_ID;

  return {
    isOutOfSync,
    sessionVersion: currentSessionVersion,
    primaryVersion: primaryMeta.version,
    lastUpdated: primaryMeta.lastUpdated,
    updatedByRole: primaryMeta.updatedByRole,
    updatedByName: primaryMeta.updatedByName,
    action: primaryMeta.action,
    diffDescription: isOutOfSync
      ? `Data diperbarui oleh ${primaryMeta.updatedByName || primaryMeta.updatedByRole} ("${primaryMeta.action}") pada ${primaryMeta.lastUpdated}`
      : undefined,
  };
}

/**
 * Load complete fresh snapshot from primary localStorage storage
 */
export function loadAllPrimaryProjectData() {
  const parseKey = (key: string, fallback: any) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    project: parseKey(SYNC_STORAGE_KEYS.PROJECT_INFO, null),
    workItems: parseKey(SYNC_STORAGE_KEYS.WORK_ITEMS, null),
    paymentTerms: parseKey(SYNC_STORAGE_KEYS.PAYMENT_TERMS, null),
    dailyLogs: parseKey(SYNC_STORAGE_KEYS.DAILY_LOGS, null),
    photos: parseKey(SYNC_STORAGE_KEYS.PHOTOS, null),
    materials: parseKey(SYNC_STORAGE_KEYS.MATERIALS, null),
    workers: parseKey(SYNC_STORAGE_KEYS.WORKERS, null),
    allocations: parseKey(SYNC_STORAGE_KEYS.ALLOCATIONS, null),
    equipments: parseKey(SYNC_STORAGE_KEYS.EQUIPMENT, null),
    auditLogs: parseKey(SYNC_STORAGE_KEYS.AUDIT_LOGS, null),
    notifications: parseKey(SYNC_STORAGE_KEYS.NOTIFICATIONS, null),
    calendarEvents: parseKey(SYNC_STORAGE_KEYS.CALENDAR_EVENTS, null),
    documents: parseKey(SYNC_STORAGE_KEYS.PROJECT_DOCUMENTS, null),
    meta: getPrimaryStateMeta(),
  };
}
