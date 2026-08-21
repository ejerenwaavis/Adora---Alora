import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import styles from './CMS.module.css';

export default function EventsCMS() {
  const { authFetch } = useAuth();
  const { confirmAction } = useModal();
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const defaultVenueForm = { name: '', slug: '', description: '', shortDescription: '', suitableFor: '', capacity: 0, priceKobo: 0, features: '', sortOrder: 0, isActive: true, galleryItems: [] };
  const defaultEventForm = { 
    title: '', slug: '', description: '', shortDescription: '', 
    organiser: 'Aora House', bookingDestination: 'internal', externalUrl: '', externalOrganizerCta: '',
    startDate: '', endDate: '', location: '', venueSpace: '',
    capacity: 0, ticketsSold: 0, priceKobo: 0, isFree: false,
    status: 'draft', isFeatured: false,
    coverImage: null, existingCoverImage: ''
  };

  const [venueForm, setVenueForm] = useState(defaultVenueForm);
  const [eventForm, setEventForm] = useState(defaultEventForm);
  
  const [editingVenueId, setEditingVenueId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [activeTab, setActiveTab] = useState('events');
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, published, draft, past

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [venuesRes, eventsRes] = await Promise.all([
        authFetch('/api/cms/venue-spaces'),
        authFetch('/api/cms/events')
      ]);
      if (venuesRes.ok) setVenues(await venuesRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  // Venues
  async function handleVenueSubmit(e) {
    e.preventDefault();
    try {
      const url = editingVenueId ? `/api/cms/venue-spaces/${editingVenueId}` : '/api/cms/venue-spaces';
      const method = editingVenueId ? 'PATCH' : 'POST';
      
      const formData = new FormData();
      formData.append('name', venueForm.name);
      formData.append('slug', venueForm.slug);
      formData.append('description', venueForm.description);
      formData.append('shortDescription', venueForm.shortDescription);
      formData.append('capacity', venueForm.capacity);
      formData.append('priceKobo', venueForm.priceKobo);
      formData.append('features', venueForm.features);
      formData.append('suitableFor', venueForm.suitableFor);
      formData.append('sortOrder', venueForm.sortOrder);
      formData.append('isActive', venueForm.isActive);

      const mediaOrder = [];
      venueForm.galleryItems.forEach((item) => {
        if (item.type === 'existing') {
          formData.append('existingGallery', item.url);
          mediaOrder.push('existing');
        } else {
          formData.append('gallery', item.file);
          mediaOrder.push('new');
        }
      });
      formData.append('mediaOrder', JSON.stringify(mediaOrder));

      const res = await authFetch(url, {
        method,
        body: formData
      });
      if (res.ok) {
        setVenueForm(defaultVenueForm);
        setEditingVenueId(null);
        setView('list');
        loadData();
      }
    } catch (err) { console.error(err); }
  }

  function handleVenueDelete(id) {
    confirmAction('Delete Venue Space', 'Are you sure you want to delete this venue space?', async () => {
      try {
        const res = await authFetch(`/api/cms/venue-spaces/${id}`, { method: 'DELETE' });
        if (res.ok) loadData();
      } catch (err) { console.error(err); }
    });
  }

  function editVenue(venue) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingVenueId(venue._id);
    setVenueForm({ 
      name: venue.name, slug: venue.slug, description: venue.description || '', 
      shortDescription: venue.shortDescription || '', suitableFor: venue.suitableFor?.join(', ') || '',
      capacity: venue.capacity || 0, priceKobo: venue.priceKobo || 0, 
      features: venue.amenities?.join(', ') || '', sortOrder: venue.sortOrder || 0, isActive: venue.isActive ?? true,
      galleryItems: venue.images ? venue.images.map(url => ({ type: 'existing', url })) : []
    });
    setActiveTab('venues');
    setView('form');
  }

  const handleDragStart = (e, position) => {
    dragItem.current = position;
  };

  const handleDragEnter = (e, position) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const newList = [...venueForm.galleryItems];
      const draggedItemContent = newList[dragItem.current];
      newList.splice(dragItem.current, 1);
      newList.splice(dragOverItem.current, 0, draggedItemContent);
      dragItem.current = null;
      dragOverItem.current = null;
      setVenueForm({ ...venueForm, galleryItems: newList });
    }
  };

  // Events
  async function handleEventSubmit(e) {
    e.preventDefault();
    try {
      const url = editingEventId ? `/api/cms/events/${editingEventId}` : '/api/cms/events';
      const method = editingEventId ? 'PATCH' : 'POST';
      
      const formData = new FormData();
      formData.append('title', eventForm.title);
      formData.append('slug', eventForm.slug);
      formData.append('description', eventForm.description);
      formData.append('shortDescription', eventForm.shortDescription);
      formData.append('organiser', eventForm.organiser);
      formData.append('bookingDestination', eventForm.bookingDestination);
      
      if (eventForm.bookingDestination === 'external_url') {
        formData.append('externalUrl', eventForm.externalUrl);
        formData.append('externalOrganizerCta', eventForm.externalOrganizerCta);
      } else {
        formData.append('externalUrl', '');
        formData.append('externalOrganizerCta', '');
      }

      formData.append('startDate', eventForm.startDate);
      formData.append('endDate', eventForm.endDate);
      formData.append('location', eventForm.location);
      formData.append('venueSpace', eventForm.venueSpace);
      formData.append('capacity', eventForm.capacity);
      formData.append('ticketsSold', eventForm.ticketsSold);
      formData.append('priceKobo', eventForm.priceKobo);
      formData.append('isFree', eventForm.isFree);
      formData.append('status', eventForm.status);
      formData.append('isFeatured', eventForm.isFeatured);
      
      if (eventForm.coverImage) formData.append('coverImage', eventForm.coverImage);

      const res = await authFetch(url, {
        method,
        body: formData
      });
      if (res.ok) {
        setEventForm(defaultEventForm);
        setEditingEventId(null);
        setView('list');
        loadData();
      }
    } catch (err) { console.error(err); }
  }

  function handleEventDelete(id) {
    confirmAction('Delete Event', 'Are you sure you want to delete this event?', async () => {
      try {
        const res = await authFetch(`/api/cms/events/${id}`, { method: 'DELETE' });
        if (res.ok) loadData();
      } catch (err) { console.error(err); }
    });
  }

  function editEvent(evt) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingEventId(evt._id);
    setEventForm({ 
      title: evt.title, slug: evt.slug, description: evt.description || '', shortDescription: evt.shortDescription || '',
      organiser: evt.organiser, bookingDestination: evt.bookingDestination, externalUrl: evt.externalUrl || '', externalOrganizerCta: evt.externalOrganizerCta || '',
      startDate: evt.startDate ? new Date(evt.startDate).toISOString().slice(0, 16) : '', 
      endDate: evt.endDate ? new Date(evt.endDate).toISOString().slice(0, 16) : '', 
      location: evt.location || '', venueSpace: evt.venueSpace?._id || '',
      capacity: evt.capacity || 0, ticketsSold: evt.ticketsSold || 0, priceKobo: evt.priceKobo || 0, 
      isFree: evt.isFree || false, status: evt.status, isFeatured: evt.isFeatured || false,
      existingCoverImage: evt.coverImage || '', coverImage: null
    });
    setActiveTab('events');
    setView('form');
  }

  const isPast = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const filteredVenues = venues.filter(v => {
    if (searchQuery && !v.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter === 'active' && !v.isActive) return false;
    if (statusFilter === 'inactive' && v.isActive) return false;
    return true;
  });

  const filteredEvents = events.filter(e => {
    if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    const past = isPast(e.endDate || e.startDate);
    
    if (statusFilter === 'past' && !past) return false;
    if (statusFilter === 'upcoming' && past) return false;
    if (statusFilter === 'published' && e.status !== 'published') return false;
    if (statusFilter === 'draft' && e.status !== 'draft') return false;
    
    return true;
  }).sort((a, b) => new Date(b.startDate) - new Date(a.startDate)); // Newest first

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>Venues & Events</h1>
      
      {view === 'list' && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button className={activeTab === 'events' ? styles.btn : styles.btnOutline} onClick={() => { setActiveTab('events'); setSearchQuery(''); setStatusFilter('all'); }}>Events</button>
          <button className={activeTab === 'venues' ? styles.btn : styles.btnOutline} onClick={() => { setActiveTab('venues'); setSearchQuery(''); setStatusFilter('all'); }}>Venue Spaces</button>
        </div>
      )}

      {activeTab === 'venues' && (
        <>
          {view === 'list' && (
            <>
              <div className={styles.actionBar}>
                <div className={styles.filterGroup}>
                  <input type="text" placeholder="Search venues..." className={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <button className={styles.btn} onClick={() => { setEditingVenueId(null); setVenueForm(defaultVenueForm); setView('form'); }}>
                  + Create New Venue
                </button>
              </div>

              <div className={styles.list}>
                {filteredVenues.length === 0 ? (
                  <div className={styles.empty}>No venue spaces found.</div>
                ) : (
                  filteredVenues.map(v => (
                    <div key={v._id} className={`${styles.listItem} ${!v.isActive ? styles.inactive : ''}`}>
                      <div className={styles.itemContent} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {v.images && v.images.length > 0 && <img src={v.images[0]} alt="" style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}} />}
                        <div>
                          <strong>{v.name}</strong> <span className={styles.meta}>(Cap: {v.capacity})</span>
                        </div>
                      </div>
                      <div className={styles.itemActions}>
                        <button onClick={() => editVenue(v)} className={styles.btnOutline}>Edit</button>
                        <button onClick={() => handleVenueDelete(v._id)} className={styles.btnDanger}>Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {view === 'form' && (
            <div className={styles.card}>
              <div className={styles.formHeader}>
                <button className={styles.backBtn} onClick={() => { setView('list'); setVenueForm(defaultVenueForm); setEditingVenueId(null); }}>
                  &larr; Back to List
                </button>
                <h2 className={styles.cardTitle} style={{marginBottom: 0}}>{editingVenueId ? 'Edit Venue Space' : 'New Venue Space'}</h2>
              </div>
              <form onSubmit={handleVenueSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Name *</label>
                  <input type="text" value={venueForm.name} onChange={e => setVenueForm({...venueForm, name: e.target.value})} required />
                </div>
                <div className={styles.field}>
                  <label>Slug *</label>
                  <input type="text" value={venueForm.slug} onChange={e => setVenueForm({...venueForm, slug: e.target.value})} required />
                </div>
              </div>
              
              <div className={styles.field}>
                <label>Subtitle (Short Description)</label>
                <input type="text" value={venueForm.shortDescription} onChange={e => setVenueForm({...venueForm, shortDescription: e.target.value})} placeholder="e.g. A flexible venue created for meaningful learning..." />
              </div>
              
              <div className={styles.field}>
                <label>Description</label>
                <textarea rows="3" value={venueForm.description} onChange={e => setVenueForm({...venueForm, description: e.target.value})} />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Capacity</label>
                  <input type="number" value={venueForm.capacity} onChange={e => setVenueForm({...venueForm, capacity: Number(e.target.value)})} />
                </div>
                <div className={styles.field}>
                  <label>Price (Kobo/Cents)</label>
                  <input type="number" value={venueForm.priceKobo} onChange={e => setVenueForm({...venueForm, priceKobo: Number(e.target.value)})} />
                </div>
              </div>

              <div className={styles.field}>
                <label>Suitable For (comma separated)</label>
                <input type="text" value={venueForm.suitableFor} onChange={e => setVenueForm({...venueForm, suitableFor: e.target.value})} placeholder="e.g. Seminars, Workshops, Masterclasses" />
              </div>

              <div className={styles.field}>
                <label>Features / Amenities (comma separated)</label>
                <input type="text" value={venueForm.features} onChange={e => setVenueForm({...venueForm, features: e.target.value})} placeholder="e.g. WiFi, Projector, Sound System" />
              </div>
              
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Sort Order</label>
                  <input type="number" value={venueForm.sortOrder} onChange={e => setVenueForm({...venueForm, sortOrder: Number(e.target.value)})} />
                </div>
                <div className={styles.checkboxField} style={{marginTop: '2rem'}}>
                  <input type="checkbox" id="venueActive" checked={venueForm.isActive} onChange={e => setVenueForm({...venueForm, isActive: e.target.checked})} />
                  <label htmlFor="venueActive">Active</label>
                </div>
              </div>

              {/* GALLERY UPLOAD */}
              <div className={styles.field} style={{ borderTop: '1px solid #eaeaea', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <label>Venue Gallery (Up to 5 images)</label>
                <p style={{fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem'}}>
                  The first image will be used as the main cover photo for the space.
                </p>
                <input type="file" multiple accept="image/*" onChange={e => {
                  const files = Array.from(e.target.files).slice(0, 5 - venueForm.galleryItems.length);
                  const newItems = files.map(file => ({ type: 'new', file, url: URL.createObjectURL(file) }));
                  setVenueForm({...venueForm, galleryItems: [...venueForm.galleryItems, ...newItems]});
                }} />
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                  {venueForm.galleryItems.map((item, i) => (
                    <div 
                      key={i} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, i)}
                      onDragEnter={(e) => handleDragEnter(e, i)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => e.preventDefault()}
                      style={{ 
                        position: 'relative', width: '100px', height: '100px', cursor: 'grab',
                        border: i === 0 ? '2px solid var(--gold)' : '1px solid #ccc',
                        opacity: item.type === 'new' ? 0.8 : 1 
                      }}
                    >
                      <img src={item.url} alt="" style={{width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none'}} />
                      {i === 0 && <span style={{position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,0.6)', color:'white', fontSize:'0.7rem', textAlign:'center', pointerEvents: 'none'}}>MAIN</span>}
                      
                      <button type="button" onClick={() => {
                        const newItems = [...venueForm.galleryItems];
                        newItems.splice(i, 1);
                        setVenueForm({...venueForm, galleryItems: newItems});
                      }} style={{position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', cursor: 'pointer', padding: '2px 6px', fontSize: '0.8rem'}}>X</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>{editingVenueId ? 'Update Venue' : 'Create Venue'}</button>
                <button type="button" onClick={() => { setView('list'); setVenueForm(defaultVenueForm); setEditingVenueId(null); }} className={styles.btnGhost}>Cancel</button>
              </div>
            </form>
          </div>
          )}
        </>
      )}

      {activeTab === 'events' && (
        <>
          {view === 'list' && (
            <>
              <div className={styles.actionBar}>
                <div className={styles.filterGroup}>
                  <input type="text" placeholder="Search events..." className={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Events</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <button className={styles.btn} onClick={() => { setEditingEventId(null); setEventForm(defaultEventForm); setView('form'); }}>
                  + Create New Event
                </button>
              </div>

              <div className={styles.list}>
                {filteredEvents.length === 0 ? (
                  <div className={styles.empty}>No events found.</div>
                ) : (
                  filteredEvents.map(evt => {
                    const past = isPast(evt.endDate || evt.startDate);
                    return (
                      <div key={evt._id} className={`${styles.listItem} ${evt.status === 'draft' ? styles.inactive : ''} ${past ? styles.pastEvent : ''}`}>
                        <div className={styles.itemContent} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          {evt.coverImage && <img src={evt.coverImage} alt="" style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', opacity: past ? 0.7 : 1}} />}
                          <div>
                            <strong>{evt.title}</strong> 
                            <span className={styles.meta} style={{marginLeft: '0.5rem'}}>
                              {new Date(evt.startDate).toLocaleDateString()} • {evt.organiser}
                            </span>
                            <span className={styles.badge} style={{marginLeft: '0.5rem'}}>{past ? 'PAST' : evt.status}</span>
                          </div>
                        </div>
                        <div className={styles.itemActions}>
                          <button onClick={() => editEvent(evt)} className={styles.btnOutline}>Edit</button>
                          <button onClick={() => handleEventDelete(evt._id)} className={styles.btnDanger}>Delete</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}

          {view === 'form' && (
            <div className={styles.card}>
              <div className={styles.formHeader}>
                <button className={styles.backBtn} onClick={() => { setView('list'); setEventForm(defaultEventForm); setEditingEventId(null); }}>
                  &larr; Back to List
                </button>
                <h2 className={styles.cardTitle} style={{marginBottom: 0}}>{editingEventId ? 'Edit Event' : 'New Event'}</h2>
              </div>
              <form onSubmit={handleEventSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Title *</label>
                  <input type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required />
                </div>
                <div className={styles.field}>
                  <label>Slug *</label>
                  <input type="text" value={eventForm.slug} onChange={e => setEventForm({...eventForm, slug: e.target.value})} required />
                </div>
              </div>
              
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Organiser *</label>
                  <input type="text" value={eventForm.organiser} onChange={e => setEventForm({...eventForm, organiser: e.target.value})} required placeholder="e.g. Aora House" />
                </div>
                <div className={styles.field}>
                  <label>Booking Destination *</label>
                  <select value={eventForm.bookingDestination} onChange={e => setEventForm({...eventForm, bookingDestination: e.target.value})} required>
                    <option value="internal">Internal (Adora Checkout)</option>
                    <option value="external_url">External URL (Partner / TBN)</option>
                  </select>
                </div>
              </div>

              {eventForm.bookingDestination === 'external_url' && (
                <div className={styles.row} style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '4px' }}>
                  <div className={styles.field}>
                    <label>External URL *</label>
                    <input type="url" value={eventForm.externalUrl} onChange={e => setEventForm({...eventForm, externalUrl: e.target.value})} required />
                  </div>
                  <div className={styles.field}>
                    <label>External CTA Text</label>
                    <input type="text" value={eventForm.externalOrganizerCta} onChange={e => setEventForm({...eventForm, externalOrganizerCta: e.target.value})} placeholder="e.g. Register on TBN" />
                  </div>
                </div>
              )}

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Start Date & Time *</label>
                  <input type="datetime-local" value={eventForm.startDate} onChange={e => setEventForm({...eventForm, startDate: e.target.value})} required />
                </div>
                <div className={styles.field}>
                  <label>End Date & Time *</label>
                  <input type="datetime-local" value={eventForm.endDate} onChange={e => setEventForm({...eventForm, endDate: e.target.value})} required />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Venue Space (Internal)</label>
                  <select value={eventForm.venueSpace} onChange={e => setEventForm({...eventForm, venueSpace: e.target.value})}>
                    <option value="">-- Select Space --</option>
                    {venues.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Or Custom Location Text</label>
                  <input type="text" value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} placeholder="e.g. Lagos, Nigeria" />
                </div>
              </div>

              {/* EVENT COVER IMAGE */}
              <div className={styles.field} style={{ borderTop: '1px solid #eaeaea', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <label>Event Cover Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {(eventForm.coverImage || eventForm.existingCoverImage) && (
                    <img 
                      src={eventForm.coverImage ? URL.createObjectURL(eventForm.coverImage) : eventForm.existingCoverImage} 
                      alt="Preview" 
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} 
                    />
                  )}
                  <input type="file" accept="image/*" onChange={e => {
                    if (e.target.files[0]) setEventForm({...eventForm, coverImage: e.target.files[0]});
                  }} />
                </div>
              </div>
              
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Status *</label>
                  <select value={eventForm.status} onChange={e => setEventForm({...eventForm, status: e.target.value})} required>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="sold_out">Sold Out</option>
                    <option value="postponed">Postponed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className={styles.checkboxField} style={{marginTop: '2rem'}}>
                  <input type="checkbox" id="evtFeatured" checked={eventForm.isFeatured} onChange={e => setEventForm({...eventForm, isFeatured: e.target.checked})} />
                  <label htmlFor="evtFeatured">Featured Event</label>
                </div>
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>{editingEventId ? 'Update Event' : 'Create Event'}</button>
                <button type="button" onClick={() => { setView('list'); setEventForm(defaultEventForm); setEditingEventId(null); }} className={styles.btnGhost}>Cancel</button>
              </div>
            </form>
          </div>
          )}
        </>
      )}
    </div>
  );
}
