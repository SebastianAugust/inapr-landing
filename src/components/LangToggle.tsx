import { ensureLang, useI18n } from '@/i18n/useI18n'
import type { Lang } from '@/i18n/types'
import { SegmentedToggle } from './SegmentedToggle'

const OPTIONS: { value: Lang; label: string }[] = [
  { value: 'id', label: 'ID' },
  { value: 'en', label: 'EN' },
]

export function LangToggle() {
  const { t, lang, setLang } = useI18n()

  // Ganti bahasa langsung, tanpa animasi.
  // Kamus Inggris dimuat malas: tunggu siap DULU, baru ganti (teks lama tetap tampil sampai itu,
  // jadi tidak ada kedip). Gagal muat → bahasa tidak berubah.
  const change = async (next: Lang) => {
    if (await ensureLang(next)) setLang(next)
  }

  return <SegmentedToggle label={t.nav.langLabel} options={OPTIONS} value={lang} onChange={change} />
}
