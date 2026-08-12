import { Link } from 'react-router-dom';
import styles from './Spotlight.module.css';

export default function Spotlight({ 
  id, 
  eyebrow, 
  title, 
  desc, 
  ctaTo, 
  ctaText, 
  reverse = false, 
  imageSrc,
  caption
}) {
  return (
    <section className={`${styles.spotlight} ${reverse ? styles.reverse : ''}`} id={id}>
      <div className={styles.spotVisual} data-caption={caption}>
        {imageSrc ? (
          <img src={imageSrc} alt={title} className={styles.spotImg} />
        ) : (
          <div className={styles.placeholderBg}></div>
        )}
      </div>
      <div className={styles.spotCopy}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h3>{title}</h3>
        <p>{desc}</p>
        {ctaTo && (
          <Link to={ctaTo} className={`${styles.btn} ${styles.btnOutline}`}>{ctaText}</Link>
        )}
      </div>
    </section>
  );
}
