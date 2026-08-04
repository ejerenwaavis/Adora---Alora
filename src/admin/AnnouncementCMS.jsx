import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './CMS.module.css'; // We will create this shared css module next

export default function AnnouncementCMS() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ message: '', linkText: '', linkUrl: '', isActive: true });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    try {
      const res = await authFetch('/api/cms/announcements');
      if (res.ok) setItems(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const url = editingId ? `/api/cms/announcements/${editingId}` : '/api/cms/announcements';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ message: '', linkText: '', linkUrl: '', isActive: true });
        setEditingId(null);
        loadItems();
      }
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      const res = await authFetch(`/api/cms/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) loadItems();
    } catch (err) { console.error(err); }
  }

  function editItem(item) {
    setEditingId(item._id);
    setFormData({ message: item.message, linkText: item.linkText || '', linkUrl: item.linkUrl || '', isActive: item.isActive });
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>Announcement Bar</h1>
      
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>{editingId ? 'Edit Announcement' : 'New Announcement'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Message *</label>
            <input type="text" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} required />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Link Text</label>
              <input type="text" value={formData.linkText} onChange={e => setFormData({...formData, linkText: e.target.value})} placeholder="e.g. Read more" />
            </div>
            <div className={styles.field}>
              <label>Link URL</label>
              <input type="text" value={formData.linkUrl} onChange={e => setFormData({...formData, linkUrl: e.target.value})} placeholder="e.g. /events" />
            </div>
          </div>
          <div className={styles.checkboxField}>
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
            <label htmlFor="isActive">Active (Visible on site)</label>
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.btn}>{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({message:'', linkText:'', linkUrl:'', isActive:true}); }} className={styles.btnGhost}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className={styles.list}>
        {items.map(item => (
          <div key={item._id} className={`${styles.listItem} ${!item.isActive ? styles.inactive : ''}`}>
            <div className={styles.itemContent}>
              <strong>{item.message}</strong>
              {item.linkText && <span className={styles.meta}>Link: {item.linkText} → {item.linkUrl}</span>}
            </div>
            <div className={styles.itemActions}>
              <span className={styles.badge}>{item.isActive ? 'Active' : 'Draft'}</span>
              <button onClick={() => editItem(item)} className={styles.btnOutline}>Edit</button>
              <button onClick={() => handleDelete(item._id)} className={styles.btnDanger}>Delete</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className={styles.empty}>No announcements created yet.</p>}
      </div>
    </div>
  );
}
