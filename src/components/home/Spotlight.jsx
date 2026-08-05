import Eyebrow from '../ui/Eyebrow.jsx';
import Button from '../ui/Button.jsx';
import Chip from '../ui/Chip.jsx';
import styles from './Spotlight.module.css';

export default function Spotlight({ 
  id, 
  num, 
  eyebrow, 
  title, 
  desc, 
  chips = [], 
  ctaTo, 
  ctaText, 
  reverse = false, 
  visualBackground, 
  visualSvg,
  imageSrc,
  style
}) {
  return (
    <section className={`${styles.spotlight} ${reverse ? styles.reverse : ''}`} id={id} style={style}>
      <div className={styles.wrap}>
        {(visualBackground || imageSrc) && (
          <div className={`${styles.spotVisual} reveal`} style={visualBackground ? { background: visualBackground } : {}}>
            {imageSrc ? (
              <img src={imageSrc} alt={title} className={styles.spotImg} />
            ) : (
              visualSvg
            )}
          </div>
        )}
        <div className={`${styles.spotCopy} reveal`} style={(!visualBackground && !imageSrc) ? { gridColumn: '1 / -1' } : {}}>
          <Eyebrow num={num} text={eyebrow} />
          <h2>{title}</h2>
          <p>{desc}</p>
          {chips.length > 0 && (
            <div className={styles.chipRow}>
              {chips.map((chip, idx) => (
                <Chip key={idx}>{chip}</Chip>
              ))}
            </div>
          )}
          {ctaTo && (
            <Button to={ctaTo} arrow>{ctaText}</Button>
          )}
        </div>
      </div>
    </section>
  );
}
