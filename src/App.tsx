import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { AppShell } from './components/layout/AppShell'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { LoginPage } from './routes/LoginPage'

// Admin Pages
import { AdminDashboardPage } from './routes/admin/DashboardPage'
import { AdminBatchesPage } from './routes/admin/BatchesPage'
import { AdminStockOutPage } from './routes/admin/StockOutPage'
import { AdminHistoryPage } from './routes/admin/HistoryPage'

// Public Pages
import { PublicDashboardPage } from './routes/public/DashboardPage'
import { PublicHistoryPage } from './routes/public/HistoryPage'

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
            
            {/* Rute Publik (Read Only, Tanpa Login) */}
            <Route path="/" element={<PublicDashboardPage />} />
            <Route path="/riwayat" element={<PublicHistoryPage />} />
            
            {/* Rute Admin yang diproteksi Auth Guard */}
            <Route path="/admin" element={<ProtectedRoute />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="batches" element={<AdminBatchesPage />} />
              <Route path="stock-out" element={<AdminStockOutPage />} />
              <Route path="history" element={<AdminHistoryPage />} />
            </Route>
            
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
