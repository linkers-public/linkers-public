import React from 'react'
import { ArrowRight, Clock, DollarSign, Users, CheckCircle, Zap, Target, Rocket, MessageCircle, UserPlus } from 'lucide-react'
import Link from 'next/link'

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      {/* Hero Section - 프리랜서 중심 */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight px-4">
            개발자 어디서 찾아야 할지<br />
            <span className="text-blue-600">막막하다면?</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-2 max-w-3xl mx-auto px-4">
            견적은 공짜, 연락할 때만 결제!
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-6 md:mb-8 px-4">
            부담 없이 먼저 받아보고 선택하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link 
              href="/auth?role=maker"
              className="bg-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              무료 프로필 만들기
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <Link 
              href="/enterprise/counsel-form"
              className="bg-white text-blue-600 border-2 border-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              프로젝트 등록하기
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 프리랜서 How it Works Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
            프리랜서는 이렇게 활동합니다
          </h2>
          <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            AI 툴을 활용하는 개발자라면 누구나 참여할 수 있습니다.<br />
            프로젝트 경험을 쌓고, 안정적인 수익 기회를 확보하세요.
          </p>
          
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">프로필 등록</h3>
              <p className="text-sm text-gray-600">무료로 프로필을 만들고 포트폴리오를 등록하세요</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">프로젝트 매칭</h3>
              <p className="text-sm text-gray-600">맞춤형 프로젝트 제안을 받아보세요</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">견적 제출 & 계약</h3>
              <p className="text-sm text-gray-600">견적서를 제출하고 계약을 체결하세요</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">작업 & 보상</h3>
              <p className="text-sm text-gray-600">프로젝트를 완료하고 보상을 받으세요</p>
            </div>
          </div>
          
          <div className="text-center">
            <Link 
              href="/auth?role=maker"
              className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              무료 프로필 만들기
              <UserPlus className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 프리랜서 혜택 Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">프리랜서가 선택하는 이유</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">자유로운 일정</h3>
              <p className="text-gray-600">원하는 시간에 프로젝트를 선택하고 작업하세요</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">공정한 보상</h3>
              <p className="text-gray-600">투명한 견적 시스템으로 합리적인 보상을 받으세요</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">팀 프로젝트</h3>
              <p className="text-gray-600">팀을 구성하여 대규모 프로젝트에도 참여 가능</p>
            </div>
          </div>
        </div>
      </section>

      {/* 기업 Section - 아래쪽 배치 */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            클라이언트는 이렇게 사용해요
          </h2>
          <p className="text-lg text-gray-600 mb-12 text-center max-w-3xl mx-auto">
            비교 견적은 무료, 실제 컨택 시에만 비용이 발생합니다.
          </p>
          
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">상담 신청</h3>
              <p className="text-sm text-gray-600">요구사항/예산/기간 입력</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">메이커 매칭</h3>
              <p className="text-sm text-gray-600">적합한 프리랜서 추천</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">견적 비교</h3>
              <p className="text-sm text-gray-600">최적의 조건 선택</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">MVP 런칭</h3>
              <p className="text-sm text-gray-600">클라우드 배포까지 지원</p>
            </div>
          </div>
        </div>
      </section>

      {/* 가격 정책 Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">가격 정책</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border-2 border-green-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">프리랜서</h3>
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-green-600">무료</span>
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
            <div className="bg-white p-8 rounded-lg shadow-sm border-2 border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">기업</h3>
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-blue-600">월 2,000원</span>
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
          </div>
        </div>
      </section>

      {/* 마지막 CTA Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">지금 바로 시작하세요</h2>
          <p className="text-xl text-gray-600 mb-8">
            LINKUS와 함께 프로젝트를 시작하거나 새로운 기회를 찾아보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth?role=maker"
              className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors inline-flex items-center justify-center gap-2 shadow-lg"
            >
              무료 프로필 만들기
              <UserPlus className="w-5 h-5" />
            </Link>
            <Link 
              href="/enterprise/counsel-form"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              견적 비교 시작하기
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            자주 묻는 질문
          </h2>
          
          <div className="space-y-6">
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">비용은 얼마나 드나요?</h3>
              <p className="text-gray-600">프로젝트 범위에 따라 달라집니다. AI 활용으로 기존 대비 30% 이상 비용을 절감할 수 있습니다.</p>
            </div>
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">AI가 만든 코드 품질은 괜찮나요?</h3>
              <p className="text-gray-600">메이커가 검수하고 운영까지 지원합니다. 전문 개발자의 품질 관리로 안정적인 서비스를 제공합니다.</p>
            </div>
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-2">개발자가 아니어도 상담 가능한가요?</h3>
              <p className="text-gray-600">네, 아이디어만 있으면 충분합니다. 기술적인 부분은 메이커가 모두 담당해드립니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
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
