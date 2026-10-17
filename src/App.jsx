import { RouterProvider } from 'react-router-dom';
import { router } from './router.jsx';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { ModalProvider } from './contexts/ModalContext.jsx';
import { ToastProvider } from './contexts/ToastContext.jsx';

export default function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ModalProvider>
    </AuthProvider>
  );
}
