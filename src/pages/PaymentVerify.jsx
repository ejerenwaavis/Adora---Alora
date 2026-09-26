import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PaymentVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const reference = searchParams.get('reference') || searchParams.get('trxref') || '';
  
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'failed' | 'error'
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setResult({
        message: 'No payment transaction reference was found in the URL. Please return to the homepage or check your order history.'
      });
      return;
    }

    let isMounted = true;

    async function verifyTransaction() {
      try {
        const res = await fetch(`/api/payments/verify/${encodeURIComponent(reference)}`);
        const data = await res.json();

        if (!isMounted) return;

        if (data.success && data.status === 'success') {
          setStatus('success');
          setResult(data);
          if (refreshUser) refreshUser();
        } else {
          setStatus('failed');
          setResult(data);
        }
      } catch (err) {
        if (!isMounted) return;
        setStatus('error');
        setResult({
          message: 'Unable to communicate with the payment server. Please verify your internet connection or contact concierge.'
        });
      }
    }

    verifyTransaction();

    return () => {
      isMounted = false;
    };
  }, [reference, refreshUser]);

  // Countdown timer for automatic forwarding on success
  useEffect(() => {
    if (status !== 'success' || !result?.redirectUrl) return;

    if (countdown <= 0) {
      navigate(result.redirectUrl);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [status, countdown, result, navigate]);

  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1.5rem',
      background: 'var(--parchment, #FAF6EF)'
    }}>
      <div style={{
        maxWidth: '560px',
        width: '100%',
        background: '#FFFDF9',
        border: '1px solid rgba(227, 211, 184, 0.8)',
        borderRadius: '12px',
        padding: '2.5rem 2rem',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
        textAlign: 'center'
      }}>
        {/* ── VERIFYING STATE ──────────────────────────────────────────────── */}
        {status === 'verifying' && (
          <div>
            <div style={{
              width: '54px',
              height: '54px',
              border: '3px solid rgba(200, 155, 74, 0.2)',
              borderTopColor: 'var(--rust, #B85F3C)',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              animation: 'spin 0.85s linear infinite'
            }} />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            <div style={{
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--rust, #B85F3C)',
              fontWeight: 600,
              marginBottom: '0.5rem'
            }}>
              Paystack Engine Sync
            </div>
            <h2 style={{
              fontFamily: 'var(--f-display, Georgia, serif)',
              fontSize: '1.85rem',
              color: 'var(--cocoa-deep, #2C221E)',
              margin: '0 0 0.75rem'
            }}>
              Confirming Payment…
            </h2>
            <p style={{ color: 'var(--taupe, #9B816F)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
              Please keep this window open while we securely verify your transaction with Paystack.
            </p>
            {reference && (
              <div style={{
                marginTop: '1.25rem',
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                color: 'var(--taupe, #9B816F)',
                background: 'rgba(244, 234, 224, 0.5)',
                padding: '4px 10px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                Ref: {reference}
              </div>
            )}
          </div>
        )}

        {/* ── SUCCESS STATE ────────────────────────────────────────────────── */}
        {status === 'success' && (
          <div>
            {/* Green Line Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(46, 107, 62, 0.1)',
              color: '#2E6B3E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>

            <div style={{
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#2E6B3E',
              fontWeight: 600,
              marginBottom: '0.4rem'
            }}>
              Payment Verified
            </div>

            <h2 style={{
              fontFamily: 'var(--f-display, Georgia, serif)',
              fontSize: '1.95rem',
              color: 'var(--cocoa-deep, #2C221E)',
              margin: '0 0 0.5rem'
            }}>
              {result?.title || 'Payment Successful'}
            </h2>

            <p style={{ color: 'var(--taupe, #9B816F)', fontSize: '0.95rem', lineHeight: 1.55, marginBottom: '1.5rem' }}>
              {result?.message || 'Your transaction has been confirmed and verified.'}
            </p>

            {/* Receipt Summary Card */}
            <div style={{
              background: '#FAF5EC',
              border: '1px solid #E8DEC8',
              borderRadius: '8px',
              padding: '1.25rem',
              textAlign: 'left',
              marginBottom: '1.5rem',
              fontSize: '0.88rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--taupe, #9B816F)' }}>Transaction Ref:</span>
                <span style={{ fontWeight: 600, color: 'var(--cocoa-deep, #2C221E)', fontFamily: 'monospace' }}>
                  {result?.reference || reference}
                </span>
              </div>

              {result?.amountNaira !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--taupe, #9B816F)' }}>Amount Paid:</span>
                  <span style={{ fontWeight: 700, color: '#2E6B3E', fontSize: '1.05rem' }}>
                    ₦{Number(result.amountNaira).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {result?.orderNumber && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--taupe, #9B816F)' }}>Order Number:</span>
                  <span style={{ fontWeight: 600, color: 'var(--cocoa-deep, #2C221E)' }}>
                    #{result.orderNumber}
                  </span>
                </div>
              )}

              {result?.packName && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--taupe, #9B816F)' }}>Credit Bundle:</span>
                  <span style={{ fontWeight: 600, color: 'var(--cocoa-deep, #2C221E)' }}>
                    {result.packName} (+{result.creditsGranted} credits)
                  </span>
                </div>
              )}

              {result?.className && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--taupe, #9B816F)' }}>Class Reserved:</span>
                  <span style={{ fontWeight: 600, color: 'var(--cocoa-deep, #2C221E)' }}>
                    {result.className}
                  </span>
                </div>
              )}

              {result?.eventType && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--taupe, #9B816F)' }}>Venue Booking:</span>
                  <span style={{ fontWeight: 600, color: 'var(--cocoa-deep, #2C221E)' }}>
                    {result.eventType}
                  </span>
                </div>
              )}
            </div>

            {/* Countdown Forwarding */}
            {result?.redirectUrl && (
              <p style={{ fontSize: '0.82rem', color: 'var(--taupe, #9B816F)', marginBottom: '1.25rem' }}>
                Forwarding to your receipt in <strong>{countdown}s</strong>…
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {result?.redirectUrl ? (
                <Link
                  to={result.redirectUrl}
                  className="btn btn-primary"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  View Details Now →
                </Link>
              ) : (
                <Link
                  to="/"
                  className="btn btn-primary"
                  style={{ textDecoration: 'none' }}
                >
                  Return to Home
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── FAILED / DECLINED STATE ─────────────────────────────────────── */}
        {(status === 'failed' || status === 'error') && (
          <div>
            {/* Red Line Alert Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(184, 95, 60, 0.1)',
              color: 'var(--rust, #B85F3C)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>

            <div style={{
              fontSize: '0.75rem',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--rust, #B85F3C)',
              fontWeight: 600,
              marginBottom: '0.4rem'
            }}>
              Transaction Incomplete
            </div>

            <h2 style={{
              fontFamily: 'var(--f-display, Georgia, serif)',
              fontSize: '1.85rem',
              color: 'var(--cocoa-deep, #2C221E)',
              margin: '0 0 0.75rem'
            }}>
              Payment Not Completed
            </h2>

            {/* Paystack Gateway Error Notice */}
            <div style={{
              background: '#FFF4F0',
              border: '1px solid rgba(184, 95, 60, 0.3)',
              borderRadius: '8px',
              padding: '1rem 1.25rem',
              color: '#8A3214',
              fontSize: '0.9rem',
              lineHeight: 1.55,
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <strong>Paystack Diagnostic:</strong>{' '}
              {result?.message || result?.gateway_response || 'The card issuer or bank declined the transaction.'}
            </div>

            {reference && (
              <p style={{ fontSize: '0.8rem', color: 'var(--taupe, #9B816F)', marginBottom: '1.5rem', fontFamily: 'monospace' }}>
                Reference ID: {reference}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.history.back()}
                className="btn btn-primary"
                style={{ cursor: 'pointer' }}
              >
                ← Try Again
              </button>
              <Link
                to="/cafe"
                className="btn btn-outline"
                style={{ textDecoration: 'none' }}
              >
                Return to Café
              </Link>
              <Link
                to="/movement"
                className="btn btn-outline"
                style={{ textDecoration: 'none' }}
              >
                Movement Schedule
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
