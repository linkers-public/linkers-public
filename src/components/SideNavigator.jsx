'use client'

import React, { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useProfileStore } from '@/stores/useProfileStore'
import Link from 'next/link'

const SideNavigator = () => {
  const pathname = usePathname()
  const account = useProfileStore((state) => state.profile)
  const routes = useMemo(() => {
    if (account?.role === 'MAKER') {
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
          label: '할당된 프로젝트',
          type: 'my',
          isActive: pathname === '/my/assigned-projects',
          href: '/my/assigned-projects',
        },
        {
          icon: '',
          label: '제안 현황',
          type: 'my',
          isActive: pathname === '/my/proposal',
          href: '/my/proposal',
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
    } else if (account?.role === 'MANAGER') {
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
          label: '관심 메이커',
          type: 'my',
          isActive: pathname === '/my/bookmarked-makers',
          href: '/my/bookmarked-makers',
        },
        {
          icon: '',
          label: '팀 제안 현황',
          type: 'my',
          isActive: pathname === '/my/proposal',
          href: '/my/proposal',
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
    }
    return []
  }, [pathname, account?.role])

  if (routes.length === 0) {
    return null
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <span className="text-p1 text-black80">마이</span>
        <div className="flex flex-col gap-4">
          {routes
            .filter((route) => route.type === 'my')
            .map((route, index) => (
              <div
                key={index}
                className={`px-2 py-1 rounded-[14px] text-subtitle2 ${
                  route.isActive
                    ? 'text-palette-coolNeutral-10'
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
                className={`px-2 py-1 rounded-[14px] text-subtitle2 ${
                  route.isActive
                    ? 'text-palette-coolNeutral-10'
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
    </>
  )
}

export default SideNavigator
