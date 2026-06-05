import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar, Clock, MapPin,
  Bell, Repeat, Flag, Edit2, Trash2, CalendarDays, AlertCircle,
  CheckCircle2, Users, BookOpen, LayoutGrid, List, Sparkles, CalendarClock,
} from 'lucide-react';
import { cn } from '../../utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EventType = 'booking' | 'reminder' | 'meeting' | 'task' | 'event';
export type Priority  = 'low' | 'medium' | 'high' | 'urgent';
export type Repeat    = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type ReminderBefore = 'none' | '15min' | '30min' | '1hour' | '1day';

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;        // YYYY-MM-DD
  startTime?: string;  // HH:mm
  endTime?: string;
  description?: string;
  location?: string;
  priority: Priority;
  repeat: Repeat;
  reminderBefore: ReminderBefore;
  color: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'securevault_calendar_events';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; bg: string; gradient: string; Icon: any }> = {
  booking:  { label: 'Booking',  color: '#3b82f6', bg: '#eff6ff', gradient: 'from-blue-500 to-blue-600',     Icon: BookOpen    },
  reminder: { label: 'Reminder', color: '#f59e0b', bg: '#fffbeb', gradient: 'from-amber-500 to-orange-500',  Icon: Bell        },
  meeting:  { label: 'Meeting',  color: '#8b5cf6', bg: '#f5f3ff', gradient: 'from-violet-500 to-purple-600', Icon: Users       },
  task:     { label: 'Task',     color: '#10b981', bg: '#ecfdf5', gradient: 'from-emerald-500 to-teal-600',  Icon: CheckCircle2 },
  event:    { label: 'Event',    color: '#ec4899', bg: '#fdf2f8', gradient: 'from-pink-500 to-rose-600',     Icon: CalendarDays },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low:    { label: 'Low',    color: '#10b981' },
  medium: { label: 'Medium', color: '#f59e0b' },
  high:   { label: 'High',   color: '#f97316' },
  urgent: { label: 'Urgent', color: '#ef4444' },
};

const REMINDER_LABELS: Record<ReminderBefore, string> = {
  none:    'No reminder',
  '15min': '15 minutes before',
  '30min': '30 minutes before',
  '1hour': '1 hour before',
  '1day':  '1 day before',
};

const REPEAT_LABELS: Record<Repeat, string> = {
  none:    'Does not repeat',
  daily:   'Daily',
  weekly:  'Weekly',
  monthly: 'Monthly',
  yearly:  'Yearly',
};

function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year: number, month: number) { return new Date(year, month, 1).getDay(); }

