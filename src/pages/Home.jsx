import Hero from '../components/home/Hero.jsx';
import Intro from '../components/home/Intro.jsx';
import ExploreDoors from '../components/home/ExploreDoors.jsx';
import Spotlight from '../components/home/Spotlight.jsx';
import FashionLayers from '../components/home/FashionLayers.jsx';
import VenueGrid from '../components/home/VenueGrid.jsx';
import HouseSnapshots from '../components/home/HouseSnapshots.jsx';
import EventRow from '../components/home/EventRow.jsx';
import VisitPanel from '../components/home/VisitPanel.jsx';

export default function Home() {
  return (
    <>
      <Hero />
      <Intro />
      <ExploreDoors />
      
      {/* Cafe Spotlight */}
      <Spotlight
        id="cafe"
        num="01"
        eyebrow="Café"
        title="Nourish the body. Feed the soul."
        desc="A vibrant, modern menu inspired by global coastal dining. Freshly roasted coffee, ceremonial grade matcha, and plates made to be shared."
        chips={['Coffee', 'Matcha', 'Food', 'Dessert', 'Pastry']}
        ctaTo="/cafe"
        ctaText="Explore the Café"
        imageSrc="/assets/cafe.jpg"
      />

      {/* Movement Spotlight */}
      <Spotlight
        id="movement"
        num="02"
        eyebrow="Movement"
        title="A considered approach to fitness."
        desc="Two distinct studios. The Reformer Room for core, control, and precision. The Strength Room for conditioning and high-intensity interval training."
        chips={['Reformer Pilates', 'Lagree', 'Strength', 'Conditioning']}
        ctaTo="/movement"
        ctaText="View the Schedule"
        reverse={true}
        imageSrc="/assets/movement.jpg"
      />

      {/* Fashion Section */}
      <Spotlight
        id="fashion"
        num="03"
        eyebrow="Fashion"
        title="A rotating edit, not a marketplace."
        desc="Archive finds, independent labels, official brand partners and rotating Raire sellers — all curated inside one house."
        chips={['Archive Finds', 'Raire Vintage', 'Designers', 'Curated Edit']}
        ctaTo="/fashion"
        ctaText="Explore Fashion"
        imageSrc="/assets/fashion-1.jpg"
      />
      <FashionLayers />

      <VenueGrid />
      <HouseSnapshots />
      <EventRow />
      <VisitPanel />
    </>
  );
}
