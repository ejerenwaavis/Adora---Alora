import Hero from '../components/home/Hero.jsx';
import ExploreDoors from '../components/home/ExploreDoors.jsx';
import Spotlight from '../components/home/Spotlight.jsx';
import FashionLayers from '../components/home/FashionLayers.jsx';
import VenueGrid from '../components/home/VenueGrid.jsx';
import EventRow from '../components/home/EventRow.jsx';
import VisitPanel from '../components/home/VisitPanel.jsx';

export default function Home() {
  return (
    <>
      <Hero />
      <ExploreDoors />

      {/* Movement Spotlight */}
      <Spotlight
        id="movement"
        num="01"
        eyebrow="Movement"
        title="A considered approach to fitness."
        desc="Two distinct studios. The Reformer Room for core, control, and precision. The Strength Room for conditioning and high-intensity interval training."
        chips={['Reformer Pilates', 'Lagree', 'Strength', 'Conditioning']}
        ctaTo="/movement"
        ctaText="View the Schedule"
        visualBackground="linear-gradient(135deg, var(--taupe-light) 0%, #D8CFC0 100%)"
        visualSvg={
          <svg viewBox="0 0 200 200" width="45%" aria-hidden="true">
            <circle cx="100" cy="100" r="90" fill="none" stroke="#2B2015" strokeWidth="2" strokeDasharray="4 6" opacity="0.3"/>
            <path d="M40 100 Q 100 20 160 100 T 40 100" fill="none" stroke="#2B2015" strokeWidth="2.5"/>
            <circle cx="100" cy="100" r="8" fill="#A4451F"/>
          </svg>
        }
      />

      {/* Cafe Spotlight */}
      <Spotlight
        id="cafe"
        num="02"
        eyebrow="Café"
        title="Nourish the body. Feed the soul."
        desc="A vibrant, modern menu inspired by global coastal dining. Freshly roasted coffee, ceremonial grade matcha, and plates made to be shared."
        chips={['Coffee', 'Matcha', 'Food', 'Dessert', 'Pastry']}
        ctaTo="/cafe"
        ctaText="Explore the Café"
        reverse={true}
        visualBackground="linear-gradient(160deg, #EFCBA9 0%, #A4451F 100%)"
        visualSvg={
          <svg viewBox="0 0 260 200" width="55%" aria-hidden="true">
            <g stroke="#2B2015" strokeWidth="2.5" fill="#F7EFE1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M70 80h100v50a50 50 0 0 1-100 0Z"/>
              <path d="M170 90h20a20 20 0 0 1 0 40h-20"/>
            </g>
            <g stroke="#2B2015" strokeWidth="2" fill="none" strokeLinecap="round">
              <path d="M92 55c-6 10 10 14 4 24"/>
              <path d="M112 55c-6 10 10 14 4 24"/>
              <path d="M132 55c-6 10 10 14 4 24"/>
            </g>
          </svg>
        }
      />

      {/* Fashion Section */}
      <Spotlight
        id="fashion"
        num="03"
        eyebrow="Fashion"
        title="A rotating edit, not a marketplace."
        desc="Archive finds, independent labels, official brand partners and rotating Raire sellers — all curated inside one house."
        visualBackground="var(--paper)"
        style={{ paddingBottom: '20px' }} // No SVG for this one in the mockup, handled in FashionLayers
      />
      <FashionLayers />

      <VenueGrid />
      <EventRow />
      <VisitPanel />
    </>
  );
}
