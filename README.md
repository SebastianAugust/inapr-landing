# INAPR Frontend

Halaman utama INAPR (Indonesian Association for Pattern Recognition).
Vite + React 19 + TypeScript + Tailwind CSS v4. Hasil build berupa file statis di `dist/`.

## Menjalankan

Butuh Node.js 20.19+ atau 22.12+ (syarat Vite 8; dikembangkan dengan Node 24).

```bash
npm install
npm run dev       # dev server (http://localhost:5173)
npm run build     # cek tipe, build ke dist/, lalu prerender HTML ke dist/index.html
npm run preview   # sajikan dist/ secara lokal (cek hasil build)
npm run lint      # oxlint, termasuk semua aturan jsx-a11y
npm run data      # buat ulang src/data/*.json dari arsip situs lama
npm run og        # buat ulang favicon, apple-touch-icon, dan gambar OG
```

`npm run build` terdiri dari empat langkah:

1. `tsc -b` untuk cek tipe.
2. `vite build` untuk bundel klien.
3. `vite build --ssr` untuk bundel sementara di `dist-ssr/`.
4. `scripts/prerender.mjs`, yang menulis HTML hasil render ke `#root`.

Karena prerender, halaman sudah terbaca sebelum JavaScript jalan, bahkan tanpa JavaScript sama
sekali. Setelah JS dimuat, React merender ulang dengan bahasa dan tema pilihan pengguna.

Untuk deploy, unggah seluruh isi `dist/`. Panduan Vercel (CLI dan GitHub, domain, rollback,
mencabut noindex): [docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md).

## Struktur folder

```
config/seo-plugin.ts    Plugin Vite: og:image, kanonik, JSON-LD, preload font, robots.txt, sitemap.xml
docs/DEPLOY-VERCEL.md   panduan deploy ke Vercel
public/                 favicon.svg, apple-touch-icon.png, og.png (dibuat oleh scripts/make-og.mjs), 404.html
vercel.json             konfigurasi Vercel: build, header cache/keamanan, noindex selama draf
scripts/
  build-data.mjs        arsip inapr.org → src/data/*.json (sekali jalan)
  make-og.mjs           ikon + gambar OG dari kode (butuh devDependency sharp)
  prerender.mjs         langkah terakhir build
src/
  main.tsx              entri klien (font, CSS global, render <App />)
  entry-server.tsx      entri prerender
  App.tsx               urutan halaman: Navbar, section + jeda (Break), rel section, Footer
  styles/tokens.css     design token (warna Terang/Gelap, font, tinggi navbar)
  styles/global.css     base style, utility cutting-mat, reduced motion
  i18n/                 kamus id.ts / en.ts, tipe di types.ts, hook useI18n
  hooks/                useTheme, useActiveSection, useHeaderMetrics, useLazyData, usePointerFx
  components/           Navbar, Banner, Footer, Section, Break, SectionRail, PointField, ...
  sections/             satu file per section; urutan di sections/index.ts
  data/                 members.json, webinars.json (dimuat lazy) + loader di index.ts
  config/pointfield.ts  semua parameter animasi titik 3D (satu sumber)
  pointfield/           engine latar titik 3D (three.js, dimuat terpisah)
  dev/                  panel tuning (?tune, hanya dev server)
  lib/                  kelas UI bersama (ui.ts), pencarian, slide, storage
```

## Token desain

Semua warna ada di `src/styles/tokens.css`:

- Tema Terang ada di blok `:root`, tema Gelap di `:root[data-theme='dark']`.
- Token: `--bg`, `--surface`, `--ink`, `--accent`, `--accent-ink`, `--muted`, `--line`, `--mat`,
  `--grid-minor`, `--grid-major`, `--soft`, dan `--titik-1/2/3` (warna titik 3D).
- Blok `@theme inline` mendaftarkannya ke Tailwind, jadi kelasnya langsung bisa dipakai:
  `bg-bg`, `text-ink`, `border-line`, `bg-accent`, `text-titik-3`, dst.
- Untuk mengubah warna, cukup ubah nilai hex di kedua blok. Jangan menulis warna langsung di
  komponen. Satu-satunya putih adalah `--accent-ink` (teks di atas aksen).
- Ada tiga tempat yang menyalin warna secara manual dan perlu disesuaikan bila palet berubah:
  - `<meta name="theme-color">` di `index.html` (= `--bg`).
  - `public/favicon.svg`, `apple-touch-icon.png`, dan `og.png`: jalankan ulang `npm run og`,
    skripnya membaca `tokens.css`.
  - Engine titik membaca `--titik-*` saat tema berganti, jadi tidak perlu diubah.
