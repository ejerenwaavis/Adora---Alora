import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { IconX, IconShieldCheck, IconPen, IconCheck, IconAlert } from '../../components/ui/LineIcons';

const DEFAULT_WAIVER_CONTENT = `
<div class="waiver-document" style="font-family: inherit; line-height: 1.7; color: #2B2015;">
  <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #E3D3B8; padding-bottom: 14px;">
    <h2 style="font-family: 'Fraunces', serif; font-size: 20px; color: #1E1610; margin: 0 0 4px;">AORA HOUSE — MOVEMENT STUDIO</h2>
    <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.12em; color: #C89B4A; margin: 0 0 4px; font-weight: 600;">CLIENT LIABILITY WAIVER &amp; RELEASE</h3>
    <p style="font-size: 12px; color: #9C8770; margin: 0;">Lagos, Nigeria · Governed by Nigerian Law</p>
  </div>

  <p style="font-style: italic; font-size: 12px; color: #6E5E4E; background: #FAF6EF; padding: 10px 14px; border-left: 3px solid #C89B4A; border-radius: 4px; margin-bottom: 16px;">
    This waiver is presented electronically. By proceeding with your movement class booking, you confirm you have read, understood, and agreed to the terms below.
  </p>

  <h4 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 16px; margin-bottom: 6px;">1. General Assumption of Risk and Limitation of Liability</h4>
  <p>
    By completing this waiver, booking classes, attending sessions, events, or programmes at <strong>Aora House</strong> (the "Studio"), whether in-person at the Studio or using Studio equipment (the "Equipment"), you acknowledge and agree on behalf of yourself, your heirs, and personal representatives that:
  </p>
  <ul style="padding-left: 18px; margin-bottom: 12px; font-size: 12.5px;">
    <li>(a) there are inherent risks in the strenuous nature of the Studio's movement programmes, including Reformer Pilates, Lagree, strength training, and group movement classes;</li>
    <li>(b) you have voluntarily chosen to enrol and participate in an intense physical exercise programme;</li>
    <li>(c) Aora House strongly recommends consulting a qualified physician prior to starting, and you confirm you are in good physical condition;</li>
    <li>(d) you have been fully informed of potential adverse physiological occurrences including abnormal blood pressure, fainting, muscle injury, or other physical harm; and</li>
    <li>(e) you voluntarily assume all risks and danger of injury inherent in physical exercise and Equipment use.</li>
  </ul>
  <p>
    You release and discharge <strong>Aora House, its founders, owners, directors, employees, instructors, agents, affiliates, and representatives</strong> ("the Releasees") from any loss, damage, or injury arising from participation, unexpected Equipment malfunction, or accidents within Studio premises.
  </p>

  <h4 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 16px; margin-bottom: 6px;">2. Health Disclosure</h4>
  <p>
    You confirm you have disclosed any pre-existing medical conditions, injuries, or limitations to Aora House prior to participating, and accept full responsibility for any undisclosed conditions.
  </p>

  <h4 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 16px; margin-bottom: 6px;">3. Media &amp; Photography Consent</h4>
  <p>
    Your presence at Aora House constitutes consent to be photographed or recorded for promotional, editorial, and social media purposes. If you do not consent, please notify staff on arrival.
  </p>

  <h4 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 16px; margin-bottom: 6px;">4. Intellectual Property &amp; Etiquette</h4>
  <p>
    All movement programmes, formats, training methodologies, branding, and digital materials are the exclusive property of Aora House. Attendees must adhere to instructor instructions and house etiquette at all times.
  </p>

  <h4 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 16px; margin-bottom: 6px;">5. Governing Law &amp; Dispute Resolution</h4>
  <p>
    This Agreement is governed by the laws of the <strong>Federal Republic of Nigeria</strong>. Disputes shall first be referred to mediation, and if unresolved, by arbitration in accordance with the <strong>Arbitration and Mediation Act 2023 (Nigeria)</strong> held in Lagos, Nigeria.
  </p>

  <h4 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 16px; margin-bottom: 6px;">6. Electronic Signature Acknowledgement</h4>
  <p>
    By checking the confirmation box and submitting, you acknowledge that you have read this waiver carefully, understand it is a Release of Liability, and your electronic acceptance carries the same legal weight as a handwritten signature under Nigerian law.
  </p>
</div>
`;

