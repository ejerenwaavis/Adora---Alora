import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './CMS.module.css';

export default function FashionCMS() {
  const { authFetch } = useAuth();
  const [layers, setLayers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [layerForm, setLayerForm] = useState({ name: '', slug: '', description: '', sortOrder: 0, isActive: true });
  const [itemForm, setItemForm] = useState({ 
    name: '', slug: '', description: '', layer: '', priceKobo: 0, 
    sizes: '', colors: '', isFeatured: false, isActive: true, sortOrder: 0 
  });
  
  const [editingLayerId, setEditingLayerId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [activeTab, setActiveTab] = useState('items');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [layersRes, itemsRes] = await Promise.all([
        authFetch('/api/cms/fashion-layers'),
        authFetch('/api/cms/fashion-items')
      ]);
      if (layersRes.ok) setLayers(await layersRes.json());
      if (itemsRes.ok) setItems(await itemsRes.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  // Layers
  async function handleLayerSubmit(e) {
    e.preventDefault();
    try {
      const url = editingLayerId ? `/api/cms/fashion-layers/${editingLayerId}` : '/api/cms/fashion-layers';
      const method = editingLayerId ? 'PATCH' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(layerForm)
      });
      if (res.ok) {
        setLayerForm({ name: '', slug: '', description: '', sortOrder: 0, isActive: true });
        setEditingLayerId(null);
        loadData();
      }
    } catch (err) { console.error(err); }
  }

  async function handleLayerDelete(id) {
    if (!window.confirm('Delete layer AND all its items?')) return;
    try {
      const res = await authFetch(`/api/cms/fashion-layers/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) { console.error(err); }
  }

  function editLayer(layer) {
    setEditingLayerId(layer._id);
    setLayerForm({ name: layer.name, slug: layer.slug, description: layer.description || '', sortOrder: layer.sortOrder, isActive: layer.isActive });
    setActiveTab('layers');
  }

  // Items
  async function handleItemSubmit(e) {
    e.preventDefault();
    try {
      const url = editingItemId ? `/api/cms/fashion-items/${editingItemId}` : '/api/cms/fashion-items';
      const method = editingItemId ? 'PATCH' : 'POST';
      const payload = {
        ...itemForm,
        sizes: typeof itemForm.sizes === 'string' ? itemForm.sizes.split(',').map(s=>s.trim()).filter(Boolean) : itemForm.sizes,
        colors: typeof itemForm.colors === 'string' ? itemForm.colors.split(',').map(s=>s.trim()).filter(Boolean) : itemForm.colors
      };
      
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setItemForm({ name: '', slug: '', description: '', layer: '', priceKobo: 0, sizes: '', colors: '', isFeatured: false, isActive: true, sortOrder: 0 });
        setEditingItemId(null);
        loadData();
      }
    } catch (err) { console.error(err); }
  }

  async function handleItemDelete(id) {
    if (!window.confirm('Delete this fashion item?')) return;
    try {
      const res = await authFetch(`/api/cms/fashion-items/${id}`, { method: 'DELETE' });
      if (res.ok) loadData();
    } catch (err) { console.error(err); }
  }

  function editItem(item) {
    setEditingItemId(item._id);
    setItemForm({ 
      name: item.name, slug: item.slug, description: item.description || '', 
      layer: item.layer?._id || '', priceKobo: item.priceKobo, 
      sizes: item.sizes?.join(', ') || '', colors: item.colors?.join(', ') || '',
      isFeatured: item.isFeatured, isActive: item.isActive, sortOrder: item.sortOrder 
    });
    setActiveTab('items');
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>Fashion</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className={activeTab === 'items' ? styles.btn : styles.btnOutline} onClick={() => setActiveTab('items')}>Fashion Items</button>
        <button className={activeTab === 'layers' ? styles.btn : styles.btnOutline} onClick={() => setActiveTab('layers')}>Layers (Categories)</button>
      </div>

      {activeTab === 'layers' && (
        <>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{editingLayerId ? 'Edit Layer' : 'New Layer'}</h2>
            <form onSubmit={handleLayerSubmit} className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Name *</label>
                  <input type="text" value={layerForm.name} onChange={e => setLayerForm({...layerForm, name: e.target.value})} required />
                </div>
                <div className={styles.field}>
                  <label>Slug (URL) *</label>
                  <input type="text" value={layerForm.slug} onChange={e => setLayerForm({...layerForm, slug: e.target.value})} required />
                </div>
              </div>
              <div className={styles.field}>
                <label>Description</label>
                <input type="text" value={layerForm.description} onChange={e => setLayerForm({...layerForm, description: e.target.value})} />
              </div>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>Sort Order</label>
                  <input type="number" value={layerForm.sortOrder} onChange={e => setLayerForm({...layerForm, sortOrder: Number(e.target.value)})} />
                </div>
                <div className={styles.checkboxField} style={{marginTop: '2rem'}}>
                  <input type="checkbox" id="layerActive" checked={layerForm.isActive} onChange={e => setLayerForm({...layerForm, isActive: e.target.checked})} />
                  <label htmlFor="layerActive">Active</label>
                </div>
              </div>
              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>{editingLayerId ? 'Update Layer' : 'Create Layer'}</button>
                {editingLayerId && <button type="button" onClick={() => { setEditingLayerId(null); setLayerForm({name:'', slug:'', description:'', sortOrder:0, isActive:true}); }} className={styles.btnGhost}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className={styles.list}>
            {layers.map(layer => (
              <div key={layer._id} className={`${styles.listItem} ${!layer.isActive ? styles.inactive : ''}`}>
                <div className={styles.itemContent}>
                  <strong>{layer.name}</strong> <span className={styles.meta}>(Order: {layer.sortOrder})</span>
                </div>
                <div className={styles.itemActions}>
                  <button onClick={() => editLayer(layer)} className={styles.btnOutline}>Edit</button>
                  <button onClick={() => handleLayerDelete(layer._id)} className={styles.btnDanger}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'items' && (
        <>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{editingItemId ? 'Edit Fashion Item' : 'New Fashion Item'}</h2>
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
                  <label>Layer *</label>
                  <select value={itemForm.layer} onChange={e => setItemForm({...itemForm, layer: e.target.value})} required>
                    <option value="">-- Select --</option>
                    {layers.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
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
                  <label>Sizes (comma separated)</label>
                  <input type="text" value={itemForm.sizes} onChange={e => setItemForm({...itemForm, sizes: e.target.value})} placeholder="e.g. S, M, L, XL" />
                </div>
                <div className={styles.field}>
                  <label>Colors (comma separated)</label>
                  <input type="text" value={itemForm.colors} onChange={e => setItemForm({...itemForm, colors: e.target.value})} placeholder="e.g. Taupe, Black, Gold" />
                </div>
              </div>
              
              <div className={styles.field}>
                <label>Sort Order</label>
                <input type="number" value={itemForm.sortOrder} onChange={e => setItemForm({...itemForm, sortOrder: Number(e.target.value)})} />
              </div>

              <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                <div className={styles.checkboxField}>
                  <input type="checkbox" id="itemActive" checked={itemForm.isActive} onChange={e => setItemForm({...itemForm, isActive: e.target.checked})} />
                  <label htmlFor="itemActive">Active</label>
                </div>
                <div className={styles.checkboxField}>
                  <input type="checkbox" id="itemFeatured" checked={itemForm.isFeatured} onChange={e => setItemForm({...itemForm, isFeatured: e.target.checked})} />
                  <label htmlFor="itemFeatured">Featured</label>
                </div>
              </div>

              <div className={styles.actions}>
                <button type="submit" className={styles.btn}>{editingItemId ? 'Update Item' : 'Create Item'}</button>
                {editingItemId && <button type="button" onClick={() => { setEditingItemId(null); setItemForm({name:'', slug:'', description:'', layer:'', priceKobo:0, sizes:'', colors:'', isFeatured:false, isActive:true, sortOrder:0}); }} className={styles.btnGhost}>Cancel</button>}
              </div>
            </form>
          </div>

          <div className={styles.list}>
            {items.map(item => (
              <div key={item._id} className={`${styles.listItem} ${!item.isActive ? styles.inactive : ''}`}>
                <div className={styles.itemContent}>
                  <strong>{item.name}</strong> 
                  <span className={styles.meta} style={{marginLeft: '0.5rem'}}>
                    {item.layer?.name} • ₦{(item.priceKobo / 100).toFixed(2)}
                  </span>
                  {item.isFeatured && <span className={styles.badge} style={{marginLeft: '0.5rem'}}>Featured</span>}
                </div>
                <div className={styles.itemActions}>
                  <button onClick={() => editItem(item)} className={styles.btnOutline}>Edit</button>
                  <button onClick={() => handleItemDelete(item._id)} className={styles.btnDanger}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
