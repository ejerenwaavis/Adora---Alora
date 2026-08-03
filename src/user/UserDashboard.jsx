import { useAuth } from '../contexts/AuthContext.jsx';
import { Navigate } from 'react-router-dom';

// Full user dashboard — implemented in Phase 4
export default function UserDashboard() {
  const { user, logout } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return (
    <div style={{ padding: '6rem var(--gutter)', maxWidth: '900px', margin: '0 auto' }}>
      <div className="eyebrow">Account</div>
      <h1 style={{ fontSize: '2.5rem', marginTop: '0.75rem' }}>Welcome, {user.firstName}.</h1>
      <p style={{ color: 'var(--cocoa)', marginTop: '1rem', marginBottom: '2rem' }}>
        Your member dashboard — bookings, credits, and profile — coming in Phase 4.
      </p>
      <div style={{ padding: '2rem', background: 'var(--paper)', border: '1px solid var(--line)', borderRadius: '4px' }}>
        <p><strong>Email:</strong> {user.email}</p>
        <p style={{ marginTop: '0.5rem' }}><strong>Role:</strong> {user.role}</p>
        <p style={{ marginTop: '0.5rem' }}><strong>Credits:</strong> {user.classCredits}</p>
        <p style={{ marginTop: '0.5rem' }}><strong>Membership:</strong> {user.membershipStatus}</p>
      </div>
      <button onClick={logout} className="btn btn-outline" style={{ marginTop: '2rem' }}>Sign Out</button>
    </div>
  );
}
