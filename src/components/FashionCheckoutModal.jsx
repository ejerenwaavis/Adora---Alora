import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import styles from './FashionCheckoutModal.module.css';

export default function FashionCheckoutModal({ item, initialSize, onClose, onComplete }) {
  const { user } = useAuth();
  const [selectedSize, setSelectedSize] = useState(initialSize || (item.sizes && item.sizes[0]) || '');
  const [form, setForm] = useState({
    customerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    orderType: 'PURCHASE'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderResult, setOrderResult] = useState(null);

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        customerName: prev.customerName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        customerEmail: prev.customerEmail || user.email || '',
        customerPhone: prev.customerPhone || user.phone || ''
      }));
    }
  }, [user]);

  const priceKobo = item.displayPriceKobo || 0;
  const formattedPrice = `₦${(priceKobo / 100).toLocaleString()}`;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (item.sizes && item.sizes.length > 0 && !selectedSize) {
      setError('Please select a size.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/fashion/order', {
        itemId: item._id,
        selectedSize,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        orderType: form.orderType
      });

      if (res.status === 201) {
        setOrderResult(res.data.order);
        if (onComplete) onComplete(res.data.order);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h2>{form.orderType === 'RESERVATION' ? 'Reserve Item' : 'Purchase Item'}</h2>
            <p>Boutique Concierge &amp; Checkout</p>
          </div>
          {!loading && <button className={styles.closeBtn} onClick={onClose}>&times;</button>}
        </div>

        <div className={styles.body}>
          {orderResult ? (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>✓</div>
              <h3>Order Confirmed</h3>
              <div className={styles.orderBadge}>
                Order #{orderResult.orderNumber}
              </div>
              <p>
                We have secured <strong>{item.name}</strong> {selectedSize ? `(Size ${selectedSize})` : ''} for you. 
                A confirmation has been sent to <strong>{form.customerEmail}</strong>. Our boutique team will contact you directly via phone/email for fulfillment.
              </p>
              <button 
                type="button" 
                className={styles.submitBtn} 
                onClick={onClose}
                style={{ width: '100%' }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className={styles.itemSummary}>
                {item.images?.[0] && (
                  <img src={item.images[0]} alt={item.name} className={styles.itemThumb} />
                )}
                <div className={styles.itemDetails}>
                  <div className={styles.itemBrand}>{item.brand || item.sellerName || 'Adora Archive'}</div>
                  <div className={styles.itemName}>{item.name}</div>
                  <div className={styles.itemPrice}>{formattedPrice}</div>
                </div>
              </div>

              {item.sizes && item.sizes.length > 0 && (
                <div className={styles.sizeSection}>
                  <label className={styles.sizeLabel}>Select Size *</label>
                  <div className={styles.sizeOptions}>
                    {item.sizes.map((s, idx) => (
                      <button
                        type="button"
                        key={idx}
                        className={`${styles.sizePill} ${selectedSize === s ? styles.sizePillActive : ''}`}
                        onClick={() => setSelectedSize(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div style={{ padding: '8px 12px', background: '#FBE9E9', border: '1px solid #E8A8A8', borderRadius: '4px', color: '#8B2020', fontSize: '0.82rem', marginBottom: '1rem' }}>
                  {error}
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Full Name *</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={form.customerName} 
                  onChange={e => setForm({...form, customerName: e.target.value})}
                  placeholder="e.g. Maya Lin"
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email Address *</label>
                <input 
                  type="email" 
                  className={styles.input} 
                  value={form.customerEmail} 
                  onChange={e => setForm({...form, customerEmail: e.target.value})}
                  placeholder="name@example.com"
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Phone Number *</label>
                <input 
                  type="tel" 
                  className={styles.input} 
                  value={form.customerPhone} 
                  onChange={e => setForm({...form, customerPhone: e.target.value})}
                  placeholder="+234 800 000 0000"
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Order Preference</label>
                <select 
                  className={styles.input}
                  value={form.orderType}
                  onChange={e => setForm({...form, orderType: e.target.value})}
                >
                  <option value="PURCHASE">Direct Purchase &amp; Payment</option>
                  <option value="RESERVATION">Hold &amp; Reserve (In-Store Pickup)</option>
                </select>
              </div>
            </form>
          )}
        </div>

        {!orderResult && (
          <div className={styles.footer}>
            <button 
              type="button" 
              className={styles.cancelBtn} 
              disabled={loading}
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className={styles.submitBtn} 
              disabled={loading}
              onClick={handleSubmit}
            >
              {loading ? 'Processing...' : (form.orderType === 'RESERVATION' ? 'Confirm Reservation' : `Buy Item — ${formattedPrice}`)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
