/**
 * Rute SITUS (yang dilihat pengguna) dan helper tautan. Daftar lengkap + padanan rewrite hosting: docs/ROUTING.md.
 *
 * - Tautan antar-halaman SELALU rute situs absolut ("/daftar"), bukan nama berkas ("daftar.html") dan bukan
 *   relatif terhadap base build. Hosting yang memetakannya ke berkas: Vercel (cleanUrls), atau rewrite Next
 *   saat di-embed di base "/landing/".
 * - Aset (gambar, berkas statis) memakai `assetUrl`, yang mengikuti base build.
 */
export type PageKey =
  | 'home'
  | 'daftar'
  | 'kegiatan'
  | 'kegiatan-detail'
  | 'webinar'
  | 'anggota'
  | 'kontak'
  | 'privasi'
  | 'notfound'

export const ROUTE = {
  home: '/',
  daftar: '/daftar',
  kegiatan: '/kegiatan',
  webinar: '/webinar',
  anggota: '/anggota',
  kontak: '/kontak',
  privasi: '/privasi',
} as const

export type SiteRoute = (typeof ROUTE)[keyof typeof ROUTE]

/** Rute situs, opsional dengan anchor ("/", "tentang" → "/#tentang"). */
export function siteHref(route: SiteRoute, hash?: string): string {
  return hash ? `${route}#${hash}` : route
}

/** Detail kegiatan: "/kegiatan/{id}". */
export function activityHref(id: string): string {
  return `/kegiatan/${encodeURIComponent(id)}`
}

/** Anchor section: di home cukup "#id" (scroll dalam halaman), di halaman lain "/#id". */
export function sectionHref(page: PageKey, id: string): string {
  return page === 'home' ? `#${id}` : `/#${id}`
}

/** Alamat aset statis di bawah base build (mis. "/" atau "/landing/"). */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
