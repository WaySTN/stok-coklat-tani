import { NavLink } from 'react-router-dom'
import { Home, PackagePlus, PackageMinus, History } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export function BottomNav() {
  const { session } = useAuth()
  const isAdmin = !!session

  // Definisi menu berdasarkan role
  type Menu = { name: string; path: string; icon: any; end?: boolean }
  
  const adminMenus: Menu[] = [
    { name: 'Dashboard', path: '/admin', icon: Home, end: true },
    { name: 'Stok Masuk', path: '/admin/batches', icon: PackagePlus },
    { name: 'Stok Keluar', path: '/admin/stock-out', icon: PackageMinus },
    { name: 'Riwayat', path: '/admin/history', icon: History },
  ]

  const userMenus: Menu[] = [
    { name: 'Dashboard', path: '/', icon: Home, end: true },
    { name: 'Riwayat', path: '/riwayat', icon: History },
  ]

  const menus = isAdmin ? adminMenus : userMenus

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-md mx-auto flex h-16">
        {menus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            end={menu.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center space-y-1 transition-colors ${
                isActive ? 'text-primary font-medium' : 'text-text-muted hover:text-primary/70'
              }`
            }
          >
            <menu.icon className="w-6 h-6" />
            <span className="text-[10px] sm:text-xs">{menu.name}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
