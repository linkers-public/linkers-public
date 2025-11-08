'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTeamProfileStore } from '@/stores/useTeamProfileStore'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Briefcase, DollarSign, Calendar, Tag, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface TeamProject {
  estimate_id: number
  counsel_id: number | null
  estimate_status: string
  estimate_date: string | null
  estimate_start_date: string | null
  estimate_due_date: string | null
  counsel?: {
    counsel_id: number
    title: string | null
    outline: string | null
    cost: string | null
    period: string | null
    feild: string | null
    counsel_status: string
  }
  estimate_version?: {
    total_amount: number | null
    start_date: string | null
    end_date: string | null
    detail: string | null
  }
  milestones?: Array<{
    milestone_id: number
    title: string
    detail: string | null
    payment_amount: number | null
    milestone_start_date: string | null
    milestone_due_date: string | null
  }>
}

const TeamProjectsClient = () => {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const { teams, selectedTeamId, fetchMyTeams, selectTeam } = useTeamProfileStore()
  const [projects, setProjects] = useState<TeamProject[]>([])
  const [filteredProjects, setFilteredProjects] = useState<TeamProject[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const getTeams = async () => {
      try {
        await fetchMyTeams()
      } catch (err) {
        console.error('팀 목록 로드 실패:', err)
      }
    }
    getTeams()
  }, [])

  useEffect(() => {
    if (selectedTeamId) {
      fetchTeamProjects(selectedTeamId)
    } else if (teams.length > 0) {
      // 팀이 선택되지 않았으면 첫 번째 팀 선택
      selectTeam(teams[0].id)
    }
  }, [selectedTeamId, teams])

  const fetchTeamProjects = async (teamId: number) => {
    try {
      setLoading(true)
      
      // 팀이 제출한 견적서 조회
      const { data: estimatesData, error: estimatesError } = await supabase
        .from('estimate')
        .select(`
          estimate_id,
          counsel_id,
          estimate_status,
          estimate_date,
          estimate_start_date,
          estimate_due_date,
          counsel:counsel_id (
            counsel_id,
            title,
            outline,
            cost,
            period,
            feild,
            counsel_status
          )
        `)
        .eq('team_id', teamId)
        .order('estimate_date', { ascending: false })

      if (estimatesError) throw estimatesError

      // 각 견적서에 대해 estimate_version과 milestone 조회
      const projectsWithDetails = await Promise.all(
        (estimatesData || []).map(async (est: any) => {
          // 최신 estimate_version 조회
          const { data: versionData } = await supabase
            .from('estimate_version')
            .select('*')
            .eq('estimate_id', est.estimate_id)
            .order('version_date', { ascending: false })
            .limit(1)
            .maybeSingle()

          // milestone 조회
          const { data: milestoneData } = await supabase
            .from('milestone')
            .select('*')
            .eq('estimate_id', est.estimate_id)
            .order('milestone_start_date', { ascending: true })

          return {
            ...est,
            counsel: est.counsel || null,
            estimate_version: versionData || null,
            milestones: milestoneData || [],
          }
        })
      )

      setProjects(projectsWithDetails)
      setFilteredProjects(projectsWithDetails)
    } catch (error) {
      console.error('팀 프로젝트 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 상태 필터링
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredProjects(projects)
    } else {
      setFilteredProjects(projects.filter((project) => project.estimate_status === statusFilter))
    }
  }, [statusFilter, projects])

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: '대기중', color: 'bg-blue-100 text-blue-800', icon: Clock }
      case 'accept':
        return { text: '수락됨', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'reject':
        return { text: '거절됨', color: 'bg-red-100 text-red-800', icon: XCircle }
      case 'in_progress':
        return { text: '진행중', color: 'bg-purple-100 text-purple-800', icon: Briefcase }
      default:
        return { text: '대기중', color: 'bg-gray-100 text-gray-800', icon: Clock }
    }
  }

  const statusOptions = [
    { value: 'all', label: '전체', count: projects.length },
    { value: 'pending', label: '대기중', count: projects.filter((p) => p.estimate_status === 'pending').length },
    { value: 'accept', label: '수락됨', count: projects.filter((p) => p.estimate_status === 'accept').length },
    { value: 'in_progress', label: '진행중', count: projects.filter((p) => p.estimate_status === 'in_progress').length },
    { value: 'reject', label: '거절됨', count: projects.filter((p) => p.estimate_status === 'reject').length },
  ]

  if (loading && projects.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] w-full">
        <div className="text-center space-y-4 w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 text-center">프로젝트 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] px-4 w-full">
        <div className="text-center space-y-4 w-full max-w-md mx-auto">
          <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900 text-center">속한 팀이 없습니다</p>
            <p className="text-sm text-gray-500 text-center">팀에 가입하거나 팀을 생성해보세요.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">팀 프로젝트 확인</h1>
            <p className="text-gray-600 text-lg">팀이 제출한 견적서와 진행 중인 프로젝트를 확인하세요</p>
          </div>

          {/* 팀 선택 */}
          {teams.length > 1 && (
            <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">팀 선택</h3>
              <div className="flex flex-wrap gap-3">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => selectTeam(team.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTeamId === team.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 상태 필터 */}
          {projects.length > 0 && (
            <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-600" />
                견적서 상태
              </h3>
              <div className="flex flex-wrap gap-3">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      statusFilter === option.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 결과 통계 */}
          {!loading && projects.length > 0 && (
            <div className="mb-6 flex items-center gap-2 text-gray-600">
              <Briefcase className="w-5 h-5" />
              <span className="font-medium">
                총 <strong className="text-gray-900">{filteredProjects.length}</strong>개의 프로젝트를 찾았습니다
              </span>
            </div>
          )}

          {/* 프로젝트 목록 */}
          {!loading && (
            <section className="grid grid-cols-1 gap-6">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {projects.length === 0 ? '제출한 프로젝트가 없습니다' : '해당 상태의 프로젝트가 없습니다'}
                  </h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    {projects.length === 0
                      ? '프로젝트에 견적서를 제출해보세요'
                      : '다른 상태 필터를 선택해보세요'}
                  </p>
                  {projects.length === 0 && (
                    <Link
                      href="/search-projects"
                      className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                    >
                      프로젝트 찾기
                    </Link>
                  )}
                </div>
              ) : (
                filteredProjects.map((project) => {
                  const statusInfo = getStatusInfo(project.estimate_status)
                  const StatusIcon = statusInfo.icon

                  return (
                    <div
                      key={project.estimate_id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex flex-col gap-5">
                          {/* 프로젝트 제목과 상태 */}
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <h3 className="font-bold text-xl text-gray-900 leading-tight mb-2">
                                {project.counsel?.title || '제목 없음'}
                              </h3>
                              {project.counsel?.outline && (
                                <p className="text-gray-600 text-base line-clamp-2 leading-relaxed">
                                  {project.counsel.outline}
                                </p>
                              )}
                            </div>
                            <div
                              className={`px-4 py-1.5 text-sm font-semibold rounded-lg shadow-sm ${statusInfo.color} flex items-center gap-2 whitespace-nowrap`}
                            >
                              <StatusIcon className="w-4 h-4" />
                              <span>{statusInfo.text}</span>
                            </div>
                          </div>

                          {/* 견적 정보 */}
                          {project.estimate_version && (
                            <div className="flex flex-wrap gap-6 text-gray-700">
                              {project.estimate_version.total_amount && (
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <span className="text-sm font-medium text-gray-500">견적 금액</span>
                                    <p className="text-base font-semibold">
                                      {new Intl.NumberFormat('ko-KR').format(project.estimate_version.total_amount)}원
                                    </p>
                                  </div>
                                </div>
                              )}
                              {project.estimate_version.start_date && project.estimate_version.end_date && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-5 h-5 text-green-600" />
                                  <div>
                                    <span className="text-sm font-medium text-gray-500">프로젝트 기간</span>
                                    <p className="text-base font-semibold">
                                      {new Date(project.estimate_version.start_date).toLocaleDateString('ko-KR')} ~{' '}
                                      {new Date(project.estimate_version.end_date).toLocaleDateString('ko-KR')}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 프로젝트 분야 */}
                          {project.counsel?.feild && (
                            <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-blue-50 rounded-lg border border-blue-200">
                                {project.counsel.feild}
                              </span>
                            </div>
                          )}

                          {/* 마일스톤 */}
                          {project.milestones && project.milestones.length > 0 && (
                            <div>
                              <span className="text-sm font-semibold text-gray-700 mb-2 block">마일스톤</span>
                              <div className="space-y-2">
                                {project.milestones.slice(0, 3).map((milestone, idx) => (
                                  <div
                                    key={milestone.milestone_id || idx}
                                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                                        {milestone.detail && (
                                          <p className="text-sm text-gray-600 mt-1">{milestone.detail}</p>
                                        )}
                                      </div>
                                      {milestone.payment_amount && (
                                        <span className="text-sm font-bold text-blue-600">
                                          {new Intl.NumberFormat('ko-KR').format(milestone.payment_amount)}원
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {project.milestones.length > 3 && (
                                  <p className="text-sm text-gray-500">
                                    +{project.milestones.length - 3}개의 마일스톤 더 보기
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 하단 정보 */}
                          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <span className="text-sm text-gray-500">
                              제출일:{' '}
                              {project.estimate_date
                                ? new Date(project.estimate_date).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })
                                : '날짜 없음'}
                            </span>
                            {project.counsel_id && (
                              <Link
                                href={`/project-detail/${project.counsel_id}`}
                                className="text-sm text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1"
                              >
                                프로젝트 상세 보기
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeamProjectsClient

