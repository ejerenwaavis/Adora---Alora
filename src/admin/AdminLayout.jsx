import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
          <span className="wordmark">Adora &amp; Alora</span>
          <span className={styles.badge}>Admin</span>
        </div>
        
        <nav className={styles.nav}>
          <div className={styles.navGroup}>
            <span className={styles.groupTitle}>Site Content</span>
            <NavLink to="/admin/announcements" className={({isActive}) => isActive ? styles.active : ''}>Announcements</NavLink>
            <NavLink to="/admin/faqs" className={({isActive}) => isActive ? styles.active : ''}>FAQs</NavLink>
          </div>
          
          <div className={styles.navGroup}>
            <span className={styles.groupTitle}>Café Menu</span>
            <NavLink to="/admin/menu" className={({isActive}) => isActive ? styles.active : ''}>Categories & Items</NavLink>
          </div>

          <div className={styles.navGroup}>
            <span className={styles.groupTitle}>Movement</span>
            <NavLink to="/admin/classes" className={({isActive}) => isActive ? styles.active : ''}>Classes & Instructors</NavLink>
          </div>

          <div className={styles.navGroup}>
            <span className={styles.groupTitle}>Fashion</span>
            <NavLink to="/admin/fashion" className={({isActive}) => isActive ? styles.active : ''}>Layers & Items</NavLink>
          </div>

          <div className={styles.navGroup}>
            <span className={styles.groupTitle}>Venues & Events</span>
            <NavLink to="/admin/events" className={({isActive}) => isActive ? styles.active : ''}>Spaces & Events</NavLink>
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
