import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Package } from 'lucide-react'

export function StockSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ['stock-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('jenis_coklat, jumlah_sisa')
        .eq('is_deleted', false)

      if (error) throw error

      // Agregasi stok
      let fermentasi = 0
      let nonFermentasi = 0

      data.forEach((batch) => {
        if (batch.jenis_coklat === 'Fermentasi') {
          fermentasi += Number(batch.jumlah_sisa)
        } else if (batch.jenis_coklat === 'Non-Fermentasi') {
          nonFermentasi += Number(batch.jumlah_sisa)
        }
      })

      return { fermentasi, nonFermentasi }
    },
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm h-28 animate-pulse"></div>
        <div className="bg-white p-4 rounded-xl border border-border shadow-sm h-28 animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-secondary/10 p-4 rounded-xl border border-secondary/20 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 text-secondary mb-2">
          <Package className="w-4 h-4" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">Fermentasi</h3>
        </div>
        <div>
          <p className="text-2xl font-bold text-secondary">
            {data?.fermentasi.toLocaleString('id-ID')} <span className="text-sm font-normal">Kg</span>
          </p>
        </div>
      </div>

      <div className="bg-warning/10 p-4 rounded-xl border border-warning/20 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 text-warning mb-2">
          <Package className="w-4 h-4" />
          <h3 className="text-xs font-semibold uppercase tracking-wider">Non-Fermentasi</h3>
        </div>
        <div>
          <p className="text-2xl font-bold text-warning">
            {data?.nonFermentasi.toLocaleString('id-ID')} <span className="text-sm font-normal">Kg</span>
          </p>
        </div>
      </div>
    </div>
  )
}
