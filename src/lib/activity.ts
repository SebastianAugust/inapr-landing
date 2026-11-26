import type { Activity } from '@/data'
import type { EventDate } from '@/i18n/types'

/** Tanggal ISO dibaca sebagai UTC supaya tidak bergeser oleh zona waktu. */
const asDate = (iso: string) => new Date(`${iso}T00:00:00Z`)

/** "7 September 2018" atau, untuk beberapa hari, "26–28 Juni 2018" / "30 Mei – 2 Juni 2018". "" bila tanpa tanggal. */
export function formatDateRange(activity: Pick<Activity, 'date' | 'dateEnd'>, locale: string): string {
  if (!activity.date) return ''
  const start = asDate(activity.date)
  const full = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  if (!activity.dateEnd || activity.dateEnd <= activity.date) return full.format(start)
  const end = asDate(activity.dateEnd)
  // Format rentang bawaan Intl menangani bulan/tahun yang sama dan lintas bulan.
  return full.formatRange(start, end)
}

/** Kotak tanggal untuk kartu: "SEP 2018" + "07" (atau "19–25" untuk beberapa hari). null bila tanpa tanggal. */
export function dateBox(activity: Pick<Activity, 'date' | 'dateEnd'>, locale: string): EventDate | null {
  if (!activity.date) return null
  const start = asDate(activity.date)
  const month = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' })
    .format(start)
    .replace('.', '')
    .slice(0, 3)
    .toUpperCase()
  const day = (iso: string) => String(asDate(iso).getUTCDate()).padStart(2, '0')
  const sameMonth = activity.dateEnd && activity.dateEnd.slice(0, 7) === activity.date.slice(0, 7)
  return {
    top: `${month} ${activity.date.slice(0, 4)}`,
    main: sameMonth && activity.dateEnd > activity.date ? `${day(activity.date)}–${day(activity.dateEnd)}` : day(activity.date),
  }
}
