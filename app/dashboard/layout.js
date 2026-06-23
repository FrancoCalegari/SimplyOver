'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard/library', icon: 'library_books', label: 'My Library' },
  { href: '/dashboard/boards', icon: 'push_pin', label: 'My Boards' },
  { href: '/dashboard/favorites', icon: 'favorite', label: 'My Favorites' },
  { href: '/dashboard/studio', icon: 'palette', label: 'My Studio' },
  { href: '/dashboard/settings', icon: 'settings', label: 'Settings' },
]

export default function DashboardLayout({ children }) {
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen bg-background text-on-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[280px] bg-surface-container-low/80 backdrop-blur-xl border-r border-white/10 flex flex-col py-8 z-40">
        {/* User Profile Area */}
        <div className="px-6 mb-8">
          <Link href="/" className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg primary-gradient flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="text-white font-bold">SimplyOver</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full primary-gradient flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-white text-[20px]">person</span>
            </div>
            <div>
              <p className="text-white font-bold text-label-md leading-tight">My Account</p>
              <p className="text-on-surface-variant text-label-sm">@username</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map(({ href, icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all group ${
                  isActive
                    ? 'border-l-4 border-primary bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:bg-white/5 hover:text-primary'
                }`}
              >
                <span
                  className={`material-symbols-outlined transition-colors ${
                    isActive ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'
                  }`}
                  style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {icon}
                </span>
                <span className="text-label-md font-label-md">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Upload CTA */}
        <div className="px-6 mt-auto">
          <Link
            href="/dashboard/studio"
            className="w-full primary-gradient flex items-center justify-center gap-2 py-3 rounded-xl text-white text-label-md font-bold hover:scale-[1.02] transition-transform"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Upload New Overlay
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[280px] p-8">
        {children}
      </main>
    </div>
  )
}
