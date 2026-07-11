create table batches (
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
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

-- Row Level Security (RLS)
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
