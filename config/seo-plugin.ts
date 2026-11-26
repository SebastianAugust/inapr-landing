import type { HtmlTagDescriptor, Plugin } from 'vite'
import { resolve } from 'node:path'
import { PAGES, previewNotFound, routeRewrite, type PageDef } from './pages.ts'

/**
 * JSON-LD Organization. HANYA fakta asli dari situs lama:
 * - name, legalName: inapr.org/logo.html (nama perkumpulan di bawah judul bahasa Inggris)
 * - foundingDate, address: rebuild/docs/KONTEN-LAMA.md
 * Jangan menambah yang lain tanpa sumber. legalName tetap dikonfirmasi ke pengurus.
 */
const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Indonesian Association for Pattern Recognition',
  legalName: 'Perkumpulan Teknologi Pengenalan Pola Indonesia',
  alternateName: 'INAPR',
  foundingDate: '2017',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Jalan Melong Cijerah IV Nomor 14, RT.003/RW 003, Kecamatan Bandung Kulon',
    addressLocality: 'Kota Bandung',
    addressCountry: 'ID',
  },
}

/**
 * SEMENTARA, selama situs masih draf: true = jangan diindeks mesin pencari.
 * - robots.txt berisi "Disallow: /" dan tidak menyebut sitemap
 * - sitemap.xml tidak dibuat
 * - <meta name="robots" content="noindex, nofollow"> dipasang di index.html
 *
 * Saat situs final: ubah ke false DAN hapus header X-Robots-Tag di vercel.json,
 * lalu build/deploy ulang. Langkah lengkap: docs/DEPLOY-VERCEL.md bagian (e).
 */
export const DRAFT_NOINDEX: boolean = true

const OG_IMAGE = { path: 'og.png', width: '1200', height: '630' }
/** Font di atas lipatan: judul (Montserrat 300 untuk h1, 800 untuk aksen/logo) dan isi (Hind Siliguri 400). */
const PRELOAD_FONT = /(montserrat-latin-(300|800)|hind-siliguri-latin-400)-normal-[\w-]+\.woff2$/
/** Sumber chunk engine titik 3D (dimuat dinamis setelah load + idle oleh <PointField />). */
const ENGINE_SOURCE = /\/src\/pointfield\/engine\.ts$/

/**
 * Script anti-flash tema + bahasa untuk halaman selain index.html (index.html memuat salinannya sendiri).
 * Kunci localStorage harus sama dengan src/hooks/useTheme.ts dan src/i18n/useI18n.ts.
 */
const THEME_SCRIPT = `;(function () {
  var root = document.documentElement
  var pref = null
  var lang = null
  try {
    pref = localStorage.getItem('inapr-theme')
    lang = localStorage.getItem('inapr-lang')
  } catch (e) {}
  var theme = pref === 'light' || pref === 'dark' ? pref : null
  if (!theme) {
    var dark = false
    try {
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches
    } catch (e) {}
    theme = dark ? 'dark' : 'light'
  }
  root.setAttribute('data-theme', theme)
  root.setAttribute('lang', lang === 'en' ? 'en' : 'id')
  var bar = theme === 'dark' ? '#250001' : '#f1e9e4'
  var metas = document.querySelectorAll('meta[name="theme-color"]')
  for (var i = 0; i < metas.length; i++) metas[i].setAttribute('content', bar)
})()`

/** Sama dengan <noscript><style> di index.html: sembunyikan kontrol yang butuh JS, tampilkan menu di mobile. */
const NOSCRIPT_STYLE = `<style>.js-only{display:none !important}@media (max-width:767px){#site-menu{display:flex !important;order:3;flex-basis:100%;position:static !important;box-shadow:none !important;border:0 !important;padding:0 0 1rem !important}}</style>`

