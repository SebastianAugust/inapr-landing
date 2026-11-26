/**
 * Sumber data anggota, arsip webinar, dan kegiatan. Kontrak lengkap: docs/KONTRAK-DATA.md (kegiatan = USULAN).
 *
 * Urutan pemilihan sumber (dibaca saat build, lihat .env.example):
 *   a. VITE_API_BASE terisi                            → GET {base}/api/public/members | archives  ({ items: [...] })
 *   a'. same-origin: VITE_API_BASE kosong DAN build produksi (di dev: hanya bila VITE_API_PROXY terisi)
 *                                                      → GET /api/public/members | archives (path ABSOLUT, tidak
 *                                                        relatif terhadap base "/landing/" saat di-embed ke app Next)
 *   b. VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY      → REST Supabase langsung (hanya SELECT, anon key)
 *   c. selain itu                                      → data lokal (src/data/*.json)
 *
 * Aturan: hanya membaca (GET), hanya anon key, tidak pernah melempar error. Bila sumber jauh
 * gagal / timeout / respons tidak valid / kosong, jatuh ke data lokal.
 */
import { buildLocalActivities, sortActivities } from './activities-local'
import {
  loadMembers,
  loadWebinars,
  type Activity,
  type ActivitiesData,
  type ActivityKind,
  type Member,
  type MembersData,
  type Webinar,
  type WebinarsData,
} from './index'

const TIMEOUT_MS = 4000
const MAX_MEMBERS = 2000
const MAX_ARCHIVES = 500
const MAX_ACTIVITIES = 1000
/** Batas ukuran badan respons (hanya bila server mengirim Content-Length). */
const MAX_BODY_BYTES = 2_000_000

type Source =
  | { kind: 'api'; base: string }
  | { kind: 'supabase'; origin: string; anonKey: string }

// ---------- Pemilihan sumber ----------

/** "/" atau "/x/" (relatif ke situs) atau URL http(s) → basis tanpa slash akhir; selain itu null. */
function parseApiBase(raw: string): string | null {
  if (raw.startsWith('/') && !raw.startsWith('//')) return raw.replace(/\/+$/, '')
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
  } catch {
    return null
  }
}

function parseOrigin(raw: string): string | null {
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.origin : null
  } catch {
    return null
  }
}

function resolveSource(): Source | null {
  const env = import.meta.env
  const apiBase = env.VITE_API_BASE?.trim()
  if (apiBase) {
    const base = parseApiBase(apiBase)
    return base === null ? null : { kind: 'api', base }
  }
  // Same-origin: basis "" → URL "/api/public/…" (absolut; bukan di bawah base "/landing/").
  // Produksi: aktif otomatis. Dev: hanya bila VITE_API_PROXY terisi (vite.config.ts mem-proxy /api ke sana).
  if (env.PROD || env.VITE_API_PROXY?.trim()) return { kind: 'api', base: '' }
  const supabaseUrl = env.VITE_SUPABASE_URL?.trim()
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim()
  if (supabaseUrl && anonKey) {
    const origin = parseOrigin(supabaseUrl)
    return origin === null ? null : { kind: 'supabase', origin, anonKey }
  }
  return null
}

const SOURCE = resolveSource()

// Kolom eksplisit saja; jangan pakai select=* (mencegah kolom privat ikut terkirim).
const SUPABASE_MEMBERS =
  '/rest/v1/members?select=nama,institusi&status=eq.Active&tampil_di_publik=eq.true&order=nama.asc&limit=2000'
const SUPABASE_ARCHIVES =
  '/rest/v1/activity_archives?select=tanggal,waktu,penyaji,institusi,tema,youtube_url,materi_url&order=tanggal.desc&limit=500'

// ---------- Fetch ----------

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

function warn(message: string, error?: unknown) {
  if (import.meta.env.DEV) console.warn(`[data] ${message}, memakai data lokal.`, error ?? '')
}

