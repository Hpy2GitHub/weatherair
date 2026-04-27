import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const isGithub = mode === 'github'
  const isApache = mode === 'apache'

  const base = isGithub
    ? '/merged-exercise/' 
    : isApache
    ? '/sandbox/exercise2/' 
    : '/'

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
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'], // Fixed: Added array
        manifest: {
          name: 'Exercise Reference',
          short_name: 'Exercises',
          description: 'Browse and reference exercise techniques',
          theme_color: '#4f46e5',
          background_color: '#eff6ff',
          display: 'standalone',
          orientation: 'portrait',
          scope: base,
          start_url: base,
          icons: [], // Fixed: Added empty array placeholder
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          globIgnores: [], 
          navigateFallback: 'index.html',
          // Fixed: Use '*' for multiplication, not 'x'
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, 
        },
      }),
    ],
    optimizeDeps: {
      include: [], // Fixed: Added empty array
    },
  }
})
