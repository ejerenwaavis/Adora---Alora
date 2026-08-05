import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import styles from './CMS.module.css';

export default function CreditPacksCMS() {
  const { authFetch } = useAuth();
  const { confirmAction } = useModal();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', credits: 1, priceKobo: 0, expiresInDays: 30, isActive: true, description: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { loadPacks(); }, []);

  async function loadPacks() {
    try {
      const res = await authFetch('/api/cms/credit-packs');
      if (res.ok) setPacks(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const url = editingId ? `/api/cms/credit-packs/${editingId}` : '/api/cms/credit-packs';
      const res = await authFetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ name: '', credits: 1, priceKobo: 0, expiresInDays: 30, isActive: true, description: '' });
        setEditingId(null);
        loadPacks();
      }
    } catch (err) { console.error(err); }
  }

  function handleDelete(id) {
    confirmAction('Delete Credit Pack', 'Are you sure you want to delete this credit pack?', async () => {
      try {
        const res = await authFetch(`/api/cms/credit-packs/${id}`, { method: 'DELETE' });
        if (res.ok) loadPacks();
      } catch (err) { console.error(err); }
    });
  }

  function handleEdit(pack) {
    setEditingId(pack._id);
    setFormData({ 
      name: pack.name, 
      credits: pack.credits, 
      priceKobo: pack.priceKobo, 
      expiresInDays: pack.expiresInDays, 
      isActive: pack.isActive,
      description: pack.description || ''
    });
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>Credit Packs</h1>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>{editingId ? 'Edit Credit Pack' : 'New Credit Pack'}</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Name *</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className={styles.field}>
              <label>Credits *</label>
              <input type="number" min="1" value={formData.credits} onChange={e => setFormData({...formData, credits: Number(e.target.value)})} required />
            </div>
          </div>
          
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Price (Naira) *</label>
              <input type="number" value={formData.priceKobo / 100} onChange={e => setFormData({...formData, priceKobo: Number(e.target.value) * 100})} required />
            </div>
            <div className={styles.field}>
              <label>Expires In (Days) *</label>
              <input type="number" min="1" value={formData.expiresInDays} onChange={e => setFormData({...formData, expiresInDays: Number(e.target.value)})} required />
            </div>
          </div>

          <div className={styles.field}>
            <label>Description</label>
            <textarea rows="2" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className={styles.checkboxField} style={{marginTop: '1rem'}}>
            <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
            <label htmlFor="isActive">Active</label>
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.btn}>{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData({name: '', credits: 1, priceKobo: 0, expiresInDays: 30, isActive: true, description: ''}); }} className={styles.btnGhost}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className={styles.list}>
        {packs.map(pack => (
          <div key={pack._id} className={`${styles.listItem} ${!pack.isActive ? styles.inactive : ''}`}>
            <div className={styles.itemContent}>
              <strong>{pack.name}</strong> <span className={styles.meta}>({pack.credits} credits, ₦{pack.priceKobo / 100}) - Expires in {pack.expiresInDays} days</span>
            </div>
            <div className={styles.itemActions}>
              <button onClick={() => handleEdit(pack)} className={styles.btnOutline}>Edit</button>
              <button onClick={() => handleDelete(pack._id)} className={styles.btnDanger}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
