import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './VenueHire.module.css';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { IconShieldCheck, IconCheck, IconClock, IconX } from '../components/ui/LineIcons';
import HoneypotField from '../components/common/HoneypotField';

const FALLBACK_VENUES = {
  'the-loft': {
    id: 'the-loft',
    title: 'The Loft',
    subtitle: 'A flexible venue created for meaningful learning, conversation and connection.',
    description: 'Positioned as a learning and events venue rather than a leadership lounge — “The Loft” is more distinctive and commercially flexible.',
    suitableFor: [
      'Seminars and workshops',
      'Masterclasses and mastermind programmes',
      'Training sessions and leadership events',
      'Panel discussions and networking events',
      'Book launches and community gatherings',
      'Webinars, recordings and hybrid programmes',
      'Small conferences'
    ],
    features: 'The space can be arranged in different formats depending on the nature of the event, including theatre-style seating, classroom arrangements, round-table discussions and open networking layouts.',
    bookingPrompt: 'Host your programme at The Loft — planning a seminar, workshop, mastermind or leadership event? The Loft is available for private hire.',
    images: [
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=2000'
    ]
  },
  'the-cafe': {
    id: 'the-cafe',
    title: 'The Café',
    subtitle: 'A warm and stylish setting for smaller gatherings and celebrations.',
    description: 'An inviting and intimately designed setting tailored for personal connections and vibrant social events.',
    suitableFor: [
      'Private breakfasts, brunches and dinners',
      'Birthday celebrations',
      'Bridal and baby showers',
      'Book clubs and intimate conversations',
      'Brand activations and pop-up events',
      'Networking gatherings and small parties'
    ],
    features: 'Options to present: exclusive hire of the full café; reserved use of the private seating area; food and beverage packages; and event styling or setup as an optional add-on.',
    bookingPrompt: 'Celebrate at Aora House Café — reserve our private area or enquire about exclusive café hire for your next intimate event.',
    images: [
      'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=2000'
    ]
  }
};

