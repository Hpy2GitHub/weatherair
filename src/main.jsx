import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { DebugProvider } from './DebugContext'
import ErrorBoundary from './ErrorBoundary.jsx';
import './design-system.css'
import './legibility-overrides.css'

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <StrictMode>
      <DebugProvider>
         <App />
      </DebugProvider>
    </StrictMode>
  </ErrorBoundary>
)
