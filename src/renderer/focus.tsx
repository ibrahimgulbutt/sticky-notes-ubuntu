import React from 'react';
import ReactDOM from 'react-dom/client';
import FocusWidget from './components/FocusWidget';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <FocusWidget />
  </React.StrictMode>
);
