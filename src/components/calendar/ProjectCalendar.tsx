import React, { useState, useMemo } from 'react';
import {
  CalendarEvent,
  CalendarEventType,
  CalendarEventStatus,
  WorkItem,
  PaymentTerm,
  MaterialItem,
  UserRole,
  ProjectInfo,
  RolePermissions,
} from '../../types';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  isValid,
  differenceInDays,
} from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CreditCard,
  Flag,
  Truck,
  Users,
  MapPin,
  X,
  FileSpreadsheet,
  Trash2,
  Edit3,
  Layers,
  ListFilter,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { formatIDR } from '../../utils/calculations';

interface ProjectCalendarProps {
  project: ProjectInfo;
  workItems: WorkItem[];
  paymentTerms: PaymentTerm[];
  materials: MaterialItem[];
  calendarEvents: CalendarEvent[];
  userRole: UserRole;
  permissions?: RolePermissions;
  onAddCalendarEvent: (e: Omit<CalendarEvent, 'id'>) => void;
  onDeleteCalendarEvent?: (id: string) => void;
  onUpdateCalendarEvent?: (e: CalendarEvent) => void;
}

export const ProjectCalendar: React.FC<ProjectCalendarProps> = ({
  project,
  workItems,
  paymentTerms,
  materials,
  calendarEvents,
  userRole,
  permissions,
  onAddCalendarEvent,
  onDeleteCalendarEvent,
  onUpdateCalendarEvent,
}) => {
  // Calendar Navigation Month State
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => {
    // Default to project active period (e.g. Sept 2026) or today
    const pStart = parseISO(project.startDate);
    return isValid(pStart) ? pStart : new Date();
  });

  // Selected Day State
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const pStart = parseISO(project.startDate);
    return isValid(pStart) ? pStart : new Date();
  });

  // View Mode: 'month' (Grid) | 'agenda' (Chronological List) | 'timeline' (Milestones & Deadlines)
  const [viewMode, setViewMode] = useState<'month' | 'agenda' | 'timeline'>('month');

  // Filters
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEventDetail, setSelectedEventDetail] = useState<CalendarEvent | null>(null);

  // New Event Form State
  const [newEvent, setNewEvent] = useState<Omit<CalendarEvent, 'id'>>({
    title: '',
    date: format(selectedDate, 'yyyy-MM-dd'),
    type: 'meeting',
    status: 'Mendatang',
    description: '',
    location: 'Direksi Keet / Area Lapangan',
    assignedRole: 'Site Manager',
    isCustom: true,
  });

  const canEdit =
    (permissions?.canEditSchedule ?? true) &&
    (userRole === 'Kontraktor' ||
      userRole === 'Konsultan' ||
      userRole === 'Owner' ||
      userRole === 'Admin' ||
      userRole === 'Site Manager' ||
      userRole === 'Direktur');

  // 1. Consolidated Events Engine
  const allConsolidatedEvents = useMemo(() => {
    const combined: CalendarEvent[] = [...calendarEvents];

    // Add WorkItem Milestones (Start & End dates)
    workItems.forEach((wi) => {
      if (wi.startDate) {
        combined.push({
          id: `MILE-START-${wi.id}`,
          title: `Mulai: Sektor ${wi.no} - ${wi.name}`,
          date: wi.startDate,
          type: 'milestone',
          status: wi.status === 'Selesai' ? 'Selesai' : wi.status === 'Terlambat' ? 'Kritis' : 'Mendatang',
          description: `Target dimulainya pekerjaan sektor ${wi.name} (${wi.bobotPercent.toFixed(2)}% Bobot).`,
          location: `Area Sektor ${wi.no}`,
          assignedRole: 'Site Manager & Mandor',
          isCustom: false,
        });
      }
      if (wi.endDate) {
        combined.push({
          id: `MILE-END-${wi.id}`,
          title: `Target Selesai: Sektor ${wi.no} - ${wi.name}`,
          date: wi.endDate,
          type: 'milestone',
          status: wi.status === 'Selesai' ? 'Selesai' : wi.status === 'Terlambat' ? 'Kritis' : 'Mendatang',
          description: `Target penyelesaian sektor ${wi.name}. Progress saat ini: ${wi.realizedProgressPercent}%`,
          location: `Area Sektor ${wi.no}`,
          assignedRole: 'Site Manager',
          isCustom: false,
        });
      }
    });

    // Add Payment Term Deadlines & Approval Schedule
    paymentTerms.forEach((term) => {
      // Estimate date based on project timeline phases if not explicit
      let termDate = '2026-09-15';
      if (term.termNumber === 1) termDate = '2026-09-15';
      else if (term.termNumber === 2) termDate = '2026-10-25';
      else if (term.termNumber === 3) termDate = '2026-12-10';
      else if (term.termNumber === 4) termDate = '2027-02-28';
      else if (term.termNumber === 5) termDate = '2027-05-30';

      combined.push({
        id: `PAY-TERM-${term.termNumber}`,
        title: `Target Pembayaran: ${term.title}`,
        date: term.paymentDate || termDate,
        type: 'payment',
        status: term.status === 'Dibayar' ? 'Selesai' : term.status === 'Menunggu Approval' ? 'Kritis' : 'Mendatang',
        description: `Target pencairan Termin ${term.termNumber} (${term.termValuePercent}%) senilai ${formatIDR(term.netPayableValue)} pada bobot ${term.targetProgressPercent}%.`,
        location: 'Kantor Keuangan FGI & Direksi',
        assignedRole: 'Admin & Direktur',
        isCustom: false,
      });
    });

    // Add Material Arrival Deliveries
    materials.forEach((mat) => {
      if (mat.arrivalDate) {
        combined.push({
          id: `MAT-ARR-${mat.id}`,
          title: `Pengiriman Material: ${mat.name}`,
          date: mat.arrivalDate,
          type: 'material',
          status: mat.stockRemaining > 0 ? 'Selesai' : 'Mendatang',
          description: `Jadwal pasokan ${mat.name} (${mat.volumeTotal} ${mat.unit}) dari ${mat.supplier}.`,
          location: 'Gudang Material Utama',
          assignedRole: 'Tim Logistik',
          isCustom: false,
        });
      }
    });

    return combined;
  }, [calendarEvents, workItems, paymentTerms, materials]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return allConsolidatedEvents.filter((e) => {
      const matchesType = selectedTypeFilter === 'ALL' || e.type === selectedTypeFilter;
      const matchesStatus = selectedStatusFilter === 'ALL' || e.status === selectedStatusFilter;
      const matchesQuery =
        searchQuery === '' ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.location && e.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.assignedRole && e.assignedRole.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesType && matchesStatus && matchesQuery;
    });
  }, [allConsolidatedEvents, selectedTypeFilter, selectedStatusFilter, searchQuery]);

  // Calendar Grid Dates Generator
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonthDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonthDate]);

  // Month Statistics
  const monthStats = useMemo(() => {
    const currentMonthEvents = filteredEvents.filter((e) => {
      const d = parseISO(e.date);
      return isValid(d) && isSameMonth(d, currentMonthDate);
    });

    const criticalCount = currentMonthEvents.filter((e) => e.status === 'Kritis').length;
    const paymentCount = currentMonthEvents.filter((e) => e.type === 'payment').length;
    const inspectionCount = currentMonthEvents.filter((e) => e.type === 'inspection').length;
    const milestoneCount = currentMonthEvents.filter((e) => e.type === 'milestone').length;

    return {
      total: currentMonthEvents.length,
      criticalCount,
      paymentCount,
      inspectionCount,
      milestoneCount,
    };
  }, [filteredEvents, currentMonthDate]);

  // Day Events Resolver
  const getEventsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return filteredEvents.filter((e) => e.date === dayStr);
  };

  const selectedDayEvents = getEventsForDay(selectedDate);

  // Handlers
  const handlePrevMonth = () => setCurrentMonthDate((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonthDate((prev) => addMonths(prev, 1));
  const handleTodayClick = () => {
    const today = new Date();
    setCurrentMonthDate(today);
    setSelectedDate(today);
  };

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
    setNewEvent((prev) => ({
      ...prev,
      date: format(day, 'yyyy-MM-dd'),
    }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title) return;
    onAddCalendarEvent(newEvent);
    setIsAddModalOpen(false);
    setNewEvent({
      title: '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      type: 'meeting',
      status: 'Mendatang',
      description: '',
      location: 'Direksi Keet / Area Lapangan',
      assignedRole: 'Site Manager',
      isCustom: true,
    });
  };

  // Type styling badge helper
  const getTypeBadge = (type: CalendarEventType) => {
    switch (type) {
      case 'milestone':
        return { label: 'Milestone', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: Flag };
      case 'payment':
        return { label: 'Termin Pembayaran', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CreditCard };
      case 'inspection':
        return { label: 'Inspeksi & QC', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: ShieldCheck };
      case 'material':
        return { label: 'Pengiriman Material', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Truck };
      case 'meeting':
        return { label: 'Rapat & Site Event', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', icon: Users };
    }
  };

  const getStatusBadge = (status: CalendarEventStatus) => {
    switch (status) {
      case 'Kritis':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'Mendatang':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Selesai':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Perlu Perhatian':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Title Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Kalender Proyek Interaktif
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-extrabold text-[10px] border border-orange-500/20">
                  REAL-TIME CALENDAR
                </span>
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Jadwal milestone kritis sektor, batas waktu termin pembayaran, inspeksi mutu BAST, serta rapat lapangan
          </p>
        </div>

        {/* View Mode Switcher & Add Event Action */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end w-full md:w-auto">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'month'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" /> Matriks Bulan
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'agenda'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" /> Agenda Detail
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Flag className="w-3.5 h-3.5" /> Milestone &amp; Termin
            </button>
          </div>

          {canEdit && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/20 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Tambah Jadwal Event
            </button>
          )}
        </div>
      </div>

      {/* KPI Stat Widgets Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Event Bulan Ini</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <CalendarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">{monthStats.total}</span>
            <span className="text-xs text-slate-400 font-semibold">Agendakan Terjadwal</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Periode {format(currentMonthDate, 'MMMM yyyy', { locale: localeID })}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Jadwal Kritis &amp; Deadline</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${monthStats.criticalCount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {monthStats.criticalCount}
            </span>
            <span className="text-xs text-slate-400 font-semibold">Perlu Perhatian Khusus</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Termin atau milestone batas kritis</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Jadwal Inspeksi Mutu &amp; BAST</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-500">{monthStats.inspectionCount}</span>
            <span className="text-xs text-slate-400 font-semibold">Agenda Inspeksi</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Pemeriksaan lapangan &amp; audit konsultan</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pembayaran Termin</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-500">{monthStats.paymentCount}</span>
            <span className="text-xs text-slate-400 font-semibold">Target Pencairan</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Tagihan termin klaim kontraktor</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-2">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari event, lokasi, atau role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          {/* Event Category Filter */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="ALL">Semua Kategori Event</option>
              <option value="milestone">Milestone Sektor</option>
              <option value="payment">Termin Pembayaran</option>
              <option value="inspection">Inspeksi &amp; Quality Check</option>
              <option value="material">Pengiriman Material</option>
              <option value="meeting">Rapat &amp; K3 Lapangan</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-auto">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
            >
              <option value="ALL">Semua Priority &amp; Status</option>
              <option value="Kritis">Kritis / Deadline</option>
              <option value="Mendatang">Mendatang</option>
              <option value="Perlu Perhatian">Perlu Perhatian</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
        </div>

        {/* Today Navigation */}
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={handleTodayClick}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1.5"
          >
            Hari Ini ({format(new Date(), 'dd MMM')})
          </button>
        </div>
      </div>

      {/* ==================== VIEW MODE 1: MONTHLY INTERACTIVE GRID ==================== */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main 7x5 Calendar Grid Area (2 Columns on Large Screens) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-5 space-y-4">
            {/* Calendar Controls Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white capitalize">
                  {format(currentMonthDate, 'MMMM yyyy', { locale: localeID })}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 font-bold border border-orange-500/20">
                  {filteredEvents.length} Event
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-700 dark:text-slate-300 transition-colors"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-700 dark:text-slate-300 transition-colors"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 text-center font-bold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <div className="py-2 text-red-500">Min</div>
              <div className="py-2">Sen</div>
              <div className="py-2">Sel</div>
              <div className="py-2">Rab</div>
              <div className="py-2">Kam</div>
              <div className="py-2">Jum</div>
              <div className="py-2 text-amber-500">Sab</div>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonthDate);
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentToday = isToday(day);

                return (
                  <button
                    key={idx}
                    onClick={() => handleDayClick(day)}
                    className={`min-h-[90px] p-2 rounded-xl border text-left transition-all flex flex-col justify-between relative group cursor-pointer ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/30'
                        : isCurrentToday
                        ? 'border-blue-500 bg-blue-500/5'
                        : isCurrentMonth
                        ? 'border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        : 'border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-950/40 text-slate-400 opacity-50'
                    }`}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs font-black px-1.5 py-0.5 rounded-md ${
                          isCurrentToday
                            ? 'bg-blue-500 text-white'
                            : isSelected
                            ? 'bg-orange-500 text-white'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                          {dayEvents.length}
                        </span>
                      )}
                    </div>

                    {/* Day Event Chips (Preview up to 2 items) */}
                    <div className="space-y-1 my-1 w-full overflow-hidden">
                      {dayEvents.slice(0, 2).map((evt) => {
                        const badgeInfo = getTypeBadge(evt.type);
                        return (
                          <div
                            key={evt.id}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold truncate border flex items-center gap-1 ${badgeInfo.color}`}
                            title={evt.title}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-current" />
                            <span className="truncate">{evt.title}</span>
                          </div>
                        );
                      })}

                      {dayEvents.length > 2 && (
                        <div className="text-[9px] font-bold text-slate-400 text-right pr-1">
                          +{dayEvents.length - 2} event lagi
                        </div>
                      )}
                    </div>

                    {/* Today indicator label */}
                    {isCurrentToday && (
                      <span className="text-[8px] font-black uppercase tracking-wider text-blue-500 block text-right">
                        Hari Ini
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Agenda Sidebar (1 Column on Large Screens) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-5 space-y-4">
            {/* Header Selected Date */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Detail Jadwal Hari</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-orange-500" />
                  {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: localeID })}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-black">
                {selectedDayEvents.length} Event
              </span>
            </div>

            {/* List of Events for Selected Date */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {selectedDayEvents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <Clock className="w-8 h-8 mx-auto text-slate-500 opacity-40" />
                  <p className="text-xs font-semibold">Tidak ada event terjadwal pada tanggal ini.</p>
                  {canEdit && (
                    <button
                      onClick={() => {
                        setNewEvent((prev) => ({ ...prev, date: format(selectedDate, 'yyyy-MM-dd') }));
                        setIsAddModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-orange-500/10 text-orange-500 text-xs font-bold hover:bg-orange-500 hover:text-white transition-all inline-block mt-2"
                    >
                      + Tambah Event di Tanggal Ini
                    </button>
                  )}
                </div>
              ) : (
                selectedDayEvents.map((evt) => {
                  const badgeInfo = getTypeBadge(evt.type);
                  const Icon = badgeInfo.icon;

                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEventDetail(evt)}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-orange-500 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-extrabold text-[9px] uppercase border flex items-center gap-1 ${badgeInfo.color}`}>
                          <Icon className="w-3 h-3" /> {badgeInfo.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${getStatusBadge(evt.status)}`}>
                          {evt.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{evt.title}</h4>

                      {evt.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{evt.description}</p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" /> {evt.location || 'Lokasi Proyek'}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-300">
                          <Users className="w-3 h-3 text-orange-400" /> {evt.assignedRole || 'Site Team'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== VIEW MODE 2: CHRONOLOGICAL AGENDA LIST ==================== */}
      {viewMode === 'agenda' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Daftar Agenda Lengkap Kalender Proyek</h3>
              <p className="text-xs text-slate-400">Seluruh jadwal yang disaring secara kronologis berdasar waktu pelaksanaan</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 font-black text-xs">
              {filteredEvents.length} Agenda Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-900 text-white border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Tanggal Event</th>
                  <th className="py-3 px-4">Nama Event &amp; Deskripsi</th>
                  <th className="py-3 px-4">Kategori Event</th>
                  <th className="py-3 px-4">Lokasi / Penanggung Jawab</th>
                  <th className="py-3 px-4 text-center">Status / Priority</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                      Belum ada agenda event yang memenuhi kriteria pencarian/filter.
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((evt) => {
                    const badgeInfo = getTypeBadge(evt.type);
                    const Icon = badgeInfo.icon;
                    const eventDate = parseISO(evt.date);
                    const daysDiff = isValid(eventDate) ? differenceInDays(eventDate, new Date()) : 0;

                    return (
                      <tr key={evt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Date Column */}
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-center shrink-0 min-w-[45px]">
                              <span className="text-[10px] uppercase block text-orange-500">
                                {isValid(eventDate) ? format(eventDate, 'MMM') : ''}
                              </span>
                              <span className="text-sm leading-tight block">
                                {isValid(eventDate) ? format(eventDate, 'dd') : ''}
                              </span>
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                                {isValid(eventDate) ? format(eventDate, 'yyyy') : evt.date}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {daysDiff === 0
                                  ? 'Hari Ini'
                                  : daysDiff > 0
                                  ? `${daysDiff} hari lagi`
                                  : `Lewat ${Math.abs(daysDiff)} hari`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Event Title & Description */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {evt.title}
                          </h4>
                          {evt.description && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{evt.description}</p>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-lg font-extrabold text-[10px] uppercase border inline-flex items-center gap-1.5 ${badgeInfo.color}`}
                          >
                            <Icon className="w-3.5 h-3.5" /> {badgeInfo.label}
                          </span>
                        </td>

                        {/* Location & PIC */}
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" /> {evt.location || 'Lapangan'}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3 text-orange-400" /> PIC: {evt.assignedRole || 'Site Team'}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getStatusBadge(evt.status)}`}>
                            {evt.status}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedEventDetail(evt)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-orange-500 hover:text-white text-slate-400 text-[10px] font-bold transition-colors"
                            >
                              Detail
                            </button>
                            {evt.isCustom && onDeleteCalendarEvent && canEdit && (
                              <button
                                onClick={() => onDeleteCalendarEvent(evt.id)}
                                className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 transition-colors"
                                title="Hapus Custom Event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== VIEW MODE 3: MILESTONES & PAYMENT TIMELINE ==================== */}
      {viewMode === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timeline Panel 1: Critical Sector Milestones */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Milestone Sektor Utama (Time Schedule)</h3>
                  <p className="text-[11px] text-slate-400">Tahapan penting dimulainya &amp; penyelesaian sektor fisik</p>
                </div>
              </div>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {allConsolidatedEvents
                .filter((e) => e.type === 'milestone')
                .slice(0, 8)
                .map((m) => (
                  <div key={m.id} className="relative group">
                    <div className="absolute -left-[27px] top-0 w-4 h-4 rounded-full bg-purple-500 border-4 border-white dark:border-slate-900" />
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-purple-500">{m.date}</span>
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold border ${getStatusBadge(m.status)}`}>
                          {m.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{m.title}</h4>
                      <p className="text-[11px] text-slate-400">{m.description}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Timeline Panel 2: Payment Deadlines */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Batas Waktu Pembayaran Termin</h3>
                  <p className="text-[11px] text-slate-400">Skedul klaim termin &amp; verifikasi bobot pencairan</p>
                </div>
              </div>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {allConsolidatedEvents
                .filter((e) => e.type === 'payment')
                .map((p) => (
                  <div key={p.id} className="relative group">
                    <div className="absolute -left-[27px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-slate-900" />
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-500">{p.date}</span>
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-extrabold border ${getStatusBadge(p.status)}`}>
                          {p.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white">{p.title}</h4>
                      <p className="text-[11px] text-slate-400">{p.description}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: TAMBAH CUSTOM EVENT PROYEK ==================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative my-8 text-slate-900 dark:text-white">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black">Tambah Agenda Event Proyek</h3>
                <p className="text-xs text-slate-400">Jadwalkan rapat, inspeksi K3, atau pengujian material baru</p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Judul Agenda / Event</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Inspeksi K3 &amp; Uji Tarik Rebar Sektor 3"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    required
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Kategori Event</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as CalendarEventType })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none font-semibold"
                  >
                    <option value="inspection">Inspeksi &amp; Quality Check</option>
                    <option value="milestone">Milestone Proyek</option>
                    <option value="payment">Termin Pembayaran</option>
                    <option value="material">Pengiriman Material</option>
                    <option value="meeting">Rapat &amp; Event Lapangan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Priority / Status</label>
                  <select
                    value={newEvent.status}
                    onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value as CalendarEventStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none font-semibold"
                  >
                    <option value="Mendatang">Mendatang</option>
                    <option value="Kritis">Kritis / Urgent</option>
                    <option value="Perlu Perhatian">Perlu Perhatian</option>
                    <option value="Selesai">Selesai</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Penanggung Jawab (PIC)</label>
                  <input
                    type="text"
                    placeholder="Site Manager / Konsultan MK"
                    value={newEvent.assignedRole}
                    onChange={(e) => setNewEvent({ ...newEvent, assignedRole: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Lokasi / Ruangan</label>
                <input
                  type="text"
                  placeholder="Direksi Keet / Sektor 3 / Lab"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">Deskripsi Agenda &amp; Catatan</label>
                <textarea
                  rows={3}
                  placeholder="Penjelasan detail teknis agenda atau dokumen yang perlu disiapkan..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DETAIL EVENT OVERVIEW ==================== */}
      {selectedEventDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-slate-900 dark:text-white space-y-4">
            <button
              onClick={() => setSelectedEventDetail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${
                  getTypeBadge(selectedEventDetail.type).color
                }`}
              >
                {getTypeBadge(selectedEventDetail.type).label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadge(selectedEventDetail.status)}`}>
                {selectedEventDetail.status}
              </span>
            </div>

            <div>
              <h3 className="text-base font-black">{selectedEventDetail.title}</h3>
              <p className="text-xs text-orange-500 font-bold mt-1 flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5" /> Tanggal: {selectedEventDetail.date}
              </p>
            </div>

            {selectedEventDetail.description && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                {selectedEventDetail.description}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block">Lokasi:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEventDetail.location || 'Site Lapangan'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                <span className="text-[10px] font-bold text-slate-400 block">PIC / Pengawas:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEventDetail.assignedRole || 'Site Team'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedEventDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
