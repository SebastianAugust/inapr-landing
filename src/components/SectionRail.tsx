import { useActiveSection } from '@/hooks/useScrollState'
import { useI18n } from '@/i18n/useI18n'
import { NAV_IDS } from '@/lib/sections'

/**
 * Rel titik navigasi di tepi kanan (hanya ≥ 1280px, fixed: tidak mengubah tata letak).
 * Satu titik per menu navbar; titik aktif mengikuti section yang sedang dibaca.
 * Nama section tampil sebagai tooltip saat hover (pointer halus) atau fokus keyboard;
 * teksnya selalu ada di DOM (opacity), jadi tetap menjadi nama tautan bagi pembaca layar.
 * Tanpa gerak: tooltip muncul/hilang langsung, titik hanya berganti warna.
 */
export function SectionRail() {
  const { t } = useI18n()
  const active = useActiveSection()

  return (
    <nav
      aria-label={t.nav.railLabel}
      className="fixed top-1/2 right-3 z-40 hidden -translate-y-1/2 xl:block"
    >
      <ul className="m-0 flex list-none flex-col items-end gap-1 p-0">
        {NAV_IDS.map((id) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={active === id ? 'location' : undefined}
              className="group relative grid size-6 place-items-center rounded-full no-underline"
            >
              {/* Absolut: label tak terlihat tidak memperlebar area klik ke atas konten. */}
              <span className="pointer-events-none absolute top-1/2 right-full mr-1 -translate-y-1/2 rounded-md bg-surface/95 px-2 py-0.5 font-body text-xs font-semibold whitespace-nowrap text-ink opacity-0 shadow-sm shadow-ink/10 group-focus-visible:opacity-100 pointer-fine:group-hover:opacity-100">
                {t.nav.items[id]}
              </span>
              <span
                aria-hidden="true"
                className="block size-2.5 rounded-full border border-muted bg-bg transition-[background-color,border-color] duration-120 ease-out group-aria-[current=location]:border-accent group-aria-[current=location]:bg-accent pointer-fine:group-hover:border-accent"
              />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
