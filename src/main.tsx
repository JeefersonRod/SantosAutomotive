import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log("Santos Auto: App starting...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Santos Auto: Root element not found!");
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log("Santos Auto: Render complete.");
}
