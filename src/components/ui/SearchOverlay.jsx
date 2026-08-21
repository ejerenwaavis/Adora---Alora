import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SearchOverlay.module.css';

export default function SearchOverlay({ onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) inputRef.current.focus();
    
    // Close on escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleResultClick = (path) => {
    navigate(path);
    onClose();
  };

  const hasResults = results && (
    results.events.length > 0 || 
    results.venues.length > 0 || 
    results.classes.length > 0 || 
    results.instructors.length > 0 || 
    results.fashion.length > 0
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      
      <div className={styles.modal}>
        <div className={styles.header}>
          <svg className={styles.searchIcon} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            ref={inputRef}
            type="text" 
            className={styles.input} 
            placeholder="Search Aora House..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.resultsArea}>
          {loading && <div className={styles.loading}>Searching...</div>}
          
          {!loading && results && !hasResults && (
            <div className={styles.noResults}>No results found for "{query}"</div>
          )}

          {!loading && hasResults && (
            <div className={styles.resultsGrid}>
              
              {results.events.length > 0 && (
                <div className={styles.resultGroup}>
                  <h3>Events</h3>
                  <ul>
                    {results.events.map(event => (
                      <li key={event._id} onClick={() => handleResultClick(`/events#${event.slug}`)}>
                        <div className={styles.resultItem}>
                          {event.coverImage && <img src={event.coverImage} alt="" />}
                          <div className={styles.resultText}>
                            <strong>{event.title}</strong>
                            <span>{new Date(event.startDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.venues.length > 0 && (
                <div className={styles.resultGroup}>
                  <h3>Venue Spaces</h3>
                  <ul>
                    {results.venues.map(venue => (
                      <li key={venue._id} onClick={() => handleResultClick('/venue-hire')}>
                        <div className={styles.resultItem}>
                          {venue.images?.[0] && <img src={venue.images[0]} alt="" />}
                          <div className={styles.resultText}>
                            <strong>{venue.name}</strong>
                            <span>Cap: {venue.capacity}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.classes.length > 0 && (
                <div className={styles.resultGroup}>
                  <h3>Classes</h3>
                  <ul>
                    {results.classes.map(cls => (
                      <li key={cls._id} onClick={() => handleResultClick('/movement')}>
                        <div className={styles.resultItem}>
                          {cls.coverImage && <img src={cls.coverImage} alt="" />}
                          <div className={styles.resultText}>
                            <strong>{cls.name}</strong>
                            <span>{cls.level}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.instructors.length > 0 && (
                <div className={styles.resultGroup}>
                  <h3>Instructors</h3>
                  <ul>
                    {results.instructors.map(inst => (
                      <li key={inst._id} onClick={() => handleResultClick('/movement')}>
                        <div className={styles.resultItem}>
                          {inst.photo && <img src={inst.photo} alt="" style={{ borderRadius: '50%' }} />}
                          <div className={styles.resultText}>
                            <strong>{inst.firstName} {inst.lastName}</strong>
                            <span>Instructor</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {results.fashion.length > 0 && (
                <div className={styles.resultGroup}>
                  <h3>Fashion</h3>
                  <ul>
                    {results.fashion.map(item => (
                      <li key={item._id} onClick={() => handleResultClick('/fashion')}>
                        <div className={styles.resultItem}>
                          {item.images?.[0] && <img src={item.images[0]} alt="" />}
                          <div className={styles.resultText}>
                            <strong>{item.name}</strong>
                            <span>₦{(item.priceKobo / 100).toLocaleString()}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
