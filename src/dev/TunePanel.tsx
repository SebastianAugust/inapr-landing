/**
 * Panel tuning latar titik 3D, KHUSUS dev server: buka http://localhost:5173/?tune
 *
 * Dipasang oleh ./tune.tsx, yang dimuat dinamis dari <PointField /> di balik
 * `import.meta.env.DEV`, jadi tidak ikut bundel produksi. Nilai disimpan sementara di localStorage ("inapr-tune") supaya tidak
 * hilang saat refresh; "Reset" menghapusnya. "Salin nilai" menyalin objek siap tempel
 * ke src/config/pointfield.ts.
 */
import { useEffect, useId, useRef, useState } from 'react'
import {
  GEOMETRY_KEYS,
  POINTFIELD_DEFAULTS,
  SHAPE_SIDES,
  type PointFieldParams,
  type ShapeSide,
} from '@/config/pointfield'
import { BREAK_SHAPES, SECTION_IDS } from '@/lib/sections'
import type { PointFieldDebug, PointFieldEngine } from '@/pointfield/engine'

const STORAGE_KEY = 'inapr-tune'
const REBUILD_DELAY = 300

type ScalarKey = Exclude<keyof PointFieldParams, 'yaw' | 'pitch' | 'sides'>
type AngleKey = 'yaw' | 'pitch'

interface Spec {
  key: ScalarKey
  label: string
  min: number
  max: number
  step: number
}

const GROUPS: { title: string; note?: string; specs: Spec[] }[] = [
  {
    title: 'Revolusi bintang',
    specs: [
      { key: 'revolutionSpeed', label: 'Kecepatan dasar (rad/s)', min: 0, max: 0.3, step: 0.005 },
      { key: 'revolutionCoreBoost', label: 'Tambahan di pusat', min: 0, max: 3, step: 0.05 },
      { key: 'revolutionVariation', label: 'Variasi acak (±)', min: 0, max: 1, step: 0.05 },
      { key: 'revolutionTiltX', label: 'Kemiringan bidang X (rad)', min: -1.57, max: 1.57, step: 0.01 },
      { key: 'revolutionTiltZ', label: 'Kemiringan bidang Z (rad)', min: -1.57, max: 1.57, step: 0.01 },
      { key: 'wobbleAmplitude', label: 'Gerak halus: amplitudo', min: 0, max: 0.6, step: 0.01 },
      { key: 'wobbleSpeed', label: 'Gerak halus: kecepatan', min: 0, max: 3, step: 0.05 },
    ],
  },
  {
    title: 'Kamera & scroll',
    specs: [
      { key: 'smoothing', label: 'Smoothing scroll', min: 0.01, max: 0.5, step: 0.01 },
      { key: 'cameraFar', label: 'Jarak zoom-out (netral)', min: 4, max: 40, step: 0.5 },
      { key: 'cameraNear', label: 'Jarak zoom-in', min: 1, max: 30, step: 0.5 },
      { key: 'sideShift', label: 'Geser ke sisi', min: 0, max: 8, step: 0.1 },
      { key: 'sideLook', label: 'Menengok ke sisi', min: 0, max: 8, step: 0.1 },
      { key: 'holdDrift', label: 'Drift saat tahan (rad)', min: 0, max: 0.3, step: 0.005 },
      { key: 'matParallax', label: 'Parallax cutting mat', min: 0, max: 0.5, step: 0.01 },
    ],
  },
  {
    title: 'Fase di jeda',
    note: 'Fraksi progres jeda: zoom in 0 → akhir bentuk, tahan → akhir tahan, lalu lepas + zoom out → 1.',
    specs: [
      { key: 'phaseFormEnd', label: 'Akhir zoom in / bentuk', min: 0.05, max: 0.9, step: 0.01 },
      { key: 'phaseHoldEnd', label: 'Akhir tahan', min: 0.06, max: 0.95, step: 0.01 },
    ],
  },
  {
    title: 'Bentuk',
    note: 'Ukuran = fraksi viewport. Morph penuh butuh kecepatan − sebaran ≥ 1.',
    specs: [
      { key: 'shapeShare', label: 'Proporsi titik bentuk', min: 0.05, max: 1, step: 0.01 },
      { key: 'shapeDepth', label: 'Jarak bentuk dari kamera', min: 2, max: 30, step: 0.5 },
      { key: 'shapeSizeWide', label: 'Ukuran kiri/kanan (× tinggi)', min: 0.1, max: 0.8, step: 0.01 },
      { key: 'shapeSizeBand', label: 'Ukuran atas/bawah (× tinggi)', min: 0.1, max: 0.6, step: 0.01 },
      { key: 'shapeSizeNarrow', label: 'Ukuran < 1024px (× lebar)', min: 0.1, max: 0.9, step: 0.01 },
      { key: 'sideOffsetX', label: 'Pusat dari tepi kiri/kanan', min: 0.1, max: 0.5, step: 0.01 },
      { key: 'bandOffsetY', label: 'Pusat dari tepi atas/bawah', min: 0.1, max: 0.5, step: 0.01 },
      { key: 'shapeSpin', label: 'Rotasi lokal (rad/s)', min: 0, max: 1.5, step: 0.01 },
      { key: 'shapeTiltY', label: 'Kemiringan Y (rad)', min: -3.14, max: 3.14, step: 0.01 },
      { key: 'shapeTiltX', label: 'Kemiringan X (rad)', min: -3.14, max: 3.14, step: 0.01 },
      { key: 'morphSpeed', label: 'Kecepatan morph', min: 0.5, max: 4, step: 0.05 },
      { key: 'delaySpread', label: 'Sebaran delay per titik', min: 0, max: 2, step: 0.05 },
    ],
  },
  {
    title: 'Pointer (canvas)',
    note: 'Satuan NDC: tinggi layar = 2. Tanpa efek saat reduced motion.',
    specs: [
      { key: 'parallaxStrength', label: 'Parallax: kemiringan maks. (rad)', min: 0, max: 0.2, step: 0.005 },
      { key: 'parallaxSmoothing', label: 'Parallax: kehalusan', min: 0.01, max: 0.5, step: 0.01 },
      { key: 'pushRadius', label: 'Dorong: radius', min: 0.02, max: 1, step: 0.01 },
      { key: 'pushStrength', label: 'Dorong: kekuatan', min: 0, max: 0.3, step: 0.005 },
      { key: 'pushShapeFactor', label: 'Dorong/riak pada bentuk (×)', min: 0, max: 1, step: 0.05 },
      { key: 'rippleSpeed', label: 'Riak: kecepatan', min: 0.1, max: 5, step: 0.05 },
      { key: 'rippleStrength', label: 'Riak: kekuatan', min: 0, max: 0.3, step: 0.005 },
      { key: 'rippleWidth', label: 'Riak: lebar gelombang', min: 0.02, max: 0.6, step: 0.01 },
      { key: 'rippleDamping', label: 'Riak: redaman (1/s)', min: 0.1, max: 6, step: 0.05 },
    ],
  },
  {
    title: 'Titik & field',
    note: 'Jumlah titik dan radius field → geometri dibangun ulang (jeda 300 ms).',
    specs: [
      { key: 'pointSize', label: 'Ukuran titik', min: 0.01, max: 0.3, step: 0.005 },
      { key: 'pointOpacity', label: 'Opasitas titik', min: 0.1, max: 1, step: 0.05 },
      { key: 'countDesktop', label: 'Jumlah (desktop)', min: 200, max: 12000, step: 100 },
      { key: 'countLowPower', label: 'Jumlah (perangkat lemah)', min: 200, max: 8000, step: 100 },
      { key: 'countMobile', label: 'Jumlah (mobile)', min: 200, max: 6000, step: 100 },
      { key: 'fieldRadius', label: 'Radius field', min: 5, max: 60, step: 1 },
    ],
  },
]

/** Label sisi untuk dropdown. */
const SIDE_LABELS: Record<ShapeSide, string> = {
  left: 'Kiri',
  right: 'Kanan',
  top: 'Atas',
  bottom: 'Bawah',
  'top-left': 'Kiri atas',
  'top-right': 'Kanan atas',
  'bottom-left': 'Kiri bawah',
  'bottom-right': 'Kanan bawah',
}

const isSide = (value: unknown): value is ShapeSide =>
  typeof value === 'string' && (SHAPE_SIDES as readonly string[]).includes(value)

const SCALAR_KEYS = GROUPS.flatMap((group) => group.specs.map((spec) => spec.key))

// ---------------------------------------------------------------------------
// Penyimpanan
// ---------------------------------------------------------------------------

function defaults(): PointFieldParams {
  return {
    ...POINTFIELD_DEFAULTS,
    yaw: [...POINTFIELD_DEFAULTS.yaw],
    pitch: [...POINTFIELD_DEFAULTS.pitch],
    sides: [...POINTFIELD_DEFAULTS.sides],
  }
}

/** Gabungkan nilai tersimpan dengan default; abaikan yang tidak valid. */
function sanitize(raw: unknown): PointFieldParams {
  const out = defaults()
  if (!raw || typeof raw !== 'object') return out
  const source = raw as Record<string, unknown>
  for (const key of SCALAR_KEYS) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) out[key] = value
  }
  for (const key of ['yaw', 'pitch'] as const) {
    const list = source[key]
    if (Array.isArray(list) && list.length === out[key].length && list.every((v) => typeof v === 'number' && Number.isFinite(v))) {
      out[key] = list as number[]
    }
  }
  const sides = source.sides
  if (Array.isArray(sides) && sides.length === out.sides.length && sides.every(isSide)) out.sides = sides
  return out
}

