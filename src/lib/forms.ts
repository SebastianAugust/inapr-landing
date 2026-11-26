/**
 * Validasi formulir (murni, tanpa teks): mengembalikan kode galat; komponen yang memetakan ke teks kamus
 * (t.form.*). Batas panjang sama dengan yang diwajibkan sisi server (docs/KONTRAK-DATA.md).
 */
export type FieldError =
  | { code: 'required' }
  | { code: 'tooShort'; min: number }
  | { code: 'tooLong'; max: number }
  | { code: 'email' }
  | { code: 'url' }

export const LIMITS = {
  nama: { min: 2, max: 200 },
  institusi: { min: 2, max: 200 },
  email: { max: 254 },
  bukti: { max: 2000 },
} as const

/** Spasi ganda dirapikan, ujung dipangkas. */
export function clean(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function validateText(value: string, min: number, max: number, required: boolean): FieldError | null {
  const text = clean(value)
  if (!text) return required ? { code: 'required' } : null
  if (text.length < min) return { code: 'tooShort', min }
  if (text.length > max) return { code: 'tooLong', max }
  return null
}

/** Cukup longgar (bentuk x@y.zz); validasi sebenarnya ada di server. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function validateEmail(value: string): FieldError | null {
  const text = value.trim()
  if (!text) return { code: 'required' }
  if (text.length > LIMITS.email.max) return { code: 'tooLong', max: LIMITS.email.max }
  return EMAIL.test(text) ? null : { code: 'email' }
}

/** Opsional: kosong boleh; bila diisi harus tautan http(s) maks. 2000 karakter. Tanpa unggah berkas. */
export function validateOptionalUrl(value: string): FieldError | null {
  const text = value.trim()
  if (!text) return null
  if (text.length > LIMITS.bukti.max) return { code: 'tooLong', max: LIMITS.bukti.max }
  try {
    const url = new URL(text)
    return url.protocol === 'https:' || url.protocol === 'http:' ? null : { code: 'url' }
  } catch {
    return { code: 'url' }
  }
}
