import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SpeedInsights } from '@vercel/speed-insights/react'
import App from './App.jsx'
import EnvironmentBanner from './components/EnvironmentBanner.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EnvironmentBanner />
    <App />
    <SpeedInsights />
  </StrictMode>,
)
