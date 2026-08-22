import { createContext, useContext, useState, useCallback } from 'react';
import styles from '../components/ui/Toast.module.css';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(({ message, type = 'success', title, duration = 4500 }) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
    
    // Default titles based on type if not provided
    const defaultTitle = 
      type === 'success' ? 'Success' :
      type === 'error' ? 'Action Failed' :
      type === 'warning' ? 'Notice' : 'Information';

    const newToast = {
      id,
      message,
      type,
      title: title || defaultTitle,
      duration
    };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }

    return id;
  }, [dismissToast]);

  const toast = {
    success: (message, title) => showToast({ message, title, type: 'success' }),
    error: (message, title) => showToast({ message, title, type: 'error', duration: 6000 }),
    warning: (message, title) => showToast({ message, title, type: 'warning' }),
    info: (message, title) => showToast({ message, title, type: 'info' }),
    dismiss: dismissToast
  };

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, toast }}>
      {children}
      
      {/* Toast Notification Container */}
      <div className={styles.toastContainer} aria-live="polite" aria-atomic="true">
        {toasts.map((t) => {
          const typeClass = 
            t.type === 'error' ? styles.toastError :
            t.type === 'warning' ? styles.toastWarning :
            t.type === 'info' ? styles.toastInfo :
            styles.toastSuccess;

          return (
            <div key={t.id} className={`${styles.toastItem} ${typeClass}`} role="alert">
              <div className={styles.toastIcon}>
                {t.type === 'success' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                )}
                {t.type === 'error' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
                {t.type === 'warning' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                )}
                {t.type === 'info' && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                )}
              </div>

              <div className={styles.toastBody}>
                {t.title && <div className={styles.toastTitle}>{t.title}</div>}
                <div className={styles.toastMessage}>{t.message}</div>
              </div>

              <button 
                type="button" 
                className={styles.toastCloseBtn} 
                onClick={() => dismissToast(t.id)} 
                aria-label="Close notification"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {t.duration > 0 && (
                <div className={styles.progressBar} style={{ animationDuration: `${t.duration}ms` }} />
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback in case used outside of provider
    return {
      toast: {
        success: (msg) => console.log('Toast (success):', msg),
        error: (msg) => console.error('Toast (error):', msg),
        warning: (msg) => console.warn('Toast (warning):', msg),
        info: (msg) => console.info('Toast (info):', msg),
        dismiss: () => {}
      },
      showToast: () => {},
      dismissToast: () => {}
    };
  }
  return context;
}
