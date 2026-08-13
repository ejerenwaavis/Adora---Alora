import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './VenueHire.module.css';

const DEFAULT_VENUE = {
  id: 'default',
  title: 'Loading Spaces...',
  subtitle: 'Please wait',
  description: '',
  suitableFor: [],
  features: '',
  bookingPrompt: '',
  images: []
};

export default function VenueHire({ section }) {
  const [venuesMap, setVenuesMap] = useState({});
  const [activeVenue, setActiveVenue] = useState(section || 'default');
  const [imageIndex, setImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const res = await axios.get('/api/venue/spaces');
        const map = {};
        res.data.forEach((v, idx) => {
          map[v.slug] = {
            id: v.slug,
            title: v.name,
            subtitle: v.shortDescription || `Capacity: ${v.capacity || 'Flexible'}`,
            description: v.description || '',
            suitableFor: v.seatingOptions?.length > 0 ? v.seatingOptions : ['Private Events', 'Gatherings', 'Photoshoots'],
            features: v.amenities?.join(', ') || 'Various features available upon request.',
            bookingPrompt: `Enquire about booking ${v.name} for your next event.`,
            images: v.images?.length > 0 ? v.images : ['https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=2000']
          };
        });
        setVenuesMap(map);
        if (res.data.length > 0) {
          setActiveVenue(res.data[0].slug);
        }
      } catch (err) {
        console.error('Failed to load venue spaces:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVenues();
  }, []);

  useEffect(() => {
    if (section && venuesMap[section]) {
      setActiveVenue(section);
      setImageIndex(0);
    }
  }, [section, venuesMap]);

  const venue = venuesMap[activeVenue] || DEFAULT_VENUE;

  const handleVenueChange = (venueId) => {
    setActiveVenue(venueId);
    setImageIndex(0);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    alert('Enquiry submitted successfully! (This is a frontend demo)');
  };

  return (
    <div className={styles.venuePage}>
      {/* Hero Intro */}
      <div className={styles.introSection}>
        <h1 className={styles.pageTitle}>Host Your Event at Adora &amp; Alora</h1>
        <p className={styles.pageDesc}>
          Adora &amp; Alora offers beautifully designed, versatile spaces for learning, connection, celebration and community. 
          Whether you are planning a seminar, masterclass, mastermind session, intimate celebration, private brunch or 
          brand gathering, our spaces can be adapted to suit your occasion.
        </p>
      </div>

      {/* Interactive Tour */}
      <div className={styles.tourSection}>
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
              <button 
                className={styles.scrollBtn}
                onClick={() => document.getElementById('enquiry-form').scrollIntoView({ behavior: 'smooth' })}
              >
                Enquire About Venue Hire &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enquiry Form */}
      <div id="enquiry-form" className={styles.formSection}>
        <div className={styles.formHeader}>
          <h2>Enquire About Venue Hire</h2>
          <p>Please provide details about your event, and our team will get back to you shortly.</p>
        </div>

        <form className={styles.hireForm} onSubmit={handleFormSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>Full Name *</label>
              <input type="text" required placeholder="e.g. Jane Doe" />
            </div>
            <div className={styles.inputGroup}>
              <label>Email Address *</label>
              <input type="email" required placeholder="jane@example.com" />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Phone Number *</label>
              <input type="tel" required placeholder="+1 (555) 000-0000" />
            </div>
            <div className={styles.inputGroup}>
              <label>Organisation (where applicable)</label>
              <input type="text" placeholder="Company or Group Name" />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Type of Event *</label>
              <input type="text" required placeholder="e.g. Masterclass, Birthday Dinner" />
            </div>
            <div className={styles.inputGroup}>
              <label>Expected Number of Guests *</label>
              <input type="number" required min="1" placeholder="e.g. 25" />
            </div>

            <div className={styles.inputGroup}>
              <label>Preferred Date *</label>
              <input type="date" required />
            </div>
            <div className={styles.inputGroup}>
              <label>Alternative Date</label>
              <input type="date" />
            </div>

            <div className={styles.inputGroup}>
              <label>Start Time *</label>
              <input type="time" required />
            </div>
            <div className={styles.inputGroup}>
              <label>Finish Time *</label>
              <input type="time" required />
            </div>

            <div className={styles.inputGroup}>
              <label>Preferred Space *</label>
              <select required value={activeVenue} onChange={(e) => setActiveVenue(e.target.value)}>
                {Object.values(venuesMap).map(v => (
                  <option key={v.id} value={v.id}>{v.title}</option>
                ))}
                <option value="unsure">Not Sure</option>
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label>Seating Arrangement</label>
              <input type="text" placeholder="e.g. Theatre-style, Round-table" />
            </div>
          </div>

          <div className={styles.inputGroupFull}>
            <label>Audio-Visual Requirements</label>
            <input type="text" placeholder="e.g. Projector, Microphones, Sound System" />
          </div>

          <div className={styles.inputGroupFull}>
            <label>Catering Requirements</label>
            <textarea rows="2" placeholder="Food and beverage packages, dietary restrictions..."></textarea>
          </div>

          <div className={styles.inputGroupFull}>
            <label>Brief Description of the Event *</label>
            <textarea rows="4" required placeholder="Tell us more about your vision for the event..."></textarea>
          </div>

          <button type="submit" className={styles.submitBtn}>Submit Enquiry</button>
        </form>
      </div>
    </div>
  );
}
