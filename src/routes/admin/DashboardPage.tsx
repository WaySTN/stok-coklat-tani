import { supabase } from '../../lib/supabase'

export function AdminDashboardPage() {
  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p>Selamat datang, Admin!</p>
      <button 
        onClick={handleLogout}
        className="mt-4 px-4 py-2 bg-danger text-white rounded-lg hover:bg-danger/90"
      >
        Logout
      </button>
    </div>
  )
}
