/**
 * Peredam scroll roda di zona jeda (params.scrollDamping).
 *
 * Tujuan: saat bentuk jeda terlihat, roda mouse/trackpad terasa "berat", jadi satu flick tidak
 * melompati bentuknya; di bagian lain (lead, zoom in awal, zoom out akhir, trail, section) scroll
 * terasa normal. Posisi scroll TIDAK PERNAH ditarik ke
 * mana pun: peredam hanya memperkecil jarak yang ditempuh oleh delta roda yang dikirim pengguna.
 *
 * Cara kerja
 * - Satu listener `wheel` di window ({ passive: false }). Event diambil alih hanya bila peredam
 *   aktif (scrollDamping, bukan reduced motion, bukan navigasi anchor) DAN faktor di posisi target
 *   < 1 atau loop peredam masih berjalan (supaya event berikutnya dari flick yang sama tidak
 *   berganti-ganti antara native dan peredam). Faktor tepat 1 → scroll native utuh.
 * - Faktor = fungsi posisi tengah viewport (factorAt → scrollmap.dampFactorAt): lerp(1,
 *   scrollDampFactor, w), w = smoothstep(dampWeightLow, dampWeightHigh, m), m = intensitas jeda di
 *   posisi itu (rumus yang sama dengan animasi). Kontinu; 1 di kedua ujung rentang dan di luarnya.
 * - REM KEDATANGAN (params.scrollBrake) di awal section 2..8, PEKA KECEPATAN. Kecepatan input =
 *   |delta| / selang antar event searah, dihaluskan EMA (px/s); bobot kecepatan s = smoothstep(
 *   slowPxS, fastPxS, kecepatan). Bobot rem w = brakeAt(y) × s, brakeAt = maks(zona bell di sekitar
 *   yRem, tahan kedatangan setelah yRem dilintasi). Faktor gabungan = min(faktor jeda,
 *   lerp(1, sectionBrakeFactor, w)), dan selisih target − posisi dibatasi sehingga langkah per frame
 *   ≤ maxDeltaPerFrame / w: input yang melebihi batas DIBUANG (tidak ditunda, tidak menarik balik).
 *   Input lambat/normal (s = 0) tidak tersentuh: faktor tepat 1, event tetap native.
 * - Peredam aktif di mana pun faktor gabungan < 1 atau batas lead berlaku, dengan syarat
 *   keselamatan yang sama.
 * - Delta dinormalkan (baris/halaman → px), lalu diintegrasikan per langkah kecil (DAMP.chunkPx)
 *   dengan faktor di tiap posisi, jadi flick besar yang masuk/keluar zona tetap halus.
 * - preventDefault, posisi target += delta teredam (dibatasi [0, maks scroll]); loop rAF
 *   mengejar target dengan lerp (DAMP.lerp per frame 60 fps) lewat scrollBy 'instant', berhenti
 *   saat selisih < DAMP.stopPx. Loop hanya berjalan setelah ada delta roda dari pengguna.
 * - Scroll-snap (proximity, awal section) tetap aktif. scrollBy dipakai, bukan scrollTo(y): di
 *   Chromium scrollTo programatik di-snap ke posisi snap TERDEKAT (juga ke belakang) dalam ±0,3
 *   viewport, sehingga peredam bisa terkunci; scrollBy adalah scroll berarah, jadi snap hanya bisa
 *   melompat SEARAH delta (sama seperti roda native). Bila snap melompati target, target ikut
 *   posisi aktual. Bila tulisan sama sekali tidak bergerak, roda di posisi itu dilepas ke native.
 *
 * Sinkronisasi (mencegah "macet" dan "naik lagi")
 * - Tiap frame: bila scrollY berbeda dari hasil tulisan terakhir (drag scrollbar, keyboard,
 *   sentuhan, navigasi, scroll anchoring, restorasi), target disamakan ke scrollY dan loop
 *   berhenti tanpa menulis. Event roda berikutnya juga mulai dari scrollY aktual.
 * - Tombol scroll, sentuhan, pointerdown di scrollbar/root, dan klik tautan #anchor langsung
 *   menghentikan loop. Selama navigasi anchor (sampai scroll diam / scrollend / batas aman)
 *   semua event roda dilepas ke native.
 * - Diabaikan (native): ctrl/meta (zoom), shift atau gerak dominan horizontal, target di elemen
 *   yang bisa digulir sendiri (input, textarea, panel overflow), event tidak cancelable, error.
 *
 * Keterbatasan: hanya roda/trackpad. Di perangkat sentuh swipe cepat tidak bisa diredam (scroll
 * sentuh tidak lewat event wheel, dan menahannya akan terasa macet). Inersia trackpad tetap
 * berupa event wheel, jadi diredam konsisten. Sisa animasi smooth-scroll native yang sedang
 * berjalan saat masuk zona ikut terhenti (scrollBy 'instant' membatalkannya). Satu-satunya
 * penulis posisi adalah scrollBy di loop ini, dan hanya untuk menerapkan delta roda pengguna.
 */
