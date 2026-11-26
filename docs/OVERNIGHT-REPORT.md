# Laporan pengerjaan: animasi minimal + situs multi-halaman

Semua perubahan **belum di-commit** (tidak ada `git add`/`commit`/`push`/`stash`/`reset`/`checkout`/`clean`).
Keputusan yang diambil sendiri dan alasannya: [OVERNIGHT-LOG.md](OVERNIGHT-LOG.md).

## Status per fase

| Fase | Status |
| --- | --- |
| 1. Minimalkan animasi | **Selesai.** Reveal, CountUp, efek pointer, transisi tema/bahasa, transform/keyframes dekoratif dihapus. Yang bergerak: point field, scroll-snap/peredam roda/anchor, transisi warna 120 ms. Lihat README bagian "Animasi". |
| 2. Infrastruktur multi-halaman | **Selesai.** Vite multi-page, prerender semua halaman, kanonik/noindex/sitemap per halaman, dev + preview melayani rute situs, `vercel.json`, `docs/ROUTING.md`. |
| 3. Halaman | **Selesai** untuk 3.1-3.7. `/berita` dan `/publikasi` **dilewati** (belum ada sumber data), sesuai instruksi. |
| 4. Dokumen + verifikasi | **Selesai.** `docs/KONTRAK-DATA.md` diperbarui (bagian USULAN), dua build diverifikasi, laporan ini. |

## Status per halaman

| Rute | File | Status | Catatan |
| --- | --- | --- | --- |
| `/` | `index.html` | selesai | CTA/lihat-semua mengarah ke halaman baru; tanpa regresi Fase 1 |
| `/daftar` | `daftar.html` | selesai | Validasi, ringkasan galat berfokus, honeypot, timeout 8 dtk, "belum aktif" bila API mati (tidak pernah sukses palsu). Info biaya = Placeholder |
| `/kegiatan` | `kegiatan.html` | selesai | Filter jenis, pencarian, paginasi; data API (usulan) atau fallback lokal (37 entri) |
| `/kegiatan/{id}` | `kegiatan-detail.html` | selesai | Detail; formulir peserta hanya bila `pendaftaran_dibuka`; id tak ada/berbahaya → "tidak ditemukan" |
| `/webinar` | `webinar.html` | selesai | `WebinarList` varian halaman, 12/halaman |
| `/anggota` | `anggota.html` | selesai | Nama (+ institusi bila API menyediakan), 25/halaman |
| `/kontak` | `kontak.html` | sebagian | Hanya alamat resmi yang ada; email/telepon = Placeholder (kontak lama berupa gambar) |
| `/privasi` | `privasi.html` | sebagian | DRAF dengan penanda; retensi/lokasi server = Placeholder |
| 404 | `404.html` | selesai | Menggantikan `public/404.html` |
| `/berita`, `/publikasi` | - | dilewati | Tidak ada sumber data |

## Verifikasi yang dijalankan

- `tsc -b`, `oxlint` (0 peringatan), `npm run build` (base `/`) dan `npm run build:embed` (base `/landing/`): lulus.
- Pemeriksa tautan/aset atas `dist/*.html` di **kedua base**: 296 tautan/aset, 0 masalah (aset berawalan base dan ada di
  disk; tautan antar-halaman = rute situs absolut, tanpa `.html`, tanpa awalan `/landing/`).
- Preview kedua build (`vite preview`, embed dengan `--base=/landing/`): semua rute 200 (`/`, `/daftar`, `/kegiatan`,
  `/kegiatan/{id}`, `/webinar`, `/anggota`, `/kontak`, `/privasi`), rute tak dikenal 404 dengan halaman 404. Rute
  berawalan base (`/landing/daftar`) juga dipetakan.
- 94 pemeriksaan otomatis di Chrome headless (CDP, tanpa Playwright karena tidak terpasang) **per base**; semua lulus
  kecuali dua yang bukan galat aplikasi: peringatan `KHR_parallel_shader_compile` dari WebGL software di headless (home),
  dan log 404 untuk `/nope` (disengaja). Cakupan: satu `h1` per halaman; tanpa error konsol/exception; halaman non-home
  tidak meminta chunk `engine`/three.js; label terhubung ke input; `autocomplete`; submit kosong → 4 galat + fokus ke
  ringkasan; email/nama/tautan salah; API mati (404) → "belum aktif" bukan sukses; bentuk JSON POST; respons 400/409/429/500/HTML
  200/timeout 8 dtk; tombol nonaktif saat mengirim; sukses `{ok:true}`; honeypot → sukses palsu tanpa kirim; isian tidak
  masuk localStorage; API kegiatan (stub): id tak valid dibuang, `javascript:` ditolak, HTML tampil sebagai teks,
  formulir peserta + endpoint; pencarian/filter/paginasi; tombol tema dan bahasa EN (termasuk hidrasi tanpa mismatch);
  `aria-current="page"`; tanpa overflow horizontal di 360 dan 1440 px.
- Mode rilis (sementara `DRAFT_NOINDEX=false`, `VITE_SITE_URL` diisi; sudah dikembalikan): robots `Allow` + `Sitemap`, sitemap
  hanya 6 halaman indexable, `/daftar`/detail/404 tetap `noindex`, kanonik per halaman.
- Home (regresi Fase 1) diuji ulang: tanpa elemen `opacity: 0` saat load, anchor, tombol tema/bahasa, CLS 0.

## WAJIB ditinjau manusia

