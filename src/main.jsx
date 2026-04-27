import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { DebugProvider } from './DebugContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DebugProvider>
       <App />
    </DebugProvider>
  </StrictMode>
)
