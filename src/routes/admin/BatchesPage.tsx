import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, X, Calendar, User, Sparkles, AlertCircle, FileText, Printer, Users, MapPin } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ConfirmModal } from '../../components/ConfirmModal'
import { FarmerManager } from '../../components/FarmerManager'

const batchSchema = z.object({
  kode_batch: z.string().min(1, 'Kode batch wajib diisi'),
  jenis_coklat: z.enum(['Fermentasi', 'Non-Fermentasi']),
  jumlah_masuk: z.number().min(0.1, 'Jumlah minimal 0.1 Kg'),
  tanggal_masuk: z.string().min(1, 'Tanggal masuk wajib diisi'),
  tanggal_expired: z.string().min(1, 'Tanggal expired wajib diisi'),
  asal_petani: z.string().min(1, 'Nama petani wajib dipilih'),
  lokasi_rak: z.string().min(1, 'Lokasi rak wajib diisi'),
  catatan: z.string().optional(),
})

type BatchForm = z.infer<typeof batchSchema>

export function getFermentationStatus(tanggalMasukStr: string, jenisCoklat: string) {
  if (jenisCoklat !== 'Fermentasi') return null;
  
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const masukDate = new Date(tanggalMasukStr);
  masukDate.setHours(0,0,0,0);
  
  // Umur (dalam hari)
  const diffTime = today.getTime() - masukDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const dayNum = diffDays + 1; // Hari ke-1 adalah tanggal_masuk
  
  if (dayNum < 1) {
    return {
      status: 'Menunggu',
      text: 'Menunggu Fermentasi',
      percent: 0,
      color: '#D4A373',
      bgColor: 'rgba(212, 163, 115, 0.08)'
    };
  } else if (dayNum <= 4) {
    return {
      status: 'Proses',
      text: `Proses Fermentasi (Hari ${dayNum} dari 7)`,
      percent: Math.round((dayNum / 7) * 100),
      color: '#D4A373',
      bgColor: 'rgba(212, 163, 115, 0.08)'
    };
  } else {
    return {
      status: 'Selesai',
      text: 'Telah Terfermentasi (Siap Olah)',
      percent: 100,
      color: '#3B5D3A',
      bgColor: 'rgba(59, 93, 58, 0.08)'
    };
  }
}

