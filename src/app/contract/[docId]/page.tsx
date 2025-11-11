'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SubHeader from '@/components/layout/SubHeader'
import { Button } from '@/components/ui/button'
import { Money } from '@/components/common/Money'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function ContractPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const docId = params.docId as string
  const teamId = searchParams.get('teamId')

  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    requirements: '',
    startDate: '',
    needsDemo: false,
    needsSecurity: false,
    needsNDA: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // TODO: 실제 API 호출
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <SubHeader currentStep={5} totalSteps={5} />
        <main className="flex-1 container mx-auto px-6 py-8 max-w-2xl">
          <div className="rounded-2xl border border-emerald-200 p-8 bg-emerald-50 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">계약 요청이 전송되었습니다</h2>
            <p className="text-slate-600 mb-6">
              팀에서 검토 후 연락드리겠습니다.
            </p>
            <Button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2 font-medium shadow-sm"
            >
              홈으로 돌아가기
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SubHeader currentStep={5} totalSteps={5} />
      <main className="flex-1 container mx-auto px-6 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold mb-2">계약 진행</h1>
          <p className="text-slate-600">
            선택한 팀과의 계약을 진행합니다.
          </p>
        </div>

        {/* 요약 카드 */}
        <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-sm mb-6">
          <h3 className="text-lg font-semibold mb-4">요약</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">선택 팀</span>
              <span className="font-medium">팀 {teamId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">예상 금액</span>
              <Money amount={50000000} />
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">예상 기간</span>
              <span className="font-medium">6개월</span>
            </div>
          </div>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              추가 요구사항
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) =>
                setFormData({ ...formData, requirements: e.target.value })
              }
              className="w-full p-3 border border-slate-300 rounded-xl"
              rows={4}
              placeholder="추가로 요청하실 사항이 있으시면 입력해주세요."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              희망 착수일
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full p-3 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium mb-2">요건</label>
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={formData.needsDemo}
                onChange={(e) =>
                  setFormData({ ...formData, needsDemo: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-sm">시연 요청</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={formData.needsSecurity}
                onChange={(e) =>
                  setFormData({ ...formData, needsSecurity: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-sm">보안 요건 준수</span>
            </label>
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={formData.needsNDA}
                onChange={(e) =>
                  setFormData({ ...formData, needsNDA: e.target.checked })
                }
                className="w-4 h-4"
              />
              <span className="text-sm">
                NDA 체결 필요{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  (링크)
                </a>
              </span>
            </label>
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 font-medium shadow-sm"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                전송 중...
              </>
            ) : (
              '요청 보내기'
            )}
          </Button>
        </form>
      </main>
      <Footer />
    </div>
  )
}

