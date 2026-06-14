import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

declare global {
  interface Window {
    __mmBooted?: () => void;
    __mmShow?: (msg: string) => void;
  }
}

window.__mmBooted?.();

try {
  const root = document.getElementById('root');
  if (!root) throw new Error('#root element not found');
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
} catch (e) {
  window.__mmShow?.('mount failed: ' + ((e as Error)?.stack || e));
  throw e;
}
