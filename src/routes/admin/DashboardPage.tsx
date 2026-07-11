import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { StockSummary } from '../../components/StockSummary'
import { LogOut, PackagePlus, PackageMinus, History, BookOpen, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ConfirmModal } from '../../components/ConfirmModal'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="pb-28 min-h-screen overflow-y-auto" style={{ backgroundColor: '#FAF7F2' }}>
      {/* Header Kakao Premium dengan Logout */}
      <div
        className="px-6 pt-10 pb-16 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #361E1C 0%, #1F0F0E 100%)',
          borderBottomLeftRadius: '48px',
          borderBottomRightRadius: '48px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-[0.03]" style={{ background: '#FFFFFF' }}></div>

        <div className="relative z-10 flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/10">
                Admin Mode
              </span>
            </div>
            <h1 className="text-3xl font-serif font-black tracking-tight text-white mt-1">
              Dashboard
            </h1>
            <p className="text-xs font-medium text-white/60 mt-0.5">
              Kelola persediaan & pengeluaran gudang
            </p>
          </div>

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl transition-all duration-300 backdrop-blur-md shadow-md cursor-pointer border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 text-white/95 text-xs font-bold"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Keluar</span>
          </button>
        </div>
      </div>

      {/* Ringkasan Persediaan Stok */}
      <div className="px-5 -mt-8 relative z-20">
        <StockSummary />
      </div>

      {/* Panduan Cepat & Pintasan Navigasi */}
      <div className="px-5 mt-8 space-y-4 animate-fade-in-up delay-200">
        <div className="flex items-center gap-2 px-1">
          <BookOpen className="w-4.5 h-4.5 text-[#4A2C2A]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#8A7968]">
            Alur Kerja & Pintasan
          </h2>
        </div>

        {/* Interactive Steps */}
        <div className="grid gap-3">
          {/* Langkah 1: Stok Masuk */}
          <div
            onClick={() => navigate('/admin/batches')}
            className="p-4 rounded-3xl border flex items-center justify-between cursor-pointer transition-all duration-300 hover:shadow-md hover:translate-x-1"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#EFECE6' }}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-500/10">
                <PackagePlus className="w-5 h-5 text-[#3B5D3A]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2E2015]">1. Catat Stok Masuk</h3>
                <p className="text-[11px] text-[#8A7968] mt-0.5">
                  Tambahkan batch biji coklat baru dari petani
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </div>

          {/* Langkah 2: Stok Keluar */}
          <div
            onClick={() => navigate('/admin/stock-out')}
            className="p-4 rounded-3xl border flex items-center justify-between cursor-pointer transition-all duration-300 hover:shadow-md hover:translate-x-1"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#EFECE6' }}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-red-500/10">
                <PackageMinus className="w-5 h-5 text-[#B03A2E]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2E2015]">2. Kurangi Stok Keluar</h3>
                <p className="text-[11px] text-[#8A7968] mt-0.5">
                  Ambil stok otomatis sesuai prinsip FEFO
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </div>

          {/* Langkah 3: Riwayat */}
          <div
            onClick={() => navigate('/admin/history')}
            className="p-4 rounded-3xl border flex items-center justify-between cursor-pointer transition-all duration-300 hover:shadow-md hover:translate-x-1"
            style={{ backgroundColor: '#FFFFFF', borderColor: '#EFECE6' }}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-[#4A2C2A]/10">
                <History className="w-5 h-5 text-[#4A2C2A]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2E2015]">3. Tinjau Buku Riwayat</h3>
                <p className="text-[11px] text-[#8A7968] mt-0.5">
                  Lihat rekam jejak keluar masuk secara detail
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </div>
        </div>
      </div>

      {/* Custom Reusable Confirm Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Keluar dari Sistem?"
        message="Anda perlu memasukkan email & kata sandi kembali untuk mengelola stok gudang."
        type="danger"
        confirmText="Ya, Keluar"
        cancelText="Batal"
      />
    </div>
  )
}
