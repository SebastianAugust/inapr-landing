import type { PageKey } from '@/lib/routes'

export type Lang = 'id' | 'en'

export type SectionId =
  | 'tentang'
  | 'kegiatan'
  | 'bidang'
  | 'publikasi'
  | 'anggota'
  | 'gabung'
  | 'afiliasi'
  | 'berita'

/** Judul dengan satu bagian yang ditebalkan dan diberi warna aksen. */
export interface Title {
  lead: string
  accent: string
  trail?: string
}

export interface SectionHeadCopy {
  eyebrow: string
  title: Title
}

export interface Stat {
  value: string
  label: string
  placeholder?: boolean
}

export interface EventDate {
  /** Baris atas kotak tanggal, mis. "SEP 2018". */
  top: string
  /** Angka besar, mis. "07" atau "19–25". */
  main: string
}

export interface EventItem {
  date: EventDate | null
  tag: string
  title: string
  meta?: string
}

export interface Dictionary extends PagesCopy {
  /** Judul dokumen dan meta description; diganti saat bahasa berganti. */
  meta: { title: string; description: string }
  banner: string
  common: {
    /** Locale untuk Intl (format tanggal), mis. 'id-ID'. */
    locale: string
    placeholder: string
    placeholderHint: string
    linkPending: string
    skipToContent: string
    loading: string
    loadError: string
    /** Teks pembaca layar untuk tautan yang membuka tab baru. */
    newTab: string
    pagination: {
      prev: string
      next: string
      page: (page: number, pages: number) => string
    }
  }
  nav: {
    label: string
    /** Nama landmark rel titik navigasi section (≥ 1280px). */
    railLabel: string
    home: string
    items: Record<Exclude<SectionId, 'afiliasi'>, string>
    cta: string
    openMenu: string
    closeMenu: string
    /** Nama tombol tema (aria-label), menyebut aksi: ke mode lawan dari yang tampil. */
    theme: { toDark: string; toLight: string }
    langLabel: string
  }
  tentang: {
    eyebrow: string
    title: Title
    sub: string
    ctaPrimary: string
    ctaSecondary: string
    whatTitle: string
    whatBody: string
    applications: string[]
    /** Catatan pengesahan INAPR sebagai anggota IAPR. */
    membershipNote: string
    stats: Stat[]
  }
  kegiatan: SectionHeadCopy & {
    source: string
    featured: EventItem & { keynoteLabel: string; keynotes: string[] }
    items: EventItem[]
    webinar: {
      title: string
      /** Ringkasan, mis. "29 sesi, Des 2021 – Sep 2022". */
      summary: (count: number, range: string) => string
      searchLabel: string
      searchPlaceholder: string
      yearLabel: string
      allYears: string
      watch: string
      slide: string
      noVideo: string
      showMore: string
      showing: (shown: number, total: number) => string
      empty: string
    }
  }
  bidang: SectionHeadCopy & {
    items: { name: string; desc: string; counts: string }[]
  }
  publikasi: SectionHeadCopy & {
    more: string
    read: string
    items: { year: string; title: string; authors: string; tag: string }[]
  }
  anggota: SectionHeadCopy & {
    /** Angka resmi situs lama (sama dengan officialTotal di members.json). */
    total: string
    totalLabel: string
    asOf: string
    intro: string
    searchLabel: string
    searchPlaceholder: string
    caption: string
    columns: { no: string; name: string }
    showing: (from: number, to: number, total: number) => string
    empty: (query: string) => string
    paginationLabel: string
  }
  gabung: SectionHeadCopy & {
    sub: string
    steps: { title: string; desc: string }[]
    cta: string
    benefitsTitle: string
    benefits: string[]
    feeLabel: string
    fee: string
  }
  afiliasi: SectionHeadCopy & {
    sub: string
    logos: string[]
  }
  berita: SectionHeadCopy & {
    more: string
    items: { date: string; title: string; body: string }[]
  }
  footer: {
    tagline: string
    explore: string
    organization: string
    /** Link ke #afiliasi (keanggotaan INAPR di IAPR). */
    affiliation: string
    contact: string
    addressLabel: string
    address: string[]
    email: string
    fine: string
  }
}

