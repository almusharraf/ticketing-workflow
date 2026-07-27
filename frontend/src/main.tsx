import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HistoryPage } from './components/HistoryPage';
import './styles.css';

// No router in this app - a plain pathname check is enough for the one
// extra page (audit history) without pulling in a routing library.
const isHistoryPage = window.location.pathname === '/history';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isHistoryPage ? <HistoryPage /> : <App />}
  </React.StrictMode>
);
