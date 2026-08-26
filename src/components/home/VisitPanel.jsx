import { useState, useEffect } from 'react';
import axios from 'axios';
import Eyebrow from '../ui/Eyebrow.jsx';
import styles from './VisitPanel.module.css';

export default function VisitPanel() {
  const [settings, setSettings] = useState(null);
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get('/api/site/settings/contact');
        setSettings(res.data);
      } catch (err) {
        console.error('Failed to load contact settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const mapsUrl = settings?.location_map_url || "https://maps.google.com/?q=14+Adetokunbo+Ademola+Street,+Victoria+Island,+Lagos,+Nigeria";
  const mapQuery = settings?.location_map_query ? encodeURIComponent(settings.location_map_query) : '14%20Adetokunbo%20Ademola%20Street,%20Victoria%20Island,%20Lagos,%20Nigeria';

  let whatsappHref = 'https://wa.me/17372324091';
  if (settings?.whatsapp_number) {
    whatsappHref = `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`;
  } else if (import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER) {
    whatsappHref = `https://wa.me/${import.meta.env.VITE_TWILIO_WHATSAPP_NUMBER.replace(/\D/g, '')}`;
  }

  return (
    <section className={styles.visit} id="visit">
      <div className="wrap">
        <div className={`reveal ${styles.visitPanel}`}>
          {/* Left: Expansive Live Map with Overlay Badge */}
          <div className={styles.visitMap}>
            <iframe
              title="Aora House Location"
              src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
              className={styles.mapIframe}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            
            {/* Floating Location Overlay Badge */}
            <div className={styles.mapOverlayBadge}>
              <div className={styles.badgePin}>
                <span className={styles.pingDot}></span>
                {settings?.location_address ? settings.location_address.split('\n')[1] || 'Victoria Island, Lagos' : 'Victoria Island, Lagos'}
              </div>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.badgeLink}>
                Get Directions &nearr;
              </a>
            </div>
          </div>

          {/* Right: Passport Location Card */}
          <div className={styles.visitInfo}>
            <div>
              <div style={{ marginBottom: '16px' }}>
                <Eyebrow text={settings?.open_today_text || 'Open Today • 6:30 AM – 9:00 PM'} />
              </div>

              <h2>Find the house.</h2>
              <p className={styles.subText}>A quiet architectural sanctuary tucked inside Victoria Island.</p>

              <div className={styles.infoRows}>
                <div className={styles.infoRow}>
                  <svg className={styles.ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div>
                    <div className={styles.label}>Location</div>
                    <div className={styles.val} style={{ whiteSpace: 'pre-line' }}>
                      {settings?.location_address || "14 Adetokunbo Ademola Street\nVictoria Island, Lagos"}
                    </div>
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <svg className={styles.ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 16 14" />
                  </svg>
                  <div>
                    <div className={styles.label}>Opening Hours</div>
                    <div className={styles.val}>
                      {settings?.opening_hours_weekday || "Mon — Fri: 6:30am – 9:00pm"}<br />
                      {settings?.opening_hours_weekend || "Sat — Sun: 8:00am – 10:00pm"}
                    </div>
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <svg className={styles.ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <div>
                    <div className={styles.label}>Contact Concierge</div>
                    <div className={styles.val}>
                      {settings?.contact_email || "hello@aora-house.com"}<br />
                      {settings?.contact_phone || "+234 800 000 0000"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className={styles.actionRow} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.primaryBtn}>
                Open in Maps &rarr;
              </a>
              <a href={`tel:${settings?.contact_phone ? settings.contact_phone.replace(/\s/g, '') : '+2348000000000'}`} className={styles.secondaryBtn}>
                Call
              </a>
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={styles.secondaryBtn} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