/** GET → badan JSON mentah (belum divalidasi), atau null bila gagal. Tidak pernah melempar. */
async function fetchBody(source: Source, path: string, supabasePath: string | null): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const headers: Record<string, string> = { Accept: 'application/json' }
    let url: string
    if (source.kind === 'api') {
      url = `${source.base}/api/public/${path}`
    } else {
      // Supabase hanya untuk anggota + arsip; kegiatan (kontrak usulan) hanya lewat API.
      if (supabasePath === null) return null
      url = `${source.origin}${supabasePath}`
      headers.apikey = source.anonKey
      headers.Authorization = `Bearer ${source.anonKey}`
    }
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'omit',
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const length = Number(response.headers.get('content-length'))
    if (length > MAX_BODY_BYTES) throw new Error('respons terlalu besar')

    // Pembacaan badan tetap berada di bawah timeout yang sama.
    return (await response.json()) as unknown
  } catch (error) {
    warn(`Sumber ${source.kind} (${path}) gagal`, error)
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** GET daftar → array mentah (belum divalidasi per item), atau null bila gagal. Tidak pernah melempar. */
async function fetchItems(resource: 'members' | 'archives' | 'activities', source: Source): Promise<unknown[] | null> {
  const supabasePath =
    resource === 'members' ? SUPABASE_MEMBERS : resource === 'archives' ? SUPABASE_ARCHIVES : null
  const body = await fetchBody(source, resource, supabasePath)
  // api: { items: [...] }; supabase: array polos.
  const items = source.kind === 'api' ? (isRecord(body) ? body.items : undefined) : body
  if (!Array.isArray(items)) {
    if (body !== null) warn(`Bentuk respons ${resource} tidak dikenali`)
    return null
  }
  return items
}

// ---------- Type guard & pembersih field ----------

/** String dirapikan (spasi tunggal, dipangkas); non-string → "". Tanpa HTML: React yang meng-escape. */
function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : ''
}

/** Hanya http(s); skema lain (javascript:, data:, …) ditolak. Mengembalikan "" bila tidak valid. */
function httpUrl(value: unknown): string {
  const raw = text(value, 2000)
  if (!raw) return ''
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : ''
  } catch {
    return ''
  }
}

/** "2022-09-02" atau timestamp ISO → "2022-09-02"; tidak valid → "". */
function isoDate(value: unknown): string {
  const day = /^\d{4}-\d{2}-\d{2}(?=$|[T ])/.exec(text(value, 40))?.[0]
  if (!day) return ''
  const date = new Date(`${day}T00:00:00Z`)
  // Tolak tanggal yang tidak ada di kalender (mis. 2022-02-31).
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(day) ? day : ''
}

/** "16:00:00" (kolom time) → "16.00" (gaya data lokal); teks bebas ("16.00–17.00") dibiarkan. */
function timeLabel(value: unknown): string {
  const raw = text(value, 40)
  const clock = /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(raw)
  return clock ? `${clock[1].padStart(2, '0')}.${clock[2]}` : raw
}

// ---------- Mapper ----------

/** { nama, institusi } → Member. Field lain dibuang. */
function toMember(raw: unknown): Member | null {
  if (!isRecord(raw)) return null
  const name = text(raw.nama, 200)
  if (!name) return null
  return { name, institution: text(raw.institusi, 200) }
}

/** { tanggal, waktu, tema, penyaji, institusi, youtube_url, materi_url } → Webinar. Field lain dibuang. */
function toWebinar(raw: unknown): Webinar | null {
  if (!isRecord(raw)) return null
  const date = isoDate(raw.tanggal)
  const title = text(raw.tema, 300)
  if (!date || !title) return null
  const slides = httpUrl(raw.materi_url)
  return {
    date,
    time: timeLabel(raw.waktu),
    speaker: text(raw.penyaji, 200),
    institution: text(raw.institusi, 200),
    title,
    youtube: httpUrl(raw.youtube_url),
    slides: slides ? [slides] : [],
    papers: [],
  }
}

const ACTIVITY_ID = /^[A-Za-z0-9_-]{1,100}$/

/** "Conference"/"konferensi" → conference; "webinar" → webinar; selain itu kegiatan. */
function activityKind(value: unknown): ActivityKind {
  const raw = text(value, 40).toLowerCase()
  if (raw.startsWith('conf') || raw.startsWith('konf')) return 'conference'
  if (raw.startsWith('webinar')) return 'webinar'
  return 'kegiatan'
}

/**
 * { id, jenis, tanggal, tanggal_selesai?, waktu, tema, penyaji, institusi, lokasi, deskripsi, youtube_url, materi_url,
 *   pendaftaran_dibuka } → Activity. Kontrak USULAN (docs/KONTRAK-DATA.md). id tidak aman untuk URL atau tema kosong → dibuang.
 */
