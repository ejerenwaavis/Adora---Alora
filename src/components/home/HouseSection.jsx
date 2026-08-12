import styles from './HouseSection.module.css';

export default function HouseSection() {
  return (
    <>
      <section className={styles.houseSection} id="house">
        <div className={styles.houseHead}>
          <span className={styles.eyebrow}>One house, five rooms</span>
          <h2>Everything under one roof</h2>
          <p>Adora & Alora is one lifestyle house, not a collection of separate businesses — each room connects to the next.</p>
        </div>

        <div className={styles.houseGrid}>
          <svg className={styles.houseLineSvg} viewBox="0 0 1180 20" preserveAspectRatio="none">
            <path d="M 100 10 C 300 -10, 400 30, 590 10 S 900 -10, 1080 10" />
          </svg>
          <div className={styles.cards}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="2.2"/><path d="M12 8v6M8 11h8M9 21l3-7 3 7"/></svg>
              </div>
              <h3>Movement</h3>
              <p>Pilates, Lagree & strength</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg viewBox="0 0 24 24"><path d="M4 9h13a3 3 0 0 1 0 6H4V9Z"/><path d="M4 9v9M17 9V6"/></svg>
              </div>
              <h3>Café</h3>
              <p>Coffee, matcha & food</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg viewBox="0 0 24 24"><path d="M9 4h6l2 4H7l2-4Z"/><path d="M7 8l-3 3 3 9h10l3-9-3-3"/></svg>
              </div>
              <h3>Fashion</h3>
              <p>Archive, brands & Raire</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <svg viewBox="0 0 24 24"><path d="M4 21V9l8-6 8 6v12"/><path d="M9 21v-6h6v6"/></svg>
              </div>
              <h3>Venue Hire</h3>
              <p>The Loft & Café hire</p>
            </div>
          </div>
        </div>
      </section>
      
      <hr className={styles.divider} />
    </>
  );
}
