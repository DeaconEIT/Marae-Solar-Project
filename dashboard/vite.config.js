import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this project at /Marae-Solar-Project/ (a project
  // site, not a custom domain), so asset URLs need that prefix when built
  // in CI. Local dev (`npm run dev`) and `npm run build` outside CI still
  // use the default root path.
  base: process.env.GITHUB_ACTIONS ? '/Marae-Solar-Project/' : '/',
})
