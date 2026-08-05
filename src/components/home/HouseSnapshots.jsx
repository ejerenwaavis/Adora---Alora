import Eyebrow from '../ui/Eyebrow.jsx';
import styles from './HouseSnapshots.module.css';

const DEFAULT_SNAPSHOTS = [
  {
    tag: 'CAFÉ',
    quote: '“Freshly roasted coffee, ceremonial grade matcha, and coastal dining.”',
    meta: 'Daily Ritual',
    image: '/assets/cafe-2.jpg'
  },
  {
    tag: 'MOVEMENT',
    quote: '“Morning light in the Reformer Studio before the city wakes.”',
    meta: 'Daily Practice',
    image: '/assets/movement.jpg'
  },
  {
    tag: 'FASHION',
    quote: '“Archive finds and independent labels curated inside one house.”',
    meta: 'Raire Edit',
    image: '/assets/fashion-1.jpg'
  },
  {
    tag: 'GATHERINGS',
    quote: '“Intimate long-table dinners and community evenings.”',
    meta: 'House Programming',
    image: '/assets/gathering-2.jpg'
  }
];

export default function HouseSnapshots({ snapshots = DEFAULT_SNAPSHOTS }) {
  return (
    <section className={styles.snapshotsSection}>
      <div className="wrap">
        <div className={styles.headWrap}>
          <Eyebrow text="Wall of Memory" centered />
          <h2>Snapshots of house life.</h2>
        </div>

        {/* Hanging Picture Frame Gallery Wall */}
        <div className={styles.galleryWall}>
          {snapshots.map((item, idx) => (
            <div key={idx} className={styles.frameWrap}>
              <div className={styles.nailHead} />
              
              <div className={styles.pictureFrame}>
                <div className={styles.photoContainer}>
                  <img src={item.image} alt={item.tag} className={styles.photoImg} />
                </div>
                <div className={styles.frameCaption}>
                  <span className={styles.tagPill}>{item.tag}</span>
                  <p className={styles.quoteText}>{item.quote}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