1. **Teks `/privasi`**: draf. Ada klaim yang harus dipastikan pengurus (tujuan, "data tidak dijual", retensi, lokasi server, hak akses/hapus).
2. **Kontak**: email dan telepon resmi (sekarang Placeholder); apakah alamat di footer/kontak masih berlaku.
3. **Kontrak API** di `docs/KONTRAK-DATA.md` (bagian USULAN): bentuk detail `{item}`, field `tanggal_selesai`, kode status, kebijakan 409 vs enumerasi
   email, apakah persetujuan privasi perlu dikirim ke server. Backend belum ada.
4. **Terjemahan Inggris** halaman baru (`src/i18n/pages-en.ts`): belum ditinjau penutur asli.
5. **Biaya/ketentuan keanggotaan** di `/daftar` dan home: masih placeholder (`Rp 000.000`, lorem).
6. Jenis kegiatan lokal: hanya konferensi pertama yang ditandai Conference (lihat log).

## Masalah dan keterbatasan yang diketahui

- Backend tidak ada, jadi jalur sukses POST dan data `activities` hanya diuji dengan stub `fetch`, bukan server nyata.
- Halaman statis: `/kegiatan/{id}` untuk id yang tidak ada tetap berstatus HTTP 200 (halaman memuat lalu menampilkan "tidak ditemukan"); `noindex` mencegah indeks.
- Formulir memerlukan JavaScript (disembunyikan tanpa JS; pemberitahuan di noscript). Isi halaman lain tetap terbaca tanpa JS.
- Navbar halaman non-home sengaja ringkas (5 tautan + Daftar); tautan section lain ada di footer.
- Kanonik di build embed mengikuti konvensi lama (`VITE_SITE_URL` + base): `https://host/landing/daftar`. Sesuaikan `VITE_SITE_URL` bila alamat publik berbeda.
- Tautan "Slide" webinar tetap butuh `VITE_SLIDES_BASE_URL` (data lokal hanya nama berkas).
- `assetUrl()` (`src/lib/routes.ts`) disediakan untuk aset statis tetapi belum ada aset yang memakainya.
- `docs/AUDIT.md` adalah catatan historis dan masih menyebut `usePointerFx.ts` (sudah dihapus di fase 1).
- Tidak ada dependency baru. `package.json`/`package-lock.json` tidak berubah. `members.json`, `webinars.json`, `src/pointfield/*`, `useAnchorRealign.ts` tidak berubah.

## File berubah

Dihapus (5):

- `public/404.html`
- `src/components/CountUp.tsx`
- `src/hooks/usePointerFx.ts`
- `src/hooks/useReveal.ts`
- `src/lib/motion.ts`

Baru (47):

- `404.html`
- `anggota.html`
- `config/pages.json`
- `config/pages.ts`
- `daftar.html`
- `docs/OVERNIGHT-LOG.md`
- `docs/ROUTING.md`
- `kegiatan-detail.html`
- `kegiatan.html`
- `kontak.html`
- `privasi.html`
- `src/bootstrap.tsx`
- `src/components/ActivityList.tsx`
- `src/components/MemberTable.tsx`
- `src/components/PageHeader.tsx`
- `src/components/PageProvider.tsx`
- `src/components/PageShell.tsx`
- `src/components/form/Field.tsx`
- `src/components/form/FormNotices.tsx`
- `src/components/form/RegistrationForm.tsx`
- `src/data/activities-local.ts`
- `src/entries/anggota.tsx`
- `src/entries/daftar.tsx`
- `src/entries/kegiatan-detail.tsx`
- `src/entries/kegiatan.tsx`
- `src/entries/kontak.tsx`
- `src/entries/notfound.tsx`
- `src/entries/privasi.tsx`
- `src/entries/webinar.tsx`
- `src/hooks/useMemberDirectory.ts`
- `src/i18n/pages-en.ts`
- `src/i18n/pages-id.ts`
- `src/lib/activity.ts`
- `src/lib/forms.ts`
- `src/lib/page.ts`
- `src/lib/routes.ts`
- `src/lib/submit.ts`
- `src/lib/year.ts`
- `src/pages/AnggotaPage.tsx`
- `src/pages/DaftarPage.tsx`
- `src/pages/KegiatanDetailPage.tsx`
- `src/pages/KegiatanPage.tsx`
- `src/pages/KontakPage.tsx`
- `src/pages/NotFoundPage.tsx`
- `src/pages/PrivasiPage.tsx`
- `src/pages/WebinarPage.tsx`
- `webinar.html`

Diubah (37):

- `README.md`
- `config/seo-plugin.ts`
- `docs/DEPLOY-VERCEL.md`
- `docs/KONTRAK-DATA.md`
- `scripts/prerender.mjs`
- `src/App.tsx`
- `src/components/EventCard.tsx`
- `src/components/Footer.tsx`
- `src/components/LangToggle.tsx`
- `src/components/Navbar.tsx`
- `src/components/PendingLink.tsx`
- `src/components/Section.tsx`
- `src/components/SectionRail.tsx`
- `src/components/SegmentedToggle.tsx`
- `src/components/ThemeToggle.tsx`
- `src/components/WebinarList.tsx`
- `src/data/api.ts`
- `src/data/index.ts`
- `src/entry-server.tsx`
- `src/hooks/useTheme.ts`
- `src/i18n/en.ts`
- `src/i18n/id.ts`
- `src/i18n/types.ts`
- `src/i18n/useI18n.ts`
- `src/lib/ui.ts`
- `src/main.tsx`
- `src/sections/Afiliasi.tsx`
- `src/sections/Anggota.tsx`
- `src/sections/Berita.tsx`
- `src/sections/Bidang.tsx`
- `src/sections/Gabung.tsx`
- `src/sections/Kegiatan.tsx`
- `src/sections/Publikasi.tsx`
- `src/sections/Tentang.tsx`
- `src/styles/global.css`
- `vercel.json`
- `vite.config.ts`
