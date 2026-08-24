import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AccountLayout.module.css';

export default function ProfileSettings() {
  const { user, authFetch } = useAuth();
  
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
  
  const [waiverSigned, setWaiverSigned] = useState(!!user.waiverSignedAt);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const [signingWaiver, setSigningWaiver] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('');
    setLoading(true);
    
    try {
      const payload = new FormData();
      Object.keys(formData).forEach(key => payload.append(key, formData[key]));
      if (avatarFile) payload.append('avatar', avatarFile);
      
      const res = await authFetch('/api/auth/me', {
        method: 'PUT',
        body: payload
      });
      
      if (!res.ok) throw new Error('Failed to update profile');
      
      setStatus('Profile updated successfully!');
      window.location.reload(); 
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignWaiver() {
    if (!waiverSigned) return;
    setStatus('');
    setSigningWaiver(true);
    try {
      const res = await authFetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ waiverVersion: 'v1.0' })
      });
      if (!res.ok) throw new Error('Failed to sign waiver');
      setStatus('Waiver signed successfully!');
      window.location.reload();
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setSigningWaiver(false);
    }
  }

  return (
    <div>
      <div className="eyebrow">Settings</div>
      <h1 className={styles.pageTitle}>Profile & Preferences</h1>
      
      {status && (
        <div style={{ padding: '1rem', marginBottom: '2rem', background: status.includes('Error') ? '#fee' : '#efe', color: status.includes('Error') ? '#c00' : '#080', borderRadius: '4px' }}>
          {status}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.card}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Personal Information</h2>

          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {avatarFile ? (
              <img src={URL.createObjectURL(avatarFile)} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : user.avatar ? (
              <img src={user.avatar} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Image</div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>Profile Picture</label>
              <input type="file" accept="image/*" onChange={e => setAvatarFile(e.target.files[0])} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>First Name</label>
              <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>Last Name</label>
              <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>Phone Number</label>
            <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }} />
          </div>
        </div>

        <div className={styles.card}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Emergency Contact</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--taupe)', marginBottom: '1.5rem' }}>Required before your first class.</p>
          
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>Contact Name</label>
              <input type="text" value={formData.emergencyContactName} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>Contact Phone</label>
              <input type="text" value={formData.emergencyContactPhone} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }} />
            </div>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>Relationship</label>
            <input type="text" value={formData.emergencyContactRelation} onChange={e => setFormData({...formData, emergencyContactRelation: e.target.value})} placeholder="e.g. Spouse, Parent" style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--taupe)', marginBottom: '0.25rem' }}>Medical Notes (Optional)</label>
            <textarea rows="3" value={formData.medicalNotes} onChange={e => setFormData({...formData, medicalNotes: e.target.value})} placeholder="Any allergies, injuries, or conditions our instructors should know about." style={{ width: '100%', padding: '0.5rem', border: '1px solid rgba(0,0,0,0.1)' }} />
          </div>
        </div>

        <div className={styles.card}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Digital Waiver</h2>
          
          {user.waiverSignedAt ? (
            <div style={{ padding: '1rem', background: 'rgba(0,128,0,0.05)', border: '1px solid rgba(0,128,0,0.2)', borderRadius: '4px', color: '#060' }}>
              ✓ You signed the liability waiver on {new Date(user.waiverSignedAt).toLocaleDateString()}.
            </div>
          ) : (
            <>
              <div style={{ padding: '1rem', background: '#f9f9f9', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', height: '150px', overflowY: 'auto', marginBottom: '1rem', fontSize: '0.8rem', lineHeight: 1.6 }}>
                <strong>Liability Waiver & Release</strong><br/><br/>
                By signing this document, you acknowledge that participation in physical exercise and movement classes involves inherent risks... [Full waiver text would go here]. I hereby release Aora House from any claims of injury...
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox" 
                    id="waiver" 
                    checked={waiverSigned} 
                    onChange={e => setWaiverSigned(e.target.checked)} 
                  />
                  <label htmlFor="waiver" style={{ fontSize: '0.9rem' }}>I have read and agree to the Liability Waiver.</label>
                </div>
                <button 
                  type="button" 
                  onClick={handleSignWaiver} 
                  disabled={!waiverSigned || signingWaiver}
                  style={{ 
                    background: waiverSigned ? 'var(--black)' : '#ccc', 
                    color: 'var(--white)', 
                    padding: '0.5rem 1.5rem', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: waiverSigned ? 'pointer' : 'not-allowed', 
                    fontSize: '0.875rem' 
                  }}
                >
                  {signingWaiver ? 'Signing...' : 'Sign Waiver'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className={styles.card}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem' }}>Communication Preferences</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="emailTrans" checked={formData.emailTransactional} onChange={e => setFormData({...formData, emailTransactional: e.target.checked})} />
              <label htmlFor="emailTrans">Transactional Emails (Booking confirmations, receipts)</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="emailMkt" checked={formData.emailMarketing} onChange={e => setFormData({...formData, emailMarketing: e.target.checked})} />
              <label htmlFor="emailMkt">Marketing Emails (News, events, special offers)</label>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" id="smsRem" checked={formData.smsReminders} onChange={e => setFormData({...formData, smsReminders: e.target.checked})} />
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
    </div>
  );
}
