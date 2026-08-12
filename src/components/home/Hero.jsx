import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Hero.module.css';

const words = ['movement,', 'food,', 'fashion,', 'community.'];
const INTERVAL = 2800;
const TICK = 60;

export default function Hero({ imageSrc }) {
  const trackRef = useRef(null);
  const windowRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const [fills, setFills] = useState([0, 0, 0, 0]);
  const jumpToIdxRef = useRef(null);

  useEffect(() => {
    let currentIdx = 0;
    let elapsed = 0;
    let fillTimer = null;
    let transitioning = false;

    function getWordHeight() {
      return windowRef.current ? windowRef.current.offsetHeight : 64;
    }

    function advance() {
      if(transitioning) return;
      transitioning = true;
      elapsed = 0;

      const next = (currentIdx + 1) % words.length;
      const h = getWordHeight();

      if (trackRef.current) {
        trackRef.current.style.transition = 'transform 0.6s cubic-bezier(0.77,0,0.18,1)';
        trackRef.current.style.transform = `translateY(-${(currentIdx + 1) * h}px)`;
      }

      setTimeout(() => {
        if(next === 0 && trackRef.current) {
          trackRef.current.style.transition = 'none';
          trackRef.current.style.transform = 'translateY(0)';
          void trackRef.current.offsetHeight;
        }
        currentIdx = next;
        setCurrent(next);
        setFills(prev => prev.map(() => 0));
        transitioning = false;
      }, 620);
    }

    function tick() {
      elapsed += TICK;
      const pct = Math.min((elapsed / INTERVAL) * 100, 100);
      setFills(prev => {
        const newFills = [...prev];
        newFills[currentIdx] = pct;
        return newFills;
      });
      if (elapsed >= INTERVAL) {
        advance();
      }
    }

    jumpToIdxRef.current = (idx) => {
      if (idx === currentIdx || transitioning) return;
      
      clearInterval(fillTimer);
      elapsed = 0;
      setFills(prev => {
        const newFills = [...prev];
        newFills[currentIdx] = 0;
        return newFills;
      });

      const h = getWordHeight();
      if (trackRef.current) {
        trackRef.current.style.transition = 'transform 0.6s cubic-bezier(0.77,0,0.18,1)';
        trackRef.current.style.transform = `translateY(-${idx * h}px)`;
      }
      
      transitioning = true;
      setTimeout(() => {
        currentIdx = idx;
        setCurrent(idx);
        transitioning = false;
        fillTimer = setInterval(tick, TICK);
      }, 640);
    };

    const startTimeout = setTimeout(() => {
      fillTimer = setInterval(tick, TICK);
    }, 300);

    return () => {
      clearTimeout(startTimeout);
      if (fillTimer) clearInterval(fillTimer);
    };
  }, []);

  return (
    <section className={styles.hero}>
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
        
        <div className={styles.wordProgress}>
          {words.map((_, idx) => (
            <div 
              key={idx} 
              className={`${styles.progressPip} ${current === idx ? styles.progressPipActive : ''}`}
              onClick={() => jumpToIdxRef.current && jumpToIdxRef.current(idx)}
              style={{ cursor: 'pointer' }}
            >
              <div 
                className={styles.progressFill} 
                style={{ height: `${fills[idx] || 0}%` }}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
