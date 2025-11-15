'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Search, BarChart3, FileCheck, FolderOpen } from 'lucide-react'

export default function Header() {
  const pathname = usePathname()

  const navItems = [
    { href: '/upload', label: '업로드', icon: FileText },
    { href: '/docs', label: '문서 목록', icon: FolderOpen },
    { href: '/match', label: '매칭', icon: Search },
    { href: '/compare', label: '비교', icon: BarChart3 },
  ]

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">Linkus Public</span>
          </Link>

          {/* 네비게이션 */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname?.startsWith(item.href)
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

          {/* 사용자 프로필 (임시) */}
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-sm text-slate-700 hover:text-slate-900">
              로그인
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

