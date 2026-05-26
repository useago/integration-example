import React from 'react';
import ReactDOM from 'react-dom/client';
import { AgoProvider } from '@useago/sdk/react';
import App from './App';
import { agoClient } from './lib/ago';
import './App.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AgoProvider client={agoClient}>
      <App />
    </AgoProvider>
  </React.StrictMode>,
);
