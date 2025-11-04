'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UserCircleIcon, Bell, LogOut, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import Navigator from '@/components/Navigator'
import Logo from '@/components/common/Logo'
import ProfileSwitchButton from '@/components/ProfileSwitchButton'

const Header = () => {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const getUserInfo = async () => {
      const result = await supabase.auth.getUser()
      if (result?.data?.user) setUser(result?.data?.user)
    }

    getUserInfo()
  }, [supabase])

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setShowUserMenu(false)
    router.push('/')
    window.location.reload()
  }

  return (
    <div className="z-800 w-full h-[64px] items-center border-b-[1px] border-solid border-[rgba(0,0,0,0.08)] px-3">
      <div className="absolute inset-0 z-[-1] bg-white/88 backdrop-saturate-[1.5] backdrop-blur-[32px]"></div>
      {/* 3xl 이상 정의하고 반응형 여기다 집어넣기 */}
      <header className="flex max-w-[1024px] h-full items-center mx-auto">
        <nav className="flex items-center h-full gap-8">
          <Logo />
          <Navigator />
        </nav>
        <div className="ml-auto">
          {user ? (
            <div className="flex items-center gap-4">
              <ProfileSwitchButton />
              <div className="relative">
                <Bell
                  size={24}
                  color="#4a4a4a"
                  strokeWidth={1.5}
                  className="cursor-pointer"
                />
                <div className="absolute top-0 right-0 w-[10px] h-[10px] bg-palette-blue-50 rounded-full border-2 border-white"></div>
              </div>
              <div className="relative" ref={menuRef}>
                <UserCircleIcon
                  size={28}
                  color="#4a4a4a"
                  strokeWidth={1.5}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="cursor-pointer"
                />
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <button
                      onClick={() => {
                        router.push('/my/profile')
                        setShowUserMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      내 프로필
                    </button>
                    <button
                      onClick={() => {
                        router.push('/my/profile/manage')
                        setShowUserMenu(false)
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      프로필 관리
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/auth?role=maker')}>회원 가입</Button>
              <Button onClick={() => router.push('/auth?role=maker')}>로그인</Button>
            </div>
          )}
        </div>
      </header>
    </div>
  )
}

export default Header