- Font: `--font-heading` (Montserrat 300/500/800), `--font-sub` (Lato 400), `--font-body` (Hind
  Siliguri 400/500/600). Semuanya self-hosted dari `@fontsource`, subset latin, `font-display: swap`,
  diimpor di `src/main.tsx`. Montserrat 300 dan 800 di-preload.

Kontras (WCAG AA) sudah dicek untuk semua pasangan teks di kedua tema. Yang di bawah 3:1 hanya
elemen dekoratif: border kartu (`--line`) dan titik `--titik-3`.

## Tema

- Satu tombol ikon (`src/components/ThemeToggle.tsx`). Ikon = tema yang sedang **aktif**:
  matahari = Terang, bulan = Gelap.
- Default mengikuti `prefers-color-scheme`. Selama tombol belum pernah diklik, tampilan langsung
  ikut saat tema sistem berubah.
- Klik: ganti Terang ↔ Gelap dari tema yang sedang tampil, lalu simpan `light`/`dark` di
  `localStorage` (`inapr-theme`). Setelah itu perubahan tema sistem diabaikan. Tanpa
  localStorage, tombol tetap berfungsi untuk sesi itu.
- Script kecil di `index.html` memasang `data-theme` dan `meta theme-color` sebelum render
  (pilihan tersimpan; kalau tidak ada, tema sistem), jadi tidak ada kedipan tema yang salah.
  Ikon tombol dipilih CSS dari `data-theme`, jadi benar sejak paint pertama.
- `src/hooks/useTheme.ts` menjaga atribut tersebut dan menyamakan `meta theme-color`.
- Aksesibilitas: `aria-label` menyebut aksi ("Ganti ke mode gelap/terang"), `aria-pressed`
  bernilai true saat Gelap aktif, ikon `aria-hidden`.

## Bahasa (i18n) dan cara mengubah teks

- Semua teks UI ada di `src/i18n/id.ts` (default) dan `src/i18n/en.ts`. Bentuknya didefinisikan di
  `src/i18n/types.ts`, sehingga TypeScript menolak build bila salah satu bahasa ketinggalan kunci.
- Mengubah teks: cari kuncinya di `id.ts`, ubah, lalu ubah kunci yang sama di `en.ts`.
- Menambah teks baru: tambahkan kunci di `types.ts`, isi di kedua kamus, lalu pakai di komponen
  lewat `const { t } = useI18n()` dan `t.section.kunci`.
- Bahasa disimpan di `localStorage` (`inapr-lang`). `<html lang>`, judul dokumen, dan
  meta description ikut berganti.
- Data (nama anggota, judul webinar) tidak diterjemahkan.

## Latar titik 3D (`src/pointfield/`)

Konsep:

- **Saat membaca section:** kamera netral (zoom-out), seluruh titik berupa bintang. Layout halaman
  tidak dipengaruhi animasi.
- **Bintang selalu bergerak.** Seluruh titik berputar pelan mengelilingi pusat field seperti
  galaksi, tidak bergantung scroll. Titik dekat pusat sedikit lebih cepat, ada variasi acak per
  titik, plus gerak halus sinus. Semua dihitung di GPU (`shaders.ts`) dari uniform `uTime` dan
  atribut per titik.
- **Titik bentuk.** Sebagian titik (`shapeShare`, default 55%) dipilih acak tetap (PRNG seeded,
  `GEOMETRY_SEED`). Sisanya selalu bintang.
- **Di tiap jeda** (`Break`, ruang scroll kosong 70vh / 60svh, tanpa teks):
  - ZOOM IN 0–35%: kamera mendekat dan menengok ke satu sisi layar, bentuk terbentuk;
  - TAHAN 35–60%: bentuk utuh, berputar pelan;
  - LEPAS 60–100%: bentuk kembali menjadi bintang, kamera zoom-out sambil berbelok ke arah
    pandang section berikutnya.

  Section berikutnya selalu mulai di keadaan netral.
- **Bentuk per jeda 1..7:** kubus, bola, torus, piramid, silinder, oktahedron, heliks.
- **Sisi default (`sides`):** kiri, kanan, atas, bawah, kanan, kiri, atas. Keempat sudut juga
  didukung.
