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
        <div className="flex flex-col gap-2">
          <span className="text-p2 text-black80">마이</span>
          <div className="flex flex-col gap-1 px-2">
            {routes
              .filter((route) => route.type === 'my')
              .map((route, index) => (
                <div
                  key={index}
                  className={`px-2 py-1 text-black100  rounded-[14px] ${
                    route.isActive
                      ? 'bg-primary text-white text-subtitle3'
                      : 'text-p2 hover:bg-black20'
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
        <div className="flex flex-col gap-2">
          <span className="text-p2 text-black80">팀</span>
          <div className="flex flex-col gap-1 px-2">
            {routes
              .filter((route) => route.type === 'team')
              .map((route, index) => (
                <div
                  key={index}
                  className={`px-2 py-1 text-black100  rounded-[14px] ${
                    route.isActive
                      ? 'bg-primary text-white text-subtitle3'
                      : 'text-p2 hover:bg-black20'
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
