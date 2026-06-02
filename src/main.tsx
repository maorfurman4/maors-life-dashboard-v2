import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { registerSW } from 'virtual:pwa-register'
import { toast } from 'sonner'
import { getRouter } from './router'
import './styles.css'

// ✅ VERSION PROBE — remove after confirming update reached user
const APP_VERSION = 'v2.1-sport-update'

// Auto-reload when a new Service Worker version is available.
// skipWaiting + clientsClaim are set in vite.config.ts so the new SW
// activates immediately — we just need to refresh the page so the browser
// loads the fresh JS/CSS bundles instead of the old precached ones.
registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload()
  },
  onRegisteredSW(_url, registration) {
    // Poll for SW updates every 60 s while the tab is open
    if (registration) {
      setInterval(() => {
        if (navigator.onLine) registration.update().catch(() => {})
      }, 60_000)
    }
  },
})

const router = getRouter()

// Show version toast after first render
setTimeout(() => {
  toast.success(`✅ גרסה עדכנית נטענה — ${APP_VERSION}`, {
    duration: 6000,
    position: 'top-center',
  })
}, 1500)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
