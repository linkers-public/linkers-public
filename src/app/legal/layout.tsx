'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, MessageSquare, BookOpen, Home, Scale } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    { href: '/legal', label: '홈', icon: Home },
    { href: '/legal/contract', label: '계약서 분석', icon: FileText },
    { href: '/legal/situation', label: '상황 분석', icon: MessageSquare },
    { href: '/legal/cases', label: '유사 케이스', icon: BookOpen },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between gap-3">
            {/* 로고 */}
            <Link 
              href="/legal" 
              className="flex items-center gap-2 group hover:opacity-90 transition-opacity"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-sm">
                  <Scale className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                  Linkus Legal
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium leading-tight">
                  청년 법률 리스크 탐지
                </span>
              </div>
            </Link>

            {/* 네비게이션 */}
            <nav className="flex items-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/legal' && pathname?.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm",
                      "transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm scale-105"
                        : "text-slate-700 hover:bg-slate-100 hover:text-blue-600"
                    )}
                  >
                    <Icon className={cn(
                      "w-3.5 h-3.5 flex-shrink-0",
                      isActive ? "text-white" : "text-slate-500"
                    )} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
