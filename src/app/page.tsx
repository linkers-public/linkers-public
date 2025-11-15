'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import {
  Upload,
  FileText,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Briefcase,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  const features = [
    {
      icon: Shield,
      title: 'AI 계약서 분석',
      description: '근로계약서를 업로드하면 AI가 자동으로 문제가 될 수 있는 조항을 찾아드립니다.',
      color: 'blue',
    },
    {
      icon: FileText,
      title: '법령 기반 검토',
      description: '근거가 되는 법령과 표준계약 문장을 제시하여 투명한 검토를 제공합니다.',
      color: 'emerald',
    },
    {
      icon: CheckCircle2,
      title: '권장 대응 가이드',
      description: '각 문제 조항에 대한 구체적인 대응 방법(협상, 수정 요청, 상담)을 안내합니다.',
      color: 'purple',
    },
    {
      icon: AlertTriangle,
      title: '위험도 평가',
      description: '전체 위험도를 0~100 점수로 표시하여 한눈에 파악할 수 있습니다.',
      color: 'amber',
    },
  ]

  const benefits = [
    '계약서 주요 조항 자동 분석',
    '법령 근거 기반 검토',
    '상황별 맞춤 상담 가이드',
    '무료로 시작 가능',
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
                AI 계약서 검토 서비스
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900 leading-tight">
                첫 계약, AI와 함께
                <br />
                <span className="text-blue-600">점검해보세요</span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
                근로계약서의 문제 조항을 AI가 자동으로 찾아드립니다
                <br />
                법령 근거와 함께 <strong className="text-slate-900">권장 대응 방법</strong>을 제시합니다
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button
                  onClick={() => router.push('/upload')}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                  size="lg"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  계약서 업로드하기
                </Button>
                <Button
                  onClick={() => router.push('/guide')}
                  variant="outline"
                  className="border-2 border-blue-600 text-blue-600 rounded-xl px-8 py-4 text-lg font-semibold hover:bg-blue-50"
                  size="lg"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  근로조건 간단 체크
                </Button>
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
                근로계약서를 업로드하면 AI가 자동으로 문제 조항을 분석하고 대응 방법을 제시합니다
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
                왜 우리 서비스를 선택해야 할까요?
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
                <div className="text-4xl font-bold text-blue-600 mb-2">4개</div>
                <div className="text-slate-600">주요 조항 카테고리 분석</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-emerald-600 mb-2">100%</div>
                <div className="text-slate-600">법령 근거 기반 검토</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">무료</div>
                <div className="text-slate-600">기본 검토 서비스</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-emerald-600 text-white">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <Shield className="w-16 h-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl mb-8 opacity-90">
              계약서를 업로드하면 AI가 자동으로 문제 조항을 분석합니다.
              <br />
              무료로 체험해보세요.
            </p>
            <Button
              onClick={() => router.push('/upload')}
              className="bg-white text-blue-600 hover:bg-slate-100 rounded-xl px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              계약서 업로드하기
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
