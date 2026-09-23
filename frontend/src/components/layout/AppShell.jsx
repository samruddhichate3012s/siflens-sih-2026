import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { X } from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import Header from './Header.jsx'

export default function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0">
            <div className="relative h-full">
              <Sidebar variant="drawer" onNavigate={() => setDrawerOpen(false)} />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="absolute top-3 -right-11 flex h-8 w-8 items-center justify-center rounded-md bg-sidebar text-sidebar-text hover:text-sidebar-textActive"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <Header onOpenMenu={() => setDrawerOpen(true)} />

      <main className="md:pl-64">
        <div className="max-w-[1600px] mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
