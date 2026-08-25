import React, { useState, useEffect } from 'react';
import { IconBank, IconCreditCard, IconMoney } from '../components/ui/LineIcons';

export default function FinanceDashboard() {
  const [data, setData] = useState({
    totalRevenue: 0,
    cafeRevenue: 0,
    fashionRevenue: 0,
    eventsRevenue: 0,
    paystackFees: 0,
    netSettlement: 0,
    transactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In the future, this will fetch from /api/finance/daily-summary
    // For now, we mock some realistic data to build the layout
    setTimeout(() => {
      setData({
        totalRevenue: 450000,
        cafeRevenue: 120000,
        fashionRevenue: 250000,
        eventsRevenue: 80000,
        paystackFees: 6750, // ~1.5%
        netSettlement: 443250,
        transactions: [
          { id: '1', type: 'Fashion', amount: 125000, time: '10:45 AM', status: 'Settled' },
          { id: '2', type: 'Cafe', amount: 8500, time: '11:15 AM', status: 'Settled' },
          { id: '3', type: 'Events', amount: 40000, time: '12:00 PM', status: 'Pending' },
        ]
      });
      setLoading(false);
    }, 800);
  }, []);

  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--taupe)' }}>Crunching the numbers...</div>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', color: 'var(--cocoa-deep)', margin: '0 0 8px 0' }}>
          Daily Revenue Dashboard
        </h1>
        <p style={{ color: 'var(--taupe)', margin: 0 }}>
          Reconciliation and settlement overview for today.
        </p>
      </header>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid rgba(227,211,184,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--taupe)', marginBottom: '16px' }}>
            <IconMoney size={20} />
            <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Gross Revenue</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--cocoa-deep)' }}>
            {formatNaira(data.totalRevenue)}
          </div>
        </div>

        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid rgba(227,211,184,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--taupe)', marginBottom: '16px' }}>
            <IconCreditCard size={20} />
            <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Paystack Fees (1.5%)</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--rust)' }}>
            -{formatNaira(data.paystackFees)}
          </div>
        </div>

        <div style={{ background: 'var(--cocoa-deep)', padding: '24px', borderRadius: '12px', color: '#F7EFE1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'rgba(247,239,225,0.7)', marginBottom: '16px' }}>
            <IconBank size={20} />
            <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Net Settlement</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--gold)' }}>
            {formatNaira(data.netSettlement)}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(247,239,225,0.5)', marginTop: '8px' }}>
            Expected payout tomorrow morning
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '20px', color: 'var(--cocoa-deep)', marginBottom: '20px' }}>
        Department Breakdown
      </h2>
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid rgba(227,211,184,0.5)', overflow: 'hidden', marginBottom: '40px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(247,239,225,0.3)', borderBottom: '1px solid rgba(227,211,184,0.5)', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: 'var(--taupe)' }}>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Department</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Gross Revenue</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>% of Total</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(227,211,184,0.3)' }}>
              <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--cocoa-deep)' }}>Café</td>
              <td style={{ padding: '16px 24px', color: 'var(--taupe)' }}>{formatNaira(data.cafeRevenue)}</td>
              <td style={{ padding: '16px 24px', color: 'var(--taupe)' }}>{Math.round((data.cafeRevenue / data.totalRevenue) * 100)}%</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(227,211,184,0.3)' }}>
              <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--cocoa-deep)' }}>Fashion Boutique</td>
              <td style={{ padding: '16px 24px', color: 'var(--taupe)' }}>{formatNaira(data.fashionRevenue)}</td>
              <td style={{ padding: '16px 24px', color: 'var(--taupe)' }}>{Math.round((data.fashionRevenue / data.totalRevenue) * 100)}%</td>
            </tr>
            <tr>
              <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--cocoa-deep)' }}>Loft Events</td>
              <td style={{ padding: '16px 24px', color: 'var(--taupe)' }}>{formatNaira(data.eventsRevenue)}</td>
              <td style={{ padding: '16px 24px', color: 'var(--taupe)' }}>{Math.round((data.eventsRevenue / data.totalRevenue) * 100)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
