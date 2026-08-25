import React from 'react';

export default function ConciergeDashboard() {
  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', color: 'var(--cocoa-deep)', margin: '0 0 8px 0' }}>
          Concierge Dashboard
        </h1>
        <p style={{ color: 'var(--taupe)', margin: 0 }}>
          Manage guest relations, communications, and direct inquiries.
        </p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#FFFDF9', border: '1px solid rgba(227,211,184,0.6)', borderRadius: '8px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: 'var(--cocoa-deep)' }}>Active Conversations</h3>
          <div style={{ fontSize: '36px', fontFamily: 'var(--f-display)', color: '#2E6B3E' }}>3</div>
          <p style={{ margin: '8px 0 0 0', color: 'var(--taupe)', fontSize: '13px' }}>Awaiting reply in WhatsApp Inbox</p>
        </div>
        <div style={{ background: '#FFFDF9', border: '1px solid rgba(227,211,184,0.6)', borderRadius: '8px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', color: 'var(--cocoa-deep)' }}>Today's Inquiries</h3>
          <div style={{ fontSize: '36px', fontFamily: 'var(--f-display)', color: 'var(--rust)' }}>12</div>
          <p style={{ margin: '8px 0 0 0', color: 'var(--taupe)', fontSize: '13px' }}>Total messages received today</p>
        </div>
      </div>
    </div>
  );
}
