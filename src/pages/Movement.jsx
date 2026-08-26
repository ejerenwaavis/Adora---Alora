import React, { useState, useEffect, Fragment } from 'react';
import BookingModal from '../components/BookingModal';
import PageHeader from '../components/ui/PageHeader';
import styles from './Movement.module.css';

export default function Movement() {
  const [classTypes, setClassTypes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedClassType, setSelectedClassType] = useState(null);
  const [selectedSessionToBook, setSelectedSessionToBook] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/classes/types').then(res => res.json()),
      fetch('/api/classes/timetable').then(res => res.json())
    ])
    .then(([typesData, sessionsData]) => {
      setClassTypes(Array.isArray(typesData) ? typesData : []);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  // Group sessions by date for the selected class type
  const getGroupedSessions = () => {
    if (!selectedClassType) return {};
    
    const filtered = sessions.filter(s => s.classType?._id === selectedClassType._id);
    const groups = {};
    
    filtered.forEach(s => {
      const dateObj = new Date(s.startTime);
      // Group by "Mon, Sep 15" format
      const dateStr = dateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(s);
    });
    
    return groups;
  };

  const groupedSessions = getGroupedSessions();

  return (
    <div className={styles.pageContainer}>
      <PageHeader 
        title="Movement" 
        subtitle="One Rhythm. Move with intention."
        backgroundImage="https://images.unsplash.com/photo-1599901860904-17e08c2d28f8?auto=format&fit=crop&q=80&w=2000"
      />

      <div className={styles.container}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--taupe)' }}>Loading classes...</div>
        ) : !selectedClassType ? (
          // View 1: Available Class Types
          <div className={styles.typesGrid}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--cocoa-deep)', marginBottom: '1rem' }}>Select a Class</h2>
              <p style={{ color: 'var(--taupe)', maxWidth: '600px', margin: '0 auto' }}>Choose from our signature movement and wellness practices to view available dates and times.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
              {classTypes.map(type => (
                <div 
                  key={type._id} 
                  className={styles.typeCard}
                  onClick={() => setSelectedClassType(type)}
                  style={{ cursor: 'pointer', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: '12px', overflow: 'hidden', background: '#FFFDF9', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(200, 155, 74, 0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ height: '200px', width: '100%', background: '#eaeaea', overflow: 'hidden' }}>
                    <img 
                      src={type.coverImage || 'https://images.unsplash.com/photo-1599901860904-17e08c2d28f8?auto=format&fit=crop&q=80&w=800'} 
                      alt={type.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.4rem', fontFamily: 'var(--font-heading)', color: 'var(--cocoa-deep)' }}>{type.name}</h3>
                      <span style={{ fontSize: '0.75rem', background: '#FAF6EF', padding: '4px 10px', borderRadius: '12px', color: 'var(--taupe)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{type.durationMinutes} MIN</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--taupe)', lineHeight: 1.5, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {type.description}
                    </p>
                    <div style={{ fontSize: '0.8rem', color: 'var(--rust)', fontWeight: 600, textTransform: 'uppercase' }}>
                      View Available Dates &rarr;
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // View 2: Class Timetable
          <div className={styles.timetableSection}>
            <button 
              onClick={() => setSelectedClassType(null)}
              style={{ background: 'none', border: 'none', color: 'var(--taupe)', fontSize: '0.9rem', cursor: 'pointer', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              &larr; Back to all classes
            </button>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', marginBottom: '3rem', alignItems: 'center' }}>
              <div style={{ flex: '1 1 400px' }}>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--cocoa-deep)', marginBottom: '1rem' }}>{selectedClassType.name}</h2>
                <p style={{ color: 'var(--taupe)', fontSize: '1.1rem', lineHeight: 1.6 }}>{selectedClassType.description}</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <span style={{ padding: '6px 12px', background: '#FAF6EF', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--cocoa-deep)' }}>{selectedClassType.durationMinutes} Minutes</span>
                  <span style={{ padding: '6px 12px', background: '#FAF6EF', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--cocoa-deep)' }}>Intensity: {selectedClassType.intensityLevel || 'All Levels'}/5</span>
                </div>
              </div>
              <div style={{ flex: '1 1 300px', height: '300px', borderRadius: '12px', overflow: 'hidden' }}>
                 <img src={selectedClassType.coverImage || 'https://images.unsplash.com/photo-1599901860904-17e08c2d28f8?auto=format&fit=crop&q=80&w=800'} alt={selectedClassType.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>

            <h3 style={{ borderBottom: '1px solid rgba(227, 211, 184, 0.6)', paddingBottom: '1rem', marginBottom: '2rem', color: 'var(--cocoa-deep)', fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>Available Dates</h3>
            
            {Object.keys(groupedSessions).length === 0 ? (
              <div style={{ padding: '3rem', background: '#FFFDF9', textAlign: 'center', borderRadius: '8px', color: 'var(--taupe)', border: '1px dashed rgba(227, 211, 184, 0.8)' }}>
                No upcoming sessions scheduled for {selectedClassType.name}. Please check back later.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {Object.entries(groupedSessions).map(([dateStr, daySessions]) => (
                  <div key={dateStr} style={{ background: '#FFFDF9', border: '1px solid rgba(227, 211, 184, 0.6)', borderRadius: '12px', padding: '1.5rem' }}>
                    <h4 style={{ color: 'var(--cocoa-deep)', fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #FAF6EF', paddingBottom: '0.5rem' }}>{dateStr}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {daySessions.map(session => (
                        <div key={session._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1rem', background: '#FAF6EF', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--cocoa-deep)', width: '90px' }}>
                              {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div>
                              <div style={{ fontSize: '1rem', color: 'var(--cocoa-deep)', fontWeight: 500 }}>{session.instructor?.firstName} {session.instructor?.lastName}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--taupe)' }}>{session.venueSpace?.name || 'Main Studio'}</div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setSelectedSessionToBook(session)}
                            disabled={session.bookedCount >= session.capacity}
                            style={{ 
                              background: session.bookedCount >= session.capacity ? 'transparent' : 'var(--cocoa-deep)', 
                              color: session.bookedCount >= session.capacity ? 'var(--taupe)' : '#FFF', 
                              border: session.bookedCount >= session.capacity ? '1px solid var(--taupe)' : 'none',
                              padding: '10px 20px', 
                              borderRadius: '20px', 
                              fontSize: '0.85rem', 
                              cursor: session.bookedCount >= session.capacity ? 'not-allowed' : 'pointer',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em'
                            }}
                          >
                            {session.bookedCount >= session.capacity ? 'Waitlist' : 'Book Session'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedSessionToBook && (
        <BookingModal 
          session={selectedSessionToBook} 
          onClose={() => setSelectedSessionToBook(null)}
          onSuccess={() => {
            // Optional: Refresh timetable data here
            setSelectedSessionToBook(null);
          }}
        />
      )}
    </div>
  );
}
