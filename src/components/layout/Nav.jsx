import { useState, useEffect, useCallback } from 'react';
import { Link, NavLink, useNavigate }       from 'react-router-dom';
import { useAuth }                           from '../../contexts/AuthContext.jsx';
import styles                                from './Nav.module.css';

/* ─── Monogram Seal (from mockup) ─────────────────────────────────────────── */
function Seal() {
  return (
    <svg width="38" height="38" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="44" strokeWidth="1.5"
        className={styles.sealCircle} />
      <text x="50" y="40" fontFamily="Jost, sans-serif" fontSize="9"
        letterSpacing="5" textAnchor="middle" fill="currentColor" opacity=".7">
        ADORA
      </text>
      <text x="50" y="57" fontFamily="Beau Rivage, cursive" fontSize="28"
        textAnchor="middle" fill="currentColor">
        &amp;
      </text>
      <text x="50" y="71" fontFamily="Jost, sans-serif" fontSize="9"
        letterSpacing="5" textAnchor="middle" fill="currentColor" opacity=".7">
        ALORA
      </text>
    </svg>
  );
}

/* ─── Nav Links ─────────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { to: '/movement',    label: 'Movement'    },
  { to: '/our-house',   label: 'Our House'   },
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
      {/* ─── Announcement Bar ─── */}
      <AnnouncementBar />

      {/* ─── Main Header ─── */}
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <nav className={styles.nav}>
          {/* Brand */}
          <Link to="/" className={styles.brand} aria-label="Adora & Alora — Home">
            <Seal />
            <span className={styles.wordmark}>Adora &amp; Alora</span>
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
                    <Link to="/account"   onClick={() => setUserMenu(false)}>My Account</Link>
                    {isStaff && (
                      <>
                        {['admin','content_editor','finance','instructor'].includes(user.role) && (
                          <Link to="/admin"  onClick={() => setUserMenu(false)}>Admin Panel</Link>
                        )}
                        {['admin','clerk'].includes(user.role) && (
                          <Link to="/clerk" onClick={() => setUserMenu(false)}>Clerk Desk</Link>
                        )}
                      </>
                    )}
                    <button onClick={handleLogout} className={styles.logoutBtn}>Sign Out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/account" className={styles.navUtil}>Sign In</Link>
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
    </>
  );
}

/* ─── Announcement Bar (CMS-driven in Phase 3) ──────────────────────────────── */
function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  // TODO Phase 3: fetch active announcements from /api/site/announcements
  const message = 'Adora & Alora — Opening soon in Lagos. Join the waitlist.';

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
