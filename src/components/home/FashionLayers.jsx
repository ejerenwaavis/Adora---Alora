import Button from '../ui/Button.jsx';
import styles from './FashionLayers.module.css';

const LAYERS = [
  {
    tag: 'Layer One',
    title: 'Adora Archive',
    desc: 'Curated vintage and archive pieces, sourced and reintroduced to the house edit.'
  },
  {
    tag: 'Layer Two',
    title: 'Brand Partners',
    desc: 'Established and independent labels collaborating directly with Adora & Alora.'
  },
  {
    tag: 'Layer Three',
    title: 'Raire Sellers',
    desc: 'Five rotating sellers from the Raire marketplace, refreshed monthly in-house.'
  }
];

export default function FashionLayers() {
  return (
    <section style={{ paddingBottom: '90px' }}>
      <div className="wrap">
        <div className={`reveal ${styles.fashionLayers}`}>
          {LAYERS.map((layer, idx) => (
            <div key={idx} className={styles.layerCard}>
              <span className={styles.tag}>{layer.tag}</span>
              <h4>{layer.title}</h4>
              <p>{layer.desc}</p>
            </div>
          ))}
        </div>
        <Button to="/fashion" variant="outline" arrow className="reveal">
          Discover Fashion
        </Button>
      </div>
    </section>
  );
}
