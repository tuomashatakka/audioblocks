import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { componentTagger } from 'lovable-tagger'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host:         '::',
    port:         8080,
    allowedHosts: [
      'f51dfff6-8542-40ae-afe5-3dcd896ee7e9.lovableproject.com',
      '.lovableproject.com' // Allow all subdomains of lovableproject.com
    ],
  },
  plugins: [
    react(),
    // mode === 'development' &&
    // componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))