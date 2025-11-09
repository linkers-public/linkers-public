'use client'

import React, { useState } from 'react'
import { ChevronDown, CheckCircle, FileText, Users, BriefcaseBusiness, Compass, ClipboardList, Shuffle } from 'lucide-react'
import Link from 'next/link'

const LandingPage = () => {
  const [serviceMode, setServiceMode] = useState<'enterprise' | 'freelancer'>('enterprise')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const buildLoginRedirect = (target: string) => `/auth?redirect=${encodeURIComponent(target)}`

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const serviceFlows = {
    enterprise: [
      { title: '프로젝트 베이스 견적서 작성', description: '요구사항과 예산을 기반으로 프로젝트 정보를 등록합니다.' },
      { title: '메이커 매칭', description: '검증된 프리랜서(메이커)와 자동으로 연결됩니다.' },
      { title: '견적 비교', description: '여러 팀이 제출한 세부 견적서를 비교할 수 있습니다.' },
      { title: '팀 제출 견적서 중 채택', description: '가장 적합한 팀을 선택하고 프로젝트를 시작합니다.' },
    ],
    freelancer: [
      { title: '프로필 등록', description: '역량과 포트폴리오를 등록해 신뢰도를 높이세요.' },
      { title: '프로젝트 매칭', description: '기업이 등록한 프로젝트에 대한 제안을 받아보세요.' },
      { title: '견적 제출 및 계약', description: '세부 견적서를 작성해 제안하고 계약을 성사시키세요.' },
      { title: '작업 & 보상', description: '프로젝트를 수행하고 합의된 보상을 받습니다.' },
    ],
  } as const

  const serviceIcons = {
    enterprise: [FileText, Users, ClipboardList, CheckCircle],
    freelancer: [Users, Shuffle, ClipboardList, CheckCircle],
  } as const

  const faqs = [
    {
      question: '매칭 프로세스는 어떻게 되나요?',
      answer: '기업이 프로젝트 개요를 등록 → 프리랜서(매니저)가 세부 견적서를 제출 → 기업이 선택 후 계약',
    },
    {
      question: '결제 모델은 어떻게 되나요?',
      answer: '기업이 프리랜서(매니저)의 세부 견적서를 확인할 때마다 이용권 1개가 차감됩니다.',
    },
    {
      question: '팀 구성은 어떻게 하나요?',
      answer: '메이커로 등록하면 다른 프리랜서(매니저)가 제안할 수 있으며, 유연하게 팀을 구성할 수 있습니다.',
    },
  ]

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 pb-28">
      <main className="flex w-full flex-col">
        {/* Main CTA Section */}
        <section className="w-full px-4 pt-0 pb-12 text-center sm:px-6 md:pt-4 md:pb-16 lg:px-8 lg:pt-6 lg:pb-20">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
              IT 프로젝트의 시작,<br />
              <span className="text-blue-600">Linkus에서</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg md:mt-6 md:text-xl">
              검증된 프리랜서와 함께 팀을 구성하고, 아이디어를 현실로 만드세요.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row md:gap-4">
              <Link
                href={buildLoginRedirect('/enterprise/counsel-form')}
                className="rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl sm:px-8 md:px-10 md:py-4 md:text-lg"
              >
                견적서 작성하기
              </Link>
              <Link
                href={buildLoginRedirect('/search-projects')}
                className="rounded-lg border-2 border-blue-600 bg-white px-6 py-3 text-base font-semibold text-blue-600 transition-all hover:bg-blue-50 sm:px-8 md:px-10 md:py-4 md:text-lg"
              >
                내가 참여할 프로젝트 둘러보기
              </Link>
            </div>
          </div>
        </section>

        {/* Role Introduction Section */}
        <section className="w-full bg-white/70 px-4 py-8 sm:px-6 md:py-14 lg:px-8">
          <div className="mx-auto max-w-6xl space-y-8 md:space-y-10">
            <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-2">
              <div className="rounded-2xl border border-blue-50 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:p-7">
                <div className="mb-4 flex items-center gap-3">
                  <BriefcaseBusiness className="h-10 w-10 text-blue-500" />
                  <h3 className="text-xl font-bold text-gray-900 md:text-2xl">기업</h3>
                </div>
                <p className="mb-6 text-sm leading-relaxed text-gray-600 md:text-base">
                  개발자가 필요하지만 어디서 찾아야 할지 막막하신가요?
                  <br />
                  프로젝트에 맞는 맞춤 견적서를 간편하게 받아보세요.
                  <br />
                  부담 없이 먼저 확인하고, 가장 잘 맞는 팀을 선택하세요.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={buildLoginRedirect('/enterprise/counsel-form')}
                    className="flex-1 rounded-lg bg-blue-600 py-3 text-center font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    프로젝트 등록하기
                  </Link>
                  <Link
                    href="/enterprise"
                    className="flex-1 rounded-lg border border-blue-200 py-3 text-center font-semibold text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    더 알아보기
                  </Link>
                </div>
              </div>
              <div className="rounded-2xl border border-cyan-50 bg-white p-6 shadow-sm transition-shadow hover:shadow-md md:p-7">
                <div className="mb-4 flex items-center gap-3">
                  <Users className="h-10 w-10 text-cyan-500" />
                  <h3 className="text-xl font-bold text-gray-900 md:text-2xl">프리랜서</h3>
                </div>
                <p className="mb-6 text-sm leading-relaxed text-gray-600 md:text-base">
                  지금 바로 프리랜서로 활동을 시작해보세요.
                  <br />
                  기업이 올린 프로젝트 개요를 확인하고 세부 견적서를 작성해 제안할 수 있습니다.
                  <br />
                  매니저로 팀을 이끌며 기업과 직접 조율하는 리드 역할을 경험하세요.
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={buildLoginRedirect('/auth?role=maker')}
                    className="flex-1 rounded-lg bg-cyan-600 py-3 text-center font-semibold text-white transition-colors hover:bg-cyan-700"
                  >
                    무료 프로필 만들기
                  </Link>
                  <Link
                    href="/(home)/team-projects"
                    className="flex-1 rounded-lg border border-cyan-200 py-3 text-center font-semibold text-cyan-600 transition-colors hover:bg-cyan-50"
                  >
                    더 알아보기
                  </Link>
                </div>
              </div>
            </div>

        {/* Service Toggle Section */}
        <section className="w-full bg-white/60 px-4 py-12 sm:px-6 md:py-16 lg:px-8">
          <div className="mx-auto max-w-6xl text-center">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">
              서비스 전환
            </span>
            <h2 className="mt-3 text-2xl font-bold text-gray-900 md:text-3xl">
              기업과 프리랜서를 위한 맞춤 흐름을 확인하세요
            </h2>
            <div className="mx-auto mt-6 inline-flex items-center rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setServiceMode('enterprise')}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition-all md:px-6 md:py-2.5 md:text-base ${
                  serviceMode === 'enterprise'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                기업
              </button>
              <button
                onClick={() => setServiceMode('freelancer')}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition-all md:px-6 md:py-2.5 md:text-base ${
                  serviceMode === 'freelancer'
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                프리랜서
              </button>
            </div>
          </div>
          <div className="mx-auto mt-10 grid w-full max-w-6xl grid-cols-1 gap-5 md:mt-12 md:gap-6 lg:grid-cols-4">
            {serviceFlows[serviceMode].map((item, index) => {
              const Icon = serviceIcons[serviceMode][index]
              return (
                <div
                  key={item.title}
                  className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md md:p-6"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                        serviceMode === 'enterprise' ? 'bg-blue-50 text-blue-600' : 'bg-cyan-50 text-cyan-600'
                      } md:h-14 md:w-14`}
                    >
                      <Icon className="h-6 w-6 md:h-7 md:w-7" />
                    </div>
                    <div className="text-left">
                      <span
                        className={`text-xs font-semibold uppercase tracking-wide ${
                          serviceMode === 'enterprise' ? 'text-blue-500' : 'text-cyan-500'
                        }`}
                      >
                        Step {index + 1}
                      </span>
                      <h3 className="mt-2 text-lg font-bold text-gray-900">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
            <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm md:p-8">
              <div className="mx-auto max-w-4xl space-y-6 text-center">
                <h4 className="text-lg font-bold text-blue-700 md:text-xl">메이커와 매니저, 두 가지 역할로 활동하세요</h4>
                <p className="text-sm leading-relaxed text-gray-600 md:text-base">
                  프로젝트마다 역할을 선택할 수 있습니다. 직접 개발에 참여하거나 팀을 이끌며 프로젝트를 관리하세요.
                </p>
              </div>
              <div className="mt-10 grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-2">
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-6 md:p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Maker</p>
                      <h5 className="text-lg font-bold text-gray-900 md:text-xl">개발 작업 수행</h5>
                    </div>
                  </div>
                  <p className="mb-5 text-sm text-gray-600 md:text-base">
                    프로젝트에 직접 참여하여 개발 작업을 수행하는 역할입니다.
                  </p>
                  <ul className="space-y-3 text-sm text-gray-700 md:text-base">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-blue-500" />
                      <span>프로젝트에 직접 참여하여 개발 작업 수행</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-blue-500" />
                      <span>개인 또는 팀 프로젝트에서 개발자로 활동</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-blue-500" />
                      <span>코딩, 디자인, 개발 작업에 집중</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-6 md:p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <Compass className="h-8 w-8 text-cyan-500" />
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-600">Manager</p>
                      <h5 className="text-lg font-bold text-gray-900 md:text-xl">프로젝트 관리</h5>
                    </div>
                  </div>
                  <p className="mb-5 text-sm text-gray-600 md:text-base">
                    팀을 구성하고 프로젝트를 관리하며 클라이언트와 소통하는 역할입니다.
                  </p>
                  <ul className="space-y-3 text-sm text-gray-700 md:text-base">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-cyan-500" />
                      <span>팀을 구성하고 프로젝트 전체를 관리</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-cyan-500" />
                      <span>클라이언트와 소통하며 요구사항 조율</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-cyan-500" />
                      <span>프로젝트 일정 및 품질 관리</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/80 p-5 text-center md:p-6">
                <p className="text-sm font-medium text-blue-700 md:text-base">
                  유연한 역할 전환: 프로젝트마다 필요에 따라 메이커와 매니저 역할을 전환할 수 있습니다.
                  <br />
                  한 프로젝트에서는 메이커로, 다른 프로젝트에서는 매니저로 활동하세요.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Event Section */}
        <section className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-12 text-white sm:px-6 md:py-20 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 space-y-3 text-center">
              <p className="text-lg font-semibold md:text-xl">
                프리랜서에 대한 리뷰 작성 시, 세부 견적서 확인권 1개 제공
              </p>
              <p className="text-sm text-white/80 md:text-base">
                결제 모델은 세부 견적서 확인 토큰으로 운영됩니다.
              </p>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-white/20 bg-blue-500/20 shadow-2xl">
              <div className="flex h-48 items-center justify-center px-6 text-center md:h-56 lg:h-64 md:px-12">
                <div className="max-w-2xl space-y-3">
                  <p className="text-xl font-semibold md:text-2xl">
                    LINKUS에 리뷰를 남기면 세부 견적서 확인권을 지급해 드립니다.
                  </p>
                  <p className="text-sm leading-relaxed text-white/80 md:text-base">
                    프로젝트가 종료된 후 프리랜서에 대한 리뷰를 작성해 주세요.
                    <br />
                    작성 완료 시 세부 견적서 확인권 1개가 추가 지급되어, 더 많은 팀의 견적서를 확인할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="w-full bg-white px-4 py-12 sm:px-6 md:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold text-gray-900 md:text-4xl">
              자주 묻는 질문
            </h2>
            <div className="mt-8 space-y-4 md:mt-12">
              {faqs.map((faq, index) => (
                <div
                  key={faq.question}
                  className="overflow-hidden rounded-lg border border-gray-200 transition-all hover:shadow-md"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-gray-100 md:px-6 md:py-5"
                  >
                    <span className="pr-4 text-base font-semibold text-gray-900 md:text-lg">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 flex-shrink-0 text-gray-600 transition-transform ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openFaq === index && (
                    <div className="border-t border-gray-200 bg-white px-4 py-4 text-sm text-gray-600 animate-in slide-in-from-top-2 md:px-6 md:py-5 md:text-base">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-900 px-4 py-8 text-white sm:px-6 md:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <div className="text-xl font-bold md:text-2xl">LINKUS</div>
          <p className="mt-2 text-sm text-gray-400 md:text-base">
            &copy; 2024 LINKUS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage

