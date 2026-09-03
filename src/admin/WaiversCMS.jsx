import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/ui/Icon';
import styles from './CMS.module.css';

export default function WaiversCMS() {
  const { authFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('records'); // 'records' | 'versions'

  // Versions state
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [newTitle, setNewTitle] = useState('Aora House Movement Studio — Client Liability Waiver & Release');
  const [newContent, setNewContent] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Records state
  const [records, setRecords] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Notification
  const [toast, setToast] = useState({ show: false, text: '', isError: false });

  const showNotification = (text, isError = false) => {
    setToast({ show: true, text, isError });
    setTimeout(() => setToast({ show: false, text: '', isError: false }), 4000);
  };

  useEffect(() => {
    if (activeTab === 'versions') {
      fetchVersions();
    } else {
      fetchRecords(1, search);
    }
  }, [activeTab]);

  const fetchVersions = async () => {
    setLoadingVersions(true);
    try {
      const res = await authFetch('/api/cms/waivers');
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to load waiver versions.', true);
    } finally {
      setLoadingVersions(false);
    }
  };

  const fetchRecords = async (pageNum = 1, searchQuery = '') => {
    setLoadingRecords(true);
    try {
      const query = new URLSearchParams({ page: pageNum, limit: 20, search: searchQuery });
      const res = await authFetch(`/api/cms/waivers/records?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setTotalRecords(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.pages || 1);
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to load waiver records.', true);
    } finally {
      setLoadingRecords(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords(1, search);
  };

  const handlePublishNew = async (e) => {
    e.preventDefault();
    if (!newVersion.trim() || !newTitle.trim() || !newContent.trim()) {
      showNotification('Please fill in Version ID, Title, and Waiver text.', true);
      return;
    }

    setPublishing(true);
    try {
      const res = await authFetch('/api/cms/waivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: newVersion.trim(),
          title: newTitle.trim(),
          content: newContent
        })
      });

      const data = await res.json();
      if (res.ok) {
        showNotification(`Published Version ${data.version}! All members will be required to re-sign.`);
        setShowPublishModal(false);
        setNewVersion('');
        setNewContent('');
        fetchVersions();
      } else {
        showNotification(data.error || 'Failed to publish waiver version.', true);
      }
    } catch (err) {
      console.error(err);
      showNotification('Network error publishing waiver version.', true);
    } finally {
      setPublishing(false);
    }
  };

  const handleActivateVersion = async (versionId, versionName) => {
    if (!window.confirm(`Activate waiver version "${versionName}"? Members on different versions will need to re-sign.`)) {
      return;
    }
    try {
      const res = await authFetch(`/api/cms/waivers/${versionId}/activate`, { method: 'PATCH' });
      if (res.ok) {
        showNotification(`Activated Version ${versionName}`);
        fetchVersions();
      } else {
        const data = await res.json();
        showNotification(data.error || 'Failed to activate version.', true);
      }
    } catch (err) {
      console.error(err);
      showNotification('Error activating waiver version.', true);
    }
  };

  const handleExport = (recordId) => {
    window.open(`/api/cms/waivers/records/${recordId}/export`, '_blank');
  };

  return (
    <div className={styles.container}>
      {toast.show && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: toast.isError ? '#8B2020' : '#2E6B3E',
          color: '#FFF',
          padding: '12px 20px',
          borderRadius: '6px',
          zIndex: 3000,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          fontSize: '13px',
          fontWeight: 500
        }}>
          {toast.text}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Waivers &amp; Audit Records</h1>
          <p className={styles.subtitle}>
            Digital Liability Waivers, version control, and forensic member signing audit logs for Nigerian law compliance.
          </p>
        </div>
        <div className={styles.actions}>
          {activeTab === 'versions' && (
            <button
              onClick={() => {
                setShowPublishModal(true);
                if (versions.length > 0 && !newContent) {
                  setNewContent(versions[0].content || '');
                }
              }}
              className="btn btn-primary"
              style={{ background: 'var(--rust, #A4451F)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              + Publish New Version
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--line, rgba(227, 211, 184, 0.7))', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('records')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'records' ? '2.5px solid var(--gold, #C89B4A)' : '2.5px solid transparent',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 600,
            color: activeTab === 'records' ? 'var(--cocoa-deep, #2B2015)' : 'var(--taupe, #9C8770)',
            cursor: 'pointer'
          }}
        >
          Signed Records ({totalRecords})
        </button>
        <button
          onClick={() => setActiveTab('versions')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'versions' ? '2.5px solid var(--gold, #C89B4A)' : '2.5px solid transparent',
            padding: '10px 18px',
            fontSize: '13px',
            fontWeight: 600,
            color: activeTab === 'versions' ? 'var(--cocoa-deep, #2B2015)' : 'var(--taupe, #9C8770)',
            cursor: 'pointer'
          }}
        >
          Waiver Versions ({versions.length})
        </button>
      </div>

      {/* TAB 1: SIGNED RECORDS */}
      {activeTab === 'records' && (
        <div>
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search by member name, email, IP, or version..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '6px',
                border: '1px solid rgba(227, 211, 184, 0.9)',
                background: '#FFFDF9',
                fontSize: '13px'
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '13px' }}>
              Search
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); fetchRecords(1, ''); }}
                className="btn btn-outline"
                style={{ padding: '10px 16px', fontSize: '13px' }}
              >
                Clear
              </button>
            )}
          </form>

          {loadingRecords ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--taupe)' }}>Loading audit records...</div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFDF9', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', margin: '0 0 6px' }}>No Signed Waiver Records Found</h3>
              <p style={{ color: 'var(--taupe)', fontSize: '13px' }}>Signed electronic waivers will automatically be captured and audited here.</p>
            </div>
          ) : (
            <div style={{ background: '#FFFDF9', border: '1px solid var(--line)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--cocoa-deep, #2B2015)', color: '#F7EFE1' }}>
                    <th style={{ padding: '12px 16px' }}>Member Name</th>
                    <th style={{ padding: '12px 16px' }}>Email</th>
                    <th style={{ padding: '12px 16px' }}>Version</th>
                    <th style={{ padding: '12px 16px' }}>Date Signed</th>
                    <th style={{ padding: '12px 16px' }}>IP Address</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, idx) => (
                    <tr key={r._id} style={{ borderBottom: '1px solid rgba(227, 211, 184, 0.4)', background: idx % 2 === 0 ? '#FFFDF9' : '#FAF6EF' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--cocoa-deep)' }}>
                        {r.memberName || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#555' }}>
                        {r.memberEmail || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: '#FAF0DE', color: '#945800', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 600 }}>
                          v{r.waiverVersion}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#666' }}>
                        {new Date(r.signedAt).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '11.5px', color: '#666' }}>
                        {r.ipAddress}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => setSelectedRecord(r)}
                            style={{ background: 'none', border: '1px solid #CCC', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleExport(r._id)}
                            style={{ background: 'var(--forest, #2E6B3E)', color: '#FFF', border: 'none', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: 500 }}
                          >
                            Export HTML
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--line)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--taupe)' }}>
                    Page {page} of {totalPages} ({totalRecords} total records)
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      disabled={page <= 1}
                      onClick={() => fetchRecords(page - 1, search)}
                      className="btn btn-outline"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      ← Prev
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => fetchRecords(page + 1, search)}
                      className="btn btn-outline"
                      style={{ padding: '6px 14px', fontSize: '12px' }}
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WAIVER VERSIONS */}
      {activeTab === 'versions' && (
        <div>
          {loadingVersions ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--taupe)' }}>Loading versions...</div>
          ) : versions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFDF9', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', margin: '0 0 6px' }}>No Published Waiver Versions</h3>
              <p style={{ color: 'var(--taupe)', fontSize: '13px' }}>Click "Publish New Version" or run the seed script to publish version 2026-09.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {versions.map((v) => (
                <div
                  key={v._id}
                  style={{
                    background: '#FFFDF9',
                    border: v.isActive ? '2px solid #2E6B3E' : '1px solid var(--line)',
                    borderRadius: '8px',
                    padding: '20px 24px',
                    boxShadow: v.isActive ? '0 4px 16px rgba(46, 107, 62, 0.1)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        background: v.isActive ? '#2E6B3E' : '#777',
                        color: '#FFF',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em'
                      }}>
                        {v.isActive ? 'Active Sitewide' : 'Archived'}
                      </span>
                      <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', margin: 0, color: 'var(--cocoa-deep)' }}>
                        Version {v.version} — {v.title}
                      </h3>
                    </div>

                    {!v.isActive && (
                      <button
                        onClick={() => handleActivateVersion(v._id, v.version)}
                        className="btn btn-outline"
                        style={{ padding: '6px 14px', fontSize: '12px' }}
                      >
                        Set as Active Version
                      </button>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--taupe)', marginBottom: '14px' }}>
                    Published on {new Date(v.publishedAt || v.createdAt).toLocaleDateString()} by {v.publishedBy?.firstName ? `${v.publishedBy.firstName} ${v.publishedBy.lastName}` : 'System Admin'}
                  </div>

                  <details style={{ background: '#FAF6EF', padding: '12px 16px', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.6)' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--cocoa-deep)' }}>
                      View Full Waiver Text (HTML Content)
                    </summary>
                    <div
                      style={{ marginTop: '14px', maxHeight: '250px', overflowY: 'auto', fontSize: '12.5px', background: '#FFF', padding: '14px', borderRadius: '4px', border: '1px solid #E3D3B8' }}
                      dangerouslySetInnerHTML={{ __html: v.content }}
                    />
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: PUBLISH NEW VERSION */}
      {showPublishModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20, 10, 4, 0.8)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#FFFDF9', borderRadius: '8px', maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px', border: '1px solid #E3D3B8', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', margin: 0, color: 'var(--cocoa-deep)' }}>
                Publish New Waiver Version
              </h2>
              <button onClick={() => setShowPublishModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: '#FAF0DE', border: '1px solid #E8C88B', color: '#945800', padding: '12px 16px', borderRadius: '6px', fontSize: '12.5px', marginBottom: '20px' }}>
              ⚠️ <strong>Important Legal Notice:</strong> Publishing a new version will immediately deactivate previous versions and require all existing members to review and re-sign before their next class booking.
            </div>

            <form onSubmit={handlePublishNew} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Version ID (e.g., 2026-09 or v2.0) *</label>
                <input
                  type="text"
                  required
                  placeholder="2026-09"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #E3D3B8', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Waiver Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '4px', border: '1px solid #E3D3B8', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Waiver Content (HTML) *</label>
                <textarea
                  required
                  rows={12}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #E3D3B8', fontFamily: 'monospace', fontSize: '12px', lineHeight: '1.5' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="btn btn-outline"
                  style={{ padding: '10px 20px', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="btn btn-primary"
                  style={{ background: 'var(--rust, #A4451F)', padding: '10px 24px', fontSize: '12px', fontWeight: 600 }}
                >
                  {publishing ? 'Publishing...' : 'Publish & Require Re-sign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW SINGLE RECORD */}
      {selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20, 10, 4, 0.8)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#FFFDF9', borderRadius: '8px', maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', border: '1px solid #E3D3B8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', margin: 0 }}>
                Signed Waiver Audit Record
              </h2>
              <button onClick={() => setSelectedRecord(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ background: '#FAF6EF', padding: '14px 18px', borderRadius: '6px', fontSize: '12.5px', marginBottom: '16px', lineHeight: '1.8' }}>
              <div><strong>Member:</strong> {selectedRecord.memberName} ({selectedRecord.memberEmail})</div>
              <div><strong>Signed At:</strong> {new Date(selectedRecord.signedAt).toUTCString()}</div>
              <div><strong>Waiver Version:</strong> v{selectedRecord.waiverVersion}</div>
              <div><strong>IP Address:</strong> {selectedRecord.ipAddress}</div>
              <div><strong>Method:</strong> {selectedRecord.method}</div>
              <div><strong>User Agent:</strong> <span style={{ wordBreak: 'break-all' }}>{selectedRecord.userAgent}</span></div>
            </div>

            <div style={{ border: '1px solid #E3D3B8', padding: '16px', borderRadius: '6px', maxHeight: '260px', overflowY: 'auto', fontSize: '12.5px', background: '#FFF' }}
              dangerouslySetInnerHTML={{ __html: selectedRecord.waiverText }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setSelectedRecord(null)} className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '12px' }}>
                Close
              </button>
              <button onClick={() => handleExport(selectedRecord._id)} className="btn btn-primary" style={{ background: '#2E6B3E', padding: '8px 18px', fontSize: '12px' }}>
                Download HTML Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
