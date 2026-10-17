import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './AnnouncementBar.module.css';

export default function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await axios.get('/api/site/announcements');
        setAnnouncements(res.data);
      } catch (err) {
        console.error('Failed to fetch announcements:', err);
      }
    };
    fetchAnnouncements();
  }, []);

  if (!isVisible || announcements.length === 0) return null;

  const announcement = announcements[0]; // Show the top-priority active announcement

  return (
    <div 
      className={styles.bar} 
      style={{ 
        backgroundColor: announcement.backgroundColor || 'var(--rust)',
        color: announcement.textColor || 'var(--cream)'
      }}
    >
      <div className={styles.content}>
        <span className={styles.message}>{announcement.message}</span>
        {announcement.linkUrl && announcement.linkText && (
          <a href={announcement.linkUrl} className={styles.link}>
            {announcement.linkText} <span className={styles.arrow}>&rarr;</span>
          </a>
        )}
      </div>
      <button className={styles.closeBtn} onClick={() => setIsVisible(false)} aria-label="Close announcement">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
          <path d="M18 6L6 18M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  );
}
