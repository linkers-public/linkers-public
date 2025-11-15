'use client'

import { Loader2 } from 'lucide-react'
import AnnouncementAnalysisResult from '@/components/AnnouncementAnalysisResult'

interface AnalysisResult {
  summary?: string
  requiredSkills?: string[]
  budgetMin?: number
  budgetMax?: number
  durationMonths?: number
  organizationName?: string
  deadline?: string
  location?: string
}

interface AnnouncementAnalysisViewProps {
  analysis: AnalysisResult | null
  loading?: boolean
}

export default function AnnouncementAnalysisView({
  analysis,
  loading = false,
}: AnnouncementAnalysisViewProps) {
  if (loading && !analysis) {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 분석 결과</h2>
          <p className="text-gray-600">
            LLM이 공고문을 분석하여 주요 정보를 자동으로 추출했습니다.
          </p>
        </div>
        <div className="p-6 border rounded-lg bg-gray-50">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 분석 결과</h2>
        <p className="text-gray-600">
          LLM이 공고문을 분석하여 주요 정보를 자동으로 추출했습니다.
        </p>
      </div>
      <AnnouncementAnalysisResult analysis={analysis} loading={loading} />
    </div>
  )
}

