import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styles from './Events.module.css';

const UPCOMING_EVENTS = [
  {
    slug: 'wellness-brunch-august',
    title: 'Adora Wellness Brunch',
    organiser: 'Adora & Alora',
    date: 'August 24, 2026',
    time: '10:00 AM - 1:00 PM',
    description: 'Join us for a morning of mindfulness, somatic movement, and a curated plant-based brunch. Connect with like-minded individuals in an intimate setting designed to rejuvenate your spirit.',
    capacity: 20,
    price: '$75',
    image: 'https://images.unsplash.com/photo-1490818387583-1b5ba45227fa?auto=format&fit=crop&q=80&w=1000'
  },
  {
    slug: 'styling-conversation-archive',
    title: 'Styling Conversation: The Archive',
    organiser: 'Adora Archive Team',
    date: 'September 5, 2026',
    time: '6:30 PM - 8:30 PM',
    description: 'An exclusive evening exploring the history and styling of vintage archive pieces. Learn how to integrate timeless garments into a modern wardrobe.',
    capacity: 35,
    price: 'Free for Members, $25 Non-Members',
    image: 'https://images.unsplash.com/photo-1550614000-4b95d4ebf0ae?auto=format&fit=crop&q=80&w=1000'
  },
  {
    slug: 'journaling-night',
    title: 'Introspective Journaling Night',
    organiser: 'Wellness Collective',
    date: 'September 12, 2026',
    time: '7:00 PM - 9:00 PM',
    description: 'A guided journaling session focusing on self-discovery and goal setting for the upcoming season, accompanied by soothing herbal teas and ambient sounds.',
    capacity: 15,
    price: '$30',
    image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=1000'
  }
];

const PAST_EVENTS = [
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1478147424116-24cb34898ce0?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1505236858219-8373dd707522?auto=format&fit=crop&q=80&w=800'
];

export default function Events({ detail }) {
  const { slug } = useParams();
  const navigate = useNavigate();

  if (detail && slug) {
    const event = UPCOMING_EVENTS.find(e => e.slug === slug);
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
            <div className={styles.detailImageWrapper}>
              <img src={event.image} alt={event.title} className={styles.detailImg} />
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

  return (
    <div className={styles.eventsPage}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Adora &amp; Alora Events</h1>
        <p className={styles.pageDesc}>
          Join us for Adora Evenings, styling conversations, wellness brunches, journaling nights, 
          and exclusive brand collaborations.
        </p>
      </header>

      {/* Upcoming Events Grid */}
      <section className={styles.upcomingSection}>
        <h2 className={styles.sectionTitle}>Upcoming Events</h2>
        <div className={styles.eventsGrid}>
          {UPCOMING_EVENTS.map(event => (
            <Link to={`/events/${event.slug}`} key={event.slug} className={styles.eventCard}>
              <div className={styles.cardImageWrapper}>
                <img src={event.image} alt={event.title} className={styles.cardImg} />
                <div className={styles.priceTag}>{event.price}</div>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardDate}>{event.date} • {event.time}</div>
                <h3 className={styles.cardTitle}>{event.title}</h3>
                <p className={styles.cardDesc}>{event.description}</p>
                <div className={styles.cardFooter}>
                  <span>{event.capacity} Spots Available</span>
                  <span className={styles.arrow}>&rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

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
