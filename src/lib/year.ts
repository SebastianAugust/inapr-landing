import { useSyncExternalStore } from 'react'

const subscribeNever = () => () => {}
const currentYear = () => new Date().getFullYear()
const buildYear = () => __BUILD_YEAR__

/**
 * Tahun berjalan. Saat hidrasi (dan prerender) dipakai tahun BUILD (__BUILD_YEAR__, vite.config.ts), sama dengan
 * HTML prerender, jadi tidak ada mismatch; setelah itu React menyamakan ke tahun sekarang.
 */
export function useCurrentYear(): number {
  return useSyncExternalStore(subscribeNever, currentYear, buildYear)
}
