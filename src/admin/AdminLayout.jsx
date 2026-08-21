import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/ui/Icon';
import styles from './AdminLayout.module.css';

export default function AdminLayout() {
  const { user, logout } = useAuth();

  // Basic guard (middleware also protects the API, but we protect the UI here too)
  if (!user || (user.role !== 'admin' && user.role !== 'content_editor')) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className="wordmark">Aora House</span>
          <span className={styles.badge}>Admin</span>
        </div>
        
        <nav className={styles.nav}>
          <div className={styles.navGroup}>
            <span className={styles.groupTitle}>
              <Icon name="site-content" size={14} className={styles.groupIcon} />
              Site Content
            </span>
            <NavLink to="/admin/announcements" className={({isActive}) => isActive ? styles.active : ''}>
              <Icon name="announcements" size={16} className={styles.navIcon} /> Announcements
            </NavLink>
            <NavLink to="/admin/faqs" className={({isActive}) => isActive ? styles.active : ''}>
              <Icon name="faqs" size={16} className={styles.navIcon} /> FAQs
            </NavLink>
          </div>
          
          <div className={styles.navGroup}>
            <span className={styles.groupTitle}>
              <Icon name="cafe" size={14} className={styles.groupIcon} />
              Café Menu
            </span>
            <NavLink to="/admin/menu" className={({isActive}) => isActive ? styles.active : ''}>
              <Icon name="cafe-items" size={16} className={styles.navIcon} /> Categories & Items
            </NavLink>
          </div>

          <div className={styles.navGroup}>
            <span className={styles.groupTitle}>
              <Icon name="movement" size={14} className={styles.groupIcon} />
              Movement
            </span>
            <NavLink to="/admin/classes" className={({isActive}) => isActive ? styles.active : ''}>
              <Icon name="classes" size={16} className={styles.navIcon} /> Classes & Instructors
            </NavLink>
            <NavLink to="/admin/timetable" className={({isActive}) => isActive ? styles.active : ''}>
              <Icon name="timetable" size={16} className={styles.navIcon} /> Timetable
            </NavLink>
          </div>

          <div className={styles.navGroup}>
            <span className={styles.groupTitle}>
              <Icon name="fashion" size={14} className={styles.groupIcon} />
              Fashion
            </span>
            <NavLink to="/admin/fashion" className={({isActive}) => isActive ? styles.active : ''}>
              <Icon name="layers" size={16} className={styles.navIcon} /> Layers & Items
            </NavLink>
          </div>

          <div className={styles.navGroup}>
            <span className={styles.groupTitle}>
              <Icon name="venues-events" size={14} className={styles.groupIcon} />
              Venues & Events
            </span>
            <NavLink to="/admin/events" className={({isActive}) => isActive ? styles.active : ''}>
              <Icon name="spaces-events" size={16} className={styles.navIcon} /> Spaces & Events
            </NavLink>
          </div>

          <div className={styles.navGroup}>
            <span className={styles.groupTitle}>
              <Icon name="commerce-config" size={14} className={styles.groupIcon} />
              Commerce & Config
            </span>
            <NavLink to="/admin/credit-packs" className={({isActive}) => isActive ? styles.active : ''}>
              <Icon name="credit-packs" size={16} className={styles.navIcon} /> Credit Packs
            </NavLink>
            <NavLink to="/admin/settings" className={({isActive}) => isActive ? styles.active : ''}>
              <Icon name="settings" size={16} className={styles.navIcon} /> Settings
            </NavLink>
          </div>
        </nav>

        <div className={styles.userBox}>
          <div className={styles.userInfo}>
            <strong>{user.firstName} {user.lastName}</strong>
            <span>{user.role}</span>
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