function loadEvents(): CalendarEvent[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
function saveEvents(events: CalendarEvent[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); }

const DEFAULT_FORM: Omit<CalendarEvent, 'id' | 'createdAt'> = {
  title: '', type: 'booking', date: '', startTime: '09:00', endTime: '10:00',
  description: '', location: '', priority: 'medium', repeat: 'none',
  reminderBefore: 'none', color: '#3b82f6',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today       = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [events,    setEvents]    = useState<CalendarEvent[]>(loadEvents);
  const [viewMode,  setViewMode]  = useState<'month' | 'agenda'>('month');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => { saveEvents(events); }, [events]);

  const eventsOnDate = useCallback((dateStr: string) =>
    events.filter((e) => e.date === dateStr)
      .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? '')),
    [events]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };
  const goToday = () => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); };

  const openCreate = (dateStr?: string) => {
    setEditingEvent(null);
    setForm({ ...DEFAULT_FORM, date: dateStr ?? toDateStr(viewYear, viewMonth, today.getDate()), color: '#3b82f6' });
    setModalOpen(true);
  };
  const openEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setForm({ ...event });
    setDetailOpen(false);
    setModalOpen(true);
  };
  const openDayDetail = (dateStr: string) => {
    const dayEvs = eventsOnDate(dateStr);
    setSelectedDate(dateStr);
    setSelectedDayEvents(dayEvs);
    if (dayEvs.length === 0) { openCreate(dateStr); return; }
    setDetailOpen(true);
  };

  const handleFormChange = (field: keyof typeof form, value: string) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'type') next.color = EVENT_TYPE_CONFIG[value as EventType].color;
      return next;
    });
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.date) return;
    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...form, id: editingEvent.id, createdAt: editingEvent.createdAt } : e));
    } else {
      setEvents(prev => [...prev, { ...form, id: genId(), createdAt: new Date().toISOString() }]);
    }
    setModalOpen(false);
    setForm(DEFAULT_FORM);
    setEditingEvent(null);
  };

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setSelectedDayEvents(prev => {
      const next = prev.filter(e => e.id !== id);
      if (next.length === 0) setDetailOpen(false);
      return next;
    });
  };

  // Calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDayOfMonth(viewYear, viewMonth);
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDay + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // Stats
  const stats = useMemo(() => {
    const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
    const ws = toDateStr(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
    const we = toDateStr(weekEnd.getFullYear(), weekEnd.getMonth(), weekEnd.getDate());
    return {
      total:     events.length,
      bookings:  events.filter(e => e.type === 'booking').length,
      reminders: events.filter(e => e.type === 'reminder').length,
      thisWeek:  events.filter(e => e.date >= ws && e.date <= we).length,
      thisMonth: events.filter(e => {
        const [y, m] = e.date.split('-').map(Number);
        return y === viewYear && m === viewMonth + 1;
      }).length,
    };
  }, [events, viewYear, viewMonth]);

  const upcoming = useMemo(() => events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? ''))
    .slice(0, 10), [events, todayStr]);

  // Agenda groups (events in the viewed month, grouped by date)
  const agendaGroups = useMemo(() => {
    const inMonth = events
      .filter(e => { const [y, m] = e.date.split('-').map(Number); return y === viewYear && m === viewMonth + 1; })
      .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? ''));
    const map = new Map<string, CalendarEvent[]>();
    for (const e of inMonth) { (map.get(e.date) ?? map.set(e.date, []).get(e.date)!).push(e); }
    return Array.from(map.entries());
  }, [events, viewYear, viewMonth]);

  return (
    <div className="space-y-6">
      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1e3a5f] via-[#1e40af] to-[#4338ca] shadow-xl">
        {/* decorative blobs */}
        <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute top-6 right-1/4 text-white/10"><Sparkles size={120} /></div>

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur-sm">
                <Calendar size={26} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Calendar</h1>
                <p className="text-sm text-blue-100/80 mt-1">Manage your bookings, reminders & events in one place</p>
              </div>
            </div>
            <button
              onClick={() => openCreate()}
              className="flex items-center gap-2 px-5 h-11 rounded-xl bg-white text-blue-700 text-sm font-bold shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all active:scale-95"
            >
              <Plus size={17} /> New Event
            </button>
          </div>

          {/* Stat pills */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-7">
            {[
              { label: 'Total Events', value: stats.total,     Icon: CalendarDays,  tint: 'text-blue-200'   },
              { label: 'Bookings',     value: stats.bookings,  Icon: BookOpen,      tint: 'text-sky-200'    },
              { label: 'Reminders',    value: stats.reminders, Icon: Bell,          tint: 'text-amber-200'  },
              { label: 'This Week',    value: stats.thisWeek,  Icon: CalendarClock, tint: 'text-emerald-200'},
            ].map(({ label, value, Icon, tint }) => (
              <div key={label} className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-100/70">{label}</span>
                  <Icon size={15} className={tint} />
                </div>
                <p className="text-2xl font-extrabold text-white mt-1.5 tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* ── Calendar / Agenda ─────────────────────────────────────────────── */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-lg font-extrabold text-slate-900 min-w-[170px] text-center tracking-tight">
                {MONTHS[viewMonth]} <span className="text-slate-400 font-bold">{viewYear}</span>
              </h2>
              <button onClick={nextMonth} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                <ChevronRight size={16} />
              </button>
              <button onClick={goToday} className="ml-1 text-xs font-bold text-blue-600 hover:text-white px-3 py-2 rounded-xl border border-blue-200 hover:bg-blue-600 hover:border-blue-600 transition-all">
                Today
              </button>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
              {([
                { mode: 'month',  label: 'Month',  Icon: LayoutGrid },
                { mode: 'agenda', label: 'Agenda', Icon: List },
              ] as const).map(({ mode, label, Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all',
                    viewMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'month' ? (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-slate-50/60 border-b border-slate-100">
                {DAYS.map((d, i) => (
                  <div key={d} className={cn(
                    'py-2.5 text-center text-xs font-bold uppercase tracking-wider',
                    i === 0 || i === 6 ? 'text-slate-400' : 'text-slate-500',
                  )}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  const dateStr   = day ? toDateStr(viewYear, viewMonth, day) : '';
                  const dayEvs    = day ? eventsOnDate(dateStr) : [];
                  const isToday   = dateStr === todayStr;
                  const isWeekend = i % 7 === 0 || i % 7 === 6;
                  const isPast    = day ? dateStr < todayStr : false;

                  return (
                    <div
                      key={i}
                      onClick={() => day && openDayDetail(dateStr)}
                      className={cn(
                        'group relative min-h-[104px] p-2 border-b border-r border-slate-100 transition-all',
                        i % 7 === 6 && 'border-r-0',
                        day ? 'cursor-pointer hover:bg-blue-50/50' : 'bg-slate-50/40',
                        isWeekend && day && !isToday ? 'bg-slate-50/40' : '',
                        isToday && 'bg-blue-50/40',
                      )}
                    >
                      {day && (
                        <>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all',
                              isToday
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30'
                                : isPast ? 'text-slate-400' : 'text-slate-700 group-hover:bg-white group-hover:shadow-sm',
                            )}>
                              {day}
                            </span>
                            {/* quick add on hover */}
                            <button
                              onClick={(e) => { e.stopPropagation(); openCreate(dateStr); }}
                              className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-all"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <div className="space-y-1 overflow-hidden">
                            {dayEvs.slice(0, 3).map(ev => {
                              const cfg = EVENT_TYPE_CONFIG[ev.type];
                              return (
                                <div
                                  key={ev.id}
                                  className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-md text-xs font-semibold truncate border-l-[3px]"
                                  style={{ background: `${cfg.color}12`, color: cfg.color, borderLeftColor: cfg.color }}
                                >
                                  {ev.startTime && <span className="text-[10px] font-bold opacity-70 tabular-nums flex-shrink-0">{ev.startTime}</span>}
                                  <span className="truncate">{ev.title}</span>
                                </div>
                              );
                            })}
                            {dayEvs.length > 3 && (
                              <div className="text-[11px] text-slate-400 px-1.5 font-bold">+{dayEvs.length - 3} more</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* ── Agenda view ─────────────────────────────────────────────────── */
            <div className="p-5 space-y-5 max-h-[640px] overflow-y-auto">
              {agendaGroups.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                    <CalendarDays size={28} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500">No events this month</p>
                  <p className="text-xs text-slate-400 mt-1">Click "New Event" to schedule something</p>
                  <button onClick={() => openCreate()} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 px-4 py-2 rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors">
                    <Plus size={13} /> Add Event
                  </button>
                </div>
              ) : (
                agendaGroups.map(([dateStr, evs]) => {
                  const d = new Date(dateStr + 'T12:00:00');
                  const isToday = dateStr === todayStr;
                  return (
                    <div key={dateStr} className="flex gap-4">
                      {/* date column */}
                      <div className="flex-shrink-0 w-14 text-center">
                        <div className={cn(
                          'rounded-xl py-2 px-1',
                          isToday ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30' : 'bg-slate-50',
                        )}>
                          <div className={cn('text-[10px] font-bold uppercase', isToday ? 'text-blue-100' : 'text-slate-400')}>
                            {d.toLocaleDateString('en-US', { weekday: 'short' })}
                          </div>
                          <div className={cn('text-xl font-extrabold leading-tight', isToday ? 'text-white' : 'text-slate-900')}>
                            {d.getDate()}
                          </div>
                        </div>
                      </div>
                      {/* events */}
                      <div className="flex-1 space-y-2 min-w-0">
                        {evs.map(ev => {
                          const cfg = EVENT_TYPE_CONFIG[ev.type];
                          const pri = PRIORITY_CONFIG[ev.priority];
                          return (
                            <div
                              key={ev.id}
                              onClick={() => { setSelectedDate(dateStr); setSelectedDayEvents(evs); setDetailOpen(true); }}
                              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm cursor-pointer transition-all bg-white"
                              style={{ borderLeftColor: cfg.color, borderLeftWidth: 3 }}
                            >
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                                <cfg.Icon size={15} style={{ color: cfg.color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{ev.title}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {ev.startTime && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={10} /> {ev.startTime}{ev.endTime ? `–${ev.endTime}` : ''}</span>}
                                  {ev.location && <span className="text-xs text-slate-400 flex items-center gap-1 truncate"><MapPin size={10} /> {ev.location}</span>}
                                </div>
                              </div>
                              <span className="text-xs font-bold px-2 py-1 rounded-full flex-shrink-0" style={{ background: `${pri.color}15`, color: pri.color }}>
                                {pri.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* ── Right panel ───────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Event types */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
              Event Types
            </h3>
            <div className="space-y-1.5">
              {(Object.entries(EVENT_TYPE_CONFIG) as [EventType, typeof EVENT_TYPE_CONFIG[EventType]][]).map(([type, cfg]) => (
                <button
                  key={type}
                  onClick={() => openCreate()}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                >
                  <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm', cfg.gradient)}>
                    <cfg.Icon size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{cfg.label}</span>
                  <span className="ml-auto text-xs font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 min-w-[24px] text-center">
                    {events.filter(e => e.type === type).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-emerald-500 to-teal-600" />
              Upcoming
            </h3>
            {upcoming.length === 0 ? (
              <div className="text-center py-8">
                <CalendarClock size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Nothing scheduled</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto -mr-2 pr-2">
                {upcoming.map(ev => {
                  const cfg     = EVENT_TYPE_CONFIG[ev.type];
                  const evDate  = new Date(ev.date + 'T12:00:00');
                  const isToday = ev.date === todayStr;
                  const label   = isToday ? 'Today' : evDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <motion.button
                      key={ev.id}
                      initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                      className="w-full flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors text-left"
                      onClick={() => { setSelectedDate(ev.date); setSelectedDayEvents(eventsOnDate(ev.date)); setDetailOpen(true); }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: cfg.bg }}>
                        <cfg.Icon size={14} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{ev.title}</p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className={cn('text-[11px] font-bold px-1.5 py-0.5 rounded-md', isToday ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500')}>{label}</span>
                          {ev.startTime && <span className="text-[11px] text-slate-400 font-medium tabular-nums">{ev.startTime}</span>}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <EventFormModal
            form={form}
            editing={!!editingEvent}
            onChange={handleFormChange}
            onSave={handleSave}
            onClose={() => { setModalOpen(false); setEditingEvent(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailOpen && (
          <DayDetailModal
            dateStr={selectedDate}
            events={selectedDayEvents}
            onClose={() => setDetailOpen(false)}
            onEdit={openEdit}
            onDelete={handleDelete}
            onAdd={() => { setDetailOpen(false); openCreate(selectedDate); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Event Form Modal ─────────────────────────────────────────────────────────

function EventFormModal({
  form, editing, onChange, onSave, onClose,
}: {
  form: Omit<CalendarEvent, 'id' | 'createdAt'>;
  editing: boolean;
  onChange: (f: keyof typeof form, v: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const canSave = form.title.trim().length > 0 && form.date.length > 0;
  const typeCfg = EVENT_TYPE_CONFIG[form.type];

  const inputCls = 'w-full h-10 px-3 text-sm rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm" onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/60 z-10 overflow-hidden"
      >
        {/* Header — gradient by type */}
        <div className={cn('relative px-6 pt-5 pb-4 bg-gradient-to-r', typeCfg.gradient)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center backdrop-blur-sm">
                <typeCfg.Icon size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">{editing ? 'Edit Event' : 'New Event'}</h2>
                <p className="text-xs text-white/75">Fill in the details below</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[64vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Title *</label>
            <input
              type="text" value={form.title} autoFocus
              onChange={e => onChange('title', e.target.value)}
              placeholder="e.g. Hotel booking, Team meeting…"
              className={inputCls}
            />
          </div>

          {/* Type chips */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-2">Type</label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map(t => {
                const cfg = EVENT_TYPE_CONFIG[t];
                const active = form.type === t;
                return (
                  <button
                    key={t}
                    onClick={() => onChange('type', t)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 py-2.5 rounded-xl border-2 transition-all',
                      active ? 'border-transparent text-white shadow-sm' : 'border-slate-200 text-slate-500 hover:border-slate-300',
                    )}
                    style={active ? { background: cfg.color } : undefined}
                  >
                    <cfg.Icon size={16} />
                    <span className="text-[10px] font-bold">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5"><Calendar size={11} className="inline mr-1" />Date *</label>
              <input type="date" value={form.date} onChange={e => onChange('date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5"><Flag size={11} className="inline mr-1" />Priority</label>
              <select value={form.priority} onChange={e => onChange('priority', e.target.value)} className={cn(inputCls, 'bg-white')}>
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>)}
              </select>
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5"><Clock size={11} className="inline mr-1" />Start Time</label>
              <input type="time" value={form.startTime ?? ''} onChange={e => onChange('startTime', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">End Time</label>
              <input type="time" value={form.endTime ?? ''} onChange={e => onChange('endTime', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5"><MapPin size={11} className="inline mr-1" />Location</label>
            <input type="text" value={form.location ?? ''} onChange={e => onChange('location', e.target.value)} placeholder="Office, Zoom link, address…" className={inputCls} />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Description</label>
            <textarea
              value={form.description ?? ''} onChange={e => onChange('description', e.target.value)}
              placeholder="Additional details, notes…" rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
            />
          </div>

          {/* Reminder + Repeat */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5"><Bell size={11} className="inline mr-1" />Remind Me</label>
              <select value={form.reminderBefore} onChange={e => onChange('reminderBefore', e.target.value)} className={cn(inputCls, 'bg-white')}>
                {(Object.keys(REMINDER_LABELS) as ReminderBefore[]).map(r => <option key={r} value={r}>{REMINDER_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5"><Repeat size={11} className="inline mr-1" />Repeat</label>
              <select value={form.repeat} onChange={e => onChange('repeat', e.target.value)} className={cn(inputCls, 'bg-white')}>
                {(Object.keys(REPEAT_LABELS) as Repeat[]).map(r => <option key={r} value={r}>{REPEAT_LABELS[r]}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button
            onClick={onSave} disabled={!canSave}
            className="flex-1 h-10 rounded-xl text-sm font-bold text-white transition-all duration-150 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_2px_10px_rgba(37,99,235,0.35)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {editing ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Day Detail Modal ─────────────────────────────────────────────────────────

function DayDetailModal({
  dateStr, events, onClose, onEdit, onDelete, onAdd,
}: {
  dateStr: string;
  events: CalendarEvent[];
  onClose: () => void;
  onEdit: (e: CalendarEvent) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const date = new Date(dateStr + 'T12:00:00');
  const label = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm" onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/60 z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="relative px-6 pt-5 pb-4 bg-gradient-to-r from-[#1e3a5f] to-[#1e40af]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center backdrop-blur-sm">
                <CalendarDays size={17} className="text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">{label}</h2>
                <p className="text-xs text-white/70">{events.length} event{events.length !== 1 ? 's' : ''} scheduled</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors">
              <X size={17} />
            </button>
          </div>
          <button onClick={onAdd} className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-bold text-blue-700 bg-white py-2 rounded-xl hover:bg-blue-50 transition-colors">
            <Plus size={13} /> Add Event to This Day
          </button>
        </div>

        {/* Events list */}
        <div className="p-4 space-y-2.5 max-h-[58vh] overflow-y-auto">
          <AnimatePresence>
            {events.map(ev => {
              const cfg = EVENT_TYPE_CONFIG[ev.type];
              const priCfg = PRIORITY_CONFIG[ev.priority];
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="rounded-xl border border-slate-100 overflow-hidden bg-white"
                  style={{ borderLeftColor: cfg.color, borderLeftWidth: 3 }}
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                      <cfg.Icon size={15} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900 leading-snug">{ev.title}</p>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => onEdit(ev)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => setConfirmDelete(ev.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${priCfg.color}15`, color: priCfg.color }}>{priCfg.label}</span>
                        {ev.startTime && (
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Clock size={10} /> {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                          </span>
                        )}
                      </div>
                      {ev.location && (
                        <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1"><MapPin size={11} /> {ev.location}</p>
                      )}
                      {ev.description && (
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed bg-slate-50 rounded-lg p-2">{ev.description}</p>
                      )}
                      {(ev.reminderBefore !== 'none' || ev.repeat !== 'none') && (
                        <div className="flex gap-3 mt-2 flex-wrap">
                          {ev.reminderBefore !== 'none' && (
                            <span className="text-xs text-amber-600 font-semibold flex items-center gap-1"><Bell size={10} /> {REMINDER_LABELS[ev.reminderBefore]}</span>
                          )}
                          {ev.repeat !== 'none' && (
                            <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1"><Repeat size={10} /> {REPEAT_LABELS[ev.repeat]}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {confirmDelete === ev.id && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden border-t border-red-100 bg-red-50"
                      >
                        <div className="flex items-center gap-3 px-4 py-3">
                          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                          <span className="text-xs text-red-700 font-semibold flex-1">Delete this event?</span>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs font-medium text-slate-500 hover:text-slate-700 px-2 py-1 rounded transition-colors">Cancel</button>
                          <button onClick={() => onDelete(ev.id)} className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors">Delete</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
