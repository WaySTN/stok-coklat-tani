import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function ProtectedRoute() {
  const { session, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">Memeriksa sesi...</p>
      </div>
    )
  }

  // Jika tidak ada session (belum login), redirect ke /login
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Jika sudah login, render child routes (halaman Admin)
  return <Outlet />
}
