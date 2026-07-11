import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { History as HistoryIcon, PackageOpen, Calendar, Info } from 'lucide-react'

export function PublicHistoryPage() {
  const { data: histories, isLoading } = useQuery({
    queryKey: ['public-history'],
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
    <div className="pb-28 min-h-screen overflow-y-auto" style={{ backgroundColor: '#FAF7F2' }}>
      {/* Header senada dengan Dashboard */}
      <div
        className="px-6 pt-10 pb-16 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #361E1C 0%, #1F0F0E 100%)',
          borderBottomLeftRadius: '48px',
          borderBottomRightRadius: '48px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
        }}
      >
        <div className="absolute -top-16 -right-16 pointer-events-none animate-float opacity-[0.03]">
          <HistoryIcon className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div
            className="p-2.5 rounded-2xl flex items-center justify-center backdrop-blur-md"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)' }}
          >
            <HistoryIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-black tracking-tight text-white">
              Riwayat
            </h1>
            <p className="text-xs font-medium text-white/60 tracking-wide mt-0.5">
              Buku Catatan Pengeluaran Gudang
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-20">
        {isLoading ? (
          <div className="bg-white p-8 rounded-3xl border border-[#EFECE6] text-center shadow-md animate-pulse">
            <p style={{ color: '#8A7968' }} className="text-sm font-medium">Membuka catatan riwayat...</p>
          </div>
        ) : !histories || histories.length === 0 ? (
          <div
            className="animate-fade-in-up p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-md border"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#EFECE6',
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-float"
              style={{ backgroundColor: '#FAF7F2' }}
            >
              <PackageOpen className="w-8 h-8" style={{ color: 'rgba(138,121,104,0.6)' }} />
            </div>
            <h3 className="text-lg font-serif font-bold mb-1" style={{ color: '#4A2C2A' }}>
              Catatan Masih Kosong
            </h3>
            <p className="text-xs max-w-[260px] leading-relaxed" style={{ color: '#8A7968' }}>
              Belum ada stok coklat yang dikeluarkan dari gudang. Semua persediaan masih utuh terjaga.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {histories.map((item: any, index: number) => (
              <div
                key={item.id}
                className="animate-fade-in-up p-5 rounded-3xl flex flex-col gap-3 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.01]"
                style={{ 
                  backgroundColor: '#FFFFFF', 
                  border: '1px solid #EFECE6',
                  animationDelay: `${index * 50}ms`
                }}
              >
                {/* Indikator Sisi Kiri */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: '#B03A2E' }}
                ></div>

                {/* Header baris atas */}
                <div className="flex justify-between items-start pb-2.5 pl-2" style={{ borderBottom: '1px solid #FAF7F2' }}>
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: '#2E2015' }}>
                      {item.batches?.kode_batch || 'Batch Dihapus'}
                    </h3>
                    <span
                      className="inline-block px-2.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase rounded-full mt-1.5"
                      style={
                        item.batches?.jenis_coklat === 'Fermentasi'
                          ? { backgroundColor: 'rgba(74,44,42,0.08)', color: '#4A2C2A' }
                          : { backgroundColor: 'rgba(59,93,58,0.08)', color: '#3B5D3A' }
                      }
                    >
                      {item.batches?.jenis_coklat || '-'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-serif font-black text-2xl" style={{ color: '#B03A2E' }}>
                      - {item.jumlah_keluar}
                    </span>
                    <span className="text-xs font-bold ml-0.5" style={{ color: '#B03A2E' }}>Kg</span>
                  </div>
                </div>

                {/* Informasi detail */}
                <div className="text-xs pl-2 space-y-2" style={{ color: '#8A7968' }}>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                    <span>
                      {new Date(item.tanggal_keluar).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  
                  {item.keterangan && (
                    <div
                      className="p-3 rounded-2xl italic flex gap-2"
                      style={{
                        color: '#5E4E42',
                        backgroundColor: '#FAF7F2',
                        border: '1px solid rgba(239,236,230,0.5)',
                      }}
                    >
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D4A373]" />
                      <p className="text-[11px] leading-relaxed">"{item.keterangan}"</p>
                    </div>
                  )}
                  
                  <p className="text-[10px] text-right" style={{ color: 'rgba(138,121,104,0.45)' }}>
                    Dicatat pada {new Date(item.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
