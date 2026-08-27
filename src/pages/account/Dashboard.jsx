import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import WaiverModal from './WaiverModal';
import QRPassModal from './QRPassModal';
import {
  IconCalendar,
  IconClock,
  IconPin,
  IconQr,
  IconTicket,
  IconShieldCheck,
  IconAlert,
  IconPen,
  IconCheck,
  IconX,
  IconArrowRight
} from '../../components/ui/LineIcons';
import styles from './AccountLayout.module.css';

function WaitlistClaimCard({ booking, onClaim, onDecline, claimingId, decliningId }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    function calculateTime() {
      const expiresAt = new Date(booking.promotionExpiresAt || Date.now() + 5 * 60000).getTime();
      const diff = expiresAt - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00');
        setIsExpired(true);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }
    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [booking.promotionExpiresAt]);

  const classSession = booking.classSession;
  const className = classSession?.classType?.name || 'Movement Studio Class';
  const startTime = classSession?.startTime ? new Date(classSession.startTime) : new Date();

  return (
    <div style={{
      background: '#FFFDF9',
      border: '2px solid #C89B4A',
      borderRadius: '8px',
      padding: '1.4rem 1.6rem',
      marginBottom: '2rem',
      boxShadow: '0 4px 20px rgba(200, 155, 74, 0.15)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1.25rem'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ background: '#C89B4A', color: '#FFF', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Spot Open (Waitlist Priority)
          </span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: isExpired ? '#8B2020' : '#A4451F' }}>
            â±ï¸ {isExpired ? 'Claim window expired' : `${timeLeft} remaining to claim`}
          </span>
        </div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', margin: '0.2rem 0', color: 'var(--cocoa-deep)' }}>
          {className}
        </h3>
        <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--taupe)' }}>
          {startTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Â· {classSession?.instructor?.firstName} {classSession?.instructor?.lastName}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => onClaim(booking._id)}
          disabled={claimingId === booking._id || isExpired}
          className="btn btn-primary"
          style={{ background: '#A4451F', padding: '10px 20px', fontSize: '0.85rem' }}
        >
          {claimingId === booking._id ? 'Claiming...' : 'Claim Spot (1 Credit)'}
        </button>
        <button
          onClick={() => onDecline(booking._id)}
          disabled={decliningId === booking._id}
          className="btn btn-outline"
          style={{ padding: '10px 16px', fontSize: '0.85rem' }}
        >
          {decliningId === booking._id ? 'Passing...' : 'Pass to Next'}
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, authFetch, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'bookings' | 'passes' | 'waiver'
  const [bookingFilter, setBookingFilter] = useState('all'); // 'all' | 'classes' | 'events' | 'orders' | 'past'
  const [loading, setLoading] = useState(true);
  
  const [dashboardData, setDashboardData] = useState({
    classCredits: user?.classCredits || 0,
    waiverSigned: Boolean(user?.waiverSigned || user?.waiverSignedAt),
    waiverDate: user?.waiverDate || user?.waiverSignedAt,
    upcomingClasses: [],
    pastClasses: [],
    upcomingEvents: [],
    pastEvents: [],
    cafeOrders: [],
    fashionOrders: []
  });

  const [selectedPass, setSelectedPass] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isWaiverModalOpen, setIsWaiverModalOpen] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportForm, setSupportForm] = useState({ subject: '', type: 'General Message', message: '' });
  const [claimingId, setClaimingId] = useState(null);
  const [decliningId, setDecliningId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [enquiryMessage, setEnquiryMessage] = useState({});

  useEffect(() => {
    loadUserBookings();
  }, []);

  async function loadUserBookings() {
    setLoading(true);
    try {
      const [bookingsRes, enquiriesRes] = await Promise.all([
        authFetch('/api/user/bookings'),
        authFetch('/api/support/my-tickets')
      ]);
      
      let finalData = {};
      
      if (bookingsRes.ok) {
        finalData = await bookingsRes.json();
      }
      
      if (enquiriesRes.ok) {
        const supportData = await enquiriesRes.json();
        finalData.supportTickets = supportData || [];
      }
      
      setDashboardData(prev => ({ ...prev, ...finalData }));
    } catch (err) {
      console.error('Failed to load user bookings & enquiries:', err);
    } finally {
      setLoading(false);
    }
  }
  
    const handleSendSupportMessage = async (ticketId, isVenue) => {
      const text = enquiryMessage[ticketId];
      if (!text || !text.trim()) return;
      try {
        const url = isVenue ? `/api/venue/enquiries/${ticketId}/message` : `/api/support/${ticketId}/message`;
        const res = await authFetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
        if (res.ok) {
          const data = await res.json();
          const updatedDoc = isVenue ? data.enquiry : data.ticket;
          setDashboardData(prev => ({
            ...prev,
            supportTickets: prev.supportTickets.map(eq => eq._id === ticketId ? { ...eq, messages: updatedDoc.messages } : eq)
          }));
          setEnquiryMessage(prev => ({ ...prev, [ticketId]: '' }));
        }
      } catch (err) {
        console.error(err);
      }
    };



  const handleOpenQR = (pass, type = 'class') => {
    setSelectedPass({ ...pass, type });
    setIsQRModalOpen(true);
  };

  const handleClaimWaitlist = async (bookingId) => {
    setClaimingId(bookingId);
    try {
      const res = await authFetch(`/api/bookings/${bookingId}/claim-waitlist`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ text: 'Spot claimed! Your class is confirmed and pass is active.', isError: false });
        if (refreshUser) await refreshUser();
        await loadUserBookings();
      } else {
        setActionMessage({ text: data.error || 'Failed to claim spot.', isError: true });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ text: 'Error connecting to booking service.', isError: true });
    } finally {
      setClaimingId(null);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleDeclineWaitlist = async (bookingId) => {
    if (!window.confirm('Pass this spot to the next member on the waitlist?')) return;
    setDecliningId(bookingId);
    try {
      const res = await authFetch(`/api/bookings/${bookingId}/decline-waitlist`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ text: 'Spot passed to next member in line.', isError: false });
        await loadUserBookings();
      } else {
        setActionMessage({ text: data.error || 'Failed to pass spot.', isError: true });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ text: 'Error connecting to booking service.', isError: true });
    } finally {
      setDecliningId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleCancelClassBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this class booking? Classes cancelled within 6 hours of start time may not be eligible for a credit refund.')) {
      return;
    }

    setCancellingId(bookingId);
    try {
      const res = await authFetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage({ text: 'Booking cancelled successfully. Credit balance updated.', isError: false });
        if (refreshUser) await refreshUser();
        await loadUserBookings();
      } else {
        setActionMessage({ text: data.error || 'Failed to cancel booking.', isError: true });
      }
    } catch (err) {
      console.error(err);
      setActionMessage({ text: 'Error connecting to booking service.', isError: true });
    } finally {
      setCancellingId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleWaiverSigned = async () => {
    setActionMessage({ text: 'Health & liability waiver signed successfully! Movement studio booking unlocked.', isError: false });
    setTimeout(() => setActionMessage(null), 4000);
    await loadUserBookings();
  };

  // Determine next upcoming pass
  const nextClass = dashboardData.upcomingClasses?.[0];
  const nextEvent = dashboardData.upcomingEvents?.[0];
  let nextPass = null;
  let nextPassType = 'class';

  if (nextClass && nextEvent) {
    const classTime = new Date(nextClass.classSession?.startTime).getTime();
    const eventTime = new Date(nextEvent.event?.startDate).getTime();
    if (classTime <= eventTime) {
      nextPass = nextClass;
      nextPassType = 'class';
    } else {
      nextPass = nextEvent;
      nextPassType = 'event';
    }
  } else if (nextClass) {
    nextPass = nextClass;
    nextPassType = 'class';
  } else if (nextEvent) {
    nextPass = nextEvent;
    nextPassType = 'event';
  }

  const isWaiverSigned = dashboardData.waiverSigned || user?.waiverSigned || Boolean(user?.waiverSignedAt);

  return (
    <div>
      {/* Toast Notification */}
      {actionMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: actionMessage.isError ? '#8B2020' : '#2B2015',
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
          {actionMessage.isError ? <IconX size={16} color="#FFF" /> : <IconCheck size={16} color="#FFF" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2.25rem' }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--rust)', letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
            Member Access Portal
          </div>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>
            {user?.firstName} {user?.lastName}
          </h1>
          <p style={{ color: 'var(--taupe)', marginTop: '0.4rem', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Welcome to your member portal. Manage studio credits, upcoming passes, digital check-in QR codes, and liability records.
          </p>
        </div>

        <div>
          <button 
            onClick={() => {
              if (!isWaiverSigned) {
                setIsWaiverModalOpen(true);
              } else {
                navigate('/movement');
              }
            }} 
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            Book Studio Class <IconArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Promoted Waitlist Priority Claim Cards */}
      {dashboardData.upcomingClasses?.filter(b => b.status === 'promoted').map(booking => (
        <WaitlistClaimCard
          key={booking._id}
          booking={booking}
          onClaim={handleClaimWaitlist}
          onDecline={handleDeclineWaitlist}
          claimingId={claimingId}
          decliningId={decliningId}
        />
      ))}

      {/* Waiver Warning Alert Banner (If unsigned) */}
      {!isWaiverSigned && (
        <div style={{
          background: '#FFFDF9',
          border: '1px solid rgba(164, 69, 31, 0.35)',
          borderLeft: '4px solid var(--rust, #A4451F)',
          borderRadius: '8px',
          padding: '1.25rem 1.5rem',
          marginBottom: '2.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 2px 12px rgba(164, 69, 31, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{ color: 'var(--rust, #A4451F)', marginTop: '2px' }}>
              <IconAlert size={20} color="var(--rust, #A4451F)" />
            </div>
            <div>
              <strong style={{ color: 'var(--rust, #A4451F)', fontSize: '0.95rem', display: 'block', marginBottom: '2px' }}>
                Liability &amp; Health Waiver Required
              </strong>
              <span style={{ fontSize: '0.85rem', color: 'var(--cocoa-deep, #2B2015)', lineHeight: 1.4 }}>
                Please complete the digital health declaration before attending your next Movement session.
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsWaiverModalOpen(true)}
            style={{
              background: 'var(--rust, #A4451F)',
              color: '#FFFFFF',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '4px',
              fontSize: '0.78rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <IconPen size={13} color="#FFF" /> Sign Waiver
          </button>
        </div>
      )}

      {/* Top Performance & Credits Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {/* Studio Credits */}
        <div className={styles.card} style={{ margin: 0, padding: '1.5rem', borderLeft: '4px solid var(--gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--taupe)', fontWeight: 600 }}>Studio Credits</div>
            <Link to="/movement" style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>+ Top Up</Link>
          </div>
          <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', color: 'var(--cocoa-deep)', fontWeight: 400, margin: '0.35rem 0' }}>
            {user?.classCredits || dashboardData.classCredits || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--forest)' }}>
            Available for all studio sessions
          </div>
        </div>

        {/* Membership Tier */}
        <div className={styles.card} style={{ margin: 0, padding: '1.5rem', borderLeft: '4px solid var(--forest)' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--taupe)', fontWeight: 600 }}>Membership Tier</div>
          <div style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'var(--cocoa-deep)', fontWeight: 400, margin: '0.5rem 0', textTransform: 'capitalize' }}>
            {user?.membershipStatus && user.membershipStatus !== 'none' ? user.membershipStatus : 'House Member'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>
            Access to Café, Loft &amp; Boutique
          </div>
        </div>

        {/* Active Passes */}
        <div className={styles.card} style={{ margin: 0, padding: '1.5rem', borderLeft: '4px solid var(--rust)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--taupe)', fontWeight: 600 }}>Upcoming Passes</div>
            <span style={{ fontSize: '0.72rem', color: 'var(--rust)', fontWeight: 600, textTransform: 'uppercase' }}>Active</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', color: 'var(--cocoa-deep)', fontWeight: 400, margin: '0.35rem 0' }}>
            {(dashboardData.upcomingClasses?.length || 0) + (dashboardData.upcomingEvents?.length || 0)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>
            Scheduled classes &amp; event tickets
          </div>
        </div>

        {/* Waiver Status */}
        <div className={styles.card} style={{ margin: 0, padding: '1.5rem', borderLeft: isWaiverSigned ? '4px solid #2E6B3E' : '4px solid #A4451F' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--taupe)', fontWeight: 600 }}>Studio Waiver</div>
          <div style={{ fontSize: '1.15rem', fontFamily: 'var(--font-heading)', color: isWaiverSigned ? '#2E6B3E' : '#A4451F', fontWeight: 500, margin: '0.65rem 0 0.35rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isWaiverSigned ? <IconShieldCheck size={18} color="#2E6B3E" /> : <IconAlert size={18} color="#A4451F" />}
            <span>{isWaiverSigned ? 'Verified & Signed' : 'Unsigned'}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>
            {isWaiverSigned ? (
              <span onClick={() => setIsWaiverModalOpen(true)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                Review details
              </span>
            ) : (
              <span onClick={() => setIsWaiverModalOpen(true)} style={{ color: 'var(--rust)', cursor: 'pointer', fontWeight: 600 }}>
                Sign to unlock classes â†’
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className={styles.tabBar}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'bookings', label: `My Bookings (${(dashboardData.upcomingClasses?.length || 0) + (dashboardData.upcomingEvents?.length || 0)})` },
          { id: 'passes', label: 'Digital QR Passes' },
          { id: 'waiver', label: 'Waiver & Health' },
            { id: 'support', label: 'Concierge Support' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* â”€â”€â”€ TAB 1: OVERVIEW â”€â”€â”€ */}
      {activeTab === 'overview' && (
        <div>
          {/* Next Up Hero Card */}
          {nextPass ? (
            <div style={{
              background: '#FFFDF9',
              border: '1px solid rgba(227, 211, 184, 0.9)',
              borderRadius: '8px',
              padding: '2rem',
              marginBottom: '2.5rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem'
            }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(200, 155, 74, 0.12)', color: 'var(--rust)', padding: '0.25rem 0.65rem', borderRadius: '4px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600, marginBottom: '0.65rem' }}>
                  {nextPassType === 'event' ? <IconTicket size={12} color="var(--rust)" /> : <IconQr size={12} color="var(--rust)" />}
                  <span>Next Upcoming Pass Â· {nextPassType === 'event' ? 'Loft Event' : 'Movement Studio'}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', color: 'var(--cocoa-deep)', margin: '0 0 0.5rem', fontWeight: 400 }}>
                  {nextPassType === 'event' ? nextPass.event?.title : nextPass.classSession?.classType?.name}
                </h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--taupe)', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <IconCalendar size={14} color="var(--taupe)" />
                    {new Date(nextPassType === 'event' ? nextPass.event?.startDate : nextPass.classSession?.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <IconClock size={14} color="var(--taupe)" />
                    {new Date(nextPassType === 'event' ? nextPass.event?.startDate : nextPass.classSession?.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <IconPin size={14} color="var(--taupe)" />
                    {nextPassType === 'event' ? (nextPass.event?.space || 'The Loft') : (nextPass.classSession?.classType?.room || 'Movement Studio')}
                  </span>
                </div>
              </div>

              <div>
                <button
                  onClick={() => handleOpenQR(nextPass, nextPassType)}
                  style={{
                    background: 'var(--cocoa-deep, #2B2015)',
                    color: '#F7EFE1',
                    border: 'none',
                    padding: '11px 22px',
                    borderRadius: '4px',
                    fontSize: '0.82rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <IconQr size={15} color="#F7EFE1" /> View Digital Pass
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState} style={{ marginBottom: '2.5rem' }}>
              <h3>No Active Passes</h3>
              <p>You have no upcoming studio classes or events scheduled.</p>
              <div className={styles.actionGroup}>
                <button onClick={() => navigate('/movement')} className="btn btn-primary">
                  Browse Movement Classes
                </button>
                <button onClick={() => navigate('/events')} className="btn btn-outline">
                  Explore Events
                </button>
              </div>
            </div>
          )}

          {/* Quick Service Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className={styles.card} style={{ margin: 0 }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--cocoa-deep)', margin: '0 0 0.5rem', fontWeight: 400 }}>
                Movement Studio
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--taupe)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Reserve reformers, breathwork, and sound therapy sessions with resident instructors.
              </p>
              <button onClick={() => navigate('/movement')} style={{ background: 'none', border: 'none', color: 'var(--rust)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Explore Timetable <IconArrowRight size={14} />
              </button>
            </div>

            <div className={styles.card} style={{ margin: 0 }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--cocoa-deep)', margin: '0 0 0.5rem', fontWeight: 400 }}>
                Café &amp; Boutique
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--taupe)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                Browse daily seasonal kitchen menus, organic matcha, and curated fashion collection.
              </p>
              <button onClick={() => navigate('/cafe')} style={{ background: 'none', border: 'none', color: 'var(--rust)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                View Café Menu <IconArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€â”€ TAB 2: MY BOOKINGS & PASSES â”€â”€â”€ */}
      {activeTab === 'bookings' && (
        <div>
          {/* Subfilter Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'classes', label: `Classes (${dashboardData.upcomingClasses?.length || 0})` },
              { id: 'events', label: `Events (${dashboardData.upcomingEvents?.length || 0})` },
              { id: 'orders', label: `Orders (${(dashboardData.cafeOrders?.length || 0) + (dashboardData.fashionOrders?.length || 0)})` },
              { id: 'past', label: 'Past & History' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setBookingFilter(f.id)}
                style={{
                    background: bookingFilter === f.id ? 'var(--black)' : 'transparent',
                    color: bookingFilter === f.id ? 'var(--white)' : 'var(--cocoa-deep)',
                    border: bookingFilter === f.id ? '1px solid var(--black)' : '1px solid var(--line)',
                    padding: '8px 20px',
                    borderRadius: '0px',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Classes Section */}
          {(bookingFilter === 'all' || bookingFilter === 'classes') && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--cocoa-deep)', marginBottom: '1.25rem', fontWeight: 400 }}>
                Upcoming Movement Classes
              </h3>
              {dashboardData.upcomingClasses?.length === 0 ? (
                <div style={{ padding: '2rem', background: '#FFFDF9', border: '1px dashed rgba(227, 211, 184, 0.85)', borderRadius: '6px', textAlign: 'center', color: 'var(--taupe)', fontSize: '0.9rem' }}>
                  No upcoming movement classes booked.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {dashboardData.upcomingClasses.map(booking => {
                    const session = booking.classSession;
                    return (
                      <div key={booking._id} style={{
                        background: '#FFFDF9',
                        border: '1px solid rgba(227, 211, 184, 0.8)',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1.25rem'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '1.15rem', color: 'var(--cocoa-deep)', fontWeight: 500 }}>
                              {session?.classType?.name || 'Movement Session'}
                            </strong>
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: booking.status === 'confirmed' ? 'rgba(46, 107, 62, 0.1)' : 'rgba(200, 155, 74, 0.15)',
                              color: booking.status === 'confirmed' ? '#2E6B3E' : 'var(--rust)',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em'
                            }}>
                              {booking.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.88rem', color: 'var(--taupe)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <IconCalendar size={13} color="var(--taupe)" />
                              {new Date(session?.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(session?.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {session?.instructor && <span>Â· Instructor: {session.instructor.firstName} {session.instructor.lastName}</span>}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--forest)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <IconPin size={13} color="var(--forest)" />
                            <span>{session?.classType?.room || 'Movement Studio Level 2'} Â· Duration: {session?.classType?.durationMinutes || 50} mins</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleOpenQR(booking, 'class')}
                            style={{
                              background: 'var(--cocoa-deep)',
                              color: '#F7EFE1',
                              border: 'none',
                              padding: '9px 16px',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <IconQr size={14} color="#F7EFE1" /> Digital Pass
                          </button>
                          <button
                            disabled={cancellingId === booking._id}
                            onClick={() => handleCancelClassBooking(booking._id)}
                            style={{
                              background: 'none',
                              border: '1px solid rgba(164, 69, 31, 0.5)',
                              color: 'var(--rust)',
                              padding: '9px 14px',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              cursor: cancellingId === booking._id ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {cancellingId === booking._id ? 'Cancelling...' : 'Cancel'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Events Section */}
          {(bookingFilter === 'all' || bookingFilter === 'events') && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--cocoa-deep)', marginBottom: '1.25rem', fontWeight: 400 }}>
                Loft &amp; House Event Passes
              </h3>
              {dashboardData.upcomingEvents?.length === 0 ? (
                <div style={{ padding: '2rem', background: '#FFFDF9', border: '1px dashed rgba(227, 211, 184, 0.85)', borderRadius: '6px', textAlign: 'center', color: 'var(--taupe)', fontSize: '0.9rem' }}>
                  No upcoming event tickets purchased.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {dashboardData.upcomingEvents.map(eventBooking => {
                    const evt = eventBooking.event;
                    return (
                      <div key={eventBooking._id} style={{
                        background: '#FFFDF9',
                        border: '1px solid rgba(227, 211, 184, 0.8)',
                        borderRadius: '8px',
                        padding: '1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1.25rem'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '1.15rem', color: 'var(--cocoa-deep)', fontWeight: 500 }}>
                              {evt?.title || 'Loft House Event'}
                            </strong>
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'rgba(200, 155, 74, 0.15)',
                              color: 'var(--rust)',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em'
                            }}>
                              Ref: {eventBooking.ticketReference || `#TBN-${eventBooking._id.slice(-6).toUpperCase()}`}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.88rem', color: 'var(--taupe)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <IconCalendar size={13} color="var(--taupe)" />
                            <span>{evt?.startDate ? new Date(evt.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Scheduled'} {evt?.time ? `Â· ${evt.time}` : ''}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--rust)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <IconPin size={13} color="var(--rust)" />
                            <span>{evt?.space || 'The Loft'} Â· Tickets: {eventBooking.quantity || 1}</span>
                          </div>
                        </div>

                        <div>
                          <button
                            onClick={() => handleOpenQR(eventBooking, 'event')}
                            style={{
                              background: 'var(--cocoa-deep)',
                              color: '#F7EFE1',
                              border: 'none',
                              padding: '9px 16px',
                              borderRadius: '4px',
                              fontSize: '0.78rem',
                              textTransform: 'uppercase',
                              letterSpacing: '0.08em',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <IconTicket size={14} color="#F7EFE1" /> Digital Ticket
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Orders Section */}
          {(bookingFilter === 'all' || bookingFilter === 'orders') && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--cocoa-deep)', marginBottom: '1.25rem', fontWeight: 400 }}>
                Café &amp; Fashion Receipts
              </h3>
              {(dashboardData.cafeOrders?.length === 0 && dashboardData.fashionOrders?.length === 0) ? (
                <div style={{ padding: '2rem', background: '#FFFDF9', border: '1px dashed rgba(227, 211, 184, 0.85)', borderRadius: '6px', textAlign: 'center', color: 'var(--taupe)', fontSize: '0.9rem' }}>
                  No order history recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {dashboardData.cafeOrders?.map(order => (
                    <div key={order._id} style={{ background: '#FFFDF9', border: '1px solid rgba(227, 211, 184, 0.7)', borderRadius: '6px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <strong style={{ color: 'var(--cocoa-deep)' }}>Café Order #{order.orderNumber}</strong>
                        <div style={{ fontSize: '0.82rem', color: 'var(--taupe)', marginTop: '2px' }}>
                          {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: 'var(--cocoa-deep)' }}>â‚¦{((order.totalAmountKobo || 0) / 100).toLocaleString()}</div>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--forest)', fontWeight: 600 }}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                  {dashboardData.fashionOrders?.map(order => (
                    <div key={order._id} style={{ background: '#FFFDF9', border: '1px solid rgba(227, 211, 184, 0.7)', borderRadius: '6px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <strong style={{ color: 'var(--cocoa-deep)' }}>Boutique Item: {order.itemName}</strong>
                        <div style={{ fontSize: '0.82rem', color: 'var(--taupe)', marginTop: '2px' }}>
                          Size: {order.selectedSize || 'One Size'} Â· {order.orderNumber}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600, color: 'var(--cocoa-deep)' }}>â‚¦{((order.priceKobo || 0) / 100).toLocaleString()}</div>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--rust)', fontWeight: 600 }}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          
            {/* Past History */}
          {(bookingFilter === 'all' || bookingFilter === 'past') && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--cocoa-deep)', marginBottom: '1.25rem', fontWeight: 400 }}>
                Past Attendance &amp; Expired Bookings
              </h3>
              {(dashboardData.pastClasses?.length === 0 && dashboardData.pastEvents?.length === 0) ? (
                <div style={{ padding: '2rem', background: '#FAF6EF', borderRadius: '6px', textAlign: 'center', color: 'var(--taupe)', fontSize: '0.9rem' }}>
                  No past bookings recorded.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: 0.8 }}>
                  {dashboardData.pastClasses?.slice(0, 10).map(b => (
                    <div key={b._id} style={{ background: '#FAF6EF', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: '6px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{b.classSession?.classType?.name || 'Class Session'}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>
                          {new Date(b.classSession?.startTime || b.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--taupe)' }}>{b.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* â”€â”€â”€ TAB 3: DIGITAL QR PASSES GALLERY â”€â”€â”€ */}
      {activeTab === 'passes' && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--cocoa-deep)', marginBottom: '0.4rem', fontWeight: 400 }}>
            Active Door &amp; Check-in Passes
          </h3>
          <p style={{ color: 'var(--taupe)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Select any active pass below to enlarge the QR code for instant front-desk clerk scanning upon arrival.
          </p>

          {((dashboardData.upcomingClasses?.length || 0) + (dashboardData.upcomingEvents?.length || 0)) === 0 ? (
            <div className={styles.emptyState}>
              <p>You have no active passes to scan.</p>
              <button onClick={() => navigate('/movement')} className="btn btn-primary">
                Book Movement Session
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {/* Classes */}
              {dashboardData.upcomingClasses?.map(c => (
                <div
                  key={c._id}
                  onClick={() => handleOpenQR(c, 'class')}
                  style={{
                    background: '#FFFDF9',
                    border: '1px solid rgba(227, 211, 184, 0.9)',
                    borderTop: '4px solid var(--forest)',
                    borderRadius: '8px',
                    padding: '1.75rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--forest)', fontWeight: 600, letterSpacing: '0.1em' }}>
                    Movement Studio Pass
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--cocoa-deep)', margin: '0.5rem 0', fontWeight: 400 }}>
                    {c.classSession?.classType?.name}
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--taupe)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <IconCalendar size={13} color="var(--taupe)" />
                    <span>{new Date(c.classSession?.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(c.classSession?.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(227, 211, 184, 0.6)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--taupe)', letterSpacing: '0.06em' }}>Ref: #{c._id.slice(-6).toUpperCase()}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--forest)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <IconQr size={13} color="var(--forest)" /> Open Pass
                    </span>
                  </div>
                </div>
              ))}

              {/* Events */}
              {dashboardData.upcomingEvents?.map(e => (
                <div
                  key={e._id}
                  onClick={() => handleOpenQR(e, 'event')}
                  style={{
                    background: '#FFFDF9',
                    border: '1px solid rgba(227, 211, 184, 0.9)',
                    borderTop: '4px solid var(--rust)',
                    borderRadius: '8px',
                    padding: '1.75rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--rust)', fontWeight: 600, letterSpacing: '0.1em' }}>
                    Loft Event Pass
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--cocoa-deep)', margin: '0.5rem 0', fontWeight: 400 }}>
                    {e.event?.title}
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--taupe)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <IconCalendar size={13} color="var(--taupe)" />
                    <span>{e.event?.startDate ? new Date(e.event.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Scheduled'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(227, 211, 184, 0.6)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--taupe)', letterSpacing: '0.06em' }}>Ref: {e.ticketReference || `#TBN-${e._id.slice(-6).toUpperCase()}`}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--rust)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <IconTicket size={13} color="var(--rust)" /> Open Ticket
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* â”€â”€â”€ TAB 4: WAIVER & HEALTH â”€â”€â”€ */}
      {activeTab === 'waiver' && (
          <div style={{ width: '100%' }}>
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', color: 'var(--cocoa-deep)', margin: 0, fontWeight: 400 }}>
                  Studio Health &amp; Liability Waiver
                </h3>
                <p style={{ color: 'var(--taupe)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
                  Aora House Movement Studio Participation &amp; Liability Release Agreement
                </p>
              </div>
              <span style={{
                background: isWaiverSigned ? 'rgba(46, 107, 62, 0.1)' : 'rgba(164, 69, 31, 0.1)',
                color: isWaiverSigned ? '#2E6B3E' : '#A4451F',
                padding: '5px 14px',
                borderRadius: 'var(--radius-sm, 2px)',
                fontSize: '0.78rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                {isWaiverSigned ? <IconShieldCheck size={14} color="#2E6B3E" /> : <IconAlert size={14} color="#A4451F" />}
                <span>{isWaiverSigned ? 'Active & Signed' : 'Pending Signature'}</span>
              </span>
            </div>

            {isWaiverSigned ? (
              <div>
                <div style={{ background: '#FAF6EF', padding: '1.25rem', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.8)', marginBottom: '1.75rem', fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--cocoa-deep)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--taupe)' }}>Signature on Record:</span>
                    <strong style={{ fontStyle: 'italic', fontFamily: "'Fraunces', serif" }}>{user?.waiverSignature || `${user?.firstName} ${user?.lastName}`}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--taupe)' }}>Signed Date:</span>
                    <span>{dashboardData.waiverDate ? new Date(dashboardData.waiverDate).toLocaleString() : 'On file'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--taupe)' }}>Agreement Version:</span>
                    <span>{user?.waiverVersion || 'v1.0 (Movement Studio Policy)'}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '1.75rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--cocoa-deep)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600 }}>
                    Emergency Contact Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
                    <div>
                      <span style={{ color: 'var(--taupe)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Contact Name</span>
                      <strong>{user?.emergencyContactName || 'Not specified'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--taupe)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Phone Number</span>
                      <strong>{user?.emergencyContactPhone || 'Not specified'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--taupe)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Relationship</span>
                      <strong>{user?.emergencyContactRelation || 'Not specified'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--taupe)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>Medical Considerations</span>
                      <span>{user?.medicalNotes || 'None noted'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsWaiverModalOpen(true)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(227, 211, 184, 0.9)',
                    padding: '9px 18px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <IconPen size={13} /> Update Waiver &amp; Contact Info
                </button>
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--cocoa-deep)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
                  You have not yet completed the Aora House Movement Studio liability waiver. Signing this agreement takes less than a minute and will immediately enable you to reserve spots in all movement sessions.
                </p>
                <button
                  onClick={() => setIsWaiverModalOpen(true)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <IconPen size={14} color="#FFF" /> Complete &amp; Sign Waiver
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      
      {/* 🔹🔹🔹 TAB 5: SUPPORT TICKETS 🔹🔹🔹 */}
      {activeTab === 'support' && (
        <div style={{ width: "100%" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.45rem', color: 'var(--cocoa-deep)', margin: 0, fontWeight: 400 }}>
                Concierge Support
              </h3>
              <p style={{ color: 'var(--taupe)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                Manage your messages, venue enquiries, and booking support tickets.
              </p>
            </div>
            <button
                onClick={() => setIsSupportModalOpen(true)}
                className="btn btn-primary"
              >
                New Message
              </button>
          </div>

          {!dashboardData.supportTickets || dashboardData.supportTickets.length === 0 ? (
            <div style={{ padding: '3rem', background: '#FFFDF9', border: '1px dashed rgba(227, 211, 184, 0.85)', borderRadius: '6px', textAlign: 'center', color: 'var(--taupe)', fontSize: '0.9rem' }}>
              You have no active support tickets or venue enquiries.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {dashboardData.supportTickets.map(ticket => (
                <div key={ticket._id} style={{ background: '#FFFDF9', border: '1px solid rgba(227, 211, 184, 0.8)', borderRadius: '8px', padding: '1.5rem', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <strong style={{ color: 'var(--cocoa-deep)', fontSize: '1.1rem' }}>{ticket.subject}</strong>
                      <div style={{ fontSize: '0.85rem', color: 'var(--taupe)' }}>
                        {ticket.type} &bull; Updated {new Date(ticket.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      background: ticket.status === 'resolved' || ticket.status === 'closed' ? '#E8F3EB' : 'rgba(164, 69, 31, 0.1)', 
                      color: ticket.status === 'resolved' || ticket.status === 'closed' ? '#2E6B3E' : 'var(--rust)', 
                      padding: '4px 10px', 
                      borderRadius: '12px', 
                      textTransform: 'uppercase', 
                      fontWeight: 600,
                      letterSpacing: '0.05em'
                    }}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(227, 211, 184, 0.4)', paddingTop: '1rem' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cocoa-deep)', marginBottom: '8px' }}>Messages with Concierge</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', marginBottom: '12px', paddingRight: '8px' }}>
                      {ticket.messages && ticket.messages.length > 0 ? ticket.messages.map((msg, i) => {
                        const isUser = msg.senderRole === 'user';
                        return (
                          <div key={i} style={{ padding: '10px 14px', borderRadius: '8px', background: isUser ? '#FAF6EF' : '#FFF', border: '1px solid rgba(227, 211, 184, 0.5)', alignSelf: isUser ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                            <div style={{ fontSize: '10px', color: 'var(--taupe)', marginBottom: '4px' }}>{msg.senderName} &bull; {new Date(msg.createdAt).toLocaleString()}</div>
                            <div style={{ fontSize: '13px', color: 'var(--cocoa-deep)', lineHeight: 1.5 }}>{msg.text}</div>
                          </div>
                        );
                      }) : <div style={{ fontSize: '12px', color: 'var(--taupe)' }}>No replies yet.</div>}
                    </div>
                    
                    {ticket.status !== 'closed' && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <input type="text" placeholder="Reply to concierge..." value={enquiryMessage[ticket._id] || ''} onChange={e => setEnquiryMessage({ ...enquiryMessage, [ticket._id]: e.target.value })} style={{ flex: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.9)', fontSize: '13px', background: '#FFF' }} onKeyDown={e => { if (e.key === 'Enter') handleSendSupportMessage(ticket._id, ticket.isVenue); }} />
                        <button onClick={() => handleSendSupportMessage(ticket._id, ticket.isVenue)} style={{ background: 'var(--rust)', color: '#FFF', border: 'none', padding: '0 16px', borderRadius: '6px', fontSize: '12px', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 600 }}>Send</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      
      {/* 🔹🔹🔹 SUPPORT TICKET MODAL 🔹🔹🔹 */}
      {isSupportModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20, 10, 4, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ background: '#FFFDF9', borderRadius: '8px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1px solid rgba(227, 211, 184, 0.8)', overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--paper)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--cocoa-deep)', margin: 0, fontWeight: 400 }}>New Support Ticket</h3>
                <p style={{ color: 'var(--taupe)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>Our concierge team is here to help.</p>
              </div>
              <button type="button" onClick={() => setIsSupportModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--taupe)' }}>✕</button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await authFetch('/api/support', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(supportForm)
                });
                if (res.ok) {
                  setIsSupportModalOpen(false);
                  setSupportForm({ subject: '', type: 'General Message', message: '' });
                  loadUserBookings();
                }
              } catch (err) {
                console.error(err);
              }
            }} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cocoa-deep)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ticket Type</label>
                <select 
                  required 
                  value={supportForm.type} 
                  onChange={e => setSupportForm({ ...supportForm, type: e.target.value })}
                  style={{ padding: '12px', borderRadius: '4px', border: '1px solid var(--line)', background: '#FFF', fontSize: '0.9rem', fontFamily: 'inherit' }}
                >
                  <option value="General Message">General Message</option>
                  <option value="Booking Support">Booking Support</option>
                  <option value="Feedback">Feedback</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cocoa-deep)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</label>
                <input 
                  required 
                  type="text" 
                  placeholder="Brief description of your issue" 
                  value={supportForm.subject} 
                  onChange={e => setSupportForm({ ...supportForm, subject: e.target.value })}
                  style={{ padding: '12px', borderRadius: '4px', border: '1px solid var(--line)', background: '#FFF', fontSize: '0.9rem', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cocoa-deep)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message</label>
                <textarea 
                  required 
                  rows="4"
                  placeholder="How can we help you today?" 
                  value={supportForm.message} 
                  onChange={e => setSupportForm({ ...supportForm, message: e.target.value })}
                  style={{ padding: '12px', borderRadius: '4px', border: '1px solid var(--line)', background: '#FFF', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--line)' }}>
                <button type="button" onClick={() => setIsSupportModalOpen(false)} className="btn btn-outline" style={{ padding: '10px 16px', fontSize: '0.8rem' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px', fontSize: '0.8rem' }}>Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modals */}
      <WaiverModal
        isOpen={isWaiverModalOpen}
        onClose={() => setIsWaiverModalOpen(false)}
        onWaiverSigned={handleWaiverSigned}
      />

      <QRPassModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        pass={selectedPass}
      />
    </div>
  );
}
