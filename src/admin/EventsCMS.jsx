import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './CMS.module.css';

export default function EventsCMS() {
  const { authFetch } = useAuth();
  const [venues, setVenues] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [venueForm, setVenueForm] = useState({ name: '', slug: '', description: '', capacity: 0, hourlyRateKobo: 0, features: '', sortOrder: 0, isActive: true });
  const [eventForm, setEventForm] = useState({ 
    title: '', slug: '', description: '', shortDescription: '', 
    organiser: 'Adora & Alora', bookingDestination: 'internal', externalUrl: '', externalOrganizerCta: '',
    startDate: '', endDate: '', location: '', venueSpace: '',
    capacity: 0, ticketsSold: 0, priceKobo: 0, isFree: false,
    status: 'draft', isFeatured: false
  });
  
  const [editingVenueId, setEditingVenueId] = useState(null);
  const [editingEventId, setEditingEventId] = useState(null);
  const [activeTab, setActiveTab] = useState('events');

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
      const payload = {
        ...venueForm,
        features: typeof venueForm.features === 'string' ? venueForm.features.split(',').map(s=>s.trim()).filter(Boolean) : venueForm.features
      };
      
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setVenueForm({ name: '', slug: '', description: '', capacity: 0, hourlyRateKobo: 0, features: '', sortOrder: 0, isActive: true });
        setEditingVenueId(null);
        loadData();
      }
    } catch (err) { console.error(err); }
  }

  async function handleVenueDelete(id) {
    if (!window.confirm('Delete venue space?')) return;
    try {
      const res = await authFetch(`/api/cms/venue-spaces/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) { console.error(err); }
  }

  function editVenue(venue) {
    setEditingVenueId(venue._id);
    setVenueForm({ 
      name: venue.name, slug: venue.slug, description: venue.description || '', 
      capacity: venue.capacity, hourlyRateKobo: venue.hourlyRateKobo, 
      features: venue.features?.join(', ') || '', sortOrder: venue.sortOrder, isActive: venue.isActive 
    });
    setActiveTab('venues');
  }

  // Events
  async function handleEventSubmit(e) {
    e.preventDefault();
    try {
      const url = editingEventId ? `/api/cms/events/${editingEventId}` : '/api/cms/events';
      const method = editingEventId ? 'PATCH' : 'POST';
      
      const payload = { ...eventForm };
      // Handle the external URL dependency
      if (payload.bookingDestination === 'internal') {
        payload.externalUrl = '';
        payload.externalOrganizerCta = '';
      }
      
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEventForm({ 
          title: '', slug: '', description: '', shortDescription: '', 
          organiser: 'Adora & Alora', bookingDestination: 'internal', externalUrl: '', externalOrganizerCta: '',
          startDate: '', endDate: '', location: '', venueSpace: '',
          capacity: 0, ticketsSold: 0, priceKobo: 0, isFree: false, status: 'draft', isFeatured: false
        });
        setEditingEventId(null);
        loadData();
      }
    } catch (err) { console.error(err); }
  }

  async function handleEventDelete(id) {
    if (!window.confirm('Delete this event?')) return;
    try {
      const res = await authFetch(`/api/cms/events/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) { console.error(err); }
  }

  function editEvent(evt) {
    setEditingEventId(evt._id);
    setEventForm({ 
      title: evt.title, slug: evt.slug, description: evt.description || '', shortDescription: evt.shortDescription || '',
      organiser: evt.organiser, bookingDestination: evt.bookingDestination, externalUrl: evt.externalUrl || '', externalOrganizerCta: evt.externalOrganizerCta || '',
      startDate: evt.startDate ? new Date(evt.startDate).toISOString().slice(0, 16) : '', 
      endDate: evt.endDate ? new Date(evt.endDate).toISOString().slice(0, 16) : '', 
      location: evt.location || '', venueSpace: evt.venueSpace?._id || '',
      capacity: evt.capacity || 0, ticketsSold: evt.ticketsSold || 0, priceKobo: evt.priceKobo || 0, 
      isFree: evt.isFree || false, status: evt.status, isFeatured: evt.isFeatured || false
    });
    setActiveTab('events');
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>Venues & Events</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className={activeTab === 'events' ? styles.btn : styles.btnOutline} onClick={() => setActiveTab('events')}>Events</button>
        <button className={activeTab === 'venues' ? styles.btn : styles.btnOutline} onClick={() => setActiveTab('venues')}>Venue Spaces</button>
      </div>

      {activeTab === 'venues' && (
        <>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{editingVenueId ? 'Edit Venue Space' : 'New Venue Space'}</h2>
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
                <label>Description</label>
                <textarea rows="3" value={venueForm.description} onChange={e => setVenueForm({...venueForm, description: e.target.value})} />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Capacity</label>
                  <input type="number" value={venueForm.capacity} onChange={e => setVenueForm({...venueForm, capacity: Number(e.target.value)})} />
                </div>
                <div className={styles.field}>
                  <label>Hourly Rate (Kobo/Cents)</label>
                  <input type="number" value={venueForm.hourlyRateKobo} onChange={e => setVenueForm({...venueForm, hourlyRateKobo: Number(e.target.value)})} />
                </div>
              </div>

              <div className={styles.field}>
                <label>Features (comma separated)</label>
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

              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>{editingVenueId ? 'Update Venue' : 'Create Venue'}</button>
                {editingVenueId && <button type="button" onClick={() => { setEditingVenueId(null); setVenueForm({name:'', slug:'', description:'', capacity:0, hourlyRateKobo:0, features:'', sortOrder:0, isActive:true}); }} className={styles.btnGhost}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className={styles.list}>
            {venues.map(v => (
              <div key={v._id} className={`${styles.listItem} ${!v.isActive ? styles.inactive : ''}`}>
                <div className={styles.itemContent}>
                  <strong>{v.name}</strong> <span className={styles.meta}>(Cap: {v.capacity})</span>
                </div>
                <div className={styles.itemActions}>
                  <button onClick={() => editVenue(v)} className={styles.btnOutline}>Edit</button>
                  <button onClick={() => handleVenueDelete(v._id)} className={styles.btnDanger}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'events' && (
        <>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{editingEventId ? 'Edit Event' : 'New Event'}</h2>
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
                  <input type="text" value={eventForm.organiser} onChange={e => setEventForm({...eventForm, organiser: e.target.value})} required placeholder="e.g. Adora & Alora" />
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
                {editingEventId && <button type="button" onClick={() => { setEditingEventId(null); setEventForm({...eventForm, title:''}); }} className={styles.btnGhost}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className={styles.list}>
            {events.map(evt => (
              <div key={evt._id} className={`${styles.listItem} ${evt.status === 'draft' ? styles.inactive : ''}`}>
                <div className={styles.itemContent}>
                  <strong>{evt.title}</strong> 
                  <span className={styles.meta} style={{marginLeft: '0.5rem'}}>
                    {new Date(evt.startDate).toLocaleDateString()} • {evt.organiser}
                  </span>
                  <span className={styles.badge} style={{marginLeft: '0.5rem'}}>{evt.status}</span>
                </div>
                <div className={styles.itemActions}>
                  <button onClick={() => editEvent(evt)} className={styles.btnOutline}>Edit</button>
                  <button onClick={() => handleEventDelete(evt._id)} className={styles.btnDanger}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
