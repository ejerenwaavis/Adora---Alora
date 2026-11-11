import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './ActivityLogs.module.css';

export default function ActivityLogs() {
  const { authFetch } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = filter ? `/api/admin/logs?category=${encodeURIComponent(filter)}` : '/api/admin/logs';
      const res = await authFetch(url);
      if (!res.ok) throw new Error('Failed to fetch logs');
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const getActionColor = (action = '') => {
    const upper = String(action).toUpperCase();
    if (upper.includes('CREATE') || upper.includes('PUBLISH') || upper.includes('PROVISION') || upper.includes('CHECKIN') || upper.includes('WALKIN') || upper.includes('REACTIVATE') || upper.includes('SIGN')) {
      return '#2E6B3E';
    }
    if (upper.includes('UPDATE') || upper.includes('STATUS') || upper.includes('ADJUST') || upper.includes('TOGGLE') || upper.includes('RESET')) {
      return '#B38136';
    }
    if (upper.includes('DELETE') || upper.includes('DEACTIVATE')) {
      return '#8B3318';
    }
    if (upper === 'LOGIN') return '#0055ff';
    return '#666';
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Activity Logs</h1>
          <p className={styles.subtitle}>Track changes made to settings, staff, café operations, classes, and configurations across Aora House.</p>
        </div>
        
        <select 
          className={styles.filterSelect}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="CAFE">Café &amp; Takeout</option>
          <option value="CLASSES">Classes &amp; Check-ins</option>
          <option value="EVENTS">Events</option>
          <option value="USERS">Staff &amp; Users</option>
          <option value="CONCIERGE">Concierge</option>
          <option value="VENUE">Venue Hire</option>
          <option value="WAITLIST">Waitlist</option>
          <option value="WAIVER">Waivers</option>
          <option value="SETTINGS">Settings &amp; Config</option>
          <option value="FASHION">Fashion &amp; Retail</option>
          <option value="MENU">Café Menu</option>
          <option value="OPERATIONS">Operations</option>
        </select>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className={styles.empty}>No activity found for this category.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Action</th>
                <th>Item Affected</th>
                <th>Category</th>
                <th>User</th>
                <th>Date &amp; Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id}>
                  <td>
                    <span 
                      className={styles.actionBadge} 
                      style={{ 
                        color: getActionColor(log.action),
                        backgroundColor: `${getActionColor(log.action)}15`
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className={styles.itemCell}>
                    <div>{log.itemAffected || log.description || 'System Record'}</div>
                    {log.description && log.itemAffected && log.description !== log.itemAffected && (
                      <div className={styles.detailHint}>{log.description}</div>
                    )}
                    {log.details && log.action === 'UPDATE' && log.details.value && (
                      <span className={styles.detailHint}> → {String(log.details.value)}</span>
                    )}
                  </td>
                  <td>
                    <span className={styles.categoryPill}>{log.category || 'OPERATIONS'}</span>
                  </td>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.avatar}>
                        {log.user?.firstName?.[0] || 'A'}
                      </div>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                        </span>
                        <span className={styles.userRole}>
                          {log.user?.role || 'unknown'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.dateCell}>
                    {new Date(log.createdAt).toLocaleString([], { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
