```tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  INITIAL_CONTRACTOR_PROFILE,
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
import {
  pushAllDataToSupabase,
  pullAllDataFromSupabase,
  subscribeToSupabaseRealtime,
} from './lib/supabaseService';
import { isSupabaseConnected } from './lib/supabase';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { ProjectSettingsModal } from './components/common/ProjectSettingsModal';
import { ContractorSettingsModal } from './components/common/ContractorSettingsModal';
import { RoleManagementModal } from './components/common/RoleManagementModal';
import { SyncAlertBanner } from './components/common/SyncAlertBanner';
import { OfflineStatusBanner } from './components/common/OfflineStatusBanner';
import { SyncStatusModal } from './components/common/SyncStatusModal';
import { ProjectQRCodeModal } from './components/common/ProjectQRCodeModal';
import { LoginPage } from './components/auth/LoginPage';
import { generatePDFReport } from './utils/exportEngine';
import {
  calculatePhysicalProgress,
  calculateTargetProgress,
  calculateDeviation,
} from './utils/calculations';
import { useSyncMonitor } from './hooks/useSyncMonitor';
import {
  recordPrimaryStateUpdate,
  loadAllPrimaryProjectData,
} from './utils/syncManager';
import {
  sanitizeImageUrl,
} from './components/common/SafeImage';

const PROJECT_ID = 'FORESYNDO-PROJECT-2';

type CloudStatus = 'loading' | 'ready' | 'error';

export default function App() {
  // ============================================================
  // UI STATE
  // ============================================================

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('FORESYNDO_DARK_MODE');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        'FORESYNDO_DARK_MODE',
        JSON.stringify(darkMode)
      );
    } catch {
      // UI preference only; never allow storage errors to crash the app.
    }

    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // ============================================================
  // AUTH SESSION
  // ============================================================

  const [authSession, setAuthSession] = useState<AuthSession>(() => {
    try {
      const isSessionActive =
        sessionStorage.getItem('FORESYNDO_SESSION_ACTIVE') === 'true';

      if (isSessionActive) {
        const saved = localStorage.getItem('FORESYNDO_AUTH_SESSION');

        if (saved) {
          const parsed = JSON.parse(saved);

          if (
            parsed &&
            typeof parsed.isAuthenticated === 'boolean' &&
            parsed.isAuthenticated
          ) {
            return parsed;
          }
        }
      }
    } catch {
      // Fall through to logged-out state.
    }

    return {
      isAuthenticated: false,
      role: 'Kontraktor',
      userName: '',
      loginTime: '',
    };
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const isSessionActive =
        sessionStorage.getItem('FORESYNDO_SESSION_ACTIVE') === 'true';

      if (isSessionActive) {
        const saved = localStorage.getItem('FORESYNDO_AUTH_SESSION');

        if (saved) {
          const parsed = JSON.parse(saved);

          if (parsed?.role && parsed?.isAuthenticated) {
            return parsed.role as UserRole;
          }
        }
      }
    } catch {
      // Fall through.
    }

    return 'Kontraktor';
  });

  // ============================================================
  // CLOUD STATE
  // ============================================================

  const [cloudStatus, setCloudStatus] =
    useState<CloudStatus>('loading');

  const [cloudError, setCloudError] = useState<string | null>(null);

  const [isSavingToCloud, setIsSavingToCloud] =
    useState(false);

  const [lastSupabaseSync, setLastSupabaseSync] =
    useState<string | null>(null);

  const cloudHydratedRef = useRef(false);
  const skipNextAutoSyncRef = useRef(false);
  const autoSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // ============================================================
  // MODALS
  // ============================================================

  const [isSupabaseModalOpen, setIsSupabaseModalOpen] =
    useState(false);

  const [isNotificationsOpen, setIsNotificationsOpen] =
    useState(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] =
    useState(false);

  const [isContractorSettingsModalOpen, setIsContractorSettingsModalOpen] =
    useState(false);

  const [isRoleModalOpen, setIsRoleModalOpen] =
    useState(false);

  const [isSyncModalOpen, setIsSyncModalOpen] =
    useState(false);

  const [isQrModalOpen, setIsQrModalOpen] =
    useState(false);

  const [roleModalTab, setRoleModalTab] =
    useState<
      'profiles' | 'permissions' | 'matrix' | 'workflow' | 'pins'
    >('profiles');

  // ============================================================
  // ROLE SECURITY
  // ============================================================

  const [rolePins, setRolePins] =
    useState<Record<StakeholderRoleKey, string>>({
      Owner: '889900',
      Konsultan: '776622',
      Kontraktor: '554433',
      Viewer: '112233',
    });

  // ============================================================
  // STAKEHOLDER PROFILES
  // ============================================================

  const [stakeholderProfiles, setStakeholderProfiles] =
    useState<Record<
      StakeholderRoleKey,
      StakeholderRoleProfile
    >>(() => {
      const merged = {
        ...INITIAL_STAKEHOLDER_PROFILES,
      };

      (
        ['Owner', 'Konsultan', 'Kontraktor', 'Viewer'] as const
      ).forEach((role) => {
        if (!merged[role]) return;

        const initPerms =
          INITIAL_STAKEHOLDER_PROFILES[role].permissions;

        if (!merged[role].permissions) {
          merged[role].permissions = {
            ...initPerms,
            allowedTabs: [...initPerms.allowedTabs],
          };
        } else {
          if (
            merged[role].permissions.canUploadDocuments ===
            undefined
          ) {
            merged[role].permissions.canUploadDocuments =
              initPerms.canUploadDocuments;
          }

          if (
            merged[role].permissions.canApproveDocuments ===
            undefined
          ) {
            merged[role].permissions.canApproveDocuments =
              initPerms.canApproveDocuments;
          }

          if (
            merged[role].permissions.canDeleteDocuments ===
            undefined
          ) {
            merged[role].permissions.canDeleteDocuments =
              initPerms.canDeleteDocuments;
          }

          if (!merged[role].permissions.allowedTabs) {
            merged[role].permissions.allowedTabs = [
              ...initPerms.allowedTabs,
            ];
          } else if (
            !merged[role].permissions.allowedTabs.includes(
              'documents'
            )
          ) {
            merged[role].permissions.allowedTabs.push(
              'documents'
            );
          }
        }
      });

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
    });

  // ============================================================
  // USER NAMES
  // ============================================================

  const [userNameMap, setUserNameMap] =
    useState<Record<UserRole, string>>({
      Owner: 'HASANUDIN',
      Konsultan: 'SYAEFUL ANWAR',
      Kontraktor: 'ROHMAN PRIYAMBODO',
      Direktur: 'HASANUDIN',
      'Site Manager': 'EKO YULIANTO',
      Admin: 'Siti Rahmawati, S.T.',
      Viewer: 'Tamu Pengawas',
    });

  // ============================================================
  // CORE PROJECT DATA
  //
  // IMPORTANT:
  // Initial values are only temporary React values.
  // They are NEVER read from localStorage.
  // Main UI is blocked until Supabase hydration succeeds.
  // ============================================================

  const [project, setProject] =
    useState<ProjectInfo>(INITIAL_PROJECT_INFO);

  const [workItems, setWorkItems] =
    useState<WorkItem[]>(INITIAL_WORK_ITEMS);

  const [paymentTerms, setPaymentTerms] =
    useState<PaymentTerm[]>(INITIAL_PAYMENT_TERMS);

  const [dailyLogs, setDailyLogs] =
    useState<DailyLog[]>(
      INITIAL_DAILY_LOGS.map((log) => ({
        ...log,
        photos: (log.photos || []).map((p) =>
          sanitizeImageUrl(p)
        ),
      }))
    );

  const [photos, setPhotos] =
    useState<PhotoItem[]>(
      INITIAL_PHOTOS.map((photo) => ({
        ...photo,
        url: sanitizeImageUrl(photo.url),
      }))
    );

  const [materials, setMaterials] =
    useState<MaterialItem[]>(INITIAL_MATERIALS);

  const [workers, setWorkers] =
    useState<WorkerItem[]>(INITIAL_WORKERS);

  const [allocations, setAllocations] =
    useState<WorkerAllocation[]>(
      INITIAL_WORKER_ALLOCATIONS
    );

  const [equipments, setEquipments] =
    useState<EquipmentItem[]>(INITIAL_EQUIPMENT);

  const [auditLogs, setAuditLogs] =
    useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  const [notifications, setNotifications] =
    useState<NotificationItem[]>(
      INITIAL_NOTIFICATIONS
    );

  const [calendarEvents, setCalendarEvents] =
    useState<CalendarEvent[]>(
      INITIAL_CALENDAR_EVENTS
    );

  const [documents, setDocuments] =
    useState<ProjectDocument[]>(
      INITIAL_PROJECT_DOCUMENTS
    );

  // ============================================================
  // EFFECTIVE ROLE / PERMISSIONS
  // ============================================================

  const getEffectiveRoleKey = (
    role: UserRole
  ): StakeholderRoleKey => {
    if (role === 'Owner' || role === 'Direktur') {
      return 'Owner';
    }

    if (role === 'Konsultan') {
      return 'Konsultan';
    }

    if (
      role === 'Kontraktor' ||
      role === 'Site Manager' ||
      role === 'Admin'
    ) {
      return 'Kontraktor';
    }

    return 'Viewer';
  };

  const effectiveRoleKey =
    getEffectiveRoleKey(currentRole);

  const currentProfile =
    stakeholderProfiles[effectiveRoleKey] ||
    INITIAL_STAKEHOLDER_PROFILES[effectiveRoleKey];

  const currentPermissions =
    currentProfile?.permissions ||
    INITIAL_STAKEHOLDER_PROFILES.Owner.permissions;

  const allowedTabs =
    currentPermissions?.allowedTabs ||
    ALL_PROJECT_TABS;

  const isCurrentTabRestricted =
    !allowedTabs.includes(activeTab);

  // ============================================================
  // APPLY CLOUD DATA
  // ============================================================

  const applyRemoteData = useCallback(
    (remoteData: any) => {
      if (!remoteData) {
        throw new Error(
          'Tidak ada data proyek yang dikembalikan dari Supabase.'
        );
      }

      if (remoteData.projectInfo) {
        const remoteProject = {
          ...remoteData.projectInfo,
        };

        if (
          !remoteProject.logoUrl ||
          remoteProject.logoUrl.includes(
            'unsplash.com'
          )
        ) {
          remoteProject.logoUrl = '/assets/logo.png';
        }

        if (!remoteProject.contractorProfile) {
          remoteProject.contractorProfile =
            INITIAL_CONTRACTOR_PROFILE;
        }

        setProject(remoteProject);
      }

      if (
        Array.isArray(remoteData.workItems)
      ) {
        setWorkItems(remoteData.workItems);
      }

      if (
        Array.isArray(remoteData.paymentTerms)
      ) {
        setPaymentTerms(remoteData.paymentTerms);
      }

      if (
        Array.isArray(remoteData.dailyLogs)
      ) {
        setDailyLogs(
          remoteData.dailyLogs.map(
            (log: DailyLog) => ({
              ...log,
              photos: (log.photos || []).map(
                (p) => sanitizeImageUrl(p)
              ),
            })
          )
        );
      }

      if (
        Array.isArray(remoteData.photos)
      ) {
        setPhotos(
          remoteData.photos.map(
            (photo: PhotoItem) => ({
              ...photo,
              url: sanitizeImageUrl(photo.url),
            })
          )
        );
      }

      if (
        Array.isArray(remoteData.materials)
      ) {
        setMaterials(remoteData.materials);
      }

      if (
        Array.isArray(remoteData.workers)
      ) {
        setWorkers(remoteData.workers);
      }

      if (
        Array.isArray(remoteData.allocations)
      ) {
        setAllocations(remoteData.allocations);
      }

      if (
        Array.isArray(remoteData.equipments)
      ) {
        setEquipments(remoteData.equipments);
      }

      if (
        Array.isArray(remoteData.auditLogs)
      ) {
        setAuditLogs(remoteData.auditLogs);
      }

      if (
        Array.isArray(remoteData.notifications)
      ) {
        setNotifications(remoteData.notifications);
      }

      if (
        Array.isArray(remoteData.calendarEvents)
      ) {
        setCalendarEvents(
          remoteData.calendarEvents
        );
      }

      if (
        Array.isArray(remoteData.documents)
      ) {
        setDocuments(remoteData.documents);
      }

      if (
        remoteData.userNames &&
        typeof remoteData.userNames === 'object'
      ) {
        setUserNameMap(
          (prev) => ({
            ...prev,
            ...remoteData.userNames,
          })
        );
      }

      if (
        remoteData.rolePins &&
        typeof remoteData.rolePins === 'object'
      ) {
        setRolePins(
          (prev) => ({
            ...prev,
            ...remoteData.rolePins,
          })
        );
      }

      if (
        remoteData.stakeholderProfiles &&
        typeof remoteData.stakeholderProfiles ===
          'object'
      ) {
        setStakeholderProfiles(
          (prev) => ({
            ...prev,
            ...remoteData.stakeholderProfiles,
          })
        );
      }

      if (
        remoteData.customCategories &&
        Array.isArray(remoteData.customCategories)
      ) {
        try {
          localStorage.setItem(
            'FORESYNDO_CUSTOM_MATERIAL_CATEGORIES',
            JSON.stringify(
              remoteData.customCategories
            )
          );
        } catch {
          // Ignore local UI cache errors.
        }

        window.dispatchEvent(
          new Event(
            'foresyndo_categories_updated'
          )
        );
      }
    },
    []
  );

  // ============================================================
  // INITIAL SUPABASE HYDRATION
  //
  // This is the most important part:
  // NEVER render the business application before this succeeds.
  // ============================================================

  const loadCloudData = useCallback(
    async (
      showLoading = true
    ): Promise<boolean> => {
      if (showLoading) {
        setCloudStatus('loading');
      }

      setCloudError(null);

      try {
        if (!isSupabaseConnected()) {
          throw new Error(
            'Supabase belum terhubung. Pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY tersedia pada saat build.'
          );
        }

        const remoteData =
          await pullAllDataFromSupabase(
            PROJECT_ID
          );

        if (!remoteData) {
          throw new Error(
            `Data proyek ${PROJECT_ID} tidak ditemukan di Supabase.`
          );
        }

        /*
         * Prevent automatic save from immediately
         * writing the freshly-loaded cloud state back.
         */
        skipNextAutoSyncRef.current = true;

        applyRemoteData(remoteData);

        const timeStr =
          new Date().toLocaleTimeString(
            'id-ID',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          ) + ' WIB';

        setLastSupabaseSync(timeStr);

        /*
         * This is only a small UI status value.
         * It is NOT project/business data.
         */
        try {
          localStorage.setItem(
            'FORESYNDO_LAST_SUPABASE_SYNC',
            timeStr
          );
        } catch {
          // Ignore cache errors.
        }

        cloudHydratedRef.current = true;
        setCloudStatus('ready');

        return true;
      } catch (error: any) {
        console.error(
          'FORESYNDO Supabase hydration failed:',
          error
        );

        cloudHydratedRef.current = false;
        setCloudStatus('error');

        setCloudError(
          error?.message ||
            'Data gagal dimuat dari Supabase.'
        );

        return false;
      }
    },
    [applyRemoteData]
  );

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          'FORESYNDO_LAST_SUPABASE_SYNC'
        );

      if (saved) {
        setLastSupabaseSync(saved);
      }
    } catch {
      // Ignore.
    }

    loadCloudData(true);
  }, [loadCloudData]);

  // ============================================================
  // VISIBILITY REFRESH
  // ============================================================

  useEffect(() => {
    const handleVisibilityChange =
      () => {
        if (
          document.visibilityState ===
          'visible' &&
          cloudHydratedRef.current
        ) {
          loadCloudData(false);
        }
      };

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      );
    };
  }, [loadCloudData]);

  // ============================================================
  // AUTO SAVE TO SUPABASE
  //
  // React state changes are automatically persisted.
  // No project data is written to localStorage.
  // ============================================================

  const buildCloudPayload = useCallback(
    () => {
      let customCats: string[] = [];

      try {
        const savedCats =
          localStorage.getItem(
            'FORESYNDO_CUSTOM_MATERIAL_CATEGORIES'
          );

        if (savedCats) {
          customCats = JSON.parse(
            savedCats
          );
        }
      } catch {
        // Optional UI cache only.
      }

      return {
        projectId: project.id || PROJECT_ID,
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
        calendarEvents,
        notifications,
        customCategories: customCats,
        userNames: userNameMap,
        rolePins,
        stakeholderProfiles,
        syncedBy: `${
          currentRole
        } - ${
          userNameMap[currentRole] ||
          'User'
        }`,
      };
    },
    [
      project,
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
      calendarEvents,
      notifications,
      userNameMap,
      rolePins,
      stakeholderProfiles,
      currentRole,
    ]
  );

  /*
   * Save after cloud hydration.
   *
   * Important:
   * auditLogs and notifications are included in the payload,
   * but are intentionally not dependencies of this effect.
   * They are captured by buildCloudPayload whenever another
   * primary project state changes.
   */
  useEffect(() => {
    if (
      !cloudHydratedRef.current ||
      cloudStatus !== 'ready'
    ) {
      return;
    }

    if (skipNextAutoSyncRef.current) {
      skipNextAutoSyncRef.current = false;
      return;
    }

    if (autoSyncTimerRef.current) {
      clearTimeout(
        autoSyncTimerRef.current
      );
    }

    autoSyncTimerRef.current =
      setTimeout(async () => {
        if (!cloudHydratedRef.current) {
          return;
        }

        try {
          setIsSavingToCloud(true);

          const result =
            await pushAllDataToSupabase(
              buildCloudPayload()
            );

          if (!result?.success) {
            throw new Error(
              result?.message ||
                'Gagal menyimpan data ke Supabase.'
            );
          }

          const timeStr =
            new Date().toLocaleTimeString(
              'id-ID',
              {
                hour: '2-digit',
                minute: '2-digit',
              }
            ) + ' WIB';

          setLastSupabaseSync(
            timeStr
          );

          try {
            localStorage.setItem(
              'FORESYNDO_LAST_SUPABASE_SYNC',
              timeStr
            );
          } catch {
            // Ignore.
          }

          setCloudError(null);
        } catch (error: any) {
          console.error(
            'Auto Supabase save failed:',
            error
          );

          setCloudError(
            error?.message ||
              'Perubahan belum berhasil disimpan ke Supabase.'
          );
        } finally {
          setIsSavingToCloud(false);
        }
      }, 800);

    return () => {
      if (autoSyncTimerRef.current) {
        clearTimeout(
          autoSyncTimerRef.current
        );
      }
    };
  }, [
    project,
    workItems,
    paymentTerms,
    dailyLogs,
    photos,
    materials,
    workers,
    allocations,
    equipments,
    calendarEvents,
    documents,
    userNameMap,
    rolePins,
    stakeholderProfiles,
    cloudStatus,
    buildCloudPayload,
  ]);

  // ============================================================
  // SNAPSHOT / SYNC MONITOR
  // ============================================================

  const handleReloadFromSnapshot =
    useCallback(
      (
        snapshot: ReturnType<
          typeof loadAllPrimaryProjectData
        >
      ) => {
        if (snapshot.project) {
          setProject(
            snapshot.project
          );
        }

        if (snapshot.workItems) {
          setWorkItems(
            snapshot.workItems
          );
        }

        if (snapshot.paymentTerms) {
          setPaymentTerms(
            snapshot.paymentTerms
          );
        }

        if (snapshot.dailyLogs) {
          setDailyLogs(
            snapshot.dailyLogs
          );
        }

        if (snapshot.photos) {
          setPhotos(
            snapshot.photos
          );
        }

        if (snapshot.materials) {
          setMaterials(
            snapshot.materials
          );
        }

        if (snapshot.workers) {
          setWorkers(
            snapshot.workers
          );
        }

        if (snapshot.allocations) {
          setAllocations(
            snapshot.allocations
          );
        }

        if (snapshot.equipments) {
          setEquipments(
            snapshot.equipments
          );
        }

        if (snapshot.auditLogs) {
          setAuditLogs(
            snapshot.auditLogs
          );
        }

        if (snapshot.notifications) {
          setNotifications(
            snapshot.notifications
          );
        }

        if (snapshot.calendarEvents) {
          setCalendarEvents(
            snapshot.calendarEvents
          );
        }

        if (snapshot.documents) {
          setDocuments(
            snapshot.documents
          );
        }
      },
      []
    );

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
    onSyncReload:
      handleReloadFromSnapshot,
  });

  // ============================================================
  // AUDIT LOG
  // ============================================================

  const addAuditLog = (
    action: string,
    details: string
  ) => {
    const actorName =
      userNameMap[currentRole] ||
      (
        currentRole === 'Direktur'
          ? 'H. Bambang S.'
          : currentRole ===
            'Site Manager'
          ? 'Ir. Agus Pratama'
          : 'Dedi Kurniawan'
      );

    const newLog: AuditLog = {
      id: `AUD-${Date.now()}`,
      timestamp:
        new Date().toLocaleString(
          'id-ID'
        ),
      userName: actorName,
      userRole: currentRole,
      action,
      details,
    };

    setAuditLogs(
      (prev) => [
        newLog,
        ...prev,
      ]
    );

    const updatedMeta =
      recordPrimaryStateUpdate(
        action,
        currentRole,
        actorName
      );

    markLocalEdit(
      updatedMeta.version
    );
  };

  // ============================================================
  // AUTH HANDLERS
  // ============================================================

  const handleLogin = (
    role: StakeholderRoleKey,
    userName: string
  ) => {
    const newSession: AuthSession =
      {
        isAuthenticated: true,
        role,
        userName,
        loginTime:
          new Date().toISOString(),
      };

    setAuthSession(
      newSession
    );

    setCurrentRole(
      role as UserRole
    );

    try {
      localStorage.setItem(
        'FORESYNDO_AUTH_SESSION',
        JSON.stringify(
          newSession
        )
      );

      sessionStorage.setItem(
        'FORESYNDO_SESSION_ACTIVE',
        'true'
      );
    } catch {
      // Session storage errors must not crash the app.
    }

    addAuditLog(
      'Login Berhasil',
      `Pengguna ${userName} masuk dengan peran ${role}`
    );

    const rolePerms =
      stakeholderProfiles[role]
        ?.permissions;

    if (
      rolePerms &&
      !rolePerms.allowedTabs.includes(
        activeTab
      )
    ) {
      setActiveTab(
        'dashboard'
      );
    }
  };

  const handleLogout = () => {
    const loggedOutSession: AuthSession =
      {
        isAuthenticated: false,
        role: 'Kontraktor',
        userName: '',
        loginTime: '',
      };

    setAuthSession(
      loggedOutSession
    );

    try {
      localStorage.removeItem(
        'FORESYNDO_AUTH_SESSION'
      );

      sessionStorage.removeItem(
        'FORESYNDO_SESSION_ACTIVE'
      );
    } catch {
      // Ignore.
    }

    addAuditLog(
      'Logout Sistem',
      `Sesi pengguna (${currentRole}) telah keluar.`
    );
  };

  const handleRoleChange = (
    newRole: UserRole
  ) => {
    if (
      (
        currentRole ===
          'Kontraktor' ||
        currentRole ===
          'Site Manager'
      ) &&
      (
        newRole === 'Owner' ||
        newRole ===
          'Konsultan' ||
        newRole ===
          'Direktur'
      )
    ) {
      return;
    }

    setCurrentRole(
      newRole
    );

    const mappedKey: StakeholderRoleKey =
      newRole === 'Owner' ||
      newRole === 'Direktur'
        ? 'Owner'
        : newRole ===
          'Konsultan'
        ? 'Konsultan'
        : newRole ===
            'Kontraktor' ||
          newRole ===
            'Site Manager'
        ? 'Kontraktor'
        : 'Viewer';

    const uName =
      stakeholderProfiles[
        mappedKey
      ]?.personName ||
      userNameMap[newRole];

    const updatedSession: AuthSession =
      {
        isAuthenticated: true,
        role: mappedKey,
        userName:
          uName,
        loginTime:
          new Date().toISOString(),
      };

    setAuthSession(
      updatedSession
    );

    try {
      localStorage.setItem(
        'FORESYNDO_AUTH_SESSION',
        JSON.stringify(
          updatedSession
        )
      );
    } catch {
      // Ignore.
    }

    addAuditLog(
      'Ganti Peran',
      `Beralih ke peran ${newRole}`
    );
  };

  // ============================================================
  // PROJECT HANDLERS
  // ============================================================

  const handleUpdateProjectStatus = (
    status: ProjectInfo['status']
  ) => {
    setProject(
      (prev) => ({
        ...prev,
        status,
      })
    );
  };

  // ============================================================
  // WORK ITEM HANDLERS
  // ============================================================

  const handleUpdateWorkItem = (
    updated: WorkItem
  ) => {
    setWorkItems(
      (prev) =>
        prev.map(
          (item) =>
            item.id === updated.id
              ? updated
              : item
        )
    );

    addAuditLog(
      'Update Progress Time Schedule',
      `Memperbarui ${updated.name} (Progress: ${updated.realizedProgressPercent}%, Status: ${updated.status})`
    );
  };

  const handleAddWorkItem = (
    newItemData: Omit<
      WorkItem,
      'id'
    >
  ) => {
    const newItem: WorkItem =
      {
        ...newItemData,
        id: `WI-${Date.now()}`,
      };

    setWorkItems(
      (prev) => [
        ...prev,
        newItem,
      ]
    );

    addAuditLog(
      'Tambah Pekerjaan',
      `Menambahkan item pekerjaan baru: ${newItem.name} (Bobot: ${newItem.bobotPercent}%)`
    );
  };

  const handleDeleteWorkItem = (
    id: string
  ) => {
    const item =
      workItems.find(
        (w) => w.id === id
      );

    setWorkItems(
      (prev) =>
        prev.filter(
          (w) => w.id !== id
        )
    );

    if (item) {
      addAuditLog(
        'Hapus Pekerjaan',
        `Menghapus item pekerjaan: ${item.name}`
      );
    }
  };

  const handleReorderWorkItems = (
    reorderedItems: WorkItem[]
  ) => {
    setWorkItems(
      reorderedItems
    );

    addAuditLog(
      'Re-order Time Schedule',
      'Mengubah urutan sekuensi tahapan pekerjaan (Drag & Drop / Re-sequence)'
    );
  };

  const handleApplyProgress25Percent =
    () => {
      setWorkItems(
        (prev) =>
          prev.map(
            (item) => {
              if (
                item.id ===
                  'WI-01' ||
                item.no === 1
              ) {
                return {
                  ...item,
                  realizedProgressPercent:
                    100,
                  volumeRealized:
                    item.volumeTarget,
                  status:
                    'Selesai',
                  updatedAt:
                    new Date()
                      .toISOString()
                      .split(
                        'T'
                      )[0],
                };
              }

              if (
                item.id ===
                  'WI-02' ||
                item.no === 2
              ) {
                return {
                  ...item,
                  realizedProgressPercent:
                    100,
                  volumeRealized:
                    item.volumeTarget,
                  status:
                    'Selesai',
                  updatedAt:
                    new Date()
                      .toISOString()
                      .split(
                        'T'
                      )[0],
                };
              }

              if (
                item.id ===
                  'WI-03' ||
                item.no === 3
              ) {
                return {
                  ...item,
                  realizedProgressPercent:
                    83.45,
                  volumeRealized:
                    Math.round(
                      item.volumeTarget *
                        0.8345
                    ),
                  status:
                    'Dalam Proses',
                  updatedAt:
                    new Date()
                      .toISOString()
                      .split(
                        'T'
                      )[0],
                };
              }

              return item;
            }
          )
      );

      setProject(
        (prev) => ({
          ...prev,
          status:
            'Dalam Pengerjaan',
        })
      );

      addAuditLog(
        'Audit RAB & Penerapan Progress 25%',
        'Capaian fisik proyek disesuaikan ke target milestone 25.0% (Termin 1 - Rp 3.615.440.245) berdasarkan Audit RAB Resmi.'
      );
    };

  // ============================================================
  // PAYMENT HANDLERS
  // ============================================================

  const handleUpdateTermStatus = (
    termNumber: number,
    status: PaymentTerm['status'],
    paymentDate?: string,
    proofUrl?: string,
    approvedBy?: string
  ) => {
    setPaymentTerms(
      (prev) =>
        prev.map(
          (t) =>
            t.termNumber ===
            termNumber
              ? {
                  ...t,
                  status,
                  paymentDate:
                    paymentDate ||
                    t.paymentDate,
                  proofUrl:
                    proofUrl ||
                    t.proofUrl,
                  approvedBy:
                    approvedBy ||
                    t.approvedBy,
                }
              : t
        )
    );

    addAuditLog(
      `Status Termin ${termNumber}: ${status}`,
      `Pencairan Termin ${termNumber} diperbarui menjadi ${status}${
        approvedBy
          ? ` (Approved: ${approvedBy})`
          : ''
      }`
    );
  };

  // ============================================================
  // DAILY LOG
  // ============================================================

  const handleAddDailyLog = (
    logData: Omit<
      DailyLog,
      'id'
    >
  ) => {
    const newLog: DailyLog =
      {
        ...logData,
        id: `LOG-${Date.now()}`,
      };

    setDailyLogs(
      (prev) => [
        newLog,
        ...prev,
      ]
    );

    if (
      logData.photos &&
      logData.photos.length > 0
    ) {
      const newPhotoItems: PhotoItem[] =
        logData.photos.map(
          (url, idx) => ({
            id: `PHT-${Date.now()}-${idx}`,
            date: logData.date,
            category:
              'Progress Hari Ini',
            title: `Dokumentasi Laporan Harian ${logData.date}${
              logData.photos
                .length > 1
                ? ` (Foto #${
                    idx + 1
                  })`
                : ''
            }`,
            url,
            uploadedBy:
              currentRole,
            notes:
              logData.activitySummary,
          })
        );

      setPhotos(
        (prev) => [
          ...newPhotoItems,
          ...prev,
        ]
      );
    }

    addAuditLog(
      'Input Laporan Harian',
      `Pencatatan kegiatan harian tanggal ${logData.date} (${logData.workerCount} pekerja)`
    );
  };

  // ============================================================
  // PHOTO
  // ============================================================

  const handleAddPhoto = (
    photoData: Omit<
      PhotoItem,
      'id'
    >
  ) => {
    const newPht: PhotoItem =
      {
        ...photoData,
        id: `PHT-${Date.now()}`,
      };

    setPhotos(
      (prev) => [
        newPht,
        ...prev,
      ]
    );

    addAuditLog(
      'Upload Dokumentasi Foto',
      `Mengunggah foto kategori ${photoData.category}: ${photoData.title}`
    );
  };

  // ============================================================
  // MATERIAL
  // ============================================================

  const handleAddMaterial = (
    matData: Omit<
      MaterialItem,
      'id'
    >
  ) => {
    const newMat: MaterialItem =
      {
        ...matData,
        id: `MAT-${Date.now()}`,
      };

    setMaterials(
      (prev) => [
        ...prev,
        newMat,
      ]
    );

    addAuditLog(
      'Tambah Stok Material',
      `Menambahkan material baru: ${matData.name} dari ${matData.supplier}`
    );
  };

  const handleUpdateMaterial = (
    updatedMat: MaterialItem
  ) => {
    setMaterials(
      (prev) =>
        prev.map(
          (m) =>
            m.id === updatedMat.id
              ? updatedMat
              : m
        )
    );

    addAuditLog(
      'Update Stok Material',
      `Memperbarui data/stok material ${updatedMat.name} (Sisa: ${updatedMat.stockRemaining} ${updatedMat.unit})`
    );
  };

  // ============================================================
  // WORKERS
  // ============================================================

  const handleAddWorker = (
    workerData: Omit<
      WorkerItem,
      'id'
    >
  ) => {
    const newWrk: WorkerItem =
      {
        ...workerData,
        id: `WRK-${Date.now()}`,
      };

    setWorkers(
      (prev) => [
        ...prev,
        newWrk,
      ]
    );

    addAuditLog(
      'Tambah Tenaga Kerja',
      `Menambahkan pekerja baru: ${workerData.name} (${workerData.role})`
    );
  };

  const handleAddAllocation = (
    allocData: Omit<
      WorkerAllocation,
      'id'
    >
  ) => {
    const newAlloc:
      WorkerAllocation =
      {
        ...allocData,
        id: `ALLOC-${Date.now()}`,
      };

    setAllocations(
      (prev) => [
        newAlloc,
        ...prev,
      ]
    );

    addAuditLog(
      'Alokasi Pekerja Baru',
      `Mengalokasikan ${allocData.workerName} ke ${allocData.workItemName}`
    );
  };

  const handleUpdateAllocation = (
    updated: WorkerAllocation
  ) => {
    setAllocations(
      (prev) =>
        prev.map(
          (a) =>
            a.id === updated.id
              ? updated
              : a
        )
    );

    addAuditLog(
      'Update Alokasi Pekerja',
      `Memperbarui output/status alokasi ${updated.workerName}`
    );
  };

  const handleDeleteAllocation = (
    id: string
  ) => {
    const target =
      allocations.find(
        (a) => a.id === id
      );

    setAllocations(
      (prev) =>
        prev.filter(
          (a) => a.id !== id
        )
    );

    if (target) {
      addAuditLog(
        'Hapus Alokasi Pekerja',
        `Menghapus alokasi ${target.workerName} dari ${target.workItemName}`
      );
    }
  };

  // ============================================================
  // EQUIPMENT
  // ============================================================

  const handleAddEquipment = (
    eqData: Omit<
      EquipmentItem,
      'id'
    >
  ) => {
    const newEq: EquipmentItem =
      {
        ...eqData,
        id: `EQP-${Date.now()}`,
      };

    setEquipments(
      (prev) => [
        ...prev,
        newEq,
      ]
    );

    addAuditLog(
      'Tambah Unit Alat',
      `Menambahkan alat berat baru: ${eqData.name}`
    );
  };

  // ============================================================
  // CALENDAR
  // ============================================================

  const handleAddCalendarEvent = (
    eData: Omit<
      CalendarEvent,
      'id'
    >
  ) => {
    const newEvt:
      CalendarEvent = {
      ...eData,
      id: `CAL-${Date.now()}`,
      isCustom: true,
    };

    setCalendarEvents(
      (prev) => [
        newEvt,
        ...prev,
      ]
    );

    addAuditLog(
      'Tambah Event Kalender',
      `Menambahkan event baru: ${eData.title} (${eData.date})`
    );
  };

  const handleDeleteCalendarEvent = (
    id: string
  ) => {
    const target =
      calendarEvents.find(
        (e) => e.id === id
      );

    setCalendarEvents(
      (prev) =>
        prev.filter(
          (e) => e.id !== id
        )
    );

    if (target) {
      addAuditLog(
        'Hapus Event Kalender',
        `Menghapus event: ${target.title}`
      );
    }
  };

  const handleUpdateCalendarEvent = (
    updated: CalendarEvent
  ) => {
    setCalendarEvents(
      (prev) =>
        prev.map(
          (e) =>
            e.id === updated.id
              ? updated
              : e
        )
    );

    addAuditLog(
      'Update Event Kalender',
      `Memperbarui event: ${updated.title}`
    );
  };

  // ============================================================
  // NOTIFICATIONS
  // ============================================================

  const handleMarkAllNotificationsRead =
    () => {
      setNotifications(
        (prev) =>
          prev.map(
            (n) => ({
              ...n,
              isRead: true,
            })
          )
      );
    };

  const handleMarkNotificationItemRead =
    (id: string) => {
      setNotifications(
        (prev) =>
          prev.map(
            (n) =>
              n.id === id
                ? {
                    ...n,
                    isRead: true,
                  }
                : n
          )
      );
    };

  const handleAddNotification = (
    newNotif: Omit<
      NotificationItem,
      'id' | 'timestamp' | 'isRead'
    >
  ) => {
    const item:
      NotificationItem = {
      ...newNotif,
      id: `NOTIF-${Date.now()}`,
      timestamp:
        new Date().toLocaleString(
          'id-ID',
          {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }
        ),
      isRead: false,
    };

    setNotifications(
      (prev) => [
        item,
        ...prev,
      ]
    );
  };

  // ============================================================
  // DOCUMENTS
  // ============================================================

  const handleAddDocument = (
    newDoc: ProjectDocument
  ) => {
    setDocuments(
      (prev) => [
        newDoc,
        ...prev,
      ]
    );

    const isMK =
      newDoc.uploadedByRole ===
      'Konsultan';

    const isOwner =
      newDoc.uploadedByRole ===
        'Owner' ||
      newDoc.uploadedByRole ===
        'Direktur';

    let notifTitle =
      '📄 Dokumen Baru Diunggah';

    let notifType:
      NotificationItem['type'] =
      'info';

    if (isMK) {
      notifTitle =
        '📄 Dokumen Baru dari Konsultan MK';
      notifType =
        'reminder';
    } else if (isOwner) {
      notifTitle =
        '📄 Dokumen Baru dari Owner Proyek';
      notifType =
        'reminder';
    }

    handleAddNotification({
      title:
        notifTitle,
      message: `Dokumen "${newDoc.documentNumber}: ${newDoc.title}" (${newDoc.version}) diterbitkan oleh ${newDoc.uploadedBy} [${newDoc.uploadedByRole}].`,
      type:
        notifType,
      category:
        'document',
      documentId:
        newDoc.id,
      uploaderRole:
        newDoc.uploadedByRole,
      uploaderName:
        newDoc.uploadedBy,
    });
  };

  const handleSimulateMKDocument =
    () => {
      const timestamp =
        Date.now()
          .toString()
          .slice(-4);

      const mockMKDoc:
        ProjectDocument = {
        id: `DOC-MK-${Date.now()}`,
        title:
          'Shop Drawing Revisi Penulangan Balok & Kolom Sektor 2',
        documentNumber:
          `SHD-MK-${timestamp}`,
        category:
          'drawing',
        fileType:
          'pdf',
        fileSize:
          '4.2 MB',
        fileName:
          `SHD-MK-${timestamp}-Revisi-Struktur.pdf`,
        uploadDate:
          new Date()
            .toISOString()
            .split('T')[0],
        uploadedBy:
          'PT Bina Mandiri Konsultan (MK)',
        uploadedByRole:
          'Konsultan',
        version:
          'Rev.02',
        status:
          'Approved',
        description:
          'Review komprehensif penulangan balok B1 & kolom K2 serta rekomendasi perbaikan pembesian lapangan oleh Konsultan MK.',
        tags: [
          'Struktur',
          'Shop Drawing',
          'Konsultan MK',
        ],
        confidentiality:
          'Khusus Tripartit (Owner-MK-Kontraktor)',
        signatories: [
          {
            role:
              'Konsultan',
            name:
              'Ir. Hendra Gunawan (Team Leader MK)',
            signed:
              true,
            signedAt:
              new Date()
                .toISOString()
                .replace(
                  'T',
                  ' '
                )
                .substring(
                  0,
                  16
                ),
          },
        ],
        reviewNotes: [
          {
            id: `REV-MK-${Date.now()}`,
            authorName:
              'Ir. Hendra Gunawan',
            authorRole:
              'Konsultan',
            timestamp:
              new Date()
                .toISOString()
                .replace(
                  'T',
                  ' '
                )
                .substring(
                  0,
                  16
                ),
            statusChange:
              'Approved',
            comment:
              'Disetujui untuk dilaksanakan dengan memperhatikan selimut beton minimal 30 mm.',
          },
        ],
      };

      handleAddDocument(
        mockMKDoc
      );

      addAuditLog(
        'Unggah Dokumen MK',
        `Konsultan MK menerbitkan gambar kerja baru: ${mockMKDoc.documentNumber} - ${mockMKDoc.title}`
      );
    };

  const handleSimulateOwnerDocument =
    () => {
      const timestamp =
        Date.now()
          .toString()
          .slice(-4);

      const mockOwnerDoc:
        ProjectDocument = {
        id: `DOC-OWNER-${Date.now()}`,
        title:
          'Surat Instruksi Lapangan & Addendum Spek Material Finishing',
        documentNumber:
          `INST-OWNER-${timestamp}`,
        category:
          'contract',
        fileType:
          'pdf',
        fileSize:
          '1.8 MB',
        fileName:
          `INST-OWNER-${timestamp}-Instruksi.pdf`,
        uploadDate:
          new Date()
            .toISOString()
            .split('T')[0],
        uploadedBy:
          'H. Bambang S., M.T. (Owner / Direktur)',
        uploadedByRole:
          'Owner',
        version:
          'v1.0',
        status:
          'Approved',
        description:
          'Instruksi resmi Owner terkait penyesuaian spesifikasi granit lantai dan armature pencahayaan koridor.',
        tags: [
          'Instruksi Owner',
          'Addendum',
          'Finishing',
        ],
        confidentiality:
          'Khusus Tripartit (Owner-MK-Kontraktor)',
        signatories: [
          {
            role:
              'Owner',
            name:
              'H. Bambang S., M.T.',
            signed:
              true,
            signedAt:
              new Date()
                .toISOString()
                .replace(
                  'T',
                  ' '
                )
                .substring(
                  0,
                  16
                ),
          },
        ],
        reviewNotes: [],
      };

      handleAddDocument(
        mockOwnerDoc
      );

      addAuditLog(
        'Unggah Dokumen Owner',
        `Owner menerbitkan dokumen instruksi baru: ${mockOwnerDoc.documentNumber} - ${mockOwnerDoc.title}`
      );
    };

  const handleUpdateDocument = (
    updatedDoc: ProjectDocument
  ) => {
    setDocuments(
      (prev) =>
        prev.map(
          (d) =>
            d.id ===
            updatedDoc.id
              ? updatedDoc
              : d
        )
    );

    handleAddNotification({
      title:
        'Status Dokumen Diperbarui',
      message: `${updatedDoc.documentNumber} berstatus "${updatedDoc.status}"`,
      type:
        updatedDoc.status ===
        'Revision'
          ? 'warning'
          : 'info',
    });
  };

  const handleDeleteDocument = (
    id: string
  ) => {
    setDocuments(
      (prev) =>
        prev.filter(
          (d) => d.id !== id
        )
    );
  };

  // ============================================================
  // MANUAL PUSH
  // ============================================================

  const handlePushToSupabase =
    async () => {
      try {
        setIsSavingToCloud(true);
        setCloudError(null);

        const result =
          await pushAllDataToSupabase(
            buildCloudPayload()
          );

        if (!result?.success) {
          throw new Error(
            result?.message ||
              'Gagal mengunggah data ke Supabase.'
          );
        }

        const timeStr =
          new Date().toLocaleTimeString(
            'id-ID',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          ) + ' WIB';

        setLastSupabaseSync(
          timeStr
        );

        try {
          localStorage.setItem(
            'FORESYNDO_LAST_SUPABASE_SYNC',
            timeStr
          );
        } catch {
          // Ignore.
        }

        addAuditLog(
          'Sinkronisasi Supabase',
          `Berhasil mengunggah data proyek ke Cloud (${result.counts?.documents ?? documents.length} dokumen, ${result.counts?.dailyLogs ?? dailyLogs.length} laporan harian)`
        );

        handleAddNotification({
          title:
            'Sinkronisasi Cloud Berhasil',
          message:
            'Data proyek berhasil disimpan ke Supabase untuk digunakan bersama oleh akun/browser lain.',
          type:
            'info',
        });

        return result;
      } catch (error: any) {
        const message =
          error?.message ||
          'Gagal menyimpan data ke Supabase.';

        setCloudError(
          message
        );

        return {
          success: false,
          message,
        };
      } finally {
        setIsSavingToCloud(false);
      }
    };

  // ============================================================
  // MANUAL PULL
  // ============================================================

  const handlePullFromSupabase =
    async () => {
      try {
        setCloudStatus(
          'loading'
        );
        setCloudError(null);

        const remoteData =
          await pullAllDataFromSupabase(
            PROJECT_ID
          );

        if (!remoteData) {
          throw new Error(
            'Tidak ada data proyek yang ditemukan di Supabase.'
          );
        }

        skipNextAutoSyncRef.current =
          true;

        applyRemoteData(
          remoteData
        );

        const timeStr =
          new Date().toLocaleTimeString(
            'id-ID',
            {
              hour: '2-digit',
              minute: '2-digit',
            }
          ) + ' WIB';

        setLastSupabaseSync(
          timeStr
        );

        try {
          localStorage.setItem(
            'FORESYNDO_LAST_SUPABASE_SYNC',
            timeStr
          );
        } catch {
          // Ignore.
        }

        cloudHydratedRef.current =
          true;

        setCloudStatus(
          'ready'
        );

        addAuditLog(
          'Tarik Data Cloud',
          'Berhasil memperbarui data proyek dari Supabase.'
        );

        handleAddNotification({
          title:
            'Data Cloud Berhasil Dimuat',
          message:
            'Data proyek berhasil disinkronkan dari Supabase.',
          type:
            'info',
        });

        return {
          success: true,
          message:
            'Data proyek berhasil diperbarui dari Supabase.',
        };
      } catch (error: any) {
        setCloudStatus(
          'error'
        );

        const message =
          error?.message ||
          'Gagal menarik data dari Supabase.';

        setCloudError(
          message
        );

        return {
          success: false,
          message,
        };
      }
    };

  // ============================================================
  // REALTIME
  // ============================================================

  useEffect(() => {
    if (
      !cloudHydratedRef.current
    ) {
      return;
    }

    const unsubscribe =
      subscribeToSupabaseRealtime(
        async (payload) => {
          console.log(
            'Supabase Realtime event:',
            payload
          );

          /*
           * Do not trust only the realtime event payload.
           * Pull the authoritative row/snapshot again from
           * Supabase so every browser gets the complete state.
           */
          try {
            skipNextAutoSyncRef.current =
              true;

            await loadCloudData(
              false
            );
          } catch (error) {
            console.error(
              'Realtime refresh failed:',
              error
            );
          }
        },
        PROJECT_ID
      );

    return () => {
      unsubscribe();
    };
  }, [loadCloudData]);

  // ============================================================
  // RESET PROJECT
  // ============================================================

  const handleResetProject =
    async () => {
      if (
        !window.confirm(
          'Apakah Anda yakin ingin mereset data proyek ke status BELUM MULAI (Progress 0%)? Data Supabase akan ikut diperbarui.'
        )
      ) {
        return;
      }

      setProject(
        INITIAL_PROJECT_INFO
      );

      setWorkItems(
        INITIAL_WORK_ITEMS
      );

      setPaymentTerms(
        INITIAL_PAYMENT_TERMS
      );

      setDailyLogs(
        INITIAL_DAILY_LOGS
      );

      setPhotos(
        INITIAL_PHOTOS
      );

      setMaterials(
        INITIAL_MATERIALS
      );

      setWorkers(
        INITIAL_WORKERS
      );

      setAllocations(
        INITIAL_WORKER_ALLOCATIONS
      );

      setEquipments(
        INITIAL_EQUIPMENT
      );

      setAuditLogs(
        INITIAL_AUDIT_LOGS
      );

      setNotifications(
        INITIAL_NOTIFICATIONS
      );

      setCalendarEvents(
        INITIAL_CALENDAR_EVENTS
      );

      setDocuments(
        INITIAL_PROJECT_DOCUMENTS
      );

      /*
       * IMPORTANT:
       * Never use localStorage.clear().
       * It can destroy authentication/session/UI settings
       * and is not needed anymore.
       *
       * The automatic Supabase sync will persist the reset.
       */
    };

  // ============================================================
  // CALCULATIONS
  // ============================================================

  const physicalProgress =
    calculatePhysicalProgress(
      workItems
    );

  const targetProgress =
    calculateTargetProgress(
      workItems
    );

  const deviation =
    calculateDeviation(
      physicalProgress,
      targetProgress
    );

  const unreadDocCount =
    notifications.filter(
      (n) =>
        !n.isRead &&
        (
          n.category ===
            'document' ||
          n.title
            .toLowerCase()
            .includes(
              'dokumen'
            ) ||
          n.message
            .toLowerCase()
            .includes(
              'dokumen'
            ) ||
          n.uploaderRole ===
            'Owner' ||
          n.uploaderRole ===
            'Direktur' ||
          n.uploaderRole ===
            'Konsultan'
        )
    ).length;

  const isOwner =
    currentRole ===
      'Owner' ||
    currentRole ===
      'Direktur';

  // ============================================================
  // CLOUD LOADING SCREEN
  //
  // Absolutely no project data is rendered before Supabase
  // succeeds.
  // ============================================================

  if (
    cloudStatus ===
    'loading'
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-sky-50 to-blue-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-8 text-center">
          <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin" />

          <h1 className="text-xl font-bold text-slate-800">
            Menghubungkan ke Supabase
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Memuat data proyek FORESYNDO-PROJECT-2
            dari database cloud.
          </p>

          <div className="mt-5 rounded-xl bg-sky-50 border border-sky-100 p-3 text-xs text-sky-700">
            Data aplikasi tidak diambil dari
            localStorage.
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // CLOUD ERROR SCREEN
  //
  // Do NOT silently fallback to localStorage.
  // ============================================================

  if (
    cloudStatus ===
      'error' &&
    !cloudHydratedRef.current
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-red-50 to-orange-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-red-200 p-8">
          <div className="flex items-center justify-center mx-auto mb-5 h-14 w-14 rounded-full bg-red-100 text-red-600 text-2xl">
            !
          </div>

          <h1 className="text-xl font-bold text-slate-800 text-center">
            Data gagal dimuat
          </h1>

          <p className="mt-2 text-sm text-slate-500 text-center">
            Aplikasi tidak dapat memuat data
            proyek dari Supabase.
          </p>

          <div className="mt-5 rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-xs font-semibold text-red-700 mb-1">
              Detail error
            </p>

            <p className="text-sm text-red-800 break-words">
              {cloudError ||
                'Terjadi kesalahan koneksi Supabase.'}
            </p>
          </div>

          <div className="mt-5 rounded-xl bg-slate-50 border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-700">
              Project ID
            </p>

            <p className="text-sm text-slate-600 mt-1">
              {PROJECT_ID}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadCloudData(
                true
              )
            }
            className="mt-6 w-full rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 transition"
          >
            Coba Lagi
          </button>

          <p className="mt-4 text-[11px] text-center text-slate-400">
            Pastikan VITE_SUPABASE_URL dan
            VITE_SUPABASE_ANON_KEY tersedia
            saat proses build/deploy.
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // LOGIN
  // ============================================================

  if (
    !authSession.isAuthenticated
  ) {
    return (
      <LoginPage
        onLogin={
          handleLogin
        }
        stakeholderProfiles={
          stakeholderProfiles
        }
        projectName={
          project.name
        }
        projectLocation={
          project.location
        }
        rolePins={
          rolePins
        }
      />
    );
  }

  // ============================================================
  // MAIN APPLICATION
  // ============================================================

  return (
    <div
      className={`min-h-screen ${
        darkMode
          ? 'dark bg-slate-950 text-slate-100'
          : 'bg-gradient-to-br from-white via-sky-50/70 to-blue-100/60 text-slate-800'
      } font-sans flex flex-col transition-colors duration-200`}
    >
      <OfflineStatusBanner
        onOpenDiagnostics={() =>
          setIsSyncModalOpen(
            true
          )
        }
      />

      <Header
        project={project}
        currentRole={
          currentRole
        }
        onRoleChange={
          handleRoleChange
        }
        darkMode={
          darkMode
        }
        onToggleDarkMode={() =>
          setDarkMode(
            !darkMode
          )
        }
        notifications={
          notifications
        }
        onOpenNotifications={() =>
          setIsNotificationsOpen(
            true
          )
        }
        onOpenSupabaseModal={() =>
          setIsSupabaseModalOpen(
            true
          )
        }
        onQuickExport={() =>
          generatePDFReport(
            'Progress',
            project,
            workItems,
            paymentTerms,
            dailyLogs,
            materials
          )
        }
        onResetProject={
          isOwner
            ? handleResetProject
            : undefined
        }
        onOpenSettingsModal={
          isOwner
            ? () =>
                setIsSettingsModalOpen(
                  true
                )
            : undefined
        }
        onOpenContractorModal={() =>
          setIsContractorSettingsModalOpen(
            true
          )
        }
        onOpenRoleModal={
          isOwner
            ? (subTab) => {
                setRoleModalTab(
                  subTab ||
                    'profiles'
                );
                setIsRoleModalOpen(
                  true
                );
              }
            : undefined
        }
        activeUserName={
          userNameMap[
            currentRole
          ]
        }
        onLogout={
          handleLogout
        }
        syncStatus={
          syncStatus
        }
        onOpenSyncModal={() =>
          setIsSyncModalOpen(
            true
          )
        }
        onOpenQrModal={() =>
          setIsQrModalOpen(
            true
          )
        }
      />

      {cloudError && (
        <div className="mx-4 mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center justify-between gap-4">
          <span>
            Perubahan belum berhasil disimpan
            ke Supabase: {cloudError}
          </span>

          <button
            type="button"
            onClick={() =>
              setCloudError(
                null
              )
            }
            className="text-xs font-semibold underline"
          >
            Tutup
          </button>
        </div>
      )}

      {isSavingToCloud && (
        <div className="mx-4 mt-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs text-sky-700">
          Menyimpan perubahan ke Supabase...
        </div>
      )}

      <SyncAlertBanner
        syncStatus={
          syncStatus
        }
        isChecking={
          isChecking
        }
        onSync={
          syncWithPrimaryState
        }
        onDismiss={
          dismissOutOfSync
        }
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        <Sidebar
          activeTab={
            activeTab
          }
          onSelectTab={
            setActiveTab
          }
          hasDeviasiWarning={
            deviation < -5
          }
          darkMode={
            darkMode
          }
          unreadDocCount={
            unreadDocCount
          }
          onOpenSettingsModal={
            isOwner
              ? () =>
                  setIsSettingsModalOpen(
                    true
                  )
              : undefined
          }
          onOpenContractorModal={() =>
            setIsContractorSettingsModalOpen(
              true
            )
          }
          onOpenQrModal={() =>
            setIsQrModalOpen(
              true
            )
          }
          onOpenRoleModal={
            isOwner
              ? (subTab) => {
                  setRoleModalTab(
                    subTab ||
                      'profiles'
                  );
                  setIsRoleModalOpen(
                    true
                  );
                }
              : undefined
          }
          activeUserName={
            userNameMap[
              currentRole
            ]
          }
          projectName={
            project.name
          }
          allowedTabs={
            allowedTabs
          }
          currentRole={
            currentRole
          }
          onLogout={
            handleLogout
          }
        />

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {isCurrentTabRestricted ? (
            <AccessRestrictedNotice
              tab={
                activeTab
              }
              currentRole={
                currentRole
              }
              ownerName={
                stakeholderProfiles
                  .Owner
                  ?.personName
              }
              onGoBackToDashboard={() =>
                setActiveTab(
                  'dashboard'
                )
              }
              onSwitchToOwner={() => {
                setCurrentRole(
                  'Owner'
                );
                setRoleModalTab(
                  'permissions'
                );
                setIsRoleModalOpen(
                  true
                );
              }}
              onOpenRoleModal={() => {
                setRoleModalTab(
                  'permissions'
                );
                setIsRoleModalOpen(
                  true
                );
              }}
            />
          ) : (
            <>
              {activeTab ===
                'dashboard' && (
                <ExecutiveDashboard
                  project={
                    project
                  }
                  workItems={
                    workItems
                  }
                  paymentTerms={
                    paymentTerms
                  }
                  auditLogs={
                    auditLogs
                  }
                  notifications={
                    notifications
                  }
                  currentRole={
                    currentRole
                  }
                  onNavigateTab={
                    setActiveTab
                  }
                  onAddNotification={
                    handleAddNotification
                  }
                  onAddAuditLog={
                    addAuditLog
                  }
                  darkMode={
                    darkMode
                  }
                  onOpenQrModal={() =>
                    setIsQrModalOpen(
                      true
                    )
                  }
                />
              )}

              {activeTab ===
                'schedule' && (
                <TimeScheduleTable
                  workItems={
                    workItems
                  }
                  userRole={
                    currentRole
                  }
                  permissions={
                    currentPermissions
                  }
                  onUpdateWorkItem={
                    handleUpdateWorkItem
                  }
                  onAddWorkItem={
                    handleAddWorkItem
                  }
                  onDeleteWorkItem={
                    handleDeleteWorkItem
                  }
                  onReorderWorkItems={
                    handleReorderWorkItems
                  }
                />
              )}

              {activeTab ===
                'calendar' && (
                <ProjectCalendar
                  project={
                    project
                  }
                  workItems={
                    workItems
                  }
                  paymentTerms={
                    paymentTerms
                  }
                  materials={
                    materials
                  }
                  calendarEvents={
                    calendarEvents
                  }
                  userRole={
                    currentRole
                  }
                  permissions={
                    currentPermissions
                  }
                  onAddCalendarEvent={
                    handleAddCalendarEvent
                  }
                  onDeleteCalendarEvent={
                    handleDeleteCalendarEvent
                  }
                  onUpdateCalendarEvent={
                    handleUpdateCalendarEvent
                  }
                />
              )}

              {activeTab ===
                'scurve' && (
                <SCurveChart
                  workItems={
                    workItems
                  }
                  project={
                    project
                  }
                  onAddAuditLog={
                    addAuditLog
                  }
                />
              )}

              {activeTab ===
                'gantt' && (
                <GanttChart
                  workItems={
                    workItems
                  }
                  onUpdateWorkItem={
                    handleUpdateWorkItem
                  }
                />
              )}

              {activeTab ===
                'daily' && (
                <DailyMonitoring
                  dailyLogs={
                    dailyLogs
                  }
                  userRole={
                    currentRole
                  }
                  permissions={
                    currentPermissions
                  }
                  activeUserName={
                    userNameMap[
                      currentRole
                    ]
                  }
                  onAddDailyLog={
                    handleAddDailyLog
                  }
                />
              )}

              {activeTab ===
                'photos' && (
                <PhotoGallery
                  photos={
                    photos
                  }
                  userRole={
                    currentRole
                  }
                  permissions={
                    currentPermissions
                  }
                  activeUserName={
                    userNameMap[
                      currentRole
                    ]
                  }
                  onAddPhoto={
                    handleAddPhoto
                  }
                />
              )}

              {activeTab ===
                'termin' && (
                <TerminPayments
                  project={
                    project
                  }
                  paymentTerms={
                    paymentTerms
                  }
                  workItems={
                    workItems
                  }
                  userRole={
                    currentRole
                  }
                  permissions={
                    currentPermissions
                  }
                  onUpdateTermStatus={
                    handleUpdateTermStatus
                  }
                  onApplyProgress25={
                    handleApplyProgress25Percent
                  }
                />
              )}

              {activeTab ===
                'materials' && (
                <MaterialMonitoring
                  materials={
                    materials
                  }
                  workItems={
                    workItems
                  }
                  userRole={
                    currentRole
                  }
                  permissions={
                    currentPermissions
                  }
                  onAddMaterial={
                    handleAddMaterial
                  }
                  onUpdateMaterial={
                    handleUpdateMaterial
                  }
                  onAddAuditLog={
                    addAuditLog
                  }
                />
              )}

              {activeTab ===
                'workforce' && (
                <WorkforceMonitoring
                  workers={
                    workers
                  }
                  workItems={
                    workItems
                  }
                  allocations={
                    allocations
                  }
                  userRole={
                    currentRole
                  }
                  permissions={
                    currentPermissions
                  }
                  onAddWorker={
                    handleAddWorker
                  }
                  onAddAllocation={
                    handleAddAllocation
                  }
                  onUpdateAllocation={
                    handleUpdateAllocation
                  }
                  onDeleteAllocation={
                    handleDeleteAllocation
                  }
                />
              )}

              {activeTab ===
                'equipment' && (
                <EquipmentMonitoring
                  equipments={
                    equipments
                  }
                  userRole={
                    currentRole
                  }
                  permissions={
                    currentPermissions
                  }
                  onAddEquipment={
                    handleAddEquipment
                  }
                />
              )}

              {activeTab ===
                'documents' && (
                <DocumentManagement
                  documents={
                    documents
                  }
                  userRole={
                    currentRole
                  }
                  permissions={
                    currentPermissions
                  }
                  activeUserName={
                    userNameMap[
                      currentRole
                    ]
                  }
                  project={
                    project
                  }
                  onAddDocument={
                    handleAddDocument
                  }
                  onUpdateDocument={
                    handleUpdateDocument
                  }
                  onDeleteDocument={
                    handleDeleteDocument
                  }
                  onAddAuditLog={
                    addAuditLog
                  }
                  onSimulateMKDocument={
                    handleSimulateMKDocument
                  }
                  onSimulateOwnerDocument={
                    handleSimulateOwnerDocument
                  }
                />
              )}

              {activeTab ===
                'inspection' && (
                <FinalInspection
                  project={
                    project
                  }
                  workItems={
                    workItems
                  }
                  userRole={
                    currentRole
                  }
                  permissions={
                    currentPermissions
                  }
                  activeUserName={
                    userNameMap[
                      currentRole
                    ]
                  }
                  onUpdateProjectStatus={
                    handleUpdateProjectStatus
                  }
                  onAddAuditLog={
                    addAuditLog
                  }
                  onOpenContractorSettings={() =>
                    setIsContractorSettingsModalOpen(
                      true
                    )
                  }
                  onOpenQrModal={() =>
                    setIsQrModalOpen(
                      true
                    )
                  }
                />
              )}

              {activeTab ===
                'reports' && (
                <ReportCenter
                  project={
                    project
                  }
                  workItems={
                    workItems
                  }
                  paymentTerms={
                    paymentTerms
                  }
                  dailyLogs={
                    dailyLogs
                  }
                  materials={
                    materials
                  }
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* ========================================================
          SUPABASE MODAL
      ======================================================== */}

      <SupabaseModal
        isOpen={
          isSupabaseModalOpen
        }
        onClose={() =>
          setIsSupabaseModalOpen(
            false
          )
        }
        onPushToSupabase={
          handlePushToSupabase
        }
        onPullFromSupabase={
          handlePullFromSupabase
        }
        lastSyncedAt={
          lastSupabaseSync
        }
        documentsCount={
          documents.length
        }
        reportsCount={
          dailyLogs.length
        }
        issuesCount={
          0
        }
      />

      {/* ========================================================
          NOTIFICATION DRAWER
      ======================================================== */}

      <NotificationDrawer
        isOpen={
          isNotificationsOpen
        }
        onClose={() =>
          setIsNotificationsOpen(
            false
          )
        }
        notifications={
          notifications
        }
        onMarkAllRead={
          handleMarkAllNotificationsRead
        }
        onMarkItemRead={
          handleMarkNotificationItemRead
        }
        onNavigateToDocument={() => {
          setActiveTab(
            'documents'
          );

          setIsNotificationsOpen(
            false
          );
        }}
        onSimulateMKDocument={
          handleSimulateMKDocument
        }
        onSimulateOwnerDocument={
          handleSimulateOwnerDocument
        }
        darkMode={
          darkMode
        }
      />

      {/* ========================================================
          PROJECT SETTINGS
      ======================================================== */}

      <ProjectSettingsModal
        isOpen={
          isSettingsModalOpen
        }
        onClose={() =>
          setIsSettingsModalOpen(
            false
          )
        }
        project={
          project
        }
        onUpdateProject={
          setProject
        }
        currentRole={
          currentRole
        }
        userNameMap={
          userNameMap
        }
        onUpdateUserNameMap={
          setUserNameMap
        }
        onAddAuditLog={
          addAuditLog
        }
      />

      {/* ========================================================
          CONTRACTOR SETTINGS
      ======================================================== */}

      <ContractorSettingsModal
        isOpen={
          isContractorSettingsModalOpen
        }
        onClose={() =>
          setIsContractorSettingsModalOpen(
            false
          )
        }
        project={
          project
        }
        onUpdateProject={
          (updated) =>
            setProject(
              updated
            )
        }
        currentRole={
          currentRole
        }
        onAddAuditLog={
          addAuditLog
        }
        userNameMap={
          userNameMap
        }
        onUpdateUserNameMap={
          setUserNameMap
        }
        darkMode={
          darkMode
        }
      />

      {/* ========================================================
          ROLE MANAGEMENT
      ======================================================== */}

      <RoleManagementModal
        isOpen={
          isRoleModalOpen &&
          isOwner
        }
        onClose={() =>
          setIsRoleModalOpen(
            false
          )
        }
        currentRole={
          currentRole
        }
        onRoleChange={
          handleRoleChange
        }
        initialSubTab={
          roleModalTab
        }
        profiles={
          stakeholderProfiles
        }
        onUpdateProfiles={
          (
            newProfiles
          ) => {
            setStakeholderProfiles(
              newProfiles
            );

            setUserNameMap(
              (prev) => ({
                ...prev,
                Owner:
                  newProfiles
                    .Owner
                    ?.personName ||
                  prev.Owner,
                Konsultan:
                  newProfiles
                    .Konsultan
                    ?.personName ||
                  prev.Konsultan,
                Kontraktor:
                  newProfiles
                    .Kontraktor
                    ?.personName ||
                  prev.Kontraktor,
                Direktur:
                  newProfiles
                    .Owner
                    ?.personName ||
                  prev.Direktur,
                'Site Manager':
                  newProfiles
                    .Kontraktor
                    ?.personName ||
                  prev[
                    'Site Manager'
                  ],
                Viewer:
                  newProfiles
                    .Viewer
                    ?.personName ||
                  prev.Viewer,
              })
            );
          }
        }
        project={
          project
        }
        onUpdateProjectSignatories={(
          signatories
        ) => {
          setProject(
            (prev) => ({
              ...prev,
              ...signatories,
            })
          );
        }}
        onAddAuditLog={
          addAuditLog
        }
        rolePins={
          rolePins
        }
        onUpdateRolePins={
          setRolePins
        }
      />

      {/* ========================================================
          SYNC STATUS
      ======================================================== */}

      <SyncStatusModal
        isOpen={
          isSyncModalOpen
        }
        onClose={() =>
          setIsSyncModalOpen(
            false
          )
        }
        syncStatus={
          syncStatus
        }
        lastSyncCheckedAt={
          lastSyncCheckedAt
        }
        isChecking={
          isChecking
        }
        onCheckSync={
          checkStatus
        }
        onForceSync={() => {
          syncWithPrimaryState();
          setIsSyncModalOpen(
            false
          );
        }}
      />

      {/* ========================================================
          QR CODE
      ======================================================== */}

      <ProjectQRCodeModal
        isOpen={
          isQrModalOpen
        }
        onClose={() =>
          setIsQrModalOpen(
            false
          )
        }
        project={
          project
        }
      />
    </div>
  );
}
```
