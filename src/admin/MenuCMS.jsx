import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import styles from './CMS.module.css';

const COMMON_DIETARY_TAGS = [
  'Vegan',
  'Vegetarian',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Sugar-Free',
  'Keto',
  'Organic',
  'Plant-Based'
];

export default function MenuCMS() {
  const { authFetch } = useAuth();
  const { confirmAction } = useModal();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Forms
  const defaultCatForm = { name: '', slug: '', description: '', sortOrder: 0, isActive: true };
  const defaultItemForm = { 
    name: '', slug: '', description: '', category: '', price: '', 
    dietaryTags: '', isFeatured: false, isAvailable: true, sortOrder: 0,
    image: null, existingImage: ''
  };

  const [catForm, setCatForm] = useState(defaultCatForm);
  const [itemForm, setItemForm] = useState(defaultItemForm);
  
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  
  const activeTab = searchParams.get('tab') === 'categories' ? 'categories' : 'items';
  const setActiveTab = (tab) => {
    setSearchParams(tab === 'categories' ? { tab: 'categories' } : {});
    setView('list');
    setEditingCatId(null);
    setEditingItemId(null);
  };
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'inactive'

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [catsRes, itemsRes] = await Promise.all([
        authFetch('/api/cms/menu-categories'),
        authFetch('/api/cms/menu-items')
      ]);
      if (catsRes.ok) setCategories(await catsRes.json());
      if (itemsRes.ok) setItems(await itemsRes.json());
    } catch (err) { 
      console.error(err);
      toast.error('Failed to load menu data.');
    }
    setLoading(false);
  }

  const toggleDietaryTag = (tag) => {
    const currentTags = itemForm.dietaryTags
      ? itemForm.dietaryTags.split(',').map(t => t.trim()).filter(Boolean)
      : [];
    const tagLower = tag.toLowerCase();
    const exists = currentTags.some(t => t.toLowerCase() === tagLower);
    
    let nextTags;
    if (exists) {
      nextTags = currentTags.filter(t => t.toLowerCase() !== tagLower);
    } else {
      nextTags = [...currentTags, tag];
    }
    setItemForm({ ...itemForm, dietaryTags: nextTags.join(', ') });
  };

  // Categories
  async function handleCatSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingCatId ? `/api/cms/menu-categories/${editingCatId}` : '/api/cms/menu-categories';
      const method = editingCatId ? 'PATCH' : 'POST';
      const res = await authFetch(url, {
        method,
        body: JSON.stringify(catForm)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to save menu category.');
        setSaving(false);
        return;
      }
      toast.success(editingCatId ? 'Menu category updated successfully.' : 'Menu category created successfully.');
      setCatForm(defaultCatForm);
      setEditingCatId(null);
      setView('list');
      loadData();
    } catch (err) { 
      console.error(err); 
      toast.error(err.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  }

  function handleCatDelete(id) {
    confirmAction('Delete Category', 'Are you sure you want to delete this category AND all its items?', async () => {
      try {
        const res = await authFetch(`/api/cms/menu-categories/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Category and items deleted successfully.');
          loadData();
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || 'Failed to delete category.');
        }
      } catch (err) { 
        console.error(err);
        toast.error('Failed to delete category.');
      }
    });
  }

  function editCat(cat) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingCatId(cat._id);
    setCatForm({ name: cat.name, slug: cat.slug, description: cat.description || '', sortOrder: cat.sortOrder, isActive: cat.isActive });
    setView('form');
  }

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && cat.isActive) || 
                         (statusFilter === 'inactive' && !cat.isActive);
    return matchesSearch && matchesStatus;
  });

  // Items
  async function handleItemSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editingItemId ? `/api/cms/menu-items/${editingItemId}` : '/api/cms/menu-items';
      const method = editingItemId ? 'PATCH' : 'POST';
      
      const formData = new FormData();
      formData.append('name', itemForm.name);
      formData.append('slug', itemForm.slug || itemForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      formData.append('description', itemForm.description || '');
      formData.append('category', itemForm.category);
      formData.append('priceKobo', Math.round(parseFloat(itemForm.price || 0) * 100));
      formData.append('dietaryTags', itemForm.dietaryTags);
      formData.append('isFeatured', itemForm.isFeatured);
      formData.append('isAvailable', itemForm.isAvailable);
      formData.append('sortOrder', itemForm.sortOrder || 0);
      if (itemForm.image) formData.append('image', itemForm.image);

      const res = await authFetch(url, {
        method,
        body: formData
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || 'Failed to save menu item. Please check the fields.');
        setSaving(false);
        return;
      }

      toast.success(editingItemId ? 'Menu item updated successfully.' : 'Menu item created successfully.');
      setItemForm(defaultItemForm);
      setEditingItemId(null);
      setView('list');
      loadData();
    } catch (err) { 
      console.error(err);
      toast.error(err.message || 'An error occurred while saving the menu item.');
    } finally {
      setSaving(false);
    }
  }

  function handleItemDelete(id) {
    confirmAction('Delete Menu Item', 'Are you sure you want to delete this menu item?', async () => {
      try {
        const res = await authFetch(`/api/cms/menu-items/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('Menu item deleted successfully.');
          loadData();
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || 'Failed to delete menu item.');
        }
      } catch (err) { 
        console.error(err);
        toast.error('Failed to delete menu item.');
      }
    });
  }

  function editItem(item) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setEditingItemId(item._id);
    setItemForm({ 
      name: item.name, slug: item.slug, description: item.description || '', 
      category: item.category?._id || '', 
      price: item.priceKobo !== undefined ? (item.priceKobo / 100) : '', 
      dietaryTags: item.dietaryTags?.join(', ') || '', 
      isFeatured: item.isFeatured, isAvailable: item.isAvailable, sortOrder: item.sortOrder,
      image: null, existingImage: item.image || ''
    });
    setView('form');
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.category?.name && item.category.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && item.isAvailable) || 
                         (statusFilter === 'inactive' && !item.isAvailable);
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="eyebrow">CMS</div>
      <h1 className={styles.title}>{activeTab === 'categories' ? 'Menu Categories' : 'Café Menu Items'}</h1>

      {activeTab === 'categories' && (
        <>
          {view === 'list' && (
            <>
              <div className={styles.actionBar}>
                <div className={styles.filterGroup}>
                  <input type="text" placeholder="Search categories..." className={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <button className={styles.btn} onClick={() => { setEditingCatId(null); setCatForm(defaultCatForm); setView('form'); }}>
                  + Create Category
                </button>
              </div>

              <div className={styles.list}>
                {filteredCategories.map(cat => (
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
                {filteredCategories.length === 0 && <p className={styles.empty}>No categories found matching your filters.</p>}
              </div>
            </>
          )}

          {view === 'form' && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <button className={styles.btnGhost} onClick={() => setView('list')}>&larr; Back to List</button>
              </div>
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
                    <button type="submit" className={styles.btn} disabled={saving}>
                      {saving ? 'Saving...' : (editingCatId ? 'Update Category' : 'Create Category')}
                    </button>
                    <button type="button" onClick={() => { setEditingCatId(null); setCatForm(defaultCatForm); setView('list'); }} className={styles.btnGhost}>Cancel</button>
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
                  <input type="text" placeholder="Search menu items..." className={styles.searchInput} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  <select className={styles.filterSelect} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Statuses</option>
                    <option value="active">Available</option>
                    <option value="inactive">Unavailable</option>
                  </select>
                </div>
                <button className={styles.btn} onClick={() => { setEditingItemId(null); setItemForm(defaultItemForm); setView('form'); }}>
                  + Create Item
                </button>
              </div>

              <div className={styles.list}>
                {filteredItems.map(item => (
                  <div key={item._id} className={`${styles.listItem} ${!item.isAvailable ? styles.inactive : ''}`}>
                    <div className={styles.cardMain}>
                      {item.image ? (
                        <img src={item.image} alt={item.name} className={styles.cardThumb} />
                      ) : (
                        <div className={styles.cardThumbPlaceholder}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 8h1a4 4 0 1 1 0 8h-1" /><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" /><line x1="6" x2="6" y1="2" y2="4" /><line x1="10" x2="10" y1="2" y2="4" /><line x1="14" x2="14" y1="2" y2="4" />
                          </svg>
                        </div>
                      )}
                      <div className={styles.itemContent}>
                        <div className={styles.itemTitle}>
                          <span>{item.name}</span>
                          {item.isFeatured && <span className={styles.badge}>Featured</span>}
                          {!item.isAvailable && <span className={styles.badge} style={{ color: 'var(--rust)', background: 'rgba(164, 69, 31, 0.1)' }}>Unavailable</span>}
                        </div>
                        <div className={styles.meta}>
                          {item.category?.name && <span>{item.category.name}</span>}
                          <span>•</span>
                          <span className={styles.itemPrice}>₦{(item.priceKobo / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          {item.dietaryTags && item.dietaryTags.length > 0 && (
                            <>
                              <span>•</span>
                              <span style={{ fontSize: '0.78rem', color: 'var(--forest)', background: 'rgba(65, 79, 54, 0.08)', padding: '1px 6px', borderRadius: '3px' }}>
                                {item.dietaryTags.join(', ')}
                              </span>
                            </>
                          )}
                        </div>
                        {item.description && <p className={styles.itemDesc}>{item.description}</p>}
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      <button onClick={() => editItem(item)} className={styles.btnOutline}>Edit</button>
                      <button onClick={() => handleItemDelete(item._id)} className={styles.btnDanger}>Delete</button>
                    </div>
                  </div>
                ))}
                {filteredItems.length === 0 && <p className={styles.empty}>No menu items found matching your filters.</p>}
              </div>
            </>
          )}

          {view === 'form' && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <button className={styles.btnGhost} onClick={() => setView('list')}>&larr; Back to List</button>
              </div>
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
                      <label>Price (₦) *</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        placeholder="e.g. 2500 or 50.00" 
                        value={itemForm.price} 
                        onChange={e => setItemForm({...itemForm, price: e.target.value})} 
                        required 
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label>Description</label>
                    <textarea rows="3" value={itemForm.description} onChange={e => setItemForm({...itemForm, description: e.target.value})} />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field} style={{ flex: 2 }}>
                      <label>Dietary Tags (comma separated or click pills)</label>
                      <input 
                        type="text" 
                        value={itemForm.dietaryTags} 
                        onChange={e => setItemForm({...itemForm, dietaryTags: e.target.value})} 
                        placeholder="e.g. Dairy-Free, Gluten-Free, Vegan" 
                      />
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {COMMON_DIETARY_TAGS.map(tag => {
                          const currentTags = itemForm.dietaryTags
                            ? itemForm.dietaryTags.split(',').map(t => t.trim().toLowerCase())
                            : [];
                          const isSelected = currentTags.includes(tag.toLowerCase());
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleDietaryTag(tag)}
                              style={{
                                fontSize: '0.72rem',
                                padding: '3px 9px',
                                borderRadius: '12px',
                                border: isSelected ? '1px solid var(--forest)' : '1px solid var(--line)',
                                background: isSelected ? 'var(--forest)' : '#FDFBF7',
                                color: isSelected ? '#FFFFFF' : 'var(--cocoa)',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                fontWeight: isSelected ? 600 : 400
                              }}
                            >
                              {isSelected ? '✓ ' : '+ '} {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className={styles.field} style={{ flex: 1 }}>
                      <label>Sort Order</label>
                      <input type="number" value={itemForm.sortOrder} onChange={e => setItemForm({...itemForm, sortOrder: Number(e.target.value)})} />
                    </div>
                  </div>

                  {/* IMAGE UPLOAD */}
                  <div className={styles.field} style={{ borderTop: '1px solid #eaeaea', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                    <label>Menu Item Photo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {(itemForm.image || itemForm.existingImage) && (
                        <img 
                          src={itemForm.image ? URL.createObjectURL(itemForm.image) : itemForm.existingImage} 
                          alt="Preview" 
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} 
                        />
                      )}
                      <input type="file" accept="image/*" onChange={e => {
                        if (e.target.files[0]) setItemForm({...itemForm, image: e.target.files[0]});
                      }} />
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
                    <button type="submit" className={styles.btn} disabled={saving}>
                      {saving ? 'Saving...' : (editingItemId ? 'Update Item' : 'Create Item')}
                    </button>
                    <button type="button" onClick={() => { setEditingItemId(null); setItemForm(defaultItemForm); setView('list'); }} className={styles.btnGhost}>Cancel</button>
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
