/**
 * Verifikasi kontras teks terhadap titik pada keadaan MEMBACA (WCAG 2.x).
 *
 * Untuk tiap tema dan tiap warna baca (--titik-baca-1..3 di src/styles/tokens.css) dihitung
 * kontras terburuk antara teks (ink, muted, accent) dan latar yang dicampur SATU titik
 * beropasitas readIntensity (src/config/pointfield.ts), di latar nyata (--mat, latar <main>)
 * maupun --bg. Aturan: ink/muted >= 4,5:1 (teks isi), accent >= 3:1 (judul besar). Selain itu
 * warna baca tidak boleh sama/dekat dengan --ink (jarak CIELAB dE76 >= 25).
 *
 * Jalankan: node scripts/check-reading-contrast.mjs   (keluar dengan kode 1 bila ada yang gagal)
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const tokens = readFileSync(`${root}src/styles/tokens.css`, 'utf8')
const config = readFileSync(`${root}src/config/pointfield.ts`, 'utf8')

const readIntensity = Number(/readIntensity:\s*([\d.]+),\s*\n\s*readSize/.exec(config)?.[1])
if (!Number.isFinite(readIntensity)) throw new Error('readIntensity tidak ditemukan di POINTFIELD_DEFAULTS')

/** Blok deklarasi tema: ':root {' (terang) dan ":root[data-theme='dark'] {" (gelap). */
function block(selector) {
  const start = tokens.indexOf(selector)
  if (start < 0) throw new Error(`blok ${selector} tidak ditemukan`)
  const open = tokens.indexOf('{', start)
  let depth = 0
  for (let i = open; i < tokens.length; i++) {
    if (tokens[i] === '{') depth++
    else if (tokens[i] === '}' && --depth === 0) return tokens.slice(open, i)
  }
  throw new Error(`blok ${selector} tidak ditutup`)
}
const light = block(':root {')
const dark = block(":root[data-theme='dark'] {")
const get = (css, name) => {
  const hex = new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1]
  if (!hex) throw new Error(`token ${name} tidak ditemukan`)
  return hex.toLowerCase()
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const lin = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
const blend = (bg, dot, a) => bg.map((v, i) => v * (1 - a) + dot[i] * a)
function lab(c) {
  const [r, g, b] = c.map(lin)
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047)
  const y = f(0.2126 * r + 0.7152 * g + 0.0722 * b)
  const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}
const dE = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]))

const themes = [
  ['Terang', light],
  ['Gelap', dark],
]
const MIN_DISTANCE = 25
let failed = false
console.log(`I_baca = ${readIntensity} (opasitas satu titik; pointOpacity 0,9 hanya melonggarkan)\n`)
for (const [name, css] of themes) {
  const colors = {
    ink: get(css, '--ink'),
    muted: get(css, '--muted'),
    accent: get(css, '--accent'),
  }
  const backgrounds = { mat: get(css, '--mat'), bg: get(css, '--bg') }
  console.log(`== Tema ${name} ==`)
  for (let i = 1; i <= 3; i++) {
    const dotHex = get(css, `--titik-baca-${i}`)
    const dot = rgb(dotHex)
    const worst = { ink: Infinity, muted: Infinity, accent: Infinity }
    for (const bgHex of Object.values(backgrounds)) {
      const mixed = blend(rgb(bgHex), dot, readIntensity)
      for (const key of Object.keys(worst)) worst[key] = Math.min(worst[key], ratio(rgb(colors[key]), mixed))
    }
    const distance = dE(dot, rgb(colors.ink))
    const checks = [
      ['ink', worst.ink, 4.5],
      ['muted', worst.muted, 4.5],
      ['accent (besar)', worst.accent, 3],
    ]
    const bad = checks.filter(([, value, min]) => value < min)
    if (distance < MIN_DISTANCE) bad.push(['jarak ke ink', distance, MIN_DISTANCE])
    if (bad.length) failed = true
    console.log(
      `  --titik-baca-${i} ${dotHex}: ` +
        checks.map(([label, value, min]) => `${label} ${value.toFixed(2)}${value < min ? ' GAGAL' : ''}`).join(' | ') +
        ` | dE ke ink ${distance.toFixed(0)}${distance < MIN_DISTANCE ? ' GAGAL' : ''}`,
    )
  }
}
console.log(failed ? '\nADA YANG GAGAL' : '\nSemua lolos (ink/muted >= 4,5; accent >= 3; jarak ke ink >= 25).')
process.exit(failed ? 1 : 0)
