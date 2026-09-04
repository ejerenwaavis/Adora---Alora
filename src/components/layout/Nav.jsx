import { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate }       from 'react-router-dom';
import { useAuth }                           from '../../contexts/AuthContext.jsx';
import styles                                from './Nav.module.css';
import SearchOverlay                         from '../ui/SearchOverlay';

/* ─── Monogram Seal (from mockup) ─────────────────────────────────────────── */


/* ─── Nav Links ─────────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { to: '/movement',    label: 'Movement'    },
  { to: '/cafe',        label: 'Café'        },
  { to: '/fashion',     label: 'Fashion'     },
  { to: '/venue-hire',  label: 'Venue Hire'  },
  { to: '/events',      label: 'Events'      },
  { to: '/visit',       label: 'Visit'       },
];

export default function Nav() {
  const { user, isStaff, logout } = useAuth();
  const navigate  = useNavigate();
  const [open, setOpen]             = useState(false);
  const [scrolled, setScrolled]     = useState(false);
  const [userMenu, setUserMenu]     = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Scroll shadow
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Close drawer on route change (mobile)
  const closeDrawer = useCallback(() => setOpen(false), []);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenu) return;
    const handler = (e) => {
      if (!e.target.closest('[data-user-menu]')) setUserMenu(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [userMenu]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setUserMenu(false);
  };

  return (
    <>
      {/* ─── Main Header ─── */}
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <nav className={styles.nav}>
          {/* Brand */}
          <Link to="/" className={styles.brand} aria-label="Aora House — Home">
            <div className={styles.logo}>Aora House</div>
          </Link>

          {/* Desktop nav links */}
          <ul className={styles.navLinks}>
            {NAV_LINKS.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Right side */}
          <div className={styles.navRight}>
            
            {/* Search Icon */}
            <button 
              className={styles.searchToggleBtn} 
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cocoa-deep)', display: 'flex', alignItems: 'center' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>

            <Link to="/movement" className="btn btn-primary hide-mobile">
              Book a Class <span className="btn-arrow">→</span>
            </Link>

            {user ? (
              <div className={styles.userMenu} data-user-menu>
                <button
                  className={styles.userBtn}
                  onClick={() => setUserMenu(v => !v)}
                  aria-label="Account menu"
                >
                  <span className={styles.userInitial}>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </span>
                </button>
                {userMenu && (
                  <div className={styles.userDropdown}>
                    <div className={styles.userInfo}>
                      <strong>{user.firstName} {user.lastName}</strong>
                      <span>{user.email}</span>
                    </div>
                    <Link to="/account" onClick={() => setUserMenu(false)}>Dashboard Overview</Link>
                    <Link to="/account?tab=bookings" onClick={() => setUserMenu(false)}>My Classes &amp; Events</Link>
                    <Link to="/account?tab=passes" onClick={() => setUserMenu(false)}>Digital QR Passes</Link>
                    <Link to="/account/waiver" onClick={() => setUserMenu(false)}>Liability Waiver</Link>
                    {isStaff && (
                      <>
                        <div style={{ height: '1px', background: 'var(--line)', margin: '4px 0' }} />
                        {['admin','content_editor','finance','instructor'].includes(user.role) && (
                          <Link to="/admin" onClick={() => setUserMenu(false)}>Admin Panel</Link>
                        )}
                        {['admin','clerk'].includes(user.role) && (
                          <Link to="/clerk" onClick={() => setUserMenu(false)}>Clerk Desk</Link>
                        )}
                      </>
                    )}
                    <div style={{ height: '1px', background: 'var(--line)', margin: '4px 0' }} />
                    <button onClick={handleLogout} className={styles.logoutBtn}>Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className={styles.navSignIn}>Sign In</Link>
            )}

            {/* Mobile hamburger */}
            <button
              className={`${styles.hamburger} ${open ? styles.hamburgerOpen : ''}`}
              onClick={() => setOpen(v => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              <span /><span /><span />
            </button>
          </div>
        </nav>
      </header>

      {/* ─── Mobile Drawer ─── */}
      <div
        className={`${styles.overlay} ${open ? styles.overlayOpen : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />
      <div
        className={`${styles.drawer} ${open ? styles.drawerOpen : ''}`}
        aria-hidden={!open}
      >
        <ul className={styles.drawerLinks}>
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to}>
              <NavLink to={to} onClick={closeDrawer} className={styles.drawerLink}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className={styles.drawerFooter}>
          <Link to="/movement" className="btn btn-primary" onClick={closeDrawer} style={{ width: '100%', justifyContent: 'center' }}>
            Book a Class →
          </Link>
        </div>
      </div>

      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}

/* ─── Announcement Bar (CMS-driven in Phase 3) ──────────────────────────────── */
function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  // TODO Phase 3: fetch active announcements from /api/site/announcements
  const message = 'Aora House — Opening soon in Lagos. Join the waitlist.';

  if (dismissed) return null;
  return (
    <div className={styles.announce} role="banner">
      <span>{message}</span>
      <button
        className={styles.announceClose}
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
      >
        ×
      </button>
    </div>
  );
}
