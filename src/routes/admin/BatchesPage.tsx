import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, X } from 'lucide-react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Validasi Form
const batchSchema = z.object({
  kode_batch: z.string().min(1, 'Kode batch wajib diisi'),
  jenis_coklat: z.enum(['Fermentasi', 'Non-Fermentasi']),
  jumlah_masuk: z.number().min(0.1, 'Jumlah minimal 0.1 Kg'),
  tanggal_masuk: z.string().min(1, 'Tanggal masuk wajib diisi'),
  tanggal_expired: z.string().min(1, 'Tanggal expired wajib diisi'),
  asal_petani: z.string().optional(),
  catatan: z.string().optional(),
})

type BatchForm = z.infer<typeof batchSchema>

export function AdminBatchesPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BatchForm>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      jenis_coklat: 'Fermentasi',
    }
  })

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
      // otomatis set jumlah_sisa = jumlah_masuk saat awal
      const { error } = await supabase.from('batches').insert([{
        ...newData,
        jumlah_sisa: newData.jumlah_masuk,
      }])
      if (error) {
        if (error.code === '23505') throw new Error('Kode Batch sudah terdaftar!')
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      setIsModalOpen(false)
      reset()
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
    },
  })

  const onSubmit = (data: BatchForm) => {
    addMutation.mutate(data)
  }

  // Set Expired 1 Tahun Otomatis saat Tanggal Masuk diisi
  const handleTanggalMasukChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val) {
      const date = new Date(val)
      date.setFullYear(date.getFullYear() + 1)
      setValue('tanggal_expired', date.toISOString().split('T')[0])
    }
  }

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-primary">Stok Masuk</h1>
          <p className="text-sm text-text-muted">Kelola data batch coklat</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white p-2 rounded-lg flex items-center gap-2 text-sm shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-text-muted mt-10 animate-pulse">Memuat data...</p>
      ) : batches?.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-border">
          <p className="text-text-muted">Belum ada stok coklat.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {batches?.map((batch) => (
            <div key={batch.id} className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-text-primary">{batch.kode_batch}</h3>
                  <span className={`inline-block px-2 py-1 text-[10px] font-medium rounded-full mt-1 ${
                    batch.jenis_coklat === 'Fermentasi' ? 'bg-secondary/10 text-secondary' : 'bg-warning/10 text-warning'
                  }`}>
                    {batch.jenis_coklat}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-text-muted">Sisa Stok</p>
                  <p className="text-lg font-bold text-primary">{batch.jumlah_sisa} <span className="text-xs font-normal">Kg</span></p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-text-muted bg-background p-2 rounded-lg">
                <p>Masuk: <span className="text-text-primary font-medium">{new Date(batch.tanggal_masuk).toLocaleDateString('id-ID')}</span></p>
                <p>Exp: <span className="text-text-primary font-medium">{new Date(batch.tanggal_expired).toLocaleDateString('id-ID')}</span></p>
                {batch.asal_petani && <p className="col-span-2">Petani: <span className="text-text-primary font-medium">{batch.asal_petani}</span></p>}
              </div>

              <div className="flex justify-end pt-2 border-t border-border mt-1">
                <button
                  onClick={() => {
                    if(confirm('Yakin ingin menghapus batch ini?')) deleteMutation.mutate(batch.id)
                  }}
                  disabled={deleteMutation.isPending}
                  className="text-danger hover:bg-danger/10 p-1.5 rounded-md transition-colors"
                  title="Hapus (Soft Delete)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Batch */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-border flex justify-between items-center bg-background/50">
              <h2 className="font-bold text-primary">Tambah Stok Masuk</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-danger">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto">
              {addMutation.isError && (
                <div className="mb-4 p-2 bg-danger/10 text-danger text-xs rounded-lg border border-danger/20">
                  {addMutation.error?.message || 'Gagal menyimpan data.'}
                </div>
              )}
              <form id="add-batch-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Kode Batch</label>
                  <input {...register('kode_batch')} className="w-full text-sm px-3 py-2 rounded-lg border border-border focus:ring-1 focus:ring-primary outline-none" placeholder="Contoh: BATCH-001" />
                  {errors.kode_batch && <p className="text-danger text-[10px] mt-1">{errors.kode_batch.message}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Jenis Coklat</label>
                  <select {...register('jenis_coklat')} className="w-full text-sm px-3 py-2 rounded-lg border border-border focus:ring-1 focus:ring-primary outline-none bg-white">
                    <option value="Fermentasi">Fermentasi</option>
                    <option value="Non-Fermentasi">Non-Fermentasi</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Jumlah Masuk (Kg)</label>
                  <input type="number" step="0.1" {...register('jumlah_masuk', { valueAsNumber: true })} className="w-full text-sm px-3 py-2 rounded-lg border border-border focus:ring-1 focus:ring-primary outline-none" placeholder="0" />
                  {errors.jumlah_masuk && <p className="text-danger text-[10px] mt-1">{errors.jumlah_masuk.message}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Tgl Masuk</label>
                    <input type="date" {...register('tanggal_masuk')} onChange={handleTanggalMasukChange} className="w-full text-sm px-3 py-2 rounded-lg border border-border focus:ring-1 focus:ring-primary outline-none" />
                    {errors.tanggal_masuk && <p className="text-danger text-[10px] mt-1">{errors.tanggal_masuk.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-primary mb-1">Tgl Expired</label>
                    <input type="date" {...register('tanggal_expired')} className="w-full text-sm px-3 py-2 rounded-lg border border-border focus:ring-1 focus:ring-primary outline-none" />
                    {errors.tanggal_expired && <p className="text-danger text-[10px] mt-1">{errors.tanggal_expired.message}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Asal Petani (Opsional)</label>
                  <input {...register('asal_petani')} className="w-full text-sm px-3 py-2 rounded-lg border border-border focus:ring-1 focus:ring-primary outline-none" placeholder="Nama petani/daerah" />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-text-primary mb-1">Catatan (Opsional)</label>
                  <textarea {...register('catatan')} className="w-full text-sm px-3 py-2 rounded-lg border border-border focus:ring-1 focus:ring-primary outline-none" rows={2} placeholder="Kondisi dll"></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-border bg-background/50 flex justify-end gap-2 mt-auto">
              <button 
                onClick={() => setIsModalOpen(false)}
                type="button" 
                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
              >
                Batal
              </button>
              <button 
                form="add-batch-form"
                type="submit" 
                disabled={isSubmitting || addMutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-70"
              >
                {isSubmitting || addMutation.isPending ? 'Menyimpan...' : 'Simpan Stok'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
