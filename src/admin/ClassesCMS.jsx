import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import styles from './CMS.module.css';

export default function ClassesCMS() {
  const { authFetch } = useAuth();
  const { confirmAction } = useModal();
  const [classTypes, setClassTypes] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const defaultClassForm = { name: '', slug: '', description: '', durationMinutes: 60, maxCapacity: 20, level: 'all-levels', isActive: true, coverImage: null, existingCoverImage: '' };
  const defaultInstForm = { firstName: '', lastName: '', bio: '', isActive: true, photo: null, existingPhoto: '' };

  const [classForm, setClassForm] = useState(defaultClassForm);
  const [instructorForm, setInstructorForm] = useState(defaultInstForm);
  
  const [editingClassId, setEditingClassId] = useState(null);
  const [editingInstId, setEditingInstId] = useState(null);
  const [activeTab, setActiveTab] = useState('classes');
  const [view, setView] = useState('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [levelFilter, setLevelFilter] = useState('all'); // all, beginner, intermediate, advanced, all-levels

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
      const method = editingClassId ? 'PATCH' : 'POST';
      
      const formData = new FormData();
      formData.append('name', classForm.name);
      formData.append('slug', classForm.slug);
      formData.append('description', classForm.description);
      formData.append('durationMinutes', classForm.durationMinutes);
      formData.append('maxCapacity', classForm.maxCapacity);
      formData.append('level', classForm.level);
      formData.append('isActive', classForm.isActive);
      if (classForm.coverImage) formData.append('coverImage', classForm.coverImage);

      const res = await authFetch(url, {
        method,
        body: formData
      });
      if (res.ok) {
        setClassForm(defaultClassForm);
        setEditingClassId(null);
        setView('list');
        loadData();
      }
    } catch (err) { console.error(err); }
  }

  function handleClassDelete(id) {
    confirmAction('Delete Class Type', 'Are you sure you want to delete this class type?', async () => {
      try {
        const res = await authFetch(`/api/cms/class-types/${id}`, { method: 'DELETE' });
        if (res.ok) loadData();
      } catch (err) { console.error(err); }
    });
  }

  function editClass(cls) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingClassId(cls._id);
    setClassForm({ name: cls.name, slug: cls.slug, description: cls.description || '', durationMinutes: cls.durationMinutes, maxCapacity: cls.maxCapacity || 20, level: cls.level || 'all-levels', isActive: cls.isActive, coverImage: null, existingCoverImage: cls.coverImage || '' });
    setActiveTab('classes');
    setView('form');
  }

  // Instructors
  async function handleInstSubmit(e) {
    e.preventDefault();
    try {
      const url = editingInstId ? `/api/cms/instructors/${editingInstId}` : '/api/cms/instructors';
      const method = editingInstId ? 'PATCH' : 'POST';
      
      const formData = new FormData();
      formData.append('firstName', instructorForm.firstName);
      formData.append('lastName', instructorForm.lastName);
      formData.append('bio', instructorForm.bio);
      formData.append('isActive', instructorForm.isActive);
      if (instructorForm.photo) formData.append('photo', instructorForm.photo);

      const res = await authFetch(url, {
        method,
        body: formData
      });
      if (res.ok) {
        setInstructorForm(defaultInstForm);
        setEditingInstId(null);
        setView('list');
        loadData();
      }
    } catch (err) { console.error(err); }
  }

  function handleInstDelete(id) {
    confirmAction('Delete Instructor', 'Are you sure you want to delete this instructor?', async () => {
      try {
        const res = await authFetch(`/api/cms/instructors/${id}`, { method: 'DELETE' });
        if (res.ok) loadData();
      } catch (err) { console.error(err); }
    });
  }

  function editInstructor(inst) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingInstId(inst._id);
    setInstructorForm({ firstName: inst.firstName, lastName: inst.lastName, bio: inst.bio || '', isActive: inst.isActive, photo: null, existingPhoto: inst.photo || '' });
    setActiveTab('instructors');
    setView('form');
  }

  const filteredClasses = classTypes.filter(cls => {
    if (searchQuery && !cls.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter === 'active' && !cls.isActive) return false;
    if (statusFilter === 'inactive' && cls.isActive) return false;
    if (levelFilter !== 'all' && cls.level !== levelFilter) return false;
    return true;
  });

  const filteredInstructors = instructors.filter(inst => {
    if (searchQuery && !`${inst.firstName} ${inst.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter === 'active' && !inst.isActive) return false;
    if (statusFilter === 'inactive' && inst.isActive) return false;
    return true;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>Movement</h1>
      
      {view === 'list' && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button className={activeTab === 'classes' ? styles.btn : styles.btnOutline} onClick={() => { setActiveTab('classes'); setSearchQuery(''); setStatusFilter('all'); }}>Class Types</button>
          <button className={activeTab === 'instructors' ? styles.btn : styles.btnOutline} onClick={() => { setActiveTab('instructors'); setSearchQuery(''); setStatusFilter('all'); }}>Instructors</button>
        </div>
      )}

      {activeTab === 'classes' && (
        <>
          {view === 'list' && (
            <>
              <div className={styles.actionBar}>
                <div className={styles.filterGroup}>
                  <input type="text" placeholder="Search class types..." className={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <select className={styles.filterSelect} value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
                    <option value="all">All Levels</option>
                    <option value="all-levels">All Levels (Tag)</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <button className={styles.btn} onClick={() => { setEditingClassId(null); setClassForm(defaultClassForm); setView('form'); }}>
                  + Create New Class Type
                </button>
              </div>

              <div className={styles.list}>
                {filteredClasses.length === 0 ? (
                  <div className={styles.empty}>No class types found.</div>
                ) : (
                  filteredClasses.map(item => (
                    <div key={item._id} className={`${styles.listItem} ${!item.isActive ? styles.inactive : ''}`}>
                      <div className={styles.itemContent} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {item.coverImage && <img src={item.coverImage} alt="" style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}} />}
                        <div>
                          <strong>{item.name}</strong> 
                          <span className={styles.meta} style={{marginLeft: '0.5rem'}}>({item.durationMinutes} mins • {item.level} • max {item.maxCapacity})</span>
                        </div>
                      </div>
                      <div className={styles.itemActions}>
                        <button onClick={() => editClass(item)} className={styles.btnOutline}>Edit</button>
                        <button onClick={() => handleClassDelete(item._id)} className={styles.btnDanger}>Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {view === 'form' && (
            <div className={styles.card}>
              <div className={styles.formHeader}>
                <button className={styles.backBtn} onClick={() => { setView('list'); setClassForm(defaultClassForm); setEditingClassId(null); }}>
                  &larr; Back to List
                </button>
                <h2 className={styles.cardTitle} style={{marginBottom: 0}}>{editingClassId ? 'Edit Class Type' : 'New Class Type'}</h2>
              </div>
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
                  <label>Max Capacity</label>
                  <input type="number" min="1" value={classForm.maxCapacity} onChange={e => setClassForm({...classForm, maxCapacity: Number(e.target.value)})} required />
                </div>
                <div className={styles.field}>
                  <label>Level</label>
                  <select value={classForm.level} onChange={e => setClassForm({...classForm, level: e.target.value})}>
                    <option value="all-levels">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* IMAGE UPLOAD */}
              <div className={styles.field} style={{ borderTop: '1px solid #eaeaea', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <label>Cover Image</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {(classForm.coverImage || classForm.existingCoverImage) && (
                    <img 
                      src={classForm.coverImage ? URL.createObjectURL(classForm.coverImage) : classForm.existingCoverImage} 
                      alt="Preview" 
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} 
                    />
                  )}
                  <input type="file" accept="image/*" onChange={e => {
                    if (e.target.files[0]) setClassForm({...classForm, coverImage: e.target.files[0]});
                  }} />
                </div>
              </div>

              <div className={styles.checkboxField} style={{marginTop: '1rem'}}>
                <input type="checkbox" id="classActive" checked={classForm.isActive} onChange={e => setClassForm({...classForm, isActive: e.target.checked})} />
                <label htmlFor="classActive">Active</label>
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>{editingClassId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
          )}
        </>
      )}

      {activeTab === 'instructors' && (
        <>
          {view === 'list' && (
            <>
              <div className={styles.actionBar}>
                <div className={styles.filterGroup}>
                  <input type="text" placeholder="Search instructors..." className={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <button className={styles.btn} onClick={() => { setEditingInstId(null); setInstructorForm(defaultInstForm); setView('form'); }}>
                  + Add Instructor
                </button>
              </div>

              <div className={styles.list}>
                {filteredInstructors.length === 0 ? (
                  <div className={styles.empty}>No instructors found.</div>
                ) : (
                  filteredInstructors.map(inst => (
                    <div key={inst._id} className={`${styles.listItem} ${!inst.isActive ? styles.inactive : ''}`}>
                      <div className={styles.itemContent} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {inst.photo && <img src={inst.photo} alt="" style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '50%'}} />}
                        <strong>{inst.firstName} {inst.lastName}</strong>
                      </div>
                      <div className={styles.itemActions}>
                        <button onClick={() => editInstructor(inst)} className={styles.btnOutline}>Edit</button>
                        <button onClick={() => handleInstDelete(inst._id)} className={styles.btnDanger}>Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {view === 'form' && (
            <div className={styles.card}>
              <div className={styles.formHeader}>
                <button className={styles.backBtn} onClick={() => { setView('list'); setInstructorForm(defaultInstForm); setEditingInstId(null); }}>
                  &larr; Back to List
                </button>
                <h2 className={styles.cardTitle} style={{marginBottom: 0}}>{editingInstId ? 'Edit Instructor' : 'New Instructor'}</h2>
              </div>
              <form onSubmit={handleInstSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>First Name *</label>
                  <input type="text" value={instructorForm.firstName} onChange={e => setInstructorForm({...instructorForm, firstName: e.target.value})} required />
                </div>
                <div className={styles.field}>
                  <label>Last Name *</label>
                  <input type="text" value={instructorForm.lastName} onChange={e => setInstructorForm({...instructorForm, lastName: e.target.value})} required />
                </div>
              </div>
              
              <div className={styles.field}>
                <label>Bio</label>
                <textarea rows="3" value={instructorForm.bio} onChange={e => setInstructorForm({...instructorForm, bio: e.target.value})} />
              </div>

              {/* IMAGE UPLOAD */}
              <div className={styles.field} style={{ borderTop: '1px solid #eaeaea', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <label>Instructor Photo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {(instructorForm.photo || instructorForm.existingPhoto) && (
                    <img 
                      src={instructorForm.photo ? URL.createObjectURL(instructorForm.photo) : instructorForm.existingPhoto} 
                      alt="Preview" 
                      style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%' }} 
                    />
                  )}
                  <input type="file" accept="image/*" onChange={e => {
                    if (e.target.files[0]) setInstructorForm({...instructorForm, photo: e.target.files[0]});
                  }} />
                </div>
              </div>

              <div className={styles.checkboxField} style={{marginTop: '1rem'}}>
                <input type="checkbox" id="instActive" checked={instructorForm.isActive} onChange={e => setInstructorForm({...instructorForm, isActive: e.target.checked})} />
                <label htmlFor="instActive">Active</label>
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>{editingInstId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
          )}
        </>
      )}
    </div>
  );
}
