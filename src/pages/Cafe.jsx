import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Eyebrow from '../components/ui/Eyebrow.jsx';
import Button from '../components/ui/Button.jsx';
import ExploreDoors from '../components/home/ExploreDoors.jsx';
import styles from './Cafe.module.css';

export default function Cafe() {
  const [menuData, setMenuData] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMenuData(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Menu fetch error:', err);
        setLoading(false);
      });
  }, []);

  const categories = menuData.map(group => group.category?.name || 'Category');

  const filteredData = activeTab === 'all'
    ? menuData
    : menuData.filter(group => group.category?.name?.toLowerCase() === activeTab.toLowerCase());

  return (
    <div className={styles.cafePage}>
      {/* 1. Hero & Visual Introduction */}
      <section className={styles.hero}>
        <img src="/assets/cafe-2.jpg" alt="Adora & Alora Café" className={styles.heroBg} />
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <Eyebrow text="Coastal Culinary &amp; Coffee" centered />
          <h1>Nourish the body. Feed the soul.</h1>
          <p>
            A modern coastal dining sanctuary in Victoria Island. Serving single-origin specialty roast coffee, ceremonial Uji matcha, vibrant grain bowls, and signature Nigerian culinary touches.
          </p>
        </div>
      </section>

      {/* 2. Opening Hours & Service Format Bar */}
      <section className={styles.serviceBar}>
        <div className="wrap">
          <div className={styles.serviceGrid}>
            <div className={styles.serviceItem}>
              <h4>Service Format</h4>
              <p>Dine-In • Takeaway Bar • Walk-Ins Welcome</p>
            </div>
            <div className={styles.serviceItem}>
              <h4>Opening Hours</h4>
              <p>Mon &ndash; Fri: 6:30am &ndash; 9:00pm &bull; Sat &ndash; Sun: 8:00am &ndash; 10:00pm</p>
            </div>
            <div className={styles.serviceItem}>
              <h4>Location</h4>
              <p>14 Adetokunbo Ademola Street, Victoria Island</p>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        {/* 3. Signature Complimentary Chin Chin Experience */}
        <div className={styles.chinChinCard}>
          <div className={styles.chinChinIcon}>
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z" />
              <path d="M8 12h8M12 8v8" />
            </svg>
          </div>
          <div className={styles.chinChinText}>
            <h3>House Welcome &bull; Signature Chin Chin</h3>
            <p>
              Every seated guest at Adora &amp; Alora is greeted with our complimentary house-made Chin Chin — crisp, lightly spiced, and prepared daily. Artisanal packaged Chin Chin jars are also available at reception for takeaway.
            </p>
          </div>
        </div>

        {/* 4. Menu Section (CMS Driven) */}
        <section className={styles.menuSection} id="menu">
          <div className={styles.menuHeader}>
            <Eyebrow text="Daily Offerings" centered />
            <h2>The Café Menu</h2>
          </div>

          {/* Category Tabs */}
          <div className={styles.categoryTabs}>
            <button
              onClick={() => setActiveTab('all')}
              className={`${styles.tabBtn} ${activeTab === 'all' ? styles.tabBtnActive : ''}`}
            >
              All Offerings
            </button>
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(cat)}
                className={`${styles.tabBtn} ${activeTab.toLowerCase() === cat.toLowerCase() ? styles.tabBtnActive : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          {loading ? (
            <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--taupe)' }}>Loading menu offerings...</p>
          ) : (
            filteredData.map((group, idx) => (
              <div key={idx} className={styles.categoryBlock}>
                <h3 className={styles.categoryTitle}>
                  <span className={styles.categoryIcon}>{group.category?.icon}</span>
                  {group.category?.name}
                </h3>

                <div className={styles.menuGrid}>
                  {group.items?.map((item, itemIdx) => (
                    <div key={itemIdx} className={styles.menuItemCard}>
                      <div className={styles.itemHeader}>
                        <h4 className={styles.itemName}>{item.name}</h4>
                        <span className={styles.itemPrice}>{item.price}</span>
                      </div>
                      <p className={styles.itemDesc}>{item.description}</p>
                      
                      <div className={styles.itemBadges}>
                        {item.badge && <span className={styles.badgePill}>{item.badge}</span>}
                        {item.dietaryTags?.map((tag, tIdx) => (
                          <span key={tIdx} className={styles.dietPill}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* 5. Dietary Markers & Allergen Notice */}
          <div className={styles.dietaryNotice}>
            <strong>Dietary Legend:</strong> [VG] Vegan &bull; [V] Vegetarian &bull; [GF] Gluten-Free &bull; [DF] Dairy-Free &bull; [N] Contains Nuts<br />
            <span style={{ fontSize: '12px', color: 'var(--taupe)', marginTop: '4px', display: 'inline-block' }}>
              Please inform your host of any severe food allergies prior to placing your order.
            </span>
          </div>

          {/* 6. Takeaway & Private Hire Banner */}
          <div className={styles.hireBanner}>
            <div className={styles.hireText}>
              <h3>Private Breakfasts &amp; Celebrations</h3>
              <p>Host private brunches, brand activations, or group coffee masterclasses at The Café &amp; The Loft.</p>
            </div>
            <Button to="/venue-hire">Enquire About Venue Hire &rarr;</Button>
          </div>
        </section>
      </div>

      {/* 7. Explore Doors */}
      <ExploreDoors />
    </div>
  );
}
