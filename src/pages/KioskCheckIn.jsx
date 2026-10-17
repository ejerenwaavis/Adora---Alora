import React, { useState } from 'react';
import axios from 'axios';
import styles from './KioskCheckIn.module.css';

export default function KioskCheckIn() {
  const [lang, setLang] = useState('en');
  const [email, setEmail] = useState('');
  const [bookings, setBookings] = useState([]);
  const [step, setStep] = useState(1); // 1: Email, 2: Bookings, 3: Success
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = {
    en: {
      title: "Welcome to Aora House",
      subtitle: "Enter your email to check in for your class.",
      emailPlaceholder: "Email address",
      findBookings: "Find My Bookings",
      yourClasses: "Your Classes Today",
      checkInBtn: "Check In",
      successTitle: "You're all set!",
      successDesc: "Enjoy your class.",
      startOver: "Start Over",
      noBookings: "No bookings found for today.",
      error: "An error occurred. Please try again.",
      loading: "Loading..."
    },
    es: {
      title: "Bienvenidos a Aora House",
      subtitle: "Ingresa tu correo electrónico para registrarte en tu clase.",
      emailPlaceholder: "Correo electrónico",
      findBookings: "Buscar Mis Reservas",
      yourClasses: "Tus Clases de Hoy",
      checkInBtn: "Registrarse",
      successTitle: "¡Todo listo!",
      successDesc: "Disfruta de tu clase.",
      startOver: "Volver a empezar",
      noBookings: "No se encontraron reservas para hoy.",
      error: "Ocurrió un error. Por favor intenta de nuevo.",
      loading: "Cargando..."
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.get(`/api/bookings/today-by-email?email=${encodeURIComponent(email)}`);
      if (res.data.length === 0) {
        setError(t[lang].noBookings);
      } else {
        setBookings(res.data);
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      setError(t[lang].error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (bookingId) => {
    setError('');
    setLoading(true);
    try {
      await axios.post('/api/bookings/kiosk-check-in', { bookingId });
      setStep(3);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || t[lang].error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setEmail('');
    setBookings([]);
    setError('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.langToggle}>
        <button 
          className={lang === 'en' ? styles.activeLang : ''} 
          onClick={() => setLang('en')}
        >
          EN
        </button>
        <button 
          className={lang === 'es' ? styles.activeLang : ''} 
          onClick={() => setLang('es')}
        >
          ES
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.brandMark}>A&A</div>
        
        {step === 1 && (
          <form onSubmit={handleSearch} className={styles.form}>
            <h1 className={styles.title}>{t[lang].title}</h1>
            <p className={styles.subtitle}>{t[lang].subtitle}</p>
            
            <input 
              className={styles.input}
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder={t[lang].emailPlaceholder} 
              required
            />
            
            {error && <div className={styles.error}>{error}</div>}
            
            <button className={styles.btnPrimary} type="submit" disabled={loading}>
              {loading ? t[lang].loading : t[lang].findBookings}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className={styles.bookings}>
            <h1 className={styles.title}>{t[lang].yourClasses}</h1>
            
            {error && <div className={styles.error}>{error}</div>}
            
            <div className={styles.bookingList}>
              {bookings.map(b => {
                const startTime = new Date(b.classSession.startTime);
                const formattedTime = startTime.toLocaleTimeString(lang === 'es' ? 'es-ES' : 'en-US', {
                  hour: '2-digit', 
                  minute:'2-digit'
                });

                return (
                  <div key={b._id} className={styles.bookingCard}>
                    <div className={styles.classInfo}>
                      <h3 className={styles.className}>{b.classSession.classType.name}</h3>
                      <p className={styles.classDetails}>
                        {formattedTime} • {b.classSession.instructor.name}
                      </p>
                    </div>
                    {b.checkedInAt ? (
                      <button disabled className={styles.btnCheckedIn}>
                        ✓ Checked In
                      </button>
                    ) : (
                      <button 
                        className={styles.btnPrimary} 
                        onClick={() => handleCheckIn(b._id)}
                        disabled={loading}
                      >
                        {loading ? t[lang].loading : t[lang].checkInBtn}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            
            <button className={styles.btnSecondary} onClick={reset}>
              {t[lang].startOver}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.title}>{t[lang].successTitle}</h1>
            <p className={styles.subtitle}>{t[lang].successDesc}</p>
            <button className={styles.btnSecondary} onClick={reset}>
              {t[lang].startOver}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
