import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ClerkSearch from './ClerkSearch';

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { authFetch } = useAuth();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await authFetch('/api/clerk/logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const d = new Date(dateString);
    const datePart = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const timePart = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${datePart} · ${timePart}`;
  };

  if (loading) return <div style={{ padding: '40px' }}>Loading...</div>;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">System Activity</div>
          <div className="topbar-sub">Audit trail of clerk operations and check-ins</div>
        </div>
        <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center' }}>
          <ClerkSearch />
          <button className="tb-btn">Export CSV</button>
        </div>
      </div>

      <div className="content">
        <div className="sec-head">
          <div className="sec-title">Recent Logs</div>
          <div className="sec-count">Showing last {logs.length} records</div>
        </div>

        <div className="guest-table">
          <div className="guest-thead" style={{ gridTemplateColumns: '140px 180px 150px 1fr' }}>
            <span>Timestamp</span>
            <span>Clerk User</span>
            <span>Action Type</span>
            <span>Description</span>
          </div>
          
          {logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--taupe)', fontSize: '13px' }}>
              No system logs found for this session.
            </div>
          ) : logs.map(log => (
            <div className="guest-row" key={log._id} style={{ gridTemplateColumns: '140px 180px 150px 1fr' }}>
              <div className="g-time" style={{ fontWeight: 500, color: 'var(--ink)' }}>
                {formatTime(log.createdAt)}
              </div>
              <div className="g-info">
                <div className="g-name">{log.user?.firstName} {log.user?.lastName}</div>
                <div className="g-type" style={{ marginTop: '2px' }}>{log.user?.email}</div>
              </div>
              <div>
                <span className="badge badge-ink" style={{ textTransform: 'uppercase', fontSize: '9px', letterSpacing: '.05em' }}>
                  {log.action}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ink)', lineHeight: 1.4 }}>
                {log.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
