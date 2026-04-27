import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const isGithub = mode === 'github'
  const isApache = mode === 'apache'

  const base = isGithub
    ? '/weatherair/'         // https://hpy2github.github.io/weatherair/
    : isApache
    ? '/sandbox/weather-air/' // http://localhost/sandbox/weather-air/
    : '/'                    // npm dev server

  return {
    base,
    server: {
      port: 5173,
      host: true,
      proxy: {
        '/cgi-bin': {
          target: 'http://localhost:80',
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'Weather',
          short_name: 'Weather',
         description: 'Personal weather app. No ads, no tracking.',
          theme_color: '#080d1a',
          background_color: '#080d1a',
          display: 'standalone',
          scope: base,      // ← set correctly per mode
          start_url: base,  // ← set correctly per mode
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          globIgnores: [],
          navigateFallback: 'index.html',
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        },
      }),
    ],
    optimizeDeps: {
      include: [],
    },
  }
})
