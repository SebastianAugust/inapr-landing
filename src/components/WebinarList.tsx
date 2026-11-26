import { useEffect, useMemo, useRef, useState } from 'react'
import type { Webinar } from '@/data'
import { getArchives } from '@/data/api'
import { useLazyData } from '@/hooks/useLazyData'
import { useI18n } from '@/i18n/useI18n'
import { fold, matchesAll, queryTerms } from '@/lib/search'
import { ROUTE } from '@/lib/routes'
import { slideUrl } from '@/lib/slides'
import { buttonGhost, buttonPrimary, buttonSmall, card, chip, cx, fieldLabel, meta } from '@/lib/ui'
import { DateBox } from './EventCard'
import { LoadNotice } from './LoadNotice'
import { Pagination } from './Pagination'
import { SearchField } from './SearchField'

const STEP = 6
/** Ukuran halaman di /webinar (variant "page"). */
const PAGE_SIZE = 12
const ALL = 'all'

interface Entry extends Webinar {
  year: string
  key: string
}

/** Tanggal ISO dibaca sebagai UTC supaya tidak bergeser oleh zona waktu. */
const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`)

/**
 * Daftar webinar (src/data/webinars.json, dimuat lazy): terbaru dulu, pencarian + filter tahun.
 * variant "section" (home): "tampilkan lebih banyak" + tautan ke /webinar. variant "page" (/webinar): paginasi,
 * tanpa judul (h1 halaman sudah ada), judul kartu h2.
 */
export function WebinarList({ variant = 'section' }: { variant?: 'section' | 'page' }) {
  const paged = variant === 'page'
  const { t } = useI18n()
  const c = t.kegiatan.webinar
  const locale = t.common.locale
  const rootRef = useRef<HTMLDivElement>(null)
  // Data dimuat saat daftar mendekati layar, bukan saat halaman dibuka.
  const state = useLazyData(getArchives, rootRef)
  const [query, setQuery] = useState('')
  const [year, setYear] = useState(ALL)
  const [limit, setLimit] = useState(STEP)
  const [pageIndex, setPageIndex] = useState(0)
  // Indeks item pertama yang baru tampil setelah "tampilkan lebih banyak" → diberi fokus.
  const [focusIndex, setFocusIndex] = useState<number | null>(null)
  const focusRef = useRef<HTMLLIElement>(null)

  const entries = useMemo<Entry[]>(
    () =>
      state.status === 'ready'
        ? state.data.items.map((item) => ({
            ...item,
            year: item.date.slice(0, 4),
            key: fold(`${item.title} ${item.speaker} ${item.institution}`),
          }))
        : [],
    [state],
  )
  const years = useMemo(() => [...new Set(entries.map((entry) => entry.year))], [entries])

  const results = useMemo(() => {
    const terms = queryTerms(query)
    return entries.filter((entry) => (year === ALL || entry.year === year) && matchesAll(entry.key, terms))
  }, [entries, query, year])
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const currentPage = Math.min(pageIndex, pages - 1)
  const shown = paged ? results.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE) : results.slice(0, limit)
  const ItemHeading = paged ? 'h2' : 'h4'

  const formats = useMemo(
    () => ({
      month: new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' }),
      monthYear: new Intl.DateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' }),
      full: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
    }),
    [locale],
  )

  useEffect(() => {
    if (focusIndex !== null) focusRef.current?.focus()
  }, [focusIndex])

  const resetList = () => {
    setLimit(STEP)
    setPageIndex(0)
    setFocusIndex(null)
  }

  // Ganti halaman dari tombol di bawah: bawa awal daftar kembali ke layar.
  const onPage = (next: number) => {
    setPageIndex(next)
    const el = rootRef.current
    if (!el) return
    const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
    if (el.getBoundingClientRect().top < offset) el.scrollIntoView({ block: 'start' })
  }

  const oldest = entries.at(-1)
  const range = oldest
    ? `${formats.monthYear.format(asDate(oldest.date))} – ${formats.monthYear.format(asDate(entries[0].date))}`
    : ''

  return (
    <div ref={rootRef} className={paged ? undefined : 'mt-16'}>
      {!paged && <h3 className="text-[clamp(1.3rem,2.2vw,1.6rem)] font-light tracking-[-0.01em]">{c.title}</h3>}
      {range && <p className={cx(meta, 'mt-1')}>{c.summary(entries.length, range)}</p>}

      <div className="mt-5 mb-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <SearchField
          id="webinar-cari"
          label={c.searchLabel}
          placeholder={c.searchPlaceholder}
          value={query}
          onChange={(value) => {
            setQuery(value)
            resetList()
          }}
        />
        {years.length > 1 && (
          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className={cx(fieldLabel, 'mb-1.5 p-0')}>{c.yearLabel}</legend>
            <div className="flex flex-wrap gap-2">
              {[ALL, ...years].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={year === value}
                  onClick={() => {
                    setYear(value)
                    resetList()
                  }}
                  className={chip}
                >
                  {value === ALL ? c.allYears : value}
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </div>

      <div className="min-h-64">
        {state.status !== 'ready' ? (
          <LoadNotice status={state.status} />
        ) : (
          <>
            <output className="mb-3 block text-[0.92rem] text-muted">
              {results.length ? c.showing(shown.length, results.length) : c.empty}
            </output>
            <ul className="m-0 grid list-none gap-4 p-0 lg:grid-cols-2">
              {shown.map((item, i) => {
                const date = asDate(item.date)
                return (
                  <li
                    key={`${item.date}-${item.speaker}`}
                    ref={i === focusIndex ? focusRef : undefined}
                    tabIndex={i === focusIndex ? -1 : undefined}
                    className={cx(card, 'grid grid-cols-[auto_minmax(0,1fr)] gap-4 outline-offset-4')}
                  >
                    <div aria-hidden="true">
                      <DateBox
                        date={{
                          top: `${formats.month.format(date).replace('.', '').slice(0, 3)} ${item.year}`.toUpperCase(),
                          main: String(date.getUTCDate()).padStart(2, '0'),
                        }}
                      />
                    </div>
                    <div className="grid min-w-0 content-start gap-1.5">
                      <ItemHeading className="text-[1.05rem] leading-snug font-medium break-words">{item.title}</ItemHeading>
                      <p className={meta}>
                        <time dateTime={item.date}>{formats.full.format(date)}</time>{item.time && ` · ${item.time}`}
                      </p>
                      <p className="text-[0.95rem] break-words">
                        {item.speaker}
                        {item.institution && <span className="text-muted"> · {item.institution}</span>}
                      </p>
                      <WebinarActions item={item} />
                    </div>
                  </li>
                )
              })}
            </ul>
            {paged ? (
              <Pagination label={t.kegiatanPage.paginationLabel} page={currentPage} pages={pages} onChange={onPage} />
            ) : (
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
                {results.length > shown.length && (
                  <button
                    type="button"
                    className={cx(buttonGhost, 'cursor-pointer')}
                    onClick={() => {
                      setFocusIndex(limit)
                      setLimit((value) => value + STEP)
                    }}
                  >
                    {c.showMore}
                  </button>
                )}
                <a href={ROUTE.webinar} className="text-accent underline">
                  {t.links.webinarAll}
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/** Tonton (YouTube) bila ada; Slide hanya bila ada file DAN VITE_SLIDES_BASE_URL terisi. */
function WebinarActions({ item }: { item: Webinar }) {
  const { t } = useI18n()
  const c = t.kegiatan.webinar
  const slides = item.slides
    .map((file) => slideUrl(file))
    .filter((url): url is string => url !== null)
  const external = t.common.newTab

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {item.youtube ? (
        <a href={item.youtube} target="_blank" rel="noopener noreferrer" className={cx(buttonPrimary, buttonSmall)}>
          {c.watch}
          <span className="sr-only">
            : {item.title} (YouTube, {external})
          </span>
        </a>
      ) : (
        <span className="text-[0.85rem] text-muted">{c.noVideo}</span>
      )}
      {slides.map((url, i) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={cx(buttonGhost, buttonSmall)}
        >
          {slides.length > 1 ? `${c.slide} ${i + 1}` : c.slide}
          <span className="sr-only">
            : {item.title} (PDF, {external})
          </span>
        </a>
      ))}
    </div>
  )
}
