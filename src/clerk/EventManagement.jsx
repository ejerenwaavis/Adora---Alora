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
              const time = new Date(e.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
                <div 
                  key={e._id} 
                  onClick={() => selectEvent(e._id)}
                  style={{
                    background: isSelected ? 'var(--cocoa-deep)' : 'var(--paper)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--cocoa-deep)' : 'var(--line)',
                    borderRadius: '4px',
                    padding: '14px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ 
                        fontFamily: 'var(--f-display)', 
                        fontSize: '16px', 
                        color: isSelected ? '#F7EFE1' : 'var(--ink)', 
                        fontWeight: 500 
                      }}>
                        {e.title}
                      </div>
                      <div style={{ 
                        fontSize: '11px', 
                        color: isSelected ? 'rgba(220,203,178,.8)' : 'var(--taupe)', 
                        marginTop: '4px' 
                      }}>
                        {date} · {time}
                      </div>
                    </div>
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