function loadSaved(): PointFieldParams | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? sanitize(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

function sameAsDefaults(params: PointFieldParams): boolean {
  return JSON.stringify(params) === JSON.stringify(defaults())
}

function persist(params: PointFieldParams): void {
  try {
    if (sameAsDefaults(params)) window.localStorage.removeItem(STORAGE_KEY)
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(params))
  } catch {
    // Mode privat / storage diblokir: abaikan, nilai tetap berlaku sampai refresh.
  }
}

function clear(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // abaikan
  }
}

/** Bulatkan noise float (0.30000000000000004 → 0.3). */
const tidy = (value: number) => Number(value.toFixed(4))

/** Objek siap tempel ke src/config/pointfield.ts. */
function toSource(params: PointFieldParams): string {
  const lines = SCALAR_KEYS.map((key) => `  ${key}: ${tidy(params[key])},`)
  const list = (values: readonly number[]) => values.map(tidy).join(', ')
  return [
    'export const POINTFIELD_DEFAULTS: Readonly<PointFieldParams> = Object.freeze({',
    ...lines,
    `  yaw: Object.freeze([${list(params.yaw)}]),`,
    `  pitch: Object.freeze([${list(params.pitch)}]),`,
    `  sides: Object.freeze([${params.sides.map((side) => `'${side}'`).join(', ')}] as const),`,
    '})',
    '',
  ].join('\n')
}

