/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  ProjectInfo,
  WorkItem,
  PaymentTerm,
  DailyLog,
  PhotoItem,
  MaterialItem,
  WorkerItem,
  EquipmentItem,
  AuditLog,
  NotificationItem,
  UserRole,
} from './types';
import {
  INITIAL_PROJECT_INFO,
  INITIAL_WORK_ITEMS,
  INITIAL_PAYMENT_TERMS,
  INITIAL_PHOTOS,
  INITIAL_DAILY_LOGS,
  INITIAL_MATERIALS,
  INITIAL_WORKERS,
  INITIAL_EQUIPMENT,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from './data/initialData';
import { Header } from './components/layout/Header';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { ExecutiveDashboard } from './components/dashboard/ExecutiveDashboard';
import { TimeScheduleTable } from './components/schedule/TimeScheduleTable';
import { SCurveChart } from './components/schedule/SCurveChart';
import { GanttChart } from './components/schedule/GanttChart';
import { DailyMonitoring } from './components/monitoring/DailyMonitoring';
import { PhotoGallery } from './components/gallery/PhotoGallery';
import { TerminPayments } from './components/finance/TerminPayments';
import { MaterialMonitoring } from './components/inventory/MaterialMonitoring';
import { WorkforceMonitoring } from './components/workforce/WorkforceMonitoring';
import { EquipmentMonitoring } from './components/equipment/EquipmentMonitoring';
import { FinalInspection } from './components/inspection/FinalInspection';
import { ReportCenter } from './components/reports/ReportCenter';
import { SupabaseModal } from './components/common/SupabaseModal';
import { NotificationDrawer } from './components/common/NotificationDrawer';
import { generatePDFReport } from './utils/exportEngine';
import { calculatePhysicalProgress, calculateTargetProgress, calculateDeviation } from './utils/calculations';

export default function App() {
  // Navigation & Role State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [currentRole, setCurrentRole] = useState<UserRole>('Direktur');
  const [darkMode, setDarkMode] = useState(true);

  // Modals & Drawers
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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
    localStorage.setItem('FORESYNDO_V3_EQUIPMENT', JSON.stringify(equipments));
  }, [equipments]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_AUDIT_LOGS', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('FORESYNDO_V3_NOTIFICATIONS', JSON.stringify(notifications));
  }, [notifications]);

  // Handle Dark Mode toggle on <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Helper to append audit logs
  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      userName: currentRole === 'Direktur' ? 'H. Bambang S.' : currentRole === 'Site Manager' ? 'Ir. Agus Pratama' : 'Dedi Kurniawan',
      userRole: currentRole,
      action,
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
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

  // Material Handler
  const handleAddMaterial = (matData: Omit<MaterialItem, 'id'>) => {
    const newMat: MaterialItem = {
      ...matData,
      id: `MAT-${Date.now()}`,
    };
    setMaterials((prev) => [...prev, newMat]);
    addAuditLog('Tambah Stok Material', `Menambahkan material baru: ${matData.name} dari ${matData.supplier}`);
  };

  // Worker Handler
  const handleAddWorker = (workerData: Omit<WorkerItem, 'id'>) => {
    const newWrk: WorkerItem = {
      ...workerData,
      id: `WRK-${Date.now()}`,
    };
    setWorkers((prev) => [...prev, newWrk]);
    addAuditLog('Tambah Tenaga Kerja', `Menambahkan pekerja baru: ${workerData.name} (${workerData.role})`);
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

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleResetProject = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset data proyek ke status BELUM MULAI (Progress 0%)?')) {
      setProject(INITIAL_PROJECT_INFO);
      setWorkItems(INITIAL_WORK_ITEMS);
      setPaymentTerms(INITIAL_PAYMENT_TERMS);
      setDailyLogs(INITIAL_DAILY_LOGS);
      setPhotos(INITIAL_PHOTOS);
      setMaterials(INITIAL_MATERIALS);
      setWorkers(INITIAL_WORKERS);
      setEquipments(INITIAL_EQUIPMENT);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      setNotifications(INITIAL_NOTIFICATIONS);
      localStorage.clear();
    }
  };

  const physicalProgress = calculatePhysicalProgress(workItems);
  const targetProgress = calculateTargetProgress(workItems);
  const deviation = calculateDeviation(physicalProgress, targetProgress);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      {/* Top Fixed Header Bar */}
      <Header
        project={project}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onQuickExport={() => generatePDFReport('Progress', project, workItems, paymentTerms, dailyLogs, materials)}
        onResetProject={handleResetProject}
      />

      {/* Main Body Layout with Sidebar + Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          hasDeviasiWarning={deviation < -5}
        />

        {/* Dynamic Tab Content View */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <ExecutiveDashboard
              project={project}
              workItems={workItems}
              paymentTerms={paymentTerms}
              auditLogs={auditLogs}
              notifications={notifications}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'schedule' && (
            <TimeScheduleTable
              workItems={workItems}
              userRole={currentRole}
              onUpdateWorkItem={handleUpdateWorkItem}
              onAddWorkItem={handleAddWorkItem}
              onDeleteWorkItem={handleDeleteWorkItem}
              onReorderWorkItems={handleReorderWorkItems}
            />
          )}

          {activeTab === 'scurve' && <SCurveChart workItems={workItems} />}

          {activeTab === 'gantt' && (
            <GanttChart workItems={workItems} onUpdateWorkItem={handleUpdateWorkItem} />
          )}

          {activeTab === 'daily' && (
            <DailyMonitoring
              dailyLogs={dailyLogs}
              userRole={currentRole}
              onAddDailyLog={handleAddDailyLog}
            />
          )}

          {activeTab === 'photos' && (
            <PhotoGallery photos={photos} userRole={currentRole} onAddPhoto={handleAddPhoto} />
          )}

          {activeTab === 'termin' && (
            <TerminPayments
              project={project}
              paymentTerms={paymentTerms}
              workItems={workItems}
              userRole={currentRole}
              onUpdateTermStatus={handleUpdateTermStatus}
            />
          )}

          {activeTab === 'materials' && (
            <MaterialMonitoring
              materials={materials}
              userRole={currentRole}
              onAddMaterial={handleAddMaterial}
              onUpdateMaterial={() => {}}
            />
          )}

          {activeTab === 'workforce' && (
            <WorkforceMonitoring workers={workers} userRole={currentRole} onAddWorker={handleAddWorker} />
          )}

          {activeTab === 'equipment' && (
            <EquipmentMonitoring equipments={equipments} userRole={currentRole} onAddEquipment={handleAddEquipment} />
          )}

          {activeTab === 'inspection' && (
            <FinalInspection
              project={project}
              workItems={workItems}
              userRole={currentRole}
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
        </main>
      </div>

      {/* Modals & Drawers */}
      <SupabaseModal isOpen={isSupabaseModalOpen} onClose={() => setIsSupabaseModalOpen(false)} />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={handleMarkAllNotificationsRead}
      />
    </div>
  );
}
