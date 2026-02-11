import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { TrustProvider } from './contexts/TrustContext'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TrustProvider>
      <App />
    </TrustProvider>
  </StrictMode>,
)
