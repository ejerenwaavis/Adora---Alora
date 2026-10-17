import React, { useState } from 'react';
import { Outlet, NavLink, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AccountLayout.module.css';

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Protect the route
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={styles.accountContainer}>
      {/* Mobile Header */}
      <div className={styles.mobileHeader}>
        <div className={styles.mobileBrand}>
          <Link to="/" className="wordmark" style={{ textDecoration: 'none', color: 'inherit', fontSize: '1.2rem' }}>Aora House</Link>
          <span className={styles.badge}>Member</span>
        </div>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)} 
          className={styles.mobileToggle}
          aria-label="Toggle navigation menu"
        >
          {isMobileOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Overlay */}
      {isMobileOpen && (
        <div 
          className={styles.overlay} 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <Link to="/" className="wordmark" style={{ textDecoration: 'none', color: 'inherit' }}>Aora House</Link>
          <span className={styles.badge}>Member</span>
        </div>
        
        <nav className={styles.nav}>
          <NavLink 
            to="/account" 
            end 
            onClick={() => setIsMobileOpen(false)}
            className={({isActive}) => isActive ? styles.navLinkActive : styles.navLink}
          >
            Dashboard &amp; Passes
          </NavLink>
          <NavLink 
            to="/account/orders" 
            onClick={() => setIsMobileOpen(false)}
            className={({isActive}) => isActive ? styles.navLinkActive : styles.navLink}
          >
            My Orders
          </NavLink>
          <NavLink 
            to="/account/profile" 
            onClick={() => setIsMobileOpen(false)}
            className={({isActive}) => isActive ? styles.navLinkActive : styles.navLink}
          >
            Profile &amp; Settings
          </NavLink>
          <NavLink 
            to="/account/billing" 
            onClick={() => setIsMobileOpen(false)}
            className={({isActive}) => isActive ? styles.navLinkActive : styles.navLink}
          >
            Billing &amp; Memberships
          </NavLink>
          
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.06)', paddingLeft: '2rem', paddingRight: '2rem' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--taupe)', marginBottom: '0.75rem', fontWeight: 600 }}>
              House Services
            </div>
            <Link to="/movement" onClick={() => setIsMobileOpen(false)} style={{ display: 'block', textDecoration: 'none', color: 'var(--cocoa-deep)', fontSize: '0.88rem', marginBottom: '0.6rem' }}>
              Movement Studio ↗
            </Link>
            <Link to="/events" onClick={() => setIsMobileOpen(false)} style={{ display: 'block', textDecoration: 'none', color: 'var(--cocoa-deep)', fontSize: '0.88rem', marginBottom: '0.6rem' }}>
              Events ↗
            </Link>
            <Link to="/cafe" onClick={() => setIsMobileOpen(false)} style={{ display: 'block', textDecoration: 'none', color: 'var(--cocoa-deep)', fontSize: '0.88rem' }}>
              Café Menu ↗
            </Link>
          </div>
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
