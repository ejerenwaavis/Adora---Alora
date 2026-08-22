import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './HeroPanoramic.module.css';

const words = ['community.', 'movement,', 'food,', 'fashion,'];
const INTERVAL = 3400;

export default function HeroPanoramic({ imageSrc }) {
  const trackRef = useRef(null);
  const windowRef = useRef(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let currentIdx = 0;
    let transitioning = false;

    function getWordHeight() {
      return windowRef.current ? windowRef.current.offsetHeight : 64;
    }

    function advance() {
      if (transitioning) return;
      transitioning = true;

      const next = (currentIdx + 1) % words.length;
      const h = getWordHeight();

      if (trackRef.current) {
        trackRef.current.style.transition = 'transform 0.65s cubic-bezier(0.77, 0, 0.18, 1)';
        trackRef.current.style.transform = `translateY(-${(currentIdx + 1) * h}px)`;
      }

      setTimeout(() => {
        if (next === 0 && trackRef.current) {
          trackRef.current.style.transition = 'none';
          trackRef.current.style.transform = 'translateY(0)';
          void trackRef.current.offsetHeight;
        }
        currentIdx = next;
        setCurrent(next);
        transitioning = false;
      }, 660);
    }

    const intervalTimer = setInterval(advance, INTERVAL);

    return () => {
      clearInterval(intervalTimer);
    };
  }, []);

  const heroImage = imageSrc || '/assets/hero-house-architectural.jpg';

  return (
    <section className={styles.heroSection}>
      {/* Background Image Layer with Slow Ken-Burns Zoom Animation */}
      <div className={styles.heroBgContainer}>
        <img
          src={heroImage}
          alt="Aora House Architecture and Living Room"
          className={styles.heroBgImg}
        />
        {/* Natural Ambient Wash */}
        <div className={styles.heroGradientOverlay}></div>
      </div>

      {/* Hero Content Overlay */}
      <div className={styles.heroInner}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Curating style, creating community</span>
          
          <h1 className={styles.heroHeadline}>
            <span className={styles.staticLine}>A lifestyle house for</span>
            <div className={styles.reelRow}>
              <div className={styles.reelWindow} ref={windowRef}>
                <div className={styles.reelTrack} ref={trackRef}>
                  {words.map((word, i) => (
                    <span key={i} className={styles.reelWord}>{word}</span>
                  ))}
                  <span className={styles.reelWord}>{words[0]}</span>
                </div>
              </div>
            </div>
          </h1>

          <p className={styles.heroDesc}>
            Made in Lagos by a mother and daughter, Aora House brings together the rituals that make everyday life feel fuller.
          </p>

          <div className={styles.heroActions}>
            <Link to="/movement" className={`${styles.btn} ${styles.btnSolid}`}>
              Book a Class
            </Link>
            <a href="#house" className={`${styles.btn} ${styles.btnOutline}`}>
              Explore the House
            </a>
          </div>
        </div>
      </div>

      {/* Photography Caption */}
      <div className={styles.heroMetaBar}>
        <div className={styles.heroCaption}>
          photography — Aora House living room, lounge & courtyard
        </div>
      </div>
    </section>
  );
}
