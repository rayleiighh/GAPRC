import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), 
    // CONFIGURATION DE LA PWA (Issue 7)
    VitePWA({
      includeAssets: ['favicon.svg', 'icons.svg', 'apple-touch-icon.png', 'masked-icon.svg'], // On inclut tes SVG existants
      manifest: {
        name: 'Sports Center POS',
        short_name: 'SportsCenter',
        description: 'Application de gestion de caisse et dashboard du Hall Omnisport',
        theme_color: '#dc2626', // Le rouge de ton app
        background_color: '#F8F9FA',
        display: 'standalone', // Cache la barre d'URL pour faire comme une vraie app
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
})