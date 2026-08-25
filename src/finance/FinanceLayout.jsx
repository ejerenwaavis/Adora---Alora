import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IconCreditCard, IconGraph, IconLogout } from '../components/ui/LineIcons';

export default function FinanceLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--paper)' }}>
      {/* Sidebar */}
      <div style={{ 
        width: '260px', 
        background: 'var(--cocoa-deep)', 
        color: '#F7EFE1',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0'
      }}>
        <div style={{ padding: '0 24px', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: '20px', fontWeight: 600, color: 'var(--gold-light, #E3D3B8)' }}>Aora House</div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(247,239,225,0.6)', marginTop: '4px' }}>Financial Operations</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 12px', flex: 1 }}>
          <NavLink 
            to="/finance" 
            end
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              borderRadius: '6px', textDecoration: 'none',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: isActive ? '#fff' : 'rgba(247,239,225,0.7)',
              fontSize: '13px', fontWeight: 500, transition: 'all 0.2s'
            })}
          >
            <IconGraph size={18} /> Daily Revenue
          </NavLink>
          <NavLink 
            to="/finance/payouts" 
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              borderRadius: '6px', textDecoration: 'none',
              background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: isActive ? '#fff' : 'rgba(247,239,225,0.7)',
              fontSize: '13px', fontWeight: 500, transition: 'all 0.2s'
            })}
          >
            <IconCreditCard size={18} /> Vendor Payouts
          </NavLink>
        </div>

        <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '12px', marginBottom: '16px' }}>
            Logged in as<br/><strong>{user?.firstName} {user?.lastName}</strong>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'none', border: 'none', color: 'rgba(247,239,225,0.7)',
              cursor: 'pointer', fontSize: '13px', padding: 0
            }}
          >
            <IconLogout size={16} /> Sign out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </div>
    </div>
  );
}
