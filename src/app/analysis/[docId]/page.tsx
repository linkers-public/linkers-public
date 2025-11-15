'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Button } from '@/components/ui/button'
import { Loader2, Clock, DollarSign, Briefcase, Code, AlertTriangle } from 'lucide-react'
import { RiskGauge } from '@/components/contract/RiskGauge'
import { ContractCategoryCard, ContractCategoryData } from '@/components/contract/ContractCategoryCard'

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const docId = params.docId as string

  const [loading, setLoading] = useState(true)
  const [riskScore, setRiskScore] = useState(65) // 전체 위험도 (0-100)
  const [categories, setCategories] = useState<ContractCategoryData[]>([
    {
      category: '근로시간/휴게',
      riskScore: 70,
      icon: Clock,
      issues: [
        {
          clause: '근로시간은 주 52시간을 초과할 수 있으며, 초과근무에 대한 별도 수당은 지급하지 않습니다.',
          reason: '근로기준법 제50조(근로시간) - 1주간의 근로시간은 휴게시간을 제외하고 40시간을 초과할 수 없으며, 1일의 근로시간은 휴게시간을 제외하고 8시간을 초과할 수 없다.',
          standardClause: '근로시간은 주 40시간을 초과하지 않으며, 초과근무 시 별도의 가산수당을 지급합니다.',
          recommendation: '협상: 주 40시간 초과 시 가산수당 지급을 명시하도록 수정 요청',
        },
      ],
    },
    {
      category: '보수/수당',
      riskScore: 45,
      icon: DollarSign,
      issues: [
        {
          clause: '월 기본급은 협의에 따라 결정하며, 성과에 따라 변동될 수 있습니다.',
          reason: '근로기준법 제2조(정의) - 임금은 사용자가 근로자에게 근로의 대가로 지급하는 모든 금품을 말한다.',
          recommendation: '수정 요청: 기본급을 명확히 명시하고, 성과급은 별도로 구분하여 기재',
        },
      ],
    },
    {
      category: '수습/해지',
      riskScore: 80,
      icon: Briefcase,
      issues: [
        {
          clause: '수습기간은 6개월이며, 수습기간 중에는 언제든지 해고할 수 있습니다.',
          reason: '근로기준법 제27조(해고의 제한) - 사용자는 근로자에게 정당한 사유 없이 해고를 하지 못한다.',
          standardClause: '수습기간은 3개월을 초과하지 않으며, 정당한 사유 없이 해고할 수 없습니다.',
          recommendation: '상담: 수습기간 단축 및 해고 사유 명시 요청, 필요시 노동위원회 상담',
        },
      ],
    },
    {
      category: '스톡옵션/IP',
      riskScore: 30,
      icon: Code,
      issues: [],
    },
  ])

  useEffect(() => {
    // 실제로는 API에서 데이터를 가져와야 함
    // 임시로 로딩 시뮬레이션
    setTimeout(() => {
      setLoading(false)
    }, 2000)
  }, [docId])


  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-slate-900">AI 분석 결과</h1>
          <p className="text-lg text-slate-600">계약서의 주요 조항을 분석하여 위험도를 평가했습니다</p>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-blue-100 rounded-full mx-auto"></div>
              </div>
              <p className="text-gray-700 font-medium">계약 조항 분석 중...</p>
              <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
            </div>
          </div>
        )}

        {/* 분석 결과 */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* 좌측: 위험도 게이지 */}
            <div className="lg:col-span-1">
              <RiskGauge riskScore={riskScore} />
            </div>

            {/* 우측: 카테고리 카드들 */}
            <div className="lg:col-span-2 space-y-4">
              {categories.map((category, index) => (
                <ContractCategoryCard key={index} data={category} />
              ))}
            </div>
          </div>
        )}

        {/* 하단 CTA */}
        {!loading && (
          <div className="mt-10 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              분석이 완료되었습니다. 추가 도움이 필요하시면 상담 가이드를 확인하세요
            </p>
            <Button
              onClick={() => router.push('/guide')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              상황별 상담 가이드 보기
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

