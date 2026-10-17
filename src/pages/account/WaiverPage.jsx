import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { IconShieldCheck, IconCheck, IconAlert, IconArrowRight } from '../../components/ui/LineIcons';

const DEFAULT_WAIVER_CONTENT = `
<div class="waiver-document" style="font-family: inherit; line-height: 1.75; color: #2B2015;">
  <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #E3D3B8; padding-bottom: 16px;">
    <h2 style="font-family: 'Fraunces', serif; font-size: 22px; color: #1E1610; margin: 0 0 6px;">AORA HOUSE — MOVEMENT STUDIO</h2>
    <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.12em; color: #C89B4A; margin: 0 0 4px; font-weight: 600;">CLIENT LIABILITY WAIVER &amp; RELEASE</h3>
    <p style="font-size: 13px; color: #9C8770; margin: 0;">Lagos, Nigeria · Governed by Nigerian Law</p>
  </div>

  <p style="font-style: italic; font-size: 13px; color: #6E5E4E; background: #FAF6EF; padding: 12px 16px; border-left: 3px solid #C89B4A; border-radius: 4px; margin-bottom: 20px;">
    This waiver is presented electronically. By proceeding with your movement class booking, you confirm you have read, understood, and agreed to the terms below.
  </p>

  <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 20px; margin-bottom: 8px;">1. General Assumption of Risk and Limitation of Liability</h4>
  <p>
    By completing this waiver, booking classes, attending sessions, events, or programmes at <strong>Aora House</strong> (the "Studio"), whether in-person at the Studio or using Studio equipment (the "Equipment"), you acknowledge and agree on behalf of yourself, your heirs, and personal representatives that:
  </p>
  <ul style="padding-left: 20px; margin-bottom: 14px; font-size: 13.5px;">
    <li style="margin-bottom: 6px;">(a) there are inherent risks in the strenuous nature of the Studio's movement programmes, including Reformer Pilates, Lagree, strength training, and group movement classes;</li>
    <li style="margin-bottom: 6px;">(b) you have voluntarily chosen to enrol and participate in an intense physical exercise programme;</li>
    <li style="margin-bottom: 6px;">(c) Aora House strongly recommends consulting a qualified physician prior to starting, and you confirm you are in good physical condition;</li>
    <li style="margin-bottom: 6px;">(d) you have been fully informed of potential adverse physiological occurrences including abnormal blood pressure, fainting, muscle injury, or other physical harm; and</li>
    <li style="margin-bottom: 6px;">(e) you voluntarily assume all risks and danger of injury inherent in physical exercise and Equipment use.</li>
  </ul>
  <p>
    You release and discharge <strong>Aora House, its founders, owners, directors, employees, instructors, agents, affiliates, and representatives</strong> ("the Releasees") from any loss, damage, or injury arising from participation, unexpected Equipment malfunction, or accidents within Studio premises.
  </p>

  <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 20px; margin-bottom: 8px;">2. Health Disclosure</h4>
  <p>
    You confirm that you have disclosed any pre-existing medical conditions, injuries, or limitations to Aora House prior to participating, and accept full responsibility for any undisclosed conditions.
  </p>

  <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 20px; margin-bottom: 8px;">3. Media &amp; Photography Consent</h4>
  <p>
    Your presence at Aora House constitutes consent to be photographed or recorded for promotional, editorial, and social media purposes. If you do not consent, please notify staff on arrival.
  </p>

  <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 20px; margin-bottom: 8px;">4. Intellectual Property &amp; Etiquette</h4>
  <p>
    All movement programmes, formats, training methodologies, branding, and digital materials are the exclusive property of Aora House. Attendees must adhere to instructor instructions and house etiquette at all times.
  </p>

  <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 20px; margin-bottom: 8px;">5. Governing Law &amp; Dispute Resolution</h4>
  <p>
    This Agreement is governed by the laws of the <strong>Federal Republic of Nigeria</strong>. Disputes shall first be referred to mediation, and if unresolved, by arbitration in accordance with the <strong>Arbitration and Mediation Act 2023 (Nigeria)</strong> held in Lagos, Nigeria.
  </p>

  <h4 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #1E1610; margin-top: 20px; margin-bottom: 8px;">6. Electronic Signature Acknowledgement</h4>
  <p>
    By checking the confirmation box and submitting, you acknowledge that you have read this waiver carefully, understand it is a Release of Liability, and your electronic acceptance carries the same legal weight as a handwritten signature under Nigerian law.
  </p>
</div>
`;

