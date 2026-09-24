import { addDays, differenceInDays, format, isValid, parseISO } from 'date-fns';
import {
  ProjectInfo,
  WorkItem,
  CalendarEvent,
  PaymentTerm,
  MaterialItem,
  WorkerAllocation,
  DailyLog,
} from '../types';

export interface StartDateSyncOptions {
  syncWorkItems: boolean;
  syncTargetEndDate: boolean;
  syncCalendarEvents: boolean;
  syncPaymentTerms: boolean;
  syncMaterials: boolean;
  syncAllocations: boolean;
  syncDailyLogs: boolean;
}

export const DEFAULT_SYNC_OPTIONS: StartDateSyncOptions = {
  syncWorkItems: true,
  syncTargetEndDate: true,
  syncCalendarEvents: true,
  syncPaymentTerms: true,
  syncMaterials: true,
  syncAllocations: true,
  syncDailyLogs: false,
};

/**
 * Safely shift a YYYY-MM-DD date string by a given number of days.
 */
export function safeShiftDate(dateStr: string | null | undefined, offsetDays: number): string {
  if (!dateStr || offsetDays === 0) return dateStr || '';
  try {
    const cleanStr = dateStr.trim().slice(0, 10);
    const parsed = parseISO(cleanStr);
    if (!isValid(parsed)) return dateStr;
    const shifted = addDays(parsed, offsetDays);
    return format(shifted, 'yyyy-MM-dd');
  } catch {
    return dateStr;
  }
}

/**
 * Compute the difference in calendar days between old and new start dates.
 */
export function computeDaysOffset(oldStartDateStr: string, newStartDateStr: string): number {
  try {
    const oldD = parseISO(oldStartDateStr.trim().slice(0, 10));
    const newD = parseISO(newStartDateStr.trim().slice(0, 10));
    if (!isValid(oldD) || !isValid(newD)) return 0;
    return differenceInDays(newD, oldD);
  } catch {
    return 0;
  }
}

export interface SyncScheduleParams {
  newStartDate: string;
  project: ProjectInfo;
  workItems: WorkItem[];
  calendarEvents: CalendarEvent[];
  paymentTerms: PaymentTerm[];
  materials: MaterialItem[];
  allocations: WorkerAllocation[];
  dailyLogs: DailyLog[];
  options?: Partial<StartDateSyncOptions>;
}

export interface SyncScheduleResult {
  offsetDays: number;
  updatedProject: ProjectInfo;
  updatedWorkItems: WorkItem[];
  updatedCalendarEvents: CalendarEvent[];
  updatedPaymentTerms: PaymentTerm[];
  updatedMaterials: MaterialItem[];
  updatedAllocations: WorkerAllocation[];
  updatedDailyLogs: DailyLog[];
  summary: {
    oldStartDate: string;
    newStartDate: string;
    oldTargetEndDate: string;
    newTargetEndDate: string;
    offsetDays: number;
    workItemsShifted: number;
    eventsShifted: number;
    paymentTermsShifted: number;
  };
}

/**
 * Synchronize all time schedule items, calendar events, payments, materials, and allocations
 * to follow the new project start date.
 */
export function syncAllProjectSchedules({
  newStartDate,
  project,
  workItems,
  calendarEvents,
  paymentTerms,
  materials,
  allocations,
  dailyLogs,
  options = {},
}: SyncScheduleParams): SyncScheduleResult {
  const opts: StartDateSyncOptions = { ...DEFAULT_SYNC_OPTIONS, ...options };
  const oldStartDate = project.startDate;
  const offsetDays = computeDaysOffset(oldStartDate, newStartDate);

  // 1. Updated Project Info
  const newTargetEndDate = opts.syncTargetEndDate
    ? safeShiftDate(project.targetEndDate, offsetDays)
    : project.targetEndDate;

  const updatedProject: ProjectInfo = {
    ...project,
    startDate: newStartDate,
    targetEndDate: newTargetEndDate,
  };

  // 2. Updated Work Items (preserve durationDays)
  const updatedWorkItems: WorkItem[] =
    opts.syncWorkItems && offsetDays !== 0
      ? workItems.map((wi) => {
          const shiftedStart = safeShiftDate(wi.startDate, offsetDays);
          const shiftedEnd = safeShiftDate(wi.endDate, offsetDays);
          return {
            ...wi,
            startDate: shiftedStart,
            endDate: shiftedEnd,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        })
      : workItems;

  // 3. Updated Calendar Events
  const updatedCalendarEvents: CalendarEvent[] =
    opts.syncCalendarEvents && offsetDays !== 0
      ? calendarEvents.map((ev) => ({
          ...ev,
          date: safeShiftDate(ev.date, offsetDays),
          endDate: ev.endDate ? safeShiftDate(ev.endDate, offsetDays) : undefined,
        }))
      : calendarEvents;

  // 4. Updated Payment Terms
  const updatedPaymentTerms: PaymentTerm[] =
    opts.syncPaymentTerms && offsetDays !== 0
      ? paymentTerms.map((pt) => ({
          ...pt,
          paymentDate: pt.paymentDate ? safeShiftDate(pt.paymentDate, offsetDays) : pt.paymentDate,
        }))
      : paymentTerms;

  // 5. Updated Materials
  const updatedMaterials: MaterialItem[] =
    opts.syncMaterials && offsetDays !== 0
      ? materials.map((m) => ({
          ...m,
          arrivalDate: m.arrivalDate ? safeShiftDate(m.arrivalDate, offsetDays) : m.arrivalDate,
          usageDate: m.usageDate ? safeShiftDate(m.usageDate, offsetDays) : m.usageDate,
        }))
      : materials;

  // 6. Updated Allocations
  const updatedAllocations: WorkerAllocation[] =
    opts.syncAllocations && offsetDays !== 0
      ? allocations.map((a) => ({
          ...a,
          assignedDate: safeShiftDate(a.assignedDate, offsetDays),
        }))
      : allocations;

  // 7. Updated Daily Logs (optional)
  const updatedDailyLogs: DailyLog[] =
    opts.syncDailyLogs && offsetDays !== 0
      ? dailyLogs.map((l) => ({
          ...l,
          date: safeShiftDate(l.date, offsetDays),
        }))
      : dailyLogs;

  return {
    offsetDays,
    updatedProject,
    updatedWorkItems,
    updatedCalendarEvents,
    updatedPaymentTerms,
    updatedMaterials,
    updatedAllocations,
    updatedDailyLogs,
    summary: {
      oldStartDate,
      newStartDate,
      oldTargetEndDate: project.targetEndDate,
      newTargetEndDate,
      offsetDays,
      workItemsShifted: opts.syncWorkItems ? workItems.length : 0,
      eventsShifted: opts.syncCalendarEvents ? calendarEvents.length : 0,
      paymentTermsShifted: opts.syncPaymentTerms ? paymentTerms.length : 0,
    },
  };
}
