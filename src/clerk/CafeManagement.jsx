import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOutletContext } from 'react-router-dom';
import ClerkSearch from './ClerkSearch';

export default function CafeManagement() {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'reservations'
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderFilter, setOrderFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED'
  const [updatingId, setUpdatingId] = useState(null);
  const { setWalkinOpen } = useOutletContext();
  const { authFetch } = useAuth();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Polling every 15s for new takeout orders
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [resOrders, resReservations] = await Promise.all([
        authFetch('/api/clerk/cafe/orders').catch(() => null),
        authFetch('/api/clerk/cafe/today').catch(() => null)
      ]);
      if (resOrders && resOrders.ok) {
        const orderData = await resOrders.json();
        if (Array.isArray(orderData)) setOrders(orderData);
      }
      if (resReservations && resReservations.ok) {
        const resData = await resReservations.json();
        if (Array.isArray(resData)) setReservations(resData);
      }
    } catch (err) {
      console.error('Error fetching cafe data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await authFetch(`/api/clerk/cafe/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(prev => prev.map(o => o._id === orderId ? data.order : o));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update order status');
      }
    } catch (err) {
      alert(err.message || 'Error updating order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReservationStatusChange = async (reservationId, status) => {
    try {
      await authFetch('/api/clerk/cafe/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, status })
      });
      setReservations(prev => prev.map(r => r._id === reservationId ? { ...r, status } : r));
    } catch (err) {
      alert(err.message || 'Error updating reservation status');
    }
  };

  const formatPrice = (kobo) => {
    return '₦' + ((kobo || 0) / 100).toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  if (loading) return <div style={{ padding: '40px', color: 'var(--taupe)' }}>Loading Café Operations...</div>;

  // Order counts
  const pendingOrders = orders.filter(o => ['PENDING', 'ACCEPTED'].includes(o.status)).length;
  const preparingOrders = orders.filter(o => o.status === 'PREPARING').length;
  const readyOrders = orders.filter(o => o.status === 'READY').length;
  const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'ALL') return true;
    if (orderFilter === 'PENDING') return ['PENDING', 'ACCEPTED'].includes(o.status);
    return o.status === orderFilter;
  });

  // Reservation counts
  const seatedCount = reservations.filter(r => r.status === 'seated').length;
  const completedResCount = reservations.filter(r => r.status === 'completed').length;
  const pendingResCount = reservations.length - seatedCount - completedResCount;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Café &amp; Takeout Desk</div>
          <div className="topbar-sub">Manage takeout orders, kitchen dispatch, and table reservations</div>
        </div>
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClerkSearch />
          {activeTab === 'reservations' && (
            <>
              <button className="tb-btn" onClick={() => window.print()}>Print List</button>
              <button className="tb-btn primary" onClick={() => setWalkinOpen(true)}>+ Add Walk-in</button>
            </>
          )}
          {activeTab === 'orders' && (
            <button className="tb-btn" onClick={fetchData}>↻ Refresh Orders</button>
          )}
        </div>
      </div>

      <div className="content">
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', borderBottom: '1px solid var(--line, #E3D3B8)', paddingBottom: '10px' }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              background: activeTab === 'orders' ? 'var(--cocoa-deep, #2A1D14)' : 'transparent',
              color: activeTab === 'orders' ? '#FCF8F0' : 'var(--cocoa-deep, #2A1D14)',
              border: '1px solid ' + (activeTab === 'orders' ? 'var(--cocoa-deep, #2A1D14)' : 'var(--line, #E3D3B8)'),
              padding: '8px 18px',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🛍️ Takeout Orders</span>
            {(pendingOrders + preparingOrders + readyOrders) > 0 && (
              <span style={{
                background: 'var(--rust, #B85F3C)',
                color: '#FFF',
                borderRadius: '10px',
                padding: '1px 7px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                {pendingOrders + preparingOrders + readyOrders}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reservations')}
            style={{
              background: activeTab === 'reservations' ? 'var(--cocoa-deep, #2A1D14)' : 'transparent',
              color: activeTab === 'reservations' ? '#FCF8F0' : 'var(--cocoa-deep, #2A1D14)',
              border: '1px solid ' + (activeTab === 'reservations' ? 'var(--cocoa-deep, #2A1D14)' : 'var(--line, #E3D3B8)'),
              padding: '8px 18px',
              borderRadius: '4px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>🪑 Table Reservations</span>
            {pendingResCount > 0 && (
              <span style={{
                background: '#C89B4A',
                color: '#FFF',
                borderRadius: '10px',
                padding: '1px 7px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                {pendingResCount}
              </span>
            )}
          </button>
        </div>

        {/* ─── TAB 1: TAKEOUT ORDERS ─── */}
        {activeTab === 'orders' && (
          <div>
            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {[
                { id: 'ALL', label: `All Orders (${orders.length})` },
                { id: 'PENDING', label: `New / Pending (${pendingOrders})`, highlight: pendingOrders > 0 },
                { id: 'PREPARING', label: `Preparing (${preparingOrders})`, highlight: preparingOrders > 0 },
                { id: 'READY', label: `Ready for Pickup (${readyOrders})`, highlight: readyOrders > 0 },
                { id: 'COMPLETED', label: `Collected (${completedOrders})` },
                { id: 'CANCELLED', label: `Cancelled (${cancelledOrders})` }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setOrderFilter(f.id)}
                  style={{
                    background: orderFilter === f.id ? 'var(--cocoa-deep, #2A1D14)' : '#FFFDF9',
                    color: orderFilter === f.id ? '#FCF8F0' : (f.highlight ? 'var(--rust, #B85F3C)' : 'var(--cocoa-deep, #2A1D14)'),
                    border: '1px solid ' + (orderFilter === f.id ? 'var(--cocoa-deep, #2A1D14)' : 'var(--line, #E3D3B8)'),
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.78rem',
                    fontWeight: f.highlight ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Orders Table */}
            <div className="guest-table">
              <div className="guest-thead" style={{ gridTemplateColumns: '90px 1.5fr 2fr 100px 120px 140px' }}>
                <span>Order #</span>
                <span>Customer</span>
                <span>Items Ordered</span>
                <span>Total</span>
                <span>Status</span>
                <span style={{ textAlign: 'right' }}>Actions</span>
              </div>

              {filteredOrders.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--taupe)', fontSize: '0.9rem' }}>
                  No takeout orders matching the selected filter.
                </div>
              ) : filteredOrders.map(order => {
                const orderRef = `#${order._id.toString().slice(-4).toUpperCase()}`;
                const timeAgo = Math.round((new Date() - new Date(order.createdAt)) / 60000);
                const isUpdating = updatingId === order._id;

                let statusBadgeStyle = { background: '#FAF6EF', color: 'var(--cocoa-deep)' };
                let statusLabel = order.status;

                if (['PENDING', 'ACCEPTED'].includes(order.status)) {
                  statusBadgeStyle = { background: 'rgba(200, 155, 74, 0.15)', color: '#8C5815' };
                  statusLabel = 'New / Pending';
                } else if (order.status === 'PREPARING') {
                  statusBadgeStyle = { background: 'rgba(184, 95, 60, 0.15)', color: 'var(--rust, #B85F3C)' };
                  statusLabel = 'In Kitchen';
                } else if (order.status === 'READY') {
                  statusBadgeStyle = { background: 'rgba(46, 107, 62, 0.15)', color: '#2E6B3E' };
                  statusLabel = 'Ready for Pickup';
                } else if (order.status === 'COMPLETED') {
                  statusBadgeStyle = { background: 'rgba(42, 29, 20, 0.08)', color: 'var(--cocoa-deep)' };
                  statusLabel = 'Collected';
                } else if (order.status === 'CANCELLED') {
                  statusBadgeStyle = { background: 'rgba(139, 32, 32, 0.1)', color: '#8B2020' };
                  statusLabel = 'Cancelled';
                }

                return (
                  <div 
                    className="guest-row" 
                    key={order._id} 
                    style={{ 
                      gridTemplateColumns: '90px 1.5fr 2fr 100px 120px 140px',
                      opacity: isUpdating ? 0.6 : 1,
                      background: order.status === 'READY' ? 'rgba(46, 107, 62, 0.03)' : '#FFF'
                    }}
                  >
                    <div style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--cocoa-deep)' }}>
                      {orderRef}
                      <div style={{ fontSize: '0.72rem', color: 'var(--taupe)', fontWeight: 400 }}>
                        {timeAgo < 1 ? 'Just now' : `${timeAgo}m ago`}
                      </div>
                    </div>

                    <div className="g-info">
                      <div className="g-name" style={{ fontWeight: 600 }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--taupe)' }}>
                        {order.customerPhone} {order.customerEmail ? `· ${order.customerEmail}` : ''}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--cocoa-deep)', lineHeight: 1.4 }}>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '4px' }}>
                          <strong>{item.quantity}x</strong> <span>{item.name}</span>
                          {item.notes && <span style={{ color: 'var(--taupe)', fontStyle: 'italic' }}>({item.notes})</span>}
                        </div>
                      ))}
                    </div>

                    <div style={{ fontWeight: 600, color: 'var(--cocoa-deep)', fontSize: '0.88rem' }}>
                      {formatPrice(order.totalAmountKobo)}
                    </div>

                    <div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        display: 'inline-block',
                        ...statusBadgeStyle
                      }}>
                        {statusLabel}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {['PENDING', 'ACCEPTED'].includes(order.status) && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleOrderStatusChange(order._id, 'PREPARING')}
                          style={{
                            background: 'var(--cocoa-deep, #2A1D14)',
                            color: '#FFF',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Start Prep
                        </button>
                      )}

                      {order.status === 'PREPARING' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleOrderStatusChange(order._id, 'READY')}
                          style={{
                            background: '#2E6B3E',
                            color: '#FFF',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Mark Ready 🔔
                        </button>
                      )}

                      {order.status === 'READY' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleOrderStatusChange(order._id, 'COMPLETED')}
                          style={{
                            background: 'var(--cocoa-deep, #2A1D14)',
                            color: '#FFF',
                            border: 'none',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Collected ✓
                        </button>
                      )}

                      {!['COMPLETED', 'CANCELLED'].includes(order.status) && (
                        <button
                          disabled={isUpdating}
                          onClick={() => {
                            if (window.confirm(`Cancel order ${orderRef}?`)) {
                              handleOrderStatusChange(order._id, 'CANCELLED');
                            }
                          }}
                          style={{
                            background: 'none',
                            border: '1px solid rgba(139, 32, 32, 0.4)',
                            color: '#8B2020',
                            padding: '5px 8px',
                            borderRadius: '4px',
                            fontSize: '0.7rem',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      )}

                      {order.status === 'COMPLETED' && (
                        <span style={{ fontSize: '0.75rem', color: '#2E6B3E', fontWeight: 600 }}>Fulfilled</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── TAB 2: TABLE RESERVATIONS ─── */}
        {activeTab === 'reservations' && (
          <div>
            <div className="sec-head">
              <div className="sec-title">Today's Table Reservations</div>
              <div className="sec-count">{reservations.length} total · {pendingResCount} pending · {seatedCount} currently seated</div>
            </div>

            <div className="guest-table">
              <div className="guest-thead" style={{ gridTemplateColumns: '80px 2fr 100px 100px 120px' }}>
                <span>Time</span>
                <span>Name</span>
                <span>Party Size</span>
                <span>Status</span>
                <span style={{ textAlign: 'right' }}>Action</span>
              </div>
              
              {reservations.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', color: 'var(--taupe)', fontSize: '13px' }}>
                  No reservations today.
                </div>
              ) : reservations.map((r) => {
                const isCompleted = r.status === 'completed';
                const isSeated = r.status === 'seated';
                
                return (
                  <div className={`guest-row ${isCompleted ? 'checked' : ''}`} key={r._id} style={{ gridTemplateColumns: '80px 2fr 100px 100px 120px' }}>
                    <div className="g-time" style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.time}</div>
                    <div className="g-info">
                      <div className="g-name">{r.customerName}</div>
                    </div>
                    <div className="g-class">{r.partySize} guests</div>
                    <div>
                      {isCompleted && <span className="badge badge-ink">Completed</span>}
                      {isSeated && <span className="badge badge-ok">Seated</span>}
                      {!isCompleted && !isSeated && <span className="badge badge-gold">{r.status}</span>}
                    </div>
                    <div className="g-status">
                      {!isCompleted && !isSeated && (
                        <button 
                          className="ci-btn" 
                          onClick={() => handleReservationStatusChange(r._id, 'seated')}
                        >
                          Mark Seated
                        </button>
                      )}
                      {isSeated && (
                        <button 
                          className="ci-btn" 
                          onClick={() => handleReservationStatusChange(r._id, 'completed')}
                        >
                          Complete
                        </button>
                      )}
                      {isCompleted && (
                        <button className="ci-btn done" disabled>Finished</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
