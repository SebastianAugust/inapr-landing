#!/usr/bin/env node
/**
 * Langkah terakhir `npm run build`: render tiap halaman (config/pages.json) ke HTML lewat bundel SSR di
 * dist-ssr/ dan masukkan ke <div id="root"> di dist/{file}. Judul, meta description, og:title dan
 * og:description diisi dari kamus Indonesia. Lalu hapus dist-ssr/.
 */
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SSR_DIR = join(ROOT, 'dist-ssr')
const DIST = join(ROOT, 'dist')
const SLOT = '<div id="root"></div>'
const PAGES = JSON.parse(readFileSync(join(ROOT, 'config', 'pages.json'), 'utf8'))

const escapeAttr = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const escapeText = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;')

/** Ganti nilai content <meta {attr}="{name}"> bila ada; bila tidak ada, sisipkan sebelum </head>. */
function setMeta(html, attr, name, content) {
  const tag = `<meta ${attr}="${name}" content="${escapeAttr(content)}" />`
  const pattern = new RegExp(`<meta +${attr}="${name}"[^>]*>`)
  return pattern.test(html) ? html.replace(pattern, () => tag) : html.replace('</head>', () => `${tag}\n  </head>`)
}

try {
  const { render } = await import(pathToFileURL(join(SSR_DIR, 'entry-server.js')).href)
  let total = 0
  for (const page of PAGES) {
    const file = join(DIST, page.file)
    if (!existsSync(file)) throw new Error(`${page.file} tidak ada di dist/ (periksa config/pages.json dan build klien)`)
    let html = readFileSync(file, 'utf8')
    if (!html.includes(SLOT)) throw new Error(`${SLOT} tidak ditemukan di dist/${page.file}`)
    const { html: app, title, description } = render(page.key)
    html = html.replace(SLOT, () => `<div id="root">${app}</div>`)
    html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escapeText(title)}</title>`)
    html = setMeta(html, 'name', 'description', description)
    html = setMeta(html, 'property', 'og:title', title)
    html = setMeta(html, 'property', 'og:description', description)
    html = setMeta(html, 'name', 'twitter:title', title)
    html = setMeta(html, 'name', 'twitter:description', description)
    writeFileSync(file, html)
    total += Buffer.byteLength(app)
    console.log(`prerender: ${page.file.padEnd(22)} ${(Buffer.byteLength(app) / 1024).toFixed(1)} kB`)
  }
  console.log(`prerender: ${PAGES.length} halaman, ${(total / 1024).toFixed(1)} kB HTML`)
} finally {
  rmSync(SSR_DIR, { recursive: true, force: true })
}
