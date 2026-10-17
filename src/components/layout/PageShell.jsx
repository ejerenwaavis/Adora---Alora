import { Outlet, useLocation } from 'react-router-dom';
import { useEffect }            from 'react';
import Nav    from './Nav.jsx';
import Footer from './Footer.jsx';
import AnnouncementBar from './AnnouncementBar.jsx';

// Scroll to top and trigger subtle scroll reveals on route change and scroll
function ScrollHandler() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const attachReveals = () => {
      // 1. Observe all manually marked reveal items
      document.querySelectorAll('.reveal, [data-reveal]').forEach((el) => {
        observer.observe(el);
      });

      // 2. Automatically apply subtle reveals to all content write-ups, paragraphs, subheaders, and cards
      const autoSelectors = [
        '.section-head',
        '.spotCopy',
        '.spotVisual',
        '.storyGrid > div',
        '.quoteBlock',
        '.storyBody p',
        '.pillarCard',
        '.doorCard',
        '.venueCard',
        '.eventCard',
        '.snapshotCard',
        '.visitPanel',
        '.featureCard'
      ];

      autoSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          if (!el.classList.contains('reveal') && !el.hasAttribute('data-reveal')) {
            el.classList.add('reveal');
          }
          observer.observe(el);
        });
      });
    };

    const timer = setTimeout(attachReveals, 80);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [pathname]);

  return null;
}

export default function PageShell() {
  return (
    <>
      <ScrollHandler />
      <AnnouncementBar />
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
