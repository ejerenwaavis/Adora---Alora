import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AccountLayout.module.css';
import { validatePhone, hasSignedWaiver } from '../../utils/validation';

export default function ProfileSettings() {
  const { user, authFetch, refreshUser, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    emergencyContactName: user.emergencyContactName || '',
    emergencyContactPhone: user.emergencyContactPhone || '',
    emergencyContactRelation: user.emergencyContactRelation || '',
    medicalNotes: user.medicalNotes || '',
    emailMarketing: user.emailMarketing !== false,
    emailTransactional: user.emailTransactional !== false,
    smsReminders: user.smsReminders === true,
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [removingAvatar, setRemovingAvatar] = useState(false);
  const [showSignedWaiverModal, setShowSignedWaiverModal] = useState(false);
  const [waiverAgreementHtml, setWaiverAgreementHtml] = useState('');
  const [loadingAgreement, setLoadingAgreement] = useState(false);

  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const isWaiverSigned = hasSignedWaiver(user);
  const signedDate = user.waiver?.signedAt || user.waiverSignedAt || user.waiverDate;
  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'A';

  async function handleRemovePhoto() {
    setStatus('');
    if (avatarFile) {
      setAvatarFile(null);
      return;
    }
    if (!user.avatar) return;

    setRemovingAvatar(true);
    try {
      const res = await authFetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profilePicture: null, avatar: '' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove profile photo');

      if (data.user && updateUser) updateUser(data.user);
      if (refreshUser) await refreshUser();
      setStatus('Profile photo removed.');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setRemovingAvatar(false);
    }
  }

  async function handleViewSignedAgreement() {
    setShowSignedWaiverModal(true);
    if (waiverAgreementHtml) return;
    setLoadingAgreement(true);
    try {
      const res = await authFetch('/api/user/waiver/active');
      if (res.ok) {
        const data = await res.json();
        setWaiverAgreementHtml(
          data.activeWaiver?.content ||
          '<p>Aora House Movement Studio Client Liability Waiver &amp; Release Agreement (Governed by the Laws of the Federal Republic of Nigeria).</p>'
        );
      }
    } catch (err) {
      console.warn('Could not load waiver document preview:', err);
    } finally {
      setLoadingAgreement(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('');

    const cleanedForm = { ...formData };
    if (cleanedForm.phone && String(cleanedForm.phone).trim() !== '') {
      const phoneCheck = validatePhone(cleanedForm.phone);
      if (!phoneCheck.valid) {
        setStatus(`Error: ${phoneCheck.error}`);
        return;
      }
      cleanedForm.phone = phoneCheck.normalized;
    }
    if (cleanedForm.emergencyContactPhone && String(cleanedForm.emergencyContactPhone).trim() !== '') {
      const emCheck = validatePhone(cleanedForm.emergencyContactPhone);
      if (!emCheck.valid) {
        setStatus(`Error: Emergency contact — ${emCheck.error}`);
        return;
      }
      cleanedForm.emergencyContactPhone = emCheck.normalized;
    }

    setLoading(true);
    try {
      const payload = new FormData();
      Object.keys(cleanedForm).forEach((key) => payload.append(key, cleanedForm[key]));
      if (avatarFile) payload.append('avatar', avatarFile);

      const res = await authFetch('/api/auth/me', {
        method: 'PUT',
        body: payload,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      setAvatarFile(null);
      if (data.user && updateUser) updateUser(data.user);
      if (refreshUser) await refreshUser();
      setStatus('Profile updated successfully!');
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="eyebrow">Settings</div>
      <h1 className={styles.pageTitle}>Profile &amp; Preferences</h1>

      {status && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '2rem',
            background: status.includes('Error') ? '#fee' : '#efe',
            color: status.includes('Error') ? '#c00' : '#080',
            borderRadius: '4px',
          }}
        >
          {status}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.card}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Personal Information</h2>

          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            {avatarFile ? (
              <img
                src={URL.createObjectURL(avatarFile)}
                alt="Preview"
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(200, 155, 74, 0.4)' }}
              />
            ) : user.avatar ? (
              <img
                src={user.avatar}
                alt="Profile"
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(200, 155, 74, 0.4)' }}
              />
            ) : (
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--cocoa-deep, #2B2015)',
                  color: 'var(--gold, #C89B4A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--f-display, serif)',
                  fontSize: '1.5rem',
                  fontWeight: 500,
                  border: '1px solid rgba(200, 155, 74, 0.4)',
                }}
                aria-label="Default avatar initials"
              >
                {initials}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)' }}>Profile Picture</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files[0] || null)}
                />
                {(user.avatar || avatarFile) && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={removingAvatar}
                    style={{
                      background: '#FBE9E9',
                      border: '1px solid #E8A8A8',
                      color: '#8B2020',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: removingAvatar ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {removingAvatar ? 'Removing...' : 'Remove Photo'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }}
            />
          </div>
        </div>

        <div className={styles.card}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Emergency Contact</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--taupe)', marginBottom: '1.5rem' }}>
            Required before your first Movement Studio class booking.
          </p>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>Contact Name</label>
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>Contact Phone</label>
              <input
                type="text"
                value={formData.emergencyContactPhone}
                onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }}
              />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>Relationship</label>
            <input
              type="text"
              value={formData.emergencyContactRelation}
              onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
              placeholder="e.g. Spouse, Parent"
              style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>Medical Notes (Optional)</label>
            <textarea
              rows="3"
              value={formData.medicalNotes}
              onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
              placeholder="Any allergies, injuries, or conditions our instructors should know about."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }}
            />
          </div>
        </div>

        <div className={styles.card}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Digital Waiver</h2>

          {isWaiverSigned ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '1rem 1.25rem', background: 'rgba(46, 107, 62, 0.08)', border: '1px solid rgba(46, 107, 62, 0.25)', borderRadius: '6px', color: '#1B5E20' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  ✓ Verified &amp; Signed on {signedDate ? new Date(signedDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'File'}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '3px' }}>
                  Signed by {user.waiverSignature || `${user.firstName} ${user.lastName}`} · Version {user.waiver?.version || user.waiverVersion || '2026-09'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleViewSignedAgreement}
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(46, 107, 62, 0.35)',
                  color: '#1B5E20',
                  padding: '8px 14px',
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                View Signed Agreement
              </button>
            </div>
          ) : (
            <div style={{ padding: '1rem 1.25rem', background: '#FAF6EF', border: '1px solid rgba(227, 211, 184, 0.8)', borderRadius: '6px', color: 'var(--cocoa-deep)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              <strong>Pending Signature:</strong> You will automatically provide your Emergency Contact and sign the Aora House Liability Waiver right before booking your first Movement Studio class.
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Communication Preferences</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="emailTrans" checked={formData.emailTransactional} onChange={(e) => setFormData({ ...formData, emailTransactional: e.target.checked })} />
              <label htmlFor="emailTrans">Transactional Emails (Booking confirmations, receipts)</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="emailMkt" checked={formData.emailMarketing} onChange={(e) => setFormData({ ...formData, emailMarketing: e.target.checked })} />
              <label htmlFor="emailMkt">Marketing Emails (News, events, special offers)</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="smsRem" checked={formData.smsReminders} onChange={(e) => setFormData({ ...formData, smsReminders: e.target.checked })} />
              <label htmlFor="smsRem">SMS Reminders (Class start reminders)</label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
          <button type="submit" disabled={loading} style={{ background: 'var(--gold)', color: 'var(--white)', padding: '1rem 2rem', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Read-only Signed Agreement Viewer Modal */}
      {showSignedWaiverModal && (
        <div
          onClick={() => setShowSignedWaiverModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20, 10, 4, 0.72)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FFFDF9',
              borderRadius: '8px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid rgba(227, 211, 184, 0.9)',
            }}
          >
            <div style={{ background: 'var(--cocoa-deep, #2B2015)', color: '#F7EFE1', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold, #C89B4A)' }}>
                  Signed Agreement on File
                </div>
                <h3 style={{ margin: '2px 0 0', fontFamily: "'Fraunces', serif", fontWeight: 400, color: '#F7EFE1' }}>
                  Movement Studio Liability Waiver
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSignedWaiverModal(false)}
                style={{ background: 'none', border: 'none', color: '#F7EFE1', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: '20px 24px', overflowY: 'auto', fontSize: '13px', lineHeight: 1.65 }}>
              <div style={{ background: '#FAF6EF', padding: '12px 14px', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.7)', marginBottom: '16px', fontSize: '12px' }}>
                <strong>Verified &amp; Signed:</strong> {signedDate ? new Date(signedDate).toLocaleString() : 'On file'}<br />
                <strong>Digital Signature:</strong> <em style={{ fontFamily: "'Fraunces', serif" }}>{user.waiverSignature || `${user.firstName} ${user.lastName}`}</em><br />
                <strong>Version:</strong> {user.waiver?.version || user.waiverVersion || '2026-09'}
              </div>
              {loadingAgreement ? (
                <p style={{ color: 'var(--taupe)' }}>Loading signed agreement…</p>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: waiverAgreementHtml }} />
              )}
            </div>
            <div style={{ padding: '12px 24px', borderTop: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowSignedWaiverModal(false)}
                style={{ background: 'var(--cocoa-deep, #2B2015)', color: '#F7EFE1', border: 'none', padding: '8px 18px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
