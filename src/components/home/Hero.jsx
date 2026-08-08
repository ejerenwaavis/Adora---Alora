import { Link } from 'react-router-dom';
import styles from './Hero.module.css';

export default function Hero({ imageSrc }) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <span className={styles.eyebrow}>Curating style, creating community</span>
        <h1>A lifestyle house for movement, food, fashion and community.</h1>
        <p>Made in Lagos by a mother and daughter, Adora & Alora brings together the rituals that make everyday life feel fuller.</p>
        <div className={styles.heroActions}>
          <Link to="/movement" className={`${styles.btn} ${styles.btnSolid}`}>Book a Class</Link>
          <a href="#house" className={`${styles.btn} ${styles.btnOutline}`}>Explore the House</a>
        </div>
      </div>
      <div className={styles.heroVisual} data-caption="photography — house interior, first light">
        {imageSrc ? (
          <img src={imageSrc} alt="House interior" className={styles.heroImg} />
        ) : (
          <div className={styles.placeholderBg}></div>
        )}
      </div>
    </section>
  );
}
