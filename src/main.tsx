import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './app/App'
import './index.css'

// Tras un despliegue, el service worker nuevo toma el control al instante, pero la pestaña ya abierta
// seguiría con el bundle anterior del precache. Este registro (modo autoUpdate) recarga la página una
// sola vez cuando se activa una versión nueva, así nadie se queda viendo la versión vieja.
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
