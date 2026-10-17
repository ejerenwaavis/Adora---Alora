import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Eyebrow from '../components/ui/Eyebrow.jsx';
import Button from '../components/ui/Button.jsx';
import PageHeader from '../components/ui/PageHeader';
import ExploreDoors from '../components/home/ExploreDoors.jsx';
import styles from './Cafe.module.css';
import { useAuth } from '../contexts/AuthContext';
import HoneypotField from '../components/common/HoneypotField';
import OrderConfirmationModal from '../components/OrderConfirmationModal';
import { useToast } from '../contexts/ToastContext';

export default function Cafe() {
  const [menuData, setMenuData] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [activeItem, setActiveItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMobileModal, setShowMobileModal] = useState(false);

  // Cart & Checkout State
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('aora_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showCart, setShowCart] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationState, setConfirmationState] = useState('success');
  const [orderError, setOrderError] = useState(null);
  const [honeypot, setHoneypot] = useState({});
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkoutForm, setCheckoutForm] = useState({ 
    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '', 
    phone: user?.phone || '',
    email: user?.email || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if redirected from Paystack or verify callback
  useEffect(() => {
    const ref = searchParams.get('reference') || searchParams.get('trxref');
    const isSuccess = searchParams.get('orderSuccess') === 'true';
    const orderIdParam = searchParams.get('orderId');

    if (ref) {
      localStorage.removeItem('aora_cart');
      setCart([]);
      setConfirmationState('verifying');
      setShowConfirmation(true);

      fetch(`/api/payments/verify/${encodeURIComponent(ref)}`)
        .then(res => res.json())
        .then(async (data) => {
          if (data.success && (data.status === 'success' || data.order)) {
            let orderData = data.order;
            if (!orderData && data.orderId) {
              try {
                const ordRes = await fetch(`/api/orders/${data.orderId}`);
                if (ordRes.ok) {
                  const ordJson = await ordRes.json();
                  orderData = ordJson.order;
                }
              } catch (e) {
                console.warn('Could not fetch full order details:', e);
              }
            }
            if (orderData) {
              setConfirmedOrder(orderData);
            } else {
              setConfirmedOrder({
                orderNumber: data.orderNumber || `#AH-${ref.slice(-6).toUpperCase()}`,
                customerName: data.customerName || user?.firstName || 'Aora Guest',
                totalAmountKobo: (data.amountNaira || 0) * 100,
                items: []
              });
            }
            setConfirmationState('success');
          } else {
            setConfirmationState('failed');
            setOrderError({
              message: data.message || data.gateway_response || 'Payment was not completed by the bank.',
              gateway_response: data.gateway_response
            });
          }
        })
        .catch(err => {
          console.error('Verification error on cafe page:', err);
          setConfirmationState('failed');
          setOrderError({ message: 'Unable to verify payment with the server. Please check your account or contact concierge.' });
        })
        .finally(() => {
          setSearchParams({}, { replace: true });
        });
      return;
    }

    if (isSuccess && orderIdParam) {
      localStorage.removeItem('aora_cart');
      setCart([]);
      setConfirmationState('verifying');
      setShowConfirmation(true);

      fetch(`/api/orders/${orderIdParam}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.order) {
            setConfirmedOrder(data.order);
            setConfirmationState('success');
          } else {
            setConfirmationState('failed');
            setOrderError({ message: 'Order was placed but receipt details could not be retrieved.' });
          }
        })
        .catch(err => {
          console.warn('Could not load confirmed order:', err);
          setConfirmationState('failed');
          setOrderError({ message: 'Could not load order details.' });
        })
        .finally(() => {
          setSearchParams({}, { replace: true });
        });
    }
  }, [searchParams, setSearchParams]);

  // Handle tab refocus / return from Paystack checkout (e.g. user cancelled or pressed Back)
  useEffect(() => {
    let checkInterval = null;
    let isChecking = false;

    const handleReturnToPage = () => {
      const pendingRef = sessionStorage.getItem('ah_pending_order_ref');
      const pendingOrderId = sessionStorage.getItem('ah_pending_order_id');
      const startTimeStr = sessionStorage.getItem('ah_checkout_start_time');
      const startTime = startTimeStr ? parseInt(startTimeStr, 10) : 0;

      // Only trigger if we actually had a pending checkout session started recently (within 30 mins)
      if (!pendingRef && !pendingOrderId && confirmationState !== 'redirecting') return;
      if (startTime && (Date.now() - startTime) > 30 * 60 * 1000) {
        sessionStorage.removeItem('ah_pending_order_ref');
        sessionStorage.removeItem('ah_pending_order_id');
        sessionStorage.removeItem('ah_checkout_start_time');
        return;
      }

      // If user came back via URL query parameters (?reference=...), the URL searchParams effect handles it.
      const urlRef = searchParams.get('reference') || searchParams.get('trxref');
      if (urlRef) return;

      if (isChecking) return;
      isChecking = true;

      // Switch modal to verifying state so customer sees active check instead of stuck "redirecting" spinner
      setConfirmationState('verifying');
      setShowConfirmation(true);

      const targetRef = pendingRef;
      const targetOrderId = pendingOrderId;
      const startedAt = Date.now();
      const MAX_WAIT_MS = 25000; // 25 seconds timeout

      const cleanupAndFinish = (status, orderData, errData) => {
        if (checkInterval) {
          clearInterval(checkInterval);
          checkInterval = null;
        }
        isChecking = false;

        sessionStorage.removeItem('ah_pending_order_ref');
        sessionStorage.removeItem('ah_pending_order_id');
        sessionStorage.removeItem('ah_checkout_start_time');

        if (status === 'success') {
          if (orderData) setConfirmedOrder(orderData);
          setConfirmationState('success');
        } else {
          // Restore cart from backup so user doesn't lose their selected items!
          try {
            const backupCartStr = sessionStorage.getItem('ah_backup_cart');
            if (backupCartStr) {
              const backupCart = JSON.parse(backupCartStr);
              if (Array.isArray(backupCart) && backupCart.length > 0) {
                setCart(backupCart);
              }
            }
          } catch (e) {}

          setConfirmationState('failed');
          setOrderError(errData || {
            message: 'Checkout was not completed or confirmation timed out. If you were debited, please wait a few moments before trying again to avoid duplicate charges.'
          });
        }
      };

      const checkPaymentStatus = async () => {
        try {
          if (targetRef) {
            const res = await fetch(`/api/payments/verify/${encodeURIComponent(targetRef)}`);
            const data = await res.json();
            
            if (data.success && (data.status === 'success' || data.order)) {
              cleanupAndFinish('success', data.order, null);
              return;
            } else if (data.status === 'abandoned' || data.status === 'failed') {
              // Paystack explicitly reported that the transaction was not completed / cancelled
              cleanupAndFinish('failed', null, {
                message: data.message || data.gateway_response || 'Payment was cancelled or closed on Paystack.',
                gateway_response: data.gateway_response
              });
              return;
            }
          } else if (targetOrderId) {
            const res = await fetch(`/api/orders/${targetOrderId}`);
            if (res.ok) {
              const data = await res.json();
              if (data.order?.paymentStatus === 'PAID') {
                cleanupAndFinish('success', data.order, null);
                return;
              }
            }
          }
        } catch (err) {
          console.warn('Refocus payment check error:', err);
        }

        // Check if 25 seconds elapsed
        if (Date.now() - startedAt >= MAX_WAIT_MS) {
          cleanupAndFinish('failed', null, {
            message: 'Checkout was not completed. If you were debited by your bank, please wait a few moments before re-trying to avoid double payments — our system will automatically verify and process your order if funds were captured.'
          });
        }
      };

      // Perform initial check immediately
      checkPaymentStatus();

      // Poll every 3 seconds for up to 25 seconds
      checkInterval = setInterval(checkPaymentStatus, 3000);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleReturnToPage();
      }
    };

    const onWindowFocus = () => {
      handleReturnToPage();
    };

    const onPageShow = (e) => {
      // Handles mobile browser Back-Forward Cache (bfcache)
      handleReturnToPage();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('pageshow', onPageShow);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('pageshow', onPageShow);
    };
  }, [confirmationState, searchParams]);

  useEffect(() => {
    if (user) {
      setCheckoutForm(prev => ({
        ...prev,
        name: prev.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        phone: prev.phone || user.phone || '',
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('aora_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setShowCart(true);
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(i => i._id !== itemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + ((item.priceKobo || 0) * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setOrderError(null);
    setConfirmationState('redirecting');
    setConfirmedOrder({
      totalAmountKobo: cartTotal,
      customerName: checkoutForm.name,
      customerPhone: checkoutForm.phone,
      items: [...cart]
    });
    setShowCart(false);
    setShowConfirmation(true);
    
    try {
      const token = localStorage.getItem('aa_access_token');
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          customerName: checkoutForm.name,
          customerPhone: checkoutForm.phone,
          customerEmail: (checkoutForm.email && checkoutForm.email.trim()) || user?.email || undefined,
          userId: user?._id,
          _aora_uid: honeypot._aora_uid,
          _aora_session: honeypot._aora_session,
          items: cart.map(item => ({
            menuItem: item._id,
            name: item.name,
            quantity: item.quantity,
            priceKobo: item.priceKobo || 0
          })),
          totalAmountKobo: cartTotal
        })
      });
      
      const data = await response.json();
      if (data.success) {
        if (data.authorizationUrl) {
          sessionStorage.setItem('ah_pending_order_id', data.order?._id || '');
          sessionStorage.setItem('ah_pending_order_ref', data.order?.paymentReference || '');
          sessionStorage.setItem('ah_checkout_start_time', Date.now().toString());
          sessionStorage.setItem('ah_backup_cart', JSON.stringify(cart));
          localStorage.removeItem('aora_cart');
          setCart([]);
          // Give smooth visual feedback with "Redirecting to checkout..." before navigating
          setTimeout(() => {
            window.location.href = data.authorizationUrl;
          }, 600);
          return;
        }

        setConfirmedOrder(data.order || {
          orderNumber: `AH-ORD-${Date.now().toString().slice(-6)}`,
          customerName: checkoutForm.name,
          customerPhone: checkoutForm.phone,
          customerEmail: checkoutForm.email || user?.email,
          items: [...cart],
          totalAmountKobo: cartTotal
        });
        setCart([]);
        setConfirmationState('success');
        setIsSubmitting(false);
        setCheckoutForm({ 
          name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '', 
          phone: user?.phone || '', 
          email: user?.email || '' 
        });
      } else {
        setConfirmationState('failed');
        setOrderError({ message: data.error || 'Failed to place order.' });
        setIsSubmitting(false);
      }
    } catch (err) {
      setConfirmationState('failed');
      setOrderError({ message: 'Network error placing order. Please check your connection.' });
      setIsSubmitting(false);
    }
  };

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

                    <button 
                      className={styles.cmPanelOrderBtn}
                      onClick={() => addToCart(activeItem)}
                    >
                      Add to Order
                    </button>
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

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <button 
          onClick={() => setShowCart(true)}
          style={{
            position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9997,
            background: 'var(--cocoa-deep)', color: 'var(--cream)',
            border: 'none', borderRadius: '50px',
            padding: '1rem 2rem', fontSize: '1rem', fontWeight: 600,
            boxShadow: '0 8px 32px rgba(42,29,20,0.3)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem',
            fontFamily: 'var(--f-body)', textTransform: 'uppercase', letterSpacing: '0.05em'
          }}
        >
          <span>View Order ({cartCount})</span>
          <span>&bull;</span>
          <span>₦{(cartTotal / 100).toLocaleString()}</span>
        </button>
      )}

      {/* 8. Shopping Cart Drawer */}
      <div 
        style={{
          position: 'fixed', top: 0, right: showCart ? 0 : '-100%',
          width: '100%', maxWidth: '420px', height: '100%', maxHeight: '100dvh',
          background: 'var(--cream)', boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
          transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--line)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'var(--cream)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.4rem', color: 'var(--cocoa-deep)', margin: 0 }}>Your Order</h2>
            {cartCount > 0 && (
              <span style={{ fontSize: '0.75rem', background: 'var(--rust)', color: '#FFF', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>
                {cartCount}
              </span>
            )}
          </div>
          <button 
            onClick={() => setShowCart(false)} 
            style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--taupe)', padding: '4px', display: 'flex', alignItems: 'center' }}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Cart Content & Checkout Form */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, padding: '1.5rem' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--taupe)' }}>
                <p style={{ margin: '0 0 1rem', fontSize: '0.95rem' }}>Your cart is empty.</p>
                <button 
                  onClick={() => setShowCart(false)}
                  className={`${styles.btn} ${styles.btnOutline}`}
                  style={{ fontSize: '0.8rem', padding: '0.6rem 1.2rem' }}
                >
                  Browse Café Menu
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '1rem', borderBottom: '1px solid var(--line)' }}>
                    <div style={{ flex: 1, paddingRight: '1rem' }}>
                      <div style={{ fontWeight: 500, color: 'var(--cocoa-deep)', fontSize: '0.95rem' }}>{item.quantity}x {item.name}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--taupe)', marginTop: '0.2rem' }}>₦{(item.priceKobo / 100).toLocaleString()} each</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }}>
                      <div style={{ fontWeight: 600, color: 'var(--cocoa-deep)', fontSize: '0.95rem' }}>₦{((item.priceKobo * item.quantity) / 100).toLocaleString()}</div>
                      <button 
                        onClick={() => removeFromCart(item._id)}
                        style={{ background: 'none', border: 'none', color: 'var(--rust)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div style={{
              padding: '1.5rem',
              paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))',
              background: '#F4F0EA',
              borderTop: '1px solid var(--line)',
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem', color: 'var(--cocoa-deep)' }}>
                <span style={{ fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Total:</span>
                <span style={{ fontSize: '1.35rem', fontWeight: 700, fontFamily: 'var(--f-display)' }}>₦{(cartTotal / 100).toLocaleString()}</span>
              </div>
              
              <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <HoneypotField values={honeypot} onChange={e => setHoneypot({ ...honeypot, [e.target.name]: e.target.value })} />
                
                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cocoa)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Full Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Jane Doe" 
                    required 
                    value={checkoutForm.name}
                    onChange={e => setCheckoutForm({...checkoutForm, name: e.target.value})}
                    style={{ width: '100%', padding: '0.85rem 1rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#FFFDF9', color: 'var(--cocoa-deep)', fontFamily: 'var(--f-body)', fontSize: '0.92rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cocoa)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Phone Number *</label>
                  <input 
                    type="tel" 
                    placeholder="e.g. +234 800 000 0000" 
                    required 
                    value={checkoutForm.phone}
                    onChange={e => setCheckoutForm({...checkoutForm, phone: e.target.value})}
                    style={{ width: '100%', padding: '0.85rem 1rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#FFFDF9', color: 'var(--cocoa-deep)', fontFamily: 'var(--f-body)', fontSize: '0.92rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cocoa)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Email Address (for Receipt &amp; Ready Alert) *</label>
                  <input 
                    type="email" 
                    placeholder="name@example.com" 
                    required 
                    value={checkoutForm.email}
                    onChange={e => setCheckoutForm({...checkoutForm, email: e.target.value})}
                    style={{ width: '100%', padding: '0.85rem 1rem', border: '1px solid var(--line)', borderRadius: '6px', background: '#FFFDF9', color: 'var(--cocoa-deep)', fontFamily: 'var(--f-body)', fontSize: '0.92rem', boxSizing: 'border-box' }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ 
                    width: '100%', 
                    padding: '1.1rem 1.5rem', 
                    marginTop: '0.5rem', 
                    background: '#2A1D14', 
                    color: '#FFFFFF',
                    border: '1px solid #1E0F06',
                    borderRadius: '6px',
                    fontFamily: 'var(--f-body)',
                    fontSize: '0.88rem',
                    fontWeight: 700, 
                    letterSpacing: '0.1em', 
                    textTransform: 'uppercase',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                    opacity: isSubmitting ? 0.7 : 1,
                    boxShadow: '0 4px 16px rgba(42, 29, 20, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isSubmitting ? 'Placing Order...' : 'Place Takeout Order →'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {showCart && (
        <div 
          onClick={() => setShowCart(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9998, backdropFilter: 'blur(2px)' }}
        />
      )}

      {/* 9. Order Confirmation Modal */}
      <OrderConfirmationModal
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setIsSubmitting(false);
        }}
        order={confirmedOrder || { totalAmountKobo: cartTotal }}
        state={confirmationState}
        error={orderError}
        onRetry={() => {
          setShowConfirmation(false);
          setIsSubmitting(false);
          try {
            const bStr = sessionStorage.getItem('ah_backup_cart');
            if (bStr) {
              const bCart = JSON.parse(bStr);
              if (Array.isArray(bCart) && bCart.length > 0) {
                setCart(bCart);
              }
            }
          } catch (e) {}
          setShowCart(true);
        }}
      />
    </div>
  );
}
