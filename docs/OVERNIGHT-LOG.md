# Log keputusan (sesi tanpa tanya)

Catatan keputusan yang diambil sendiri selama pengerjaan fase 1–4, beserta alasannya. Urut waktu.
Laporan ringkas ada di `OVERNIGHT-REPORT.md`.

## Umum

- **Membaca `rebuild/docs/KONTEN-LAMA.md`.** Aturan keras melarang membaca folder `rebuild`, tetapi butir 3.5 secara
  eksplisit menyuruh BACA file itu untuk halaman kontak. Keputusan: hanya file itu yang dibaca (read-only), tidak ada
  file lain di `rebuild`, `web`, atau `inapr.org`. Hasilnya: satu-satunya kontak resmi yang tercatat adalah alamat
  (sudah ada di footer); kontak aslinya masih berupa gambar, jadi email/telepon tetap Placeholder.
- **Fase 1 (minimalkan animasi)** sudah dikerjakan dan diverifikasi di sesi sebelumnya (lihat README bagian "Animasi").
  Tidak diulang.
- Saat memeriksa konteks sesi sebelumnya saya sempat menjalankan `git rm --cached` + `git reset` (tanpa efek: index
  kembali seperti semula, tidak ada yang di-stage). Sejak itu tidak ada perintah git yang mengubah index/riwayat.

## Fase 2: infrastruktur multi-halaman

- **Satu daftar halaman** di `config/pages.json` (dibaca vite config, plugin SEO, prerender). Alasan: satu sumber
  kebenaran, tidak ada daftar berkas yang tersebar di tiga tempat.
- **`appType: 'mpa'`** dan middleware `routeRewrite` (dev + preview) yang memetakan rute situs ke berkas, juga versi
  berawalan base (`/landing/daftar`), supaya build embed bisa diuji lokal dengan `vite preview --base=/landing/` meniru
  rewrite Next. Rute tak dikenal sekarang 404 (sebelumnya dev jatuh ke home).
- **Kepala dokumen halaman non-home disuntik plugin** (`config/seo-plugin.ts`): skrip anti-flash tema/bahasa, noscript,
  ikon, theme-color, og dasar, robots, kanonik. `index.html` TIDAK diubah (sesuai "index.html tetap"), jadi snippet
  anti-flash ada dua salinan (index.html + plugin); komentar di plugin menyebutnya. File html halaman lain hanya berisi
  judul + deskripsi + `#root` + skrip entri; judul/deskripsi/og dioverride prerender dari kamus Indonesia.
- **Kanonik per halaman** = `VITE_SITE_URL` (digabung base seperti sebelumnya) + rute tanpa slash awal. `/daftar`,
  `/kegiatan/{id}`, dan 404 selalu `noindex`; detail kegiatan dan 404 tanpa kanonik. Sitemap (hanya bila bukan draf)
  memuat semua halaman indexable. robots.txt tetap `Allow: /` saat rilis (noindex lewat meta, bukan Disallow, supaya
  crawler bisa membaca meta itu).
- **Prefetch chunk three.js hanya di index.html** (sebelumnya otomatis semua halaman). Dicek: halaman non-home tidak
  memuat chunk engine.
- **`public/404.html` dihapus** dan diganti `404.html` di akar (halaman Vite ter-prerender dengan desain yang sama).
- **`main.tsx` dipecah**: logika hidrasi pindah ke `src/bootstrap.tsx` (`mountPage`), dipakai home dan semua halaman.
  Entri tiap halaman di `src/entries/*.tsx` (4 baris). `entry-server.tsx` sekarang `render(pageKey)`.
- **Navbar halaman non-home**: tidak memuat 7 anchor section (terlalu padat bersama halaman baru). Isinya: Tentang
  (`/#tentang`), Kegiatan, Webinar, Anggota, Kontak + tombol Daftar. Semua anchor section lain ada di footer (`/#id`).
  Halaman aktif ditandai `aria-current="page"`. Di home tidak berubah (anchor), kecuali tombol Daftar → `/daftar`.
- **Footer** diperluas (halaman penuh + `/kontak` + `/privasi`); tautan section memakai `/#id` di halaman non-home.
- **vercel.json**: `cleanUrls` + rewrite `/kegiatan/:id` → `/kegiatan-detail`. Header `X-Robots-Tag: noindex` global
  (mode draf) tidak diubah; langkah rilis dicatat di `docs/ROUTING.md`.

## Fase 3: halaman

- **`tahun_daftar`**: pilihan hanya tahun berjalan dan tahun berikutnya (select, bukan input bebas), default tahun
  berjalan. Alasan: "tidak bisa diubah bebas" tetapi pendaftaran akhir tahun untuk tahun depan masuk akal. Tahun dibaca
  lewat `useCurrentYear` (tahun build saat hidrasi) supaya tidak ada hydration mismatch.
- **Honeypot**: kolom `alamat_web` (di luar layar, `tabIndex=-1`, di dalam wadah `aria-hidden`). Terisi → tampilan
  sukses palsu tanpa mengirim (satu-satunya "sukses palsu" yang diizinkan, sesuai spesifikasi).
