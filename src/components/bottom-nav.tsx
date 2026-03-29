'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  {
    label: '搜索',
    href: '/search',
    icon: 'search',
    activeIcon: 'search',
  },
  {
    label: '词库',
    href: '/vocabulary',
    icon: 'library_books',
    activeIcon: 'menu_book',
  },
  {
    label: '个人中心',
    href: '/settings',
    icon: 'person_outline',
    activeIcon: 'person',
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-[#0e0e0e]/95 backdrop-blur-xl border-t border-[#262626]",
        "pb-safe safe-area-bottom"
      )}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/search' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all min-w-[64px] relative",
                isActive
                  ? "text-[#72fe8f]"
                  : "text-[#adaaaa] hover:text-white active:scale-95"
              )}
            >
              <span
                className="material-symbols-outlined text-2xl transition-all"
                style={{
                  fontVariationSettings: `'FILL' ${isActive ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
                }}
              >
                {isActive ? item.activeIcon : item.icon}
              </span>
              <span className="text-[10px] font-semibold font-label tracking-wide">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}