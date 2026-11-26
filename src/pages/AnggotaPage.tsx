import { Container } from '@/components/Container'
import { LoadNotice } from '@/components/LoadNotice'
import { MemberTable } from '@/components/MemberTable'
import { PageHeader } from '@/components/PageHeader'
import { PageShell } from '@/components/PageShell'
import { Pagination } from '@/components/Pagination'
import { SearchField } from '@/components/SearchField'
import { useMemberDirectory } from '@/hooks/useMemberDirectory'
import { useI18n } from '@/i18n/useI18n'

const PAGE_SIZE = 25

/** /anggota: direktori penuh dengan pencarian dan paginasi. Hanya nama dan institusi; tidak ada data sensitif. */
export function AnggotaPage() {
  const { t } = useI18n()
  const c = t.anggota
  const p = t.anggotaPage
  const { listRef, state, query, onSearch, results, visible, current, pages, start, onPage, hasInstitution } =
    useMemberDirectory(PAGE_SIZE)

  return (
    <PageShell page="anggota">
      <PageHeader eyebrow={p.eyebrow} title={p.title} sub={p.sub}>
        <p className="mt-6 flex flex-wrap items-end gap-x-3 gap-y-1">
          <span className="font-heading text-[clamp(2.6rem,6vw,3.6rem)] leading-none font-light tabular-nums">
            {c.total}
          </span>
          <span className="leading-snug text-muted">
            {c.totalLabel} {c.asOf}
          </span>
        </p>
      </PageHeader>
      <Container className="pb-16 md:pb-24">
        <SearchField
          id="anggota-cari"
          label={c.searchLabel}
          placeholder={c.searchPlaceholder}
          value={query}
          onChange={onSearch}
          className="mb-5 max-w-xl"
        />
        <div ref={listRef} className="min-h-80 min-w-0">
          {state.status !== 'ready' ? (
            <LoadNotice status={state.status} />
          ) : (
            <>
              <output className="mb-3 block text-[0.92rem] text-muted">
                {results.length
                  ? c.showing(start + 1, start + visible.length, results.length)
                  : c.empty(query.trim())}
              </output>
              {visible.length > 0 && (
                <MemberTable
                  entries={visible}
                  caption={c.caption}
                  columns={{ ...c.columns, institution: p.institution }}
                  showInstitution={hasInstitution}
                />
              )}
              <Pagination label={c.paginationLabel} page={current} pages={pages} onChange={onPage} />
            </>
          )}
        </div>
      </Container>
    </PageShell>
  )
}
