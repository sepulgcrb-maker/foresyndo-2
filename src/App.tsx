/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  ProjectInfo,
  WorkItem,
  PaymentTerm,
  DailyLog,
  PhotoItem,
  MaterialItem,
  WorkerItem,
  WorkerAllocation,
  EquipmentItem,
  AuditLog,
  NotificationItem,
  UserRole,
  CalendarEvent,
  StakeholderRoleProfile,
  StakeholderRoleKey,
  ProjectDocument,
  AuthSession,
} from './types';
import {
  INITIAL_PROJECT_INFO,
  INITIAL_WORK_ITEMS,
  INITIAL_PAYMENT_TERMS,
  INITIAL_PHOTOS,
  INITIAL_DAILY_LOGS,
  INITIAL_MATERIALS,
  INITIAL_WORKERS,
  INITIAL_WORKER_ALLOCATIONS,
  INITIAL_EQUIPMENT,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_STAKEHOLDER_PROFILES,
  ALL_PROJECT_TABS,
  INITIAL_PROJECT_DOCUMENTS,
} from './data/initialData';
import { Header } from './components/layout/Header';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { AccessRestrictedNotice } from './components/common/AccessRestrictedNotice';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { TimeScheduleTable } from './components/schedule/TimeScheduleTable';
import { ProjectCalendar } from './components/calendar/ProjectCalendar';
import { SCurveChart } from './components/schedule/SCurveChart';
import { GanttChart } from './components/schedule/GanttChart';
import { DailyMonitoring } from './components/monitoring/DailyMonitoring';
import { PhotoGallery } from './components/gallery/PhotoGallery';
import { TerminPayments } from './components/finance/TerminPayments';
import { MaterialMonitoring } from './components/inventory/MaterialMonitoring';
import { WorkforceMonitoring } from './components/workforce/WorkforceMonitoring';
import { EquipmentMonitoring } from './components/equipment/EquipmentMonitoring';
import { DocumentManagement } from './components/documents/DocumentManagement';
import { FinalInspection } from './components/inspection/FinalInspection';
import { ReportCenter } from './components/reports/ReportCenter';
import { SupabaseModal } from './components/common/SupabaseModal';
import { pushAllDataToSupabase, pullAllDataFromSupabase, subscribeToSupabaseRealtime } from './lib/supabaseService';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { ProjectSettingsModal } from './components/common/ProjectSettingsModal';
import { RoleManagementModal } from './components/common/RoleManagementModal';
import { SyncAlertBanner } from './components/common/SyncAlertBanner';
import { SyncStatusModal } from './components/common/SyncStatusModal';
import { LoginPage } from './components/auth/LoginPage';
import { generatePDFReport } from './utils/exportEngine';
import { calculatePhysicalProgress, calculateTargetProgress, calculateDeviation } from './utils/calculations';
import { useSyncMonitor } from './hooks/useSyncMonitor';
import { recordPrimaryStateUpdate, loadAllPrimaryProjectData } from './utils/syncManager';

