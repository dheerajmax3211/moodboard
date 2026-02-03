import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/moodboard/', // Must match your GitHub repo name
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
