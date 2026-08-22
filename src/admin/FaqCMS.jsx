import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import styles from './CMS.module.css';

export default function FaqCMS() {
  const { authFetch } = useAuth();
  const { confirmAction } = useModal();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ question: '', answer: '', category: 'General', isActive: true, sortOrder: 0 });
  const [editingId, setEditingId] = useState(null);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'draft'
  const [categoryFilter, setCategoryFilter] = useState('all');

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
        toast.success(editingId ? 'FAQ updated successfully.' : 'FAQ created successfully.');
        setFormData({ question: '', answer: '', category: 'General', isActive: true, sortOrder: 0 });
        setEditingId(null);
        setView('list');
        loadItems();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to save FAQ.');
      }
    } catch (err) { 
      console.error(err);
      toast.error('Error saving FAQ.');
    }
  }

  function handleDelete(id) {
    confirmAction('Delete FAQ', 'Are you sure you want to delete this FAQ?', async () => {
      try {
        const res = await authFetch(`/api/cms/faqs/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('FAQ deleted.');
          loadItems();
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || 'Failed to delete FAQ.');
        }
      } catch (err) { 
        console.error(err);
        toast.error('Failed to delete FAQ.');
      }
    });
  }

  function editItem(item) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingId(item._id);
    setFormData({ question: item.question, answer: item.answer, category: item.category || 'General', isActive: item.isActive, sortOrder: item.sortOrder || 0 });
    setView('form');
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && item.isActive) || 
                         (statusFilter === 'draft' && !item.isActive);
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>Frequently Asked Questions</h1>
      
      {view === 'list' && (
        <>
          <div className={styles.actionBar}>
            <div className={styles.filterGroup}>
              <input type="text" placeholder="Search FAQs..." className={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Drafts</option>
              </select>
              <select className={styles.filterSelect} value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="General">General</option>
                <option value="Booking">Booking</option>
                <option value="Classes">Classes</option>
                <option value="Café">Café</option>
                <option value="Venue Hire">Venue Hire</option>
              </select>
            </div>
            <button className={styles.btn} onClick={() => { setEditingId(null); setFormData({ question: '', answer: '', category: 'General', isActive: true, sortOrder: 0 }); setView('form'); }}>
              + Create New
            </button>
          </div>

          <div className={styles.list}>
            {filteredItems.map(item => (
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
            {filteredItems.length === 0 && <p className={styles.empty}>No FAQs found matching your filters.</p>}
          </div>
        </>
      )}

      {view === 'form' && (
        <>
          <div style={{ marginBottom: '1.5rem' }}>
            <button className={styles.btnGhost} onClick={() => setView('list')}>&larr; Back to List</button>
          </div>
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
                <button type="button" onClick={() => { setEditingId(null); setFormData({question:'', answer:'', category:'General', isActive:true, sortOrder:0}); setView('list'); }} className={styles.btnGhost}>Cancel</button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
