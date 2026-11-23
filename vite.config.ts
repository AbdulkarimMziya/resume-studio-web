import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // GitHub Pages serves the site from /resume-studio-web/; the dev server stays at /.
  base: command === 'build' ? '/resume-studio-web/' : '/',
}))
