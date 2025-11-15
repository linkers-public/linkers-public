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
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* 로고 */}
            <Link 
              href="/legal" 
              className="flex items-center gap-3 group hover:opacity-90 transition-opacity"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl blur-sm opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <div className="relative p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                  <Scale className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Linkus Legal
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-slate-500 font-medium">
                  청년 법률 리스크 탐지
                </span>
              </div>
            </Link>

            {/* 네비게이션 */}
            <nav className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/legal' && pathname?.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm",
                      "transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 scale-105"
                        : "text-slate-700 hover:bg-slate-100 hover:text-blue-600 hover:shadow-sm"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 flex-shrink-0",
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
      <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-sm py-8 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-semibold text-slate-700">Linkus Legal</p>
          </div>
          <p className="text-xs text-slate-500">© 2024 Linkus Legal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
