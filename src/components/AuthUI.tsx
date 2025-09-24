'use client'

import React, { useState } from 'react'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import useHydration from '@/hooks/use-hydrate'
import MakersLogo from './common/MakersLogo'

const AuthUI = ({ role }: { role: string }) => {
  const isMounted = useHydration()
  const [user, setUser] = useState()
  const [accountType, setAccountType] = useState<'personal' | 'client'>('personal')
  const [selectedRole, setSelectedRole] = useState<'MAKER' | 'MANAGER'>('MAKER')
  const supabaseClient = createSupabaseBrowserClient()

  if (!isMounted) return null

  const getUserInfo = async () => {
    const result = await supabaseClient.auth.getUser()
    // @ts-ignore
    if (result?.data?.user) setUser(result?.data?.user)
  }

  const handleLogout = async () => {
    await supabaseClient.auth.signOut()
    window.location.reload()
  }

  const signInWithProvider = async (provider: 'google' | 'kakao') => {
    // sessionStorage에 계정 타입과 역할 저장
    sessionStorage.setItem('accountType', accountType)
    if (accountType === 'personal') {
      sessionStorage.setItem('role', selectedRole)
    }

    await supabaseClient.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?type=${accountType}&role=${selectedRole}&next=/`,
      },
    })
  }

  const handleGoogleLogin = async () => {
    await signInWithProvider('google')
  }

  const handleKakaoLogin = async () => {
    await signInWithProvider('kakao')
  }

  const getAccountTypeInfo = (type: 'personal' | 'client') => {
    switch (type) {
      case 'personal':
        return {
          title: '개인으로 시작하기',
          description: '메이커나 매니저로 활동하며 프로젝트에 참여하세요',
          subtitle: '개인 (메이커/매니저)'
        }
      case 'client':
        return {
          title: '기업으로 시작하기',
          description: 'AI와 메이커를 활용해 빠르고 저렴하게 MVP를 제작하세요',
          subtitle: '기업'
        }
      default:
        return {
          title: 'Makers에 오신 것을 환영합니다',
          description: 'AI 코더와 프리랜서를 연결하는 초고속 서비스 제작 플랫폼',
          subtitle: '시작하기'
        }
    }
  }

  const accountTypeInfo = getAccountTypeInfo(accountType)

  return (
    <section className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md mx-auto px-6">
        {/* 헤더 섹션 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <MakersLogo size="lg" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Makers에 오신 것을 환영합니다
          </h1>
          <p className="text-gray-600 mb-6">
            AI 코더와 프리랜서를 연결하는 초고속 서비스 제작 플랫폼
          </p>
        </div>

        {/* 계정 타입 선택 섹션 */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            어떤 계정으로 시작하시나요?
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setAccountType('personal')}
              className={`p-4 rounded-lg border-2 transition-all ${
                accountType === 'personal'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
              }`}
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div className="font-semibold text-sm">개인</div>
                <div className="text-xs text-gray-500 mt-1">메이커/매니저</div>
              </div>
            </button>
            
            <button
              onClick={() => setAccountType('client')}
              className={`p-4 rounded-lg border-2 transition-all ${
                accountType === 'client'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
              }`}
            >
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 114 0 2 2 0 01-4 0zm8 0a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="font-semibold text-sm">기업</div>
                <div className="text-xs text-gray-500 mt-1">프로젝트 의뢰</div>
              </div>
            </button>
          </div>
        </div>

        {/* 개인 계정인 경우 역할 선택 */}
        {accountType === 'personal' && (
          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-3 text-center">
              역할을 선택해주세요
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedRole('MAKER')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedRole === 'MAKER'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold text-sm">메이커</div>
                  <div className="text-xs text-gray-500 mt-1">프로젝트 수행</div>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedRole('MANAGER')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedRole === 'MANAGER'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold text-sm">매니저</div>
                  <div className="text-xs text-gray-500 mt-1">팀 관리</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* 선택된 계정 타입 정보 */}
        <div className="text-center mb-6">
          <span className="inline-block px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-full">
            {accountTypeInfo.subtitle}
          </span>
          <p className="text-sm text-gray-600 mt-2">
            {accountTypeInfo.description}
          </p>
        </div>

        {/* 로그인 버튼들 */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center w-full h-12 rounded-lg shadow-sm p-4 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            구글로 시작하기
          </button>
          
          <button
            onClick={handleKakaoLogin}
            className="flex items-center justify-center w-full h-12 rounded-lg shadow-sm p-4 bg-[#FEE500] hover:bg-[#FDD835] transition-colors"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#3C1E1E" d="M12 3C6.48 3 2 6.48 2 10.8c0 2.7 1.8 5.1 4.5 6.4L5.5 21l4.1-2.1c1.1.2 2.2.3 3.4.3 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/>
            </svg>
            카카오로 시작하기
          </button>
        </div>

        {/* 하단 안내 */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            로그인 시{' '}
            <a href="/terms" className="text-blue-600 hover:underline">
              이용약관
            </a>
            {' '}및{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">
              개인정보처리방침
            </a>
            에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </section>
  )
}

export default AuthUI
