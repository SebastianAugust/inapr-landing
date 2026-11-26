import type { PagesCopy } from './types'

const LOREM_LONG =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'

/**
 * Teks halaman tambahan (Bahasa Indonesia). Fakta asli hanya yang sudah ada di kamus utama
 * (id.ts) dan rebuild/docs/KONTEN-LAMA.md. Selebihnya lorem ipsum / placeholder: jangan mengarang
 * fakta, nomor, email, atau harga.
 */
export const pagesId: PagesCopy = {
  pageMeta: {
    daftar: {
      title: 'Daftar anggota · INAPR',
      description: 'Formulir pendaftaran anggota INAPR (Indonesian Association for Pattern Recognition).',
    },
    kegiatan: {
      title: 'Kegiatan · INAPR',
      description: 'Konferensi, webinar, dan kegiatan INAPR yang tercatat, lengkap dengan pencarian dan filter jenis.',
    },
    'kegiatan-detail': {
      title: 'Detail kegiatan · INAPR',
      description: 'Informasi lengkap satu kegiatan INAPR.',
    },
    webinar: {
      title: 'Arsip webinar · INAPR',
      description: 'Arsip lengkap webinar mingguan INAPR: judul, pembicara, rekaman, dan materi.',
    },
    anggota: {
      title: 'Direktori anggota · INAPR',
      description: 'Direktori anggota INAPR dengan pencarian: hanya nama dan institusi.',
    },
    kontak: {
      title: 'Kontak · INAPR',
      description: 'Alamat dan informasi kontak resmi INAPR (Indonesian Association for Pattern Recognition).',
    },
    privasi: {
      title: 'Kebijakan privasi · INAPR',
      description: 'Draf kebijakan privasi INAPR: data yang dikumpulkan, tujuan, penyimpanan, dan hak Anda.',
    },
    notfound: {
      title: 'Halaman tidak ditemukan · INAPR',
      description: 'Halaman yang Anda cari tidak ada di situs INAPR.',
    },
  },
  navPages: { webinar: 'Webinar', kontak: 'Kontak', privasi: 'Kebijakan privasi' },
  links: {
    kegiatanAll: 'Lihat semua kegiatan',
    webinarAll: 'Lihat arsip webinar lengkap',
    anggotaAll: 'Lihat direktori lengkap',
  },
  form: {
    requiredLegend: 'Kolom bertanda * wajib diisi.',
    optional: 'opsional',
    errorSummary: (count) =>
      count === 1 ? 'Ada 1 isian yang perlu diperbaiki:' : `Ada ${count} isian yang perlu diperbaiki:`,
    required: (label) => `${label} wajib diisi.`,
    tooShort: (label, min) => `${label} minimal ${min} karakter.`,
    tooLong: (label, max) => `${label} maksimal ${max} karakter.`,
    invalidEmail: 'Alamat email tidak valid. Contoh format: nama@institusi.ac.id.',
    invalidUrl: (label) => `${label} harus berupa tautan yang diawali http:// atau https://.`,
    consentRequired: 'Centang persetujuan kebijakan privasi untuk melanjutkan.',
    sending: 'Mengirim…',
    jsRequired:
      'Formulir ini memerlukan JavaScript. Aktifkan JavaScript di peramban Anda, atau hubungi pengurus lewat halaman Kontak.',
    unavailable: {
      title: 'Pendaftaran online belum aktif',
      body: 'Layanan penerima pendaftaran belum tersedia atau tidak dapat dihubungi saat ini. Data Anda TIDAK terkirim dan tidak disimpan. Silakan coba lagi nanti atau hubungi pengurus.',
      cta: 'Buka halaman Kontak',
    },
    serverError: {
      title: 'Pengiriman gagal',
      body: 'Server gagal memproses permintaan. Data Anda belum tersimpan. Coba lagi beberapa saat lagi; bila terus gagal, hubungi pengurus.',
    },
    rejected: (message) => `Server menolak data: ${message}`,
    conflict: 'Data ini sudah pernah didaftarkan. Hubungi pengurus bila Anda merasa ini keliru.',
    rateLimited: 'Terlalu banyak percobaan. Tunggu beberapa saat, lalu coba lagi.',
    consent: { before: 'Saya telah membaca dan menyetujui ', link: 'kebijakan privasi', after: '.' },
  },
  daftar: {
    eyebrow: 'Keanggotaan',
    title: { lead: 'Daftar ', accent: 'anggota', trail: ' INAPR' },
    sub: 'Isi formulir ini untuk mengajukan keanggotaan. Pengajuan Anda akan diverifikasi pengurus.',
    fields: {
      nama: { label: 'Nama lengkap', hint: 'Termasuk gelar bila ingin dicatat.' },
      email: { label: 'Email', hint: 'Dipakai pengurus untuk menghubungi Anda. Tidak ditampilkan di situs.' },
      institusi: { label: 'Institusi', hint: 'Perguruan tinggi, lembaga riset, atau perusahaan.' },
      tahun: { label: 'Tahun pendaftaran', hint: 'Tahun keanggotaan yang diajukan.' },
      bukti: {
        label: 'Tautan bukti bayar',
        hint: 'Tempelkan tautan ke berkas bukti pembayaran (mis. di penyimpanan daring). Berkas tidak diunggah di sini.',
        placeholder: 'https://…',
      },
    },
    submit: 'Kirim pendaftaran',
    success: {
      title: 'Pendaftaran diterima',
      body: 'Pendaftaran diterima, status menunggu verifikasi pengurus.',
    },
    infoTitle: 'Biaya dan ketentuan',
    infoBody: LOREM_LONG,
    fee: 'Iuran tahunan',
  },
  kegiatanPage: {
    eyebrow: 'Kegiatan',
    title: { lead: 'Semua ', accent: 'kegiatan' },
    sub: 'Konferensi, webinar, dan kegiatan INAPR yang tercatat, terbaru lebih dulu.',
    searchLabel: 'Cari kegiatan',
    searchPlaceholder: 'Tema, penyaji, institusi, atau lokasi',
    filterLabel: 'Jenis kegiatan',
    filters: { all: 'Semua', conference: 'Conference', webinar: 'Webinar', kegiatan: 'Kegiatan' },
    kinds: { conference: 'Conference', webinar: 'Webinar', kegiatan: 'Kegiatan' },
    showing: (from, to, total) => `Menampilkan ${from}–${to} dari ${total} kegiatan`,
    empty: 'Tidak ada kegiatan yang cocok dengan pencarian atau filter ini.',
    paginationLabel: 'Halaman daftar kegiatan',
    detail: 'Lihat detail',
    registrationOpen: 'Pendaftaran dibuka',
    undated: 'Tanggal belum tercatat',
  },
  kegiatanDetail: {
    back: 'Semua kegiatan',
    kicker: 'Detail kegiatan',
    notFound: {
      title: 'Kegiatan tidak ditemukan',
      body: 'Kegiatan dengan alamat ini tidak ada, sudah dihapus, atau tautannya salah.',
      cta: 'Lihat semua kegiatan',
    },
    labels: {
      date: 'Tanggal',
      time: 'Waktu',
      speaker: 'Penyaji',
      institution: 'Institusi',
      location: 'Lokasi',
      kind: 'Jenis',
    },
    noDescription: 'Deskripsi belum tersedia.',
    watch: 'Tonton di YouTube',
    slides: 'Buka materi',
    registration: {
      title: 'Pendaftaran peserta',
      fields: {
        nama: { label: 'Nama lengkap' },
        email: { label: 'Email', hint: 'Tidak ditampilkan di situs.' },
        institusi: { label: 'Institusi' },
      },
      submit: 'Daftar sebagai peserta',
      success: {
        title: 'Pendaftaran peserta diterima',
        body: 'Pendaftaran Anda untuk kegiatan ini sudah diterima.',
      },
    },
  },
  webinarPage: {
    eyebrow: 'Webinar',
    title: { lead: 'Arsip ', accent: 'webinar' },
    sub: 'Seluruh sesi webinar mingguan INAPR yang tercatat, terbaru lebih dulu.',
  },
  anggotaPage: {
    eyebrow: 'Anggota',
    title: { lead: 'Direktori ', accent: 'anggota' },
    sub: 'Hanya nama dan institusi yang ditampilkan; tidak ada data kontak atau data pribadi lain.',
    institution: 'Institusi',
  },
  kontak: {
    eyebrow: 'Kontak',
    title: { lead: 'Hubungi ', accent: 'INAPR' },
    sub: 'Informasi kontak resmi. Bagian bertanda placeholder menunggu data dari pengurus.',
    addressTitle: 'Alamat',
    emailLabel: 'Email',
    phoneLabel: 'Telepon',
    pending: 'Menunggu data resmi dari pengurus.',
    noForm: 'Halaman ini tidak memiliki formulir pesan.',
    registerNote: { before: 'Untuk menjadi anggota, gunakan ', link: 'formulir pendaftaran', after: '.' },
  },
  privasi: {
    eyebrow: 'Privasi',
    title: { lead: 'Kebijakan ', accent: 'privasi' },
    draftNotice: 'DRAF, perlu ditinjau pengurus sebelum rilis',
    updated: 'Draf disusun 26 November 2026.',
    sections: [
      {
        title: 'Data yang dikumpulkan',
        body: ['Situs ini hanya meminta data yang Anda isi sendiri lewat formulir.'],
        list: [
          'Pendaftaran anggota: nama, email, institusi, tahun pendaftaran, dan (opsional) tautan bukti bayar.',
          'Pendaftaran peserta kegiatan: nama, email, dan (opsional) institusi.',
          'Di peramban Anda disimpan hanya pilihan tema dan bahasa (localStorage). Tidak ada pelacak iklan.',
          'Isian formulir tidak disimpan di peramban dan tidak dicatat di konsol.',
        ],
      },
      {
        title: 'Tujuan penggunaan',
        body: [
          'Data dipakai untuk memproses dan memverifikasi pendaftaran, menghubungi pendaftar, dan mengelola keanggotaan atau kehadiran kegiatan oleh pengurus INAPR. Data tidak dijual.',
        ],
      },
      {
        title: 'Penyimpanan dan retensi',
        body: [
          'Data tersimpan di sistem yang dikelola pengurus INAPR dan hanya dapat diakses pengurus yang berwenang. Jangka waktu penyimpanan dan lokasi server: ditetapkan pengurus.',
        ],
        placeholder: true,
      },
      {
        title: 'Yang ditampilkan di situs',
        body: [
          'Direktori anggota hanya menampilkan nama dan institusi anggota aktif. Email, tautan bukti bayar, dan data lain tidak pernah ditampilkan.',
        ],
      },
      {
        title: 'Hak Anda',
        body: [
          'Anda dapat meminta akses, koreksi, atau penghapusan data Anda dengan menghubungi pengurus lewat halaman Kontak.',
        ],
      },
      {
        title: 'Perubahan kebijakan',
        body: ['Kebijakan ini masih berupa draf dan dapat berubah sebelum rilis. Perubahan akan dicantumkan di halaman ini.'],
      },
    ],
  },
  notFound: {
    eyebrow: '404',
    title: 'Halaman tidak ditemukan',
    body: 'Alamat yang Anda buka tidak ada di situs INAPR, atau halamannya sudah dipindahkan.',
    home: 'Kembali ke beranda',
    kegiatan: 'Lihat kegiatan',
  },
  footerPages: {
    privacy: 'Kebijakan privasi',
    contactPage: 'Halaman kontak',
    registerLink: 'Daftar anggota',
  },
}
