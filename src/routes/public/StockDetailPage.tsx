import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Boxes, Calendar, User, FileText, Search } from 'lucide-react'

export function PublicStockDetailPage() {
  const [filterType, setFilterType] = useState<'Semua' | 'Fermentasi' | 'Non-Fermentasi'>('Semua')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch Data Batches Aktif
  const { data: batches, isLoading } = useQuery({
    queryKey: ['public-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('is_deleted', false)
        .order('tanggal_expired', { ascending: true }) // Urutkan berdasarkan ED (FEFO) agar informatif
      
      if (error) throw error
      return data
    },
  })

  // Filter & Search Logic
  const filteredBatches = batches?.filter((batch) => {
    const matchesType = filterType === 'Semua' ? true : batch.jenis_coklat === filterType
    const matchesSearch = batch.kode_batch.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (batch.asal_petani && batch.asal_petani.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesType && matchesSearch
  })

  return (
    <div className="pb-28 min-h-screen overflow-y-auto" style={{ backgroundColor: '#FAF7F2' }}>
      {/* Header Kakao Premium */}
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
          <Boxes className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div
            className="p-2.5 rounded-2xl flex items-center justify-center backdrop-blur-md"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)' }}
          >
            <Boxes className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-black tracking-tight text-white">
              Detail Stok
            </h1>
            <p className="text-xs font-medium text-white/60 tracking-wide mt-0.5">
              Daftar muatan batch aktif di gudang
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar - Pulling up into the header */}
      <div className="px-5 -mt-8 relative z-20 space-y-3">
        {/* Search Input */}
        <div 
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border bg-white shadow-md"
          style={{ borderColor: '#EFECE6' }}
        >
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode batch atau petani..." 
            className="w-full text-xs outline-none text-[#2E2015] bg-transparent"
          />
        </div>

        {/* Segmented Filter */}
        <div 
          className="flex gap-1.5 p-1 rounded-2xl border bg-white shadow-sm" 
          style={{ borderColor: '#EFECE6' }}
        >
          {(['Semua', 'Fermentasi', 'Non-Fermentasi'] as const).map((type) => {
            const isActive = filterType === type
            const activeBgColor = type === 'Fermentasi' ? '#4A2C2A' : type === 'Non-Fermentasi' ? '#3B5D3A' : '#735751'
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className="flex-1 py-2 text-[10px] font-bold rounded-xl transition-all duration-300 cursor-pointer text-center"
                style={{
                  backgroundColor: isActive ? activeBgColor : 'transparent',
                  color: isActive ? '#FFFFFF' : '#8A7968',
                  boxShadow: isActive ? '0 4px 10px rgba(0, 0, 0, 0.1)' : 'none'
                }}
              >
                {type === 'Non-Fermentasi' ? 'Mentah' : type}
              </button>
            )
          })}
        </div>
      </div>

      {/* Batches List Container */}
      <div className="px-5 mt-5">
        {isLoading ? (
          <div className="bg-white p-8 rounded-3xl border border-[#EFECE6] text-center shadow-md animate-pulse">
            <p style={{ color: '#8A7968' }} className="text-sm font-medium">Memuat info batch...</p>
          </div>
        ) : filteredBatches?.length === 0 ? (
          <div
            className="p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-md border bg-white"
            style={{ borderColor: '#EFECE6' }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-[#FAF7F2]">
              <Boxes className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-sm font-bold mb-1" style={{ color: '#4A2C2A' }}>
              Tidak Ada Stok Cocok
            </h3>
            <p className="text-[11px] leading-relaxed" style={{ color: '#8A7968' }}>
              Tidak ditemukan batch aktif yang sesuai dengan filter pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBatches?.map((batch, index) => {
              const progressPercent = Math.max(0, Math.min(100, (Number(batch.jumlah_sisa) / Number(batch.jumlah_masuk)) * 100))
              
              return (
                <div
                  key={batch.id}
                  className="animate-fade-in-up p-5 rounded-3xl flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.01] bg-white border"
                  style={{ 
                    borderColor: '#EFECE6',
                    animationDelay: `${index * 30}ms`
                  }}
                >
                  {/* Indicator Line */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: batch.jenis_coklat === 'Fermentasi' ? '#4A2C2A' : '#3B5D3A' }}
                  ></div>

                  {/* Header: Batch Name + Stock */}
                  <div className="flex justify-between items-start pb-3 pl-2" style={{ borderBottom: '1px solid #FAF7F2' }}>
                    <div>
                      <h3 className="font-extrabold text-base" style={{ color: '#2E2015' }}>
                        {batch.kode_batch}
                      </h3>
                      <span
                        className="inline-block px-2.5 py-0.5 text-[9px] font-extrabold tracking-wider uppercase rounded-full mt-1.5"
                        style={
                          batch.jenis_coklat === 'Fermentasi'
                            ? { backgroundColor: 'rgba(74,44,42,0.08)', color: '#4A2C2A' }
                            : { backgroundColor: 'rgba(59,93,58,0.08)', color: '#3B5D3A' }
                        }
                      >
                        {batch.jenis_coklat}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-neutral-400">Tersedia</span>
                      <p className="text-xl font-serif font-black" style={{ color: '#4A2C2A' }}>
                        {batch.jumlah_sisa} <span className="text-xs font-sans font-normal ml-0.5 text-neutral-500">Kg</span>
                      </p>
                    </div>
                  </div>

                  {/* Stock Progress Line */}
                  <div className="pl-2 space-y-1">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-neutral-400">
                      <span>Kapasitas Tersedia</span>
                      <span>{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${progressPercent}%`,
                          backgroundColor: batch.jenis_coklat === 'Fermentasi' ? '#4A2C2A' : '#3B5D3A'
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs pl-2 text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>Masuk: <strong style={{ color: '#2E2015' }}>{new Date(batch.tanggal_masuk).toLocaleDateString('id-ID')}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>ED (Expired): <strong style={{ color: '#2E2015' }}>{new Date(batch.tanggal_expired).toLocaleDateString('id-ID')}</strong></span>
                    </div>
                    {batch.asal_petani && (
                      <div className="col-span-2 flex items-center gap-1.5 border-t border-[#FAF7F2] pt-2">
                        <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>Petani: <strong style={{ color: '#2E2015' }}>{batch.asal_petani}</strong></span>
                      </div>
                    )}
                    {batch.catatan && (
                      <div className="col-span-2 flex items-start gap-1.5 bg-[#FAF7F2] p-2.5 rounded-2xl border border-neutral-100 italic text-[11px] leading-relaxed">
                        <FileText className="w-3.5 h-3.5 text-[#D4A373] shrink-0 mt-0.5" />
                        <p style={{ color: '#5E4E42' }}>"{batch.catatan}"</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
