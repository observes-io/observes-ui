// spa/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // ✅ relative paths instead of `/assets/...`
  build: {
    outDir: 'dist', // where final build goes
    emptyOutDir: true,
  },
})
