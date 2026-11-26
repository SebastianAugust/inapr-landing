import { resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { PAGES } from './config/pages.ts'
import { seo } from './config/seo-plugin.ts'

/**
 * Base path situs dari VITE_BASE, dinormalisasi ke "/…/". Kosong = "/" (root domain).
 * Hanya untuk hosting di subfolder; di Vercel biarkan kosong.
 */
function parseBase(raw: string | undefined): string {
  const value = raw?.trim().replace(/^\/+|\/+$/g, '')
  return value ? `/${value}/` : '/'
}

// https://vite.dev/config/
export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    // Multi-page statis (config/pages.json): tanpa fallback SPA; rute situs dipetakan oleh config/pages.ts (dev/preview) dan hosting.
    appType: 'mpa',
    base: parseBase(env.VITE_BASE),
    // Sama untuk build klien dan SSR (prerender) dalam satu `npm run build`; dipakai Footer supaya hidrasi cocok.
    define: { __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()) },
    plugins: [react(), tailwindcss(), seo(env.VITE_SITE_URL)],
    // Proxy dev HANYA bila VITE_API_BASE atau VITE_API_PROXY terisi: /api → backend lokal. Tidak mempengaruhi build.
    server: env.VITE_API_BASE?.trim() || env.VITE_API_PROXY?.trim()
      ? {
          proxy: {
            '/api': { target: env.VITE_API_PROXY?.trim() || 'http://localhost:3000', changeOrigin: true },
          },
        }
      : undefined,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      // Satu masukan HTML per halaman. Build SSR (prerender) memakai masukan sendiri dari CLI.
      rollupOptions: isSsrBuild
        ? undefined
        : { input: Object.fromEntries(PAGES.map((page) => [page.key, resolve(process.cwd(), page.file)])) },
      // Build SSR hanya untuk prerender (scripts/prerender.mjs); public/ tidak perlu disalin.
      copyPublicDir: !isSsrBuild,
      // Chunk terbesar adalah three.js (±535 kB, ±134 kB gzip) untuk latar titik.
      // Chunk itu dimuat dinamis setelah halaman selesai dimuat, bukan bagian bundle awal.
      chunkSizeWarningLimit: 600,
    },
  }
})