import { DAMP, SECTION_BRAKE } from '@/config/pointfield'
import { holdWeight, lerp, smoothstep } from './scrollmap'

export interface DampDebug {
  /** Loop peredam sedang menggerakkan scroll. */
  active: boolean
  /** Peredam boleh bekerja sekarang (parameter, reduced motion, navigasi). */
  enabled: boolean
  navigating: boolean
  /** Posisi target (px dokumen) dan faktor di posisi target. */
  target: number
  factor: number
  /** Event roda yang diredam / dilepas ke native; jumlah scrollTo; sinkronisasi karena sumber lain. */
  handled: number
  passed: number
  writes: number
  syncs: number
  /** Rem kedatangan: kecepatan input terakhir (px/s), bobot kecepatan, bobot rem di scrollY, total input dibuang (px). */
  speed: number
  speedWeight: number
  brake: number
  /** Bobot tahan kedatangan saat ini (0 = tidak aktif). */
  hold: number
  discarded: number
}

export interface WheelDamper {
  /** Hentikan loop dan samakan target ke scrollY (mis. setelah resize). */
  release(): void
  /** Sedang dalam navigasi anchor (peredam dan rem lepas). */
  isNavigating(): boolean
  debug(): DampDebug
  destroy(): void
}

interface WheelDamperOptions {
  /** Parameter dan reduced motion; false → semua event native. */
  enabled(): boolean
  /** Faktor redam profil posisi (jeda) (0..1] di posisi tengah viewport `mid` (px dokumen); 1 = tanpa redam. */
  factorAt(mid: number): number
  /** Bobot rem kedatangan 0..1 di scrollY `y` (zona awal section + tahan kedatangan); 0 = tanpa rem. */
  brakeAt(y: number): number
  /** sectionBrakeFactor, maxDeltaPerFrame (px per frame 60 fps) dan sectionHoldMs saat ini. */
  brake(): { factor: number; maxDeltaPerFrame: number; holdMs: number }
  /** Perpindahan scrollY from → to melintasi (atau tepat mendarat di) awal section (yRem)? */
  crossesRem(from: number, to: number): boolean
  /** Ada zona rem kedatangan di depan scrollY `y` (arah `dir`, dalam SECTION_BRAKE.lookaheadVh)? */
  brakeAhead(y: number, dir: number): boolean
}

/** Bobot kecepatan rem kedatangan: 0 untuk input lambat/normal, 1 untuk flick. */
function speedWeight(pxPerS: number): number {
  return smoothstep(SECTION_BRAKE.slowPxS, SECTION_BRAKE.fastPxS, pxPerS)
}

