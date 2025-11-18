'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FileText, MessageSquare, BookOpen, Home, Scale, UserCircle, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)

  useEffect(() => {
    // 클라이언트에서만 Supabase 클라이언트 생성
    if (typeof window === 'undefined') return

    const supabase = createSupabaseBrowserClient()

    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error)
        setUser(null)
      }
    }

    getUser()

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleLogout = async () => {
    try {
      if (typeof window === 'undefined') return
      const supabase = createSupabaseBrowserClient()
      await supabase.auth.signOut()
      setUser(null)
      router.push('/legal')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  const navItems = [
    { href: '/legal', label: '홈', icon: Home },
    { href: '/legal/assist', label: '상담 허브', icon: MessageSquare },
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

            {/* 로그인/사용자 메뉴 */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <LogOut className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">로그아웃</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/my/profile')}
                    className="text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  >
                    <UserCircle className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">마이페이지</span>
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => router.push('/auth')}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm"
                  size="sm"
                >
                  <UserCircle className="w-4 h-4 mr-1.5" />
                  <span className="hidden sm:inline">로그인</span>
                  <span className="sm:hidden">로그인</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  )
}
