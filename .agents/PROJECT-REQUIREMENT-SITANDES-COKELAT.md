# Project Requirement Document
## PWA Pencatatan Stok Coklat — Kelompok Tani Mulyojati Cokelat Mojopahit

**Versi:** 2.0 (Revisi — perubahan basis PWA, tech stack, dan role)
**Tanggal:** 11 Juli 2026
**Dibuat untuk:** Kelompok Tani Mulyojati Cokelat Mojopahit, Mojokerto
**Developer:** Wahyu
**Pembimbing/Klien:** Aris Pratama

### Changelog dari v1.0
- Basis aplikasi berubah dari web biasa → **PWA** (installable, ada bottom navigation bar)
- Role "Owner" diganti jadi **User (anggota tani)** — dan **tidak pakai auth sama sekali** (public, view-only)
- Auth **hanya untuk Admin**
- Tech stack berubah total: Next.js/Prisma/MySQL/NextAuth → **React + Vite + Tailwind + Supabase**

---

## 1. Project Overview

### 1.1 Latar Belakang
Kelompok Tani Mulyojati Cokelat Mojopahit mengalami kerugian karena banyaknya cadangan biji coklat yang **kadaluarsa sebelum sempat diproduksi**, akibat tidak adanya sistem pencatatan tanggal masuk dan expired.

### 1.2 Tujuan Project
Membangun **PWA (Progressive Web App)** yang membantu Admin Gudang mencatat dan memantau stok coklat berbasis tanggal masuk/expired, dengan mekanisme **FEFO (First Expired, First Out)**, serta memberi visibilitas terbuka ke anggota kelompok tani tanpa perlu login.

### 1.3 Ruang Lingkup (Scope)
MVP. Fokus pada pencatatan stok masuk/keluar dan monitoring status kadaluarsa dalam bentuk PWA installable dengan navigasi ala aplikasi mobile (bottom nav bar). Export laporan, notifikasi push, dan full offline-sync **tidak termasuk** MVP (lihat section 13).

---

## 2. Problem Statement

| Masalah | Dampak | Solusi di Aplikasi |
|---|---|---|
| Tidak ada pencatatan tanggal masuk & expired coklat | Stok lama terlewat, jadi kadaluarsa | Setiap batch dicatat dengan tanggal masuk & expired |
| Tidak ada prioritas pengambilan stok untuk produksi | Stok baru dipakai duluan, stok lama menumpuk | Sistem FEFO otomatis menyarankan batch yang harus dipakai duluan |
| Anggota tani tidak tahu kondisi gudang tanpa lapor manual | Kurang transparansi | Dashboard publik, bisa diakses siapa saja tanpa login |

---

## 3. User Roles & Permissions

### 3.1 Admin (butuh login)
Pengguna harian yang mengelola data gudang. Login pakai email/password via Supabase Auth.

**Hak akses:**
- Login
- Tambah, edit, hapus (soft delete) data batch coklat masuk
- Catat transaksi stok keluar (dengan saran FEFO otomatis)
- Lihat dashboard alert status stok
- Lihat riwayat transaksi

### 3.2 User / Anggota Tani (TANPA login)
Siapapun yang membuka aplikasi otomatis punya akses ini — **tidak ada proses autentikasi sama sekali**. Sifatnya publik, read-only.

**Hak akses:**
- Lihat dashboard ringkasan stok (total stok, status per batch)
- Lihat riwayat transaksi masuk-keluar
- **Tidak bisa** input, edit, atau hapus apapun — tombol aksi tidak ditampilkan sama sekali di UI

### 3.3 Matriks Akses

| Fitur | Admin (login) | User/Anggota Tani (publik) |
|---|:---:|:---:|
| Buka aplikasi | ✅ | ✅ (default landing) |
| Lihat dashboard | ✅ | ✅ |
| Tambah batch masuk | ✅ | ❌ |
| Edit/hapus batch | ✅ | ❌ |
| Catat stok keluar | ✅ | ❌ |
| Lihat riwayat transaksi | ✅ | ✅ |
| Akses halaman `/login` | ✅ | ✅ (tapi tidak wajib dipakai) |

