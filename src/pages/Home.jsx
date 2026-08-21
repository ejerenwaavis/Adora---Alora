import Hero from '../components/home/Hero.jsx';
import HouseSection from '../components/home/HouseSection.jsx';
import Spotlight from '../components/home/Spotlight.jsx';
import FashionLayers from '../components/home/FashionLayers.jsx';
import VenueGrid from '../components/home/VenueGrid.jsx';
import EventRow from '../components/home/EventRow.jsx';
import VisitPanel from '../components/home/VisitPanel.jsx';

export default function Home() {
  return (
    <>
      <Hero imageSrc="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80" />
      <HouseSection />
      
      <Spotlight
        id="movement"
        eyebrow="Move with intention"
        title="Reformer Pilates, Lagree, and a room built for strength."
        desc="Choose a guided studio session or train independently in the strength room, then return to the rest of the house at your own pace."
        ctaTo="/movement"
        ctaText="View Schedule"
        caption="photography — studio, reformer line"
        imageSrc="/assets/movement.jpg"
      />

      <Spotlight
        id="cafe"
        eyebrow="Stay a while"
        title="Coffee and matcha for slow mornings and working lunches."
        desc="Modern healthy choices meet selected Nigerian flavours — with a complimentary chin chin the moment you're seated."
        ctaTo="/cafe"
        ctaText="Explore the Café"
        reverse={true}
        caption="photography — matcha & morning light"
        imageSrc="/assets/cafe.jpg"
      />

      <Spotlight
        id="fashion"
        eyebrow="A rotating edit"
        title="Archive finds, brand partners, and rotating Raire sellers."
        desc="All curated inside one house — discover what's in store now, or shop the wider edit through Raire."
        ctaTo="/fashion"
        ctaText="Discover Fashion"
        caption="photography — the current edit"
        imageSrc="/assets/fashion-1.jpg"
      />
      <FashionLayers />

      <Spotlight
        id="venue"
        eyebrow="Spaces for gathering"
        title="From intimate celebrations to seminars in The Loft."
        desc="Aora House offers versatile spaces for learning, connection and celebration — adaptable to your occasion."
        ctaTo="/venue-hire"
        ctaText="Enquire About Venue Hire"
        reverse={true}
        caption="photography — The Loft, theatre layout"
        imageSrc="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
      />
      <VenueGrid />

      <EventRow />
      <VisitPanel />
    </>
  );
}
