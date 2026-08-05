import { useState } from 'react';
import Button from '../ui/Button.jsx';
import styles from './Hero.module.css';

// Default placeholder imagery for each door experience (easy to override when custom images are provided)
const DOOR_PLACEHOLDERS = {
  eat: '/assets/cafe.jpg',
  move: '/assets/movement.jpg',
  shop: '/assets/fashion-1.jpg',
  gather: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
};

export default function Hero({ doorImages = {} }) {
  const images = { ...DOOR_PLACEHOLDERS, ...doorImages };
  const [activeKeyword, setActiveKeyword] = useState('food');

  const handleTimeUpdate = (e) => {
    const time = e.target.currentTime;
    if ((time >= 1 && time < 4) || time >= 21) {
      setActiveKeyword('food');
    } else if (time >= 4 && time < 8) {
      setActiveKeyword('movement');
    } else if (time >= 8 && time < 15) {
      setActiveKeyword('fashion');
    } else if (time >= 15 && time < 21) {
      setActiveKeyword('community');
    } else {
      setActiveKeyword('food');
    }
  };

  return (
    <section className={styles.hero}>
      {/* ── Background Video Layer ── */}
      <div className={styles.videoWrap} aria-hidden="true">
        <video
          autoPlay
          loop
          muted
          playsInline
          onTimeUpdate={handleTimeUpdate}
          className={styles.bgVideo}
        >
          <source src="/assets/adora-alora-hero.mp4" type="video/mp4" />
        </video>
        <div className={styles.videoOverlay} />
      </div>

      <div className="wrap" style={{ position: 'relative', zIndex: 2 }}>
        <div className={styles.heroContent}>
          <div className={`${styles.heroScript} hero-script reveal`}>Curating Style, Creating Community</div>
          <h1 className={`${styles.heroTitle} reveal`}>
            Made for{' '}
            <span className={`${styles.keyword} ${activeKeyword === 'food' ? styles.activeKeyword : ''}`}>
              food
            </span>,{' '}
            <span className={`${styles.keyword} ${activeKeyword === 'movement' ? styles.activeKeyword : ''}`}>
              movement
            </span>,<br />
            <span className={`${styles.keyword} ${activeKeyword === 'fashion' ? styles.activeKeyword : ''}`}>
              fashion
            </span> <em>&amp;</em><br />
            <span className={`${styles.keyword} ${activeKeyword === 'community' ? styles.activeKeyword : ''}`}>
              community.
            </span>
          </h1>
          <p className={`${styles.heroSub} reveal`}>
            A Lagos lifestyle house where wellbeing, style and connection live under one roof — made by a mother and daughter, for everyday ritual.
          </p>
          <div className={`${styles.heroCtas} reveal`}>
            <Button to="/movement" arrow>Book a Class</Button>
            <Button href="#house" variant="outline" className={styles.exploreBtn}>Explore the House</Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className={styles.scrollIndicator}>
          <span>—— SCROLL</span>
        </div>

        <div className={`${styles.doorsStage} reveal`}>
          <svg viewBox="0 0 800 310" width="100%" role="img" aria-label="Illustration of four arched doorways representing Eat, Move, Shop and Gather">
            <defs>
              <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#9C8770" strokeWidth="1" opacity="0.35"/>
              </pattern>
              
              {/* Clip paths for exact arched door interior bounds */}
              <clipPath id="doorClip1">
                <path d="M103,260 V100 A47,47 0 0 1 197,100 V260 Z" />
              </clipPath>
              <clipPath id="doorClip2">
                <path d="M263,260 V100 A47,47 0 0 1 357,100 V260 Z" />
              </clipPath>
              <clipPath id="doorClip3">
                <path d="M423,260 V100 A47,47 0 0 1 517,100 V260 Z" />
              </clipPath>
              <clipPath id="doorClip4">
                <path d="M583,260 V100 A47,47 0 0 1 677,100 V260 Z" />
              </clipPath>
            </defs>
            
            {/* roofline band */}
            <rect x="40" y="10" width="720" height="26" fill="url(#hatch)"/>
            <line x1="40" y1="10" x2="760" y2="10" stroke="#2B2015" strokeWidth="1.5"/>
            <line x1="40" y1="36" x2="760" y2="36" stroke="#2B2015" strokeWidth="1.5"/>

            {/* DOOR 1: EAT */}
            <a href="#cafe" className={styles.doorLink} aria-label="Eat — Coastal Cafe">
              <g className={`${styles.doorGroup} ${styles.doorEat}`}>
                <path d="M95,260 V96 A55,55 0 0 1 205,96 V260 Z" className={styles.archFrame} fill="#F0E4CC" stroke="#2B2015" strokeWidth="2.5"/>
                <g className={styles.roomInterior}>
                  <image 
                    href={images.eat} 
                    x="103" y="53" width="94" height="207" 
                    preserveAspectRatio="xMidYMid slice" 
                    clipPath="url(#doorClip1)"
                  />
                  <path d="M103,260 V100 A47,47 0 0 1 197,100 V260 Z" fill="rgba(42, 29, 20, 0.35)" />
                  <text x="150" y="165" className={styles.enterText}>ENTER →</text>
                </g>
                <g className={styles.doorLeafWrap1}>
                  <path d="M103,260 V100 A47,47 0 0 1 197,100 V260 Z" className={styles.doorLeaf} fill="#A4451F" stroke="#2B2015" strokeWidth="1.5"/>
                  <rect x="148" y="150" width="26" height="90" fill="#F0E4CC" opacity="0.9" transform="skewY(-2)" className={styles.doorHandle}/>
                </g>
                <text x="150" y="288" className={styles.doorLabel}>EAT</text>
              </g>
            </a>

            {/* DOOR 2: MOVE */}
            <a href="#movement" className={styles.doorLink} aria-label="Move — Movement Studio">
              <g className={`${styles.doorGroup} ${styles.doorMove}`}>
                <path d="M255,260 V96 A55,55 0 0 1 365,96 V260 Z" className={styles.archFrame} fill="#F0E4CC" stroke="#2B2015" strokeWidth="2.5"/>
                <g className={styles.roomInterior}>
                  <image 
                    href={images.move} 
                    x="263" y="53" width="94" height="207" 
                    preserveAspectRatio="xMidYMid slice" 
                    clipPath="url(#doorClip2)"
                  />
                  <path d="M263,260 V100 A47,47 0 0 1 357,100 V260 Z" fill="rgba(42, 29, 20, 0.35)" />
                  <text x="310" y="165" className={styles.enterText}>ENTER →</text>
                </g>
                <g className={styles.doorLeafWrap2}>
                  <path d="M263,260 V100 A47,47 0 0 1 357,100 V260 Z" className={styles.doorLeaf} fill="#414F36" stroke="#2B2015" strokeWidth="1.5"/>
                  <rect x="308" y="150" width="26" height="90" fill="#F0E4CC" opacity="0.9" transform="skewY(-2)" className={styles.doorHandle}/>
                </g>
                <text x="310" y="288" className={styles.doorLabel}>MOVE</text>
              </g>
            </a>

            {/* DOOR 3: SHOP */}
            <a href="#fashion" className={styles.doorLink} aria-label="Shop — Fashion Edit">
              <g className={`${styles.doorGroup} ${styles.doorShop}`}>
                <path d="M415,260 V96 A55,55 0 0 1 525,96 V260 Z" className={styles.archFrame} fill="#F0E4CC" stroke="#2B2015" strokeWidth="2.5"/>
                <g className={styles.roomInterior}>
                  <image 
                    href={images.shop} 
                    x="423" y="53" width="94" height="207" 
                    preserveAspectRatio="xMidYMid slice" 
                    clipPath="url(#doorClip3)"
                  />
                  <path d="M423,260 V100 A47,47 0 0 1 517,100 V260 Z" fill="rgba(42, 29, 20, 0.35)" />
                  <text x="470" y="165" className={styles.enterText}>ENTER →</text>
                </g>
                <g className={styles.doorLeafWrap3}>
                  <path d="M423,260 V100 A47,47 0 0 1 517,100 V260 Z" className={styles.doorLeaf} fill="#C89B4A" stroke="#2B2015" strokeWidth="1.5"/>
                  <rect x="468" y="150" width="26" height="90" fill="#F0E4CC" opacity="0.9" transform="skewY(-2)" className={styles.doorHandle}/>
                </g>
                <text x="470" y="288" className={styles.doorLabel}>SHOP</text>
              </g>
            </a>

            {/* DOOR 4: GATHER */}
            <a href="#events" className={styles.doorLink} aria-label="Gather — Events">
              <g className={`${styles.doorGroup} ${styles.doorGather}`}>
                <path d="M575,260 V96 A55,55 0 0 1 685,96 V260 Z" className={styles.archFrame} fill="#F0E4CC" stroke="#2B2015" strokeWidth="2.5"/>
                <g className={styles.roomInterior}>
                  <image 
                    href={images.gather} 
                    x="583" y="53" width="94" height="207" 
                    preserveAspectRatio="xMidYMid slice" 
                    clipPath="url(#doorClip4)"
                  />
                  <path d="M583,260 V100 A47,47 0 0 1 677,100 V260 Z" fill="rgba(42, 29, 20, 0.35)" />
                  <text x="630" y="165" className={styles.enterText}>ENTER →</text>
                </g>
                <g className={styles.doorLeafWrap4}>
                  <path d="M583,260 V100 A47,47 0 0 1 677,100 V260 Z" className={styles.doorLeaf} fill="#4A3527" stroke="#2B2015" strokeWidth="1.5"/>
                  <rect x="628" y="150" width="26" height="90" fill="#F0E4CC" opacity="0.9" transform="skewY(-2)" className={styles.doorHandle}/>
                </g>
                <text x="630" y="288" className={styles.doorLabel}>GATHER</text>
              </g>
            </a>
          </svg>
          
          <p className={styles.doorsCaption}>
            FOUR RITUALS, ONE HOUSE &mdash; <em>click any door to enter</em>
          </p>
        </div>
      </div>
    </section>
  );
}
