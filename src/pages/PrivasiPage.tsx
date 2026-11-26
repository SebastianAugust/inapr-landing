import { Container } from '@/components/Container'
import { PageHeader } from '@/components/PageHeader'
import { PageShell } from '@/components/PageShell'
import { Placeholder } from '@/components/Placeholder'
import { useI18n } from '@/i18n/useI18n'
import { ROUTE } from '@/lib/routes'

/** /privasi: DRAF kebijakan privasi. Wajib ditinjau pengurus sebelum rilis (penanda di atas halaman). */
export function PrivasiPage() {
  const { t } = useI18n()
  const c = t.privasi

  return (
    <PageShell page="privasi">
      <PageHeader eyebrow={c.eyebrow} title={c.title}>
        <p
          role="note"
          className="mt-5 inline-block max-w-full rounded-md border-2 border-accent bg-surface px-4 py-2 text-[0.95rem] font-semibold tracking-wide text-accent uppercase"
        >
          {c.draftNotice}
        </p>
      </PageHeader>
      <Container className="grid max-w-[52rem] gap-8 pb-16 md:pb-24">
        {c.sections.map((section, index) => (
          <section key={section.title} aria-labelledby={`privasi-${index}`} className="grid gap-2.5">
            <h2 id={`privasi-${index}`} className="flex flex-wrap items-center gap-2 text-[1.25rem] font-medium">
              {section.title}
              {section.placeholder && <Placeholder />}
            </h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="m-0">
                {paragraph}
              </p>
            ))}
            {section.list && (
              <ul className="m-0 grid list-disc gap-1.5 pl-5">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
        <p className="m-0 text-[0.92rem] text-muted">
          {c.updated} <a href={ROUTE.kontak} className="text-accent underline">{t.footerPages.contactPage}</a>
        </p>
      </Container>
    </PageShell>
  )
}
