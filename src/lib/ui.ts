/** Kelas Tailwind yang dipakai berulang. Bukan library UI, hanya string. */

/**
 * Tombol: hover/focus hanya ganti warna dari token (120ms). Tanpa gerak/transform.
 * Outline fokus tetap dari global.css.
 */
const buttonBase =
  'inline-flex min-h-11 items-center justify-center rounded-md border-2 border-accent px-5 py-2 font-heading text-[0.95rem] font-medium no-underline transition-[color,background-color,border-color] duration-120 ease-out'

/** Tombol utama/CTA. */
export const buttonPrimary = `${buttonBase} bg-accent text-accent-ink hover:bg-transparent hover:text-accent`
export const buttonGhost = `${buttonBase} bg-transparent text-accent hover:bg-soft`
/** Tetap min-h-11 (44px) dari buttonBase; hanya padding dan huruf yang dikecilkan. */
export const buttonSmall = 'px-4 text-[0.85rem]'

/** Tombol pil pilih-satu (pakai aria-pressed). */
export const chip =
  'min-h-11 cursor-pointer rounded-full border border-line bg-bg px-3.5 font-heading text-[0.85rem] font-medium text-muted hover:text-ink aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-bg'

/** Label kecil huruf kapital di atas field. */
export const fieldLabel = 'font-body text-xs font-semibold uppercase tracking-[0.14em] text-muted'

export const eyebrow =
  'font-body text-xs font-semibold uppercase tracking-[0.14em] text-accent'

export const subheading = 'font-sub text-[1.15rem] leading-[1.45] text-muted'

/** Kartu: statis, tanpa efek hover. */
export const card = 'rounded-[10px] border border-line bg-surface p-5'

export const meta = 'text-[0.92rem] text-muted'

export const textLink =
  'border-b-2 border-current font-heading text-[0.95rem] font-medium text-accent no-underline'

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
