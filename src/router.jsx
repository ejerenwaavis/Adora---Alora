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

// Auth Pages
import Login           from './pages/Login.jsx';
import Register        from './pages/Register.jsx';
import ForgotPassword  from './pages/ForgotPassword.jsx';
import ResetPassword   from './pages/ResetPassword.jsx';

// Account Dashboard
import AccountLayout   from './pages/account/AccountLayout.jsx';
import Dashboard       from './pages/account/Dashboard.jsx';
import ProfileSettings from './pages/account/ProfileSettings.jsx';

// Admin CMS
import AdminLayout     from './admin/AdminLayout.jsx';
import AdminDashboard  from './admin/Dashboard.jsx';
import AnnouncementCMS from './admin/AnnouncementCMS.jsx';
import FaqCMS          from './admin/FaqCMS.jsx';
import MenuCMS         from './admin/MenuCMS.jsx';
import ClassesCMS      from './admin/ClassesCMS.jsx';
import ScheduleCMS     from './admin/ScheduleCMS.jsx';
import FashionCMS      from './admin/FashionCMS.jsx';
import EventsCMS       from './admin/EventsCMS.jsx';
import CreditPacksCMS  from './admin/CreditPacksCMS.jsx';
import SettingsCMS     from './admin/SettingsCMS.jsx';

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
      
      // Public Auth routes inside PageShell so they get the main nav/footer
      { path: 'login',                  element: <Login /> },
      { path: 'register',               element: <Register /> },
      { path: 'forgot-password',        element: <ForgotPassword /> },
      { path: 'reset-password',         element: <ResetPassword /> },
    ],
  },

  // ── Protected: member account ──
  {
    path: '/account',
    element: <RequireAuth><AccountLayout /></RequireAuth>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'profile', element: <ProfileSettings /> },
      { path: 'billing', element: <div style={{padding: '3rem 4rem'}}>Billing coming soon</div> },
    ]
  },

  // ── Protected: admin panel ──
  {
    path:    '/admin',
    element: <RequireRole roles={['admin','content_editor','finance','instructor']}><AdminLayout /></RequireRole>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'announcements', element: <AnnouncementCMS /> },
      { path: 'faqs', element: <FaqCMS /> },
      { path: 'menu', element: <MenuCMS /> },
      { path: 'classes', element: <ClassesCMS /> },
      { path: 'timetable', element: <ScheduleCMS /> },
      { path: 'fashion', element: <FashionCMS /> },
      { path: 'events', element: <EventsCMS /> },
      { path: 'credit-packs', element: <CreditPacksCMS /> },
      { path: 'settings', element: <SettingsCMS /> },
      { path: '*', element: <AdminDashboard /> }
    ]
  },

  // ── Protected: clerk front desk (Stubs) ──
  {
    path:    '/clerk',
    element: <RequireRole roles={['admin','clerk']}><div style={{padding:'2rem'}}>Clerk Dashboard coming soon</div></RequireRole>,
  },

  // ── 404 fallback ──
  { path: '*', element: <Navigate to="/" replace /> },
]);
