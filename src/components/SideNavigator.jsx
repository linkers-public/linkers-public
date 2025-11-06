'use client'

import React, { useMemo, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useProfileStore } from '@/stores/useProfileStore'
import Link from 'next/link'

const SideNavigator = () => {
  const pathname = usePathname()
  const account = useProfileStore((state) => state.profile)
  const { fetchMyProfileData } = useProfileStore()
  const [isLoading, setIsLoading] = useState(true)

  // 레이아웃 레벨에서 프로필 미리 로드
  useEffect(() => {
    const loadProfile = async () => {
      try {
        // 프로필이 없거나 초기 상태인 경우에만 로드
        if (!account || !account.role) {
          await fetchMyProfileData()
        }
      } catch (error) {
        console.error('프로필 로드 실패:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadProfile()
    
    // 프로필 전환 이벤트 리스너
    const handleProfileSwitch = async () => {
      try {
        await fetchMyProfileData()
      } catch (error) {
        console.error('프로필 새로고침 실패:', error)
      }
    }
    window.addEventListener('profileSwitched', handleProfileSwitch)
    
    return () => {
      window.removeEventListener('profileSwitched', handleProfileSwitch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const routes = useMemo(() => {
    // 프로필이 로드되지 않았거나 없는 경우 기본 메뉴 표시
    if (!account || !account.role) {
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
          label: '프로필 관리',
          type: 'my',
          isActive: pathname === '/my/profile/manage',
          href: '/my/profile/manage',
        },
      ]
    }

    // 프로필 타입에 따라 분기
    const isFreelancer = account?.profile_type === 'FREELANCER'
    const isCompany = account?.profile_type === 'COMPANY'

    // 기업 프로필인 경우
    if (isCompany) {
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
          label: '프로필 관리',
          type: 'my',
          isActive: pathname === '/my/profile/manage',
          href: '/my/profile/manage',
        },
        {
          icon: '',
          label: '내 프로젝트 목록',
          type: 'my',
          isActive: pathname === '/enterprise/my-counsel',
          href: '/enterprise/my-counsel',
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
          label: '관심 메이커',
          type: 'my',
          isActive: pathname === '/my/bookmarked-makers',
          href: '/my/bookmarked-makers',
        },
      ]
    }

    // 프리랜서 프로필인 경우
    if (isFreelancer) {
      const baseRoutes = [
        {
          icon: '',
          label: '내 프로필',
          type: 'my',
          isActive: pathname === '/my/profile',
          href: '/my/profile',
        },
        {
          icon: '',
          label: '프로필 관리',
          type: 'my',
          isActive: pathname === '/my/profile/manage',
          href: '/my/profile/manage',
        },
        {
          icon: '',
          label: '포트폴리오',
          type: 'my',
          isActive: pathname === '/my/profile/portfolio',
          href: '/my/profile/portfolio',
        },
        {
          icon: '',
          label: '경력 인증 배지',
          type: 'my',
          isActive: pathname === '/my/profile/badges',
          href: '/my/profile/badges',
        },
        {
          icon: '',
          label: '쪽지함',
          type: 'my',
          isActive: pathname === '/my/messages',
          href: '/my/messages',
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
      ]

      // 매니저 역할인 경우 팀 관련 메뉴 추가
      if (account?.role === 'MANAGER') {
        baseRoutes.push(
          {
            icon: '',
            label: '팀 프로필 조회',
            type: 'team',
            isActive: pathname === '/team-profile',
            href: '/team-profile',
          },
          {
            icon: '',
            label: '팀 프로젝트 확인',
            type: 'team',
            isActive: pathname === '/team-projects',
            href: '/team-projects',
          }
        )
      }

      return baseRoutes
    }

    // 기본 메뉴 (프로필 타입이 없는 경우)
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
        label: '프로필 관리',
        type: 'my',
        isActive: pathname === '/my/profile/manage',
        href: '/my/profile/manage',
      },
    ]
  }, [pathname, account?.role, account?.profile_type])

  // 로딩 중이거나 라우트가 없어도 최소한 기본 메뉴는 표시
  const myRoutes = routes.filter((route) => route.type === 'my')
  const teamRoutes = routes.filter((route) => route.type === 'team')

  return (
    <>
      {myRoutes.length > 0 && (
        <div className="flex flex-col gap-4">
          <span className="text-p1 text-black80">마이</span>
          <div className="flex flex-col gap-4">
            {myRoutes.map((route, index) => (
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
      )}
      {teamRoutes.length > 0 && (
        <div className="flex flex-col gap-4 mt-4">
          <span className="text-p1 text-black80">팀</span>
          <div className="flex flex-col gap-4">
            {teamRoutes.map((route, index) => (
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
      )}
    </>
  )
}

export default SideNavigator
