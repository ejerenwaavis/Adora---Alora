import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './CMS.module.css';
import Modal from '../components/ui/Modal';

export default function ScheduleCMS() {
  const { authFetch } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isAlert: false });

  // Form state
  const [formData, setFormData] = useState({
    classType: '',
    instructor: '',
    date: new Date().toISOString().split('T')[0],
    startTimeStr: '08:00',
    endTimeStr: '09:00',
    maxCapacity: 20,
    isPublic: true
  });
  
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [sesRes, clsRes, instRes] = await Promise.all([
        authFetch('/api/classes'), // The admin route we built
        authFetch('/api/cms/class-types'),
        authFetch('/api/cms/instructors')
      ]);
      if (sesRes.ok) setSessions(await sesRes.json());
      if (clsRes.ok) setClassTypes(await clsRes.json());
      if (instRes.ok) setInstructors(await instRes.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTimeStr}:00`);
      const endDateTime = new Date(`${formData.date}T${formData.endTimeStr}:00`);
      
      const payload = {
        classType: formData.classType,
        instructor: formData.instructor,
        startTime: startDateTime,
        endTime: endDateTime,
        maxCapacity: formData.maxCapacity,
        isPublic: formData.isPublic
      };

      const url = editingId ? `/api/classes/${editingId}` : '/api/classes';
      const res = await authFetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setFormData({ ...formData }); // keep defaults mostly
        setEditingId(null);
        loadData();
      } else {
        const data = await res.json();
        setModalConfig({ isOpen: true, title: 'Error', message: data.error || 'Failed to save class session', isAlert: true });
      }
    } catch (err) { 
      console.error(err);
      setModalConfig({ isOpen: true, title: 'Error', message: 'An error occurred while saving the class session.', isAlert: true });
    }
  }

  function confirmCancel(id) {
    setModalConfig({
      isOpen: true,
      title: 'Cancel Class',
      message: 'Cancel this class session? This will affect bookings.',
      isAlert: false,
      onConfirm: () => handleCancel(id)
    });
  }

  async function handleCancel(id) {
    setModalConfig({ ...modalConfig, isOpen: false });
    try {
      const res = await authFetch(`/api/classes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCancelled: true, status: 'cancelled' })
      });
      if (res.ok) loadData();
    } catch (err) { console.error(err); }
  }

  function confirmDelete(id) {
    setModalConfig({
      isOpen: true,
      title: 'Delete Class',
      message: 'Permanently delete this class session?',
      isAlert: false,
      onConfirm: () => handleDelete(id)
    });
  }

  async function handleDelete(id) {
    setModalConfig({ ...modalConfig, isOpen: false });
    try {
      const res = await authFetch(`/api/classes/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) { console.error(err); }
  }

  function handleEdit(session) {
    setEditingId(session._id);
    const startDate = new Date(session.startTime);
    const endDate = new Date(session.endTime);
    setFormData({
      classType: session.classType._id,
      instructor: session.instructor._id,
      date: startDate.toISOString().split('T')[0],
      startTimeStr: startDate.toTimeString().substring(0, 5),
      endTimeStr: endDate.toTimeString().substring(0, 5),
      maxCapacity: session.maxCapacity,
      isPublic: session.isPublic
    });
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>Timetable Schedule</h1>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>{editingId ? 'Edit Session' : 'Schedule New Class'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Class Type *</label>
              <select value={formData.classType} onChange={e => setFormData({...formData, classType: e.target.value})} required>
                <option value="">Select...</option>
                {classTypes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label>Instructor *</label>
              <select value={formData.instructor} onChange={e => setFormData({...formData, instructor: e.target.value})} required>
                <option value="">Select...</option>
                {instructors.map(i => <option key={i._id} value={i._id}>{i.firstName} {i.lastName}</option>)}
              </select>
            </div>
          </div>
          
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Date *</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
            </div>
            <div className={styles.field}>
              <label>Start Time *</label>
              <input type="time" value={formData.startTimeStr} onChange={e => setFormData({...formData, startTimeStr: e.target.value})} required />
            </div>
            <div className={styles.field}>
              <label>End Time *</label>
              <input type="time" value={formData.endTimeStr} onChange={e => setFormData({...formData, endTimeStr: e.target.value})} required />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label>Capacity *</label>
              <input type="number" min="1" value={formData.maxCapacity} onChange={e => setFormData({...formData, maxCapacity: Number(e.target.value)})} required />
            </div>
            <div className={styles.checkboxField} style={{marginTop: '2.5rem'}}>
              <input type="checkbox" id="isPublic" checked={formData.isPublic} onChange={e => setFormData({...formData, isPublic: e.target.checked})} />
              <label htmlFor="isPublic">Visible on Timetable</label>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.btn}>{editingId ? 'Update' : 'Schedule'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({...formData, classType: '', instructor: ''}); }} className={styles.btnGhost}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className={styles.list}>
        {sessions.map(session => (
          <div key={session._id} className={`${styles.listItem} ${session.isCancelled ? styles.inactive : ''}`}>
            <div className={styles.itemContent}>
              <strong>{session.classType?.name} with {session.instructor?.firstName} {session.instructor?.lastName}</strong> 
              <div className={styles.meta}>
                {new Date(session.startTime).toLocaleDateString()} @ {new Date(session.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                &nbsp;•&nbsp; {session.bookedCount}/{session.maxCapacity} Booked
                {session.isCancelled && <span style={{color: 'red', marginLeft: '10px'}}>CANCELLED</span>}
              </div>
            </div>
            <div className={styles.itemActions}>
              <button onClick={() => handleEdit(session)} className={styles.btnOutline}>Edit</button>
              {!session.isCancelled && <button onClick={() => confirmCancel(session._id)} className={styles.btnGhost}>Cancel Class</button>}
              <button onClick={() => confirmDelete(session._id)} className={styles.btnDanger}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={modalConfig.isOpen} 
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        actions={
          modalConfig.isAlert ? (
            <button className={styles.btn} onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}>OK</button>
          ) : (
            <>
              <button className={styles.btnDanger} onClick={modalConfig.onConfirm}>Confirm</button>
              <button className={styles.btnGhost} onClick={() => setModalConfig({ ...modalConfig, isOpen: false })}>Cancel</button>
            </>
          )
        }
      >
        <p>{modalConfig.message}</p>
      </Modal>
    </div>
  );
}