export default function WaiverPage() {
  const { user, authFetch, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/movement';

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
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const scrollRef = useRef(null);

  useEffect(() => {
    if (user) {
      setSignature(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setEmergencyName(user.emergencyContactName || '');
      setEmergencyPhone(user.emergencyContactPhone || '');
      setEmergencyRelation(user.emergencyContactRelation || '');
      setMedicalNotes(user.medicalNotes || '');
    }
    fetchActiveWaiver();
  }, [user]);

  const fetchActiveWaiver = async () => {
    setLoading(true);
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
        if (data.hasSigned) {
          setAlreadySigned(true);
        }
      }
    } catch (err) {
      console.warn('Waiver fetch fallback:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e) => {
    const target = e.currentTarget;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (distanceToBottom <= 50) {
      setHasScrolledToBottom(true);
    }
  };

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
        navigate(returnTo);
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
    <div style={{ minHeight: '80vh', background: 'var(--paper, #F7EFE1)', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        
        {/* Top Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ color: 'var(--gold, #C89B4A)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600, marginBottom: '6px' }}>
            Movement Studio Safety Gate · Version {waiverVersion}
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '32px', color: 'var(--cocoa-deep, #2B2015)', margin: '0 0 10px', fontWeight: 400 }}>
            {waiverTitle}
          </h1>
          <p style={{ color: 'var(--taupe, #9C8770)', fontSize: '14px', maxWidth: '600px', margin: '0 auto' }}>
            To safeguard our community and uphold studio wellness standards, all members must electronically sign this agreement prior to participating in movement sessions.
          </p>
        </div>

        {alreadySigned && (
          <div style={{
            background: '#EAF5EE',
            border: '1px solid #84C498',
            borderRadius: '8px',
            padding: '18px 24px',
            marginBottom: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <IconShieldCheck size={24} color="#2E6B3E" />
              <div>
                <strong style={{ color: '#2E6B3E', display: 'block', fontSize: '14px' }}>
                  Waiver Active on File (Version {waiverVersion})
                </strong>
                <span style={{ fontSize: '12.5px', color: '#3A5A40' }}>
                  You have already signed the current liability waiver. You are clear to book classes!
                </span>
              </div>
            </div>
            <Link to={returnTo} className="btn btn-primary" style={{ background: '#2E6B3E', padding: '9px 18px', fontSize: '12px' }}>
              Continue to Classes →
            </Link>
          </div>
        )}

        <div style={{
          background: '#FFFDF9',
          border: '1px solid rgba(227, 211, 184, 0.9)',
          borderRadius: '8px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
          overflow: 'hidden'
        }}>
          {/* Member Metadata Card */}
          <div style={{
            background: 'var(--cocoa-deep, #2B2015)',
            color: '#F7EFE1',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12.5px'
          }}>
            <div>
              <span style={{ color: 'var(--gold, #C89B4A)' }}>Member:</span> <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email})
            </div>
            <div>
              <span style={{ color: 'var(--gold, #C89B4A)' }}>Jurisdiction:</span> Lagos, Nigeria (Arbitration Act 2023)
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {error && (
              <div style={{ background: '#FBE9E9', border: '1px solid #E8A8A8', color: '#8B2020', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <IconAlert size={18} color="#8B2020" />
                <span>{error}</span>
              </div>
            )}

            {/* Scrollable Waiver Text Box */}
            <div style={{ position: 'relative' }}>
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                style={{
                  background: '#FFFFFF',
                  border: hasScrolledToBottom ? '1.5px solid #2E6B3E' : '1.5px solid rgba(200, 155, 74, 0.6)',
                  borderRadius: '6px',
                  padding: '24px 28px',
                  maxHeight: '420px',
                  overflowY: 'auto',
                  fontSize: '13.5px',
                  lineHeight: '1.7',
                  color: '#2B2015',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.03)'
                }}
                dangerouslySetInnerHTML={{ __html: waiverHtml }}
              />

              {!hasScrolledToBottom && (
                <div style={{
                  position: 'sticky',
                  bottom: 0,
                  marginTop: '-36px',
                  background: 'linear-gradient(transparent, rgba(255, 253, 249, 0.95) 40%, #FFFDF9)',
                  padding: '10px 14px',
                  textAlign: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--rust, #A4451F)',
                  borderRadius: '0 0 6px 6px',
                  pointerEvents: 'none'
                }}>
                  ↓ Please scroll to the bottom of the agreement to review all clauses and enable signing
                </div>
              )}
            </div>

            {/* Emergency Contact Information */}
            <div style={{ background: '#FAF6EF', padding: '18px 20px', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.75)' }}>
              <div style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe, #9C8770)', fontWeight: 600, marginBottom: '12px' }}>
                Emergency Contact &amp; Medical Notes (Optional)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#2B2015', marginBottom: '4px' }}>Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Jane Doe"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid rgba(227, 211, 184, 0.9)', fontSize: '13px', background: '#FFFDF9' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#2B2015', marginBottom: '4px' }}>Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. +234 800 000 0000"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid rgba(227, 211, 184, 0.9)', fontSize: '13px', background: '#FFFDF9' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', color: '#2B2015', marginBottom: '4px' }}>Relationship</label>
                  <input
                    type="text"
                    placeholder="e.g. Spouse, Sibling"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '4px', border: '1px solid rgba(227, 211, 184, 0.9)', fontSize: '13px', background: '#FFFDF9' }}
                  />
                </div>
              </div>
            </div>

            {/* Agreement Checkbox with Scroll Lock */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              background: hasScrolledToBottom ? 'rgba(200, 155, 74, 0.1)' : 'rgba(0,0,0,0.03)',
              padding: '14px 18px',
              borderRadius: '6px',
              border: hasScrolledToBottom ? '1.5px solid rgba(200, 155, 74, 0.5)' : '1px solid rgba(0,0,0,0.08)',
              transition: 'all 0.2s ease'
            }}>
              <input
                type="checkbox"
                id="waiver-agree-page"
                checked={agreed}
                disabled={!hasScrolledToBottom}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{
                  marginTop: '3px',
                  accentColor: 'var(--rust, #A4451F)',
                  cursor: hasScrolledToBottom ? 'pointer' : 'not-allowed',
                  width: '18px',
                  height: '18px'
                }}
              />
              <label
                htmlFor="waiver-agree-page"
                style={{
                  fontSize: '13px',
                  color: hasScrolledToBottom ? 'var(--cocoa-deep, #2B2015)' : '#888',
                  cursor: hasScrolledToBottom ? 'pointer' : 'not-allowed',
                  lineHeight: '1.5',
                  userSelect: 'none'
                }}
              >
                I have read and fully understand the above <strong>Aora House Client Liability Waiver &amp; Release</strong> and agree to be bound by all terms, policies, and dispute resolution provisions under Nigerian law.
              </label>
            </div>

            {/* Digital Signature */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe, #9C8770)', fontWeight: 600, marginBottom: '6px' }}>
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
                  padding: '12px 16px',
                  borderRadius: '4px',
                  border: '1.5px solid var(--rust, #A4451F)',
                  fontSize: '16px',
                  fontFamily: "'Fraunces', serif",
                  fontStyle: 'italic',
                  color: 'var(--cocoa-deep, #2B2015)',
                  background: '#FFFDF9'
                }}
              />
              <p style={{ fontSize: '11.5px', color: '#9C8770', margin: '6px 0 0' }}>
                Your electronic signature carries the same legal weight as a handwritten signature under the laws of Nigeria. Timestamp, IP address, and browser signature are forensically recorded.
              </p>
            </div>

            {/* Submit Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <Link
                to={returnTo}
                style={{
                  padding: '12px 24px',
                  borderRadius: '4px',
                  border: '1px solid rgba(227, 211, 184, 0.9)',
                  color: 'var(--cocoa-deep, #2B2015)',
                  textDecoration: 'none',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600
                }}
              >
                Return Without Signing
              </Link>
              <button
                type="submit"
                disabled={submitting || !hasScrolledToBottom || !agreed || !signature.trim()}
                style={{
                  background: (submitting || !hasScrolledToBottom || !agreed || !signature.trim()) ? 'rgba(46, 107, 62, 0.4)' : 'var(--forest, #2E6B3E)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                  cursor: (submitting || !hasScrolledToBottom || !agreed || !signature.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <IconCheck size={15} color="#FFF" />
                <span>{submitting ? 'Signing Waiver...' : 'Sign & Complete Waiver'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
