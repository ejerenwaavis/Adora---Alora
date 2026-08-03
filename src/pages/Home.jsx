// Home page — full implementation in Phase 2
// This shell ensures routing works and the design system renders correctly at launch.
export default function Home() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '4rem var(--gutter)' }}>
      <div className="eyebrow centered">Coming Soon</div>
      <h1 style={{ fontSize: 'var(--text-hero)', textAlign: 'center', maxWidth: '800px' }}>
        Made for movement,<br />food, fashion <em style={{ color: 'var(--rust)', fontStyle: 'italic' }}>&amp;</em> community.
      </h1>
      <p style={{ color: 'var(--cocoa)', fontSize: '16.5px', maxWidth: '560px', textAlign: 'center', marginTop: '1rem' }}>
        A Lagos lifestyle house where wellbeing, style and connection live under one roof — made by a mother and daughter, for everyday ritual.
      </p>
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <a href="/movement" className="btn btn-primary">Book a Class <span className="btn-arrow">→</span></a>
        <a href="/our-house" className="btn btn-outline">Explore the House</a>
      </div>
    </div>
  );
}
