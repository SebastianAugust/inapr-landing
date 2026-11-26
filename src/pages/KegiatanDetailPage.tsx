import { useEffect, useState, useSyncExternalStore } from 'react'
import { Container } from '@/components/Container'
import { RegistrationForm } from '@/components/form/RegistrationForm'
import { LoadNotice } from '@/components/LoadNotice'
import { PageShell } from '@/components/PageShell'
import { Tag } from '@/components/Tag'
import { localizeActivity } from '@/data/activities-local'
import { getActivity } from '@/data/api'
import type { Activity } from '@/data'
import { useI18n } from '@/i18n/useI18n'
import { formatDateRange } from '@/lib/activity'
import { ROUTE } from '@/lib/routes'
import { slideUrl } from '@/lib/slides'
import { buttonGhost, buttonPrimary, card, cx, eyebrow, fieldLabel } from '@/lib/ui'

const subscribeNever = () => () => {}

/**
 * Id kegiatan dari URL: "/kegiatan/{id}" (rute situs, lewat rewrite hosting) atau "?id=" (berkas dibuka langsung).
 * Server/prerender dan render hidrasi pertama memakai null (keadaan "memuat"); id dibaca setelah hidrasi.
 */
function readId(): string | null {
  const fromPath = /\/kegiatan\/([^/?#]+)\/?$/.exec(window.location.pathname)?.[1]
  const raw = fromPath ?? new URLSearchParams(window.location.search).get('id')
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return ''
  }
}

type State = { status: 'loading' } | { status: 'ready'; activity: Activity | null }

/** /kegiatan/{id}: detail satu kegiatan; formulir peserta hanya bila server menyatakan pendaftaran dibuka. */
export function KegiatanDetailPage() {
  const { t } = useI18n()
  const c = t.kegiatanDetail
  const id = useSyncExternalStore(subscribeNever, readId, () => null)
  const [loaded, setLoaded] = useState<{ id: string; state: State } | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    getActivity(id).then(
      (activity) => {
        if (!cancelled) setLoaded({ id, state: { status: 'ready', activity } })
      },
      () => {
        if (!cancelled) setLoaded({ id, state: { status: 'ready', activity: null } })
      },
    )
    return () => {
      cancelled = true
    }
  }, [id])

  // id === '' (tanpa id / tidak valid) langsung "tidak ditemukan"; null = belum dibaca (hidrasi).
  const state: State =
    id === '' ? { status: 'ready', activity: null } : loaded && loaded.id === id ? loaded.state : { status: 'loading' }
  const activity = state.status === 'ready' && state.activity ? localizeActivity(state.activity, t) : null

  // Judul dokumen mengikuti kegiatan dan bahasa.
  useEffect(() => {
    if (state.status !== 'ready') return
    document.title = `${activity ? activity.title : c.notFound.title} · INAPR`
  }, [state.status, activity, c.notFound.title])

  return (
    <PageShell page="kegiatan-detail">
      <Container className="pt-10 pb-16 md:pt-14 md:pb-24">
        <p className="mb-6">
          <a href={ROUTE.kegiatan} className="text-accent underline">
            <span aria-hidden="true">← </span>
            {c.back}
          </a>
        </p>

        {state.status === 'loading' ? (
          <>
            <h1 className="sr-only">{c.kicker}</h1>
            <LoadNotice status="loading" />
          </>
        ) : activity ? (
          <ActivityDetail activity={activity} />
        ) : (
          <section aria-labelledby="kegiatan-nf" className={cx(card, 'grid max-w-2xl gap-3 p-6')}>
            <h1 id="kegiatan-nf" className="text-[clamp(1.6rem,3vw,2.2rem)] font-light">
              {c.notFound.title}
            </h1>
            <p className="m-0">{c.notFound.body}</p>
            <p className="m-0">
              <a href={ROUTE.kegiatan} className={cx(buttonPrimary, 'no-underline')}>
                {c.notFound.cta}
              </a>
            </p>
          </section>
        )}
      </Container>
    </PageShell>
  )
}

function ActivityDetail({ activity }: { activity: Activity }) {
  const { t } = useI18n()
  const c = t.kegiatanDetail
  const locale = t.common.locale
  const range = formatDateRange(activity, locale)
  const materials = activity.materials ? slideUrl(activity.materials) : null
  const rows: [string, string][] = [
    [c.labels.date, range],
    [c.labels.time, activity.time],
    [c.labels.speaker, activity.speaker],
    [c.labels.institution, activity.institution],
    [c.labels.location, activity.location],
  ]
  const shown = rows.filter(([, value]) => value)
  const paragraphs = activity.description.split('\n').filter((line) => line.trim())

  return (
    <article className="grid gap-8">
      <header className="grid gap-3">
        <p className="m-0 flex flex-wrap items-center gap-2">
          <span className={eyebrow}>{c.kicker}</span>
          <Tag>{t.kegiatanPage.kinds[activity.kind]}</Tag>
        </p>
        <h1 className="max-w-[46rem] text-[clamp(1.8rem,3.6vw,2.8rem)] font-light tracking-[-0.02em] break-words">
          {activity.title}
        </h1>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="grid gap-6">
          <dl className={cx(card, 'm-0 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-6')}>
            {shown.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className={cx(fieldLabel, 'sm:pt-1')}>{label}</dt>
                <dd className="m-0 break-words">{label === c.labels.date && activity.date ? <time dateTime={activity.date}>{value}</time> : value}</dd>
              </div>
            ))}
            {shown.length === 0 && <p className="m-0 text-muted">{t.kegiatanPage.undated}</p>}
          </dl>

          {paragraphs.length > 0 ? (
            <div className="grid max-w-[46rem] gap-3">
              {paragraphs.map((line) => (
                <p key={line} className="m-0">
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p className="m-0 text-muted">{c.noDescription}</p>
          )}

          {(activity.youtube || materials) && (
            <div className="flex flex-wrap gap-3">
              {activity.youtube && (
                <a href={activity.youtube} target="_blank" rel="noopener noreferrer" className={cx(buttonPrimary, 'no-underline')}>
                  {c.watch}
                  <span className="sr-only"> ({t.common.newTab})</span>
                </a>
              )}
              {materials && (
                <a href={materials} target="_blank" rel="noopener noreferrer" className={cx(buttonGhost, 'no-underline')}>
                  {c.slides}
                  <span className="sr-only"> ({t.common.newTab})</span>
                </a>
              )}
            </div>
          )}
        </div>

        {activity.registrationOpen && (
          <section aria-labelledby="kegiatan-daftar" className={cx(card, 'grid gap-4 p-5 md:p-6')}>
            <h2 id="kegiatan-daftar" className="text-[1.2rem] font-medium">
              {c.registration.title}
            </h2>
            <RegistrationForm
              idPrefix="peserta"
              endpoint={`activities/${encodeURIComponent(activity.id)}/register`}
              kind="participant"
              fields={c.registration.fields}
              submitLabel={c.registration.submit}
              success={c.registration.success}
            />
          </section>
        )}
      </div>
    </article>
  )
}
