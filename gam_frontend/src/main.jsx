import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

const originalError = console.error;
console.error = (...args) => {
  originalError(...args);
  const errorMsg = args.map(a => (a && a.stack) ? a.stack : (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  if (errorMsg.includes('Warning:')) return;
  
  // Create an overlay to show the exact crash reason!
  if (!document.getElementById('debug-error-overlay')) {
    const div = document.createElement('div');
    div.id = 'debug-error-overlay';
    div.style.color = 'red';
    div.style.padding = '20px';
    div.style.fontFamily = 'monospace';
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.zIndex = '999999';
    div.style.background = 'white';
    div.style.border = '2px solid red';
    div.style.maxWidth = '100vw';
    div.style.overflow = 'auto';
    document.body.appendChild(div);
  }
  document.getElementById('debug-error-overlay').innerText += '\n\n' + errorMsg;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
