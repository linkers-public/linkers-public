'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Search, BarChart3 } from 'lucide-react'

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const navItems = [
    { href: '/legal', label: '홈', icon: FileText },
    { href: '/legal/analysis', label: '법률 문제 분석', icon: BarChart3 },
    { href: '/legal/search', label: '법률 검색', icon: Search },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 로고 */}
            <Link href="/legal" className="flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">
                Linkus Legal
              </span>
              <span className="text-sm text-slate-500">- 청년 법률 리스크 탐지</span>
            </Link>

            {/* 네비게이션 */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto px-6 text-center text-slate-600">
          <p>© 2024 Linkus Legal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

