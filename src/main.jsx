import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

import Home from 'pages/home/Home'
import PWABadge from 'ui/pwa-badge/PWABadge'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Home />
    <PWABadge />
  </React.StrictMode>
)
