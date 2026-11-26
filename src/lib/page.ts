import { createContext, use } from 'react'
import type { PageKey } from '@/lib/routes'

/** Halaman yang sedang dirender; dipasang oleh <PageProvider>. Dipakai Navbar/Footer (bentuk tautan, penanda aktif). */
export const PageContext = createContext<PageKey>('home')

export function usePage(): PageKey {
  return use(PageContext)
}
