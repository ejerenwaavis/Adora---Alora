import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import Icon from '../components/ui/Icon.jsx';
import styles from './CMS.module.css';

const ROLE_INFO = {
  admin: {
    label: 'Super Admin',
    badgeClass: 'b-admin',
    color: '#2A1D14',
    desc: 'Full system access — CMS, settings, user management, system logs, and clerk desk.'
  },
  clerk: {
    label: 'Front Desk Clerk',
    badgeClass: 'b-clerk',
    color: '#414F36',
    desc: 'Front-desk operations — QR check-ins, walk-ins, café seating, guest verification.'
  },
  content_editor: {
    label: 'Content Editor',
    badgeClass: 'b-content',
    color: '#C89B4A',
    desc: 'CMS management — café menu, classes, timetable, events, fashion, announcements.'
  },
  instructor: {
    label: 'Studio Instructor',
    badgeClass: 'b-instructor',
    color: '#A4451F',
    desc: 'Read-only access to class timetables and assigned attendee rosters.'
  },
  finance: {
    label: 'Finance Manager',
    badgeClass: 'b-finance',
    color: '#4A3527',
    desc: 'Revenue dashboards, transaction summaries, and credit pack management.'
  },
  concierge: {
    label: 'Guest Concierge',
    badgeClass: 'b-concierge',
    color: '#8B3318',
    desc: 'Guest communications, WhatsApp inbox, and direct inquiries.'
  },
  member: {
    label: 'House Member',
    badgeClass: 'b-member',
    color: '#6B5240',
    desc: 'Standard registered customer account with public booking and purchasing abilities.'
  }
};

