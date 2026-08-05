import styles from './VisitPanel.module.css';

export default function VisitPanel() {
  const mapsUrl = "https://maps.google.com/?q=14+Adetokunbo+Ademola+Street,+Victoria+Island,+Lagos,+Nigeria";

  return (
    <section className={styles.visit} id="visit">
      <div className="wrap">
        <div className={`reveal ${styles.visitPanel}`}>
          {/* Left: Expansive Live Map with Overlay Badge */}
          <div className={styles.visitMap}>
            <iframe
              title="Adora & Alora Location — 14 Adetokunbo Ademola Street, Victoria Island, Lagos"
              src="https://maps.google.com/maps?q=14%20Adetokunbo%20Ademola%20Street,%20Victoria%20Island,%20Lagos,%20Nigeria&t=&z=16&ie=UTF8&iwloc=&output=embed"
              className={styles.mapIframe}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            
            {/* Floating Location Overlay Badge */}
            <div className={styles.mapOverlayBadge}>
              <div className={styles.badgePin}>
                <span className={styles.pingDot}></span>
                Victoria Island, Lagos
              </div>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.badgeLink}>
                Get Directions &nearr;
              </a>
            </div>
          </div>

          {/* Right: Passport Location Card */}
          <div className={styles.visitInfo}>
            <div>
              <div className={styles.statusPill}>
                <span className={styles.statusDot}></span> Open Today &bull; 6:30 AM &ndash; 9:00 PM
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
                    <div className={styles.val}>
                      14 Adetokunbo Ademola Street<br />
                      Victoria Island, Lagos
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
                      Mon &mdash; Fri: 6:30am &ndash; 9:00pm<br />
                      Sat &mdash; Sun: 8:00am &ndash; 10:00pm
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
                      hello@adora-alora.com<br />
                      +234 800 000 0000
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className={styles.actionRow}>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.primaryBtn}>
                Open in Maps &rarr;
              </a>
              <a href="tel:+2348000000000" className={styles.secondaryBtn}>
                Call Desk
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
