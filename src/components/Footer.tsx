import type { ReactNode } from 'react'
import { useI18n } from '@/i18n/useI18n'
import { usePage } from '@/lib/page'
import { ROUTE, sectionHref } from '@/lib/routes'
import { useCurrentYear } from '@/lib/year'
import { Container } from './Container'
import { Placeholder } from './Placeholder'

const linkClass = 'text-bg/85 no-underline hover:text-bg hover:underline'

export function Footer() {
  const { t } = useI18n()
  const page = usePage()
  const year = useCurrentYear()
  const section = (id: string) => sectionHref(page, id)

  return (
    <footer className="relative z-10 bg-ink pt-14 pb-8 text-bg [&_:focus-visible]:outline-titik-3">
      <Container className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
        <div>
          <a
            href={page === 'home' ? '#tentang' : ROUTE.home}
            aria-label={t.nav.home}
            className="inline-flex items-center gap-2.5 rounded font-heading text-[1.05rem] font-extrabold tracking-[0.04em] text-bg no-underline"
          >
            <span aria-hidden="true" className="h-3.5 w-6 rounded-xs bg-[linear-gradient(var(--titik-3)_50%,var(--bg)_50%)]" />
            INAPR
          </a>
          <p className="mt-3 max-w-[22rem] text-bg/85">{t.footer.tagline}</p>
        </div>

        <FooterColumn title={t.footer.explore}>
          <FooterLink href={ROUTE.kegiatan}>{t.nav.items.kegiatan}</FooterLink>
          <FooterLink href={ROUTE.webinar}>{t.navPages.webinar}</FooterLink>
          <FooterLink href={ROUTE.anggota}>{t.nav.items.anggota}</FooterLink>
          <FooterLink href={section('publikasi')}>{t.nav.items.publikasi}</FooterLink>
          <FooterLink href={section('berita')}>{t.nav.items.berita}</FooterLink>
        </FooterColumn>

        <FooterColumn title={t.footer.organization}>
          <FooterLink href={section('tentang')}>{t.nav.items.tentang}</FooterLink>
          <FooterLink href={section('gabung')}>{t.nav.items.gabung}</FooterLink>
          <FooterLink href={ROUTE.daftar}>{t.footerPages.registerLink}</FooterLink>
          <FooterLink href={section('afiliasi')}>{t.footer.affiliation}</FooterLink>
        </FooterColumn>

        <FooterColumn title={t.footer.contact}>
          <li>
            <span className="sr-only">{t.footer.addressLabel}: </span>
            <address className="text-bg/85 not-italic">
              {t.footer.address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
          </li>
          <li className="flex flex-wrap items-center gap-2 text-bg/85">
            {t.footer.email}
            <Placeholder className="border-bg/60 text-bg/85" />
          </li>
          <FooterLink href={ROUTE.kontak}>{t.footerPages.contactPage}</FooterLink>
        </FooterColumn>

        <p className="col-span-full flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-bg/25 pt-5 text-[0.9rem] text-bg/75">
          <span>
            © {year} INAPR · {t.footer.fine}
          </span>
          <a href={ROUTE.privasi} className={linkClass}>
            {t.footerPages.privacy}
          </a>
        </p>
      </Container>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <a href={href} className={linkClass}>
        {children}
      </a>
    </li>
  )
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 font-heading text-[0.8rem] font-medium tracking-[0.12em] text-titik-3 uppercase">
        {title}
      </h2>
      <ul className="m-0 grid list-none gap-1.5 p-0">{children}</ul>
    </div>
  )
}
