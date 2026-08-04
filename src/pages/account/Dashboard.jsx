import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import styles from './AccountLayout.module.css';

export default function Dashboard() {
  const { user } = useAuth();

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
          <button style={{ background: 'var(--black)', color: 'var(--white)', padding: '0.5rem 1rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Book a Class
          </button>
        </div>
        
        <div className={styles.emptyState}>
          <p>You have no upcoming class bookings.</p>
        </div>
      </div>
    </div>
  );
}
