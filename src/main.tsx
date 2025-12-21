import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { logger } from './utils/logger'

createRoot(document.getElementById('root')!).render(
  <App />,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/js/sw.js')
      .catch((error) => {
        logger.error('Service worker registration failed', error)
      })
  })
}
