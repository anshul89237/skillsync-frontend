import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import App from './App';
import { AuthProvider } from './core/AuthContext';
import { ToastContainer } from './shared/Toast';
import { AppErrorBoundary } from './shared/errors/AppErrorBoundary';
import './styles/tailwind.pcss';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <ToastContainer />
          </AuthProvider>
        </BrowserRouter>
      </Provider>
    </AppErrorBoundary>
  </React.StrictMode>
);
