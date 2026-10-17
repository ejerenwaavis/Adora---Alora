import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/public/timetable');
        if (res.ok) {
          const data = await res.json();
          const myClasses = data.filter(s => s.instructor?.userId === user._id || (s.instructor && s.instructor.firstName === user.firstName));
          setSessions(myClasses);
        }
      } catch (err) {}
      setLoading(false);
    }
    load();
  }, [user]);

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>My Timetable</h1>
      {loading ? (
        <p>Loading...</p>
      ) : sessions.length === 0 ? (
        <p>You have no upcoming classes assigned.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {sessions.map(s => (
            <div key={s._id} style={{ padding: '1.5rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{s.classType?.name}</h3>
              <p style={{ color: 'var(--taupe)', marginBottom: '0.25rem' }}>{new Date(s.startTime).toLocaleString()} - {new Date(s.endTime).toLocaleTimeString()}</p>
              <p style={{ color: 'var(--cocoa)', fontSize: '0.9rem' }}>Capacity: {s.capacity} · Booked: {s.currentBookings}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
