import { supabase } from '../../lib/supabase'
import { StockSummary } from '../../components/StockSummary'
import { LogOut } from 'lucide-react'

export function AdminDashboardPage() {
  const handleLogout = async () => {
    if (confirm('Yakin ingin keluar?')) {
      await supabase.auth.signOut()
    }
  }

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-primary">Dashboard Admin</h1>
          <p className="text-sm text-text-muted">Selamat datang kembali!</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/10 text-danger rounded-lg hover:bg-danger hover:text-white transition-colors text-xs font-medium"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Ringkasan Persediaan Stok</h2>
        <StockSummary />
      </div>
      
      <div className="bg-white p-5 rounded-xl border border-border shadow-sm">
        <h3 className="font-bold text-text-primary mb-2">Panduan Cepat</h3>
        <ul className="text-sm text-text-muted space-y-2 list-disc list-inside">
          <li>Gunakan <strong>Stok Masuk</strong> untuk mencatat batch coklat yang baru datang.</li>
          <li>Gunakan <strong>Stok Keluar</strong> untuk mengurangi stok. Sistem otomatis memotong stok yang usianya paling tua (FEFO).</li>
          <li>Gunakan <strong>Riwayat</strong> untuk melihat catatan pengeluaran stok.</li>
        </ul>
      </div>
    </div>
  )
}
