// VenueHire page — Phase 2 full implementation
// Accepts section="loft" prop for /venue-hire/the-loft sub-page
export default function VenueHire({ section }) {
  return (
    <div style={{ padding: '8rem var(--gutter)', textAlign: 'center' }}>
      <div className="eyebrow centered">Phase 2</div>
      <h1 style={{ fontSize: '3rem', marginTop: '1rem' }}>
        {section === 'loft' ? 'The Loft' : 'Venue Hire'}
      </h1>
      <p style={{ color: 'var(--cocoa)', marginTop: '1rem' }}>Full page implementation in Phase 2.</p>
    </div>
  );
}
