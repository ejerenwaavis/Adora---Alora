import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './CMS.module.css';

export default function FaqCMS() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ question: '', answer: '', category: 'General', isActive: true, sortOrder: 0 });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { loadItems(); }, []);

  async function loadItems() {
    try {
      const res = await authFetch('/api/cms/faqs');
      if (res.ok) setItems(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const url = editingId ? `/api/cms/faqs/${editingId}` : '/api/cms/faqs';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ question: '', answer: '', category: 'General', isActive: true, sortOrder: 0 });
        setEditingId(null);
        loadItems();
      }
    } catch (err) { console.error(err); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this FAQ?')) return;
    try {
      const res = await authFetch(`/api/cms/faqs/${id}`, { method: 'DELETE' });
      if (res.ok) loadItems();
    } catch (err) { console.error(err); }
  }

  function editItem(item) {
    setEditingId(item._id);
    setFormData({ question: item.question, answer: item.answer, category: item.category || 'General', isActive: item.isActive, sortOrder: item.sortOrder || 0 });
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>Frequently Asked Questions</h1>
      
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>{editingId ? 'Edit FAQ' : 'New FAQ'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Question *</label>
            <input type="text" value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} required />
          </div>
          <div className={styles.field}>
            <label>Answer *</label>
            <textarea value={formData.answer} onChange={e => setFormData({...formData, answer: e.target.value})} required />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="General">General</option>
                <option value="Booking">Booking</option>
                <option value="Classes">Classes</option>
                <option value="Café">Café</option>
                <option value="Venue Hire">Venue Hire</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>Sort Order</label>
              <input type="number" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: Number(e.target.value)})} />
            </div>
          </div>
          <div className={styles.checkboxField}>
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
            <label htmlFor="isActive">Active (Visible on site)</label>
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.btn}>{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({question:'', answer:'', category:'General', isActive:true, sortOrder:0}); }} className={styles.btnGhost}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className={styles.list}>
        {items.map(item => (
          <div key={item._id} className={`${styles.listItem} ${!item.isActive ? styles.inactive : ''}`}>
            <div className={styles.itemContent}>
              <strong>{item.question}</strong>
              <span className={styles.meta}>Category: {item.category} | Order: {item.sortOrder}</span>
              <p style={{marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--taupe)'}}>{item.answer}</p>
            </div>
            <div className={styles.itemActions}>
              <span className={styles.badge}>{item.isActive ? 'Active' : 'Draft'}</span>
              <button onClick={() => editItem(item)} className={styles.btnOutline}>Edit</button>
              <button onClick={() => handleDelete(item._id)} className={styles.btnDanger}>Delete</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className={styles.empty}>No FAQs created yet.</p>}
      </div>
    </div>
  );
}