- **Posisi bentuk di layar.** Titik sasaran di layar di-unproject dari pose kamera zoom-in penuh
  pada jarak `shapeDepth`:
  - kiri/kanan: pusat 30% dari tepi;
  - atas/bawah: pusat 32% dari tepi, supaya tetap di dalam area jeda yang kosong.

  Ukuran bentuk = fraksi viewport (≥ 1024px dari tinggi, di bawahnya dari lebar).
- **Interaksi pointer di canvas** (listener pasif di `window`; canvas tetap `pointer-events: none`):
  - parallax: kamera miring maks. ±0.06 rad mengikuti pointer, memudar 2 detik setelah pointer
    diam;
  - medan dorong: titik di sekitar kursor terdorong menjauh. Perpindahan stateless, fungsi jarak
    di ruang layar; titik bentuk hanya 25% supaya bentuk tidak rusak;
  - riak: klik (mouse) atau tap (sentuh) memancarkan gelombang radial yang meredam, maks. 3
    bersamaan;
  - sentuh: dorong selama jari menyentuh (touch events pasif, tidak menghalangi scroll), tanpa
    parallax;
  - drag putar (mouse/pen): saat bentuk tampil di jeda, klik tahan lalu geser di area kosong untuk
    memutar bentuk. Rotasinya gaya trackball di sumbu layar, dengan inersia setelah dilepas.
    Kursor berubah grab/grabbing. Tidak aktif di atas isi section, tautan, atau tombol, di
    sentuhan, dan saat reduced motion. Rotasi di-reset saat ganti bentuk.

Semua parameter ada di satu file, **`src/config/pointfield.ts`** (`POINTFIELD_DEFAULTS`):

| Parameter | Default | Arti |
|---|---|---|
| `smoothing` | 0.18 | kehalusan skalar scroll T (0..1, besar = lebih responsif) |
| `countDesktop` / `countLowPower` / `countMobile` | 4200 / 2400 / 2000 | jumlah titik per jenis perangkat |
| `pointSize`, `pointOpacity` | 0.07, 0.9 | ukuran dan opasitas titik (ukuran dibatasi `MAX_POINT_PX`) |
| `fieldRadius` | 22 | radius bola field |
| `shapeShare` | 0.55 | proporsi titik yang menjadi bentuk |
| `revolutionSpeed` | 0.03 | kecepatan sudut revolusi di tepi field (rad/detik) |
| `revolutionCoreBoost` | 0.8 | pusat berputar (1 + nilai) × lebih cepat dari tepi |
| `revolutionVariation` | 0.25 | variasi acak kecepatan per titik (±) |
| `revolutionTiltX`, `revolutionTiltZ` | 0.35, 0.15 | kemiringan bidang putar (radian) |
| `wobbleAmplitude`, `wobbleSpeed` | 0.12, 0.6 | gerak halus per titik |
| `cameraFar` / `cameraNear` | 16 / 7 | jarak kamera dari pusat: netral / zoom-in penuh |
| `sideShift`, `sideLook` | 1.5, 2 | kamera bergeser dan menengok ke arah sisi saat zoom-in |
| `holdDrift` | 0.04 | drift yaw kamera selama fase tahan (radian) |
| `phaseFormEnd`, `phaseHoldEnd` | 0.35, 0.6 | batas fase di jeda: zoom-in/bentuk, tahan, lalu lepas/zoom-out |
| `shapeDepth` | 10 | jarak bentuk di depan kamera zoom-in |
| `shapeSizeWide` / `shapeSizeBand` | 0.36 / 0.26 | diameter bentuk kiri/kanan dan atas/bawah/sudut (× tinggi viewport, ≥ 1024px) |
| `shapeSizeNarrow` | 0.48 | diameter bentuk di layar < 1024px (× lebar, maks. `shapeSizeBand` × tinggi) |
| `sideOffsetX`, `bandOffsetY` | 0.3, 0.32 | pusat bentuk dari tepi kiri/kanan dan atas/bawah |
| `shapeSpin` | 0.18 | rotasi lokal bentuk (rad/detik) |
| `shapeTiltY`, `shapeTiltX` | 0.7, 0.38 | kemiringan dasar bentuk (radian) |
| `morphSpeed`, `delaySpread` | 1.5, 0.3 | morph: `w = smoothstep(m·speed − delay·spread)`; selisih ≥ 1 agar morph penuh |
| `parallaxStrength`, `parallaxSmoothing` | 0.06, 0.06 | parallax kamera (radian, kehalusan per frame) |
| `pushRadius`, `pushStrength` | 0.32, 0.06 | medan dorong: radius dan perpindahan maks. (NDC, tinggi layar = 2) |
| `pushShapeFactor` | 0.25 | pengali dorong/riak untuk titik bentuk |
| `rippleSpeed`, `rippleStrength`, `rippleWidth`, `rippleDamping` | 1.4, 0.05, 0.12, 1.6 | riak: kecepatan (NDC/detik), kekuatan, lebar gelombang, redaman (1/detik) |
| `dragSensitivity`, `dragInertia` | 0.008, 0.93 | drag putar bentuk: radian per px, kecepatan tersisa per frame setelah dilepas |
| `matParallax` | 0.1 | parallax cutting mat (0 = mati) |
| `yaw`, `pitch` | 8 entri | arah pandang netral per section |
| `sides` | 7 entri | sisi bentuk per jeda |

