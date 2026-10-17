import { Outlet, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function InstructorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user || user.role !== 'instructor') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'var(--f-body)' }}>
      <header style={{ background: 'var(--black)', color: 'var(--white)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'var(--white)', textDecoration: 'none', fontFamily: 'var(--f-heading)', fontSize: '1.2rem' }}>Aora House | Studio</Link>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--gold)' }}>Welcome, {user.firstName}</span>
          <Link to="/account/profile" style={{ color: 'var(--white)', textDecoration: 'none', fontSize: '0.9rem' }}>Edit Profile</Link>
          <button onClick={() => { logout(); navigate('/'); }} style={{ background: 'none', border: 'none', color: 'var(--taupe)', cursor: 'pointer', fontSize: '0.9rem' }}>Logout</button>
        </div>
      </header>
      <main style={{ flex: 1, background: '#f5f5f5', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
