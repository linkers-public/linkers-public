import React from 'react'
import { ArrowRight, Clock, DollarSign, Users, CheckCircle, Zap, Target, Rocket, MessageCircle, UserPlus } from 'lucide-react'
import Link from 'next/link'

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            개발팀 없어도,<br />
            <span className="text-blue-600">2주 만에 AI+메이커</span>로<br />
            MVP를 만들어 드립니다.
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI 코더와 프리랜서 개발자가 함께하는 초고속 서비스 제작 플랫폼
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/enterprise/counsel-form"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              프로젝트 상담 신청하기
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/auth?role=maker"
              className="bg-white text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              프리랜서 등록하기
              <UserPlus className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Makers는 어떤 서비스인가요?
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Makers는 AI 코더에 익숙한 프리랜서(메이커)와 빠른 실험이 필요한 기업을 연결하는 매칭 플랫폼입니다.<br />
            아이디어만 있으면, 개발팀 없이도 서비스를 만들 수 있습니다.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">빠른 제작</h3>
              <p className="text-gray-600">2주 MVP 제작</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">합리적 비용</h3>
              <p className="text-gray-600">AI 활용으로 30% 이상 비용 절감</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">전문 매칭</h3>
              <p className="text-gray-600">프로젝트 맞춤형 메이커 연결</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            기업은 이렇게 사용합니다
          </h2>
          
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
          
          <div className="text-center">
            <Link 
              href="/enterprise/counsel-form"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              프로젝트 상담 신청하기
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Maker Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
            메이커는 이렇게 활동합니다
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
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">프로젝트 매칭</h3>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">견적 제출 & 계약</h3>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold mb-2">작업 & 보상</h3>
            </div>
          </div>
          
          <div className="text-center">
            <Link 
              href="/auth?role=maker"
              className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors inline-flex items-center gap-2"
            >
              프리랜서 등록하기
              <UserPlus className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Success Cases Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            이런 기업이 Makers를 찾습니다
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-blue-600">스타트업</h3>
              <p className="text-gray-600">빠른 아이디어 검증이 필요할 때</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-green-600">중소기업</h3>
              <p className="text-gray-600">신사업 PoC를 저비용으로 실험할 때</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-purple-600">개인 창업자</h3>
              <p className="text-gray-600">MVP를 빠르게 출시하고 싶을 때</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-white">
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
              <h3 className="text-xl font-bold mb-4">Makers</h3>
              <p className="text-gray-400">
                AI와 프리랜서를 연결하는<br />
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
              <p className="text-gray-400">이메일: contact@makers.com</p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Makers. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
