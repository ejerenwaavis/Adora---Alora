import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VisitPanel from '../components/home/VisitPanel.jsx';
import ExploreDoors from '../components/home/ExploreDoors.jsx';
import Eyebrow from '../components/ui/Eyebrow.jsx';
import PageHeader from '../components/ui/PageHeader';
import styles from './Visit.module.css';

export default function Visit() {
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await axios.get('/api/site/faqs');
        setFaqs(res.data);
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      }
    };
    fetchFaqs();
  }, []);

  return (
    <div className={styles.visitPage}>
      {/* Hero Header */}
      <PageHeader 
        eyebrow="Plan Your Experience"
        title="Step Inside the House."
        description="Located in the heart of Victoria Island, Lagos — a peaceful sanctuary for daily movement, coastal dining, archive fashion, and cultural gathering."
      />

      {/* Main Location Card with Live Map */}
      <VisitPanel />

      {/* Visiting Amenities & Concierge */}
      <section className={styles.amenities}>
        <div className="wrap">
          <div className={styles.sectionTitle}>
            <Eyebrow text="Guest Services" centered />
            <h2>Thoughtful details for every visit.</h2>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.num}>01</span>
                <div className={styles.iconWrap}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 3.1C1.4 11.4 1 12.2 1 13v3c0 .6.4 1 1 1h2" />
                    <circle cx="7" cy="17" r="2" />
                    <circle cx="17" cy="17" r="2" />
                  </svg>
                </div>
              </div>
              <h3>Valet &amp; Parking</h3>
              <p>Private subterranean valet parking and street concierge available directly at our main entrance on Adetokunbo Ademola Street.</p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.num}>02</span>
                <div className={styles.iconWrap}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
                  </svg>
                </div>
              </div>
              <h3>Walk-Ins &amp; Reservations</h3>
              <p>Walk-ins are warmly welcomed at the Café and Fashion edit. Reformer Pilates classes and private venue hire require advance booking.</p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.num}>03</span>
                <div className={styles.iconWrap}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
              </div>
              <h3>House Etiquette</h3>
              <p>Casual elegance throughout the house. Lockers, fresh towels, keyless storage, and Malin+Goetz amenities provided in studio changing rooms.</p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.num}>04</span>
                <div className={styles.iconWrap}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>
              <h3>Private Concierge</h3>
              <p>Dedicated house hosts available for private room bookings, customized gifting, private dining, and group movement sessions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className={styles.faqSection}>
        <div className="wrap">
          <div className={styles.sectionTitle}>
            <Eyebrow text="Visiting Guidelines" centered />
            <h2>Frequently Asked Questions</h2>
          </div>

          <div className={styles.faqGrid}>
            {faqs.map((faq) => (
              <div key={faq._id} className={styles.faqItem}>
                <h4>{faq.question}</h4>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore Other Doors */}
      <ExploreDoors />
    </div>
  );
}
