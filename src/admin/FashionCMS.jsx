import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import styles from './CMS.module.css';

export default function FashionCMS() {
  const { authFetch } = useAuth();
  const { confirmAction, showAlert } = useModal();
  const [layers, setLayers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forms
  const [layerForm, setLayerForm] = useState({ name: '', slug: '', description: '', sortOrder: 0, isActive: true });
  
  const defaultItemForm = { 
    name: '', slug: '', description: '', layer: '', displayPriceKobo: 0, 
    sizes: '', colors: '', isFeatured: false, isActive: true, sortOrder: 0,
    galleryItems: []
  };
  const [itemForm, setItemForm] = useState(defaultItemForm);
  
  const [editingLayerId, setEditingLayerId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [activeTab, setActiveTab] = useState('items');
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

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
    setIsSubmitting(true);
    try {
      const url = editingLayerId ? `/api/cms/fashion-layers/${editingLayerId}` : '/api/cms/fashion-layers';
      const method = editingLayerId ? 'PATCH' : 'POST';
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(layerForm) // stringify sets content type in authFetch
      });
      if (res.ok) {
        setLayerForm({ name: '', slug: '', description: '', sortOrder: 0, isActive: true });
        setEditingLayerId(null);
        setView('list');
        loadData();
      } else {
        const errorData = await res.json();
        showAlert('Error', errorData.error);
      }
    } catch (err) { console.error(err); }
    setIsSubmitting(false);
  }

  function handleLayerDelete(id) {
    confirmAction('Delete Layer', 'Are you sure you want to delete this layer AND all its items?', async () => {
      try {
        const res = await authFetch(`/api/cms/fashion-layers/${id}`, { method: 'DELETE' });
        if (res.ok) loadData();
      } catch (err) { console.error(err); }
    });
  }

  function editLayer(layer) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingLayerId(layer._id);
    setLayerForm({ name: layer.name, slug: layer.slug, description: layer.description || '', sortOrder: layer.sortOrder, isActive: layer.isActive });
    setActiveTab('layers');
    setView('form');
  }

  const filteredLayers = layers.filter(layer => {
    const matchesSearch = layer.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && layer.isActive) || 
                         (statusFilter === 'inactive' && !layer.isActive);
    return matchesSearch && matchesStatus;
  });

  // Items
  async function handleItemSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url = editingItemId ? `/api/cms/fashion-items/${editingItemId}` : '/api/cms/fashion-items';
      const method = editingItemId ? 'PATCH' : 'POST';
      
      const formData = new FormData();
      formData.append('name', itemForm.name);
      formData.append('slug', itemForm.slug);
      formData.append('description', itemForm.description);
      formData.append('layer', itemForm.layer);
      formData.append('displayPriceKobo', itemForm.displayPriceKobo);
      formData.append('sizes', itemForm.sizes);
      formData.append('colors', itemForm.colors);
      formData.append('isFeatured', itemForm.isFeatured);
      formData.append('isActive', itemForm.isActive);
      formData.append('sortOrder', itemForm.sortOrder);

      // Append images
      const mediaOrder = [];
      itemForm.galleryItems.forEach((item) => {
        if (item.type === 'existing') {
          formData.append('existingImages', item.url);
          mediaOrder.push('existing');
        } else {
          formData.append('images', item.file);
          mediaOrder.push('new');
        }
      });
      formData.append('mediaOrder', JSON.stringify(mediaOrder));
      
      const res = await authFetch(url, {
        method,
        body: formData // No content-type header, authFetch handles it
      });
      if (res.ok) {
        setItemForm(defaultItemForm);
        setEditingItemId(null);
        setView('list');
        loadData();
      } else {
        const errorData = await res.json();
        showAlert('Error', errorData.error);
      }
    } catch (err) { console.error(err); }
    setIsSubmitting(false);
  }

  function handleItemDelete(id) {
    confirmAction('Delete Fashion Item', 'Are you sure you want to delete this fashion item?', async () => {
      try {
        const res = await authFetch(`/api/cms/fashion-items/${id}`, { method: 'DELETE' });
        if (res.ok) loadData();
      } catch (err) { console.error(err); }
    });
  }

  function editItem(item) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingItemId(item._id);
    setItemForm({ 
      name: item.name, slug: item.slug, description: item.description || '', 
      layer: item.layer?._id || '', displayPriceKobo: item.displayPriceKobo || 0, 
      sizes: item.sizes?.join(', ') || '', colors: item.colors?.join(', ') || '',
      isFeatured: item.isFeatured, isActive: item.isActive, sortOrder: item.sortOrder,
      galleryItems: item.images ? item.images.map(url => ({ type: 'existing', url })) : []
    });
    setActiveTab('items');
    setView('form');
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.layer?.name && item.layer.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && item.isActive) || 
                         (statusFilter === 'inactive' && !item.isActive);
    return matchesSearch && matchesStatus;
  });

  const handleDragStart = (e, position) => {
    dragItem.current = position;
  };

  const handleDragEnter = (e, position) => {
    dragOverItem.current = position;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const newList = [...itemForm.galleryItems];
      const draggedItemContent = newList[dragItem.current];
      newList.splice(dragItem.current, 1);
      newList.splice(dragOverItem.current, 0, draggedItemContent);
      dragItem.current = null;
      dragOverItem.current = null;
      setItemForm({ ...itemForm, galleryItems: newList });
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>Fashion</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className={activeTab === 'items' ? styles.btn : styles.btnOutline} onClick={() => { setActiveTab('items'); setView('list'); setSearchQuery(''); }}>Fashion Items</button>
        <button className={activeTab === 'layers' ? styles.btn : styles.btnOutline} onClick={() => { setActiveTab('layers'); setView('list'); setSearchQuery(''); }}>Layers (Categories)</button>
      </div>

      {activeTab === 'layers' && (
        <>
          {view === 'list' && (
            <>
              <div className={styles.actionBar}>
                <div className={styles.filterGroup}>
                  <input type="text" placeholder="Search layers..." className={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <button className={styles.btn} onClick={() => { setEditingLayerId(null); setLayerForm({name:'', slug:'', description:'', sortOrder:0, isActive:true}); setView('form'); }}>
                  + Create Layer
                </button>
              </div>

              <div className={styles.list}>
                {filteredLayers.map(layer => (
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
                {filteredLayers.length === 0 && <p className={styles.empty}>No layers found matching your filters.</p>}
              </div>
            </>
          )}

          {view === 'form' && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <button className={styles.btnGhost} onClick={() => setView('list')}>&larr; Back to List</button>
              </div>
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
                    <button type="submit" disabled={isSubmitting} className={styles.btn}>
                      {isSubmitting ? 'Saving...' : (editingLayerId ? 'Update Layer' : 'Create Layer')}
                    </button>
                    <button type="button" disabled={isSubmitting} onClick={() => { setEditingLayerId(null); setLayerForm({name:'', slug:'', description:'', sortOrder:0, isActive:true}); setView('list'); }} className={styles.btnGhost}>Cancel</button>
                  </div>
                </form>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'items' && (
        <>
          {view === 'list' && (
            <>
              <div className={styles.actionBar}>
                <div className={styles.filterGroup}>
                  <input type="text" placeholder="Search fashion items..." className={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <button className={styles.btn} onClick={() => { setEditingItemId(null); setItemForm(defaultItemForm); setView('form'); }}>
                  + Create Fashion Item
                </button>
              </div>

              <div className={styles.list}>
                {filteredItems.map(item => (
                  <div key={item._id} className={`${styles.listItem} ${!item.isActive ? styles.inactive : ''}`}>
                    <div className={styles.itemContent} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {item.images && item.images.length > 0 && (
                         <img src={item.images[0]} alt="" style={{width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px'}} />
                      )}
                      <div>
                        <strong>{item.name}</strong> 
                        <span className={styles.meta} style={{marginLeft: '0.5rem'}}>
                          {item.layer?.name} • ₦{((item.displayPriceKobo || 0) / 100).toFixed(2)}
                        </span>
                        {item.isFeatured && <span className={styles.badge} style={{marginLeft: '0.5rem'}}>Featured</span>}
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      <button onClick={() => editItem(item)} className={styles.btnOutline}>Edit</button>
                      <button onClick={() => handleItemDelete(item._id)} className={styles.btnDanger}>Delete</button>
                    </div>
                  </div>
                ))}
                {filteredItems.length === 0 && <p className={styles.empty}>No fashion items found matching your filters.</p>}
              </div>
            </>
          )}

          {view === 'form' && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <button className={styles.btnGhost} onClick={() => setView('list')}>&larr; Back to List</button>
              </div>
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
                      <input type="number" value={itemForm.displayPriceKobo} onChange={e => setItemForm({...itemForm, displayPriceKobo: Number(e.target.value)})} required />
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

                  {/* IMAGES */}
                  <div className={styles.field} style={{ borderTop: '1px solid #eaeaea', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                    <label>Images</label>
                    <p style={{fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem'}}>
                      The first image in the list will be used as the featured/cover image.
                    </p>
                    <input type="file" multiple accept="image/*" onChange={e => {
                      const files = Array.from(e.target.files);
                      const newItems = files.map(file => ({ type: 'new', file, url: URL.createObjectURL(file) }));
                      setItemForm({...itemForm, galleryItems: [...itemForm.galleryItems, ...newItems]});
                    }} />
                    
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                      {itemForm.galleryItems.map((item, i) => (
                        <div 
                          key={i} 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, i)}
                          onDragEnter={(e) => handleDragEnter(e, i)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => e.preventDefault()}
                          style={{ 
                            position: 'relative', width: '100px', height: '100px', cursor: 'grab',
                            border: i === 0 ? '2px solid var(--gold)' : '1px solid #ccc',
                            opacity: item.type === 'new' ? 0.8 : 1 
                          }}
                        >
                          <img src={item.url} alt="" style={{width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none'}} />
                          {i === 0 && <span style={{position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,0.6)', color:'white', fontSize:'0.7rem', textAlign:'center', pointerEvents: 'none'}}>COVER</span>}
                          
                          <button type="button" onClick={() => {
                            const newItems = [...itemForm.galleryItems];
                            newItems.splice(i, 1);
                            setItemForm({...itemForm, galleryItems: newItems});
                          }} style={{position: 'absolute', top: 0, right: 0, background: 'red', color: 'white', border: 'none', cursor: 'pointer', padding: '2px 6px', fontSize: '0.8rem'}}>X</button>
                        </div>
                      ))}
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
                      <label htmlFor="itemFeatured">Featured Item</label>
                    </div>
                  </div>

                  <div className={styles.actions}>
                    <button type="submit" disabled={isSubmitting} className={styles.btn}>
                      {isSubmitting ? 'Saving...' : (editingItemId ? 'Update Item' : 'Create Item')}
                    </button>
                    <button type="button" disabled={isSubmitting} onClick={() => { setEditingItemId(null); setItemForm(defaultItemForm); setView('list'); }} className={styles.btnGhost}>Cancel</button>
                  </div>
                </form>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
