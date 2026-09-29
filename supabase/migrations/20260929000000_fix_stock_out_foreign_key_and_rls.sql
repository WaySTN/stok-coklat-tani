-- Migration: Fix foreign key constraint and add missing RLS policies for stock_out
-- Allows deleting orders by cascading to related stock_out records,
-- and allows authenticated admins to update/delete stock_out records.

-- 1. Drop existing restrictive foreign key constraint
alter table stock_out drop constraint if exists stock_out_order_id_fkey;

-- 2. Re-create foreign key with ON DELETE CASCADE
-- When an order is deleted, any linked stock_out records are automatically removed
alter table stock_out 
  add constraint stock_out_order_id_fkey 
  foreign key (order_id) references orders(id) 
  on delete cascade;

-- 3. Add missing DELETE and UPDATE RLS policies on stock_out table for authenticated users
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'stock_out' and policyname = 'admin_delete_stock_out'
  ) then
    create policy "admin_delete_stock_out" on stock_out
      for delete to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies 
    where tablename = 'stock_out' and policyname = 'admin_update_stock_out'
  ) then
    create policy "admin_update_stock_out" on stock_out
      for update to authenticated using (true);
  end if;
end $$;
