import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PackageMinus, CheckCircle2, ArrowRightLeft, Sparkles, Calendar, FileText } from 'lucide-react'
import { ConfirmModal } from '../../components/ConfirmModal'

const stockOutSchema = z.object({
  p_jenis_coklat: z.enum(['Fermentasi', 'Non-Fermentasi']),
  p_jumlah_dibutuhkan: z.number().min(0.1, 'Jumlah minimal 0.1 Kg'),
  p_tanggal_keluar: z.string().min(1, 'Tanggal keluar wajib diisi'),
  p_keterangan: z.string().optional(),
})

type StockOutForm = z.infer<typeof stockOutSchema>

export function AdminStockOutPage() {
  const queryClient = useQueryClient()
  const [successAlertMsg, setSuccessAlertMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StockOutForm>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: {
      p_jenis_coklat: 'Fermentasi',
      p_tanggal_keluar: new Date().toISOString().split('T')[0],
      p_keterangan: '',
    }
  })

  const watchJenisCoklat = watch('p_jenis_coklat')

  // Fetch Current Stock for the watched chocolate type
  const { data: stockSummary } = useQuery({
    queryKey: ['stock-summary-stockout'],
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

      return { Fermentasi: fermentasi, 'Non-Fermentasi': nonFermentasi }
    },
  })

  const stockOutMutation = useMutation({
    mutationFn: async (data: StockOutForm) => {
      const { error } = await supabase.rpc('process_stock_out', {
        p_jenis_coklat: data.p_jenis_coklat,
        p_jumlah_dibutuhkan: data.p_jumlah_dibutuhkan,
        p_tanggal_keluar: data.p_tanggal_keluar,
        p_keterangan: data.p_keterangan || null,
      })

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['history'] })
      queryClient.invalidateQueries({ queryKey: ['stock-summary-stockout'] })
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] })
      
      setSuccessAlertMsg(`Berhasil mengeluarkan ${variables.p_jumlah_dibutuhkan} Kg coklat ${variables.p_jenis_coklat} dari gudang sesuai prinsip FEFO!`)
      reset()
    },
  })

  const onSubmit = (data: StockOutForm) => {
    stockOutMutation.mutate(data)
  }

  const currentStock = stockSummary ? stockSummary[watchJenisCoklat] : 0

  return (
    <div className="pb-28 min-h-screen overflow-y-auto" style={{ backgroundColor: '#FAF7F2' }}>
      {/* Header Kakao Premium dengan Visual curves */}
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
          <PackageMinus className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col gap-1">
          <h1 className="text-3xl font-serif font-black tracking-tight text-white">
            Stok Keluar
          </h1>
          <p className="text-xs font-medium text-white/60 tracking-wide mt-0.5">
            Sistem pengeluaran otomatis berbasis FEFO
          </p>
        </div>
      </div>

      {/* Main Content Form */}
      <div className="px-5 -mt-8 relative z-20">
        <div 
          className="p-6 rounded-3xl border shadow-xl transition-all duration-300"
          style={{ 
            backgroundColor: '#FFFFFF', 
            borderColor: '#EFECE6',
            boxShadow: '0 20px 40px rgba(74, 44, 42, 0.04)'
          }}
        >
          {stockOutMutation.isError && (
            <div 
              className="mb-5 p-4 rounded-2xl text-xs font-semibold border flex items-start gap-2.5 animate-pulse-soft"
              style={{ 
                backgroundColor: 'rgba(176, 58, 46, 0.06)', 
                borderColor: 'rgba(176, 58, 46, 0.15)',
                color: '#B03A2E'
              }}
            >
              <span>⚠️</span>
              <p>
                {stockOutMutation.error?.message === 'Stok tidak mencukupi' 
                  ? 'Permintaan pengeluaran ditolak. Total persediaan aktif untuk jenis coklat ini tidak mencukupi.' 
                  : stockOutMutation.error?.message}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Jenis Coklat (Segmented Control - Dropdown Replacement) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2E2015] tracking-wide">Jenis Coklat</label>
              <div className="flex gap-2 p-1 rounded-2xl border" style={{ backgroundColor: '#FAF7F2', borderColor: '#EFECE6' }}>
                <button
                  type="button"
                  onClick={() => setValue('p_jenis_coklat', 'Fermentasi')}
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
                  onClick={() => setValue('p_jenis_coklat', 'Non-Fermentasi')}
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

              {/* Dynamic Current Stock Display */}
              <div 
                className="p-3.5 rounded-2xl flex items-center justify-between border mt-2.5 transition-all duration-300"
                style={{
                  backgroundColor: watchJenisCoklat === 'Fermentasi' ? 'rgba(74,44,42,0.03)' : 'rgba(59,93,58,0.03)',
                  borderColor: watchJenisCoklat === 'Fermentasi' ? 'rgba(74,44,42,0.08)' : 'rgba(59,93,58,0.08)'
                }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Stok Saat Ini</span>
                <span className="text-sm font-extrabold" style={{ color: watchJenisCoklat === 'Fermentasi' ? '#4A2C2A' : '#3B5D3A' }}>
                  {currentStock.toLocaleString('id-ID')} <span className="text-xs font-normal text-neutral-500">Kg</span>
                </span>
              </div>
            </div>
            
            {/* Jumlah Keluar */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2E2015] tracking-wide">Jumlah Keluar (Kg)</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.1" 
                  {...register('p_jumlah_dibutuhkan', { valueAsNumber: true })} 
                  className="w-full text-sm pl-4 pr-12 py-3 rounded-2xl border transition-all duration-300 outline-none" 
                  style={{ backgroundColor: '#FAF7F2', borderColor: '#EFECE6' }}
                  onFocus={(e) => { e.target.style.borderColor = '#4A2C2A'; e.target.style.boxShadow = '0 0 0 3px rgba(74, 44, 42, 0.08)' }}
                  onBlur={(e) => { e.target.style.borderColor = '#EFECE6'; e.target.style.boxShadow = 'none' }}
                  placeholder="Contoh: 15.5" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 font-semibold text-xs">Kg</span>
              </div>
              {errors.p_jumlah_dibutuhkan && <p className="text-red-600 text-[10px] font-semibold mt-1 pl-1">{errors.p_jumlah_dibutuhkan.message}</p>}
            </div>
            
            {/* Tanggal Keluar */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2E2015] tracking-wide">Tanggal Keluar</label>
              <div className="relative group">
                <input 
                  type="date" 
                  {...register('p_tanggal_keluar')} 
                  className="w-full text-sm px-4 py-3 rounded-2xl border transition-all duration-300 outline-none bg-[#FAF7F2]" 
                  style={{ borderColor: '#EFECE6' }}
                  onFocus={(e) => { e.target.style.borderColor = '#4A2C2A'; e.target.style.boxShadow = '0 0 0 3px rgba(74, 44, 42, 0.08)' }}
                  onBlur={(e) => { e.target.style.borderColor = '#EFECE6'; e.target.style.boxShadow = 'none' }}
                />
              </div>
              {errors.p_tanggal_keluar && <p className="text-red-600 text-[10px] font-semibold mt-1 pl-1">{errors.p_tanggal_keluar.message}</p>}
            </div>

            {/* Keterangan */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#2E2015] tracking-wide">Keterangan / Tujuan (Opsional)</label>
              <textarea 
                {...register('p_keterangan')} 
                className="w-full text-sm px-4 py-3 rounded-2xl border transition-all duration-300 outline-none" 
                style={{ backgroundColor: '#FAF7F2', borderColor: '#EFECE6' }}
                onFocus={(e) => { e.target.style.borderColor = '#4A2C2A'; e.target.style.boxShadow = '0 0 0 3px rgba(74, 44, 42, 0.08)' }}
                onBlur={(e) => { e.target.style.borderColor = '#EFECE6'; e.target.style.boxShadow = 'none' }}
                rows={3} 
                placeholder="Misal: Dikirim ke pabrik A, diambil pembeli, dll."
              ></textarea>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isSubmitting || stockOutMutation.isPending}
              className="w-full mt-4 text-white font-bold text-sm py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-70 hover:scale-[1.01]"
              style={{ 
                backgroundColor: '#4A2C2A',
                boxShadow: '0 4px 12px rgba(74, 44, 42, 0.15)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6F4E37'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4A2C2A'}
            >
              <ArrowRightLeft className="w-4 h-4 text-[#D4A373]" />
              {isSubmitting || stockOutMutation.isPending ? 'Memproses Pengeluaran FEFO...' : 'Proses Pengeluaran FEFO'}
            </button>
          </form>
        </div>
      </div>

      {/* Success Alert Modal (Notification) */}
      <ConfirmModal
        isOpen={successAlertMsg !== null}
        onClose={() => setSuccessAlertMsg(null)}
        title="Pengeluaran Berhasil!"
        message={successAlertMsg || ''}
        type="success"
      />
    </div>
  )
}
