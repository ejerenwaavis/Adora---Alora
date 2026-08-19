import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import ClerkSearch from './ClerkSearch';

export default function DashboardHome() {
  const [stats, setStats] = useState({ classesToday: 0, cafeReservationsToday: 0, eventsToday: 0 });
  const [classes, setClasses] = useState([]);
  const [nextClass, setNextClass] = useState(null);
  const [roster, setRoster] = useState([]);
  const [events, setEvents] = useState([]);
  const [nextEvent, setNextEvent] = useState(null);
  const [eventRoster, setEventRoster] = useState([]);
  const [cafeReservations, setCafeReservations] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roster');
  
  // Walk-in form state
  const { setWalkinOpen } = useOutletContext();

  const { authFetch } = useAuth();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats
        const statsRes = await authFetch('/api/clerk/dashboard');
        const statsData = await statsRes.json();
        setStats(statsData);

        // Fetch classes
        const classRes = await authFetch('/api/clerk/classes/today');
        const classData = await classRes.json();
        setClasses(classData);
        
        let targetClass = null;
        if (classData.length > 0) {
          targetClass = classData[0];
          setNextClass(targetClass);
          // Fetch roster for next class
          const rosterRes = await authFetch(`/api/clerk/classes/${targetClass._id}/roster`);
          const rosterData = await rosterRes.json();
          setRoster(rosterData);
        }

        // Fetch events
        const eventsRes = await authFetch('/api/clerk/events/upcoming');
        const eventsData = await eventsRes.json();
        setEvents(eventsData);
        
        if (eventsData.length > 0) {
          const targetEvent = eventsData[0];
          setNextEvent(targetEvent);
          const evRosterRes = await authFetch(`/api/clerk/events/${targetEvent._id}/roster`);
          const evRosterData = await evRosterRes.json();
          setEventRoster(evRosterData);
        }

        // Fetch Cafe
        const cafeRes = await authFetch('/api/clerk/cafe/today');
        const cafeData = await cafeRes.json();
        setCafeReservations(cafeData);
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [authFetch]);

  const handleCheckIn = async (bookingId) => {
    try {
      await authFetch('/api/clerk/classes/checkin', {
        method: 'POST',
        body: JSON.stringify({ bookingId })
      });
      setRoster(roster.map(b => b._id === bookingId ? { ...b, checkedInAt: new Date().toISOString() } : b));
    } catch (err) {
      console.error('Failed to check in', err);
    }
  };

  const handleVerifyEvent = async (bookingId) => {
    try {
      await authFetch('/api/clerk/events/checkin', {
        method: 'POST',
        body: JSON.stringify({ bookingId })
      });
      setEventRoster(eventRoster.map(b => b._id === bookingId ? { ...b, checkedInAt: new Date().toISOString() } : b));
    } catch (err) {
      console.error('Failed to verify guest', err);
    }
  };

  // Walk-in handler moved to modal

  const getFormatTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading dashboard...</div>;

  const checkedInCount = roster.filter(r => r.checkedInAt).length;
  const verifiedEventCount = eventRoster.filter(r => r.checkedInAt).length;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Today's overview</div>
          <div className="topbar-sub">Wednesday, 5 August 2026 · Station 1</div>
        </div>
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center' }}>
          <ClerkSearch />
          <button className="tb-btn" onClick={() => window.print()}>Print roster</button>
          <button className="tb-btn primary" onClick={() => setWalkinOpen(true)}>+ Walk-in</button>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-cell">
          <div className="stat-label">Classes today</div>
          <div className="stat-value">{stats.classesToday}</div>
          <div className="stat-sub ok">{checkedInCount} checked in</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Next class</div>
          {nextClass ? (
            <>
              <div className="stat-value-sub">{nextClass.classType?.name}</div>
              <div className="stat-sub">{getFormatTime(nextClass.startTime)} · {roster.length}/{nextClass.maxCapacity} booked</div>
              <div className="cap-bar">
                <div className={`cap-fill ${roster.length >= nextClass.maxCapacity ? 'danger' : 'warn'}`} style={{ width: `${(roster.length/nextClass.maxCapacity)*100}%` }}></div>
              </div>
            </>
          ) : (
            <div className="stat-sub">No classes today</div>
          )}
        </div>
        <div className="stat-cell">
          <div className="stat-label">Café reservations</div>
          <div className="stat-value">{stats.cafeReservationsToday}</div>
          <div className="stat-sub">2 arriving soon</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">Loft event</div>
          {nextEvent ? (
             <>
               <div className="stat-value-event">{nextEvent.title}</div>
               <div className="stat-sub danger">⚠ {eventRoster.length - verifiedEventCount} unverified guests</div>
             </>
          ) : (
             <div className="stat-sub">No upcoming events</div>
          )}
        </div>
      </div>

      {nextClass && roster.length >= nextClass.maxCapacity && (
        <div style={{ padding: '0 24px', marginTop: '4px' }}>
          <div className="alert-row">
            <div className="alert alert-danger">
              <i className="ti ti-alert-circle" aria-hidden="true"></i>
              <span className="alert-text">{nextClass.classType?.name} {getFormatTime(nextClass.startTime)} is almost full ({roster.length}/{nextClass.maxCapacity}). Walk-ins will be placed on the standby list.</span>
              <span className="alert-action">Manage</span>
            </div>
          </div>
        </div>
      )}

      <div className="content">
        {nextClass && (
          <div>
            <div className="sec-head">
              <div className="sec-title">{getFormatTime(nextClass.startTime)} · {nextClass.classType?.name} check-in</div>
              <div className="sec-count">{roster.length} booked · {checkedInCount} checked in · {Math.max(0, nextClass.maxCapacity - roster.length)} spots free</div>
            </div>
            
            <div className="tabs">
              <div className={`tab ${activeTab === 'roster' ? 'on' : ''}`} onClick={() => setActiveTab('roster')}>Booked guests</div>
              <div className={`tab ${activeTab === 'walkins' ? 'on' : ''}`} onClick={() => setActiveTab('walkins')}>Walk-ins (0)</div>
              <div className={`tab ${activeTab === 'waitlist' ? 'on' : ''}`} onClick={() => setActiveTab('waitlist')}>Standby (0)</div>
            </div>
            
            {activeTab === 'roster' && (
              <div className="guest-table">
                <div className="guest-thead">
                  <span>#</span><span>Guest</span><span>Pack / Credits</span><span>Time booked</span><span style={{textAlign: 'right'}}>Status</span>
                </div>
                {roster.map((b, i) => (
                  <div className={`guest-row ${b.checkedInAt ? 'checked' : ''}`} key={b._id}>
                    <div className="g-num">{i + 1}</div>
                    <div className="g-info">
                      <div className="g-name">{b.user?.firstName} {b.user?.lastName}</div>
                      <div className="g-type">{b.status === 'confirmed' ? 'Single booking' : 'Class pack'}</div>
                    </div>
                    <div className="g-class">1 credit</div>
                    <div className="g-time">{getFormatTime(b.createdAt)}</div>
                    <div className="g-status">
                      {b.checkedInAt ? (
                        <button className="ci-btn done" disabled>Checked in</button>
                      ) : (
                        <button className="ci-btn" onClick={() => handleCheckIn(b._id)}>Check in</button>
                      )}
                    </div>
                  </div>
                ))}
                {roster.length === 0 && (
                  <div style={{ padding: '28px', textAlign: 'center', color: 'var(--taupe)', fontSize: '13px' }}>
                    No guests booked yet.
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'walkins' && (
              <div className="guest-table">
                <div style={{ padding: '28px', textAlign: 'center', color: 'var(--taupe)', fontSize: '13px' }}>No walk-ins for this class.</div>
              </div>
            )}
            
            {activeTab === 'waitlist' && (
               <div className="guest-table">
                 <div style={{ padding: '28px', textAlign: 'center', color: 'var(--taupe)', fontSize: '13px' }}>No one on standby for this class.</div>
               </div>
            )}
          </div>
        )}

        <div className="two-col" style={{ gridTemplateColumns: '1fr', maxWidth: '800px', margin: '0 auto' }}>
          {nextEvent ? (
            <div className="loft-card">
              <div className="loft-header">
                <div>
                  <div className="loft-event-name">{nextEvent.title}</div>
                  <div className="loft-event-time">{getFormatTime(nextEvent.startDate)} · {nextEvent.organiser} · The Loft</div>
                </div>
                <div className="loft-cap-info">
                  <div className="loft-cap-num">{verifiedEventCount} / {eventRoster.length}</div>
                  <div className="loft-cap-lbl">Verified</div>
                </div>
              </div>
              <div className="loft-body">
                {eventRoster.map(g => (
                  <div className="loft-guest-row" key={g._id}>
                    <div>
                      <div className="lg-name">{g.name || (g.user ? `${g.user.firstName} ${g.user.lastName}` : 'Guest')}</div>
                      <div className="lg-detail">Registered · TBN #{g._id.substring(g._id.length - 4)}</div>
                    </div>
                    {g.checkedInAt ? (
                      <>
                        <span className="badge badge-ok">Verified</span>
                        <button className="verify-btn verified" disabled>✓</button>
                      </>
                    ) : (
                      <>
                         <span className="badge badge-warn">Not verified</span>
                         <button className="verify-btn" onClick={() => handleVerifyEvent(g._id)}>Verify</button>
                      </>
                    )}
                  </div>
                ))}
                {eventRoster.length === 0 && (
                   <div style={{ padding: '20px', textAlign: 'center', color: 'var(--taupe)', fontSize: '12px' }}>
                     No registrations found.
                   </div>
                )}
              </div>
            </div>
          ) : (
            <div className="loft-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--taupe)', fontSize: '13px' }}>
              No upcoming events
            </div>
          )}
        </div>
      </div>
    </>
  );
}
