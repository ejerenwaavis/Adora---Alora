import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './CMS.module.css';

export default function SettingsCMS() {
  const { authFetch } = useAuth();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ key: '', value: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await authFetch('/api/cms/settings');
      if (res.ok) setSettings(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const url = editingId ? `/api/cms/settings/${editingId}` : '/api/cms/settings';
      const res = await authFetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, value: isNaN(formData.value) ? formData.value : Number(formData.value) })
      });
      if (res.ok) {
        setFormData({ key: '', value: '', description: '' });
        setEditingId(null);
        setView('list');
        loadData();
      }
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete setting?')) return;
    try {
      const res = await authFetch(`/api/cms/settings/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) { console.error(err); }
  }

  function handleEdit(setting) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingId(setting._id);
    setFormData({ 
      key: setting.key, 
      value: setting.value, 
      description: setting.description || ''
    });
    setView('form');
  }

  const filteredSettings = settings.filter(setting => {
    const searchString = `${setting.key} ${setting.description || ''}`.toLowerCase();
    return searchString.includes(searchQuery.toLowerCase());
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>Global Settings</h1>

      {view === 'list' && (
        <>
          <div className={styles.actionBar}>
            <div className={styles.filterGroup}>
              <input type="text" placeholder="Search settings..." className={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <button className={styles.btn} onClick={() => { setEditingId(null); setFormData({ key: '', value: '', description: '' }); setView('form'); }}>
              + Create Setting
            </button>
          </div>

          <div className={styles.list}>
            {filteredSettings.map(setting => (
              <div key={setting._id} className={styles.listItem}>
                <div className={styles.itemContent}>
                  <strong>{setting.key}</strong>: {setting.value}
                  <div className={styles.meta}>{setting.description}</div>
                </div>
                <div className={styles.itemActions}>
                  <button onClick={() => handleEdit(setting)} className={styles.btnOutline}>Edit</button>
                  <button onClick={() => handleDelete(setting._id)} className={styles.btnDanger}>Delete</button>
                </div>
              </div>
            ))}
            {filteredSettings.length === 0 && <p className={styles.empty}>No settings found matching your search.</p>}
          </div>
        </>
      )}

      {view === 'form' && (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <button className={styles.btnGhost} onClick={() => setView('list')}>&larr; Back to List</button>
          </div>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{editingId ? 'Edit Setting' : 'New Setting'}</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Key *</label>
                  <input type="text" value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})} placeholder="e.g. cancellation_window_hours" required />
                </div>
                <div className={styles.field}>
                  <label>Value *</label>
                  <input type="text" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} required />
                </div>
              </div>
              <div className={styles.field}>
                <label>Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>{editingId ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => { setEditingId(null); setFormData({key: '', value: '', description: ''}); setView('list'); }} className={styles.btnGhost}>Cancel</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
