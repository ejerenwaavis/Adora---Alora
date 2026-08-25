import { useState, useEffect } from 'react';
import styles from './KitchenKDS.module.css';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function KitchenKDS() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const { logout } = useAuth();
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/active');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    const timeTimer = setInterval(() => setNow(new Date()), 30000); // Update time every 30s
    
    // Robust Polling Fallback: Fetch orders every 10 seconds to guarantee no missed orders
    const pollTimer = setInterval(() => {
      fetchOrders();
    }, 10000);

    // Initialize Socket.io client (defaults to window.location host)
    import('socket.io-client').then(({ io }) => {
      const socket = io();

      socket.on('connect', () => {
        console.log('Connected to KDS WebSocket!');
      });

      socket.on('new_order', (order) => {
        setOrders(prev => {
          // Prevent duplicates
          if (prev.find(o => o._id === order._id)) return prev;
          return [...prev, order];
        });
        // Play an audio ping here if desired
      });

      socket.on('order_updated', (updatedOrder) => {
        setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
      });

      return () => {
        socket.disconnect();
        clearInterval(timeTimer);
        clearInterval(pollTimer);
      };
    });
    
    return () => {
      clearInterval(timeTimer);
      clearInterval(pollTimer);
    };
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o._id === orderId ? data.order : o));
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Group orders by status
  const pending = orders.filter(o => o.status === 'PENDING');
  const preparing = orders.filter(o => o.status === 'ACCEPTED' || o.status === 'PREPARING');
  const ready = orders.filter(o => o.status === 'READY');

  const OrderCard = ({ order, actions }) => {
    const elapsedMins = Math.floor((now.getTime() - new Date(order.createdAt).getTime()) / 60000);
    
    let urgencyClass = '';
    let elapsedClass = styles.elapsedNormal;

    if (order.status === 'PENDING' || order.status === 'ACCEPTED' || order.status === 'PREPARING') {
      if (elapsedMins >= 10) {
        urgencyClass = styles.urgentRed;
        elapsedClass = styles.elapsedRed;
      } else if (elapsedMins >= 5) {
        urgencyClass = styles.urgentYellow;
        elapsedClass = styles.elapsedYellow;
      }
    }

    return (
      <div className={`${styles.ticket} ${urgencyClass}`}>
        <div className={styles.ticketHeader}>
          <div className={styles.ticketId}>Order #{order._id.slice(-4).toUpperCase()}</div>
          <div className={styles.ticketTime}>
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <span className={`${styles.elapsedTime} ${elapsedClass}`}>
              ({elapsedMins}m)
            </span>
          </div>
        </div>
        <div className={styles.ticketCustomer}>
          {order.customerName} • {order.orderType}
        </div>
        <div className={styles.ticketItems}>
          {order.items.map((item, idx) => (
            <div key={idx} className={styles.itemRow}>
              <span className={styles.itemQty}>{item.quantity}x</span>
              <span className={styles.itemName}>{item.name}</span>
            </div>
          ))}
        </div>
        <div className={styles.ticketActions}>
          {actions}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.kdsContainer}>
      <header className={styles.header}>
        <div className={styles.headerBrand}>Aora House <span>Kitchen Display</span></div>
        <div className={styles.headerRight}>
          <div className={styles.liveIndicator}>
            <span className={styles.pulse}></span>
            Live Sync
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>Sign Out</button>
        </div>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading orders...</div>
      ) : (
        <div className={styles.board}>
          
          {/* COLUMN 1: NEW ORDERS */}
          <div className={styles.column}>
            <div className={styles.colHeader}>
              <h2>New Orders</h2>
              <span className={styles.count}>{pending.length}</span>
            </div>
            <div className={styles.ticketList}>
              {pending.map(order => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  actions={
                    <button 
                      className={styles.btnAccept}
                      onClick={() => updateStatus(order._id, 'PREPARING')}
                    >
                      Accept & Prep
                    </button>
                  } 
                />
              ))}
              {pending.length === 0 && <div className={styles.emptyState}>No new orders</div>}
            </div>
          </div>

          {/* COLUMN 2: PREPARING */}
          <div className={styles.column}>
            <div className={styles.colHeader}>
              <h2>Preparing</h2>
              <span className={styles.count}>{preparing.length}</span>
            </div>
            <div className={styles.ticketList}>
              {preparing.map(order => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  actions={
                    <button 
                      className={styles.btnReady}
                      onClick={() => updateStatus(order._id, 'READY')}
                    >
                      Mark as Ready
                    </button>
                  } 
                />
              ))}
              {preparing.length === 0 && <div className={styles.emptyState}>No orders in prep</div>}
            </div>
          </div>

          {/* COLUMN 3: READY FOR PICKUP */}
          <div className={styles.column}>
            <div className={styles.colHeader}>
              <h2>Ready for Pickup</h2>
              <span className={styles.count}>{ready.length}</span>
            </div>
            <div className={styles.ticketList}>
              {ready.map(order => (
                <OrderCard 
                  key={order._id} 
                  order={order} 
                  actions={
                    <button 
                      className={styles.btnComplete}
                      onClick={() => updateStatus(order._id, 'COMPLETED')}
                    >
                      Complete / Handed Over
                    </button>
                  } 
                />
              ))}
              {ready.length === 0 && <div className={styles.emptyState}>No orders waiting</div>}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
