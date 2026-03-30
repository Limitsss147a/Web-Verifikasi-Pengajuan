'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, ClipboardCheck, BellRing, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/components/ui/sidebar'
import { useProfile } from '@/hooks/use-profile'

export function MobileNav() {
  const pathname = usePathname()
  const { toggleSidebar } = useSidebar()
  const { isAdmin, isLoading } = useProfile()

  if (isLoading) return null

  const userItems = [
    { title: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Pengajuan', href: '/dashboard/budgets', icon: FileText },
    { title: 'Notifikasi', href: '/dashboard/notifications', icon: BellRing },
  ]

  const adminItems = [
    { title: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Verifikasi', href: '/dashboard/review', icon: ClipboardCheck },
    { title: 'Pengajuan', href: '/dashboard/budgets', icon: FileText },
  ]

  const items = isAdmin ? adminItems : userItems

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 flex h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map((item) => {
        const isActive = item.href === '/dashboard' 
          ? pathname === '/dashboard' 
          : pathname.startsWith(item.href)
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold transition-colors touch-none select-none",
              isActive 
                ? "text-primary" 
                : "text-muted-foreground hover:text-foreground"
            )}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <item.icon className={cn("h-5 w-5 sm:h-6 sm:w-6 transition-all", isActive && "scale-110")} />
            <span className="truncate max-w-[80px]">{item.title}</span>
          </Link>
        )
      })}
      
      <button
        onClick={toggleSidebar}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] sm:text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors touch-none select-none"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
        <span className="truncate max-w-[80px]">Menu</span>
      </button>
    </div>
  )
}
