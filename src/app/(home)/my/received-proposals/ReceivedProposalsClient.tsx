'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Building2, Users, UserPlus, Clock, CheckCircle, XCircle, FileText, DollarSign, Calendar } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface EstimateRequest {
  counsel_id: number
  title: string | null
  outline: string | null
  feild: string | null
  expected_cost: number | null
  expected_period: number | null
  cost: string | null
  period: string | null
  due_date: string | null
  start_date: string | null
  counsel_status: string | null
  company_name: string | null
  created_at: string
  estimate_status?: string | null
}

interface TeamProposal {
  id: number
  team_id: number | null
  team_name: string
  manager_id: string
  manager_name: string
  message: string | null
  created_at: string
}

interface TeamJoinRequest {
  id: number
  team_id: number
  team_name: string
  maker_id: string
  maker_name: string
  profile_id: string
  status: string
  created_at: string
}

export default function ReceivedProposalsClient() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [estimateRequests, setEstimateRequests] = useState<EstimateRequest[]>([])
  const [teamProposals, setTeamProposals] = useState<TeamProposal[]>([])
  const [teamJoinRequests, setTeamJoinRequests] = useState<TeamJoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'MANAGER' | 'MAKER' | null>(null)

  useEffect(() => {
    loadProposals()
  }, [])

  const loadProposals = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // 현재 프로필 확인
      const { data: profile } = await supabase
        .from('accounts')
        .select('profile_id, profile_type, role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle()

      if (!profile || profile.profile_type !== 'FREELANCER') {
        toast({
          variant: 'destructive',
          title: '프리랜서 프로필이 필요합니다',
          description: '프리랜서 프로필로 접근해주세요.',
        })
        router.push('/my/profile/manage')
        return
      }

      setUserRole(profile.role as 'MANAGER' | 'MAKER')

      // 1. 받은 견적 요청(매니저) - 기업이 프리랜서 팀에게 견적을 작성해달라고 요청한 프로젝트들
      // counsel 테이블에서 상태가 pending 또는 recruiting인 프로젝트들을 조회
      // 단, 현재 매니저의 팀이 아직 견적을 작성하지 않은 것만 표시
      if (profile.role === 'MANAGER') {
        // 매니저의 팀 정보 가져오기
        const { data: teamData } = await supabase
          .from('teams')
          .select('id')
          .eq('manager_profile_id', profile.profile_id)
          .limit(1)
          .maybeSingle()

        if (teamData) {
          // 모든 견적 요청 조회 (상태가 pending 또는 recruiting인 것)
          const { data: counselData, error: counselError } = await supabase
            .from('counsel')
            .select(`
              counsel_id,
              title,
              outline,
              feild,
              expected_cost,
              expected_period,
              cost,
              period,
              due_date,
              start_date,
              counsel_status,
              counsel_date,
              company:company_profile_id (
                user_id,
                username
              )
            `)
            .in('counsel_status', ['pending', 'recruiting'])
            .order('start_date', { ascending: false })

          if (!counselError && counselData) {
            // 각 요청에 대해 견적서 제출 여부 확인
            const requestsWithEstimates = await Promise.all(
              counselData.map(async (req: any) => {
                // 현재 팀이 이 프로젝트에 견적서를 제출했는지 확인
                const { data: estimateData } = await supabase
                  .from('estimate')
                  .select('estimate_status')
                  .eq('counsel_id', req.counsel_id)
                  .eq('team_id', teamData.id)
                  .maybeSingle()

                // 견적서를 아직 제출하지 않은 경우에만 반환
                if (!estimateData) {
                  return {
                    counsel_id: req.counsel_id,
                    title: req.title,
                    outline: req.outline,
                    feild: req.feild,
                    expected_cost: req.expected_cost,
                    expected_period: req.expected_period,
                    cost: req.cost,
                    period: req.period,
                    due_date: req.due_date,
                    start_date: req.start_date,
                    counsel_status: req.counsel_status,
                    company_name: req.company?.username || '알 수 없음',
                    created_at: req.counsel_date || req.start_date || new Date().toISOString(),
                    estimate_status: null, // 아직 제출하지 않음
                  }
                }
                return null
              })
            )

            // null 값 제거 (이미 견적서를 제출한 것들)
            const filteredRequests = requestsWithEstimates.filter((req): req is EstimateRequest => req !== null)
            setEstimateRequests(filteredRequests)
          }
        }
      }

      // 2. 받은 팀 제안(메이커) - maker_id = 현재 로그인 user_id
      const { data: proposals, error: teamProposalsError } = await supabase
        .from('team_proposals')
        .select('id, team_id, manager_id, message, created_at')
        .eq('maker_id', user.id)
        .order('created_at', { ascending: false })

      if (!teamProposalsError && proposals) {
        const teamIds = proposals
          .map((p: any) => p.team_id)
          .filter((id: any) => id !== null) as number[]

        const teamInfo: Record<number, any> = {}
        if (teamIds.length > 0) {
          const { data: teams } = await supabase
            .from('teams')
            .select('id, name, manager_profile_id')
            .in('id', teamIds)

          if (teams) {
            teams.forEach((team: any) => {
              teamInfo[team.id] = team
            })
          }
        }

        const managerIds = proposals
          .map((p: any) => p.manager_id)
          .filter(Boolean) || []
        const managerInfo: Record<string, any> = {}

        if (managerIds.length > 0) {
          const { data: managers } = await supabase
            .from('accounts')
            .select('user_id, username')
            .in('user_id', managerIds)

          if (managers) {
            managers.forEach((manager: any) => {
              managerInfo[manager.user_id] = manager
            })
          }
        }

        const formattedTeamProposals: TeamProposal[] = proposals.map((proposal: any) => {
          const team = proposal.team_id ? teamInfo[proposal.team_id] : null
          const manager = managerInfo[proposal.manager_id]

          return {
            id: proposal.id,
            team_id: proposal.team_id,
            team_name: team?.name || '알 수 없음',
            manager_id: proposal.manager_id,
            manager_name: manager?.username || '알 수 없음',
            message: proposal.message,
            created_at: proposal.created_at,
          }
        })

        setTeamProposals(formattedTeamProposals)
      }

      // 3. 받은 합류 제안 (매니저) - teams.manager_id = 현재 로그인 user_id AND status = 'pending'
      // 먼저 현재 사용자가 매니저인 팀들을 찾기
      const { data: managedTeams } = await supabase
        .from('teams')
        .select('id, name, manager_id')
        .eq('manager_id', user.id)

      if (managedTeams && managedTeams.length > 0) {
        const teamIds = managedTeams.map((t: any) => t.id)
        const teamInfo: Record<number, any> = {}
        managedTeams.forEach((team: any) => {
          teamInfo[team.id] = team
        })

        const { data: joinRequests, error: joinRequestsError } = await supabase
          .from('team_members')
          .select('id, team_id, profile_id, maker_id, status, created_at')
          .in('team_id', teamIds)
          .eq('status', 'pending')
          .eq('request_type', 'request')
          .order('created_at', { ascending: false })

        if (!joinRequestsError && joinRequests) {
          const makerIds = joinRequests.map((r: any) => r.maker_id).filter(Boolean) || []
          const makerInfo: Record<string, any> = {}

          if (makerIds.length > 0) {
            const { data: makers } = await supabase
              .from('accounts')
              .select('user_id, username')
              .in('user_id', makerIds)

            if (makers) {
              makers.forEach((maker: any) => {
                makerInfo[maker.user_id] = maker
              })
            }
          }

          const formattedJoinRequests: TeamJoinRequest[] = joinRequests.map((request: any) => {
            const team = teamInfo[request.team_id]
            const maker = makerInfo[request.maker_id]

            return {
              id: request.id,
              team_id: request.team_id,
              team_name: team?.name || '알 수 없음',
              maker_id: request.maker_id,
              maker_name: maker?.username || '알 수 없음',
              profile_id: request.profile_id,
              status: request.status,
              created_at: request.created_at,
            }
          })

          setTeamJoinRequests(formattedJoinRequests)
        }
      }
    } catch (error: any) {
      console.error('제안 목록 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '제안 목록을 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return null

    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
      pending: {
        label: '대기중',
        className: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
      },
      accepted: {
        label: '수락됨',
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle,
      },
      declined: {
        label: '거절됨',
        className: 'bg-red-100 text-red-800',
        icon: XCircle,
      },
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    )
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '비용 미정'
    return new Intl.NumberFormat('ko-KR').format(amount) + '만원'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '날짜 미정'
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const getDaysUntilDeadline = (dueDate: string | null) => {
    if (!dueDate) return null
    const now = new Date()
    const deadline = new Date(dueDate)
    const diff = deadline.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  if (loading) {
    return (
      <div className="w-full py-6 md:py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="w-full py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">받은 제안 목록</h1>
        <p className="text-gray-600">받은 제안들을 확인하고 관리하세요</p>
      </div>

      <div className="space-y-8">
        {/* 1. 받은 견적 요청(매니저) - 항상 표시 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">받은 견적 요청(매니저)</h2>
          </div>
          {estimateRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">받은 견적 요청이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {estimateRequests.map((request) => {
                const daysUntilDeadline = getDaysUntilDeadline(request.due_date)
                const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 3 && daysUntilDeadline >= 0

                return (
                  <div
                    key={request.counsel_id}
                    className="bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {request.title || '제목 없음'}
                        </h3>
                        {request.company_name && (
                          <p className="text-sm text-gray-600">{request.company_name}</p>
                        )}
                      </div>
                      {isUrgent && (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full ml-2">
                          마감임박
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      {request.feild && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4" />
                          <span>{request.feild}</span>
                        </div>
                      )}
                      {request.expected_cost && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold text-blue-600">
                            희망: {formatCurrency(request.expected_cost)}
                          </span>
                        </div>
                      )}
                      {request.expected_period && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>희망 기간: {request.expected_period}개월</span>
                        </div>
                      )}
                      {request.due_date && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            마감: {formatDate(request.due_date)}
                            {daysUntilDeadline !== null && (
                              <span className={`ml-2 ${isUrgent ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                (D-{daysUntilDeadline})
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {request.outline && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{request.outline}</p>
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        미제출
                      </span>
                      <div className="flex gap-2">
                        <Link href={`/my/estimate-requests?counsel_id=${request.counsel_id}`}>
                          <Button size="sm" variant="default">
                            견적서 작성
                          </Button>
                        </Link>
                        {request.counsel_id > 0 && (
                          <Link href={`/enterprise/my-counsel/${request.counsel_id}`}>
                            <Button size="sm" variant="outline">
                              상세보기
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 2. 받은 팀 제안(메이커) - 항상 표시 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">받은 팀 제안(메이커)</h2>
          </div>
          {teamProposals.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">받은 팀 제안이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-white rounded-lg shadow-sm border p-4 md:p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {proposal.team_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {proposal.manager_name} 매니저님이 회원님께 팀 합류를 제안했습니다.
                      </p>
                      {proposal.message && (
                        <p className="text-sm text-gray-500 mt-2 italic">
                          "{proposal.message}"
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(proposal.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/my/team-invites`}>
                      <Button variant="outline" size="sm">
                        제안 확인하기
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. 받은 합류 제안 (매니저) - 항상 표시 */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">받은 합류 제안 (매니저)</h2>
          </div>
          {teamJoinRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
              <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">받은 합류 제안이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {teamJoinRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow-sm border p-4 md:p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {request.team_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {request.maker_name} 메이커님이 회원님의 팀에 합류를 지원했습니다.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(request.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/my/messages`}>
                      <Button variant="outline" size="sm">
                        제안 확인하기
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

