import { apiPostBase } from '@/data/api'

/** Batas waktu kirim formulir (ms). */
export const SUBMIT_TIMEOUT_MS = 8000

/**
 * Hasil POST formulir. SATU-SATUNYA hasil sukses adalah `ok` = server menjawab 2xx dengan badan { ok: true }.
 * Segala hal lain (route belum ada, jaringan putus, timeout, HTML/JSON tak dikenal) = `unavailable`: tidak ada
 * sukses palsu, dan pengguna diberi tahu data TIDAK terkirim.
 */
export type SubmitResult =
  | { status: 'ok' }
  | { status: 'unavailable' }
  | { status: 'rejected'; message: string }
  | { status: 'conflict' }
  | { status: 'rate' }
  | { status: 'error' }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown
  } catch {
    return null
  }
}

/**
 * POST JSON same-origin ke /api/public/{path} (kontrak USULAN: docs/KONTRAK-DATA.md). Tidak pernah melempar.
 * Tanpa cookie lintas-situs, tanpa log isi formulir.
 */
export async function postJson(path: string, body: unknown): Promise<SubmitResult> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS)
  try {
    const response = await fetch(`${apiPostBase()}/api/public/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      credentials: 'same-origin',
      signal: controller.signal,
    })
    const json = await readJson(response)
    const reply = isRecord(json) ? json : null

    if (response.ok) return reply?.ok === true ? { status: 'ok' } : { status: 'unavailable' }
    if (response.status === 409) return reply ? { status: 'conflict' } : { status: 'unavailable' }
    if (response.status === 429) return { status: 'rate' }
    if (response.status === 400 || response.status === 422) {
      const message = reply && typeof reply.error === 'string' ? reply.error.replace(/\s+/g, ' ').trim().slice(0, 200) : ''
      return reply && reply.ok === false ? { status: 'rejected', message } : { status: 'unavailable' }
    }
    // Route belum ada / metode tidak didukung / gateway: layanan belum aktif. 500 dengan JSON: galat server.
    if (response.status === 500 && reply) return { status: 'error' }
    return { status: 'unavailable' }
  } catch {
    return { status: 'unavailable' }
  } finally {
    clearTimeout(timer)
  }
}
