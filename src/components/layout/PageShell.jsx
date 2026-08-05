import { Outlet, useLocation } from 'react-router-dom';
import { useEffect }            from 'react';
import Nav    from './Nav.jsx';
import Footer from './Footer.jsx';

// Scroll to top and trigger scroll reveal on route change
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
      { threshold: 0.1 }
    );

    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    }, 50);

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
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
