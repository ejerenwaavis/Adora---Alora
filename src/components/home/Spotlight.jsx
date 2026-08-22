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
      <div className={`${styles.spotVisual} reveal`} data-caption={caption}>
        {imageSrc ? (
          <img src={imageSrc} alt={title} className={styles.spotImg} />
        ) : (
          <div className={styles.placeholderBg}></div>
        )}
      </div>
      <div className={styles.spotCopy}>
        <span className={`${styles.eyebrow} reveal`}>{eyebrow}</span>
        <h3 className="reveal reveal-delay-1">{title}</h3>
        <p className="reveal reveal-delay-2">{desc}</p>
        {ctaTo && (
          <div className="reveal reveal-delay-3" style={{ display: 'inline-block' }}>
            <Link to={ctaTo} className={`${styles.btn} ${styles.btnOutline}`}>{ctaText}</Link>
          </div>
        )}
      </div>
    </section>
  );
}
