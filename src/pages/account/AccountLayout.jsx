import { Outlet, NavLink, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AccountLayout.module.css';

export default function AccountLayout() {
  const { user, logout } = useAuth();

  // Protect the route
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={styles.accountContainer}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <Link to="/" className="wordmark" style={{ textDecoration: 'none', color: 'inherit' }}>Aora House</Link>
          <span className={styles.badge}>Account</span>
        </div>
        
        <nav className={styles.nav}>
          <NavLink to="/account" end className={({isActive}) => isActive ? styles.navLinkActive : styles.navLink}>
            Dashboard
          </NavLink>
          <NavLink to="/account/profile" className={({isActive}) => isActive ? styles.navLinkActive : styles.navLink}>
            Profile & Settings
          </NavLink>
          <NavLink to="/account/billing" className={({isActive}) => isActive ? styles.navLinkActive : styles.navLink}>
            Billing & Memberships
          </NavLink>
        </nav>

        <div className={styles.userBox}>
          <div className={styles.userInfo}>
            <strong>{user.firstName} {user.lastName}</strong>
            <span>{user.email}</span>
          </div>
          <button onClick={logout} className={styles.logoutBtn}>Log out</button>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.contentWrapper}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