export default function VenueHire({ section }) {
  const { user } = useAuth();
  const [venuesMap, setVenuesMap] = useState(FALLBACK_VENUES);
  const [activeVenue, setActiveVenue] = useState(section || 'the-loft');
  const [imageIndex, setImageIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedEnquiry, setSubmittedEnquiry] = useState(null);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    organisation: '',
    eventType: '',
    guestCount: 20,
    preferredDate: '',
    alternativeDate: '',
    preferredStartTime: '10:00',
    preferredEndTime: '14:00',
    spacePreference: section || 'the-loft',
    seatingStyle: 'Round-table',
    cateringRequired: false,
    avRequired: false,
    description: ''
  });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: prev.firstName || user.firstName || '',
        lastName: prev.lastName || user.lastName || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await axios.get('/api/venue/spaces');
        if (res.data && res.data.length > 0) {
          const map = {};
          res.data.forEach((v) => {
            map[v.slug] = {
              id: v.slug,
              title: v.name,
              subtitle: v.shortDescription || `Capacity: ${v.capacity || 'Flexible'}`,
              description: v.description || '',
              suitableFor: v.suitableFor?.length > 0 ? v.suitableFor : ['Private Events', 'Gatherings', 'Photoshoots'],
              features: v.amenities?.join(', ') || 'Various features available upon request.',
              bookingPrompt: `Enquire about booking ${v.name} for your next event.`,
              images: v.images?.length > 0 ? v.images : ['https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=2000'],
              capacity: v.capacity,
              priceKobo: v.priceKobo
            };
          });
          setVenuesMap(map);
          if (!section) {
            setActiveVenue(res.data[0].slug);
            setFormData(prev => ({ ...prev, spacePreference: res.data[0].slug }));
          }
        }
      } catch (err) {
        console.error('Failed to load venue spaces:', err);
      }
    };
    fetchVenues();
  }, [section]);

  useEffect(() => {
    if (section && venuesMap[section]) {
      setActiveVenue(section);
      setFormData(prev => ({ ...prev, spacePreference: section }));
      setImageIndex(0);
    }
  }, [section, venuesMap]);

  const venue = venuesMap[activeVenue] || Object.values(venuesMap)[0] || FALLBACK_VENUES['the-loft'];

  const handleVenueChange = (venueId) => {
    setActiveVenue(venueId);
    setFormData(prev => ({ ...prev, spacePreference: venueId }));
    setImageIndex(0);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await axios.post('/api/venue/enquire', formData);
      if (res.data.success) {
        setSubmittedEnquiry(res.data.enquiry);
      } else {
        setError(res.data.error || 'Failed to submit enquiry. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Network error submitting enquiry. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.venuePage}>
      {/* Hero Intro */}
      <PageHeader 
        title={<>Host Your Event at Aora House</>}
      >
        <p className={styles.heroDesc}>
          Aora House offers beautifully designed, versatile spaces for learning, connection, celebration and community. Whether you are planning a seminar, masterclass, mastermind session, intimate celebration, private brunch or brand gathering, our spaces can be adapted to suit your occasion.
        </p>
        <div className={styles.tourControls}>
          {loading ? (
            <button className={`${styles.tourBtn} ${styles.activeBtn}`}>Loading...</button>
          ) : (
            Object.values(venuesMap).map(v => (
              <button 
                key={v.id}
                className={`${styles.tourBtn} ${activeVenue === v.id ? styles.activeBtn : ''}`}
                onClick={() => handleVenueChange(v.id)}
              >
                {v.title}
              </button>
            ))
          )}
        </div>
      </PageHeader>

      {/* Interactive Tour */}
      <div className={styles.tourSection}>

        <div className={styles.tourDisplay}>
          <div className={styles.tourImageWrapper}>
            <img 
              key={venue.images[imageIndex]} 
              src={venue.images[imageIndex]} 
              alt={venue.title} 
              className={styles.tourImg} 
            />
            <div className={styles.tourOverlay}></div>
            
            {/* Thumbnails */}
            {venue.images.length > 1 && (
              <div className={styles.imageThumbsRow}>
                {venue.images.map((img, idx) => (
                  <div 
                    key={idx}
                    className={`${styles.imageThumb} ${idx === imageIndex ? styles.imageThumbActive : ''}`}
                    onClick={() => setImageIndex(idx)}
                  >
                    <img src={img} alt={`${venue.title} view ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className={styles.tourContent}>
            <h2 className={styles.venueTitle}>{venue.title}</h2>
            <h3 className={styles.venueSubtitle}>{venue.subtitle}</h3>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary-dark)', fontSize: '0.9rem', fontWeight: 500, opacity: 0.8 }}>
              {venue.capacity && <div><strong>Capacity:</strong> {venue.capacity} guests</div>}
              {venue.priceKobo > 0 && <div><strong>Price:</strong> {(venue.priceKobo / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' })}</div>}
            </div>
            
            <p className={styles.venueDesc}>{venue.description}</p>
            
            <div className={styles.featuresBox}>
              <h4 className={styles.featuresTitle}>Suitable For:</h4>
              <ul className={styles.suitableList}>
                {venue.suitableFor.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            
            <p className={styles.venueFeatures}>{venue.features}</p>
            
            <div className={styles.bookingBox}>
              <p>{venue.bookingPrompt}</p>
              <Button 
                variant="primary"
                onClick={() => document.getElementById('enquiry-form').scrollIntoView({ behavior: 'smooth' })}
              >
                Enquire About Venue Hire &rarr;
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Form */}
      <div id="enquiry-form" className={styles.formSection}>
        <div className={styles.formHeader}>
          <h2>Enquire About Venue Hire</h2>
          <p>Please provide details about your event, and our concierge team will get back to you within 24 hours.</p>
        </div>

        {error && (
          <div style={{ background: '#FBE9E9', border: '1px solid #E8A8A8', color: '#8B2020', padding: '12px 16px', borderRadius: '4px', maxWidth: '800px', margin: '0 auto 20px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form className={styles.hireForm} onSubmit={handleFormSubmit}>
          <HoneypotField values={formData} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} />
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>First Name *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Jane" 
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Last Name *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Doe" 
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Email Address *</label>
              <input 
                type="email" 
                required 
                placeholder="jane@example.com" 
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Phone Number *</label>
              <input 
                type="tel" 
                required 
                placeholder="+234 800 000 0000" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Organisation (where applicable)</label>
              <input 
                type="text" 
                placeholder="Company or Brand Name" 
                value={formData.organisation}
                onChange={e => setFormData({ ...formData, organisation: e.target.value })}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Type of Event *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Masterclass, Brand Activation, Private Dinner" 
                value={formData.eventType}
                onChange={e => setFormData({ ...formData, eventType: e.target.value })}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Expected Number of Guests *</label>
              <input 
                type="number" 
                required 
                min="1" 
                placeholder="e.g. 25" 
                value={formData.guestCount}
                onChange={e => setFormData({ ...formData, guestCount: e.target.value })}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Preferred Date *</label>
              <input 
                type="date" 
                required 
                value={formData.preferredDate}
                onChange={e => setFormData({ ...formData, preferredDate: e.target.value })}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Alternative Date</label>
              <input 
                type="date" 
                value={formData.alternativeDate}
                onChange={e => setFormData({ ...formData, alternativeDate: e.target.value })}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Start Time *</label>
              <input 
                type="time" 
                required 
                value={formData.preferredStartTime}
                onChange={e => setFormData({ ...formData, preferredStartTime: e.target.value })}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Finish Time *</label>
              <input 
                type="time" 
                required 
                value={formData.preferredEndTime}
                onChange={e => setFormData({ ...formData, preferredEndTime: e.target.value })}
              />
            </div>

            <div className={styles.inputGroup}>
              <label>Preferred Space *</label>
              <select 
                required 
                value={formData.spacePreference} 
                onChange={(e) => {
                  setFormData({ ...formData, spacePreference: e.target.value });
                  if (venuesMap[e.target.value]) setActiveVenue(e.target.value);
                }}
              >
                {Object.values(venuesMap).map(v => (
                  <option key={v.id} value={v.id}>{v.title}</option>
                ))}
                <option value="not_sure">Not Sure / Multi-Space</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label>Seating Arrangement</label>
              <input 
                type="text" 
                placeholder="e.g. Theatre-style, Round-table, Cocktail" 
                value={formData.seatingStyle}
                onChange={e => setFormData({ ...formData, seatingStyle: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', margin: '20px 0', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input 
                type="checkbox" 
                checked={formData.cateringRequired} 
                onChange={e => setFormData({ ...formData, cateringRequired: e.target.checked })} 
                style={{ accentColor: 'var(--rust)' }}
              />
              <span>In-House Catering &amp; Beverage Service Required</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input 
                type="checkbox" 
                checked={formData.avRequired} 
                onChange={e => setFormData({ ...formData, avRequired: e.target.checked })} 
                style={{ accentColor: 'var(--rust)' }}
              />
              <span>Audio-Visual &amp; Projection Equipment Required</span>
            </label>
          </div>

          <div className={styles.inputGroupFull}>
            <label>Brief Description of the Event &amp; Special Requests *</label>
            <textarea 
              rows="4" 
              required 
              placeholder="Tell us more about your vision, schedule, and any custom requirements..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting} 
            className={styles.submitBtn}
            style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? 'Submitting Enquiry...' : 'Submit Venue Enquiry'}
          </button>
        </form>
      </div>

      {/* Success Modal */}
      {submittedEnquiry && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(20, 10, 4, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div style={{
            background: '#FFFDF9',
            border: '1px solid rgba(227, 211, 184, 0.9)',
            borderRadius: '12px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
            overflow: 'hidden',
            position: 'relative',
            textAlign: 'center'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #2B2015 0%, #3D2D1E 100%)',
              padding: '28px 20px',
              color: '#F7EFE1'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(200, 155, 74, 0.18)',
                border: '1px solid rgba(200, 155, 74, 0.4)',
                marginBottom: '12px'
              }}>
                <IconCheck size={26} color="var(--gold, #C89B4A)" />
              </div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold, #C89B4A)', fontWeight: 600, marginBottom: '4px' }}>
                Aora House Concierge
              </div>
              <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', margin: 0, fontWeight: 400 }}>
                Venue Enquiry Received
              </h3>
            </div>

            <div style={{ padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: '#FAF6EF',
                border: '1px solid rgba(227, 211, 184, 0.8)',
                borderRadius: '6px',
                padding: '14px',
                fontSize: '12.5px',
                textAlign: 'left',
                color: 'var(--cocoa-deep, #2B2015)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--taupe)' }}>Event Type:</span>
                  <strong>{submittedEnquiry.eventType}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--taupe)' }}>Space:</span>
                  <strong>{venuesMap[submittedEnquiry.spacePreference]?.title || 'Aora House Spaces'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--taupe)' }}>Preferred Date:</span>
                  <strong>{new Date(submittedEnquiry.preferredDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--taupe)' }}>Guests:</span>
                  <strong>{submittedEnquiry.guestCount} Guests</strong>
                </div>
              </div>

              <p style={{ fontSize: '12.5px', color: 'var(--taupe, #9C8770)', margin: 0, lineHeight: 1.5 }}>
                Thank you, <strong>{submittedEnquiry.firstName}</strong>. Our events director has received your request and will review availability and prepare a bespoke proposal within 24–48 hours.
              </p>

              <button
                type="button"
                onClick={() => setSubmittedEnquiry(null)}
                style={{
                  background: 'var(--cocoa-deep, #2B2015)',
                  color: '#F7EFE1',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '6px'
                }}
              >
                Close &amp; Return to Venue Hire
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