### 3.4 Catatan Desain Arsitektur Auth
Karena hanya ada satu jenis akun yang login (Admin), kita **tidak perlu tabel role terpisah**. Di Supabase, ini otomatis mapping ke dua role bawaan:
- **`anon`** (belum login) → diperlakukan sebagai User/Anggota Tani, akses read-only
- **`authenticated`** (sudah login) → diperlakukan sebagai Admin, akses penuh

Aturan ini ditegakkan lewat **Row Level Security (RLS)** di database, bukan cuma di UI — jadi walau seseorang tahu endpoint/API Supabase secara langsung, tetap tidak bisa insert/update/delete tanpa login.

---

## 4. User Stories

1. **Sebagai Admin**, saya ingin login agar bisa mengakses fitur input data gudang.
2. **Sebagai Admin**, saya ingin mencatat batch coklat baru masuk beserta tanggal masuk dan expired.
3. **Sebagai Admin**, saya ingin melihat daftar batch terurut dari yang paling dekat kadaluarsa.
4. **Sebagai Admin**, saya ingin sistem otomatis menandai batch yang mendekati/sudah expired dengan warna.
5. **Sebagai Admin**, saya ingin mencatat stok keluar dan sistem otomatis menyarankan batch FEFO yang harus diambil duluan.
6. **Sebagai Admin**, saya ingin mengedit data batch jika salah input.
7. **Sebagai Anggota Tani**, saya ingin langsung buka aplikasi dan lihat kondisi stok gudang **tanpa perlu daftar/login**, agar mudah dipakai siapa saja di kelompok tani.
8. **Sebagai Anggota Tani**, saya ingin melihat riwayat keluar-masuk stok sebagai bentuk transparansi.
9. **Sebagai pengguna (Admin maupun Anggota Tani)**, saya ingin bisa **install aplikasi ini ke home screen HP** seperti aplikasi native, agar gampang diakses tanpa buka browser dan ketik URL.

---

## 5. Functional Requirements

### 5.1 Autentikasi (Admin only)
- FR-1: Halaman `/login` dengan email & password (Supabase Auth).
- FR-2: Setelah login sukses, redirect ke dashboard Admin dengan bottom nav versi Admin.
- FR-3: Tanpa login, aplikasi tetap bisa dibuka penuh dalam mode read-only (dashboard User).
- FR-4: Aksi tambah/edit/hapus/stok-keluar diblokir di level database (RLS), bukan cuma disembunyikan di UI.
- FR-5: Tersedia tombol logout untuk Admin, kembali ke mode publik.

### 5.2 Manajemen Batch Stok Masuk (Admin)
- FR-6: Admin dapat menambah batch baru: kode batch (auto-generate), jenis coklat, jumlah masuk (kg), tanggal masuk, tanggal expired, asal petani, catatan (opsional).
- FR-7: `sisa_hari_expired` dihitung otomatis di frontend (computed), bukan disimpan di database.
- FR-8: Status batch otomatis:
  - 🟢 **Aman**: sisa hari > 7
  - 🟡 **Mendekati expired**: sisa hari 0–7
  - 🔴 **Expired**: sisa hari < 0
  - ⚪ **Habis**: jumlah sisa = 0
- FR-9: Admin dapat mengedit batch (kode batch immutable).
- FR-10: Admin dapat menghapus batch (soft delete via kolom `is_deleted`).

