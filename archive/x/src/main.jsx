import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { DebugProvider } from './DebugContext'
import './design-system.css';
import ErrorBoundary from './ErrorBoundary.jsx';

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <StrictMode>
      <DebugProvider>
         <App />
      </DebugProvider>
    </StrictMode>
  </ErrorBoundary>
)
