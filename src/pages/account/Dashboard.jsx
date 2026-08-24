import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import WaiverModal from './WaiverModal';
import QRPassModal from './QRPassModal';
import styles from './AccountLayout.module.css';

export default function Dashboard() {
  const { user, authFetch, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'bookings' | 'passes' | 'waiver'
  const [bookingFilter, setBookingFilter] = useState('all'); // 'all' | 'classes' | 'events' | 'orders'
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
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    loadUserBookings();
  }, []);

  async function loadUserBookings() {
    setLoading(true);
    try {
      const res = await authFetch('/api/user/bookings');
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Failed to load user bookings:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleOpenQR = (pass, type = 'class') => {
    setSelectedPass({ ...pass, type });
    setIsQRModalOpen(true);
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

  const handleWaiverSigned = async (updatedUser) => {
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
          <span>{actionMessage.isError ? '✕' : '✓'}</span>
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <div className="eyebrow" style={{ color: 'var(--rust)', letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '0.4rem' }}>
            Member Access Portal
          </div>
          <h1 className={styles.pageTitle} style={{ margin: 0 }}>
            {user?.firstName} {user?.lastName}
          </h1>
          <p style={{ color: 'var(--taupe)', marginTop: '0.35rem', fontSize: '0.92rem' }}>
            Welcome to your member portal. Manage studio credits, upcoming passes, digital check-in QR codes, and liability records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
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
            Book Studio Class <span className="btn-arrow">→</span>
          </button>
        </div>
      </div>

      {/* Waiver Warning Alert Banner (If unsigned) */}
      {!isWaiverSigned && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(164, 69, 31, 0.08) 0%, rgba(200, 155, 74, 0.12) 100%)',
          border: '1px solid rgba(164, 69, 31, 0.4)',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <div>
              <strong style={{ color: 'var(--rust, #A4451F)', fontSize: '0.95rem', display: 'block' }}>
                Liability &amp; Health Waiver Required
              </strong>
              <span style={{ fontSize: '0.84rem', color: 'var(--cocoa-deep, #2B2015)' }}>
                Please sign the Movement Studio health declaration before attending or booking your next session.
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsWaiverModalOpen(true)}
            style={{
              background: 'var(--rust, #A4451F)',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Sign Waiver Now ✍
          </button>
        </div>
      )}

      {/* Top Performance & Credits Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        {/* Studio Credits */}
        <div className={styles.card} style={{ margin: 0, padding: '1.5rem', borderLeft: '4px solid var(--gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)' }}>Studio Credits</div>
            <Link to="/movement" style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, textDecoration: 'none' }}>+ Top Up</Link>
          </div>
          <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', color: 'var(--cocoa-deep)', fontWeight: 500, margin: '0.35rem 0' }}>
            {user?.classCredits || dashboardData.classCredits || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--forest)' }}>
            Available for all movement &amp; sound sessions
          </div>
        </div>

        {/* Membership Tier */}
        <div className={styles.card} style={{ margin: 0, padding: '1.5rem', borderLeft: '4px solid var(--forest)' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)' }}>Membership Tier</div>
          <div style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: 'var(--cocoa-deep)', fontWeight: 500, margin: '0.5rem 0', textTransform: 'capitalize' }}>
            {user?.membershipStatus && user.membershipStatus !== 'none' ? user.membershipStatus : 'House Member'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>
            Access to Café, Loft &amp; Boutique
          </div>
        </div>

        {/* Active Passes */}
        <div className={styles.card} style={{ margin: 0, padding: '1.5rem', borderLeft: '4px solid var(--rust)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)' }}>Upcoming Passes</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--rust)', fontWeight: 600 }}>Active</span>
          </div>
          <div style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', color: 'var(--cocoa-deep)', fontWeight: 500, margin: '0.35rem 0' }}>
            {(dashboardData.upcomingClasses?.length || 0) + (dashboardData.upcomingEvents?.length || 0)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>
            Scheduled classes &amp; event tickets
          </div>
        </div>

        {/* Waiver Status */}
        <div className={styles.card} style={{ margin: 0, padding: '1.5rem', borderLeft: isWaiverSigned ? '4px solid #2E6B3E' : '4px solid #A4451F' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)' }}>Studio Waiver</div>
          <div style={{ fontSize: '1.2rem', fontFamily: 'var(--font-heading)', color: isWaiverSigned ? '#2E6B3E' : '#A4451F', fontWeight: 600, margin: '0.65rem 0 0.35rem' }}>
            {isWaiverSigned ? '✓ Verified & Signed' : '✕ Unsigned'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>
            {isWaiverSigned ? (
              <span onClick={() => setIsWaiverModalOpen(true)} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                Review details
              </span>
            ) : (
              <span onClick={() => setIsWaiverModalOpen(true)} style={{ color: 'var(--rust)', cursor: 'pointer', fontWeight: 600 }}>
                Sign to unlock classes →
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.08)', marginBottom: '2rem', gap: '1.5rem' }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'bookings', label: `My Bookings (${(dashboardData.upcomingClasses?.length || 0) + (dashboardData.upcomingEvents?.length || 0)})` },
          { id: 'passes', label: 'Digital QR Passes' },
          { id: 'waiver', label: 'Waiver & Health' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              padding: '0.75rem 0.25rem',
              fontSize: '0.92rem',
              fontFamily: 'inherit',
              color: activeTab === tab.id ? 'var(--cocoa-deep)' : 'var(--taupe)',
              fontWeight: activeTab === tab.id ? 600 : 400,
              borderBottom: activeTab === tab.id ? '2px solid var(--rust)' : '2px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: OVERVIEW ─── */}
      {activeTab === 'overview' && (
        <div>
          {/* Next Up Hero Card */}
          {nextPass ? (
            <div style={{
              background: '#FFFDF9',
              border: '1px solid rgba(227, 211, 184, 0.9)',
              borderRadius: '8px',
              padding: '1.75rem',
              marginBottom: '2rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.5rem'
            }}>
              <div>
                <div style={{ display: 'inline-block', background: 'rgba(200, 155, 74, 0.15)', color: 'var(--rust)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Next Upcoming Pass · {nextPassType === 'event' ? 'Loft Event' : 'Movement Studio'}
                </div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', color: 'var(--cocoa-deep)', margin: '0 0 0.4rem' }}>
                  {nextPassType === 'event' ? nextPass.event?.title : nextPass.classSession?.classType?.name}
                </h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--taupe)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>
                    📅 {new Date(nextPassType === 'event' ? nextPass.event?.startDate : nextPass.classSession?.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span>
                    ⏰ {new Date(nextPassType === 'event' ? nextPass.event?.startDate : nextPass.classSession?.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>
                    📍 {nextPassType === 'event' ? (nextPass.event?.space || 'The Loft') : (nextPass.classSession?.classType?.room || 'Movement Studio')}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => handleOpenQR(nextPass, nextPassType)}
                  style={{
                    background: 'var(--cocoa-deep, #2B2015)',
                    color: '#F7EFE1',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>📱</span> View Digital Pass
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState} style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--cocoa-deep)', margin: '0 0 0.5rem' }}>No Active Passes</h3>
              <p style={{ color: 'var(--taupe)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>You have no upcoming studio classes or loft events scheduled.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button onClick={() => navigate('/movement')} className="btn btn-primary">Browse Movement Classes</button>
                <button onClick={() => navigate('/events')} className="btn btn-outline">Explore Loft Events</button>
              </div>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className={styles.card} style={{ margin: 0, padding: '1.5rem' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--cocoa-deep)', margin: '0 0 0.5rem' }}>Movement Studio</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Reserve reformers, breathwork, and sound therapy sessions with resident instructors.
              </p>
              <button onClick={() => navigate('/movement')} style={{ background: 'none', border: 'none', color: 'var(--rust)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}>
                Explore Timetable →
              </button>
            </div>

            <div className={styles.card} style={{ margin: 0, padding: '1.5rem' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: 'var(--cocoa-deep)', margin: '0 0 0.5rem' }}>Café &amp; Boutique</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--taupe)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Browse daily seasonal kitchen menus, organic matcha, and curated fashion collection.
              </p>
              <button onClick={() => navigate('/cafe')} style={{ background: 'none', border: 'none', color: 'var(--rust)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}>
                View Café Menu →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: MY BOOKINGS & PASSES ─── */}
      {activeTab === 'bookings' && (
        <div>
          {/* Subfilter Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
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
                  background: bookingFilter === f.id ? 'var(--cocoa-deep)' : '#FFFDF9',
                  color: bookingFilter === f.id ? '#F7EFE1' : 'var(--cocoa-deep)',
                  border: '1px solid rgba(227, 211, 184, 0.9)',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Classes Section */}
          {(bookingFilter === 'all' || bookingFilter === 'classes') && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--cocoa-deep)', marginBottom: '1rem' }}>
                Upcoming Movement Classes
              </h3>
              {dashboardData.upcomingClasses?.length === 0 ? (
                <div style={{ padding: '1.5rem', background: '#FAF6EF', borderRadius: '6px', textAlign: 'center', color: 'var(--taupe)', fontSize: '0.88rem' }}>
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
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '1.1rem', color: 'var(--cocoa-deep)' }}>
                              {session?.classType?.name || 'Movement Session'}
                            </strong>
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: booking.status === 'confirmed' ? 'rgba(46, 107, 62, 0.1)' : 'rgba(200, 155, 74, 0.15)',
                              color: booking.status === 'confirmed' ? '#2E6B3E' : 'var(--rust)',
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}>
                              {booking.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.88rem', color: 'var(--taupe)', marginTop: '4px' }}>
                            📅 {new Date(session?.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(session?.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {session?.instructor && ` · Instructor: ${session.instructor.firstName} ${session.instructor.lastName}`}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--forest)', marginTop: '2px' }}>
                            📍 {session?.classType?.room || 'Movement Studio Level 2'} · Duration: {session?.classType?.durationMinutes || 50} mins
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenQR(booking, 'class')}
                            style={{
                              background: 'var(--cocoa-deep)',
                              color: '#F7EFE1',
                              border: 'none',
                              padding: '8px 14px',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Digital Pass 📱
                          </button>
                          <button
                            disabled={cancellingId === booking._id}
                            onClick={() => handleCancelClassBooking(booking._id)}
                            style={{
                              background: 'none',
                              border: '1px solid rgba(164, 69, 31, 0.5)',
                              color: 'var(--rust)',
                              padding: '8px 12px',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
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
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--cocoa-deep)', marginBottom: '1rem' }}>
                Loft &amp; House Event Passes
              </h3>
              {dashboardData.upcomingEvents?.length === 0 ? (
                <div style={{ padding: '1.5rem', background: '#FAF6EF', borderRadius: '6px', textAlign: 'center', color: 'var(--taupe)', fontSize: '0.88rem' }}>
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
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1rem'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '1.1rem', color: 'var(--cocoa-deep)' }}>
                              {evt?.title || 'Loft House Event'}
                            </strong>
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: 'rgba(200, 155, 74, 0.15)',
                              color: 'var(--rust)',
                              fontWeight: 600,
                              textTransform: 'uppercase'
                            }}>
                              Ticket Ref: {eventBooking.ticketReference || `#TBN-${eventBooking._id.slice(-6).toUpperCase()}`}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.88rem', color: 'var(--taupe)', marginTop: '4px' }}>
                            📅 {evt?.startDate ? new Date(evt.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Scheduled'} {evt?.time ? `· ${evt.time}` : ''}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--rust)', marginTop: '2px' }}>
                            📍 {evt?.space || 'The Loft'} · Tickets: {eventBooking.quantity || 1}
                          </div>
                        </div>

                        <div>
                          <button
                            onClick={() => handleOpenQR(eventBooking, 'event')}
                            style={{
                              background: 'var(--cocoa-deep)',
                              color: '#F7EFE1',
                              border: 'none',
                              padding: '8px 14px',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Digital Ticket 🎟
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
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--cocoa-deep)', marginBottom: '1rem' }}>
                Café &amp; Fashion Receipts
              </h3>
              {(dashboardData.cafeOrders?.length === 0 && dashboardData.fashionOrders?.length === 0) ? (
                <div style={{ padding: '1.5rem', background: '#FAF6EF', borderRadius: '6px', textAlign: 'center', color: 'var(--taupe)', fontSize: '0.88rem' }}>
                  No order history recorded yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {dashboardData.cafeOrders?.map(order => (
                    <div key={order._id} style={{ background: '#FFFDF9', border: '1px solid rgba(227, 211, 184, 0.7)', borderRadius: '6px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>Café Order #{order.orderNumber}</strong>
                        <div style={{ fontSize: '0.82rem', color: 'var(--taupe)' }}>
                          {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>₦{((order.totalAmountKobo || 0) / 100).toLocaleString()}</div>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--forest)' }}>{order.status}</span>
                      </div>
                    </div>
                  ))}
                  {dashboardData.fashionOrders?.map(order => (
                    <div key={order._id} style={{ background: '#FFFDF9', border: '1px solid rgba(227, 211, 184, 0.7)', borderRadius: '6px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>Boutique Item: {order.itemName}</strong>
                        <div style={{ fontSize: '0.82rem', color: 'var(--taupe)' }}>
                          Size: {order.selectedSize || 'One Size'} · {order.orderNumber}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 600 }}>₦{((order.priceKobo || 0) / 100).toLocaleString()}</div>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--rust)' }}>{order.status}</span>
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
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--cocoa-deep)', marginBottom: '1rem' }}>
                Past Attendance &amp; Expired Bookings
              </h3>
              {(dashboardData.pastClasses?.length === 0 && dashboardData.pastEvents?.length === 0) ? (
                <div style={{ padding: '1.5rem', background: '#FAF6EF', borderRadius: '6px', textAlign: 'center', color: 'var(--taupe)', fontSize: '0.88rem' }}>
                  No past bookings.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', opacity: 0.75 }}>
                  {dashboardData.pastClasses?.slice(0, 10).map(b => (
                    <div key={b._id} style={{ background: '#FAF6EF', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: '6px', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{b.classSession?.classType?.name || 'Class Session'}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>
                          {new Date(b.classSession?.startTime || b.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{b.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: DIGITAL QR PASSES GALLERY ─── */}
      {activeTab === 'passes' && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--cocoa-deep)', marginBottom: '0.5rem' }}>
            Active Door &amp; Check-in Passes
          </h3>
          <p style={{ color: 'var(--taupe)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
            Select any active pass below to enlarge the QR code for instant front-desk clerk scanning upon arrival.
          </p>

          {((dashboardData.upcomingClasses?.length || 0) + (dashboardData.upcomingEvents?.length || 0)) === 0 ? (
            <div className={styles.emptyState}>
              <p>You have no active passes to scan.</p>
              <button onClick={() => navigate('/movement')} className="btn btn-primary">Book Movement Session</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
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
                    padding: '1.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--forest)', fontWeight: 600, letterSpacing: '0.08em' }}>
                    Movement Studio Pass
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--cocoa-deep)', margin: '0.4rem 0' }}>
                    {c.classSession?.classType?.name}
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--taupe)', marginBottom: '1rem' }}>
                    📅 {new Date(c.classSession?.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(c.classSession?.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--taupe)' }}>Ref: #{c._id.slice(-6).toUpperCase()}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--forest)', fontWeight: 600 }}>Open QR ↗</span>
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
                    padding: '1.5rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--rust)', fontWeight: 600, letterSpacing: '0.08em' }}>
                    Loft Event Pass
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--cocoa-deep)', margin: '0.4rem 0' }}>
                    {e.event?.title}
                  </h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--taupe)', marginBottom: '1rem' }}>
                    📅 {e.event?.startDate ? new Date(e.event.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Scheduled'}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--taupe)' }}>Ref: {e.ticketReference || `#TBN-${e._id.slice(-6).toUpperCase()}`}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--rust)', fontWeight: 600 }}>Open QR ↗</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: WAIVER & HEALTH ─── */}
      {activeTab === 'waiver' && (
        <div style={{ maxWidth: '720px' }}>
          <div className={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', color: 'var(--cocoa-deep)', margin: 0 }}>
                  Studio Health &amp; Liability Waiver
                </h3>
                <p style={{ color: 'var(--taupe)', fontSize: '0.88rem', marginTop: '0.25rem' }}>
                  Aora House Movement Studio Participation &amp; Liability Release Agreement
                </p>
              </div>
              <span style={{
                background: isWaiverSigned ? 'rgba(46, 107, 62, 0.1)' : 'rgba(164, 69, 31, 0.1)',
                color: isWaiverSigned ? '#2E6B3E' : '#A4451F',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                {isWaiverSigned ? 'Status: Active & Signed' : 'Status: Pending Signature'}
              </span>
            </div>

            {isWaiverSigned ? (
              <div>
                <div style={{ background: '#FAF6EF', padding: '16px', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.8)', marginBottom: '1.5rem', fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--cocoa-deep)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--taupe)' }}>Signature on Record:</span>
                    <strong style={{ fontStyle: 'italic', fontFamily: "'Fraunces', serif" }}>{user?.waiverSignature || `${user?.firstName} ${user?.lastName}`}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--taupe)' }}>Signed Date:</span>
                    <span>{dashboardData.waiverDate ? new Date(dashboardData.waiverDate).toLocaleString() : 'On file'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--taupe)' }}>Agreement Version:</span>
                    <span>{user?.waiverVersion || 'v1.0 (Movement Studio Policy)'}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--cocoa-deep)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Emergency Contact Details
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.88rem' }}>
                    <div>
                      <span style={{ color: 'var(--taupe)', display: 'block', fontSize: '0.78rem' }}>Contact Name</span>
                      <strong>{user?.emergencyContactName || 'Not specified'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--taupe)', display: 'block', fontSize: '0.78rem' }}>Phone Number</span>
                      <strong>{user?.emergencyContactPhone || 'Not specified'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--taupe)', display: 'block', fontSize: '0.78rem' }}>Relationship</span>
                      <strong>{user?.emergencyContactRelation || 'Not specified'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--taupe)', display: 'block', fontSize: '0.78rem' }}>Medical Considerations</span>
                      <span>{user?.medicalNotes || 'None noted'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsWaiverModalOpen(true)}
                  style={{
                    background: 'none',
                    border: '1px solid rgba(227, 211, 184, 0.9)',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '0.82rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Update Waiver &amp; Contact Info ✎
                </button>
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--cocoa-deep)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  You have not yet completed the Aora House Movement Studio liability waiver. Signing this agreement takes less than a minute and will immediately enable you to reserve spots in all movement sessions.
                </p>
                <button
                  onClick={() => setIsWaiverModalOpen(true)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  Complete &amp; Sign Waiver ✍
                </button>
              </div>
            )}
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
