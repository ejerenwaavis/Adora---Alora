import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import styles from './ActivityLogs.module.css';

export default function ActivityLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = filter ? `/api/admin/logs?category=${filter}` : '/api/admin/logs';
      const res = await axios.get(url);
      setLogs(res.data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const getActionColor = (action) => {
    switch(action) {
      case 'CREATE': return '#2E6B3E';
      case 'UPDATE': return '#B38136';
      case 'DELETE': return '#8B3318';
      case 'PUBLISH': return '#2E6B3E';
      case 'ARCHIVE': return '#666';
      case 'LOGIN': return '#0055ff';
      default: return '#666';
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Activity Logs</h1>
          <p className={styles.subtitle}>Track changes made to settings, content, and configurations across Aora House.</p>
        </div>
        
        <select 
          className={styles.filterSelect}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="SETTINGS">Settings & Config</option>
          <option value="EVENTS">Events</option>
          <option value="FASHION">Fashion & Retail</option>
          <option value="MENU">Café Menu</option>
          <option value="CLASSES">Classes</option>
          <option value="USERS">User Management</option>
          <option value="VENUE">Venue Hire</option>
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
                <th>Date & Time</th>
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
                    {log.itemAffected}
                    {log.details && log.action === 'UPDATE' && log.details.value && (
                      <span className={styles.detailHint}> → {String(log.details.value)}</span>
                    )}
                  </td>
                  <td>
                    <span className={styles.categoryPill}>{log.category}</span>
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
