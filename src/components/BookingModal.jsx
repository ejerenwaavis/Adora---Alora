import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './BookingModal.module.css';
import WaiverModal from '../pages/account/WaiverModal';
import { IconShieldCheck, IconCheck } from './ui/LineIcons';

export default function BookingModal({ session, onClose }) {
  const { user, authFetch, refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showWaiver, setShowWaiver] = useState(false);

  useEffect(() => {
    if (user && (user.classCredits || 0) === 0) {
      loadPacks();
    }
  }, [user]);

  async function loadPacks() {
    try {
      const res = await fetch('/api/classes/credit-packs');
      if (res.ok) {
        const data = await res.json();
        // Sort packs: 1 credit first, then 5, then 10
        const sorted = data.sort((a, b) => (a.credits || 0) - (b.credits || 0));
        setPacks(sorted);
      }
    } catch (err) { console.error(err); }
  }

  async function handleBook() {
    const hasSigned = Boolean(user?.waiver?.signed || user?.waiverSigned || user?.waiverDate || user?.waiverSignedAt);
    if (!hasSigned) {
      setShowWaiver(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classSessionId: session._id, useCredit: true })
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.requiresWaiver) {
          setShowWaiver(true);
          throw new Error(data.error || 'Please complete and sign the liability waiver before reserving your spot.');
        }
        throw new Error(data.error || 'Failed to book class');
      }
      
      if (refreshUser) await refreshUser();
      setStep(3); // success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleWaiverCompleted = async (updatedUser) => {
    setShowWaiver(false);
    if (refreshUser) await refreshUser();
    // Proceed with booking after waiver is signed
    handleBook();
  };

  async function handlePurchasePack(packId) {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/bookings/purchase-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to purchase pack');
      
      if (refreshUser) await refreshUser();
      user.classCredits = data.newCredits;
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className="eyebrow centered" style={{ marginBottom: '0.5rem' }}>Class Details</div>
          <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>{session.classType?.name}</h2>
          
          <div className={styles.details} style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <p style={{ fontWeight: 500, color: 'var(--cocoa-deep)' }}>
              {new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} at {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
            <p>Instructor: {session.instructor?.firstName} {session.instructor?.lastName}</p>
          </div>

          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Sign in to book</h3>
            <p className={styles.subtext} style={{ textAlign: 'center' }}>You must be signed in to your member account to book a class or join the waitlist.</p>
            <div className={styles.actions} style={{ justifyContent: 'center' }}>
              <Link to="/login" className="btn btn-primary" onClick={onClose}>Sign In</Link>
              <button onClick={onClose} className="btn btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          {step === 1 && (
            <>
              <div className="eyebrow" style={{ marginBottom: '0.5rem' }}>Class Reservation</div>
              <h2>Confirm Booking</h2>
              <div className={styles.details}>
                <h3>{session.classType?.name}</h3>
                <p>{new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} at {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <p>Instructor: {session.instructor?.firstName} {session.instructor?.lastName}</p>
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.creditsBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Available Studio Credits:</span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--rust)' }}>{user.classCredits || 0} Pass{(user.classCredits || 0) === 1 ? '' : 'es'}</strong>
                </div>
              </div>

              {!user.waiverSigned && !user.waiverDate && (
                <div style={{
                  background: 'rgba(200, 155, 74, 0.1)',
                  border: '1px solid rgba(200, 155, 74, 0.3)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--cocoa-deep)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <IconShieldCheck size={16} color="var(--gold, #C89B4A)" />
                  <span>Digital Liability Waiver required before first booking.</span>
                </div>
              )}

              <div className={styles.actions}>
                {(user.classCredits || 0) > 0 ? (
                  <button onClick={handleBook} disabled={loading} className="btn btn-primary">
                    {loading ? 'Processing...' : (session.bookedCount >= session.maxCapacity ? 'Join Waitlist (1 Credit)' : 'Book Class (1 Credit)')}
                  </button>
                ) : (
                  <button onClick={() => { setStep(2); loadPacks(); }} className="btn btn-primary">
                    Get Studio Credits
                  </button>
                )}
                <button onClick={onClose} className="btn btn-outline">Cancel</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="eyebrow" style={{ marginBottom: '0.35rem' }}>Movement Studio Passes</div>
              <h2>Select Credit Pack</h2>
              <p className={styles.subtext} style={{ marginBottom: '1.25rem' }}>
                Purchase credits to reserve classes across reformer pilates, yoga, and breathwork.
              </p>
              {error && <div className={styles.error}>{error}</div>}
              
              <div className={styles.packList}>
                {packs.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--taupe)' }}>Loading studio passes...</p>
                ) : packs.map(pack => {
                  const priceNaira = Math.round((pack.priceKobo || 0) / 100);
                  const perClassNaira = Math.round(priceNaira / (pack.credits || 1));
                  const isFeatured = pack.badge || pack.credits === 5;
                  const badgeText = pack.badge || (pack.credits === 5 ? 'Most Popular' : pack.credits === 10 ? 'Best Value' : '');

                  return (
                    <div 
                      key={pack._id} 
                      className={`${styles.packCard} ${isFeatured ? styles.packCardFeatured : ''}`}
                    >
                      {badgeText && <span className={styles.badge}>{badgeText}</span>}
                      <div>
                        <h4 className={styles.packTitle}>{pack.name}</h4>
                        <div className={styles.packPrice}>
                          ₦{priceNaira.toLocaleString()}
                        </div>
                        <div className={styles.packSubtitle}>
                          {pack.credits > 1 ? `₦${perClassNaira.toLocaleString()} / class · ` : ''}Valid {pack.expiresInDays || 30} days
                        </div>
                      </div>
                      <button 
                        onClick={() => handlePurchasePack(pack._id)} 
                        disabled={loading} 
                        className="btn btn-primary"
                        style={{ padding: '0.7rem 1.1rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      >
                        {loading ? 'Processing...' : 'Select Tier'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className={styles.actions} style={{ marginTop: '1.5rem' }}>
                <button onClick={() => setStep(1)} className="btn btn-outline">Back to Session</button>
              </div>
            </>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(46, 107, 62, 0.1)',
                border: '1px solid rgba(46, 107, 62, 0.3)',
                color: 'var(--forest, #2E6B3E)',
                marginBottom: '1rem'
              }}>
                <IconCheck size={22} color="var(--forest, #2E6B3E)" />
              </div>
              <div className="eyebrow centered" style={{ marginBottom: '0.5rem' }}>Confirmed</div>
              <h2>Booking Confirmed!</h2>
              <p className={styles.subtext}>
                You are {session.bookedCount >= session.maxCapacity ? 'on the waitlist for' : 'booked into'} <strong>{session.classType?.name}</strong>.
              </p>
              <div className={styles.actions} style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link to="/account" className="btn btn-primary" onClick={onClose} style={{ textAlign: 'center' }}>
                  View Digital Pass in Account →
                </Link>
                <button onClick={onClose} className="btn btn-outline">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Waiver Modal Prompt */}
      {showWaiver && (
        <WaiverModal
          isOpen={showWaiver}
          onClose={() => setShowWaiver(false)}
          onWaiverSigned={handleWaiverCompleted}
        />
      )}
    </>
  );
}