Konstanta yang tidak di-tuning ada di file yang sama:

| Konstanta | Isi |
|---|---|
| `BREAK_HEIGHT` | tinggi jeda: 70vh desktop, 60svh mobile |
| `WIDE_QUERY` | batas 1024px untuk ukuran bentuk |
| `GEOMETRY_SEED` | seed acak geometri |
| `MAX_POINT_PX` | batas ukuran titik di layar |
| `SETTLE` | bentuk setengah jadi diselesaikan setelah scroll diam 450 ms |
| `POINTER` | pointer memudar setelah 2 dtk diam, maks. 3 riak, batas tap |
| `MAX_PIXEL_RATIO`, `FOV`, `COLOR_TOKENS` | batas devicePixelRatio, field of view, token warna titik |

### Panel tuning (khusus dev)

Buka dev server dengan **`?tune`**, mis. `http://localhost:5173/?tune`.

- Panel muncul di pojok kanan bawah. Bisa diciutkan dengan tombol atau Esc.
- Isinya:
  - slider dan input angka untuk tiap parameter (revolusi, kamera, fase jeda, bentuk, pointer,
    titik);
  - tabel per section: yaw/pitch netral dan dropdown sisi bentuk di jeda sesudahnya;
  - indikator: elemen aktif, T, fase, intensitas m, bentuk yang dimuat, keaktifan pointer,
    jumlah riak, N, dan mode lebar.
- Jumlah titik dan radius field membangun ulang geometri dengan jeda 300 ms; parameter lain hanya
  mengubah uniform.
- Nilai disimpan sementara di localStorage (`inapr-tune`) supaya tidak hilang saat refresh.
  "Reset" kembali ke default dan menghapus nilai tersimpan.
- "Salin nilai" menyalin objek `POINTFIELD_DEFAULTS` (termasuk `sides`) siap tempel ke
  `src/config/pointfield.ts`. Nilai dari panel baru jadi permanen setelah ditempel di file itu.
- Kode panel ada di `src/dev/` dan dimuat hanya bila `import.meta.env.DEV` dan `?tune`, jadi tidak
  ikut bundel produksi. Panel ditata dengan `src/dev/tune.css` (kelas `tp-*`), bukan Tailwind:
  `global.css` memakai `@source not "../dev"`, jadi CSS produksi tidak berisi kelas panel.
- Di dev server, `window.__inaprPointField.debug()` memberi T, fase, morph, bentuk, posisi bentuk
  di layar (NDC), keaktifan pointer, riak, N, versi geometri, dan warna titik. Ini untuk skrip
  pengujian dan tidak ada di produksi.

Catatan engine:

- Jumlah titik ditentukan sekali saat engine dibuat oleh `pickDevice()` di `engine.ts`:
  - mobile (lebar < 768px atau sisi terpendek < 600px): 2000, ±1100 di antaranya titik bentuk;
  - perangkat lemah (≤ 4 core atau ≤ 4 GB RAM): 2400;
  - selain itu: 4200.
- Loop render berjalan terus selama tab terlihat, karena bintang selalu bergerak. Loop berhenti
  saat tab tersembunyi; dt dibatasi 50 ms. Tidak ada alokasi objek per frame.
- Intensitas bentuk I menggerakkan morph dan zoom kamera sekaligus. Ganti bentuk hanya terjadi
  saat bentuk lama sudah lepas penuh (I = 0); `aTarget` di-upload ulang hanya saat itu.
