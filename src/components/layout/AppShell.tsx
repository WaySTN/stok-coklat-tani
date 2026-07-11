import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="w-full max-w-md mx-auto min-h-screen shadow-sm bg-surface relative">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