function pickGeometry(params: PointFieldParams): Pick<PointFieldParams, (typeof GEOMETRY_KEYS)[number]> {
  const out = {} as Record<string, number>
  for (const key of GEOMETRY_KEYS) out[key] = params[key]
  return out as Pick<PointFieldParams, (typeof GEOMETRY_KEYS)[number]>
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export function TunePanel({ engine }: { engine: PointFieldEngine }) {
  const uid = useId()
  const [params, setParams] = useState<PointFieldParams>(() => loadSaved() ?? defaults())
  const [open, setOpen] = useState(true)
  const [debug, setDebug] = useState<PointFieldDebug>(() => engine.debug())
  const [message, setMessage] = useState('')
  const [manualCopy, setManualCopy] = useState<string | null>(null)
  const applied = useRef<PointFieldParams>(engine.getParams())
  const rebuildTimer = useRef(0)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)

  // Esc di dalam panel → ciutkan, fokus kembali ke tombol Ciutkan/Buka.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      toggleRef.current?.focus()
    }
    panel.addEventListener('keydown', onKeyDown)
    return () => panel.removeEventListener('keydown', onKeyDown)
  }, [])

  // Terapkan ke engine: parameter biasa langsung; parameter geometri dengan debounce.
  useEffect(() => {
    window.clearTimeout(rebuildTimer.current)
    const geometryChanged = GEOMETRY_KEYS.some((key) => params[key] !== applied.current[key])
    if (geometryChanged) {
      engine.setParams({ ...params, ...pickGeometry(applied.current) })
      rebuildTimer.current = window.setTimeout(() => {
        engine.setParams(params)
        applied.current = params
      }, REBUILD_DELAY)
    } else {
      engine.setParams(params)
      applied.current = params
    }
    persist(params)
  }, [engine, params])

  useEffect(() => () => window.clearTimeout(rebuildTimer.current), [])

  // Indikator posisi.
  useEffect(() => {
    const timer = window.setInterval(() => setDebug(engine.debug()), 150)
    return () => window.clearInterval(timer)
  }, [engine])

  const setScalar = (key: ScalarKey, value: number) => {
    if (Number.isFinite(value)) setParams((current) => ({ ...current, [key]: value }))
  }
  const setAngle = (key: AngleKey, index: number, value: number) => {
    if (!Number.isFinite(value)) return
    setParams((current) => {
      const list = [...current[key]]
      list[index] = value
      return { ...current, [key]: list }
    })
  }

  const setSide = (index: number, value: string) => {
    if (!isSide(value)) return
    setParams((current) => {
      const sides = [...current.sides]
      sides[index] = value
      return { ...current, sides }
    })
  }

  const reset = () => {
    clear()
    setParams(defaults())
    setManualCopy(null)
    setMessage('Direset ke default.')
  }

  const copy = async () => {
    const text = toSource(params)
    try {
      await navigator.clipboard.writeText(text)
      setManualCopy(null)
      setMessage('Nilai disalin. Tempel ke src/config/pointfield.ts.')
    } catch {
      setManualCopy(text)
      setMessage('Clipboard diblokir: salin manual dari kotak di bawah.')
    }
  }

  const bodyId = `${uid}-body`
  const position =
    debug.kind === 'break'
      ? `jeda ${debug.index + 1} (${BREAK_SHAPES[debug.index] ?? '?'}, ${params.sides[debug.index] ?? '?'})`
      : debug.kind === 'section'
        ? `section ${debug.index + 1} (${SECTION_IDS[debug.index] ?? '?'})`
        : '–'

  return (
    <section ref={panelRef} aria-label="Panel tuning titik 3D (dev)" className="tp">
      <div className="tp-head">
        <h2 className="tp-title">
          Tuning titik 3D <small>dev</small>
        </h2>
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((value) => !value)}
          className="tp-btn"
        >
          {open ? 'Ciutkan' : 'Buka'}
        </button>
      </div>

      {/* Indikator posisi selalu terlihat, juga saat diciutkan. */}
      <p className="tp-status">
        <span className="tp-muted">Posisi:</span> elemen {debug.item} · {position}
        <br />
        <span className="tp-muted">T</span> {debug.T.toFixed(3)} → {debug.target.toFixed(3)} ·{' '}
        <span className="tp-muted">fase</span> {debug.phase} · <span className="tp-muted">m</span> {debug.morph.toFixed(2)}
        {' · '}
        <span className="tp-muted">bentuk</span> {debug.shape >= 0 ? BREAK_SHAPES[debug.shape] : '–'}
        <br />
        <span className="tp-muted">N</span> {debug.count} ({debug.device}, {debug.wide ? '≥ 1024px' : '< 1024px'})
        {' · '}
        <span className="tp-muted">pointer</span> {debug.pointer.toFixed(2)} · <span className="tp-muted">riak</span> {debug.ripples}
        {debug.reducedMotion && <span className="tp-accent"> · reduced motion: statis</span>}
      </p>

      <div id={bodyId} hidden={!open} className="tp-body">
        {GROUPS.map((group) => (
          <fieldset key={group.title} className="tp-group">
            <legend className="tp-legend">{group.title}</legend>
            {group.note && <p className="tp-note">{group.note}</p>}
            {group.specs.map((spec) => {
              const id = `${uid}-${spec.key}`
              const value = params[spec.key]
              return (
                <div key={spec.key} className="tp-row">
                  <label htmlFor={id}>{spec.label}</label>
                  <input
                    type="number"
                    aria-label={`${spec.label}, angka`}
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    value={tidy(value)}
                    onChange={(event) => setScalar(spec.key, event.target.valueAsNumber)}
                    className="tp-num"
                  />
                  <input
                    id={id}
                    type="range"
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    value={value}
                    onChange={(event) => setScalar(spec.key, event.target.valueAsNumber)}
                    className="tp-range"
                  />
                </div>
              )
            })}
          </fieldset>
        ))}

        <table className="tp-table">
          <caption className="tp-caption">Per section: yaw / pitch netral (rad) + sisi bentuk di jeda sesudahnya</caption>
          <thead>
            <tr>
              <th scope="col">Section</th>
              <th scope="col">Sisi jeda</th>
              <th scope="col">Yaw</th>
              <th scope="col">Pitch</th>
            </tr>
          </thead>
          <tbody>
            {params.yaw.map((yaw, i) => (
              <tr key={SECTION_IDS[i] ?? i} className={debug.kind !== null && debug.index === i ? 'is-current' : undefined}>
                <th scope="row">
                  {i + 1}. {SECTION_IDS[i]}
                </th>
                <td>
                  {i < params.sides.length ? (
                    <select
                      aria-label={`Sisi bentuk jeda ${i + 1} (${BREAK_SHAPES[i]}), sesudah section ${i + 1}`}
                      value={params.sides[i]}
                      onChange={(event) => setSide(i, event.target.value)}
                      className="tp-select"
                    >
                      {SHAPE_SIDES.map((side) => (
                        <option key={side} value={side}>
                          {SIDE_LABELS[side]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="tp-muted">–</span>
                  )}
                </td>
                {(['yaw', 'pitch'] as const).map((key) => (
                  <td key={key}>
                    <input
                      type="number"
                      step={0.05}
                      aria-label={`${key === 'yaw' ? 'Yaw' : 'Pitch'} section ${i + 1} (${SECTION_IDS[i]})`}
                      value={tidy(key === 'yaw' ? yaw : params.pitch[i])}
                      onChange={(event) => setAngle(key, i, event.target.valueAsNumber)}
                      className="tp-num"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="tp-actions">
          <button type="button" onClick={copy} className="tp-btn">
            Salin nilai
          </button>
          <button type="button" onClick={reset} className="tp-btn">
            Reset
          </button>
        </div>
        <output className="tp-msg">{message}</output>
        {manualCopy && (
          <textarea
            readOnly
            aria-label="Nilai config untuk disalin manual"
            value={manualCopy}
            rows={8}
            onFocus={(event) => event.currentTarget.select()}
            className="tp-manual"
          />
        )}
      </div>
    </section>
  )
}
