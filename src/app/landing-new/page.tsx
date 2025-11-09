'use client'

import React, { useState } from 'react'
import { ChevronRight, ChevronLeft, ChevronDown, CheckCircle, FileText, Users, BriefcaseBusiness, Compass, Sparkle } from 'lucide-react'
import Link from 'next/link'

const LandingNewPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const slides = [
    { id: 1, image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=400&fit=crop' },
    { id: 2, image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop' },
    { id: 3, image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=400&fit=crop' },
  ]

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const faqs = [
    {
      question: '매칭 프로세스는 어떻게 되나요?',
      answer: '기업 견적 → 팀 제안 → 견적 제출 → 계약',
    },
    {
      question: '수수료 정책은 어떻게 되나요?',
      answer: '계약 성사 시 플랫폼 수수료 10%',
    },
    {
      question: '팀 구성은 어떻게 하나요?',
      answer: '개인 등록 후 다른 프리랜서에게 제안 가능',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 pb-28">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-6">
            <div className="flex items-center gap-8">
              <div className="text-2xl md:text-3xl font-bold text-blue-600">LINKUS</div>
              <nav className="hidden md:flex items-center gap-6 text-sm md:text-base font-medium text-gray-600">
                <Link href="/search-projects" className="hover:text-blue-600 transition-colors">
                  전체 프로젝트
                </Link>
                <Link href="/search-makers" className="hover:text-blue-600 transition-colors">
                  프리랜서 팀
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <nav className="flex md:hidden items-center gap-4 text-sm font-medium text-gray-600">
                <Link href="/search-projects" className="hover:text-blue-600 transition-colors">
                  전체 프로젝트
                </Link>
                <Link href="/search-makers" className="hover:text-blue-600 transition-colors">
                  프리랜서 팀
                </Link>
              </nav>
              <button className="bg-blue-600 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm md:text-base font-semibold hover:bg-blue-700 transition-colors">
                로그인
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main CTA Section */}
      <section className="py-10 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-3 md:mb-5 leading-tight">
            IT 프로젝트의 시작,<br />
            <span className="text-blue-600">Linkus에서</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl mx-auto">
            검증된 프리랜서와 함께 팀을 구성하고, 아이디어를 현실로 만드세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
            <Link
              href="/enterprise/counsel-form"
              className="bg-blue-600 text-white px-6 sm:px-8 md:px-10 py-3 md:py-4 rounded-lg text-base md:text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              견적서 작성하기
            </Link>
            <Link
              href="/auth?role=maker"
              className="bg-white text-blue-600 border-2 border-blue-600 px-6 sm:px-8 md:px-10 py-3 md:py-4 rounded-lg text-base md:text-lg font-semibold hover:bg-blue-50 transition-all"
            >
              내가 참여할 프로젝트 둘러보기
            </Link>
          </div>
        </div>
      </section>

      {/* Role Introduction Section */}
      <section className="py-6 md:py-12 px-4 sm:px-6 lg:px-8 bg-white/70">
        <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white border border-blue-50 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <BriefcaseBusiness className="w-10 h-10 text-blue-500" />
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">기업</h3>
              </div>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-6">
                월 얼마로 나의 프로젝트에 대한 견적서를 받아보세요. 개발자 어디서 찾아야 할지 막막하다면?
                견적은 공짜, 연락할 때만 결제! 부담 없이 먼저 받아보고 선택하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/enterprise/counsel-form"
                  className="flex-1 bg-blue-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  프로젝트 등록하기
                </Link>
                <Link
                  href="/enterprise"
                  className="flex-1 text-blue-600 border border-blue-200 text-center py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  더 알아보기
                </Link>
              </div>
            </div>
            <div className="bg-white border border-cyan-50 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <Users className="w-10 h-10 text-cyan-500" />
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">프리랜서</h3>
              </div>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-6">
                프리랜서로 시작하세요. 무료로 프로필을 만들고 프로젝트에 참여하세요. 기업이 먼저 견적을 요청하는 구조로 영업 부담 없이 활동하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/auth?role=maker"
                  className="flex-1 bg-cyan-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
                >
                  무료 프로필 만들기
                </Link>
                <Link
                  href="/(home)/team-projects"
                  className="flex-1 text-cyan-600 border border-cyan-200 text-center py-3 rounded-lg font-semibold hover:bg-cyan-50 transition-colors"
                >
                  더 알아보기
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-blue-100 p-6 md:p-10 shadow-sm">
            <div className="max-w-4xl mx-auto text-center space-y-6">
              <h4 className="text-lg md:text-xl font-bold text-blue-700">메이커와 매니저, 두 가지 역할로 활동하세요</h4>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                프로젝트마다 역할을 선택할 수 있습니다. 직접 개발에 참여하거나 팀을 이끌며 프로젝트를 관리하세요.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              <div className="border border-blue-100 rounded-xl p-6 md:p-8 bg-blue-50/50">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Maker</p>
                    <h5 className="text-lg md:text-xl font-bold text-gray-900">개발 작업 수행</h5>
                  </div>
                </div>
                <p className="text-sm md:text-base text-gray-600 mb-5">
                  프로젝트에 직접 참여하여 개발 작업을 수행하는 역할입니다.
                </p>
                <ul className="space-y-3 text-sm md:text-base text-gray-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                    <span>프로젝트에 직접 참여하여 개발 작업 수행</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                    <span>개인 또는 팀 프로젝트에서 개발자로 활동</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                    <span>코딩, 디자인, 개발 작업에 집중</span>
                  </li>
                </ul>
              </div>
              <div className="border border-cyan-100 rounded-xl p-6 md:p-8 bg-cyan-50/50">
                <div className="flex items-center gap-3 mb-4">
                  <Compass className="w-8 h-8 text-cyan-500" />
                  <div>
                    <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wide">Manager</p>
                    <h5 className="text-lg md:text-xl font-bold text-gray-900">프로젝트 관리</h5>
                  </div>
                </div>
                <p className="text-sm md:text-base text-gray-600 mb-5">
                  팀을 구성하고 프로젝트를 관리하며 클라이언트와 소통하는 역할입니다.
                </p>
                <ul className="space-y-3 text-sm md:text-base text-gray-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-cyan-500 mt-0.5" />
                    <span>팀을 구성하고 프로젝트 전체를 관리</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-cyan-500 mt-0.5" />
                    <span>클라이언트와 소통하며 요구사항 조율</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-cyan-500 mt-0.5" />
                    <span>프로젝트 일정 및 품질 관리</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-8 bg-blue-50/80 border border-blue-100 rounded-xl p-5 md:p-6 text-center">
              <p className="text-sm md:text-base text-blue-700 font-medium">
                유연한 역할 전환: 같은 프로젝트에서도 필요에 따라 메이커와 매니저 역할을 전환할 수 있습니다. 한 프로젝트에서는 메이커로,
                다른 프로젝트에서는 매니저로 활동하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Event Carousel Section */}
      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 space-y-3">
            <p className="text-lg md:text-xl font-semibold">
              프리랜서에 대한 리뷰 작성 시, 세부 견적서 확인권 1개 제공
            </p>
            <p className="text-sm md:text-base text-white/80">
              결제 모델은 세부 견적서 확인 토큰으로 운영됩니다.
            </p>
          </div>
          
          {/* Carousel */}
          <div className="relative bg-white rounded-xl overflow-hidden shadow-2xl">
            <div className="relative h-48 md:h-64 lg:h-80">
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={`Slide ${slide.id}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            
            {/* Carousel Controls */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg transition-all"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            
            {/* Carousel Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI Estimate Section */}
      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-white/80">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-blue-100 rounded-2xl p-6 md:p-10 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start md:items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                  <Sparkle className="w-7 h-7 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">AI 견적 로드맵</h3>
                  <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                    추후 데이터가 쌓이면 RAG 방식으로 DB와 연동해 가격 정책을 자동으로 확인하고 LLM을 연동해 견적 상담을 자동화할 예정입니다.
                    MVP 단계에서는 핵심 UI만 구현되어 있으며, 향후 단계별로 고도화됩니다.
                  </p>
                </div>
              </div>
              <Link
                href="/"
                className="self-start md:self-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-sm md:text-base hover:bg-blue-700 transition-colors"
              >
                향후 계획 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-8 md:mb-12 text-center">
            자주 묻는 질문
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden transition-all hover:shadow-md"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-4 md:px-6 py-4 md:py-5 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-base md:text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-4 md:px-6 py-4 md:py-5 bg-white text-gray-600 text-sm md:text-base border-t border-gray-200 animate-in slide-in-from-top-2">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-xl md:text-2xl font-bold mb-4">LINKUS</div>
          <p className="text-gray-400 text-sm md:text-base">
            &copy; 2024 LINKUS. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Bottom Sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-4">
          <div className="bg-blue-600/95 backdrop-blur-md text-white rounded-2xl shadow-xl px-4 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="text-center sm:text-left">
              <p className="text-lg sm:text-xl font-semibold">지금 바로 프로젝트 매칭을 시작하세요!</p>
              <p className="text-sm sm:text-base text-white/80">견적서를 작성하거나 회원가입 후 프로젝트에 참여할 수 있습니다.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Link
                href="/enterprise/counsel-form"
                className="flex-1 sm:flex-none bg-white text-blue-600 font-semibold px-6 sm:px-7 py-3 rounded-lg text-center hover:bg-blue-50 transition-colors"
              >
                견적서 작성하기
              </Link>
              <Link
                href="/auth?role=maker"
                className="flex-1 sm:flex-none border border-white/70 text-white font-semibold px-6 sm:px-7 py-3 rounded-lg text-center hover:bg-white/10 transition-colors"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingNewPage

