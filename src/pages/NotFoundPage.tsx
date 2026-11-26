import { Container } from '@/components/Container'
import { PageShell } from '@/components/PageShell'
import { useI18n } from '@/i18n/useI18n'
import { ROUTE } from '@/lib/routes'
import { buttonGhost, buttonPrimary, cx, eyebrow, subheading } from '@/lib/ui'

/** 404: rute tak dikenal (disajikan hosting sebagai 404.html). */
export function NotFoundPage() {
  const { t } = useI18n()
  const c = t.notFound

  return (
    <PageShell page="notfound">
      <Container className="grid max-w-[46rem] gap-4 py-20 md:py-28">
        <p className={eyebrow}>{c.eyebrow}</p>
        <h1 className="text-[clamp(2rem,4.2vw,3.2rem)] font-light tracking-[-0.025em]">{c.title}</h1>
        <p className={subheading}>{c.body}</p>
        <p className="m-0 mt-3 flex flex-wrap gap-3">
          <a href={ROUTE.home} className={cx(buttonPrimary, 'no-underline')}>
            {c.home}
          </a>
          <a href={ROUTE.kegiatan} className={cx(buttonGhost, 'no-underline')}>
            {c.kegiatan}
          </a>
        </p>
      </Container>
    </PageShell>
  )
}
