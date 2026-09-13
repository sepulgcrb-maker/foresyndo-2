import { useState, useEffect, useCallback, useRef } from 'react';
import {
  evaluateSyncStatus,
  getPrimaryStateMeta,
  loadAllPrimaryProjectData,
  SYNC_CHANNEL_NAME,
  SYNC_STORAGE_KEYS,
  CLIENT_SESSION_ID,
  SyncStatusResult,
} from '../utils/syncManager';

interface UseSyncMonitorOptions {
  onSyncReload?: (snapshot: ReturnType<typeof loadAllPrimaryProjectData>) => void;
}

export function useSyncMonitor(options?: UseSyncMonitorOptions) {
  // Initial session version starts at primary version when this tab loaded
  const initialMeta = getPrimaryStateMeta();
  const [sessionVersion, setSessionVersion] = useState<number>(initialMeta.version);
  const [syncStatus, setSyncStatus] = useState<SyncStatusResult>(() =>
    evaluateSyncStatus(initialMeta.version)
  );
  const [isChecking, setIsChecking] = useState(false);
  const [lastSyncCheckedAt, setLastSyncCheckedAt] = useState<Date>(new Date());
  const [dismissedVersion, setDismissedVersion] = useState<number | null>(null);

  // Keep ref to latest sessionVersion for async callbacks
  const sessionVersionRef = useRef(sessionVersion);
  sessionVersionRef.current = sessionVersion;

  // Function to re-evaluate synchronization status
  const checkStatus = useCallback(() => {
    setIsChecking(true);
    const result = evaluateSyncStatus(sessionVersionRef.current);

    // If user previously clicked "dismiss" for this exact version, don't show alert
    if (dismissedVersion === result.primaryVersion) {
      setSyncStatus({ ...result, isOutOfSync: false });
    } else {
      setSyncStatus(result);
    }

    setLastSyncCheckedAt(new Date());
    setTimeout(() => setIsChecking(false), 300);
  }, [dismissedVersion]);

  // Execute sync: Pull latest primary state and update session
  const syncWithPrimaryState = useCallback(() => {
    const snapshot = loadAllPrimaryProjectData();
    if (snapshot.meta) {
      setSessionVersion(snapshot.meta.version);
      sessionVersionRef.current = snapshot.meta.version;
    }
    setDismissedVersion(null);
    setSyncStatus({
      isOutOfSync: false,
      sessionVersion: snapshot.meta.version,
      primaryVersion: snapshot.meta.version,
      lastUpdated: snapshot.meta.lastUpdated,
      updatedByRole: snapshot.meta.updatedByRole,
      updatedByName: snapshot.meta.updatedByName,
      action: 'Tersinkronisasi',
    });

    options?.onSyncReload?.(snapshot);
  }, [options]);

  // Dismiss out of sync notification temporarily for this primary version
  const dismissOutOfSync = useCallback(() => {
    setDismissedVersion(syncStatus.primaryVersion);
    setSyncStatus((prev) => ({ ...prev, isOutOfSync: false }));
  }, [syncStatus.primaryVersion]);

  // When local user makes an edit, advance session version so this tab remains in sync
  const markLocalEdit = useCallback((newVersion: number) => {
    setSessionVersion(newVersion);
    sessionVersionRef.current = newVersion;
    setSyncStatus((prev) => ({
      ...prev,
      isOutOfSync: false,
      sessionVersion: newVersion,
      primaryVersion: newVersion,
    }));
  }, []);

  useEffect(() => {
    // 1. Cross-tab Storage Event Listener
    const handleStorageChange = (e: StorageEvent) => {
      // Check if state meta or any project data was updated by another tab
      if (
        e.key === SYNC_STORAGE_KEYS.STATE_META ||
        (e.key && e.key.startsWith('FORESYNDO_V3_'))
      ) {
        checkStatus();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 2. BroadcastChannel Listener for Instant Cross-Tab Notifications
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel(SYNC_CHANNEL_NAME);
        bc.onmessage = (event) => {
          if (event.data?.type === 'STATE_UPDATED') {
            const meta = event.data.meta;
            if (meta && meta.sessionId !== CLIENT_SESSION_ID) {
              // Out of sync detected immediately!
              setSyncStatus({
                isOutOfSync: true,
                sessionVersion: sessionVersionRef.current,
                primaryVersion: meta.version,
                lastUpdated: meta.lastUpdated,
                updatedByRole: meta.updatedByRole,
                updatedByName: meta.updatedByName,
                action: meta.action,
                diffDescription: `Data diperbarui oleh ${meta.updatedByName || meta.updatedByRole} ("${meta.action}") pada ${meta.lastUpdated}`,
              });
            }
          }
        };
      } catch (err) {
        console.warn('[SyncMonitor] BroadcastChannel error:', err);
      }
    }

    // 3. Periodic Background Heartbeat Check (every 8 seconds)
    const intervalId = setInterval(() => {
      checkStatus();
    }, 8000);

    // 4. Focus & Visibility Change: Check immediately when user switches back to this tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkStatus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkStatus);
      clearInterval(intervalId);
      if (bc) {
        bc.close();
      }
    };
  }, [checkStatus]);

  return {
    isOutOfSync: syncStatus.isOutOfSync,
    syncStatus,
    sessionVersion,
    isChecking,
    lastSyncCheckedAt,
    syncWithPrimaryState,
    dismissOutOfSync,
    checkStatus,
    markLocalEdit,
  };
}
