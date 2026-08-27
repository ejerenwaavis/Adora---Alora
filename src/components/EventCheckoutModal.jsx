import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import styles from './EventCheckoutModal.module.css';

export default function EventCheckoutModal({ event, onClose, onComplete }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    customerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    ticketQuantity: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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

  const price = event.priceKobo || 0;
  const totalKobo = price * form.ticketQuantity;
  
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`/api/events/${event._id}/book`, form);
      if (res.status === 200) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          if (onComplete) onComplete();
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete booking. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Checkout: {event.title}</h2>
          {!loading && <button className={styles.closeBtn} onClick={onClose}>&times;</button>}
        </div>

        <div className={styles.body}>
          {success ? (
            <div className={styles.success}>
              <h3>Booking Confirmed!</h3>
              <p>Your tickets have been secured. We've sent a confirmation to {form.customerEmail}.</p>
            </div>
          ) : (
            <form id="event-checkout-form" onSubmit={handleSubmit}>
              <div className={styles.summary}>
                <h3>Event Summary</h3>
                <p>{event.date} at {event.time}</p>
                <p>{event.isFree ? 'Free' : `₦${(price / 100).toLocaleString()} per ticket`}</p>
              </div>

              {error && <p style={{ color: 'red', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}

              <div className={styles.formGroup}>
                <label>Ticket Quantity</label>
                <input 
                    type="number" 
                    min="1" 
                    max={event.capacity ? event.capacity - (event.ticketsSold || 0) : 10} 
                    className={styles.input} 
                    value={form.ticketQuantity} 
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '') {
                        setForm({...form, ticketQuantity: ''});
                        return;
                      }
                      let num = parseInt(val, 10);
                      const maxLimit = event.capacity ? event.capacity - (event.ticketsSold || 0) : 10;
                      if (num > maxLimit) num = maxLimit;
                      setForm({...form, ticketQuantity: num});
                    }}
                    required 
                  />
              </div>

              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={form.customerName} 
                  onChange={e => setForm({...form, customerName: e.target.value})}
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email Address</label>
                <input 
                  type="email" 
                  className={styles.input} 
                  value={form.customerEmail} 
                  onChange={e => setForm({...form, customerEmail: e.target.value})}
                  required 
                />
              </div>

              <div className={styles.totalRow}>
                <span>Total:</span>
                <span>{event.isFree ? 'Free' : `₦${(totalKobo / 100).toLocaleString()}`}</span>
              </div>
            </form>
          )}
        </div>

        {!success && (
          <div className={styles.footer}>
            <button 
                type="submit" 
                form="event-checkout-form"
                className={styles.submitBtn} 
                disabled={loading}
              >
                {loading ? 'Processing...' : (event.isFree ? 'Complete Registration' : 'Pay Now')}
              </button>
          </div>
        )}
      </div>
    </div>
  );
}
