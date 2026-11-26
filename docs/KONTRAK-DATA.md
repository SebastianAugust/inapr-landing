# Kontrak data landing ↔ backend

Landing menampilkan dua daftar yang bisa berasal dari backend: **anggota** (#anggota, /anggota) dan **arsip webinar** (#kegiatan, /webinar).
Kode: `src/data/api.ts` (`getMembers()`, `getArchives()`). Untuk kedua daftar ini landing **hanya membaca** (GET) dan **hanya memakai anon key**.
Kegiatan dan formulir pendaftaran (GET `activities`, POST `registrations`, POST `activities/{id}/register`) adalah kontrak **USULAN**: lihat bagian "Kegiatan dan pendaftaran".

## Pemilihan sumber

Dibaca saat **build** (variabel `VITE_*` ditanam ke JavaScript; ubah → build ulang / redeploy). Urutan prioritas:

| Mode | Syarat | Yang dipanggil |
| --- | --- | --- |
| **a. Backend eksplisit** | `VITE_API_BASE` terisi | `GET {VITE_API_BASE}/api/public/members` dan `/api/public/archives` |
| **a′. Same-origin** | `VITE_API_BASE` kosong **dan** build produksi (di dev: hanya bila `VITE_API_PROXY` terisi) | `GET /api/public/members` dan `GET /api/public/archives` (path **absolut**) |
| **b. Supabase langsung** | tidak ada (a)/(a′), `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` terisi | REST PostgREST (di bawah) |
| **c. Lokal** | selain itu | `src/data/members.json`, `src/data/webinars.json` (perilaku sebelumnya) |

`VITE_API_BASE` boleh `https://api.inapr.org` atau `/` (satu origin / lewat proxy dev). Nilai tidak valid (bukan http(s) atau `/…`) dianggap tidak ada → mode lokal;
bila `VITE_API_BASE` terisi tetapi tidak valid, mode (a′) dan (b) **tidak** dicoba.

**Akibat urutan ini:** pada build produksi tanpa `VITE_API_BASE`, mode (a′) selalu terpilih, jadi mode (b) (Supabase) praktis hanya terjangkau di dev server
(tanpa `VITE_API_PROXY`). Untuk memakai Supabase di produksi, tidak ada jalur otomatis; jika (a′) gagal, landing jatuh ke data **lokal**, bukan ke Supabase.

### Mode (a′): same-origin & embed ke app Next

Landing di-embed ke app Next dengan `npm run build:embed` (`vite build --base=/landing/`, plus prerender) dan dilayani di `/` lewat rewrite.
Seluruh asset memakai awalan `/landing/`, tetapi **panggilan API tidak**: landing memanggil `/api/public/members` dan `/api/public/archives` (tanpa `/landing`),
yang harus dijawab route handler milik app Next yang sama (satu origin, tanpa CORS).

* Path API dibuat absolut dengan sengaja; jangan diubah menjadi relatif terhadap `import.meta.env.BASE_URL`.
* Request tanpa cookie (`credentials: 'omit'`).
* Bila route belum ada / mengembalikan 404 / 5xx / HTML (mis. fallback SPA, `200 text/html`) / timeout, landing diam-diam memakai data lokal.
  Peramban tetap mencatat `Failed to load resource … 404` di konsol DevTools untuk 404; itu perilaku bawaan peramban, bukan galat di UI.
* Dev: `VITE_API_PROXY=http://localhost:3000 npm run dev` mem-proxy `/api` ke app Next lokal dan mengaktifkan mode ini.

### Mode (a)/(a′): bentuk respons

`200 application/json`, objek dengan satu kunci `items` berisi array. Nama field di `items` **sama dengan kolom Supabase**.
Backend bertugas hanya mengirim anggota `status = Active` dan `tampil_di_publik = true`; landing tidak menyaring ulang.
Field tambahan diabaikan (dibuang) oleh landing, tetapi **jangan dikirim** (lihat bagian data sensitif).

**`GET /api/public/members`**

```json
{
  "items": [
    { "nama": "Dr. Contoh Satu", "institusi": "Institut Teknologi Contoh" },
    { "nama": "Contoh Dua, M.Kom.", "institusi": "Universitas Contoh" },
    { "nama": "Contoh Tiga", "institusi": "" }
  ]
}
```

| Field | Tipe | Wajib | Batas / aturan |
| --- | --- | --- | --- |
| `items` | array | ya | **maks. 2000** item diproses; sisanya dibuang |
| `items[].nama` | string | ya | maks. 200 karakter; kosong/bukan string → item dibuang |
| `items[].institusi` | string | tidak | maks. 200 karakter; bukan string → `""` |

**`GET /api/public/archives`**

```json
{
  "items": [
    {
      "tanggal": "2025-11-20",
      "waktu": "16:00:00",
      "penyaji": "Dr. Contoh Satu",
      "institusi": "Institut Teknologi Contoh",
      "tema": "Pengenalan Pola untuk Citra Medis",
      "youtube_url": "https://www.youtube.com/watch?v=XXXXXXXXXXX",
      "materi_url": "https://example.org/slides/2025-11-20.pdf"
    },
    {
      "tanggal": "2025-10-02",
      "waktu": "16.00–17.00",
      "penyaji": "Contoh Dua",
      "institusi": "Universitas Contoh",
      "tema": "Topik Tanpa Video dan Slide",
      "youtube_url": null,
      "materi_url": null
    }
  ]
}
```

| Field | Tipe | Wajib | Batas / aturan |
| --- | --- | --- | --- |
| `items` | array | ya | **maks. 500** item diproses; landing mengurutkan ulang (tanggal terbaru dulu) |
| `items[].tanggal` | string | ya | `YYYY-MM-DD` (timestamp ISO dipotong ke tanggalnya); tanggal tidak ada di kalender / tidak valid → item dibuang |
| `items[].waktu` | string \| null | tidak | `HH:MM:SS` → `HH.MM`; teks bebas dipakai apa adanya (maks. 40 karakter) |
| `items[].tema` | string | ya | maks. 300 karakter; kosong → item dibuang |
| `items[].penyaji` | string \| null | tidak | maks. 200 karakter |
| `items[].institusi` | string \| null | tidak | maks. 200 karakter |
| `items[].youtube_url` | string \| null | tidak | **hanya URL `http(s)`** (maks. 2000 karakter); selain itu (`javascript:`, `data:`, relatif, …) → dianggap kosong |
| `items[].materi_url` | string \| null | tidak | **hanya URL `http(s)`** penuh, maks. 2000 karakter; selain itu → tanpa slide |

Seluruh string dirapikan (spasi ganda → satu, dipangkas) dan dirender sebagai teks (bukan HTML).

### Header respons yang disarankan

Data publik berubah jarang dan tidak personal, jadi boleh di-cache di CDN:

```
Content-Type: application/json; charset=utf-8
Cache-Control: public, s-maxage=300, stale-while-revalidate=3600
```

CDN menyimpan 5 menit dan boleh menyajikan salinan basi hingga 1 jam sambil menyegarkan di latar. Jangan menambahkan `Set-Cookie`; landing tidak mengirim/menerima cookie.
Opsional: `X-Content-Type-Options: nosniff`. Ukuran badan sebaiknya < 2 MB (landing menolak bila `Content-Length` lebih besar).

### Data sensitif: TIDAK boleh ada di endpoint publik

Endpoint `/api/public/*` terbuka untuk siapa saja dan di-cache CDN. **Dilarang** mengirim: nomor keanggotaan, alamat email, nomor telepon/WhatsApp, alamat rumah,
status/riwayat iuran, catatan internal, ID internal yang bisa dipakai menebak data lain, atau kolom privat lain. Landing membuang field tak dikenal, tetapi itu
bukan perlindungan: **data yang sudah terkirim ke peramban sudah bocor** (terlihat di tab Network). Backend wajib memilih kolom secara eksplisit (jangan `select *` / serialisasi
penuh objek DB) dan hanya mengirim anggota `status = Active` dengan `tampil_di_publik = true`.

### Mode (b): permintaan Supabase

Header: `apikey: <anon key>`, `Authorization: Bearer <anon key>`. Kolom ditulis eksplisit (tidak ada `select=*`).

```
GET {VITE_SUPABASE_URL}/rest/v1/members
    ?select=nama,institusi&status=eq.Active&tampil_di_publik=eq.true&order=nama.asc&limit=2000

GET {VITE_SUPABASE_URL}/rest/v1/activity_archives
    ?select=tanggal,waktu,penyaji,institusi,tema,youtube_url,materi_url&order=tanggal.desc&limit=500
```

Respons berupa array JSON polos. Keamanan bertumpu pada **RLS**: role `anon` hanya boleh `SELECT` pada kedua tabel itu
(idealnya hanya baris & kolom di atas, mis. lewat view). Service-role key tidak boleh ada di landing.

## Kegiatan dan pendaftaran (USULAN, backend belum ada)

> **Status: USULAN.** Seluruh bagian ini adalah kontrak yang diusulkan landing; backend (MySQL di Hostinger, `/api/public/*`)
> belum ada. Landing sudah menerapkannya dan **bekerja tanpa backend**: daftar kegiatan jatuh ke data lokal, dan formulir
> menolak kirim dengan pesan jujur ("Pendaftaran online belum aktif"). Kode: `src/data/api.ts` (GET), `src/lib/submit.ts` (POST),
> `src/components/form/RegistrationForm.tsx`. Bila kontrak berubah, ubah di sini dan di kode yang sama.

Semua panggilan **same-origin** dengan path absolut `/api/public/…` (bukan di bawah base `/landing/`), sama seperti anggota/arsip.
POST dikirim `Content-Type: application/json`, tanpa cookie lintas-situs, batas waktu **8 detik**.

### `GET /api/public/activities`

`200 application/json`, `{ "items": [ … ] }`. Maks. **1000** item diproses. Landing mengurutkan ulang (terbaru dulu; tanpa tanggal di akhir).

```json
{
  "items": [
    {
      "id": "2026-12-05-konferensi-contoh",
      "jenis": "Conference",
      "tanggal": "2026-12-05",
      "tanggal_selesai": "2026-12-06",
      "waktu": "09:00:00",
      "tema": "Judul Kegiatan Contoh",
      "penyaji": "Dr. Contoh Satu",
      "institusi": "Institut Teknologi Contoh",
      "lokasi": "Bandung",
      "deskripsi": "Teks biasa, boleh beberapa baris (\n).",
      "youtube_url": null,
      "materi_url": null,
      "pendaftaran_dibuka": true
    }
  ]
}
```

| Field | Tipe | Wajib | Batas / aturan |
| --- | --- | --- | --- |
| `id` | string \| number | ya | `[A-Za-z0-9_-]{1,100}` (dipakai di URL `/kegiatan/{id}`); tidak valid → item dibuang. Stabil: jangan berubah antar-panggilan |
| `jenis` | string | tidak | `Conference` / `Webinar` / lainnya. Awalan `conf`/`konf` → Conference, `webinar` → Webinar, selain itu Kegiatan (tidak peka huruf besar) |
| `tanggal` | string | tidak | `YYYY-MM-DD` (timestamp ISO dipotong); tidak valid/kosong → tampil "Tanggal belum tercatat" |
| `tanggal_selesai` | string | tidak | `YYYY-MM-DD`, untuk kegiatan beberapa hari |
| `waktu` | string \| null | tidak | `HH:MM:SS` → `HH.MM`; teks bebas dipakai apa adanya (maks. 40) |
| `tema` | string | ya | maks. 300; kosong → item dibuang |
| `penyaji`, `institusi` | string \| null | tidak | maks. 200 |
| `lokasi` | string \| null | tidak | maks. 300 |
| `deskripsi` | string \| null | tidak | teks biasa, maks. 5000; **bukan HTML** (dirender sebagai teks, baris baru → paragraf) |
| `youtube_url`, `materi_url` | string \| null | tidak | **hanya `http(s)`** penuh, maks. 2000; selain itu dianggap kosong |
| `pendaftaran_dibuka` | boolean | tidak | hanya `true` (atau `1`) yang membuka formulir peserta; selain itu tertutup |

Larangan data sensitif sama seperti anggota: **jangan** kirim email/telepon peserta, daftar peserta, atau kolom internal.

**Fallback lokal** bila sumber tidak ada/gagal/kosong: 8 kegiatan di `src/i18n` (konferensi pertama sebagai Conference, sisanya Kegiatan)
digabung dengan `webinars.json`/arsip (Webinar). `id` lokal = slug stabil `{tanggal}-{judul}`; `pendaftaran_dibuka` selalu `false`.

### `GET /api/public/activities/{id}`

`200`, `{ "item": { …field yang sama seperti di atas… } }`. `404` + `{"ok":false,"error":"not_found"}` bila tidak ada. Bila endpoint
ini gagal atau tidak ada, landing mencari `id` itu di daftar di atas; bila tetap tidak ada, menampilkan "Kegiatan tidak ditemukan".

### `POST /api/public/registrations` (pendaftaran anggota)

Request:

```json
{
  "nama": "Contoh Satu, M.Kom.",
  "email": "contoh@institusi.ac.id",
  "institusi": "Institut Teknologi Contoh",
  "tahun_daftar": 2026,
  "bukti_bayar": "https://example.org/bukti/123"
}
```

| Field | Tipe | Wajib | Aturan (landing memvalidasi; server **wajib** memvalidasi ulang) |
| --- | --- | --- | --- |
| `nama` | string | ya | 2–200 karakter setelah dirapikan (spasi ganda → satu, dipangkas) |
| `email` | string | ya | format email, maks. 254 |
| `institusi` | string | ya | 2–200 karakter |
| `tahun_daftar` | integer | ya | tahun berjalan atau tahun berikutnya (landing hanya menawarkan dua nilai itu) |
| `bukti_bayar` | string | tidak | **hanya tautan `http(s)`**, maks. 2000; tidak ada unggah berkas |

Landing **tidak** mengirim persetujuan privasi (dicek di klien saja). Bila pengurus perlu bukti persetujuan, tambahkan field opsional
`persetujuan_privasi: true` (usulan; landing perlu diubah untuk mengirimnya).

### `POST /api/public/activities/{id}/register` (peserta kegiatan)

Hanya dipanggil bila `pendaftaran_dibuka` = `true`.

```json
{ "nama": "Contoh Dua", "email": "dua@institusi.ac.id", "institusi": "Universitas Contoh" }
```

`nama` dan `email` seperti di atas; `institusi` opsional (2–200 bila ada, dihilangkan bila kosong).

### Respons POST dan arti di landing

Respons **harus selalu JSON**. Landing menganggap sukses **hanya** bila status 2xx **dan** badan `{ "ok": true }`.
Selain itu tidak ada sukses palsu.

| Status | Badan | Tampilan landing |
| --- | --- | --- |
| `200` / `201` | `{"ok":true}` | "Pendaftaran diterima, status menunggu verifikasi pengurus" (anggota) / "Pendaftaran peserta diterima" |
| `400` / `422` | `{"ok":false,"error":"pesan singkat"}` | "Server menolak data: {error}" (maks. 200 karakter, tampil sebagai teks). Pakai juga untuk pendaftaran peserta yang **ditutup** |
| `409` | `{"ok":false,"error":"…"}` | "Data ini sudah pernah didaftarkan" |
| `429` | `{"ok":false,"error":"…"}` | "Terlalu banyak percobaan, tunggu sebentar" |
| `500` | `{"ok":false,"error":"…"}` | "Pengiriman gagal, data belum tersimpan" |
| `404`, `405`, `502`, `503`, `504`, jaringan putus, timeout 8 dtk, badan bukan JSON (mis. HTML), `2xx` tanpa `ok:true` | — | "Pendaftaran online belum aktif": data **tidak** terkirim, pengguna diarahkan ke `/kontak` |

Jangan memakai `403`/`401` untuk penolakan yang ingin dijelaskan ke pengguna (landing menampilkannya sebagai "belum aktif"); pakai `400`.

### Kewajiban sisi server (USULAN)

Landing hanyalah antarmuka; **semua kontrol keamanan ada di backend**:

1. **Validasi ulang semua input** di server: tipe (string/integer), panjang (tabel di atas), format email, skema URL (`http`/`https` saja),
   rentang `tahun_daftar`, karakter kontrol. Tolak badan > ±10 KB dan `Content-Type` selain `application/json`. Jangan percaya validasi klien.
2. **Batas panjang** kolom basis data sama dengan tabel di atas; potong/tolak, jangan simpan lebih panjang.
3. **Query terparameter / prepared statement** untuk semua akses MySQL. Tanpa penggabungan string SQL, termasuk untuk `{id}` di URL.
4. **Rate limit per IP** (dan per email) pada kedua endpoint POST → `429`. Tambahkan CAPTCHA/Turnstile bila ada penyalahgunaan.
5. **Honeypot**: honeypot landing hanya di klien (kolom `alamat_web`; bila terisi formulir tidak mengirim apa pun), jadi server tidak melihatnya.
   Server tetap butuh rate limit dan, bila perlu, honeypot/captcha miliknya sendiri.
6. **Tidak mengembalikan data privat**: respons sukses hanya `{ "ok": true }` (tanpa id, tanpa gema data). Pesan galat singkat dan tidak membocorkan
   detail internal (tanpa stack trace, tanpa nama tabel). Pertimbangkan `409` vs `200` generik untuk email yang sudah terdaftar (risiko enumerasi email).
7. **CORS same-origin**: tidak mengirim header `Access-Control-Allow-Origin` untuk POST; periksa `Origin`/`Sec-Fetch-Site` agar hanya situs sendiri yang bisa
   mengirim (mitigasi CSRF). Tanpa `Set-Cookie`.
8. **Penyimpanan data pendaftaran**: status awal "menunggu verifikasi"; email dinormalisasi (huruf kecil, dipangkas); jangan mencatat badan permintaan
   (berisi data pribadi) di log akses; tetapkan masa retensi dan hak hapus (lihat `/privasi`, masih draf).
9. Semua respons (juga galat) berupa JSON dengan `Content-Type: application/json`.

## Pemetaan field

**Anggota** → `Member`

| Sumber | Landing | Catatan |
| --- | --- | --- |
| `nama` | `name` | wajib; kosong → item dibuang. Maks. 200 karakter |
| `institusi` | `institution` | opsional; ditampilkan di /anggota dan #anggota (kolom hanya muncul bila ada) |

Maks. 2000 item. Urutan dipakai apa adanya (Supabase: `nama.asc`). Pencarian & pagination tetap di sisi klien.

**Arsip webinar** → `Webinar`

| Sumber | Landing | Catatan |
| --- | --- | --- |
| `tanggal` | `date` | wajib; `YYYY-MM-DD` (timestamp ISO dipotong ke tanggalnya); tidak valid → item dibuang |
| `waktu` | `time` | `16:00:00` → `16.00`; teks bebas (`16.00–17.00`) dipakai apa adanya; kosong → tidak ditampilkan |
| `tema` | `title` | wajib; kosong → item dibuang. Maks. 300 karakter |
| `penyaji` | `speaker` | maks. 200 karakter |
| `institusi` | `institution` | maks. 200 karakter |
| `youtube_url` | `youtube` | hanya `http(s)`; selain itu / kosong → `""` (tombol "Tonton" diganti "tanpa video") |
| `materi_url` | `slides` | satu URL `http(s)` → `[url]`; kosong/tidak valid → `[]`. URL penuh dipakai apa adanya, **tidak** diawali `VITE_SLIDES_BASE_URL` |
| — | `papers` | selalu `[]` (belum ditampilkan) |

Maks. 500 item; diurutkan ulang di klien (tanggal terbaru dulu). Semua field lain dari respons dibuang.

## Perilaku saat gagal

Timeout **4 detik** per permintaan (termasuk membaca badan). Landing memakai **data lokal** bila: sumber tidak diatur, jaringan/CORS gagal,
timeout, status bukan 2xx, respons lebih dari 2 MB (bila `Content-Length` ada), bentuk respons tidak sesuai, atau tidak ada item valid.
Tidak ada error yang dilempar ke UI; `LoadNotice` ("Memuat…") tampil selama menunggu dan pesan galat hanya muncul bila data lokal pun gagal dimuat.
Di dev server, alasan fallback dicetak sebagai `console.warn("[data] …")`.

Catatan: sumber jauh yang menjawab sukses menggantikan seluruh data lokal. Angka besar "348 · per 19 April 2020" di #anggota adalah teks statis
(`src/i18n`), **tidak** mengikuti jumlah data dari backend.

## Server & CORS

* Mode (a)/(a′), dev: `npm run dev` mem-proxy `/api` ke `VITE_API_PROXY` (default `http://localhost:3000`) bila `VITE_API_BASE` **atau** `VITE_API_PROXY` terisi.
  Pakai `VITE_API_PROXY=…` (same-origin) atau `VITE_API_BASE=/` agar browser memanggil same-origin. Di produksi, backend harus mengizinkan origin situs (CORS) atau berada di origin yang sama
  (mode a′ selalu same-origin, jadi tidak butuh CORS).
* Mode (b): Supabase sudah mengirim header CORS. Tidak ada proxy.
* Landing tidak mengirim cookie (`credentials: 'omit'`).

## Menyusul

* **Kegiatan** (`activities`) dan pendaftaran: kontrak USULAN ada di bagian "Kegiatan dan pendaftaran" di atas (halaman `/kegiatan`, `/kegiatan/{id}`, `/daftar`).
  Kartu di section #kegiatan di home masih konten statis di `src/i18n`.
* **Berita** (`/api/public/news`) dan **publikasi**: belum ada sumber data; halaman `/berita` dan `/publikasi` belum dibuat.
* Foto/ikon anggota, filter institusi, dan `papers` sengaja belum ada di UI.
