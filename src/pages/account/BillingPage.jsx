import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { IconCheck, IconTicket, IconX, IconClock } from '../../components/ui/LineIcons';
import layoutStyles from './AccountLayout.module.css';
import styles from './BillingPage.module.css';

const ITEMS_PER_PAGE = 8;

function formatNaira(kobo) {
  const naira = Math.round((Number(kobo) || 0) / 100);
  return `₦${naira.toLocaleString()}`;
}

export default function BillingPage() {
  const { user, authFetch, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classCredits, setClassCredits] = useState(user?.classCredits || 0);
  const [activeGrants, setActiveGrants] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Credit Pack Checkout Modal state
  const [packModalOpen, setPackModalOpen] = useState(false);
  const [packs, setPacks] = useState([]);
  const [packsLoading, setPacksLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);

  // Receipt Modal state
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchBillingData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/user/billing');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load billing details');
      setClassCredits(data.classCredits ?? (user?.classCredits || 0));
      setActiveGrants(Array.isArray(data.activeGrants) ? data.activeGrants : []);
      setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      setCurrentPage(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, user?.classCredits]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const openPackModal = async () => {
    setCheckoutError(null);
    setCheckoutSuccess(null);
    setPackModalOpen(true);
    if (packs.length > 0) return;

    setPacksLoading(true);
    try {
      const res = await fetch('/api/classes/credit-packs');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to load studio class packs');
      const list = Array.isArray(data) ? data : (data.packs || []);
      setPacks(list);
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setPacksLoading(false);
    }
  };

  const handlePurchasePack = async (packId) => {
    setPurchasingId(packId);
    setCheckoutError(null);
    try {
      const res = await authFetch('/api/bookings/purchase-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initialize class pack checkout');

      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }

      if (refreshUser) await refreshUser();
      await fetchBillingData();
      setCheckoutSuccess('Class pack credits added to your account.');
      setPackModalOpen(false);
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setPurchasingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(transactions.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div>
      <div className={styles.headerRow}>
        <div>
          <h1 className={layoutStyles.pageTitle}>Passes &amp; Billing</h1>
          <p className={styles.pageSubtitle}>
            Manage your studio class credits, view verified purchase receipts, and track upcoming memberships.
          </p>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {checkoutSuccess && (
        <div
          style={{
            background: 'rgba(46, 107, 62, 0.1)',
            border: '1px solid rgba(46, 107, 62, 0.3)',
            color: '#2E6B3E',
            padding: '0.85rem 1.1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}
        >
          {checkoutSuccess}
        </div>
      )}

      {/* Section 1: Active Class Credits & Top-Up */}
      <section className={layoutStyles.card}>
        <div className={styles.creditsHero}>
          <div>
            <div className={styles.creditsEyebrow}>Movement Studio Wallet</div>
            <h2 className={styles.creditsHeadline}>
              Available Studio Credits:{' '}
              <span className={styles.creditsCount}>{classCredits}</span>
            </h2>
            <p className={styles.creditsSub}>
              Use credits to book reformer pilates, yoga, and breathwork sessions across our weekly timetable.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openPackModal}
            style={{ whiteSpace: 'nowrap' }}
          >
            Purchase Class Passes
          </button>
        </div>

        {activeGrants.length > 0 && (
          <div className={styles.grantsRow}>
            {activeGrants.map((grant) => (
              <div key={grant._id} className={styles.grantPill}>
                <IconTicket style={{ width: '14px', height: '14px', color: 'var(--rust, #A4451F)' }} />
                <span>
                  <strong>{grant.packName || 'Studio Pack'}</strong>: {grant.creditsRemaining}/{grant.creditsGranted} left
                </span>
                {grant.expiresAt && (
                  <span className={styles.grantExpiry}>
                    · Exp {new Date(grant.expiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Order & Credit History */}
      <section className={layoutStyles.card}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Order &amp; Credit History</h2>
          {!loading && transactions.length > 0 && (
            <span className={styles.countPill}>
              {transactions.length} {transactions.length === 1 ? 'Purchase' : 'Purchases'}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--taupe, #9C8770)' }}>
            Loading billing history...
          </div>
        ) : transactions.length === 0 ? (
          <div className={layoutStyles.emptyState}>
            <p style={{ margin: 0, color: 'var(--taupe, #9C8770)', fontSize: '0.95rem' }}>
              No billing history recorded yet.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount (₦)</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx) => (
                    <tr key={tx._id}>
                      <td className={styles.dateCell}>
                        {new Date(tx.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td>
                        <div className={styles.descMain}>{tx.description}</div>
                        <span className={styles.typeTag}>{tx.typeLabel}</span>
                      </td>
                      <td className={styles.amountCell}>{formatNaira(tx.amountKobo)}</td>
                      <td>
                        <span className={styles.statusPaid}>
                          <IconCheck style={{ width: '12px', height: '12px' }} />
                          {tx.status || 'Paid'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={styles.receiptBtn}
                          onClick={() => setSelectedReceipt(tx)}
                        >
                          View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions.length > ITEMS_PER_PAGE && (
              <div className={styles.pagination}>
                <span className={styles.pageInfo}>
                  Showing {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, transactions.length)} of {transactions.length}
                </span>
                <div className={styles.pageControls}>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className={styles.pageInfo} style={{ alignSelf: 'center', padding: '0 0.35rem' }}>
                    Page {safePage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className={styles.pageBtn}
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Section 3: Membership Tiers Teaser Card */}
      <section className={styles.teaserCard}>
        <div>
          <div className={styles.teaserEyebrow}>Phase 2 Membership Preview</div>
          <h2 className={styles.teaserTitle}>Aora House Annual &amp; Monthly Memberships</h2>
          <p className={styles.teaserCopy}>
            Founding memberships and exclusive tiers are rolling out in Phase 2. In the meantime, enjoy full studio
            access via individual drop-ins and multi-class packs.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={openPackModal}
          style={{ whiteSpace: 'nowrap' }}
        >
          Browse Class Packs
        </button>
      </section>

      {/* Credit Pack Checkout Modal */}
      {packModalOpen && (
        <div className={styles.modalOverlay} onClick={() => !purchasingId && setPackModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className="eyebrow" style={{ marginBottom: '0.25rem' }}>Movement Studio Passes</div>
                <h3 className={styles.modalTitle}>Purchase Class Passes</h3>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => !purchasingId && setPackModalOpen(false)}
                aria-label="Close credit pack modal"
              >
                <IconX style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--taupe, #9C8770)', margin: '0 0 1.25rem' }}>
              Select a single drop-in or multi-class pass bundle. Credits activate immediately after Paystack confirmation.
            </p>

            {checkoutError && <div className={styles.errorBox}>{checkoutError}</div>}

            {packsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--taupe, #9C8770)' }}>
                Loading studio class packs...
              </div>
            ) : packs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--taupe, #9C8770)' }}>
                No class packs are currently available. Please check back shortly.
              </div>
            ) : (
              <div className={styles.packList}>
                {packs.map((pack) => {
                  const priceNaira = Math.round((pack.priceKobo || 0) / 100);
                  const perClassNaira = Math.round(priceNaira / (pack.credits || 1));
                  const isFeatured = Boolean(pack.badge) || pack.credits === 5;
                  const badgeText =
                    pack.badge || (pack.credits === 5 ? 'Most Popular' : pack.credits === 10 ? 'Best Value' : '');
                  const isBusy = purchasingId === pack._id;

                  return (
                    <div
                      key={pack._id}
                      className={`${styles.packCard} ${isFeatured ? styles.packCardFeatured : ''}`}
                    >
                      {badgeText && <span className={styles.packBadge}>{badgeText}</span>}
                      <div>
                        <h4 className={styles.packName}>{pack.name}</h4>
                        <div className={styles.packPrice}>₦{priceNaira.toLocaleString()}</div>
                        <div className={styles.packMeta}>
                          {pack.credits} {pack.credits === 1 ? 'Credit' : 'Credits'}
                          {pack.credits > 1 ? ` · ₦${perClassNaira.toLocaleString()} / class` : ''}
                          {' · '}
                          Valid {pack.expiresInDays || 30} days
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary"
                        disabled={Boolean(purchasingId)}
                        onClick={() => handlePurchasePack(pack._id)}
                        style={{ padding: '0.68rem 1.15rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                      >
                        {isBusy ? 'Redirecting...' : 'Select Pack'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className={styles.modalOverlay} onClick={() => setSelectedReceipt(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <div className="eyebrow" style={{ marginBottom: '0.25rem' }}>Aora House Receipt</div>
                <h3 className={styles.modalTitle}>{selectedReceipt.typeLabel}</h3>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedReceipt(null)}
                aria-label="Close receipt modal"
              >
                <IconX style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            <div className={styles.receiptMeta}>
              <div>
                <div className={styles.receiptMetaLabel}>Date</div>
                <div>{new Date(selectedReceipt.date).toLocaleString()}</div>
              </div>
              <div>
                <div className={styles.receiptMetaLabel}>Reference</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{selectedReceipt.reference}</div>
              </div>
              <div>
                <div className={styles.receiptMetaLabel}>Member</div>
                <div>
                  {user?.firstName} {user?.lastName} ({user?.email})
                </div>
              </div>
              <div>
                <div className={styles.receiptMetaLabel}>Payment Status</div>
                <div>
                  <span className={styles.statusPaid}>
                    <IconCheck style={{ width: '12px', height: '12px' }} />
                    {selectedReceipt.status || 'Paid'}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.receiptItems}>
              {(selectedReceipt.items || []).map((item, idx) => (
                <div key={idx} className={styles.receiptItemRow}>
                  <span>
                    {item.name}{' '}
                    <span style={{ color: 'var(--taupe, #9C8770)', fontSize: '0.82rem' }}>
                      ({item.quantity} {item.unitLabel || '×'})
                    </span>
                  </span>
                  <strong>{formatNaira(item.priceKobo)}</strong>
                </div>
              ))}
            </div>

            <div className={styles.receiptTotalRow}>
              <span>Total Paid</span>
              <span>{formatNaira(selectedReceipt.amountKobo)}</span>
            </div>

            {selectedReceipt.meta?.expiresAt && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontSize: '0.82rem',
                  color: 'var(--taupe, #9C8770)',
                  marginBottom: '1.15rem'
                }}
              >
                <IconClock style={{ width: '14px', height: '14px' }} />
                <span>
                  Pass valid until {new Date(selectedReceipt.meta.expiresAt).toLocaleDateString()} (
                  {selectedReceipt.meta.creditsRemaining ?? selectedReceipt.meta.creditsGranted} credits remaining)
                </span>
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => window.print()}
              >
                Print Receipt
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedReceipt(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
