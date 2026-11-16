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
  App.tsx               urutan halaman: Navbar, section + celah (SectionGap), Footer
  styles/tokens.css     design token (warna Terang/Gelap, font, tinggi navbar)
  styles/global.css     base style, utility cutting-mat, reduced motion
  i18n/                 kamus id.ts / en.ts, tipe di types.ts, hook useI18n
  hooks/                useTheme, useActiveSection, useHeaderMetrics, useLazyData
  components/           Navbar, Banner, Footer, Section, SectionGap, PointField, WebinarList, ...
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

- Pilihan Terang, Gelap, atau Sistem disimpan di `localStorage` (`inapr-theme`).
- Script kecil di `index.html` memasang `data-theme` di `<html>` sebelum render, jadi tidak ada
  kedipan tema yang salah.
- `src/hooks/useTheme.ts` menjaga atribut tersebut, mengikuti perubahan tema sistem, dan menyamakan
  `meta theme-color`.

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

- **Bintang selalu bergerak.** Seluruh titik berputar pelan mengelilingi pusat field seperti
  galaksi, tidak bergantung scroll. Titik dekat pusat sedikit lebih cepat, ada variasi acak per
  titik, plus gerak halus sinus. Semua dihitung di GPU (`shaders.ts`) dari uniform `uTime` dan
  atribut per titik.
- **Titik bentuk.** Sebagian titik (`shapeShare`, default 55%) dipilih acak tetap (PRNG seeded,
  `GEOMETRY_SEED`) untuk menjadi bentuk. Sisanya tetap bintang.
- **Satu bentuk per section 2..8**, berurutan: kubus, bola, torus, piramid, silinder,
  oktahedron, heliks. Section 1 (hero) hanya bintang. Sisi default (`sides`): kanan, kiri,
  kanan, kiri, atas, bawah, kanan. Sisi mendukung kiri/kanan/atas/bawah dan keempat sudut.
- **Siklus per section** dari progres scroll section itu:
  - MASUK (`phaseEnter`, 20%): kamera zoom-in menuju sisi bentuk, titik bentuk berkumpul;
  - TAHAN (sisanya, ±58%): bentuk utuh dan berputar pelan, kamera hampir diam;
  - LEPAS (`phaseRelease`, 22%): bentuk kembali menjadi bintang, kamera zoom-out.

  Di celah antar section (`SectionGap`, ±30vh) kamera berada di posisi zoom-out netral dan
  arah pandangnya berputar halus ke section berikutnya.
- **Posisi bentuk di layar.** Titik sasaran di layar di-unproject dari pose kamera zoom-in
  pada jarak `shapeDepth`:
  - kiri/kanan: pusat 30% dari tepi layar;
  - atas/bawah: pusat 24% dari tepi;
  - layar < 1024px: selalu di pita atas/bawah (kiri → atas, kanan → bawah).

  Ukuran bentuk = fraksi viewport, jadi tetap pas di rasio layar apa pun.
- **Tata letak** (`global.css`, hanya CSS, urutan DOM tetap):
  - ≥ 1024px: konten section bergeser ke sisi berlawanan dari bentuk, lebar 58%.
    Bentuk atas/bawah → konten penuh dengan kartu;
  - < 1024px: konten diberi kartu `surface` 86% tanpa blur;
  - tanpa WebGL: tata letak biasa (`data-pointfield="off"` di `<html>`).

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
| `cameraFar` / `cameraNear` | 16 / 7 | jarak kamera dari pusat saat zoom-out netral / zoom-in |
| `sideShift`, `sideLook` | 1.5, 2 | kamera bergeser dan menengok ke arah sisi saat zoom-in |
| `holdDrift` | 0.05 | drift yaw kamera selama fase tahan (radian) |
| `phaseEnter`, `phaseRelease` | 0.2, 0.22 | fraksi progres section untuk fase masuk dan lepas |
| `shapeDepth` | 10 | jarak bentuk di depan kamera zoom-in |
| `shapeSizeWide` / `shapeSizeBand` | 0.36 / 0.3 | diameter bentuk kiri/kanan dan atas/bawah (× tinggi viewport) |
| `shapeSizeNarrow` | 0.48 | diameter bentuk di layar < 1024px (× lebar, maks. `shapeSizeBand` × tinggi) |
| `sideOffsetX`, `bandOffsetY`, `narrowBandOffsetY` | 0.3, 0.24, 0.25 | pusat bentuk dari tepi layar |
| `shapeSpin` | 0.18 | rotasi lokal bentuk (rad/detik) |
| `shapeTiltY`, `shapeTiltX` | 0.7, 0.38 | kemiringan dasar bentuk (radian) |
| `morphSpeed`, `delaySpread` | 1.5, 0.3 | morph: `w = smoothstep(m·speed − delay·spread)`; selisih ≥ 1 agar morph penuh |
| `matParallax` | 0.1 | parallax cutting mat (0 = mati) |
| `yaw`, `pitch` | 8 entri | arah pandang netral per section |
| `sides` | 7 entri | sisi bentuk section 2..8 |

Konstanta yang tidak di-tuning ada di file yang sama:

