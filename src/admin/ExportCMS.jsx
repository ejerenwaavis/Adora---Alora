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

  const downloadFile = (filename, content, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // 1. CSV Export Logic
  const handleExportCSV = () => {
    const selectedItems = currentFilteredItems.filter(item => currentSelectedSet.has(item._id));
    if (selectedItems.length === 0) {
      showToast('Please select at least one item to export.', true);
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];

    if (activeTab === 'cafe') {
      const headers = [
        'ID',
        'Name',
        'Slug',
        'Category',
        'Unit Price (NGN)',
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
          glovoMarkupNaira,
          item.isAvailable !== false ? 'YES' : 'NO',
          `"${dietary.replace(/"/g, '""')}"`,
          `"${allergens.replace(/"/g, '""')}"`,
          `"${(item.badge || '').replace(/"/g, '""')}"`,
          `"${(item.description || '').replace(/"/g, '""')}"`,
          `"${(item.image || '').replace(/"/g, '""')}"`
        ];
      });

      downloadFile(
        `aora_house_cafe_products_${dateStr}.csv`,
        [headers.join(','), ...rows.map(r => r.join(','))].join('\n'),
        'text/csv;charset=utf-8;'
      );
    } else {
      const headers = [
        'ID',
        'Name',
        'Slug',
        'Fashion Layer',
        'Brand / Designer',
        'Seller Name',
        'Unit Price (NGN)',
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

      downloadFile(
        `aora_house_fashion_inventory_${dateStr}.csv`,
        [headers.join(','), ...rows.map(r => r.join(','))].join('\n'),
        'text/csv;charset=utf-8;'
      );
    }

    showToast(`Exported ${selectedItems.length} items to CSV.`);
  };

  // 2. JSON Export Logic
  const handleExportJSON = () => {
    const selectedItems = currentFilteredItems.filter(item => currentSelectedSet.has(item._id));
    if (selectedItems.length === 0) {
      showToast('Please select at least one item to export.', true);
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];

    if (activeTab === 'cafe') {
      const exportData = selectedItems.map(item => {
        const kobo = Number(item.priceKobo) || 0;
        const priceNaira = Number((kobo / 100).toFixed(2));
        const glovoPriceNaira = Number((Math.round(kobo * 1.15) / 100).toFixed(2));

        return {
          id: item._id,
          name: item.name,
          slug: item.slug || '',
          category: item.category?.name || 'Uncategorized',
          priceNaira,
          glovoPriceNaira,
          isAvailable: item.isAvailable !== false,
          dietaryTags: item.dietaryTags || [],
          allergens: item.allergens || [],
          badge: item.badge || '',
          description: item.description || '',
          imageUrl: item.image || ''
        };
      });

      downloadFile(
        `aora_house_cafe_products_${dateStr}.json`,
        JSON.stringify(exportData, null, 2),
        'application/json;charset=utf-8;'
      );
    } else {
      const exportData = selectedItems.map(item => {
        const kobo = Number(item.displayPriceKobo) || 0;
        const priceNaira = Number((kobo / 100).toFixed(2));
        const thirdPartyPriceNaira = Number((Math.round(kobo * 1.15) / 100).toFixed(2));

        return {
          id: item._id,
          name: item.name,
          slug: item.slug || '',
          layer: item.layer?.name || 'Standard',
          brand: item.brand || '',
          sellerName: item.sellerName || '',
          priceNaira,
          thirdPartyPriceNaira,
          isAvailableInStore: item.isAvailableInStore !== false,
          availabilityNote: item.availabilityNote || '',
          sizes: item.sizes || [],
          colors: item.colors || [],
          collectionName: item.collectionName || '',
          raireListingUrl: item.raireListingUrl || '',
          description: item.description || '',
          images: item.images || []
        };
      });

      downloadFile(
        `aora_house_fashion_inventory_${dateStr}.json`,
        JSON.stringify(exportData, null, 2),
        'application/json;charset=utf-8;'
      );
    }

    showToast(`Exported ${selectedItems.length} items to JSON.`);
  };

  // 3. Plain Text Export Logic
  const handleExportTXT = () => {
    const selectedItems = currentFilteredItems.filter(item => currentSelectedSet.has(item._id));
    if (selectedItems.length === 0) {
      showToast('Please select at least one item to export.', true);
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    let text = '';

    if (activeTab === 'cafe') {
      text += `================================================================================\n`;
      text += `AORA HOUSE — CAFÉ PRODUCTS CATALOG\n`;
      text += `Export Date: ${dateStr} | Selected Items: ${selectedItems.length}\n`;
      text += `Third-Party Delivery Pricing: Glovo / Chowdeck (includes +15% markup)\n`;
      text += `================================================================================\n\n`;

      selectedItems.forEach((item, idx) => {
        const kobo = Number(item.priceKobo) || 0;
        const naira = (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
        const glovoMarkup = (Math.round(kobo * 1.15) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
        const cat = item.category?.name || 'Uncategorized';
        const dietary = (item.dietaryTags || []).length > 0 ? item.dietaryTags.join(', ') : 'None';
        const allergens = (item.allergens || []).length > 0 ? item.allergens.join(', ') : 'None';

        text += `${idx + 1}. ${(item.name || '').toUpperCase()}\n`;
        text += `   Category: ${cat}\n`;
        text += `   Direct Price: ₦${naira}\n`;
        text += `   Glovo / 3rd Party (15% Markup): ₦${glovoMarkup}\n`;
        text += `   Availability: ${item.isAvailable !== false ? 'Available' : 'Unavailable'}\n`;
        if (item.badge) text += `   Badge: ${item.badge}\n`;
        text += `   Dietary: ${dietary}\n`;
        text += `   Allergens: ${allergens}\n`;
        if (item.description) text += `   Description: ${item.description}\n`;
        if (item.image) text += `   Image: ${item.image}\n`;
        text += `\n--------------------------------------------------------------------------------\n\n`;
      });

      downloadFile(
        `aora_house_cafe_products_${dateStr}.txt`,
        text,
        'text/plain;charset=utf-8;'
      );
    } else {
      text += `================================================================================\n`;
      text += `AORA HOUSE — FASHION INVENTORY CATALOG\n`;
      text += `Export Date: ${dateStr} | Selected Items: ${selectedItems.length}\n`;
      text += `Third-Party Retail Pricing: Raire / Wholesale (includes +15% markup)\n`;
      text += `================================================================================\n\n`;

      selectedItems.forEach((item, idx) => {
        const kobo = Number(item.displayPriceKobo) || 0;
        const naira = (kobo / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
        const markup = (Math.round(kobo * 1.15) / 100).toLocaleString('en-NG', { minimumFractionDigits: 2 });
        const layer = item.layer?.name || 'Standard';
        const sizes = (item.sizes || []).length > 0 ? item.sizes.join(', ') : 'Free Size';
        const colors = (item.colors || []).length > 0 ? item.colors.join(', ') : 'Standard';

        text += `${idx + 1}. ${(item.name || '').toUpperCase()}\n`;
        text += `   Fashion Layer: ${layer}\n`;
        if (item.brand) text += `   Brand: ${item.brand}\n`;
        if (item.sellerName) text += `   Featured Seller: ${item.sellerName}\n`;
        text += `   Direct Price: ₦${naira}\n`;
        text += `   Third-Party Retail (+15%): ₦${markup}\n`;
        text += `   In-Store Availability: ${item.isAvailableInStore !== false ? 'YES' : 'Out of Stock'}${item.availabilityNote ? ` (${item.availabilityNote})` : ''}\n`;
        text += `   Sizes: ${sizes}\n`;
        text += `   Colors: ${colors}\n`;
        if (item.collectionName) text += `   Collection: ${item.collectionName}\n`;
        if (item.raireListingUrl) text += `   Raire Link: ${item.raireListingUrl}\n`;
        if (item.description) text += `   Description: ${item.description}\n`;
        text += `\n--------------------------------------------------------------------------------\n\n`;
      });

      downloadFile(
        `aora_house_fashion_inventory_${dateStr}.txt`,
        text,
        'text/plain;charset=utf-8;'
      );
    }

    showToast(`Exported ${selectedItems.length} items to Plain Text.`);
  };

  const selectedCount = currentFilteredItems.filter(i => currentSelectedSet.has(i._id)).length;

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

        {/* Multi-Format Export Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* CSV */}
          <button
            onClick={handleExportCSV}
            disabled={loading || selectedCount === 0}
            title="Download spreadsheet in CSV format"
            style={{
              background: 'var(--cocoa-deep)',
              color: '#FCF8F0',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '6px',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: (loading || selectedCount === 0) ? 'not-allowed' : 'pointer',
              opacity: (loading || selectedCount === 0) ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="8" y1="13" x2="16" y2="13" />
              <line x1="8" y1="17" x2="16" y2="17" />
            </svg>
            Export CSV ({selectedCount})
          </button>

          {/* JSON */}
          <button
            onClick={handleExportJSON}
            disabled={loading || selectedCount === 0}
            title="Download structured data in JSON format"
            style={{
              background: '#FFFDF9',
              color: 'var(--cocoa-deep)',
              border: '1px solid rgba(227, 211, 184, 0.9)',
              padding: '10px 16px',
              borderRadius: '6px',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: (loading || selectedCount === 0) ? 'not-allowed' : 'pointer',
              opacity: (loading || selectedCount === 0) ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            JSON
          </button>

          {/* Plain Text */}
          <button
            onClick={handleExportTXT}
            disabled={loading || selectedCount === 0}
            title="Download human-readable plain text catalog"
            style={{
              background: '#FFFDF9',
              color: 'var(--cocoa-deep)',
              border: '1px solid rgba(227, 211, 184, 0.9)',
              padding: '10px 16px',
              borderRadius: '6px',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: (loading || selectedCount === 0) ? 'not-allowed' : 'pointer',
              opacity: (loading || selectedCount === 0) ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="17" y1="10" x2="3" y2="10" />
              <line x1="21" y1="6" x2="3" y2="6" />
              <line x1="21" y1="14" x2="3" y2="14" />
              <line x1="17" y1="18" x2="3" y2="18" />
            </svg>
            Plain Text
          </button>
        </div>
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
        <div style={{ color: 'var(--rust)', display: 'flex', alignItems: 'center', marginTop: '2px' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#5A4636', lineHeight: 1.55 }}>
          <strong>Direct Naira Pricing:</strong> All catalog prices are unified directly in <strong>Naira (₦)</strong> alongside calculated <strong>third-party delivery/partner markups (+15%)</strong> for seamless export to external delivery and retail platforms (Glovo, Chowdeck, Raire).
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
                  <th style={{ padding: '12px 14px' }}>Unit Price (₦)</th>
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
