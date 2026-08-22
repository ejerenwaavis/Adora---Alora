import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import styles from './SettingsCMS.module.css';

const DEFAULT_GROUPS = {
  contact: {
    label: 'Contact & Location',
    desc: 'Physical address, operating hours, support contacts, and maps',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12 19.79 19.79 0 0 1 1.07 3.4 2 2 0 0 1 3.05 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.17a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16.92Z"/>
      </svg>
    ),
    color: 'rgba(164,69,31,.1)',
    iconColor: '#A4451F',
    settings: [
      { key: 'contact_email', label: 'Contact email', defaultValue: 'hello@adora-alora.com', hint: 'Shown on Visit page and footer', type: 'email' },
      { key: 'contact_phone', label: 'Contact phone', defaultValue: '+234 800 000 0000', hint: 'WhatsApp and general enquiries', type: 'phone' },
      { key: 'location_address', label: 'Physical address', defaultValue: '14 Adetokunbo Ademola Street, Victoria Island, Lagos', hint: 'Displayed on Visit page and footer', type: 'text' },
      { key: 'open_today_text', label: 'Today status banner', defaultValue: 'Open Today · 6:30 AM — 9:00 PM', hint: 'Dynamic header tag on Visit and Home pages', type: 'text' },
      { key: 'opening_hours_weekday', label: 'Weekday opening hours', defaultValue: 'Mon — Fri: 6:30am — 9:00pm', hint: 'Displayed in footer and Visit hours section', type: 'text' },
      { key: 'opening_hours_weekend', label: 'Weekend opening hours', defaultValue: 'Sat — Sun: 8:00am — 10:00pm', hint: 'Displayed in footer and Visit hours section', type: 'text' },
      { key: 'location_map_query', label: 'Maps search query', defaultValue: '14 Adetokunbo Ademola Street, Victoria Island, Lagos, Nigeria', hint: 'Google Maps iframe query string', type: 'url' },
      { key: 'location_map_url', label: 'Google Maps direct link', defaultValue: 'https://maps.google.com/?q=14+Adetokunbo+Ademola+Street,+Victoria+Island,+Lagos,+Nigeria', hint: 'Link for "Get Directions" buttons', type: 'url' },
    ]
  },
  booking: {
    label: 'Booking Rules',
    desc: 'Cancellation policies, standby auto-fill, and house capacities',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    color: 'rgba(65,79,54,.1)',
    iconColor: '#414F36',
    settings: [
      { key: 'cancellation_window_hours', label: 'Cancellation window (hours)', defaultValue: '360', hint: 'Hours before class — guests can cancel without penalty', type: 'num' },
      { key: 'late_cancel_fee_pct', label: 'Late cancel fee (%)', defaultValue: '50', hint: 'Percentage of class price charged on late cancellation', type: 'num' },
      { key: 'walkin_cutoff_mins', label: 'Walk-in cutoff (mins)', defaultValue: '15', hint: 'Minutes before class start — no new walk-ins after this', type: 'num' },
      { key: 'waitlist_auto_promote', label: 'Auto-promote waitlist', defaultValue: 'true', hint: 'Automatically fill spots from standby when a booking cancels', type: 'bool' },
      { key: 'waitlist_expiration_hours', label: 'Waitlist expiration (hours)', defaultValue: '360', hint: 'Time until standby position expires without confirmation', type: 'num' },
      { key: 'max_class_capacity', label: 'Default class capacity', defaultValue: '14', hint: 'Override per class; this is the house default', type: 'num' },
    ]
  },
  social: {
    label: 'Social & Links',
    desc: 'Social handles, WhatsApp integration, and external app links',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
      </svg>
    ),
    color: 'rgba(200,155,74,.1)',
    iconColor: '#C89B4A',
    settings: [
      { key: 'instagram_url', label: 'Instagram', defaultValue: 'https://instagram.com/adoraandalora', hint: 'Linked in footer and social row', type: 'url' },
      { key: 'whatsapp_number', label: 'WhatsApp number', defaultValue: '+2348000000000', hint: 'International format, no spaces', type: 'phone' },
      { key: 'raire_app_url', label: 'Raire app link', defaultValue: 'https://raire.app', hint: 'Used on Fashion page CTA', type: 'url' },
    ]
  },
  payments: {
    label: 'Payments',
    desc: 'Payment processing gateway, currency, and tax rates',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    color: 'rgba(42,29,20,.07)',
    iconColor: '#2A1D14',
    settings: [
      { key: 'payment_provider', label: 'Payment provider', defaultValue: 'paystack', hint: 'paystack or flutterwave', type: 'text' },
      { key: 'currency_code', label: 'Currency', defaultValue: 'NGN', hint: 'ISO 4217 currency code', type: 'text' },
      { key: 'vat_rate_pct', label: 'VAT rate (%)', defaultValue: '7.5', hint: 'Applied to all transactions', type: 'num' },
    ]
  },
  notifications: {
    label: 'Notifications',
    desc: 'Guest transactional alerts, SMS triggers, and ops email',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    color: 'rgba(176,100,79,.1)',
    iconColor: '#B0644F',
    settings: [
      { key: 'notify_booking_confirm', label: 'Booking confirmation email', defaultValue: 'true', hint: 'Email guest immediately on booking', type: 'bool' },
      { key: 'notify_reminder_hrs', label: 'Reminder timing (hours)', defaultValue: '24', hint: 'Hours before class to send reminder', type: 'num' },
      { key: 'notify_waitlist_sms', label: 'Waitlist SMS alerts', defaultValue: 'false', hint: 'Text guest when promoted from standby', type: 'bool' },
      { key: 'notify_admin_email', label: 'Admin alerts email', defaultValue: 'ops@adora-alora.com', hint: 'Receives new bookings and cancellation alerts', type: 'email' },
    ]
  },
  features: {
    label: 'Feature Flags',
    desc: 'Toggle house features, sections, and commercial modules',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    color: 'rgba(65,79,54,.1)',
    iconColor: '#414F36',
    settings: [
      { key: 'memberships_enabled', label: 'Memberships live', defaultValue: 'false', hint: 'Show membership plans and purchase flow', type: 'bool' },
      { key: 'journal_enabled', label: 'Journal section live', defaultValue: 'false', hint: 'Publish the editorial journal section', type: 'bool' },
      { key: 'retail_products_enabled', label: 'Retail products live', defaultValue: 'false', hint: 'Show packaged retail items for purchase', type: 'bool' },
    ]
  }
};

