'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Upload,
  FileText,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LegalLandingPage() {
  const router = useRouter()

  const features = [
    {
      icon: Shield,
      title: '법적 리스크 점검',
      description: '계약서나 법률 문서를 업로드하면 AI가 자동으로 법적 위험 요소를 분석하고 점검합니다.',
      color: 'blue',
    },
    {
      icon: FileText,
      title: '계약서 분석',
      description: '계약서의 문제 조항을 찾아내고 법적 근거와 함께 상세한 분석 결과를 제공합니다.',
      color: 'emerald',
    },
    {
      icon: Search,
      title: '법적 시나리오 제공',
      description: '입력한 법적 상황에 대해 관련 법률 시나리오와 대응 방법을 RAG 시스템으로 조회합니다.',
      color: 'purple',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-emerald-50 py-20 lg:py-32">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI 기반 법률 리스크 분석 시스템
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-slate-900 leading-tight">
              Linkus Legal
              <br />
              <span className="text-blue-600">청년 법률 리스크 탐지</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto">
              법률적 문제를 빠르고 쉽게 해결할 수 있도록 돕는
              <br />
              <strong className="text-slate-900">AI 기반 계약/노동 리스크 분석 시스템</strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => router.push('/legal/analysis')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                문서 업로드
              </Button>
              <Button
                onClick={() => router.push('/legal/analysis')}
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 rounded-xl px-8 py-4 text-lg font-semibold hover:bg-blue-50"
                size="lg"
              >
                <FileText className="w-5 h-5 mr-2" />
                법률 문제 분석 시작하기
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
              법률적 문제를 빠르고 정확하게 분석하고 해결 방법을 제시합니다
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600',
                emerald: 'bg-emerald-100 text-emerald-600',
                purple: 'bg-purple-100 text-purple-600',
              }

              return (
                <Card
                  key={index}
                  className="hover:shadow-lg transition-shadow border-slate-200"
                >
                  <CardHeader>
                    <div
                      className={`w-12 h-12 ${colorClasses[feature.color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center mb-4`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Service Introduction */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-slate-900">
              서비스 소개
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                  법적 리스크 점검
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  계약서나 법률 문서를 업로드하면 AI가 자동으로 법적 위험 요소를 분석하고
                  위험도를 점수로 제공합니다.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  계약서 분석
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  계약서의 문제 조항을 찾아내고 법적 근거와 함께 상세한 분석 결과를 제공하며,
                  추천 대응 방법을 제시합니다.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-6 h-6 text-purple-600" />
                  법적 시나리오 제공
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  입력한 법적 상황에 대해 RAG 시스템이 관련 법률 시나리오와 대응 방법을
                  제공합니다.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  맞춤형 대응 가이드
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  각 법적 문제에 대한 구체적인 해결책과 대응 방법을 단계별로 안내합니다.
                </p>
              </CardContent>
            </Card>
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
            법률 문제를 빠르고 쉽게 해결할 수 있도록 AI가 도와드립니다.
            <br />
            무료로 체험해보세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/legal/analysis')}
              className="bg-white text-blue-600 hover:bg-slate-100 rounded-xl px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              문서 업로드
            </Button>
            <Button
              onClick={() => router.push('/legal/search')}
              variant="outline"
              className="border-2 border-white text-white hover:bg-white/10 rounded-xl px-8 py-4 text-lg font-semibold"
              size="lg"
            >
              <Search className="w-5 h-5 mr-2" />
              법률 검색하기
            </Button>
          </div>
          <p className="mt-6 text-sm opacity-75">
            신용카드 불필요 · 무료 체험 가능
          </p>
        </div>
      </section>
    </div>
  )
}

