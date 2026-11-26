import { useMemo, useRef, useState } from 'react'
import { localizeActivity } from '@/data/activities-local'
import { getActivities } from '@/data/api'
import type { Activity, ActivityKind } from '@/data'
import { useLazyData } from '@/hooks/useLazyData'
import { useI18n } from '@/i18n/useI18n'
import { dateBox, formatDateRange } from '@/lib/activity'
import { activityHref } from '@/lib/routes'
import { fold, matchesAll, queryTerms } from '@/lib/search'
import { buttonGhost, buttonSmall, card, chip, cx, fieldLabel, meta } from '@/lib/ui'
import { DateBox } from './EventCard'
import { LoadNotice } from './LoadNotice'
import { Pagination } from './Pagination'
import { SearchField } from './SearchField'
import { Tag } from './Tag'

const PAGE_SIZE = 10
type Filter = 'all' | ActivityKind
const FILTERS: Filter[] = ['all', 'conference', 'webinar', 'kegiatan']

/**
 * Daftar kegiatan /kegiatan: filter jenis, pencarian, paginasi. Data dari getActivities() (API usulan atau fallback lokal),
 * dimuat saat daftar mendekati layar.
 */
export function ActivityList() {
  const { t } = useI18n()
  const c = t.kegiatanPage
  const rootRef = useRef<HTMLDivElement>(null)
  const state = useLazyData(getActivities, rootRef)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(0)

  const entries = useMemo(
    () =>
      state.status === 'ready'
        ? state.data.items.map((item) => {
            const activity = localizeActivity(item, t)
            return { activity, key: fold(`${activity.title} ${activity.speaker} ${activity.institution} ${activity.location}`) }
          })
        : [],
    [state, t],
  )

  const results = useMemo(() => {
    const terms = queryTerms(query)
    return entries.filter((entry) => (filter === 'all' || entry.activity.kind === filter) && matchesAll(entry.key, terms))
  }, [entries, query, filter])

  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const start = current * PAGE_SIZE
  const visible = results.slice(start, start + PAGE_SIZE)

  // Ganti halaman dari tombol di bawah: bawa awal daftar kembali ke layar.
  const onPage = (next: number) => {
    setPage(next)
    const el = rootRef.current
    if (!el) return
    const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
    if (el.getBoundingClientRect().top < offset) el.scrollIntoView({ block: 'start' })
  }

  return (
    <div ref={rootRef} className="min-h-96">
      <div className="mb-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <SearchField
          id="kegiatan-cari"
          label={c.searchLabel}
          placeholder={c.searchPlaceholder}
          value={query}
          onChange={(value) => {
            setQuery(value)
            setPage(0)
          }}
        />
        <fieldset className="js-only m-0 min-w-0 border-0 p-0">
          <legend className={cx(fieldLabel, 'mb-1.5 p-0')}>{c.filterLabel}</legend>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => {
                  setFilter(value)
                  setPage(0)
                }}
                className={chip}
              >
                {c.filters[value]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {state.status !== 'ready' ? (
        <LoadNotice status={state.status} />
      ) : (
        <>
          <output className="mb-3 block text-[0.92rem] text-muted">
            {results.length ? c.showing(start + 1, start + visible.length, results.length) : c.empty}
          </output>
          <ul className="m-0 grid list-none gap-4 p-0">
            {visible.map(({ activity }) => (
              <li key={activity.id}>
                <ActivityCard activity={activity} />
              </li>
            ))}
          </ul>
          <Pagination label={c.paginationLabel} page={current} pages={pages} onChange={onPage} />
        </>
      )}
    </div>
  )
}

function ActivityCard({ activity }: { activity: Activity }) {
  const { t } = useI18n()
  const c = t.kegiatanPage
  const locale = t.common.locale
  const box = dateBox(activity, locale)
  const range = formatDateRange(activity, locale)
  const place = [activity.speaker, activity.institution, activity.location].filter(Boolean)

  return (
    <article className={cx(card, 'grid gap-4', box && 'grid-cols-[auto_minmax(0,1fr)]')}>
      {box && (
        <div aria-hidden="true">
          <DateBox date={box} />
        </div>
      )}
      <div className="grid min-w-0 content-start gap-1.5">
        <p className="m-0 flex flex-wrap items-center gap-2">
          <Tag>{c.kinds[activity.kind]}</Tag>
          {activity.registrationOpen && <Tag>{c.registrationOpen}</Tag>}
        </p>
        <h2 className="text-[1.1rem] leading-snug font-medium break-words">
          <a href={activityHref(activity.id)} className="text-ink no-underline hover:text-accent hover:underline">
            {activity.title}
          </a>
        </h2>
        <p className={meta}>
          {range ? (
            <time dateTime={activity.date}>{range}</time>
          ) : (
            c.undated
          )}
          {activity.time && ` · ${activity.time}`}
        </p>
        {place.length > 0 && <p className="m-0 text-[0.95rem] break-words">{place.join(' · ')}</p>}
        <p className="m-0 mt-2">
          <a href={activityHref(activity.id)} className={cx(buttonGhost, buttonSmall)}>
            {c.detail}
            <span className="sr-only">: {activity.title}</span>
          </a>
        </p>
      </div>
    </article>
  )
}
