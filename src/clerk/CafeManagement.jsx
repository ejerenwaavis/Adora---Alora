import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import ClerkSearch from './ClerkSearch';

export default function CafeManagement() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setWalkinOpen } = useOutletContext();
  const { authFetch } = useAuth();

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await authFetch('/api/clerk/cafe/today');
      const data = await res.json();
      setReservations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reservationId, status) => {
    try {
      await authFetch('/api/clerk/cafe/status', {
        method: 'POST',
        body: JSON.stringify({ reservationId, status })
      });
      // Update local state
      setReservations(reservations.map(r => r._id === reservationId ? { ...r, status } : r));
    } catch (err) {
      alert(err.message || 'Error updating status');
    }
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>;

  const seatedCount = reservations.filter(r => r.status === 'seated').length;
  const completedCount = reservations.filter(r => r.status === 'completed').length;
  const pendingCount = reservations.length - seatedCount - completedCount;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Café Reservations</div>
          <div className="topbar-sub">Manage today's tables and walk-ins</div>
        </div>
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center' }}>
          <ClerkSearch />
          <button className="tb-btn" onClick={() => window.print()}>Print List</button>
          <button className="tb-btn primary" onClick={() => setWalkinOpen(true)}>+ Add Walk-in</button>
        </div>
      </div>

      <div className="content">
        <div className="sec-head">
          <div className="sec-title">Today's Reservations</div>
          <div className="sec-count">{reservations.length} total · {pendingCount} pending · {seatedCount} currently seated</div>
        </div>

        <div className="guest-table">
          <div className="guest-thead" style={{ gridTemplateColumns: '80px 2fr 100px 100px 120px' }}>
            <span>Time</span>
            <span>Name</span>
            <span>Party Size</span>
            <span>Status</span>
            <span style={{ textAlign: 'right' }}>Action</span>
          </div>
          
          {reservations.length === 0 ? (
            <div style={{ padding: '28px', textAlign: 'center', color: 'var(--taupe)', fontSize: '13px' }}>
              No reservations today.
            </div>
          ) : reservations.map((r) => {
            const isCompleted = r.status === 'completed';
            const isSeated = r.status === 'seated';
            
            return (
              <div className={`guest-row ${isCompleted ? 'checked' : ''}`} key={r._id} style={{ gridTemplateColumns: '80px 2fr 100px 100px 120px' }}>
                <div className="g-time" style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.time}</div>
                <div className="g-info">
                  <div className="g-name">{r.customerName}</div>
                </div>
                <div className="g-class">{r.partySize} guests</div>
                <div>
                  {isCompleted && <span className="badge badge-ink">Completed</span>}
                  {isSeated && <span className="badge badge-ok">Seated</span>}
                  {!isCompleted && !isSeated && <span className="badge badge-gold">{r.status}</span>}
                </div>
                <div className="g-status">
                  {!isCompleted && !isSeated && (
                    <button 
                      className="ci-btn" 
                      onClick={() => handleStatusChange(r._id, 'seated')}
                    >
                      Mark Seated
                    </button>
                  )}
                  {isSeated && (
                    <button 
                      className="ci-btn" 
                      onClick={() => handleStatusChange(r._id, 'completed')}
                    >
                      Complete
                    </button>
                  )}
                  {isCompleted && (
                    <button className="ci-btn done" disabled>Finished</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
