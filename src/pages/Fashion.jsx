import React, { useState, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import FashionCheckoutModal from '../components/FashionCheckoutModal';
import styles from './Fashion.module.css';

// Utility to determine if a color is light or dark to set text contrast
function getLuminance(hex) {
  if (!hex) return 0.5;
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  const a = [r, g, b].map(v => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export default function Fashion() {
  const [data, setData] = useState([]);
  const [activeLayer, setActiveLayer] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [loading, setLoading] = useState(true);
  const [displayItem, setDisplayItem] = useState(null);
  const [displayImageIndex, setDisplayImageIndex] = useState(0);
  const [animState, setAnimState] = useState('idle');
  const [showCatalog, setShowCatalog] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    fetch('/api/fashion')
      .then(res => res.json())
      .then(json => {
        setData(json);
        if (json.length > 0) {
          setActiveLayer(json[0].layer);
          if (json[0].items && json[0].items.length > 0) {
            setActiveItem(json[0].items[0]);
            setSelectedSize(json[0].items[0].sizes?.[0] || '');
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch fashion data', err);
        setLoading(false);
      });
  }, []);

  const handleTabClick = (layerObj) => {
    setActiveLayer(layerObj.layer);
    setShowCatalog(false); // Reset catalog view when switching tabs
    setIsExpanded(false);
    if (layerObj.items && layerObj.items.length > 0) {
      setActiveItem(layerObj.items[0]);
      setDisplayItem(layerObj.items[0]);
      setDisplayImageIndex(0);
      setSelectedSize(layerObj.items[0].sizes?.[0] || '');
    } else {
      setActiveItem(null);
      setDisplayItem(null);
      setDisplayImageIndex(0);
      setSelectedSize('');
    }
  };

  const currentLayerData = data.find(d => d.layer._id === activeLayer?._id);
  const items = currentLayerData ? currentLayerData.items : [];

  // Dynamic colors
  const primaryColor = activeItem?.colors?.[0] || '#111111';
  const luminance = getLuminance(primaryColor);
  const isLightColor = luminance > 0.5;
  
  // High contrast text mapping
  const textColor = isLightColor ? '#1a1a1a' : '#ffffff';
  const inverseTextColor = isLightColor ? '#ffffff' : '#1a1a1a';
  const textColorMuted = isLightColor ? 'rgba(20,20,20,0.6)' : 'rgba(220,203,178,0.7)';
  const borderMuted = isLightColor ? 'rgba(20,20,20,0.2)' : 'rgba(220,203,178,0.2)';
  const bgMuted = isLightColor ? 'rgba(20,20,20,0.05)' : 'rgba(220,203,178,0.1)';

  const bgGradient = isLightColor 
    ? `linear-gradient(160deg, ${primaryColor} 0%, rgba(240,240,240,0.9) 50%, rgba(220,220,220,0.95) 100%)`
    : `linear-gradient(160deg, ${primaryColor} 0%, rgba(20,20,20,0.9) 50%, rgba(10,10,10,0.95) 100%)`;

  const triggerItemChange = (item) => {
    if (activeItem?._id === item._id) return;
    
    // Update the shell state immediately for background change
    setActiveItem(item);
    setIsExpanded(false);
    setSelectedSize(item.sizes?.[0] || '');
    
    // Animate the image out, then update image, then animate in
    setAnimState('out');
    setTimeout(() => {
      setDisplayItem(item);
      setDisplayImageIndex(0); // Reset to first image
      setAnimState('in');
      setTimeout(() => setAnimState('idle'), 500);
    }, 400); // Wait for flyOut to complete
  };

  const formatPrice = (kobo) => {
    const naira = Math.round((kobo || 0) / 100);
    return `₦${naira.toLocaleString()}`; // e.g. ₦129,000
  };

  if (loading) {
    return <div style={{ padding: '120px', textAlign: 'center', color: '#111', background: '#F6EEE0', minHeight: '100vh' }}>Loading collections...</div>;
  }

  // Use a fallback for the very first load when animating
  const currentRenderItem = displayItem || activeItem;

  return (
    <div className={styles.fashionPage}>
      <PageHeader 
        eyebrow="The Boutique"
        title="Elevated Everyday."
      />
      <div className={styles.contentWrap}>
        {activeItem ? (
          <>
            <div 
              className={styles.vcShell}
              style={{ 
                '--accent-color': primaryColor,
                '--bg-gradient': bgGradient,
                '--text-color': textColor,
                '--inverse-text-color': inverseTextColor,
                '--text-muted': textColorMuted,
                '--border-muted': borderMuted,
                '--bg-muted': bgMuted
              }}
            >
              <div className={styles.vcGlow} />
              <div className={styles.vcGlow2} />
              
              <div className={styles.vcTabs}>
                {data.map((d) => (
                  <button 
                    key={d.layer._id}
                    className={`${styles.vcTab} ${activeLayer?._id === d.layer._id ? styles.vcTabActive : ''}`}
                    onClick={() => handleTabClick(d)}
                  >
                    {d.layer.name}
                  </button>
                ))}
              </div>

              <div className={styles.vcBody}>
                {/* Mobile Title Block */}
                <div className={styles.vcMobileTitle}>
                  <div className={styles.vcSeller}>{currentRenderItem?.brand || currentRenderItem?.sellerName} — Adora Archive</div>
                  <h2 className={styles.vcName}>{currentRenderItem?.name}</h2>
                </div>

                {/* Left Column: Info */}
                <div className={styles.vcInfo}>
                  <div className={styles.vcDesktopTitle}>
                    <div className={styles.vcSeller}>{currentRenderItem?.brand || currentRenderItem?.sellerName} — Adora Archive</div>
                    <h2 className={styles.vcName}>{currentRenderItem?.name}</h2>
                  </div>
                  <p className={styles.vcDesc}>
                    {(() => {
                      const desc = currentRenderItem?.description || '';
                      const isLong = desc.length > 95;
                      if (!isLong) return desc;
                      return (
                        <>
                          {isExpanded ? desc : `${desc.slice(0, 90)}...`}
                          <button 
                            className={styles.readMoreBtn} 
                            onClick={() => setIsExpanded(!isExpanded)}
                          >
                            {isExpanded ? ' Show Less' : ' Read More'}
                          </button>
                        </>
                      );
                    })()}
                  </p>
                  
                  <div className={styles.vcPriceRow}>
                    <div className={styles.vcPrice}>{currentRenderItem ? formatPrice(currentRenderItem.displayPriceKobo) : ''}</div>
                    <div className={styles.vcPriceSub}>in-store price</div>
                  </div>
                  
                  {currentRenderItem?.raireListingUrl ? (
                    <Button href={currentRenderItem.raireListingUrl} target="_blank" rel="noopener noreferrer" variant="primary">
                      View on Raireapp &rarr;
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={() => setIsCheckoutOpen(true)}>
                      Buy Item &rarr;
                    </Button>
                  )}
                </div>

                {/* Center Column: Image (Arch Frame) */}
                <div className={styles.vcCenter}>
                  <div className={styles.vcHeroFrame}>
                    <div className={styles.vcFrameGlow} />
                    {currentRenderItem?.images && (
                      <img 
                        src={currentRenderItem.images[displayImageIndex]} 
                        alt={currentRenderItem.name} 
                        className={`${styles.mainImage} ${animState === 'out' ? styles.flyOut : ''} ${animState === 'in' ? styles.flyIn : ''}`} 
                        onClick={() => setIsLightboxOpen(true)}
                        style={{ cursor: 'zoom-in' }}
                      />
                    )}
                  </div>
                  
                  {/* Image thumbnails (if multiple) */}
                  <div className={styles.vcCaption}>
                    {currentRenderItem?.images && currentRenderItem.images.length > 1 ? (
                      currentRenderItem.images.map((img, idx) => (
                        <img 
                          key={idx}
                          src={img} 
                          className={`${styles.subThumb} ${displayImageIndex === idx ? styles.subThumbOn : ''}`}
                          onClick={() => setDisplayImageIndex(idx)}
                          alt="angle"
                        />
                      ))
                    ) : null}
                  </div>
                </div>

                {/* Right Column: Thumbs & Sizes */}
                <div className={styles.vcRight}>
                  <div className={styles.vcThumbsTitle}>Also in this drop</div>
                  <div className={styles.vcThumbRow}>
                    {items.map(item => (
                      <div key={item._id} className={styles.thumbWrapper}>
                        <div 
                          className={`${styles.vcThumb} ${activeItem._id === item._id ? styles.vcThumbOn : ''}`}
                          onClick={() => {
                            triggerItemChange(item);
                          }}
                        >
                          <img src={item.images?.[0]} alt={item.name} className={styles.thumbImg} />
                        </div>
                        <div className={styles.vcThumbName}>{item.name}</div>
                      </div>
                    ))}
                  </div>

                  {currentRenderItem?.sizes && currentRenderItem.sizes.length > 0 && (
                    <div className={styles.vcSizesBlock}>
                      <div className={styles.vcSizeLbl2}>AVAILABLE SIZE</div>
                      <div className={styles.vcSzRow}>
                        {currentRenderItem.sizes.map((size, idx) => (
                          <div 
                            key={idx} 
                            className={`${styles.vcSz2} ${selectedSize === size ? styles.vcSzOn : ''}`}
                            onClick={() => setSelectedSize(size)}
                            title={`Select size ${size}`}
                          >
                            {size}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* View Full Catalog Section */}
            <div className={styles.catalogSection}>
              <Button 
                variant="outline"
                onClick={() => setShowCatalog(!showCatalog)}
              >
                {showCatalog ? 'Hide Collection ↑' : 'View Full Collection ↓'}
              </Button>

              {showCatalog && (
                <div className={styles.catalogGrid}>
                  {items.map(item => (
                    <div 
                      key={item._id} 
                      className={styles.catalogItem}
                      onClick={() => {
                        triggerItemChange(item);
                      }}
                    >
                      <div className={styles.catalogImgWrapper}>
                        <img src={item.images?.[0]} alt={item.name} className={styles.catalogImg} />
                      </div>
                      <div className={styles.catalogInfo}>
                        <span className={styles.catalogName}>{item.name}</span>
                        <span className={styles.catalogPrice}>{formatPrice(item.displayPriceKobo)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Editorial Information Sections */}
            <div className={styles.infoSections}>
              {/* Raire Featured Sellers */}
              <div className={styles.raireSection}>
                <div className={styles.raireHeader}>
                  <div>
                    <h2 className={styles.raireTitle}>Raire Featured Sellers</h2>
                    <p className={styles.raireSub}>
                      Up to five rotating independent sellers, selected through our monthly quota 
                      and strict curation criteria. Discover the leading voices in our marketplace.
                    </p>
                  </div>
                  <Button href="https://raireapp.com/sell" target="_blank" rel="noopener noreferrer" variant="outline">
                    Become a Featured Seller &rarr;
                  </Button>
                </div>

                <div className={styles.sellersGrid}>
                  {[
                    { name: "Oasis Collective", tag: "Contemporary", initial: "O" },
                    { name: "Terra Vintage", tag: "Archive", initial: "T" },
                    { name: "Lumina", tag: "Eveningwear", initial: "L" },
                    { name: "Nova Supply", tag: "Street", initial: "N" },
                    { name: "Aura Studio", tag: "Jewelry", initial: "A" }
                  ].map((seller, idx) => (
                    <div key={idx} className={styles.sellerCard}>
                      <div className={styles.sellerAvatar}>{seller.initial}</div>
                      <div>
                        <div className={styles.sellerName}>{seller.name}</div>
                        <div className={styles.sellerTag}>{seller.tag}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '100px', opacity: 0.5 }}>
            No items available for this collection.
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && currentRenderItem?.images && (
        <div className={styles.lightboxOverlay} onClick={() => setIsLightboxOpen(false)}>
          <button className={styles.lightboxClose} onClick={() => setIsLightboxOpen(false)}>&times;</button>
          
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <img 
              src={currentRenderItem.images[displayImageIndex]} 
              alt={currentRenderItem.name} 
              className={styles.lightboxImg} 
            />
            
            {currentRenderItem.images.length > 1 && (
              <div className={styles.lightboxThumbs}>
                {currentRenderItem.images.map((img, idx) => (
                  <img 
                    key={idx}
                    src={img} 
                    className={`${styles.lightboxThumb} ${displayImageIndex === idx ? styles.lightboxThumbOn : ''}`}
                    onClick={() => setDisplayImageIndex(idx)}
                    alt="angle"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fashion Checkout Modal */}
      {isCheckoutOpen && currentRenderItem && (
        <FashionCheckoutModal 
          item={currentRenderItem} 
          initialSize={selectedSize} 
          onClose={() => setIsCheckoutOpen(false)} 
        />
      )}
    </div>
  );
}
