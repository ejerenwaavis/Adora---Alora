import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Login.module.css';
import HoneypotField from '../components/common/HoneypotField';
import { IconShieldCheck } from '../components/ui/LineIcons';

export default function Login() {
  const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [tempToken, setTempToken] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [honeypot, setHoneypot] = useState({});
  const { login, verify2FA, resend2FA } = useAuth();
  const navigate = useNavigate();

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    
    try {
      const data = await login({ email, password });
      
      if (data.requires2FA) {
        setTempToken(data.tempToken);
        setMaskedEmail(data.maskedEmail || 'your email');
        setStep('2fa');
        return;
      }

      // Redirect based on role
      redirectUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handle2FASubmit(e) {
    e.preventDefault();
    if (!twoFactorCode || twoFactorCode.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const data = await verify2FA({ tempToken, code: twoFactorCode.trim() });
      redirectUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    setError(null);
    setSuccessMsg(null);
    try {
      const data = await resend2FA({ tempToken });
      setSuccessMsg(data.message || 'A new code has been sent to your email.');
    } catch (err) {
      setError(err.message);
    }
  }

  function redirectUser(user) {
    if (['admin', 'content_editor', 'finance'].includes(user.role)) {
      navigate('/admin');
    } else if (user.role === 'clerk') {
      navigate('/clerk');
    } else {
      navigate('/account');
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className="eyebrow centered" style={{ margin: '0 auto 1.5rem' }}>Aora House Security</div>

        {step === 'credentials' ? (
          <>
            <h1 className={styles.title}>Sign In</h1>
            
            {error && <div className={styles.error}>{error}</div>}
            
            <form onSubmit={handleLoginSubmit} className={styles.form}>
              <HoneypotField values={honeypot} onChange={e => setHoneypot({ ...honeypot, [e.target.name]: e.target.value })} />
              
              <div className={styles.field}>
                <label>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  autoComplete="email"
                  placeholder="name@domain.com"
                />
              </div>
              
              <div className={styles.field}>
                <div className={styles.labelRow}>
                  <label>Password</label>
                  <Link to="/forgot-password" className={styles.textLink}>Forgot password?</Link>
                </div>
                <div className={styles.passwordWrapper}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    autoComplete="current-password"
                  />
                  <button 
                    type="button" 
                    className={styles.toggleBtn}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              
              <button type="submit" className={styles.btn} disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className={styles.footer}>
              Don't have an account? <Link to="/register" className={styles.textLink}>Create a new account</Link>
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'inline-flex', padding: '10px', background: 'rgba(200, 155, 74, 0.15)', borderRadius: '50%', marginBottom: '8px' }}>
                <IconShieldCheck size={28} color="var(--gold)" />
              </div>
              <h1 className={styles.title} style={{ margin: '0.2rem 0' }}>Security Verification</h1>
              <p style={{ color: 'var(--taupe)', fontSize: '0.85rem', lineHeight: 1.4, margin: '6px 0 0' }}>
                Enter the 6-digit one-time code sent to <strong>{maskedEmail}</strong>
              </p>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {successMsg && (
              <div style={{ background: '#E8F5E9', border: '1px solid #C8E6C9', color: '#2E7D32', padding: '10px 14px', borderRadius: '4px', marginBottom: '1rem', fontSize: '13px', textAlign: 'center' }}>
                {successMsg}
              </div>
            )}

            <form onSubmit={handle2FASubmit} className={styles.form}>
              <div className={styles.field}>
                <label style={{ textAlign: 'center', display: 'block' }}>6-Digit Security Code</label>
                <input 
                  type="text" 
                  maxLength="6"
                  placeholder="• • • • • •"
                  value={twoFactorCode} 
                  onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))} 
                  required 
                  autoFocus
                  autoComplete="one-time-code"
                  style={{
                    textAlign: 'center',
                    fontSize: '1.75rem',
                    letterSpacing: '0.3em',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'var(--cocoa-deep)'
                  }}
                />
              </div>

              <button type="submit" className={styles.btn} disabled={loading || twoFactorCode.length !== 6}>
                {loading ? 'Verifying...' : 'Verify & Continue →'}
              </button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', fontSize: '0.82rem' }}>
              <button 
                type="button" 
                onClick={handleResendCode}
                style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontWeight: 600, padding: 0 }}
              >
                Resend Code
              </button>
              <button 
                type="button" 
                onClick={() => { setStep('credentials'); setTwoFactorCode(''); setError(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--taupe)', cursor: 'pointer', padding: 0 }}
              >
                ← Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
