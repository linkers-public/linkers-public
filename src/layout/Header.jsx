'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { UserCircleIcon, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import Navigator from '@/components/Navigator'
import Logo from '@/components/Logo'

const Header = () => {
  const router = useRouter()
  const [user, setUser] = useState()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const getUserInfo = async () => {
      const result = await supabase.auth.getUser()
      if (result?.data?.user) setUser(result?.data?.user)
    }

    getUserInfo()
  }, [supabase])

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
              <div className="relative">
                <Bell
                  size={24}
                  color="#4a4a4a"
                  strokeWidth={1.5}
                />
                <div className="absolute top-0 right-0 w-[10px] h-[10px] bg-palette-blue-50 rounded-full border-2 border-white"></div>
              </div>
              <UserCircleIcon
                size={28}
                color="#4a4a4a"
                strokeWidth={1.5}
                onClick={() => router.push('/my/profile')}
              />
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Button onClick={() => router.push('/auth')}>회원 가입</Button>
              <Button onClick={() => router.push('/auth')}>로그인</Button>
            </div>
          )}
        </div>
      </header>
    </div>
  )
}

export default Header
