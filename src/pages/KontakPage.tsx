import { Container } from '@/components/Container'
import { PageHeader } from '@/components/PageHeader'
import { PageShell } from '@/components/PageShell'
import { Placeholder } from '@/components/Placeholder'
import { useI18n } from '@/i18n/useI18n'
import { ROUTE } from '@/lib/routes'
import { card, cx, fieldLabel } from '@/lib/ui'

/**
 * /kontak: alamat resmi (rebuild/docs/KONTEN-LAMA.md, sama dengan footer). Email dan telepon belum punya sumber teks
 * (kontak lama berupa gambar), jadi Placeholder. Tanpa formulir.
 */
export function KontakPage() {
  const { t } = useI18n()
  const c = t.kontak

  return (
    <PageShell page="kontak">
      <PageHeader eyebrow={c.eyebrow} title={c.title} sub={c.sub} />
      <Container className="pb-16 md:pb-24">
        <dl className={cx(card, 'm-0 grid max-w-2xl gap-5 p-6')}>
          <div className="grid gap-1.5">
            <dt className={fieldLabel}>{c.addressTitle}</dt>
            <dd className="m-0">
              <address className="not-italic">
                {t.footer.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </dd>
          </div>
          <div className="grid gap-1.5 border-t border-line pt-5">
            <dt className={fieldLabel}>{c.emailLabel}</dt>
            <dd className="m-0 flex flex-wrap items-center gap-2">
              {t.footer.email} <Placeholder />
              <span className="w-full text-[0.9rem] text-muted">{c.pending}</span>
            </dd>
          </div>
          <div className="grid gap-1.5 border-t border-line pt-5">
            <dt className={fieldLabel}>{c.phoneLabel}</dt>
            <dd className="m-0 flex flex-wrap items-center gap-2">
              +00 000 0000 0000 <Placeholder />
              <span className="w-full text-[0.9rem] text-muted">{c.pending}</span>
            </dd>
          </div>
        </dl>
        <p className="mt-6 max-w-2xl text-muted">
          {c.noForm} {c.registerNote.before}
          <a href={ROUTE.daftar} className="text-accent underline">
            {c.registerNote.link}
          </a>
          {c.registerNote.after}
        </p>
      </Container>
    </PageShell>
  )
}
