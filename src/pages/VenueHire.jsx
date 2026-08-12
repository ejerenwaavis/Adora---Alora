import React, { useState, useEffect } from 'react';
import styles from './VenueHire.module.css';

const VENUES = {
  loft: {
    id: 'loft',
    title: 'The Loft',
    subtitle: 'A flexible venue created for meaningful learning, conversation and connection.',
    description: 'Positioned as a learning and events venue rather than a leadership lounge — "The Loft" is more distinctive and commercially flexible.',
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
      'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2000'
    ]
  },
  cafe: {
    id: 'cafe',
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
    bookingPrompt: 'Celebrate at Adora & Alora Café — reserve our private area or enquire about exclusive café hire for your next intimate event.',
    images: [
      'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1559925393-8be0ec4767c8?auto=format&fit=crop&q=80&w=2000',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=2000'
    ]
  }
};

export default function VenueHire({ section = 'loft' }) {
  const [activeVenue, setActiveVenue] = useState(section);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    setActiveVenue(section);
    setImageIndex(0);
  }, [section]);

  const venue = VENUES[activeVenue] || VENUES.loft;

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
          <button 
            className={`${styles.tourBtn} ${activeVenue === 'loft' ? styles.activeBtn : ''}`}
            onClick={() => handleVenueChange('loft')}
          >
            The Loft
          </button>
          <button 
            className={`${styles.tourBtn} ${activeVenue === 'cafe' ? styles.activeBtn : ''}`}
            onClick={() => handleVenueChange('cafe')}
          >
            The Café
          </button>
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
              <select required defaultValue={activeVenue}>
                <option value="loft">The Loft</option>
                <option value="cafe">The Café</option>
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
