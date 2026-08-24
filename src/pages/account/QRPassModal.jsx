import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export default function QRPassModal({ isOpen, onClose, pass }) {
  const [qrUrl, setQrUrl] = useState('');
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    if (!pass) return;
    setGenerating(true);

    const payload = pass.type === 'event'
      ? `qr_checkin_event:${pass._id || pass.reference || pass.ticketReference}`
      : `qr_checkin_class:${pass._id}`;

    QRCode.toDataURL(payload, {
      width: 280,
      margin: 2,
      color: {
        dark: '#2B2015',
        light: '#FFFDF9'
      }
    })
      .then(url => {
        setQrUrl(url);
        setGenerating(false);
      })
      .catch(err => {
        console.error('Error generating QR pass:', err);
        setGenerating(false);
      });
  }, [pass]);

  if (!isOpen || !pass) return null;

  const isEvent = pass.type === 'event';
  const title = isEvent ? (pass.event?.title || pass.eventName || 'Loft Event Pass') : (pass.classSession?.classType?.name || 'Movement Studio Pass');
  const dateStr = isEvent 
    ? (pass.event?.startDate ? new Date(pass.event.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming')
    : (pass.classSession?.startTime ? new Date(pass.classSession.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Scheduled Class');
  
  const timeStr = isEvent
    ? (pass.event?.time || (pass.event?.startDate ? new Date(pass.event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Doors Open'))
    : (pass.classSession?.startTime ? new Date(pass.classSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

  const venue = isEvent ? (pass.event?.space || 'The Loft & Private Rooms') : (pass.classSession?.classType?.room || 'Movement Studio · Level 2');
  const refCode = pass.ticketReference || pass.reference || `#TBN-${(pass._id || '').slice(-6).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(20, 10, 4, 0.8)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2100,
      padding: '20px'
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#FFFDF9',
        border: '1px solid rgba(227, 211, 184, 0.9)',
        borderRadius: '12px',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Ticket Header Banner */}
        <div style={{
          background: isEvent ? 'linear-gradient(135deg, #2B2015 0%, #4A3527 100%)' : 'linear-gradient(135deg, #2E6B3E 0%, #1A4024 100%)',
          padding: '24px 20px 20px',
          textAlign: 'center',
          color: '#F7EFE1',
          position: 'relative'
        }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ position: 'absolute', top: '12px', right: '14px', background: 'none', border: 'none', color: '#F7EFE1', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: isEvent ? 'var(--gold, #C89B4A)' : '#B8E0C0', fontWeight: 600, marginBottom: '4px' }}>
            Aora House · Digital Access Pass
          </div>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', margin: 0, fontWeight: 500, lineHeight: 1.2 }}>
            {title}
          </h3>
          <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.9 }}>
            {dateStr} {timeStr ? `· ${timeStr}` : ''}
          </div>
        </div>

        {/* Ticket Body / QR Section */}
        <div style={{ padding: '24px 20px 20px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            padding: '12px',
            background: '#FFFDF9',
            border: '2px dashed rgba(200, 155, 74, 0.4)',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            marginBottom: '16px'
          }}>
            {generating ? (
              <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--taupe)' }}>
                Generating secure pass...
              </div>
            ) : qrUrl ? (
              <img src={qrUrl} alt="Digital Check-in Pass QR" style={{ width: '220px', height: '220px', display: 'block' }} />
            ) : (
              <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                QR Pass Unavailable
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FAF6EF', padding: '10px 14px', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.8)', fontSize: '12px', color: 'var(--cocoa-deep, #2B2015)', textAlign: 'left', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--taupe, #9C8770)', letterSpacing: '0.08em' }}>Location</div>
              <div style={{ fontWeight: 600 }}>{venue}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--taupe, #9C8770)', letterSpacing: '0.08em' }}>Pass Ref</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--rust, #A4451F)' }}>{refCode}</div>
            </div>
          </div>

          <p style={{ fontSize: '11.5px', color: 'var(--taupe, #9C8770)', margin: '0 0 16px', lineHeight: 1.4 }}>
            Present this QR code to the clerk at the front desk upon arrival for instant check-in.
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'none',
                border: '1px solid rgba(227, 211, 184, 0.9)',
                padding: '9px',
                borderRadius: '4px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              style={{
                flex: 1,
                background: 'var(--cocoa-deep, #2B2015)',
                color: '#F7EFE1',
                border: 'none',
                padding: '9px',
                borderRadius: '4px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Print / Save ⎙
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
