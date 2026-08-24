import React from 'react';

/**
 * Invisible Honeypot Trap Field
 * Bots and scrapers fill in every field they discover; humans cannot see or focus on this.
 */
export default function HoneypotField({ values = {}, onChange }) {
  return (
    <div 
      aria-hidden="true" 
      style={{
        opacity: 0,
        position: 'absolute',
        top: 0,
        left: 0,
        height: 0,
        width: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}
      tabIndex="-1"
    >
      <label htmlFor="_hp_website_trap">Do not fill this field if you are human</label>
      <input
        id="_hp_website_trap"
        type="text"
        name="_hp_website"
        value={values._hp_website || ''}
        onChange={onChange}
        autoComplete="off"
        tabIndex="-1"
      />
      <input
        type="text"
        name="_hp_company"
        value={values._hp_company || ''}
        onChange={onChange}
        autoComplete="off"
        tabIndex="-1"
      />
    </div>
  );
}