### 5.3 Manajemen Stok Keluar (Admin)
- FR-11: Admin mencatat pengeluaran stok: jumlah keluar (kg), tanggal keluar, keterangan.
- FR-12: Sistem **wajib** mengurutkan batch berdasarkan FEFO (tanggal expired terdekat dulu) saat menyarankan batch untuk dikurangi.
- FR-13: Validasi jumlah keluar tidak melebihi sisa stok yang tersedia (bisa gabungan dari beberapa batch bila 1 batch tidak cukup).
- FR-14: Setiap transaksi keluar tercatat di `stock_out` dengan timestamp dan `created_by`.

### 5.4 Dashboard
- FR-15: Dashboard Admin: total stok aktif, jumlah batch per status, daftar batch prioritas (mendekati/sudah expired), tombol aksi cepat (tambah batch, catat keluar).
- FR-16: Dashboard User: versi ringkas yang sama, **tanpa tombol aksi apapun**.

### 5.5 Riwayat Transaksi
- FR-17: Halaman riwayat (bisa diakses Admin & User) menampilkan log masuk-keluar, filter by tanggal.

### 5.6 PWA
- FR-18: Aplikasi punya `manifest.webmanifest` (nama, ikon, theme color) agar bisa di-install ke home screen (Android/iOS/Desktop).
- FR-19: Service worker meng-cache asset statis (JS/CSS/ikon) agar loading cepat dan tetap bisa dibuka (shell app) walau koneksi lambat/putus sementara.
- FR-20: **Bottom navigation bar** fixed di bawah layar, isi menu berbeda sesuai status login:
  - **Admin**: Dashboard · Stok Masuk · Stok Keluar · Riwayat
  - **User**: Dashboard · Riwayat
- FR-21: Data real-time/tulis (insert/update batch, stok keluar) **membutuhkan koneksi internet** — tidak ada offline write/sync di MVP ini (lihat section 13).

---

## 6. Non-Functional Requirements

- NFR-1: **Mobile-first** — UI didesain utama untuk layar HP dengan bottom nav, bukan sidebar desktop.
- NFR-2: **Installable** — memenuhi kriteria PWA installable (manifest valid, HTTPS, service worker terdaftar).
- NFR-3: **Performa** — dashboard & list batch load < 2 detik untuk data hingga ~1000 batch.
- NFR-4: **Keamanan** — semua operasi tulis (insert/update/delete) diproteksi RLS di Supabase, tervalidasi di server (database), bukan cuma client.
- NFR-5: **Auditability** — `created_by` & `created_at` tercatat di setiap batch dan transaksi keluar.
- NFR-6: **Usability** — status expired harus jelas secara visual (warna badge) tanpa perlu baca angka, target user termasuk yang awam teknologi.
- NFR-7: **Reliabilitas data** — tidak boleh ada stok minus; pengurangan stok harus atomic.

---

## 7. Database Schema (Supabase / PostgreSQL)

### 7.1 Tabel

```sql
create extension if not exists "uuid-ossp";

create table batches (
  id uuid primary key default uuid_generate_v4(),
  kode_batch text unique not null,
  jenis_coklat text not null,
  jumlah_masuk numeric(10,2) not null,
  jumlah_sisa numeric(10,2) not null,
  tanggal_masuk date not null,
  tanggal_expired date not null,
  asal_petani text,
  catatan text,
  is_deleted boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table stock_out (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid not null references batches(id),
  jumlah_keluar numeric(10,2) not null,
  tanggal_keluar date not null,
  keterangan text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_batches_tanggal_expired on batches(tanggal_expired);
create index idx_batches_is_deleted on batches(is_deleted);
create index idx_stock_out_tanggal_keluar on stock_out(tanggal_keluar);
```

### 7.2 Row Level Security (RLS)

```sql
alter table batches enable row level security;
alter table stock_out enable row level security;

-- Siapapun (anon + authenticated) boleh baca
create policy "public_read_batches" on batches
  for select using (true);

create policy "public_read_stock_out" on stock_out
  for select using (true);

-- Hanya user yang login (Admin) boleh tulis
create policy "admin_insert_batches" on batches
  for insert to authenticated with check (true);

create policy "admin_update_batches" on batches
  for update to authenticated using (true);

create policy "admin_delete_batches" on batches
  for delete to authenticated using (true);

create policy "admin_insert_stock_out" on stock_out
  for insert to authenticated with check (true);
```

