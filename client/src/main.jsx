import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);

// Register Offline PWA Service Worker (Task 113)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // SW registered cleanly
        if (import.meta.env.DEV) {
          console.log('[SW] Registered successfully with scope:', registration.scope);
        }
      })
      .catch((error) => {
        console.warn('[SW] Registration failed:', error);
      });
  });
}
