import { Container } from '@/components/Container'
import { RegistrationForm } from '@/components/form/RegistrationForm'
import { PageHeader } from '@/components/PageHeader'
import { PageShell } from '@/components/PageShell'
import { Placeholder } from '@/components/Placeholder'
import { useI18n } from '@/i18n/useI18n'
import { card, cx } from '@/lib/ui'

/**
 * /daftar: pendaftaran anggota. Formulir memanggil POST /api/public/registrations (kontrak USULAN,
 * docs/KONTRAK-DATA.md). Tanpa API: pesan "belum aktif" yang jujur, tidak pernah sukses palsu.
 */
export function DaftarPage() {
  const { t } = useI18n()
  const c = t.daftar

  return (
    <PageShell page="daftar">
      <PageHeader eyebrow={c.eyebrow} title={c.title} sub={c.sub} />
      <Container className="grid gap-10 pb-16 md:pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-14">
        <div className={cx(card, 'p-5 md:p-7')}>
          <RegistrationForm
            idPrefix="daftar"
            endpoint="registrations"
            kind="member"
            fields={c.fields}
            submitLabel={c.submit}
            success={c.success}
          />
        </div>

        <aside aria-labelledby="daftar-info" className="grid content-start gap-4">
          <h2 id="daftar-info" className="flex flex-wrap items-center gap-2 text-[1.15rem] font-medium">
            {c.infoTitle} <Placeholder />
          </h2>
          <p className="m-0">{c.infoBody}</p>
          <p className="m-0 flex justify-between gap-4 border-t border-line pt-3.5">
            <span>{c.fee}</span>
            <b className="font-semibold">{t.gabung.fee}</b>
          </p>
        </aside>
      </Container>
    </PageShell>
  )
}
