import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { History as HistoryIcon, ChevronDown, ChevronUp, Calendar, Info, Clock, AlertCircle } from 'lucide-react'

export function PublicHistoryPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

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
        <div className="absolute -top-16 -right-16 pointer-events-none opacity-[0.03] animate-float">
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

      {/* Main Content Area */}
      <div className="px-5 -mt-8 relative z-20">
        {isLoading ? (
          <div className="bg-white p-8 rounded-3xl border border-[#EFECE6] text-center shadow-md animate-pulse">
            <p style={{ color: '#8A7968' }} className="text-sm font-medium">Memuat catatan riwayat...</p>
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
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-[#FAF7F2]"
            >
              <AlertCircle className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-serif font-bold mb-1" style={{ color: '#4A2C2A' }}>
              Catatan Masih Kosong
            </h3>
            <p className="text-xs max-w-[260px] leading-relaxed" style={{ color: '#8A7968' }}>
              Belum ada stok coklat yang dikeluarkan dari gudang. Semua persediaan masih utuh terjaga.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {histories.map((item: any, index: number) => {
              const isExpanded = expandedId === item.id
              
              return (
                <div
                  key={item.id}
                  className="animate-fade-in-up rounded-2xl border transition-all duration-300 overflow-hidden shadow-sm"
                  style={{ 
                    backgroundColor: '#FFFFFF', 
                    borderColor: '#EFECE6',
                    animationDelay: `${index * 30}ms`
                  }}
                >
                  {/* Collapsed Header / Row (Compact UX view) */}
                  <div
                    onClick={() => toggleExpand(item.id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Red left bar indicator */}
                      <div className="w-1 h-8 rounded-full" style={{ backgroundColor: '#B03A2E' }}></div>
                      
                      <div className="flex flex-col">
                        <span className="font-extrabold text-sm" style={{ color: '#2E2015' }}>
                          {item.batches?.kode_batch || 'Batch Dihapus'}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-bold tracking-wide uppercase mt-0.5">
                          {new Date(item.tanggal_keluar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className="px-2 py-0.5 text-[8px] font-extrabold tracking-wider uppercase rounded-full"
                        style={
                          item.batches?.jenis_coklat === 'Fermentasi'
                            ? { backgroundColor: 'rgba(74,44,42,0.08)', color: '#4A2C2A' }
                            : { backgroundColor: 'rgba(59,93,58,0.08)', color: '#3B5D3A' }
                        }
                      >
                        {item.batches?.jenis_coklat === 'Fermentasi' ? 'Ferm' : 'Mentah'}
                      </span>
                      
                      <span className="font-serif font-black text-sm" style={{ color: '#B03A2E' }}>
                        -{item.jumlah_keluar} <span className="text-[10px] font-sans font-medium text-neutral-500">Kg</span>
                      </span>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div 
                      className="px-5 pb-5 pt-3 border-t text-xs text-neutral-500 space-y-3 animate-fade-in-up"
                      style={{ 
                        backgroundColor: '#FCFAF7',
                        borderColor: '#F5EFE6',
                        animationDuration: '200ms'
                      }}
                    >
                      {/* Date */}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Tanggal Keluar: <strong style={{ color: '#2E2015' }}>{new Date(item.tanggal_keluar).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                      </div>

                      {/* Created At Timestamp */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Waktu Pencatatan: <strong style={{ color: '#2E2015' }}>{new Date(item.created_at).toLocaleString('id-ID')}</strong></span>
                      </div>

                      {/* Keterangan */}
                      {item.keterangan ? (
                        <div
                          className="p-3 rounded-2xl italic flex gap-2 border"
                          style={{
                            color: '#5E4E42',
                            backgroundColor: '#FFFFFF',
                            borderColor: '#EFECE6'
                          }}
                        >
                          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D4A373]" />
                          <p className="text-[11px] leading-relaxed">"{item.keterangan}"</p>
                        </div>
                      ) : (
                        <div className="text-[10px] italic text-neutral-400 pl-5">
                          Tidak ada keterangan/tujuan pengiriman.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