/** Lintasan yRem dihitung "kedatangan roda" bila terjadi dalam selang ini setelah event roda terakhir. */
const ARM_MS = 200
const SCROLL_KEYS = new Set([' ', 'Spacebar', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'])
const FRAME_MS = 1000 / 60

function viewport(): number {
  return document.documentElement.clientHeight || window.innerHeight
}

function maxScroll(): number {
  const root = document.scrollingElement ?? document.documentElement
  return Math.max(0, root.scrollHeight - viewport())
}

/** Target event berada di elemen yang bisa digulir sendiri (atau kontrol isian) → biarkan native. */
function inOwnScroller(target: EventTarget | null): boolean {
  let el = target instanceof Element ? target : null
  while (el && el !== document.body && el !== document.documentElement) {
    if (el.matches('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return true
    const style = getComputedStyle(el)
    if (/(auto|scroll|overlay)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 1) return true
    el = el.parentElement
  }
  return false
}

/** Delta vertikal dalam px (deltaMode 1 = baris, 2 = halaman). */
function normalizeDelta(event: WheelEvent): number {
  const unit = event.deltaMode === 1 ? DAMP.linePx : event.deltaMode === 2 ? viewport() * 0.9 : 1
  const limit = (DAMP.maxDeltaVh / 100) * viewport()
  return Math.max(-limit, Math.min(limit, event.deltaY * unit))
}

export function createWheelDamper(options: WheelDamperOptions): WheelDamper {
  let target = window.scrollY
  /** scrollY sesaat setelah tulisan terakhir peredam (-1 = belum/tidak sedang menulis). */
  let lastWritten = -1
  let raf = 0
  let lastFrame = 0
  /** Posisi tempat tulisan peredam tidak bisa maju; roda di posisi ini dilepas ke native. */
  let blockedAt = Number.NaN
  let navigating = false
  let navIdleTimer = 0
  let navMaxTimer = 0
  let handled = 0
  let passed = 0
  let writes = 0
  let syncs = 0
  // ---- Rem kedatangan: kecepatan input roda (px/s), EMA atas |delta| / selang antar event searah ----
  let speedSign = 0
  let speedAt = Number.NEGATIVE_INFINITY
  let lastSpeed = 0
  /** Bobot kecepatan event roda terakhir yang diterima (dipakai juga oleh loop). */
  let brakeSpeed = 0
  let discarded = 0
  // ---- Tahan kedatangan: dipicu bila yRem dilintasi tepat setelah input roda CEPAT ----
  /** Waktu dan bobot kecepatan event roda vertikal terakhir (juga yang dilepas ke native). */
  let lastWheelAt = Number.NEGATIVE_INFINITY
  /** Bobot kecepatan PUNCAK gestur roda saat ini (event searah tanpa jeda ≥ gestureGapMs). */
  let gesturePeak = 0
  let gestureDir = 0
  let lastSeenY = Number.NaN
  let holdStart = Number.NEGATIVE_INFINITY
  /** Kekuatan tahan = bobot kecepatan saat kedatangan (kedatangan lambat tidak memicu tahan). */
  let holdArm = 0
  /** Waktu yRem dilintasi dan arah kedatangan (untuk perpanjangan oleh inersia searah). */
  let holdBegin = Number.NEGATIVE_INFINITY
  let holdDir = 0

  /** Bobot tahan kedatangan sekarang (0..1): 1 selama sectionHoldMs, lalu pulih halus. */
  function holdNow(now: number): number {
    if (holdArm <= 0) return 0
    return holdWeight(now - holdStart, options.brake().holdMs, SECTION_BRAKE.releaseMs) * holdArm
  }

  const active = () => options.enabled() && !navigating

  /**
   * Catat delta dan kembalikan kecepatan input (px/s): |delta| / selang sejak event searah
   * sebelumnya (dibatasi), dihaluskan EMA. Event pertama setelah jeda / pembalikan arah memakai
   * selang maksimum, jadi notch tunggal selalu terbaca lambat.
   */
  function recordSpeed(now: number, delta: number): number {
    const sign = Math.sign(delta)
    const fresh = sign !== speedSign || now - speedAt > SECTION_BRAKE.maxIntervalMs
    const interval = fresh
      ? SECTION_BRAKE.maxIntervalMs
      : Math.min(SECTION_BRAKE.maxIntervalMs, Math.max(SECTION_BRAKE.minIntervalMs, now - speedAt))
    const inst = (Math.abs(delta) * 1000) / interval
    lastSpeed = fresh ? inst : lastSpeed + (inst - lastSpeed) * SECTION_BRAKE.speedSmoothing
    speedSign = sign
    speedAt = now
    return lastSpeed
  }

  /**
   * Bobot rem efektif di scrollY `y` untuk bobot kecepatan `s` (0 = tanpa rem): maks(zona × s,
   * tahan kedatangan). Tahan berlaku untuk semua input (termasuk ekor inersia yang sudah melambat),
   * tetapi hanya dipicu oleh kedatangan cepat.
   */
  function brakeWeightAt(y: number, s: number): number {
    const zone = s > 0 ? Math.min(1, Math.max(0, options.brakeAt(y))) * s : 0
    return Math.max(zone, holdNow(performance.now()))
  }

  /**
   * Faktor gabungan di scrollY `pos`: min(profil jeda, rem kedatangan). min(), bukan perkalian, jadi
   * trail jeda yang berimpit dengan zona awal section tidak menumpuk.
   */
  function factorAtPos(pos: number, s: number): number {
    const base = Math.min(1, Math.max(0.01, options.factorAt(pos + viewport() / 2)))
    const w = brakeWeightAt(pos, s)
    if (w <= 0) return base
    return Math.min(base, lerp(1, Math.min(1, Math.max(0.05, options.brake().factor)), w))
  }

  /**
   * Batas selisih target − posisi untuk rem kedatangan: dengan lerp DAMP.lerp per frame, langkah
   * per frame ≤ maxDeltaPerFrame / w. Infinity bila rem tidak bekerja.
   */
  function leadLimit(y: number, s: number): number {
    const w = brakeWeightAt(y, s)
    if (w <= 0) return Number.POSITIVE_INFINITY
    return Math.max(0.5, options.brake().maxDeltaPerFrame) / DAMP.lerp / w
  }

  /** Buang input yang melebihi batas lead (tidak pernah memindahkan posisi, tidak pernah mundur). */
  function clampLead(y: number, s: number): void {
    const limit = leadLimit(y, s)
    const lead = target - y
    if (Math.abs(lead) <= limit) return
    discarded += Math.abs(lead) - limit
    target = y + Math.sign(lead) * limit
  }

  /** Hentikan loop; target = posisi aktual. Tidak menulis scroll. */
  function release(): void {
    if (raf) window.cancelAnimationFrame(raf)
    raf = 0
    lastFrame = 0
    lastWritten = -1
    target = window.scrollY
  }

  /** Posisi diubah sumber lain sejak tulisan terakhir? */
  function changedElsewhere(y: number): boolean {
    return lastWritten >= 0 && Math.abs(y - lastWritten) > DAMP.externalPx
  }

  /** Target baru: integrasi faktor sepanjang delta (langkah kecil), dibatasi [0, maks]. */
  function advance(from: number, delta: number, s: number): number {
    const sign = Math.sign(delta)
    let left = Math.abs(delta)
    let pos = from
    while (left > 0) {
      const step = Math.min(left, DAMP.chunkPx)
      pos += sign * step * factorAtPos(pos, s)
      left -= step
    }
    return Math.min(maxScroll(), Math.max(0, pos))
  }

  function frame(now: number): void {
    raf = 0
    try {
      const y = window.scrollY
      if (changedElsewhere(y)) {
        syncs++
        release()
        return
      }
      if (!active()) {
        release()
        return
      }
      // Masuk zona / tahan kedatangan saat sisa input flick masih di depan: kelebihannya dibuang.
      clampLead(y, brakeSpeed)
      const diff = target - y
      if (Math.abs(diff) < DAMP.stopPx) {
        lastFrame = 0
        lastWritten = -1
        return
      }
      const dt = lastFrame ? Math.min(50, Math.max(0, now - lastFrame)) : FRAME_MS
      lastFrame = now
      const k = 1 - (1 - DAMP.lerp) ** (dt / FRAME_MS)
      const step = Math.abs(diff) < DAMP.snapPx ? diff : diff * k
      // scrollBy = scroll BERARAH: scroll-snap proximity hanya boleh melompat searah gerak (seperti
      // roda native), tidak pernah menarik balik. scrollTo(y) di-snap ke posisi terdekat, termasuk
      // ke belakang, jadi di sekitar titik snap peredam akan "terkunci" (terbukti di Chromium).
      window.scrollBy({ top: step, behavior: 'instant' })
      writes++
      const after = window.scrollY
      if (Math.abs(after - y) < 0.01) {
        // Tidak maju (batas dokumen / pembulatan / ditahan browser): selesai di posisi aktual. Bila
        // langkahnya nyata, roda di posisi ini dilepas ke native (tidak pernah terkunci).
        if (Math.abs(step) >= 1) blockedAt = after
        release()
        return
      }
      // Snap melompat searah gerak melewati target: target ikut posisi aktual (tidak ditarik balik).
      if ((after - target) * Math.sign(diff) > 0) {
        release()
        return
      }
      lastWritten = after
      raf = window.requestAnimationFrame(frame)
    } catch {
      release()
    }
  }

  function onWheel(event: WheelEvent): void {
    try {
      if (!active() || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey) return pass()
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.deltaY === 0) return pass()
      if (inOwnScroller(event.target)) return pass()
      const delta = normalizeDelta(event)
      // Kecepatan dihitung dari SEMUA event roda vertikal (juga yang dilepas ke native).
      const now = performance.now()
      const s = speedWeight(recordSpeed(now, delta))
      if (holdArm > 0) {
        if (Math.sign(delta) !== holdDir) {
          // Pembalikan arah = niat baru: tahan dilepas.
          holdArm = 0
        } else if (now - lastWheelAt < SECTION_BRAKE.gestureGapMs && now - holdBegin < SECTION_BRAKE.holdMaxMs && holdNow(now) > 0) {
          // Inersia / gestur yang sama masih berjalan: tahan diperpanjang.
          holdStart = now
        }
      }
      // Gestur: event searah tanpa jeda ≥ gestureGapMs (termasuk inersia trackpad yang melambat).
      if (Math.sign(delta) !== gestureDir || now - lastWheelAt >= SECTION_BRAKE.gestureGapMs) gesturePeak = 0
      gestureDir = Math.sign(delta)
      gesturePeak = Math.max(gesturePeak, s)
      lastWheelAt = now
      const y = window.scrollY
      if (Math.abs(y - blockedAt) < 1) return pass()
      blockedAt = Number.NaN
      if (!raf || changedElsewhere(y)) {
        if (raf) syncs++
        target = y
      }
      // Native utuh hanya bila: tanpa loop berjalan, faktor 1, tanpa batas lead, di luar zona rem
      // kedatangan, dan (untuk input cepat) tanpa zona rem di depan. Di dalam zona rem, input lambat
      // tetap ditangani peredam dengan faktor 1 (jarak sama), karena roda native di dekat judul
      // ditarik mundur oleh scroll-snap; scrollBy peredam berarah sehingga tidak pernah mundur.
      const takeOver =
        raf !== 0 ||
        factorAtPos(target, s) < 1 ||
        leadLimit(y, s) !== Number.POSITIVE_INFINITY ||
        options.brakeAt(target) > 0 ||
        holdNow(now) > 0 ||
        (s > 0 && options.brakeAhead(target, Math.sign(delta)))
      if (!takeOver) return pass(false)
      if (!event.cancelable) return pass()
      event.preventDefault()
      handled++
      brakeSpeed = s
      target = advance(target, delta, s)
      clampLead(y, s)
      if (lastWritten < 0) lastWritten = y
      if (!raf) raf = window.requestAnimationFrame(frame)
    } catch {
      release()
    }
  }

  /** Event dilepas ke native; loop (bila ada) dihentikan supaya tidak berebut dengan native. */
  function pass(stop = true): void {
    passed++
    if (stop && raf) release()
  }

  function endNavigation(): void {
    navigating = false
    window.clearTimeout(navIdleTimer)
    window.clearTimeout(navMaxTimer)
    release()
  }

  /** Navigasi programatik (klik #anchor, skip link, hashchange): peredam lepas sampai scroll diam. */
  function startNavigation(): void {
    navigating = true
    release()
    window.clearTimeout(navIdleTimer)
    window.clearTimeout(navMaxTimer)
    navIdleTimer = window.setTimeout(endNavigation, DAMP.navStartMs)
    navMaxTimer = window.setTimeout(endNavigation, DAMP.navMaxMs)
  }

  const onClick = (event: MouseEvent) => {
    if ((event.target as Element | null)?.closest?.('a[href^="#"]')) startNavigation()
  }
  const onScroll = () => {
    const y = window.scrollY
    // Kedatangan: yRem dilintasi dalam ARM_MS setelah input roda cepat → tahan kedatangan.
    const now = performance.now()
    if (!navigating && !Number.isNaN(lastSeenY) && options.crossesRem(lastSeenY, y)) {
      // Kekuatan = kecepatan puncak gestur yang membawa ke sini (flick yang sudah melambat tetap kuat).
      // Lintasan oleh loop peredam (sisa input roda) juga dihitung kedatangan roda.
      const arm = raf !== 0 || now - lastWheelAt < ARM_MS ? gesturePeak : 0
      if (arm > 0) {
        holdArm = Math.max(arm, holdNow(now))
        holdStart = now
        holdBegin = now
        holdDir = Math.sign(y - lastSeenY)
      }
    }
    lastSeenY = y
    // Tanpa loop: target selalu = posisi aktual (keyboard, drag scrollbar, sentuhan, navigasi).
    if (!raf) target = y
    if (!navigating) return
    window.clearTimeout(navIdleTimer)
    navIdleTimer = window.setTimeout(endNavigation, DAMP.navIdleMs)
  }
  const onScrollEnd = () => {
    if (navigating) endNavigation()
  }
  const onKey = (event: KeyboardEvent) => {
    if (raf && SCROLL_KEYS.has(event.key)) release()
  }
  const onTouch = () => {
    if (raf) release()
  }
  // Scrollbar halaman / area root: drag scrollbar mengambil alih.
  const onPointerDown = (event: PointerEvent) => {
    if (raf && (event.target === document.documentElement || event.pointerType === 'touch')) release()
  }

  const passive = { passive: true } as const
  window.addEventListener('wheel', onWheel, { passive: false })
  document.addEventListener('click', onClick, true)
  window.addEventListener('hashchange', startNavigation)
  window.addEventListener('scroll', onScroll, passive)
  window.addEventListener('scrollend', onScrollEnd)
  window.addEventListener('keydown', onKey, passive)
  window.addEventListener('touchstart', onTouch, passive)
  window.addEventListener('pointerdown', onPointerDown, passive)

  return {
    release,
    isNavigating: () => navigating,
    debug: () => ({
      active: raf !== 0,
      enabled: active(),
      navigating,
      target,
      factor: factorAtPos(target, brakeSpeed),
      handled,
      passed,
      writes,
      syncs,
      speed: lastSpeed,
      speedWeight: brakeSpeed,
      brake: Math.min(1, Math.max(0, options.brakeAt(window.scrollY))),
      hold: holdNow(performance.now()),
      discarded,
    }),
    destroy() {
      release()
      window.clearTimeout(navIdleTimer)
      window.clearTimeout(navMaxTimer)
      window.removeEventListener('wheel', onWheel)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('hashchange', startNavigation)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('scrollend', onScrollEnd)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouch)
      window.removeEventListener('pointerdown', onPointerDown)
    },
  }
}
