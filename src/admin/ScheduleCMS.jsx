import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import styles from './CMS.module.css';
import Modal from '../components/ui/Modal';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

// Helper to get the Monday of any date's week
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Format hour for display (e.g. 6 -> "6 AM", 12 -> "12 PM", 18 -> "6 PM")
function formatHour(h) {
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH} ${period}`;
}

// Resilient YYYY-MM-DD local date string
function formatLocalDateStr(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ScheduleCMS() {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // View state: 'week' | 'day' | 'list' | 'form'
  const [viewMode, setViewMode] = useState('week');
  const [currentMonday, setCurrentMonday] = useState(() => getMonday(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  // Filter states
  const [locationFilter, setLocationFilter] = useState('all');
  const [classTypeFilter, setClassTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // For list view

  // Quick Action Modal for a clicked session
  const [quickSession, setQuickSession] = useState(null);

  // General Modal State
  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null, 
    isAlert: false,
    customActions: null
  });

  // Active studio spaces from database
  const studioSpaces = useMemo(() => {
    const list = spaces.filter(s => (s.isClassStudio ?? (s.spaceType === 'studio')) && (s.isActive ?? true));
    if (list.length === 0) {
      return [
        { _id: 'studio-a', name: 'Studio A', defaultCapacity: 14, colorTag: '#C89B4A' },
        { _id: 'studio-b', name: 'Studio B', defaultCapacity: 16, colorTag: '#A4451F' },
        { _id: 'the-studio', name: 'The Studio', defaultCapacity: 20, colorTag: '#414F36' }
      ];
    }
    return list;
  }, [spaces]);

  const spaceColorMap = useMemo(() => {
    const map = {
      'Studio A': '#C89B4A',
      'Studio B': '#A4451F',
      'The Studio': '#414F36',
      'The Loft': '#2A1D14',
      'The Café': '#8C5815'
    };
    spaces.forEach(s => {
      if (s.name) map[s.name] = s.colorTag || map[s.name] || '#C89B4A';
    });
    return map;
  }, [spaces]);

  const getInitialForm = (prefillLocation) => {
    const defaultLoc = prefillLocation || (studioSpaces[0]?.name || 'Studio A');
    const matchedSpace = studioSpaces.find(s => s.name === defaultLoc);
    const defaultCap = matchedSpace?.defaultCapacity || matchedSpace?.capacity || 14;
    return {
      classType: '',
      instructor: '',
      location: defaultLoc,
      date: new Date().toISOString().split('T')[0],
      startTimeStr: '08:00',
      endTimeStr: '09:00',
      maxCapacity: defaultCap,
      isPublic: true,
      isRecurring: false,
      isAlreadySeries: false,
      updateSeries: false,
      frequency: 'weekly',
      daysOfWeek: [new Date().getDay()],
      repeatEndType: 'count', // 'count' | 'until'
      repeatCount: 4,
      repeatUntil: ''
    };
  };

  const [formData, setFormData] = useState(getInitialForm());
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [sesRes, clsRes, instRes, spcRes] = await Promise.all([
        authFetch('/api/classes'),
        authFetch('/api/cms/class-types'),
        authFetch('/api/cms/instructors'),
        authFetch('/api/cms/venue-spaces')
      ]);
      if (sesRes.ok) setSessions(await sesRes.json());
      if (clsRes.ok) setClassTypes(await clsRes.json());
      if (instRes.ok) setInstructors(await instRes.json());
      if (spcRes.ok) setSpaces(await spcRes.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  // Generate 7 days of the active week
  const weekDays = useMemo(() => {
    return [0, 1, 2, 3, 4, 5, 6].map(i => {
      const d = new Date(currentMonday);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentMonday]);

  // Date range label: e.g. "Aug 18 – Aug 24, 2026"
  const weekDateRangeLabel = useMemo(() => {
    if (weekDays.length === 0) return '';
    const first = weekDays[0];
    const last = weekDays[6];
    const firstMonth = first.toLocaleDateString(undefined, { month: 'short' });
    const lastMonth = last.toLocaleDateString(undefined, { month: 'short' });
    const firstDay = first.getDate();
    const lastDay = last.getDate();
    const year = last.getFullYear();

    if (firstMonth === lastMonth) {
      return `${firstMonth} ${firstDay} – ${lastDay}, ${year}`;
    }
    return `${firstMonth} ${firstDay} – ${lastMonth} ${lastDay}, ${year}`;
  }, [weekDays]);

  // Navigate weeks
  const handlePrevWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentMonday(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonday(getMonday(today));
    setSelectedDay(today);
  };

  // Distinct locations from studioSpaces & existing sessions
  const availableLocations = useMemo(() => {
    const set = new Set();
    studioSpaces.forEach(s => set.add(s.name));
    sessions.forEach(s => { if (s.location) set.add(s.location); });
    return Array.from(set);
  }, [studioSpaces, sessions]);

  // Filtered sessions for Calendar / List
  const filteredSessions = useMemo(() => {
    const now = new Date();
    return sessions.filter(session => {
      const className = session.classType?.name || '';
      const instructorName = `${session.instructor?.firstName || ''} ${session.instructor?.lastName || ''}`;
      const searchString = `${className} ${instructorName}`.toLowerCase();
      
      const matchesSearch = searchQuery === '' || searchString.includes(searchQuery.toLowerCase());
      const matchesLoc = locationFilter === 'all' || (session.location || 'Studio A') === locationFilter;
      const matchesType = classTypeFilter === 'all' || session.classType?._id === classTypeFilter;

      let matchesStatus = true;
      if (viewMode === 'list') {
        const isPast = new Date(session.startTime) < now;
        if (statusFilter === 'upcoming') matchesStatus = !isPast && !session.isCancelled;
        else if (statusFilter === 'past') matchesStatus = isPast && !session.isCancelled;
        else if (statusFilter === 'cancelled') matchesStatus = session.isCancelled;
        else if (statusFilter === 'series') matchesStatus = session.isRecurring === true;
      }

      return matchesSearch && matchesLoc && matchesType && matchesStatus;
    });
  }, [sessions, searchQuery, locationFilter, classTypeFilter, statusFilter, viewMode]);

  // Calculate live weekly metrics for the active week
  const weekMetrics = useMemo(() => {
    const weekStart = new Date(currentMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(currentMonday);
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setHours(0, 0, 0, 0);

    const weekSessions = filteredSessions.filter(s => {
      const st = new Date(s.startTime);
      return st >= weekStart && st < weekEnd;
    });

    const totalClasses = weekSessions.length;
    const instructorSet = new Set(weekSessions.map(s => s.instructor?._id || s.instructor).filter(Boolean));
    const totalBooked = weekSessions.reduce((acc, s) => acc + (s.bookedCount || 0), 0);
    const totalCapacity = weekSessions.reduce((acc, s) => acc + (s.maxCapacity || 14), 0);

    return {
      totalClasses,
      instructorCount: instructorSet.size,
      studioCount: studioSpaces.length,
      totalBooked,
      totalCapacity
    };
  }, [filteredSessions, currentMonday, studioSpaces]);

  // Toggle Day in recurring form
  const toggleDayOfWeek = (dayIdx) => {
    let current = [...formData.daysOfWeek];
    if (current.includes(dayIdx)) {
      if (current.length > 1) current = current.filter(d => d !== dayIdx);
    } else {
      current.push(dayIdx);
      current.sort((a, b) => a - b);
    }
    setFormData({ ...formData, daysOfWeek: current });
  };

  function getRecurrenceSummary() {
    if (!formData.isRecurring) return null;
    const daysStr = formData.daysOfWeek.map(d => FULL_DAY_NAMES[d]).join(', ');
    const timeStr = `${formData.startTimeStr} – ${formData.endTimeStr}`;
    
    let freqText = '';
    if (formData.frequency === 'daily') freqText = 'Every Day';
    else if (formData.frequency === 'weekly') freqText = `Every Week on ${daysStr}`;
    else if (formData.frequency === 'biweekly') freqText = `Every 2 Weeks on ${daysStr}`;
    else if (formData.frequency === 'monthly') freqText = 'Every Month';

    let endText = '';
    if (formData.repeatEndType === 'count') {
      endText = `for ${formData.repeatCount} occurrences`;
    } else {
      endText = formData.repeatUntil ? `until ${formData.repeatUntil}` : 'indefinitely';
    }

    return `Recurrence Rule: ${freqText} at ${timeStr}, repeating ${endText}.`;
  }

  // Open schedule form for an empty calendar slot
  const handleSlotClick = (dateObj, hour) => {
    const formattedDate = dateObj.toISOString().split('T')[0];
    const startStr = `${String(hour).padStart(2, '0')}:00`;
    const endStr = `${String(hour + 1).padStart(2, '0')}:00`;
    
    setEditingId(null);
    setFormData({
      ...getInitialForm(),
      date: formattedDate,
      startTimeStr: startStr,
      endTimeStr: endStr,
      location: locationFilter !== 'all' ? locationFilter : 'Studio A',
      daysOfWeek: [dateObj.getDay()]
    });
    setViewMode('form');
  };

  // Form Submit Handler
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTimeStr}:00`);
      const endDateTime = new Date(`${formData.date}T${formData.endTimeStr}:00`);
      
      const payload = {
        classType: formData.classType,
        instructor: formData.instructor,
        location: formData.location || 'Studio A',
        startTime: startDateTime,
        endTime: endDateTime,
        maxCapacity: formData.maxCapacity,
        isPublic: formData.isPublic,
        isRecurring: formData.isRecurring,
        updateSeries: formData.isAlreadySeries && formData.updateSeries,
        recurrence: {
          frequency: formData.frequency,
          daysOfWeek: formData.daysOfWeek,
          repeatCount: formData.repeatEndType === 'count' ? parseInt(formData.repeatCount) || 4 : undefined,
          repeatUntil: formData.repeatEndType === 'until' && formData.repeatUntil ? new Date(formData.repeatUntil) : undefined
        }
      };

      const url = editingId ? `/api/classes/${editingId}` : '/api/classes';
      const res = await authFetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(editingId ? 'Class session updated successfully.' : (result.count > 1 ? `Scheduled ${result.count} recurring sessions!` : 'Class scheduled successfully.'));
        setFormData(getInitialForm());
        setEditingId(null);
        setViewMode('week');
        loadData();
        if (result.count && result.count > 1) {
          setModalConfig({
            isOpen: true,
            title: editingId ? 'Recurring Series Created' : 'Recurring Classes Scheduled',
            message: editingId 
              ? `Successfully converted class session to a recurring series with ${result.count} total occurrences!`
              : `Successfully generated and scheduled ${result.count} class sessions!`,
            isAlert: true,
            onConfirm: null
          });
        }
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to save class session. Please check conflicts.');
        setModalConfig({ isOpen: true, title: 'Error', message: data.error || 'Failed to save class session', isAlert: true });
      }
    } catch (err) { 
      console.error(err);
      toast.error(err.message || 'An error occurred while saving the class session.');
      setModalConfig({ isOpen: true, title: 'Error', message: 'An error occurred while saving the class session.', isAlert: true });
    }
  }

  function confirmCancel(id) {
    setQuickSession(null);
    setModalConfig({
      isOpen: true,
      title: 'Cancel Class',
      message: 'Cancel this class session? This will mark the session as cancelled on the timetable.',
      isAlert: false,
      onConfirm: () => handleCancel(id)
    });
  }

  async function handleCancel(id) {
    setModalConfig({ ...modalConfig, isOpen: false });
    try {
      const res = await authFetch(`/api/classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCancelled: true, status: 'cancelled' })
      });
      if (res.ok) {
        toast.success('Class session marked as cancelled.');
        loadData();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to cancel session.');
      }
    } catch (err) { 
      console.error(err);
      toast.error('Network error cancelling session.');
    }
  }

  function confirmDelete(session) {
    setQuickSession(null);
    if (session.isRecurring && session.seriesId) {
      setModalConfig({
        isOpen: true,
        title: 'Delete Recurring Session',
        message: 'This session is part of a recurring series. Would you like to delete only this individual session or all sessions in this recurring series?',
        isAlert: false,
        customActions: (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', width: '100%' }}>
            <button className={styles.btnGhost} onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}>
              Cancel
            </button>
            <button className={styles.btnOutline} onClick={() => handleDeleteSingle(session._id)}>
              Delete This Session Only
            </button>
            <button className={styles.btnDanger} onClick={() => handleDeleteSeries(session.seriesId)}>
              Delete Entire Series
            </button>
          </div>
        )
      });
    } else {
      setModalConfig({
        isOpen: true,
        title: 'Delete Class',
        message: 'Permanently delete this scheduled class session?',
        isAlert: false,
        onConfirm: () => handleDeleteSingle(session._id),
        customActions: null
      });
    }
  }

  async function handleDeleteSingle(id) {
    setModalConfig({ ...modalConfig, isOpen: false });
    try {
      const res = await authFetch(`/api/classes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Class session deleted.');
        loadData();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to delete session.');
      }
    } catch (err) { 
      console.error(err);
      toast.error('Failed to delete session.');
    }
  }

  async function handleDeleteSeries(seriesId) {
    setModalConfig({ ...modalConfig, isOpen: false });
    try {
      const res = await authFetch(`/api/classes/series/${seriesId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Recurring series deleted.');
        loadData();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to delete series.');
      }
    } catch (err) { 
      console.error(err);
      toast.error('Failed to delete series.');
    }
  }

  function handleEdit(session) {
    setQuickSession(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingId(session._id);
    const startDate = new Date(session.startTime);
    const endDate = new Date(session.endTime);
    const isAlreadySeries = session.isRecurring && !!session.seriesId;

    setFormData({
      classType: session.classType?._id || '',
      instructor: session.instructor?._id || '',
      location: session.location || 'Studio A',
      date: startDate.toISOString().split('T')[0],
      startTimeStr: startDate.toTimeString().substring(0, 5),
      endTimeStr: endDate.toTimeString().substring(0, 5),
      maxCapacity: session.maxCapacity || 14,
      isPublic: session.isPublic !== false,
      isRecurring: isAlreadySeries,
      isAlreadySeries: isAlreadySeries,
      updateSeries: false,
      frequency: session.recurrence?.frequency || 'weekly',
      daysOfWeek: session.recurrence?.daysOfWeek && session.recurrence.daysOfWeek.length > 0 
        ? session.recurrence.daysOfWeek 
        : [startDate.getDay()],
      repeatEndType: session.recurrence?.repeatUntil ? 'until' : 'count',
      repeatCount: session.recurrence?.repeatCount || 4,
      repeatUntil: session.recurrence?.repeatUntil ? new Date(session.recurrence.repeatUntil).toISOString().split('T')[0] : ''
    });
    setViewMode('form');
  }

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--taupe)' }}>Loading timetable schedules...</div>;
  }

  return (
    <div>
      {/* ── Top Header Area ── */}
      <div className={styles.timetableTopHeader}>
        <div>
          <div className="eyebrow">MOVEMENT</div>
          <h1 className={styles.title} style={{ marginBottom: '0.25rem' }}>Timetable Schedule</h1>
          <p className={styles.timetableSubtitle}>Manage and view all classes, sessions and instructor schedules.</p>
        </div>

        {viewMode !== 'form' && (
          <button 
            className={styles.btn} 
            onClick={() => { setEditingId(null); setFormData(getInitialForm()); setViewMode('form'); }}
          >
            + Schedule New Class
          </button>
        )}
      </div>

      {/* ── Action & Filter Bar ── */}
      {viewMode !== 'form' && (
        <div className={styles.timetableActionBar}>
          <div className={styles.timetableFiltersGroup}>
            {/* Date Range Picker / Week Indicator */}
            <div className={styles.dateRangePickerBtn} onClick={() => document.getElementById('hidden-date-input').showPicker()} title="Click to select a date">
              <input 
                type="date"
                id="hidden-date-input"
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const d = new Date(e.target.value);
                  const day = d.getDay();
                  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                  const monday = new Date(d.setDate(diff));
                  monday.setHours(0,0,0,0);
                  setCurrentMonday(monday);
                }}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" x2="6" />
                <line x1="8" x2="8" y1="2" x2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              <span>{weekDateRangeLabel}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {/* Location / Studio Filter */}
            <select 
              className={styles.timetableFilterSelect} 
              value={locationFilter} 
              onChange={e => setLocationFilter(e.target.value)}
            >
              <option value="all">All Locations</option>
              {availableLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {/* Class Type Filter */}
            <select 
              className={styles.timetableFilterSelect} 
              value={classTypeFilter} 
              onChange={e => setClassTypeFilter(e.target.value)}
            >
              <option value="all">All Class Types</option>
              {classTypes.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* View Mode Switcher Group */}
          <div className={styles.viewToggleGroup}>
            <button 
              type="button" 
              className={`${styles.viewToggleBtn} ${viewMode === 'week' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('week')}
            >
              WEEK
            </button>
            <button 
              type="button" 
              className={`${styles.viewToggleBtn} ${viewMode === 'day' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => { setViewMode('day'); setSelectedDay(new Date()); }}
            >
              DAY
            </button>
            <button 
              type="button" 
              className={`${styles.viewToggleBtn} ${viewMode === 'list' ? styles.viewToggleBtnActive : ''}`}
              onClick={() => setViewMode('list')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              LIST VIEW
            </button>
          </div>
        </div>
      )}

      {/* ── 1. WEEK CALENDAR VIEW (DEFAULT) ── */}
      {viewMode === 'week' && (
        <div className={styles.timetableContainer}>
          {/* Calendar Scroll & Grid Inner Area */}
          <div className={styles.calendarOuterScroll}>
            {/* Sticky Week Navigation Header Bar */}
            <div className={styles.calendarStickyHeader}>
              {/* Prev / Next Week Navigation Column */}
              <div className={styles.weekNavArrowsHeaderCol}>
                <button 
                  type="button" 
                  className={styles.weekNavArrowBtn} 
                  onClick={handlePrevWeek}
                  title="Previous Week"
                  aria-label="Previous Week"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button 
                  type="button" 
                  className={styles.weekNavArrowBtn} 
                  onClick={handleNextWeek}
                  title="Next Week"
                  aria-label="Next Week"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>

              {/* 7 Day Column Headers */}
              {weekDays.map((dayDate, idx) => {
                const isToday = dayDate.toISOString().split('T')[0] === todayStr;
                return (
                  <div 
                    key={idx} 
                    className={styles.weekDayHeaderCell}
                    onClick={() => { setSelectedDay(dayDate); setViewMode('day'); }}
                    title="Click to switch to Day View"
                  >
                    <div className={isToday ? styles.weekDayPillActive : ''}>
                      <div className={styles.weekDayName}>
                        {dayDate.toLocaleDateString(undefined, { weekday: 'short' })}
                      </div>
                      <div className={styles.weekDayDate}>
                        {dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.calendarGridInner}>
              {/* Left Hour Labels Column */}
              <div className={styles.timeSlotLabelCol}>
                {HOURS.map(h => (
                  <div key={h} className={styles.timeSlotHourLabel}>
                    {formatHour(h)}
                  </div>
                ))}
              </div>

               {/* 7 Day Column Tracks */}
              {weekDays.map((dayDate, dayIdx) => {
                const dayDateStr = formatLocalDateStr(dayDate);

                return (
                  <div key={dayIdx} className={styles.dayColumnTrack}>
                    {HOURS.map(hour => {
                      // Find sessions that start in this exact day and hour slot
                      const slotSessions = filteredSessions.filter(session => {
                        const sDate = new Date(session.startTime);
                        const sDateStr = formatLocalDateStr(sDate);
                        const sHour = sDate.getHours();
                        return sDateStr === dayDateStr && sHour === hour;
                      });

                      // Check if this hour slot is covered by an ongoing multi-hour session starting earlier
                      const isCoveredByPrevious = filteredSessions.some(session => {
                        const sDate = new Date(session.startTime);
                        const sEnd = new Date(session.endTime);
                        const sDateStr = formatLocalDateStr(sDate);
                        if (sDateStr !== dayDateStr) return false;
                        const sStartH = sDate.getHours() + sDate.getMinutes() / 60;
                        const sEndH = sEnd.getHours() + sEnd.getMinutes() / 60;
                        return sStartH < hour && sEndH > hour;
                      });

                      const layoutClass = slotSessions.length === 0
                        ? ''
                        : slotSessions.length === 1
                          ? styles.slotLayoutSingle
                          : slotSessions.length === 2
                            ? styles.slotLayoutSplit2
                            : slotSessions.length === 3
                              ? styles.slotLayoutSplit3
                              : slotSessions.length === 4
                                ? styles.slotLayoutSplit4
                                : styles.slotLayoutSplitMany;

                      const isSplit = slotSessions.length > 1;

                      return (
                        <div 
                          key={hour} 
                          className={`${styles.hourGridCell} ${layoutClass} ${isCoveredByPrevious ? styles.hourGridCellCovered : ''}`}
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              handleSlotClick(dayDate, hour);
                            }
                          }}
                        >
                          {slotSessions.length > 0 && (
                            <button 
                              type="button" 
                              className={styles.occupiedSlotAddBtn}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSlotClick(dayDate, hour);
                              }}
                              title="Schedule another class in this time slot"
                              aria-label="Add class in this time slot"
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            </button>
                          )}

                          {slotSessions.map(session => {
                            const isPast = new Date(session.startTime) < now;
                            const coverImg = session.classType?.coverImage;
                            const start = new Date(session.startTime);
                            const end = new Date(session.endTime);
                            const durationMinutes = Math.max(30, (end.getTime() - start.getTime()) / (1000 * 60));
                            const durationHours = durationMinutes / 60;
                            const cardHeight = Math.max(86, Math.round(durationHours * 96 - 8));
                            const studioColor = spaceColorMap[session.location] || '#C89B4A';

                            const startTimeDisplay = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                            const endTimeDisplay = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

                            return (
                              <div 
                                key={session._id} 
                                className={`${styles.scheduleCardBlock} ${isPast ? styles.scheduleCardPast : ''} ${session.isCancelled ? styles.scheduleCardCancelled : ''} ${isSplit ? styles.scheduleCardBlockSplit : ''}`}
                                style={{
                                  minHeight: `${cardHeight}px`,
                                  height: `${cardHeight}px`,
                                  borderLeftColor: studioColor
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuickSession(session);
                                }}
                                title={`${session.classType?.name || 'Class'} with ${session.instructor?.firstName || ''} ${session.instructor?.lastName || ''} (${startTimeDisplay} – ${endTimeDisplay}) · ${session.location || 'Studio A'}`}
                              >
                                {session.isRecurring && (
                                  <div className={styles.scheduleCardRecurringBadge} title="Recurring series occurrence">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
                                    </svg>
                                  </div>
                                )}

                                {/* Image Strip only shown on single unclustered cards */}
                                {!isSplit && (
                                  coverImg ? (
                                    <img src={coverImg} alt="" className={styles.scheduleCardImgStrip} />
                                  ) : (
                                    <div className={styles.scheduleCardPlaceholderImg}>
                                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                        <circle cx="12" cy="5" r="2.5" /><path d="m4 17 4-5 3 2 4-7 4 3" /><path d="M9 19v-5" />
                                      </svg>
                                    </div>
                                  )
                                )}

                                {/* Content Details — always fully visible and readable */}
                                <div className={styles.scheduleCardInfo}>
                                  <div className={styles.scheduleCardTitle}>
                                    {session.classType?.name || 'Untitled Class'}
                                  </div>
                                  <div className={styles.scheduleCardInstructor}>
                                    {session.instructor?.firstName} {session.instructor?.lastName}
                                  </div>
                                  <div className={styles.scheduleCardMetaTime}>
                                    {startTimeDisplay} – {endTimeDisplay}
                                  </div>
                                  <div 
                                    className={styles.scheduleCardMetaStudio}
                                    style={{
                                      background: `${studioColor}18`,
                                      color: studioColor
                                    }}
                                  >
                                    {session.location || 'Studio A'}
                                  </div>
                                  <div className={styles.scheduleCardCapacity}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    </svg>
                                    <span>{session.bookedCount || 0}/{session.maxCapacity || 14}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Weekly Metrics Summary Footer ── */}
          <div className={styles.timetableMetricsFooter}>
            <div className={styles.metricCardItem}>
              <div className={styles.metricCardIconBox}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" x2="6" /><line x1="8" x2="8" y1="2" x2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </div>
              <div className={styles.metricCardContent}>
                <span className={styles.metricCardValue}>{weekMetrics.totalClasses}</span>
                <span className={styles.metricCardLabel}>Classes this week</span>
              </div>
            </div>

            <div className={styles.metricCardItem}>
              <div className={styles.metricCardIconBox}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                </svg>
              </div>
              <div className={styles.metricCardContent}>
                <span className={styles.metricCardValue}>{weekMetrics.instructorCount}</span>
                <span className={styles.metricCardLabel}>Instructors</span>
              </div>
            </div>

            <div className={styles.metricCardItem}>
              <div className={styles.metricCardIconBox}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className={styles.metricCardContent}>
                <span className={styles.metricCardValue}>{weekMetrics.studioCount}</span>
                <span className={styles.metricCardLabel}>Studios</span>
              </div>
            </div>

            <div className={styles.metricCardItem}>
              <div className={styles.metricCardIconBox}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className={styles.metricCardContent}>
                <span className={styles.metricCardValue}>{weekMetrics.totalBooked} / {weekMetrics.totalCapacity}</span>
                <span className={styles.metricCardLabel}>Total Booked</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. DAY VIEW (DETAILED TIME TRACKS) ── */}
      {viewMode === 'day' && (
        <div className={styles.dayViewContainer}>
          <div className={styles.dayViewHeaderBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                type="button" 
                className={styles.weekNavArrowBtn} 
                onClick={() => {
                  const prev = new Date(selectedDay);
                  prev.setDate(prev.getDate() - 1);
                  setSelectedDay(prev);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <h2 style={{ fontFamily: 'var(--f-display)', margin: 0, fontSize: '1.25rem', color: 'var(--cocoa-deep)' }}>
                {selectedDay.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              <button 
                type="button" 
                className={styles.weekNavArrowBtn} 
                onClick={() => {
                  const next = new Date(selectedDay);
                  next.setDate(next.getDate() + 1);
                  setSelectedDay(next);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
            <button className={styles.btnGhost} onClick={() => setViewMode('week')}>
              &larr; Back to Week View
            </button>
          </div>

          <div className={styles.calendarOuterScroll}>
            <div className={styles.calendarGridInner} style={{ minWidth: `${Math.max(750, 70 + studioSpaces.length * 200)}px`, gridTemplateColumns: `70px repeat(${studioSpaces.length}, 1fr)` }}>
              {/* Left Hour Column */}
              <div className={styles.timeSlotLabelCol}>
                {HOURS.map(h => (
                  <div key={h} className={styles.timeSlotHourLabel}>{formatHour(h)}</div>
                ))}
              </div>

              {/* Tracks dynamically mapped for every registered studio space */}
              {studioSpaces.map((studioSpace, sIdx) => {
                const studioName = studioSpace.name;
                const studioColor = studioSpace.colorTag || '#C89B4A';
                const dayDateStr = formatLocalDateStr(selectedDay);

                return (
                  <div key={studioSpace._id || sIdx} className={styles.dayColumnTrack}>
                    <div className={styles.dayViewStudioHeader} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: studioColor, display: 'inline-block' }}></span>
                      <span>{studioName}</span>
                    </div>
                    {HOURS.map(hour => {
                      const slotSessions = filteredSessions.filter(s => {
                        const sDate = new Date(s.startTime);
                        const sDateStr = formatLocalDateStr(sDate);
                        const sHour = sDate.getHours();
                        const sLoc = s.location || 'Studio A';
                        return sDateStr === dayDateStr && sHour === hour && sLoc === studioName;
                      });

                      const isCoveredByPrevious = filteredSessions.some(session => {
                        const sDate = new Date(session.startTime);
                        const sEnd = new Date(session.endTime);
                        const sDateStr = formatLocalDateStr(sDate);
                        const sLoc = session.location || 'Studio A';
                        if (sDateStr !== dayDateStr || sLoc !== studioName) return false;
                        const sStartH = sDate.getHours() + sDate.getMinutes() / 60;
                        const sEndH = sEnd.getHours() + sEnd.getMinutes() / 60;
                        return sStartH < hour && sEndH > hour;
                      });

                      const isSplit = slotSessions.length > 1;

                      return (
                        <div 
                          key={hour} 
                          className={`${styles.hourGridCell} ${isCoveredByPrevious ? styles.hourGridCellCovered : ''}`}
                          onClick={(e) => {
                            if (e.target === e.currentTarget) {
                              setEditingId(null);
                              setFormData({
                                ...getInitialForm(studioName),
                                date: dayDateStr,
                                startTimeStr: `${String(hour).padStart(2, '0')}:00`,
                                endTimeStr: `${String(hour + 1).padStart(2, '0')}:00`,
                                location: studioName,
                                maxCapacity: studioSpace.defaultCapacity || studioSpace.capacity || 14
                              });
                              setViewMode('form');
                            }
                          }}
                        >
                          {slotSessions.map(session => {
                            const start = new Date(session.startTime);
                            const end = new Date(session.endTime);
                            const durationMinutes = Math.max(30, (end.getTime() - start.getTime()) / (1000 * 60));
                            const durationHours = durationMinutes / 60;
                            const cardHeight = Math.max(86, Math.round(durationHours * 96 - 8));
                            const startTimeDisplay = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                            const endTimeDisplay = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

                            return (
                              <div 
                                key={session._id} 
                                className={`${styles.scheduleCardBlock} ${session.isCancelled ? styles.scheduleCardCancelled : ''} ${isSplit ? styles.scheduleCardBlockSplit : ''}`}
                                style={{
                                  minHeight: `${cardHeight}px`,
                                  height: `${cardHeight}px`,
                                  borderLeftColor: studioColor
                                }}
                                onClick={() => setQuickSession(session)}
                              >
                                {!isSplit && session.classType?.coverImage && (
                                  <img src={session.classType.coverImage} alt="" className={styles.scheduleCardImgStrip} />
                                )}
                                <div className={styles.scheduleCardInfo}>
                                  <div className={styles.scheduleCardTitle}>{session.classType?.name || 'Class'}</div>
                                  <div className={styles.scheduleCardInstructor}>{session.instructor?.firstName} {session.instructor?.lastName}</div>
                                  <div className={styles.scheduleCardMetaTime}>
                                    {startTimeDisplay} – {endTimeDisplay}
                                  </div>
                                  <div className={styles.scheduleCardCapacity}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '3px' }}>
                                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    </svg>
                                    <span>{session.bookedCount || 0}/{session.maxCapacity || 14} Booked</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. LIST VIEW (AUDIT & BULK MANAGEMENT) ── */}
      {viewMode === 'list' && (
        <>
          <div className={styles.actionBar}>
            <div className={styles.filterGroup}>
              <input 
                type="text" 
                placeholder="Search by class or instructor..." 
                className={styles.searchInput} 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
              />
              <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Sessions ({sessions.length})</option>
                <option value="upcoming">Upcoming Only</option>
                <option value="past">Past / Expired Only</option>
                <option value="cancelled">Cancelled Only</option>
                <option value="series">Recurring Series Only</option>
              </select>
            </div>
          </div>

          <div className={styles.list}>
            {filteredSessions.map(session => {
              const isPast = new Date(session.startTime) < now;
              return (
                <div 
                  key={session._id} 
                  className={`${styles.listItem} ${session.isCancelled ? styles.inactive : ''} ${isPast ? styles.pastItem : ''}`}
                >
                  <div className={styles.itemContent}>
                    <div className={styles.itemTitle}>
                      <strong>{session.classType?.name || 'Untitled Class'}</strong>
                      <span style={{ color: 'var(--taupe)', fontWeight: 400 }}>with</span>
                      <span>{session.instructor?.firstName} {session.instructor?.lastName}</span>
                      
                      <span className={styles.badge} style={{ background: '#FAF6EF', color: 'var(--cocoa-deep)', border: '1px solid var(--line)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{session.location || 'Studio A'}</span>
                      </span>

                      {session.isRecurring && (
                        <span className={styles.recurringBadge} title="Recurring series occurrence" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
                          </svg>
                          <span>{session.recurrence?.frequency || 'Series'}</span>
                        </span>
                      )}
                      
                      {session.isCancelled && (
                        <span className={styles.badge} style={{ background: 'rgba(217, 83, 79, 0.15)', color: '#d9534f' }}>
                          CANCELLED
                        </span>
                      )}
                      
                      {!session.isCancelled && isPast && (
                        <span className={styles.pastBadge}>PAST SESSION</span>
                      )}

                      {!session.isCancelled && !isPast && (
                        <span className={styles.upcomingBadge}>UPCOMING</span>
                      )}
                    </div> 
                    
                    <div className={styles.meta}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" x2="6" /><line x1="8" x2="8" y1="2" x2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                        </svg>
                        <span>{new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>{new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} – {new Date(session.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        </svg>
                        <span>{session.bookedCount || 0}/{session.maxCapacity} Booked</span>
                      </span>
                      {!session.isPublic && <span style={{ color: 'var(--rust)', fontStyle: 'italic' }}>(Hidden from public)</span>}
                    </div>
                  </div>

                  <div className={styles.itemActions}>
                    <button onClick={() => handleEdit(session)} className={styles.btnOutline}>Edit</button>
                    {!session.isCancelled && !isPast && (
                      <button onClick={() => confirmCancel(session._id)} className={styles.btnGhost}>Cancel Class</button>
                    )}
                    <button onClick={() => confirmDelete(session)} className={styles.btnDanger}>Delete</button>
                  </div>
                </div>
              );
            })}
            {filteredSessions.length === 0 && <p className={styles.empty}>No class sessions found matching your search or filters.</p>}
          </div>
        </>
      )}

      {/* ── 4. SCHEDULING FORM VIEW ── */}
      {viewMode === 'form' && (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <button className={styles.btnGhost} onClick={() => setViewMode('week')}>&larr; Back to Calendar</button>
          </div>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{editingId ? 'Edit Session' : 'Schedule New Class'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Class Type *</label>
                  <select value={formData.classType} onChange={e => setFormData({...formData, classType: e.target.value})} required>
                    <option value="">Select Class Type...</option>
                    {classTypes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Instructor *</label>
                  <select value={formData.instructor} onChange={e => setFormData({...formData, instructor: e.target.value})} required>
                    <option value="">Select Instructor...</option>
                    {instructors.map(i => <option key={i._id} value={i._id}>{i.firstName} {i.lastName}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Studio Location *</label>
                  <select 
                    value={formData.location} 
                    onChange={e => {
                      const newLoc = e.target.value;
                      const matched = studioSpaces.find(s => s.name === newLoc);
                      const defaultCap = matched?.defaultCapacity || matched?.capacity || 14;
                      setFormData({
                        ...formData, 
                        location: newLoc,
                        maxCapacity: formData.maxCapacity === 14 || !formData.maxCapacity ? defaultCap : formData.maxCapacity
                      });
                    }} 
                    required
                  >
                    {studioSpaces.map(s => (
                      <option key={s._id || s.slug || s.name} value={s.name}>
                        {s.name} (Cap: {s.defaultCapacity || s.capacity || 14})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>{formData.isRecurring ? 'First Session Date *' : 'Date *'}</label>
                  <input 
                    type="date" 
                    value={formData.date} 
                    onChange={e => {
                      const newDate = e.target.value;
                      const dayOfWeek = new Date(newDate).getDay();
                      setFormData({
                        ...formData, 
                        date: newDate,
                        daysOfWeek: formData.daysOfWeek.length === 0 ? [dayOfWeek] : formData.daysOfWeek
                      });
                    }} 
                    required 
                  />
                </div>
                <div className={styles.field}>
                  <label>Start Time *</label>
                  <input type="time" value={formData.startTimeStr} onChange={e => setFormData({...formData, startTimeStr: e.target.value})} required />
                </div>
                <div className={styles.field}>
                  <label>End Time *</label>
                  <input type="time" value={formData.endTimeStr} onChange={e => setFormData({...formData, endTimeStr: e.target.value})} required />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Max Capacity *</label>
                  <input type="number" min="1" max="100" value={formData.maxCapacity} onChange={e => setFormData({...formData, maxCapacity: Number(e.target.value)})} required />
                </div>
                <div className={styles.checkboxField} style={{ marginTop: '2rem' }}>
                  <input type="checkbox" id="isPublic" checked={formData.isPublic} onChange={e => setFormData({...formData, isPublic: e.target.checked})} />
                  <label htmlFor="isPublic">Visible on Public Timetable</label>
                </div>
              </div>

              {/* ── Recurring Engine Controls ── */}
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(227, 211, 184, 0.4)', paddingTop: '1.25rem' }}>
                <div className={styles.checkboxField} style={{ marginBottom: '0.75rem' }}>
                  <input 
                    type="checkbox" 
                    id="isRecurring" 
                    checked={formData.isRecurring} 
                    onChange={e => setFormData({...formData, isRecurring: e.target.checked})} 
                  />
                  <label htmlFor="isRecurring" style={{ fontWeight: 600, color: 'var(--cocoa-deep)' }}>
                    {formData.isAlreadySeries 
                      ? 'Recurring Class Series (Active)' 
                      : editingId 
                        ? 'Repeat this Class (Convert to Recurring Schedule)'
                        : 'Repeat this Class (Recurring Schedule)'}
                  </label>
                </div>

                {formData.isRecurring && (
                  <div className={styles.recurringBox}>
                    {formData.isAlreadySeries && (
                      <div className={styles.checkboxField} style={{ paddingBottom: '0.75rem', borderBottom: '1px dashed rgba(200, 155, 74, 0.3)' }}>
                        <input 
                          type="checkbox" 
                          id="updateSeries" 
                          checked={formData.updateSeries} 
                          onChange={e => setFormData({...formData, updateSeries: e.target.checked})} 
                        />
                        <label htmlFor="updateSeries" style={{ fontWeight: 500, color: 'var(--cocoa-deep)' }}>
                          Apply changes (instructor, time, capacity, studio) to all future sessions in this series
                        </label>
                      </div>
                    )}

                    {!formData.isAlreadySeries && (
                      <>
                        <div className={styles.row}>
                          <div className={styles.field}>
                            <label>Frequency</label>
                            <select 
                              value={formData.frequency} 
                              onChange={e => setFormData({...formData, frequency: e.target.value})}
                            >
                              <option value="weekly">Every Week</option>
                              <option value="biweekly">Every 2 Weeks (Bi-Weekly)</option>
                              <option value="daily">Every Day (Daily)</option>
                              <option value="monthly">Every Month (Monthly)</option>
                            </select>
                          </div>

                          <div className={styles.field}>
                            <label>Repeat Ends</label>
                            <select 
                              value={formData.repeatEndType} 
                              onChange={e => setFormData({...formData, repeatEndType: e.target.value})}
                            >
                              <option value="count">After a set number of occurrences</option>
                              <option value="until">On a specific end date</option>
                            </select>
                          </div>
                        </div>

                        <div className={styles.row}>
                          {formData.repeatEndType === 'count' ? (
                            <div className={styles.field} style={{ maxWidth: '50%' }}>
                              <label>Total Occurrences</label>
                              <input 
                                type="number" 
                                min="2" 
                                max="24" 
                                placeholder="e.g. 4 occurrences"
                                value={formData.repeatCount} 
                                onChange={e => setFormData({...formData, repeatCount: e.target.value})} 
                                required={formData.isRecurring}
                              />
                            </div>
                          ) : (
                            <div className={styles.field} style={{ maxWidth: '50%' }}>
                              <label>Repeat Until Date</label>
                              <input 
                                type="date" 
                                value={formData.repeatUntil} 
                                min={formData.date}
                                onChange={e => setFormData({...formData, repeatUntil: e.target.value})} 
                                required={formData.isRecurring && formData.repeatEndType === 'until'}
                              />
                            </div>
                          )}
                        </div>

                        {(formData.frequency === 'weekly' || formData.frequency === 'biweekly') && (
                          <div className={styles.field}>
                            <label>Repeat On Days</label>
                            <div className={styles.dayPills}>
                              {DAY_NAMES.map((name, idx) => {
                                const isActive = formData.daysOfWeek.includes(idx);
                                return (
                                  <button
                                    type="button"
                                    key={idx}
                                    className={`${styles.dayPill} ${isActive ? styles.dayPillActive : ''}`}
                                    onClick={() => toggleDayOfWeek(idx)}
                                  >
                                    {name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className={styles.recurringPreview}>
                          {getRecurrenceSummary()}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>
                  {editingId && !formData.isAlreadySeries && formData.isRecurring
                    ? 'Update & Generate Recurring Series'
                    : editingId 
                      ? 'Update Session' 
                      : formData.isRecurring 
                        ? 'Schedule Recurring Series' 
                        : 'Schedule Class'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setEditingId(null); setFormData(getInitialForm()); setViewMode('week'); }} 
                  className={styles.btnGhost}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* ── Quick Session Action Drawer/Modal ── */}
      {quickSession && (
        <div className={styles.sessionQuickModal} onClick={() => setQuickSession(null)}>
          <div className={styles.sessionQuickCard} onClick={e => e.stopPropagation()}>
            <div style={{ height: '140px', position: 'relative', background: '#FAF6EF' }}>
              {quickSession.classType?.coverImage ? (
                <img src={quickSession.classType.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="5" r="2.5" /><path d="m4 17 4-5 3 2 4-7 4 3" /><path d="M9 19v-5" />
                  </svg>
                </div>
              )}
              <button 
                onClick={() => setQuickSession(null)}
                style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1.4rem', margin: 0, color: 'var(--cocoa-deep)' }}>
                    {quickSession.classType?.name || 'Class Session'}
                  </h3>
                  <p style={{ color: 'var(--rust)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '4px 0 0 0' }}>
                    with {quickSession.instructor?.firstName} {quickSession.instructor?.lastName}
                  </p>
                </div>
                <span className={styles.badge} style={{ background: '#FAF6EF', color: 'var(--cocoa-deep)', border: '1px solid var(--line)' }}>
                  {quickSession.location || 'Studio A'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', margin: '1rem 0', fontSize: '0.85rem', color: 'var(--cocoa)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--taupe)', flexShrink: 0 }}>
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" x2="6" /><line x1="8" x2="8" y1="2" x2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                  <span><strong>Date:</strong> {new Date(quickSession.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--taupe)', flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span><strong>Time:</strong> {new Date(quickSession.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} – {new Date(quickSession.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--taupe)', flexShrink: 0 }}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  </svg>
                  <span><strong>Capacity:</strong> {quickSession.bookedCount || 0} / {quickSession.maxCapacity || 14} Booked</span>
                </div>
                {quickSession.isRecurring && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--taupe)', flexShrink: 0 }}>
                      <path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
                    </svg>
                    <span><strong>Series:</strong> Recurring {quickSession.recurrence?.frequency || 'Weekly'}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  className={styles.btn} 
                  onClick={() => {
                    const sDate = new Date(quickSession.startTime);
                    const startStr = `${String(sDate.getHours()).padStart(2, '0')}:${String(sDate.getMinutes()).padStart(2, '0')}`;
                    const eDate = new Date(quickSession.endTime);
                    const endStr = `${String(eDate.getHours()).padStart(2, '0')}:${String(eDate.getMinutes()).padStart(2, '0')}`;
                    const dateStr = formatLocalDateStr(sDate);
                    
                    const currentLoc = quickSession.location;
                    const otherSpace = studioSpaces.find(s => s.name !== currentLoc) || studioSpaces[0];
                    const nextStudio = otherSpace?.name || 'Studio B';
                    const nextCap = otherSpace?.defaultCapacity || otherSpace?.capacity || 14;

                    setQuickSession(null);
                    setEditingId(null);
                    setFormData({
                      ...getInitialForm(nextStudio),
                      date: dateStr,
                      startTimeStr: startStr,
                      endTimeStr: endStr,
                      location: nextStudio,
                      maxCapacity: nextCap
                    });
                    setViewMode('form');
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  + ADD PARALLEL CLASS
                </button>
                <button className={styles.btnOutline} onClick={() => handleEdit(quickSession)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                  EDIT SESSION
                </button>
                {!quickSession.isCancelled && (
                  <button className={styles.btnGhost} onClick={() => confirmCancel(quickSession._id)}>
                    CANCEL CLASS
                  </button>
                )}
                <button className={styles.btnDanger} onClick={() => confirmDelete(quickSession)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  DELETE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation / Alert Modal ── */}
      <Modal 
        isOpen={modalConfig.isOpen} 
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        actions={
          modalConfig.customActions ? (
            modalConfig.customActions
          ) : modalConfig.isAlert ? (
            <button className={styles.btn} onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}>OK</button>
          ) : (
            <>
              <button className={styles.btnDanger} onClick={modalConfig.onConfirm}>Confirm</button>
              <button className={styles.btnGhost} onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}>Cancel</button>
            </>
          )
        }
      >
        <p>{modalConfig.message}</p>
      </Modal>
    </div>
  );
}
