import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './CMS.module.css';

export default function MenuCMS() {
  const { authFetch } = useAuth();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '', sortOrder: 0, isActive: true });
  const [itemForm, setItemForm] = useState({ 
    name: '', slug: '', description: '', category: '', priceKobo: 0, 
    dietaryTags: '', isFeatured: false, isAvailable: true, sortOrder: 0 
  });
  
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [activeTab, setActiveTab] = useState('items'); // 'categories' or 'items'

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [catsRes, itemsRes] = await Promise.all([
        authFetch('/api/cms/menu-categories'),
        authFetch('/api/cms/menu-items')
      ]);
      if (catsRes.ok) setCategories(await catsRes.json());
      if (itemsRes.ok) setItems(await itemsRes.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  // Categories
  async function handleCatSubmit(e) {
    e.preventDefault();
    try {
      const url = editingCatId ? `/api/cms/menu-categories/${editingCatId}` : '/api/cms/menu-categories';
      const method = editingCatId ? 'PATCH' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catForm)
      });
      if (res.ok) {
        setCatForm({ name: '', slug: '', description: '', sortOrder: 0, isActive: true });
        setEditingCatId(null);
        loadData();
      }
    } catch (err) { console.error(err); }
  }

  async function handleCatDelete(id) {
    if (!window.confirm('Delete category AND all its items?')) return;
    try {
      const res = await authFetch(`/api/cms/menu-categories/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) { console.error(err); }
  }

  function editCat(cat) {
    setEditingCatId(cat._id);
    setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || '', sortOrder: cat.sortOrder, isActive: cat.isActive });
    setActiveTab('categories');
  }

  // Items
  async function handleItemSubmit(e) {
    e.preventDefault();
    try {
      const url = editingItemId ? `/api/cms/menu-items/${editingItemId}` : '/api/cms/menu-items';
      const method = editingItemId ? 'PATCH' : 'POST';
      const payload = {
        ...itemForm,
        dietaryTags: typeof itemForm.dietaryTags === 'string' 
          ? itemForm.dietaryTags.split(',').map(s=>s.trim()).filter(Boolean) 
          : itemForm.dietaryTags
      };
      
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setItemForm({ name: '', slug: '', description: '', category: '', priceKobo: 0, dietaryTags: '', isFeatured: false, isAvailable: true, sortOrder: 0 });
        setEditingItemId(null);
        loadData();
      }
    } catch (err) { console.error(err); }
  }

  async function handleItemDelete(id) {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      const res = await authFetch(`/api/cms/menu-items/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) { console.error(err); }
  }

  function editItem(item) {
    setEditingItemId(item._id);
    setItemForm({ 
      name: item.name, slug: item.slug, description: item.description || '', 
      category: item.category?._id || '', priceKobo: item.priceKobo, 
      dietaryTags: item.dietaryTags?.join(', ') || '', 
      isFeatured: item.isFeatured, isAvailable: item.isAvailable, sortOrder: item.sortOrder 
    });
    setActiveTab('items');
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>Café Menu</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className={activeTab === 'items' ? styles.btn : styles.btnOutline} onClick={() => setActiveTab('items')}>Menu Items</button>
        <button className={activeTab === 'categories' ? styles.btn : styles.btnOutline} onClick={() => setActiveTab('categories')}>Categories</button>
      </div>

      {activeTab === 'categories' && (
        <>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{editingCatId ? 'Edit Category' : 'New Category'}</h2>
            <form onSubmit={handleCatSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Name *</label>
                  <input type="text" value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} required />
                </div>
                <div className={styles.field}>
                  <label>Slug (URL) *</label>
                  <input type="text" value={catForm.slug} onChange={e => setCatForm({...catForm, slug: e.target.value})} required placeholder="e.g. signature-drinks" />
                </div>
              </div>
              <div className={styles.field}>
                <label>Description</label>
                <input type="text" value={catForm.description} onChange={e => setCatForm({...catForm, description: e.target.value})} />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Sort Order</label>
                  <input type="number" value={catForm.sortOrder} onChange={e => setCatForm({...catForm, sortOrder: Number(e.target.value)})} />
                </div>
                <div className={styles.checkboxField} style={{marginTop: '2rem'}}>
                  <input type="checkbox" id="catActive" checked={catForm.isActive} onChange={e => setCatForm({...catForm, isActive: e.target.checked})} />
                  <label htmlFor="catActive">Active</label>
                </div>
              </div>
              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>{editingCatId ? 'Update Category' : 'Create Category'}</button>
                {editingCatId && <button type="button" onClick={() => { setEditingCatId(null); setCatForm({name:'', slug:'', description:'', sortOrder:0, isActive:true}); }} className={styles.btnGhost}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className={styles.list}>
            {categories.map(cat => (
              <div key={cat._id} className={`${styles.listItem} ${!cat.isActive ? styles.inactive : ''}`}>
                <div className={styles.itemContent}>
                  <strong>{cat.name}</strong> <span className={styles.meta}>(Order: {cat.sortOrder})</span>
                  {cat.description && <p style={{margin: '0.25rem 0', fontSize: '0.875rem', color: 'var(--taupe)'}}>{cat.description}</p>}
                </div>
                <div className={styles.itemActions}>
                  <button onClick={() => editCat(cat)} className={styles.btnOutline}>Edit</button>
                  <button onClick={() => handleCatDelete(cat._id)} className={styles.btnDanger}>Delete</button>
                </div>
              </div>
            ))}
            {categories.length === 0 && <p className={styles.empty}>No categories found.</p>}
          </div>
        </>
      )}

      {activeTab === 'items' && (
        <>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{editingItemId ? 'Edit Menu Item' : 'New Menu Item'}</h2>
            <form onSubmit={handleItemSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Name *</label>
                  <input type="text" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} required />
                </div>
                <div className={styles.field}>
                  <label>Slug *</label>
                  <input type="text" value={itemForm.slug} onChange={e => setItemForm({...itemForm, slug: e.target.value})} required />
                </div>
              </div>
              
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Category *</label>
                  <select value={itemForm.category} onChange={e => setItemForm({...itemForm, category: e.target.value})} required>
                    <option value="">-- Select --</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Price (in Kobo / Cents) *</label>
                  <input type="number" value={itemForm.priceKobo} onChange={e => setItemForm({...itemForm, priceKobo: Number(e.target.value)})} required />
                </div>
              </div>

              <div className={styles.field}>
                <label>Description</label>
                <textarea rows="3" value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Dietary Tags (comma separated)</label>
                  <input type="text" value={itemForm.dietaryTags} onChange={e => setItemForm({...itemForm, dietaryTags: e.target.value})} placeholder="e.g. GF, Vegan, Nut-free" />
                </div>
                <div className={styles.field}>
                  <label>Sort Order</label>
                  <input type="number" value={itemForm.sortOrder} onChange={e => setItemForm({...itemForm, sortOrder: Number(e.target.value)})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                <div className={styles.checkboxField}>
                  <input type="checkbox" id="itemAvailable" checked={itemForm.isAvailable} onChange={e => setItemForm({...itemForm, isAvailable: e.target.checked})} />
                  <label htmlFor="itemAvailable">Available</label>
                </div>
                <div className={styles.checkboxField}>
                  <input type="checkbox" id="itemFeatured" checked={itemForm.isFeatured} onChange={e => setItemForm({...itemForm, isFeatured: e.target.checked})} />
                  <label htmlFor="itemFeatured">Featured</label>
                </div>
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>{editingItemId ? 'Update Item' : 'Create Item'}</button>
                {editingItemId && <button type="button" onClick={() => { setEditingItemId(null); setItemForm({name:'', slug:'', description:'', category:'', priceKobo:0, dietaryTags:'', isFeatured:false, isAvailable:true, sortOrder:0}); }} className={styles.btnGhost}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className={styles.list}>
            {items.map(item => (
              <div key={item._id} className={`${styles.listItem} ${!item.isAvailable ? styles.inactive : ''}`}>
                <div className={styles.itemContent}>
                  <strong>{item.name}</strong> 
                  <span className={styles.meta} style={{marginLeft: '0.5rem'}}>
                    {item.category?.name} • ₦{(item.priceKobo / 100).toFixed(2)}
                  </span>
                  {item.isFeatured && <span className={styles.badge} style={{marginLeft: '0.5rem'}}>Featured</span>}
                </div>
                <div className={styles.itemActions}>
                  <button onClick={() => editItem(item)} className={styles.btnOutline}>Edit</button>
                  <button onClick={() => handleItemDelete(item._id)} className={styles.btnDanger}>Delete</button>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className={styles.empty}>No menu items found.</p>}
          </div>
        </>
      )}
    </div>
  );
}
