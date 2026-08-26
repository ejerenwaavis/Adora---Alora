import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './clerk.css';
import WalkinModal from './WalkinModal';
import QRScannerModal from './QRScannerModal';

export default function ClerkLayout() {
  const { user } = useAuth();
  const [walkinOpen, setWalkinOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Real-time clock for footer
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = now.getHours(), m = now.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      const hh = h % 12 || 12;
      const formattedTime = `${hh}:${String(m).padStart(2, '0')} ${ampm}`;
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const formattedDate = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
      
      setTime(formattedTime);
      setDate(formattedDate);
    };
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const getInitials = (first, last) => {
    return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="shell">
      {/* ── MOBILE TOPBAR ── */}
      <div className="c-topbar">
        <div 
          className={`c-hamburger ${drawerOpen ? 'open' : ''}`} 
          onClick={() => setDrawerOpen(!drawerOpen)}
          title="Toggle menu"
        >
          <div className="c-hamburger-icon">
            <span></span><span></span><span></span>
          </div>
        </div>
        <Link to="/" className="c-wordmark" title="Visit Public Site" style={{ textDecoration: 'none' }}>
          Aora House <small>Clerk</small>
        </Link>
        <div className="c-clock">{time}</div>
      </div>

      {/* ── OFF-CANVAS OVERLAY (absolute inside .shell) ── */}
      <div 
        className={`c-overlay ${drawerOpen ? 'show' : ''}`}
        onClick={closeDrawer}
      ></div>

      {/* ── SIDEBAR / DRAWER ── */}
      <div className={`sidebar ${drawerOpen ? 'open' : ''}`}>
        <Link to="/" className="sb-brand" title="Visit Public Site" style={{ textDecoration: 'none', display: 'block' }}>
          <div className="sb-wordmark">Aora House</div>
          <div className="sb-sub">Clerk station</div>
        </Link>
        
        <div className="sb-clerk">
          <div className="sb-avatar">
            {user ? getInitials(user.firstName, user.lastName) : 'ZO'}
          </div>
          <div className="sb-clerk-info">
            <div className="sb-clerk-name">{user ? `${user.firstName} ${user.lastName}` : 'Front Desk'}</div>
            <div className="sb-clerk-role">Front desk</div>
          </div>
          <div className="sb-status-dot" title="On shift"></div>
        </div>
        
        <nav className="sb-nav">
          <div className="sb-section">Today</div>
          <NavLink to="/clerk" end className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
            <i className="ti ti-layout-dashboard" aria-hidden="true"></i> Dashboard
          </NavLink>
          <NavLink to="/clerk/classes" className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
            <i className="ti ti-users" aria-hidden="true"></i> Class roster
          </NavLink>
          <NavLink to="/clerk/cafe" className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
            <i className="ti ti-coffee" aria-hidden="true"></i> Café bookings
          </NavLink>
          <NavLink to="/clerk/events" className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
            <i className="ti ti-building" aria-hidden="true"></i> Events
          </NavLink>
          
          <div className="sb-section">Tools</div>
          <div className="sb-item" onClick={() => { setWalkinOpen(true); closeDrawer(); }} style={{ cursor: 'pointer' }}>
            <i className="ti ti-user-plus" aria-hidden="true"></i> Walk-in
          </div>
          <div className="sb-item" onClick={() => { setQrScannerOpen(true); closeDrawer(); }} style={{ cursor: 'pointer' }}>
            <i className="ti ti-qrcode" aria-hidden="true"></i> QR check-in
          </div>
          <NavLink to="/clerk/logs" className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
            <i className="ti ti-clock" aria-hidden="true"></i> Activity log
          </NavLink>
        </nav>
        
        <div className="sb-footer">
          <div className="sb-time">{time}</div>
          <div className="sb-date">{date}</div>
        </div>
      </div>
      
      {/* ── MAIN CONTENT — bounded, scrollable ── */}
      <div className="main">
        <Outlet context={{ setWalkinOpen }} />
      </div>

      {/* ── BOTTOM NAV — phone only, 4 high-frequency actions ── */}
      <div className="c-bottomnav">
        <NavLink to="/clerk" end className={({isActive}) => `c-bnav-item ${isActive ? 'active' : ''}`}>
          <i className="ti ti-layout-dashboard"></i>
          <div className="c-bnav-label">Today</div>
        </NavLink>
        <NavLink to="/clerk/classes" className={({isActive}) => `c-bnav-item ${isActive ? 'active' : ''}`}>
          <i className="ti ti-users"></i>
          <div className="c-bnav-label">Roster</div>
        </NavLink>
        <div className="c-bnav-item" onClick={() => { setWalkinOpen(true); closeDrawer(); }}>
          <i className="ti ti-user-plus"></i>
          <div className="c-bnav-label">Walk-in</div>
        </div>
        <div className="c-bnav-item" onClick={() => { setQrScannerOpen(true); closeDrawer(); }}>
          <i className="ti ti-qrcode"></i>
          <div className="c-bnav-label">QR Scan</div>
        </div>
      </div>

      <WalkinModal isOpen={walkinOpen} onClose={() => setWalkinOpen(false)} />
      {qrScannerOpen && <QRScannerModal onClose={() => setQrScannerOpen(false)} />}
    </div>
  );
}
