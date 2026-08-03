import SectionHead from '../ui/SectionHead.jsx';
import { Link } from 'react-router-dom';
import styles from './EventRow.module.css';

const EVENTS = [
  {
    id: '1',
    month: 'SEP',
    day: '12',
    org: 'Hosted by Adora & Alora',
    title: 'Adora Evening: Styling Conversations',
    desc: 'An evening of style, conversation and community in the Café.',
    to: '/events/1'
  },
  {
    id: '2',
    month: 'SEP',
    day: '20',
    org: 'Hosted by The Becoming Network',
    title: 'Becoming: Leadership Circle',
    desc: 'A closed seminar focusing on women in leadership.',
    to: '/events/2'
  },
  {
    id: '3',
    month: 'OCT',
    day: '05',
    org: 'Hosted by Raire',
    title: 'Raire Seller Pop-Up',
    desc: 'A full weekend takeover of the Fashion floor by Raire sellers.',
    to: '/events/3'
  }
];

export default function EventRow() {
  return (
    <section className={styles.events} id="events">
      <div className="wrap">
        <SectionHead
          eyebrow="05"
          title="Where the house comes together."
        />

        <div className={`reveal ${styles.eventRow}`}>
          {EVENTS.map((evt) => (
            <Link key={evt.id} to={evt.to} className={styles.eventCard}>
              <div className={styles.eventMedia}>
                <div className={styles.dateBadge}>
                  {evt.month}<b>{evt.day}</b>
                </div>
              </div>
              <div className={styles.eventBody}>
                <div className={styles.eventOrg}>{evt.org}</div>
                <h4>{evt.title}</h4>
                <p>{evt.desc}</p>
                <span className={styles.go}>Details &amp; Booking &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
