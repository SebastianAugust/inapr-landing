import type { ReactNode, Ref } from 'react'

/**
 * Ringkasan galat validasi (di atas formulir). Fokus dipindah ke sini saat submit gagal validasi; tiap butir
 * menautkan ke kolomnya.
 */
export function ErrorSummary({
  ref,
  title,
  items,
}: {
  ref?: Ref<HTMLDivElement>
  title: string
  items: { id: string; message: string }[]
}) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      aria-live="assertive"
      className={items.length ? 'rounded-[10px] border-2 border-accent bg-surface p-4 outline-offset-4' : 'sr-only'}
    >
      {items.length > 0 && (
        <>
          <p className="m-0 font-semibold">{title}</p>
          <ul className="m-0 mt-2 grid list-none gap-1 p-0">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-accent underline"
                  onClick={(event) => {
                    event.preventDefault()
                    document.getElementById(item.id)?.focus()
                  }}
                >
                  {item.message}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

/** Kotak status (sukses atau galat kirim). Fokus dipindah ke sini setelah hasil kirim datang. */
export function StatusBox({
  ref,
  tone,
  title,
  children,
}: {
  ref?: Ref<HTMLDivElement>
  tone: 'success' | 'error'
  title: string
  children: ReactNode
}) {
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role={tone === 'success' ? 'status' : 'alert'}
      className={`rounded-[10px] border-2 bg-surface p-5 outline-offset-4 ${tone === 'success' ? 'border-line' : 'border-accent'}`}
    >
      <h2 className="m-0 text-[1.15rem] font-medium">{title}</h2>
      <div className="mt-2 grid gap-3">{children}</div>
    </div>
  )
}
