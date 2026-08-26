import React, { useState, useEffect, Fragment } from 'react';
import BookingModal from '../components/BookingModal';
import PageHeader from '../components/ui/PageHeader';
import styles from './Movement.module.css';

export default function Movement() {
  const [classTypes, setClassTypes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedClassType, setSelectedClassType] = useState(null);
  const [selectedSessionToBook, setSelectedSessionToBook] = useState(null);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
  const [viewMode, setViewMode] = useState('calendar');

  useEffect(() => {
    Promise.all([
      fetch('/api/classes/types').then(res => res.json()),
      fetch('/api/classes/timetable').then(res => res.json())
    ])
    .then(([typesData, sessionsData]) => {
      setClassTypes(Array.isArray(typesData) ? typesData : []);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  // Set the selected date to today when opening a class type
  useEffect(() => {
    if (selectedClassType) {
      const today = new Date();
      setSelectedCalendarDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    }
  }, [selectedClassType]);

  const getGroupedSessionsByISO = () => {
    if (!selectedClassType) return {};
    
    const filtered = sessions.filter(s => s.classType?._id === selectedClassType._id);
    const groups = {};
    
    filtered.forEach(s => {
      const dateObj = new Date(s.startTime);
      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(s);
    });
    
    return groups;
  };

  const groupedSessions = getGroupedSessionsByISO();

  // Calendar Logic
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(new Date(year, month, i));
  }
  // padding end to make it a full grid (multiple of 7)
  while (calendarDays.length % 7 !== 0) {
    calendarDays.push(null);
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const getIsoDate = (d) => {
    if (!d) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const selectedDateStr = getIsoDate(selectedCalendarDate);
  const selectedDaySessions = selectedDateStr ? (groupedSessions[selectedDateStr] || []) : [];

  return (
    <div className={styles.pageContainer}>
      <PageHeader 
        title="Movement" 
        subtitle="One Rhythm. Move with intention."
        backgroundImage="https://images.unsplash.com/photo-1599901860904-17e08c2d28f8?auto=format&fit=crop&q=80&w=2000"
      />

      <div className={styles.container}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--taupe)' }}>Loading classes...</div>
        ) : !selectedClassType ? (
          // View 1: Available Class Types
          <div className={styles.typesGrid}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--cocoa-deep)', marginBottom: '1rem' }}>Select a Class</h2>
              <p style={{ color: 'var(--taupe)', maxWidth: '600px', margin: '0 auto' }}>Choose from our signature movement and wellness practices to view available dates and times.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
              {classTypes.map(type => (
                <div 
                  key={type._id} 
                  className={styles.typeCard}
                  onClick={() => setSelectedClassType(type)}
                  style={{ cursor: 'pointer', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#FFFDF9', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(200, 155, 74, 0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ height: '200px', width: '100%', background: '#eaeaea', overflow: 'hidden' }}>
                    <img 
                      src={type.coverImage || 'https://images.unsplash.com/photo-1599901860904-17e08c2d28f8?auto=format&fit=crop&q=80&w=800'} 
                      alt={type.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'var(--cocoa-deep)' }}>{type.name}</h3>
                      <span style={{ fontSize: '0.75rem', background: '#FAF6EF', padding: '4px 10px', borderRadius: 'var(--radius-md)', color: 'var(--taupe)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{type.durationMinutes} MIN</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--taupe)', lineHeight: 1.5, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {type.description}
                    </p>
                    <div style={{ fontSize: '0.8rem', color: 'var(--rust)', fontWeight: 600, textTransform: 'uppercase' }}>
                      View Available Dates &rarr;
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // View 2: Class Timetable
          <div className={styles.timetableSection}>
            <button 
              onClick={() => setSelectedClassType(null)}
              style={{ background: 'none', border: 'none', color: 'var(--taupe)', fontSize: '0.9rem', cursor: 'pointer', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              &larr; Back to all classes
            </button>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', marginBottom: '3rem', alignItems: 'center' }}>
              <div style={{ flex: '1 1 400px' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--cocoa-deep)', marginBottom: '1rem' }}>{selectedClassType.name}</h2>
                <p style={{ color: 'var(--taupe)', fontSize: '1.1rem', lineHeight: 1.6 }}>{selectedClassType.description}</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <span style={{ padding: '6px 12px', background: '#FAF6EF', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--cocoa-deep)' }}>{selectedClassType.durationMinutes} Minutes</span>
                  <span style={{ padding: '6px 12px', background: '#FAF6EF', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--cocoa-deep)' }}>Intensity: {selectedClassType.intensityLevel || 'All Levels'}/5</span>
                </div>
              </div>
              <div style={{ flex: '1 1 300px', height: '300px', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                 <img src={selectedClassType.coverImage || 'https://images.unsplash.com/photo-1599901860904-17e08c2d28f8?auto=format&fit=crop&q=80&w=800'} alt={selectedClassType.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>

            {/* Toggle UI */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(227, 211, 184, 0.6)', paddingBottom: '1rem', marginBottom: '2rem' }}>
              <h3 style={{ margin: 0, color: 'var(--cocoa-deep)', fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>Available Dates</h3>
              <div style={{ display: 'flex', background: '#FFFDF9', border: '1px solid rgba(227, 211, 184, 0.9)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
                <button 
                  onClick={() => setViewMode('list')}
                  style={{ background: viewMode === 'list' ? 'var(--cocoa-deep)' : 'transparent', color: viewMode === 'list' ? '#FFF' : 'var(--cocoa-deep)', border: 'none', padding: '6px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s ease' }}
                >
                  List View
                </button>
                <button 
                  onClick={() => setViewMode('calendar')}
                  style={{ background: viewMode === 'calendar' ? 'var(--cocoa-deep)' : 'transparent', color: viewMode === 'calendar' ? '#FFF' : 'var(--cocoa-deep)', border: 'none', padding: '6px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s ease' }}
                >
                  Calendar View
                </button>
              </div>
            </div>

            {viewMode === 'calendar' ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '1rem' }}>
                {/* Left Column: Calendar Grid */}
                <div style={{ flex: '1 1 350px', background: '#FFFDF9', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(227, 211, 184, 0.6)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <button onClick={prevMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--cocoa-deep)' }}>&larr;</button>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--cocoa-deep)' }}>
                      {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button onClick={nextMonth} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--cocoa-deep)' }}>&rarr;</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} style={{ fontSize: '0.8rem', color: 'var(--taupe)', fontWeight: 600 }}>{day}</div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                    {calendarDays.map((dateObj, idx) => {
                      if (!dateObj) return <div key={idx} style={{ padding: '10px 0' }}></div>;
                      
                      const iso = getIsoDate(dateObj);
                      const hasSessions = groupedSessions[iso] && groupedSessions[iso].length > 0;
                      const isSelected = selectedDateStr === iso;
                      const isToday = getIsoDate(new Date()) === iso;

                      return (
                        <button 
                          key={idx}
                          onClick={() => setSelectedCalendarDate(dateObj)}
                          style={{
                            background: isSelected ? 'var(--cocoa-deep)' : (hasSessions ? '#FAF6EF' : 'transparent'),
                            color: isSelected ? '#FFF' : (hasSessions ? 'var(--cocoa-deep)' : 'var(--taupe)'),
                            border: isToday && !isSelected ? '1px solid var(--cocoa-deep)' : '1px solid transparent',
                            borderRadius: 'var(--radius-md)',
                            padding: '12px 0',
                            cursor: 'pointer',
                            fontSize: '0.95rem',
                            fontWeight: hasSessions || isSelected ? 600 : 400,
                            position: 'relative',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {dateObj.getDate()}
                          {hasSessions && !isSelected && (
                            <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--rust)' }}></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Column: Selected Date Sessions */}
                <div style={{ flex: '1 1 400px' }}>
                  {selectedCalendarDate ? (
                    <div style={{ background: '#FFFDF9', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(227, 211, 184, 0.6)' }}>
                      <h4 style={{ color: 'var(--cocoa-deep)', fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #FAF6EF', paddingBottom: '0.5rem' }}>
                        {selectedCalendarDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h4>
                      
                      {selectedDaySessions.length === 0 ? (
                        <div style={{ color: 'var(--taupe)', padding: '2rem 0', textAlign: 'center', fontStyle: 'italic', fontSize: '0.95rem' }}>
                          No sessions scheduled for this date.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {selectedDaySessions.map(session => (
                            <div key={session._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem', background: '#FAF6EF', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--rust)' }}>
                              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--cocoa-deep)' }}>
                                  {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div>
                                  <div style={{ fontSize: '1rem', color: 'var(--cocoa-deep)', fontWeight: 500 }}>{session.instructor?.firstName} {session.instructor?.lastName}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>{session.venueSpace?.name || 'Main Studio'}</div>
                                </div>
                              </div>
                              <button 
                                onClick={() => setSelectedSessionToBook(session)}
                                disabled={session.bookedCount >= session.capacity}
                                style={{ 
                                  background: session.bookedCount >= session.capacity ? 'transparent' : 'var(--cocoa-deep)', 
                                  color: session.bookedCount >= session.capacity ? 'var(--taupe)' : '#FFF', 
                                  border: session.bookedCount >= session.capacity ? '1px solid var(--taupe)' : 'none',
                                  padding: '8px 16px', 
                                  borderRadius: 'var(--radius-sm)', 
                                  fontSize: '0.8rem', 
                                  cursor: session.bookedCount >= session.capacity ? 'not-allowed' : 'pointer',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em',
                                  width: '100%',
                                  maxWidth: '140px'
                                }}
                              >
                                {session.bookedCount >= session.capacity ? 'Waitlist' : 'Book Session'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--taupe)', border: '1px dashed rgba(227, 211, 184, 0.6)', borderRadius: 'var(--radius-md)', minHeight: '300px' }}>
                      Select a date on the calendar to view sessions.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
                {Object.keys(groupedSessions).length === 0 ? (
                  <div style={{ padding: '3rem', background: '#FFFDF9', textAlign: 'center', borderRadius: 'var(--radius-md)', color: 'var(--taupe)', border: '1px dashed rgba(227, 211, 184, 0.8)' }}>
                    No upcoming sessions scheduled for {selectedClassType.name}. Please check back later.
                  </div>
                ) : (
                  Object.entries(groupedSessions).sort((a, b) => new Date(a[0]) - new Date(b[0])).map(([dateStr, daySessions]) => {
                    const dateObj = new Date(dateStr);
                    // Avoid timezone shift issues by explicitly parsing
                    const [y, m, d] = dateStr.split('-');
                    const localDate = new Date(y, m - 1, d);
                    const formattedDate = localDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                    return (
                      <div key={dateStr} style={{ background: '#FFFDF9', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: 'var(--radius-md)', padding: '1.5rem' }}>
                        <h4 style={{ color: 'var(--cocoa-deep)', fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #FAF6EF', paddingBottom: '0.5rem' }}>{formattedDate}</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          {daySessions.map(session => (
                            <div key={session._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem', background: '#FAF6EF', borderRadius: 'var(--radius-md)' }}>
                              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--cocoa-deep)', width: '90px' }}>
                                  {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <div>
                                  <div style={{ fontSize: '1rem', color: 'var(--cocoa-deep)', fontWeight: 500 }}>{session.instructor?.firstName} {session.instructor?.lastName}</div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>{session.venueSpace?.name || 'Main Studio'}</div>
                                </div>
                              </div>
                              <button 
                                onClick={() => setSelectedSessionToBook(session)}
                                disabled={session.bookedCount >= session.capacity}
                                style={{ 
                                  background: session.bookedCount >= session.capacity ? 'transparent' : 'var(--cocoa-deep)', 
                                  color: session.bookedCount >= session.capacity ? 'var(--taupe)' : '#FFF', 
                                  border: session.bookedCount >= session.capacity ? '1px solid var(--taupe)' : 'none',
                                  padding: '10px 20px', 
                                  borderRadius: 'var(--radius-sm)', 
                                  fontSize: '0.85rem', 
                                  cursor: session.bookedCount >= session.capacity ? 'not-allowed' : 'pointer',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}
                              >
                                {session.bookedCount >= session.capacity ? 'Waitlist' : 'Book Session'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {selectedSessionToBook && (
        <BookingModal 
          session={selectedSessionToBook} 
          onClose={() => setSelectedSessionToBook(null)}
          onSuccess={() => {
            // Optional: Refresh timetable data here
            setSelectedSessionToBook(null);
          }}
        />
      )}
    </div>
  );
}
