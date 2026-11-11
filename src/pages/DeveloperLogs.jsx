import React, { useState, useEffect, useCallback } from 'react';

function formatLogAsText(log) {
  const localTime = new Date(log.createdAt).toLocaleString();
  const isoTime = new Date(log.createdAt).toISOString();
  const lines = [
    `============================================================`,
    `DATE (LOCAL): ${localTime}`,
    `TIMESTAMP (UTC): ${isoTime}`,
    `LEVEL: ${String(log.level || 'error').toUpperCase()} | SOURCE: ${log.source || 'server'} | STATUS: ${log.statusCode || 500}`,
    log.path ? `ENDPOINT: ${log.method || 'GET'} ${log.path}` : null,
    log.userEmail ? `USER: ${log.userEmail} (${log.userRole || 'unknown'})` : null,
    `MESSAGE: ${log.message || 'Unknown error'}`,
    log.stack ? `\nSTACK TRACE:\n${log.stack}` : null,
    log.context ? `\nCONTEXT:\n${JSON.stringify(log.context, null, 2)}` : null,
    `============================================================`
  ].filter(Boolean);
  return lines.join('\n');
}

export default function DeveloperLogs() {
  const [token, setToken] = useState(() => sessionStorage.getItem('ah_dev_log_token') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [verifying, setVerifying] = useState(false);

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [sources, setSources] = useState([]);
  const [serverInfo, setServerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const [levelFilter, setLevelFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const [expandedIds, setExpandedIds] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchLogs = useCallback(async (activeToken = token) => {
    if (!activeToken) return;
    setLoading(true);
    setFetchError('');
    try {
      const params = new URLSearchParams();
      if (levelFilter) params.set('level', levelFilter);
      if (sourceFilter) params.set('source', sourceFilter);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('limit', '200');

      const res = await fetch(`/api/developer/logs?${params.toString()}`, {
        headers: { 'X-Dev-Token': activeToken }
      });

      if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem('ah_dev_log_token');
        setToken('');
        setAuthError('Session expired. Please re-enter developer password.');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load logs');

      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setSources(data.sources || []);
      setServerInfo(data.serverInfo || null);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, levelFilter, sourceFilter, searchQuery]);

  useEffect(() => {
    if (token) fetchLogs(token);
  }, [token, fetchLogs]);

  useEffect(() => {
    if (!token || !autoRefresh) return;
    const timer = setInterval(() => fetchLogs(token), 10000);
    return () => clearInterval(timer);
  }, [token, autoRefresh, fetchLogs]);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setAuthError('');
    setVerifying(true);
    try {
      const res = await fetch('/api/developer/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Authentication failed.');
        return;
      }
      sessionStorage.setItem('ah_dev_log_token', data.token);
      setToken(data.token);
      setPassword('');
    } catch (err) {
      setAuthError('Network error verifying password.');
    } finally {
      setVerifying(false);
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem('ah_dev_log_token');
    setToken('');
    setLogs([]);
  };

  const handleCopy = async (text, id = null) => {
    try {
      await navigator.clipboard.writeText(text);
      if (id === 'ALL') {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
      } else {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Clear all recorded developer error logs? This cannot be undone.')) return;
    setClearing(true);
    try {
      const res = await fetch('/api/developer/logs', {
        method: 'DELETE',
        headers: { 'X-Dev-Token': token }
      });
      if (res.ok) {
        setLogs([]);
        setTotal(0);
      }
    } finally {
      setClearing(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getLevelBadgeStyle = (level) => {
    if (level === 'fatal') return { bg: '#7F1D1D', color: '#FEE2E2', border: '#DC2626' };
    if (level === 'warn') return { bg: '#78350F', color: '#FEF3C7', border: '#D97706' };
    return { bg: '#5C1919', color: '#FECACA', border: '#B91C1C' };
  };

  if (!token) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#140E0A',
        color: '#F7EFE1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: '#1E1510',
          border: '1px solid #3A2A1F',
          borderRadius: '10px',
          padding: '32px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: '#C89B4A',
            fontWeight: 700,
            marginBottom: '8px'
          }}>
            Aora House · Engineering
          </div>
          <h1 style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: '26px',
            margin: '0 0 8px 0',
            color: '#F7EFE1',
            fontWeight: 400
          }}>
            Developer Error Logs
          </h1>
          <p style={{ fontSize: '13px', color: '#B5A28E', margin: '0 0 24px 0', lineHeight: 1.5 }}>
            Restricted diagnostics console. Enter the developer password from server environment variables to inspect timestamps and stack traces.
          </p>

          {authError && (
            <div style={{
              background: 'rgba(185, 28, 28, 0.15)',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              color: '#FCA5A5',
              padding: '10px 12px',
              borderRadius: '6px',
              fontSize: '12.5px',
              marginBottom: '16px'
            }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleUnlock}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#C89B4A',
              fontWeight: 600,
              marginBottom: '6px'
            }}>
              Developer Password
            </label>
            <div style={{ position: 'relative', marginBottom: '18px' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter developer password"
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '11px 60px 11px 12px',
                  background: '#120C08',
                  border: '1px solid #4A3628',
                  borderRadius: '6px',
                  color: '#F7EFE1',
                  fontSize: '14px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#B5A28E',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            <button
              type="submit"
              disabled={verifying}
              style={{
                width: '100%',
                padding: '12px',
                background: '#B85F3C',
                color: '#FFFDF9',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                cursor: verifying ? 'not-allowed' : 'pointer',
                opacity: verifying ? 0.7 : 1
              }}
            >
              {verifying ? 'Verifying…' : 'Unlock Diagnostics →'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#140E0A',
      color: '#F7EFE1',
      padding: '28px 24px 60px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: '1px solid #35271D',
          paddingBottom: '20px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#C89B4A', fontWeight: 700, marginBottom: '4px' }}>
              Aora House · Private Engineering Telemetry
            </div>
            <h1 style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: '28px', margin: '0 0 6px 0', color: '#F7EFE1', fontWeight: 400 }}>
              Developer Error Log Console
            </h1>
            {serverInfo && (
              <div style={{ fontSize: '12px', color: '#B5A28E', fontFamily: 'ui-monospace, monospace' }}>
                ENV: <strong style={{ color: '#F7EFE1' }}>{serverInfo.env}</strong> · Node {serverInfo.nodeVersion} · Uptime: {serverInfo.uptimeSeconds}s · Matched: <strong style={{ color: '#C89B4A' }}>{total}</strong>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => handleCopy(logs.map(formatLogAsText).join('\n\n'), 'ALL')}
              disabled={logs.length === 0}
              style={{
                background: copiedAll ? '#2E6B3E' : '#2C2017',
                border: '1px solid #4A3628',
                color: '#F7EFE1',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: logs.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {copiedAll ? 'Copied All ✓' : `Copy All Visible (${logs.length})`}
            </button>
            <button
              type="button"
              onClick={() => fetchLogs()}
              style={{
                background: '#C89B4A',
                border: 'none',
                color: '#18110B',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearing || logs.length === 0}
              style={{
                background: 'rgba(185, 28, 28, 0.2)',
                border: '1px solid rgba(220, 38, 38, 0.45)',
                color: '#FCA5A5',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: clearing || logs.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Clear Logs
            </button>
            <button
              type="button"
              onClick={handleLock}
              style={{
                background: 'none',
                border: '1px solid #4A3628',
                color: '#B5A28E',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Lock Console
            </button>
          </div>
        </header>

        {/* Filters Toolbar */}
        <div style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '20px',
          background: '#1E1510',
          padding: '12px 14px',
          borderRadius: '8px',
          border: '1px solid #35271D'
        }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search error message, endpoint, user, stack trace…"
            style={{
              flex: '1 1 260px',
              padding: '8px 12px',
              background: '#120C08',
              border: '1px solid #4A3628',
              borderRadius: '6px',
              color: '#F7EFE1',
              fontSize: '13px',
              outline: 'none'
            }}
          />
          <select
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              background: '#120C08',
              border: '1px solid #4A3628',
              borderRadius: '6px',
              color: '#F7EFE1',
              fontSize: '13px'
            }}
          >
            <option value="">All Levels</option>
            <option value="fatal">FATAL</option>
            <option value="error">ERROR</option>
            <option value="warn">WARN</option>
          </select>
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            style={{
              padding: '8px 12px',
              background: '#120C08',
              border: '1px solid #4A3628',
              borderRadius: '6px',
              color: '#F7EFE1',
              fontSize: '13px'
            }}
          >
            <option value="">All Sources</option>
            {sources.map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#B5A28E', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (10s)
          </label>
        </div>

        {fetchError && (
          <div style={{
            background: 'rgba(185, 28, 28, 0.15)',
            border: '1px solid rgba(220, 38, 38, 0.45)',
            color: '#FCA5A5',
            padding: '12px 14px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px'
          }}>
            {fetchError}
          </div>
        )}

        {/* Log Entries */}
        {loading && logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#B5A28E' }}>
            Loading developer error telemetry…
          </div>
        ) : logs.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#1E1510',
            border: '1px solid #35271D',
            borderRadius: '10px',
            color: '#B5A28E'
          }}>
            <div style={{ fontSize: '16px', color: '#F7EFE1', marginBottom: '6px', fontWeight: 500 }}>
              No server errors recorded
            </div>
            <div style={{ fontSize: '13px' }}>
              Any 5xx API failures, unhandled runtime errors, Paystack/SMTP faults, or logging exceptions will appear here automatically with timestamps.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {logs.map((log) => {
              const badge = getLevelBadgeStyle(log.level);
              const isExpanded = !!expandedIds[log._id];
              const createdDate = new Date(log.createdAt);
              const dateStamp = createdDate.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: '2-digit'
              });
              const timeStamp = createdDate.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              return (
                <div
                  key={log._id}
                  style={{
                    background: '#1E1510',
                    border: '1px solid #3A2A1F',
                    borderRadius: '8px',
                    padding: '16px 18px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                  }}
                >
                  {/* Meta Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em'
                      }}>
                        {log.level || 'error'} {log.statusCode ? `· ${log.statusCode}` : ''}
                      </span>

                      <span style={{
                        background: '#2C2017',
                        color: '#C89B4A',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'ui-monospace, monospace'
                      }}>
                        {log.source || 'server'}
                      </span>

                      {log.path && (
                        <span style={{
                          color: '#E5D5C3',
                          fontSize: '12px',
                          fontFamily: 'ui-monospace, monospace',
                          fontWeight: 600
                        }}>
                          {log.method} {log.path}
                        </span>
                      )}

                      {log.userEmail && (
                        <span style={{ fontSize: '11.5px', color: '#B5A28E' }}>
                          ({log.userEmail}{log.userRole ? ` · ${log.userRole}` : ''})
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        title={createdDate.toISOString()}
                        style={{
                          fontSize: '11.5px',
                          color: '#B5A28E',
                          fontFamily: 'ui-monospace, monospace'
                        }}
                      >
                        {dateStamp} · {timeStamp}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCopy(formatLogAsText(log), log._id)}
                        style={{
                          background: copiedId === log._id ? '#2E6B3E' : '#2C2017',
                          border: '1px solid #4A3628',
                          color: '#F7EFE1',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        {copiedId === log._id ? 'Copied ✓' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Error Message */}
                  <div style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: '13.5px',
                    color: '#FEE2E2',
                    lineHeight: 1.5,
                    wordBreak: 'break-word'
                  }}>
                    {log.message}
                  </div>

                  {/* Timestamp ISO subline + Toggle Stack/Context */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#8A7663', fontFamily: 'ui-monospace, monospace' }}>
                      UTC: {createdDate.toISOString()}
                    </span>
                    {(log.stack || log.context) && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(log._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#C89B4A',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        {isExpanded ? 'Hide Stack & Context ▲' : 'Inspect Stack & Context ▼'}
                      </button>
                    )}
                  </div>

                  {/* Expanded Stack & Context */}
                  {isExpanded && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {log.stack && (
                        <pre style={{
                          margin: 0,
                          padding: '12px',
                          background: '#110B07',
                          border: '1px solid #35271D',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          color: '#E5D5C3',
                          overflowX: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: 1.5
                        }}>
                          {log.stack}
                        </pre>
                      )}
                      {log.context && (
                        <pre style={{
                          margin: 0,
                          padding: '12px',
                          background: '#110B07',
                          border: '1px solid #35271D',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          color: '#D6C4B0',
                          overflowX: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: 1.5
                        }}>
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
