import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Leaf, Package, Sparkles } from 'lucide-react'

export function StockSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ['stock-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('jenis_coklat, jumlah_sisa')
        .eq('is_deleted', false)

      if (error) throw error

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
        <div className="h-32 rounded-tl-[32px] rounded-br-[32px] rounded-tr-lg rounded-bl-lg animate-pulse bg-neutral-200/50"></div>
        <div className="h-32 rounded-tl-[32px] rounded-br-[32px] rounded-tr-lg rounded-bl-lg animate-pulse bg-neutral-200/50"></div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Kartu Fermentasi — Premium Dark Cocoa Gradient */}
      <div
        className="animate-fade-in-up delay-100 relative overflow-hidden p-6 rounded-tl-[36px] rounded-br-[36px] rounded-tr-xl rounded-bl-xl flex flex-col justify-between min-h-[145px] transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_12px_24px_rgba(74,44,42,0.25)] group cursor-pointer border border-white/10"
        style={{
          background: 'linear-gradient(135deg, #4A2C2A 0%, #2F1917 100%)',
          boxShadow: '0 8px 16px rgba(74, 44, 42, 0.15)',
        }}
      >
        {/* Animated Background Icon */}
        <div className="absolute -right-3 -bottom-3 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6" style={{ opacity: 0.12 }}>
          <Package className="w-24 h-24 text-white" strokeWidth={1} />
        </div>

        {/* Ambient Glow */}
        <div 
          className="absolute -top-12 -left-12 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-20"
          style={{ background: '#D4A373' }}
        ></div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full border border-white/5 backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-[#D4A373] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
              Fermentasi
            </span>
          </div>
          <Leaf className="w-4 h-4 text-white/50 animate-float" />
        </div>

        <div className="relative z-10 mt-auto">
          {data?.fermentasi === 0 ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium tracking-wide text-white/40 uppercase">Stok Saat Ini</span>
              <p className="text-lg font-serif font-semibold italic text-white/60">
                Gudang Kosong
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium tracking-wide text-white/40 uppercase">Stok Saat Ini</span>
              <p className="text-3xl font-serif font-black tracking-tight text-white group-hover:text-[#F5EFE6] transition-colors">
                {data?.fermentasi.toLocaleString('id-ID')}
                <span className="text-sm font-sans font-normal ml-1 text-white/70">Kg</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Kartu Non-Fermentasi / Mentah — Premium Leafy Green Gradient */}
      <div
        className="animate-fade-in-up delay-200 relative overflow-hidden p-6 rounded-tl-[36px] rounded-br-[36px] rounded-tr-xl rounded-bl-xl flex flex-col justify-between min-h-[145px] transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_12px_24px_rgba(59,93,58,0.25)] group cursor-pointer border border-white/10"
        style={{
          background: 'linear-gradient(135deg, #3B5D3A 0%, #253D24 100%)',
          boxShadow: '0 8px 16px rgba(59, 93, 58, 0.15)',
        }}
      >
        {/* Animated Background Icon */}
        <div className="absolute -right-3 -bottom-3 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6" style={{ opacity: 0.12 }}>
          <Package className="w-24 h-24 text-white" strokeWidth={1} />
        </div>

        {/* Ambient Glow */}
        <div 
          className="absolute -top-12 -left-12 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-25"
          style={{ background: '#A3D473' }}
        ></div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full border border-white/5 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">
              Biji Mentah
            </span>
          </div>
          <Leaf className="w-4 h-4 text-white/50 animate-float" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="relative z-10 mt-auto">
          {data?.nonFermentasi === 0 ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium tracking-wide text-white/40 uppercase">Stok Saat Ini</span>
              <p className="text-lg font-serif font-semibold italic text-white/60">
                Gudang Kosong
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-medium tracking-wide text-white/40 uppercase">Stok Saat Ini</span>
              <p className="text-3xl font-serif font-black tracking-tight text-white group-hover:text-[#F5EFE6] transition-colors">
                {data?.nonFermentasi.toLocaleString('id-ID')}
                <span className="text-sm font-sans font-normal ml-1 text-white/70">Kg</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
