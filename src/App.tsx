import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { LoginPage } from './routes/LoginPage'
import { AdminDashboardPage } from './routes/admin/DashboardPage'
import { PublicDashboardPage } from './routes/public/DashboardPage'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Rute tanpa AppShell khusus untuk Login */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Rute dengan AppShell (ada BottomNav nantinya) */}
          <Route element={<AppShell />}>
            {/* Rute Publik */}
            <Route path="/" element={<PublicDashboardPage />} />
            
            {/* Rute Admin yang diproteksi Auth Guard */}
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route index element={<AdminDashboardPage />} />
              {/* Tambahkan rute admin lainnya di sini */}
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
