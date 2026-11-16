import { useSyncExternalStore } from 'react'
import { prefersReducedMotion } from '@/lib/motion'
import { storageGet, storageSet } from '@/lib/storage'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeState {
  preference: ThemePreference
  resolved: ResolvedTheme
}

/** Harus sama dengan script anti-flash di index.html. */
const STORAGE_KEY = 'inapr-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function systemTheme(): ResolvedTheme {
  try {
    return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function readPreference(): ThemePreference {
  const saved = storageGet(STORAGE_KEY)
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system'
}

function resolve(preference: ThemePreference): ThemeState {
  return { preference, resolved: preference === 'system' ? systemTheme() : preference }
}

const IS_BROWSER = typeof document !== 'undefined'
/** Dipakai saat prerender (tanpa DOM). */
const SERVER_STATE: ThemeState = { preference: 'system', resolved: 'light' }

let state: ThemeState = IS_BROWSER ? resolve(readPreference()) : SERVER_STATE
const listeners = new Set<() => void>()

/** Terapkan tema ke <html> dan samakan warna bilah browser (meta theme-color) dengan --bg. */
function applyDocument(resolved: ResolvedTheme): void {
  const root = document.documentElement
  root.setAttribute('data-theme', resolved)
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim()
  if (!bg) return
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.content = bg
  })
}

// Sinkronkan ulang kalau script di index.html gagal jalan.
if (IS_BROWSER) applyDocument(state.resolved)

let transitionTimer = 0

/**
 * Transisi warna singkat (±200ms, lihat .theme-transition di global.css) saat tema
 * berganti. Kelas dipasang di frame yang sama dengan pergantian data-theme, lalu dilepas.
 */
function withColorTransition(change: () => void): void {
  const root = document.documentElement
  if (!prefersReducedMotion()) {
    root.classList.add('theme-transition')
    window.clearTimeout(transitionTimer)
    transitionTimer = window.setTimeout(() => root.classList.remove('theme-transition'), 260)
  }
  change()
}

function commit(next: ThemeState): void {
  const changed = next.resolved !== state.resolved
  state = next
  if (changed) withColorTransition(() => applyDocument(next.resolved))
  else applyDocument(next.resolved)
  listeners.forEach((listener) => listener())
}

function onSystemChange(): void {
  if (state.preference === 'system') commit(resolve('system'))
}

let media: MediaQueryList | null = null

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  if (listeners.size === 1) {
    try {
      media = window.matchMedia(DARK_QUERY)
      media.addEventListener('change', onSystemChange)
    } catch {
      media = null
    }
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      media?.removeEventListener('change', onSystemChange)
      media = null
    }
  }
}

function getSnapshot(): ThemeState {
  return state
}

function getServerSnapshot(): ThemeState {
  return SERVER_STATE
}

export function setThemePreference(preference: ThemePreference): void {
  storageSet(STORAGE_KEY, preference)
  commit(resolve(preference))
}

/**
 * Tema aktif. `preference` = pilihan pengguna (Terang/Gelap/Sistem),
 * `resolved` = tema yang benar-benar dipakai (selalu light/dark).
 */
export function useTheme() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return { ...current, setPreference: setThemePreference }
}
