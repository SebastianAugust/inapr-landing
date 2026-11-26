import { ActivityList } from '@/components/ActivityList'
import { Container } from '@/components/Container'
import { PageHeader } from '@/components/PageHeader'
import { PageShell } from '@/components/PageShell'
import { useI18n } from '@/i18n/useI18n'

/** /kegiatan: semua kegiatan (konferensi, webinar, kegiatan) dengan filter jenis, pencarian, paginasi. */
export function KegiatanPage() {
  const { t } = useI18n()
  const c = t.kegiatanPage

  return (
    <PageShell page="kegiatan">
      <PageHeader eyebrow={c.eyebrow} title={c.title} sub={c.sub} />
      <Container className="pb-16 md:pb-24">
        <ActivityList />
      </Container>
    </PageShell>
  )
}
