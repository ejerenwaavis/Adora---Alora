import React from 'react';
import { Link } from 'react-router-dom';
import { IconShieldCheck, IconClock, IconPin, IconX, IconAlert } from './ui/LineIcons';

export default function OrderConfirmationModal({ 
  isOpen, 
  onClose, 
  order, 
  state = 'success', // 'redirecting' | 'verifying' | 'success' | 'failed'
  error = null,
  onRetry = null,
  redirectingText = 'You are being redirected to checkout...'
}) {
  if (!isOpen) return null;
  if (state === 'success' && !order) return null;

  const orderNum = order?.orderNumber 
    ? (order.orderNumber.startsWith('#') ? order.orderNumber : `#${order.orderNumber}`)
    : (order?._id ? `#AH-${order._id.slice(-6).toUpperCase()}` : '#AH-ORD');
  const items = order?.items || [];
  const totalNaira = ((order?.totalAmountKobo || 0) / 100).toLocaleString();

  const isTransitioning = state === 'redirecting' || state === 'verifying';

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 10, 4, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px'
      }} 
      onClick={(e) => { 
        if (e.target === e.currentTarget && !isTransitioning) onClose(); 
      }}
    >
      <div style={{
        background: '#FFFDF9',
        border: '1px solid rgba(227, 211, 184, 0.9)',
        borderRadius: '12px',
        maxWidth: '460px',
        width: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        position: 'relative',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Keyframe animation for spinner */}
        <style>{`
          @keyframes ahSpin {
            to { transform: rotate(360deg); }
          }
          @keyframes ahPulse {
            0%, 100% { opacity: 0.6; transform: scale(0.98); }
            50% { opacity: 1; transform: scale(1.02); }
          }
        `}</style>

        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div style={{
          background: state === 'failed' 
            ? 'linear-gradient(135deg, #3A180E 0%, #271008 100%)' 
            : 'linear-gradient(135deg, #2B2015 0%, #3D2D1E 100%)',
          padding: '24px 20px',
          textAlign: 'center',
          color: '#F7EFE1',
          position: 'relative'
        }}>
          {!isTransitioning && (
            <button 
              type="button" 
              onClick={onClose}
              style={{ 
                position: 'absolute', 
                top: '14px', 
                right: '14px', 
                background: 'none', 
                border: 'none', 
                color: '#F7EFE1', 
                cursor: 'pointer', 
                padding: '4px', 
                display: 'flex', 
                alignItems: 'center' 
              }}
              aria-label="Close modal"
            >
              <IconX size={18} color="#F7EFE1" />
            </button>
          )}
          
          {/* Top Badge Icon */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: state === 'failed' ? 'rgba(184, 95, 60, 0.25)' : 'rgba(200, 155, 74, 0.18)',
            border: state === 'failed' ? '1px solid rgba(184, 95, 60, 0.5)' : '1px solid rgba(200, 155, 74, 0.4)',
            color: state === 'failed' ? 'var(--rust, #B85F3C)' : 'var(--gold, #C89B4A)',
            marginBottom: '12px'
          }}>
            {isTransitioning ? (
              <div style={{
                width: '22px',
                height: '22px',
                border: '2.5px solid rgba(200, 155, 74, 0.3)',
                borderTopColor: 'var(--gold, #C89B4A)',
                borderRadius: '50%',
                animation: 'ahSpin 0.8s linear infinite'
              }} />
            ) : state === 'failed' ? (
              <IconAlert size={24} color="#E07A5F" />
            ) : (
              <IconShieldCheck size={24} color="var(--gold, #C89B4A)" />
            )}
          </div>

          <div style={{ 
            fontSize: '10px', 
            textTransform: 'uppercase', 
            letterSpacing: '0.18em', 
            color: state === 'failed' ? '#E07A5F' : 'var(--gold, #C89B4A)', 
            fontWeight: 600, 
            marginBottom: '4px' 
          }}>
            {state === 'redirecting' && 'Aora House Café · Secure Checkout'}
            {state === 'verifying' && 'Aora House Café · Payment Verification'}
            {state === 'failed' && 'Aora House Café · Transaction Incomplete'}
            {state === 'success' && 'Aora House Café · Order Confirmed'}
          </div>

          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', margin: 0, fontWeight: 400, color: '#F7EFE1' }}>
            {state === 'redirecting' && 'Connecting Checkout'}
            {state === 'verifying' && 'Confirming Payment'}
            {state === 'failed' && 'Payment Not Completed'}
            {state === 'success' && 'Order Received'}
          </h3>

          <div style={{ 
            fontSize: '12px', 
            marginTop: '6px', 
            color: 'rgba(247, 239, 225, 0.85)',
            wordBreak: 'break-all',
            overflowWrap: 'anywhere'
          }}>
            {state === 'success' && (
              <>Order Reference: <strong style={{ color: '#F7EFE1', letterSpacing: '0.04em' }}>{orderNum}</strong></>
            )}
            {state === 'redirecting' && (
              <>Total Amount: <strong style={{ color: '#F7EFE1' }}>₦{totalNaira}</strong></>
            )}
            {state === 'verifying' && (
              <>Order Reference: <strong style={{ color: '#F7EFE1' }}>{orderNum}</strong></>
            )}
            {state === 'failed' && (
              <>Status: <strong style={{ color: '#F7EFE1' }}>Unconfirmed</strong></>
            )}
          </div>
        </div>

        {/* ── BODY ────────────────────────────────────────────────────────── */}
        <div style={{ padding: '24px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* 1. REDIRECTING STATE */}
          {state === 'redirecting' && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
              <div style={{
                width: '52px',
                height: '52px',
                border: '3px solid rgba(200, 155, 74, 0.25)',
                borderTopColor: 'var(--rust, #B85F3C)',
                borderRadius: '50%',
                margin: '0 auto 1.25rem',
                animation: 'ahSpin 0.8s linear infinite'
              }} />
              <h4 style={{
                fontFamily: "'Fraunces', serif",
                fontSize: '1.25rem',
                color: 'var(--cocoa-deep, #2B2015)',
                margin: '0 0 0.5rem',
                fontWeight: 500
              }}>
                {redirectingText}
              </h4>
              <p style={{ color: 'var(--taupe, #9C8770)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 auto', maxWidth: '320px' }}>
                Connecting to Paystack gateway. Please keep this screen open while we transfer you to checkout.
              </p>
            </div>
          )}

          {/* 2. VERIFYING STATE */}
          {state === 'verifying' && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
              <div style={{
                width: '52px',
                height: '52px',
                border: '3px solid rgba(200, 155, 74, 0.25)',
                borderTopColor: 'var(--rust, #B85F3C)',
                borderRadius: '50%',
                margin: '0 auto 1.25rem',
                animation: 'ahSpin 0.8s linear infinite'
              }} />
              <h4 style={{
                fontFamily: "'Fraunces', serif",
                fontSize: '1.25rem',
                color: 'var(--cocoa-deep, #2B2015)',
                margin: '0 0 0.5rem',
                fontWeight: 500
              }}>
                Verifying Your Payment…
              </h4>
              <p style={{ color: 'var(--taupe, #9C8770)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 auto', maxWidth: '320px' }}>
                Synchronizing with Paystack and alerting the café kitchen. This will take just a few seconds.
              </p>
            </div>
          )}

          {/* 3. FAILED / DECLINED / INCOMPLETE STATE */}
          {state === 'failed' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: '#FFF5F2',
                border: '1px solid rgba(184, 95, 60, 0.35)',
                borderRadius: '8px',
                padding: '14px 16px',
                color: '#8A3214',
                fontSize: '13px',
                lineHeight: 1.55
              }}>
                <strong style={{ display: 'block', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#B85F3C' }}>
                  Checkout Status
                </strong>
                {error?.message || error?.gateway_response || 'The transaction was cancelled or could not be completed.'}
              </div>

              <p style={{ color: 'var(--taupe, #9C8770)', fontSize: '12.5px', lineHeight: 1.55, margin: 0 }}>
                If you were debited by your bank, please wait a few moments before re-trying to avoid duplicate payments — our system will automatically verify and confirm your order if funds were captured. Otherwise, you can review your items and try again.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                {onRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    style={{
                      background: 'var(--cocoa-deep, #2B2015)',
                      color: '#F7EFE1',
                      padding: '12px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Review Cart &amp; Try Again →
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(227, 211, 184, 0.9)',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--cocoa-deep, #2B2015)',
                    cursor: 'pointer'
                  }}
                >
                  Return to Menu
                </button>
              </div>
            </div>
          )}

          {/* 4. SUCCESS STATE (Exact Image 1) */}
          {state === 'success' && order && (
            <>
              {/* Status Note */}
              <div style={{
                background: 'rgba(46, 107, 62, 0.08)',
                border: '1px solid rgba(46, 107, 62, 0.2)',
                borderRadius: '6px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12.5px',
                color: '#1A4024'
              }}>
                <IconClock size={16} color="#2E6B3E" />
                <div>
                  <strong>Kitchen Preparation in Progress</strong>
                  <div style={{ fontSize: '11.5px', opacity: 0.85 }}>Estimated ready time: 15–20 minutes</div>
                </div>
              </div>

              {/* Guest Info */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '10px', 
                background: '#FAF6EF', 
                padding: '12px 14px', 
                borderRadius: '6px', 
                border: '1px solid rgba(227, 211, 184, 0.7)', 
                fontSize: '12px' 
              }}>
                <div>
                  <span style={{ color: 'var(--taupe, #9C8770)', display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Guest Name</span>
                  <strong style={{ color: 'var(--cocoa-deep, #2B2015)' }}>{order.customerName || 'Aora Guest'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--taupe, #9C8770)', display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phone</span>
                  <strong style={{ color: 'var(--cocoa-deep, #2B2015)' }}>{order.customerPhone || 'On File'}</strong>
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe, #9C8770)', fontWeight: 600, marginBottom: '10px' }}>
                  Order Items Summary
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(227, 211, 184, 0.6)', paddingTop: '10px' }}>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--cocoa-deep, #2B2015)' }}>
                      <span>{item.quantity}x {item.name}</span>
                      <span style={{ fontWeight: 600 }}>₦{(((item.priceKobo || 0) * (item.quantity || 1)) / 100).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid rgba(227, 211, 184, 0.8)', marginTop: '12px', paddingTop: '12px' }}>
                  <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--cocoa-deep)' }}>Total Amount</span>
                  <span style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', fontWeight: 600, color: 'var(--cocoa-deep)' }}>₦{totalNaira}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                <Link
                  to="/account"
                  onClick={onClose}
                  style={{
                    background: 'var(--cocoa-deep, #2B2015)',
                    color: '#F7EFE1',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 600,
                    textAlign: 'center',
                    textDecoration: 'none'
                  }}
                >
                  View in Member Account →
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(227, 211, 184, 0.9)',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--cocoa-deep, #2B2015)',
                    cursor: 'pointer'
                  }}
                >
                  Continue Browsing
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
