import { useAuth } from '../contexts/AuthContext.jsx';

// Admin panel — implemented in Phase 3
export default function AdminDashboard() {
  const { user } = useAuth();
  return (
    <div style={{ padding: '6rem var(--gutter)', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="eyebrow">Admin</div>
      <h1 style={{ fontSize: '2.5rem', marginTop: '0.75rem' }}>Admin Panel</h1>
      <p style={{ color: 'var(--cocoa)', marginTop: '1rem' }}>
        Full CMS and CRM admin panel — implemented in Phase 3.
      </p>
      <p style={{ marginTop: '1rem', color: 'var(--taupe)', fontSize: '0.875rem' }}>
        Logged in as: <strong>{user?.email}</strong> ({user?.role})
      </p>
    </div>
  );
}
