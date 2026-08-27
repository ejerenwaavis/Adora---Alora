import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import Icon from '../components/ui/Icon.jsx';

export default function ConciergeLayout() {
  const { user, logout } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--paper)' }}>
      {/* â”€â”€ SIDEBAR â”€â”€ */}
      <aside style={{
        width: '260px',
        background: '#FAF6EF', // Lighter cream for Concierge
        borderRight: '1px solid rgba(227, 211, 184, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}>
        {/* Brand Header */}
        <div style={{ padding: '32px 24px', borderBottom: '1px solid rgba(227, 211, 184, 0.4)' }}>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '20px', color: 'var(--cocoa-deep)', margin: 0, letterSpacing: '0.02em' }}>
            Aora House
          </h2>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--taupe)', marginTop: '4px' }}>
            Guest Concierge
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavLink 
            to="/concierge" 
            end
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              borderRadius: '6px', textDecoration: 'none',
              background: isActive ? 'rgba(200, 155, 74, 0.1)' : 'transparent',
              color: isActive ? 'var(--cocoa-deep)' : 'var(--taupe)',
              fontSize: '13px', fontWeight: 600, transition: 'all 0.2s'
            })}
          >
            <Icon name="site-content" size={18} /> Dashboard
          </NavLink>
          
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)', margin: '16px 0 8px 16px', opacity: 0.7 }}>
            Communications
          </div>

          <NavLink 
            to="/concierge/whatsapp" 
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              borderRadius: '6px', textDecoration: 'none',
              background: isActive ? 'rgba(139, 51, 24, 0.1)' : 'transparent',
              color: isActive ? '#8B3318' : 'var(--taupe)',
              fontSize: '13px', fontWeight: 600, transition: 'all 0.2s'
            })}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            WhatsApp Inbox
            <span style={{ marginLeft: 'auto', background: '#8B3318', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>3</span>
          </NavLink>

          <NavLink 
            to="/concierge/requests" 
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              borderRadius: '6px', textDecoration: 'none',
              background: isActive ? 'rgba(200, 155, 74, 0.1)' : 'transparent',
              color: isActive ? 'var(--cocoa-deep)' : 'var(--taupe)',
              fontSize: '13px', fontWeight: 600, transition: 'all 0.2s'
            })}
          >
            <Icon name="announcements" size={18} /> Support & Enquiries
          </NavLink>
        </nav>

        {/* User Profile Footer */}
        <div style={{ padding: '24px', borderTop: '1px solid rgba(227, 211, 184, 0.4)' }}>
          <div style={{ fontSize: '12px', color: 'var(--taupe)' }}>Logged in as</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--cocoa-deep)', marginBottom: '12px' }}>
            {user?.firstName} {user?.lastName}
          </div>
          <button 
            onClick={logout}
            style={{ 
              background: 'none', border: 'none', padding: 0, 
              color: 'var(--rust)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 500
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* â”€â”€ MAIN CONTENT AREA â”€â”€ */}
      <main style={{ flex: 1, height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
}