// Helper: Determine appropriate group for any arbitrary/seeded key
function getGroupForKey(key) {
  const k = key.toLowerCase();
  if (k.includes('contact') || k.includes('phone') || k.includes('address') || k.includes('location') || k.includes('map') || k.includes('hour') || k.includes('open')) {
    return 'contact';
  }
  if (k.includes('cancel') || k.includes('booking') || k.includes('waitlist') || k.includes('walkin') || k.includes('capacity') || k.includes('roster')) {
    return 'booking';
  }
  if (k.includes('instagram') || k.includes('whatsapp') || k.includes('social') || k.includes('raire') || k.includes('twitter')) {
    return 'social';
  }
  if (k.includes('pay') || k.includes('vat') || k.includes('currency') || k.includes('tax') || k.includes('gateway')) {
    return 'payments';
  }
  if (k.includes('notify') || k.includes('alert') || k.includes('sms') || k.includes('email_ops') || k.includes('reminder')) {
    return 'notifications';
  }
  return 'features';
}

export default function SettingsCMS() {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const [dbSettings, setDbSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentGroup, setCurrentGroup] = useState('contact');
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await authFetch('/api/cms/settings');
      if (res.ok) {
        const data = await res.json();
        setDbSettings(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  }

  const getSettingValue = (key, defaultVal) => {
    const found = dbSettings.find(s => s.key === key);
    if (found && found.value !== undefined && found.value !== null) {
      return String(found.value);
    }
    return String(defaultVal ?? '');
  };

  const getSettingDbItem = (key) => {
    return dbSettings.find(s => s.key === key);
  };

  async function persistSetting(key, val, hint = '', type = 'text') {
    setSavingKey(key);
    try {
      const existing = getSettingDbItem(key);
      const formattedVal = type === 'bool' ? (val === 'true' || val === true) : (type === 'num' && !isNaN(val) ? Number(val) : val);

      if (existing && existing._id) {
        const res = await authFetch(`/api/cms/settings/${existing._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: formattedVal, description: hint || existing.description })
        });
        if (res.ok) {
          const updated = await res.json();
          setDbSettings(prev => prev.map(s => s._id === updated._id ? updated : s));
          toast.success(`Setting '${key}' updated successfully.`);
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || 'Failed to update setting.');
        }
      } else {
        const res = await authFetch('/api/cms/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value: formattedVal, description: hint })
        });
        if (res.ok) {
          const created = await res.json();
          setDbSettings(prev => [...prev, created]);
          toast.success(`Setting '${key}' saved successfully.`);
        } else {
          const errData = await res.json().catch(() => ({}));
          toast.error(errData.error || 'Failed to save setting.');
        }
      }
    } catch (err) {
      console.error('Failed to persist setting:', err);
      toast.error('Network error updating setting.');
    } finally {
      setSavingKey(null);
    }
  }

  function handleStartEdit(key, currentVal) {
    setEditingKey(key);
    setEditValue(currentVal);
  }

  async function handleSaveEdit(key, hint, type) {
    if (editValue === '') return;
    await persistSetting(key, editValue.trim(), hint, type);
    setEditingKey(null);
    setEditValue('');
  }

  function handleCancelEdit() {
    setEditingKey(null);
    setEditValue('');
  }

  async function handleToggle(key, isChecked, hint) {
    const newVal = isChecked ? 'true' : 'false';
    await persistSetting(key, newVal, hint, 'bool');
  }

  const typeLabels = {
    num: 'Number',
    bool: 'Toggle',
    email: 'Email',
    phone: 'Phone',
    url: 'URL',
    text: 'Text'
  };

  const typeClassMap = {
    num: styles.tNum,
    bool: styles.tBool,
    email: styles.tEmail,
    phone: styles.tPhone,
    url: styles.tUrl,
    text: styles.tText
  };

  // Build the settings list for each group by combining defined group settings with any DB settings
  const knownKeys = new Set(Object.values(DEFAULT_GROUPS).flatMap(g => g.settings.map(s => s.key)));
  
  // Custom DB settings distributed to their rightful domain group
  const groupedDbSettings = {};
  Object.keys(DEFAULT_GROUPS).forEach(gKey => {
    groupedDbSettings[gKey] = [];
  });

  dbSettings.forEach(s => {
    if (!knownKeys.has(s.key)) {
      const targetGroup = getGroupForKey(s.key);
      groupedDbSettings[targetGroup].push({
        key: s.key,
        label: s.key.replace(/_/g, ' '),
        defaultValue: String(s.value ?? ''),
        hint: s.description || 'Database configuration key',
        type: typeof s.value === 'boolean' ? 'bool' : (typeof s.value === 'number' ? 'num' : 'text')
      });
    }
  });

  const grp = DEFAULT_GROUPS[currentGroup] || DEFAULT_GROUPS.contact;
  const activeSettings = [
    ...grp.settings,
    ...(groupedDbSettings[currentGroup] || [])
  ];

  const q = searchQuery.toLowerCase().trim();
  const filteredSettings = activeSettings.filter(s => {
    if (!q) return true;
    const currentVal = getSettingValue(s.key, s.defaultValue).toLowerCase();
    return s.label.toLowerCase().includes(q) ||
           s.key.toLowerCase().includes(q) ||
           (s.hint && s.hint.toLowerCase().includes(q)) ||
           currentVal.includes(q);
  });

  if (loading) {
    return <div style={{ padding: '3rem', color: 'var(--taupe)', fontStyle: 'italic' }}>Loading global settings…</div>;
  }

  return (
    <div className={styles.container}>
      <div className="eyebrow" style={{ color: 'var(--rust)', letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: '0.75rem', marginBottom: '0.4rem' }}>CMS</div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '2.25rem', color: 'var(--cocoa-deep)', margin: '0 0 1.5rem 0' }}>Global Settings</h1>

      {/* ── TOP HORIZONTAL TABS BAR ── */}
      <nav className={styles.tabBar} aria-label="Settings Categories">
        {Object.entries(DEFAULT_GROUPS).map(([gKey, group]) => {
          const totalCount = group.settings.length + (groupedDbSettings[gKey]?.length || 0);
          const isActive = currentGroup === gKey;
          return (
            <button
              key={gKey}
              type="button"
              className={`${styles.tabItem} ${isActive ? styles.active : ''}`}
              onClick={() => { setCurrentGroup(gKey); handleCancelEdit(); }}
            >
              <span className={styles.tabIcon}>{group.icon}</span>
              <span>{group.label}</span>
              <span className={styles.tabBadge}>{totalCount}</span>
            </button>
          );
        })}
      </nav>

      {/* ── DOMAIN HEADER & ACTION BAR ── */}
      <div className={styles.actionBar}>
        <div className={styles.domainInfo}>
          <div className={styles.domainIcon} style={{ background: grp.color, color: grp.iconColor }}>
            {grp.icon}
          </div>
          <div>
            <h2 className={styles.domainTitle}>{grp.label}</h2>
            <div className={styles.domainDesc}>{grp.desc}</div>
          </div>
        </div>

        <div className={styles.actionsRight}>
          <div className={styles.searchInput}>
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search in this domain…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── SETTINGS CARDS GRID ── */}
      <div className={styles.grid}>
        {filteredSettings.map(s => {
          const currentVal = getSettingValue(s.key, s.defaultValue);
          const isEditing = editingKey === s.key;
          const isBool = s.type === 'bool';
          const boolOn = currentVal === 'true' || currentVal === '1';

          if (isEditing) {
            return (
              <div key={s.key} className={`${styles.card} ${styles.editing}`}>
                <div>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardKey}>
                      <span>{s.label}</span>
                      <code>{s.key}</code>
                    </div>
                    <span className={`${styles.badge} ${typeClassMap[s.type] || styles.tText}`}>
                      {typeLabels[s.type] || 'Text'}
                    </span>
                  </div>
                  {s.hint && <div className={styles.cardHint} style={{ margin: '6px 0' }}>{s.hint}</div>}
                  <input
                    type={s.type === 'num' ? 'number' : (s.type === 'email' ? 'email' : 'text')}
                    className={styles.editInput}
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    autoFocus
                    placeholder="Enter value…"
                  />
                  <div className={styles.editActions}>
                    <button
                      type="button"
                      className={styles.btnSave}
                      onClick={() => handleSaveEdit(s.key, s.hint, s.type)}
                      disabled={savingKey === s.key}
                    >
                      {savingKey === s.key ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" className={styles.btnCancel} onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          const displayVal = s.type === 'email' ? (
            <a href={`mailto:${currentVal}`}>{currentVal}</a>
          ) : s.type === 'url' ? (
            <span style={{ color: 'var(--rust)', wordBreak: 'break-all' }}>{currentVal}</span>
          ) : (
            currentVal
          );

          return (
            <div key={s.key} className={styles.card}>
              <div>
                <div className={styles.cardHeader}>
                  <div className={styles.cardKey}>
                    <span>{s.label}</span>
                    <code>{s.key}</code>
                  </div>
                  <span className={`${styles.badge} ${typeClassMap[s.type] || styles.tText}`}>
                    {typeLabels[s.type] || 'Text'}
                  </span>
                </div>
                {!isBool && <div className={styles.cardValue}>{displayVal}</div>}
                {s.hint && <div className={styles.cardHint}>{s.hint}</div>}
              </div>

              <div className={styles.cardFooter}>
                {isBool ? (
                  <>
                    <span style={{ fontSize: '11px', color: boolOn ? 'var(--forest)' : 'var(--taupe)', fontWeight: 500 }}>
                      {boolOn ? '● Enabled' : '○ Disabled'}
                    </span>
                    <label className={styles.toggle} title={boolOn ? 'Click to disable' : 'Click to enable'}>
                      <input
                        type="checkbox"
                        checked={boolOn}
                        onChange={e => handleToggle(s.key, e.target.checked, s.hint)}
                      />
                      <div className={styles.toggleTrack}></div>
                      <div className={styles.toggleThumb}></div>
                    </label>
                  </>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontSize: '11px', color: 'var(--taupe)', opacity: 0.7 }}>Click Edit to update</span>
                    <button
                      type="button"
                      className={styles.btnEdit}
                      onClick={() => handleStartEdit(s.key, currentVal)}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredSettings.length === 0 && (
          <div className={styles.empty}>No settings found matching your search.</div>
        )}
      </div>
    </div>
  );
}
