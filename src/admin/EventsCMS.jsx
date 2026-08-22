import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import styles from './CMS.module.css';

export default function EventsCMS() {
  const { authFetch } = useAuth();
  const { confirmAction } = useModal();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultVenueForm = { 
    name: '', 
    slug: '', 
    spaceType: 'studio', 
    isClassStudio: true, 
    isHireableVenue: false, 
    isCafeArea: false, 
    defaultCapacity: 14, 
    capacity: 14, 
    colorTag: '#C89B4A',
    description: '', 
    shortDescription: '', 
    suitableFor: '', 
    price: '', 
    features: '', 
    sortOrder: 0, 
    isActive: true, 
    galleryItems: [] 
  };
  const defaultEventForm = { 
    title: '', slug: '', description: '', shortDescription: '', 
    organiser: 'Aora House', bookingDestination: 'internal', externalUrl: '', externalOrganizerCta: '',
    startDate: '', endDate: '', location: '', venueSpace: '',
    capacity: 0, ticketsSold: 0, price: '', isFree: false,
    status: 'draft', isFeatured: false,
    coverImage: null, existingCoverImage: '',
    isRecurring: false,
    isAlreadySeries: false,
    frequency: 'weekly',
    daysOfWeek: [new Date().getDay()],
    repeatEndType: 'count',
    repeatCount: 4,
    repeatUntil: ''
  };

  const [venueForm, setVenueForm] = useState(defaultVenueForm);
  const [eventForm, setEventForm] = useState(defaultEventForm);
  
  const [editingVenueId, setEditingVenueId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  
  const activeTab = searchParams.get('tab') === 'venues' ? 'venues' : 'events';
  const setActiveTab = (tab) => {
    setSearchParams(tab === 'venues' ? { tab: 'venues' } : {});
    setView('list');
    setEditingVenueId(null);
    setEditingEventId(null);
  };
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, published, draft, past
  const [spaceTypeFilter, setSpaceTypeFilter] = useState('all'); // all, studio, venue_hire, cafe

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
      formData.append('spaceType', venueForm.spaceType);
      formData.append('isClassStudio', venueForm.isClassStudio);
      formData.append('isHireableVenue', venueForm.isHireableVenue);
      formData.append('isCafeArea', venueForm.isCafeArea);
      formData.append('defaultCapacity', venueForm.defaultCapacity);
      formData.append('colorTag', venueForm.colorTag);
      formData.append('description', venueForm.description);
      formData.append('shortDescription', venueForm.shortDescription);
      formData.append('capacity', venueForm.capacity || venueForm.defaultCapacity);
      formData.append('priceKobo', Math.round(parseFloat(venueForm.price || 0) * 100));
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
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to save space.');
        return;
      }
      toast.success(editingVenueId ? 'Space updated successfully.' : 'Space created successfully.');
      setVenueForm(defaultVenueForm);
      setEditingVenueId(null);
      setView('list');
      loadData();
    } catch (err) { 
      console.error(err);
      toast.error(err.message || 'Error saving space.');
    }
  }

  function handleVenueDelete(id) {
    confirmAction('Delete Space', 'Are you sure you want to delete this space? This action cannot be reversed.', async () => {
      try {
        const res = await authFetch(`/api/cms/venue-spaces/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Space deleted successfully.');
          loadData();
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || 'Failed to delete space.');
        }
      } catch (err) { 
        console.error(err);
        toast.error('Failed to delete space.');
      }
    });
  }

  function editVenue(venue) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingVenueId(venue._id);
    setVenueForm({ 
      name: venue.name, 
      slug: venue.slug, 
      spaceType: venue.spaceType || 'studio',
      isClassStudio: venue.isClassStudio ?? (venue.spaceType === 'studio'),
      isHireableVenue: venue.isHireableVenue ?? (venue.spaceType === 'venue_hire'),
      isCafeArea: venue.isCafeArea ?? (venue.spaceType === 'cafe'),
      defaultCapacity: venue.defaultCapacity || venue.capacity || 14,
      colorTag: venue.colorTag || '#C89B4A',
      description: venue.description || '', 
      shortDescription: venue.shortDescription || '', 
      suitableFor: venue.suitableFor?.join(', ') || '',
      capacity: venue.capacity || venue.defaultCapacity || 14, 
      price: venue.priceKobo !== undefined && venue.priceKobo > 0 ? (venue.priceKobo / 100) : '', 
      features: venue.amenities?.join(', ') || '', 
      sortOrder: venue.sortOrder || 0, 
      isActive: venue.isActive ?? venue.isAvailable ?? true,
      galleryItems: venue.images ? venue.images.map(url => ({ type: 'existing', url })) : []
    });
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

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const toggleEventDayOfWeek = (dayIdx) => {
    let current = [...eventForm.daysOfWeek];
    if (current.includes(dayIdx)) {
      if (current.length > 1) {
        current = current.filter(d => d !== dayIdx);
      }
    } else {
      current.push(dayIdx);
      current.sort((a, b) => a - b);
    }
    setEventForm({ ...eventForm, daysOfWeek: current });
  };

  function getEventRecurrenceSummary() {
    if (!eventForm.isRecurring) return null;
    const daysStr = eventForm.daysOfWeek.map(d => FULL_DAY_NAMES[d]).join(', ');
    
    let freqText = '';
    if (eventForm.frequency === 'daily') freqText = 'Every Day';
    else if (eventForm.frequency === 'weekly') freqText = `Every Week on ${daysStr}`;
    else if (eventForm.frequency === 'biweekly') freqText = `Every 2 Weeks on ${daysStr}`;
    else if (eventForm.frequency === 'monthly') freqText = 'Every Month';

    let endText = '';
    if (eventForm.repeatEndType === 'count') {
      endText = `for ${eventForm.repeatCount} occurrences`;
    } else {
      endText = eventForm.repeatUntil ? `until ${eventForm.repeatUntil}` : 'indefinitely';
    }

    return `Recurring Rule: ${freqText}, repeating ${endText}.`;
  }

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
      formData.append('externalUrl', eventForm.externalUrl);
      formData.append('externalOrganizerCta', eventForm.externalOrganizerCta);
      formData.append('startDate', eventForm.startDate);
      if (eventForm.endDate) formData.append('endDate', eventForm.endDate);
      formData.append('location', eventForm.location);
      formData.append('venueSpace', eventForm.venueSpace);
      formData.append('capacity', eventForm.capacity);
      formData.append('ticketsSold', eventForm.ticketsSold);
      formData.append('priceKobo', eventForm.isFree ? 0 : Math.round(parseFloat(eventForm.price || 0) * 100));
      formData.append('isFree', eventForm.isFree);
      formData.append('status', eventForm.status);
      formData.append('isFeatured', eventForm.isFeatured);
      if (eventForm.coverImage) formData.append('coverImage', eventForm.coverImage);

      const isRecurring = eventForm.isRecurring;
      formData.append('isRecurring', isRecurring);
      if (isRecurring) {
        formData.append('recurrence', JSON.stringify({
          frequency: eventForm.frequency,
          daysOfWeek: eventForm.daysOfWeek,
          repeatCount: eventForm.repeatEndType === 'count' ? parseInt(eventForm.repeatCount) || 4 : undefined,
          repeatUntil: eventForm.repeatEndType === 'until' && eventForm.repeatUntil ? eventForm.repeatUntil : undefined
        }));
      }

      const res = await authFetch(url, {
        method,
        body: formData
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to save event.');
        return;
      }
      toast.success(editingEventId ? 'Event updated successfully.' : 'Event created successfully.');
      setEventForm(defaultEventForm);
      setEditingEventId(null);
      setView('list');
      loadData();
    } catch (err) { 
      console.error(err);
      toast.error(err.message || 'Error saving event.');
    }
  }

  function handleEventDelete(evt) {
    if (evt.isRecurring && evt.seriesId) {
      confirmAction('Delete Recurring Event Series', 'This event is part of a recurring series. Do you want to delete this event series?', async () => {
        try {
          const res = await authFetch(`/api/cms/events/series/${evt.seriesId}`, { method: 'DELETE' });
          if (res.ok) {
            toast.success('Event series deleted successfully.');
            loadData();
          } else {
            const errData = await res.json().catch(() => ({}));
            toast.error(errData.error || 'Failed to delete event series.');
          }
        } catch (err) { 
          console.error(err);
          toast.error('Failed to delete event series.');
        }
      });
    } else {
      confirmAction('Delete Event', 'Are you sure you want to permanently delete this event?', async () => {
        try {
          const res = await authFetch(`/api/cms/events/${evt._id}`, { method: 'DELETE' });
          if (res.ok) {
            toast.success('Event deleted successfully.');
            loadData();
          } else {
            const errData = await res.json().catch(() => ({}));
            toast.error(errData.error || 'Failed to delete event.');
          }
        } catch (err) { 
          console.error(err);
          toast.error('Failed to delete event.');
        }
      });
    }
  }

  function editEvent(evt) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const isAlreadySeries = evt.isRecurring && !!evt.seriesId;
    setEditingEventId(evt._id);
    setEventForm({ 
      title: evt.title, slug: evt.slug, description: evt.description || '', shortDescription: evt.shortDescription || '', 
      organiser: evt.organiser, bookingDestination: evt.bookingDestination, externalUrl: evt.externalUrl || '', externalOrganizerCta: evt.externalOrganizerCta || '',
      startDate: evt.startDate ? new Date(evt.startDate).toISOString().slice(0, 16) : '', 
      endDate: evt.endDate ? new Date(evt.endDate).toISOString().slice(0, 16) : '', 
      location: evt.location || '', venueSpace: evt.venueSpace?._id || '',
      capacity: evt.capacity || 0, ticketsSold: evt.ticketsSold || 0, 
      price: evt.priceKobo !== undefined && evt.priceKobo > 0 ? (evt.priceKobo / 100) : '', 
      isFree: evt.isFree || false, status: evt.status, isFeatured: evt.isFeatured || false,
      existingCoverImage: evt.coverImage || '', coverImage: null,
      isRecurring: isAlreadySeries,
      isAlreadySeries: isAlreadySeries,
      frequency: evt.recurrence?.frequency || 'weekly',
      daysOfWeek: evt.recurrence?.daysOfWeek && evt.recurrence.daysOfWeek.length > 0 
        ? evt.recurrence.daysOfWeek 
        : [evt.startDate ? new Date(evt.startDate).getDay() : new Date().getDay()],
      repeatEndType: evt.recurrence?.repeatUntil ? 'until' : 'count',
      repeatCount: evt.recurrence?.repeatCount || 4,
      repeatUntil: evt.recurrence?.repeatUntil ? new Date(evt.recurrence.repeatUntil).toISOString().slice(0, 10) : ''
    });
    setView('form');
  }

  const isPast = (dateStr) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date();
  };

  const filteredVenues = venues.filter(v => {
    if (searchQuery && !v.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    const isVenActive = (v.isActive ?? v.isAvailable ?? true);
    if (statusFilter === 'active' && !isVenActive) return false;
    if (statusFilter === 'inactive' && isVenActive) return false;
    if (spaceTypeFilter !== 'all') {
      if (spaceTypeFilter === 'studio' && !(v.isClassStudio || v.spaceType === 'studio')) return false;
      if (spaceTypeFilter === 'venue_hire' && !(v.isHireableVenue || v.spaceType === 'venue_hire')) return false;
      if (spaceTypeFilter === 'cafe' && !(v.isCafeArea || v.spaceType === 'cafe')) return false;
    }
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
      <h1 className={styles.title}>{activeTab === 'venues' ? 'House Spaces & Facilities' : 'Loft & House Events'}</h1>

      {activeTab === 'venues' && (
        <>
          {view === 'list' && (
            <>
              <div className={styles.actionBar}>
                <div className={styles.filterGroup}>
                  <input type="text" placeholder="Search spaces..." className={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <select className={styles.filterSelect} value={spaceTypeFilter} onChange={e => setSpaceTypeFilter(e.target.value)}>
                    <option value="all">All Spaces & Types</option>
                    <option value="studio">Class & Movement Studios</option>
                    <option value="venue_hire">Venue Hire Spaces</option>
                    <option value="cafe">Café & Seating</option>
                  </select>
                  <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <button className={styles.btn} onClick={() => { setEditingVenueId(null); setVenueForm(defaultVenueForm); setView('form'); }}>
                  + Create New Space
                </button>
              </div>

              <div className={styles.list}>
                {filteredVenues.length === 0 ? (
                  <div className={styles.empty}>No spaces found matching your filters.</div>
                ) : (
                  filteredVenues.map(v => {
                    const isVenActive = (v.isActive ?? v.isAvailable ?? true);
                    const color = v.colorTag || '#C89B4A';
                    return (
                      <div key={v._id} className={`${styles.listItem} ${!isVenActive ? styles.inactive : ''}`}>
                        <div className={styles.cardMain}>
                          {v.images && v.images.length > 0 ? (
                            <img src={v.images[0]} alt={v.name} className={styles.cardThumb} />
                          ) : (
                            <div className={styles.cardThumbPlaceholder}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v11H9z" />
                              </svg>
                            </div>
                          )}
                          <div className={styles.itemContent}>
                            <div className={styles.itemTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block' }}></span>
                                <strong>{v.name}</strong>
                              </span>
                              
                              {/* Capability Badges */}
                              {v.isClassStudio && (
                                <span className={styles.badge} style={{ background: 'rgba(200, 155, 74, 0.15)', color: '#8C5815' }}>
                                  CLASSES
                                </span>
                              )}
                              {v.isHireableVenue && (
                                <span className={styles.badge} style={{ background: 'rgba(65, 79, 54, 0.15)', color: '#414F36' }}>
                                  HIREABLE
                                </span>
                              )}
                              {v.isCafeArea && (
                                <span className={styles.badge} style={{ background: 'rgba(164, 69, 31, 0.15)', color: '#A4451F' }}>
                                  CAFÉ
                                </span>
                              )}
                              {!isVenActive && <span className={styles.badge} style={{ color: 'var(--rust)', background: 'rgba(164, 69, 31, 0.1)' }}>Inactive</span>}
                            </div>
                            <div className={styles.meta} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                              <span>Capacity: <strong>{v.capacity || v.defaultCapacity || 14}</strong> guests/members</span>
                              {v.isHireableVenue && v.priceKobo > 0 && (
                                <>
                                  <span>•</span>
                                  <span className={styles.itemPrice}>₦{(v.priceKobo / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} / day</span>
                                </>
                              )}
                            </div>
                            {v.shortDescription && <p className={styles.itemDesc}>{v.shortDescription}</p>}
                            {v.amenities && v.amenities.length > 0 && (
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                                {v.amenities.slice(0, 4).map((am, idx) => (
                                  <span key={idx} style={{ fontSize: '0.68rem', padding: '1px 6px', background: '#F5F0E6', borderRadius: '3px', color: '#635345' }}>
                                    {am}
                                  </span>
                                ))}
                                {v.amenities.length > 4 && (
                                  <span style={{ fontSize: '0.68rem', color: 'var(--taupe)' }}>+{v.amenities.length - 4} more</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={styles.itemActions}>
                          <button onClick={() => editVenue(v)} className={styles.btnOutline}>Edit</button>
                          <button onClick={() => handleVenueDelete(v._id)} className={styles.btnDanger}>Delete</button>
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
                <button className={styles.backBtn} onClick={() => { setView('list'); setVenueForm(defaultVenueForm); setEditingVenueId(null); }}>
                  &larr; Back to Spaces
                </button>
                <h2 className={styles.cardTitle} style={{marginBottom: 0}}>{editingVenueId ? `Edit Space: ${venueForm.name}` : 'New House Space & Facility'}</h2>
              </div>
              <form onSubmit={handleVenueSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Space Name *</label>
                  <input type="text" value={venueForm.name} onChange={e => setVenueForm({...venueForm, name: e.target.value})} placeholder="e.g. Studio A, The Loft, Studio B" required />
                </div>
                <div className={styles.field}>
                  <label>Slug *</label>
                  <input type="text" value={venueForm.slug} onChange={e => setVenueForm({...venueForm, slug: e.target.value})} placeholder="e.g. studio-a, the-loft" required />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Primary Category</label>
                  <select value={venueForm.spaceType} onChange={e => setVenueForm({...venueForm, spaceType: e.target.value})}>
                    <option value="studio">Movement & Class Studio</option>
                    <option value="venue_hire">Public Venue Hire Space</option>
                    <option value="cafe">Café & Dining Lounge</option>
                    <option value="wellness">Wellness & Treatment Room</option>
                    <option value="multi_purpose">Multi-Purpose Facility</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Calendar Color Tag</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="color" 
                      value={venueForm.colorTag} 
                      onChange={e => setVenueForm({...venueForm, colorTag: e.target.value})} 
                      style={{ width: '48px', height: '40px', padding: '2px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input 
                      type="text" 
                      value={venueForm.colorTag} 
                      onChange={e => setVenueForm({...venueForm, colorTag: e.target.value})} 
                      placeholder="#C89B4A"
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
              </div>

              {/* Multi-Capability Selection */}
              <div style={{ background: '#FAF7F2', padding: '14px 16px', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.6)', margin: '0.25rem 0' }}>
                <label style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--cocoa-deep)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                  Operational Capabilities (Check all that apply)
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className={styles.checkboxField}>
                    <input 
                      type="checkbox" 
                      id="capClassStudio" 
                      checked={venueForm.isClassStudio} 
                      onChange={e => setVenueForm({...venueForm, isClassStudio: e.target.checked})} 
                    />
                    <label htmlFor="capClassStudio">
                      <strong>Available for Class & Movement Scheduling</strong> — Automatically appears in Timetable CMS, Day View column tracks, and class scheduling dropdowns.
                    </label>
                  </div>
                  <div className={styles.checkboxField}>
                    <input 
                      type="checkbox" 
                      id="capHireableVenue" 
                      checked={venueForm.isHireableVenue} 
                      onChange={e => setVenueForm({...venueForm, isHireableVenue: e.target.checked})} 
                    />
                    <label htmlFor="capHireableVenue">
                      <strong>Available for Public Venue Hire & Private Events</strong> — Listed on public /venue-hire with daily rental rates and private event enquiries.
                    </label>
                  </div>
                  <div className={styles.checkboxField}>
                    <input 
                      type="checkbox" 
                      id="capCafeArea" 
                      checked={venueForm.isCafeArea} 
                      onChange={e => setVenueForm({...venueForm, isCafeArea: e.target.checked})} 
                    />
                    <label htmlFor="capCafeArea">
                      <strong>Dedicated Café Seating & Dining Area</strong> — Integrated with café reservations and clerk desk walk-ins.
                    </label>
                  </div>
                </div>
              </div>
              
              <div className={styles.field}>
                <label>Subtitle (Short Summary)</label>
                <input type="text" value={venueForm.shortDescription} onChange={e => setVenueForm({...venueForm, shortDescription: e.target.value})} placeholder="e.g. Primary studio dedicated to mindful movement, breathwork and yoga..." />
              </div>
              
              <div className={styles.field}>
                <label>Full Description</label>
                <textarea rows="3" value={venueForm.description} onChange={e => setVenueForm({...venueForm, description: e.target.value})} placeholder="Detailed overview of the space layout, vibe, and facilities..." />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Default Capacity (Members / Guests)</label>
                  <input type="number" value={venueForm.capacity || venueForm.defaultCapacity} onChange={e => setVenueForm({...venueForm, capacity: Number(e.target.value), defaultCapacity: Number(e.target.value)})} min="1" required />
                </div>
                {venueForm.isHireableVenue && (
                  <div className={styles.field}>
                    <label>Price / Day (₦)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      min="0" 
                      placeholder="e.g. 150000 or 0 for free" 
                      value={venueForm.price} 
                      onChange={e => setVenueForm({...venueForm, price: e.target.value})} 
                    />
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <label>Suitable For (comma separated)</label>
                <input type="text" value={venueForm.suitableFor} onChange={e => setVenueForm({...venueForm, suitableFor: e.target.value})} placeholder="e.g. Mindful Movement, Yoga, Reformer Pilates, Sound Baths, Private Hire" />
              </div>

              <div className={styles.field}>
                <label>Features / Amenities (comma separated)</label>
                <input type="text" value={venueForm.features} onChange={e => setVenueForm({...venueForm, features: e.target.value})} placeholder="e.g. Wall Mirrors, Reformer Beds, Yoga Mats & Blocks, Sound System, WiFi, Air Conditioning" />
              </div>
              
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Sort Order</label>
                  <input type="number" value={venueForm.sortOrder} onChange={e => setVenueForm({...venueForm, sortOrder: Number(e.target.value)})} />
                </div>
                <div className={styles.checkboxField} style={{marginTop: '2rem'}}>
                  <input type="checkbox" id="venueActive" checked={venueForm.isActive} onChange={e => setVenueForm({...venueForm, isActive: e.target.checked})} />
                  <label htmlFor="venueActive">Active & Available</label>
                </div>
              </div>

              {/* GALLERY UPLOAD */}
              <div className={styles.field} style={{ borderTop: '1px solid #eaeaea', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <label>Space Gallery (Up to 5 images)</label>
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
                      }} style={{position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', cursor: 'pointer', padding: '2px 6px', fontSize: '0.8rem'}}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>{editingVenueId ? 'Update Space' : 'Create Space'}</button>
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
                        <div className={styles.cardMain}>
                          {evt.coverImage ? (
                            <img src={evt.coverImage} alt={evt.title} className={styles.cardThumb} style={{ opacity: past ? 0.7 : 1 }} />
                          ) : (
                            <div className={styles.cardThumbPlaceholder}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" x2="6" /><line x1="8" x2="8" y1="2" x2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                              </svg>
                            </div>
                          )}
                          <div className={styles.itemContent}>
                            <div className={styles.itemTitle}>
                              <span>{evt.title}</span>
                              {evt.isRecurring && (
                                <span className={styles.recurringBadge} title="Recurring series occurrence">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                                    <path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
                                  </svg>
                                  {evt.recurrence?.frequency || 'Series'}
                                </span>
                              )}
                              <span className={styles.badge}>{past ? 'PAST' : evt.status.toUpperCase()}</span>
                              {evt.isFeatured && <span className={styles.badge} style={{ background: 'rgba(200, 155, 74, 0.15)', color: 'var(--gold)' }}>Featured</span>}
                            </div>
                            <div className={styles.meta}>
                              <span>{new Date(evt.startDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span>•</span>
                              <span style={{ textTransform: 'capitalize' }}>{evt.organiser}</span>
                              <span>•</span>
                              <span className={styles.itemPrice}>{evt.isFree ? 'Free' : `₦${((evt.priceKobo || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}</span>
                            </div>
                            {evt.shortDescription && <p className={styles.itemDesc}>{evt.shortDescription}</p>}
                          </div>
                        </div>
                        <div className={styles.itemActions}>
                          <button onClick={() => editEvent(evt)} className={styles.btnOutline}>Edit</button>
                          <button onClick={() => handleEventDelete(evt)} className={styles.btnDanger}>Delete</button>
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

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Max Capacity</label>
                  <input 
                    type="number" 
                    value={eventForm.capacity} 
                    onChange={e => setEventForm({...eventForm, capacity: Number(e.target.value)})} 
                    placeholder="e.g. 50" 
                  />
                </div>
                <div className={styles.field}>
                  <label>Ticket Price (₦)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    placeholder={eventForm.isFree ? 'Free Event' : 'e.g. 5000 or 50.00'} 
                    value={eventForm.price} 
                    onChange={e => setEventForm({...eventForm, price: e.target.value})} 
                    disabled={eventForm.isFree}
                  />
                </div>
                <div className={styles.checkboxField} style={{ marginTop: '2rem' }}>
                  <input 
                    type="checkbox" 
                    id="evtFree" 
                    checked={eventForm.isFree} 
                    onChange={e => setEventForm({
                      ...eventForm, 
                      isFree: e.target.checked, 
                      price: e.target.checked ? '0' : (eventForm.price === '0' ? '' : eventForm.price)
                    })} 
                  />
                  <label htmlFor="evtFree">Free Event</label>
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

              {/* ── Recurring Event Controls ── */}
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(227, 211, 184, 0.4)', paddingTop: '1.25rem' }}>
                <div className={styles.checkboxField} style={{ marginBottom: '0.75rem' }}>
                  <input 
                    type="checkbox" 
                    id="evtIsRecurring" 
                    checked={eventForm.isRecurring} 
                    onChange={e => setEventForm({...eventForm, isRecurring: e.target.checked})} 
                  />
                  <label htmlFor="evtIsRecurring" style={{ fontWeight: 600, color: 'var(--cocoa-deep)' }}>
                    {eventForm.isAlreadySeries 
                      ? 'Recurring Event Series (Active)' 
                      : editingEventId 
                        ? 'Repeat this Event (Convert to Recurring Schedule)'
                        : 'Repeat this Event (Recurring Schedule)'}
                  </label>
                </div>

                {eventForm.isRecurring && !eventForm.isAlreadySeries && (
                  <div className={styles.recurringBox}>
                    <div className={styles.row}>
                      <div className={styles.field}>
                        <label>Frequency</label>
                        <select 
                          value={eventForm.frequency} 
                          onChange={e => setEventForm({...eventForm, frequency: e.target.value})}
                        >
                          <option value="weekly">Every Week</option>
                          <option value="biweekly">Every 2 Weeks (Bi-Weekly)</option>
                          <option value="daily">Every Day (Daily)</option>
                          <option value="monthly">Every Month (Monthly)</option>
                        </select>
                      </div>

                      <div className={styles.field}>
                        <label>Repeat Ends</label>
                        <select 
                          value={eventForm.repeatEndType} 
                          onChange={e => setEventForm({...eventForm, repeatEndType: e.target.value})}
                        >
                          <option value="count">After a set number of occurrences</option>
                          <option value="until">On a specific end date</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.row}>
                      {eventForm.repeatEndType === 'count' ? (
                        <div className={styles.field} style={{ maxWidth: '50%' }}>
                          <label>Total Occurrences</label>
                          <input 
                            type="number" 
                            min="2" 
                            max="24" 
                            placeholder="e.g. 4 occurrences"
                            value={eventForm.repeatCount} 
                            onChange={e => setEventForm({...eventForm, repeatCount: e.target.value})} 
                            required={eventForm.isRecurring}
                          />
                        </div>
                      ) : (
                        <div className={styles.field} style={{ maxWidth: '50%' }}>
                          <label>Repeat Until Date</label>
                          <input 
                            type="date" 
                            value={eventForm.repeatUntil} 
                            min={eventForm.startDate ? eventForm.startDate.slice(0, 10) : ''}
                            onChange={e => setEventForm({...eventForm, repeatUntil: e.target.value})} 
                            required={eventForm.isRecurring && eventForm.repeatEndType === 'until'}
                          />
                        </div>
                      )}
                    </div>

                    {(eventForm.frequency === 'weekly' || eventForm.frequency === 'biweekly') && (
                      <div className={styles.field}>
                        <label>Repeat On Days</label>
                        <div className={styles.dayPills}>
                          {DAY_NAMES.map((name, idx) => {
                            const isActive = eventForm.daysOfWeek.includes(idx);
                            return (
                              <button
                                type="button"
                                key={idx}
                                className={`${styles.dayPill} ${isActive ? styles.dayPillActive : ''}`}
                                onClick={() => toggleEventDayOfWeek(idx)}
                              >
                                {name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className={styles.recurringPreview}>
                      {getEventRecurrenceSummary()}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>
                  {editingEventId && !eventForm.isAlreadySeries && eventForm.isRecurring
                    ? 'Update & Generate Recurring Series'
                    : editingEventId 
                      ? 'Update Event' 
                      : eventForm.isRecurring 
                        ? 'Create Recurring Series' 
                        : 'Create Event'}
                </button>
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
