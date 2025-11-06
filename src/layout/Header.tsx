'use client'

import { useState, useEffect, useRef } from 'react'
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
  
  // 현재 경로가 auth 페이지인지 확인
  const isAuthPage = pathname?.startsWith('/auth')

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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let count = 0

      // 팀 초대 조회 (읽지 않은 것만)
      const { data: invites } = await supabase
        .from('team_members')
        .select('id, status')
        .eq('maker_id', user.id)
        .is('status', null)

      if (invites) {
        count += invites.length
      }

      // 기업 제안 조회 (읽지 않은 것만)
      const { data: profile } = await supabase
        .from('accounts')
        .select('profile_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single()

      if (profile) {
        const { data: proposals } = await supabase
          .from('project_members')
          .select('id, status')
          .eq('profile_id', profile.profile_id)
          .is('status', null)

        if (proposals) {
          count += proposals.length
        }
      }

      setUnreadCount(count)
    } catch (error) {
      console.error('알람 로드 실패:', error)
    }
  }

  useEffect(() => {
    const getUserInfo = async () => {
      const result = await supabase.auth.getUser()
      if (result?.data?.user) {
        setUser(result?.data?.user)
        await loadActiveProfile()
        await loadNotifications()
      }
    }

    getUserInfo()

    // 프로필 전환 이벤트 리스너
    const handleProfileSwitch = () => {
      loadActiveProfile()
      loadNotifications()
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
  }, [supabase, pathname]) // pathname도 의존성에 추가하여 프로필 전환 시 업데이트

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
  const getMobileRoutes = () => {
    if (activeProfileType === 'COMPANY') {
      return [
        { label: '내 프로젝트 목록', href: '/enterprise/my-counsel' },
        { label: '프로젝트 상담 신청', href: '/enterprise/counsel-form' },
      ]
    }
    return [
      { label: '프로젝트 찾기', href: '/search-projects' },
      { label: '메이커 검색', href: '/search-makers' },
    ]
  }

  return (
    <>
      <div className="relative z-[800] w-full h-[64px] flex items-center border-b-[1px] border-solid border-[rgba(0,0,0,0.08)]">
        <div className="absolute inset-0 z-[-1] bg-white/88 backdrop-saturate-[1.5] backdrop-blur-[32px]"></div>
        <header className="flex h-full items-center px-4 md:px-6 w-full">
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
                        <h3 className="text-sm font-semibold text-gray-900">알림</h3>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            router.push('/my/messages')
                            setShowNotificationMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                        >
                          <Mail className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <p className="font-medium">모든 메시지 보기</p>
                            <p className="text-xs text-gray-500 mt-1">팀 초대 및 기업 제안 확인</p>
                          </div>
                        </button>
                      </div>
                      {unreadCount === 0 && (
                        <div className="px-4 py-8 text-center text-sm text-gray-500">
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

              {/* 네비게이션 메뉴 */}
              <nav className="space-y-2">
                {getMobileRoutes().map((route) => (
                  <Link
                    key={route.href}
                    href={route.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`block px-4 py-3 rounded-lg transition-colors ${
                      pathname === route.href
                        ? 'bg-gray-100 text-palette-coolNeutral-20 font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {route.label}
                  </Link>
                ))}
              </nav>

              {/* 사용자 메뉴 (로그인한 경우) */}
              {user && (
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
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default Header