export function AdminBatchesPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [successAlertMsg, setSuccessAlertMsg] = useState<string | null>(null)

  // Farmer Manager State
  const [isFarmerManagerOpen, setIsFarmerManagerOpen] = useState(false)

  // State to hold printable batch for print preview modal
  const [printBatch, setPrintBatch] = useState<any | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BatchForm>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      jenis_coklat: 'Fermentasi',
      asal_petani: '',
      lokasi_rak: '',
    }
  })

  // Watch jenis_coklat for segmented control UI
  const watchJenisCoklat = watch('jenis_coklat')

  // Fetch Registered Farmers
  const { data: farmers } = useQuery({
    queryKey: ['farmers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .order('nama', { ascending: true })
      if (error) throw error
      return data
    }
  })

  // Handler saat farmer dipilih dari FarmerManager
  const handleSelectFarmer = (farmerName: string) => {
    setValue('asal_petani', farmerName)
  }

  // Fetch Data Batches Aktif
  const { data: batches, isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
  })

  // Mutation Tambah Batch
  const addMutation = useMutation({
    mutationFn: async (newData: BatchForm) => {
      const { error } = await supabase.from('batches').insert([{
        ...newData,
        jumlah_sisa: newData.jumlah_masuk,
      }])
      if (error) {
        if (error.code === '23505') throw new Error('Kode Batch sudah terdaftar!')
        throw new Error(error.message)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      setIsModalOpen(false)
      reset()
      setSuccessAlertMsg(`Batch ${variables.kode_batch} berhasil ditambahkan ke stok masuk!`)
    },
  })

  // Mutation Hapus (Soft Delete)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('batches')
        .update({ is_deleted: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      setSuccessAlertMsg('Batch berhasil dihapus dari stok aktif.')
    },
  })

  const onSubmit = (data: BatchForm) => {
    addMutation.mutate(data)
  }

  return (
    <div className="pb-28 min-h-screen overflow-y-auto" style={{ backgroundColor: '#FAF7F2' }}>
      {/* Header Kakao Premium dengan Tombol Tambah */}
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
          <Plus className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-serif font-black tracking-tight text-white">
              Stok Masuk
            </h1>
            <p className="text-xs font-medium text-white/60 tracking-wide mt-0.5">
              Kelola daftar batch biji kakao
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all duration-300 shadow-md cursor-pointer border hover:scale-[1.02]"
            style={{ 
              backgroundColor: '#D4A373', 
              borderColor: '#E8DCC4',
              color: '#4A2C2A'
            }}
          >
            <Plus className="w-4 h-4 text-[#4A2C2A] stroke-[3]" />
            <span className="text-xs font-extrabold uppercase tracking-wider">Tambah Batch</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 -mt-8 relative z-20">
        {isLoading ? (
          <div className="bg-white p-8 rounded-3xl border border-[#EFECE6] text-center shadow-md animate-pulse">
            <p style={{ color: '#8A7968' }} className="text-sm font-medium">Memuat catatan batch...</p>
          </div>
        ) : batches?.length === 0 ? (
          <div
            className="p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-md border"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#EFECE6' }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-[#FAF7F2]">
              <AlertCircle className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-serif font-bold mb-1" style={{ color: '#4A2C2A' }}>
              Belum Ada Batch
            </h3>
            <p className="text-xs max-w-[260px] leading-relaxed mb-4" style={{ color: '#8A7968' }}>
              Belum ada batch biji kakao terdaftar. Tekan tombol 'Tambah Batch' di atas untuk memulai.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {batches?.map((batch, index) => {
              const progressPercent = Math.max(0, Math.min(100, (Number(batch.jumlah_sisa) / Number(batch.jumlah_masuk)) * 100))
              const fermStatus = getFermentationStatus(batch.tanggal_masuk, batch.jenis_coklat)
              
              return (
                <div
                  key={batch.id}
                  className="animate-fade-in-up p-5 rounded-3xl flex flex-col gap-4 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:scale-[1.01]"
                  style={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #EFECE6',
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {/* Jenis Coklat Side Indicator */}
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
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-neutral-400">Sisa Stok</span>
                      <p className="text-xl font-serif font-black" style={{ color: '#4A2C2A' }}>
                        {batch.jumlah_sisa} <span className="text-xs font-sans font-normal ml-0.5 text-neutral-500">Kg</span>
                      </p>
                    </div>
                  </div>

                  {/* Fermentation Progress (If Fermentasi) */}
                  {fermStatus && (
                    <div 
                      className="pl-2 pr-3 py-2.5 rounded-2xl border text-[11px] font-bold flex flex-col gap-2"
                      style={{ 
                        borderColor: `${fermStatus.color}20`, 
                        backgroundColor: fermStatus.bgColor,
                        color: fermStatus.color
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <span>{fermStatus.text}</span>
                        <span>{fermStatus.percent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-200/40 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-300 animate-pulse" 
                          style={{ width: `${fermStatus.percent}%`, backgroundColor: fermStatus.color }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Stock Progress Bar (UX visual indicator) */}
                  <div className="pl-2 space-y-1">
                    <div className="flex justify-between text-[9px] font-bold uppercase text-neutral-400">
                      <span>Kapasitas Tersisa</span>
                      <span>{Math.round(progressPercent)}% ({batch.jumlah_sisa} / {batch.jumlah_masuk} Kg)</span>
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

                  {/* Inventory Details Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs pl-2 text-neutral-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>Masuk: <strong style={{ color: '#2E2015' }}>{new Date(batch.tanggal_masuk).toLocaleDateString('id-ID')}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>Exp: <strong style={{ color: '#2E2015' }}>{new Date(batch.tanggal_expired).toLocaleDateString('id-ID')}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>Rak Gudang: <strong style={{ color: '#2E2015' }}>{batch.lokasi_rak || '-'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span>Anggota Tani: <strong style={{ color: '#2E2015' }}>{batch.asal_petani}</strong></span>
                    </div>
                    {batch.catatan && (
                      <div className="col-span-2 flex items-start gap-1.5 bg-[#FAF7F2] p-2.5 rounded-2xl border border-neutral-100 italic text-[11px] leading-relaxed">
                        <FileText className="w-3.5 h-3.5 text-[#D4A373] shrink-0 mt-0.5" />
                        <p style={{ color: '#5E4E42' }}>"{batch.catatan}"</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex justify-between items-center pt-3 border-t border-[#FAF7F2] mt-1 pl-2">
                    <button
                      onClick={() => setPrintBatch(batch)}
                      className="flex items-center gap-1 text-[10px] font-bold text-neutral-500 hover:text-[#4A2C2A] hover:bg-neutral-100 px-2.5 py-1.5 rounded-xl border border-transparent hover:border-neutral-200 transition-all cursor-pointer"
                      title="Cetak Label Rak / Karung"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#D4A373]" />
                      <span>CETAK LABEL</span>
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(batch.id)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1 text-[10px] font-bold text-red-500/80 hover:text-red-600 hover:bg-red-500/5 px-2.5 py-1.5 rounded-xl border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
                      title="Hapus (Soft Delete)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>HAPUS BATCH</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Tambah Batch */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div 
            className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-fade-in-up border"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#EFECE6' }}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EFECE6] flex justify-between items-center bg-[#FAF7F2]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4A373]" />
                <h2 className="font-bold text-[#4A2C2A] text-lg font-serif">Tambah Stok Masuk</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-neutral-400 hover:text-red-500 hover:bg-neutral-100 p-1.5 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {addMutation.isError && (
                <div className="p-3 bg-red-500/6 border border-red-500/15 text-red-600 text-xs font-semibold rounded-2xl flex gap-2">
                  <span>⚠️</span>
                  <p>{addMutation.error?.message || 'Gagal menyimpan data.'}</p>
                </div>
              )}
              
              <form id="add-batch-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Kode Batch */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2E2015] tracking-wide">Kode Batch</label>
                  <input 
                    {...register('kode_batch')} 
                    className="w-full text-sm px-3.5 py-2.5 rounded-2xl border transition-all duration-300 outline-none" 
                    style={{ backgroundColor: '#FAF7F2', borderColor: '#EFECE6' }}
                    onFocus={(e) => { e.target.style.borderColor = '#4A2C2A'; e.target.style.boxShadow = '0 0 0 3px rgba(74, 44, 42, 0.08)' }}
                    onBlur={(e) => { e.target.style.borderColor = '#EFECE6'; e.target.style.boxShadow = 'none' }}
                    placeholder="Contoh: BATCH-001" 
                  />
                  {errors.kode_batch && <p className="text-red-600 text-[10px] font-semibold mt-1 pl-1">{errors.kode_batch.message}</p>}
                </div>
                
                {/* Jenis Coklat (Segmented Control - Premium Dropdown Replacement) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2E2015] tracking-wide">Jenis Coklat</label>
                  <div className="flex gap-2 p-1 rounded-2xl border" style={{ backgroundColor: '#FAF7F2', borderColor: '#EFECE6' }}>
                    <button
                      type="button"
                      onClick={() => setValue('jenis_coklat', 'Fermentasi')}
                      className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer"
                      style={{
                        backgroundColor: watchJenisCoklat === 'Fermentasi' ? '#4A2C2A' : 'transparent',
                        color: watchJenisCoklat === 'Fermentasi' ? '#FFFFFF' : '#8A7968',
                        boxShadow: watchJenisCoklat === 'Fermentasi' ? '0 4px 10px rgba(74, 44, 42, 0.15)' : 'none'
                      }}
                    >
                      Fermentasi
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('jenis_coklat', 'Non-Fermentasi')}
                      className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer"
                      style={{
                        backgroundColor: watchJenisCoklat === 'Non-Fermentasi' ? '#3B5D3A' : 'transparent',
                        color: watchJenisCoklat === 'Non-Fermentasi' ? '#FFFFFF' : '#8A7968',
                        boxShadow: watchJenisCoklat === 'Non-Fermentasi' ? '0 4px 10px rgba(59, 93, 58, 0.15)' : 'none'
                      }}
                    >
                      Mentah / Non-Ferm
                    </button>
                  </div>
                </div>
                
                {/* Jumlah Masuk */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2E2015] tracking-wide">Jumlah Masuk (Kg)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    {...register('jumlah_masuk', { valueAsNumber: true })} 
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full text-sm px-3.5 py-2.5 rounded-2xl border transition-all duration-300 outline-none" 
                    style={{ backgroundColor: '#FAF7F2', borderColor: '#EFECE6' }}
                    onFocus={(e) => { e.target.style.borderColor = '#4A2C2A'; e.target.style.boxShadow = '0 0 0 3px rgba(74, 44, 42, 0.08)' }}
                    onBlur={(e) => { e.target.style.borderColor = '#EFECE6'; e.target.style.boxShadow = 'none' }}
                    placeholder="0" 
                  />
                  {errors.jumlah_masuk && <p className="text-red-600 text-[10px] font-semibold mt-1 pl-1">{errors.jumlah_masuk.message}</p>}
                </div>
                
                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#2E2015] tracking-wide">Tgl Masuk</label>
                    <input 
                      type="date" 
                      {...register('tanggal_masuk')} 
                      className="w-full text-sm px-3 py-2.5 rounded-2xl border transition-all duration-300 outline-none" 
                      style={{ backgroundColor: '#FAF7F2', borderColor: '#EFECE6' }}
                      onFocus={(e) => { e.target.style.borderColor = '#4A2C2A'; e.target.style.boxShadow = '0 0 0 3px rgba(74, 44, 42, 0.08)' }}
                      onBlur={(e) => { e.target.style.borderColor = '#EFECE6'; e.target.style.boxShadow = 'none' }}
                    />
                    {errors.tanggal_masuk && <p className="text-red-600 text-[10px] font-semibold mt-1 pl-1">{errors.tanggal_masuk.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-[#2E2015] tracking-wide">Tgl Expired</label>
                    <input 
                      type="date" 
                      {...register('tanggal_expired')} 
                      className="w-full text-sm px-3 py-2.5 rounded-2xl border transition-all duration-300 outline-none" 
                      style={{ backgroundColor: '#FAF7F2', borderColor: '#EFECE6' }}
                      onFocus={(e) => { e.target.style.borderColor = '#4A2C2A'; e.target.style.boxShadow = '0 0 0 3px rgba(74, 44, 42, 0.08)' }}
                      onBlur={(e) => { e.target.style.borderColor = '#EFECE6'; e.target.style.boxShadow = 'none' }}
                    />
                    {errors.tanggal_expired && <p className="text-red-600 text-[10px] font-semibold mt-1 pl-1">{errors.tanggal_expired.message}</p>}
                  </div>
                </div>

                {/* Lokasi Rak Gudang */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2E2015] tracking-wide">Lokasi Rak Gudang</label>
                  <input 
                    {...register('lokasi_rak')} 
                    className="w-full text-sm px-3.5 py-2.5 rounded-2xl border transition-all duration-300 outline-none" 
                    style={{ backgroundColor: '#FAF7F2', borderColor: '#EFECE6' }}
                    onFocus={(e) => { e.target.style.borderColor = '#4A2C2A'; e.target.style.boxShadow = '0 0 0 3px rgba(74, 44, 42, 0.08)' }}
                    onBlur={(e) => { e.target.style.borderColor = '#EFECE6'; e.target.style.boxShadow = 'none' }}
                    placeholder="Contoh: Rak A-1, Baris 2" 
                  />
                  {errors.lokasi_rak && <p className="text-red-600 text-[10px] font-semibold mt-1 pl-1">{errors.lokasi_rak.message}</p>}
                </div>

                {/* Anggota Kelompok Tani Dropdown */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2E2015] tracking-wide flex justify-between items-center">
                    <span>Anggota Kelompok Tani</span>
                    <button
                      type="button"
                      onClick={() => setIsFarmerManagerOpen(true)}
                      className="text-[10px] font-extrabold text-[#4A2C2A] hover:text-[#6F4E37] flex items-center gap-1 cursor-pointer bg-[#4A2C2A]/5 hover:bg-[#4A2C2A]/10 px-2 py-0.5 rounded-lg transition-all"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Kelola</span>
                    </button>
                  </label>
                  
                  <div className="relative">
                    <select
                      {...register('asal_petani')}
                      className="w-full text-sm px-3.5 py-2.5 rounded-2xl border transition-all duration-300 outline-none bg-[#FAF7F2]"
                      style={{ borderColor: '#EFECE6', color: '#2E2015' }}
                    >
                      <option value="">-- Pilih Anggota Tani --</option>
                      {farmers?.map((f) => (
                        <option key={f.id} value={f.nama}>
                          {f.nama} {f.no_hp ? `(${f.no_hp})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.asal_petani && <p className="text-red-600 text-[10px] font-semibold mt-1 pl-1">{errors.asal_petani.message}</p>}
                </div>
                
                {/* Catatan */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2E2015] tracking-wide">Catatan (Opsional)</label>
                  <textarea 
                    {...register('catatan')} 
                    className="w-full text-sm px-3.5 py-2.5 rounded-2xl border transition-all duration-300 outline-none" 
                    style={{ backgroundColor: '#FAF7F2', borderColor: '#EFECE6' }}
                    onFocus={(e) => { e.target.style.borderColor = '#4A2C2A'; e.target.style.boxShadow = '0 0 0 3px rgba(74, 44, 42, 0.08)' }}
                    onBlur={(e) => { e.target.style.borderColor = '#EFECE6'; e.target.style.boxShadow = 'none' }}
                    rows={2} 
                    placeholder="Kondisi pengiriman, kadar air, dll"
                  ></textarea>
                </div>
              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="p-5 border-t border-[#EFECE6] bg-[#FAF7F2] flex justify-end gap-3 mt-auto">
              <button 
                onClick={() => setIsModalOpen(false)}
                type="button" 
                className="px-5 py-2.5 text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-2xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button 
                form="add-batch-form"
                type="submit" 
                disabled={isSubmitting || addMutation.isPending}
                className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white rounded-2xl transition-all duration-300 shadow-md cursor-pointer hover:scale-[1.01]"
                style={{ 
                  backgroundColor: '#4A2C2A',
                  boxShadow: '0 4px 12px rgba(74, 44, 42, 0.15)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6F4E37'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4A2C2A'}
              >
                {isSubmitting || addMutation.isPending ? 'Menyimpan...' : 'Simpan Stok'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Reusable Confirm Modal for Deletion */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => {
          if (deleteTargetId) deleteMutation.mutate(deleteTargetId)
        }}
        title="Hapus Batch Coklat?"
        message="Batch ini akan diarsipkan (soft delete) dan dikeluarkan dari daftar aktif. Persediaan stok sisa tidak akan dihitung kembali."
        type="danger"
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />

      {/* Success Alert Modal (Notification) */}
      <ConfirmModal
        isOpen={successAlertMsg !== null}
        onClose={() => setSuccessAlertMsg(null)}
        title="Berhasil!"
        message={successAlertMsg || ''}
        type="success"
      />

      {/* Modal Cetak Label Rak (Print Preview) - Rendered via React Portal */}
      {printBatch && createPortal(
        <div id="printable-label-root" className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:bg-transparent print:p-0 print:static">
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden border border-neutral-100 flex flex-col animate-fade-in-up print:static print:bg-transparent print:border-none print:shadow-none">
            <div className="p-5 border-b border-neutral-100 flex justify-between items-center bg-neutral-50 print:hidden">
              <h3 className="font-bold text-neutral-800 text-sm font-serif">Preview Cetak Label Rak</h3>
              <button onClick={() => setPrintBatch(null)} className="text-neutral-400 hover:text-red-500 p-1 rounded-full cursor-pointer hover:bg-neutral-100 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* The printable area */}
            <div className="p-6 bg-neutral-50 flex justify-center print:bg-transparent print:p-0">
              <div 
                id="printable-label"
                className="w-full border-2 border-dashed border-[#4A2C2A] p-5 rounded-2xl bg-white flex flex-col gap-3 text-[#2E2015] shadow-sm print:m-0 print:border-2"
                style={{ width: '100%', maxWidth: '320px' }}
              >
                <div className="text-center pb-2 border-b border-[#FAF7F2]">
                  <span className="text-[8px] font-extrabold uppercase tracking-widest text-[#D4A373] block">LABEL RAK PERSERIKATAN GUDANG</span>
                  <h4 className="text-lg font-bold font-serif tracking-tight mt-0.5" style={{ color: '#4A2C2A' }}>{printBatch.kode_batch}</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 text-[11px]">
                  <div>
                    <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wide block">Jenis Coklat</span>
                    <span className="font-extrabold" style={{ color: printBatch.jenis_coklat === 'Fermentasi' ? '#4A2C2A' : '#3B5D3A' }}>
                      {printBatch.jenis_coklat}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wide block">Lokasi Rak</span>
                    <span className="font-extrabold text-[#4A2C2A]">{printBatch.lokasi_rak || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wide block">Jumlah Berat</span>
                    <span className="font-extrabold">{printBatch.jumlah_masuk} Kg</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wide block">Nama Anggota</span>
                    <span className="font-extrabold truncate block">{printBatch.asal_petani}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wide block">Tgl Masuk</span>
                    <span className="font-bold">{new Date(printBatch.tanggal_masuk).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-wide block">Tgl Expired</span>
                    <span className="font-bold">{new Date(printBatch.tanggal_expired).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
                
                {printBatch.catatan && (
                  <div className="text-[9px] bg-[#FAF7F2] p-2 rounded-xl border border-neutral-100 italic mt-1 leading-relaxed">
                    "{printBatch.catatan}"
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-neutral-100 bg-white flex flex-col gap-2 print:hidden">
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setPrintBatch(null)} 
                  className="px-4 py-2 text-xs font-bold text-neutral-500 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={() => window.print()} 
                  className="px-5 py-2 text-xs font-extrabold uppercase text-white bg-[#4A2C2A] rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer hover:bg-[#6F4E37] transition-all"
                >
                  <Printer className="w-4 h-4 text-[#D4A373]" />
                  Cetak Label
                </button>
              </div>
              <p className="text-[9px] text-center text-neutral-400 font-medium">
                Tip: Pilih tujuan printer <strong>"Save as PDF"</strong> / <strong>"Simpan sebagai PDF"</strong> untuk mengunduh label.
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Kelola Anggota Tani (Full CRUD) */}
      <FarmerManager
        isOpen={isFarmerManagerOpen}
        onClose={() => setIsFarmerManagerOpen(false)}
        onSelectFarmer={handleSelectFarmer}
      />
    </div>
  )
}
