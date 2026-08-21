import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Eyebrow from '../components/ui/Eyebrow.jsx';
import Button from '../components/ui/Button.jsx';
import PageHeader from '../components/ui/PageHeader';
import ExploreDoors from '../components/home/ExploreDoors.jsx';
import styles from './Cafe.module.css';

export default function Cafe() {
  const [menuData, setMenuData] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [activeItem, setActiveItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMobileModal, setShowMobileModal] = useState(false);

  useEffect(() => {
    fetch('/api/menu')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMenuData(data);
          // Set initial active item
          if (data.length > 0 && data[0].items?.length > 0) {
            setActiveItem({ ...data[0].items[0], categoryName: data[0].category?.name });
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Menu fetch error:', err);
        setLoading(false);
      });
  }, []);

  const categories = menuData.map(group => group.category?.name || 'Category');

  // Flatten for the new layout
  const allItems = menuData.flatMap(group => 
    group.items?.map(item => ({ ...item, categoryName: group.category?.name || 'Category' })) || []
  );

  const filteredItems = activeTab === 'all'
    ? allItems
    : allItems.filter(item => item.categoryName?.toLowerCase() === activeTab.toLowerCase());

  const handleTabClick = (catName) => {
    setActiveTab(catName);
    const newFiltered = catName === 'all' 
      ? allItems 
      : allItems.filter(item => item.categoryName?.toLowerCase() === catName.toLowerCase());
    
    // Auto-select first item of the new category if current activeItem is not in it
    if (newFiltered.length > 0 && (!activeItem || !newFiltered.find(i => i._id === activeItem._id))) {
      setActiveItem(newFiltered[0]);
    }
  };

  return (
    <div className={styles.cafePage}>
      {/* 1. Unified Hero */}
      <PageHeader 
        eyebrow="Coastal Culinary &amp; Coffee"
        title="Nourish the body. Feed the soul."
        description="A modern coastal dining sanctuary in Victoria Island. Serving single-origin specialty roast coffee, ceremonial Uji matcha, vibrant grain bowls, and signature Nigerian culinary touches."
      />
      
      <div className={styles.cafeHeroImageWrapper}>
        <img src="/assets/cafe-2.jpg" alt="Aora House Café" className={styles.cafeHeroImg} />
      </div>

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
              Every seated guest at Aora House is greeted with our complimentary house-made Chin Chin — crisp, lightly spiced, and prepared daily. Artisanal packaged Chin Chin jars are also available at reception for takeaway.
            </p>
          </div>
        </div>

        {/* 4. Menu Section (CMS Driven - World Class Redesign) */}
        <section className={styles.cm} id="menu">
          
          <div className={styles.cmHeader}>
            <div className={styles.cmTitleBlock}>
              <div className={styles.cmEyebrow}>The Café at Aora House</div>
              <div className={styles.cmTitle}>What's <em>on</em> today.</div>
            </div>
            
            <div className={styles.cmCats}>
              <button
                onClick={() => handleTabClick('all')}
                className={`${styles.cmCat} ${activeTab === 'all' ? styles.cmCatOn : ''}`}
              >
                All
              </button>
              {categories.map((cat, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTabClick(cat)}
                  className={`${styles.cmCat} ${activeTab.toLowerCase() === cat.toLowerCase() ? styles.cmCatOn : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.cmDivider}></div>

          {loading ? (
             <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--taupe)' }}>Loading menu offerings...</p>
          ) : (
            <div className={styles.cmStage}>
              {/* LEFT SIDE: GRID */}
              <div className={styles.cmGridWrap}>
                <div className={styles.cmGrid}>
                  {filteredItems.map((item, idx) => {
                    const isFeat = idx === 0 && item.isSignature; // Make first item featured if it's a signature
                    const isActive = activeItem?._id === item._id;
                    
                    return (
                      <div 
                        key={item._id || idx}
                        className={`${styles.cmCard} ${isFeat ? styles.cmCardFeatured : ''} ${styles.fadeIn}`}
                        onClick={() => {
                          setActiveItem(item);
                          setShowMobileModal(true);
                        }}
                        style={{ outline: isActive ? '2px solid var(--rust)' : 'none', outlineOffset: '-2px' }}
                      >
                        <div className={styles.cmCardImg}>
                          {item.image ? (
                            <img src={item.image} alt={item.name} className={styles.cmCardImgInner} loading="lazy" />
                          ) : (
                            <div className={styles.cmCardImgInner} style={{ background: 'linear-gradient(135deg, var(--taupe), var(--cocoa-deep))' }} />
                          )}
                          {item.badge && <span className={styles.cmBadge}>{item.badge}</span>}
                        </div>
                        <div className={styles.cmCardBody}>
                          <div className={styles.cmCardCat}>{item.categoryName}</div>
                          <div className={styles.cmCardName}>{item.name}</div>
                          <div className={styles.cmCardFoot}>
                            <div className={styles.cmPrice}>{item.priceKobo ? `₦${(item.priceKobo / 100).toLocaleString()}` : item.price || ''} <span>naira</span></div>
                            <div className={styles.cmArrow}>&rarr;</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* HOUSE WELCOME CHIN CHIN */}
                <div className={styles.cmChinChin}>
                  <div className={styles.cmCcLeft}>
                    <div className={styles.cmCcTag}>House welcome</div>
                    <div className={styles.cmCcName}>Complimentary Chin Chin</div>
                    <div className={styles.cmCcDesc}>Served to every seated guest — our house greeting, made fresh daily.</div>
                  </div>
                  <Link to="/visit" className={styles.cmCcPill}>Also available to take home &rarr;</Link>
                </div>
              </div>

              {/* RIGHT SIDE: PANEL */}
              {activeItem && (
                <div className={`${styles.cmPanel} ${showMobileModal ? styles.cmPanelMobileOpen : ''}`}>
                  <button className={styles.cmPanelClose} onClick={() => setShowMobileModal(false)}>✕</button>
                  <div className={styles.cmPanelImg}>
                    <div className={styles.cmPanelGlow}></div>
                    {activeItem.image ? (
                      <img src={activeItem.image} alt={activeItem.name} className={styles.cmPanelImgInner} />
                    ) : (
                      <div className={styles.cmPanelImgInner} style={{ background: 'linear-gradient(160deg, var(--cocoa), #1E0F06)' }} />
                    )}
                  </div>
                  <div className={styles.cmPanelBody}>
                    <div className={styles.cmPanelCat}>{activeItem.categoryName}</div>
                    <div className={styles.cmPanelName}>{activeItem.name}</div>
                    <div className={styles.cmPanelDesc}>{activeItem.description}</div>
                    
                    <div className={styles.cmPanelPriceRow}>
                      <div className={styles.cmPanelPrice}>{activeItem.priceKobo ? `₦${(activeItem.priceKobo / 100).toLocaleString()}` : activeItem.price || ''}</div>
                      <div className={styles.cmPanelAvail}>Available now</div>
                    </div>

                    {activeItem.dietaryTags && activeItem.dietaryTags.length > 0 && (
                      <div className={styles.cmPanelDietary}>
                        {activeItem.dietaryTags.map((tag, tIdx) => (
                          <span key={tIdx} className={styles.cmPanelDtag}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Dietary Markers & Allergen Notice */}
          <div className={styles.dietaryNotice} style={{ marginTop: '60px' }}>
            <strong>Dietary Legend:</strong> [VG] Vegan &bull; [V] Vegetarian &bull; [GF] Gluten-Free &bull; [DF] Dairy-Free &bull; [N] Contains Nuts<br />
            <span style={{ fontSize: '12px', color: 'var(--taupe)', marginTop: '4px', display: 'inline-block' }}>
              Please inform your host of any severe food allergies prior to placing your order.
            </span>
          </div>

          {/* 6. Takeaway & Private Hire Banner */}
          <div className={styles.hireBanner}>
            <div className={styles.hireText}>
              <h3 style={{ fontSize: '26px', marginBottom: '8px' }}>Private Breakfasts &amp; Celebrations</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--cocoa)', fontWeight: 300 }}>Host private brunches, brand activations, or group coffee masterclasses at The Café &amp; The Loft.</p>
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
