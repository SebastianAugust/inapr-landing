import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Connect } from 'vite'

/**
 * Daftar halaman situs (config/pages.json): satu berkas HTML per halaman (Vite multi-page).
 * Dibaca juga oleh scripts/prerender.mjs. Rute SITUS (`route`) adalah yang dilihat pengguna;
 * `file` adalah berkas hasil build. Pemetaan rute → berkas di hosting: docs/ROUTING.md.
 */
export interface PageDef {
  key: string
  file: string
  /** Rute situs, mis. "/daftar" atau "/kegiatan/:id". null = halaman 404 (tanpa rute sendiri). */
  route: string | null
  /** false = selalu noindex dan tidak masuk sitemap (formulir, 404). */
  indexable: boolean
  /** false = tanpa <link rel="canonical"> (halaman dinamis / 404). */
  canonical?: boolean
}

export const PAGES: PageDef[] = JSON.parse(readFileSync(new URL('./pages.json', import.meta.url), 'utf8')) as PageDef[]

/** "/kegiatan/abc" → "kegiatan-detail.html"; "/daftar" → "daftar.html"; selain itu null. */
export function fileForRoute(pathname: string): string | null {
  const clean = pathname.replace(/\/+$/, '') || '/'
  if (clean === '/') return 'index.html'
  for (const page of PAGES) {
    if (!page.route || page.route === '/') continue
    const pattern = new RegExp(`^${page.route.replace(/:[A-Za-z]+/g, '[^/]+')}$`)
    if (pattern.test(clean)) return page.file
  }
  return null
}

/**
 * Middleware dev/preview: meniru rewrite hosting (Vercel cleanUrls, atau rewrite Next di docs/ROUTING.md).
 * Rute situs ("/daftar", "/kegiatan/abc") dan versi berawalan base ("/landing/daftar") dipetakan ke
 * `{base}{file}`. Hanya GET/HEAD tanpa ekstensi file.
 */
export function routeRewrite(base: string): Connect.NextHandleFunction {
  const prefix = base.replace(/\/$/, '')
  return (req, _res, next) => {
    if ((req.method !== 'GET' && req.method !== 'HEAD') || !req.url) return next()
    const [rawPath, query = ''] = req.url.split('?', 2)
    let path = rawPath
    if (prefix && (path === prefix || path.startsWith(`${prefix}/`))) path = path.slice(prefix.length) || '/'
    if (path.startsWith('/api/') || /\.[A-Za-z0-9]+$/.test(path)) return next()
    const file = fileForRoute(path)
    if (!file) return next()
    // "/" tanpa base cukup diteruskan; dengan base (embed) arahkan ke {base}index.html.
    const target = file === 'index.html' ? `${base}` : `${base}${file}`
    req.url = query ? `${target}?${query}` : target
    next()
  }
}

/**
 * Hanya preview: rute tak dikenal (tanpa ekstensi, bukan /api) dijawab dengan 404.html hasil build dan status 404,
 * seperti hosting statis. Tanpa ini preview mengirim 404 kosong.
 */
export function previewNotFound(base: string, outDir: string): Connect.NextHandleFunction {
  const prefix = base.replace(/\/$/, '')
  return (req, res, next) => {
    if ((req.method !== 'GET' && req.method !== 'HEAD') || !req.url) return next()
    let path = req.url.split('?', 1)[0]
    if (prefix && (path === prefix || path.startsWith(`${prefix}/`))) path = path.slice(prefix.length) || '/'
    if (path === '/' || path.startsWith('/api/') || /\.[A-Za-z0-9]+$/.test(path) || fileForRoute(path)) return next()
    let html: Buffer
    try {
      html = readFileSync(join(outDir, '404.html'))
    } catch {
      return next()
    }
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.end(req.method === 'HEAD' ? undefined : html)
  }
}
