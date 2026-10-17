import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { IconShieldCheck, IconClock, IconPin, IconX, IconCheck, IconAlert } from '../components/ui/LineIcons';
import styles from './CMS.module.css';

export default function GuestConciergeCMS() {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [messageText, setMessageText] = useState('');

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const url = filterStatus === 'all' ? '/api/support/concierge-requests' : `/api/support/concierge-requests?status=${filterStatus}`;
      const res = await authFetch(url);
      const data = await res.json();
      if (res.ok) {
        setEnquiries(data || []);
      } else {
        toast.error(data.error || 'Failed to fetch requests');
      }
    } catch (err) {
      toast.error('Network error loading requests');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEnquiries();
  }, [filterStatus]);

  const handleUpdateStatus = async (id, newStatus, notesToSave) => {
    setUpdating(true);
    try {
      const isVenue = selectedEnquiry ? selectedEnquiry.isVenue : enquiries.find(e => e._id === id)?.isVenue;
      const url = isVenue ? `/api/venue/enquiries/${id}` : `/api/support/${id}/status`;
      
      const payload = isVenue ? {
        status: newStatus,
        adminNotes: notesToSave !== undefined ? notesToSave : (selectedEnquiry?.adminNotes || '')
      } : { status: newStatus };

      const res = await authFetch(url, {
        method: isVenue ? 'PATCH' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success(`Request marked as ${newStatus}`);
        fetchEnquiries();
        if (selectedEnquiry?._id === id) {
          setSelectedEnquiry(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update');
      }
    } catch (err) {
      toast.error('Server error updating status');
    }
    setUpdating(false);
  };

  const handleSaveNotes = async () => {
    if (!selectedEnquiry || !selectedEnquiry.isVenue) return;
    setUpdating(true);
    try {
      const res = await authFetch(`/api/venue/enquiries/${selectedEnquiry._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: editingNotes })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Admin notes saved');
        setSelectedEnquiry(prev => ({ ...prev, originalData: { ...prev.originalData, adminNotes: editingNotes } }));
        fetchEnquiries();
      } else {
        toast.error(data.error || 'Failed to save notes');
      }
    } catch (err) {
      toast.error('Server error saving notes');
    }
    setUpdating(false);
  };

  const handleSendMessage = async () => {
    if (!selectedEnquiry || !messageText.trim()) return;
    setUpdating(true);
    try {
      const url = selectedEnquiry.isVenue ? `/api/venue/enquiries/${selectedEnquiry._id}/message` : `/api/support/${selectedEnquiry._id}/message`;
      const res = await authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Message sent');
        const updatedDoc = selectedEnquiry.isVenue ? data.enquiry : data.ticket;
        setSelectedEnquiry(prev => ({ ...prev, messages: updatedDoc.messages }));
        setMessageText('');
        fetchEnquiries();
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (err) {
      toast.error('Server error sending message');
    }
    setUpdating(false);
  };

  const filteredEnquiries = enquiries.filter(eq => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const typeMatch = eq.type.toLowerCase().includes(q);
    const nameMatch = eq.user ? `${eq.user.firstName} ${eq.user.lastName}`.toLowerCase().includes(q) : false;
    return typeMatch || nameMatch;
  });

  return (
    <div className={styles.cmsContainer}>
      <div className={styles.cmsHeader}>
        <div>
          <h1 className={styles.cmsTitle}>Guest Concierge &amp; Support</h1>
          <p className={styles.cmsSubtitle}>Manage member messages, tickets, and venue hire requests</p>
        </div>
      </div>

      <div className={styles.cmsControls}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
          <select
            className={styles.cmsSelect}
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="new">New (Venue)</option>
            <option value="open">Open (Tickets)</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <input
            type="text"
            placeholder="Search by name or type..."
            className={styles.cmsInput}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ maxWidth: '300px' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--taupe)' }}>Loading requests...</div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredEnquiries.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--taupe)', background: '#FFF', borderRadius: '12px' }}>
                No requests found.
              </div>
            ) : (
              filteredEnquiries.map(eq => (
                <div 
                  key={eq._id}
                  onClick={() => {
                    setSelectedEnquiry(eq);
                    setEditingNotes(eq.originalData?.adminNotes || '');
                  }}
                  style={{
                    background: selectedEnquiry?._id === eq._id ? 'var(--paper)' : '#FFF',
                    border: selectedEnquiry?._id === eq._id ? '2px solid var(--cocoa-deep)' : '1px solid rgba(227, 211, 184, 0.6)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--cocoa-deep)' }}>
                      {eq.user?.firstName} {eq.user?.lastName}
                    </h3>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      padding: '4px 8px', 
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      background: ['new','open'].includes(eq.status) ? 'rgba(164, 69, 31, 0.1)' : 'rgba(156, 135, 112, 0.1)',
                      color: ['new','open'].includes(eq.status) ? 'var(--rust)' : 'var(--taupe)'
                    }}>
                      {eq.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--cocoa-deep)', fontWeight: 500, marginBottom: '6px' }}>
                    {eq.type}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--taupe)' }}>
                    {eq.subject}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--taupe)', marginTop: '8px', opacity: 0.8 }}>
                    {new Date(eq.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ flex: '1.5', position: 'sticky', top: '2rem' }}>
            {selectedEnquiry ? (
              <div style={{ background: '#FFF', borderRadius: '16px', border: '1px solid rgba(227, 211, 184, 0.6)', overflow: 'hidden' }}>
                <div style={{ padding: '2rem', borderBottom: '1px solid rgba(227, 211, 184, 0.4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                      <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--cocoa-deep)' }}>{selectedEnquiry.user?.firstName} {selectedEnquiry.user?.lastName}</h2>
                      <div style={{ color: 'var(--taupe)', fontSize: '0.9rem' }}>{selectedEnquiry.user?.email}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {selectedEnquiry.status !== 'resolved' && selectedEnquiry.status !== 'closed' && (
                        <button 
                          onClick={() => handleUpdateStatus(selectedEnquiry._id, 'resolved')}
                          disabled={updating}
                          style={{ background: 'var(--cocoa-deep)', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Mark Resolved
                        </button>
                      )}
                      {selectedEnquiry.status !== 'closed' && (
                        <button 
                          onClick={() => handleUpdateStatus(selectedEnquiry._id, 'closed')}
                          disabled={updating}
                          style={{ background: 'transparent', color: 'var(--rust)', border: '1px solid var(--rust)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    <div>
                      <div style={{ color: 'var(--taupe)', marginBottom: '4px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Type</div>
                      <strong>{selectedEnquiry.type}</strong>
                    </div>
                    <div>
                      <div style={{ color: 'var(--taupe)', marginBottom: '4px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Subject</div>
                      <strong>{selectedEnquiry.subject}</strong>
                    </div>
                    {selectedEnquiry.isVenue && (
                      <>
                        <div>
                          <div style={{ color: 'var(--taupe)', marginBottom: '4px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Event Type</div>
                          <strong>{selectedEnquiry.originalData?.eventType}</strong>
                        </div>
                        <div>
                          <div style={{ color: 'var(--taupe)', marginBottom: '4px', fontSize: '0.8rem', textTransform: 'uppercase' }}>Guest Count</div>
                          <strong>{selectedEnquiry.originalData?.guestCount}</strong>
                        </div>
                      </>
                    )}
                  </div>

                  {selectedEnquiry.isVenue && (
                    <div style={{ marginBottom: '2rem' }}>
                      <div style={{ color: 'var(--taupe)', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Internal Admin Notes</div>
                      <textarea
                        value={editingNotes}
                        onChange={e => setEditingNotes(e.target.value)}
                        style={{ width: '100%', minHeight: '80px', padding: '12px', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical', marginBottom: '8px' }}
                        placeholder="Add private notes here..."
                      />
                      <button 
                        onClick={handleSaveNotes}
                        disabled={updating || editingNotes === selectedEnquiry.originalData?.adminNotes}
                        style={{ background: '#FAF6EF', color: 'var(--cocoa-deep)', border: '1px solid rgba(227, 211, 184, 0.9)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Save Notes
                      </button>
                    </div>
                  )}

                  <div>
                    <div style={{ color: 'var(--taupe)', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>Conversation Thread</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', padding: '0 8px 16px 0', borderBottom: '1px solid rgba(227, 211, 184, 0.3)', marginBottom: '16px' }}>
                      {selectedEnquiry.messages && selectedEnquiry.messages.length > 0 ? selectedEnquiry.messages.map((msg, i) => {
                        const isStaff = msg.senderRole !== 'user';
                        return (
                          <div key={i} style={{ 
                            alignSelf: isStaff ? 'flex-end' : 'flex-start', 
                            background: isStaff ? 'var(--paper)' : '#F5F5F5', 
                            padding: '12px 16px', 
                            borderRadius: '12px', 
                            borderBottomRightRadius: isStaff ? '2px' : '12px',
                            borderBottomLeftRadius: !isStaff ? '2px' : '12px',
                            maxWidth: '85%',
                            border: '1px solid rgba(227, 211, 184, 0.4)'
                          }}>
                            <div style={{ fontSize: '0.75rem', color: 'var(--taupe)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                              <strong style={{ color: isStaff ? 'var(--cocoa-deep)' : 'inherit' }}>{msg.senderName} {isStaff ? '(Concierge)' : ''}</strong>
                              <span>{new Date(msg.createdAt).toLocaleString()}</span>
                            </div>
                            <div style={{ fontSize: '0.95rem', color: 'var(--cocoa-deep)', lineHeight: 1.5 }}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      }) : (
                        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--taupe)', fontStyle: 'italic', fontSize: '0.9rem' }}>
                          No messages in this thread yet.
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <input 
                        type="text" 
                        placeholder="Type a reply to the guest..." 
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                        style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(227, 211, 184, 0.9)', fontSize: '0.95rem' }}
                      />
                      <button 
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || updating}
                        style={{ background: 'var(--rust)', color: '#FFF', border: 'none', padding: '0 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Send
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: '#FFF', borderRadius: '16px', border: '1px dashed rgba(227, 211, 184, 0.8)', padding: '4rem 2rem', textAlign: 'center', color: 'var(--taupe)' }}>
                Select a request from the left to view details and reply.
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
