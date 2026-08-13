import { useState, useEffect } from 'react';
import BookingModal from '../components/BookingModal';
import styles from './Movement.module.css';

export default function Movement() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    // In a real app, we'd pass ?start=...&end=... for the current week
    // For now, just grab all public sessions
    fetch('/api/classes/timetable')
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className="eyebrow centered">The Studio</div>
        <h1 className={styles.title}>Movement</h1>
        <p className={styles.subtitle}>Book your spot in our signature classes.</p>
      </div>

      <div className={styles.timetable}>
        {loading ? (
          <p>Loading timetable...</p>
        ) : sessions.length === 0 ? (
          <p>No classes scheduled right now. Check back soon!</p>
        ) : (
          <div className={styles.grid}>
            {sessions.map(session => (
              <div key={session._id} className={styles.card}>
                <div className={styles.timeBlock}>
                  <div className={styles.date}>{new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                  <div className={styles.time}>{new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className={styles.infoBlock}>
                  <h3>{session.classType?.name}</h3>
                  <p>with {session.instructor?.firstName} {session.instructor?.lastName}</p>
                </div>
                <div className={styles.actionBlock}>
                  <div className={styles.availability}>
                    {session.bookedCount >= session.maxCapacity ? 'Waitlist Only' : `${session.maxCapacity - session.bookedCount} Spots Left`}
                  </div>
                  <button onClick={() => setSelectedSession(session)} className="btn btn-outline">Book</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedSession && (
        <BookingModal session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
}
