import React from 'react';
import { IconTicket, IconUser, IconCheck } from '../components/ui/LineIcons';

export default function FinancePayouts() {
  const payouts = [
    { id: '1', vendor: 'Yoga with Sarah', type: 'Instructor (Movement)', amount: 45000, status: 'Pending' },
    { id: '2', vendor: 'Adeola Designs', type: 'Consignment (Fashion)', amount: 125000, status: 'Pending' },
    { id: '3', vendor: 'Lagos Roasters', type: 'Supplier (Cafe)', amount: 85000, status: 'Paid' },
  ];

  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '28px', color: 'var(--cocoa-deep)', margin: '0 0 8px 0' }}>
            Vendor & Instructor Payouts
          </h1>
          <p style={{ color: 'var(--taupe)', margin: 0 }}>
            Review and clear outstanding payables for consignment vendors and guest instructors.
          </p>
        </div>
        <button style={{ background: 'var(--cocoa-deep)', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          Process All Pending
        </button>
      </header>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid rgba(227,211,184,0.5)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(247,239,225,0.3)', borderBottom: '1px solid rgba(227,211,184,0.5)', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: 'var(--taupe)' }}>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Vendor / Payee</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Category</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Amount Owed</th>
              <th style={{ padding: '16px 24px', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout) => (
              <tr key={payout.id} style={{ borderBottom: '1px solid rgba(227,211,184,0.3)' }}>
                <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--cocoa-deep)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <IconUser size={16} color="var(--taupe)" />
                    {payout.vendor}
                  </div>
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--taupe)' }}>{payout.type}</td>
                <td style={{ padding: '16px 24px', color: 'var(--cocoa-deep)', fontWeight: 600 }}>{formatNaira(payout.amount)}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '11px', 
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    background: payout.status === 'Pending' ? '#FFF5E6' : '#EBF5EE',
                    color: payout.status === 'Pending' ? '#A4451F' : '#2E6B3E'
                  }}>
                    {payout.status}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  {payout.status === 'Pending' && (
                    <button style={{ background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
