import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import ClerkSearch from './ClerkSearch';

export default function ClassManagement() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { setWalkinOpen } = useOutletContext();
  const { authFetch } = useAuth();

  // Walk-in state
  const [activeTab, setActiveTab] = useState('roster'); // 'roster', 'walkins', 'waitlist'
  const [walkinName, setWalkinName] = useState('');
  const [capacityWarn, setCapacityWarn] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const res = await authFetch('/api/clerk/classes/today');
      const data = await res.json();
      setClasses(data);
      if (data.length > 0) {
        selectClass(data[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectClass = async (id) => {
    setSelectedClassId(id);
    setActiveTab('roster');
    try {
      const res = await authFetch(`/api/clerk/classes/${id}/roster`);
      const data = await res.json();
      setRoster(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      await authFetch('/api/clerk/classes/checkin', {
        method: 'POST',
        body: JSON.stringify({ bookingId })
      });
      // Update local state
      setRoster(roster.map(b => b._id === bookingId ? { ...b, checkedInAt: new Date().toISOString() } : b));
    } catch (err) {
      alert(err.message || 'Error checking in');
    }
  };

  const handleWalkin = async () => {
    if (!walkinName.trim()) return;
    
    // In a real app we'd post to /api/clerk/classes/walkin
    // For now we just show the capacity warning to match the dashboard style
    setCapacityWarn(true);
    setTimeout(() => setCapacityWarn(false), 4000);
    setWalkinName('');
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

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>;

  const selectedClass = classes.find(c => c._id === selectedClassId);
  const checkedInCount = roster.filter(r => r.checkedInAt).length;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Class Management</div>
          <div className="topbar-sub">Manage rosters, walk-ins, and standby lists</div>
        </div>
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center' }}>
          <ClerkSearch />
          <button className="tb-btn" onClick={() => window.print()}>Print roster</button>
          <button className="tb-btn primary" onClick={() => setWalkinOpen(true)}>+ Walk-in</button>
        </div>
      </div>

      <div className="content" style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        
        {/* Left Column: Class List */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="sec-head" style={{ marginBottom: 0 }}>
            <div className="sec-title">Today's Schedule</div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {classes.length === 0 ? (
              <div style={{ padding: '20px', color: 'var(--taupe)', fontSize: '13px', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '4px' }}>
                No classes scheduled for today.
              </div>
            ) : classes.map(c => {
              const isSelected = c._id === selectedClassId;
              const timeRange = getFormatTimeRange(c);
              
              return (
                <div 
                  key={c._id} 
                  onClick={() => selectClass(c._id)}
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
                        {c.classType?.name || 'Class'}
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
                          {timeRange}
                        </span>
                        {c.location && (
                          <span style={{
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: isSelected ? 'rgba(255,255,255,0.12)' : 'rgba(200,155,74,0.12)',
                            color: isSelected ? '#F7EFE1' : '#8C5815',
                            fontWeight: 600
                          }}>
                            {c.location}
                          </span>
                        )}
                      </div>

                      <div style={{ 
                        fontSize: '11px', 
                        color: isSelected ? 'rgba(220,203,178,.65)' : 'var(--taupe)', 
                        marginTop: '4px' 
                      }}>
                        Instructor: {c.instructor?.firstName || 'Staff'} {c.instructor?.lastName || ''}
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
                    <span>{c.bookedCount || 0} / {c.maxCapacity || 14} Booked</span>
                    <span style={{ 
                      color: isSelected ? 'rgba(220,203,178,.6)' : 'var(--taupe)', 
                      fontSize: '10.5px' 
                    }}>
                      {Math.max(0, (c.maxCapacity || 14) - (c.bookedCount || 0))} open
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Roster Detail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedClass ? (
            <>
              <div>
                <div className="sec-head">
                  <div className="sec-title">
                    {selectedClass.classType?.name} · {getFormatTimeRange(selectedClass)} check-in
                  </div>
                  <div className="sec-count">
                    {roster.length} booked · {checkedInCount} checked in · {Math.max(0, selectedClass.maxCapacity - roster.length)} spots free
                    {selectedClass.location ? ` · ${selectedClass.location}` : ''}
                  </div>
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
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--taupe)', border: '1px dashed var(--line)', borderRadius: '4px' }}>
              Select a class from the schedule to view its roster.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
