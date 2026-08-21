import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './clerk.css';
import WalkinModal from './WalkinModal';
import QRScannerModal from './QRScannerModal';

export default function ClerkLayout() {
  const { user } = useAuth();
  const [walkinOpen, setWalkinOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  
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
      
      const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const formattedDate = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
      
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

  return (
    <div className="shell">
      <div className="sidebar">
        <div className="sb-brand">
          <div className="sb-wordmark">Aora House</div>
          <div className="sb-sub">Clerk station</div>
        </div>
        
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
          <NavLink to="/clerk" end className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`}>
            <i className="ti ti-layout-dashboard" aria-hidden="true"></i> Dashboard
          </NavLink>
          <NavLink to="/clerk/classes" className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`}>
            <i className="ti ti-users" aria-hidden="true"></i> Class roster
          </NavLink>
          <NavLink to="/clerk/cafe" className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`}>
            <i className="ti ti-coffee" aria-hidden="true"></i> Café bookings
          </NavLink>
          <NavLink to="/clerk/events" className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`}>
            <i className="ti ti-building" aria-hidden="true"></i> Loft events
          </NavLink>
          
          <div className="sb-section">Tools</div>
          <div className="sb-item" onClick={() => setWalkinOpen(true)} style={{ cursor: 'pointer' }}>
            <i className="ti ti-user-plus" aria-hidden="true"></i> Walk-in
          </div>
          <div className="sb-item" onClick={() => setQrScannerOpen(true)} style={{ cursor: 'pointer' }}>
            <i className="ti ti-qrcode" aria-hidden="true"></i> QR check-in
          </div>
          <NavLink to="/clerk/logs" className={({ isActive }) => `sb-item ${isActive ? 'active' : ''}`}>
            <i className="ti ti-clock" aria-hidden="true"></i> Activity log
          </NavLink>
        </nav>
        
        <div className="sb-footer">
          <div className="sb-time">{time}</div>
          <div className="sb-date">{date}</div>
        </div>
      </div>
      
      <div className="main">
        <Outlet context={{ setWalkinOpen }} />
      </div>

      <WalkinModal isOpen={walkinOpen} onClose={() => setWalkinOpen(false)} />
      {qrScannerOpen && <QRScannerModal onClose={() => setQrScannerOpen(false)} />}
    </div>
  );
}
