'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import {
  Upload,
  FileText,
  Search,
  BarChart3,
  FileCheck,
  ArrowRight,
  Sparkles,
  Clock,
  Shield,
  CheckCircle2,
} from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  const steps = [
    {
      number: 1,
      title: '공고 업로드',
      description: 'PDF 파일을 드래그 앤 드롭',
      icon: Upload,
      color: 'blue',
    },
    {
      number: 2,
      title: 'AI 분석',
      description: '요구사항·예산·기간 자동 추출',
      icon: FileText,
      color: 'emerald',
    },
    {
      number: 3,
      title: '팀 매칭',
      description: '의미 기반 검색으로 최적 팀 추천',
      icon: Search,
      color: 'purple',
    },
    {
      number: 4,
      title: '견적 비교',
      description: '그래프와 표로 한눈에 비교',
      icon: BarChart3,
      color: 'amber',
    },
    {
      number: 5,
      title: '계약 진행',
      description: '선택한 팀과 바로 계약',
      icon: FileCheck,
      color: 'green',
    },
  ]

  const features = [
    {
      icon: Sparkles,
      title: 'AI 자동 분석',
      description: 'PDF 공고를 업로드하면 AI가 자동으로 요구기술, 예산 범위, 프로젝트 기간을 추출합니다.',
      color: 'blue',
    },
    {
      icon: Search,
      title: '스마트 매칭',
      description: '의미 기반 검색으로 공고에 가장 적합한 팀을 추천합니다. 이력, 스택, 평점, 지역을 종합 고려합니다.',
      color: 'emerald',
    },
    {
      icon: BarChart3,
      title: '견적 비교',
      description: '여러 팀의 견적을 그래프와 표로 시각화하여 쉽게 비교할 수 있습니다.',
      color: 'purple',
    },
    {
      icon: Shield,
      title: '근거 기반',
      description: '모든 AI 생성 내용은 [id:###] 형식으로 근거를 표기하여 투명성을 보장합니다.',
      color: 'amber',
    },
  ]

  const benefits = [
    '90초만에 전체 프로세스 완료',
    '수작업 시간 90% 절감',
    'AI 기반 정확한 매칭',
    '견적 품질 편차 최소화',
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-20 lg:py-32">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                공공 프로젝트 AI 견적 자동화
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900 leading-tight">
                조달 공고를 업로드하면
                <br />
                <span className="text-blue-600">AI가 모든 것을 처리합니다</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
                요구사항 분석부터 팀 매칭, 견적 비교까지
                <br />
                <strong className="text-slate-900">90초</strong>만에 완료하세요
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={() => router.push('/upload')}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  무료로 시작하기
                </Button>
                <Button
                  onClick={() => router.push('/upload')}
                  variant="outline"
                  className="border-2 border-slate-300 rounded-xl px-8 py-4 text-lg font-semibold hover:bg-slate-50"
                  size="lg"
                >
                  데모 보기
                </Button>
              </div>
            </div>

            {/* 플로우 시각화 */}
            <div className="mt-16">
              <h2 className="text-2xl font-semibold text-center mb-8 text-slate-900">
                5단계 간단한 프로세스
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {steps.map((step, index) => {
                  const Icon = step.icon
                  const colorClasses = {
                    blue: 'bg-blue-100 text-blue-600',
                    emerald: 'bg-emerald-100 text-emerald-600',
                    purple: 'bg-purple-100 text-purple-600',
                    amber: 'bg-amber-100 text-amber-600',
                    green: 'bg-green-100 text-green-600',
                  }

                  return (
                    <div key={step.number} className="relative">
                      <div className="rounded-2xl border border-slate-200 p-6 bg-white shadow-sm hover:shadow-md transition-shadow text-center">
                        <div
                          className={`w-16 h-16 ${colorClasses[step.color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center mx-auto mb-4`}
                        >
                          <Icon className="w-8 h-8" />
                        </div>
                        <div className="text-sm font-semibold text-blue-600 mb-2">
                          STEP {step.number}
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-slate-900">
                          {step.title}
                        </h3>
                        <p className="text-sm text-slate-600">{step.description}</p>
                      </div>
                      {index < steps.length - 1 && (
                        <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                          <ArrowRight className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-slate-900">
                핵심 기능
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                나라장터/NTIS 공고를 업로드하면 AI가 모든 것을 자동으로 처리합니다
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                const colorClasses = {
                  blue: 'bg-blue-100 text-blue-600',
                  emerald: 'bg-emerald-100 text-emerald-600',
                  purple: 'bg-purple-100 text-purple-600',
                  amber: 'bg-amber-100 text-amber-600',
                }

                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-12 h-12 ${colorClasses[feature.color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center flex-shrink-0`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2 text-slate-900">
                          {feature.title}
                        </h3>
                        <p className="text-slate-600">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-slate-900">
                왜 Linkus Public인가요?
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200"
                >
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  <span className="text-slate-700 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">90초</div>
                <div className="text-slate-600">전체 프로세스 완료 시간</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-emerald-600 mb-2">90%</div>
                <div className="text-slate-600">수작업 시간 절감</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">100%</div>
                <div className="text-slate-600">근거 기반 투명성</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <Clock className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl mb-8 opacity-90">
              90초만에 공고 분석부터 계약 진행까지 완료할 수 있습니다.
              <br />
              무료로 체험해보세요.
            </p>
            <Button
              onClick={() => router.push('/upload')}
              className="bg-white text-blue-600 hover:bg-slate-100 rounded-xl px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              공고 업로드 시작하기
            </Button>
            <p className="mt-6 text-sm opacity-75">
              신용카드 불필요 · 무료 체험 가능
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
