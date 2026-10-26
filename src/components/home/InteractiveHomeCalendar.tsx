import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Sparkles,
  Users,
  User as UserIcon,
  X,
  Plus,
  Share2,
  Download,
  ExternalLink,
  Layers,
  ListOrdered,
  Sun,
  Flame,
  CheckCircle,
  Tag,
  Eye,
  Info,
} from 'lucide-react';
import { Event, EventType, WeeklyProgram, WeeklyProgramDay, User } from '../../types';
import { formatDateDouala } from '../../utils/formatters';
import { apiClient } from '../../services/apiClient';

interface InteractiveHomeCalendarProps {
  events: Event[];
  weeklyPrograms: WeeklyProgram[];
  currentUser?: User | null;
  onRefresh?: () => void;
  onOpenWeeklyPrograms?: () => void;
}

type ViewMode = 'month' | 'week' | 'agenda';
type SourceFilter = 'all' | 'events' | 'programs';

interface UnifiedCalendarItem {
  id: string;
  sourceType: 'EVENT' | 'PROGRAM';
  title: string;
  category: string;
  dateStr?: string; // YYYY-MM-DD
  dayOfWeek?: string; // French day name
  timeStr: string;
  location: string;
  description: string;
  leader?: string;
  targetAudience?: string;
  bannerUrl?: string;
  maxParticipants?: number;
  iconName?: string;
  colorTheme?: string;
  rawEvent?: Event;
  rawProgram?: WeeklyProgram;
}

const FRENCH_DAYS: WeeklyProgramDay[] = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];

const FRENCH_MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

// Helper to convert JS getDay() (0=Dim, 1=Lun, ...) to French day name
function getFrenchDayName(date: Date): WeeklyProgramDay {
  const dayIndex = date.getDay(); // 0 is Dimanche
  const map: Record<number, WeeklyProgramDay> = {
    0: 'Dimanche',
    1: 'Lundi',
    2: 'Mardi',
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi',
  };
  return map[dayIndex] || 'Dimanche';
}