- Penanganan kasus rawan:
  - **Klik tautan `#…` yang jauh** (lebih dari satu elemen): T langsung pindah ke section tujuan
    (netral) dan ditahan sampai scroll native benar-benar dekat tujuan (atau 2,5 detik). Bentuk
    di jeda yang dilewati tidak dimuat.
  - **Lompatan instan** lebih dari 1,5 elemen: T langsung disamakan, tanpa menyapu bentuk.
  - **Scroll berhenti di tengah jeda:** setelah 450 ms diam, bentuk diselesaikan:
    - di fase lepas selalu ke lepas;
    - di fase masuk ke keadaan terdekat.

    Tidak ada bentuk setengah jadi yang tersangkut.
  - **Resize/rotasi:** posisi scroll dikembalikan ke progres relatif yang sama; posisi bentuk
    dihitung ulang. Tinggi viewport diambil dari `clientHeight`, jadi bar alamat mobile tidak
    menggeser T.
  - **Ganti tema:** warna titik memudar 200 ms tanpa membangun ulang geometri.
- `prefers-reduced-motion`: tanpa revolusi, tanpa gerak kamera, tanpa interaksi pointer.
  Bintang statis; di jeda, bentuknya tampil statis di sisinya tanpa transisi.
- three.js baru diunduh setelah event `load` dan saat browser senggang (`PointField.tsx`), di dalam
  error boundary. Bila tanpa WebGL, saat error, atau saat context hilang, canvas disembunyikan dan
  yang tampil hanya latar cutting mat.

Kontrak DOM antara halaman dan engine:

- Urutan scroll = urutan DOM `[data-section]` (0..7) dan `[data-break]` (0..6).
- Engine men-set `--mat-offset` di `<main>` untuk parallax cutting mat.

## Animasi mikro

Semua animasi menghormati `prefers-reduced-motion` (mati atau instan). Selain transisi warna saat
ganti tema, semuanya hanya menganimasikan transform dan opacity, tanpa layout shift. Efek hover
hanya aktif di `(hover: hover) and (pointer: fine)`, dan tiap efek punya padanan
`:focus-visible`.

| Animasi | Di mana |
|---|---|
| Reveal saat scroll: fade + naik 16px, stagger 45ms | `src/hooks/useReveal.ts` + atribut `data-reveal`; CSS di `global.css` |
| Bayangan navbar setelah scroll; garis indikator menu aktif yang bergeser (≥ 768px) | `src/components/Navbar.tsx` |
| Bilah progres scroll 2px (accent) di tepi bawah navbar (`scaleX`) | `src/components/Navbar.tsx` |
| Rel titik navigasi di tepi kanan (≥ 1280px): titik aktif, tooltip nama section saat hover/fokus, bisa diklik dan diakses keyboard | `src/components/SectionRail.tsx` |
| Tombol naik 2px saat hover/fokus (150ms). Kartu hanya naik bila berisi tautan/tombol (kartu webinar dengan "Tonton"/"Slide"); kartu lain statis | `buttonBase`, `cardLift` di `src/lib/ui.ts` |
| Tombol utama/CTA: magnetik (geser maks. 6px ke arah kursor) dan riak dari titik klik (keyboard: dari tengah) | kelas `fx-magnetic`, `fx-ripple` di `buttonPrimary`; `src/hooks/usePointerFx.ts` + `global.css` |
| Sorotan radial mengikuti kursor (`--mx`/`--my`) pada kartu interaktif saja; muncul juga saat fokus keyboard di dalam kartu | kelas `fx-spotlight` di `cardLift`; `usePointerFx.ts` + `global.css` |
| Tombol tema: ikon matahari/bulan berputar + crossfade 200ms. Toggle bahasa: thumb aktif meluncur (`transform`). Keduanya umpan balik tekan `scale(0.97)` | `src/components/ThemeToggle.tsx`, `src/components/SegmentedToggle.tsx` |
| Transisi warna 200ms saat ganti tema | `src/hooks/useTheme.ts` + `.theme-transition` |
| Crossfade 200ms saat ganti bahasa (View Transitions API) | `src/components/LangToggle.tsx` |
| Angka statistik menghitung naik (1,2 detik) | `src/components/CountUp.tsx` (di Tentang) |

Handler pointer (`usePointerFx`, bilah progres) memakai listener pasif dan diterapkan sekali per
`requestAnimationFrame`.

