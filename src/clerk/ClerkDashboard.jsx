import { useAuth } from '../contexts/AuthContext.jsx';

// Clerk front desk — implemented in Phase 7
export default function ClerkDashboard() {
  const { user } = useAuth();
  return (
    <div style={{ padding: '6rem var(--gutter)', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="eyebrow">Front Desk</div>
      <h1 style={{ fontSize: '2.5rem', marginTop: '0.75rem' }}>Clerk Dashboard</h1>
      <p style={{ color: 'var(--cocoa)', marginTop: '1rem' }}>
        Check-ins, walk-in bookings, and enquiries — implemented in Phase 7.
      </p>
      <p style={{ marginTop: '1rem', color: 'var(--taupe)', fontSize: '0.875rem' }}>
        Logged in as: <strong>{user?.email}</strong> ({user?.role})
      </p>
    </div>
  );
}
