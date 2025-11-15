'use client'

import { Code, DollarSign, Calendar, FileText, Building2, MapPin, Clock } from 'lucide-react'

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

interface AnnouncementAnalysisResultProps {
  analysis: AnalysisResult
  loading?: boolean
}

export default function AnnouncementAnalysisResult({
  analysis,
  loading = false,
}: AnnouncementAnalysisResultProps) {
  if (loading) {
    return (
      <div className="space-y-6 p-6 border rounded-lg bg-gray-50">
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
    )
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return '-'
    if (amount >= 100000000) {
      return `${(amount / 100000000).toFixed(1)}억원`
    }
    if (amount >= 10000) {
      return `${(amount / 10000).toFixed(0)}만원`
    }
    return `${amount.toLocaleString()}원`
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      {/* 요약 섹션 */}
      {analysis.summary && (
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">공고 요약</h3>
          </div>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {analysis.summary}
          </p>
        </div>
      )}

      {/* 주요 정보 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 기술 요구사항 */}
        {analysis.requiredSkills && analysis.requiredSkills.length > 0 && (
          <div className="p-5 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900">주요 기술 요구사항</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.requiredSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium border border-blue-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 예산 */}
        {(analysis.budgetMin || analysis.budgetMax) && (
          <div className="p-5 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h4 className="font-semibold text-gray-900">예산 범위</h4>
            </div>
            <div className="space-y-1">
              {analysis.budgetMin && analysis.budgetMax ? (
                <>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analysis.budgetMin)} ~ {formatCurrency(analysis.budgetMax)}
                  </div>
                  <div className="text-sm text-gray-500">
                    최소: {analysis.budgetMin.toLocaleString()}원
                  </div>
                  <div className="text-sm text-gray-500">
                    최대: {analysis.budgetMax.toLocaleString()}원
                  </div>
                </>
              ) : analysis.budgetMin ? (
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analysis.budgetMin)} 이상
                </div>
              ) : analysis.budgetMax ? (
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analysis.budgetMax)} 이하
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* 프로젝트 기간 */}
        {analysis.durationMonths && (
          <div className="p-5 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h4 className="font-semibold text-gray-900">프로젝트 기간</h4>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analysis.durationMonths}개월
            </div>
            <div className="text-sm text-gray-500 mt-1">
              약 {Math.floor(analysis.durationMonths / 12)}년{' '}
              {analysis.durationMonths % 12}개월
            </div>
          </div>
        )}

        {/* 발주기관 */}
        {analysis.organizationName && (
          <div className="p-5 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-gray-900">발주기관</h4>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {analysis.organizationName}
            </div>
          </div>
        )}

        {/* 마감일 */}
        {analysis.deadline && (
          <div className="p-5 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-red-600" />
              <h4 className="font-semibold text-gray-900">입찰 마감일</h4>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {formatDate(analysis.deadline)}
            </div>
          </div>
        )}

        {/* 지역 */}
        {analysis.location && (
          <div className="p-5 bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-pink-600" />
              <h4 className="font-semibold text-gray-900">지역</h4>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {analysis.location}
            </div>
          </div>
        )}
      </div>

      {/* 정보가 없는 경우 */}
      {!analysis.summary &&
        !analysis.requiredSkills?.length &&
        !analysis.budgetMin &&
        !analysis.budgetMax &&
        !analysis.durationMonths &&
        !analysis.organizationName &&
        !analysis.deadline &&
        !analysis.location && (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-yellow-800">
              분석 결과가 아직 준비되지 않았습니다. 잠시 후 다시 확인해주세요.
            </p>
          </div>
        )}
    </div>
  )
}