Reveal aman tanpa JS: elemen hanya disembunyikan bila hook memasang `data-reveal-pending`. Elemen
yang sudah terlihat saat halaman dibuka tidak dianimasikan. Untuk menambah reveal pada blok baru,
beri atribut `data-reveal`, tetapi jangan pada elemen yang berada di dalam blok lain yang juga
punya `data-reveal`.

## Data anggota dan webinar

```bash
npm run data      # = node scripts/build-data.mjs [folder-inapr.org], default ../inapr.org
```

- Skrip membaca `memberlist_files/sheet001.htm` dan `webinar.html` (read-only), membersihkan data,
  lalu menulis `src/data/members.json` dan `src/data/webinars.json`. Laporan pembersihan dicetak ke
  console. Jangan edit JSON-nya dengan tangan.
- **Anggota:** hanya nama yang disimpan. Kolom "Membership No." sengaja dibuang. Hasilnya 347 nama
  (1 duplikat pasti dibuang), sedangkan angka resmi 348.
- **Webinar:** 29 sesi berisi tanggal ISO, waktu, pembicara, institusi, judul, URL YouTube, nama
  file slide PDF, dan tautan paper.
- Kedua JSON dimuat lazy (`src/data/index.ts`), jadi tidak masuk bundel awal.

## Variabel env

Salin `.env.example` ke `.env.local`. Semua variabel boleh kosong.

| Variabel | Fungsi |
|---|---|
| `VITE_SITE_URL` | URL publik, mis. `https://inapr.org`. Dipakai untuk kanonik, og:url, og:image absolut, `url` di JSON-LD, dan `sitemap.xml`. Kosong = tag-tag itu dan sitemap tidak dibuat. Nilai tidak valid = build gagal. |
| `VITE_SLIDES_BASE_URL` | Folder slide PDF webinar, mis. `/slides/`. Kosong = tombol "Slide" disembunyikan. |
| `VITE_BASE` | Base path bila dihosting di subfolder, mis. `/inapr/`. Kosong = `/`. Jangan diisi di Vercel. |

Variabel `VITE_*` ditanam saat build: mengubahnya (juga di Vercel) butuh build ulang / redeploy.

`robots.txt` selalu dibuat saat build. **Selama draf** (`DRAFT_NOINDEX = true` di `config/seo-plugin.ts`)
isinya `Disallow: /`, `index.html` diberi meta `noindex`, dan `sitemap.xml` tidak dibuat. Setelah
final, baris `Sitemap:` ditambahkan bila `VITE_SITE_URL` diisi. Cara mencabut: docs/DEPLOY-VERCEL.md bagian E.

**Build produksi harus selalu dengan `VITE_SITE_URL` terisi** (domain final, tanya dosen), karena
og:image perlu URL absolut agar pratinjau tautan di media sosial muncul. Untuk draf/lokal boleh kosong.

## Aksesibilitas

- Ada skip link "Lewati ke konten", landmark header/nav/main/footer, satu `h1`, dan heading yang
  berurutan.
- Catatan kecil (diterima, jangan diubah kecuali ada keluhan): di 768–1279px menu (baris kedua)
  kena Tab lebih dulu daripada toggle dan CTA (baris pertama). Urutannya navigasi dulu, baru
  pengaturan.
- Fokus terlihat (outline 3px aksen). Toggle memakai `aria-pressed`. Burger memakai
  `aria-expanded`/`aria-controls`; Esc menutup panel dan mengembalikan fokus.
- `npm run lint` menjalankan 36 aturan jsx-a11y (port oxlint dari eslint-plugin-jsx-a11y).
- Tanpa JavaScript: `<noscript>` menampilkan pesan, dan kontrol yang butuh JS (kelas `js-only`)
  disembunyikan.

## Konten yang masih placeholder

Sumber fakta: `rebuild/docs/KONTEN-LAMA.md`. Blok contoh diberi tanda "placeholder".

- Banner "Draf layout" di paling atas (hapus bila konten final).
- Tentang: statistik "000 institusi".
- Bidang riset: seluruhnya.
- Publikasi: seluruhnya, termasuk tautan "Semua publikasi" dan "Baca".
- Keanggotaan (Gabung): langkah, manfaat, iuran, dan tautan formulir pendaftaran.
- Afiliasi: logo mitra (teks pengantar sudah fakta asli).
- Berita: seluruhnya, termasuk tautan "Semua berita".
- Footer: email kontak (kontak asli di situs lama hanya berupa gambar).
- Slide webinar: menunggu hosting PDF (`VITE_SLIDES_BASE_URL`).