export default function WaiverModal({ isOpen, onClose, onWaiverSigned }) {
  const { user, authFetch, refreshUser } = useAuth();
  const [agreed, setAgreed] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [signature, setSignature] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [waiverVersion, setWaiverVersion] = useState('2026-09');
  const [waiverTitle, setWaiverTitle] = useState('Aora House Movement Studio — Client Liability Waiver');
  const [waiverHtml, setWaiverHtml] = useState(DEFAULT_WAIVER_CONTENT);
  const [loadingWaiver, setLoadingWaiver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setAgreed(false);
      setHasScrolledToBottom(false);
      setError('');
      if (user) {
        setSignature(`${user.firstName || ''} ${user.lastName || ''}`.trim());
        setEmergencyName(user.emergencyContactName || '');
        setEmergencyPhone(user.emergencyContactPhone || '');
        setEmergencyRelation(user.emergencyContactRelation || '');
        setMedicalNotes(user.medicalNotes || '');
      }
      fetchActiveWaiver();
    }
  }, [isOpen, user]);

  const fetchActiveWaiver = async () => {
    setLoadingWaiver(true);
    try {
      const res = await authFetch('/api/user/waiver/active');
      if (res.ok) {
        const data = await res.json();
        if (data.activeWaiver) {
          setWaiverVersion(data.activeWaiver.version || '2026-09');
          setWaiverTitle(data.activeWaiver.title || 'Aora House Movement Studio — Client Liability Waiver');
          if (data.activeWaiver.content) {
            setWaiverHtml(data.activeWaiver.content);
          }
        }
      }
    } catch (err) {
      console.warn('Using default waiver fallback:', err.message);
    } finally {
      setLoadingWaiver(false);
    }
  };

  const handleScroll = (e) => {
    const target = e.currentTarget;
    // Calculate if user is within 50px of the bottom
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceToBottom <= 50) {
      setHasScrolledToBottom(true);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasScrolledToBottom) {
      setError('Please scroll through and read the entire liability waiver before signing.');
      return;
    }
    if (!agreed) {
      setError('Please acknowledge and check the confirmation box.');
      return;
    }
    if (!signature.trim()) {
      setError('Please type your full legal name as your digital signature.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await authFetch('/api/user/waiver/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureName: signature.trim(),
          confirmed: true,
          waiverVersion,
          emergencyContactName: emergencyName.trim(),
          emergencyContactPhone: emergencyPhone.trim(),
          emergencyContactRelation: emergencyRelation.trim(),
          medicalNotes: medicalNotes.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (refreshUser) await refreshUser();
        if (onWaiverSigned) onWaiverSigned(data.user);
        onClose();
      } else {
        setError(data.error || data.message || 'Failed to submit waiver. Please try again.');
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
      background: 'rgba(20, 10, 4, 0.78)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '16px'
    }} onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}>
      <div style={{
        background: '#FFFDF9',
        border: '1px solid rgba(227, 211, 184, 0.9)',
        borderRadius: '8px',
        maxWidth: '680px',
        width: '100%',
        maxHeight: '92vh',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          background: 'var(--cocoa-deep, #2B2015)',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(227, 211, 184, 0.2)'
        }}>
          <div>
            <div style={{ color: 'var(--gold, #C89B4A)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600 }}>
              Movement Studio Safety Gate · Version {waiverVersion}
            </div>
            <h3 style={{ color: '#F7EFE1', fontFamily: "'Fraunces', serif", fontSize: '19px', margin: '3px 0 0', fontWeight: 400 }}>
              {waiverTitle}
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#F7EFE1', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}
            aria-label="Close modal"
          >
            <IconX size={18} color="#F7EFE1" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {error && (
            <div style={{ background: '#FBE9E9', border: '1px solid #E8A8A8', color: '#8B2020', padding: '10px 14px', borderRadius: '4px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconAlert size={16} color="#8B2020" />
              <span>{error}</span>
            </div>
          )}

          {/* Member Details Banner */}
          <div style={{
            background: '#FAF6EF',
            border: '1px solid rgba(227, 211, 184, 0.8)',
            borderRadius: '6px',
            padding: '10px 14px',
            fontSize: '11.5px',
            color: '#6E5E4E',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div><strong>Member:</strong> {user?.firstName} {user?.lastName}</div>
            <div><strong>Email:</strong> {user?.email}</div>
            <div><strong>Jurisdiction:</strong> Lagos, Nigeria</div>
          </div>

          {/* Scrollable Waiver Content Box */}
          <div style={{ position: 'relative' }}>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              style={{
                background: '#FFFFFF',
                border: hasScrolledToBottom ? '1.5px solid #2E6B3E' : '1.5px solid rgba(200, 155, 74, 0.6)',
                borderRadius: '6px',
                padding: '18px 20px',
                maxHeight: '260px',
                overflowY: 'auto',
                fontSize: '13px',
                lineHeight: '1.65',
                color: '#2B2015',
                boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)'
              }}
              dangerouslySetInnerHTML={{ __html: waiverHtml }}
            />
            
            {!hasScrolledToBottom && (
              <div style={{
                position: 'sticky',
                bottom: 0,
                marginTop: '-32px',
                background: 'linear-gradient(transparent, rgba(255, 253, 249, 0.95) 40%, #FFFDF9)',
                padding: '8px 12px',
                textAlign: 'center',
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--rust, #A4451F)',
                borderRadius: '0 0 6px 6px',
                pointerEvents: 'none'
              }}>
                ↓ Please scroll to the bottom of the waiver to review and enable signing
              </div>
            )}
          </div>

          {/* Emergency Contact Section */}
          <div style={{ background: '#FAF6EF', padding: '14px', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.6)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe, #9C8770)', fontWeight: 600, marginBottom: '8px' }}>
              Emergency Contact &amp; Health Info (Optional)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#2B2015', marginBottom: '3px' }}>Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid rgba(227, 211, 184, 0.9)', fontSize: '12.5px', background: '#FFFDF9' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#2B2015', marginBottom: '3px' }}>Contact Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. +234 800 000 0000"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid rgba(227, 211, 184, 0.9)', fontSize: '12.5px', background: '#FFFDF9' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#2B2015', marginBottom: '3px' }}>Relationship</label>
                <input
                  type="text"
                  placeholder="e.g. Spouse, Sibling"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid rgba(227, 211, 184, 0.9)', fontSize: '12.5px', background: '#FFFDF9' }}
                />
              </div>
            </div>
          </div>

          {/* Agreement Checkbox with Scroll Lock */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            background: hasScrolledToBottom ? 'rgba(200, 155, 74, 0.1)' : 'rgba(0,0,0,0.03)',
            padding: '12px 14px',
            borderRadius: '6px',
            border: hasScrolledToBottom ? '1px solid rgba(200, 155, 74, 0.4)' : '1px solid rgba(0,0,0,0.08)',
            transition: 'all 0.2s ease'
          }}>
            <input
              type="checkbox"
              id="waiver-agree-modal"
              checked={agreed}
              disabled={!hasScrolledToBottom}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{
                marginTop: '2px',
                accentColor: 'var(--rust, #A4451F)',
                cursor: hasScrolledToBottom ? 'pointer' : 'not-allowed',
                width: '16px',
                height: '16px'
              }}
            />
            <label
              htmlFor="waiver-agree-modal"
              style={{
                fontSize: '12.5px',
                color: hasScrolledToBottom ? 'var(--cocoa-deep, #2B2015)' : '#888',
                cursor: hasScrolledToBottom ? 'pointer' : 'not-allowed',
                lineHeight: '1.45',
                userSelect: 'none'
              }}
            >
              I have read, understood, and voluntarily agree to the <strong>Aora House Movement Studio Client Liability Waiver &amp; Release</strong> under Nigerian law.
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
                border: '1.5px solid var(--rust, #A4451F)',
                fontSize: '15px',
                fontFamily: "'Fraunces', serif",
                fontStyle: 'italic',
                color: 'var(--cocoa-deep, #2B2015)',
                background: '#FFFDF9'
              }}
            />
            <p style={{ fontSize: '11px', color: '#9C8770', margin: '4px 0 0' }}>
              Your electronic signature carries the same legal weight as a handwritten signature under Nigerian law. Timestamp, IP address, and browser signature are forensically recorded.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
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
                letterSpacing: '0.08em',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !hasScrolledToBottom || !agreed || !signature.trim()}
              style={{
                background: (submitting || !hasScrolledToBottom || !agreed || !signature.trim()) ? 'rgba(46, 107, 62, 0.4)' : 'var(--forest, #2E6B3E)',
                color: '#FFFFFF',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '4px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
                cursor: (submitting || !hasScrolledToBottom || !agreed || !signature.trim()) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <IconCheck size={13} color="#FFF" />
              <span>{submitting ? 'Signing Waiver...' : 'Sign & Complete Waiver'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
