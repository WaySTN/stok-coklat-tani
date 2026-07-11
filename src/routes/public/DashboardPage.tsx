import { useNavigate } from 'react-router-dom'

export function PublicDashboardPage() {
  const navigate = useNavigate()

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Stok Coklat Tani</h1>
      <p>Dashboard Publik (Tanpa Login)</p>
      
      <button 
        onClick={() => navigate('/login')}
        className="mt-8 text-sm text-primary underline"
      >
        Login Admin
      </button>
    </div>
  )
}