| Konstanta | Isi |
|---|---|
| `WIDE_QUERY` | batas 1024px |
| `GAP_HEIGHT` | tinggi celah: 30vh desktop, 25svh mobile |
| `GEOMETRY_SEED` | seed acak geometri |
| `MAX_POINT_PX` | batas ukuran titik di layar |
| `SETTLE` | bentuk setengah jadi diselesaikan setelah scroll diam 450 ms |
| `MAX_PIXEL_RATIO`, `FOV`, `COLOR_TOKENS` | batas devicePixelRatio, field of view, token warna titik |

Lebar konten yang digeser (`--side-content-width`, 58%) dan alfa kartu (`--side-card-alpha`, 86%)
ada di `src/styles/global.css`.

### Panel tuning (khusus dev)

Buka dev server dengan **`?tune`**, mis. `http://localhost:5173/?tune`.

- Panel muncul di pojok kanan bawah. Bisa diciutkan dengan tombol atau Esc.
- Isinya:
  - slider dan input angka untuk tiap parameter (revolusi, kamera, fase, bentuk, titik);
  - tabel per section: dropdown sisi bentuk (section 2..8), yaw, dan pitch;
  - indikator: elemen aktif, T, fase (masuk/tahan/lepas), intensitas m, bentuk yang dimuat,
    N, dan mode lebar.
- Perubahan langsung terlihat, termasuk pergeseran konten saat sisi diganti. Jumlah titik dan
  radius field membangun ulang geometri dengan jeda 300 ms; parameter lain hanya mengubah uniform.
- Nilai disimpan sementara di localStorage (`inapr-tune`) supaya tidak hilang saat refresh.
  "Reset" kembali ke default dan menghapus nilai tersimpan.
- "Salin nilai" menyalin objek `POINTFIELD_DEFAULTS` (termasuk `sides`) siap tempel ke
  `src/config/pointfield.ts`. Nilai dari panel baru jadi permanen setelah ditempel di file itu.
- Kode panel ada di `src/dev/` dan dimuat hanya bila `import.meta.env.DEV` dan `?tune`, jadi tidak
  ikut bundel produksi. Panel ditata dengan `src/dev/tune.css` (kelas `tp-*`), bukan Tailwind:
  `global.css` memakai `@source not "../dev"`, jadi CSS produksi tidak berisi kelas panel.
- Di dev server, `window.__inaprPointField.debug()` memberi T, fase, morph, bentuk, posisi bentuk
  di layar (NDC), N, versi geometri, dan warna titik. Ini untuk skrip pengujian dan tidak ada di
  produksi.

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
  - **Klik tautan `#…` yang jauh** (lebih dari satu elemen): T langsung pindah ke awal section
    tujuan dan ditahan selama scroll native berjalan. Hanya bentuk tujuan yang dimuat, lalu
    bentuk itu terbentuk halus.
  - **Lompatan instan** lebih dari 1,5 elemen: T langsung disamakan, tanpa menyapu bentuk.
  - **Scroll berhenti di tengah fase masuk/lepas:** setelah 450 ms diam, bentuk diselesaikan ke
    keadaan terdekat (utuh atau lepas). Tidak ada bentuk setengah jadi yang tersangkut.
  - **Resize/rotasi:** posisi scroll dikembalikan ke progres relatif yang sama; posisi bentuk
    dihitung ulang. Tinggi viewport diambil dari `clientHeight`, jadi bar alamat mobile tidak
    menggeser T.
  - **Ganti tema:** warna titik memudar 200 ms tanpa membangun ulang geometri.
- `prefers-reduced-motion`: tanpa revolusi dan tanpa gerak kamera. Bintang statis, dan bentuk
  section aktif tampil statis di sisinya tanpa transisi (di celah: bentuk section sebelumnya).
- three.js baru diunduh setelah event `load` dan saat browser senggang (`PointField.tsx`), di dalam
  error boundary. Bila tanpa WebGL, saat error, atau saat context hilang, yang tampil hanya latar
  cutting mat, dan konten kembali ke tata letak biasa.

Kontrak DOM antara halaman dan engine:

- Urutan scroll = urutan DOM `[data-section]` (0..7) dan `[data-gap]` (0..6, `SectionGap`).
- Section 2..8 membawa `data-shape-side`. Nilai awalnya dari config (SSR/prerender); engine
  memperbaruinya bila parameter berubah. Konten section dibungkus `[data-section-body]`.
- Engine men-set `--mat-offset` di `<main>` untuk parallax cutting mat.

## Animasi mikro

Semua animasi menghormati `prefers-reduced-motion` (mati atau instan). Selain transisi warna saat
ganti tema, semuanya hanya menganimasikan transform dan opacity.

| Animasi | Di mana |
|---|---|
| Reveal saat scroll: fade + naik 16px, stagger 45ms | `src/hooks/useReveal.ts` + atribut `data-reveal`; CSS di `global.css` |
| Bayangan navbar setelah scroll; garis indikator menu aktif yang bergeser (≥ 768px) | `src/components/Navbar.tsx` |
| Tombol naik 2px saat hover/fokus (150ms). Kartu hanya naik bila berisi tautan/tombol (kartu webinar dengan "Tonton"/"Slide"); kartu lain statis | `buttonBase`, `cardLift` di `src/lib/ui.ts` |
| Transisi warna 200ms saat ganti tema | `src/hooks/useTheme.ts` + `.theme-transition` |
| Crossfade 200ms saat ganti bahasa (View Transitions API) | `src/components/LangToggle.tsx` |
| Angka statistik menghitung naik (1,2 detik) | `src/components/CountUp.tsx` (di Tentang) |

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
