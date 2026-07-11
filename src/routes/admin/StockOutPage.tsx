import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PackageMinus, CheckCircle2 } from 'lucide-react'

const stockOutSchema = z.object({
  p_jenis_coklat: z.enum(['Fermentasi', 'Non-Fermentasi']),
  p_jumlah_dibutuhkan: z.number().min(0.1, 'Jumlah minimal 0.1 Kg'),
  p_tanggal_keluar: z.string().min(1, 'Tanggal keluar wajib diisi'),
  p_keterangan: z.string().optional(),
})

type StockOutForm = z.infer<typeof stockOutSchema>

export function AdminStockOutPage() {
  const queryClient = useQueryClient()
  const [successMsg, setSuccessMsg] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StockOutForm>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: {
      p_jenis_coklat: 'Fermentasi',
      p_tanggal_keluar: new Date().toISOString().split('T')[0],
      p_keterangan: '',
    }
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
      setSuccessMsg(`Berhasil mengeluarkan ${variables.p_jumlah_dibutuhkan} Kg coklat ${variables.p_jenis_coklat}.`)
      reset()
      
      // Hilangkan pesan sukses setelah 5 detik
      setTimeout(() => setSuccessMsg(''), 5000)
    },
  })

  const onSubmit = (data: StockOutForm) => {
    setSuccessMsg('')
    stockOutMutation.mutate(data)
  }

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-primary">Stok Keluar (FEFO)</h1>
        <p className="text-sm text-text-muted mt-1">
          Keluarkan stok coklat. Sistem akan otomatis memotong dari batch yang paling mendekati kadaluarsa (FEFO).
        </p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
        
        {successMsg && (
          <div className="mb-5 p-3 bg-secondary/10 text-secondary text-sm rounded-lg border border-secondary/20 flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {stockOutMutation.isError && (
          <div className="mb-5 p-3 bg-danger/10 text-danger text-sm rounded-lg border border-danger/20">
            <strong>Gagal: </strong>
            {stockOutMutation.error?.message === 'Stok tidak mencukupi' 
              ? 'Total stok aktif untuk jenis coklat ini tidak mencukupi permintaan.' 
              : stockOutMutation.error?.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Jenis Coklat</label>
            <select 
              {...register('p_jenis_coklat')} 
              className="w-full text-sm px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/50 outline-none bg-white"
            >
              <option value="Fermentasi">Fermentasi</option>
              <option value="Non-Fermentasi">Non-Fermentasi</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Jumlah Keluar (Kg)</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1" 
                {...register('p_jumlah_dibutuhkan', { valueAsNumber: true })} 
                className="w-full text-sm pl-4 pr-12 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/50 outline-none" 
                placeholder="Contoh: 15.5" 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted text-sm">Kg</span>
            </div>
            {errors.p_jumlah_dibutuhkan && <p className="text-danger text-xs mt-1">{errors.p_jumlah_dibutuhkan.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Tanggal Keluar</label>
            <input 
              type="date" 
              {...register('p_tanggal_keluar')} 
              className="w-full text-sm px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/50 outline-none" 
            />
            {errors.p_tanggal_keluar && <p className="text-danger text-xs mt-1">{errors.p_tanggal_keluar.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">Keterangan / Tujuan (Opsional)</label>
            <textarea 
              {...register('p_keterangan')} 
              className="w-full text-sm px-4 py-2.5 rounded-lg border border-border focus:ring-2 focus:ring-primary/50 outline-none" 
              rows={3} 
              placeholder="Dikirim ke pabrik A, diambil pembeli, dll."
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || stockOutMutation.isPending}
            className="w-full mt-4 bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-70 shadow-sm"
          >
            <PackageMinus className="w-5 h-5" />
            {isSubmitting || stockOutMutation.isPending ? 'Memproses FEFO...' : 'Proses Pengeluaran Stok'}
          </button>
        </form>
      </div>
    </div>
  )
}
