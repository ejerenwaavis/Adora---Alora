import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Icon from '../components/ui/Icon.jsx';
import styles from './CMS.module.css';

export default function AdminDashboard() {
  const { user, authFetch } = useAuth();
  const [metrics, setMetrics] = useState({
    totalMembers: 0,
    activeStaff: 0,
    classBookings: 0,
    todayCheckIns: 0,
    cafeReservations: 0,
    eventBookings: 0,
    venueEnquiries: 0,
    todayLogsCount: 0
  });
  const [stats, setStats] = useState({
    menuItems: 0,
    classes: 0,
    events: 0,
    fashion: 0,
    announcements: 0,
    creditPacks: 0,
    recentLogs: [],
    allLogs: []
  });
  const [period, setPeriod] = useState('today'); // 'today' | 'week' | 'all'
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [showAllLogsModal, setShowAllLogsModal] = useState(false);

  // Drill-down Modal State
  const [activeModal, setActiveModal] = useState(null); // 'members' | 'movement' | 'cafe' | 'events' | 'checkins'
  const [modalLoading, setModalLoading] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalSearch, setModalSearch] = useState('');

  // Fetch metrics when period changes
  useEffect(() => {
    async function fetchPeriodMetrics() {
      setMetricsLoading(true);
      try {
        const res = await authFetch(`/api/admin/metrics?period=${period}`);
        if (res.ok) {
          const metricData = await res.json();
          setMetrics(metricData);
        }
      } catch (e) {
        console.error('Error fetching period metrics:', e);
      } finally {
        setMetricsLoading(false);
      }
    }
    fetchPeriodMetrics();
  }, [period, authFetch]);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [menuRes, classRes, eventRes, fashionRes, announceRes, creditRes, logsRes] = await Promise.all([
          authFetch('/api/cms/menu-items').catch(() => null),
          authFetch('/api/cms/class-types').catch(() => null),
          authFetch('/api/cms/events').catch(() => null),
          authFetch('/api/cms/fashion-items').catch(() => null),
          authFetch('/api/cms/announcements').catch(() => null),
          authFetch('/api/cms/credit-packs').catch(() => null),
          authFetch('/api/clerk/logs').catch(() => null)
        ]);

        const parseData = async (res) => {
          if (!res || !res.ok) return [];
          try {
            const data = await res.json();
            return Array.isArray(data) ? data : [];
          } catch {
            return [];
          }
        };

        const [menu, classes, events, fashion, announcements, credits, logs] = await Promise.all([
          parseData(menuRes),
          parseData(classRes),
          parseData(eventRes),
          parseData(fashionRes),
          parseData(announceRes),
          parseData(creditRes),
          parseData(logsRes)
        ]);

        setStats({
          menuItems: menu.length,
          classes: classes.length,
          events: events.length,
          fashion: fashion.length,
          announcements: announcements.length,
          creditPacks: credits.length,
          recentLogs: logs.slice(0, 5),
          allLogs: logs
        });
      } catch (err) {
        console.error('Failed to load admin dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [authFetch]);

  const openDrillDown = async (type) => {
    setActiveModal(type);
    setModalLoading(true);
    setModalSearch('');
    setModalData(null);
    try {
      let endpoint = '';
      if (type === 'members') endpoint = '/api/admin/members-details';
      else if (type === 'movement') endpoint = '/api/admin/movement-details';
      else if (type === 'cafe') endpoint = '/api/admin/cafe-details';
      else if (type === 'events') endpoint = '/api/admin/events-details';
      else if (type === 'venues') endpoint = '/api/admin/venues-details';
      else if (type === 'checkins') endpoint = '/api/admin/checkins-details';

      if (endpoint) {
        const res = await authFetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          setModalData(data);
        }
      }
    } catch (err) {
      console.error(`Failed to fetch ${type} details:`, err);
    } finally {
      setModalLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isContentEditor = user?.role === 'content_editor';
  const isFinance = user?.role === 'finance';

  const quickLinks = [
    ...(isAdmin ? [{ title: 'User & Staff Ops', desc: `${metrics.totalMembers} members · ${metrics.activeStaff} staff`, to: '/admin/users', icon: 'site-content', count: metrics.totalMembers, color: '#C89B4A' }] : []),
    { title: 'Café Menu', desc: `${stats.menuItems} items & categories`, to: '/admin/menu', icon: 'cafe', count: stats.menuItems, color: '#C89B4A' },
    { title: 'Classes & Movement', desc: `${stats.classes} classes & timetable`, to: '/admin/classes', icon: 'classes', count: stats.classes, color: '#414F36' },
    { title: 'Venues & Events', desc: `${stats.events} loft & house events`, to: '/admin/events', icon: 'spaces-events', count: stats.events, color: '#A4451F' },
    { title: 'Fashion Collection', desc: `${stats.fashion} curated fashion items`, to: '/admin/fashion', icon: 'layers', count: stats.fashion, color: '#4A3527' },
    ...((isAdmin || isFinance) ? [{ title: 'Credit Packs', desc: `${stats.creditPacks} pricing bundles`, to: '/admin/credit-packs', icon: 'credit-packs', count: stats.creditPacks, color: '#8B3318' }] : []),
    { title: 'Announcements', desc: `${stats.announcements} active banners`, to: '/admin/announcements', icon: 'announcements', count: stats.announcements, color: '#8B3318' },
    ...(isAdmin ? [{ title: 'Global Settings', desc: 'Booking rules, payments, socials', to: '/admin/settings', icon: 'settings', count: 'Config', color: '#633806' }] : [])
  ];

  const formatLogTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Welcome Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.5rem' }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--rust)', letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
            {isContentEditor ? 'Content Management CMS' : isFinance ? 'Finance Control Center' : 'Admin Control Center'}
          </div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '2.25rem', color: 'var(--cocoa-deep)', margin: 0 }}>
            {isContentEditor ? 'Content Editor Dashboard' : isFinance ? 'Finance Dashboard' : 'Executive Dashboard'}
          </h1>
          <p style={{ color: 'var(--taupe)', marginTop: '0.35rem', fontSize: '0.95rem' }}>
            Welcome back, <strong>{user?.firstName || 'Admin'} {user?.lastName || ''}</strong>. {isContentEditor ? 'Manage café menus, movement classes, events, fashion catalogue, and house announcements.' : 'Real-time overview of house community, operations, and spaces.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {isAdmin && (
            <>
              <Link to="/concierge" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <Icon name="site-content" size={14} /> Guest Concierge
              </Link>
              <Link to="/finance" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <Icon name="credit-packs" size={14} /> Finance Desktop
              </Link>
              <Link to="/clerk" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <Icon name="site-content" size={14} /> Clerk Front Desk
              </Link>
            </>
          )}
          <Link to="/" target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            View Public Site <span className="btn-arrow">↗</span>
          </Link>
        </div>
      </div>

      {/* Operational Highlights & Attention Items */}
      {metrics.highlights && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          {/* Highlight 1: Pending Takeout Orders */}
          <Link
            to="/clerk/cafe"
            style={{
              textDecoration: 'none',
              background: (metrics.highlights.pendingTakeoutOrders > 0) ? 'rgba(184, 95, 60, 0.08)' : '#FFFDF9',
              border: '1px solid ' + ((metrics.highlights.pendingTakeoutOrders > 0) ? 'var(--rust, #B85F3C)' : 'rgba(227, 211, 184, 0.8)'),
              borderRadius: '6px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe)' }}>Takeout Kitchen</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: (metrics.highlights.pendingTakeoutOrders > 0) ? 'var(--rust, #B85F3C)' : 'var(--cocoa-deep)', marginTop: '2px' }}>
                {metrics.highlights.pendingTakeoutOrders} Pending
              </div>
            </div>
            <span style={{ fontSize: '1.4rem' }}>🛍️</span>
          </Link>

          {/* Highlight 2: Unread Enquiries */}
          <Link
            to="/admin/enquiries"
            style={{
              textDecoration: 'none',
              background: (metrics.highlights.unreadEnquiries > 0) ? 'rgba(200, 155, 74, 0.08)' : '#FFFDF9',
              border: '1px solid ' + ((metrics.highlights.unreadEnquiries > 0) ? 'var(--gold, #C89B4A)' : 'rgba(227, 211, 184, 0.8)'),
              borderRadius: '6px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe)' }}>Venue Enquiries</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: (metrics.highlights.unreadEnquiries > 0) ? '#8C5815' : 'var(--cocoa-deep)', marginTop: '2px' }}>
                {metrics.highlights.unreadEnquiries} Unread
              </div>
            </div>
            <span style={{ fontSize: '1.4rem' }}>✉️</span>
          </Link>

          {/* Highlight 3: Failed Payments */}
          <Link
            to="/finance"
            style={{
              textDecoration: 'none',
              background: (metrics.highlights.failedPayments > 0) ? 'rgba(139, 32, 32, 0.06)' : '#FFFDF9',
              border: '1px solid ' + ((metrics.highlights.failedPayments > 0) ? 'rgba(139, 32, 32, 0.4)' : 'rgba(227, 211, 184, 0.8)'),
              borderRadius: '6px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe)' }}>Failed Payments</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: (metrics.highlights.failedPayments > 0) ? '#8B2020' : '#2E6B3E', marginTop: '2px' }}>
                {metrics.highlights.failedPayments > 0 ? `${metrics.highlights.failedPayments} Action Needed` : 'All Clear ✓'}
              </div>
            </div>
            <span style={{ fontSize: '1.4rem' }}>💳</span>
          </Link>

          {/* Highlight 4: Upcoming Classes */}
          <Link
            to="/admin/classes"
            style={{
              textDecoration: 'none',
              background: '#FFFDF9',
              border: '1px solid rgba(227, 211, 184, 0.8)',
              borderRadius: '6px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.15s ease'
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe)' }}>Upcoming Classes</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--forest, #414F36)', marginTop: '2px' }}>
                {metrics.highlights.upcomingClasses} Scheduled
              </div>
            </div>
            <span style={{ fontSize: '1.4rem' }}>🧘</span>
          </Link>
        </div>
      )}

      {/* House Operations & Performance Pulse with Time Period Toggle */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.25rem', color: 'var(--cocoa-deep)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>House Operational Pulse</span>
            <span style={{ fontSize: '0.72rem', fontWeight: 400, color: '#2E6B3E', background: 'rgba(46, 107, 62, 0.08)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
              {metricsLoading ? 'Updating…' : 'Live Data · Click Card for Details'}
            </span>
          </h2>

          {/* Period Filter Selector */}
          <div style={{ display: 'inline-flex', background: '#FAF6EF', padding: '3px', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.8)' }}>
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'all', label: 'All Time' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                style={{
                  background: period === p.id ? 'var(--cocoa-deep, #2A1D14)' : 'transparent',
                  color: period === p.id ? '#FCF8F0' : 'var(--cocoa-deep, #2A1D14)',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '4px',
                  fontSize: '0.78rem',
                  fontWeight: period === p.id ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {/* Card 1: Members */}
          <div 
            onClick={() => openDrillDown('members')}
            style={{ 
              background: '#FFFDF9', 
              border: '1px solid rgba(227, 211, 184, 0.7)', 
              borderLeft: '4px solid var(--gold)', 
              borderRadius: '6px', 
              padding: '1.25rem 1.5rem', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(42, 29, 20, 0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)' }}>House Members</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600 }}>View ↗</span>
            </div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.85rem', color: 'var(--cocoa-deep)', fontWeight: 500, marginTop: '0.35rem' }}>{loading ? '—' : metrics.totalMembers}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--forest)', marginTop: '0.2rem' }}>Registered guests</div>
          </div>

          {/* Card 2: Movement */}
          <div 
            onClick={() => openDrillDown('movement')}
            style={{ 
              background: '#FFFDF9', 
              border: '1px solid rgba(227, 211, 184, 0.7)', 
              borderLeft: '4px solid #414F36', 
              borderRadius: '6px', 
              padding: '1.25rem 1.5rem', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(42, 29, 20, 0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)' }}>Movement Bookings</div>
              <span style={{ fontSize: '0.75rem', color: '#414F36', fontWeight: 600 }}>View ↗</span>
            </div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.85rem', color: 'var(--cocoa-deep)', fontWeight: 500, marginTop: '0.35rem' }}>{loading ? '—' : metrics.classBookings}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--forest)', marginTop: '0.2rem' }}>Studio reservations</div>
          </div>

          {/* Card 3: Cafe */}
          <div 
            onClick={() => openDrillDown('cafe')}
            style={{ 
              background: '#FFFDF9', 
              border: '1px solid rgba(227, 211, 184, 0.7)', 
              borderLeft: '4px solid var(--rust)', 
              borderRadius: '6px', 
              padding: '1.25rem 1.5rem', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(42, 29, 20, 0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)' }}>Café Traffic</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--rust)', fontWeight: 600 }}>View ↗</span>
            </div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.85rem', color: 'var(--cocoa-deep)', fontWeight: 500, marginTop: '0.35rem' }}>{loading ? '—' : metrics.cafeReservations}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--rust)', marginTop: '0.2rem' }}>Table & walk-in guests</div>
          </div>

          {/* Card 4: Event Bookings */}
          <div 
            onClick={() => openDrillDown('events')}
            style={{ 
              background: '#FFFDF9', 
              border: '1px solid rgba(227, 211, 184, 0.7)', 
              borderLeft: '4px solid #4A3527', 
              borderRadius: '6px', 
              padding: '1.25rem 1.5rem', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(42, 29, 20, 0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)' }}>Event Bookings</div>
              <span style={{ fontSize: '0.75rem', color: '#4A3527', fontWeight: 600 }}>View ↗</span>
            </div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.85rem', color: 'var(--cocoa-deep)', fontWeight: 500, marginTop: '0.35rem' }}>{loading ? '—' : metrics.eventBookings}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--taupe)', marginTop: '0.2rem' }}>Ticket holders · Events</div>
          </div>

          {/* Card 5: Venue Inquiries */}
          <div 
            onClick={() => openDrillDown('venues')}
            style={{ 
              background: '#FFFDF9', 
              border: '1px solid rgba(227, 211, 184, 0.7)', 
              borderLeft: '4px solid #633806', 
              borderRadius: '6px', 
              padding: '1.25rem 1.5rem', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(42, 29, 20, 0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)' }}>Venue Inquiries</div>
              <span style={{ fontSize: '0.75rem', color: '#633806', fontWeight: 600 }}>View ↗</span>
            </div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.85rem', color: 'var(--cocoa-deep)', fontWeight: 500, marginTop: '0.35rem' }}>{loading ? '—' : metrics.venueEnquiries}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--gold)', marginTop: '0.2rem' }}>Rental leads & pipeline</div>
          </div>

          {/* Card 6: Check-ins */}
          <div 
            onClick={() => openDrillDown('checkins')}
            style={{ 
              background: '#FFFDF9', 
              border: '1px solid rgba(227, 211, 184, 0.7)', 
              borderLeft: '4px solid #8B3318', 
              borderRadius: '6px', 
              padding: '1.25rem 1.5rem', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(42, 29, 20, 0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)' }}>Today's Check-ins</div>
              <span style={{ fontSize: '0.75rem', color: '#8B3318', fontWeight: 600 }}>View ↗</span>
            </div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.85rem', color: 'var(--cocoa-deep)', fontWeight: 500, marginTop: '0.35rem' }}>{loading ? '—' : metrics.todayCheckIns}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--rust)', marginTop: '0.2rem' }}>Front desk verified</div>
          </div>
        </div>
      </div>

      {/* CMS Module Quick Jump Cards */}
      <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.35rem', color: 'var(--cocoa-deep)', marginBottom: '1rem' }}>CMS Quick Management</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
        {quickLinks.map(link => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem 1.5rem',
              background: '#FFFDF9',
              border: '1px solid rgba(227, 211, 184, 0.6)',
              borderRadius: '6px',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(42, 29, 20, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(200, 155, 74, 0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';
              e.currentTarget.style.borderColor = 'rgba(227, 211, 184, 0.6)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: `${link.color}15`, color: link.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={link.icon} size={20} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.05rem', color: 'var(--cocoa-deep)', fontWeight: 500 }}>{link.title}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--taupe)', marginTop: '0.15rem' }}>{link.desc}</div>
              </div>
            </div>
            <div style={{ color: 'var(--gold)', fontSize: '1.1rem', fontWeight: 300 }}>→</div>
          </Link>
        ))}
      </div>

      {/* Two-Column Section: System Status & Recent Operations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* System Health */}
        <div style={{ background: '#FFFDF9', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: '6px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1.15rem', color: 'var(--cocoa-deep)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#5CBF7A' }}></span>
            House System Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(227, 211, 184, 0.4)' }}>
              <span style={{ color: 'var(--taupe)' }}>Database & Engine</span>
              <span style={{ color: '#2E6B3E', fontWeight: 500 }}>● Online (MongoDB Atlas)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(227, 211, 184, 0.4)' }}>
              <span style={{ color: 'var(--taupe)' }}>Payment Gateway</span>
              <span style={{ color: '#2E6B3E', fontWeight: 500 }}>● Ready (Paystack)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(227, 211, 184, 0.4)' }}>
              <span style={{ color: 'var(--taupe)' }}>Current User Role</span>
              <span style={{ color: 'var(--cocoa-deep)', fontWeight: 500, textTransform: 'capitalize' }}>{user?.role || 'admin'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--taupe)' }}>House Station</span>
              <span style={{ color: 'var(--gold)', fontWeight: 500 }}>Victoria Island, Lagos</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div style={{ background: '#FFFDF9', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: '6px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1.15rem', color: 'var(--cocoa-deep)', margin: 0 }}>Recent Activity</h3>
            {stats.allLogs.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAllLogsModal(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--rust)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, padding: 0 }}
              >
                View All ({stats.allLogs.length}) →
              </button>
            )}
          </div>
          {stats.recentLogs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.recentLogs.map((log, idx) => (
                <div key={log._id || idx} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.82rem', paddingBottom: '0.6rem', borderBottom: idx !== stats.recentLogs.length - 1 ? '1px solid rgba(227, 211, 184, 0.4)' : 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'var(--cocoa-deep)', fontWeight: 500, lineHeight: 1.35 }}>
                      {log.description || log.action}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--taupe)' }}>
                      <span>{log.user?.firstName ? `${log.user.firstName} ${log.user.lastName || ''}` : 'Staff'}</span>
                      <span>•</span>
                      <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold)' }}>{log.action}</span>
                    </div>
                  </div>
                  <span style={{ color: 'var(--taupe)', fontSize: '0.75rem', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {formatLogTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--taupe)', fontStyle: 'italic', fontSize: '0.85rem', padding: '1.5rem 0', textAlign: 'center' }}>
              No system activity logs recorded yet today. Operations from the Clerk desk and check-ins will stream here live.
            </div>
          )}
        </div>
      </div>

      {/* ── INTERACTIVE OPERATIONAL DRILL-DOWN MODAL ── */}
      {activeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20, 10, 4, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFFDF9', borderRadius: '8px', width: '100%', maxWidth: '900px', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid rgba(227, 211, 184, 0.8)', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--paper)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1.35rem', color: 'var(--cocoa-deep)', margin: 0 }}>
                  {activeModal === 'members' && 'House Community Members'}
                  {activeModal === 'movement' && 'Movement & Class Bookings'}
                  {activeModal === 'cafe' && 'Café Reservations & Seating'}
                  {activeModal === 'events' && 'Event Ticket Bookings'}
                  {activeModal === 'venues' && 'Venue Hire Leads & Pipeline'}
                  {activeModal === 'checkins' && "Front Desk Check-ins & Verifications"}
                </h3>
                <p style={{ color: 'var(--taupe)', fontSize: '0.82rem', margin: '3px 0 0 0' }}>
                  {activeModal === 'members' && 'Registered house guests and active account holders.'}
                  {activeModal === 'movement' && 'Live timetable registrations and studio attendance.'}
                  {activeModal === 'cafe' && 'Table bookings and walk-in records for the house café.'}
                  {activeModal === 'events' && 'Ticket holders and attendance for house events.'}
                  {activeModal === 'venues' && 'Incoming inquiries and bookings for venue and loft spaces.'}
                  {activeModal === 'checkins' && 'Verified guest arrivals and QR check-in records.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--taupe)', padding: '4px 8px', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            {/* Modal Search Bar */}
            <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid rgba(227, 211, 184, 0.4)', background: '#FAF6EF', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="text"
                placeholder="Filter results by name, email, event, status..."
                value={modalSearch}
                onChange={e => setModalSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid rgba(200, 155, 74, 0.4)',
                  background: '#FFFDF9',
                  fontSize: '0.85rem',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Modal Content Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--taupe)', fontStyle: 'italic' }}>
                  Loading live house records...
                </div>
              ) : !modalData ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--taupe)' }}>
                  No records available.
                </div>
              ) : (
                <>
                  {/* 1. MEMBERS VIEW */}
                  {activeModal === 'members' && Array.isArray(modalData) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {modalData
                        .filter(m => {
                          const q = modalSearch.toLowerCase();
                          return (m.firstName + ' ' + m.lastName).toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
                        })
                        .map(m => (
                          <div key={m._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#FFFFFF', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--gold)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
                                {m.firstName ? m.firstName.charAt(0).toUpperCase() : 'M'}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cocoa-deep)' }}>{m.firstName} {m.lastName}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--taupe)' }}>{m.email} {m.phone ? `· ${m.phone}` : ''}</div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--cocoa-deep)' }}>{m.credits || 0} Credits</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--taupe)' }}>Joined {formatLogTime(m.createdAt)}</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* 2. MOVEMENT BOOKINGS VIEW */}
                  {activeModal === 'movement' && Array.isArray(modalData) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {modalData
                        .filter(b => {
                          const q = modalSearch.toLowerCase();
                          const userName = b.user ? `${b.user.firstName} ${b.user.lastName}` : '';
                          const userEmail = b.user?.email || '';
                          const className = b.classSession?.classType?.name || '';
                          return userName.toLowerCase().includes(q) || userEmail.toLowerCase().includes(q) || className.toLowerCase().includes(q) || (b.status || '').toLowerCase().includes(q);
                        })
                        .map(b => (
                          <div key={b._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#FFFFFF', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: '6px' }}>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cocoa-deep)' }}>
                                {b.user ? `${b.user.firstName} ${b.user.lastName}` : 'Guest User'}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
                                Class: <strong>{b.classSession?.classType?.name || 'Movement Class'}</strong> {b.classSession?.startTime ? `· ${formatLogTime(b.classSession.startTime)}` : ''}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <span style={{ 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em', 
                                fontSize: '0.7rem', 
                                fontWeight: 600, 
                                padding: '2px 8px', 
                                borderRadius: '4px',
                                background: b.checkedInAt ? 'rgba(46, 107, 62, 0.12)' : 'rgba(200, 155, 74, 0.12)',
                                color: b.checkedInAt ? '#2E6B3E' : '#633806'
                              }}>
                                {b.checkedInAt ? 'Verified / Attended' : b.status || 'Confirmed'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--taupe)' }}>
                                {b.checkedInAt ? `Checked in: ${formatLogTime(b.checkedInAt)}` : `Booked: ${formatLogTime(b.createdAt)}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      {modalData.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--taupe)' }}>No class reservations recorded yet.</div>
                      )}
                    </div>
                  )}

                  {/* 3. CAFE VIEW */}
                  {activeModal === 'cafe' && Array.isArray(modalData) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {modalData
                        .filter(c => {
                          const q = modalSearch.toLowerCase();
                          return (c.customerName || '').toLowerCase().includes(q) || (c.customerEmail || '').toLowerCase().includes(q) || (c.status || '').toLowerCase().includes(q);
                        })
                        .map(c => (
                          <div key={c._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#FFFFFF', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: '6px' }}>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cocoa-deep)' }}>
                                {c.customerName} <span style={{ fontWeight: 400, color: 'var(--taupe)', fontSize: '0.8rem' }}>({c.partySize} Guests)</span>
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--taupe)', marginTop: '2px' }}>
                                {c.customerEmail} {c.customerPhone ? `· ${c.customerPhone}` : ''}
                                {c.specialRequests ? ` · Note: "${c.specialRequests}"` : ''}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <span style={{ 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em', 
                                fontSize: '0.7rem', 
                                fontWeight: 600, 
                                padding: '2px 8px', 
                                borderRadius: '4px',
                                background: c.status === 'seated' ? 'rgba(46, 107, 62, 0.12)' : 'rgba(200, 155, 74, 0.12)',
                                color: c.status === 'seated' ? '#2E6B3E' : '#633806'
                              }}>
                                {c.status || 'Confirmed'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--taupe)' }}>
                                Date: {c.date ? new Date(c.date).toLocaleDateString() : ''} {c.time || ''}
                              </span>
                            </div>
                          </div>
                        ))}
                      {modalData.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--taupe)' }}>No café reservations found.</div>
                      )}
                    </div>
                  )}

                  {/* 4. EVENT BOOKINGS VIEW */}
                  {activeModal === 'events' && Array.isArray(modalData) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {modalData
                        .filter(eb => {
                          const q = modalSearch.toLowerCase();
                          return (eb.customerName || '').toLowerCase().includes(q) || (eb.customerEmail || '').toLowerCase().includes(q) || (eb.event?.title || '').toLowerCase().includes(q);
                        })
                        .map(eb => (
                          <div key={eb._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#FFFFFF', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: '6px' }}>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cocoa-deep)' }}>{eb.customerName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
                                Event: <strong>{eb.event?.title || 'House Event'}</strong> · {eb.ticketQuantity} Ticket(s)
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--forest)', fontWeight: 600 }}>₦{((eb.amountPaidKobo || 0) / 100).toLocaleString()}</span>
                              <div style={{ fontSize: '0.72rem', color: 'var(--taupe)' }}>Booked {formatLogTime(eb.createdAt)}</div>
                            </div>
                          </div>
                        ))}
                      {modalData.length === 0 && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--taupe)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>No event ticket registrations found.</div>
                      )}
                    </div>
                  )}

                  {/* 5. VENUE INQUIRIES VIEW */}
                  {activeModal === 'venues' && Array.isArray(modalData) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {modalData
                        .filter(ve => {
                          const q = modalSearch.toLowerCase();
                          return (ve.firstName + ' ' + ve.lastName).toLowerCase().includes(q) || (ve.eventType || '').toLowerCase().includes(q) || (ve.spacePreference || '').toLowerCase().includes(q);
                        })
                        .map(ve => (
                          <div key={ve._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#FFFFFF', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: '6px' }}>
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cocoa-deep)' }}>
                                {ve.firstName} {ve.lastName} {ve.organisation ? `(${ve.organisation})` : ''}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginTop: '2px' }}>
                                Event: <strong>{ve.eventType}</strong> · {ve.guestCount} Guests · Space: <em>{ve.spacePreference}</em>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <span style={{ 
                                textTransform: 'uppercase', 
                                fontSize: '0.7rem', 
                                fontWeight: 600, 
                                padding: '2px 8px', 
                                borderRadius: '4px',
                                background: 'rgba(200, 155, 74, 0.15)',
                                color: '#633806'
                              }}>
                                {ve.status || 'New Inquiry'}
                              </span>
                              <div style={{ fontSize: '0.72rem', color: 'var(--taupe)' }}>{formatLogTime(ve.createdAt)}</div>
                            </div>
                          </div>
                        ))}
                      {modalData.length === 0 && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--taupe)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>No venue hire inquiries recorded yet.</div>
                      )}
                    </div>
                  )}

                  {/* 6. CHECK-INS VIEW */}
                  {activeModal === 'checkins' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div>
                        <h4 style={{ fontFamily: 'var(--f-display)', fontSize: '1.05rem', color: 'var(--cocoa-deep)', margin: '0 0 0.6rem 0' }}>
                          Verified Guest Check-ins
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                          {modalData.classCheckins && modalData.classCheckins.length > 0 ? (
                            modalData.classCheckins
                              .filter(ck => {
                                const q = modalSearch.toLowerCase();
                                const userName = ck.user ? `${ck.user.firstName} ${ck.user.lastName}` : '';
                                return userName.toLowerCase().includes(q) || (ck.classSession?.classType?.name || '').toLowerCase().includes(q);
                              })
                              .map(ck => (
                                <div key={ck._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#FFFFFF', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: '6px' }}>
                                  <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--cocoa-deep)' }}>
                                      {ck.user ? `${ck.user.firstName} ${ck.user.lastName}` : 'Guest'}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--taupe)', marginTop: '2px' }}>
                                      Class: <strong>{ck.classSession?.classType?.name || 'Movement Studio'}</strong>
                                      {ck.checkedInBy ? ` · Verified by Clerk: ${ck.checkedInBy.firstName} ${ck.checkedInBy.lastName || ''}` : ''}
                                    </div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#2E6B3E', background: 'rgba(46, 107, 62, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                      VERIFIED
                                    </span>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--taupe)', marginTop: '3px' }}>
                                      {formatLogTime(ck.checkedInAt)}
                                    </div>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div style={{ fontSize: '0.85rem', color: 'var(--taupe)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                              No guest check-ins recorded yet today. When guests scan their QR passes at the Front Desk, they will stream here.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--line)', background: 'var(--paper)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>
                {modalData ? (Array.isArray(modalData) ? `${modalData.length} records found` : 'Live database feed') : ''}
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="btn btn-outline"
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INLINE ALL ACTIVITY AUDIT LOG MODAL ── */}
      {showAllLogsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20, 10, 4, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFFDF9', borderRadius: '8px', width: '100%', maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid rgba(227, 211, 184, 0.8)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--paper)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1.3rem', color: 'var(--cocoa-deep)', margin: 0 }}>House Activity Log</h3>
                <p style={{ color: 'var(--taupe)', fontSize: '0.8rem', margin: '2px 0 0 0' }}>Complete audit trail of staff operations and guest verifications</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllLogsModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--taupe)', padding: '4px 8px', lineHeight: 1 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {stats.allLogs.map((log, idx) => (
                  <div key={log._id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '0.85rem 1rem', background: '#FFFFFF', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: '6px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--cocoa-deep)' }}>{log.description || log.action}</div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.75rem', color: 'var(--taupe)', marginTop: '3px' }}>
                        <span>Clerk: <strong>{log.user?.firstName ? `${log.user.firstName} ${log.user.lastName || ''}` : log.user?.email || 'System'}</strong></span>
                        <span>•</span>
                        <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(200, 155, 74, 0.12)', color: '#633806', padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem' }}>
                          {log.action}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--taupe)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {formatLogTime(log.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--line)', background: 'var(--paper)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowAllLogsModal(false)}
                className="btn btn-outline"
                style={{ padding: '8px 16px', fontSize: '0.8rem' }}
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
