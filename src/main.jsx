import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import Home from './pages/home/Home.jsx'
import PWABadge from './components/ui/pwa-badge/PWABadge.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Home />
    <PWABadge />

  </React.StrictMode>,
)