### 7.3 Catatan Penting
- `status` batch **tidak disimpan di database** — dihitung di frontend dari `tanggal_expired` & `jumlah_sisa`.
- Pengurangan `jumlah_sisa` saat ada `stock_out` baru harus dilakukan lewat **Postgres function/RPC** (bukan 2 query terpisah dari client) agar atomic dan aman dari race condition — lihat section 11.
- Gunakan `numeric`, jangan `float`, untuk semua nilai kg.
- Generate TypeScript types otomatis dari schema: `npx supabase gen types typescript` — jangan tulis manual, biar selalu sinkron dengan database.

---

## 8. Design System

### 8.1 Konsep Visual
Earthy natural — mencerminkan produk kakao, hangat dan mudah dibaca oleh pengguna non-teknis. Layout mengikuti pola **app mobile** (bottom nav, card-based, thumb-friendly touch target).

### 8.2 Color Palette

| Nama | Hex | Penggunaan |
|---|---|---|
| Primary (Coklat Tua) | `#4A2C2A` | Header, tombol utama, active state bottom nav |
| Primary Hover (Coklat Sedang) | `#6F4E37` | Hover/pressed state |
| Secondary (Hijau Tua) | `#3B5D3A` | Badge "Aman" |
| Warning (Kuning Amber) | `#D9A441` | Badge "Mendekati Expired" |
| Danger (Merah Bata) | `#B03A2E` | Badge "Expired" |
| Background (Krem) | `#F5EFE6` | Latar belakang halaman |
| Surface (Putih) | `#FFFFFF` | Card, bottom nav bar |
| Text Primary | `#2E2015` | Teks utama |
| Text Muted | `#8A7968` | Teks sekunder, ikon inactive di bottom nav |

### 8.3 Tipografi
Font: **Inter** atau **Plus Jakarta Sans**. Heading bold, body minimal 14px, touch target tombol minimal 44x44px (standar mobile).

### 8.4 Bottom Navigation Bar (komponen kunci PWA ini)
- Fixed di bawah layar, background putih, shadow tipis di atasnya, height ~64px + safe-area-inset-bottom (untuk notch HP).
- Ikon + label singkat di bawah ikon.
- Active tab: ikon & teks warna primary (`#4A2C2A`), inactive: `#8A7968`.
- Menu Admin: **Dashboard · Stok Masuk · Stok Keluar · Riwayat**
- Menu User: **Dashboard · Riwayat** (2 menu saja, karena scope-nya kecil — bisa ditambah tombol "Login Admin" kecil di pojok/dalam halaman profil sederhana)

### 8.5 Komponen UI Lain
- Badge status: pill-shaped dengan ikon (●) kecil.
- Card ringkasan dashboard: rounded-xl, shadow tipis.
- Tabel/list batch: sort default ascending tanggal expired, highlight baris sesuai status.
- Empty state: ikon + teks ramah saat data kosong.

---

## 9. Tech Stack

| Layer | Teknologi | Catatan |
|---|---|---|
| Framework | React 18 + Vite | SPA, build cepat, cocok untuk PWA |
| Bahasa | TypeScript | Konsistensi tipe, penting untuk vibe coding |
| Styling | Tailwind CSS | Sesuai palette custom di section 8 |
| Komponen UI | shadcn/ui | Kompatibel dengan Vite (bukan cuma Next.js) |
| Routing | React Router v6 | Client-side routing untuk SPA |
| Backend/DB | **Supabase** (gratis/free tier) | Postgres + Auth + auto-generated REST/RPC |
| Auth | Supabase Auth (Email/Password) | Hanya dipakai untuk Admin |
| Data fetching | TanStack Query (React Query) + `@supabase/supabase-js` | Caching, refetch otomatis, cocok untuk dashboard real-time-ish |
| Form & validasi | Zod + React Hook Form | Validasi client, aturan bisnis tetap ditegakkan via RLS di server |
| PWA | `vite-plugin-pwa` (berbasis Workbox) | Auto-generate service worker & manifest |
| Hosting Frontend | Vercel atau Netlify | Static hosting, gratis, auto-deploy dari GitHub |
| Hosting Backend | Supabase Cloud (free tier) | Database + Auth terkelola, tidak perlu server sendiri |

