import { Link } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', textAlign: 'center' }}>
        <div className="hero-script reveal">Curating Style, Creating Community</div>
        <h1 className="reveal">
          Made for movement,<br />food, fashion <em>&amp;</em> community.
        </h1>
        <p className={`${styles.heroSub} reveal`}>
          A Lagos lifestyle house where wellbeing, style and connection live under one roof — made by a mother and daughter, for everyday ritual.
        </p>
        <div className={`${styles.heroCtas} reveal`}>
          <Button to="/movement" arrow>Book a Class</Button>
          <Button href="#house" variant="outline">Explore the House</Button>
        </div>

        <div className={`${styles.doorsStage} reveal`}>
          <svg viewBox="0 0 900 300" width="100%" role="img" aria-label="Illustration of five arched doorways representing Move, Eat, Shop, Gather and Learn">
            <defs>
              <pattern id="hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="#9C8770" strokeWidth="1" opacity="0.35"/>
              </pattern>
            </defs>
            {/* roofline band */}
            <rect x="40" y="10" width="820" height="26" fill="url(#hatch)"/>
            <line x1="40" y1="10" x2="860" y2="10" stroke="#2B2015" strokeWidth="1.5"/>
            <line x1="40" y1="36" x2="860" y2="36" stroke="#2B2015" strokeWidth="1.5"/>

            {/* door 1: Move */}
            <g>
              <path d="M70,260 V96 A50,50 0 0 1 170,96 V260 Z" fill="#F0E4CC" stroke="#2B2015" strokeWidth="2.5"/>
              <path d="M78,260 V100 A42,42 0 0 1 162,100 V260 Z" fill="#414F36"/>
              <rect x="118" y="150" width="26" height="90" fill="#F0E4CC" opacity="0.9" transform="skewY(-2)"/>
              <text x="120" y="284" fontFamily="Jost" fontSize="11" letterSpacing="2" fill="#2B2015" textAnchor="middle">MOVE</text>
            </g>
            {/* door 2: Eat */}
            <g>
              <path d="M226,260 V96 A50,50 0 0 1 326,96 V260 Z" fill="#F0E4CC" stroke="#2B2015" strokeWidth="2.5"/>
              <path d="M234,260 V100 A42,42 0 0 1 318,100 V260 Z" fill="#A4451F"/>
              <rect x="274" y="150" width="26" height="90" fill="#F0E4CC" opacity="0.9" transform="skewY(-2)"/>
              <text x="276" y="284" fontFamily="Jost" fontSize="11" letterSpacing="2" fill="#2B2015" textAnchor="middle">EAT</text>
            </g>
            {/* door 3: Shop (center, tallest) */}
            <g>
              <path d="M382,264 V80 A64,64 0 0 1 510,80 V264 Z" fill="#F0E4CC" stroke="#2B2015" strokeWidth="2.5"/>
              <path d="M392,264 V86 A54,54 0 0 1 500,86 V264 Z" fill="#C89B4A"/>
              <rect x="432" y="160" width="28" height="104" fill="#F0E4CC" opacity="0.9" transform="skewY(-2)"/>
              <text x="446" y="288" fontFamily="Jost" fontSize="11" letterSpacing="2" fill="#2B2015" textAnchor="middle">SHOP</text>
            </g>
            {/* door 4: Gather */}
            <g>
              <path d="M566,260 V96 A50,50 0 0 1 666,96 V260 Z" fill="#F0E4CC" stroke="#2B2015" strokeWidth="2.5"/>
              <path d="M574,260 V100 A42,42 0 0 1 658,100 V260 Z" fill="#4A3527"/>
              <rect x="614" y="150" width="26" height="90" fill="#F0E4CC" opacity="0.9" transform="skewY(-2)"/>
              <text x="616" y="284" fontFamily="Jost" fontSize="11" letterSpacing="2" fill="#2B2015" textAnchor="middle">GATHER</text>
            </g>
            {/* door 5: Learn */}
            <g>
              <path d="M722,260 V96 A50,50 0 0 1 822,96 V260 Z" fill="#F0E4CC" stroke="#2B2015" strokeWidth="2.5"/>
              <path d="M730,260 V100 A42,42 0 0 1 814,100 V260 Z" fill="#B0644F"/>
              <rect x="770" y="150" width="26" height="90" fill="#F0E4CC" opacity="0.9" transform="skewY(-2)"/>
              <text x="772" y="284" fontFamily="Jost" fontSize="11" letterSpacing="2" fill="#2B2015" textAnchor="middle">LEARN</text>
            </g>
            <line x1="40" y1="264" x2="860" y2="264" stroke="#2B2015" strokeWidth="1.5"/>
          </svg>
          <div className={styles.doorsCaption}>
            Five rituals, one house <span className={styles.script}>— always open</span>
          </div>
        </div>
      </div>
    </section>
  );
}
