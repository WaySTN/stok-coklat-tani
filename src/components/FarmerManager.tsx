import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { X, PlusCircle, Pencil, Trash2, Users, Phone, Check, Loader2 } from 'lucide-react'
import { ConfirmModal } from './ConfirmModal'

interface FarmerManagerProps {
  isOpen: boolean
  onClose: () => void
  onSelectFarmer?: (farmerName: string) => void
}

interface Farmer {
  id: string
  nama: string
  no_hp: string | null
  created_at: string
}

export function FarmerManager({ isOpen, onClose, onSelectFarmer }: FarmerManagerProps) {
  const queryClient = useQueryClient()

  // State: Mode (list / add / edit)
  const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list')
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null)

  // Form inputs
  const [inputName, setInputName] = useState('')
  const [inputPhone, setInputPhone] = useState('')

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Farmer | null>(null)

  // Success/Error alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Fetch all farmers
  const { data: farmers, isLoading } = useQuery({
    queryKey: ['farmers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farmers')
        .select('*')
        .order('nama', { ascending: true })
      if (error) throw error
      return data as Farmer[]
    },
    enabled: isOpen,
  })

  // Add farmer mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      const nameClean = inputName.trim()
      if (!nameClean) throw new Error('Nama anggota tani wajib diisi')
      const { error } = await supabase
        .from('farmers')
        .insert([{ nama: nameClean, no_hp: inputPhone.trim() || null }])
      if (error) {
        if (error.code === '23505') throw new Error('Nama anggota tani sudah terdaftar!')
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers'] })
      setSuccessMsg(`"${inputName.trim()}" berhasil ditambahkan!`)
      resetForm()
      setMode('list')
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Gagal menambahkan anggota tani.')
    },
  })

  // Edit farmer mutation
  const editMutation = useMutation({
    mutationFn: async () => {
      if (!editingFarmer) return
      const nameClean = inputName.trim()
      if (!nameClean) throw new Error('Nama anggota tani wajib diisi')
      const { error } = await supabase
        .from('farmers')
        .update({ nama: nameClean, no_hp: inputPhone.trim() || null })
        .eq('id', editingFarmer.id)
      if (error) {
        if (error.code === '23505') throw new Error('Nama anggota tani sudah digunakan!')
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers'] })
      setSuccessMsg(`Data anggota tani berhasil diperbarui!`)
      resetForm()
      setMode('list')
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Gagal memperbarui data.')
    },
  })

  // Delete farmer mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('farmers')
        .delete()
        .eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmers'] })
      setSuccessMsg('Anggota tani berhasil dihapus dari daftar.')
      setDeleteTarget(null)
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Gagal menghapus data.')
      setDeleteTarget(null)
    },
  })

  const resetForm = () => {
    setInputName('')
    setInputPhone('')
    setEditingFarmer(null)
    setErrorMsg(null)
  }

  const startAdd = () => {
    resetForm()
    setMode('add')
  }

  const startEdit = (farmer: Farmer) => {
    setEditingFarmer(farmer)
    setInputName(farmer.nama)
    setInputPhone(farmer.no_hp || '')
    setErrorMsg(null)
    setMode('edit')
  }

  const handleSave = () => {
    setErrorMsg(null)
    if (mode === 'add') {
      addMutation.mutate()
    } else if (mode === 'edit') {
      editMutation.mutate()
    }
  }

  const handleClose = () => {
    resetForm()
    setMode('list')
    onClose()
  }

  if (!isOpen) return null

  const isSaving = addMutation.isPending || editMutation.isPending

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div
          className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden border flex flex-col max-h-[85vh] animate-fade-in-up"
          style={{ borderColor: '#EFECE6' }}
        >
          {/* Header */}
          <div className="p-5 border-b border-[#EFECE6] flex justify-between items-center bg-[#FAF7F2]">
            <div className="flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-[#4A2C2A]" />
              <h2 className="font-bold text-[#4A2C2A] text-base font-serif">
                {mode === 'list' ? 'Anggota Kelompok Tani' : mode === 'add' ? 'Tambah Anggota Baru' : 'Edit Data Anggota'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-red-500 hover:bg-neutral-100 p-1.5 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {mode === 'list' ? (
              /* ===== LIST MODE ===== */
              <div className="p-5 space-y-3">
                {/* Add Button */}
                <button
                  onClick={startAdd}
                  className="w-full p-3 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all duration-300 cursor-pointer hover:bg-[#4A2C2A]/5"
                  style={{ borderColor: '#D4A373', color: '#4A2C2A' }}
                >
                  <PlusCircle className="w-4 h-4 text-[#D4A373]" />
                  <span>Tambah Anggota Baru</span>
                </button>

                {/* Loading State */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 text-neutral-400 animate-spin" />
                    <span className="ml-2 text-xs text-neutral-400">Memuat data...</span>
                  </div>
                ) : farmers?.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs text-neutral-400">Belum ada anggota terdaftar.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {farmers?.map((farmer, index) => (
                      <div
                        key={farmer.id}
                        className="animate-fade-in-up p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition-all duration-300 hover:shadow-sm hover:border-neutral-300 group"
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#EFECE6',
                          animationDelay: `${index * 30}ms`,
                        }}
                      >
                        {/* Info */}
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => {
                            if (onSelectFarmer) {
                              onSelectFarmer(farmer.nama)
                              handleClose()
                            }
                          }}
                        >
                          <h4 className="text-sm font-bold text-[#2E2015] truncate">
                            {farmer.nama}
                          </h4>
                          {farmer.no_hp ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-neutral-400" />
                              <span className="text-[10px] text-neutral-500 font-medium">
                                {farmer.no_hp}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] italic text-neutral-300 mt-0.5 block">
                              No. HP belum diisi
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(farmer)}
                            className="p-2 rounded-xl text-neutral-400 hover:text-[#4A2C2A] hover:bg-[#4A2C2A]/5 transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(farmer)}
                            className="p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-500/5 transition-all cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Counter */}
                {farmers && farmers.length > 0 && (
                  <p className="text-[10px] text-center text-neutral-400 font-medium pt-2">
                    Total: {farmers.length} anggota terdaftar
                  </p>
                )}
              </div>
            ) : (
              /* ===== ADD / EDIT FORM MODE ===== */
              <div className="p-5 space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-500/6 border border-red-500/15 text-red-600 text-xs font-semibold rounded-2xl flex gap-2">
                    <span>⚠️</span>
                    <p>{errorMsg}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#2E2015] tracking-wide">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="Contoh: Bpk. Wagimin"
                    className="w-full text-sm px-3.5 py-2.5 rounded-2xl border transition-all duration-300 outline-none"
                    style={{ backgroundColor: '#FAF7F2', borderColor: '#EFECE6' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#4A2C2A'
                      e.target.style.boxShadow = '0 0 0 3px rgba(74, 44, 42, 0.08)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#EFECE6'
                      e.target.style.boxShadow = 'none'
                    }}
                    autoFocus
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-[#2E2015] tracking-wide">
                    No. Handphone (Opsional)
                  </label>
                  <input
                    type="text"
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    className="w-full text-sm px-3.5 py-2.5 rounded-2xl border transition-all duration-300 outline-none"
                    style={{ backgroundColor: '#FAF7F2', borderColor: '#EFECE6' }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#4A2C2A'
                      e.target.style.boxShadow = '0 0 0 3px rgba(74, 44, 42, 0.08)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#EFECE6'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer (only for add/edit modes) */}
          {mode !== 'list' && (
            <div className="p-4 border-t border-[#EFECE6] bg-[#FAF7F2] flex justify-end gap-2">
              <button
                onClick={() => { resetForm(); setMode('list') }}
                className="px-4 py-2 text-xs font-bold text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer"
              >
                Kembali
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !inputName.trim()}
                className="px-5 py-2 text-xs font-extrabold uppercase text-white rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
                style={{ backgroundColor: mode === 'edit' ? '#4A2C2A' : '#3B5D3A' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{mode === 'edit' ? 'Simpan Perubahan' : 'Daftarkan'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
        title="Hapus Anggota Tani?"
        message={`"${deleteTarget?.nama}" akan dihapus dari daftar anggota kelompok tani. Aksi ini tidak bisa dibatalkan.`}
        type="danger"
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />

      {/* Success Alert */}
      <ConfirmModal
        isOpen={successMsg !== null}
        onClose={() => setSuccessMsg(null)}
        title="Berhasil!"
        message={successMsg || ''}
        type="success"
      />
    </>
  )
}
