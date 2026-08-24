import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOutletContext, Link } from 'react-router-dom';
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
  const [selectedGuestForVerify, setSelectedGuestForVerify] = useState(null);
  const [verifyingInProgress, setVerifyingInProgress] = useState(false);
  
  // Walk-in form state
  const { setWalkinOpen } = useOutletContext();

  const { authFetch } = useAuth();

  const handleSelectClass = async (targetClass) => {
    setNextClass(targetClass);
    try {
      const rosterRes = await authFetch(`/api/clerk/classes/${targetClass._id}/roster`);
      const rosterData = await rosterRes.json();
      setRoster(rosterData);
    } catch (err) {
      console.error('Failed to load class roster', err);
    }
  };

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

  const getFormatTimeRange = (item) => {
    if (!item || !item.startTime) return '';
    const startTimeStr = getFormatTime(item.startTime);
    let endTimeStr = '';
    if (item.endTime) {
      endTimeStr = getFormatTime(item.endTime);
    } else if (item.classType?.durationMinutes) {
      const d = new Date(new Date(item.startTime).getTime() + item.classType.durationMinutes * 60000);
      endTimeStr = getFormatTime(d);
    } else if (item.durationMinutes) {
      const d = new Date(new Date(item.startTime).getTime() + item.durationMinutes * 60000);
      endTimeStr = getFormatTime(d);
    }
    return endTimeStr ? `${startTimeStr} – ${endTimeStr}` : startTimeStr;
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
              <div className="stat-sub">{getFormatTimeRange(nextClass)} · {roster.length}/{nextClass.maxCapacity} booked</div>
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
               <div className="stat-sub danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                   <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                 </svg>
                 <span>{eventRoster.length - verifiedEventCount} unverified guests</span>
               </div>
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
              <span className="alert-text">{nextClass.classType?.name} ({getFormatTimeRange(nextClass)}) is almost full ({roster.length}/{nextClass.maxCapacity}). Walk-ins will be placed on the standby list.</span>
              <span className="alert-action">Manage</span>
            </div>
          </div>
        </div>
      )}

      <div className="content">
        <div className="clerk-station-grid">
          {/* LEFT COLUMN: MOVEMENT STUDIO CHECK-IN */}
          <div className="station-col">
            <div className="sec-head">
              <div>
                <div className="sec-title">
                  {nextClass ? `${nextClass.classType?.name} · ${getFormatTimeRange(nextClass)}` : 'Movement Studio'}
                </div>
                <div className="sec-subtitle">Studio Check-In &amp; Attendee Roster</div>
              </div>
              {nextClass && (
                <div className="sec-count">
                  {roster.length} booked · {checkedInCount} checked in · {Math.max(0, nextClass.maxCapacity - roster.length)} spots free
                </div>
              )}
            </div>

            {/* Multiple Classes Selector Chips */}
            {classes.length > 1 && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                <span style={{ fontSize: '10.5px', color: 'var(--taupe)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center' }}>
                  Today's Classes:
                </span>
                {classes.map(c => {
                  const isSelected = nextClass && nextClass._id === c._id;
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => handleSelectClass(c)}
                      style={{
                        background: isSelected ? 'var(--cocoa-deep)' : '#FFFDF9',
                        color: isSelected ? '#F7EFE1' : 'var(--cocoa-deep)',
                        border: isSelected ? '1px solid var(--cocoa-deep)' : '1px solid rgba(227, 211, 184, 0.8)',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '11px',
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all .2s'
                      }}
                    >
                      <span>{getFormatTime(c.startTime)}</span>
                      <span>•</span>
                      <span>{c.classType?.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            
            {nextClass ? (
              <div className="station-card">
                <div className="tabs">
                  <div className={`tab ${activeTab === 'roster' ? 'on' : ''}`} onClick={() => setActiveTab('roster')}>Booked guests ({roster.length})</div>
                  <div className={`tab ${activeTab === 'walkins' ? 'on' : ''}`} onClick={() => setActiveTab('walkins')}>Walk-ins (0)</div>
                  <div className={`tab ${activeTab === 'waitlist' ? 'on' : ''}`} onClick={() => setActiveTab('waitlist')}>Standby (0)</div>
                </div>
                
                {activeTab === 'roster' && (
                  <div className="guest-table guest-table-scroll">
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
                      <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--taupe)', fontSize: '13px' }}>
                        No guests booked for this class yet.
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'walkins' && (
                  <div className="guest-table guest-table-scroll">
                    <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--taupe)', fontSize: '13px' }}>No walk-ins for this class.</div>
                  </div>
                )}
                
                {activeTab === 'waitlist' && (
                  <div className="guest-table guest-table-scroll">
                    <div style={{ padding: '36px 20px', textAlign: 'center', color: 'var(--taupe)', fontSize: '13px' }}>No one on standby for this class.</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-station-card">
                <i className="ti ti-activity" style={{ fontSize: '24px', opacity: 0.5 }}></i>
                <div>No active classes scheduled right now.</div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: LOFT EVENT CHECK-IN & GUEST VERIFICATION */}
          <div className="station-col">
            <div className="sec-head">
              <div>
                <div className="sec-title">Loft Event Verification</div>
                <div className="sec-subtitle">Door Arrival &amp; Ticket Verification</div>
              </div>
              {nextEvent && (
                <Link to="/clerk/events" style={{ fontSize: '11px', color: 'var(--rust)', textTransform: 'uppercase', letterSpacing: '0.06em', textDecoration: 'none', fontWeight: 500 }}>
                  All Events &rarr;
                </Link>
              )}
            </div>

            {nextEvent ? (
              <div className="loft-card">
                <div className="loft-header">
                  <div>
                    <div className="loft-event-name">{nextEvent.title}</div>
                    <div className="loft-event-time">
                      {getFormatTime(nextEvent.startDate)} · {nextEvent.organiser} · The Loft
                    </div>
                  </div>
                  <div className="loft-cap-info">
                    <div className="loft-cap-num">{verifiedEventCount} / {eventRoster.length}</div>
                    <div className="loft-cap-lbl">Verified</div>
                  </div>
                </div>
                <div className="loft-body loft-body-scroll">
                  {eventRoster.map(g => (
                    <div 
                      className="loft-guest-row" 
                      key={g._id}
                      onClick={() => setSelectedGuestForVerify(g)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view details and verify"
                    >
                      <div>
                        <div className="lg-name">{g.customerName || g.name || (g.user ? `${g.user.firstName} ${g.user.lastName}` : 'Guest')}</div>
                        <div className="lg-detail">
                          {g.customerPhone || g.user?.phone ? `${g.customerPhone || g.user?.phone} • ` : ''}Ref #{g._id.substring(g._id.length - 6).toUpperCase()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {g.checkedInAt ? (
                          <>
                            <span className="badge badge-ok">Verified</span>
                            <button 
                              className="verify-btn verified" 
                              onClick={(e) => { e.stopPropagation(); setSelectedGuestForVerify(g); }} 
                              title="Guest Verified"
                            >
                              ✓
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="badge badge-warn">Not verified</span>
                            <button 
                              className="verify-btn" 
                              onClick={(e) => { e.stopPropagation(); setSelectedGuestForVerify(g); }}
                            >
                              Verify Entry
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {eventRoster.length === 0 && (
                    <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--taupe)', fontSize: '13px' }}>
                      No guest registrations booked yet for this event.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-station-card">
                <i className="ti ti-calendar-off" style={{ fontSize: '24px', opacity: 0.5 }}></i>
                <div>No upcoming Loft events scheduled today.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Guest Verification Modal ── */}
      {selectedGuestForVerify && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(20, 10, 4, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={(e) => { if (e.target === e.currentTarget && !verifyingInProgress) setSelectedGuestForVerify(null); }}>
          <div style={{
            background: 'var(--paper, #FFFDF9)',
            border: '1px solid rgba(227, 211, 184, 0.8)',
            borderRadius: '8px',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            boxShadow: '0 12px 36px rgba(0,0,0,0.25)'
          }}>
            {/* Header */}
            <div style={{ background: 'var(--cocoa-deep, #2B2015)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#F7EFE1', fontFamily: "'Fraunces', serif", fontSize: '17px', fontWeight: 500 }}>
                  Verify Event Guest Entry
                </div>
                <div style={{ color: 'rgba(220,203,178,0.7)', fontSize: '11px', marginTop: '2px' }}>
                  {nextEvent?.title} · {nextEvent?.organiser || 'Aora House'} · The Loft
                </div>
              </div>
              <button 
                onClick={() => setSelectedGuestForVerify(null)}
                style={{ background: 'none', border: 'none', color: '#F7EFE1', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Guest Details Content */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)' }}>Guest Name</div>
                  <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                    {selectedGuestForVerify.customerName || selectedGuestForVerify.name || (selectedGuestForVerify.user ? `${selectedGuestForVerify.user.firstName} ${selectedGuestForVerify.user.lastName}` : 'Guest')}
                  </div>
                </div>
                <span className={`badge ${selectedGuestForVerify.checkedInAt ? 'badge-ok' : 'badge-warn'}`}>
                  {selectedGuestForVerify.checkedInAt ? 'Verified' : 'Pending Verification'}
                </span>
              </div>

              {/* Contact info with quick actions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#FAF6EF', padding: '12px 14px', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.6)' }}>
                <div>
                  <div style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)' }}>Email Address</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--ink)', marginTop: '3px', wordBreak: 'break-all' }}>
                    {selectedGuestForVerify.customerEmail || selectedGuestForVerify.user?.email ? (
                      <a href={`mailto:${selectedGuestForVerify.customerEmail || selectedGuestForVerify.user?.email}`} style={{ color: 'var(--rust)', textDecoration: 'none', fontWeight: 600 }}>
                        {selectedGuestForVerify.customerEmail || selectedGuestForVerify.user?.email}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--taupe)', fontStyle: 'italic' }}>Not provided</span>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)' }}>Phone Number</div>
                  <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--ink)', marginTop: '3px' }}>
                    {selectedGuestForVerify.customerPhone || selectedGuestForVerify.user?.phone ? (
                      <a href={`tel:${selectedGuestForVerify.customerPhone || selectedGuestForVerify.user?.phone}`} style={{ color: 'var(--rust)', textDecoration: 'none', fontWeight: 600 }}>
                        {selectedGuestForVerify.customerPhone || selectedGuestForVerify.user?.phone}
                      </a>
                    ) : (
                      <span style={{ color: 'var(--taupe)', fontStyle: 'italic' }}>Not provided</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ticket Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '12px' }}>
                <div>
                  <div style={{ fontSize: '9.5px', textTransform: 'uppercase', color: 'var(--taupe)' }}>Booking Ref</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                    #{selectedGuestForVerify._id.substring(selectedGuestForVerify._id.length - 6).toUpperCase()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9.5px', textTransform: 'uppercase', color: 'var(--taupe)' }}>Quantity</div>
                  <div style={{ fontWeight: 600, color: 'var(--ink)', marginTop: '2px' }}>
                    {selectedGuestForVerify.ticketQuantity || 1} Ticket(s)
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9.5px', textTransform: 'uppercase', color: 'var(--taupe)' }}>Amount Paid</div>
                  <div style={{ fontWeight: 600, color: 'var(--rust)', marginTop: '2px' }}>
                    {selectedGuestForVerify.amountPaidKobo > 0 ? `₦${(selectedGuestForVerify.amountPaidKobo / 100).toLocaleString()}` : 'Free RSVP'}
                  </div>
                </div>
              </div>

              {selectedGuestForVerify.checkedInAt && (
                <div style={{ background: '#EBF5EE', border: '1px solid #A8D5B5', borderRadius: '4px', padding: '10px 12px', fontSize: '12px', color: '#2E6B3E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✓</span>
                  <span><strong>Verified entry</strong> at {new Date(selectedGuestForVerify.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on {new Date(selectedGuestForVerify.checkedInAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div style={{ background: '#F8F5EE', padding: '14px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <button 
                type="button" 
                onClick={() => setSelectedGuestForVerify(null)}
                style={{ background: 'none', border: '1px solid var(--line, #E3D3B8)', padding: '8px 16px', borderRadius: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer' }}
              >
                {selectedGuestForVerify.checkedInAt ? 'Close' : 'Cancel'}
              </button>

              {!selectedGuestForVerify.checkedInAt && (
                <button 
                  type="button" 
                  disabled={verifyingInProgress}
                  onClick={async () => {
                    setVerifyingInProgress(true);
                    await handleVerifyEvent(selectedGuestForVerify._id);
                    setVerifyingInProgress(false);
                    setSelectedGuestForVerify(null);
                  }}
                  style={{
                    background: 'var(--forest, #2E6B3E)',
                    color: '#FFFFFF',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {verifyingInProgress ? 'Verifying...' : 'Confirm & Verify Entry ✓'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
