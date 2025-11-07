'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UserCircleIcon, Bell, LogOut, User, Settings, Menu, X, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { User as SupabaseUser } from '@supabase/supabase-js'
import Navigator from '@/components/Navigator'
import Logo from '@/components/common/Logo'
import ProfileSwitchButton from '@/components/ProfileSwitchButton'
import { getUserProfiles } from '@/apis/profile-refactor.service'
import { Database } from '@/types/supabase'
import Link from 'next/link'
import { useProfileStore } from '@/stores/useProfileStore'

type ProfileType = Database['public']['Enums']['profile_type']

const Header = () => {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showNotificationMenu, setShowNotificationMenu] = useState(false)
  const [activeProfileType, setActiveProfileType] = useState<ProfileType | null>(null)
  const [activeRole, setActiveRole] = useState<'MAKER' | 'MANAGER' | 'NONE' | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const notificationMenuRef = useRef<HTMLDivElement>(null)
  const supabase = createSupabaseBrowserClient()
  const account = useProfileStore((state) => state.profile)
  const { fetchMyProfileData } = useProfileStore()
  
  // 현재 경로가 auth 페이지인지 확인
  const isAuthPage = pathname?.startsWith('/auth')
  
  // 마이페이지 경로인지 확인
  const isMyPage = pathname?.startsWith('/my')

  const loadActiveProfile = async () => {
    try {
      const profiles = await getUserProfiles()
      const validProfiles = (profiles as any[]).filter((p: any) => p.profile_type !== null)
      const active = validProfiles.find((p: any) => p.is_active)
      if (active) {
        setActiveProfileType(active.profile_type)
        setActiveRole(active.role || null)
      } else {
        setActiveProfileType(null)
        setActiveRole(null)
      }
    } catch (error) {
      console.error('프로필 로드 실패:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      // 인증 오류 발생 시 (403 등) 알림 로드 중단
      if (authError || !user) {
        if (authError?.status === 403 || authError?.message?.includes('403')) {
          console.warn('인증 오류로 인해 알림을 불러올 수 없습니다:', authError.message)
        }
        setUnreadCount(0)
        return
      }

      let count = 0

      // 팀 초대 조회 (읽지 않은 것만)
      const { data: invites, error: invitesError } = await supabase
        .from('team_members')
        .select('id, status')
        .eq('maker_id', user.id)
        .is('status', null)

      if (!invitesError && invites) {
        count += invites.length
      }

      // 기업 제안 조회 (읽지 않은 것만)
      const { data: profile, error: profileError } = await supabase
        .from('accounts')
        .select('profile_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single()

      if (!profileError && profile) {
        const { data: proposals, error: proposalsError } = await supabase
          .from('project_members')
          .select('id, status')
          .eq('profile_id', profile.profile_id)
          .is('status', null)

        if (!proposalsError && proposals) {
          count += proposals.length
        }
      }

      setUnreadCount(count)
    } catch (error) {
      console.error('알람 로드 실패:', error)
      setUnreadCount(0)
    }
  }

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        // 사용자 정보 조회
        const result = await supabase.auth.getUser()
        
        if (result?.data?.user) {
          setUser(result?.data?.user)
          await loadActiveProfile()
          await loadNotifications()
          // 마이페이지인 경우 프로필 데이터 로드
          if (isMyPage && (!account || !account.role)) {
            await fetchMyProfileData()
          }
        } else if (result?.error) {
          // 토큰 손상 오류 (missing sub claim 등) 발생 시 세션 정리
          const isTokenCorrupted = result.error.message?.includes('missing sub claim') || 
                                   result.error.message?.includes('invalid claim') ||
                                   result.error.message?.includes('JWT') ||
                                   result.error.status === 403
          
          if (isTokenCorrupted) {
            console.warn('토큰 손상 감지, 세션 정리 중:', result.error.message)
            try {
              // 손상된 세션 정리
              await supabase.auth.signOut({ scope: 'local' })
              // 로컬 스토리지의 세션 정보도 정리
              if (typeof window !== 'undefined') {
                const keys = Object.keys(localStorage)
                keys.forEach(key => {
                  if (key.includes('supabase') || key.includes('auth')) {
                    localStorage.removeItem(key)
                  }
                })
              }
            } catch (signOutError) {
              console.error('로그아웃 처리 실패:', signOutError)
            }
          } else {
            console.warn('인증 오류:', result.error.message)
          }
          setUser(null)
        }
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error)
        setUser(null)
      }
    }

    getUserInfo()

    // 프로필 전환 이벤트 리스너
    const handleProfileSwitch = () => {
      loadActiveProfile()
      loadNotifications()
      if (isMyPage) {
        fetchMyProfileData()
      }
    }
    window.addEventListener('profileSwitched', handleProfileSwitch)

    // 주기적으로 알람 확인 (30초마다)
    const interval = setInterval(() => {
      loadNotifications()
    }, 30000)

    return () => {
      window.removeEventListener('profileSwitched', handleProfileSwitch)
      clearInterval(interval)
    }
  }, [supabase, pathname, isMyPage]) // pathname도 의존성에 추가하여 프로필 전환 시 업데이트

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false)
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setShowNotificationMenu(false)
      }
    }

    if (showUserMenu || showMobileMenu || showNotificationMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu, showMobileMenu, showNotificationMenu])

  // 모바일 메뉴 닫기 (경로 변경 시)
  useEffect(() => {
    setShowMobileMenu(false)
  }, [pathname])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setShowUserMenu(false)
    router.push('/')
    window.location.reload()
  }

  // 모바일 메뉴 라우트 생성
  const getMobileRoutes = useMemo(() => {
    // 마이페이지인 경우 SideNavigator의 메뉴 구조 사용
    if (isMyPage && account && account.role) {
      const isFreelancer = account?.profile_type === 'FREELANCER'
      const isCompany = account?.profile_type === 'COMPANY'
      
      if (isCompany) {
        const companyAccountRoutes = [
          { label: '내 정보 / 회사 정보 수정', href: '/my/company/info', group: '회사 계정' },
          { label: '팀 멤버 관리', href: '/my/company/team-members', group: '회사 계정' },
        ]
        const subscriptionRoutes = [
          { label: '구독 관리', href: '/my/subscription', group: '결제 / 구독' },
          { label: '결제 내역', href: '/my/payments', group: '결제 / 구독' },
          { label: '연락처 열람 기록', href: '/my/contact-history', group: '결제 / 구독' },
        ]
        const projectHistoryRoutes = [
          { label: '진행 이력', href: '/my/project-history', group: '프로젝트 기록' },
          { label: '완료 프로젝트 저장함', href: '/my/completed-projects', group: '프로젝트 기록' },
        ]
        const settingsRoutes = [
          { label: '알림 설정', href: '/my/account/notifications', group: '설정' },
          { label: '계정 보안', href: '/my/account/security', group: '설정' },
          { label: '회원 탈퇴', href: '/my/account/delete', group: '설정' },
        ]
        return [
          ...companyAccountRoutes,
          ...subscriptionRoutes,
          ...projectHistoryRoutes,
          ...settingsRoutes,
        ]
      }
      
      if (isFreelancer) {
        const profileRoutes = [
          { label: '프로필 보기/수정', href: '/my/profile', group: '내 프로필' },
          { label: '받은 팀 초대', href: '/my/team-invites', group: '내 프로필' },
        ]
        const proposalRoutes = [
          { label: '받은 프로젝트 제안', href: '/my/project-proposals', group: '제안 & 메시지' },
          { label: '보낸 견적서 (매니저)', href: '/my/estimates-dashboard', group: '제안 & 메시지' },
        ]
        const interestRoutes = [
          { label: '관심 프로젝트', href: '/my/bookmarked-projects', group: '관심항목' },
          { label: '관심 기업', href: '/my/bookmarked-companies', group: '관심항목' },
        ]
        const accountRoutes = [
          { label: '로그인/보안', href: '/my/account/security', group: '계정관리' },
          { label: '알림 설정', href: '/my/account/notifications', group: '계정관리' },
        ]
        const teamRoutes = []
        if (account?.role === 'MANAGER') {
          teamRoutes.push(
            { label: '팀 프로필 조회', href: '/team-profile', group: '팀' },
            { label: '팀 프로젝트 확인', href: '/team-projects', group: '팀' }
          )
        }
        return [
          ...profileRoutes,
          ...proposalRoutes,
          ...interestRoutes,
          ...accountRoutes,
          ...teamRoutes,
        ]
      }
    }
    
    // 마이페이지가 아닌 경우 기본 네비게이션 메뉴
    if (activeProfileType === 'COMPANY') {
      return [
        { label: '내 프로젝트 목록', href: '/enterprise/my-counsel' },
        { label: '프로젝트 상담 신청', href: '/enterprise/counsel-form' },
      ]
    }
    
    // 프리랜서 프로필인 경우 팀 메뉴 추가
    const freelancerRoutes = [
      { label: '프로젝트 찾기', href: '/search-projects' },
      { label: '메이커 검색', href: '/search-makers' },
    ]
    
    if (activeProfileType === 'FREELANCER' && activeRole === 'MANAGER') {
      freelancerRoutes.push(
        { label: '팀 프로필 조회', href: '/team-profile' },
        { label: '팀 프로젝트 확인', href: '/team-projects' }
      )
    }
    
    return freelancerRoutes
  }, [isMyPage, account, activeProfileType, activeRole])

  return (
    <>
      <div className="relative z-[800] w-full h-[64px] flex items-center border-b-[1px] border-solid border-[rgba(0,0,0,0.08)]">
        <div className="absolute inset-0 z-[-1] bg-white/88 backdrop-saturate-[1.5] backdrop-blur-[32px]"></div>
        <header className="flex h-full items-center px-0 md:px-6 w-full md:max-w-[90%] md:mx-auto">
          <div className="flex items-center h-full gap-8 flex-1">
            <Logo />
            {/* 데스크톱 네비게이터 - 모바일에서 숨김 */}
            <div className="hidden md:block">
              <Navigator 
                profileType={activeProfileType || undefined} 
                role={activeRole || undefined}
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            {user ? (
              <>
                {/* 데스크톱 프로필 전환 버튼 - 모바일에서 숨김 */}
                <div className="hidden md:block">
                  <ProfileSwitchButton />
                </div>
                {/* 알림 아이콘 - 모바일에서 숨김 */}
                <div className="hidden md:block relative" ref={notificationMenuRef}>
                  <Bell
                    size={24}
                    color="#4a4a4a"
                    strokeWidth={1.5}
                    className="cursor-pointer"
                    onClick={() => {
                      setShowNotificationMenu(!showNotificationMenu)
                      setShowUserMenu(false)
                    }}
                  />
                  {unreadCount > 0 && (
                  <div className="absolute top-0 right-0 w-[10px] h-[10px] bg-palette-blue-50 rounded-full border-2 border-white"></div>
                  )}
                  {showNotificationMenu && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <h3 className="text-xs font-semibold text-gray-900">알림</h3>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            router.push('/my/messages')
                            setShowNotificationMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                        >
                          <Mail className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <p className="font-medium">모든 메시지 보기</p>
                            <p className="text-xs text-gray-500 mt-1">팀 초대 및 기업 제안 확인</p>
                          </div>
                        </button>
                      </div>
                      {unreadCount === 0 && (
                        <div className="px-4 py-8 text-center text-xs text-gray-500">
                          새로운 알림이 없습니다
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* 사용자 메뉴 */}
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
                        className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <User className="w-4 h-4" />
                        내 프로필
                      </button>
                      <button
                        onClick={() => {
                          router.push('/my/profile/manage')
                          setShowUserMenu(false)
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        프로필 관리
                      </button>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
                {/* 모바일 햄버거 메뉴 버튼 */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden p-2"
                  aria-label="메뉴"
                >
                  {showMobileMenu ? (
                    <X size={24} color="#4a4a4a" strokeWidth={1.5} />
                  ) : (
                    <Menu size={24} color="#4a4a4a" strokeWidth={1.5} />
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                {isAuthPage ? (
                  <Button onClick={() => router.push('/auth?role=maker')} className="hidden sm:inline-flex">회원 가입</Button>
                ) : (
                  <Button onClick={() => router.push('/auth?role=maker')} className="hidden sm:inline-flex">로그인</Button>
                )}
                {/* 모바일 로그인 버튼 */}
                <button
                  onClick={() => router.push('/auth?role=maker')}
                  className="sm:hidden p-2"
                  aria-label="로그인"
                >
                  <UserCircleIcon size={24} color="#4a4a4a" strokeWidth={1.5} />
                </button>
              </div>
            )}
          </div>
        </header>
      </div>

      {/* 모바일 사이드 메뉴 */}
      {showMobileMenu && (
        <>
          {/* 오버레이 */}
          <div
            className="fixed inset-0 bg-black/50 z-[900] md:hidden"
            onClick={() => setShowMobileMenu(false)}
          />
          {/* 사이드 메뉴 */}
          <div
            ref={mobileMenuRef}
            className="fixed top-[64px] right-0 h-[calc(100vh-64px)] w-80 bg-white shadow-xl z-[901] md:hidden overflow-y-auto"
          >
            <div className="p-4 space-y-4">
              {/* 프로필 전환 버튼 (로그인한 경우) */}
              {user && (
                <div className="pb-4 border-b border-gray-200">
                  <ProfileSwitchButton />
                </div>
              )}
              
              {/* 알림 메뉴 (모바일에서도 표시) */}
              {user && (
                <div className="pb-4 border-b border-gray-200">
                  <Link
                    href="/my/messages"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    <span>알림</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-palette-blue-50 text-white text-xs font-semibold px-2 py-1 rounded-full min-w-[20px] text-center">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </div>
              )}

              {/* 네비게이션 메뉴 */}
              <nav className="space-y-2">
                {/* 일반 네비게이션 메뉴 (항상 표시) */}
                {(() => {
                  // Navigator 컴포넌트와 동일한 로직으로 일반 네비게이션 메뉴 생성
                  let generalRoutes: Array<{ label: string; href: string }> = []
                  
                  if (activeProfileType === 'COMPANY') {
                    generalRoutes = [
                      { label: '내 프로젝트 목록', href: '/enterprise/my-counsel' },
                      { label: '프로젝트 상담 신청', href: '/enterprise/counsel-form' },
                    ]
                  } else {
                    generalRoutes = [
                      { label: '프로젝트 찾기', href: '/search-projects' },
                      { label: '메이커 검색', href: '/search-makers' },
                    ]
                    
                    // 프리랜서 프로필일 경우 팀 메뉴 추가 (Navigator 컴포넌트와 동일한 로직)
                    if (activeProfileType === 'FREELANCER') {
                      generalRoutes.push(
                        { label: '팀 프로필 조회', href: '/team-profile' },
                        { label: '팀 프로젝트 확인', href: '/team-projects' }
                      )
                    }
                  }
                  
                  return (
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-gray-900 mb-2 px-4">메뉴</h3>
                      <div className="space-y-1">
                        {generalRoutes.map((route) => (
                          <Link
                            key={route.href}
                            href={route.href}
                            onClick={() => setShowMobileMenu(false)}
                            className={`block px-4 py-2.5 rounded-lg transition-colors ${
                              pathname === route.href
                                ? 'bg-gray-100 text-palette-coolNeutral-20 font-semibold'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {route.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                })()}

                {/* 마이페이지 세부 메뉴 (마이페이지일 때만 표시) */}
                {isMyPage && account && account.role && (
                  (() => {
                    const routes = getMobileRoutes as Array<{ label: string; href: string; group?: string }>
                    const groupedRoutes = routes.reduce((acc, route) => {
                      const group = route.group || '기타'
                      if (!acc[group]) {
                        acc[group] = []
                      }
                      acc[group].push(route)
                      return acc
                    }, {} as Record<string, typeof routes>)
                    
                    return Object.entries(groupedRoutes).map(([groupName, groupRoutes]) => (
                      <div key={groupName} className="mb-6">
                        <h3 className="text-xs font-semibold text-gray-900 mb-2 px-4">{groupName}</h3>
                        <div className="space-y-1">
                          {groupRoutes.map((route) => (
                            <Link
                              key={route.href}
                              href={route.href}
                              onClick={() => setShowMobileMenu(false)}
                              className={`block px-4 py-2.5 rounded-lg transition-colors ${
                                pathname === route.href
                                  ? 'bg-gray-100 text-palette-coolNeutral-20 font-semibold'
                                  : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {route.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))
                  })()
                )}
              </nav>

              {/* 사용자 메뉴 (로그인한 경우, 마이페이지가 아닐 때만 표시) */}
              {user && !isMyPage && (
                <>
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <Link
                      href="/my/profile"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-5 h-5" />
                      <span>내 프로필</span>
                    </Link>
                    <Link
                      href="/my/profile/manage"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                      <span>프로필 관리</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        setShowMobileMenu(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                </>
              )}
              
              {/* 로그아웃 버튼 (마이페이지에서만 표시) */}
              {user && isMyPage && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleLogout()
                      setShowMobileMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>로그아웃</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default Header