function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())}`;
}

export const InteractiveHomeCalendar: React.FC<InteractiveHomeCalendarProps> = ({
  events,
  weeklyPrograms,
  currentUser,
  onRefresh,
  onOpenWeeklyPrograms,
}) => {
  // Current viewing date anchor (defaults to current date)
  const [viewDate, setViewDate] = useState<Date>(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('TOUS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [activeItem, setActiveItem] = useState<UnifiedCalendarItem | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR';

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Month navigation
  const handlePrevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Week navigation
  const handlePrevWeek = () => {
    setViewDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextWeek = () => {
    setViewDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleResetToToday = () => {
    const today = new Date();
    setViewDate(today);
    setSelectedDate(today);
  };

  // Convert all items to unified items
  const unifiedEvents: UnifiedCalendarItem[] = useMemo(() => {
    return (events || [])
      .filter((e) => e && e.status !== 'ARCHIVÉ' && e.status !== 'ANNULÉ')
      .map((e) => {
        const d = e?.startDate ? new Date(e.startDate) : new Date();
        const dayName = !isNaN(d.getTime()) ? getFrenchDayName(d) : 'Dimanche';
        const dateStr = !isNaN(d.getTime()) ? toDateKey(d) : '';
        const timeStr = !isNaN(d.getTime())
          ? `${padZero(d.getHours())}h${padZero(d.getMinutes())}`
          : 'Heure variable';

        return {
          id: e?.id || `evt-${Math.random()}`,
          sourceType: 'EVENT',
          title: e?.title || 'Événement',
          category: e?.type || 'CULTE',
          dateStr,
          dayOfWeek: dayName,
          timeStr,
          location: e?.location || 'Grand Temple Akon, Sangmelima',
          description: e?.description,
          bannerUrl: e?.bannerUrl,
          maxParticipants: e?.maxParticipants,
          rawEvent: e,
        };
      });
  }, [events]);

  const unifiedPrograms: UnifiedCalendarItem[] = useMemo(() => {
    return (weeklyPrograms || [])
      .filter((p) => p && p.isActive)
      .map((p) => ({
        id: p?.id || `prog-${Math.random()}`,
        sourceType: 'PROGRAM',
        title: p?.title || 'Programme',
        category: p?.category || 'CULTE',
        dayOfWeek: p?.dayOfWeek || 'Dimanche',
        timeStr: p?.time || '09h00',
        location: p?.location || 'Temple',
        description: p?.description,
        leader: p?.leaderOrMinister,
        targetAudience: p?.targetAudience,
        iconName: p?.iconName,
        colorTheme: p?.colorTheme,
        rawProgram: p,
      }));
  }, [weeklyPrograms]);

  // Combined categories for pill filters
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    unifiedEvents.forEach((e) => set.add(e.category.toUpperCase()));
    unifiedPrograms.forEach((p) => set.add(p.category.toUpperCase()));
    return ['TOUS', ...Array.from(set)];
  }, [unifiedEvents, unifiedPrograms]);

  // Helper to test if item matches active category and search
  const matchesFilter = (item: UnifiedCalendarItem): boolean => {
    if (sourceFilter === 'events' && item.sourceType !== 'EVENT') return false;
    if (sourceFilter === 'programs' && item.sourceType !== 'PROGRAM') return false;

    if (selectedCategory !== 'TOUS') {
      if (item.category.toUpperCase() !== selectedCategory) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchLoc = (item.location || '').toLowerCase().includes(q);
      const matchLeader = (item.leader || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc && !matchLeader) return false;
    }

    return true;
  };

  // Month grid computation
  const monthGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // In JS, Sunday=0, Monday=1, ... Saturday=6
    // We want Monday=0, Tuesday=1 ... Sunday=6
    const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = lastDayOfMonth.getDate();

    const cells: {
      date: Date;
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      eventsForDay: UnifiedCalendarItem[];
      programsForDay: UnifiedCalendarItem[];
    }[] = [];

    const todayStr = toDateKey(new Date());
    const selectedDateStr = toDateKey(selectedDate);

    // Trailing days from prev month
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDate - i;
      const d = new Date(year, month - 1, dayNum);
      const key = toDateKey(d);
      const dayName = getFrenchDayName(d);

      const evts = unifiedEvents.filter((e) => e.dateStr === key && matchesFilter(e));
      const progs = unifiedPrograms.filter((p) => p.dayOfWeek === dayName && matchesFilter(p));

      cells.push({
        date: d,
        dateKey: key,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: key === todayStr,
        isSelected: key === selectedDateStr,
        eventsForDay: evts,
        programsForDay: progs,
      });
    }

    // Days of current month
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      const key = toDateKey(d);
      const dayName = getFrenchDayName(d);

      const evts = unifiedEvents.filter((e) => e.dateStr === key && matchesFilter(e));
      const progs = unifiedPrograms.filter((p) => p.dayOfWeek === dayName && matchesFilter(p));

      cells.push({
        date: d,
        dateKey: key,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: key === todayStr,
        isSelected: key === selectedDateStr,
        eventsForDay: evts,
        programsForDay: progs,
      });
    }

    // Leading days of next month to complete row of 7 (up to 35 or 42 cells)
    const totalCellsSoFar = cells.length;
    const remainder = (7 - (totalCellsSoFar % 7)) % 7;
    for (let i = 1; i <= remainder; i++) {
      const d = new Date(year, month + 1, i);
      const key = toDateKey(d);
      const dayName = getFrenchDayName(d);

      const evts = unifiedEvents.filter((e) => e.dateStr === key && matchesFilter(e));
      const progs = unifiedPrograms.filter((p) => p.dayOfWeek === dayName && matchesFilter(p));

      cells.push({
        date: d,
        dateKey: key,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: key === todayStr,
        isSelected: key === selectedDateStr,
        eventsForDay: evts,
        programsForDay: progs,
      });
    }

    return cells;
  }, [viewDate, selectedDate, unifiedEvents, unifiedPrograms, sourceFilter, selectedCategory, searchQuery]);

  // Week days computation (7 days: Monday to Sunday of viewDate)
  const weekDays = useMemo(() => {
    const d = new Date(viewDate);
    const dayOfWeek = (d.getDay() + 6) % 7; // 0=Monday, 6=Sunday
    d.setDate(d.getDate() - dayOfWeek); // set to Monday

    const todayStr = toDateKey(new Date());

    const result = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(d);
      current.setDate(d.getDate() + i);
      const key = toDateKey(current);
      const dayName = getFrenchDayName(current);

      const evts = unifiedEvents.filter((e) => e.dateStr === key && matchesFilter(e));
      const progs = unifiedPrograms.filter((p) => p.dayOfWeek === dayName && matchesFilter(p));

      result.push({
        date: current,
        dateKey: key,
        dayName,
        isToday: key === todayStr,
        events: evts,
        programs: progs,
      });
    }
    return result;
  }, [viewDate, unifiedEvents, unifiedPrograms, sourceFilter, selectedCategory, searchQuery]);

  // Selected date detailed schedule items
  const selectedDateSchedule = useMemo(() => {
    const key = toDateKey(selectedDate);
    const dayName = getFrenchDayName(selectedDate);

    const evts = unifiedEvents.filter((e) => e.dateStr === key && matchesFilter(e));
    const progs = unifiedPrograms.filter((p) => p.dayOfWeek === dayName && matchesFilter(p));

    return {
      date: selectedDate,
      dateKey: key,
      dayName,
      items: [...evts, ...progs],
    };
  }, [selectedDate, unifiedEvents, unifiedPrograms, sourceFilter, selectedCategory, searchQuery]);

  // Agenda upcoming items (next 45 days)
  const upcomingAgendaItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setDate(today.getDate() + 45);

    const list: {
      date: Date;
      dateKey: string;
      dayName: string;
      item: UnifiedCalendarItem;
      relativeLabel: string;
    }[] = [];

    // Loop through the next 45 days
    for (let i = 0; i < 45; i++) {
      const cur = new Date(today);
      cur.setDate(today.getDate() + i);
      const key = toDateKey(cur);
      const dayName = getFrenchDayName(cur);

      let relLabel = '';
      if (i === 0) relLabel = 'Aujourd’hui';
      else if (i === 1) relLabel = 'Demain';
      else if (i < 7) relLabel = `Ce ${dayName}`;
      else relLabel = `Dans ${i} jours`;

      // Specific events
      const evts = unifiedEvents.filter((e) => e.dateStr === key && matchesFilter(e));
      evts.forEach((e) => {
        list.push({
          date: cur,
          dateKey: key,
          dayName,
          item: e,
          relativeLabel: relLabel,
        });
      });

      // Weekly programs
      const progs = unifiedPrograms.filter((p) => p.dayOfWeek === dayName && matchesFilter(p));
      progs.forEach((p) => {
        list.push({
          date: cur,
          dateKey: key,
          dayName,
          item: p,
          relativeLabel: relLabel,
        });
      });
    }

    return list;
  }, [unifiedEvents, unifiedPrograms, sourceFilter, selectedCategory, searchQuery]);

  // Share event helper
  const handleShareItem = (item: UnifiedCalendarItem) => {
    const text = `${item.title} — ${item.timeStr} au ${item.location} (EMF Sangmelima). Venez nombreux !`;
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(`${text}\n${window.location.href}`);
      showToast('Détails copiés dans le presse-papier !');
    }
  };

  // Google Calendar URL generator
  const getGoogleCalendarUrl = (item: UnifiedCalendarItem, targetDate?: Date) => {
    const title = encodeURIComponent(item.title);
    const details = encodeURIComponent(
      `${item.description}\n\nLieu : ${item.location}\nCommunauté : Église Missionnaire de la Foi (EMF) Sangmelima.`
    );
    const location = encodeURIComponent(item.location);

    let datesParam = '';
    const baseDate = targetDate || (item.dateStr ? new Date(item.dateStr) : new Date());

    if (!isNaN(baseDate.getTime())) {
      const y = baseDate.getFullYear();
      const m = padZero(baseDate.getMonth() + 1);
      const d = padZero(baseDate.getDate());
      // Default time 09:00 to 12:00
      datesParam = `&dates=${y}${m}${d}T090000/${y}${m}${d}T120000`;
    }

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}${datesParam}&details=${details}&location=${location}`;
  };

  // Generate and download .ics file
  const handleDownloadICS = (item: UnifiedCalendarItem, targetDate?: Date) => {
    const baseDate = targetDate || (item.dateStr ? new Date(item.dateStr) : new Date());
    const y = baseDate.getFullYear();
    const m = padZero(baseDate.getMonth() + 1);
    const d = padZero(baseDate.getDate());

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EMF SMART//Sangmelima Church Calendar//FR',
      'BEGIN:VEVENT',
      `UID:${item.id}-${Date.now()}@emf-sangmelima.org`,
      `DTSTAMP:${y}${m}${d}T090000Z`,
      `DTSTART:${y}${m}${d}T090000Z`,
      `DTEND:${y}${m}${d}T120000Z`,
      `SUMMARY:${item.title}`,
      `DESCRIPTION:${(item.description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${item.location || ''}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(item.title || 'evenement').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Fichier .ics téléchargé avec succès !');
  };

  // Total count of scheduled items in current view month
  const monthTotalCount = useMemo(() => {
    const currentMonthCells = monthGrid.filter((c) => c.isCurrentMonth);
    let total = 0;
    currentMonthCells.forEach((c) => {
      total += c.eventsForDay.length + c.programsForDay.length;
    });
    return total;
  }, [monthGrid]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#4A0E17] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#C99B2E] flex items-center space-x-3 text-xs font-bold animate-bounce">
          <CheckCircle className="w-4 h-4 text-[#C99B2E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-[#4A0E17] via-[#0D3666] to-[#6E1325] text-white relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#C99B2E]/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-48 h-48 rounded-full bg-blue-400/10 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 bg-[#C99B2E]/20 text-[#C99B2E] px-3.5 py-1 rounded-full text-xs font-bold border border-[#C99B2E]/30 mb-2">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Agenda Spirituel • Sangmelima & Environs</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center space-x-2">
              <span>Calendrier Interactif des Rassemblements</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Consultez les cultes d’adoration, réunions de prière, veillées, séminaires et conférences spirituelles. Visualisez votre semaine et le mois en un coup d'œil.
            </p>
          </div>

          {/* Quick Actions & Admin buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#C99B2E] text-[#4A0E17] hover:bg-amber-400 text-xs font-black transition shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Programmer un Événement</span>
                </button>

                {onOpenWeeklyPrograms && (
                  <button
                    type="button"
                    onClick={onOpenWeeklyPrograms}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/20 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-[#C99B2E]" />
                    <span>Gérer Cultes Hebdo</span>
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handleResetToToday}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition border border-white/20 flex items-center space-x-1.5 cursor-pointer"
              title="Revenir à la date du jour"
            >
              <Sun className="w-4 h-4 text-amber-300" />
              <span>Aujourd’hui</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs: Mois | Semaine | Agenda */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="inline-flex bg-[#4A0E17]/80 p-1 rounded-2xl border border-white/15 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-[#C99B2E] text-[#4A0E17] shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Vue Mois</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-[#C99B2E] text-[#4A0E17] shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vue Semaine</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
                viewMode === 'agenda'
                  ? 'bg-[#C99B2E] text-[#4A0E17] shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Agenda & Prochains Rendez-vous</span>
            </button>
          </div>

          {/* Current Period Display & Arrow Navigation */}
          <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-xs px-3.5 py-1.5 rounded-2xl border border-white/15">
            <button
              type="button"
              onClick={viewMode === 'week' ? handlePrevWeek : handlePrevMonth}
              className="p-1 hover:bg-white/20 rounded-lg text-white transition cursor-pointer"
              title="Période précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs sm:text-sm font-black text-amber-300 min-w-[150px] text-center">
              {viewMode === 'week' ? (
                <>
                  Semaine du {weekDays[0].date.getDate()}{' '}
                  {FRENCH_MONTH_NAMES[weekDays[0].date.getMonth()].slice(0, 4)} au{' '}
                  {weekDays[6].date.getDate()}{' '}
                  {FRENCH_MONTH_NAMES[weekDays[6].date.getMonth()]} {weekDays[6].date.getFullYear()}
                </>
              ) : (
                <>
                  {FRENCH_MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
                </>
              )}
            </span>

            <button
              type="button"
              onClick={viewMode === 'week' ? handleNextWeek : handleNextMonth}
              className="p-1 hover:bg-white/20 rounded-lg text-white transition cursor-pointer"
              title="Période suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters, Source Toggle, Live Search */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Source Toggle */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs self-start md:self-auto">
          <button
            type="button"
            onClick={() => setSourceFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              sourceFilter === 'all'
                ? 'bg-[#4A0E17] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tous les rassemblements
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('events')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              sourceFilter === 'events'
                ? 'bg-[#4A0E17] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Événements spéciaux ({unifiedEvents.length})
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('programs')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              sourceFilter === 'programs'
                ? 'bg-[#4A0E17] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cultes hebdomadaires ({unifiedPrograms.length})
          </button>
        </div>

        {/* Live Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, orateur, lieu..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Bar (Horizontal scroll on mobile) */}
      <div className="px-4 py-2.5 bg-slate-100/60 border-b border-slate-200/80 flex items-center space-x-2 overflow-x-auto text-[11px] scrollbar-thin">
        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] shrink-0 pl-1">
          Catégories :
        </span>
        {categoriesList.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-0.5 rounded-lg font-bold transition shrink-0 cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#C99B2E] text-[#4A0E17] shadow-2xs font-black'
                : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            {cat === 'TOUS' ? 'Toutes' : cat}
          </button>
        ))}
      </div>

      {/* MAIN VIEW CONTENT */}
      <div className="p-4 sm:p-6">
        {/* ========================================================
            VIEW MODE 1: VUE MOIS (MONTH GRID + DAY DETAIL PANEL)
           ======================================================== */}
        {viewMode === 'month' && (
          <div className="space-y-6">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-black uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200">
              {FRENCH_DAYS.map((day) => (
                <div key={day} className="py-1">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 3)}</span>
                </div>
              ))}
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {monthGrid.map((cell) => {
                const totalItems = cell.eventsForDay.length + cell.programsForDay.length;

                return (
                  <div
                    key={cell.dateKey}
                    onClick={() => setSelectedDate(cell.date)}
                    className={`min-h-[75px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative ${
                      cell.isSelected
                        ? 'border-[#4A0E17] bg-blue-50/70 shadow-md ring-2 ring-[#4A0E17]/20'
                        : cell.isToday
                        ? 'border-amber-400 bg-amber-50/40 shadow-xs'
                        : cell.isCurrentMonth
                        ? 'border-slate-200 bg-white hover:border-[#6E1325]/50 hover:bg-slate-50'
                        : 'border-slate-100 bg-slate-50/50 opacity-40 hover:opacity-80'
                    }`}
                  >
                    {/* Top Row: Day Number + Badges */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-black rounded-lg w-6 h-6 flex items-center justify-center ${
                          cell.isToday
                            ? 'bg-[#C99B2E] text-[#4A0E17] shadow-xs'
                            : cell.isSelected
                            ? 'bg-[#4A0E17] text-white'
                            : cell.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      {cell.isToday && (
                        <span className="hidden sm:inline-block text-[9px] font-black uppercase text-amber-800 bg-amber-100 px-1 rounded">
                          Auj.
                        </span>
                      )}

                      {totalItems > 0 && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1 rounded sm:hidden">
                          {totalItems}
                        </span>
                      )}
                    </div>

                    {/* Desktop Content Preview: Badges / Dots */}
                    <div className="space-y-1 mt-1 hidden sm:block">
                      {/* Special Events */}
                      {cell.eventsForDay.slice(0, 2).map((evt) => (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveItem(evt);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold truncate bg-emerald-100 text-emerald-900 border border-emerald-200 hover:bg-emerald-200 transition cursor-pointer flex items-center space-x-1"
                          title={`${evt.title} (${evt.timeStr})`}
                        >
                          <Flame className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                          <span className="truncate">{evt.title}</span>
                        </div>
                      ))}

                      {/* Weekly Programs */}
                      {cell.programsForDay.slice(0, 2).map((prog) => (
                        <div
                          key={prog.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveItem(prog);
                          }}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold truncate bg-blue-100 text-[#4A0E17] border border-blue-200 hover:bg-blue-200 transition cursor-pointer flex items-center space-x-1"
                          title={`${prog.title} (${prog.timeStr})`}
                        >
                          <Clock className="w-2.5 h-2.5 text-[#6E1325] shrink-0" />
                          <span className="truncate">{prog.title}</span>
                        </div>
                      ))}

                      {totalItems > 2 && (
                        <div className="text-[9px] font-bold text-slate-500 pl-1">
                          +{totalItems - 2} autre(s)
                        </div>
                      )}
                    </div>

                    {/* Mobile Dots Indicator */}
                    <div className="flex items-center space-x-1 sm:hidden mt-auto pt-1">
                      {cell.eventsForDay.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Événement spécial" />
                      )}
                      {cell.programsForDay.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" title="Culte hebdomadaire" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Date Detail Panel */}
            <div className="mt-8 p-5 sm:p-6 bg-[#F4F7FB] rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#C99B2E] bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                    Programme du Jour Sélectionné
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-[#4A0E17] mt-1">
                    {selectedDateSchedule.dayName} {selectedDateSchedule.date.getDate()}{' '}
                    {FRENCH_MONTH_NAMES[selectedDateSchedule.date.getMonth()]}{' '}
                    {selectedDateSchedule.date.getFullYear()}
                  </h3>
                </div>

                <div className="text-xs font-bold text-slate-500">
                  {selectedDateSchedule.items.length === 0 ? (
                    <span>Aucun rassemblement particulier ce jour</span>
                  ) : (
                    <span>
                      {selectedDateSchedule.items.length} rendez-vous spirituel(s)
                    </span>
                  )}
                </div>
              </div>

              {/* Items for selected date */}
              <div className="mt-4">
                {selectedDateSchedule.items.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500">
                      Aucun culte ou événement n'est programmé pour cette journée spécifique.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Cliquez sur une autre date ou basculez en « Vue Semaine » pour découvrir tous les cultes de Sangmelima.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedDateSchedule.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveItem(item)}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-[#6E1325] transition cursor-pointer flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                item.sourceType === 'EVENT'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-blue-100 text-[#4A0E17] border border-blue-200'
                              }`}
                            >
                              {item.sourceType === 'EVENT' ? 'Événement Spécial' : 'Culte Régulier'}
                            </span>

                            <div className="flex items-center space-x-1 text-xs font-black text-[#C99B2E]">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{item.timeStr}</span>
                            </div>
                          </div>

                          <h4 className="text-sm font-black text-[#4A0E17] leading-snug group-hover:text-[#6E1325] mb-1">
                            {item.title}
                          </h4>

                          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                            {item.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500 font-medium">
                          <div className="flex items-center space-x-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>

                          {item.leader && (
                            <div className="flex items-center space-x-1.5 text-[#4A0E17] font-bold truncate">
                              <UserIcon className="w-3.5 h-3.5 text-[#C99B2E] shrink-0" />
                              <span className="truncate">{item.leader}</span>
                            </div>
                          )}

                          <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#6E1325]">
                            <span className="inline-flex items-center space-x-1">
                              <Eye className="w-3 h-3 text-[#C99B2E]" />
                              <span>Voir détails</span>
                            </span>
                            <span className="text-slate-400 font-normal">→</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW MODE 2: VUE SEMAINE (7-DAY COLUMN VIEW)
           ======================================================== */}
        {viewMode === 'week' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
              {weekDays.map((col) => {
                const totalItems = col.events.length + col.programs.length;

                return (
                  <div
                    key={col.dateKey}
                    className={`rounded-2xl border flex flex-col justify-between transition-all ${
                      col.isToday
                        ? 'border-amber-400 bg-amber-50/20 shadow-sm ring-2 ring-amber-300/40'
                        : 'border-slate-200 bg-[#F4F7FB]'
                    }`}
                  >
                    {/* Day Column Header */}
                    <div
                      className={`p-3 rounded-t-2xl border-b ${
                        col.isToday
                          ? 'bg-amber-100/60 border-amber-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-[#4A0E17]">
                          {col.dayName}
                        </span>
                        {col.isToday && (
                          <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-200 px-1.5 py-0.2 rounded">
                            Aujourd’hui
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-black text-slate-800 mt-0.5">
                        {col.date.getDate()}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          {FRENCH_MONTH_NAMES[col.date.getMonth()].slice(0, 4)}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400">
                        {totalItems} rendez-vous
                      </div>
                    </div>

                    {/* Column Items Body */}
                    <div className="p-2.5 space-y-2.5 flex-1 min-h-[140px]">
                      {totalItems === 0 ? (
                        <div className="py-6 text-center text-[11px] text-slate-400 italic">
                          Repos / Prière personnelle
                        </div>
                      ) : (
                        <>
                          {/* Special Events */}
                          {col.events.map((evt) => (
                            <div
                              key={evt.id}
                              onClick={() => setActiveItem(evt)}
                              className="p-2.5 bg-emerald-50/90 rounded-xl border border-emerald-200 hover:border-emerald-400 transition cursor-pointer shadow-2xs group"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-black uppercase px-1 rounded bg-emerald-200 text-emerald-900">
                                  Spécial
                                </span>
                                <span className="text-[10px] font-black text-emerald-800">
                                  {evt.timeStr}
                                </span>
                              </div>
                              <h5 className="text-xs font-black text-[#4A0E17] line-clamp-2 leading-tight group-hover:text-emerald-900">
                                {evt.title}
                              </h5>
                              <div className="text-[10px] text-slate-500 truncate mt-1 flex items-center space-x-1">
                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{evt.location}</span>
                              </div>
                            </div>
                          ))}

                          {/* Weekly Programs */}
                          {col.programs.map((prog) => (
                            <div
                              key={prog.id}
                              onClick={() => setActiveItem(prog)}
                              className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-[#6E1325] transition cursor-pointer shadow-2xs group"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[9px] font-black uppercase px-1 rounded bg-blue-100 text-[#4A0E17]">
                                  Culte
                                </span>
                                <span className="text-[10px] font-black text-[#C99B2E]">
                                  {prog.timeStr}
                                </span>
                              </div>
                              <h5 className="text-xs font-black text-[#4A0E17] line-clamp-2 leading-tight group-hover:text-[#6E1325]">
                                {prog.title}
                              </h5>
                              <div className="text-[10px] text-slate-500 truncate mt-1 flex items-center space-x-1">
                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{prog.location}</span>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW MODE 3: AGENDA CHRONOLOGIQUE (UPCOMING LIST)
           ======================================================== */}
        {viewMode === 'agenda' && (
          <div className="space-y-4">
            {upcomingAgendaItems.length === 0 ? (
              <div className="py-12 text-center space-y-3 bg-[#F4F7FB] rounded-3xl border border-slate-200">
                <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-600">
                  Aucun résultat ne correspond à vos filtres.
                </h4>
                <p className="text-xs text-slate-400">
                  Essayez d'effacer la recherche ou de sélectionner « Tous les rassemblements ».
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                {upcomingAgendaItems.slice(0, 15).map(({ date, dayName, item, relativeLabel }, index) => (
                  <div
                    key={`${item.id}-${index}`}
                    onClick={() => setActiveItem(item)}
                    className="p-4 sm:p-5 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    {/* Left: Date Badge & Title */}
                    <div className="flex items-start space-x-4">
                      {/* Date block */}
                      <div className="w-16 h-16 rounded-2xl bg-[#4A0E17] text-white flex flex-col items-center justify-center shrink-0 shadow-xs group-hover:bg-[#6E1325] transition">
                        <span className="text-[10px] font-bold uppercase text-amber-300">
                          {dayName.slice(0, 3)}
                        </span>
                        <span className="text-xl font-black leading-none">{date.getDate()}</span>
                        <span className="text-[9px] text-slate-300">
                          {FRENCH_MONTH_NAMES[date.getMonth()].slice(0, 4)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.2 rounded-full ${
                              item.sourceType === 'EVENT'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-100 text-[#4A0E17] border border-blue-200'
                            }`}
                          >
                            {item.sourceType === 'EVENT' ? 'Événement Spécial' : 'Culte Récurrent'}
                          </span>

                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.2 rounded-md">
                            {relativeLabel}
                          </span>

                          <span className="text-xs font-black text-[#C99B2E] flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{item.timeStr}</span>
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-black text-[#4A0E17] group-hover:text-[#6E1325] transition">
                          {item.title}
                        </h4>

                        <p className="text-xs text-slate-600 line-clamp-1 max-w-2xl">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{item.location}</span>
                          </span>
                          {item.leader && (
                            <span className="flex items-center space-x-1 font-bold text-[#4A0E17]">
                              <UserIcon className="w-3 h-3 text-[#C99B2E]" />
                              <span>{item.leader}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Action Button */}
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareItem(item);
                        }}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 transition"
                        title="Partager"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        className="px-3.5 py-2 rounded-xl bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold transition shadow-2xs flex items-center space-x-1.5"
                      >
                        <span>Détails</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info & Statistics Bar */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-3">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="font-bold text-slate-700">Événements exceptionnels</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span className="font-bold text-slate-700">Cultes réguliers EMF</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-400">
          Fuseau horaire : <strong className="text-slate-600">Africa/Douala (GMT+1)</strong> • Akon, Sangmelima
        </div>
      </div>

      {/* ========================================================
          MODAL: EVENT / PROGRAM DETAILS VIEW
         ======================================================== */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-8">
            {/* Header / Banner */}
            <div className="relative h-44 sm:h-52 bg-gradient-to-br from-[#4A0E17] to-[#6E1325] text-white">
              {activeItem.bannerUrl ? (
                <img
                  src={activeItem.bannerUrl}
                  alt={activeItem.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#4A0E17] via-[#0D3666] to-[#6E1325]">
                  <Sparkles className="w-10 h-10 text-[#C99B2E] mb-2" />
                  <span className="text-xs uppercase tracking-widest text-[#C99B2E] font-bold">
                    Église Missionnaire de la Foi • Sangmelima
                  </span>
                </div>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition backdrop-blur-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Category Badge overlay */}
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                <span className="bg-[#4A0E17]/90 backdrop-blur-xs text-[#C99B2E] text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border border-[#C99B2E]/40">
                  {activeItem.category}
                </span>

                <span className="bg-white/90 backdrop-blur-xs text-[#4A0E17] text-xs font-black px-3 py-1 rounded-full">
                  {activeItem.sourceType === 'EVENT' ? 'Événement Spécial' : 'Culte Hebdomadaire'}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#4A0E17] leading-snug">
                  {activeItem.title}
                </h3>
              </div>

              {/* Meta Grid: Date, Time, Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-[#C99B2E] shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Jour & Horaires</div>
                    <div className="font-black text-slate-800">
                      {activeItem.dayOfWeek ? `${activeItem.dayOfWeek} • ` : ''}
                      {activeItem.timeStr}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <MapPin className="w-4 h-4 text-[#C99B2E] shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Lieu du Rassemblement</div>
                    <div className="font-bold text-slate-800 truncate">{activeItem.location}</div>
                  </div>
                </div>

                {activeItem.leader && (
                  <div className="flex items-center space-x-2.5">
                    <UserIcon className="w-4 h-4 text-[#C99B2E] shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Officiant / Orateur</div>
                      <div className="font-bold text-slate-800">{activeItem.leader}</div>
                    </div>
                  </div>
                )}

                {activeItem.targetAudience && (
                  <div className="flex items-center space-x-2.5">
                    <Users className="w-4 h-4 text-[#C99B2E] shrink-0" />
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Public Cible</div>
                      <div className="font-bold text-slate-800">{activeItem.targetAudience}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Description & Déroulement
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-white">
                  {activeItem.description}
                </p>
              </div>

              {/* Action Buttons: Google Calendar, .ICS, Share */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={getGoogleCalendarUrl(activeItem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#4A0E17] text-xs font-bold transition border border-blue-200 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ajouter à Google Agenda</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDownloadICS(activeItem)}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer"
                    title="Télécharger fichier universel iCalendar pour Apple / Outlook"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Exporter .ICS</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleShareItem(activeItem)}
                    className="px-3.5 py-2 rounded-xl bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-black transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Share2 className="w-3.5 h-3.5 text-[#C99B2E]" />
                    <span>Partager</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ADMIN QUICK ADD EVENT
         ======================================================== */}
      {isAddEventModalOpen && (
        <AdminQuickEventModal
          isOpen={isAddEventModalOpen}
          onClose={() => setIsAddEventModalOpen(false)}
          currentUser={currentUser}
          onEventCreated={() => {
            setIsAddEventModalOpen(false);
            showToast('Événement programmé avec succès !');
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
};

// ========================================================
// SUBCOMPONENT: ADMIN QUICK ADD EVENT MODAL
// ========================================================
interface AdminQuickEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  onEventCreated: () => void;
}

const AdminQuickEventModal: React.FC<AdminQuickEventModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onEventCreated,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('culte');
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    now.setHours(9, 0, 0, 0);
    return now.toISOString().substring(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    return now.toISOString().substring(0, 16);
  });
  const [location, setLocation] = useState('Grand Temple Akon, Sangmelima');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState(
    'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?auto=format&fit=crop&w=1200&q=80'
  );
  const [maxParticipants, setMaxParticipants] = useState<number>(300);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Veuillez renseigner un titre pour l’événement.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await apiClient.createEvent(
        {
          title: title.trim(),
          type,
          startDate,
          endDate,
          location: location.trim(),
          description: description.trim(),
          bannerUrl,
          maxParticipants,
          status: 'PROGRAMMÉ',
        },
        currentUser || undefined
      );

      onEventCreated();
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la création de l’événement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative my-6">
        <div className="p-6 bg-gradient-to-r from-[#4A0E17] to-[#6E1325] text-white flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase text-[#C99B2E] tracking-wider">
              Administration • Calendrier
            </div>
            <h3 className="text-lg font-black mt-0.5">Programmer un Nouvel Événement</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Titre de l’Événement *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Grande Veillée d'Adoration & Délivrance"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Type d’Événement</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
              >
                <option value="culte">Culte</option>
                <option value="priere">Prière & Jeûne</option>
                <option value="conference">Conférence</option>
                <option value="convention">Convention</option>
                <option value="seminaire">Séminaire</option>
                <option value="croisade">Croisade / Concert</option>
                <option value="jeunesse">Jeunesse</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Capacité Estimée</label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date & Heure Début</label>
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date & Heure Fin</label>
              <input
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Lieu du Rassemblement</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Grand Temple Akon, Sangmelima"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description & Programme</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Précisez le déroulement, orateurs invités, cantiques..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6E1325]"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-black transition shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : 'Programmer l’Événement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
