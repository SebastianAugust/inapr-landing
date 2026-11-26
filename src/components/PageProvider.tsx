import type { ReactNode } from 'react'
import { PageContext } from '@/lib/page'
import type { PageKey } from '@/lib/routes'

export function PageProvider({ page, children }: { page: PageKey; children: ReactNode }) {
  return <PageContext value={page}>{children}</PageContext>
}
