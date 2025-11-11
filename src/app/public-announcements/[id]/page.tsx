'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Users, TrendingUp, FileText, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getAnnouncement,
  findMatchingTeams,
  generateEstimateDraft,
} from '@/apis/public-announcement.service'
import EstimateComparison from '@/components/EstimateComparison'

export default function PublicAnnouncementDetailPage() {
  const params = useParams()
  const router = useRouter()
  const announcementId = parseInt(params.id as string)

  const [announcement, setAnnouncement] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [estimates, setEstimates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [matching, setMatching] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

  useEffect(() => {
    loadAnnouncement()
  }, [announcementId])

  const loadAnnouncement = async () => {
    try {
      setLoading(true)
      const data = await getAnnouncement(announcementId)
      setAnnouncement(data)

      // 이미 매칭된 결과가 있으면 로드
      if (data.status === 'matched') {
        await loadMatches()
      }
    } catch (error) {
      console.error('공고 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMatches = async () => {
    try {
      // 매칭 결과는 API에서 가져오거나, announcement 데이터에 포함될 수 있음
      // 여기서는 간단히 표시
    } catch (error) {
      console.error('매칭 결과 로드 실패:', error)
    }
  }

  const handleStartMatching = async () => {
    try {
      setMatching(true)
      const results = await findMatchingTeams(announcementId, 10)
      setMatches(results)

      // 각 매칭된 팀에 대해 견적 초안 생성
      const estimatePromises = results.map(async (match) => {
        try {
          const draft = await generateEstimateDraft(announcementId, match.teamId)
          return {
            id: match.teamId,
            teamName: match.teamName,
            totalAmount: draft.totalAmount,
            startDate: draft.startDate,
            endDate: draft.endDate,
            matchScore: match.matchScore,
            milestones: draft.milestones,
            detail: draft.detail,
          }
        } catch (error) {
          console.error(`팀 ${match.teamId} 견적 생성 실패:`, error)
          return null
        }
      })

      const estimateResults = await Promise.all(estimatePromises)
      setEstimates(estimateResults.filter((e) => e !== null) as any[])
    } catch (error) {
      console.error('매칭 실패:', error)
      alert('팀 매칭 중 오류가 발생했습니다.')
    } finally {
      setMatching(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!announcement) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-red-500">공고를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* 공고 정보 */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{announcement.title}</h1>
            {announcement.organization_name && (
              <p className="text-gray-600">발주기관: {announcement.organization_name}</p>
            )}
          </div>
          <div className="flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                announcement.status === 'analyzed'
                  ? 'bg-green-100 text-green-700'
                  : announcement.status === 'matched'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {announcement.status === 'analyzed'
                ? '분석 완료'
                : announcement.status === 'matched'
                ? '매칭 완료'
                : '대기 중'}
            </span>
          </div>
        </div>

        {/* AI 분석 결과 카드 */}
        {announcement.ai_analysis && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-1">요구 기술</div>
              <div className="flex flex-wrap gap-2">
                {(announcement.required_skills || []).map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-1">예산 범위</div>
              <div className="font-semibold">
                {announcement.budget_min
                  ? `${announcement.budget_min.toLocaleString()}원`
                  : '-'}
                {announcement.budget_max && announcement.budget_min && ' ~ '}
                {announcement.budget_max
                  ? `${announcement.budget_max.toLocaleString()}원`
                  : ''}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-sm text-gray-600 mb-1">프로젝트 기간</div>
              <div className="font-semibold">
                {announcement.duration_months ? `${announcement.duration_months}개월` : '-'}
              </div>
            </div>
          </div>
        )}

        {/* 요약 */}
        {announcement.ai_analysis?.summary && (
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold">공고 요약</h3>
            </div>
            <p className="text-gray-700">{announcement.ai_analysis.summary}</p>
          </div>
        )}
      </div>

      {/* 매칭 시작 버튼 */}
      {announcement.status === 'analyzed' && matches.length === 0 && (
        <div className="mb-8 text-center">
          <Button
            onClick={handleStartMatching}
            disabled={matching}
            size="lg"
            className="min-w-[200px]"
          >
            {matching ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                매칭 중...
              </>
            ) : (
              <>
                <Users className="w-5 h-5 mr-2" />
                AI 매칭 시작
              </>
            )}
          </Button>
        </div>
      )}

      {/* 매칭 결과 */}
      {matches.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <h2 className="text-2xl font-bold">매칭된 팀 ({matches.length}개)</h2>
          </div>
        </div>
      )}

      {/* 견적 비교 */}
      {estimates.length > 0 && (
        <div>
          <EstimateComparison
            estimates={estimates}
            onSelect={(estimateId) => {
              setSelectedTeamId(estimateId)
              // 견적서 상세 페이지로 이동하거나 다른 작업 수행
            }}
          />
        </div>
      )}

      {/* 매칭 결과 리스트 (견적이 아직 생성되지 않은 경우) */}
      {matches.length > 0 && estimates.length === 0 && (
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.teamId}
              className="p-6 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{match.teamName}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">적합도</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {(match.matchScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${match.matchScore * 100}%` }}
                />
              </div>
              <div className="text-sm text-gray-600">
                <div>기술 매칭: {(match.matchReasons.skillMatch * 100).toFixed(0)}%</div>
                <div>경력 매칭: {(match.matchReasons.experienceMatch * 100).toFixed(0)}%</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

