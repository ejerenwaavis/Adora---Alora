import { Outlet, useLocation } from 'react-router-dom';
import { useEffect }            from 'react';
import Nav    from './Nav.jsx';
import Footer from './Footer.jsx';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function PageShell() {
  return (
    <>
      <ScrollToTop />
      <Nav />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
