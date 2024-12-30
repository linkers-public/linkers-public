'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Navigator from '@/components/Navigator'
import Logo from '@/components/Logo'
import { UserCircleIcon, Bell } from 'lucide-react'

const Header = () => {
  const router = useRouter()

  return (
    <div className="fixed top-0 z-800 w-full h-[64px] items-center justify-center border-b-[1px] border-solid border-[rgba(0,0,0,0.08)]">
      <div className="absolute inset-0 z-[-1] bg-white/88 backdrop-saturate-[1.5] backdrop-blur-[32px]"></div>
      {/* 3xl 이상 정의하고 반응형 여기다 집어넣기 */}
      <header className="flex max-w-[1024px] h-full items-center mx-auto">
        <nav className="flex items-center h-full gap-8">
          <Logo />
          <Navigator />
        </nav>

        <div className="ml-auto">
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
        </div>
      </header>
    </div>
  )
}

export default Header