---

## 10. Folder Structure (Rekomendasi)

```
sitandes-cokelat/
├── public/
│   └── icons/                        # icon PWA (192x192, 512x512, maskable)
├── src/
│   ├── main.tsx
│   ├── App.tsx                       # setup router + AppShell
│   ├── routes/
│   │   ├── LoginPage.tsx
│   │   ├── admin/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── BatchesPage.tsx       # list + tambah/edit batch
│   │   │   ├── StockOutPage.tsx      # form catat stok keluar
│   │   │   └── HistoryPage.tsx
│   │   └── public/
│   │       ├── DashboardPage.tsx     # dashboard read-only (default landing "/")
│   │       └── HistoryPage.tsx
│   ├── components/
│   │   ├── ui/                       # shadcn components
│   │   ├── layout/
│   │   │   ├── BottomNav.tsx         # render menu beda sesuai auth state
│   │   │   └── AppShell.tsx
│   │   ├── BatchTable.tsx
│   │   ├── StatusBadge.tsx
│   │   └── StockOutForm.tsx
│   ├── hooks/
│   │   ├── useAuth.ts                # wrap supabase.auth session state
│   │   ├── useBatches.ts             # react-query hook
│   │   └── useStockOut.ts
│   ├── lib/
│   │   ├── supabase.ts               # init supabase client
│   │   ├── fefo.ts                   # logic alokasi FEFO (client-side helper)
│   │   └── status.ts                 # logic hitung status batch
│   ├── types/
│   │   └── database.types.ts         # generated dari `supabase gen types`
│   └── index.css
├── vite.config.ts                    # termasuk config VitePWA
├── tailwind.config.ts
├── supabase/
│   └── migrations/                   # SQL migration files
└── package.json
```

---

## 11. Business Logic Detail — FEFO Engine

Karena tidak ada backend server custom (langsung ke Supabase), pengurangan stok **wajib** lewat Postgres RPC function agar atomic:

```sql
create or replace function process_stock_out(
  p_jenis_coklat text,
  p_jumlah_dibutuhkan numeric,
  p_tanggal_keluar date,
  p_keterangan text
)
returns void as $$
declare
  v_batch record;
  v_sisa_dibutuhkan numeric := p_jumlah_dibutuhkan;
  v_ambil numeric;
begin
  -- validasi total stok cukup dulu sebelum proses apapun
  if (select coalesce(sum(jumlah_sisa), 0) from batches
      where jenis_coklat = p_jenis_coklat and is_deleted = false) < p_jumlah_dibutuhkan then
    raise exception 'Stok tidak mencukupi';
  end if;

  for v_batch in
    select id, jumlah_sisa from batches
    where jenis_coklat = p_jenis_coklat
      and is_deleted = false
      and jumlah_sisa > 0
    order by tanggal_expired asc, tanggal_masuk asc   -- FEFO, tie-breaker tanggal masuk
  loop
    exit when v_sisa_dibutuhkan <= 0;

    v_ambil := least(v_batch.jumlah_sisa, v_sisa_dibutuhkan);

    update batches set jumlah_sisa = jumlah_sisa - v_ambil, updated_at = now()
      where id = v_batch.id;

    insert into stock_out (batch_id, jumlah_keluar, tanggal_keluar, keterangan, created_by)
      values (v_batch.id, v_ambil, p_tanggal_keluar, p_keterangan, auth.uid());

    v_sisa_dibutuhkan := v_sisa_dibutuhkan - v_ambil;
  end loop;
end;
$$ language plpgsql security definer;
```

