import { Container } from '@/components/Container'
import { PageHeader } from '@/components/PageHeader'
import { PageShell } from '@/components/PageShell'
import { WebinarList } from '@/components/WebinarList'
import { useI18n } from '@/i18n/useI18n'

/** /webinar: arsip webinar penuh (WebinarList varian halaman: pencarian, filter tahun, paginasi). */
export function WebinarPage() {
  const { t } = useI18n()
  const c = t.webinarPage

  return (
    <PageShell page="webinar">
      <PageHeader eyebrow={c.eyebrow} title={c.title} sub={c.sub} />
      <Container className="pb-16 md:pb-24">
        <WebinarList variant="page" />
      </Container>
    </PageShell>
  )
}
