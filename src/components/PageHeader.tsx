import type { ReactNode } from 'react'
import type { Title } from '@/i18n/types'
import { eyebrow as eyebrowClass, subheading } from '@/lib/ui'
import { AccentTitle } from './AccentTitle'
import { Container } from './Container'

interface PageHeaderProps {
  eyebrow: string
  title: Title
  sub?: ReactNode
  /** id untuk h1 (dipakai aria-labelledby bila perlu). */
  titleId?: string
  children?: ReactNode
}

/** Kepala halaman (eyebrow + h1 + subjudul) di atas isi. Satu h1 per halaman. */
export function PageHeader({ eyebrow, title, sub, titleId, children }: PageHeaderProps) {
  return (
    <Container className="pt-12 pb-8 md:pt-16 md:pb-10">
      <p className={eyebrowClass}>{eyebrow}</p>
      <h1
        id={titleId}
        className="mt-3 mb-4 max-w-[46rem] text-[clamp(2rem,4.2vw,3.2rem)] font-light tracking-[-0.025em]"
      >
        <AccentTitle title={title} />
      </h1>
      {sub && <p className={`${subheading} max-w-[46rem]`}>{sub}</p>}
      {children}
    </Container>
  )
}