function toActivity(raw: unknown): Activity | null {
  if (!isRecord(raw)) return null
  const idValue = typeof raw.id === 'number' ? String(raw.id) : text(raw.id, 100)
  const title = text(raw.tema, 300)
  if (!ACTIVITY_ID.test(idValue) || !title) return null
  return {
    id: idValue,
    kind: activityKind(raw.jenis),
    date: isoDate(raw.tanggal),
    dateEnd: isoDate(raw.tanggal_selesai),
    time: timeLabel(raw.waktu),
    title,
    speaker: text(raw.penyaji, 200),
    institution: text(raw.institusi, 200),
    location: text(raw.lokasi, 300),
    description: typeof raw.deskripsi === 'string' ? raw.deskripsi.replace(/\r\n?/g, '\n').trim().slice(0, 5000) : '',
    youtube: httpUrl(raw.youtube_url),
    materials: httpUrl(raw.materi_url),
    // Hanya true yang eksplisit; apa pun selain itu dianggap tertutup.
    registrationOpen: raw.pendaftaran_dibuka === true || raw.pendaftaran_dibuka === 1,
  }
}

function mapAll<T>(items: unknown[], max: number, map: (raw: unknown) => T | null): T[] {
  const result: T[] = []
  for (const raw of items.slice(0, max)) {
    const item = map(raw)
    if (item) result.push(item)
  }
  return result
}

// ---------- API publik ----------

/** Satu kali ambil per sesi halaman; dibuang bila gagal total supaya bisa dicoba lagi. */
function once<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined
  return () => {
    pending ??= load().catch((error: unknown) => {
      pending = undefined
      throw error
    })
    return pending
  }
}

/** Anggota publik (aktif & tampil di publik). Sumber jauh bila ada, kalau tidak/gagal: data lokal. */
export const getMembers = once<MembersData>(async () => {
  if (SOURCE) {
    const raw = await fetchItems('members', SOURCE)
    const members = raw ? mapAll(raw, MAX_MEMBERS, toMember) : []
    if (members.length) {
      return {
        source: SOURCE.kind,
        asOf: new Date().toISOString().slice(0, 10),
        officialTotal: members.length,
        members,
      }
    }
    if (raw) warn('Sumber anggota kosong/tidak valid')
  }
  return loadMembers()
})

/** Arsip webinar (terbaru dulu). Sumber jauh bila ada, kalau tidak/gagal: data lokal. */
export const getArchives = once<WebinarsData>(async () => {
  if (SOURCE) {
    const raw = await fetchItems('archives', SOURCE)
    const items = raw ? mapAll(raw, MAX_ARCHIVES, toWebinar) : []
    if (items.length) {
      // Komponen mengandaikan terbaru dulu; jangan bergantung pada urutan dari server.
      items.sort((a, b) => b.date.localeCompare(a.date))
      return { source: SOURCE.kind, items }
    }
    if (raw) warn('Sumber arsip kosong/tidak valid')
  }
  return loadWebinars()
})

/** Awalan untuk POST same-origin: sama dengan sumber GET (kosong = path absolut "/api/public/…" di situs yang sama). */
export function apiPostBase(): string {
  return SOURCE?.kind === 'api' ? SOURCE.base : ''
}

/**
 * Daftar kegiatan (konferensi, webinar, kegiatan). Kontrak USULAN: GET /api/public/activities. Sumber jauh bila ada
 * (hanya mode API); kalau tidak ada/gagal/kosong: kegiatan di kamus + arsip webinar (getArchives).
 */
export const getActivities = once<ActivitiesData>(async () => {
  if (SOURCE?.kind === 'api') {
    const raw = await fetchItems('activities', SOURCE)
    const items = raw ? mapAll(raw, MAX_ACTIVITIES, toActivity) : []
    if (items.length) return { source: SOURCE.kind, items: sortActivities(items) }
    if (raw) warn('Sumber kegiatan kosong/tidak valid')
  }
  const archives = await getArchives()
  return { source: archives.source === 'api' ? 'local+api' : 'local', items: buildLocalActivities(archives.items) }
})

/**
 * Satu kegiatan menurut id. Kontrak USULAN: GET /api/public/activities/{id} -> { item: {...} }. Bila endpoint
 * tidak ada/gagal, dicari di daftar (getActivities). null = tidak ditemukan.
 */
export async function getActivity(id: string): Promise<Activity | null> {
  if (!ACTIVITY_ID.test(id)) return null
  if (SOURCE?.kind === 'api') {
    const body = await fetchBody(SOURCE, `activities/${encodeURIComponent(id)}`, null)
    const item = isRecord(body) ? toActivity(body.item) : null
    if (item && item.id === id) return item
  }
  const list = await getActivities()
  return list.items.find((activity) => activity.id === id) ?? null
}
