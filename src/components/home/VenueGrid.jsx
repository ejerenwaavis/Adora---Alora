import SectionHead from '../ui/SectionHead.jsx';
import Button from '../ui/Button.jsx';
import styles from './VenueGrid.module.css';

const VENUES = [
  {
    title: 'The Loft',
    desc: 'A flexible venue created for meaningful learning, conversation and connection.',
    bullets: [
      'Seminars & masterclasses',
      'Panels & networking events',
      'Book launches & small conferences'
    ],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="10" width="32" height="28" rx="2" />
        <line x1="8" y1="20" x2="40" y2="20" />
      </svg>
    )
  },
  {
    title: 'The Café',
    desc: 'A warm and stylish setting for smaller gatherings and celebrations.',
    bullets: [
      'Private breakfasts & brunches',
      'Bridal & baby showers',
      'Brand activations & pop-ups'
    ],
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="16" />
        <path d="M24 16v16M16 24h16" />
      </svg>
    )
  }
];

export default function VenueGrid() {
  return (
    <section className={styles.venue} id="venue">
      <div className="wrap">
        <SectionHead
          eyebrow="Venue Hire"
          title="Host your event at Aora House."
          subtitle="Beautifully designed, versatile spaces for learning, connection, celebration and community."
          className={styles.sectionHead}
          titleStyle={{ color: 'var(--paper)' }}
        />
        
        <div className={`reveal ${styles.venueGrid}`}>
          {VENUES.map((venue, idx) => (
            <div key={idx} className={styles.venueCard}>
              <div className={styles.iconWrap}>
                {venue.icon}
              </div>
              <h3>{venue.title}</h3>
              <p>{venue.desc}</p>
              <ul>
                {venue.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
              <Button to={`/venue-hire/${venue.title === 'The Loft' ? 'the-loft' : ''}`} variant="gold">
                Enquire About Venue Hire
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