// ---------- Halaman tambahan (multi-page): src/i18n/pages-id.ts dan pages-en.ts ----------

export interface PageMeta {
  title: string
  description: string
}

export interface FieldCopy {
  label: string
  hint?: string
  placeholder?: string
}

/** Teks bersama semua formulir (validasi, status kirim, galat server). */
export interface FormCopy {
  requiredLegend: string
  optional: string
  errorSummary: (count: number) => string
  required: (label: string) => string
  tooShort: (label: string, min: number) => string
  tooLong: (label: string, max: number) => string
  invalidEmail: string
  invalidUrl: (label: string) => string
  consentRequired: string
  sending: string
  jsRequired: string
  /** API tidak ada / tidak terjangkau / timeout / respons tidak valid: data TIDAK terkirim. */
  unavailable: { title: string; body: string; cta: string }
  serverError: { title: string; body: string }
  rejected: (message: string) => string
  conflict: string
  rateLimited: string
  /** Kebijakan privasi dalam kalimat: "{before}<tautan>{after}". */
  consent: { before: string; link: string; after: string }
}

export interface SuccessCopy {
  title: string
  body: string
}

export type ActivityKindKey = 'conference' | 'webinar' | 'kegiatan'

export interface PagesCopy {
  /** Judul + deskripsi tiap halaman selain home (home memakai `meta`). */
  pageMeta: Record<Exclude<PageKey, 'home'>, PageMeta>
  navPages: { webinar: string; kontak: string; privasi: string }
  /** Tautan "lihat semua" dari home ke halaman penuh. */
  links: { kegiatanAll: string; webinarAll: string; anggotaAll: string }
  form: FormCopy
  daftar: {
    eyebrow: string
    title: Title
    sub: string
    fields: { nama: FieldCopy; email: FieldCopy; institusi: FieldCopy; tahun: FieldCopy; bukti: FieldCopy }
    submit: string
    success: SuccessCopy
    infoTitle: string
    infoBody: string
    fee: string
  }
  kegiatanPage: {
    eyebrow: string
    title: Title
    sub: string
    searchLabel: string
    searchPlaceholder: string
    filterLabel: string
    filters: Record<'all' | ActivityKindKey, string>
    kinds: Record<ActivityKindKey, string>
    showing: (from: number, to: number, total: number) => string
    empty: string
    paginationLabel: string
    detail: string
    registrationOpen: string
    undated: string
  }
  kegiatanDetail: {
    back: string
    kicker: string
    notFound: { title: string; body: string; cta: string }
    labels: { date: string; time: string; speaker: string; institution: string; location: string; kind: string }
    noDescription: string
    watch: string
    slides: string
    registration: {
      title: string
      fields: { nama: FieldCopy; email: FieldCopy; institusi: FieldCopy }
      submit: string
      success: SuccessCopy
    }
  }
  webinarPage: { eyebrow: string; title: Title; sub: string }
  anggotaPage: { eyebrow: string; title: Title; sub: string; institution: string }
  kontak: {
    eyebrow: string
    title: Title
    sub: string
    addressTitle: string
    emailLabel: string
    phoneLabel: string
    pending: string
    noForm: string
    registerNote: { before: string; link: string; after: string }
  }
  privasi: {
    eyebrow: string
    title: Title
    draftNotice: string
    updated: string
    sections: { title: string; body: string[]; list?: string[]; placeholder?: boolean }[]
  }
  notFound: { eyebrow: string; title: string; body: string; home: string; kegiatan: string }
  footerPages: { privacy: string; contactPage: string; registerLink: string }
}
