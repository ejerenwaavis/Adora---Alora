import Button from '../ui/Button.jsx';
import styles from './Hero.module.css';

// Default placeholder imagery for each door experience (easy to override when custom images are provided)
const DOOR_PLACEHOLDERS = {
  move: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80',
  eat: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=400&q=80',
  shop: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=400&q=80',
  gather: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
  learn: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80',
};

export default function Hero({ doorImages = {} }) {
  const images = { ...DOOR_PLACEHOLDERS, ...doorImages };

  return (
    <section className={styles.hero}>
      {/* ── Background Video Layer ── */}
      <div className={styles.videoWrap} aria-hidden="true">
        <video
          autoPlay
          loop
          muted
          playsInline
          className={styles.bgVideo}
        >
          <source src="/assets/hero-bg-2-720.mp4" type="video/mp4" />
        </video>
        <div className={styles.videoOverlay} />
      </div>

      <div className="wrap" style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1fr', gap: '10px', textAlign: 'center' }}>
        <div className={`${styles.heroScript} hero-script reveal`}>Curating Style, Creating Community</div>
        <h1 className={`${styles.heroTitle} reveal`}>
          Made for movement,<br />food, fashion <em>&amp;</em> community.
        </h1>
        <p className={`${styles.heroSub} reveal`}>
          A Lagos lifestyle house where wellbeing, style and connection live under one roof — made by a mother and daughter, for everyday ritual.
        </p>
        <div className={`${styles.heroCtas} reveal`}>
          <Button to="/movement" arrow>Book a Class</Button>
          <Button href="#house" variant="outline" className={styles.exploreBtn}>Explore the House</Button>
        </div>

        <div className={`${styles.doorsStage} reveal`}>
          <svg viewBox="0 0 900 310" width="100%" role="img" aria-label="Illustration of five arched doorways representing Move, Eat, Shop, Gather and Learn">
            <defs>
              <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#9C8770" strokeWidth="1" opacity="0.35"/>
              </pattern>
              
              {/* Clip paths for exact arched door interior bounds */}
              <clipPath id="doorClip1">
                <path d="M78,260 V100 A42,42 0 0 1 162,100 V260 Z" />
              </clipPath>
              <clipPath id="doorClip2">
                <path d="M234,260 V100 A42,42 0 0 1 318,100 V260 Z" />
              </clipPath>
              <clipPath id="doorClip3">
                <path d="M392,264 V86 A54,54 0 0 1 500,86 V264 Z" />
              </clipPath>
              <clipPath id="doorClip4">
                <path d="M574,260 V100 A42,42 0 0 1 658,100 V260 Z" />
              </clipPath>
              <clipPath id="doorClip5">
                <path d="M730,260 V100 A42,42 0 0 1 814,100 V260 Z" />
              </clipPath>
            </defs>
            
            {/* roofline band */}
            <rect x="40" y="10" width="820" height="26" fill="url(#hatch)"/>
            <line x1="40" y1="10" x2="860" y2="10" stroke="#2B2015" strokeWidth="1.5"/>
            <line x1="40" y1="36" x2="860" y2="36" stroke="#2B2015" strokeWidth="1.5"/>

            {/* DOOR 1: MOVE */}
            <a href="#movement" className={styles.doorLink} aria-label="Move — Movement Studio">
              <g className={`${styles.doorGroup} ${styles.doorMove}`}>
                <path d="M70,260 V96 A50,50 0 0 1 170,96 V260 Z" className={styles.archFrame} fill="#F0E4CC" stroke="#2B2015" strokeWidth="2.5"/>
                
                {/* Image Interior */}
                <g className={styles.roomInterior}>
                  <image 
                    href={images.move} 
                    x="78" y="58" width="84" height="202" 
                    preserveAspectRatio="xMidYMid slice" 
                    clipPath="url(#doorClip1)"
                  />
                  <path d="M78,260 V100 A42,42 0 0 1 162,100 V260 Z" fill="rgba(42, 29, 20, 0.35)" />
                  <text x="120" y="165" className={styles.enterText}>ENTER →</text>
                </g>

                {/* Swinging Door Leaf */}
                <g className={styles.doorLeafWrap1}>
                  <path d="M78,260 V100 A42,42 0 0 1 162,100 V260 Z" className={styles.doorLeaf} fill="#414F36" stroke="#2B2015" strokeWidth="1.5"/>
                  <rect x="118" y="150" width="26" height="90" fill="#F0E4CC" opacity="0.9" transform="skewY(-2)" className={styles.doorHandle}/>
                </g>
                <text x="120" y="288" className={styles.doorLabel}>MOVE</text>
              </g>
            </a>

            {/* DOOR 2: EAT */}
            <a href="#cafe" className={styles.doorLink} aria-label="Eat — Coastal Cafe">
              <g className={`${styles.doorGroup} ${styles.doorEat}`}>
                <path d="M226,260 V96 A50,50 0 0 1 326,96 V260 Z" className={styles.archFrame} fill="#F0E4CC" stroke="#2B2015" strokeWidth="2.5"/>
                <g className={styles.roomInterior}>
                  <image 
                    href={images.eat} 
                    x="234" y="58" width="84" height="202" 
                    preserveAspectRatio="xMidYMid slice" 
                    clipPath="url(#doorClip2)"
                  />
                  <path d="M234,260 V100 A42,42 0 0 1 318,100 V260 Z" fill="rgba(42, 29, 20, 0.35)" />
                  <text x="276" y="165" className={styles.enterText}>ENTER →</text>
                </g>
                <g className={styles.doorLeafWrap2}>
                  <path d="M234,260 V100 A42,42 0 0 1 318,100 V260 Z" className={styles.doorLeaf} fill="#A4451F" stroke="#2B2015" strokeWidth="1.5"/>
                  <rect x="274" y="150" width="26" height="90" fill="#F0E4CC" opacity="0.9" transform="skewY(-2)" className={styles.doorHandle}/>
                </g>
                <text x="276" y="288" className={styles.doorLabel}>EAT</text>
              </g>
            </a>

            {/* DOOR 3: SHOP */}
            <a href="#fashion" className={styles.doorLink} aria-label="Shop — Fashion Edit">
              <g className={`${styles.doorGroup} ${styles.doorShop}`}>
                <path d="M382,264 V80 A64,64 0 0 1 510,80 V264 Z" className={styles.archFrame} fill="#F0E4CC" stroke="#2B2015" strokeWidth="2.5"/>
                <g className={styles.roomInterior}>
                  <image 
                    href={images.shop} 
                    x="392" y="32" width="108" height="232" 
                    preserveAspectRatio="xMidYMid slice" 
                    clipPath="url(#doorClip3)"
                  />
                  <path d="M392,264 V86 A54,54 0 0 1 500,86 V264 Z" fill="rgba(42, 29, 20, 0.35)" />
                  <text x="446" y="165" className={styles.enterText}>ENTER →</text>
                </g>
                <g className={styles.doorLeafWrap3}>
                  <path d="M392,264 V86 A54,54 0 0 1 500,86 V264 Z" className={styles.doorLeaf} fill="#C89B4A" stroke="#2B2015" strokeWidth="1.5"/>
                  <rect x="432" y="160" width="28" height="104" fill="#F0E4CC" opacity="0.9" transform="skewY(-2)" className={styles.doorHandle}/>
                </g>
                <text x="446" y="292" className={styles.doorLabel}>SHOP</text>
              </g>
            </a>

            {/* DOOR 4: GATHER */}
            <a href="#events" className={styles.doorLink} aria-label="Gather — Events">
              <g className={`${styles.doorGroup} ${styles.doorGather}`}>
                <path d="M566,260 V96 A50,50 0 0 1 666,96 V260 Z" className={styles.archFrame} fill="#F0E4CC" stroke="#2B2015" strokeWidth="2.5"/>
                <g className={styles.roomInterior}>
                  <image 
                    href={images.gather} 
                    x="574" y="58" width="84" height="202" 
                    preserveAspectRatio="xMidYMid slice" 
                    clipPath="url(#doorClip4)"
                  />
                  <path d="M574,260 V100 A42,42 0 0 1 658,100 V260 Z" fill="rgba(42, 29, 20, 0.35)" />
                  <text x="616" y="165" className={styles.enterText}>ENTER →</text>
                </g>
                <g className={styles.doorLeafWrap4}>
                  <path d="M574,260 V100 A42,42 0 0 1 658,100 V260 Z" className={styles.doorLeaf} fill="#4A3527" stroke="#2B2015" strokeWidth="1.5"/>
                  <rect x="614" y="150" width="26" height="90" fill="#F0E4CC" opacity="0.9" transform="skewY(-2)" className={styles.doorHandle}/>
                </g>
                <text x="616" y="288" className={styles.doorLabel}>GATHER</text>
              </g>
            </a>

            {/* DOOR 5: LEARN */}
            <a href="#venue" className={styles.doorLink} aria-label="Learn — Venue & Loft">
              <g className={`${styles.doorGroup} ${styles.doorLearn}`}>
                <path d="M722,260 V96 A50,50 0 0 1 822,96 V260 Z" className={styles.archFrame} fill="#F0E4CC" stroke="#2B2015" strokeWidth="2.5"/>
                <g className={styles.roomInterior}>
                  <image 
                    href={images.learn} 
                    x="730" y="58" width="84" height="202" 
                    preserveAspectRatio="xMidYMid slice" 
                    clipPath="url(#doorClip5)"
                  />
                  <path d="M730,260 V100 A42,42 0 0 1 814,100 V260 Z" fill="rgba(42, 29, 20, 0.35)" />
                  <text x="772" y="165" className={styles.enterText}>ENTER →</text>
                </g>
                <g className={styles.doorLeafWrap5}>
                  <path d="M730,260 V100 A42,42 0 0 1 814,100 V260 Z" className={styles.doorLeaf} fill="#B0644F" stroke="#2B2015" strokeWidth="1.5"/>
                  <rect x="770" y="150" width="26" height="90" fill="#F0E4CC" opacity="0.9" transform="skewY(-2)" className={styles.doorHandle}/>
                </g>
                <text x="772" y="288" className={styles.doorLabel}>LEARN</text>
              </g>
            </a>

            <line x1="40" y1="264" x2="860" y2="264" stroke="#2B2015" strokeWidth="1.5"/>
          </svg>
          
          <div className={styles.doorsCaption}>
            Five rituals, one house <span className={styles.script}>— click any door to enter</span>
          </div>
        </div>
      </div>
    </section>
  );
}
