import type { ReactNode } from 'react'
import { useI18n } from '@/i18n/useI18n'
import { PageProvider } from '@/components/PageProvider'
import type { PageKey } from '@/lib/routes'
import { Footer } from './Footer'
import { Navbar } from './Navbar'

/**
 * Kerangka halaman selain home: skip link, Navbar, <main> (latar cutting mat statis, tanpa titik 3D), Footer.
 * Halaman ini sengaja ringan: tidak memuat three.js.
 */
export function PageShell({ page, children }: { page: PageKey; children: ReactNode }) {
  const { t } = useI18n()
  return (
    <PageProvider page={page}>
      <a
        href="#main"
        className="sr-only rounded-md bg-accent px-4 py-2 font-heading text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100]"
      >
        {t.common.skipToContent}
      </a>
      <Navbar />
      <main id="main" tabIndex={-1} className="cutting-mat relative isolate min-h-[70svh] outline-none">
        <div className="relative z-10">{children}</div>
      </main>
      <Footer />
    </PageProvider>
  )
}