- **Hasil kirim**: sukses HANYA bila 2xx dengan badan `{ok:true}`. 404, 405, 502/503/504, jaringan, timeout 8 dtk,
  atau badan bukan JSON/HTML (mis. fallback SPA `200 text/html`) → kotak "Pendaftaran online belum aktif" (+ tautan
  /kontak). 400/422 `{ok:false,error}` → pesan server (dipotong 200 karakter, di-escape React); 409 → sudah terdaftar;
  429 → terlalu banyak percobaan; 500 JSON → gagal memproses. Isi formulir tidak masuk localStorage/konsol.
- **Persetujuan privasi tidak dikirim ke server** (body persis seperti spesifikasi: `{nama,email,institusi,tahun_daftar,
  bukti_bayar?}`); hanya syarat di klien. Dicatat di kontrak sebagai usulan opsional `persetujuan_privasi`.
- **Kontrak activities (USULAN)**: `GET /api/public/activities` → `{items:[…]}`; `GET /api/public/activities/{id}` →
  `{item:{…}}` (bentuk detail tidak ditentukan spesifikasi; saya pilih `item` agar simetris dengan `items`). Field
  `jenis` dinormalisasi: awalan "conf"/"konf" → conference, "webinar" → webinar, selain itu kegiatan. Ditambah field
  opsional `tanggal_selesai` (kegiatan beberapa hari). `id` wajib `[A-Za-z0-9_-]{1,100}` (aman untuk URL); item dengan
  id/tema tidak valid dibuang. `pendaftaran_dibuka` hanya `true`/`1` yang dianggap dibuka.
- **Fallback lokal kegiatan**: 8 kegiatan di kamus (konferensi 7 Sep 2018 = jenis Conference, sisanya Kegiatan) +
  webinar dari `getArchives()` (jenis Webinar), id = slug stabil `{tanggal}-{judul}` (kembar diberi `-2`). Hanya
  Konferensi pertama yang saya tandai Conference; ICPR/JWG tetap "Kegiatan" supaya tidak mengklaim peran INAPR yang
  tidak tercatat. Dua kegiatan tanpa tanggal (AIS 2020, TFRIC19) tampil di akhir dengan "Tanggal belum tercatat".
  Judul/keterangan kegiatan lokal mengikuti bahasa aktif (acuan ke kamus), data dari server ditampilkan apa adanya.
  `pendaftaran_dibuka` selalu false untuk data lokal, jadi formulir peserta tidak pernah muncul tanpa server.
- **Detail kegiatan**: id dibaca di klien dari `/kegiatan/{id}` (atau `?id=`); prerender menampilkan keadaan
  "memuat" (h1 sr-only) agar hidrasi cocok. Id tak valid/tak ada → "Kegiatan tidak ditemukan" (bukan layar kosong).
  Tautan YouTube/materi hanya http(s); deskripsi dirender sebagai teks (tanpa `dangerouslySetInnerHTML`).
- **`/webinar`** memakai `WebinarList` varian `page` (paginasi 12/halaman, judul kartu h2); home tetap varian
  `section` + tautan "Lihat arsip webinar lengkap". **`/anggota`**: logika dipindah ke `useMemberDirectory` +
  `MemberTable` (dipakai juga section #anggota); kolom institusi muncul hanya bila sumber (API) memuatnya, data lokal
  hanya nama. 25 baris/halaman.
- **`/kontak`**: hanya alamat (sudah di footer, dari KONTEN-LAMA.md). Email: `email@lorem.ipsum` + Placeholder (seperti
  footer). Telepon: pola `+00 000 0000 0000` + Placeholder. Tidak ada formulir, tidak ada email/telepon karangan.
- **`/privasi`**: draf dengan penanda "DRAF, perlu ditinjau pengurus sebelum rilis" di atas halaman. Hanya klaim yang
  bisa diverifikasi dari kode (data formulir, localStorage tema/bahasa, tanpa pelacak, direktori hanya nama+institusi);
  retensi/lokasi server = Placeholder. Tanggal draf 26 November 2026.
- **`/berita` dan `/publikasi` DILEWATI** (belum ada sumber data), sesuai instruksi. Tautan "Semua berita/publikasi"
  di home tetap PendingLink.
- **Home**: tombol Daftar (navbar), CTA "Jadi anggota", dan tombol di section Gabung → `/daftar`; section Kegiatan
  punya tautan "Lihat semua kegiatan"; section Anggota "Lihat direktori lengkap"; daftar webinar → `/webinar`.
- **Preview**: `config/pages.ts` ditambah `previewNotFound` supaya `vite preview` menyajikan `404.html` (status 404)
  untuk rute tak dikenal, seperti hosting statis.
- Kegagalan awal pada uji browser ternyata dari harness (scroll halus membuat klik meleset), bukan dari aplikasi;
  diperbaiki di skrip uji, tidak ada perubahan aplikasi untuk itu.
