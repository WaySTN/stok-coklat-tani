import { NavLink, useLocation } from 'react-router-dom'
import { Home, PackagePlus, PackageMinus, History, Boxes, ClipboardList } from 'lucide-react'

const BRAND = '#4A2C2A'
const MUTED = '#8A7968'

export function BottomNav() {
  const location = useLocation()
  const isAdminArea = location.pathname.startsWith('/admin')

  const publicLinks = [
    { to: '/', icon: Home, label: 'Beranda', exact: true },
    { to: '/stok', icon: Boxes, label: 'Stok', exact: false },
    { to: '/riwayat', icon: History, label: 'Riwayat', exact: false },
  ]

  const adminLinks = [
    { to: '/admin', icon: Home, label: 'Dashboard', exact: true },
    { to: '/admin/batches', icon: PackagePlus, label: 'Stok Masuk', exact: false },
    { to: '/admin/stock-out', icon: PackageMinus, label: 'Stok Keluar', exact: false },
    { to: '/admin/orders', icon: ClipboardList, label: 'Pre-Order', exact: false },
    { to: '/admin/history', icon: History, label: 'Riwayat', exact: false },
  ]

  const links = isAdminArea ? adminLinks : publicLinks

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid rgba(229,231,235,0.6)',
        boxShadow: '0 -4px 20px rgba(74,44,42,0.06)',
      }}
    >
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = link.exact
            ? location.pathname === link.to
            : location.pathname.startsWith(link.to)

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className="flex flex-col items-center justify-center w-full h-full space-y-1 transition-all"
              style={{ color: isActive ? BRAND : MUTED }}
            >
              <div
                className="flex items-center justify-center w-12 h-8 rounded-full transition-colors"
                style={{ backgroundColor: isActive ? 'rgba(74,44,42,0.1)' : 'transparent' }}
              >
                <Icon
                  className="w-5 h-5 transition-transform"
                  style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)' }}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span className="text-[10px]" style={{ fontWeight: isActive ? 700 : 500 }}>
                {link.label}
              </span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
