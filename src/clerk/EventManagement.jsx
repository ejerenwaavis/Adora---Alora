import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import ClerkSearch from './ClerkSearch';

export default function EventManagement() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const { authFetch } = useAuth();
  const { setWalkinOpen } = useOutletContext();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await authFetch('/api/clerk/events/upcoming');
      const data = await res.json();
      setEvents(data);
      if (data.length > 0) {
        selectEvent(data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectEvent = async (id) => {
    setSelectedEventId(id);
    try {
      const res = await authFetch(`/api/clerk/events/${id}/roster`);
      const data = await res.json();
      setRoster(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      await authFetch('/api/clerk/events/checkin', {
        method: 'POST',
        body: JSON.stringify({ bookingId })
      });
      // Update local state
      setRoster(roster.map(b => b._id === bookingId ? { ...b, checkedInAt: new Date().toISOString() } : b));
    } catch (err) {
      alert(err.message || 'Error checking in');
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>;

  const selectedEvent = events.find(e => e._id === selectedEventId);
  const checkedInCount = roster.filter(r => r.checkedInAt).length;

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
    if (!item || !item.startDate) return '';
    const startTimeStr = getFormatTime(item.startDate);
    let endTimeStr = '';
    if (item.endDate) {
      endTimeStr = getFormatTime(item.endDate);
    } else {
      const d = new Date(new Date(item.startDate).getTime() + 120 * 60000);
      endTimeStr = getFormatTime(d);
    }
    return `${startTimeStr} – ${endTimeStr}`;
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Event Management</div>
          <div className="topbar-sub">Manage event guest lists and entry</div>
        </div>
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center' }}>
          <ClerkSearch />
          <button className="tb-btn" onClick={() => window.print()}>Print Guest List</button>
          <button className="tb-btn primary" onClick={() => setWalkinOpen(true)}>+ Add Walk-in</button>
        </div>
      </div>

      <div className="content" style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        
        {/* Left Column: Event List */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="sec-head" style={{ marginBottom: 0 }}>
            <div className="sec-title">Upcoming Events</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {events.length === 0 ? (
              <div style={{ padding: '20px', color: 'var(--taupe)', fontSize: '13px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '4px' }}>
                No upcoming events.
              </div>
            ) : events.map(e => {
              const isSelected = e._id === selectedEventId;
              const date = new Date(e.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
              const timeRange = getFormatTimeRange(e);
              
              return (
                <div 
                  key={e._id} 
                  onClick={() => selectEvent(e._id)}
                  style={{
                    background: isSelected ? 'var(--cocoa-deep)' : 'var(--paper)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--cocoa-deep)' : 'var(--line)',
                    borderRadius: '6px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(42,29,20,0.12)' : '0 1px 3px rgba(42,29,20,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        fontFamily: 'var(--f-display)', 
                        fontSize: '15px', 
                        color: isSelected ? '#F7EFE1' : 'var(--ink)', 
                        fontWeight: 600,
                        lineHeight: 1.3
                      }}>
                        {e.title}
                      </div>
                      
                      {/* Discreet Time Range & Location */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '4px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ 
                          fontSize: '11.5px', 
                          fontWeight: 600,
                          color: isSelected ? 'var(--gold-light, #E3D3B8)' : 'var(--cocoa-deep)',
                          letterSpacing: '0.01em'
                        }}>
                          {date} · {timeRange}
                        </span>
                        {e.space && (
                          <span style={{
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(200,155,74,0.12)',
                            color: isSelected ? '#F7EFE1' : '#8C5815',
                            fontWeight: 600
                          }}>
                            {e.space}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: isSelected ? 'rgba(220,203,178,.85)' : 'var(--ink)',
                    borderTop: isSelected ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--line)',
                    paddingTop: '6px'
                  }}>
                    <span>{e.bookedCount || 0} / {e.capacity || 50} Booked</span>
                    <span style={{ 
                      color: isSelected ? 'rgba(220,203,178,.6)' : 'var(--taupe)', 
                      fontSize: '10.5px' 
                    }}>
                      {Math.max(0, (e.capacity || 50) - (e.bookedCount || 0))} open
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Guest List Detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedEvent ? (
            <>
              <div>
                <div className="sec-head">
                  <div className="sec-title">{selectedEvent.title} guest list</div>
                  <div className="sec-count">{roster.length} booked · {checkedInCount} checked in</div>
                </div>
                
                <div className="guest-table" style={{ marginTop: '16px' }}>
                  <div className="guest-thead" style={{ gridTemplateColumns: '80px 2fr 100px 100px 120px' }}>
                    <span>#</span>
                    <span>Guest Name</span>
                    <span>Tickets</span>
                    <span>Status</span>
                    <span style={{textAlign: 'right'}}>Action</span>
                  </div>
                  {roster.map((b, i) => (
                    <div className={`guest-row ${b.checkedInAt ? 'checked' : ''}`} key={b._id} style={{ gridTemplateColumns: '80px 2fr 100px 100px 120px' }}>
                      <div className="g-num">{i + 1}</div>
                      <div className="g-info">
                        <div className="g-name">{b.customerName}</div>
                      </div>
                      <div className="g-class">{b.ticketQuantity} {b.ticketQuantity === 1 ? 'Ticket' : 'Tickets'}</div>
                      <div className="g-status">
                        {b.checkedInAt ? (
                          <span className="badge badge-ok">In Venue</span>
                        ) : (
                          <span className="badge badge-gold">Pending</span>
                        )}
                      </div>
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
                      No guests have RSVP'd yet.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--taupe)', border: '1px dashed var(--line)', borderRadius: '4px' }}>
              Select an event to view its guest list.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
