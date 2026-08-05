import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './CMS.module.css';

export default function SettingsCMS() {
  const { authFetch } = useAuth();
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ key: '', value: '', description: '' });
  const [editingId, setEditingId] = useState(null);

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
    setEditingId(setting._id);
    setFormData({ 
      key: setting.key, 
      value: setting.value, 
      description: setting.description || ''
    });
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>Global Settings</h1>

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
            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({key: '', value: '', description: ''}); }} className={styles.btnGhost}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className={styles.list}>
        {settings.map(setting => (
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
      </div>
    </div>
  );
}
