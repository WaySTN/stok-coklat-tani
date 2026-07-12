-- Create Farmers Table
create table farmers (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  no_hp text,
  created_at timestamptz not null default now()
);

-- Enable RLS on farmers
alter table farmers enable row level security;

-- Policies for farmers
create policy "public_read_farmers" on farmers
  for select using (true);

create policy "admin_all_farmers" on farmers
  to authenticated
  using (true)
  with check (true);

-- Seed initial farmers for Kelompok Tani Mulyo Jati
insert into farmers (nama, no_hp) values
  ('Bpk. Mulyo', '081234567890'),
  ('Bpk. Sutopo', '085712345678'),
  ('Ibu Sri Wahyuni', '081398765432'),
  ('Bpk. Wagiman', '082155667788'),
  ('Bpk. Joko Susilo', '081944332211')
on conflict (nama) do nothing;

-- Add lokasi_rak column to batches
alter table batches add column lokasi_rak text;

-- Create Orders Table (Pre-Orders)
create table orders (
  id uuid primary key default gen_random_uuid(),
  nama_pembeli text not null,
  jenis_coklat text not null,
  jumlah_pesanan numeric(10,2) not null,
  tanggal_pesan date not null,
  status text not null default 'Pending', -- 'Pending', 'Selesai'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on orders
alter table orders enable row level security;

-- Policies for orders
create policy "public_read_orders" on orders
  for select using (true);

create policy "admin_all_orders" on orders
  to authenticated
  using (true)
  with check (true);

-- Add order_id reference to stock_out
alter table stock_out add column order_id uuid references orders(id);
