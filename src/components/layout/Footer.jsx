import { useState }    from 'react';
import { Link }        from 'react-router-dom';
import styles          from './Footer.module.css';

const EXPLORE = [
  { to: '/movement',   label: 'Movement'   },
  { to: '/cafe',       label: 'Café'       },
  { to: '/fashion',    label: 'Fashion'    },
  { to: '/events',     label: 'Events'     },
];
const HOUSE = [
  { to: '/our-house',  label: 'Our House'  },
  { to: '/venue-hire', label: 'Venue Hire' },
  { to: '/visit',      label: 'Visit'      },
  { to: '/account',    label: 'Account'    },
];
const CONNECT = [
  { href: 'https://instagram.com', label: 'Instagram' },
  { href: 'https://wa.me/',        label: 'WhatsApp'  },
  { href: 'https://raire.app',     label: 'Raire App' },
];

export default function Footer() {
  const [email,     setEmail]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    setLoading(true);
    // TODO Phase 3: wire to /api/newsletter
    await new Promise(r => setTimeout(r, 600));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <footer className={styles.footer}>
      <div className="wrap">

        {/* Newsletter */}
        <div className={`${styles.newsletter} reveal`}>
          <span className="script">Notes from the House</span>
          <p>New classes, menu drops, seller features and upcoming events — straight to your inbox, roughly twice a month.</p>
          {submitted ? (
            <p className={styles.successMsg}>You're on the list. Welcome to the House.</p>
          ) : (
            <form className={styles.form} onSubmit={handleNewsletter}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className={styles.input}
                aria-label="Email address for newsletter"
              />
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? '…' : 'Join the List'}
              </button>
            </form>
          )}
        </div>

        {/* Footer grid */}
        <div className={styles.grid}>
          <div className={styles.brand}>
            <div className={styles.logo}>Adora <em>&amp;</em> Alora</div>
            <p>A Lagos lifestyle house for movement, food, fashion and community. Curating style, creating community.</p>
          </div>
          <div className={styles.col}>
            <h5>Explore</h5>
            <ul>
              {EXPLORE.map(({ to, label }) => (
                <li key={to}><Link to={to}>{label}</Link></li>
              ))}
            </ul>
          </div>
          <div className={styles.col}>
            <h5>The House</h5>
            <ul>
              {HOUSE.map(({ to, label }) => (
                <li key={to}><Link to={to}>{label}</Link></li>
              ))}
            </ul>
          </div>
          <div className={styles.col}>
            <h5>Connect</h5>
            <ul>
              {CONNECT.map(({ href, label }) => (
                <li key={label}><a href={href} target="_blank" rel="noopener noreferrer">{label}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          <span>© {new Date().getFullYear()} Adora &amp; Alora. All rights reserved.</span>
          <div className={styles.legal}>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/booking-policy">Booking Policy</Link>
            <Link to="/accessibility">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
