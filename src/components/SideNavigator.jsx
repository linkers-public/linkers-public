'use client'

import React, { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const SideNavigator = () => {
  const pathname = usePathname()
  const routes = useMemo(() => {
    return [
      {
        icon: '',
        label: '내 프로필',
        type: 'my',
        isActive: pathname === '/my/profile',
        href: '/my/profile',
      },
      {
        icon: '',
        label: '상담 현황',
        type: 'my',
        isActive: pathname === '/my/counsel',
        href: '/my/counsel',
      },
      {
        icon: '',
        label: '메이커 제안 현황',
        type: 'my',
        isActive: pathname === '/my/maker-proposal',
        href: '/my/maker-proposal',
      },
      {
        icon: '',
        label: '팀 프로필',
        type: 'team',
        isActive: pathname === '/my/team-profile',
        href: '/my/team-profile',
      },
      {
        icon: '',
        label: '프로젝트',
        type: 'team',
        isActive: pathname === '/my/projects',
        href: '/my/projects',
      },
    ]
  }, [pathname])

  return (
    <section className="flex h-full">
      <nav className="flex flex-col w-[200px] gap-4 mx-5 my-10">
        <div className="flex flex-col gap-4">
          <span className="text-p1 text-black80">마이</span>
          <div className="flex flex-col gap-4">
            {routes
              .filter((route) => route.type === 'my')
              .map((route, index) => (
                <div
                  key={index}
                  className={`px-2 py-1 rounded-[14px] text-subtitle2  ${
                    route.isActive
                      ? ' text-palette-coolNeutral-10'
                      : 'text-palette-coolNeutral-80'
                  }`}
                >
                  <Link
                    href={route.href}
                    className="w-full h-full px-2"
                  >
                    {route.label}
                  </Link>
                </div>
              ))}
          </div>
        </div>
        <div className="flex flex-col gap-4 mt-4">
          <span className="text-p1 text-black80">팀</span>
          <div className="flex flex-col gap-4">
            {routes
              .filter((route) => route.type === 'team')
              .map((route, index) => (
                <div
                  key={index}
                  className={`px-2 py-1  rounded-[14px] text-subtitle2  ${
                    route.isActive
                      ? ' text-palette-coolNeutral-10'
                      : 'text-palette-coolNeutral-80'
                  }`}
                >
                  <Link
                    href={route.href}
                    className="w-full h-full px-2"
                  >
                    {route.label}
                  </Link>
                </div>
              ))}
          </div>
        </div>
      </nav>
    </section>
  )
}

export default SideNavigator
