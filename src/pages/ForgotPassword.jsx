import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './Login.module.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request password reset');
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className="eyebrow centered" style={{ margin: '0 auto 1.5rem' }}>Adora & Alora</div>
        <h1 className={styles.title}>Reset Password</h1>
        
        {error && <div className={styles.error}>{error}</div>}
        
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '2rem', color: 'var(--taupe)' }}>
              If an account with <strong>{email}</strong> exists, we've sent instructions on how to reset your password.
            </p>
            <Link to="/login" className={styles.btn} style={{ textDecoration: 'none', display: 'inline-block' }}>
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: 'var(--taupe)' }}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div className={styles.field}>
              <label>Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                autoComplete="email"
              />
            </div>
            
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {!success && (
          <div className={styles.footer}>
            Remember your password? <Link to="/login" className={styles.textLink}>Sign in</Link>
          </div>
        )}
      </div>
    </div>
  );
}
