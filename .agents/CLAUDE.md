# CLAUDE.md

Instruksi persisten untuk AI agent selama mengerjakan project ini. Baca file ini di setiap sesi sebelum menulis kode. Untuk requirement lengkap (user stories, DB schema detail, design system, RPC function), lihat `PROJECT-REQUIREMENT-SITANDES-COKELAT.md`.

## Project Overview

PWA pencatatan stok coklat untuk Kelompok Tani Mulyojati Cokelat Mojopahit, Mojokerto. Tujuan utama: mencegah stok coklat kadaluarsa dengan sistem FEFO (First Expired, First Out). Dua role: **Admin** (login, kelola data) dan **User/Anggota Tani** (publik, tanpa login, read-only).

## Tech Stack

- React 18 + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth + auto REST/RPC)
- React Router v6
- TanStack Query (React Query) + `@supabase/supabase-js`
- Zod + React Hook Form
- `vite-plugin-pwa` untuk manifest & service worker

## Status Setup

Instalasi awal (React+Vite+Tailwind, koneksi Supabase) **sudah selesai**. Jangan install ulang atau setup dari nol — cek dulu `package.json` dan `src/lib/supabase.ts` sebelum asumsi sesuatu belum ada.

## Build & Run Commands

```bash
npm run dev                              # jalankan dev server
npm run build                            # build production
npx supabase gen types typescript --project-id <id> > src/types/database.types.ts
```

## Urutan Pengerjaan (ikuti urutan ini, jangan loncat)

1. Schema database + RLS policy (section 7 requirement doc)
2. RPC function `process_stock_out` untuk logic FEFO (section 11)
3. Auth Admin (Supabase Auth, login/logout, route guard)
4. Routing + AppShell + Bottom Navigation Bar (beda menu Admin vs User)
5. CRUD Batch (halaman Admin)
6. Halaman Stock Out (Admin, panggil RPC)
7. Dashboard Admin
8. Dashboard & Riwayat User (publik, read-only, route `/` dan `/riwayat`)
9. PWA polish (manifest, ikon, service worker)

## Aturan Non-Negotiable

- **Semua nilai kg pakai `numeric`, jangan pernah `float`.**
- **Route publik (`/`, `/riwayat`) TIDAK BOLEH ada auth guard** — User/Anggota Tani harus bisa akses tanpa login sama sekali.
- **Route Admin (`/admin/*`) WAJIB dibungkus guard** yang cek `supabase.auth.getSession()`, redirect ke `/login` kalau belum login.
- **Aturan akses ditegakkan di RLS (database), bukan cuma disembunyikan di UI.** Jangan pernah berasumsi UI-hiding cukup untuk keamanan.
- **Pengurangan stok WAJIB lewat RPC `process_stock_out`** (section 11 requirement doc) — jangan implementasi select-lalu-update terpisah dari client, itu tidak atomic dan rawan race condition.
- **Logic FEFO diurutkan `tanggal_expired ASC`**, tie-breaker `tanggal_masuk ASC` — ini sudah ada di dalam RPC function, jangan duplikasi logic ini di client.
- **Status batch (`AMAN`/`MENDEKATI_EXPIRED`/`EXPIRED`/`HABIS`) dihitung di frontend on-the-fly** (`lib/status.ts`), tidak disimpan sebagai kolom di database.
- **Batch pakai soft delete** (`is_deleted`), jangan hard delete.
- **Generate TypeScript types dari Supabase**, jangan tulis interface manual yang bisa out-of-sync dari schema.
- Jangan tambah fitur di luar MVP (section 13 requirement doc) tanpa diminta eksplisit — termasuk push notification, export laporan, offline write-sync, multi-gudang.

## Konvensi Kode

- Nama field database & variabel domain pakai Bahasa Indonesia sesuai schema (`jumlah_sisa`, `tanggal_expired`, dst) — konsisten dengan requirement doc.
- Komponen UI di `components/`, logic bisnis murni (tanpa UI) di `lib/`, data-fetching hooks di `hooks/`.
- Pakai TanStack Query untuk semua fetch/mutate ke Supabase — jangan `useEffect` + `useState` manual untuk data fetching.
- Bottom nav (`components/layout/BottomNav.tsx`) baca auth state dari `useAuth()` hook untuk nentuin menu mana yang tampil.

## Design System (ringkas — detail lengkap di requirement doc section 8)

- Primary: `#4A2C2A` · Secondary: `#3B5D3A` · Warning: `#D9A441` · Danger: `#B03A2E` · Background: `#F5EFE6`
- Font: Inter atau Plus Jakarta Sans
- Mobile-first, layout ala app dengan bottom navigation bar fixed di bawah.

## Yang Harus Ditanyakan Sebelum Asumsi

Kalau ada instruksi ambigu terkait requirement (bukan soal teknis), berhenti dan tanya user dulu — jangan menebak, apalagi untuk logic FEFO, RLS policy, dan apapun yang menentukan siapa boleh akses/ubah data apa.
