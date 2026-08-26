import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { IconShieldCheck, IconClock, IconPin, IconX, IconCheck, IconAlert } from '../components/ui/LineIcons';
import styles from './CMS.module.css';

export default function VenueEnquiriesCMS() {
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
      const url = filterStatus === 'all' ? '/api/venue/enquiries' : `/api/venue/enquiries?status=${filterStatus}`;
      const res = await authFetch(url);
      const data = await res.json();
      if (res.ok) {
        setEnquiries(data.enquiries || []);
      } else {
        toast.error(data.error || 'Failed to fetch enquiries');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error loading venue enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [filterStatus]);

  const handleUpdateStatus = async (id, newStatus, notesToSave) => {
    setUpdating(true);
    try {
      const res = await authFetch(`/api/venue/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: notesToSave !== undefined ? notesToSave : (selectedEnquiry?.adminNotes || '')
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Enquiry marked as ${newStatus}`);
        setEnquiries(prev => prev.map(e => e._id === id ? data.enquiry : e));
        if (selectedEnquiry?._id === id) {
          setSelectedEnquiry(data.enquiry);
        }
      } else {
        toast.error(data.error || 'Failed to update enquiry');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating enquiry');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedEnquiry) return;
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
        setSelectedEnquiry(data.enquiry);
        setEnquiries(prev => prev.map(e => e._id === selectedEnquiry._id ? data.enquiry : e));
      } else {
        toast.error(data.error || 'Failed to save notes');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving notes');
    } finally {
      setUpdating(false);
    }
  };
  const handleSendMessage = async () => {
    if (!selectedEnquiry || !messageText.trim()) return;
    setUpdating(true);
    try {
      const res = await authFetch(`/api/venue/enquiries/${selectedEnquiry._id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Message sent to guest');
        setSelectedEnquiry(data.enquiry);
        setEnquiries(prev => prev.map(eq => eq._id === data.enquiry._id ? data.enquiry : eq));
        setMessageText('');
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while sending message');
    } finally {
      setUpdating(false);
    }
  };


  const openEnquiry = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setEditingNotes(enquiry.adminNotes || '');
    if (enquiry.status === 'new') {
      handleUpdateStatus(enquiry._id, 'viewed');
    }
  };

  const filteredEnquiries = enquiries.filter(e => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = `${e.firstName || ''} ${e.lastName || ''}`.toLowerCase();
    const email = (e.email || '').toLowerCase();
    const org = (e.organisation || '').toLowerCase();
    const eventType = (e.eventType || '').toLowerCase();
    return name.includes(q) || email.includes(q) || org.includes(q) || eventType.includes(q);
  });

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'new': return { background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6' };
      case 'viewed': return { background: '#E8F0FE', color: '#1967D2', border: '1px solid #D2E3FC' };
      case 'quoted': return { background: '#FEF7E0', color: '#B06000', border: '1px solid #FEEFC3' };
      case 'confirmed': return { background: '#CEEAD6', color: '#0D652D', border: '1px solid #81C995', fontWeight: 600 };
      case 'declined': return { background: '#FCE8E6', color: '#C5221F', border: '1px solid #FAD2CF' };
      default: return { background: '#F1F3F4', color: '#5F6368', border: '1px solid #DADCE0' };
    }
  };

  return (
    <div style={{ padding: '0' }}>
      {/* Top Header & Search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.4rem', color: 'var(--cocoa-deep)', margin: 0 }}>
            Venue Hire Enquiries
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--taupe)', margin: '4px 0 0' }}>
            Review, track, and manage private event requests for The Loft, CafÃ©, and spaces.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search guest, org, or event..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid rgba(227, 211, 184, 0.9)',
              fontSize: '13px',
              background: '#FFFDF9',
              minWidth: '240px'
            }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {['all', 'new', 'viewed', 'quoted', 'confirmed', 'declined'].map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: filterStatus === st ? '1px solid var(--cocoa-deep)' : '1px solid rgba(227, 211, 184, 0.8)',
              background: filterStatus === st ? 'var(--cocoa-deep)' : '#FFFDF9',
              color: filterStatus === st ? '#F7EFE1' : 'var(--cocoa-deep)',
              fontSize: '11.5px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Table / List View */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--taupe)' }}>Loading venue enquiries...</div>
      ) : filteredEnquiries.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: '#FFFDF9', borderRadius: '8px', border: '1px dashed rgba(227, 211, 184, 0.8)', color: 'var(--taupe)' }}>
          No venue enquiries found matching your filter.
        </div>
      ) : (
        <div style={{ background: '#FFFDF9', borderRadius: '8px', border: '1px solid rgba(227, 211, 184, 0.8)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#FAF6EF', borderBottom: '1px solid rgba(227, 211, 184, 0.8)', color: 'var(--taupe)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '12px 16px' }}>Date Submitted</th>
                <th style={{ padding: '12px 16px' }}>Guest / Contact</th>
                <th style={{ padding: '12px 16px' }}>Event &amp; Space</th>
                <th style={{ padding: '12px 16px' }}>Target Date</th>
                <th style={{ padding: '12px 16px' }}>Guests</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map(enquiry => (
                <tr 
                  key={enquiry._id}
                  onClick={() => openEnquiry(enquiry)}
                  style={{ borderBottom: '1px solid rgba(227, 211, 184, 0.4)', cursor: 'pointer', transition: 'background 0.15s ease' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#FAF6EF'}
                  onMouseLeave={e => e.currentTarget.style.background = '#FFFDF9'}
                >
                  <td style={{ padding: '12px 16px', color: 'var(--taupe)', fontSize: '12px' }}>
                    {new Date(enquiry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--cocoa-deep)' }}>{enquiry.firstName} {enquiry.lastName}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--taupe)' }}>{enquiry.email} {enquiry.organisation ? `Â· ${enquiry.organisation}` : ''}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: 'var(--cocoa-deep)', fontWeight: 500 }}>{enquiry.eventType}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--taupe)', textTransform: 'capitalize' }}>Space: {enquiry.spacePreference}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--cocoa-deep)' }}>
                    {new Date(enquiry.preferredDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    <div style={{ fontSize: '11px', color: 'var(--taupe)' }}>{enquiry.preferredStartTime || ''} - {enquiry.preferredEndTime || ''}</div>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--cocoa-deep)' }}>
                    {enquiry.guestCount}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 9px',
                      borderRadius: '12px',
                      fontSize: '10.5px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      display: 'inline-block',
                      ...getStatusBadgeStyle(enquiry.status)
                    }}>
                      {enquiry.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEnquiry(enquiry); }}
                      style={{ background: 'none', border: '1px solid rgba(227, 211, 184, 0.9)', padding: '5px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Review â†’
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Enquiry Detail Drawer / Modal */}
      {selectedEnquiry && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(20, 10, 4, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }} onClick={(e) => { if (e.target === e.currentTarget) setSelectedEnquiry(null); }}>
          <div style={{
            background: '#FFFDF9',
            border: '1px solid rgba(227, 211, 184, 0.9)',
            borderRadius: '10px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{
              background: 'var(--cocoa-deep, #2B2015)',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: '#F7EFE1'
            }}>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold, #C89B4A)', fontWeight: 600 }}>
                  Private Event Proposal Desk
                </div>
                <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '20px', margin: '4px 0 0', fontWeight: 400 }}>
                  {selectedEnquiry.eventType}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEnquiry(null)}
                style={{ background: 'none', border: 'none', color: '#F7EFE1', cursor: 'pointer', padding: '4px' }}
              >
                <IconX size={18} color="#F7EFE1" />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Quick Status Control */}
              <div style={{ background: '#FAF6EF', padding: '14px 16px', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.8)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--taupe)', fontWeight: 600 }}>Current Status:</span>
                  <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', textTransform: 'uppercase', ...getStatusBadgeStyle(selectedEnquiry.status) }}>
                    {selectedEnquiry.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['quoted', 'confirmed', 'declined'].map(st => (
                    <button
                      key={st}
                      disabled={updating || selectedEnquiry.status === st}
                      onClick={() => handleUpdateStatus(selectedEnquiry._id, st)}
                      style={{
                        background: selectedEnquiry.status === st ? 'var(--cocoa-deep)' : '#FFFDF9',
                        color: selectedEnquiry.status === st ? '#F7EFE1' : 'var(--cocoa-deep)',
                        border: '1px solid rgba(227, 211, 184, 0.9)',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        cursor: 'pointer'
                      }}
                    >
                      {st === 'quoted' ? 'Mark Quoted' : st === 'confirmed' ? 'Confirm' : 'Decline'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest & Contact Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--taupe)', letterSpacing: '0.06em' }}>Host Name</div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--cocoa-deep)' }}>{selectedEnquiry.firstName} {selectedEnquiry.lastName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--taupe)', letterSpacing: '0.06em' }}>Organisation</div>
                  <div style={{ fontSize: '13px', color: 'var(--cocoa-deep)' }}>{selectedEnquiry.organisation || 'Personal / Private'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--taupe)', letterSpacing: '0.06em' }}>Email</div>
                  <a href={`mailto:${selectedEnquiry.email}`} style={{ fontSize: '13px', color: 'var(--rust)', textDecoration: 'none', fontWeight: 500 }}>{selectedEnquiry.email}</a>
                </div>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--taupe)', letterSpacing: '0.06em' }}>Phone</div>
                  <a href={`tel:${selectedEnquiry.phone}`} style={{ fontSize: '13px', color: 'var(--cocoa-deep)', textDecoration: 'none' }}>{selectedEnquiry.phone || 'None provided'}</a>
                </div>
              </div>

              {/* Event Specification */}
              <div style={{ borderTop: '1px solid rgba(227, 211, 184, 0.6)', paddingTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--taupe)' }}>Space Preference</div>
                  <div style={{ fontWeight: 600, color: 'var(--cocoa-deep)', textTransform: 'capitalize' }}>{selectedEnquiry.spacePreference}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--taupe)' }}>Expected Guests</div>
                  <div style={{ fontWeight: 600, color: 'var(--cocoa-deep)' }}>{selectedEnquiry.guestCount} People</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--taupe)' }}>Target Date</div>
                  <div style={{ fontWeight: 600, color: 'var(--cocoa-deep)' }}>{new Date(selectedEnquiry.preferredDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--taupe)' }}>Event Hours</div>
                  <div style={{ fontSize: '13px', color: 'var(--cocoa-deep)' }}>{selectedEnquiry.preferredStartTime || 'TBD'} â€“ {selectedEnquiry.preferredEndTime || 'TBD'}</div>
                </div>
              </div>

              {/* Requirements Badges */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ padding: '6px 12px', borderRadius: '4px', background: selectedEnquiry.cateringRequired ? 'rgba(46, 107, 62, 0.1)' : '#F1F3F4', color: selectedEnquiry.cateringRequired ? '#1A4024' : '#777', fontSize: '11.5px', border: '1px solid rgba(0,0,0,0.08)' }}>
                  {selectedEnquiry.cateringRequired ? 'âœ“ In-House Catering Requested' : 'âœ• No Catering'}
                </span>
                <span style={{ padding: '6px 12px', borderRadius: '4px', background: selectedEnquiry.avRequired ? 'rgba(46, 107, 62, 0.1)' : '#F1F3F4', color: selectedEnquiry.avRequired ? '#1A4024' : '#777', fontSize: '11.5px', border: '1px solid rgba(0,0,0,0.08)' }}>
                  {selectedEnquiry.avRequired ? 'âœ“ AV & Sound System Requested' : 'âœ• No AV'}
                </span>
                {selectedEnquiry.seatingStyle && (
                  <span style={{ padding: '6px 12px', borderRadius: '4px', background: '#FAF6EF', color: 'var(--cocoa-deep)', fontSize: '11.5px', border: '1px solid rgba(227, 211, 184, 0.8)' }}>
                    Layout: {selectedEnquiry.seatingStyle}
                  </span>
                )}
              </div>

              {/* Event Vision / Description */}
              {selectedEnquiry.description && (
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--taupe)', letterSpacing: '0.06em', marginBottom: '6px' }}>Event Vision &amp; Notes</div>
                  <div style={{ background: '#FAF6EF', padding: '14px', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.7)', fontSize: '13px', lineHeight: '1.6', color: 'var(--cocoa-deep)' }}>
                    {selectedEnquiry.description}
                  </div>
                </div>
              )}

              {/* Admin Internal Notes */}
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--taupe)', letterSpacing: '0.06em', marginBottom: '6px' }}>Internal Staff Notes (Private)</div>
                <textarea
                  rows={3}
                  placeholder="Record quoted rates, contact timestamps, or special arrangements..."
                  value={editingNotes}
                  onChange={e => setEditingNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid rgba(227, 211, 184, 0.9)', fontSize: '12.5px', background: '#FFFDF9' }}
                />
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleSaveNotes}
                  style={{ marginTop: '8px', background: 'var(--cocoa-deep)', color: '#F7EFE1', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Save Internal Notes
                </button>
              </div>

                {/* Messaging with Guest */}
                <div style={{ borderTop: '1px solid rgba(227, 211, 184, 0.6)', paddingTop: '16px', marginTop: '16px' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--taupe)', letterSpacing: '0.06em', marginBottom: '10px' }}>Messages with Guest</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                    {selectedEnquiry.messages && selectedEnquiry.messages.length > 0 ? selectedEnquiry.messages.map((msg, i) => (
                      <div key={i} style={{ padding: '8px 12px', borderRadius: '6px', background: msg.senderRole === 'user' ? '#fff' : '#FAF6EF', border: '1px solid rgba(227, 211, 184, 0.5)', alignSelf: msg.senderRole === 'user' ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                        <div style={{ fontSize: '10px', color: 'var(--taupe)', marginBottom: '4px' }}>{msg.senderName} ({msg.senderRole}) ?· {new Date(msg.createdAt).toLocaleString()}</div>
                        <div style={{ fontSize: '12.5px', color: 'var(--cocoa-deep)' }}>{msg.text}</div>
                      </div>
                    )) : <div style={{ fontSize: '12px', color: 'var(--taupe)' }}>No messages yet.</div>}
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Reply to guest..."
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid rgba(227, 211, 184, 0.9)', fontSize: '12.5px', background: '#FFFDF9' }}
                  />
                  <button
                    type="button"
                    disabled={updating || !messageText.trim()}
                    onClick={handleSendMessage}
                    style={{ marginTop: '8px', background: 'var(--rust)', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '4px', fontSize: '11px', textTransform: 'uppercase', cursor: 'pointer' }}
                  >
                    Send Message
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
