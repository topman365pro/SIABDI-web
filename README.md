# SIABDI Web

Frontend Next.js untuk Sistem Informasi Absensi Sekolah Terintegrasi.

## Local Setup

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Frontend tersedia di `http://localhost:3000` saat dijalankan langsung dengan Next.js, atau `http://localhost:3001` saat memakai skrip Docker.

## Docker VPS Development

```bash
cp .env.example .env
pnpm docker:dev
```

Operasional:

```bash
pnpm docker:logs
pnpm docker:down
pnpm docker:reset
```

## API Endpoint

Default endpoint ada di `.env`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

Endpoint API juga bisa diganti langsung dari halaman login. Nilai tersebut disimpan di browser, sehingga frontend tidak perlu rebuild saat alamat API VPS berubah.

## Useful Commands

```bash
pnpm build
pnpm test
```

## Backend

Backend berada di repo terpisah: `git@github.com:topman365pro/SIABDI-api.git`.
