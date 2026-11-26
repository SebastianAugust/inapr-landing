import type { ComponentType } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'
import { id } from './i18n/id'
import type { PageKey } from './lib/routes'
import { AnggotaPage } from './pages/AnggotaPage'
import { DaftarPage } from './pages/DaftarPage'
import { KegiatanDetailPage } from './pages/KegiatanDetailPage'
import { KegiatanPage } from './pages/KegiatanPage'
import { KontakPage } from './pages/KontakPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PrivasiPage } from './pages/PrivasiPage'
import { WebinarPage } from './pages/WebinarPage'

const PAGES: Record<PageKey, ComponentType> = {
  home: App,
  daftar: DaftarPage,
  kegiatan: KegiatanPage,
  'kegiatan-detail': KegiatanDetailPage,
  webinar: WebinarPage,
  anggota: AnggotaPage,
  kontak: KontakPage,
  privasi: PrivasiPage,
  notfound: NotFoundPage,
}

/**
 * Prerender saat build (lihat scripts/prerender.mjs): HTML statis Bahasa Indonesia untuk satu halaman
 * dimasukkan ke #root supaya halaman langsung terbaca sebelum JS jalan (dan tanpa JS).
 * Di browser, src/bootstrap.tsx menghidrasi HTML ini (bahasa tersimpan id) atau, bila bahasa tersimpan en,
 * merender ulang dengan createRoot. Isi harus tetap sama dengan render pertama klien (lihat getServerSnapshot
 * di useI18n/useTheme dan tahun: __BUILD_YEAR__), kalau tidak React melaporkan hydration mismatch.
 * Mengembalikan juga judul + deskripsi (Bahasa Indonesia) untuk <title>/meta halaman itu.
 */
export function render(page: PageKey): { html: string; title: string; description: string } {
  const Component = PAGES[page]
  const meta = page === 'home' ? id.meta : id.pageMeta[page]
  return { html: renderToString(<Component />), title: meta.title, description: meta.description }
}
