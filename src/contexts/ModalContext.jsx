import { createContext, useContext, useState } from 'react';
import Modal from '../components/ui/Modal';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    onConfirm: null, 
    type: 'confirm' 
  });

  const confirmAction = (title, message, onConfirm) => {
    setModalConfig({ isOpen: true, title, message, onConfirm, type: 'confirm' });
  };

  const showAlert = (title, message) => {
    setModalConfig({ isOpen: true, title, message, onConfirm: null, type: 'alert' });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ModalContext.Provider value={{ confirmAction, showAlert }}>
      {children}
      <Modal isOpen={modalConfig.isOpen} onClose={closeModal} title={modalConfig.title}>
        <p style={{marginBottom: '1.5rem', color: 'var(--cocoa-deep)', fontFamily: 'var(--f-body)'}}>{modalConfig.message}</p>
        <div style={{display: 'flex', gap: '1rem', justifyContent: 'flex-end'}}>
          <button style={{background: 'transparent', color: 'var(--taupe)', border: '1px solid var(--taupe)', padding: '0.75rem 1.5rem', fontFamily: 'var(--f-body)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '2px'}} onClick={closeModal}>
            {modalConfig.type === 'confirm' ? 'Cancel' : 'OK'}
          </button>
          {modalConfig.type === 'confirm' && (
            <button style={{background: 'var(--rust)', color: 'white', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '2px', cursor: 'pointer', fontFamily: 'var(--f-body)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem'}} onClick={() => { 
              if (modalConfig.onConfirm) modalConfig.onConfirm(); 
              closeModal(); 
            }}>
              Confirm
            </button>
          )}
        </div>
      </Modal>
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
