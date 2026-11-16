/**
 * Parameter animasi titik 3D: SATU sumber kebenaran.
 *
 * Konsep: field bintang yang terus berputar pelan (revolusi galaksi, dihitung di GPU).
 * Saat membaca section, kamera di posisi netral (zoom-out) dan semua titik berupa bintang.
 * Di tiap jeda (Break) di antara section: ZOOM IN ke satu sisi layar sambil sebagian titik
 * (shapeShare) membentuk satu bentuk → TAHAN singkat → ZOOM OUT dan bentuk lepas kembali
 * menjadi bintang, tepat saat section berikutnya mulai terbaca.
 * Ditambah interaksi pointer di canvas: parallax kamera, medan dorong kursor, riak klik.
 *
 * Mengubah default: edit POINTFIELD_DEFAULTS di bawah. Untuk mencoba nilai secara
 * langsung, buka dev server dengan `?tune` (panel src/dev/tune.tsx), lalu "Salin nilai"
 * dan tempel ke sini.
 */

/** Sisi layar tempat bentuk muncul. Kombinasi = sudut. */
export const SHAPE_SIDES = [
  'left',
  'right',
  'top',
  'bottom',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const

export type ShapeSide = (typeof SHAPE_SIDES)[number]

export interface PointFieldParams {
  /** Faktor lerp skalar scroll T per frame 60 fps (0..1). Besar = lebih responsif. */
  smoothing: number

  // ---- Titik ----
  /** Jumlah titik per jenis perangkat (lihat pickDevice() di engine.ts). */
  countDesktop: number
  /** Perangkat lemah: ≤ 4 core CPU atau ≤ 4 GB RAM (bila browser melaporkannya). */
  countLowPower: number
  /** Layar kecil: lebar < 768px atau sisi terpendek < 600px. */
  countMobile: number
  /** Ukuran titik (satuan dunia, mengecil menurut jarak). Dibatasi MAX_POINT_PX. */
  pointSize: number
  pointOpacity: number
  /** Radius bola field (titik tersebar merata di volume). */
  fieldRadius: number
  /** Proporsi titik yang menjadi titik bentuk (0..1). Sisanya tetap bintang. */
  shapeShare: number

  // ---- Revolusi bintang (GPU, tidak bergantung scroll) ----
  /** Kecepatan sudut dasar di tepi field (rad/detik). */
  revolutionSpeed: number
  /** Tambahan kecepatan di pusat: pusat = (1 + nilai) × dasar, tepi = dasar. */
  revolutionCoreBoost: number
  /** Variasi acak kecepatan per titik (±fraksi). */
  revolutionVariation: number
  /** Kemiringan bidang putar (radian) terhadap sumbu X dan Z. */
  revolutionTiltX: number
  revolutionTiltZ: number
  /** Gerak halus per titik: amplitudo (satuan dunia) dan kecepatan (rad/detik). */
  wobbleAmplitude: number
  wobbleSpeed: number

  // ---- Kamera ----
  /** Jarak kamera dari pusat saat netral (zoom-out, selama membaca section). */
  cameraFar: number
  /** Jarak kamera dari pusat saat zoom-in penuh di jeda. */
  cameraNear: number
  /** Kamera bergeser ke arah sisi saat zoom-in (satuan dunia). */
  sideShift: number
  /** Titik pandang kamera menengok ke arah sisi saat zoom-in (satuan dunia). */
  sideLook: number
  /** Drift kamera selama fase tahan (radian yaw total, dari -½ ke +½). */
  holdDrift: number

  // ---- Fase di dalam jeda (fraksi progres jeda) ----
  /** ZOOM IN + bentuk terbentuk: 0 → phaseFormEnd. TAHAN: phaseFormEnd → phaseHoldEnd. LEPAS + ZOOM OUT: phaseHoldEnd → 1. */
  phaseFormEnd: number
  phaseHoldEnd: number

  // ---- Bentuk ----
  /** Jarak bentuk di depan kamera zoom-in (satuan dunia). */
  shapeDepth: number
  /** Diameter bentuk kiri/kanan (≥ 1024px), fraksi tinggi viewport. */
  shapeSizeWide: number
  /** Diameter bentuk atas/bawah/sudut (≥ 1024px), fraksi tinggi viewport; juga batas tinggi di layar sempit. */
  shapeSizeBand: number
  /** Diameter bentuk di layar < 1024px, fraksi lebar viewport. */
  shapeSizeNarrow: number
  /** Pusat bentuk kiri/kanan: jarak dari tepi layar, fraksi lebar viewport. */
  sideOffsetX: number
  /** Pusat bentuk atas/bawah: jarak dari tepi layar, fraksi tinggi viewport. */
  bandOffsetY: number
  /** Rotasi lokal bentuk (rad/detik) dan kemiringan dasarnya (radian). */
  shapeSpin: number
  shapeTiltY: number
  shapeTiltX: number
  /** Morph per titik: w = smoothstep(clamp(m * morphSpeed - delay * delaySpread)). morphSpeed - delaySpread ≥ 1. */
  morphSpeed: number
  delaySpread: number

  // ---- Interaksi pointer (canvas; tanpa efek saat reduced motion) ----
  /** Parallax: kemiringan kamera maks. (radian) mengikuti posisi pointer, dan kehalusannya (0..1 per frame). */
  parallaxStrength: number
  parallaxSmoothing: number
  /** Medan dorong: radius (NDC; tinggi layar = 2) dan perpindahan maks. (NDC). */
  pushRadius: number
  pushStrength: number
  /** Pengali dorong/riak untuk titik bentuk (kecil = bentuk tidak rusak). */
  pushShapeFactor: number
  /** Riak klik/tap: kecepatan rambat (NDC/detik), kekuatan (NDC), lebar gelombang (NDC), redaman (1/detik). */
  rippleSpeed: number
  rippleStrength: number
  rippleWidth: number
  rippleDamping: number

  /** Parallax latar cutting mat: offset = -scrollY * faktor. 0 = mati. */
  matParallax: number
  /**
   * Arah pandang netral per section (8 entri, indeks = data-section). Di jeda, arah
   * pandang berpindah ke section berikut selama fase lepas, jadi tiap zoom-in datang dari
   * arah lain.
   */
  yaw: readonly number[]
  pitch: readonly number[]
  /** Sisi bentuk per jeda (7 entri, indeks = data-break). */
  sides: readonly ShapeSide[]
}

export const POINTFIELD_DEFAULTS: Readonly<PointFieldParams> = Object.freeze({
  smoothing: 0.18,
  countDesktop: 4200,
  countLowPower: 2400,
  countMobile: 2000,
  pointSize: 0.07,
  pointOpacity: 0.9,
  fieldRadius: 22,
  shapeShare: 0.55,
  revolutionSpeed: 0.03,
  revolutionCoreBoost: 0.8,
  revolutionVariation: 0.25,
  revolutionTiltX: 0.35,
  revolutionTiltZ: 0.15,
  wobbleAmplitude: 0.12,
  wobbleSpeed: 0.6,
  cameraFar: 16,
  cameraNear: 7,
  sideShift: 1.5,
  sideLook: 2,
  holdDrift: 0.04,
  phaseFormEnd: 0.35,
  phaseHoldEnd: 0.6,
  shapeDepth: 10,
  shapeSizeWide: 0.36,
  shapeSizeBand: 0.26,
  shapeSizeNarrow: 0.48,
  sideOffsetX: 0.3,
  bandOffsetY: 0.32,
  shapeSpin: 0.18,
  shapeTiltY: 0.7,
  shapeTiltX: 0.38,
  morphSpeed: 1.5,
  delaySpread: 0.3,
  parallaxStrength: 0.06,
  parallaxSmoothing: 0.06,
  pushRadius: 0.32,
  pushStrength: 0.06,
  pushShapeFactor: 0.25,
  rippleSpeed: 1.4,
  rippleStrength: 0.05,
  rippleWidth: 0.12,
  rippleDamping: 1.6,
  matParallax: 0.1,
  yaw: Object.freeze([0.4, 2.6, 4.7, 0.9, 3.2, 5.4, 1.7, 3.9]),
  pitch: Object.freeze([0.12, -0.22, 0.28, -0.12, 0.2, -0.25, 0.1, -0.15]),
  sides: Object.freeze(['left', 'right', 'top', 'bottom', 'right', 'left', 'top'] as const),
})

/** Parameter yang mengubah posisi titik → geometri dibangun ulang bila berubah. */
export const GEOMETRY_KEYS = [
  'countDesktop',
  'countLowPower',
  'countMobile',
  'fieldRadius',
] as const satisfies readonly (keyof PointFieldParams)[]

// ---- Konstanta yang tidak di-tuning ----

/** Batas layar lebar (= breakpoint lg Tailwind, 64rem = 1024px): menentukan ukuran bentuk. */
export const WIDE_QUERY = '(min-width: 64rem)'

/**
 * Tinggi satu jeda (Break). Mobile = di bawah breakpoint md Tailwind (768px).
 * svh di mobile: stabil saat bar alamat muncul/menyusut.
 */
export const BREAK_HEIGHT = { desktop: '70vh', mobile: '60svh' } as const

/** Seed acak geometri: posisi dan penugasan titik bentuk sama di setiap kunjungan. */
export const GEOMETRY_SEED = 20170101

/** Batas ukuran titik di layar (px CSS) supaya bintang yang sangat dekat kamera tidak membesar. */
export const MAX_POINT_PX = 7

/**
 * Setelah scroll berhenti selama idleMs, bentuk yang setengah jadi diselesaikan ke
 * keadaan terdekat (utuh atau lepas) dengan faktor per frame `rate`. `scrollRate` =
 * faktor saat scroll aktif (hampir langsung mengikuti T).
 */
export const SETTLE = { idleMs: 450, rate: 0.07, scrollRate: 0.35 } as const

/**
 * Pointer: efek memudar setelah idleMs tanpa gerak; `fade` = faktor per frame naik/turun;
 * `pushSmoothing` = kehalusan posisi medan dorong; maks. riak bersamaan; tap = sentuhan
 * yang bergerak < tapSlop px dan < tapMs.
 */
export const POINTER = { idleMs: 2000, fade: 0.08, pushSmoothing: 0.3, maxRipples: 3, tapSlop: 12, tapMs: 350 } as const

/** Batas devicePixelRatio. */
export const MAX_PIXEL_RATIO = { mobile: 1.5, desktop: 2 } as const

/** Field of view: layar sempit pakai FOV lebih lebar. */
export const FOV = { narrow: 70, wide: 55, narrowBelow: 700 } as const

/** Token CSS warna titik (lihat src/styles/tokens.css). */
export const COLOR_TOKENS = ['--titik-1', '--titik-2', '--titik-3'] as const
