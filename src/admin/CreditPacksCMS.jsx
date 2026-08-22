import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import styles from './CMS.module.css';

export default function CreditPacksCMS() {
  const { authFetch } = useAuth();
  const { confirmAction } = useModal();
  const { toast } = useToast();
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const defaultForm = { name: '', credits: 1, price: '', expiresInDays: 30, isActive: true, description: '' };
  const [formData, setFormData] = useState(defaultForm);
  const [editingId, setEditingId] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

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
      const payload = {
        ...formData,
        priceKobo: Math.round(parseFloat(formData.price || 0) * 100)
      };
      const res = await authFetch(url, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(editingId ? 'Credit pack updated successfully.' : 'Credit pack created successfully.');
        setFormData(defaultForm);
        setEditingId(null);
        setView('list');
        loadPacks();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to save credit pack.');
      }
    } catch (err) { 
      console.error(err);
      toast.error('Error saving credit pack.');
    }
  }

  function handleDelete(id) {
    confirmAction('Delete Credit Pack', 'Are you sure you want to delete this credit pack?', async () => {
      try {
        const res = await authFetch(`/api/cms/credit-packs/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Credit pack deleted.');
          loadPacks();
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || 'Failed to delete credit pack.');
        }
      } catch (err) { 
        console.error(err);
        toast.error('Failed to delete credit pack.');
      }
    });
  }

  function handleEdit(pack) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingId(pack._id);
    setFormData({ 
      name: pack.name, 
      credits: pack.credits, 
      price: pack.priceKobo !== undefined ? (pack.priceKobo / 100) : '', 
      expiresInDays: pack.expiresInDays, 
      isActive: pack.isActive,
      description: pack.description || ''
    });
    setView('form');
  }

  const filteredPacks = packs.filter(pack => {
    const matchesSearch = pack.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && pack.isActive) || 
                         (statusFilter === 'inactive' && !pack.isActive);
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>Credit Packs</h1>

      {view === 'list' && (
        <>
          <div className={styles.actionBar}>
            <div className={styles.filterGroup}>
              <input type="text" placeholder="Search packs..." className={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button className={styles.btn} onClick={() => { setEditingId(null); setFormData(defaultForm); setView('form'); }}>
              + Create New Pack
            </button>
          </div>

          <div className={styles.list}>
            {filteredPacks.map(pack => (
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
            {filteredPacks.length === 0 && <p className={styles.empty}>No credit packs found matching your filters.</p>}
          </div>
        </>
      )}

      {view === 'form' && (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <button className={styles.btnGhost} onClick={() => setView('list')}>&larr; Back to List</button>
          </div>
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
                  <label>Price (₦) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    placeholder="e.g. 5000 or 5000.50" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    required 
                  />
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
                <button type="button" onClick={() => { setEditingId(null); setFormData(defaultForm); setView('list'); }} className={styles.btnGhost}>Cancel</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
