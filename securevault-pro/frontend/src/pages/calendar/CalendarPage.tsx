import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Plus, X, Calendar, Clock, MapPin,
  Bell, Repeat, Flag, Edit2, Trash2, CalendarDays, AlertCircle,
  CheckCircle2, Briefcase, Users, BookOpen,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';

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

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; color: string; bg: string; Icon: any }> = {
  booking:  { label: 'Booking',  color: '#3b82f6', bg: '#eff6ff',  Icon: BookOpen   },
  reminder: { label: 'Reminder', color: '#f59e0b', bg: '#fffbeb',  Icon: Bell       },
  meeting:  { label: 'Meeting',  color: '#8b5cf6', bg: '#f5f3ff',  Icon: Users      },
  task:     { label: 'Task',     color: '#10b981', bg: '#ecfdf5',  Icon: CheckCircle2},
  event:    { label: 'Event',    color: '#ec4899', bg: '#fdf2f8',  Icon: CalendarDays},
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low:    { label: 'Low',    color: '#10b981' },
  medium: { label: 'Medium', color: '#f59e0b' },
  high:   { label: 'High',   color: '#f97316' },
  urgent: { label: 'Urgent', color: '#ef4444' },
};

const REMINDER_LABELS: Record<ReminderBefore, string> = {
  none:  'No reminder',
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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveEvents(events: CalendarEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

// ─── Default form ─────────────────────────────────────────────────────────────

const DEFAULT_FORM: Omit<CalendarEvent, 'id' | 'createdAt'> = {
  title: '',
  type: 'booking',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  description: '',
  location: '',
  priority: 'medium',
  repeat: 'none',
  reminderBefore: 'none',
  color: '#3b82f6',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CalendarPage() {
  const today       = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [events,    setEvents]    = useState<CalendarEvent[]>(loadEvents);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [form, setForm] = useState(DEFAULT_FORM);

  useEffect(() => { saveEvents(events); }, [events]);

  const eventsOnDate = useCallback((dateStr: string) =>
    events.filter((e) => e.date === dateStr), [events]);

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
      if (field === 'type') {
        next.color = EVENT_TYPE_CONFIG[value as EventType].color;
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!form.title.trim() || !form.date) return;
    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...form, id: editingEvent.id, createdAt: editingEvent.createdAt } : e));
    } else {
      const newEv: CalendarEvent = { ...form, id: genId(), createdAt: new Date().toISOString() };
      setEvents(prev => [...prev, newEv]);
    }
    setModalOpen(false);
    setForm(DEFAULT_FORM);
    setEditingEvent(null);
  };

  const handleDelete = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setDetailOpen(false);
  };

  // Build calendar grid
  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDay     = getFirstDayOfMonth(viewYear, viewMonth);
  const totalCells   = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDay + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  const todayStr = toDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // Upcoming events (next 7 days)
  const upcoming = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime ?? '').localeCompare(b.startTime ?? ''))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        description="Manage bookings, reminders, and events"
        icon={Calendar}
        action={
          <Button variant="primary" size="sm" leftIcon={Plus} onClick={() => openCreate()}>
            New Event
          </Button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* ── Calendar Grid ──────────────────────────────────────────────────── */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                <ChevronLeft size={15} />
              </button>
              <h2 className="text-base font-bold text-slate-900 min-w-[160px] text-center">
                {MONTHS[viewMonth]} {viewYear}
              </h2>
              <button onClick={nextMonth} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors">
                <ChevronRight size={15} />
              </button>
            </div>
            <button onClick={goToday} className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors border border-blue-100">
              Today
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAYS.map(d => (
              <div key={d} className="py-2.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              const dateStr  = day ? toDateStr(viewYear, viewMonth, day) : '';
              const dayEvs   = day ? eventsOnDate(dateStr) : [];
              const isToday  = dateStr === todayStr;
              const isWeekend = i % 7 === 0 || i % 7 === 6;

              return (
                <div
                  key={i}
                  onClick={() => day && openDayDetail(dateStr)}
                  className={cn(
                    'min-h-[90px] p-2 border-b border-r border-slate-100 transition-colors',
                    day ? 'cursor-pointer hover:bg-blue-50/40' : 'bg-slate-50/30',
                    isWeekend && day ? 'bg-slate-50/50' : '',
                  )}
                >
                  {day && (
                    <>
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold mb-1 transition-colors',
                        isToday
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100',
                      )}>
                        {day}
                      </div>
                      <div className="space-y-0.5 overflow-hidden">
                        {dayEvs.slice(0, 2).map(ev => {
                          const cfg = EVENT_TYPE_CONFIG[ev.type];
                          return (
                            <div
                              key={ev.id}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium truncate"
                              style={{ background: `${cfg.color}18`, color: cfg.color }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                              <span className="truncate">{ev.title}</span>
                            </div>
                          );
                        })}
                        {dayEvs.length > 2 && (
                          <div className="text-xs text-slate-400 px-1.5 font-medium">+{dayEvs.length - 2} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right panel: Upcoming ──────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Legend */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Event Types</h3>
            <div className="space-y-2">
              {(Object.entries(EVENT_TYPE_CONFIG) as [EventType, typeof EVENT_TYPE_CONFIG[EventType]][]).map(([type, cfg]) => (
                <button
                  key={type}
                  onClick={() => openCreate()}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                    <cfg.Icon size={13} style={{ color: cfg.color }} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{cfg.label}</span>
                  <span className="ml-auto text-xs text-slate-400">
                    {events.filter(e => e.type === type).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Upcoming events */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Upcoming</h3>
            {upcoming.length === 0 ? (
              <div className="text-center py-6">
                <Calendar size={28} className="text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcoming.map(ev => {
                  const cfg     = EVENT_TYPE_CONFIG[ev.type];
                  const evDate  = new Date(ev.date + 'T12:00:00');
                  const label   = evDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                      onClick={() => { setSelectedDate(ev.date); setSelectedDayEvents(eventsOnDate(ev.date)); setDetailOpen(true); }}
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: cfg.bg }}>
                        <cfg.Icon size={13} style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{ev.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-400">{label}</span>
                          {ev.startTime && <span className="text-xs text-slate-400">{ev.startTime}</span>}
                          <span className="text-xs font-medium px-1.5 rounded-full" style={{ background: `${PRIORITY_CONFIG[ev.priority].color}15`, color: PRIORITY_CONFIG[ev.priority].color }}>
                            {PRIORITY_CONFIG[ev.priority].label}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
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

      {/* ── Day Detail Modal ───────────────────────────────────────────────── */}
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.96, y: 14 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/60 z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: typeCfg.bg }}>
              <typeCfg.Icon size={17} style={{ color: typeCfg.color }} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">{editing ? 'Edit Event' : 'New Event'}</h2>
              <p className="text-xs text-slate-500">Fill in the details below</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => onChange('title', e.target.value)}
              placeholder="e.g. Hotel booking, Team meeting…"
              className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          {/* Type + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                <CalendarDays size={11} className="inline mr-1" />Type
              </label>
              <select
                value={form.type}
                onChange={e => onChange('type', e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
              >
                {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map(t => (
                  <option key={t} value={t}>{EVENT_TYPE_CONFIG[t].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                <Flag size={11} className="inline mr-1" />Priority
              </label>
              <select
                value={form.priority}
                onChange={e => onChange('priority', e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
              >
                {(Object.keys(PRIORITY_CONFIG) as Priority[]).map(p => (
                  <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date + Times row */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              <Calendar size={11} className="inline mr-1" />Date *
            </label>
            <input
              type="date"
              value={form.date}
              onChange={e => onChange('date', e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                <Clock size={11} className="inline mr-1" />Start Time
              </label>
              <input
                type="time"
                value={form.startTime ?? ''}
                onChange={e => onChange('startTime', e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">End Time</label>
              <input
                type="time"
                value={form.endTime ?? ''}
                onChange={e => onChange('endTime', e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              <MapPin size={11} className="inline mr-1" />Location
            </label>
            <input
              type="text"
              value={form.location ?? ''}
              onChange={e => onChange('location', e.target.value)}
              placeholder="Office, Zoom link, address…"
              className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
            <textarea
              value={form.description ?? ''}
              onChange={e => onChange('description', e.target.value)}
              placeholder="Additional details, notes…"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
            />
          </div>

          {/* Reminder + Repeat row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                <Bell size={11} className="inline mr-1" />Remind Me
              </label>
              <select
                value={form.reminderBefore}
                onChange={e => onChange('reminderBefore', e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
              >
                {(Object.keys(REMINDER_LABELS) as ReminderBefore[]).map(r => (
                  <option key={r} value={r}>{REMINDER_LABELS[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                <Repeat size={11} className="inline mr-1" />Repeat
              </label>
              <select
                value={form.repeat}
                onChange={e => onChange('repeat', e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
              >
                {(Object.keys(REPEAT_LABELS) as Repeat[]).map(r => (
                  <option key={r} value={r}>{REPEAT_LABELS[r]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="flex-1 h-9 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!canSave}
            className="flex-1 h-9 rounded-xl text-sm font-semibold text-white transition-all duration-150 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_2px_10px_rgba(37,99,235,0.35)] disabled:opacity-40 disabled:cursor-not-allowed"
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
        className="fixed inset-0 bg-slate-900/55 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{    opacity: 0, scale: 0.96, y: 14 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/60 z-10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <CalendarDays size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">{label}</h2>
              <p className="text-xs text-slate-500">{events.length} event{events.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onAdd} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors">
              <Plus size={12} /> Add
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Events list */}
        <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
          <AnimatePresence>
            {events.map(ev => {
              const cfg = EVENT_TYPE_CONFIG[ev.type];
              const priCfg = PRIORITY_CONFIG[ev.priority];
              return (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="rounded-xl border border-slate-100 overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                      <cfg.Icon size={14} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900 leading-snug">{ev.title}</p>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => onEdit(ev)} className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Edit2 size={12} />
                          </button>
                          <button onClick={() => setConfirmDelete(ev.id)} className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${priCfg.color}15`, color: priCfg.color }}>{priCfg.label}</span>
                        {ev.startTime && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock size={10} /> {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}
                          </span>
                        )}
                      </div>
                      {ev.location && (
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <MapPin size={10} /> {ev.location}
                        </p>
                      )}
                      {ev.description && (
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{ev.description}</p>
                      )}
                      {(ev.reminderBefore !== 'none' || ev.repeat !== 'none') && (
                        <div className="flex gap-3 mt-2">
                          {ev.reminderBefore !== 'none' && (
                            <span className="text-xs text-amber-600 flex items-center gap-1"><Bell size={9} /> {REMINDER_LABELS[ev.reminderBefore]}</span>
                          )}
                          {ev.repeat !== 'none' && (
                            <span className="text-xs text-indigo-600 flex items-center gap-1"><Repeat size={9} /> {REPEAT_LABELS[ev.repeat]}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delete confirm */}
                  <AnimatePresence>
                    {confirmDelete === ev.id && (
                      <motion.div
                        initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                        className="overflow-hidden border-t border-red-100 bg-red-50"
                      >
                        <div className="flex items-center gap-3 px-4 py-3">
                          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                          <span className="text-xs text-red-700 font-medium flex-1">Delete this event?</span>
                          <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded transition-colors">Cancel</button>
                          <button onClick={() => onDelete(ev.id)} className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors">Delete</button>
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
