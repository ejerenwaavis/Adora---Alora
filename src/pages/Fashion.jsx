import React, { useState } from 'react';
import styles from './Fashion.module.css';

export default function Fashion() {
  const [activePillar] = useState(0);

  const pillars = [
    {
      id: 'new',
      tag: 'New Edition',
      title: 'NEW',
      subtitle: 'First story.',
      desc: 'Brand-new pieces ready to become part of yours. Directly from contemporary Nigerian designers, independent labels, and curated atelier releases.',
      img: '/assets/hero-editorial-1.jpg'
    },
    {
      id: 'preloved',
      tag: 'Archive Resale',
      title: 'PRE-LOVED',
      subtitle: 'Second story.',
      desc: 'Beautiful pieces looking for their next wardrobe. Standout closet finds preserved in immaculate condition, given a fresh narrative.',
      img: '/assets/fashion-1.jpg'
    },
    {
      id: 'designer',
      tag: 'Verified Luxury',
      title: 'DESIGNER',
      subtitle: 'Worth knowing.',
      desc: 'Luxury pieces with optional third-party physical authentication available for eligible items at checkout.',
      img: '/assets/hero-editorial-2.jpg'
    },
    {
      id: 'vintage',
      tag: 'Rare Artifacts',
      title: 'VINTAGE',
      subtitle: 'Nothing ordinary.',
      desc: 'Pieces with character, timeless silhouettes, rich history, and an unmistakable point of view.',
      img: '/assets/hero-editorial-4.jpg'
    }
  ];

  const experienceSteps = [
    {
      num: '01',
      title: 'DISCOVER',
      desc: 'Explore women’s, men’s and designer fashion with intelligent search, trending styles, and newly dropped curation.'
    },
    {
      num: '02',
      title: 'FOLLOW',
      desc: 'Connect directly with top tastemakers, stylists, and verified sellers across Lagos and beyond.'
    },
    {
      num: '03',
      title: 'LIKE',
      desc: 'Curate your personal wishlist and receive instant notifications whenever prices drop on saved pieces.'
    },
    {
      num: '04',
      title: 'MAKE AN OFFER',
      desc: 'Direct, polite price negotiation. Sellers can accept, decline, or counter in real time before payment.'
    },
    {
      num: '05',
      title: 'BUY & TRACK',
      desc: 'Seamless, protected checkout via card or bank transfer with live order tracking straight to your door.'
    }
  ];

  const journeyNodes = [
    { step: '01', label: 'YOUR CLOSET', sub: 'Listed in minutes with photos & details' },
    { step: '02', label: 'RAIRE HUB', sub: 'Secure courier collection upon sale' },
    { step: '03', label: 'QUALITY CHECK', sub: 'Condition & authenticity verified' },
    { step: '04', label: 'NEW WARDROBE', sub: 'Delivered to its next chapter' }
  ];

  const raireUrl = 'https://raireapp.com';

  const scrollToExplore = () => {
    const el = document.getElementById('introduction');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.pageWrap}>
      
      {/* ─── 01 HERO SECTION ─── */}
      <section className={styles.heroSection}>
        <div className={styles.heroGrid}>
          <div className={styles.heroTitleGroup}>
            <div className={styles.heroTopTag}>
              Aora House Presents
            </div>

            <h1 className={styles.heroWordmark}>RAIRE</h1>
            
            <h2 className={styles.heroSubtitle}>
              Fashion worth keeping.
            </h2>
            
            <p className={styles.heroBody}>
              Nigeria's curated fashion marketplace, introduced through Aora House. Discover new pieces, standout closet finds, pre-loved fashion and verified luxury—all in one place.
            </p>

            <div className={styles.heroCtaRow}>
              <button onClick={scrollToExplore} className={styles.primaryCta}>
                Explore Raire <span style={{ marginLeft: '4px' }}>↓</span>
              </button>
              <a 
                href={raireUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={styles.secondaryCta}
              >
                Download on Raireapp.com <span style={{ fontSize: '0.9rem' }}>↗</span>
              </a>
            </div>
          </div>

          <div className={styles.heroVisualStage}>
            <img 
              src="/assets/fashion-1.jpg" 
              alt="Editorial fashion curation at Aora House" 
              className={styles.heroArchPhoto}
            />
            <div className={styles.heroFloatingPhone}>
              <div className={styles.heroPhoneScreen}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: '0.65rem' }}>RAIRE APP · v1.1.1</span>
                  <span style={{ color: '#2E6B3E', fontWeight: 600, fontSize: '0.65rem' }}>● LIVE</span>
                </div>
                <div style={{ background: '#FAF6EF', borderRadius: '6px', padding: '8px', border: '1px solid #E3D3B8' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--cocoa-deep)' }}>Curated Lagos Feed</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--taupe)', marginTop: '2px' }}>Designer Silk Kimono · ₦145,000</div>
                  <div style={{ marginTop: '6px', display: 'flex', gap: '4px' }}>
                    <span style={{ background: 'var(--rust)', color: '#FFF', padding: '2px 6px', borderRadius: '3px', fontSize: '0.55rem' }}>Make Offer</span>
                    <span style={{ background: '#FFF', border: '1px solid #E3D3B8', padding: '2px 6px', borderRadius: '3px', fontSize: '0.55rem' }}>Message</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroBottomBar}>
          <span>AORA HOUSE × RAIRE</span>
          <span>CURATED MARKETPLACE · LAGOS, NIGERIA</span>
        </div>
      </section>

      {/* ─── 02 THE INTRODUCTION ─── */}
      <section id="introduction" className={styles.introSection}>
        <span className={styles.sectionEyebrow}>Meet Raire</span>
        
        <h2 className={styles.introHeading}>
          Good fashion deserves another life.
        </h2>

        <p className={styles.introBodyQuote}>
          "We believe great fashion shouldn't disappear into the back of a wardrobe just because its first story has ended. Raire connects people with pieces that deserve more time in the world—from brand-new ready-to-wear to carefully selected resale and luxury."
        </p>

        <span className={styles.introNote}>
          We found something we think belongs here.
        </span>
      </section>

      {/* ─── 03 THE MARKETPLACE (4 PILLARS) ─── */}
      <section className={styles.marketplaceSection}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span className={styles.sectionEyebrow}>Four Curated Categories</span>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)', color: 'var(--cocoa-deep)', fontWeight: 400, margin: 0 }}>
            Every piece carries a story.
          </h2>
        </div>

        <div className={styles.pillarsGrid}>
          {pillars.map((pillar) => (
            <div key={pillar.id} className={styles.pillarCard}>
              <div className={styles.pillarImgWrap}>
                <img src={pillar.img} alt={pillar.title} className={styles.pillarImg} />
                <span className={styles.pillarTag}>{pillar.tag}</span>
              </div>
              <div className={styles.pillarContent}>
                <div>
                  <h3 className={styles.pillarTitle}>{pillar.title}</h3>
                  <span className={styles.pillarSub}>{pillar.subtitle}</span>
                  <p className={styles.pillarDesc}>{pillar.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 04 THE RAIRE EXPERIENCE (THE FLOW) ─── */}
      <section className={styles.experienceSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div>
            <span className={styles.sectionEyebrow}>The Experience</span>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--cocoa-deep)', fontWeight: 300, margin: 0 }}>
              Discover differently.
            </h2>
          </div>
          <p style={{ maxWidth: '460px', color: 'var(--taupe)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
            The current app lets shoppers explore women's, men's and designer fashion, along with trending styles, curated collections, new arrivals and standout closet finds.
          </p>
        </div>

        <div className={styles.flowTrack}>
          {experienceSteps.map((step, idx) => (
            <div key={idx} className={styles.flowCard}>
              <div className={styles.flowStepNum}>{step.num}</div>
              <div className={styles.flowStepTitle}>{step.title}</div>
              <div className={styles.flowStepDesc}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 05 THE HUMAN PART (ASK BEFORE YOU BUY) ─── */}
      <section className={styles.humanSection}>
        <div className={styles.humanGrid}>
          <div>
            <span className={styles.sectionEyebrow}>The Human Part</span>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(2rem, 4.2vw, 3.25rem)', color: 'var(--cocoa-deep)', fontWeight: 300, lineHeight: 1.15, marginBottom: '1.5rem' }}>
              Ask before you buy.
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--cocoa)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              Not every fashion decision happens at the checkout. Sometimes you want to know: <em>Does it fit true to size? What's the condition? How does it drape?</em>
            </p>
            <p style={{ fontSize: '0.95rem', color: 'var(--taupe)', lineHeight: 1.65, marginBottom: '2rem' }}>
              Raire lets buyers message sellers directly before purchasing. Buyers can also propose offers, while sellers can accept, decline or counter seamlessly.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--rust)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <span>Direct Conversation · Direct Negotiation</span>
            </div>
          </div>

          <div className={styles.chatCardMockup}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #E3D3B8', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--rust)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                AO
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--cocoa-deep)' }}>Amara Osei</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--taupe)' }}>Verified Wardrobe · Lagos</div>
              </div>
            </div>

            <div className={styles.chatBubbleBuyer}>
              "Hi Amara! Love this piece. Is the silk lining fully intact, and does it fit true to size?"
            </div>

            <div className={styles.chatBubbleSeller}>
              "Hello! Yes, pristine condition. Worn only once for Lagos Fashion Week. Fits UK 10 perfectly!"
            </div>

            <div className={styles.chatBubbleBuyer}>
              "Wonderful. Sending an offer of ₦110,000 for immediate payment."
            </div>

            <div className={styles.offerInteractivePill}>
              <span>Offer Proposed: ₦110,000</span>
              <span style={{ background: '#2E6B3E', color: '#FFF', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>
                Accepted by Seller ✓
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 06 TRUST & VERIFICATION (DARK COCOA TRANSITION) ─── */}
      <section className={styles.trustSection}>
        <div style={{ maxWidth: '840px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.25rem', display: 'block' }}>
            Trust &amp; Verification
          </span>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(2rem, 4.8vw, 3.75rem)', fontWeight: 300, lineHeight: 1.1, margin: '0 0 1.25rem 0', color: '#FFFDF9' }}>
            Beautiful isn't enough.<br />It should also feel right.
          </h2>
          <p style={{ color: 'rgba(220, 203, 178, 0.8)', fontSize: '1.05rem', lineHeight: 1.6, margin: 0 }}>
            Raire adds an uncompromising layer of confidence to Nigeria’s fashion marketplace.
          </p>
        </div>

        <div className={styles.trustGrid}>
          <div className={styles.trustCard}>
            <h3 className={styles.trustCardTitle}>CURATED</h3>
            <p className={styles.trustCardText}>New and resale pieces are selected around strict standards of quality, originality, and aesthetic integrity.</p>
          </div>
          <div className={styles.trustCard}>
            <h3 className={styles.trustCardTitle}>CHECKED</h3>
            <p className={styles.trustCardText}>Purchased items pass through the central Raire Hub for physical quality inspection before doorstep dispatch.</p>
          </div>
          <div className={styles.trustCard}>
            <h3 className={styles.trustCardTitle}>AUTHENTICATED</h3>
            <p className={styles.trustCardText}>Eligible designer pieces have optional third-party authentication available at checkout.</p>
          </div>
          <div className={styles.trustCard}>
            <h3 className={styles.trustCardTitle}>SECURE</h3>
            <p className={styles.trustCardText}>Major Nigerian debit/credit cards and bank transfers supported with escrow buyer protection.</p>
          </div>
        </div>
      </section>

      {/* ─── 07 FLIP THE STORY (SELL ON RAIRE) ─── */}
      <section className={styles.sellerSection}>
        <div className={styles.sellerBox}>
          <div>
            <span className={styles.sectionEyebrow}>Become a Seller</span>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)', color: 'var(--cocoa-deep)', fontWeight: 300, lineHeight: 1.05, marginBottom: '1.5rem' }}>
              What's in your closet?
            </h2>
            <p style={{ fontSize: '1.15rem', color: 'var(--cocoa)', lineHeight: 1.6, fontStyle: 'italic', marginBottom: '2rem' }}>
              "That piece you haven't worn in months might be exactly what someone else has been looking for."
            </p>

            <div className={styles.sellerStepsList}>
              <div className={styles.sellerStepItem}>
                <span className={styles.sellerStepIcon}>1</span>
                <span>Upload your high-res photos</span>
              </div>
              <div className={styles.sellerStepItem}>
                <span className={styles.sellerStepIcon}>2</span>
                <span>Describe your piece and history</span>
              </div>
              <div className={styles.sellerStepItem}>
                <span className={styles.sellerStepIcon}>3</span>
                <span>Set your price &amp; receive offers</span>
              </div>
            </div>

            <div style={{ background: '#FAF6EF', padding: '1rem 1.25rem', borderRadius: '6px', border: '1px solid rgba(227, 211, 184, 0.8)', marginBottom: '2rem', fontSize: '0.88rem', color: 'var(--taupe)' }}>
              <strong style={{ color: 'var(--cocoa-deep)', display: 'block', marginBottom: '3px' }}>No upfront listing fee.</strong>
              Raire currently charges a 10% commission only when an item successfully sells.
            </div>

            <a href={raireUrl} target="_blank" rel="noopener noreferrer" className={styles.primaryCta}>
              Sell on Raire <span style={{ marginLeft: '4px' }}>→</span>
            </a>
          </div>

          <div style={{ position: 'relative' }}>
            <img 
              src="/assets/hero-editorial-3.jpg" 
              alt="Seller curation on Raire" 
              style={{ width: '100%', borderRadius: '12px', boxShadow: '0 20px 40px rgba(42, 29, 20, 0.1)', border: '1px solid rgba(227, 211, 184, 0.8)' }}
            />
          </div>
        </div>
      </section>

      {/* ─── 08 THE JOURNEY ─── */}
      <section className={styles.journeySection}>
        <span className={styles.sectionEyebrow}>The Journey</span>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', color: 'var(--cocoa-deep)', fontWeight: 300, margin: '0 0 1rem 0' }}>
          From your story to someone else's.
        </h2>
        <p style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--taupe)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Raire coordinates collection, inspection and delivery, while buyers and sellers can follow the item's progress through the live order tracker.
        </p>

        <div className={styles.journeyTrack}>
          {journeyNodes.map((node, idx) => (
            <div key={idx} className={styles.journeyNode}>
              <div style={{ fontSize: '0.72rem', color: 'var(--rust)', fontWeight: 700, letterSpacing: '0.12em', marginBottom: '6px' }}>
                STEP {node.step}
              </div>
              <div className={styles.journeyNodeTitle}>{node.label}</div>
              <div className={styles.journeyNodeSub}>{node.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 09 THE APP REVEAL (DARK LUXURY SHOWCASE) ─── */}
      <section className={styles.appRevealSection}>
        <span style={{ color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '1rem' }}>
          Raire, In Your Pocket
        </span>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)', color: '#FCF8F0', fontWeight: 300, margin: '0 0 1rem 0' }}>
          Available now on iPhone.
        </h2>
        <p style={{ color: 'rgba(220, 203, 178, 0.75)', fontSize: '1rem', maxWidth: '520px', margin: '0 auto' }}>
          Free to download. Designed for iOS 15.1 or later. Version 1.1.1 live on the Apple App Store.
        </p>

        <div className={styles.appStageWrap}>
          {/* Floating Pill Badges */}
          <div className={styles.pillsContainer}>
            <div className={`${styles.floatingPillTag} ${styles.tagDiscover}`}>
              ✦ Discover Something New
            </div>
            <div className={`${styles.floatingPillTag} ${styles.tagOffer}`}>
              ✦ Make an Offer
            </div>
            <div className={`${styles.floatingPillTag} ${styles.tagSell}`}>
              ✦ Sell What You No Longer Wear
            </div>
          </div>

          <div className={styles.appHeroPhone}>
            <div className={styles.appScreenInner}>
              <div style={{ background: '#20160F', padding: '14px 18px', color: '#FCF8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--f-display)', fontSize: '1.1rem', letterSpacing: '0.08em' }}>RAIRE</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>Explore Edit</span>
              </div>
              <div style={{ flex: 1, padding: '16px', background: '#FCF8F0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ borderRadius: '8px', overflow: 'hidden', height: '220px', background: '#2B2015', position: 'relative' }}>
                  <img src="/assets/hero-editorial-1.jpg" alt="Raire Feed" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.7)', color: '#FFF', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem' }}>
                    Featured Drop
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ background: '#FFF', padding: '8px', borderRadius: '6px', border: '1px solid #E3D3B8' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--cocoa-deep)' }}>Archive Blazer</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--rust)', fontWeight: 700 }}>₦85,000</div>
                  </div>
                  <div style={{ background: '#FFF', padding: '8px', borderRadius: '6px', border: '1px solid #E3D3B8' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--cocoa-deep)' }}>Woven Tote</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--rust)', fontWeight: 700 }}>₦55,000</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <a 
            href={raireUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.primaryCta}
            style={{ padding: '1.1rem 2.5rem', fontSize: '0.88rem' }}
          >
            Get the App on Raireapp.com ↗
          </a>
        </div>
      </section>

      {/* ─── 10 FINAL AORA HOUSE MOMENT ─── */}
      <section className={styles.finalSection}>
        <span className={styles.sectionEyebrow}>Aora House × Raire</span>
        
        <h2 className={styles.finalDisplay}>
          Keep good<br />fashion moving.
        </h2>

        <p style={{ fontSize: '1.15rem', color: 'var(--cocoa)', maxWidth: '540px', margin: '0 auto 2.5rem', lineHeight: 1.8 }}>
          Discover something new. Find something unexpected.<br />Give something you love another life.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <a href={raireUrl} target="_blank" rel="noopener noreferrer" className={styles.primaryCta}>
            Explore Raire →
          </a>
          <a href={raireUrl} target="_blank" rel="noopener noreferrer" className={styles.secondaryCta}>
            Sell on Raire ↗
          </a>
        </div>

        <span className={styles.finalSignature}>
          Fashion worth keeping.
        </span>
      </section>

    </div>
  );
}
