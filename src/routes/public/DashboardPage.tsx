import { useNavigate } from 'react-router-dom'
import { StockSummary } from '../../components/StockSummary'

export function PublicDashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-primary">Stok Coklat Tani</h1>
          <p className="text-sm text-text-muted">Dashboard Publik</p>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="text-[10px] sm:text-xs text-primary font-medium underline"
        >
          Login Admin
        </button>
      </div>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-text-primary mb-3">Total Persediaan Saat Ini</h2>
        <StockSummary />
      </div>

      <div className="bg-white p-5 rounded-xl border border-border shadow-sm text-center">
        <p className="text-sm text-text-muted">
          Aplikasi ini memonitor persediaan coklat masuk dan keluar secara real-time. 
          Gunakan menu di bawah untuk melihat riwayat stok keluar.
        </p>
      </div>
    </div>
  )
}
