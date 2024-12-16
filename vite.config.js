import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({
    includeAssets: ["**/*.{png}"],
    registerType: 'autoUpdate',
    injectRegister: false,

    pwaAssets: {
      disabled: false,
      config: true,
    },

    manifest: {
      name: 'Arkanoid',
      short_name: 'ArkBite',
      description: 'Demo version of PWA arkanoid game',
      theme_color: '#484444',
      background_color: '#394dc1',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        {
          src: 'assets/favicons/arkanoid.png',
          sizes: '32x32',
          type: 'image/png'
        },
        {
          src: 'assets/favicons/arkanoid.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'assets/favicons/arkanoid.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },

    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
    },

    devOptions: {
      enabled: true,
      navigateFallback: 'index.html',
      suppressWarnings: true,
      type: 'module',
    },
  })],
})