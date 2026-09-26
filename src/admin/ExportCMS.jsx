import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';
import Icon from '../components/ui/Icon.jsx';

export default function ExportCMS() {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const showToast = (msg, isErr = false) => (isErr ? toast.error(msg) : toast.success(msg));

  const [activeTab, setActiveTab] = useState('cafe'); // 'cafe' | 'fashion'
  const [loading, setLoading] = useState(true);

  // Data states
  const [menuItems, setMenuItems] = useState([]);
  const [menuCategories, setMenuCategories] = useState([]);
  const [fashionItems, setFashionItems] = useState([]);
  const [fashionLayers, setFashionLayers] = useState([]);

  // Selection states
  const [selectedCafeIds, setSelectedCafeIds] = useState(new Set());
  const [selectedFashionIds, setSelectedFashionIds] = useState(new Set());

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [menuRes, catRes, fashionRes, layerRes] = await Promise.all([
        authFetch('/api/cms/menu-items'),
        authFetch('/api/cms/menu-categories'),
        authFetch('/api/cms/fashion-items'),
        authFetch('/api/cms/fashion-layers')
      ]);

      const [menuData, catData, fashionData, layerData] = await Promise.all([
        menuRes.ok ? menuRes.json() : [],
        catRes.ok ? catRes.json() : [],
        fashionRes.ok ? fashionRes.json() : [],
        layerRes.ok ? layerRes.json() : []
      ]);

      setMenuItems(Array.isArray(menuData) ? menuData : []);
      setMenuCategories(Array.isArray(catData) ? catData : []);
      setFashionItems(Array.isArray(fashionData) ? fashionData : []);
      setFashionLayers(Array.isArray(layerData) ? layerData : []);

      // Default select all
      setSelectedCafeIds(new Set((Array.isArray(menuData) ? menuData : []).map(i => i._id)));
      setSelectedFashionIds(new Set((Array.isArray(fashionData) ? fashionData : []).map(i => i._id)));
    } catch (err) {
      console.error('Failed to load inventory data for export:', err);
      showToast('Failed to load inventory data', true);
    } finally {
      setLoading(false);
    }
  };

  // Filtered lists
  const filteredCafeItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.slug && item.slug.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategoryFilter === 'all' || 
        (item.category && (item.category._id === selectedCategoryFilter || item.category === selectedCategoryFilter));

      return matchesSearch && matchesCat;
    });
  }, [menuItems, searchQuery, selectedCategoryFilter]);

  const filteredFashionItems = useMemo(() => {
    return fashionItems.filter(item => {
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.slug && item.slug.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLayer = selectedCategoryFilter === 'all' || 
        (item.layer && (item.layer._id === selectedCategoryFilter || item.layer === selectedCategoryFilter));

      return matchesSearch && matchesLayer;
    });
  }, [fashionItems, searchQuery, selectedCategoryFilter]);

  // Selection handlers
  const currentSelectedSet = activeTab === 'cafe' ? selectedCafeIds : selectedFashionIds;
  const setCurrentSelectedSet = activeTab === 'cafe' ? setSelectedCafeIds : setSelectedFashionIds;
  const currentFilteredItems = activeTab === 'cafe' ? filteredCafeItems : filteredFashionItems;

  const toggleSelectOne = (id) => {
    const next = new Set(currentSelectedSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setCurrentSelectedSet(next);
  };

  const toggleSelectAll = () => {
    const allFilteredIds = currentFilteredItems.map(i => i._id);
    const allSelected = allFilteredIds.every(id => currentSelectedSet.has(id));

    const next = new Set(currentSelectedSet);
    if (allSelected) {
      allFilteredIds.forEach(id => next.delete(id));
    } else {
      allFilteredIds.forEach(id => next.add(id));
    }
    setCurrentSelectedSet(next);
  };

  const isAllSelected = currentFilteredItems.length > 0 && currentFilteredItems.every(i => currentSelectedSet.has(i._id));

  // CSV Export Logic
  const handleExportCSV = () => {
    const selectedItems = currentFilteredItems.filter(item => currentSelectedSet.has(item._id));
    if (selectedItems.length === 0) {
      showToast('Please select at least one item to export.', true);
      return;
    }

    if (activeTab === 'cafe') {
      const headers = [
        'ID',
        'Name',
        'Slug',
        'Category',
        'Price (NGN)',
        'Price (Kobo)',
        'Glovo / 3rd Party Price (15% Markup NGN)',
        'Available',
        'Dietary Tags',
        'Allergens',
        'Badge',
        'Description',
        'Image URL'
      ];

      const rows = selectedItems.map(item => {
        const kobo = Number(item.priceKobo) || 0;
        const naira = (kobo / 100).toFixed(2);
        const glovoMarkupNaira = (Math.round(kobo * 1.15) / 100).toFixed(2);
        const categoryName = item.category?.name || 'Uncategorized';
        const dietary = (item.dietaryTags || []).join('; ');
        const allergens = (item.allergens || []).join('; ');

        return [
          `"${item._id}"`,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${(item.slug || '').replace(/"/g, '""')}"`,
          `"${categoryName.replace(/"/g, '""')}"`,
          naira,
          kobo,
          glovoMarkupNaira,
          item.isAvailable !== false ? 'YES' : 'NO',
          `"${dietary.replace(/"/g, '""')}"`,
          `"${allergens.replace(/"/g, '""')}"`,
          `"${(item.badge || '').replace(/"/g, '""')}"`,
          `"${(item.description || '').replace(/"/g, '""')}"`,
          `"${(item.image || '').replace(/"/g, '""')}"`
        ];
      });

      downloadCSV(
        `aora_house_cafe_products_${new Date().toISOString().split('T')[0]}.csv`,
        [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      );
    } else {
      const headers = [
        'ID',
        'Name',
        'Slug',
        'Fashion Layer',
        'Brand / Designer',
        'Seller Name',
        'Display Price (NGN)',
        'Display Price (Kobo)',
        'Third-Party Price (15% Markup NGN)',
        'Available In Store',
        'Availability Note',
        'Sizes',
        'Colors',
        'Collection',
        'Raire URL',
        'Description'
      ];

      const rows = selectedItems.map(item => {
        const kobo = Number(item.displayPriceKobo) || 0;
        const naira = (kobo / 100).toFixed(2);
        const markupNaira = (Math.round(kobo * 1.15) / 100).toFixed(2);
        const layerName = item.layer?.name || 'Standard';
        const sizes = (item.sizes || []).join('; ');
        const colors = (item.colors || []).join('; ');

        return [
          `"${item._id}"`,
          `"${(item.name || '').replace(/"/g, '""')}"`,
          `"${(item.slug || '').replace(/"/g, '""')}"`,
          `"${layerName.replace(/"/g, '""')}"`,
          `"${(item.brand || '').replace(/"/g, '""')}"`,
          `"${(item.sellerName || '').replace(/"/g, '""')}"`,
          naira,
          kobo,
          markupNaira,
          item.isAvailableInStore !== false ? 'YES' : 'NO',
          `"${(item.availabilityNote || '').replace(/"/g, '""')}"`,
          `"${sizes.replace(/"/g, '""')}"`,
          `"${colors.replace(/"/g, '""')}"`,
          `"${(item.collectionName || '').replace(/"/g, '""')}"`,
          `"${(item.raireListingUrl || '').replace(/"/g, '""')}"`,
          `"${(item.description || '').replace(/"/g, '""')}"`
        ];
      });

      downloadCSV(
        `aora_house_fashion_inventory_${new Date().toISOString().split('T')[0]}.csv`,
        [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      );
    }

    showToast(`Exported ${selectedItems.length} items to CSV successfully.`);
  };

  const downloadCSV = (filename, content) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ color: 'var(--rust)', letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Commerce &amp; Inventory Sync
          </div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '2.25rem', color: 'var(--cocoa-deep)', margin: 0 }}>
            Export Product Data
          </h1>
          <p style={{ color: 'var(--taupe)', marginTop: '0.35rem', fontSize: '0.95rem' }}>
            Select inventory items to export for third-party platforms (Glovo, Chowdeck, Raire, wholesale partners) with unified price calculations.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={loading || currentFilteredItems.filter(i => currentSelectedSet.has(i._id)).length === 0}
          style={{
            background: 'var(--cocoa-deep)',
            color: '#FCF8F0',
            border: 'none',
            padding: '11px 22px',
            borderRadius: '6px',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Icon name="site-content" size={16} />
          Export Selected ({currentFilteredItems.filter(i => currentSelectedSet.has(i._id)).length}) to CSV
        </button>
      </div>

      {/* Pricing Conversion Notice Banner */}
      <div style={{
        background: '#FAF5EC',
        border: '1px solid #E8DEC8',
        borderRadius: '8px',
        padding: '14px 18px',
        marginBottom: '1.75rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px'
      }}>
        <div style={{ color: 'var(--rust)', fontSize: '18px', lineHeight: 1 }}>ℹ</div>
        <div style={{ fontSize: '0.85rem', color: '#5A4636', lineHeight: 1.55 }}>
          <strong>Currency Precision Guard:</strong> All prices are stored natively in <strong>Kobo integers</strong> (smallest unit) in MongoDB.
          Exported spreadsheets automatically compute both exact <strong>Naira (₦)</strong> amounts (<code>Kobo ÷ 100</code>) and third-party delivery markups (e.g. <code>Glovo +15%</code>) so external partner sync has zero pricing discrepancy.
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: '1.5rem', gap: '0.5rem', background: '#FCF8F0', padding: '0 0.5rem', borderRadius: '6px 6px 0 0' }}>
        <button
          type="button"
          onClick={() => { setActiveTab('cafe'); setSelectedCategoryFilter('all'); setSearchQuery(''); }}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'cafe' ? '2.5px solid var(--rust)' : '2.5px solid transparent',
            color: activeTab === 'cafe' ? 'var(--cocoa-deep)' : 'var(--taupe)',
            fontWeight: activeTab === 'cafe' ? 600 : 500,
            padding: '12px 18px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Icon name="cafe" size={16} />
          Café Products ({menuItems.length})
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('fashion'); setSelectedCategoryFilter('all'); setSearchQuery(''); }}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'fashion' ? '2.5px solid var(--rust)' : '2.5px solid transparent',
            color: activeTab === 'fashion' ? 'var(--cocoa-deep)' : 'var(--taupe)',
            fontWeight: activeTab === 'fashion' ? 600 : 500,
            padding: '12px 18px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Icon name="fashion" size={16} />
          Fashion Items ({fashionItems.length})
        </button>
      </div>

      {/* Filter and Select Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1rem',
        background: '#fff',
        padding: '12px 16px',
        borderRadius: '6px',
        border: '1px solid var(--line)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600, color: 'var(--cocoa-deep)' }}>
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              style={{ width: '16px', height: '16px', accentColor: 'var(--rust)', cursor: 'pointer' }}
            />
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </label>

          <span style={{ color: 'var(--taupe)', fontSize: '0.85rem' }}>
            ({currentFilteredItems.filter(i => currentSelectedSet.has(i._id)).length} of {currentFilteredItems.length} selected)
          </span>

          {/* Search Box */}
          <input
            type="text"
            placeholder={activeTab === 'cafe' ? "Search café menu..." : "Search fashion collection..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid var(--line)',
              fontSize: '0.85rem',
              minWidth: '220px'
            }}
          />

          {/* Category Dropdown */}
          <select
            value={selectedCategoryFilter}
            onChange={e => setSelectedCategoryFilter(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid var(--line)',
              fontSize: '0.85rem',
              background: '#fff'
            }}
          >
            <option value="all">All {activeTab === 'cafe' ? 'Categories' : 'Fashion Layers'}</option>
            {activeTab === 'cafe'
              ? menuCategories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))
              : fashionLayers.map(l => (
                  <option key={l._id} value={l._id}>{l.name}</option>
                ))}
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid var(--line)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--taupe)' }}>
            Loading inventory products...
          </div>
        ) : currentFilteredItems.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--taupe)' }}>
            No items found matching the current filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#FCF8F0', borderBottom: '1px solid var(--line)', color: 'var(--cocoa-deep)' }}>
                  <th style={{ padding: '12px 14px', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      style={{ accentColor: 'var(--rust)', cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '12px 14px' }}>Item</th>
                  <th style={{ padding: '12px 14px' }}>{activeTab === 'cafe' ? 'Category' : 'Layer'}</th>
                  <th style={{ padding: '12px 14px' }}>Display Price (₦)</th>
                  <th style={{ padding: '12px 14px' }}>Raw Kobo</th>
                  <th style={{ padding: '12px 14px' }}>Glovo / 3rd Party (₦)</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentFilteredItems.map(item => {
                  const isChecked = currentSelectedSet.has(item._id);
                  const kobo = activeTab === 'cafe' ? (item.priceKobo || 0) : (item.displayPriceKobo || 0);
                  const naira = (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
                  const glovoMarkup = (Math.round(kobo * 1.15) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });

                  return (
                    <tr
                      key={item._id}
                      onClick={() => toggleSelectOne(item._id)}
                      style={{
                        borderBottom: '1px solid var(--line)',
                        background: isChecked ? 'rgba(164, 69, 31, 0.03)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(item._id)}
                          style={{ accentColor: 'var(--rust)', cursor: 'pointer' }}
                        />
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {(item.image || (item.images && item.images[0])) ? (
                            <img
                              src={item.image || item.images[0]}
                              alt={item.name}
                              style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--line)' }}
                            />
                          ) : (
                            <div style={{ width: '38px', height: '38px', background: '#F4EAE0', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9B816F', fontSize: '12px' }}>
                              —
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--cocoa-deep)' }}>{item.name}</div>
                            {item.slug && <div style={{ fontSize: '0.75rem', color: 'var(--taupe)' }}>{item.slug}</div>}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', color: 'var(--cocoa-deep)' }}>
                        {activeTab === 'cafe'
                          ? (item.category?.name || 'Uncategorized')
                          : (item.layer?.name || 'Standard')}
                      </td>

                      <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--cocoa-deep)' }}>
                        ₦{naira}
                      </td>

                      <td style={{ padding: '12px 14px', color: 'var(--taupe)', fontFamily: 'monospace' }}>
                        {kobo.toLocaleString()}
                      </td>

                      <td style={{ padding: '12px 14px', color: '#2E6B3E', fontWeight: 500 }}>
                        ₦{glovoMarkup}
                      </td>

                      <td style={{ padding: '12px 14px' }}>
                        {activeTab === 'cafe' ? (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: item.isAvailable !== false ? '#EAF3ED' : '#F8E9E9',
                            color: item.isAvailable !== false ? '#2E6B3E' : '#A4451F'
                          }}>
                            {item.isAvailable !== false ? 'Available' : 'Unavailable'}
                          </span>
                        ) : (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: item.isAvailableInStore !== false ? '#EAF3ED' : '#F8E9E9',
                            color: item.isAvailableInStore !== false ? '#2E6B3E' : '#A4451F'
                          }}>
                            {item.isAvailableInStore !== false ? 'In-Store' : 'Out of Stock'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
