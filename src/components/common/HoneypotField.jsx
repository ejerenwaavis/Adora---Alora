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
      <label htmlFor="_aora_uid">Do not fill this field if you are human</label>
      <input
        id="_aora_uid"
        type="text"
        name="_aora_uid"
        value={values._aora_uid || ''}
        onChange={onChange}
        autoComplete="nope"
        tabIndex="-1"
      />
      <input
        type="text"
        name="_aora_session"
        value={values._aora_session || ''}
        onChange={onChange}
        autoComplete="nope"
        tabIndex="-1"
      />
    </div>
  );
}
