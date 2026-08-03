import styles from './VisitPanel.module.css';

export default function VisitPanel() {
  return (
    <section className={styles.visit} id="visit">
      <div className="wrap">
        <div className={`reveal ${styles.visitPanel}`}>
          <div className={styles.visitMap}>
            {/* Map placeholder */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--rust)" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div style={{ fontSize: '11px', letterSpacing: '0.1em', color: 'var(--rust)', marginTop: '8px', textTransform: 'uppercase' }}>
                Lagos, Nigeria
              </div>
            </div>
          </div>

          <div className={styles.visitInfo}>
            <h2>Find the house.</h2>
            
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
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <div>
                <div className={styles.label}>Opening Hours</div>
                <div className={styles.val}>
                  Mon — Fri: 6:30am - 9:00pm<br />
                  Sat — Sun: 8:00am - 10:00pm
                </div>
              </div>
            </div>

            <div className={styles.infoRow}>
              <svg className={styles.ico} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <div>
                <div className={styles.label}>Contact</div>
                <div className={styles.val}>
                  hello@adora-alora.com<br />
                  +234 800 000 0000
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
