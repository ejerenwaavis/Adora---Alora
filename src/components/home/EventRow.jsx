import React, { useState, useEffect } from 'react';
import SectionHead from '../ui/SectionHead.jsx';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './EventRow.module.css';

const FALLBACK_EVENTS = [
  {
    _id: '1',
    slug: 'styling-conversations',
    badge: { mon: 'SEP', day: '12' },
    organiser: 'Aora House',
    title: 'Aora House Evening: Styling Conversations',
    shortDescription: 'An evening of style, conversation and community in the Café.'
  },
  {
    _id: '2',
    slug: 'leadership-circle',
    badge: { mon: 'SEP', day: '20' },
    organiser: 'The Becoming Network',
    title: 'Becoming: Leadership Circle',
    shortDescription: 'A closed seminar focusing on women in leadership.'
  },
  {
    _id: '3',
    slug: 'raire-seller-popup',
    badge: { mon: 'OCT', day: '05' },
    organiser: 'Raire',
    title: 'Raire Seller Pop-Up',
    shortDescription: 'A full weekend takeover of the Fashion floor by Raire sellers.'
  }
];

export default function EventRow() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await axios.get('/api/events');
        if (res.data && res.data.length > 0) {
          const mapped = res.data.slice(0, 3).map(e => {
            const d = new Date(e.startDate);
            return {
              ...e,
              badge: {
                mon: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
                day: d.getDate().toString()
              }
            };
          });
          setEvents(mapped);
        } else {
          setEvents(FALLBACK_EVENTS);
        }
      } catch (err) {
        console.error('Failed to load home events:', err);
        setEvents(FALLBACK_EVENTS);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const getEventSummary = (evt) => {
    if (evt.shortDescription && evt.shortDescription.trim()) {
      return evt.shortDescription.trim();
    }
    if (evt.description && evt.description.trim()) {
      const clean = evt.description.trim();
      const firstPeriod = clean.indexOf('.');
      if (firstPeriod > 20 && firstPeriod < 120) {
        return clean.substring(0, firstPeriod + 1);
      }
      return clean.length > 100 ? clean.substring(0, 97) + '...' : clean;
    }
    return 'Join us for an exclusive gathering at Aora House.';
  };

  const displayEvents = events.length > 0 ? events : FALLBACK_EVENTS;

  return (
    <section className={styles.events} id="events">
      <div className="wrap">
        <SectionHead
          eyebrow="Upcoming Events"
          title="Where the house comes together."
        />

        <div className={`reveal ${styles.eventRow}`}>
          {displayEvents.map((evt) => (
            <Link key={evt._id || evt.slug} to={`/events/${evt.slug}`} className={styles.eventCard}>
              <div className={styles.eventMedia}>
                {evt.coverImage && (
                  <img src={evt.coverImage} alt={evt.title} className={styles.coverImg} />
                )}
                <div className={styles.dateBadge}>
                  {evt.badge?.mon}<b>{evt.badge?.day}</b>
                </div>
              </div>
              <div className={styles.eventBody}>
                <div className={styles.eventOrg}>{evt.organiser ? `Hosted by ${evt.organiser}` : 'Hosted by Aora House'}</div>
                <h4>{evt.title}</h4>
                <p>{getEventSummary(evt)}</p>
                <span className={styles.go}>Details &amp; Booking &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