Frontend cukup panggil lewat `supabase.rpc('process_stock_out', {...})` — seluruh logic alokasi FEFO & atomicity terjadi di database, bukan di client. Ini mencegah race condition kalau ada 2 admin input bersamaan, dan memastikan 1 transaksi keluar bisa otomatis kepotong dari beberapa batch sekaligus kalau 1 batch tidak cukup.

---

## 12. Status Batch — Logic Detail (Frontend, `lib/status.ts`)

```
FUNGSI: getBatchStatus(tanggalExpired, jumlahSisa)

sisaHari = tanggalExpired - hariIni (dalam hari)

JIKA jumlahSisa <= 0:
  RETURN "HABIS" (abu-abu)
JIKA sisaHari < 0:
  RETURN "EXPIRED" (#B03A2E)
JIKA sisaHari <= 7:
  RETURN "MENDEKATI_EXPIRED" (#D9A441)
LAINNYA:
  RETURN "AMAN" (#3B5D3A)
```

---

## 13. MVP Scope — In vs Out

### ✅ Termasuk MVP
- PWA installable (manifest + service worker asset caching)
- Bottom navigation bar (beda menu Admin vs User)
- Login Admin via Supabase Auth; User publik tanpa login
- CRUD batch stok masuk (Admin)
- Stok keluar dengan FEFO otomatis via RPC (Admin)
- Dashboard status stok (Admin + User)
- Riwayat transaksi (Admin + User)
- RLS enforcement di database

### ❌ Belum termasuk (Future Scope)
- **Full offline read/write sync** (PWA di MVP ini installable & asset-cached, tapi tetap butuh internet untuk baca/tulis data ke Supabase)
- Push notification (misal alert H-7 lewat notifikasi HP)
- Export laporan Excel/PDF
- Multi-gudang/multi-lokasi
- Manajemen banyak akun Admin dari UI (kalau perlu >1 admin, tambah manual lewat Supabase dashboard dulu)
- Grafik analitik lanjutan

---

## 14. Success Criteria

1. Aplikasi bisa di-install ke home screen HP (Android/iOS) dan dibuka seperti app biasa.
2. Admin bisa login dan mencatat batch masuk/keluar tanpa error.
3. Status expired akurat real-time sesuai tanggal hari ini.
4. Rekomendasi FEFO selalu mengarah ke batch dengan expired paling dekat, dan RPC `process_stock_out` atomic (tidak ada stok minus/dobel kurang saat diuji dengan input beruntun).
5. User/anggota tani bisa buka & lihat dashboard tanpa perlu akun sama sekali.
6. Bottom nav berubah otomatis sesuai status login.

---

## 15. Catatan untuk AI Agent (Vibe Coding)

- Urutan bangun: **Setup Vite+PWA shell → Supabase project & schema/RLS → Auth Admin → Bottom Nav + Routing → CRUD Batch → RPC FEFO → Stock Out UI → Dashboard Admin → Dashboard/Riwayat User (publik)**.
- Jangan implementasi pengurangan stok di client dengan 2 query terpisah (select lalu update) — **wajib** lewat RPC `process_stock_out` di section 11, supaya atomic.
- Route publik (`/`, `/riwayat`) harus benar-benar tidak mewajibkan auth — jangan taruh route guard di situ.
- Route Admin (`/admin/*`) wajib dibungkus guard yang cek `supabase.auth.getSession()`, redirect ke `/login` kalau kosong.
- Gunakan `numeric` (bukan `float`) untuk semua nilai kg, konsisten dari schema sampai TypeScript type.
- Generate types dari Supabase (`supabase gen types typescript`), jangan tulis interface manual yang gampang out-of-sync.
