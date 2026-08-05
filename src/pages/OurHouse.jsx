import SectionHead from '../components/ui/SectionHead';
import ExploreDoors from '../components/home/ExploreDoors';
import styles from './OurHouse.module.css';

export default function OurHouse() {
  return (
    <div className={styles.container}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className="wrap">
          <div className="eyebrow centered">02 / Our House</div>
          <h1 className={styles.heroTitle}>A sanctuary for intentional living in Lagos.</h1>
          <p className={styles.heroSubtitle}>
            Adora &amp; Alora is a multi-disciplinary house uniting Movement, Coastal Culinary, Curated Fashion, and Collaborative Spaces under one architectural roof.
          </p>
        </div>
      </section>

      {/* ── Story Section ── */}
      <section className={styles.storySection}>
        <div className="wrap">
          <div className={styles.storyGrid}>
            <div>
              <div className="eyebrow" style={{ marginBottom: '1rem' }}>Our Philosophy</div>
              <h2 className={styles.storyLead}>
                Founded on the belief that physical vitality, aesthetic beauty, and genuine human connection belong together.
              </h2>
              <div className={styles.quoteBlock}>
                <p>&ldquo;We designed Adora &amp; Alora as a breath of fresh air—a space where you can start your morning in mindful motion and stay through the afternoon surrounded by warmth.&rdquo;</p>
                <span>Founders&apos; Note</span>
              </div>
            </div>

            <div className={styles.storyBody}>
              <p>
                In a fast-moving world, our house offers a tactile pause. Designed with natural textures, limestone tones, and warm timber, every corner reflects our commitment to slow, intentional luxury.
              </p>
              <p>
                Whether you arrive for a high-precision Reformer class, a bowl of coastal fare at the café, or to browse an archive fashion piece, Adora &amp; Alora is curated to feel like an extension of home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── House Pillars ── */}
      <section className={styles.pillarsSection}>
        <div className="wrap">
          <SectionHead
            eyebrow="The Four Pillars"
            title="Designed for rhythm, movement &amp; rest."
          />

          <div className={styles.pillarsGrid}>
            <div className={styles.pillarCard}>
              <div className={styles.pillarNum}>01</div>
              <h3>Movement</h3>
              <p>Reformer Pilates, Lagree, and Strength training. Built for alignment, posture, and longevity.</p>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarNum}>02</div>
              <h3>Café</h3>
              <p>Nourishing coastal bowls, ceremonial matcha, and specialty roast coffee crafted for daily ritual.</p>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarNum}>03</div>
              <h3>Fashion</h3>
              <p>A rotating edit of vintage archives, independent global labels, and emerging Nigerian designers.</p>
            </div>

            <div className={styles.pillarCard}>
              <div className={styles.pillarNum}>04</div>
              <h3>The Loft &amp; Spaces</h3>
              <p>Architectural venue spaces crafted for gatherings, private events, pop-ups, and creative thought.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Wall of Memory ── */}
      <section className={styles.memorySection}>
        <div className="wrap">
          <SectionHead
            eyebrow="Wall of Memory"
            title="Snapshots of house life."
          />

          <div className={styles.memoryGrid}>
            <div className={styles.memoryCard}>
              <div>
                <div className={styles.memoryTag}>Architecture</div>
                <div className={styles.memoryText}>&ldquo;Sunlight through high arches and custom brass detailing.&rdquo;</div>
              </div>
              <div className={styles.memoryMeta}>Lagos House • 2026</div>
            </div>

            <div className={styles.memoryCard}>
              <div>
                <div className={styles.memoryTag}>Gatherings</div>
                <div className={styles.memoryText}>&ldquo;Intimate long-table dinners hosted inside The Loft.&rdquo;</div>
              </div>
              <div className={styles.memoryMeta}>House Programming</div>
            </div>

            <div className={styles.memoryCard}>
              <div>
                <div className={styles.memoryTag}>Movement</div>
                <div className={styles.memoryText}>&ldquo;Morning light in the Reformer Studio before the city wakes.&rdquo;</div>
              </div>
              <div className={styles.memoryMeta}>Daily Practice</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Explore Doors ── */}
      <ExploreDoors />
    </div>
  );
}
