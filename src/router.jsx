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
import KioskCheckIn from './pages/KioskCheckIn.jsx';

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
import UsersCMS        from './admin/UsersCMS.jsx';
import VenueEnquiriesCMS from './admin/VenueEnquiriesCMS.jsx';
import AdminActivityLogs from './admin/ActivityLogs.jsx';

// Clerk Dashboard
import ClerkLayout     from './clerk/ClerkLayout.jsx';
import ClerkDashboard  from './clerk/DashboardHome.jsx';
import ClassManagement from './clerk/ClassManagement.jsx';
import CafeManagement  from './clerk/CafeManagement.jsx';
import EventManagement from './clerk/EventManagement.jsx';
import ActivityLogs    from './clerk/ActivityLogs.jsx';

// Kitchen KDS
import KitchenKDS from './kitchen/KitchenKDS.jsx';

// ── Route Guards ──────────────────────────────────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:'8rem', color:'var(--taupe)', fontFamily:'var(--f-body)' }}>Loading…</div>;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

// Finance Dashboard
import FinanceLayout   from './finance/FinanceLayout.jsx';
import FinanceDashboard from './finance/FinanceDashboard.jsx';
import FinancePayouts   from './finance/FinancePayouts.jsx';

// Concierge Dashboard
import ConciergeLayout from './concierge/ConciergeLayout.jsx';
import ConciergeDashboard from './concierge/ConciergeDashboard.jsx';
import WhatsAppInbox from './concierge/WhatsAppInbox.jsx';

// ── Role-Based Home Redirect ──────────────────────────────────────────────────
function StaffHomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  if (['admin', 'content_editor'].includes(user.role)) return <Navigate to="/admin" replace />;
  if (user.role === 'finance') return <Navigate to="/finance" replace />;
  if (user.role === 'concierge') return <Navigate to="/concierge" replace />;
  if (user.role === 'clerk') return <Navigate to="/clerk" replace />;
  if (user.role === 'kitchen' || user.role === 'chef') return <Navigate to="/kitchen" replace />;
  if (user.role === 'instructor') return <Navigate to="/instructor" replace />;
  
  // Fallback for normal users who accidentally hit the internal domain
  return <Navigate to="/login" replace />;
}

// ── Hostname Detection ────────────────────────────────────────────────────────
const host = window.location.hostname;

// Enable testing HQ mode on devices via IP address by using ?hq=true
if (window.location.search.includes('hq=true')) localStorage.setItem('hq_override', 'true');
if (window.location.search.includes('hq=false')) localStorage.removeItem('hq_override');

const isInternal = host.startsWith('hq.') || host.startsWith('staff.') || host.startsWith('portal.') || host.startsWith('admin.') || localStorage.getItem('hq_override') === 'true';

// ── Public Router ─────────────────────────────────────────────────────────────
const publicRouter = createBrowserRouter([
  {
    path: '/',
    element: <PageShell />,
    children: [
      { index: true,                    element: <Home /> },
      { path: 'our-house',              element: <Home /> },
      { path: 'movement',               element: <Movement /> },
      { path: 'cafe',                   element: <Cafe /> },
      { path: 'fashion',                element: <Fashion /> },
      { path: 'venue-hire',             element: <VenueHire /> },
      { path: 'venue-hire/the-loft',    element: <VenueHire section="loft" /> },
      { path: 'events',                 element: <Events /> },
      { path: 'events/:slug',           element: <Events detail /> },
      { path: 'visit',                  element: <Visit /> },
      { path: 'check-in',               element: <KioskCheckIn /> },
      
      { path: 'login',                  element: <Login /> },
      { path: 'register',               element: <Register /> },
      { path: 'forgot-password',        element: <ForgotPassword /> },
      { path: 'reset-password',         element: <ResetPassword /> },
    ],
  },
  {
    path: '/account',
    element: <RequireAuth><AccountLayout /></RequireAuth>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'profile', element: <ProfileSettings /> },
      { path: 'billing', element: <div style={{padding: '3rem 4rem'}}>Billing coming soon</div> },
    ]
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

import InstructorLayout from './instructor/InstructorLayout.jsx';
import InstructorDashboard from './instructor/InstructorDashboard.jsx';

// ── Internal Staff Router ─────────────────────────────────────────────────────
const internalRouter = createBrowserRouter([
  {
    path: '/',
    element: <StaffHomeRedirect />
  },
  {
    path: '/login',
    element: <Login /> // You might want a custom StaffLogin later
  },
  {
    path: '/finance',
    element: <RequireRole roles={['admin','finance']}><FinanceLayout /></RequireRole>,
    children: [
      { index: true, element: <FinanceDashboard /> },
      { path: 'payouts', element: <FinancePayouts /> }
    ]
  },
  {
    path: '/concierge',
    element: <RequireRole roles={['admin','concierge']}><ConciergeLayout /></RequireRole>,
    children: [
      { index: true, element: <ConciergeDashboard /> },
      { path: 'whatsapp', element: <WhatsAppInbox /> }
    ]
  },
  {
    path: '/instructor',
    element: <InstructorLayout />,
    children: [
      { index: true, element: <InstructorDashboard /> }
    ]
  },
  {
    path: '/admin',
    element: <RequireRole roles={['admin','content_editor','finance']}><AdminLayout /></RequireRole>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'announcements', element: <AnnouncementCMS /> },
      { path: 'faqs', element: <FaqCMS /> },
      { path: 'menu', element: <MenuCMS /> },
      { path: 'classes', element: <ClassesCMS /> },
      { path: 'timetable', element: <ScheduleCMS /> },
      { path: 'fashion', element: <FashionCMS /> },
      { path: 'events', element: <EventsCMS /> },
      { path: 'venue-enquiries', element: <VenueEnquiriesCMS /> },
      { path: 'credit-packs', element: <RequireRole roles={['admin', 'finance']}><CreditPacksCMS /></RequireRole> },
      { path: 'users', element: <RequireRole roles={['admin']}><UsersCMS /></RequireRole> },
      { path: 'settings', element: <RequireRole roles={['admin']}><SettingsCMS /></RequireRole> },
      { path: 'activity-logs', element: <RequireRole roles={['admin']}><AdminActivityLogs /></RequireRole> },
      { path: '*', element: <AdminDashboard /> }
    ]
  },
  {
    path: '/clerk',
    element: <RequireRole roles={['admin','clerk']}><ClerkLayout /></RequireRole>,
    children: [
      { index: true, element: <ClerkDashboard /> },
      { path: 'classes', element: <ClassManagement /> },
      { path: 'cafe', element: <CafeManagement /> },
      { path: 'events', element: <EventManagement /> },
      { path: 'logs', element: <ActivityLogs /> },
    ]
  },
  {
    path: '/kitchen',
    element: <RequireRole roles={['admin','kitchen','chef']}><KitchenKDS /></RequireRole>
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

// Export the active router based on the domain
export const router = isInternal ? internalRouter : publicRouter;
