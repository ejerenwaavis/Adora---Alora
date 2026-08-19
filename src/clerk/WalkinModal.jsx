import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function WalkinModal({ isOpen, onClose }) {
  const [type, setType] = useState('class'); // 'class', 'event', 'cafe'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Dropdown data
  const [classes, setClasses] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');

  const { authFetch } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const fetchData = async () => {
      try {
        const [clsRes, evtRes] = await Promise.all([
          authFetch('/api/clerk/classes/today'),
          authFetch('/api/clerk/events/upcoming')
        ]);
        
        const clsData = await clsRes.json();
        const evtData = await evtRes.json();
        
        setClasses(clsData);
        setEvents(evtData);
        
        if (clsData.length > 0) setSelectedItem(clsData[0]._id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [authFetch, isOpen]);

  useEffect(() => {
    if (type === 'class' && classes.length > 0) setSelectedItem(classes[0]._id);
    if (type === 'event' && events.length > 0) setSelectedItem(events[0]._id);
    if (type === 'cafe') setSelectedItem('walkin');
  }, [type, classes, events]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    
    try {
      let res;
      if (type === 'class') {
        const [firstName, ...lastNameArr] = name.split(' ');
        res = await authFetch('/api/clerk/classes/walkin', {
          method: 'POST',
          body: JSON.stringify({ 
            classSessionId: selectedItem, 
            firstName, 
            lastName: lastNameArr.join(' ') || 'Guest', 
            email: email || 'walkin@example.com' 
          })
        });
      } else if (type === 'event') {
        res = await authFetch('/api/clerk/events/walkin', {
          method: 'POST',
          body: JSON.stringify({ eventId: selectedItem, name, email })
        });
      } else if (type === 'cafe') {
        res = await authFetch('/api/clerk/cafe/walkin', {
          method: 'POST',
          body: JSON.stringify({ name, email })
        });
      }
      
      if (res && !res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Check-in failed');
      }

      setSuccess(`Successfully checked in ${name} for ${type}.`);
      setName('');
      setEmail('');
      
      // Reload window to update roster/stats under the hood
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (err) {
      console.error('Walk-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFormatTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(24, 21, 20, 0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '100%', maxWidth: '640px', backgroundColor: 'var(--paper)', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', backgroundColor: 'var(--white)', borderBottom: '1px solid var(--line)' }}>
          <div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '20px', color: 'var(--cocoa-deep)' }}>Walk-in Registry</div>
            <div style={{ fontSize: '12px', color: 'var(--taupe)', marginTop: '4px' }}>Register and admit walk-in guests instantly</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', color: 'var(--taupe)', cursor: 'pointer' }}>&times;</button>
        </div>

        <div style={{ padding: '32px' }}>
          <div className="tabs" style={{ marginBottom: '32px', justifyContent: 'center' }}>
            <div className={`tab ${type === 'class' ? 'on' : ''}`} onClick={() => setType('class')} style={{ fontSize: '13px', padding: '12px 24px' }}>Class Session</div>
            <div className={`tab ${type === 'event' ? 'on' : ''}`} onClick={() => setType('event')} style={{ fontSize: '13px', padding: '12px 24px' }}>Loft Event</div>
            <div className={`tab ${type === 'cafe' ? 'on' : ''}`} onClick={() => setType('cafe')} style={{ fontSize: '13px', padding: '12px 24px' }}>Café Table</div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div className="wf-group">
              <div className="wf-label" style={{ fontSize: '12px', marginBottom: '8px' }}>Destination</div>
              <select 
                className="wf-select" 
                value={selectedItem} 
                onChange={(e) => setSelectedItem(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 16px', fontSize: '14px', borderRadius: '4px', backgroundColor: 'var(--white)', border: '1px solid var(--line)' }}
              >
                {type === 'class' && (
                  classes.length === 0 ? <option value="">No classes today</option> :
                  classes.map(c => {
                    const spots = Math.max(0, c.maxCapacity - c.bookedCount);
                    return (
                      <option key={c._id} value={c._id}>
                        {getFormatTime(c.startTime)} — {c.classType?.name} ({spots > 0 ? `${spots} spots left` : 'Waitlist'})
                      </option>
                    );
                  })
                )}
                {type === 'event' && (
                  events.length === 0 ? <option value="">No upcoming events</option> :
                  events.map(e => (
                    <option key={e._id} value={e._id}>
                      {e.title} — {new Date(e.startDate).toLocaleDateString()}
                    </option>
                  ))
                )}
                {type === 'cafe' && (
                  <option value="walkin">Immediate Seating (Walk-in)</option>
                )}
              </select>
            </div>

            <div className="two-col" style={{ gap: '24px' }}>
              <div className="wf-group">
                <div className="wf-label" style={{ fontSize: '12px', marginBottom: '8px' }}>Guest Full Name</div>
                <input 
                  className="wf-input" 
                  placeholder="e.g. Jane Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 16px', fontSize: '14px', borderRadius: '4px', backgroundColor: 'var(--white)', border: '1px solid var(--line)' }}
                />
              </div>

              <div className="wf-group">
                <div className="wf-label" style={{ fontSize: '12px', marginBottom: '8px' }}>Email Address (Optional)</div>
                <input 
                  type="email"
                  className="wf-input" 
                  placeholder="For receipt / record" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px 16px', fontSize: '14px', borderRadius: '4px', backgroundColor: 'var(--white)', border: '1px solid var(--line)' }}
                />
              </div>
            </div>

            {success && (
              <div className="walkin-warn" style={{ backgroundColor: 'var(--ok-bg)', color: 'var(--ok)', borderColor: 'var(--ok-bd)', padding: '14px', fontSize: '14px', borderRadius: '4px', marginTop: '8px' }}>
                <i className="ti ti-check" aria-hidden="true" style={{fontSize: '18px', flexShrink: 0}}></i>
                {success}
              </div>
            )}

            <div style={{ marginTop: '16px', borderTop: '1px solid var(--line)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={onClose} style={{ background: 'none', border: '1px solid var(--line)', padding: '12px 24px', borderRadius: '4px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" className="tb-btn primary" style={{ fontSize: '14px', padding: '12px 24px', borderRadius: '4px' }} disabled={loading}>
                {loading ? 'Processing...' : 'Complete & Admit'}
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
}
