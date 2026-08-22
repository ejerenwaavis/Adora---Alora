import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import styles from './CMS.module.css';

export default function ClassesCMS() {
  const { authFetch } = useAuth();
  const { confirmAction } = useModal();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [classTypes, setClassTypes] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const defaultClassForm = { name: '', slug: '', description: '', durationMinutes: 60, maxCapacity: 20, level: 'all-levels', isActive: true, coverImage: null, existingCoverImage: '' };
  const defaultInstForm = { 
    firstName: '', 
    lastName: '', 
    roleTitle: 'Expert Pilates Instructor',
    bio: '', 
    shortBio: '', 
    specialities: '', 
    certifications: '', 
    instagram: '', 
    isActive: true, 
    photo: null, 
    existingPhoto: '' 
  };

  const [classForm, setClassForm] = useState(defaultClassForm);
  const [instructorForm, setInstructorForm] = useState(defaultInstForm);
  
  const [editingClassId, setEditingClassId] = useState(null);
  const [editingInstId, setEditingInstId] = useState(null);
  const [viewingProfileInst, setViewingProfileInst] = useState(null);
  const [instViewMode, setInstViewMode] = useState('grid'); // 'grid' | 'list'
  
  const activeTab = searchParams.get('tab') === 'instructors' ? 'instructors' : 'classes';
  const setActiveTab = (tab) => {
    setSearchParams(tab === 'instructors' ? { tab: 'instructors' } : {});
    setView('list');
    setEditingClassId(null);
    setEditingInstId(null);
  };
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
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to save class type.');
        return;
      }
      toast.success(editingClassId ? 'Class type updated successfully.' : 'Class type created successfully.');
      setClassForm(defaultClassForm);
      setEditingClassId(null);
      setView('list');
      loadData();
    } catch (err) { 
      console.error(err);
      toast.error(err.message || 'Error saving class type.');
    }
  }

  function handleClassDelete(id) {
    confirmAction('Delete Class Type', 'Are you sure you want to delete this class type?', async () => {
      try {
        const res = await authFetch(`/api/cms/class-types/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Class type deleted successfully.');
          loadData();
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || 'Failed to delete class type.');
        }
      } catch (err) { 
        console.error(err);
        toast.error('Failed to delete class type.');
      }
    });
  }

  function editClass(cls) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingClassId(cls._id);
    setClassForm({ name: cls.name, slug: cls.slug, description: cls.description || '', durationMinutes: cls.durationMinutes, maxCapacity: cls.maxCapacity || 20, level: cls.level || 'all-levels', isActive: cls.isActive, coverImage: null, existingCoverImage: cls.coverImage || '' });
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
      formData.append('roleTitle', instructorForm.roleTitle || 'Movement Instructor');
      formData.append('bio', instructorForm.bio);
      formData.append('shortBio', instructorForm.shortBio);
      formData.append('specialities', instructorForm.specialities);
      formData.append('certifications', instructorForm.certifications);
      formData.append('instagram', instructorForm.instagram);
      formData.append('isActive', instructorForm.isActive);
      if (instructorForm.photo) formData.append('photo', instructorForm.photo);

      const res = await authFetch(url, {
        method,
        body: formData
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to save instructor.');
        return;
      }
      toast.success(editingInstId ? 'Instructor updated successfully.' : 'Instructor created successfully.');
      setInstructorForm(defaultInstForm);
      setEditingInstId(null);
      setView('list');
      loadData();
    } catch (err) { 
      console.error(err);
      toast.error(err.message || 'Error saving instructor.');
    }
  }

  function handleInstDelete(id) {
    confirmAction('Delete Instructor', 'Are you sure you want to delete this instructor?', async () => {
      try {
        const res = await authFetch(`/api/cms/instructors/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Instructor deleted successfully.');
          loadData();
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || 'Failed to delete instructor.');
        }
      } catch (err) { 
        console.error(err);
        toast.error('Failed to delete instructor.');
      }
    });
  }

  function editInstructor(inst) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingInstId(inst._id);
    setInstructorForm({ 
      firstName: inst.firstName, 
      lastName: inst.lastName, 
      roleTitle: inst.roleTitle || 'Expert Movement Instructor',
      bio: inst.bio || '', 
      shortBio: inst.shortBio || '',
      specialities: Array.isArray(inst.specialities) ? inst.specialities.join(', ') : (inst.specialities || ''),
      certifications: Array.isArray(inst.certifications) ? inst.certifications.join(', ') : (inst.certifications || ''),
      instagram: inst.instagram || '',
      isActive: inst.isActive, 
      photo: null, 
      existingPhoto: inst.photo || '' 
    });
    setView('form');
  }

  const formatJoinedDate = (dateStr) => {
    if (!dateStr) return 'Jan 2023';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  const filteredClasses = classTypes.filter(cls => {
    if (searchQuery && !cls.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter === 'active' && !cls.isActive) return false;
    if (statusFilter === 'inactive' && cls.isActive) return false;
    if (levelFilter !== 'all' && cls.level !== levelFilter) return false;
    return true;
  });

  const filteredInstructors = instructors.filter(inst => {
    const fullName = `${inst.firstName} ${inst.lastName}`.toLowerCase();
    const role = (inst.roleTitle || '').toLowerCase();
    const specs = (inst.specialities || []).join(' ').toLowerCase();
    const q = searchQuery.toLowerCase();
    if (searchQuery && !fullName.includes(q) && !role.includes(q) && !specs.includes(q)) return false;
    if (statusFilter === 'active' && !inst.isActive) return false;
    if (statusFilter === 'inactive' && inst.isActive) return false;
    return true;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      
      {activeTab === 'classes' && (
        <>
          <h1 className={styles.title}>Movement Class Types</h1>
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
                      <div className={styles.cardMain}>
                        {item.coverImage ? (
                          <img src={item.coverImage} alt={item.name} className={styles.cardThumb} />
                        ) : (
                          <div className={styles.cardThumbPlaceholder}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="5" r="2.5" /><path d="m4 17 4-5 3 2 4-7 4 3" /><path d="M9 19v-5" />
                            </svg>
                          </div>
                        )}
                        <div className={styles.itemContent}>
                          <div className={styles.itemTitle}>
                            <span>{item.name}</span>
                            {!item.isActive && <span className={styles.badge} style={{ color: 'var(--rust)', background: 'rgba(164, 69, 31, 0.1)' }}>Inactive</span>}
                          </div>
                          <div className={styles.meta}>
                            <span>{item.durationMinutes} mins</span>
                            <span>•</span>
                            <span style={{ textTransform: 'capitalize' }}>{item.level || 'All levels'}</span>
                            <span>•</span>
                            <span>Max {item.maxCapacity} spots</span>
                          </div>
                          {item.description && <p className={styles.itemDesc}>{item.description}</p>}
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

              {/* COVER IMAGE */}
              <div className={styles.field} style={{ borderTop: '1px solid #eaeaea', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <label>Class Type Cover Image</label>
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
                <button type="button" onClick={() => { setView('list'); setClassForm(defaultClassForm); setEditingClassId(null); }} className={styles.btnGhost}>Cancel</button>
              </div>
            </form>
          </div>
          )}
        </>
      )}

      {activeTab === 'instructors' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h1 className={styles.title} style={{ marginBottom: '0.25rem' }}>Movement Instructors</h1>
              <p style={{ color: 'var(--taupe)', fontSize: '0.95rem', margin: 0 }}>
                Manage and organize all movement instructors.
              </p>
            </div>
            {view === 'list' && (
              <button 
                className={styles.btn} 
                onClick={() => { setEditingInstId(null); setInstructorForm(defaultInstForm); setView('form'); }}
                style={{ padding: '0.85rem 1.6rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                + ADD INSTRUCTOR
              </button>
            )}
          </div>

          {view === 'list' && (
            <>
              <div className={styles.instructorActionBar}>
                <div className={styles.searchWrapperLarge}>
                  <span className={styles.searchIconInside}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8C7A6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Search by instructor name or specialty..." 
                    className={styles.searchInputLarge} 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                  />
                </div>

                <select className={styles.statusSelectLarge} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">All Instructors ({instructors.length})</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive</option>
                </select>

                {/* View Mode Switcher */}
                <div className={styles.viewToggleGroup}>
                  <button 
                    type="button"
                    title="Grid / Showcase View"
                    className={`${styles.viewToggleBtn} ${instViewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
                    onClick={() => setInstViewMode('grid')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </button>
                  <button 
                    type="button"
                    title="List View"
                    className={`${styles.viewToggleBtn} ${instViewMode === 'list' ? styles.viewToggleBtnActive : ''}`}
                    onClick={() => setInstViewMode('list')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              {filteredInstructors.length === 0 ? (
                <div className={styles.empty}>No instructors found matching your search or filters.</div>
              ) : instViewMode === 'grid' ? (
                /* ── GRID / SHOWCASE CARDS ── */
                <div className={styles.instructorShowcaseGrid}>
                  {filteredInstructors.map(inst => (
                    <div 
                      key={inst._id} 
                      className={`${styles.showcaseCard} ${!inst.isActive ? styles.showcaseCardInactive : ''}`}
                    >
                      {/* Top Photo Container with Badges */}
                      <div className={styles.showcaseCoverContainer}>
                        {inst.photo ? (
                          <img 
                            src={inst.photo} 
                            alt={`${inst.firstName} ${inst.lastName}`} 
                            className={styles.showcaseCoverImg} 
                          />
                        ) : (
                          <div className={styles.showcaseCoverPlaceholder}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <circle cx="12" cy="5" r="2.5" /><path d="m4 17 4-5 3 2 4-7 4 3" /><path d="M9 19v-5" />
                            </svg>
                          </div>
                        )}

                        <span className={inst.isActive ? styles.showcaseActiveBadge : styles.showcaseInactiveBadge}>
                          {inst.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>

                        <button 
                          type="button" 
                          className={styles.showcaseKebabBtn} 
                          onClick={() => editInstructor(inst)} 
                          title="Edit Instructor Profile"
                          aria-label="Edit"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
                          </svg>
                        </button>
                      </div>

                      {/* Overlapping Movement Badge */}
                      <div className={styles.showcaseIconBadge} title="Movement Instructor">
                        {inst.roleTitle && inst.roleTitle.toLowerCase().includes('fitness') ? (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="6" y1="12" x2="18" y2="12" />
                            <line x1="6" y1="8" x2="6" y2="16" />
                            <line x1="18" y1="8" x2="18" y2="16" />
                            <line x1="3" y1="9" x2="3" y2="15" />
                            <line x1="21" y1="9" x2="21" y2="15" />
                          </svg>
                        ) : (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="4" r="2" />
                            <path d="m4 17 5-5 3 2 5-6 3 2" />
                            <path d="M9 19v-4" />
                          </svg>
                        )}
                      </div>

                      {/* Card Content Body */}
                      <div className={styles.showcaseBody}>
                        <div>
                          <h3 className={styles.showcaseName}>{inst.firstName} {inst.lastName}</h3>
                          <p className={styles.showcaseRole}>
                            {inst.roleTitle || 'EXPERT MOVEMENT INSTRUCTOR'}
                          </p>
                        </div>

                        {/* Stats Row */}
                        <div className={styles.showcaseStatsRow}>
                          <div className={styles.showcaseStatItem}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="#C89B4A" stroke="#C89B4A" strokeWidth="1">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            <strong style={{ color: 'var(--cocoa-deep)' }}>{inst.rating || 4.9}</strong>
                            <span style={{ color: 'var(--taupe)' }}>({inst.reviewCount || 48})</span>
                          </div>
                          <div className={styles.showcaseStatItem}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A4E44" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <span>{inst.classesCount || 0} Classes</span>
                          </div>
                          <div className={styles.showcaseStatItem}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A4E44" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" x2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                            </svg>
                            <span>Join since {formatJoinedDate(inst.joinedDate || inst.createdAt)}</span>
                          </div>
                        </div>

                        {/* Specialties Box */}
                        <div className={styles.showcaseSpecialtiesBox}>
                          <strong style={{ color: 'var(--cocoa-deep)' }}>Specialties:</strong>{' '}
                          {inst.specialities && inst.specialities.length > 0 
                            ? inst.specialities.join(', ') 
                            : 'Pilates, Core Strength, Flexibility'}
                        </div>

                        {/* Footer Action Buttons */}
                        <div className={styles.showcaseFooterActions}>
                          <div className={styles.showcaseFooterLeft}>
                            <button 
                              type="button"
                              className={styles.btnViewProfile}
                              onClick={() => setViewingProfileInst(inst)}
                            >
                              <span>VIEW PROFILE</span>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                              </svg>
                            </button>
                          </div>
                          <div className={styles.showcaseFooterRight}>
                            <button 
                              type="button"
                              className={styles.btnEditProfile}
                              onClick={() => editInstructor(inst)}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
                              </svg>
                              <span>EDIT</span>
                            </button>
                            <button 
                              type="button"
                              className={styles.btnDeleteProfile}
                              onClick={() => handleInstDelete(inst._id)}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" />
                              </svg>
                              <span>DELETE</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ── LIST VIEW ── */
                <div className={styles.instructorShowcaseList}>
                  {filteredInstructors.map(inst => (
                    <div 
                      key={inst._id} 
                      className={`${styles.showcaseListItem} ${!inst.isActive ? styles.showcaseCardInactive : ''}`}
                    >
                      <div className={styles.showcaseListMain}>
                        <div className={styles.showcaseListThumbContainer}>
                          {inst.photo ? (
                            <img src={inst.photo} alt={`${inst.firstName} ${inst.lastName}`} className={styles.showcaseListThumb} />
                          ) : (
                            <div className={styles.showcaseCoverPlaceholder} style={{ fontSize: '1.8rem' }}>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="12" cy="5" r="2.5" /><path d="m4 17 4-5 3 2 4-7 4 3" /><path d="M9 19v-5" />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className={styles.showcaseListDetails}>
                          <div className={styles.showcaseListHeader}>
                            <h3 className={styles.showcaseName} style={{ fontSize: '1.25rem' }}>{inst.firstName} {inst.lastName}</h3>
                            <span className={inst.isActive ? styles.badge : styles.badge} style={inst.isActive ? { background: 'rgba(65,79,54,0.1)', color: 'var(--forest)' } : { background: 'rgba(164,69,31,0.1)', color: 'var(--rust)' }}>
                              {inst.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                            <span className={styles.showcaseRole} style={{ margin: 0 }}>
                              {inst.roleTitle || 'EXPERT MOVEMENT INSTRUCTOR'}
                            </span>
                          </div>

                          <div className={styles.showcaseStatsRow} style={{ marginTop: '4px' }}>
                            <div className={styles.showcaseStatItem}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="#C89B4A" stroke="#C89B4A" strokeWidth="1">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                              <strong style={{ color: 'var(--cocoa-deep)' }}>{inst.rating || 4.9}</strong>
                              <span style={{ color: 'var(--taupe)' }}>({inst.reviewCount || 48})</span>
                            </div>
                            <div className={styles.showcaseStatItem}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A4E44" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                              </svg>
                              <span>{inst.classesCount || 0} Classes</span>
                            </div>
                            <div className={styles.showcaseStatItem}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A4E44" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" x2="6" /><line x1="8" x2="8" y1="2" x2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                              </svg>
                              <span>Joined {formatJoinedDate(inst.joinedDate || inst.createdAt)}</span>
                            </div>
                            {inst.instagram && (
                              <div className={styles.showcaseStatItem} style={{ color: 'var(--gold)', fontSize: '0.8rem' }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                                </svg>
                                <span>{inst.instagram.startsWith('@') ? inst.instagram : `@${inst.instagram}`}</span>
                              </div>
                            )}
                          </div>

                          <div style={{ fontSize: '0.82rem', color: '#55493e', marginTop: '4px' }}>
                            <strong style={{ color: 'var(--cocoa-deep)' }}>Specialties:</strong> {inst.specialities && inst.specialities.length > 0 ? inst.specialities.join(', ') : 'Pilates, Core Strength, Flexibility'}
                          </div>
                        </div>
                      </div>

                      <div className={styles.showcaseListActions}>
                        <button 
                          type="button"
                          className={styles.btnViewProfile}
                          style={{ width: 'auto', padding: '8px 14px' }}
                          onClick={() => setViewingProfileInst(inst)}
                        >
                          <span>VIEW PROFILE</span>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                          </svg>
                        </button>
                        <button 
                          type="button"
                          className={styles.btnEditProfile}
                          onClick={() => editInstructor(inst)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
                          </svg>
                          <span>EDIT</span>
                        </button>
                        <button 
                          type="button"
                          className={styles.btnDeleteProfile}
                          onClick={() => handleInstDelete(inst._id)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" />
                          </svg>
                          <span>DELETE</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {filteredInstructors.length > 0 && (
                <div className={styles.paginationRow}>
                  <button type="button" className={styles.pageNavBtn} disabled title="Previous Page">&lsaquo;</button>
                  <div className={styles.pageNumberActive}>1</div>
                  <button type="button" className={styles.pageNavBtn} disabled title="Next Page">&rsaquo;</button>
                </div>
              )}
            </>
          )}

          {/* ── CREATE / EDIT INSTRUCTOR FORM ── */}
          {view === 'form' && (
            <div className={styles.card}>
              <div className={styles.formHeader}>
                <button className={styles.backBtn} onClick={() => { setView('list'); setInstructorForm(defaultInstForm); setEditingInstId(null); }}>
                  &larr; Back to Instructors
                </button>
                <h2 className={styles.cardTitle} style={{marginBottom: 0}}>{editingInstId ? 'Edit Instructor Profile' : 'New Movement Instructor'}</h2>
              </div>
              <form onSubmit={handleInstSubmit} className={styles.form}>
                <div className={styles.row}>
                  <div className={styles.field}>
                    <label>First Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Jane"
                      value={instructorForm.firstName} 
                      onChange={e => setInstructorForm({...instructorForm, firstName: e.target.value})} 
                      required 
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Last Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Doe"
                      value={instructorForm.lastName} 
                      onChange={e => setInstructorForm({...instructorForm, lastName: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div className={styles.row}>
                  <div className={styles.field}>
                    <label>Professional Role / Headline *</label>
                    <input 
                      type="text" 
                      placeholder="e.g. EXPERT PILATES INSTRUCTOR or PERSONAL FITNESS TRAINER"
                      value={instructorForm.roleTitle} 
                      onChange={e => setInstructorForm({...instructorForm, roleTitle: e.target.value})} 
                      required
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Instagram Handle</label>
                    <input 
                      type="text" 
                      placeholder="e.g. @janedoe_movement"
                      value={instructorForm.instagram} 
                      onChange={e => setInstructorForm({...instructorForm, instagram: e.target.value})} 
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Specialities (comma separated)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Pilates, Core Strength, Flexibility, Breathwork"
                    value={instructorForm.specialities} 
                    onChange={e => setInstructorForm({...instructorForm, specialities: e.target.value})} 
                  />
                </div>

                <div className={styles.field}>
                  <label>Certifications & Credentials (comma separated)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. RYT-500, Stott Certified Instructor, Sound Meditation Master"
                    value={instructorForm.certifications} 
                    onChange={e => setInstructorForm({...instructorForm, certifications: e.target.value})} 
                  />
                </div>
                
                <div className={styles.field}>
                  <label>Biography / Teaching Philosophy</label>
                  <textarea 
                    rows="4" 
                    placeholder="Describe their background, movement style, energy, and what members can expect from their classes..."
                    value={instructorForm.bio} 
                    onChange={e => setInstructorForm({...instructorForm, bio: e.target.value})} 
                  />
                </div>

                {/* IMAGE UPLOAD */}
                <div className={styles.field} style={{ borderTop: '1px solid rgba(227, 211, 184, 0.5)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                  <label>Instructor Portrait Photo (Cover)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    {(instructorForm.photo || instructorForm.existingPhoto) && (
                      <img 
                        src={instructorForm.photo ? URL.createObjectURL(instructorForm.photo) : instructorForm.existingPhoto} 
                        alt="Preview" 
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '12px', border: '2px solid var(--gold)', boxShadow: '0 3px 10px rgba(200, 155, 74, 0.25)' }} 
                      />
                    )}
                    <input type="file" accept="image/*" onChange={e => {
                      if (e.target.files[0]) setInstructorForm({...instructorForm, photo: e.target.files[0]});
                    }} />
                  </div>
                </div>

                <div className={styles.checkboxField} style={{marginTop: '0.75rem'}}>
                  <input type="checkbox" id="instActive" checked={instructorForm.isActive} onChange={e => setInstructorForm({...instructorForm, isActive: e.target.checked})} />
                  <label htmlFor="instActive" style={{ fontWeight: 600, color: 'var(--cocoa-deep)' }}>Active Instructor (Visible on Timetable and Website)</label>
                </div>

                <div className={styles.actions}>
                  <button type="submit" className={styles.btn}>{editingInstId ? 'Update Instructor Profile' : 'Save Instructor'}</button>
                  <button type="button" onClick={() => { setView('list'); setInstructorForm(defaultInstForm); setEditingInstId(null); }} className={styles.btnGhost}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* ── VIEW PROFILE MODAL ── */}
          {viewingProfileInst && (
            <div 
              style={{
                position: 'fixed', inset: 0, background: 'rgba(42, 29, 20, 0.65)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
              }}
              onClick={() => setViewingProfileInst(null)}
            >
              <div 
                style={{
                  background: '#FFFFFF', borderRadius: '16px', maxWidth: '580px', width: '100%',
                  overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.25)', border: '1px solid rgba(227, 211, 184, 0.8)'
                }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ height: '220px', position: 'relative', background: '#FAF6EF' }}>
                  {viewingProfileInst.photo ? (
                    <img src={viewingProfileInst.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="5" r="2.5" /><path d="m4 17 4-5 3 2 4-7 4 3" /><path d="M9 19v-5" />
                      </svg>
                    </div>
                  )}
                  <button 
                    onClick={() => setViewingProfileInst(null)}
                    style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div style={{ padding: '1.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                    <div>
                      <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.6rem', margin: 0, color: 'var(--cocoa-deep)' }}>
                        {viewingProfileInst.firstName} {viewingProfileInst.lastName}
                      </h2>
                      <p style={{ color: '#A0522D', fontWeight: 500, fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '4px 0 0 0' }}>
                        {viewingProfileInst.roleTitle || 'Movement Instructor'}
                      </p>
                    </div>
                    <span className={viewingProfileInst.isActive ? styles.badge : styles.badge} style={viewingProfileInst.isActive ? { background: 'rgba(65,79,54,0.1)', color: 'var(--forest)' } : { background: 'rgba(164,69,31,0.1)', color: 'var(--rust)' }}>
                      {viewingProfileInst.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <div className={styles.showcaseStatsRow} style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(227,211,184,0.5)' }}>
                    <div className={styles.showcaseStatItem}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#C89B4A" stroke="#C89B4A" strokeWidth="1">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <strong>{viewingProfileInst.rating || 4.9}</strong> ({viewingProfileInst.reviewCount || 48} reviews)
                    </div>
                    <div className={styles.showcaseStatItem}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A4E44" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      </svg>
                      <strong>{viewingProfileInst.classesCount || 0}</strong> Classes Conducted
                    </div>
                    <div className={styles.showcaseStatItem}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A4E44" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" x2="6" /><line x1="8" x2="8" y1="2" x2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                      </svg>
                      Joined {formatJoinedDate(viewingProfileInst.joinedDate || viewingProfileInst.createdAt)}
                    </div>
                  </div>

                  {viewingProfileInst.specialities && viewingProfileInst.specialities.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                        Specialties
                      </label>
                      <div className={styles.specialtyPills}>
                        {viewingProfileInst.specialities.map((s, i) => (
                          <span key={i} className={styles.specialtyPill}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingProfileInst.certifications && viewingProfileInst.certifications.length > 0 && (
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                        Certifications
                      </label>
                      <p style={{ fontSize: '0.85rem', color: '#55493e', margin: 0 }}>
                        {viewingProfileInst.certifications.join(' • ')}
                      </p>
                    </div>
                  )}

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--taupe)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Teaching Philosophy & Bio
                    </label>
                    <p style={{ fontSize: '0.88rem', color: '#4a3e35', lineHeight: 1.6, margin: 0 }}>
                      {viewingProfileInst.bio || 'No biography added yet.'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid rgba(227,211,184,0.5)' }}>
                    <button 
                      className={styles.btnOutline} 
                      onClick={() => { const inst = viewingProfileInst; setViewingProfileInst(null); editInstructor(inst); }}
                    >
                      Edit Profile
                    </button>
                    <button className={styles.btnGhost} onClick={() => setViewingProfileInst(null)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
