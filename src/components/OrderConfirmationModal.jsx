import React from 'react';
import { Link } from 'react-router-dom';
import { IconShieldCheck, IconClock, IconPin, IconX, IconCheck } from './ui/LineIcons';

export default function OrderConfirmationModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const orderNum = order.orderNumber || (order._id ? `#AH-${order._id.slice(-6).toUpperCase()}` : '#AH-ORD');
  const items = order.items || [];
  const totalNaira = ((order.totalAmountKobo || 0) / 100).toLocaleString();

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(20, 10, 4, 0.8)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '16px'
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#FFFDF9',
        border: '1px solid rgba(227, 211, 184, 0.9)',
        borderRadius: '12px',
        maxWidth: '460px',
        width: '100%',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        overflow: 'hidden',
        position: 'relative',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #2B2015 0%, #3D2D1E 100%)',
          padding: '24px 20px',
          textAlign: 'center',
          color: '#F7EFE1',
          position: 'relative'
        }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', color: '#F7EFE1', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
            aria-label="Close modal"
          >
            <IconX size={18} color="#F7EFE1" />
          </button>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'rgba(200, 155, 74, 0.18)',
            border: '1px solid rgba(200, 155, 74, 0.4)',
            color: 'var(--gold, #C89B4A)',
            marginBottom: '12px'
          }}>
            <IconShieldCheck size={24} color="var(--gold, #C89B4A)" />
          </div>

          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.18em', color: 'var(--gold, #C89B4A)', fontWeight: 600, marginBottom: '4px' }}>
            Aora House Café · Order Confirmed
          </div>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: '22px', margin: 0, fontWeight: 400 }}>
            Order Received
          </h3>
          <div style={{ fontSize: '12px', marginTop: '6px', color: 'rgba(247, 239, 225, 0.85)' }}>
            Order Reference: <strong style={{ color: '#F7EFE1', letterSpacing: '0.04em' }}>{orderNum}</strong>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Status Note */}
          <div style={{
            background: 'rgba(46, 107, 62, 0.08)',
            border: '1px solid rgba(46, 107, 62, 0.2)',
            borderRadius: '6px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12.5px',
            color: '#1A4024'
          }}>
            <IconClock size={16} color="#2E6B3E" />
            <div>
              <strong>Kitchen Preparation in Progress</strong>
              <div style={{ fontSize: '11.5px', opacity: 0.85 }}>Estimated ready time: 15–20 minutes</div>
            </div>
          </div>

          {/* Guest Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#FAF6EF', padding: '12px 14px', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.7)', fontSize: '12px' }}>
            <div>
              <span style={{ color: 'var(--taupe, #9C8770)', display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Guest Name</span>
              <strong style={{ color: 'var(--cocoa-deep, #2B2015)' }}>{order.customerName || 'Aora Guest'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--taupe, #9C8770)', display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phone</span>
              <strong style={{ color: 'var(--cocoa-deep, #2B2015)' }}>{order.customerPhone || 'On File'}</strong>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--taupe, #9C8770)', fontWeight: 600, marginBottom: '10px' }}>
              Order Items Summary
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(227, 211, 184, 0.6)', paddingTop: '10px' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--cocoa-deep, #2B2015)' }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span style={{ fontWeight: 600 }}>₦{(((item.priceKobo || 0) * (item.quantity || 1)) / 100).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid rgba(227, 211, 184, 0.8)', marginTop: '12px', paddingTop: '12px' }}>
              <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, color: 'var(--cocoa-deep)' }}>Total Amount</span>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: '18px', fontWeight: 600, color: 'var(--cocoa-deep)' }}>₦{totalNaira}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
            <Link
              to="/account"
              onClick={onClose}
              style={{
                background: 'var(--cocoa-deep, #2B2015)',
                color: '#F7EFE1',
                padding: '12px',
                borderRadius: '4px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontWeight: 600,
                textAlign: 'center',
                textDecoration: 'none'
              }}
            >
              View in Member Account →
            </Link>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: '1px solid rgba(227, 211, 184, 0.9)',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--cocoa-deep, #2B2015)',
                cursor: 'pointer'
              }}
            >
              Continue Browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
