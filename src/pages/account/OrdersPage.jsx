import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { IconArrowRight, IconCheck, IconClock, IconAlert } from '../../components/ui/LineIcons';
import styles from './AccountLayout.module.css';

export default function OrdersPage() {
  const { authFetch } = useAuth();

  const [loading, setLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'pending' | 'cafe' | 'fashion' | 'history'
  const [cafeOrders, setCafeOrders] = useState([]);
  const [fashionOrders, setFashionOrders] = useState([]);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await authFetch('/api/user/orders');
      if (res.ok) {
        const data = await res.json();
        setCafeOrders(data.cafeOrders || []);
        setFashionOrders(data.fashionOrders || []);
      } else {
        // Fallback to bookings endpoint if needed
        const bookingsRes = await authFetch('/api/user/bookings');
        if (bookingsRes.ok) {
          const bData = await bookingsRes.json();
          setCafeOrders(bData.cafeOrders || []);
          setFashionOrders(bData.fashionOrders || []);
        }
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  }

  const pendingCafeOrders = cafeOrders.filter(o => ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status));
  const pastCafeOrders = cafeOrders.filter(o => !['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status));

  const pendingFashionOrders = fashionOrders.filter(o => ['PENDING', 'CONFIRMED'].includes(o.status));
  const pastFashionOrders = fashionOrders.filter(o => !['PENDING', 'CONFIRMED'].includes(o.status));

  const totalPendingOrders = pendingCafeOrders.length + pendingFashionOrders.length;
  const totalOrdersCount = cafeOrders.length + fashionOrders.length;

  const allPendingOrders = [
    ...pendingCafeOrders.map(o => ({ ...o, _type: 'cafe' })),
    ...pendingFashionOrders.map(o => ({ ...o, _type: 'fashion' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const allPastOrders = [
    ...pastCafeOrders.map(o => ({ ...o, _type: 'cafe' })),
    ...pastFashionOrders.map(o => ({ ...o, _type: 'fashion' }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const filteredPendingOrders = allPendingOrders.filter(o => {
    if (orderFilter === 'cafe') return o._type === 'cafe';
    if (orderFilter === 'fashion') return o._type === 'fashion';
    return true;
  });

  const filteredPastOrders = allPastOrders.filter(o => {
    if (orderFilter === 'cafe') return o._type === 'cafe';
    if (orderFilter === 'fashion') return o._type === 'fashion';
    return true;
  });

  const renderPendingOrderCard = (order) => {
    const isCafe = order._type === 'cafe' || Boolean(order.items);
    const orderRef = isCafe
      ? (order.orderNumber || `AH-CF-${order._id.toString().slice(-6).toUpperCase()}`)
      : (order.orderNumber || `AH-FSH-${order._id.toString().slice(-6).toUpperCase()}`);

    const isReady = order.status === 'READY';
    const isPreparing = order.status === 'PREPARING';
    const isAccepted = order.status === 'ACCEPTED';
    const isPending = order.status === 'PENDING';
    const isConfirmed = order.status === 'CONFIRMED';

    const dateStr = new Date(order.createdAt).toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    const timeStr = new Date(order.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    const totalAmount = isCafe
      ? ((order.totalAmountKobo || 0) / 100).toLocaleString()
      : ((order.priceKobo || 0) / 100).toLocaleString();

    return (
      <div
        key={order._id}
        style={{
          background: '#FFFDF9',
          border: isReady ? '2px solid #2E7D32' : isPreparing ? '2px solid #C89B4A' : '1px solid rgba(227, 211, 184, 0.9)',
          borderRadius: '8px',
          padding: '1.5rem',
          boxShadow: isReady ? '0 4px 20px rgba(46, 125, 50, 0.15)' : '0 4px 15px rgba(0,0,0,0.03)',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Card Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{
                background: isCafe ? 'rgba(164, 69, 31, 0.12)' : 'rgba(200, 155, 74, 0.15)',
                color: isCafe ? 'var(--rust, #A4451F)' : 'var(--cocoa-deep, #2B2015)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em'
              }}>
                {isCafe ? '☕ Café Takeout' : '✨ Boutique Item'}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--taupe)' }}>
                {dateStr} at {timeStr}
              </span>
            </div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: 'var(--cocoa-deep)', margin: 0, fontWeight: 600 }}>
              Order #{orderRef}
            </h4>
          </div>

          {/* Status Badge */}
          <div>
            {isReady && (
              <div style={{
                background: '#E8F5E9',
                border: '1px solid #A5D6A7',
                color: '#1B5E20',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2E7D32', display: 'inline-block' }} />
                Ready for Pickup! 🔔
              </div>
            )}
            {isPreparing && (
              <div style={{
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                color: '#92400E',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
                Kitchen Preparing...
              </div>
            )}
            {(isPending || isAccepted || isConfirmed) && (
              <div style={{
                background: '#F5F0E6',
                border: '1px solid #D7C4AA',
                color: '#8A5D2E',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#C89B4A', display: 'inline-block' }} />
                Order Received &amp; Queued
              </div>
            )}
          </div>
        </div>

        {/* Live Pickup Alert Box */}
        {isReady ? (
          <div style={{
            background: '#F1F8F4',
            border: '1px solid #C8E6C9',
            borderRadius: '6px',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '1.6rem' }}>🔔</span>
            <div style={{ fontSize: '0.88rem', color: '#1B5E20', lineHeight: 1.5 }}>
              <strong>Your order is packed and ready!</strong> Please proceed to the Café Counter on the ground floor. Present reference <strong style={{ textDecoration: 'underline' }}>#{orderRef}</strong> to collect your takeout.
            </div>
          </div>
        ) : isPreparing ? (
          <div style={{
            background: '#FFFDF0',
            border: '1px solid #FDE68A',
            borderRadius: '6px',
            padding: '0.9rem 1.15rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '1.35rem' }}>🧑‍🍳</span>
            <div style={{ fontSize: '0.86rem', color: '#92400E', lineHeight: 1.5 }}>
              Our kitchen team is freshly preparing your selection. You will receive an instant notification once it is ready for collection at the counter.
            </div>
          </div>
        ) : (
          <div style={{
            background: '#FAF6EF',
            border: '1px solid rgba(227, 211, 184, 0.7)',
            borderRadius: '6px',
            padding: '0.85rem 1.15rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>⏳</span>
            <div style={{ fontSize: '0.85rem', color: 'var(--cocoa-deep)' }}>
              {isCafe ? 'Your order has been received by our desk and is queued for kitchen preparation.' : 'Your boutique piece is confirmed and is being prepped for collection or delivery.'}
            </div>
          </div>
        )}

        {/* Itemized Breakdown */}
        <div style={{ borderTop: '1px solid rgba(227, 211, 184, 0.6)', paddingTop: '1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe)', fontWeight: 600, marginBottom: '0.65rem' }}>
            Items Summary
          </div>
          {isCafe ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {order.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.9rem' }}>
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--cocoa-deep)' }}>{item.quantity}× {item.name}</span>
                    {item.notes && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--rust)', fontStyle: 'italic', marginTop: '2px' }}>
                        Note: "{item.notes}"
                      </div>
                    )}
                  </div>
                  <span style={{ color: 'var(--taupe)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    ₦{(((item.priceKobo || 0) * (item.quantity || 1)) / 100).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--cocoa-deep)' }}>{order.itemName}</span>
                <div style={{ fontSize: '0.82rem', color: 'var(--taupe)', marginTop: '2px' }}>
                  Size: {order.selectedSize || 'One Size'} · {order.orderType || 'Purchase'}
                </div>
              </div>
              <span style={{ color: 'var(--taupe)', fontWeight: 500 }}>
                ₦{totalAmount}
              </span>
            </div>
          )}
        </div>

        {/* Card Footer: Customer & Total Amount */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(227, 211, 184, 0.6)', paddingTop: '1rem', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--taupe)' }}>
            Recipient: <strong style={{ color: 'var(--cocoa-deep)' }}>{order.customerName}</strong> {order.customerPhone ? `(${order.customerPhone})` : ''}
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--taupe)', marginRight: '8px' }}>Total Amount:</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--cocoa-deep)' }}>₦{totalAmount}</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderPastOrderCard = (order) => {
    const isCafe = order._type === 'cafe' || Boolean(order.items);
    const orderRef = isCafe
      ? (order.orderNumber || `AH-CF-${order._id.toString().slice(-6).toUpperCase()}`)
      : (order.orderNumber || `AH-FSH-${order._id.toString().slice(-6).toUpperCase()}`);

    const dateStr = new Date(order.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const totalAmount = isCafe
      ? ((order.totalAmountKobo || 0) / 100).toLocaleString()
      : ((order.priceKobo || 0) / 100).toLocaleString();

    const isCancelled = order.status === 'CANCELLED';

    return (
      <div
        key={order._id}
        style={{
          background: '#FFFDF9',
          border: '1px solid rgba(227, 211, 184, 0.6)',
          borderRadius: '6px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--taupe)', fontWeight: 600 }}>
              {isCafe ? 'Café Takeout' : 'Boutique Item'} · #{orderRef}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>
              {dateStr}
            </span>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--cocoa-deep)', fontWeight: 500 }}>
            {isCafe
              ? (order.items?.map(i => `${i.quantity}× ${i.name}`).join(', ') || 'Café Order')
              : `${order.itemName} (${order.selectedSize || 'One Size'})`}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, color: 'var(--cocoa-deep)', fontSize: '0.98rem' }}>
            ₦{totalAmount}
          </div>
          <span style={{
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontWeight: 700,
            color: isCancelled ? '#9B1C1C' : 'var(--forest, #2E5A36)'
          }}>
            {isCancelled ? 'Cancelled' : (isCafe ? 'Collected' : 'Fulfilled')}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto', padding: '1rem 0' }}>
      {/* Header & Subtitle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', color: 'var(--cocoa-deep)', margin: '0 0 0.35rem', fontWeight: 400 }}>
            My Orders &amp; Receipts
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--taupe)' }}>
            Track live takeout preparation, boutique pieces, and review past receipts.
          </p>
        </div>
        <button
          onClick={loadOrders}
          disabled={loading}
          className="btn btn-outline"
          style={{ padding: '8px 16px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span>{loading ? 'Refreshing...' : '↻ Refresh Orders'}</span>
        </button>
      </div>

      {/* Subfilter Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: `All Orders (${totalOrdersCount})` },
          { id: 'pending', label: `Active & Pending (${totalPendingOrders})` },
          { id: 'cafe', label: `Café Takeout (${cafeOrders.length})` },
          { id: 'fashion', label: `Boutique (${fashionOrders.length})` },
          { id: 'history', label: `Completed & Past (${pastCafeOrders.length + pastFashionOrders.length})` }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setOrderFilter(f.id)}
            style={{
              background: orderFilter === f.id ? 'var(--black, #2B2015)' : 'transparent',
              color: orderFilter === f.id ? 'var(--white, #FFF)' : 'var(--cocoa-deep, #2B2015)',
              border: orderFilter === f.id ? '1px solid var(--black, #2B2015)' : '1px solid var(--line, #E3D3B8)',
              padding: '8px 18px',
              borderRadius: '0px',
              fontSize: '0.8rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 1. DEDICATED PENDING & ACTIVE ORDERS SECTION */}
      {(orderFilter === 'all' || orderFilter === 'pending' || orderFilter === 'cafe' || orderFilter === 'fashion') && (
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--cocoa-deep)', margin: 0, fontWeight: 500 }}>
              Active &amp; In-Progress Orders
            </h3>
            {totalPendingOrders > 0 && (
              <span style={{
                background: '#C89B4A',
                color: '#FFF',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}>
                {totalPendingOrders} In Progress
              </span>
            )}
          </div>

          {filteredPendingOrders.length === 0 ? (
            <div style={{
              padding: '2.75rem 2rem',
              background: '#FFFDF9',
              border: '1px dashed rgba(227, 211, 184, 0.9)',
              borderRadius: '8px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>☕</div>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--cocoa-deep)', margin: '0 0 0.4rem' }}>
                No Active Orders
              </h4>
              <p style={{ color: 'var(--taupe)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 1.5rem' }}>
                You don't have any takeout or boutique orders currently being prepared.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/cafe" className="btn btn-primary" style={{ padding: '9px 18px', fontSize: '0.84rem' }}>
                  Order Takeout Menu ↗
                </Link>
                <Link to="/fashion" className="btn btn-outline" style={{ padding: '9px 18px', fontSize: '0.84rem' }}>
                  Browse Raire Boutique ↗
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {filteredPendingOrders.map(order => renderPendingOrderCard(order))}
            </div>
          )}
        </div>
      )}

      {/* 2. COMPLETED & PAST ORDERS SECTION */}
      {(orderFilter === 'all' || orderFilter === 'history' || orderFilter === 'cafe' || orderFilter === 'fashion') && (
        <div style={{ marginTop: '2.5rem' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.35rem', color: 'var(--cocoa-deep)', marginBottom: '1.25rem', fontWeight: 500 }}>
            Order History &amp; Past Receipts
          </h3>

          {filteredPastOrders.length === 0 ? (
            <div style={{
              padding: '2.5rem 2rem',
              background: '#FAF6EF',
              border: '1px solid rgba(227, 211, 184, 0.6)',
              borderRadius: '6px',
              textAlign: 'center',
              color: 'var(--taupe)',
              fontSize: '0.88rem'
            }}>
              No past orders found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {filteredPastOrders.map(order => renderPastOrderCard(order))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
