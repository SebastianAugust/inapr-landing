import type { MemberEntry } from '@/hooks/useMemberDirectory'

interface MemberTableProps {
  entries: MemberEntry[]
  caption: string
  columns: { no: string; name: string; institution?: string }
  /** Tampilkan kolom institusi (hanya bila sumber memuatnya). */
  showInstitution: boolean
}

/** Daftar anggota: kartu di mobile, tabel di md ke atas. Hanya nama (+ institusi bila ada). */
export function MemberTable({ entries, caption, columns, showInstitution }: MemberTableProps) {
  return (
    <>
      {/* Mobile: kartu. */}
      <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2 md:hidden">
        {entries.map((entry) => (
          <li key={entry.n} className="flex items-baseline gap-3 rounded-lg border border-line bg-surface px-4 py-3">
            <span className="w-8 shrink-0 text-[0.85rem] text-muted tabular-nums">{entry.n}</span>
            <span className="min-w-0 break-words">
              {entry.name}
              {showInstitution && entry.institution && (
                <span className="block text-[0.9rem] text-muted">{entry.institution}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {/* Desktop: tabel. */}
      <div className="overflow-hidden rounded-[10px] border border-line max-md:hidden">
        <table className="w-full border-collapse bg-surface text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-soft">
              <Th className="w-20">{columns.no}</Th>
              <Th>{columns.name}</Th>
              {showInstitution && <Th>{columns.institution ?? ''}</Th>}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.n} className="border-t border-line">
                <td className="px-4 py-2.5 text-muted tabular-nums">{entry.n}</td>
                <td className="px-4 py-2.5">{entry.name}</td>
                {showInstitution && <td className="px-4 py-2.5 text-muted">{entry.institution}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Th({ children, className }: { children: string; className?: string }) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 font-body text-[0.72rem] font-semibold tracking-[0.1em] text-muted uppercase ${className ?? ''}`}
    >
      {children}
    </th>
  )
}
