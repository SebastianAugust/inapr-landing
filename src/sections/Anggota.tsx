import { LoadNotice } from '@/components/LoadNotice'
import { MemberTable } from '@/components/MemberTable'
import { Pagination } from '@/components/Pagination'
import { SearchField } from '@/components/SearchField'
import { Section, SectionHead } from '@/components/Section'
import { useMemberDirectory } from '@/hooks/useMemberDirectory'
import { useI18n } from '@/i18n/useI18n'
import { ROUTE } from '@/lib/routes'

const PAGE_SIZE = 10

/**
 * #anggota: direktori anggota dari arsip situs lama (src/data/members.json, dimuat lazy).
 * Sumber lokal hanya memuat nama; institusi muncul bila sumber jauh menyediakannya.
 * Direktori penuh: /anggota.
 */
export function Anggota() {
  const { t } = useI18n()
  const c = t.anggota
  const { listRef, state, query, onSearch, results, visible, current, pages, start, onPage, hasInstitution } =
    useMemberDirectory(PAGE_SIZE)

  return (
    <Section id="anggota">
      <SectionHead id="anggota" eyebrow={c.eyebrow} title={c.title} className="mb-6" />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] lg:gap-12">
        <div className="grid content-start gap-5">
          <p className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="font-heading text-[clamp(2.6rem,6vw,3.6rem)] leading-none font-light tabular-nums">
              {c.total}
            </span>
            <span className="leading-snug text-muted">
              {c.totalLabel}
              <br />
              {c.asOf}
            </span>
          </p>
          <p className="text-muted">{c.intro}</p>
          <SearchField
            id="anggota-cari"
            label={c.searchLabel}
            placeholder={c.searchPlaceholder}
            value={query}
            onChange={onSearch}
          />
          <p className="m-0">
            <a href={ROUTE.anggota} className="text-accent underline">
              {t.links.anggotaAll}
            </a>
          </p>
        </div>

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
                  columns={{ ...c.columns, institution: t.anggotaPage.institution }}
                  showInstitution={hasInstitution}
                />
              )}

              <Pagination label={c.paginationLabel} page={current} pages={pages} onChange={onPage} />
            </>
          )}
        </div>
      </div>
    </Section>
  )
}
