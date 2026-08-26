import React, { useState, useEffect, Fragment } from 'react';
import BookingModal from '../components/BookingModal';
import PageHeader from '../components/ui/PageHeader';
import styles from './Movement.module.css';

export default function Movement() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [selectedDay, setSelectedDay] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  useEffect(() => {
    // In a real app, we'd pass ?start=...&end=... for the current week
    // For now, just grab all public sessions
    fetch('/api/classes/timetable')
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        if (data.length > 0) setActiveSession(data[0]);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const uniqueDays = ['All', ...new Set(sessions.map(s => new Date(s.startTime).toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()))];
  const uniqueTypes = ['All', ...new Set(sessions.map(s => s.classType?.name).filter(Boolean))];

  const filteredSessions = sessions.filter(s => {
    const dayMatch = selectedDay === 'All' || new Date(s.startTime).toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase() === selectedDay;
    const typeMatch = selectedType === 'All' || s.classType?.name === selectedType;
    return dayMatch && typeMatch;
  });

  // Update active session if current active session is filtered out
  useEffect(() => {
    if (filteredSessions.length > 0 && (!activeSession || !filteredSessions.find(s => s._id === activeSession._id))) {
      setActiveSession(filteredSessions[0]);
    }
  }, [selectedDay, selectedType]); // only run when filters change

  const groupSessions = (sessions) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const groups = {};
    sessions.forEach(session => {
      const sessionDate = new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      const diffTime = sessionDate - now;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let groupName = '';
      if (diffDays < 0) {
        groupName = 'Past';
      } else if (diffDays <= 7) {
        groupName = 'This Week';
      } else if (diffDays <= 14) {
        groupName = 'Next Week';
      } else {
        groupName = 'Upcoming';
      }
      
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(session);
    });
    
    // order of groups: This Week, Next Week, Upcoming, Past
    const order = ['This Week', 'Next Week', 'Upcoming', 'Past'];
    return order.map(name => ({ name, sessions: groups[name] || [] })).filter(g => g.sessions.length > 0);
  };

  const groupedSessions = groupSessions(filteredSessions);

  return (
    <div className={styles.container}>
      <PageHeader 
        eyebrow="The Studio"
        title="Movement"
        description="Book your spot in our signature classes."
      />

      <div className={styles.timetable}>
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>Loading timetable...</p>
        ) : sessions.length === 0 ? (
          <p style={{ padding: '2rem', textAlign: 'center' }}>No classes scheduled right now. Check back soon!</p>
        ) : (
          <>
            <div className={styles.filterBar}>
              <div className={styles.vaDayNav}>
                {uniqueDays.map(day => (
                  <button 
                    key={day} 
                    className={`${styles.vaDay} ${selectedDay === day ? styles.vaDayOn : ''}`}
                    onClick={() => setSelectedDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <div className={styles.vcFilters}>
                {uniqueTypes.map(type => (
                  <button 
                    key={type} 
                    className={`${styles.vcFilt} ${selectedType === type ? styles.vcFiltOn : ''}`}
                    onClick={() => setSelectedType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {filteredSessions.length === 0 ? (
              <p style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--taupe)' }}>No classes match your selected filters.</p>
            ) : (
              <>
                {/* Desktop Variant C */}
                <div className={styles.vc}>
                  <div className={styles.vcLeft}>
                    <div className={styles.vcHeader}>
                      <div className={styles.vcHLeft}>
                        <div className={styles.vcEyebrow}>The Studio</div>
                        <div className={styles.vcTitle}>Upcoming <em>classes</em></div>
                      </div>
                    </div>
                    <div className={styles.vcList}>
                      {groupedSessions.map(group => (
                        <div key={group.name} className={styles.vcGroup}>
                          <div className={styles.vcGroupHeader}>
                            {group.name}
                          </div>
                          {group.sessions.map((session, i) => {
                            const dStr = new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
                            const prevStr = i > 0 ? new Date(group.sessions[i - 1].startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : null;
                            const isNewDay = dStr !== prevStr;
                            return (
                              <Fragment key={session._id}>
                                {isNewDay && (
                                  <div className={styles.vcDaySubheader}>{dStr}</div>
                                )}
                                <div 
                                  className={`${styles.vcRow} ${activeSession?._id === session._id ? styles.vcRowActive : ''}`}
                                  onClick={() => setActiveSession(session)}
                                >
                                  <div className={styles.vcTimeCol}>
                                    <div className={styles.vcHour}>{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[0]}</div>
                                    <div className={styles.vcAmPm}>{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).split(' ')[1]}</div>
                                    <div className={styles.vcDate}>
                                      {new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short' })}<br/>
                                      {new Date(session.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </div>
                                  </div>
                                  <div className={styles.vcMid}>
                                    <div className={styles.vcRowType}>{session.classType?.name} · {session.classType?.durationMinutes} min</div>
                                    <div className={styles.vcRowName}>{session.classType?.name}</div>
                                    <div className={styles.vcRowInst}>with {session.instructor?.firstName} {session.instructor?.lastName}</div>
                                  </div>
                                  <div className={styles.vcRightCol}>
                                    <div className={`${styles.vcSpotsBadge} ${session.maxCapacity - session.bookedCount < 3 ? styles.hot : styles.good}`}>
                                      {session.maxCapacity - session.bookedCount} left
                                    </div>
                                    <div className={styles.vcLvl}>{session.classType?.level === 'all-levels' ? 'All levels' : session.classType?.level}</div>
                                  </div>
                                </div>
                              </Fragment>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {activeSession && (
                    <div className={styles.vcDetail}>
                      <div className={styles.vcDetImg}>
                        <img 
                          src={activeSession.classType?.coverImage || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600"} 
                          alt={activeSession.classType?.name} 
                        />
                      </div>
                      <div className={styles.vcDetBody}>
                        <div className={styles.vcDetTime}>
                          {new Date(activeSession.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()} · {new Date(activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {activeSession.classType?.durationMinutes} min
                        </div>
                        <div className={styles.vcDetName}>{activeSession.classType?.name}</div>
                        <div className={styles.vcDetType}>{activeSession.classType?.name} · {activeSession.classType?.level === 'all-levels' ? 'All levels' : activeSession.classType?.level}</div>
                        
                        <div className={styles.vcDetInstRow}>
                          <div className={styles.vcDetAvatar}>
                            {activeSession.instructor?.firstName?.[0] || ''}{activeSession.instructor?.lastName?.[0] || ''}
                          </div>
                          <div className={styles.vcDetIname}>{activeSession.instructor?.firstName} {activeSession.instructor?.lastName}</div>
                        </div>

                        <div className={styles.vcDetStats}>
                          <div className={styles.vcDetStat}>
                            <div className={styles.vcDetStatVal}>{activeSession.maxCapacity - activeSession.bookedCount}</div>
                            <div className={styles.vcDetStatLbl}>Spots left</div>
                          </div>
                          <div className={styles.vcDetStat}>
                            <div className={styles.vcDetStatVal}>{activeSession.classType?.durationMinutes}m</div>
                            <div className={styles.vcDetStatLbl}>Duration</div>
                          </div>
                        </div>

                        <button className={styles.vcDetBtn} onClick={() => setSelectedSession(activeSession)}>Book this class &rarr;</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Variant A */}
                <div className={styles.vaRailWrapper}>
                  {groupedSessions.map(group => {
                    const daysMap = {};
                    group.sessions.forEach(s => {
                      const d = new Date(s.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
                      if (!daysMap[d]) daysMap[d] = [];
                      daysMap[d].push(s);
                    });
                    const daysArr = Object.entries(daysMap);

                    return (
                      <div key={group.name} className={styles.vaRailGroup}>
                        <div className={styles.vaGroupHeader}>
                          {group.name}
                        </div>
                        {daysArr.map(([dayStr, daySessions]) => (
                          <div key={dayStr} className={styles.vaDayGroup}>
                            <div className={styles.vaDaySubheader}>{dayStr}</div>
                            <div className={styles.vaRail}>
                              {daySessions.map(session => (
                                <div 
                                  key={session._id} 
                                  className={styles.vaCard}
                                  onClick={() => setSelectedSession(session)}
                                >
                                  <div className={styles.vaCardImg}>
                                    <img 
                                      src={session.classType?.coverImage || "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600"} 
                                      alt={session.classType?.name} 
                                    />
                                    <div className={`${styles.vaSpots} ${session.maxCapacity - session.bookedCount < 3 ? styles.hot : styles.good}`}>
                                      {session.maxCapacity - session.bookedCount} spots left
                                    </div>
                                  </div>
                                  <div className={styles.vaCardBody}>
                                    <div className={styles.vaCardHeader}>
                                      <div className={styles.vaCardDate}>
                                        {new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
                                      </div>
                                      <div className={styles.vaCardTime}>
                                        {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </div>
                                    </div>
                                    <div className={styles.vaCardType}>{session.classType?.name}</div>
                                    <div className={styles.vaCardName}>{session.classType?.name}</div>
                                    <div className={styles.vaCardInst}>with {session.instructor?.firstName} {session.instructor?.lastName}</div>
                                    
                                    <div className={styles.vaCardFoot}>
                                      <div className={styles.vaLevel}>{session.classType?.level === 'all-levels' ? 'All levels' : session.classType?.level}</div>
                                      <button className={styles.vaBook} onClick={() => setSelectedSession(session)}>Book</button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {selectedSession && (
        <BookingModal 
          session={selectedSession} 
          onClose={() => setSelectedSession(null)} 
        />
      )}
    </div>
  );
}
