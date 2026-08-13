import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './Events.module.css';
import PageHeader from '../components/ui/PageHeader';

const GRADIENTS = [
  'linear-gradient(180deg, #EAE0CD 0%, transparent 100%)',
  'linear-gradient(180deg, #DFD4C1 0%, transparent 100%)',
  'linear-gradient(180deg, #E2DDD5 0%, transparent 100%)'
];

const PAST_EVENTS = [
  '/assets/movement.jpg',
  '/assets/cafe-2.jpg',
  '/assets/gathering-2.jpg',
  '/assets/cafe.jpg'
];

export default function Events({ detail }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get('/api/events');
        const mapped = res.data.map((e, idx) => {
          const d = new Date(e.startDate);
          return {
            ...e,
            eventType: e.bookingDestination === 'internal' ? 'house' : 'partner',
            badge: { 
              mon: d.toLocaleString('default', { month: 'short' }).toUpperCase(), 
              day: d.getDate().toString() 
            },
            date: d.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' }),
            time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            priceText: e.isFree ? 'Free' : (e.priceKobo > 0 ? `₦${(e.priceKobo / 100).toLocaleString()}` : 'External'),
            gradient: GRADIENTS[idx % 3]
          };
        });
        setEvents(mapped);
      } catch (err) {
        console.error('Failed to load events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading) {
    return <div className={styles.ev} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading events...</p></div>;
  }

  if (detail && slug) {
    const event = events.find(e => e.slug === slug);
    if (!event) {
      return (
        <div className={styles.notFound}>
          <h2>Event not found</h2>
          <button onClick={() => navigate('/events')} className={styles.backBtn}>Back to Events</button>
        </div>
      );
    }

    return (
      <div className={styles.detailPage}>
        <div className={styles.detailHero}>
          <button onClick={() => navigate('/events')} className={styles.backBtn}>&larr; All Events</button>
          <div className={styles.detailGrid}>
            <div className={styles.detailImageWrapper} style={{ background: event.gradient }}>
              {/* In the detail view we could render a real image or just the gradient */}
            </div>
            <div className={styles.detailContent}>
              <div className={styles.eventMeta}>
                <span className={styles.metaItem}>{event.date}</span>
                <span className={styles.metaDivider}>•</span>
                <span className={styles.metaItem}>{event.time}</span>
              </div>
              <h1 className={styles.detailTitle}>{event.title}</h1>
              <p className={styles.organiser}>Organised by: <strong>{event.organiser}</strong></p>
              
              <div className={styles.detailBox}>
                <p>{event.description}</p>
              </div>
              
              <div className={styles.infoRow}>
                <div>
                  <span className={styles.infoLabel}>Capacity</span>
                  <span className={styles.infoValue}>{event.capacity} Spots</span>
                </div>
                <div>
                  <span className={styles.infoLabel}>Price</span>
                  <span className={styles.infoValue}>{event.price}</span>
                </div>
              </div>

              <button className={styles.bookBtn} onClick={() => alert('Checkout flow initiated!')}>
                Book / RSVP
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredEvents = events.filter(e => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'house' && e.eventType === 'house') return true;
    if (activeFilter === 'partner' && e.eventType === 'partner') return true;
    if (activeFilter === 'month' && e.badge.mon === new Date().toLocaleString('default', { month: 'short' }).toUpperCase()) return true;
    return false;
  });

  const heroEvent = filteredEvents.length > 0 ? filteredEvents[0] : null;
  const remainingEvents = filteredEvents.slice(1);
  const gridEvents = remainingEvents.slice(0, 3);
  const pairEvents = remainingEvents.slice(3, 5);

  return (
    <div className={styles.ev}>
      {/* HERO FEATURED */}
      <PageHeader 
        eyebrow="Upcoming Events" 
        title={<>Where the house <em>comes together.</em></>} 
      />

      <div className={styles.evFilter}>
        <div className={`${styles.evPill} ${activeFilter === 'all' ? styles.on : ''}`} onClick={() => setActiveFilter('all')}>All events</div>
        <div className={`${styles.evPill} ${activeFilter === 'house' ? styles.on : ''}`} onClick={() => setActiveFilter('house')}>House events</div>
        <div className={`${styles.evPill} ${activeFilter === 'partner' ? styles.on : ''}`} onClick={() => setActiveFilter('partner')}>Partner events</div>
        <div className={`${styles.evPill} ${activeFilter === 'month' ? styles.on : ''}`} onClick={() => setActiveFilter('month')}>This month</div>
      </div>

      <div className={styles.evLegend}>
        <div className={styles.evLeg}><div className={styles.evLegDot} style={{ background: 'var(--rust)' }}></div>House event</div>
        <div className={styles.evLeg}><div className={styles.evLegDot} style={{ background: 'var(--olive)' }}></div>Partner event</div>
      </div>

      {/* HERO FEATURED */}
      {heroEvent && (
        <Link to={`/events/${heroEvent.slug}`} className={`${styles.evHero} ${styles.fadeIn}`}>
          <div className={styles.evHeroImg} style={{ background: heroEvent.gradient }}></div>
          <div className={styles.evHeroBody}>
            <div className={styles.evHeroTop}>
              <div className={styles.evHeroHostRow}>
                <span className={`${styles.evHostBadge} ${heroEvent.eventType === 'house' ? styles.evHostHouse : styles.evHostPartner}`}>
                  {heroEvent.organiser}
                </span>
              </div>
              <div className={styles.evHeroDateBlock}>
                <div className={styles.evDateLine}>{heroEvent.date}</div>
                <div className={styles.evDateTime}>{heroEvent.time}</div>
              </div>
              <div className={styles.evHeroName}>{heroEvent.title}</div>
              <div className={styles.evCta}>
                {heroEvent.eventType === 'house' ? 'Details & Booking' : 'Register with Partner'} <span className={styles.evCtaArrow}>&rarr;</span>
              </div>
            </div>
          </div>
        </Link>
      )}


      {/* 3 CARD GRID */}
      {gridEvents.length > 0 && (
        <div className={styles.evGrid}>
          {gridEvents.map((ev, idx) => (
            <Link to={`/events/${ev.slug}`} key={ev.slug} className={`${styles.evCard} ${ev.eventType === 'partner' ? styles.partner : ''} ${styles.fadeIn}`} style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className={styles.evCardImg} style={{ background: ev.gradient }}>
                <div className={styles.evDateBadge}><span className={styles.mon}>{ev.badge.mon}</span><span className={styles.day}>{ev.badge.day}</span></div>
              </div>
              <div className={styles.evCardBody}>
                <div className={styles.evCardHost}>{ev.organiser}</div>
                <div className={styles.evCardName}>{ev.title}</div>
                <div className={styles.evCardLink} style={{ marginTop: '12px' }}>
                  {ev.eventType === 'house' ? 'Details & Booking' : 'Register with Partner'} <span className={styles.arr}>&rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 2 CARD BOTTOM ROW */}
      {pairEvents.length > 0 && (
        <div className={styles.evPair}>
          {pairEvents.map((ev, idx) => (
            <Link to={`/events/${ev.slug}`} key={ev.slug} className={`${styles.evCard} ${ev.eventType === 'partner' ? styles.partner : ''} ${styles.fadeIn}`} style={{ animationDelay: `${0.2 + (idx * 0.02)}s` }}>
              <div className={styles.evCardImg} style={{ background: ev.gradient }}>
                <div className={styles.evDateBadge}><span className={styles.mon}>{ev.badge.mon}</span><span className={styles.day}>{ev.badge.day}</span></div>
              </div>
              <div className={styles.evCardBody}>
                <div className={styles.evCardHost}>{ev.organiser}</div>
                <div className={styles.evCardName}>{ev.title}</div>
                <div className={styles.evCardLink} style={{ marginTop: '12px' }}>
                  {ev.eventType === 'house' ? 'Details & Booking' : 'Register with Partner'} <span className={styles.arr}>&rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Past Events Gallery */}
      <section className={styles.pastSection}>
        <div className={styles.pastHeader}>
          <h2 className={styles.sectionTitle}>Past Gatherings</h2>
          <p className={styles.pastDesc}>A look back at moments of connection and community.</p>
        </div>
        <div className={styles.galleryGrid}>
          {PAST_EVENTS.map((img, idx) => (
            <div key={idx} className={styles.galleryItem}>
              <img src={img} alt={`Past Event ${idx + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      {/* Venue Hire Link CTA */}
      <section className={styles.venueCta}>
        <div className={styles.ctaBox}>
          <h2>Host Your Own Event</h2>
          <p>Interested in hosting a private event, brand pop-up, or collaboration in our space?</p>
          <Link to="/venue-hire" className={styles.ctaBtn}>Enquire About Venue Hire</Link>
        </div>
      </section>
    </div>
  );
}
