import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Leaf, Package, Sparkles, Hourglass, CheckCircle2 } from 'lucide-react'

export function StockSummary() {
  const { data, isLoading } = useQuery({
    queryKey: ['stock-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('jenis_coklat, jumlah_sisa, tanggal_masuk')
        .eq('is_deleted', false)

      if (error) throw error

      let fermentasi = 0
      let fermentasiProses = 0
      let fermentasiSiap = 0
      let nonFermentasi = 0

      const today = new Date()
      today.setHours(0,0,0,0)

      data.forEach((batch) => {
        const sisa = Number(batch.jumlah_sisa)
        if (batch.jenis_coklat === 'Fermentasi') {
          fermentasi += sisa

          // Calculate age
          const masukDate = new Date(batch.tanggal_masuk)
          masukDate.setHours(0,0,0,0)
          const diffTime = today.getTime() - masukDate.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          const dayNum = diffDays + 1

          if (dayNum > 5) {
            fermentasiSiap += sisa
          } else {
            fermentasiProses += sisa
          }
        } else if (batch.jenis_coklat === 'Non-Fermentasi') {
          nonFermentasi += sisa
        }
      })

      return { fermentasi, fermentasiProses, fermentasiSiap, nonFermentasi }
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
    <div className="flex flex-col gap-4">
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

      {/* Fermentasi Progress Breakdown Section (Sisi User & Admin) */}
      <div 
        className="animate-fade-in-up delay-300 p-5 rounded-3xl border bg-white flex flex-col gap-4 shadow-sm"
        style={{ 
          borderColor: '#EFECE6',
          boxShadow: '0 4px 20px rgba(74, 44, 42, 0.02)'
        }}
      >
        <div className="flex justify-between items-center pb-2 border-b border-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#4A2C2A] animate-pulse"></span>
            <h3 className="font-extrabold text-[10px] uppercase tracking-wider text-[#2E2015]">
              Pemantauan Umur Fermentasi Cokelat
            </h3>
          </div>
          <span className="text-[9px] font-bold text-neutral-400">Gudang Kelompok Tani</span>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          {/* Dalam Proses Card */}
          <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EFECE6]/45 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-amber-600">
              <Hourglass className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
              <span className="text-[9px] font-extrabold uppercase tracking-wider">Sedang Fermentasi</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-serif font-black text-[#4A2C2A]">
                {data?.fermentasiProses.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] font-bold text-neutral-400">Kg</span>
            </div>
            <p className="text-[9px] text-neutral-400 mt-1 leading-relaxed">
              Masa fermentasi aktif hari ke 1-5.
            </p>
          </div>

          {/* Siap Olah Card */}
          <div className="p-3.5 rounded-2xl bg-[#F4F9F4] border border-[#E2EFE2] flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[#3B5D3A]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#3B5D3A]" />
              <span className="text-[9px] font-extrabold uppercase tracking-wider">Telah Terfermentasi</span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-serif font-black text-[#3B5D3A]">
                {data?.fermentasiSiap.toLocaleString('id-ID')}
              </span>
              <span className="text-[10px] font-bold text-neutral-400">Kg</span>
            </div>
            <p className="text-[9px] text-neutral-400 mt-1 leading-relaxed">
              Masa fermentasi hari ke 6+ (Siap Olah).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
