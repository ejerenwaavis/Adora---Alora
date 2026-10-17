import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import styles from './Login.module.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing password reset token.');
    }
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }
      
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card} style={{ textAlign: 'center' }}>
          <h1 className={styles.title}>Invalid Link</h1>
          <p style={{ color: 'var(--taupe)', marginBottom: '2rem' }}>{error}</p>
          <Link to="/forgot-password" className={styles.btn} style={{ textDecoration: 'none' }}>
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className="eyebrow centered" style={{ margin: '0 auto 1.5rem' }}>Aora House</div>
        <h1 className={styles.title}>Set New Password</h1>
        
        {error && <div className={styles.error}>{error}</div>}
        
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '2rem', color: 'var(--taupe)' }}>
              Your password has been successfully reset! You can now sign in with your new password.
            </p>
            <Link to="/login" className={styles.btn} style={{ textDecoration: 'none', display: 'inline-block' }}>
              Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>New Password</label>
              <div className={styles.passwordWrapper}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  minLength={8}
                />
                <button 
                  type="button" 
                  className={styles.toggleBtn}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--taupe)', marginTop: '0.5rem', marginBottom: 0 }}>
                Must be at least 8 characters.
              </p>
            </div>
            
            <button type="submit" className={styles.btn} disabled={loading}>
              {loading ? 'Saving...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
