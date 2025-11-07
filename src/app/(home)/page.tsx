'use client'

import React, { useState } from 'react'
import { ArrowRight, Clock, DollarSign, Users, CheckCircle, Zap, Target, Rocket, MessageCircle, UserPlus, Code, Briefcase } from 'lucide-react'
import Link from 'next/link'

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState<'freelancer' | 'company'>('freelancer')

  // 탭 전환 시 스크롤을 맨 위로 이동
  const handleTabChange = (tab: 'freelancer' | 'company') => {
    setActiveTab(tab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 w-full">
      {/* Tab Navigation */}
      <section className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm w-full">
        <div className="w-full">
          <div className="flex">
            <button
              onClick={() => handleTabChange('freelancer')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
                activeTab === 'freelancer'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-base md:text-lg">프리랜서</span>
            </button>
            <button
              onClick={() => handleTabChange('company')}
              className={`flex-1 py-4 px-6 text-center font-semibold transition-all ${
                activeTab === 'company'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span className="text-base md:text-lg">기업</span>
            </button>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="relative py-10 md:py-20 text-center px-4 md:px-0">
        <div className="w-full max-w-6xl mx-auto">
          {activeTab === 'freelancer' ? (
            <>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
                프리랜서로 시작하세요
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-2">
                무료로 프로필을 만들고 프로젝트에 참여하세요
              </p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mb-6 md:mb-8">
                기업이 먼저 견적을 요청하는 구조로 영업 부담 없이 활동하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Link 
                  href="/auth?role=maker"
                  className="bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  무료 프로필 만들기
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                </Link>
              </div>
            </>
          ) : (
            <>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight">
            개발자 어디서 찾아야 할지<br />
            <span className="text-blue-600">막막하다면?</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-2">
            견적은 공짜, 연락할 때만 결제!
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-6 md:mb-8">
            부담 없이 먼저 받아보고 선택하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link 
                  href="/enterprise/counsel-form"
              className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              프로젝트 등록하기
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
            </>
          )}
        </div>
      </section>

      {/* 프리랜서 How it Works Section */}
      {activeTab === 'freelancer' && (
      <section className="py-10 md:py-20 bg-white px-4 md:px-0">
        <div className="w-full max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
            프리랜서는 이렇게 활동합니다
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 md:mb-12 text-center">
            AI 툴을 활용하는 개발자라면 누구나 참여할 수 있습니다.<br />
            프로젝트 경험을 쌓고, 안정적인 수익 기회를 확보하세요.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-12">
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">프로필 등록</h3>
              <p className="text-sm text-gray-600">무료로 프로필을 만들고 포트폴리오를 등록하세요</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">프로젝트 매칭</h3>
              <p className="text-sm text-gray-600">맞춤형 프로젝트 제안을 받아보세요</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">견적 제출 & 계약</h3>
              <p className="text-sm text-gray-600">견적서를 제출하고 계약을 체결하세요</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">작업 & 보상</h3>
              <p className="text-sm text-gray-600">프로젝트를 완료하고 보상을 받으세요</p>
            </div>
          </div>
          
          <div className="text-center">
            <Link 
              href="/auth?role=maker"
              className="bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              무료 프로필 만들기
              <UserPlus className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
      )}

      {/* 메이커/매니저 역할 설명 Section */}
      {activeTab === 'freelancer' && (
      <section className="py-10 md:py-20 bg-gradient-to-br from-green-50 to-emerald-50 px-4 md:px-0">
        <div className="w-full max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
            메이커와 매니저, 두 가지 역할로 활동하세요
          </h2>
          <p className="text-base md:text-lg text-gray-600 mb-8 md:mb-12 text-center max-w-3xl mx-auto">
            프로젝트마다 역할을 선택할 수 있습니다. 직접 개발에 참여하거나 팀을 이끌며 프로젝트를 관리하세요.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
            {/* 메이커 카드 */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border-2 border-green-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Code className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">메이커 (MAKER)</h3>
                  <p className="text-sm text-gray-500">개발 작업 수행</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                프로젝트에 직접 참여하여 개발 작업을 수행하는 역할입니다.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>프로젝트에 직접 참여하여 개발 작업 수행</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>개인 또는 팀 프로젝트에서 개발자로 활동</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>코딩, 디자인, 개발 작업에 집중</span>
                </li>
              </ul>
            </div>

            {/* 매니저 카드 */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border-2 border-blue-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900">매니저 (MANAGER)</h3>
                  <p className="text-sm text-gray-500">프로젝트 관리</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4 leading-relaxed">
                팀을 구성하고 프로젝트를 관리하며 클라이언트와 소통하는 역할입니다.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>팀을 구성하고 프로젝트 전체를 관리</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>클라이언트와 소통하며 요구사항 조율</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>프로젝트 일정 및 품질 관리</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 md:p-6 bg-white rounded-xl border border-gray-200 max-w-3xl mx-auto">
            <p className="text-sm md:text-base text-gray-700 text-center leading-relaxed">
              <span className="font-semibold text-gray-900">유연한 역할 전환:</span> 같은 프로젝트에서도 필요에 따라 메이커와 매니저 역할을 전환할 수 있습니다. 
              한 프로젝트에서는 메이커로, 다른 프로젝트에서는 매니저로 활동하세요.
            </p>
          </div>
        </div>
      </section>
      )}

      {/* 프리랜서 혜택 Section */}
      {activeTab === 'freelancer' && (
      <section className="py-10 md:py-20 bg-gray-50 px-4 md:px-0">
        <div className="w-full max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6">프리랜서가 선택하는 이유</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center p-4 md:p-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">자유로운 일정</h3>
              <p className="text-gray-600">원하는 시간에 프로젝트를 선택하고 작업하세요</p>
            </div>
            <div className="text-center p-4 md:p-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">공정한 보상</h3>
              <p className="text-gray-600">투명한 견적 시스템으로 합리적인 보상을 받으세요</p>
            </div>
            <div className="text-center p-4 md:p-6">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
              </div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">팀 프로젝트</h3>
              <p className="text-gray-600">팀을 구성하여 대규모 프로젝트에도 참여 가능</p>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* 기업 Section */}
      {activeTab === 'company' && (
      <>
        <section className="py-10 md:py-20 bg-white px-4 md:px-0">
          <div className="w-full max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
            클라이언트는 이렇게 사용해요
          </h2>
          <p className="text-base md:text-lg text-gray-600 mb-8 md:mb-12 text-center">
            비교 견적은 무료, 실제 컨택 시에만 비용이 발생합니다.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8 md:mb-12">
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">상담 신청</h3>
              <p className="text-sm text-gray-600">요구사항/예산/기간 입력</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">메이커 매칭</h3>
              <p className="text-sm text-gray-600">적합한 프리랜서 추천</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">견적 비교</h3>
              <p className="text-sm text-gray-600">최적의 조건 선택</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">MVP 런칭</h3>
              <p className="text-sm text-gray-600">클라우드 배포까지 지원</p>
            </div>
          </div>
        </div>
      </section>

        {/* 기업 혜택 Section */}
        <section className="py-10 md:py-20 bg-gray-50 px-4 md:px-0">
          <div className="w-full max-w-6xl mx-auto text-center">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6">기업이 선택하는 이유</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
              <div className="text-center p-4 md:p-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">비용 효율적</h3>
                <p className="text-gray-600">견적 비교는 무료, 연락처 확인 시에만 소액 결제</p>
              </div>
              <div className="text-center p-4 md:p-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">다양한 선택지</h3>
                <p className="text-gray-600">여러 메이커의 견적을 비교하여 최적의 파트너 선택</p>
              </div>
              <div className="text-center p-4 md:p-6">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2">빠른 매칭</h3>
                <p className="text-gray-600">프로젝트 등록 시 관심 있는 메이커가 자동으로 견적 제출</p>
              </div>
            </div>
          </div>
        </section>
      </>
      )}

      {/* 가격 정책 Section */}
      <section className="py-10 md:py-20 bg-gray-50 px-4 md:px-0">
        <div className="w-full max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-8 md:mb-12 text-center">가격 정책</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {activeTab === 'freelancer' ? (
            <div className="bg-white p-4 md:p-8 rounded-lg shadow-sm border-2 border-green-200">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 text-center">프리랜서</h3>
              <div className="text-center mb-6">
                <span className="text-3xl md:text-4xl font-bold text-green-600">무료</span>
                <p className="text-gray-600 mt-2">프로필 등록 및 프로젝트 지원</p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>무료 프로필 등록</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>무제한 프로젝트 지원</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>팀 구성 및 관리</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>포트폴리오 무제한 등록</span>
                </li>
              </ul>
            </div>
            ) : (
            <div className="bg-white p-4 md:p-8 rounded-lg shadow-sm border-2 border-blue-200">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 text-center">기업</h3>
              <div className="text-center mb-6">
                <span className="text-3xl md:text-4xl font-bold text-blue-600">월 2,000원</span>
                <p className="text-gray-600 mt-2">첫 달 무료</p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span>무료 견적 비교</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span>연락처 확인 시에만 결제</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span>프로젝트 무제한 등록</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <span>메이커 검색 및 북마크</span>
                </li>
              </ul>
            </div>
            )}
          </div>
        </div>
      </section>

      {/* 마지막 CTA Section */}
      <section className="py-10 md:py-20 bg-white px-4 md:px-0">
        <div className="w-full max-w-6xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-6">지금 바로 시작하세요</h2>
          <p className="text-base md:text-xl text-gray-600 mb-6 md:mb-8">
            {activeTab === 'freelancer' 
              ? 'LINKUS와 함께 새로운 기회를 찾아보세요'
              : 'LINKUS와 함께 프로젝트를 시작하세요'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {activeTab === 'freelancer' ? (
            <Link 
              href="/auth?role=maker"
              className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors inline-flex items-center justify-center gap-2 shadow-lg"
            >
              무료 프로필 만들기
              <UserPlus className="w-5 h-5" />
            </Link>
            ) : (
            <Link 
              href="/enterprise/counsel-form"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2 shadow-lg"
            >
              견적 비교 시작하기
              <ArrowRight className="w-5 h-5" />
            </Link>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-10 md:py-20 bg-gray-50 px-4 md:px-0">
        <div className="w-full max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-8 md:mb-12 text-center">
            자주 묻는 질문
          </h2>
          
          {/* 기업용 FAQ */}
          {activeTab === 'company' && (
          <div className="mb-12 md:mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-blue-600 rounded"></div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">기업(프로젝트 의뢰자)용 FAQ</h3>
            </div>
          
          <div className="space-y-4 md:space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200">
                <h4 className="text-base md:text-lg font-semibold mb-3 text-gray-900">Q. 비용은 어떻게 되나요?</h4>
                <p className="text-gray-600 leading-relaxed mb-3">
                  견적 확인은 완전히 무료이며, 프리랜서 연락처를 열람할 때만 소액 결제가 발생합니다. 원치 않는 제안에 비용을 쓰지 않아도 되며, "필요할 때만 결제"하는 구조입니다.
                </p>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <span className="font-semibold">✅ 첫 달 무료</span> + 월 2,000원 정기 구독 시 → 무제한 열람 가능
                  </p>
                </div>
              </div>
              
              <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200">
                <h4 className="text-base md:text-lg font-semibold mb-3 text-gray-900">Q. 여러 명에게 견적을 받아볼 수 있나요?</h4>
                <p className="text-gray-600 leading-relaxed">
                  가능합니다. 프로젝트를 등록하면 관심 있는 프리랜서/팀이 자동으로 견적서를 제출하며, 비용 없이 여러 건을 비교할 수 있습니다.
                </p>
              </div>
              
              <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200">
                <h4 className="text-base md:text-lg font-semibold mb-3 text-gray-900">Q. 개발 관련 지식이 없어도 상담할 수 있나요?</h4>
                <p className="text-gray-600 leading-relaxed">
                  네. 아이디어·레퍼런스·예산만 있어도 등록 가능합니다. 기술적인 구조, 기능 정의, 일정 산출 등은 프리랜서 또는 매니저가 제안서 형태로 작성해드립니다.
                </p>
              </div>
              
              <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200">
                <h4 className="text-base md:text-lg font-semibold mb-3 text-gray-900">Q. 프리랜서 품질은 어떻게 검증되나요?</h4>
                <ul className="text-gray-600 leading-relaxed space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>프로필·기술스택·포트폴리오 검수 후 등록</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>팀 단위 수행 가능 (매니저 + 메이커 구성 가능)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>기업이 직접 이력·리뷰·작업 기록을 확인하고 결정할 수 있음</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200">
                <h4 className="text-base md:text-lg font-semibold mb-3 text-gray-900">Q. 플랫폼 수수료가 있나요?</h4>
                <p className="text-gray-600 leading-relaxed mb-2">
                  <span className="font-semibold text-red-600">❌ 없습니다.</span>
                </p>
                <p className="text-gray-600 leading-relaxed">
                  계약 금액과 무관하게 추가 수수료·중개 수수료 0원, 오직 "연락처 열람 비용"만 발생합니다.
                </p>
              </div>
              
              <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200">
                <h4 className="text-base md:text-lg font-semibold mb-3 text-gray-900">Q. 계약과 결제는 어떻게 진행되나요?</h4>
                <p className="text-gray-600 leading-relaxed">
                  링커스는 중개 결제에 개입하지 않습니다. 기업과 프리랜서가 직접 협의·계약하며, 추후 에스크로/계약서 템플릿 기능은 업데이트 예정입니다. (V2)
                </p>
              </div>
            </div>
          </div>
          )}

          {/* 프리랜서용 FAQ */}
          {activeTab === 'freelancer' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-green-600 rounded"></div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">프리랜서 / 팀(메이커·매니저)용 FAQ</h3>
            </div>
            
            <div className="space-y-4 md:space-y-6">
              <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200">
                <h4 className="text-base md:text-lg font-semibold mb-3 text-gray-900">Q. 링커스에 등록하면 어떤 이점이 있나요?</h4>
                <ul className="text-gray-600 leading-relaxed space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>기업이 먼저 견적 요청을 보내는 구조 → 영업 부담 ↓</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>견적서를 제출하면 기업이 연락처를 유료로 열람 → "진짜 의향 있는 고객"만 연결됨</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>팀을 구성해 프로젝트 단위로 제안 가능 (매니저 ↔ 메이커 역할 분리)</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200">
                <h4 className="text-base md:text-lg font-semibold mb-3 text-gray-900">Q. 견적서를 보내는 데 비용이 드나요?</h4>
                <p className="text-gray-600 leading-relaxed mb-2">
                  <span className="font-semibold text-red-600">❌ 무료입니다.</span>
                </p>
                <p className="text-gray-600 leading-relaxed">
                  프리랜서는 언제든지 견적을 제출할 수 있고, 기업이 내 연락처를 열람할 때만 비용이 발생합니다. (기업이 지불)
                </p>
              </div>
              
              <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200">
                <h4 className="text-base md:text-lg font-semibold mb-3 text-gray-900">Q. 팀을 만들어서 제안할 수 있나요?</h4>
                <p className="text-gray-600 leading-relaxed mb-3">
                  가능합니다.
                </p>
                <ul className="text-gray-600 leading-relaxed space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>매니저형 프리랜서가 팀 생성 → 메이커 초대</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>백엔드·프론트·디자인 등 역할별 구성 가능</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>팀 명의로 견적 제출도 가능 (MVP에 포함 여부 선택 가능)</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200">
                <h4 className="text-base md:text-lg font-semibold mb-3 text-gray-900">Q. 개발자가 아니라 기획자·PM도 등록할 수 있나요?</h4>
                <p className="text-gray-600 leading-relaxed">
                  네. 링커스는 개발자 전용 플랫폼이 아닙니다. → PM, 기획, 디자이너, 마케터, AI 프롬프트 엔지니어 등 가능 → "매니저형 프로필"로 등록하면 프로젝트 관리/제안/견적 작성 가능
                </p>
              </div>
              
              <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200">
                <h4 className="text-base md:text-lg font-semibold mb-3 text-gray-900">Q. 수익은 어떻게 발생하나요?</h4>
                <p className="text-gray-600 leading-relaxed">
                  기업이 연락처를 구매하고 프로젝트 계약이 체결되면, 프리랜서는 100% 금액을 직접 수령합니다. 수수료·커미션 0% → 정산 부담 없음.
                </p>
              </div>
              
              <div className="bg-white p-6 md:p-8 rounded-xl border border-gray-200">
                <h4 className="text-base md:text-lg font-semibold mb-3 text-gray-900">Q. 내 연락처는 아무나 볼 수 있나요?</h4>
                <p className="text-gray-600 leading-relaxed mb-2">
                  <span className="font-semibold text-red-600">❌ 무작위로 공개되지 않습니다.</span>
                </p>
                <ul className="text-gray-600 leading-relaxed space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>프로필은 공개되지만 연락처는 비공개</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>기업이 결제한 경우에만 연락처가 열람됨</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>스팸 연락 또는 무의미한 문의를 최소화하는 구조</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 md:px-0">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">LINKUS</h3>
              <p className="text-gray-400">
                프리랜서와 기업을 연결하는<br />
                초고속 서비스 제작 플랫폼
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">서비스</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/enterprise/counsel-form" className="hover:text-white">프로젝트 상담</Link></li>
                <li><Link href="/auth?role=maker" className="hover:text-white">메이커 등록</Link></li>
                <li><Link href="/search-makers" className="hover:text-white">메이커 찾기</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">문의</h4>
              <p className="text-gray-400 mb-2">이메일: suhyeonjan10@gmail.com</p>
              <p className="text-gray-400">전화: 010-4081-4151</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LINKUS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
