import { Link } from 'react-router-dom';
import SectionHead from '../ui/SectionHead.jsx';
import styles from './ExploreDoors.module.css';

const DOORS = [
  {
    to: '/movement',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <rect x="6" y="20" width="8" height="8" rx="1.5"/>
        <rect x="34" y="20" width="8" height="8" rx="1.5"/>
        <line x1="14" y1="24" x2="34" y2="24"/>
        <line x1="10" y1="16" x2="10" y2="32"/>
        <line x1="38" y1="16" x2="38" y2="32"/>
      </svg>
    ),
    title: 'Movement',
    desc: 'Reformer, Lagree & strength room',
    cta: 'View Schedule',
    accent: '#414F36'
  },
  {
    to: '/cafe',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 20h20v10a10 10 0 0 1-10 10 10 10 0 0 1-10-10Z"/>
        <path d="M31 22h4a4 4 0 0 1 0 8h-4"/>
        <path d="M16 9c-1 2 2 3 1 5" strokeLinecap="round"/>
        <path d="M22 9c-1 2 2 3 1 5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Café',
    desc: 'Coffee, matcha & modern plates',
    cta: 'Explore the Café',
    accent: '#A4451F'
  },
  {
    to: '/fashion',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 12a3.2 3.2 0 1 1 3.2 3.2"/>
        <path d="M24 15.2 8 27h32Z"/>
        <line x1="8" y1="27" x2="8" y2="30"/>
        <line x1="40" y1="27" x2="40" y2="30"/>
      </svg>
    ),
    title: 'Fashion',
    desc: 'Archive, brand partners & Raire',
    cta: 'Discover Fashion',
    accent: '#C89B4A'
  },
  {
    to: '/venue-hire',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 40V18a12 12 0 0 1 24 0v22"/>
        <line x1="8" y1="40" x2="40" y2="40"/>
        <circle cx="24" cy="24" r="2"/>
      </svg>
    ),
    title: 'Venue Hire',
    desc: 'The Loft & the Café, for hire',
    cta: 'Enquire',
    accent: '#4A3527'
  },
  {
    to: '/events',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 6c6 6 6 10 0 16-6-6-6-10 0-16Z"/>
        <path d="M24 22v20"/>
        <path d="M16 42h16"/>
      </svg>
    ),
    title: 'Events',
    desc: 'Evenings, pop-ups & gatherings',
    cta: "See What's On",
    accent: '#B0644F'
  }
];

export default function ExploreDoors() {
  return (
    <section className="explore" style={{ padding: '40px 0 90px' }}>
      <div className="wrap">
        <SectionHead 
          eyebrow="Explore the House" 
          title="One house. Five doors. One rhythm." 
        />
        <div className={`reveal ${styles.doorGrid}`}>
          {DOORS.map((door) => (
            <Link 
              key={door.title} 
              to={door.to} 
              className={styles.doorCard} 
              style={{ '--accent': door.accent }}
            >
              <div className={styles.iconWrap}>
                {door.icon}
              </div>
              <h3>{door.title}</h3>
              <p>{door.desc}</p>
              <span className={styles.go}>{door.cta} &rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