export default function App() {
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('FORESYNDO_DARK_MODE');
    return saved ? JSON.parse(saved) : false; // Default to white & light blue gradient
  });

  useEffect(() => {
    localStorage.setItem('FORESYNDO_DARK_MODE', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Authentication Session (Persistent per active session, requires login first)
  const [authSession, setAuthSession] = useState<AuthSession>(() => {
    const isSessionActive = sessionStorage.getItem('FORESYNDO_SESSION_ACTIVE') === 'true';
    if (isSessionActive) {
      const saved = localStorage.getItem('FORESYNDO_AUTH_SESSION');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed.isAuthenticated === 'boolean' && parsed.isAuthenticated) {
            return parsed;
          }
        } catch {
          // fallback
        }
      }
    }
    // Default: Must log in first before entering the application
    return {
      isAuthenticated: false,
      role: 'Kontraktor',
      userName: '',
      loginTime: '',
    };
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const isSessionActive = sessionStorage.getItem('FORESYNDO_SESSION_ACTIVE') === 'true';
    if (isSessionActive) {
      const saved = localStorage.getItem('FORESYNDO_AUTH_SESSION');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed?.role && parsed?.isAuthenticated) return parsed.role as UserRole;
        } catch {
          // fallback
        }
      }
    }
    return 'Kontraktor';
  });

  // Modals & Drawers
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [roleModalTab, setRoleModalTab] = useState<'profiles' | 'permissions' | 'matrix' | 'workflow' | 'pins'>('profiles');
  const [lastSupabaseSync, setLastSupabaseSync] = useState<string | null>(() => {
    return localStorage.getItem('FORESYNDO_LAST_SUPABASE_SYNC');
  });

  // Role Security PINs (Owner authority - persistent)
  const [rolePins, setRolePins] = useState<Record<StakeholderRoleKey, string>>(() => {
    const saved = localStorage.getItem('FORESYNDO_ROLE_PINS');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            Owner: parsed.Owner || '889900',
            Konsultan: parsed.Konsultan || '776622',
            Kontraktor: parsed.Kontraktor || '554433',
            Viewer: parsed.Viewer || '112233',
          };
        }
      } catch {
        // fallback
      }
    }
    return {
      Owner: '889900',
      Konsultan: '776622',
      Kontraktor: '554433',
      Viewer: '112233',
    };
  });

  useEffect(() => {
    localStorage.setItem('FORESYNDO_ROLE_PINS', JSON.stringify(rolePins));
  }, [rolePins]);

  // Stakeholder Profiles (Owner, Konsultan, Kontraktor, Viewer)
  const [stakeholderProfiles, setStakeholderProfiles] = useState<Record<StakeholderRoleKey, StakeholderRoleProfile>>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_STAKEHOLDERS');
    if (!saved) return INITIAL_STAKEHOLDER_PROFILES;
    try {
      const parsed = JSON.parse(saved);
      const merged = { ...INITIAL_STAKEHOLDER_PROFILES, ...parsed };
      (['Owner', 'Konsultan', 'Kontraktor', 'Viewer'] as const).forEach((r) => {
        if (merged[r]) {
          const initPerms = INITIAL_STAKEHOLDER_PROFILES[r].permissions;
          if (!merged[r].permissions) {
            merged[r].permissions = { ...initPerms, allowedTabs: [...initPerms.allowedTabs] };
          } else {
            if (merged[r].permissions.canUploadDocuments === undefined) {
              merged[r].permissions.canUploadDocuments = initPerms.canUploadDocuments;
            }
            if (merged[r].permissions.canApproveDocuments === undefined) {
              merged[r].permissions.canApproveDocuments = initPerms.canApproveDocuments;
            }
            if (merged[r].permissions.canDeleteDocuments === undefined) {
              merged[r].permissions.canDeleteDocuments = initPerms.canDeleteDocuments;
            }
            if (!merged[r].permissions.allowedTabs) {
              merged[r].permissions.allowedTabs = [...initPerms.allowedTabs];
            } else if (!merged[r].permissions.allowedTabs.includes('documents')) {
              merged[r].permissions.allowedTabs.push('documents');
            }
          }
        }
      });
      // Ensure Kontraktor and Konsultan have full field input permissions
      if (merged.Konsultan?.permissions) {
        merged.Konsultan.permissions.canInputDailyLog = true;
        merged.Konsultan.permissions.canManageMaterial = true;
        merged.Konsultan.permissions.canManageWorkers = true;
        merged.Konsultan.permissions.canManageEquipment = true;
        merged.Konsultan.permissions.canEditSchedule = true;
      }
      if (merged.Kontraktor?.permissions) {
        merged.Kontraktor.permissions.canInputDailyLog = true;
        merged.Kontraktor.permissions.canManageMaterial = true;
        merged.Kontraktor.permissions.canManageWorkers = true;
        merged.Kontraktor.permissions.canManageEquipment = true;
        merged.Kontraktor.permissions.canEditSchedule = true;
      }
      if (merged.Owner?.permissions) {
        merged.Owner.permissions.canInputDailyLog = true;
        merged.Owner.permissions.canManageMaterial = true;
        merged.Owner.permissions.canManageWorkers = true;
        merged.Owner.permissions.canManageEquipment = true;
        merged.Owner.permissions.canEditSchedule = true;
      }
      return merged;
    } catch {
      return INITIAL_STAKEHOLDER_PROFILES;
    }
  });

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_STAKEHOLDERS', JSON.stringify(stakeholderProfiles));
  }, [stakeholderProfiles]);

  // Determine current effective stakeholder permissions & allowed tabs
  const getEffectiveRoleKey = (role: UserRole): StakeholderRoleKey => {
    if (role === 'Owner' || role === 'Direktur') return 'Owner';
    if (role === 'Konsultan') return 'Konsultan';
    if (role === 'Kontraktor' || role === 'Site Manager' || role === 'Admin') return 'Kontraktor';
    return 'Viewer';
  };

  const effectiveRoleKey = getEffectiveRoleKey(currentRole);
  const currentProfile = stakeholderProfiles[effectiveRoleKey] || INITIAL_STAKEHOLDER_PROFILES[effectiveRoleKey];
  const currentPermissions = currentProfile?.permissions || INITIAL_STAKEHOLDER_PROFILES.Owner.permissions;
  const allowedTabs = currentPermissions?.allowedTabs || ALL_PROJECT_TABS;
  const isCurrentTabRestricted = !allowedTabs.includes(activeTab);

  const [userNameMap, setUserNameMap] = useState<Record<UserRole, string>>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_USER_NAMES');
    return saved
      ? JSON.parse(saved)
      : {
          Owner: 'H. Bambang S., M.T.',
          Konsultan: 'Ir. Hendra Kusuma, M.Sc.',
          Kontraktor: 'Ir. Agus Pratama',
          Direktur: 'H. Bambang S., M.T.',
          'Site Manager': 'Ir. Agus Pratama',
          Admin: 'Siti Rahmawati, S.T.',
          Viewer: 'Tamu Pengawas',
        };
  });

  // Core Data State (Loaded from LocalStorage if available, fallback to initial)
  const [project, setProject] = useState<ProjectInfo>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_PROJECT_INFO');
    return saved ? JSON.parse(saved) : INITIAL_PROJECT_INFO;
  });

  const [workItems, setWorkItems] = useState<WorkItem[]>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_WORK_ITEMS');
    return saved ? JSON.parse(saved) : INITIAL_WORK_ITEMS;
  });

  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_PAYMENT_TERMS');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENT_TERMS;
  });

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_DAILY_LOGS');
    return saved ? JSON.parse(saved) : INITIAL_DAILY_LOGS;
  });

  const [photos, setPhotos] = useState<PhotoItem[]>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_PHOTOS');
    return saved ? JSON.parse(saved) : INITIAL_PHOTOS;
  });

  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_MATERIALS');
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });

  const [workers, setWorkers] = useState<WorkerItem[]>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_WORKERS');
    return saved ? JSON.parse(saved) : INITIAL_WORKERS;
  });

  const [allocations, setAllocations] = useState<WorkerAllocation[]>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_ALLOCATIONS');
    return saved ? JSON.parse(saved) : INITIAL_WORKER_ALLOCATIONS;
  });

  const [equipments, setEquipments] = useState<EquipmentItem[]>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_EQUIPMENT');
    return saved ? JSON.parse(saved) : INITIAL_EQUIPMENT;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_AUDIT_LOGS');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_NOTIFICATIONS');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_CALENDAR_EVENTS');
    return saved ? JSON.parse(saved) : INITIAL_CALENDAR_EVENTS;
  });

  const [documents, setDocuments] = useState<ProjectDocument[]>(() => {
    const saved = localStorage.getItem('FORESYNDO_V3_PROJECT_DOCUMENTS');
    return saved ? JSON.parse(saved) : INITIAL_PROJECT_DOCUMENTS;
  });

  // Persist State Updates to LocalStorage
  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_PROJECT_INFO', JSON.stringify(project));
  }, [project]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_WORK_ITEMS', JSON.stringify(workItems));
  }, [workItems]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_PAYMENT_TERMS', JSON.stringify(paymentTerms));
  }, [paymentTerms]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_DAILY_LOGS', JSON.stringify(dailyLogs));
  }, [dailyLogs]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_PHOTOS', JSON.stringify(photos));
  }, [photos]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_MATERIALS', JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_WORKERS', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_ALLOCATIONS', JSON.stringify(allocations));
  }, [allocations]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_EQUIPMENT', JSON.stringify(equipments));
  }, [equipments]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_AUDIT_LOGS', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_NOTIFICATIONS', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_CALENDAR_EVENTS', JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_PROJECT_DOCUMENTS', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_USER_NAMES', JSON.stringify(userNameMap));
  }, [userNameMap]);

  // Handle Dark Mode toggle on <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Snapshot Reloader for Session Cache Synchronization
  const handleReloadFromSnapshot = useCallback((snapshot: ReturnType<typeof loadAllPrimaryProjectData>) => {
    if (snapshot.project) setProject(snapshot.project);
    if (snapshot.workItems) setWorkItems(snapshot.workItems);
    if (snapshot.paymentTerms) setPaymentTerms(snapshot.paymentTerms);
    if (snapshot.dailyLogs) setDailyLogs(snapshot.dailyLogs);
    if (snapshot.photos) setPhotos(snapshot.photos);
    if (snapshot.materials) setMaterials(snapshot.materials);
    if (snapshot.workers) setWorkers(snapshot.workers);
    if (snapshot.allocations) setAllocations(snapshot.allocations);
    if (snapshot.equipments) setEquipments(snapshot.equipments);
    if (snapshot.auditLogs) setAuditLogs(snapshot.auditLogs);
    if (snapshot.notifications) setNotifications(snapshot.notifications);
    if (snapshot.calendarEvents) setCalendarEvents(snapshot.calendarEvents);
    if (snapshot.documents) setDocuments(snapshot.documents);
  }, []);

  const {
    isOutOfSync,
    syncStatus,
    sessionVersion,
    isChecking,
    lastSyncCheckedAt,
    syncWithPrimaryState,
    dismissOutOfSync,
    checkStatus,
    markLocalEdit,
  } = useSyncMonitor({
    onSyncReload: handleReloadFromSnapshot,
  });

  // Helper to append audit logs and stamp primary state version
  const addAuditLog = (action: string, details: string) => {
    const actorName = userNameMap[currentRole] || (currentRole === 'Direktur' ? 'H. Bambang S.' : currentRole === 'Site Manager' ? 'Ir. Agus Pratama' : 'Dedi Kurniawan');
    const newLog: AuditLog = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      userName: actorName,
      userRole: currentRole,
      action,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    // Stamp primary state version & advance local session version
    const updatedMeta = recordPrimaryStateUpdate(action, currentRole, actorName);
    markLocalEdit(updatedMeta.version);
  };

  // User Authentication & RBAC Handlers
  const handleLogin = (role: StakeholderRoleKey, userName: string) => {
    const newSession: AuthSession = {
      isAuthenticated: true,
      role,
      userName,
      loginTime: new Date().toISOString(),
    };
    setAuthSession(newSession);
    setCurrentRole(role as UserRole);
    localStorage.setItem('FORESYNDO_AUTH_SESSION', JSON.stringify(newSession));
    sessionStorage.setItem('FORESYNDO_SESSION_ACTIVE', 'true');
    addAuditLog('Login Berhasil', `Pengguna ${userName} masuk dengan peran ${role}`);

    // If currently active tab is not allowed for this role, redirect to dashboard
    const rolePerms = stakeholderProfiles[role]?.permissions;
    if (rolePerms && !rolePerms.allowedTabs.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    const loggedOutSession: AuthSession = {
      isAuthenticated: false,
      role: 'Kontraktor',
      userName: '',
      loginTime: '',
    };
    setAuthSession(loggedOutSession);
    localStorage.removeItem('FORESYNDO_AUTH_SESSION');
    sessionStorage.removeItem('FORESYNDO_SESSION_ACTIVE');
    addAuditLog('Logout Sistem', `Sesi pengguna (${currentRole}) telah keluar.`);
  };

  const handleRoleChange = (newRole: UserRole) => {
    // STRICT ISOLATION: Kontraktor cannot switch to Owner or Konsultan
    if (
      (currentRole === 'Kontraktor' || currentRole === 'Site Manager') &&
      (newRole === 'Owner' || newRole === 'Konsultan' || newRole === 'Direktur')
    ) {
      return;
    }

    setCurrentRole(newRole);
    const mappedKey: StakeholderRoleKey =
      newRole === 'Owner' || newRole === 'Direktur'
        ? 'Owner'
        : newRole === 'Konsultan'
        ? 'Konsultan'
        : newRole === 'Kontraktor' || newRole === 'Site Manager'
        ? 'Kontraktor'
        : 'Viewer';

    const uName = stakeholderProfiles[mappedKey]?.personName || userNameMap[newRole];
    const updatedSession: AuthSession = {
      isAuthenticated: true,
      role: mappedKey,
      userName: uName,
      loginTime: new Date().toISOString(),
    };
    setAuthSession(updatedSession);
    localStorage.setItem('FORESYNDO_AUTH_SESSION', JSON.stringify(updatedSession));
    addAuditLog('Ganti Peran', `Beralih ke peran ${newRole}`);
  };

  const handleUpdateProjectStatus = (status: ProjectInfo['status']) => {
    setProject((prev) => ({ ...prev, status }));
  };

  // Work Item Handlers
  const handleUpdateWorkItem = (updated: WorkItem) => {
    setWorkItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    addAuditLog(
      'Update Progress Time Schedule',
      `Memperbarui ${updated.name} (Progress: ${updated.realizedProgressPercent}%, Status: ${updated.status})`
    );
  };

  const handleAddWorkItem = (newItemData: Omit<WorkItem, 'id'>) => {
    const newItem: WorkItem = {
      ...newItemData,
      id: `WI-${Date.now()}`,
    };
    setWorkItems((prev) => [...prev, newItem]);
    addAuditLog('Tambah Pekerjaan', `Menambahkan item pekerjaan baru: ${newItem.name} (Bobot: ${newItem.bobotPercent}%)`);
  };

  const handleDeleteWorkItem = (id: string) => {
    const item = workItems.find((w) => w.id === id);
    setWorkItems((prev) => prev.filter((w) => w.id !== id));
    if (item) {
      addAuditLog('Hapus Pekerjaan', `Menghapus item pekerjaan: ${item.name}`);
    }
  };

  const handleReorderWorkItems = (reorderedItems: WorkItem[]) => {
    setWorkItems(reorderedItems);
    addAuditLog('Re-order Time Schedule', 'Mengubah urutan sekuensi tahapan pekerjaan (Drag & Drop / Re-sequence)');
  };

  const handleApplyProgress25Percent = () => {
    setWorkItems((prev) =>
      prev.map((item) => {
        if (item.id === 'WI-01' || item.no === 1) {
          return {
            ...item,
            realizedProgressPercent: 100,
            volumeRealized: item.volumeTarget,
            status: 'Selesai',
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        if (item.id === 'WI-02' || item.no === 2) {
          return {
            ...item,
            realizedProgressPercent: 100,
            volumeRealized: item.volumeTarget,
            status: 'Selesai',
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        if (item.id === 'WI-03' || item.no === 3) {
          return {
            ...item,
            realizedProgressPercent: 83.45,
            volumeRealized: Math.round(item.volumeTarget * 0.8345),
            status: 'Dalam Proses',
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return item;
      })
    );

    setProject((prev) => ({ ...prev, status: 'Dalam Pengerjaan' }));

    addAuditLog(
      'Audit RAB & Penerapan Progress 25%',
      'Capaian fisik proyek disesuaikan ke target milestone 25.0% (Termin 1 - Rp 3.615.440.245) berdasarkan Audit RAB Resmi.'
    );
  };

  // Termin Payment Handlers
  const handleUpdateTermStatus = (
    termNumber: number,
    status: PaymentTerm['status'],
    paymentDate?: string,
    proofUrl?: string,
    approvedBy?: string
  ) => {
    setPaymentTerms((prev) =>
      prev.map((t) => {
        if (t.termNumber === termNumber) {
          return {
            ...t,
            status,
            paymentDate: paymentDate || t.paymentDate,
            proofUrl: proofUrl || t.proofUrl,
            approvedBy: approvedBy || t.approvedBy,
          };
        }
        return t;
      })
    );
    addAuditLog(
      `Status Termin ${termNumber}: ${status}`,
      `Pencairan Termin ${termNumber} diperbarui menjadi ${status}${approvedBy ? ` (Approved: ${approvedBy})` : ''}`
    );
  };

  // Daily Log Handler
  const handleAddDailyLog = (logData: Omit<DailyLog, 'id'>) => {
    const newLog: DailyLog = {
      ...logData,
      id: `LOG-${Date.now()}`,
    };
    setDailyLogs((prev) => [newLog, ...prev]);

    if (logData.photos && logData.photos.length > 0) {
      const newPhoto: PhotoItem = {
        id: `PHT-${Date.now()}`,
        date: logData.date,
        category: 'Progress Hari Ini',
        title: `Dokumentasi Laporan Harian ${logData.date}`,
        url: logData.photos[0],
        uploadedBy: currentRole,
        notes: logData.activitySummary,
      };
      setPhotos((prev) => [newPhoto, ...prev]);
    }

    addAuditLog('Input Laporan Harian', `Pencatatan kegiatan harian tanggal ${logData.date} (${logData.workerCount} pekerja)`);
  };

  // Photo Handler
  const handleAddPhoto = (photoData: Omit<PhotoItem, 'id'>) => {
    const newPht: PhotoItem = {
      ...photoData,
      id: `PHT-${Date.now()}`,
    };
    setPhotos((prev) => [newPht, ...prev]);
    addAuditLog('Upload Dokumentasi Foto', `Mengunggah foto kategori ${photoData.category}: ${photoData.title}`);
  };

  // Material Handlers
  const handleAddMaterial = (matData: Omit<MaterialItem, 'id'>) => {
    const newMat: MaterialItem = {
      ...matData,
      id: `MAT-${Date.now()}`,
    };
    setMaterials((prev) => [...prev, newMat]);
    addAuditLog('Tambah Stok Material', `Menambahkan material baru: ${matData.name} dari ${matData.supplier}`);
  };

  const handleUpdateMaterial = (updatedMat: MaterialItem) => {
    setMaterials((prev) => prev.map((m) => (m.id === updatedMat.id ? updatedMat : m)));
    addAuditLog('Update Stok Material', `Memperbarui data/stok material ${updatedMat.name} (Sisa: ${updatedMat.stockRemaining} ${updatedMat.unit})`);
  };

  // Worker & Allocation Handler
  const handleAddWorker = (workerData: Omit<WorkerItem, 'id'>) => {
    const newWrk: WorkerItem = {
      ...workerData,
      id: `WRK-${Date.now()}`,
    };
    setWorkers((prev) => [...prev, newWrk]);
    addAuditLog('Tambah Tenaga Kerja', `Menambahkan pekerja baru: ${workerData.name} (${workerData.role})`);
  };

  const handleAddAllocation = (allocData: Omit<WorkerAllocation, 'id'>) => {
    const newAlloc: WorkerAllocation = {
      ...allocData,
      id: `ALLOC-${Date.now()}`,
    };
    setAllocations((prev) => [newAlloc, ...prev]);
    addAuditLog('Alokasi Pekerja Baru', `Mengalokasikan ${allocData.workerName} ke ${allocData.workItemName}`);
  };

  const handleUpdateAllocation = (updated: WorkerAllocation) => {
    setAllocations((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    addAuditLog('Update Alokasi Pekerja', `Memperbarui output/status alokasi ${updated.workerName}`);
  };

  const handleDeleteAllocation = (id: string) => {
    const target = allocations.find((a) => a.id === id);
    setAllocations((prev) => prev.filter((a) => a.id !== id));
    if (target) {
      addAuditLog('Hapus Alokasi Pekerja', `Menghapus alokasi ${target.workerName} dari ${target.workItemName}`);
    }
  };

  // Equipment Handler
  const handleAddEquipment = (eqData: Omit<EquipmentItem, 'id'>) => {
    const newEq: EquipmentItem = {
      ...eqData,
      id: `EQP-${Date.now()}`,
    };
    setEquipments((prev) => [...prev, newEq]);
    addAuditLog('Tambah Unit Alat', `Menambahkan alat berat baru: ${eqData.name}`);
  };

  // Calendar Event Handlers
  const handleAddCalendarEvent = (eData: Omit<CalendarEvent, 'id'>) => {
    const newEvt: CalendarEvent = {
      ...eData,
      id: `CAL-${Date.now()}`,
      isCustom: true,
    };
    setCalendarEvents((prev) => [newEvt, ...prev]);
    addAuditLog('Tambah Event Kalender', `Menambahkan event baru: ${eData.title} (${eData.date})`);
  };

  const handleDeleteCalendarEvent = (id: string) => {
    const target = calendarEvents.find((e) => e.id === id);
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
    if (target) {
      addAuditLog('Hapus Event Kalender', `Menghapus event: ${target.title}`);
    }
  };

  const handleUpdateCalendarEvent = (updated: CalendarEvent) => {
    setCalendarEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    addAuditLog('Update Event Kalender', `Memperbarui event: ${updated.title}`);
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkNotificationItemRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleAddNotification = (newNotif: Omit<NotificationItem, 'id' | 'timestamp' | 'isRead'>) => {
    const item: NotificationItem = {
      ...newNotif,
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      isRead: false,
    };
    setNotifications((prev) => [item, ...prev]);
  };

  const handleAddDocument = (newDoc: ProjectDocument) => {
    setDocuments((prev) => [newDoc, ...prev]);

    const isMK = newDoc.uploadedByRole === 'Konsultan';
    const isOwner = newDoc.uploadedByRole === 'Owner' || newDoc.uploadedByRole === 'Direktur';

    let notifTitle = '📄 Dokumen Baru Diunggah';
    let notifType: NotificationItem['type'] = 'info';

    if (isMK) {
      notifTitle = '📄 Dokumen Baru dari Konsultan MK';
      notifType = 'reminder';
    } else if (isOwner) {
      notifTitle = '📄 Dokumen Baru dari Owner Proyek';
      notifType = 'reminder';
    }

    handleAddNotification({
      title: notifTitle,
      message: `Dokumen "${newDoc.documentNumber}: ${newDoc.title}" (${newDoc.version}) diterbitkan oleh ${newDoc.uploadedBy} [${newDoc.uploadedByRole}].`,
      type: notifType,
      category: 'document',
      documentId: newDoc.id,
      uploaderRole: newDoc.uploadedByRole,
      uploaderName: newDoc.uploadedBy,
    });
  };

  const handleSimulateMKDocument = () => {
    const timestamp = Date.now().toString().slice(-4);
    const mockMKDoc: ProjectDocument = {
      id: `DOC-MK-${Date.now()}`,
      title: 'Shop Drawing Revisi Penulangan Balok & Kolom Sektor 2',
      documentNumber: `SHD-MK-${timestamp}`,
      category: 'drawing',
      fileType: 'pdf',
      fileSize: '4.2 MB',
      fileName: `SHD-MK-${timestamp}-Revisi-Struktur.pdf`,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: 'PT Bina Mandiri Konsultan (MK)',
      uploadedByRole: 'Konsultan',
      version: 'Rev.02',
      status: 'Approved',
      description: 'Review komprehensif penulangan balok B1 & kolom K2 serta rekomendasi perbaikan pembesian lapangan oleh Konsultan MK.',
      tags: ['Struktur', 'Shop Drawing', 'Konsultan MK'],
      confidentiality: 'Khusus Tripartit (Owner-MK-Kontraktor)',
      signatories: [
        {
          role: 'Konsultan',
          name: 'Ir. Hendra Gunawan (Team Leader MK)',
          signed: true,
          signedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        },
      ],
      reviewNotes: [
        {
          id: `REV-MK-${Date.now()}`,
          authorName: 'Ir. Hendra Gunawan',
          authorRole: 'Konsultan',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
          statusChange: 'Approved',
          comment: 'Disetujui untuk dilaksanakan dengan memperhatikan selimut beton minimal 30 mm.',
        },
      ],
    };

    handleAddDocument(mockMKDoc);
    addAuditLog(
      'Unggah Dokumen MK',
      `Konsultan MK menerbitkan gambar kerja baru: ${mockMKDoc.documentNumber} - ${mockMKDoc.title}`
    );
  };

  const handleSimulateOwnerDocument = () => {
    const timestamp = Date.now().toString().slice(-4);
    const mockOwnerDoc: ProjectDocument = {
      id: `DOC-OWNER-${Date.now()}`,
      title: 'Surat Instruksi Lapangan & Addendum Spek Material Finishing',
      documentNumber: `INST-OWNER-${timestamp}`,
      category: 'contract',
      fileType: 'pdf',
      fileSize: '1.8 MB',
      fileName: `INST-OWNER-${timestamp}-Instruksi.pdf`,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: 'H. Bambang S., M.T. (Owner / Direktur)',
      uploadedByRole: 'Owner',
      version: 'v1.0',
      status: 'Approved',
      description: 'Instruksi resmi Owner terkait penyesuaian spesifikasi granit lantai dan armature pencahayaan koridor.',
      tags: ['Instruksi Owner', 'Addendum', 'Finishing'],
      confidentiality: 'Khusus Tripartit (Owner-MK-Kontraktor)',
      signatories: [
        {
          role: 'Owner',
          name: 'H. Bambang S., M.T.',
          signed: true,
          signedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        },
      ],
      reviewNotes: [],
    };

    handleAddDocument(mockOwnerDoc);
    addAuditLog(
      'Unggah Dokumen Owner',
      `Owner menerbitkan dokumen instruksi baru: ${mockOwnerDoc.documentNumber} - ${mockOwnerDoc.title}`
    );
  };

  const handleUpdateDocument = (updatedDoc: ProjectDocument) => {
    setDocuments((prev) => prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d)));
    handleAddNotification({
      title: 'Status Dokumen Diperbarui',
      message: `${updatedDoc.documentNumber} berstatus "${updatedDoc.status}"`,
      type: updatedDoc.status === 'Revision' ? 'warning' : 'info',
    });
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  // Supabase Cloud Sync Handlers
  const handlePushToSupabase = async () => {
    const payload = {
      projectId: project.id || 'FORESYNDO-PROJECT-2',
      projectInfo: project,
      documents,
      dailyLogs,
      materials,
      workItems,
      workers,
      allocations,
      equipments,
      auditLogs,
      paymentTerms,
      photos,
      syncedBy: `${currentRole} - ${userNameMap[currentRole] || 'User'}`,
    };

    const result = await pushAllDataToSupabase(payload);
    if (result.success) {
      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      setLastSupabaseSync(timeStr);
      localStorage.setItem('FORESYNDO_LAST_SUPABASE_SYNC', timeStr);
      addAuditLog(
        'Sinkronisasi Supabase',
        `Berhasil mengunggah data proyek ke Supabase Cloud (${result.counts.documents} dokumen, ${result.counts.dailyLogs} laporan harian)`
      );
      handleAddNotification({
        title: 'Sinkronisasi Supabase Berhasil',
        message: `${result.counts.documents} dokumen & ${result.counts.dailyLogs} laporan tersimpan di cloud.`,
        type: 'info',
      });
    }
    return result;
  };

  const handlePullFromSupabase = async () => {
    try {
      const remoteData = await pullAllDataFromSupabase(project.id || 'FORESYNDO-PROJECT-2');
      if (!remoteData) {
        return {
          success: false,
          message: 'Tidak ada snapshot data proyek yang ditemukan di Supabase. Silakan unggah data terlebih dahulu.',
        };
      }

      if (remoteData.documents && Array.isArray(remoteData.documents)) setDocuments(remoteData.documents);
      if (remoteData.dailyLogs && Array.isArray(remoteData.dailyLogs)) setDailyLogs(remoteData.dailyLogs);
      if (remoteData.materials && Array.isArray(remoteData.materials)) setMaterials(remoteData.materials);
      if (remoteData.workItems && Array.isArray(remoteData.workItems)) setWorkItems(remoteData.workItems);
      if (remoteData.workers && Array.isArray(remoteData.workers)) setWorkers(remoteData.workers);
      if (remoteData.allocations && Array.isArray(remoteData.allocations)) setAllocations(remoteData.allocations);
      if (remoteData.equipments && Array.isArray(remoteData.equipments)) setEquipments(remoteData.equipments);
      if (remoteData.paymentTerms && Array.isArray(remoteData.paymentTerms)) setPaymentTerms(remoteData.paymentTerms);
      if (remoteData.projectInfo) setProject(remoteData.projectInfo);

      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      setLastSupabaseSync(timeStr);
      localStorage.setItem('FORESYNDO_LAST_SUPABASE_SYNC', timeStr);
      addAuditLog('Tarik Data Supabase', 'Berhasil memperbarui data proyek lokal dari Supabase Cloud.');

      handleAddNotification({
        title: 'Data Supabase Berhasil Dimuat',
        message: 'Data proyek berhasil diperbarui dari database Supabase Cloud.',
        type: 'info',
      });

      return {
        success: true,
        message: 'Data proyek berhasil diperbarui dari Supabase Cloud!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Gagal menarik data dari Supabase',
      };
    }
  };

  // Realtime Supabase change listener
  useEffect(() => {
    const unsubscribe = subscribeToSupabaseRealtime((payload) => {
      console.log('Supabase Realtime event detected:', payload);
      handleAddNotification({
        title: 'Supabase Cloud Update',
        message: 'Terdeteksi pembaruan data proyek di Supabase Cloud.',
        type: 'info',
      });
    }, project.id);

    return () => {
      unsubscribe();
    };
  }, [project.id]);

  const handleResetProject = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset data proyek ke status BELUM MULAI (Progress 0%)?')) {
      setProject(INITIAL_PROJECT_INFO);
      setWorkItems(INITIAL_WORK_ITEMS);
      setPaymentTerms(INITIAL_PAYMENT_TERMS);
      setDailyLogs(INITIAL_DAILY_LOGS);
      setPhotos(INITIAL_PHOTOS);
      setMaterials(INITIAL_MATERIALS);
      setWorkers(INITIAL_WORKERS);
      setAllocations(INITIAL_WORKER_ALLOCATIONS);
      setEquipments(INITIAL_EQUIPMENT);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setNotifications(INITIAL_NOTIFICATIONS);
      setCalendarEvents(INITIAL_CALENDAR_EVENTS);
      setDocuments(INITIAL_PROJECT_DOCUMENTS);
      localStorage.clear();
    }
  };

  const physicalProgress = calculatePhysicalProgress(workItems);
  const targetProgress = calculateTargetProgress(workItems);
  const deviation = calculateDeviation(physicalProgress, targetProgress);

  const unreadDocCount = notifications.filter(
    (n) =>
      !n.isRead &&
      (n.category === 'document' ||
        n.title.toLowerCase().includes('dokumen') ||
        n.message.toLowerCase().includes('dokumen') ||
        n.uploaderRole === 'Owner' ||
        n.uploaderRole === 'Direktur' ||
        n.uploaderRole === 'Konsultan')
  ).length;

  const isOwner = currentRole === 'Owner' || currentRole === 'Direktur';

  // If user is not authenticated, render the Tripartit Login Page
  if (!authSession.isAuthenticated) {
    return (
      <LoginPage
        onLogin={handleLogin}
        stakeholderProfiles={stakeholderProfiles}
        projectName={project.name}
        projectLocation={project.location}
        rolePins={rolePins}
      />
    );
  }

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? 'dark bg-slate-950 text-slate-100'
          : 'bg-gradient-to-br from-white via-sky-50/70 to-blue-100/60 text-slate-800'
      } font-sans flex flex-col transition-colors duration-200`}
    >
      {/* Top Fixed Header Bar */}
      <Header
        project={project}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onQuickExport={() => generatePDFReport('Progress', project, workItems, paymentTerms, dailyLogs, materials)}
        onResetProject={isOwner ? handleResetProject : undefined}
        onOpenSettingsModal={isOwner ? () => setIsSettingsModalOpen(true) : undefined}
        onOpenRoleModal={
          isOwner
            ? (subTab) => {
                setRoleModalTab(subTab || 'profiles');
                setIsRoleModalOpen(true);
              }
            : undefined
        }
        activeUserName={userNameMap[currentRole]}
        onLogout={handleLogout}
        syncStatus={syncStatus}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Prominent Session Cache Desynchronization Alert Banner */}
      <SyncAlertBanner
        syncStatus={syncStatus}
        isChecking={isChecking}
        onSync={syncWithPrimaryState}
        onDismiss={dismissOutOfSync}
      />

      {/* Main Body Layout with Sidebar + Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          hasDeviasiWarning={deviation < -5}
          darkMode={darkMode}
          unreadDocCount={unreadDocCount}
          onOpenSettingsModal={isOwner ? () => setIsSettingsModalOpen(true) : undefined}
          onOpenRoleModal={
            isOwner
              ? (subTab) => {
                  setRoleModalTab(subTab || 'profiles');
                  setIsRoleModalOpen(true);
                }
              : undefined
          }
          activeUserName={userNameMap[currentRole]}
          projectName={project.name}
          allowedTabs={allowedTabs}
          currentRole={currentRole}
          onLogout={handleLogout}
        />

        {/* Dynamic Tab Content View */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {isCurrentTabRestricted ? (
            <AccessRestrictedNotice
              tab={activeTab}
              currentRole={currentRole}
              ownerName={stakeholderProfiles.Owner?.personName}
              onGoBackToDashboard={() => setActiveTab('dashboard')}
              onSwitchToOwner={() => {
                setCurrentRole('Owner');
                setRoleModalTab('permissions');
                setIsRoleModalOpen(true);
              }}
              onOpenRoleModal={() => {
                setRoleModalTab('permissions');
                setIsRoleModalOpen(true);
              }}
            />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <ExecutiveDashboard
                  project={project}
                  workItems={workItems}
                  paymentTerms={paymentTerms}
                  auditLogs={auditLogs}
                  notifications={notifications}
                  currentRole={currentRole}
                  onNavigateTab={setActiveTab}
                  onAddNotification={handleAddNotification}
                  onAddAuditLog={addAuditLog}
                  darkMode={darkMode}
                />
              )}

              {activeTab === 'schedule' && (
                <TimeScheduleTable
                  workItems={workItems}
                  userRole={currentRole}
                  permissions={currentPermissions}
                  onUpdateWorkItem={handleUpdateWorkItem}
                  onAddWorkItem={handleAddWorkItem}
                  onDeleteWorkItem={handleDeleteWorkItem}
                  onReorderWorkItems={handleReorderWorkItems}
                />
              )}

              {activeTab === 'calendar' && (
                <ProjectCalendar
                  project={project}
                  workItems={workItems}
                  paymentTerms={paymentTerms}
                  materials={materials}
                  calendarEvents={calendarEvents}
                  userRole={currentRole}
                  permissions={currentPermissions}
                  onAddCalendarEvent={handleAddCalendarEvent}
                  onDeleteCalendarEvent={handleDeleteCalendarEvent}
                  onUpdateCalendarEvent={handleUpdateCalendarEvent}
                />
              )}

              {activeTab === 'scurve' && (
                <SCurveChart
                  workItems={workItems}
                  project={project}
                  onAddAuditLog={addAuditLog}
                />
              )}

              {activeTab === 'gantt' && (
                <GanttChart workItems={workItems} onUpdateWorkItem={handleUpdateWorkItem} />
              )}

              {activeTab === 'daily' && (
                <DailyMonitoring
                  dailyLogs={dailyLogs}
                  userRole={currentRole}
                  permissions={currentPermissions}
                  activeUserName={userNameMap[currentRole]}
                  onAddDailyLog={handleAddDailyLog}
                />
              )}

              {activeTab === 'photos' && (
                <PhotoGallery
                  photos={photos}
                  userRole={currentRole}
                  permissions={currentPermissions}
                  activeUserName={userNameMap[currentRole]}
                  onAddPhoto={handleAddPhoto}
                />
              )}

              {activeTab === 'termin' && (
                <TerminPayments
                  project={project}
                  paymentTerms={paymentTerms}
                  workItems={workItems}
                  userRole={currentRole}
                  permissions={currentPermissions}
                  onUpdateTermStatus={handleUpdateTermStatus}
                  onApplyProgress25={handleApplyProgress25Percent}
                />
              )}

              {activeTab === 'materials' && (
                <MaterialMonitoring
                  materials={materials}
                  workItems={workItems}
                  userRole={currentRole}
                  permissions={currentPermissions}
                  onAddMaterial={handleAddMaterial}
                  onUpdateMaterial={handleUpdateMaterial}
                  onAddAuditLog={addAuditLog}
                />
              )}

              {activeTab === 'workforce' && (
                <WorkforceMonitoring
                  workers={workers}
                  workItems={workItems}
                  allocations={allocations}
                  userRole={currentRole}
                  permissions={currentPermissions}
                  onAddWorker={handleAddWorker}
                  onAddAllocation={handleAddAllocation}
                  onUpdateAllocation={handleUpdateAllocation}
                  onDeleteAllocation={handleDeleteAllocation}
                />
              )}

              {activeTab === 'equipment' && (
                <EquipmentMonitoring
                  equipments={equipments}
                  userRole={currentRole}
                  permissions={currentPermissions}
                  onAddEquipment={handleAddEquipment}
                />
              )}

              {activeTab === 'documents' && (
                <DocumentManagement
                  documents={documents}
                  userRole={currentRole}
                  permissions={currentPermissions}
                  activeUserName={userNameMap[currentRole]}
                  project={project}
                  onAddDocument={handleAddDocument}
                  onUpdateDocument={handleUpdateDocument}
                  onDeleteDocument={handleDeleteDocument}
                  onAddAuditLog={addAuditLog}
                  onSimulateMKDocument={handleSimulateMKDocument}
                  onSimulateOwnerDocument={handleSimulateOwnerDocument}
                />
              )}

              {activeTab === 'inspection' && (
                <FinalInspection
                  project={project}
                  workItems={workItems}
                  userRole={currentRole}
                  permissions={currentPermissions}
                  activeUserName={userNameMap[currentRole]}
                  onUpdateProjectStatus={handleUpdateProjectStatus}
                  onAddAuditLog={addAuditLog}
                />
              )}

              {activeTab === 'reports' && (
                <ReportCenter
                  project={project}
                  workItems={workItems}
                  paymentTerms={paymentTerms}
                  dailyLogs={dailyLogs}
                  materials={materials}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modals & Drawers */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onPushToSupabase={handlePushToSupabase}
        onPullFromSupabase={handlePullFromSupabase}
        lastSyncedAt={lastSupabaseSync}
        documentsCount={documents.length}
        reportsCount={dailyLogs.length}
        issuesCount={0}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onMarkItemRead={handleMarkNotificationItemRead}
        onNavigateToDocument={(docId) => {
          setActiveTab('documents');
          setIsNotificationsOpen(false);
        }}
        onSimulateMKDocument={handleSimulateMKDocument}
        onSimulateOwnerDocument={handleSimulateOwnerDocument}
        darkMode={darkMode}
      />

      <ProjectSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        project={project}
        onUpdateProject={setProject}
        currentRole={currentRole}
        userNameMap={userNameMap}
        onUpdateUserNameMap={setUserNameMap}
        onAddAuditLog={addAuditLog}
      />

      <RoleManagementModal
        isOpen={isRoleModalOpen && isOwner}
        onClose={() => setIsRoleModalOpen(false)}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        initialSubTab={roleModalTab}
        profiles={stakeholderProfiles}
        onUpdateProfiles={(newProfiles) => {
          setStakeholderProfiles(newProfiles);
          setUserNameMap((prev) => ({
            ...prev,
            Owner: newProfiles.Owner?.personName || prev.Owner,
            Konsultan: newProfiles.Konsultan?.personName || prev.Konsultan,
            Kontraktor: newProfiles.Kontraktor?.personName || prev.Kontraktor,
            Direktur: newProfiles.Owner?.personName || prev.Direktur,
            'Site Manager': newProfiles.Kontraktor?.personName || prev['Site Manager'],
            Viewer: newProfiles.Viewer?.personName || prev.Viewer,
          }));
        }}
        project={project}
        onUpdateProjectSignatories={(signatories) => {
          setProject((prev) => {
            const updated = { ...prev, ...signatories };
            localStorage.setItem('FORESYNDO_V3_PROJECT_INFO', JSON.stringify(updated));
            return updated;
          });
        }}
        onAddAuditLog={addAuditLog}
        rolePins={rolePins}
        onUpdateRolePins={setRolePins}
      />

      {/* Session Storage & Persistence Integrity Diagnostic Modal */}
      <SyncStatusModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncStatus={syncStatus}
        lastSyncCheckedAt={lastSyncCheckedAt}
        isChecking={isChecking}
        onCheckSync={checkStatus}
        onForceSync={() => {
          syncWithPrimaryState();
          setIsSyncModalOpen(false);
        }}
      />
    </div>
  );
}
