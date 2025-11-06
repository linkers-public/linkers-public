'use client'

import React, { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

/**
 * @param {Object} props
 * @param {'FREELANCER'|'COMPANY'|null} [props.profileType]
 */
const Navigator = ({ profileType }) => {
  const pathname = usePathname()
  const routes = useMemo(() => {
    // 기업 프로필일 때
    if (profileType === 'COMPANY') {
      return [
        {
          icon: '',
          label: '내 프로젝트 목록',
          isActive: pathname === '/enterprise/my-counsel',
          href: '/enterprise/my-counsel',
        },
        {
          icon: '',
          label: '프로젝트 상담 신청',
          isActive: pathname === '/enterprise/counsel-form',
          href: '/enterprise/counsel-form',
        },
        {
          icon: '',
          label: '프로젝트 등록',
          isActive: pathname === '/enterprise/counsel-form',
          href: '/enterprise/counsel-form',
        },
      ]
    }
    
    // 프리랜서 프로필이거나 프로필 타입이 없을 때 (기본값)
    return [
      {
        icon: '',
        label: '프로젝트 찾기',
        isActive: pathname === '/search-projects',
        href: '/search-projects',
      },
      {
        icon: '',
        label: '메이커 검색',
        isActive: pathname === '/search-makers',
        href: '/search-makers',
      },
      {
        icon: '',
        label: '팀 프로필',
        isActive: pathname === '/my/team-profile',
        href: '/my/team-profile',
      },
    ]
  }, [pathname, profileType])

  return (
    <nav className="flex space-x-10">
      {routes.map((route) => (
        <div
          key={route.label}
          className="text-subtitle4 text-palette-coolNeutral-70 hover:text-palette-coolNeutral-20 transition-colors duration-200"
        >
          <Link href={route.href}>{route.label}</Link>
        </div>
      ))}
    </nav>
  )
}

export default Navigator