const NOSCRIPT_NOTICE = `<p class="m-0 border-b border-line bg-soft px-4 py-3 text-center text-[0.92rem] text-ink">JavaScript nonaktif. Isi halaman tetap bisa dibaca; formulir, pencarian, dan pilihan tema/bahasa memerlukan JavaScript. <span lang="en">JavaScript is off: the content stays readable, forms and search need JavaScript.</span></p>`

/**
 * URL situs dari VITE_SITE_URL, dinormalisasi ke "https://host/path/".
 * Kosong → null (tag kanonik/og:url/sitemap tidak dipasang). Tidak valid → build gagal.
 */
export function parseSiteUrl(raw: string | undefined): URL | null {
  const value = raw?.trim()
  if (!value) return null
  let url: URL | null = null
  try {
    url = new URL(value.endsWith('/') ? value : `${value}/`)
  } catch {
    url = null
  }
  if (!url || (url.protocol !== 'https:' && url.protocol !== 'http:')) {
    throw new Error(`VITE_SITE_URL tidak valid: "${value}" (contoh: https://inapr.org)`)
  }
  return url
}

/**
 * Meta SEO yang bergantung pada build/env:
 * - og:image + twitter:image (absolut bila VITE_SITE_URL ada), kanonik + og:url (hanya bila ada);
 *   base build (subfolder) digabungkan bila VITE_SITE_URL tidak memuat path
 * - JSON-LD Organization
 * - preload font judul + isi, dan prefetch chunk engine (hanya build, nama file ber-hash)
 * - robots.txt selalu; sitemap.xml hanya bila VITE_SITE_URL ada dan bukan draf
 * - meta robots noindex selama DRAFT_NOINDEX
 */
