import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// リポジトリ名に合わせて変更してください
const REPO_NAME = '/mission-board/'

export default defineConfig({
  base: REPO_NAME,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'ミッションボード',
        short_name: 'ミッションボード',
        description: '親子で使うタスク・ルーティン管理アプリ',
        theme_color: '#2E75B6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: REPO_NAME,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // firebase-messaging-sw.js は FCM が管理するため Workbox のキャッシュ対象外にする
        globIgnores: ['**/firebase-messaging-sw.js'],
        // Sheets APIのレスポンスをキャッシュ（最大5分）
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/sheets\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'sheets-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            }
          }
        ]
      }
    })
  ]
})
