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
  const defaultForm = { name: '', credits: 1, price: '', expiresInDays: 30, isActive: true, badge: '', description: '' };
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
      price: pack.priceKobo !== undefined ? Math.round(pack.priceKobo / 100) : '', 
      expiresInDays: pack.expiresInDays, 
      isActive: pack.isActive,
      badge: pack.badge || '',
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
      <div className="eyebrow">Commerce &amp; Studio Passes</div>
      <h1 className={styles.title}>Credit Packs &amp; Pricing</h1>

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
            {filteredPacks.map(pack => {
              const priceNaira = Math.round((pack.priceKobo || 0) / 100);
              const perClassNaira = Math.round(priceNaira / (pack.credits || 1));
              return (
                <div key={pack._id} className={`${styles.listItem} ${!pack.isActive ? styles.inactive : ''}`}>
                  <div className={styles.itemContent}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>{pack.name}</strong>
                      {pack.badge && (
                        <span style={{ fontSize: '10px', background: 'rgba(200, 155, 74, 0.2)', color: 'var(--gold)', padding: '2px 7px', borderRadius: '10px', fontWeight: 600, textTransform: 'uppercase' }}>
                          {pack.badge}
                        </span>
                      )}
                    </div>
                    <span className={styles.meta}>
                      {pack.credits} Credit{pack.credits === 1 ? '' : 's'} · ₦{priceNaira.toLocaleString()} ({pack.credits > 1 ? `₦${perClassNaira.toLocaleString()}/class · ` : ''}valid {pack.expiresInDays} days)
                    </span>
                  </div>
                  <div className={styles.itemActions}>
                    <button onClick={() => handleEdit(pack)} className={styles.btnOutline}>Edit</button>
                    <button onClick={() => handleDelete(pack._id)} className={styles.btnDanger}>Delete</button>
                  </div>
                </div>
              );
            })}
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
                  <label>Pack Name *</label>
                  <input type="text" placeholder="e.g. 5-Class Movement Pack" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className={styles.field}>
                  <label>Number of Credits *</label>
                  <input type="number" min="1" placeholder="e.g. 5" value={formData.credits} onChange={e => setFormData({...formData, credits: Number(e.target.value)})} required />
                </div>
              </div>
              
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Price (in Naira ₦) *</label>
                  <input 
                    type="number" 
                    step="100" 
                    min="0" 
                    placeholder="e.g. 50000" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: e.target.value})} 
                    required 
                  />
                  <small style={{ color: 'var(--taupe)', marginTop: '4px', display: 'block', fontSize: '11px' }}>
                    Enter in whole Naira (e.g. 12000 for ₦12,000 or 50000 for ₦50,000).
                  </small>
                </div>
                <div className={styles.field}>
                  <label>Expires In (Days) *</label>
                  <input type="number" min="1" placeholder="e.g. 30, 45, 90" value={formData.expiresInDays} onChange={e => setFormData({...formData, expiresInDays: Number(e.target.value)})} required />
                </div>
              </div>

              <div className={styles.field}>
                <label>Marketing Badge / Decoy Tag (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Most Popular, Best Value, Introductory" 
                  value={formData.badge} 
                  onChange={e => setFormData({...formData, badge: e.target.value})} 
                />
              </div>

              <div className={styles.field}>
                <label>Description &amp; Studio Perks (Optional)</label>
                <textarea rows="2" placeholder="e.g. Access to all Reformer, Mat, and Sound Bath sessions." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className={styles.checkboxField} style={{marginTop: '1rem'}}>
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                <label htmlFor="isActive">Active for Member Purchases</label>
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>{editingId ? 'Update Pack' : 'Create Pack'}</button>
                <button type="button" onClick={() => { setEditingId(null); setFormData(defaultForm); setView('list'); }} className={styles.btnGhost}>Cancel</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
