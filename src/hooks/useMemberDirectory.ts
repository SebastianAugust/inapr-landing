import { useMemo, useRef, useState } from 'react'
import { getMembers } from '@/data/api'
import { useLazyData } from '@/hooks/useLazyData'
import { fold, matchesAll, queryTerms } from '@/lib/search'

export interface MemberEntry {
  /** Nomor urut di daftar lengkap (1-based), tetap sama saat dicari. */
  n: number
  name: string
  institution: string
  key: string
}

/**
 * Keadaan direktori anggota (dipakai section #anggota dan halaman /anggota): data dimuat saat daftar mendekati
 * layar, pencarian per kata (nama + institusi), paginasi. Hanya nama dan institusi; tidak ada data lain.
 */
export function useMemberDirectory(pageSize: number) {
  const listRef = useRef<HTMLDivElement>(null)
  const state = useLazyData(getMembers, listRef)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const entries = useMemo<MemberEntry[]>(
    () =>
      state.status === 'ready'
        ? state.data.members.map((member, i) => ({
            n: i + 1,
            name: member.name,
            institution: member.institution ?? '',
            key: fold(`${member.name} ${member.institution ?? ''}`),
          }))
        : [],
    [state],
  )
  const hasInstitution = useMemo(() => entries.some((entry) => entry.institution !== ''), [entries])

  const results = useMemo(() => {
    const terms = queryTerms(query)
    return terms.length ? entries.filter((entry) => matchesAll(entry.key, terms)) : entries
  }, [entries, query])

  const pages = Math.max(1, Math.ceil(results.length / pageSize))
  const current = Math.min(page, pages - 1)
  const start = current * pageSize
  const visible = results.slice(start, start + pageSize)

  const onSearch = (value: string) => {
    setQuery(value)
    setPage(0)
  }

  // Ganti halaman dari tombol di bawah: bawa awal daftar kembali ke layar.
  const onPage = (next: number) => {
    setPage(next)
    const el = listRef.current
    if (!el) return
    const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
    if (el.getBoundingClientRect().top < offset) el.scrollIntoView({ block: 'start' })
  }

  return { listRef, state, query, onSearch, results, visible, current, pages, start, onPage, hasInstitution }
}
