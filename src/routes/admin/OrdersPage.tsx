import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { 
  ClipboardList, Plus, X, Sparkles, 
  ArrowRightLeft, CheckCircle2, ShoppingBag, MapPin, RotateCcw 
} from 'lucide-react'
import { ConfirmModal } from '../../components/ConfirmModal'

// Pre-Order Creation Schema
const orderSchema = z.object({
  nama_pembeli: z.string().min(1, 'Nama pembeli wajib diisi'),
  jenis_coklat: z.enum(['Fermentasi', 'Non-Fermentasi']),
  jumlah_pesanan: z.number().min(0.1, 'Jumlah pesanan minimal 0.1 Kg'),
  tanggal_pesan: z.string().min(1, 'Tanggal pesan wajib diisi'),
})

type OrderForm = z.infer<typeof orderSchema>

export function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [successAlertMsg, setSuccessAlertMsg] = useState<string | null>(null)

  // Allocation Modal States
  const [allocatingOrder, setAllocatingOrder] = useState<any | null>(null)
  const [allocationInputs, setAllocationInputs] = useState<Record<string, number>>({})
  const [allocationError, setAllocationError] = useState<string | null>(null)

  // Cancel Allocation Modal State
  const [cancelOrderTarget, setCancelOrderTarget] = useState<any | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrderForm>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      jenis_coklat: 'Fermentasi',
      tanggal_pesan: new Date().toISOString().split('T')[0],
    }
  })

  const watchJenisCoklat = watch('jenis_coklat')

  // Fetch Orders
  const { data: orders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          stock_out (
            id,
            batch_id,
            jumlah_keluar,
            batches (
              kode_batch
            )
          )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  })

  // Fetch Active Batches for Allocation Modal
  const { data: activeBatches } = useQuery({
    queryKey: ['allocation-batches', allocatingOrder?.jenis_coklat],
    enabled: !!allocatingOrder,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('jenis_coklat', allocatingOrder?.jenis_coklat)
        .eq('is_deleted', false)
        .gt('jumlah_sisa', 0)
        .order('tanggal_expired', { ascending: true }) // FEFO
        .order('tanggal_masuk', { ascending: true }) // Tie-breaker
      if (error) throw error
      return data
    }
  })

  // Mutation to Add Order
  const addOrderMutation = useMutation({
    mutationFn: async (newData: OrderForm) => {
      const { error } = await supabase.from('orders').insert([newData])
      if (error) throw new Error(error.message)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      setIsModalOpen(false)
      reset()
      setSuccessAlertMsg(`Pre-Order untuk ${variables.nama_pembeli} sebesar ${variables.jumlah_pesanan} Kg berhasil dicatat!`)
    }
  })

  // Mutation to Process Stock Allocation (Fulfill Order)
  const fulfillOrderMutation = useMutation({
    mutationFn: async (payload: { order: any, allocations: Record<string, number> }) => {
      const { order, allocations } = payload
      
      // We will perform updates batch by batch
      // 1. Get logged-in user id
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id || null

      for (const [batchId, qty] of Object.entries(allocations)) {
        if (qty <= 0) continue

        // A. Reduce batch remaining stock
        // To be safe, we retrieve current amount first to verify
        const { data: batchData, error: fetchErr } = await supabase
          .from('batches')
          .select('jumlah_sisa, kode_batch')
          .eq('id', batchId)
          .single()
        
        if (fetchErr) throw new Error(`Gagal membaca data batch: ${fetchErr.message}`)
        if (Number(batchData.jumlah_sisa) < qty) {
          throw new Error(`Stok batch ${batchData.kode_batch} tidak mencukupi!`)
        }

        const newSisa = Number(batchData.jumlah_sisa) - qty
        const { error: updateErr } = await supabase
          .from('batches')
          .update({ jumlah_sisa: newSisa, updated_at: new Date().toISOString() })
          .eq('id', batchId)
        
        if (updateErr) throw new Error(`Gagal memotong stok batch: ${updateErr.message}`)

        // B. Log to stock_out table
        const { error: insertErr } = await supabase
          .from('stock_out')
          .insert([{
            batch_id: batchId,
            jumlah_keluar: qty,
            tanggal_keluar: new Date().toISOString().split('T')[0],
            keterangan: `Pengeluaran pesanan Pre-Order - ${order.nama_pembeli}`,
            order_id: order.id,
            created_by: userId
          }])
        
        if (insertErr) throw new Error(`Gagal menyimpan catatan pengeluaran: ${insertErr.message}`)
      }

      // 2. Mark order as Selesai
      const { error: orderErr } = await supabase
        .from('orders')
        .update({ status: 'Selesai', updated_at: new Date().toISOString() })
        .eq('id', order.id)

      if (orderErr) throw new Error(`Gagal memperbarui status pesanan: ${orderErr.message}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] })
      queryClient.invalidateQueries({ queryKey: ['history'] })
      setSuccessAlertMsg(`Stok berhasil dialokasikan dan pesanan telah selesai diproses!`)
      setAllocatingOrder(null)
      setAllocationInputs({})
      setAllocationError(null)
    },
    onError: (err: any) => {
      setAllocationError(err.message || 'Terjadi kesalahan sistem saat pemrosesan.')
    }
  })

  // Mutation to Cancel Stock Allocation (Rollback to Batches & Status back to Pending)
  const cancelAllocationMutation = useMutation({
    mutationFn: async (order: any) => {
      // 1. Fetch all stock_out records linked to this order
      const { data: stockOutItems, error: soErr } = await supabase
        .from('stock_out')
        .select('id, batch_id, jumlah_keluar')
        .eq('order_id', order.id)

      if (soErr) throw new Error(`Gagal membaca catatan pengeluaran stok: ${soErr.message}`)

      // 2. Return the stock amounts back to their respective batches
      if (stockOutItems && stockOutItems.length > 0) {
        for (const item of stockOutItems) {
          const { data: batchData, error: batchErr } = await supabase
            .from('batches')
            .select('jumlah_sisa, kode_batch')
            .eq('id', item.batch_id)
            .single()

          if (!batchErr && batchData) {
            const restoredSisa = Number((Number(batchData.jumlah_sisa) + Number(item.jumlah_keluar)).toFixed(2))
            const { error: updateErr } = await supabase
              .from('batches')
              .update({
                jumlah_sisa: restoredSisa,
                updated_at: new Date().toISOString()
              })
              .eq('id', item.batch_id)

            if (updateErr) {
              throw new Error(`Gagal mengembalikan stok ke batch ${batchData.kode_batch}: ${updateErr.message}`)
            }
          }
        }

        // 3. Delete the stock_out records for this order
        const { error: delErr } = await supabase
          .from('stock_out')
          .delete()
          .eq('order_id', order.id)

        if (delErr) {
          throw new Error(`Gagal menghapus log pengeluaran stok: ${delErr.message}`)
        }
      }

      // 4. Update order status back to 'Pending'
      const { error: orderErr } = await supabase
        .from('orders')
        .update({
          status: 'Pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (orderErr) {
        throw new Error(`Gagal memperbarui status pesanan: ${orderErr.message}`)
      }
    },
    onSuccess: (_, order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['batches'] })
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] })
      queryClient.invalidateQueries({ queryKey: ['history'] })
      setSuccessAlertMsg(`Alokasi stok untuk ${order.nama_pembeli} berhasil dibatalkan. Stok telah dikembalikan ke gudang!`)
      setCancelOrderTarget(null)
    },
    onError: (err: any) => {
      setCancelOrderTarget(null)
      alert(err.message || 'Terjadi kesalahan saat membatalkan alokasi stok.')
    }
  })

  const onSubmit = (data: OrderForm) => {
    addOrderMutation.mutate(data)
  }

  // Auto Allocate FEFO Handler
  const handleAutoAllocate = () => {
    if (!activeBatches || !allocatingOrder) return
    
    let needed = allocatingOrder.jumlah_pesanan
    const newInputs: Record<string, number> = {}
    
    // Reset all inputs first
    activeBatches.forEach(b => {
      newInputs[b.id] = 0
    })

    // Allocate batch by batch in FEFO order
    for (const batch of activeBatches) {
      if (needed <= 0) break
      
      const sisa = Number(batch.jumlah_sisa)
      const allocated = Math.min(sisa, needed)
      newInputs[batch.id] = Number(allocated.toFixed(2))
      needed -= allocated
    }

    setAllocationInputs(newInputs)
    setAllocationError(null)
  }

  // Handle manual input change for allocation
  const handleAllocationChange = (batchId: string, val: string, max: number) => {
    const num = parseFloat(val) || 0
    const cleanNum = Math.max(0, Math.min(max, num))
    
    setAllocationInputs(prev => ({
      ...prev,
      [batchId]: cleanNum
    }))
    setAllocationError(null)
  }

  // Check sum validation before submit
  const handleConfirmAllocation = () => {
    if (!allocatingOrder) return

    const totalAllocated = Object.values(allocationInputs).reduce((sum, val) => sum + val, 0)
    const needed = allocatingOrder.jumlah_pesanan

    // Validate matching sum within floating point tolerance
    if (Math.abs(totalAllocated - needed) > 0.01) {
      setAllocationError(`Jumlah alokasi (${totalAllocated.toFixed(2)} Kg) harus tepat sama dengan jumlah pesanan (${needed} Kg)!`)
      return
    }

    // Call mutation
    fulfillOrderMutation.mutate({
      order: allocatingOrder,
      allocations: allocationInputs
    })
  }

  // Calculate sum currently input
  const currentTotalAllocated = Object.values(allocationInputs).reduce((sum, val) => sum + val, 0)

  return (
    <div className="pb-28 min-h-screen overflow-y-auto" style={{ backgroundColor: '#FAF7F2' }}>
      {/* Header Pre-Order */}
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
          <ClipboardList className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex justify-between items-center">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-serif font-black tracking-tight text-white">
              Pre-Order Coklat
            </h1>
            <p className="text-xs font-medium text-white/60 tracking-wide mt-0.5">
              Kelola pesanan pembeli & alokasi manual/otomatis
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
            <span className="text-xs font-extrabold uppercase tracking-wider">Tambah Pesanan</span>
          </button>
        </div>
      </div>

      {/* List content */}
      <div className="px-5 -mt-8 relative z-20">
        {isOrdersLoading ? (
          <div className="bg-white p-8 rounded-3xl border border-[#EFECE6] text-center shadow-md animate-pulse">
            <p style={{ color: '#8A7968' }} className="text-sm font-medium">Memuat daftar pesanan...</p>
          </div>
        ) : orders?.length === 0 ? (
          <div
            className="p-8 rounded-3xl flex flex-col items-center justify-center text-center shadow-md border bg-white"
            style={{ borderColor: '#EFECE6' }}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-[#FAF7F2]">
              <ClipboardList className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-serif font-bold mb-1" style={{ color: '#4A2C2A' }}>
              Belum Ada Pesanan
            </h3>
            <p className="text-xs max-w-[260px] leading-relaxed" style={{ color: '#8A7968' }}>
              Daftar pemesanan (Pre-Order) masih kosong. Tekan 'Tambah Pesanan' untuk mencatat pesanan baru.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders?.map((order) => (
              <div
                key={order.id}
                className="p-5 rounded-3xl flex flex-col gap-3.5 bg-white border relative overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md"
                style={{ borderColor: '#EFECE6' }}
              >
                {/* Left Indicator Line */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: order.jenis_coklat === 'Fermentasi' ? '#4A2C2A' : '#3B5D3A' }}
                ></div>

                {/* Header: Buyer Name + Status */}
                <div className="flex justify-between items-center pb-2 border-b border-[#FAF7F2]">
                  <div>
                    <h3 className="font-extrabold text-sm text-[#2E2015]">{order.nama_pembeli}</h3>
                    <span className="text-[10px] font-bold text-neutral-400 block mt-0.5">
                      Pemesanan: {new Date(order.tanggal_pesan).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider uppercase"
                    style={{
                      backgroundColor: order.status === 'Selesai' ? 'rgba(59,93,58,0.08)' : 'rgba(212,163,115,0.08)',
                      color: order.status === 'Selesai' ? '#3B5D3A' : '#D4A373'
                    }}
                  >
                    {order.status}
                  </span>
                </div>

                {/* Details */}
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Kategori</span>
                    <strong style={{ color: '#4A2C2A' }}>{order.jenis_coklat}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Volume Pesanan</span>
                    <strong className="text-base" style={{ color: '#2E2015' }}>
                      {order.jumlah_pesanan} <span className="text-[10px] font-normal text-neutral-500">Kg</span>
                    </strong>
                  </div>
                </div>

                {/* Breakdown Alokasi Batch jika Selesai */}
                {order.status === 'Selesai' && order.stock_out && order.stock_out.length > 0 && (
                  <div className="pt-3 border-t border-[#FAF7F2] space-y-1.5">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Diambil Dari Batch:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {order.stock_out.map((so: any) => (
                        <div 
                          key={so.id}
                          className="px-2.5 py-1 rounded-xl border border-neutral-100 text-[10px] font-bold flex items-center gap-1.5 bg-[#FAF7F2]"
                          style={{ color: '#4A2C2A' }}
                        >
                          <span>{so.batches?.kode_batch || 'Batch Terhapus'}</span>
                          <span className="text-neutral-300">|</span>
                          <span className="text-[#3B5D3A]">{so.jumlah_keluar} Kg</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action button if pending */}
                {order.status === 'Pending' && (
                  <div className="flex justify-end pt-3 border-t border-[#FAF7F2]">
                    <button
                      onClick={() => {
                        setAllocatingOrder(order)
                        setAllocationInputs({})
                        setAllocationError(null)
                      }}
                      className="px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider text-white rounded-xl shadow-sm transition-all duration-300 hover:scale-[1.01] cursor-pointer flex items-center gap-1"
                      style={{ backgroundColor: '#4A2C2A' }}
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-[#D4A373]" />
                      <span>Alokasi Stok</span>
                    </button>
                  </div>
                )}

                {/* Action button if selesai (Batalkan Alokasi) */}
                {order.status === 'Selesai' && (
                  <div className="flex justify-end pt-3 border-t border-[#FAF7F2]">
                    <button
                      onClick={() => setCancelOrderTarget(order)}
                      disabled={cancelAllocationMutation.isPending}
                      className="px-3.5 py-1.5 text-[10px] font-bold text-red-600/90 hover:text-red-700 hover:bg-red-500/10 rounded-xl border border-red-200/80 transition-all duration-200 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      title="Batalkan alokasi stok dan kembalikan ke gudang"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-red-500" />
                      <span>Batalkan Alokasi</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tambah Pre-Order */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden border flex flex-col max-h-[90vh] animate-fade-in-up" style={{ borderColor: '#EFECE6' }}>
            <div className="p-5 border-b border-[#EFECE6] flex justify-between items-center bg-[#FAF7F2]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#D4A373]" />
                <h2 className="font-bold text-[#4A2C2A] text-lg font-serif">Catat Pre-Order Baru</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-red-500 hover:bg-neutral-100 p-1.5 rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <form id="add-order-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2E2015] tracking-wide">Nama Pembeli / Perusahaan</label>
                  <input
                    {...register('nama_pembeli')}
                    placeholder="Contoh: PT. Cokelat Mulia"
                    className="w-full text-sm px-3.5 py-2.5 rounded-2xl border transition-all duration-300 outline-none bg-[#FAF7F2]"
                    style={{ borderColor: '#EFECE6' }}
                  />
                  {errors.nama_pembeli && <p className="text-red-600 text-[10px] font-semibold mt-1 pl-1">{errors.nama_pembeli.message}</p>}
                </div>

                {/* Jenis Coklat Segmented Switch */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2E2015] tracking-wide">Pilihan Tipe Coklat</label>
                  <div className="flex gap-2 p-1 rounded-2xl border bg-[#FAF7F2]" style={{ borderColor: '#EFECE6' }}>
                    <button
                      type="button"
                      onClick={() => setValue('jenis_coklat', 'Fermentasi')}
                      className="flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer"
                      style={{
                        backgroundColor: watchJenisCoklat === 'Fermentasi' ? '#4A2C2A' : 'transparent',
                        color: watchJenisCoklat === 'Fermentasi' ? '#FFFFFF' : '#8A7968',
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
                      }}
                    >
                      Mentah / Non-Ferm
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2E2015] tracking-wide">Jumlah Pesanan (Kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('jumlah_pesanan', { valueAsNumber: true })}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.0"
                    className="w-full text-sm px-3.5 py-2.5 rounded-2xl border transition-all duration-300 outline-none bg-[#FAF7F2]"
                    style={{ borderColor: '#EFECE6' }}
                  />
                  {errors.jumlah_pesanan && <p className="text-red-600 text-[10px] font-semibold mt-1 pl-1">{errors.jumlah_pesanan.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2E2015] tracking-wide">Tanggal Pesan</label>
                  <input
                    type="date"
                    {...register('tanggal_pesan')}
                    className="w-full text-sm px-3.5 py-2.5 rounded-2xl border transition-all duration-300 outline-none bg-[#FAF7F2]"
                    style={{ borderColor: '#EFECE6' }}
                  />
                  {errors.tanggal_pesan && <p className="text-red-600 text-[10px] font-semibold mt-1 pl-1">{errors.tanggal_pesan.message}</p>}
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-[#EFECE6] bg-[#FAF7F2] flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-xs font-bold text-neutral-500 hover:text-[#4A2C2A] rounded-2xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                form="add-order-form"
                type="submit"
                disabled={isSubmitting || addOrderMutation.isPending}
                className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white bg-[#4A2C2A] rounded-2xl shadow-md cursor-pointer hover:bg-[#6F4E37] transition-all"
              >
                Simpan Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alokasi Stok */}
      {allocatingOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border flex flex-col max-h-[90vh] animate-fade-in-up" style={{ borderColor: '#EFECE6' }}>
            <div className="p-5 border-b border-[#EFECE6] flex justify-between items-center bg-[#FAF7F2]">
              <div>
                <h2 className="font-bold text-[#4A2C2A] text-base font-serif">Alokasikan Stok Batch</h2>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Fulfill Order: <strong>{allocatingOrder.nama_pembeli}</strong> ({allocatingOrder.jumlah_pesanan} Kg {allocatingOrder.jenis_coklat})
                </p>
              </div>
              <button onClick={() => setAllocatingOrder(null)} className="text-neutral-400 hover:text-red-500 p-1.5 rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {allocationError && (
                <div className="p-3.5 bg-red-500/6 border border-red-500/15 text-red-600 text-xs font-bold rounded-2xl flex gap-2">
                  <span>⚠️</span>
                  <p>{allocationError}</p>
                </div>
              )}

              {/* Dynamic status info */}
              <div className="p-4 rounded-2xl border flex justify-between items-center text-xs bg-[#FAF7F2]" style={{ borderColor: '#EFECE6' }}>
                <div>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase block">Kebutuhan</span>
                  <span className="text-base font-extrabold text-[#4A2C2A]">{allocatingOrder.jumlah_pesanan} Kg</span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase block">Sudah Dialokasikan</span>
                  <span 
                    className="text-base font-extrabold transition-all duration-300"
                    style={{ color: Math.abs(currentTotalAllocated - allocatingOrder.jumlah_pesanan) < 0.01 ? '#3B5D3A' : '#D4A373' }}
                  >
                    {currentTotalAllocated.toFixed(2)} Kg
                  </span>
                </div>
              </div>

              {/* Autofill Suggesion trigger */}
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-[#2E2015]">Pilih Batch Yang Ingin Diambil:</span>
                <button
                  type="button"
                  onClick={handleAutoAllocate}
                  className="px-3 py-1.5 bg-[#4A2C2A]/5 hover:bg-[#4A2C2A]/10 text-[#4A2C2A] border border-[#4A2C2A]/10 text-[10px] font-extrabold uppercase rounded-xl flex items-center gap-1 cursor-pointer transition-all duration-300 hover:scale-[1.01]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
                  <span>Alokasi Otomatis (FEFO)</span>
                </button>
              </div>

              {/* Active Batches list inputs */}
              {!activeBatches || activeBatches.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400 border border-dashed rounded-2xl">
                  Tidak ada batch stok coklat {allocatingOrder.jenis_coklat} yang aktif di gudang.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeBatches.map((batch) => {
                    const allocatedVal = allocationInputs[batch.id] || 0
                    
                    return (
                      <div 
                        key={batch.id} 
                        className="p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-300 hover:border-neutral-300"
                        style={{ backgroundColor: '#FFFFFF', borderColor: '#EFECE6' }}
                      >
                        {/* Batch Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-neutral-800">{batch.kode_batch}</span>
                            <span className="text-[8px] font-bold text-neutral-400 uppercase px-1.5 py-0.5 rounded-md bg-neutral-100">
                              ED: {new Date(batch.tanggal_expired).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 text-[10px] text-neutral-500 mt-1">
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-[#D4A373]" /> {batch.lokasi_rak || '-'}
                            </span>
                            <span>Tersedia: <strong>{batch.jumlah_sisa} Kg</strong></span>
                          </div>
                        </div>

                        {/* Allocation Input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            max={batch.jumlah_sisa}
                            value={allocatedVal || ''}
                            onChange={(e) => handleAllocationChange(batch.id, e.target.value, batch.jumlah_sisa)}
                            onWheel={(e) => e.currentTarget.blur()}
                            placeholder="0"
                            className="w-20 text-center font-bold text-xs py-2 px-1 border rounded-xl outline-none transition-all duration-300"
                            style={{ 
                              backgroundColor: allocatedVal > 0 ? 'rgba(59,93,58,0.03)' : '#FAF7F2',
                              borderColor: allocatedVal > 0 ? '#3B5D3A' : '#EFECE6',
                              color: allocatedVal > 0 ? '#3B5D3A' : '#2E2015'
                            }}
                          />
                          <span className="text-[10px] font-bold text-neutral-400">Kg</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-[#EFECE6] bg-[#FAF7F2] flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAllocatingOrder(null)}
                className="px-5 py-2.5 text-xs font-bold text-neutral-500 hover:text-[#4A2C2A] rounded-2xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAllocation}
                disabled={fulfillOrderMutation.isPending || !activeBatches || activeBatches.length === 0}
                className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white bg-[#3B5D3A] rounded-2xl shadow-md cursor-pointer hover:bg-[#2F4B2E] transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-[#D4A373]" />
                {fulfillOrderMutation.isPending ? 'Memproses...' : 'Fulfill & Potong Stok'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Allocation Confirmation Modal */}
      <ConfirmModal
        isOpen={cancelOrderTarget !== null}
        onClose={() => setCancelOrderTarget(null)}
        onConfirm={() => {
          if (cancelOrderTarget) {
            cancelAllocationMutation.mutate(cancelOrderTarget)
          }
        }}
        title="Batalkan Alokasi Stok?"
        message={`Alokasi stok untuk pesanan "${cancelOrderTarget?.nama_pembeli}" (${cancelOrderTarget?.jumlah_pesanan} Kg) akan dibatalkan. Stok akan otomatis dikembalikan ke masing-masing batch asal dan status pesanan kembali menjadi "Pending".`}
        type="danger"
        confirmText="Ya, Batalkan Alokasi"
        cancelText="Batal"
      />

      {/* Success Alert Modal (Notification) */}
      <ConfirmModal
        isOpen={successAlertMsg !== null}
        onClose={() => setSuccessAlertMsg(null)}
        title="Operasi Berhasil!"
        message={successAlertMsg || ''}
        type="success"
      />
    </div>
  )
}
