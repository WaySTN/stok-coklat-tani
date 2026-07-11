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
$$ language plpgsql security invoker;
