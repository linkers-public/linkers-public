'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { FileText, MessageSquare, BookOpen, Upload, AlertTriangle, ArrowRight } from 'lucide-react'

export default function LegalLandingPage() {
  const router = useRouter()

  const features = [
    {
      icon: FileText,
      title: '계약서 업로드 분석',
      description: '계약서 파일을 업로드하고, 위험도를 분석해 주세요.',
      buttonText: '분석 시작',
      onClick: () => router.push('/legal/contract'),
    },
    {
      icon: MessageSquare,
      title: '상황 설명 분석',
      description: '지금 겪고 있는 상황을 설명하면, 법적 리스크를 알려드립니다.',
      buttonText: '상황 분석',
      onClick: () => router.push('/legal/situation'),
    },
    {
      icon: BookOpen,
      title: '유사 케이스 보기',
      description: '유사한 법률 사례를 찾아보고, 대응 방법을 확인하세요.',
      buttonText: '유사 케이스 찾기',
      onClick: () => router.push('/legal/cases'),
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 lg:py-32">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-slate-900 leading-tight">
              첫 계약, AI와 함께 점검해보세요.
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-3xl mx-auto">
              청년이 첫 계약서에 서명하기 전에, 법적 위험을 먼저 확인하세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={() => router.push('/legal/contract')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <Upload className="w-5 h-5 mr-2" />
                계약서 업로드하기
              </Button>
              <Button
                onClick={() => router.push('/legal/situation')}
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-10 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                size="lg"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                근로조건 간단 체크
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card
                  key={index}
                  className="hover:shadow-xl transition-all duration-300 border-slate-200 flex flex-col"
                >
                  <CardHeader className="text-center pb-4">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-base text-slate-600">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="mt-auto pt-0">
                    <Button
                      onClick={feature.onClick}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      {feature.buttonText}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="py-16 bg-amber-50 border-y border-amber-200">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              <h2 className="text-2xl font-bold text-slate-900">
                Linkus Legal은 법률 자문이 아닙니다
              </h2>
            </div>
            <p className="text-lg text-slate-700 leading-relaxed">
              이 서비스는 법적 위험을 미리 파악하고, 청년이 자신의 권리를 지킬 수 있도록 돕는 도구입니다.
              <br />
              실제 법률 문제가 발생한 경우 전문 변호사나 법률 상담 기관의 도움을 받으시기 바랍니다.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

