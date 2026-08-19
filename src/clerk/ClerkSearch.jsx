import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function ClerkSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const { authFetch } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await authFetch(`/api/clerk/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, authFetch]);

  return (
    <div ref={containerRef} style={{ position: 'relative', marginRight: '16px' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <i className="ti ti-search" style={{ position: 'absolute', left: '12px', color: 'var(--taupe)', fontSize: '16px' }}></i>
        <input 
          type="text" 
          placeholder="Search guests or bookings..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          style={{ 
            width: '260px', 
            padding: '10px 12px 10px 38px', 
            borderRadius: '6px', 
            border: '1px solid var(--line)', 
            backgroundColor: 'var(--paper)',
            fontSize: '13px',
            color: 'var(--ink)'
          }}
        />
        {loading && <div style={{ position: 'absolute', right: '12px', fontSize: '10px', color: 'var(--taupe)' }}>...</div>}
      </div>

      {isOpen && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          marginTop: '8px', 
          right: 0, 
          width: '320px', 
          backgroundColor: 'var(--white)', 
          border: '1px solid var(--line)', 
          borderRadius: '8px', 
          boxShadow: 'var(--shadow-md)', 
          zIndex: 1000,
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {results.length === 0 && !loading && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--taupe)', fontSize: '13px' }}>
              No results found.
            </div>
          )}
          {results.map((r, i) => (
            <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', cursor: 'default' }}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--taupe)', letterSpacing: '.05em', marginBottom: '4px' }}>
                {r.type}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)', marginBottom: '2px' }}>
                {r.title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--taupe)' }}>
                {r.subtitle}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
