import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { History as HistoryIcon } from 'lucide-react'

export function AdminHistoryPage() {
  const { data: histories, isLoading } = useQuery({
    queryKey: ['history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_out')
        .select(`
          id,
          jumlah_keluar,
          tanggal_keluar,
          keterangan,
          created_at,
          batches (
            kode_batch,
            jenis_coklat
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
  })

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto">
      <div className="mb-6 flex items-center gap-2">
        <HistoryIcon className="text-primary w-6 h-6" />
        <div>
          <h1 className="text-xl font-bold text-primary">Riwayat Transaksi</h1>
          <p className="text-sm text-text-muted">Log pengeluaran stok (Admin)</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-text-muted mt-10 animate-pulse">Memuat riwayat...</p>
      ) : histories?.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-border">
          <p className="text-text-muted">Belum ada riwayat stok keluar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {histories?.map((item: any) => (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col gap-2">
              <div className="flex justify-between items-start border-b border-border pb-2">
                <div>
                  <h3 className="font-bold text-text-primary">{item.batches?.kode_batch || 'Batch Dihapus'}</h3>
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full mt-1 ${
                    item.batches?.jenis_coklat === 'Fermentasi' ? 'bg-secondary/10 text-secondary' : 'bg-warning/10 text-warning'
                  }`}>
                    {item.batches?.jenis_coklat || '-'}
                  </span>
                </div>
                <div className="text-right text-danger">
                  <span className="font-bold">- {item.jumlah_keluar} Kg</span>
                </div>
              </div>
              
              <div className="text-xs text-text-muted mt-1">
                <p><strong>Tgl Keluar:</strong> {new Date(item.tanggal_keluar).toLocaleDateString('id-ID')}</p>
                {item.keterangan && <p className="mt-1 text-text-primary"><strong>Ket:</strong> {item.keterangan}</p>}
                <p className="text-[10px] text-text-muted/60 mt-2 text-right">
                  Waktu: {new Date(item.created_at).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
