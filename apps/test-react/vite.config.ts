import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

const browserDist = path.resolve('../../packages/decoder-qr-pago-movil/dist/decoder-qr-pago-movil.browser.js')

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'QR Pago Móvil Decoder',
        short_name: 'QR Decoder',
        description: 'Decodifica y genera códigos QR de pago móvil venezolano',
        theme_color: '#302b63',
        background_color: '#0f0c29',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      'decoder-qr-pago-movil': browserDist,
    },
  },
})