export default function UsersCMS() {
  const { user: currentUser, authFetch } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'directory';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPill, setFilterPill] = useState('all'); // 'all' | 'active' | 'inactive' | 'unverified'
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Modal States
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [editModalUser, setEditModalUser] = useState(null);
  const [creditsModalUser, setCreditsModalUser] = useState(null);
  const [passwordModalUser, setPasswordModalUser] = useState(null);

  // Form States
  const [provisionForm, setProvisionForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'clerk',
    password: '',
    confirmPassword: ''
  });

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'member',
    classCredits: 0,
    membershipStatus: 'none'
  });

  const [creditsForm, setCreditsForm] = useState({
    amount: '',
    reason: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  });

  // Critical Action Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: 'suspend', // 'suspend' | 'activate' | 'delete'
    user: null,
    requiredText: 'SUSPEND',
    typedText: ''
  });

  const [toastMessage, setToastMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg, isError = false) => {
    if (isError) {
      toast.error(msg);
    } else {
      toast.success(msg);
    }
  };

  const fetchUsers = async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await authFetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        showToast('Failed to load user records', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Error connecting to user service', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [authFetch, currentUser]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.user-act-menu')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const membersList = useMemo(() => {
    return users.filter(u => u.role === 'member' || u.role === 'user');
  }, [users]);

  const staffList = useMemo(() => {
    return users.filter(u => u.role && u.role !== 'member' && u.role !== 'user');
  }, [users]);

  const filteredMembers = useMemo(() => {
    return membersList.filter(u => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || 
        (u.firstName + ' ' + u.lastName).toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (filterPill === 'active') return u.isActive !== false;
      if (filterPill === 'inactive') return u.isActive === false;
      if (filterPill === 'verified') return u.isEmailVerified === true;
      if (filterPill === 'unverified') return !u.isEmailVerified;
      return true;
    });
  }, [membersList, searchQuery, filterPill]);

  // Actions
  const handleProvisionSubmit = async (e) => {
    e.preventDefault();
    if (!provisionForm.firstName || !provisionForm.lastName || !provisionForm.email || !provisionForm.password) {
      showToast('Please fill all required fields.', true);
      return;
    }
    if (provisionForm.password.length < 8) {
      showToast('Password must be at least 8 characters long.', true);
      return;
    }
    if (provisionForm.password !== provisionForm.confirmPassword) {
      showToast('Passwords do not match.', true);
      return;
    }

    setActionLoading(true);
    try {
      const res = await authFetch('/api/admin/users/provision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(provisionForm)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Staff member provisioned successfully!');
        setProvisionModalOpen(false);
        setProvisionForm({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          role: 'clerk',
          password: '',
          confirmPassword: ''
        });
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to provision account.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Server error while provisioning account.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModalUser) return;
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${editModalUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('User profile updated successfully.');
        setEditModalUser(null);
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to update user profile.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Error updating profile.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreditsSubmit = async (e) => {
    e.preventDefault();
    if (!creditsModalUser) return;
    const delta = Number(creditsForm.amount);
    if (isNaN(delta) || delta === 0) {
      showToast('Please enter a valid non-zero adjustment amount.', true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${creditsModalUser._id}/adjust-credits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creditsForm)
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Credits adjusted successfully.');
        setCreditsModalUser(null);
        setCreditsForm({ amount: '', reason: '' });
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to adjust credits.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Error adjusting credits.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (passwordForm.password.length < 8) {
      showToast('Password must be at least 8 characters long.', true);
      return;
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      showToast('Passwords do not match.', true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${passwordModalUser._id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordForm.password })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Password reset successfully.');
        setPasswordModalUser(null);
        setPasswordForm({ password: '', confirmPassword: '' });
      } else {
        showToast(data.error || 'Failed to reset password.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Error resetting password.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const promptSuspend = (user) => {
    setConfirmModal({
      open: true,
      type: 'suspend',
      user,
      requiredText: 'SUSPEND',
      typedText: ''
    });
  };

  const promptActivate = (user) => {
    setConfirmModal({
      open: true,
      type: 'activate',
      user,
      requiredText: 'ACTIVATE',
      typedText: ''
    });
  };

  const promptDelete = (user) => {
    setConfirmModal({
      open: true,
      type: 'delete',
      user,
      requiredText: 'DELETE',
      typedText: ''
    });
  };

  const handleExecuteConfirmedAction = async (e) => {
    e.preventDefault();
    if (!confirmModal.user) return;
    
    if (confirmModal.typedText.toUpperCase().trim() !== confirmModal.requiredText) {
      showToast(`Please type "${confirmModal.requiredText}" to confirm.`, true);
      return;
    }

    setActionLoading(true);
    try {
      if (confirmModal.type === 'suspend' || confirmModal.type === 'activate') {
        const res = await authFetch(`/api/admin/users/${confirmModal.user._id}/toggle-status`, {
          method: 'PATCH'
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message);
          setConfirmModal({ open: false, type: 'suspend', user: null, requiredText: '', typedText: '' });
          if (editModalUser && editModalUser._id === confirmModal.user._id) {
            setEditModalUser(null);
          }
          fetchUsers();
        } else {
          showToast(data.error || 'Failed to update account status.', true);
        }
      } else if (confirmModal.type === 'delete') {
        const res = await authFetch(`/api/admin/users/${confirmModal.user._id}`, {
          method: 'DELETE'
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message || 'User account deleted successfully.');
          setConfirmModal({ open: false, type: 'delete', user: null, requiredText: '', typedText: '' });
          if (editModalUser && editModalUser._id === confirmModal.user._id) {
            setEditModalUser(null);
          }
          fetchUsers();
        } else {
          showToast(data.error || 'Failed to delete account.', true);
        }
      }
    } catch (err) {
      console.error(err);
      showToast(`Error executing ${confirmModal.type} action.`, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleVerify = async (userToVerify) => {
    try {
      const res = await authFetch(`/api/admin/users/${userToVerify._id}/toggle-verify`, {
        method: 'PATCH'
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
        fetchUsers();
      } else {
        showToast(data.error || 'Failed to toggle verification.', true);
      }
    } catch (err) {
      console.error(err);
      showToast('Error modifying verification status.', true);
    }
  };

  const exportCSV = () => {
    const activeData = activeTabParam === 'staff' ? staffList : filteredMembers;
    if (!activeData || activeData.length === 0) {
      showToast('No user data to export.', true);
      return;
    }
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Role', 'Credits', 'Status', 'Verified', 'Created At'];
    const rows = activeData.map(u => [
      `"${u.firstName || ''}"`,
      `"${u.lastName || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.role || 'member'}"`,
      u.classCredits || 0,
      u.isActive !== false ? 'Active' : 'Inactive',
      u.isEmailVerified ? 'Verified' : 'Unverified',
      `"${u.createdAt ? new Date(u.createdAt).toISOString() : ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aora_house_users_${activeTabParam}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV file successfully!');
  };

  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div style={{ maxWidth: '680px', margin: '60px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{
          background: 'var(--paper, #FFFDF9)',
          border: '1px solid rgba(227, 211, 184, 0.8)',
          borderRadius: '8px',
          padding: '48px 32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '14px' }}>🔒</div>
          <h2 style={{ fontFamily: 'var(--f-serif, "Fraunces", serif)', fontSize: '24px', color: 'var(--cocoa-deep)', marginBottom: '10px' }}>
            Restricted Access
          </h2>
          <p style={{ color: 'var(--taupe)', fontSize: '13.5px', lineHeight: 1.6, marginBottom: '24px', maxWidth: '440px', margin: '0 auto 24px' }}>
            User and Staff Operations are reserved for Super Administrators. Your account ({currentUser.role?.replace('_', ' ')}) has access to Content Management.
          </p>
          <a href="/admin" style={{
            display: 'inline-block',
            background: 'var(--cocoa-deep)',
            color: '#F7EFE1',
            padding: '11px 24px',
            borderRadius: '4px',
            fontSize: '12px',
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600
          }}>
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: toastMessage.isError ? '#8B2020' : '#2B2015',
          color: '#FCF8F0',
          padding: '12px 20px',
          borderRadius: '6px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 9999,
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>{toastMessage.isError ? '✕' : '✓'}</span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--rust)', letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
            CMS — People & Access
          </div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '2.25rem', color: 'var(--cocoa-deep)', margin: 0 }}>
            User &amp; Staff Operations
          </h1>
          <p style={{ color: 'var(--taupe)', marginTop: '0.35rem', fontSize: '0.95rem' }}>
            Provision team roles, manage house member accounts, and inspect access security rules.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button type="button" onClick={exportCSV} className="btn btn-outline" style={{ fontSize: '0.82rem', padding: '9px 16px' }}>
            Export CSV
          </button>
          <button 
            type="button" 
            onClick={() => setProvisionModalOpen(true)} 
            className="btn btn-primary" 
            style={{ fontSize: '0.82rem', padding: '9px 18px', background: 'var(--gold)', borderColor: 'var(--gold)', color: '#2B2015', fontWeight: 600 }}
          >
            + Provision Staff
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: '1.75rem', gap: '0.5rem', background: '#FCF8F0', padding: '0 0.5rem', borderRadius: '6px 6px 0 0' }}>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'directory' })}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTabParam === 'directory' ? '2px solid var(--rust)' : '2px solid transparent',
            color: activeTabParam === 'directory' ? 'var(--rust)' : 'var(--taupe)',
            fontWeight: activeTabParam === 'directory' ? 600 : 400,
            fontSize: '0.85rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '12px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>Member Directory</span>
          <span style={{ fontSize: '0.72rem', background: activeTabParam === 'directory' ? 'rgba(164,69,31,0.12)' : 'var(--line)', color: activeTabParam === 'directory' ? 'var(--rust)' : 'var(--taupe)', padding: '2px 7px', borderRadius: '10px' }}>
            {membersList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'staff' })}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTabParam === 'staff' ? '2px solid var(--rust)' : '2px solid transparent',
            color: activeTabParam === 'staff' ? 'var(--rust)' : 'var(--taupe)',
            fontWeight: activeTabParam === 'staff' ? 600 : 400,
            fontSize: '0.85rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '12px 18px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>Staff Management</span>
          <span style={{ fontSize: '0.72rem', background: activeTabParam === 'staff' ? 'rgba(164,69,31,0.12)' : 'var(--line)', color: activeTabParam === 'staff' ? 'var(--rust)' : 'var(--taupe)', padding: '2px 7px', borderRadius: '10px' }}>
            {staffList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'access' })}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTabParam === 'access' ? '2px solid var(--rust)' : '2px solid transparent',
            color: activeTabParam === 'access' ? 'var(--rust)' : 'var(--taupe)',
            fontWeight: activeTabParam === 'access' ? 600 : 400,
            fontSize: '0.85rem',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '12px 18px',
            cursor: 'pointer'
          }}
        >
          Access Control Matrix
        </button>
      </div>

      {/* ── TAB 1: MEMBER DIRECTORY ── */}
      {activeTabParam === 'directory' && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '12px 16px', background: '#F7EFE1', border: '1px solid var(--line)', borderRadius: '4px 4px 0 0', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FCF8F0', border: '1px solid var(--line)', borderRadius: '3px', padding: '7px 12px', flex: 1, minWidth: '220px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--taupe)', flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Search name, email, phone…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '0.85rem', fontFamily: 'inherit', color: 'var(--cocoa-deep)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['all', 'active', 'inactive', 'verified', 'unverified'].map(pill => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setFilterPill(pill)}
                  style={{
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    padding: '6px 12px',
                    borderRadius: '2px',
                    border: '1px solid var(--line)',
                    background: filterPill === pill ? '#2B2015' : '#FCF8F0',
                    color: filterPill === pill ? '#F7EFE1' : 'var(--taupe)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          {/* Members Table */}
          <div style={{ background: '#FCF8F0', border: '1px solid var(--line)', borderTop: 'none', borderRadius: '0 0 4px 4px', overflow: 'visible' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 110px 80px 90px 80px 60px', padding: '10px 16px', background: '#F7EFE1', borderBottom: '1px solid var(--line)', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--taupe)' }}>
              <span></span>
              <span>Member Details</span>
              <span>Role</span>
              <span>Credits</span>
              <span>Status</span>
              <span>Verified</span>
              <span style={{ textAlign: 'right' }}>Actions</span>
            </div>

            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--taupe)', fontStyle: 'italic' }}>
                Loading member records...
              </div>
            ) : filteredMembers.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--taupe)', fontStyle: 'italic' }}>
                No members found matching your search criteria.
              </div>
            ) : (
              filteredMembers.map((m, idx) => {
                const isNearBottom = idx >= Math.max(0, filteredMembers.length - 2);
                return (
                  <div 
                    key={m._id} 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 1fr 110px 80px 90px 80px 60px',
                      padding: '12px 16px',
                      borderBottom: idx !== filteredMembers.length - 1 ? '1px solid rgba(227, 211, 184, 0.6)' : 'none',
                      alignItems: 'center',
                      background: '#FCF8F0',
                      opacity: m.isActive === false ? 0.6 : 1
                    }}
                  >
                    {/* Avatar */}
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(200, 155, 74, 0.25)', color: '#633806', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                      {m.firstName ? m.firstName.charAt(0).toUpperCase() : 'M'}
                    </div>

                    {/* Name & Email */}
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--cocoa-deep)' }}>
                        {m.firstName} {m.lastName}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--taupe)' }}>
                        {m.email} {m.phone ? `· ${m.phone}` : ''}
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div>
                      <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 8px', borderRadius: '2px', background: 'rgba(156,135,112,0.12)', color: '#6B5240', border: '1px solid rgba(156,135,112,0.25)' }}>
                        {m.role || 'Member'}
                      </span>
                    </div>

                    {/* Credits */}
                    <div>
                      <span style={{ fontFamily: 'var(--f-display)', fontSize: '0.95rem', fontWeight: 600, color: 'var(--cocoa-deep)' }}>
                        {m.classCredits || 0}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      <span style={{
                        fontSize: '0.7rem',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '2px',
                        background: m.isActive !== false ? '#EBF5EE' : '#FBE9E9',
                        color: m.isActive !== false ? '#2E6B3E' : '#8B2020',
                        border: m.isActive !== false ? '1px solid #A8D5B5' : '1px solid #E8A8A8'
                      }}>
                        {m.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Verified Badge */}
                    <div>
                      <span style={{
                        fontSize: '0.7rem',
                        letterSpacing: '0.05em',
                        padding: '2px 6px',
                        borderRadius: '2px',
                        background: m.isEmailVerified ? '#EBF5EE' : '#FDF5D9',
                        color: m.isEmailVerified ? '#2E6B3E' : '#7A5C0A',
                        border: m.isEmailVerified ? '1px solid #A8D5B5' : '1px solid #E8D080'
                      }}>
                        {m.isEmailVerified ? '✓ Verified' : 'Pending'}
                      </span>
                    </div>

                    {/* Action Menu with smart top/bottom positioning */}
                    <div className="user-act-menu" style={{ position: 'relative', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setOpenDropdownId(openDropdownId === m._id ? null : m._id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'var(--taupe)', padding: '2px 6px' }}
                      >
                        ⋯
                      </button>

                      {openDropdownId === m._id && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          ...(isNearBottom ? { bottom: '100%', marginBottom: '6px' } : { top: '100%', marginTop: '4px' }),
                          width: '190px',
                          background: '#FCF8F0',
                          border: '1px solid var(--line)',
                          borderRadius: '4px',
                          boxShadow: '0 10px 28px rgba(43,32,21,0.22)',
                          zIndex: 100,
                          textAlign: 'left',
                          padding: '4px 0'
                        }}>
                          <div
                            onClick={() => {
                              setEditModalUser(m);
                              setEditForm({
                                firstName: m.firstName || '',
                                lastName: m.lastName || '',
                                email: m.email || '',
                                phone: m.phone || '',
                                role: m.role || 'member',
                                classCredits: m.classCredits || 0,
                                membershipStatus: m.membershipStatus || 'none',
                                isActive: m.isActive !== false,
                                isEmailVerified: Boolean(m.isEmailVerified)
                              });
                              setOpenDropdownId(null);
                            }}
                            style={{ padding: '8px 14px', fontSize: '0.8rem', color: 'var(--cocoa-deep)', cursor: 'pointer' }}
                          >
                            Edit profile & role
                          </div>

                          <div
                            onClick={() => {
                              setCreditsModalUser(m);
                              setCreditsForm({ amount: '', reason: '' });
                              setOpenDropdownId(null);
                            }}
                            style={{ padding: '8px 14px', fontSize: '0.8rem', color: 'var(--cocoa-deep)', cursor: 'pointer' }}
                          >
                            Adjust credits
                          </div>

                          <div
                            onClick={() => {
                              setPasswordModalUser(m);
                              setPasswordForm({ password: '', confirmPassword: '' });
                              setOpenDropdownId(null);
                            }}
                            style={{ padding: '8px 14px', fontSize: '0.8rem', color: 'var(--cocoa-deep)', cursor: 'pointer' }}
                          >
                            Reset password
                          </div>

                          <div
                            onClick={() => {
                              handleToggleVerify(m);
                              setOpenDropdownId(null);
                            }}
                            style={{ padding: '8px 14px', fontSize: '0.8rem', color: 'var(--cocoa-deep)', cursor: 'pointer' }}
                          >
                            {m.isEmailVerified ? 'Mark Unverified' : 'Mark Email Verified'}
                          </div>

                          <div style={{ height: '1px', background: 'var(--line)', margin: '4px 0' }}></div>

                          <div
                            onClick={() => {
                              setOpenDropdownId(null);
                              if (m.isActive !== false) {
                                promptSuspend(m);
                              } else {
                                promptActivate(m);
                              }
                            }}
                            style={{ padding: '8px 14px', fontSize: '0.8rem', color: m.isActive !== false ? '#8B2020' : '#2E6B3E', cursor: 'pointer' }}
                          >
                            {m.isActive !== false ? 'Deactivate account' : 'Reactivate account'}
                          </div>

                          <div
                            onClick={() => {
                              setOpenDropdownId(null);
                              promptDelete(m);
                            }}
                            style={{ padding: '8px 14px', fontSize: '0.8rem', color: '#8B2020', cursor: 'pointer' }}
                          >
                            Delete account
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: STAFF MANAGEMENT ── */}
      {activeTabParam === 'staff' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {[
            { key: 'admin', label: 'Super Admins', icon: 'settings', color: '#2A1D14' },
            { key: 'clerk', label: 'Front Desk Clerks', icon: 'site-content', color: '#414F36' },
            { key: 'concierge', label: 'Guest Concierges', icon: 'chat', color: '#8B3318' },
            { key: 'content_editor', label: 'Content Editors', icon: 'layers', color: '#C89B4A' },
            { key: 'instructor', label: 'Studio Instructors', icon: 'movement', color: '#A4451F' },
            { key: 'finance', label: 'Finance Managers', icon: 'credit-packs', color: '#4A3527' }
          ].map(sec => {
            const secStaff = staffList.filter(s => s.role === sec.key);
            return (
              <div key={sec.key}>
                {/* Section Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '4px', background: `${sec.color}15`, color: sec.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                    <Icon name={sec.icon || 'classes'} size={14} />
                  </div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: '1.15rem', color: 'var(--cocoa-deep)', fontWeight: 500 }}>
                    {sec.label}
                  </div>
                  <div style={{ flex: 1, height: '1px', background: 'var(--line)' }}></div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>
                    {secStaff.length} {secStaff.length === 1 ? 'member' : 'members'}
                  </div>
                </div>

                {/* Staff Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {secStaff.map(s => (
                    <div 
                      key={s._id}
                      style={{
                        background: '#FCF8F0',
                        border: '1px solid var(--line)',
                        borderRadius: '4px',
                        padding: '16px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        transition: 'all 0.2s ease',
                        opacity: s.isActive === false ? 0.65 : 1
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: sec.color, color: '#FCF8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.85rem', flexShrink: 0 }}>
                          {s.firstName ? s.firstName.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--cocoa-deep)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.firstName} {s.lastName}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--taupe)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {s.email}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 7px', borderRadius: '2px', background: `${sec.color}15`, color: sec.color, border: `1px solid ${sec.color}30` }}>
                          {ROLE_INFO[s.role]?.label || s.role}
                        </span>
                        <span style={{ fontSize: '0.68rem', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '2px', background: s.isActive !== false ? '#EBF5EE' : '#FBE9E9', color: s.isActive !== false ? '#2E6B3E' : '#8B2020', border: s.isActive !== false ? '1px solid #A8D5B5' : '1px solid #E8A8A8' }}>
                          {s.isActive !== false ? 'Active' : 'Suspended'}
                        </span>
                        {s.isEmailVerified && (
                          <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '2px', background: '#EBF5EE', color: '#2E6B3E', border: '1px solid #A8D5B5' }}>
                            ✓ Verified
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--line)', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--taupe)' }}>
                          Joined {s.createdAt ? new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recently'}
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditModalUser(s);
                              setEditForm({
                                firstName: s.firstName || '',
                                lastName: s.lastName || '',
                                email: s.email || '',
                                phone: s.phone || '',
                                role: s.role || 'clerk',
                                classCredits: s.classCredits || 0,
                                membershipStatus: s.membershipStatus || 'none',
                                isActive: s.isActive !== false,
                                isEmailVerified: Boolean(s.isEmailVerified)
                              });
                            }}
                            style={{ fontSize: '0.7rem', padding: '3px 7px', borderRadius: '2px', border: '1px solid var(--line)', background: '#FCF8F0', color: 'var(--cocoa-deep)', cursor: 'pointer' }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPasswordModalUser(s);
                              setPasswordForm({ password: '', confirmPassword: '' });
                            }}
                            style={{ fontSize: '0.7rem', padding: '3px 7px', borderRadius: '2px', border: '1px solid var(--line)', background: '#FCF8F0', color: 'var(--cocoa-deep)', cursor: 'pointer' }}
                          >
                            Reset pw
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (s.isActive !== false) {
                                promptSuspend(s);
                              } else {
                                promptActivate(s);
                              }
                            }}
                            style={{
                              fontSize: '0.7rem',
                              padding: '3px 7px',
                              borderRadius: '2px',
                              border: s.isActive !== false ? '1px solid #E8A8A8' : '1px solid #A8D5B5',
                              background: s.isActive !== false ? '#FBE9E9' : '#EBF5EE',
                              color: s.isActive !== false ? '#8B2020' : '#2E6B3E',
                              cursor: 'pointer'
                            }}
                          >
                            {s.isActive !== false ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => promptDelete(s)}
                            style={{
                              fontSize: '0.7rem',
                              padding: '3px 6px',
                              borderRadius: '2px',
                              border: '1px solid #E8A8A8',
                              background: '#FFF0F0',
                              color: '#8B2020',
                              cursor: 'pointer'
                            }}
                            title="Delete staff account"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {secStaff.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '1rem', background: '#FCF8F0', border: '1px dashed var(--line)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--taupe)', fontStyle: 'italic' }}>
                      No staff members assigned to {sec.label} yet.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB 3: ACCESS CONTROL MATRIX ── */}
      {activeTabParam === 'access' && (
        <div style={{ background: '#FCF8F0', border: '1px solid var(--line)', borderRadius: '4px', overflow: 'hidden' }}>
          {/* Frozen / Sticky Header */}
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            display: 'grid',
            gridTemplateColumns: '240px repeat(6, 1fr)',
            borderBottom: '2px solid var(--line)',
            background: '#F7EFE1',
            boxShadow: '0 4px 12px rgba(42, 29, 20, 0.08)'
          }}>
            <div style={{ padding: '14px 16px', fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cocoa-deep)' }}>
              Capability Scope
            </div>
            {['Admin', 'Clerk', 'Editor', 'Instructor', 'Finance', 'Member'].map(r => (
              <div key={r} style={{ padding: '14px 8px', textAlign: 'center', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cocoa-deep)', borderLeft: '1px solid var(--line)' }}>
                {r}
              </div>
            ))}
          </div>

          {[
            {
              section: 'Public Site Operations',
              rows: [
                { name: 'Book studio movement classes', access: ['yes', 'yes', 'yes', 'yes', 'yes', 'yes'] },
                { name: 'Reserve café dining tables', access: ['yes', 'yes', 'yes', 'yes', 'yes', 'yes'] },
                { name: 'Purchase membership & credits', access: ['yes', 'yes', 'yes', 'yes', 'yes', 'yes'] },
                { name: 'Loft event ticket bookings', access: ['yes', 'yes', 'yes', 'yes', 'yes', 'yes'] }
              ]
            },
            {
              section: 'Front Desk / Clerk Desk Operations',
              rows: [
                { name: 'QR class attendance check-in', access: ['yes', 'yes', 'no', 'no', 'no', 'no'] },
                { name: 'Walk-in guest class bookings', access: ['yes', 'yes', 'no', 'no', 'no', 'no'] },
                { name: 'Loft guest check-in & verify', access: ['yes', 'yes', 'no', 'no', 'no', 'no'] },
                { name: 'Café seating & walk-in table queue', access: ['yes', 'yes', 'no', 'no', 'no', 'no'] }
              ]
            },
            {
              section: 'Executive Admin CMS Operations',
              rows: [
                { name: 'Café menu & categories management', access: ['yes', 'no', 'yes', 'no', 'no', 'no'] },
                { name: 'Class types & timetable scheduling', access: ['yes', 'no', 'yes', 'partial', 'no', 'no'] },
                { name: 'Attendee rosters & timetable rosters', access: ['yes', 'yes', 'no', 'yes', 'no', 'no'] },
                { name: 'Events & venue spaces CMS', access: ['yes', 'no', 'yes', 'no', 'no', 'no'] },
                { name: 'Fashion collection & layers CMS', access: ['yes', 'no', 'yes', 'no', 'no', 'no'] },
                { name: 'User & Staff Provisioning & Roles', access: ['yes', 'no', 'no', 'no', 'no', 'no'] },
                { name: 'Revenue overview & credit pack pricing', access: ['yes', 'no', 'no', 'no', 'yes', 'no'] },
                { name: 'Global settings & payment gateways', access: ['yes', 'no', 'no', 'no', 'no', 'no'] },
                { name: 'System audit logs & verification logs', access: ['yes', 'no', 'no', 'no', 'no', 'no'] }
              ]
            }
          ].map((cat, cIdx) => (
            <div key={cat.section} style={{ borderBottom: cIdx !== 2 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ padding: '8px 16px', background: '#FAF6EF', fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--rust)', fontWeight: 600 }}>
                {cat.section}
              </div>
              {cat.rows.map(row => (
                <div key={row.name} style={{ display: 'grid', gridTemplateColumns: '240px repeat(6, 1fr)', borderTop: '1px solid rgba(227, 211, 184, 0.4)', alignItems: 'center' }}>
                  <div style={{ padding: '10px 16px', fontSize: '0.82rem', color: 'var(--cocoa-deep)' }}>
                    {row.name}
                  </div>
                  {row.access.map((acc, i) => (
                    <div key={i} style={{ padding: '10px 8px', textAlign: 'center', borderLeft: '1px solid rgba(227, 211, 184, 0.4)' }}>
                      {acc === 'yes' && <span style={{ color: '#2E6B3E', fontWeight: 600 }}>✓</span>}
                      {acc === 'no' && <span style={{ color: 'rgba(227, 211, 184, 0.8)', fontSize: '0.9rem' }}>—</span>}
                      {acc === 'partial' && (
                        <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '3px', background: '#FDF5D9', color: '#7A5C0A', border: '1px solid #E8D080' }}>
                          Roster Only
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL 1: PROVISION STAFF MEMBER ── */}
      {provisionModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20, 10, 4, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFFDF9', borderRadius: '8px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid rgba(227, 211, 184, 0.8)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--paper)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1.3rem', color: 'var(--cocoa-deep)', margin: 0 }}>Provision Staff Member</h3>
                <p style={{ color: 'var(--taupe)', fontSize: '0.78rem', margin: '2px 0 0 0' }}>Assign role credentials and configure immediate staff access</p>
              </div>
              <button type="button" onClick={() => setProvisionModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--taupe)' }}>✕</button>
            </div>

            <form onSubmit={handleProvisionSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.field}>
                  <label>First Name <span style={{ color: 'var(--rust)' }}>*</span></label>
                  <input required value={provisionForm.firstName} onChange={e => setProvisionForm({ ...provisionForm, firstName: e.target.value })} placeholder="e.g. Zara" />
                </div>
                <div className={styles.field}>
                  <label>Last Name <span style={{ color: 'var(--rust)' }}>*</span></label>
                  <input required value={provisionForm.lastName} onChange={e => setProvisionForm({ ...provisionForm, lastName: e.target.value })} placeholder="e.g. Okonkwo" />
                </div>
              </div>

              <div className={styles.field}>
                <label>Email Address (Username) <span style={{ color: 'var(--rust)' }}>*</span></label>
                <input required type="email" value={provisionForm.email} onChange={e => setProvisionForm({ ...provisionForm, email: e.target.value })} placeholder="staff@adoraalora.com" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.field}>
                  <label>Phone Number</label>
                  <input value={provisionForm.phone} onChange={e => setProvisionForm({ ...provisionForm, phone: e.target.value })} placeholder="+234 800 000 0000" />
                </div>
                <div className={styles.field}>
                  <label>Assigned Role <span style={{ color: 'var(--rust)' }}>*</span></label>
                  <select value={provisionForm.role} onChange={e => setProvisionForm({ ...provisionForm, role: e.target.value })}>
                    <option value="admin">Super Admin</option>
                    <option value="clerk">Front Desk Clerk</option>
                    <option value="content_editor">Content Editor</option>
                    <option value="instructor">Studio Instructor</option>
                    <option value="finance">Finance Manager</option>
                    <option value="concierge">Guest Concierge</option>
                  </select>
                </div>
              </div>

              {/* Role Helper Banner */}
              <div style={{ background: '#FAF6EF', border: '1px solid rgba(200, 155, 74, 0.4)', borderRadius: '4px', padding: '10px 12px', fontSize: '0.78rem', color: '#633806', lineHeight: 1.45 }}>
                <strong>{ROLE_INFO[provisionForm.role]?.label}:</strong> {ROLE_INFO[provisionForm.role]?.desc}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.field}>
                  <label>Initial Password <span style={{ color: 'var(--rust)' }}>*</span></label>
                  <input required type="password" value={provisionForm.password} onChange={e => setProvisionForm({ ...provisionForm, password: e.target.value })} placeholder="Min 8 chars" />
                </div>
                <div className={styles.field}>
                  <label>Confirm Password <span style={{ color: 'var(--rust)' }}>*</span></label>
                  <input required type="password" value={provisionForm.confirmPassword} onChange={e => setProvisionForm({ ...provisionForm, confirmPassword: e.target.value })} placeholder="Repeat password" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
                <button type="button" onClick={() => setProvisionModalOpen(false)} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '10px 14px' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '10px 14px', background: 'var(--gold)', borderColor: 'var(--gold)', color: '#2B2015', fontWeight: 600 }}>
                  {actionLoading ? 'Provisioning...' : 'Provision Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: EDIT USER & ROLE ── */}
      {editModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20, 10, 4, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFFDF9', borderRadius: '8px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid rgba(227, 211, 184, 0.8)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--paper)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1.3rem', color: 'var(--cocoa-deep)', margin: 0 }}>Edit User Profile & Role</h3>
                <p style={{ color: 'var(--taupe)', fontSize: '0.78rem', margin: '2px 0 0 0' }}>Update personal details and reassign role clearance</p>
              </div>
              <button type="button" onClick={() => setEditModalUser(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--taupe)' }}>✕</button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.field}>
                  <label>First Name</label>
                  <input required value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>Last Name</label>
                  <input required value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.field}>
                  <label>Email Address</label>
                  <input required type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div className={styles.field}>
                  <label>Phone Number</label>
                  <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.field}>
                  <label>User Role</label>
                  <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                    <option value="member">House Member</option>
                    <option value="clerk">Front Desk Clerk</option>
                    <option value="content_editor">Content Editor</option>
                    <option value="instructor">Studio Instructor</option>
                    <option value="finance">Finance Manager</option>
                    <option value="concierge">Guest Concierge</option>
                    <option value="admin">Super Admin</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Class Credits</label>
                  <input type="number" min="0" value={editForm.classCredits} onChange={e => setEditForm({ ...editForm, classCredits: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.field}>
                  <label>Account Status</label>
                  <select value={editForm.isActive ? 'active' : 'inactive'} onChange={e => setEditForm({ ...editForm, isActive: e.target.value === 'active' })}>
                    <option value="active">Active (Access Enabled)</option>
                    <option value="inactive">Suspended / Inactive</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Email Verification</label>
                  <select value={editForm.isEmailVerified ? 'verified' : 'pending'} onChange={e => setEditForm({ ...editForm, isEmailVerified: e.target.value === 'verified' })}>
                    <option value="verified">Verified ✓</option>
                    <option value="pending">Pending Verification</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    promptDelete(editModalUser);
                  }}
                  style={{
                    background: 'none',
                    border: '1px solid #E8A8A8',
                    borderRadius: '3px',
                    color: '#8B2020',
                    fontSize: '0.78rem',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    Delete Account
                  </span>
                </button>

                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 1 }}>
                  <button type="button" onClick={() => setEditModalUser(null)} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '10px 14px' }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '10px 14px' }}>
                    {actionLoading ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: ADJUST CREDITS ── */}
      {creditsModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20, 10, 4, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFFDF9', borderRadius: '8px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid rgba(227, 211, 184, 0.8)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--paper)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1.3rem', color: 'var(--cocoa-deep)', margin: 0 }}>Adjust Class Credits</h3>
                <p style={{ color: 'var(--taupe)', fontSize: '0.78rem', margin: '2px 0 0 0' }}>For {creditsModalUser.firstName} {creditsModalUser.lastName}</p>
              </div>
              <button type="button" onClick={() => setCreditsModalUser(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--taupe)' }}>✕</button>
            </div>

            <form onSubmit={handleCreditsSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '10px 14px', background: '#FAF6EF', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--taupe)' }}>Current Balance:</span>
                <span style={{ fontWeight: 600, color: 'var(--cocoa-deep)' }}>{creditsModalUser.classCredits || 0} Credits</span>
              </div>

              <div className={styles.field}>
                <label>Credit Adjustment Amount (use negative to deduct)</label>
                <input required type="number" step="1" placeholder="e.g. 5 or -2" value={creditsForm.amount} onChange={e => setCreditsForm({ ...creditsForm, amount: e.target.value })} />
              </div>

              <div className={styles.field}>
                <label>Administrative Reason Note</label>
                <input placeholder="e.g. Complimentary studio pass / Customer support" value={creditsForm.reason} onChange={e => setCreditsForm({ ...creditsForm, reason: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
                <button type="button" onClick={() => setCreditsModalUser(null)} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '10px 14px' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '10px 14px' }}>
                  {actionLoading ? 'Applying...' : 'Apply Credit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: DIRECT PASSWORD RESET ── */}
      {passwordModalUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20, 10, 4, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFFDF9', borderRadius: '8px', width: '100%', maxWidth: '440px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid rgba(227, 211, 184, 0.8)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--paper)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1.3rem', color: 'var(--cocoa-deep)', margin: 0 }}>Reset User Password</h3>
                <p style={{ color: 'var(--taupe)', fontSize: '0.78rem', margin: '2px 0 0 0' }}>For {passwordModalUser.firstName} {passwordModalUser.lastName} ({passwordModalUser.email})</p>
              </div>
              <button type="button" onClick={() => setPasswordModalUser(null)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--taupe)' }}>✕</button>
            </div>

            <form onSubmit={handlePasswordSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className={styles.field}>
                <label>New Password (Min 8 characters)</label>
                <input required type="password" placeholder="Enter new password" value={passwordForm.password} onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })} />
              </div>

              <div className={styles.field}>
                <label>Confirm New Password</label>
                <input required type="password" placeholder="Confirm new password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
                <button type="button" onClick={() => setPasswordModalUser(null)} className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '10px 14px' }}>Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '10px 14px', background: 'var(--cocoa-deep)', borderColor: 'var(--cocoa-deep)' }}>
                  {actionLoading ? 'Updating...' : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 5: CONFIRM CRITICAL ACTION (SUSPEND / ACTIVATE / DELETE) ── */}
      {confirmModal.open && confirmModal.user && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20, 10, 4, 0.7)', backdropFilter: 'blur(4px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFFDF9', borderRadius: '8px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', border: '1px solid rgba(227, 211, 184, 0.8)', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid var(--line)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: confirmModal.type === 'delete' ? '#FBE9E9' : confirmModal.type === 'suspend' ? '#FFF5E6' : '#EBF5EE'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: confirmModal.type === 'delete' ? '#8B2020' : confirmModal.type === 'suspend' ? '#C87214' : '#2E6B3E',
                  color: '#FFF',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>
                  {confirmModal.type === 'delete' ? '✕' : confirmModal.type === 'suspend' ? '!' : '✓'}
                </div>
                <div>
                  <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '1.2rem', color: 'var(--cocoa-deep)', margin: 0 }}>
                    {confirmModal.type === 'delete' && 'Confirm Account Deletion'}
                    {confirmModal.type === 'suspend' && 'Confirm Account Suspension'}
                    {confirmModal.type === 'activate' && 'Confirm Account Reactivation'}
                  </h3>
                  <p style={{ color: 'var(--taupe)', fontSize: '0.75rem', margin: '2px 0 0 0' }}>Security safeguard verification required</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal({ open: false, type: 'suspend', user: null, requiredText: '', typedText: '' })}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--taupe)' }}
              >
                ✕
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleExecuteConfirmedAction} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                background: '#FAF6EF',
                border: '1px solid var(--line)',
                borderRadius: '6px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--cocoa-deep)', marginBottom: '4px' }}>
                  {confirmModal.user.firstName} {confirmModal.user.lastName}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '8px' }}>
                  {confirmModal.user.email} · Role: <strong style={{ textTransform: 'uppercase' }}>{confirmModal.user.role}</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: confirmModal.type === 'delete' ? '#8B2020' : '#633806', lineHeight: 1.45 }}>
                  {confirmModal.type === 'delete' && 'This account and its records will be permanently removed. This action cannot be reversed.'}
                  {confirmModal.type === 'suspend' && 'This user will immediately be barred from logging in to house accounts, managing desk operations, or booking classes.'}
                  {confirmModal.type === 'activate' && 'This will immediately restore full login clearance and permissions for this account.'}
                </div>
              </div>

              <div className={styles.field}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--cocoa-deep)' }}>
                  To confirm, type <span style={{ color: confirmModal.type === 'delete' ? '#8B2020' : 'var(--rust)', letterSpacing: '0.05em' }}>{confirmModal.requiredText}</span> below:
                </label>
                <input
                  required
                  type="text"
                  autoFocus
                  placeholder={`Type ${confirmModal.requiredText} to confirm`}
                  value={confirmModal.typedText}
                  onChange={e => setConfirmModal({ ...confirmModal, typedText: e.target.value })}
                  style={{
                    background: '#FCF8F0',
                    border: confirmModal.typedText.toUpperCase().trim() === confirmModal.requiredText ? '2px solid #2E6B3E' : '1px solid var(--line)',
                    padding: '10px 14px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    color: 'var(--cocoa-deep)',
                    outline: 'none',
                    borderRadius: '4px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--line)' }}>
                <button
                  type="button"
                  onClick={() => setConfirmModal({ open: false, type: 'suspend', user: null, requiredText: '', typedText: '' })}
                  className="btn btn-outline"
                  style={{ fontSize: '0.82rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || confirmModal.typedText.toUpperCase().trim() !== confirmModal.requiredText}
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.82rem',
                    background: confirmModal.type === 'delete' ? '#8B2020' : confirmModal.type === 'suspend' ? '#B8451F' : '#2E6B3E',
                    borderColor: confirmModal.type === 'delete' ? '#8B2020' : confirmModal.type === 'suspend' ? '#B8451F' : '#2E6B3E',
                    color: '#FFF',
                    opacity: confirmModal.typedText.toUpperCase().trim() === confirmModal.requiredText ? 1 : 0.5,
                    cursor: confirmModal.typedText.toUpperCase().trim() === confirmModal.requiredText ? 'pointer' : 'not-allowed'
                  }}
                >
                  {actionLoading ? 'Executing...' : confirmModal.type === 'delete' ? 'Permanently Delete' : confirmModal.type === 'suspend' ? 'Suspend Account' : 'Reactivate Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
