import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { installStartupMonitoring } from './utils/startupMonitoring';
import App from './App';

installStartupMonitoring();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found — cannot mount React app.');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
