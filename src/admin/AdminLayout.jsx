import { useState } from 'react';
import { Outlet, NavLink, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/ui/Icon';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Basic guard (middleware also protects the API, but we protect the UI here too)
  if (!user || (user.role !== 'admin' && user.role !== 'content_editor')) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.role === 'admin';
  const isContentEditor = user.role === 'content_editor';
  const isFinance = user.role === 'finance';

  const isLinkActive = (path, tab = null) => {
    if (path === '/admin' && !tab) {
      return location.pathname === '/admin';
    }
    const currentTab = new URLSearchParams(location.search).get('tab');
    if (tab) {
      return location.pathname === path && currentTab === tab;
    }
    return location.pathname === path && !currentTab;
  };

  return (
    <div className={styles.adminContainer}>
      {/* Mobile Topbar */}
      <header className={styles.mobileHeader}>
        <div 
          className={`${styles.cHamburger} ${isMobileMenuOpen ? styles.open : ''}`} 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          title="Toggle menu"
        >
          <div className={styles.cHamburgerIcon}>
            <span></span><span></span><span></span>
          </div>
        </div>
        <Link to="/" className={styles.mhBrand} title="Visit Public Site" style={{ textDecoration: 'none' }}>
          <span className={styles.mhWordmark}>Aora House</span>
          <span className={styles.badge}>
            {isContentEditor ? 'Content CMS' : isFinance ? 'Finance' : 'Admin'}
          </span>
        </Link>
      </header>

      {/* Sidebar Overlay */}
      <div 
        className={`${styles.sidebarOverlay} ${isMobileMenuOpen ? styles.show : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      <aside className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ''}`}>
        <Link to="/" className={styles.brand} title="Visit Public Site" style={{ textDecoration: 'none' }}>
          <span className={styles.wordmark}>Aora House</span>
          <span className={styles.badge}>
            {isContentEditor ? 'Content CMS' : isFinance ? 'Finance' : 'Admin'}
          </span>
        </Link>
        
        <nav className={styles.nav}>
          <div className={styles.navGroup} style={{ marginBottom: '1.25rem' }}>
            <NavLink to="/admin" end className={({isActive}) => isActive ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
              <Icon name="site-content" size={16} className={styles.navIcon} /> Dashboard
            </NavLink>
          </div>

          {/* Site Content CMS */}
          {(isAdmin || isContentEditor) && (
            <div className={styles.navGroup}>
              <span className={styles.groupTitle}>
                <Icon name="site-content" size={14} className={styles.groupIcon} />
                Site Content
              </span>
              <NavLink to="/admin/announcements" className={({isActive}) => isActive ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="announcements" size={16} className={styles.navIcon} /> Announcements
              </NavLink>
              <NavLink to="/admin/faqs" className={({isActive}) => isActive ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="faqs" size={16} className={styles.navIcon} /> FAQs
              </NavLink>
            </div>
          )}
          
          {/* Café Menu */}
          {(isAdmin || isContentEditor) && (
            <div className={styles.navGroup}>
              <span className={styles.groupTitle}>
                <Icon name="cafe" size={14} className={styles.groupIcon} />
                Café Menu
              </span>
              <Link to="/admin/menu" className={isLinkActive('/admin/menu') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="cafe-items" size={16} className={styles.navIcon} /> Menu Items
              </Link>
              <Link to="/admin/menu?tab=categories" className={isLinkActive('/admin/menu', 'categories') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="layers" size={16} className={styles.navIcon} /> Menu Categories
              </Link>
            </div>
          )}

          {/* Movement */}
          {(isAdmin || isContentEditor) && (
            <div className={styles.navGroup}>
              <span className={styles.groupTitle}>
                <Icon name="movement" size={14} className={styles.groupIcon} />
                Movement
              </span>
              <Link to="/admin/classes" className={isLinkActive('/admin/classes') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="classes" size={16} className={styles.navIcon} /> Class Types
              </Link>
              <Link to="/admin/classes?tab=instructors" className={isLinkActive('/admin/classes', 'instructors') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="site-content" size={16} className={styles.navIcon} /> Instructors
              </Link>
              <NavLink to="/admin/timetable" className={({isActive}) => isActive ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="timetable" size={16} className={styles.navIcon} /> Timetable
              </NavLink>
            </div>
          )}

          {/* Fashion */}
          {(isAdmin || isContentEditor) && (
            <div className={styles.navGroup}>
              <span className={styles.groupTitle}>
                <Icon name="fashion" size={14} className={styles.groupIcon} />
                Fashion
              </span>
              <Link to="/admin/fashion" className={isLinkActive('/admin/fashion') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="fashion" size={16} className={styles.navIcon} /> Fashion Items
              </Link>
              <Link to="/admin/fashion?tab=layers" className={isLinkActive('/admin/fashion', 'layers') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="layers" size={16} className={styles.navIcon} /> Fashion Layers
              </Link>
            </div>
          )}

          {/* Venues & Events */}
          {(isAdmin || isContentEditor) && (
            <div className={styles.navGroup}>
              <span className={styles.groupTitle}>
                <Icon name="venues-events" size={14} className={styles.groupIcon} />
                Venues & Events
              </span>
              <Link to="/admin/events" className={isLinkActive('/admin/events') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="spaces-events" size={16} className={styles.navIcon} /> Events
              </Link>
              <Link to="/admin/events?tab=venues" className={isLinkActive('/admin/events', 'venues') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="site-content" size={16} className={styles.navIcon} /> Spaces & Facilities
              </Link>
              <NavLink to="/admin/venue-enquiries" className={({isActive}) => isActive ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="announcements" size={16} className={styles.navIcon} /> Venue Enquiries
              </NavLink>
            </div>
          )}

          {/* People & Access — Super Admin Only */}
          {isAdmin && (
            <div className={styles.navGroup}>
              <span className={styles.groupTitle}>
                <Icon name="site-content" size={14} className={styles.groupIcon} />
                People & Access
              </span>
              <Link to="/admin/users" className={isLinkActive('/admin/users') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="site-content" size={16} className={styles.navIcon} /> Member Directory
              </Link>
              <Link to="/admin/users?tab=staff" className={isLinkActive('/admin/users', 'staff') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="classes" size={16} className={styles.navIcon} /> Staff Management
              </Link>
              <Link to="/admin/users?tab=access" className={isLinkActive('/admin/users', 'access') ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="settings" size={16} className={styles.navIcon} /> Access Matrix
              </Link>
            </div>
          )}

          {/* Commerce & Config */}
          {(isAdmin || isFinance) && (
            <div className={styles.navGroup}>
              <span className={styles.groupTitle}>
                <Icon name="commerce-config" size={14} className={styles.groupIcon} />
                Commerce & Config
              </span>
              <NavLink to="/admin/credit-packs" className={({isActive}) => isActive ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                <Icon name="credit-packs" size={16} className={styles.navIcon} /> Credit Packs
              </NavLink>
              {isAdmin && (
                <>
                  <NavLink to="/admin/settings" className={({isActive}) => isActive ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                    <Icon name="settings" size={16} className={styles.navIcon} /> Global Settings
                  </NavLink>
                  <NavLink to="/admin/activity-logs" className={({isActive}) => isActive ? styles.active : ''} onClick={() => setIsMobileMenuOpen(false)}>
                    <Icon name="timetable" size={16} className={styles.navIcon} /> Activity Logs
                  </NavLink>
                </>
              )}
            </div>
          )}
        </nav>

        <div className={styles.userBox}>
          <div className={styles.userInfo}>
            <strong>{user.firstName} {user.lastName}</strong>
            <span style={{ textTransform: 'capitalize' }}>{user.role?.replace('_', ' ')}</span>
          </div>
          <button onClick={logout} className={styles.logoutBtn}>Log out</button>
        </div>
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
