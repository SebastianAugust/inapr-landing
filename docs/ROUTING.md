# Routing situs (multi-page)

Landing ini adalah **Vite multi-page statis**: satu berkas HTML per halaman, tanpa library router. Daftar halaman ada di
`config/pages.json` (dibaca `vite.config.ts`, `config/seo-plugin.ts`, dan `scripts/prerender.mjs`).

Ada dua jenis alamat. Jangan dicampur:

* **Rute situs**: yang dilihat dan diklik pengguna (`/daftar`, `/kegiatan/abc`). Semua tautan antar-halaman di kode
  memakai ini, lewat `siteHref()` / `activityHref()` / `sectionHref()` di `src/lib/routes.ts`. Tidak pernah `daftar.html`
  dan tidak pernah berawalan `/landing/`.
* **Berkas build**: `dist/daftar.html` dan seterusnya. Aset (JS/CSS/gambar) diacu lewat base build (`/` atau `/landing/`);
  di kode pakai `assetUrl()` (`import.meta.env.BASE_URL`).

Hosting bertugas memetakan rute situs → berkas.

## Tabel rute

| Rute situs | Berkas build | Isi | Indeks mesin pencari |
| --- | --- | --- | --- |
| `/` | `index.html` | Home (8 section + titik 3D) | ya (selama bukan draf) |
| `/daftar` | `daftar.html` | Formulir pendaftaran anggota | **selalu noindex** |
| `/kegiatan` | `kegiatan.html` | Daftar kegiatan + filter + pencarian | ya |
| `/kegiatan/{id}` | `kegiatan-detail.html` | Detail kegiatan (+ formulir peserta bila dibuka); `id` dibaca dari URL di klien | **selalu noindex** |
| `/webinar` | `webinar.html` | Arsip webinar lengkap | ya |
| `/anggota` | `anggota.html` | Direktori anggota (nama + institusi) | ya |
| `/kontak` | `kontak.html` | Alamat/kontak resmi | ya |
| `/privasi` | `privasi.html` | Draf kebijakan privasi | ya |
| (rute tak dikenal) | `404.html` | Halaman tidak ditemukan | noindex |

"ya" berarti ikut sitemap dan tanpa `noindex` **setelah** `DRAFT_NOINDEX` dimatikan (`config/seo-plugin.ts`, lihat
`docs/DEPLOY-VERCEL.md` bagian (e)). Selama draf semua halaman `noindex`.

`/kegiatan/{id}`: `id` hanya huruf, angka, `-`, `_` (maks. 100 karakter). Halaman membaca segmen terakhir path setelah
`/kegiatan/`; bila tidak ada, memakai `?id=`.

## Vercel (build `npm run build`, base `/`)

`vercel.json` sudah berisi:

```json
"cleanUrls": true,
"rewrites": [{ "source": "/kegiatan/:id", "destination": "/kegiatan-detail" }]
```

`cleanUrls` melayani `/daftar` dari `daftar.html` (dan mengalihkan `/daftar.html` ke `/daftar`). `404.html` otomatis dipakai Vercel
untuk rute yang tidak ada. Header `X-Robots-Tag: noindex` global di `vercel.json` adalah bagian mode draf: saat rilis, hapus
header itu **dan** pasang `X-Robots-Tag: noindex` khusus untuk `/daftar` dan `/kegiatan/(.*)` (formulir tetap tidak boleh
diindeks; `<meta name="robots">` di HTML sudah menjaga ini, header hanya lapisan kedua).

## Embed di app Next.js (build `npm run build:embed`, base `/landing/`)

Hasil build (`dist/`) disalin ke `public/landing/` di app Next. Aset dilayani di `/landing/assets/...`. Rute situs dilayani
lewat **rewrite** di `next.config` (URL di peramban tetap `/daftar`; Next mengambil berkas statis):

```js
// next.config.js
async rewrites() {
  return {
    beforeFiles: [
      { source: '/',               destination: '/landing/index.html' },
      { source: '/daftar',         destination: '/landing/daftar.html' },
      { source: '/kegiatan',       destination: '/landing/kegiatan.html' },
      { source: '/kegiatan/:id',   destination: '/landing/kegiatan-detail.html' },
      { source: '/webinar',        destination: '/landing/webinar.html' },
      { source: '/anggota',        destination: '/landing/anggota.html' },
      { source: '/kontak',         destination: '/landing/kontak.html' },
      { source: '/privasi',        destination: '/landing/privasi.html' },
    ],
  }
}
```

Catatan:

* Gunakan `beforeFiles` supaya rewrite menang atas route Next dengan nama sama; sesuaikan dengan rute app yang sudah ada.
* **Jangan** tangkap `/api/*`: formulir dan data memanggil `/api/public/*` (path absolut, satu origin; lihat
  `docs/KONTRAK-DATA.md`) dan harus dijawab route handler Next.
* `/landing/404.html` tidak otomatis menjadi 404 Next. Pakai halaman 404 app Next, atau `rewrites.fallback` ke berkas itu bila
  ingin tampilan yang sama.
* Halaman statis ini tidak berubah setelah build; jangan menaruh `Cache-Control: immutable` pada `*.html` (hanya pada
  `/landing/assets/*`).
* Kanonik/sitemap: `VITE_SITE_URL` dengan base `/landing/` menghasilkan kanonik `https://host/landing/daftar` (konvensi yang
  sama dengan home → `https://host/landing/`). Bila situs publik sebenarnya `/daftar`, isi `VITE_SITE_URL` dengan alamat
  tanpa `/landing/` DAN pastikan tidak digabung base: lihat `docs/DEPLOY-VERCEL.md`.

## Dev dan preview lokal

* `npm run dev`: server dev melayani semua rute situs (`/daftar`, `/kegiatan/abc`, …) lewat middleware
  `config/pages.ts` (`routeRewrite`). Rute tak dikenal mengembalikan 404 (`appType: 'mpa'`).
* `npx vite preview` (setelah `npm run build`): sama. Untuk build embed gunakan
  `npx vite preview --base=/landing/`: rute situs `/daftar` DAN `/landing/daftar` sama-sama dipetakan ke
  `/landing/daftar.html`, meniru rewrite Next di atas.

## Menambah halaman

1. Tambah entri di `config/pages.json` (`key`, `file`, `route`, `indexable`).
2. Buat `{file}` (salin salah satu halaman kecil, mis. `kontak.html`) dan `src/entries/{key}.tsx`
   (`mountPage('{key}', Page)`), plus komponen di `src/pages/`.
3. Daftarkan `key` di tipe `PageKey` (`src/lib/routes.ts`), peta `PAGES` di `src/entry-server.tsx`, dan
   `pageMeta` di `src/i18n/pages-id.ts` / `pages-en.ts`.
4. Tambah rute ke tabel ini, rewrite Next di atas, dan `vercel.json` bila rutenya dinamis.
