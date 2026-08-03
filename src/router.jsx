import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';

// Layout
import PageShell    from './components/layout/PageShell.jsx';

// Public pages
import Home         from './pages/Home.jsx';
import OurHouse     from './pages/OurHouse.jsx';
import Movement     from './pages/Movement.jsx';
import Cafe         from './pages/Cafe.jsx';
import Fashion      from './pages/Fashion.jsx';
import VenueHire    from './pages/VenueHire.jsx';
import Events       from './pages/Events.jsx';
import Visit        from './pages/Visit.jsx';

// Protected shells (implemented in later phases)
import UserDashboard    from './user/UserDashboard.jsx';
import AdminDashboard   from './admin/Dashboard.jsx';
import ClerkDashboard   from './clerk/ClerkDashboard.jsx';

// ── Route Guards ──────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:'8rem', color:'var(--taupe)', fontFamily:'var(--f-body)' }}>Loading…</div>;
  if (!user)   return <Navigate to="/" replace />;
  return children;
}

function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// ── Router ────────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  // ── Public marketing site ──
  {
    path:    '/',
    element: <PageShell />,
    children: [
      { index: true,                    element: <Home /> },
      { path: 'our-house',              element: <OurHouse /> },
      { path: 'movement',               element: <Movement /> },
      { path: 'cafe',                   element: <Cafe /> },
      { path: 'fashion',                element: <Fashion /> },
      { path: 'venue-hire',             element: <VenueHire /> },
      { path: 'venue-hire/the-loft',    element: <VenueHire section="loft" /> },
      { path: 'events',                 element: <Events /> },
      { path: 'events/:slug',           element: <Events detail /> },
      { path: 'visit',                  element: <Visit /> },
    ],
  },

  // ── Protected: member account ──
  {
    path:    '/account',
    element: <RequireAuth><UserDashboard /></RequireAuth>,
  },
  {
    path:    '/account/*',
    element: <RequireAuth><UserDashboard /></RequireAuth>,
  },

  // ── Protected: admin panel ──
  {
    path:    '/admin',
    element: <RequireRole roles={['admin','content_editor','finance','instructor']}><AdminDashboard /></RequireRole>,
  },
  {
    path:    '/admin/*',
    element: <RequireRole roles={['admin','content_editor','finance','instructor']}><AdminDashboard /></RequireRole>,
  },

  // ── Protected: clerk front desk ──
  {
    path:    '/clerk',
    element: <RequireRole roles={['admin','clerk']}><ClerkDashboard /></RequireRole>,
  },
  {
    path:    '/clerk/*',
    element: <RequireRole roles={['admin','clerk']}><ClerkDashboard /></RequireRole>,
  },

  // ── 404 fallback ──
  { path: '*', element: <Navigate to="/" replace /> },
]);
