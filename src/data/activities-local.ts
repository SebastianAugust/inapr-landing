import { id as idDict } from '@/i18n/id'
import type { Dictionary } from '@/i18n/types'
import { fold } from '@/lib/search'
import type { Activity, Webinar } from './index'

/**
 * Fallback lokal untuk daftar kegiatan: kegiatan di section #kegiatan (kamus) + arsip webinar.
 * Fakta (tanggal, tempat) hanya dari rebuild/docs/KONTEN-LAMA.md lewat kamus. Teks (judul, keterangan) diambil dari
 * kamus bahasa aktif lewat `localizeActivity`; id tetap sama di semua bahasa.
 */

/** Tanggal + lokasi + jenis untuk tiap entri di `kegiatan.featured` / `kegiatan.items` (urutan = kamus). */
const LOCAL_EVENTS: {
  ref: 'featured' | number
  id: string
  kind: Activity['kind']
  date: string
  dateEnd?: string
  location?: string
}[] = [
  {
    ref: 'featured',
    id: '2018-09-07-konferensi-pertama-inapr',
    kind: 'conference',
    date: '2018-09-07',
    location: 'Universitas Bina Nusantara, Kampus Alam Sutera, Tangerang',
  },
  { ref: 0, id: '2018-06-26-joint-working-group-prancis-indonesia-ke-10', kind: 'kegiatan', date: '2018-06-26', dateEnd: '2018-06-28', location: 'Poitiers, Prancis' },
  { ref: 1, id: '2018-08-19-icpr-2018-beijing', kind: 'kegiatan', date: '2018-08-19', dateEnd: '2018-08-25', location: 'Beijing, Tiongkok' },
  { ref: 2, id: '2019-11-08-kuliah-tamu-stiki-malang', kind: 'kegiatan', date: '2019-11-08', location: 'STIKI Malang' },
  { ref: 3, id: '2019-12-10-kuliah-tamu-biometrik-ktp-el', kind: 'kegiatan', date: '2019-12-10', location: 'Undiksha, Singaraja' },
  { ref: 4, id: '2020-09-28-mendukung-iconetsi', kind: 'kegiatan', date: '2020-09-28' },
  { ref: 5, id: 'ais-2020', kind: 'kegiatan', date: '' },
  { ref: 6, id: 'tfric19', kind: 'kegiatan', date: '' },
]

/** Slug aman URL: huruf kecil tanpa diakritik, "-" antar kata, maks. 60 karakter. */
export function slugify(text: string): string {
  return fold(text)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
}

function localEvents(): Activity[] {
  return LOCAL_EVENTS.map((event) => ({
    id: event.id,
    kind: event.kind,
    date: event.date,
    dateEnd: event.dateEnd ?? '',
    time: '',
    title: '',
    speaker: '',
    institution: '',
    location: event.location ?? '',
    description: '',
    youtube: '',
    materials: '',
    registrationOpen: false,
    localRef: event.ref,
  })).map((activity) => localizeActivity(activity, idDict))
}

/** Isi judul + keterangan kegiatan lokal dari kamus bahasa aktif. Data dari server dikembalikan apa adanya. */
export function localizeActivity(activity: Activity, dict: Dictionary): Activity {
  const ref = activity.localRef
  if (ref === undefined) return activity
  if (ref === 'featured') {
    const { title, meta, keynoteLabel, keynotes } = dict.kegiatan.featured
    return {
      ...activity,
      title,
      description: [meta, `${keynoteLabel}: ${keynotes.join('; ')}`].filter(Boolean).join('\n'),
    }
  }
  const item = dict.kegiatan.items[ref]
  return item ? { ...activity, title: item.title, description: item.meta ?? '' } : activity
}

/** Webinar arsip → kegiatan (id = tanggal + judul; bila kembar diberi akhiran -2, -3, …). */
export function webinarsToActivities(items: Webinar[]): Activity[] {
  const used = new Set<string>(LOCAL_EVENTS.map((event) => event.id))
  return items.map((item) => {
    const base = `${item.date}-${slugify(item.title)}`.replace(/-+$/, '')
    let id = base
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`
    used.add(id)
    return {
      id,
      kind: 'webinar' as const,
      date: item.date,
      dateEnd: '',
      time: item.time,
      title: item.title,
      speaker: item.speaker,
      institution: item.institution,
      location: '',
      description: '',
      youtube: item.youtube,
      // Slide lokal hanya nama file (alamat dasar dari VITE_SLIDES_BASE_URL): tautan dibentuk saat tampil (slides.ts).
      materials: item.slides[0] ?? '',
      registrationOpen: false,
    }
  })
}

/** Urut: bertanggal terbaru dulu, lalu yang tanpa tanggal. */
export function sortActivities(items: Activity[]): Activity[] {
  return [...items].sort((a, b) => {
    if (!a.date && !b.date) return 0
    if (!a.date) return 1
    if (!b.date) return -1
    return b.date.localeCompare(a.date)
  })
}

/** Gabungan kegiatan di kamus + arsip webinar (yang diberikan). */
export function buildLocalActivities(webinars: Webinar[]): Activity[] {
  return sortActivities([...localEvents(), ...webinarsToActivities(webinars)])
}
