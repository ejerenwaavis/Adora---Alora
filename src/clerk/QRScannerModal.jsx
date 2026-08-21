import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '../contexts/AuthContext';

export default function QRScannerModal({ onClose }) {
  const { authFetch } = useAuth();
  const [status, setStatus] = useState('Scanning...');
  const [error, setError] = useState('');
  
  useEffect(() => {
    let isMounted = true;
    let html5QrCode = null;
    let isProcessing = false;

    const initScanner = async () => {
      // Delay initialization slightly to handle React 18 Strict Mode's rapid mount/unmount cycle.
      // This ensures the first instance is fully aborted before it mutates the DOM.
      await new Promise(resolve => setTimeout(resolve, 50));
      if (!isMounted) return;

      // Clean out any orphaned children just in case
      const container = document.getElementById("qr-reader");
      if (container && container.hasChildNodes()) {
        container.innerHTML = "";
      }

      html5QrCode = new Html5Qrcode("qr-reader");

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          async (decodedText) => {
            if (isProcessing) return;
            isProcessing = true;
            
            html5QrCode.pause();
            setStatus('Processing...');
            setError('');
            
            try {
              const res = await authFetch('/api/clerk/qr-checkin', {
                method: 'POST',
                body: JSON.stringify({ qrToken: decodedText })
              });
              
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Check-in failed');
              
              setStatus(data.message);
              setTimeout(() => {
                onClose();
                window.location.reload();
              }, 2000);
            } catch (err) {
              if (isMounted) {
                setError(err.message);
                setStatus('Ready');
                setTimeout(() => {
                  if (isMounted) {
                    setError('');
                    setStatus('Scanning...');
                    isProcessing = false;
                    html5QrCode.resume();
                  }
                }, 3000);
              }
            }
          },
          (error) => {
            // ignore scan failures
          }
        );
      } catch (err) {
        if (isMounted) {
          console.error("Camera start failed", err);
          setError('Could not start camera. Please check permissions.');
          setStatus('Error');
        }
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      if (html5QrCode) {
        try {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
          } else {
            html5QrCode.clear();
          }
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      }
    };
  }, [authFetch, onClose]);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(24, 21, 20, 0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
      <div style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--paper)', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', backgroundColor: 'var(--white)', borderBottom: '1px solid var(--line)' }}>
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '20px', color: 'var(--cocoa-deep)', margin: 0 }}>QR Check-in</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', color: 'var(--taupe)', cursor: 'pointer' }}>&times;</button>
        </div>
        
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <p style={{ marginBottom: '16px', color: 'var(--taupe)', fontSize: '13px' }}>
            Hold the guest's digital pass up to the camera.
          </p>
          
          <div style={{ position: 'relative', width: '100%', maxWidth: '300px', margin: '0 auto 16px auto', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#000', minHeight: '220px' }}>
            <div id="qr-reader" style={{ width: '100%', border: 'none' }}></div>
            {status === 'Scanning...' && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '220px', height: '220px', border: '2px solid rgba(200,155,74,0.8)', borderRadius: '16px', pointerEvents: 'none' }}></div>
            )}
          </div>
          
          {error && <div style={{ color: 'var(--alert-red)', fontSize: '13px', marginBottom: '8px', padding: '8px', backgroundColor: 'var(--danger-bg)', borderRadius: '4px', border: '1px solid var(--danger-bd)' }}>{error}</div>}
          <div style={{ color: error ? 'var(--taupe)' : 'var(--ok-green)', fontSize: '16px', fontWeight: 600 }}>
            {status !== 'Scanning...' ? status : 'Scanning...'}
          </div>
        </div>
      </div>
    </div>
  );
}
