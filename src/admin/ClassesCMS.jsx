import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './CMS.module.css';

export default function ClassesCMS() {
  const { authFetch } = useAuth();
  const [classTypes, setClassTypes] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [classForm, setClassForm] = useState({ name: '', slug: '', description: '', durationMinutes: 60, intensity: 'medium', isActive: true });
  const [instructorForm, setInstructorForm] = useState({ name: '', bio: '', isActive: true });
  
  const [editingClassId, setEditingClassId] = useState(null);
  const [editingInstId, setEditingInstId] = useState(null);
  const [activeTab, setActiveTab] = useState('classes');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [clsRes, instRes] = await Promise.all([
        authFetch('/api/cms/class-types'),
        authFetch('/api/cms/instructors')
      ]);
      if (clsRes.ok) setClassTypes(await clsRes.json());
      if (instRes.ok) setInstructors(await instRes.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  // Class Types
  async function handleClassSubmit(e) {
    e.preventDefault();
    try {
      const url = editingClassId ? `/api/cms/class-types/${editingClassId}` : '/api/cms/class-types';
      const res = await authFetch(url, {
        method: editingClassId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classForm)
      });
      if (res.ok) {
        setClassForm({ name: '', slug: '', description: '', durationMinutes: 60, intensity: 'medium', isActive: true });
        setEditingClassId(null);
        loadData();
      }
    } catch (err) { console.error(err); }
  }

  async function handleClassDelete(id) {
    if (!window.confirm('Delete class type?')) return;
    try {
      const res = await authFetch(`/api/cms/class-types/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) { console.error(err); }
  }

  function editClass(cls) {
    setEditingClassId(cls._id);
    setClassForm({ name: cls.name, slug: cls.slug, description: cls.description || '', durationMinutes: cls.durationMinutes, intensity: cls.intensity, isActive: cls.isActive });
    setActiveTab('classes');
  }

  // Instructors
  async function handleInstSubmit(e) {
    e.preventDefault();
    try {
      const url = editingInstId ? `/api/cms/instructors/${editingInstId}` : '/api/cms/instructors';
      const res = await authFetch(url, {
        method: editingInstId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instructorForm)
      });
      if (res.ok) {
        setInstructorForm({ name: '', bio: '', isActive: true });
        setEditingInstId(null);
        loadData();
      }
    } catch (err) { console.error(err); }
  }

  async function handleInstDelete(id) {
    if (!window.confirm('Delete instructor?')) return;
    try {
      const res = await authFetch(`/api/cms/instructors/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) { console.error(err); }
  }

  function editInstructor(inst) {
    setEditingInstId(inst._id);
    setInstructorForm({ name: inst.name, bio: inst.bio || '', isActive: inst.isActive });
    setActiveTab('instructors');
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>Movement</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className={activeTab === 'classes' ? styles.btn : styles.btnOutline} onClick={() => setActiveTab('classes')}>Class Types</button>
        <button className={activeTab === 'instructors' ? styles.btn : styles.btnOutline} onClick={() => setActiveTab('instructors')}>Instructors</button>
      </div>

      {activeTab === 'classes' && (
        <>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{editingClassId ? 'Edit Class Type' : 'New Class Type'}</h2>
            <form onSubmit={handleClassSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Name *</label>
                  <input type="text" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} required />
                </div>
                <div className={styles.field}>
                  <label>Slug *</label>
                  <input type="text" value={classForm.slug} onChange={e => setClassForm({...classForm, slug: e.target.value})} required />
                </div>
              </div>
              
              <div className={styles.field}>
                <label>Description</label>
                <textarea rows="3" value={classForm.description} onChange={e => setClassForm({...classForm, description: e.target.value})} />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Duration (mins)</label>
                  <input type="number" value={classForm.durationMinutes} onChange={e => setClassForm({...classForm, durationMinutes: Number(e.target.value)})} required />
                </div>
                <div className={styles.field}>
                  <label>Intensity</label>
                  <select value={classForm.intensity} onChange={e => setClassForm({...classForm, intensity: e.target.value})}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className={styles.checkboxField} style={{marginTop: '1rem'}}>
                <input type="checkbox" id="classActive" checked={classForm.isActive} onChange={e => setClassForm({...classForm, isActive: e.target.checked})} />
                <label htmlFor="classActive">Active</label>
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>{editingClassId ? 'Update' : 'Create'}</button>
                {editingClassId && <button type="button" onClick={() => { setEditingClassId(null); setClassForm({name:'', slug:'', description:'', durationMinutes:60, intensity:'medium', isActive:true}); }} className={styles.btnGhost}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className={styles.list}>
            {classTypes.map(item => (
              <div key={item._id} className={`${styles.listItem} ${!item.isActive ? styles.inactive : ''}`}>
                <div className={styles.itemContent}>
                  <strong>{item.name}</strong> <span className={styles.meta}>({item.durationMinutes} mins • {item.intensity})</span>
                </div>
                <div className={styles.itemActions}>
                  <button onClick={() => editClass(item)} className={styles.btnOutline}>Edit</button>
                  <button onClick={() => handleClassDelete(item._id)} className={styles.btnDanger}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'instructors' && (
        <>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{editingInstId ? 'Edit Instructor' : 'New Instructor'}</h2>
            <form onSubmit={handleInstSubmit} className={styles.form}>
              <div className={styles.field}>
                <label>Name *</label>
                <input type="text" value={instructorForm.name} onChange={e => setInstructorForm({...instructorForm, name: e.target.value})} required />
              </div>
              <div className={styles.field}>
                <label>Bio</label>
                <textarea rows="3" value={instructorForm.bio} onChange={e => setInstructorForm({...instructorForm, bio: e.target.value})} />
              </div>
              <div className={styles.checkboxField} style={{marginTop: '1rem'}}>
                <input type="checkbox" id="instActive" checked={instructorForm.isActive} onChange={e => setInstructorForm({...instructorForm, isActive: e.target.checked})} />
                <label htmlFor="instActive">Active</label>
              </div>
              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>{editingInstId ? 'Update' : 'Create'}</button>
                {editingInstId && <button type="button" onClick={() => { setEditingInstId(null); setInstructorForm({name:'', bio:'', isActive:true}); }} className={styles.btnGhost}>Cancel</button>}
              </div>
            </form>
          </div>
          
          <div className={styles.list}>
            {instructors.map(inst => (
              <div key={inst._id} className={`${styles.listItem} ${!inst.isActive ? styles.inactive : ''}`}>
                <div className={styles.itemContent}>
                  <strong>{inst.name}</strong>
                </div>
                <div className={styles.itemActions}>
                  <button onClick={() => editInstructor(inst)} className={styles.btnOutline}>Edit</button>
                  <button onClick={() => handleInstDelete(inst._id)} className={styles.btnDanger}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