export function seo(siteUrl: string | undefined): Plugin {
  const configured = parseSiteUrl(siteUrl)
  let site = configured
  let base = '/'
  const absolute = (path: string) => (site ? new URL(path, site).href : `${base}${path}`)
  let ssr = false

  /** Alamat kanonik halaman: situs + rute tanpa slash awal ("/" = situs itu sendiri). Hanya dipakai bila `site` ada. */
  const pageUrl = (page: PageDef): string =>
    site && page.route && page.route !== '/' ? new URL(page.route.slice(1), site).href : (site?.href ?? '')
  const pageOf = (path: string | undefined): PageDef =>
    PAGES.find((p) => p.file !== 'index.html' && path?.endsWith(`/${p.file}`)) ?? PAGES[0]

  return {
    name: 'inapr-seo',
    configResolved(config) {
      base = config.base
      // Dihosting di subfolder (--base=/landing/ atau VITE_BASE) tetapi VITE_SITE_URL hanya domain
      // (tanpa path): gabungkan base, supaya kanonik/og:url/og:image/sitemap menunjuk ke alamat sebenarnya
      // (https://inapr.org → https://inapr.org/landing/). VITE_SITE_URL yang sudah memuat path dipakai apa adanya.
      site =
        configured && configured.pathname === '/' && base.startsWith('/') && base !== '/'
          ? new URL(base, configured)
          : configured
      ssr = Boolean(config.build.ssr)
    },
    configureServer(server) {
      // Dev: rute situs (/daftar, /kegiatan/abc) dilayani seperti di hosting.
      server.middlewares.use(routeRewrite(base))
    },
    configurePreviewServer(server) {
      server.middlewares.use(routeRewrite(base))
      server.middlewares.use(previewNotFound(base, resolve(server.config.root, server.config.build.outDir)))
    },
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const page = pageOf(ctx.path)
        const home = page.key === 'home'
        const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: 'meta', attrs, injectTo: 'head' })
        const image = absolute(OG_IMAGE.path)
        const tags: HtmlTagDescriptor[] = [
          meta({ property: 'og:image', content: image }),
          meta({ property: 'og:image:width', content: OG_IMAGE.width }),
          meta({ property: 'og:image:height', content: OG_IMAGE.height }),
          meta({ property: 'og:image:alt', content: 'INAPR · Indonesian Association for Pattern Recognition' }),
          meta({ name: 'twitter:image', content: image }),
        ]
        // Draf ATAU halaman yang memang tidak boleh diindeks (formulir, 404): noindex.
        if (DRAFT_NOINDEX || !page.indexable) tags.push(meta({ name: 'robots', content: 'noindex, nofollow' }))
        if (site && page.canonical !== false) {
          const href = pageUrl(page)
          tags.push({ tag: 'link', attrs: { rel: 'canonical', href }, injectTo: 'head' })
          tags.push(meta({ property: 'og:url', content: href }))
        }
        if (home) {
          tags.push({
            tag: 'script',
            attrs: { type: 'application/ld+json' },
            children: JSON.stringify(site ? { ...ORGANIZATION, url: site.href } : ORGANIZATION),
            injectTo: 'head',
          })
        } else {
          // Halaman lain: kepala dokumen yang di index.html ditulis tangan.
          tags.push(
            meta({ name: 'color-scheme', content: 'light dark' }),
            meta({ name: 'theme-color', media: '(prefers-color-scheme: light)', content: '#f1e9e4' }),
            meta({ name: 'theme-color', media: '(prefers-color-scheme: dark)', content: '#250001' }),
            meta({ property: 'og:type', content: 'website' }),
            meta({ property: 'og:site_name', content: 'INAPR' }),
            meta({ property: 'og:locale', content: 'id_ID' }),
            meta({ property: 'og:locale:alternate', content: 'en_GB' }),
            meta({ name: 'twitter:card', content: 'summary_large_image' }),
            { tag: 'link', attrs: { rel: 'icon', type: 'image/svg+xml', href: `${base}favicon.svg` }, injectTo: 'head' },
            { tag: 'link', attrs: { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.png` }, injectTo: 'head' },
            { tag: 'script', children: THEME_SCRIPT, injectTo: 'head-prepend' },
            { tag: 'noscript', children: NOSCRIPT_STYLE, injectTo: 'head' },
            { tag: 'noscript', children: NOSCRIPT_NOTICE, injectTo: 'body-prepend' },
          )
        }
        for (const [file, output] of Object.entries(ctx.bundle ?? {})) {
          // Chunk engine (three.js, ±124 kB brotli) tidak dibutuhkan untuk render pertama, tetapi
          // pasti diminta setelah load + idle. Prefetch = prioritas terendah, mengisi cache lebih awal
          // dan memutus rantai HTML → JS utama → engine. crossorigin = mode yang sama dengan import().
          if (home && output.type === 'chunk' && output.isDynamicEntry && ENGINE_SOURCE.test(output.facadeModuleId ?? '')) {
            tags.push({
              tag: 'link',
              attrs: { rel: 'prefetch', as: 'script', href: `${base}${file}`, crossorigin: '' },
              injectTo: 'head',
            })
          }
          if (PRELOAD_FONT.test(file)) {
            tags.push({
              tag: 'link',
              attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `${base}${file}`, crossorigin: '' },
              injectTo: 'head',
            })
          }
        }
        return tags
      },
    },
    generateBundle() {
      if (ssr) return
      // Sitemap hanya diumumkan bila situs boleh diindeks (lihat DRAFT_NOINDEX), dan hanya memuat halaman indexable.
      const sitemap = DRAFT_NOINDEX ? null : site
      const robots = DRAFT_NOINDEX
        ? ['# Draf: jangan diindeks. Dicabut lewat DRAFT_NOINDEX di config/seo-plugin.ts.', 'User-agent: *', 'Disallow: /']
        : ['User-agent: *', 'Allow: /']
      if (sitemap) robots.push('', `Sitemap: ${new URL('sitemap.xml', sitemap).href}`)
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots.join('\n')}\n` })
      if (sitemap) {
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${PAGES.filter((p) => p.indexable && p.route && p.canonical !== false)
            .map((p) => `  <url><loc>${pageUrl(p)}</loc></url>\n`)
            .join('')}</urlset>\n`,
        })
      }
    },
  }
}
