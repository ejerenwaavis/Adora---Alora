import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function WaiverModal({ isOpen, onClose, onWaiverSigned }) {
  const { authFetch, refreshUser } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError('Please acknowledge and agree to the waiver terms.');
      return;
    }
    if (!signature.trim()) {
      setError('Please type your full legal name as your digital signature.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await authFetch('/api/user/waiver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureName: signature.trim(),
          agreedToTerms: true,
          emergencyContactName: emergencyName.trim(),
          emergencyContactPhone: emergencyPhone.trim(),
          emergencyContactRelation: emergencyRelation.trim(),
          medicalNotes: medicalNotes.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (refreshUser) await refreshUser();
        if (onWaiverSigned) onWaiverSigned(data.user);
        onClose();
      } else {
        setError(data.error || 'Failed to submit waiver. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error submitting waiver. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(20, 10, 4, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }} onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}>
      <div style={{
        background: '#FFFDF9',
        border: '1px solid rgba(227, 211, 184, 0.9)',
        borderRadius: '8px',
        maxWidth: '640px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          background: 'var(--cocoa-deep, #2B2015)',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(227, 211, 184, 0.2)'
        }}>
          <div>
            <div style={{ color: 'var(--gold, #C89B4A)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600 }}>
              Movement Studio Policy
            </div>
            <h3 style={{ color: '#F7EFE1', fontFamily: "'Fraunces', serif", fontSize: '20px', margin: '3px 0 0', fontWeight: 500 }}>
              Health &amp; Liability Waiver
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#F7EFE1', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{ background: '#FBE9E9', border: '1px solid #E8A8A8', color: '#8B2020', padding: '10px 14px', borderRadius: '4px', fontSize: '12.5px' }}>
              {error}
            </div>
          )}

          {/* Waiver Terms Box */}
          <div style={{
            background: '#FAF6EF',
            border: '1px solid rgba(227, 211, 184, 0.7)',
            borderRadius: '6px',
            padding: '16px',
            maxHeight: '160px',
            overflowY: 'auto',
            fontSize: '12px',
            lineHeight: '1.6',
            color: 'var(--cocoa-deep, #2B2015)'
          }}>
            <p style={{ margin: '0 0 10px' }}>
              <strong>1. Voluntary Participation &amp; Physical Fitness:</strong> By enrolling in classes and movement sessions at Aora House, I certify that I am physically fit and have no medical conditions that would prevent full, safe participation, except as disclosed below.
            </p>
            <p style={{ margin: '0 0 10px' }}>
              <strong>2. Assumption of Risk:</strong> I understand that physical exercise, pilates, yoga, and breathwork involve inherent risks of physical injury. I knowingly assume all such risks and release Aora House, its instructors, staff, and facilities from any claims or liabilities.
            </p>
            <p style={{ margin: '0 0 10px' }}>
              <strong>3. Cancellation &amp; Conduct Policy:</strong> Class bookings cancelled within 6 hours of scheduled start time are subject to credit forfeiture. Attendees must adhere to house studio etiquette and instructor directions at all times.
            </p>
            <p style={{ margin: 0 }}>
              <strong>4. Emergency Medical Care:</strong> In the event of an emergency, I authorize Aora House staff to administer or obtain emergency medical treatment on my behalf.
            </p>
          </div>

          {/* Emergency Contact & Medical Section */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe, #9C8770)', fontWeight: 600, marginBottom: '10px' }}>
              Emergency Contact &amp; Medical Notes
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--cocoa-deep, #2B2015)', marginBottom: '4px' }}>Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(227, 211, 184, 0.9)', fontSize: '13px', background: '#FFFDF9' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: 'var(--cocoa-deep, #2B2015)', marginBottom: '4px' }}>Contact Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. +234 800 000 0000"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(227, 211, 184, 0.9)', fontSize: '13px', background: '#FFFDF9' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--cocoa-deep, #2B2015)', marginBottom: '4px' }}>Relationship</label>
              <input
                type="text"
                placeholder="e.g. Spouse, Sibling, Friend"
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(227, 211, 184, 0.9)', fontSize: '13px', background: '#FFFDF9' }}
              />
            </div>

            <div style={{ marginTop: '10px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--cocoa-deep, #2B2015)', marginBottom: '4px' }}>Medical Considerations / Injuries (Optional)</label>
              <textarea
                rows={2}
                placeholder="Please note any joint issues, pregnancy, or recent surgeries for instructors..."
                value={medicalNotes}
                onChange={(e) => setMedicalNotes(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(227, 211, 184, 0.9)', fontSize: '12.5px', background: '#FFFDF9', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'rgba(200, 155, 74, 0.08)', padding: '12px 14px', borderRadius: '6px', border: '1px solid rgba(200, 155, 74, 0.2)' }}>
            <input
              type="checkbox"
              id="waiver-agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: '2px', accentColor: 'var(--rust, #A4451F)', cursor: 'pointer' }}
            />
            <label htmlFor="waiver-agree" style={{ fontSize: '12px', color: 'var(--cocoa-deep, #2B2015)', cursor: 'pointer', lineHeight: '1.4' }}>
              I have read, understood, and voluntarily agree to the Aora House Movement Studio Liability Waiver, Physical Fitness Declaration, and House Etiquette Policy.
            </label>
          </div>

          {/* Digital Signature */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe, #9C8770)', fontWeight: 600, marginBottom: '4px' }}>
              Digital Signature (Type Full Legal Name) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Olivia Vance"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '4px',
                border: '1px solid var(--rust, #A4451F)',
                fontSize: '14px',
                fontFamily: "'Fraunces', serif",
                fontStyle: 'italic',
                color: 'var(--cocoa-deep, #2B2015)',
                background: '#FFFDF9'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid rgba(227, 211, 184, 0.9)',
                padding: '9px 18px',
                borderRadius: '4px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !agreed || !signature.trim()}
              style={{
                background: submitting || !agreed || !signature.trim() ? 'rgba(46, 107, 62, 0.5)' : 'var(--forest, #2E6B3E)',
                color: '#FFFFFF',
                border: 'none',
                padding: '9px 22px',
                borderRadius: '4px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
                cursor: submitting || !agreed || !signature.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {submitting ? 'Submitting Waiver...' : 'Sign & Complete Waiver ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
