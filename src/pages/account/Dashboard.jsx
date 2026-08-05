import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import styles from './AccountLayout.module.css';

export default function Dashboard() {
  const { user, authFetch } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const res = await authFetch('/api/bookings/me');
      if (res.ok) setBookings(await res.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function handleCancelBooking(bookingId) {
    if (!window.confirm('Are you sure you want to cancel this booking? Classes cancelled within 6 hours of start time may not be refunded.')) return;
    try {
      const res = await authFetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST'
      });
      if (res.ok) {
        loadBookings();
        // Since we don't refresh the user context here, they might need to refresh to see credits update if refunded
        // A real app would refresh user context here
      } else {
        const data = await res.json();
        alert(`Failed to cancel: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div className="eyebrow">Welcome Back</div>
      <h1 className={styles.pageTitle}>{user.firstName} {user.lastName}</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
        <div className={styles.card}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--taupe)' }}>Available Credits</h2>
          <div style={{ fontSize: '3rem', fontFamily: 'var(--font-heading)', color: 'var(--gold)' }}>
            {user.classCredits || 0}
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
            Book your next class using your available credits.
          </p>
        </div>

        <div className={styles.card}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--taupe)' }}>Membership Status</h2>
          <div style={{ fontSize: '1.5rem', textTransform: 'capitalize' }}>
            {user.membershipStatus === 'none' ? 'No Active Membership' : user.membershipStatus}
          </div>
          {user.membershipStatus === 'none' && (
            <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
              Upgrade to a membership for unlimited access and perks.
            </p>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem' }}>Upcoming Bookings</h2>
          <button onClick={() => navigate('/movement')} style={{ background: 'var(--black)', color: 'var(--white)', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Book a Class
          </button>
        </div>
        
        {loading ? (
          <p>Loading bookings...</p>
        ) : bookings.filter(b => b.status === 'confirmed' || b.status === 'waitlisted' || b.status === 'promoted').length === 0 ? (
          <div className={styles.emptyState}>
            <p>You have no upcoming class bookings.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {bookings.filter(b => b.status === 'confirmed' || b.status === 'waitlisted' || b.status === 'promoted').map(booking => {
              const session = booking.classSession;
              return (
                <div key={booking._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--taupe)', borderRadius: '4px' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      {session?.classType?.name} {booking.status === 'waitlisted' && <span style={{ color: 'orange', fontSize: '0.8rem', marginLeft: '0.5rem' }}>(Waitlisted)</span>}
                    </strong>
                    <div style={{ color: 'var(--cocoa)', fontSize: '0.9rem' }}>
                      {new Date(session?.startTime).toLocaleDateString()} @ {new Date(session?.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                    </div>
                  </div>
                  <div>
                    <button onClick={() => handleCancelBooking(booking._id)} style={{ padding: '0.5rem 1rem', background: 'none', border: '1px solid var(--black)', borderRadius: '4px', cursor: 'pointer' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {bookings.filter(b => b.status === 'cancelled' || b.status === 'attended').length > 0 && (
        <div className={styles.card} style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Past & Cancelled Bookings</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {bookings.filter(b => b.status === 'cancelled' || b.status === 'attended').slice(0, 5).map(booking => {
              const session = booking.classSession;
              return (
                <div key={booking._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--taupe)', borderRadius: '4px', opacity: 0.7 }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                      {session?.classType?.name} <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem', textTransform: 'capitalize' }}>({booking.status})</span>
                    </strong>
                    <div style={{ color: 'var(--cocoa)', fontSize: '0.9rem' }}>
                      {new Date(session?.startTime).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
}
