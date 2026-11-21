import { useCallback,useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'

export function HospitalShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const closeMenu=useCallback(()=>setMobileOpen(false),[])
  return (
    <div className="flex min-h-svh bg-bg lg:mx-auto lg:max-w-[1440px]">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={closeMenu} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar mobileOpen={mobileOpen} onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
