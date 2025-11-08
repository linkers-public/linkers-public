'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { FileText, Users, UserPlus, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface SentEstimate {
  estimate_id: number
  counsel_id: number
  title: string | null
  estimate_status: string
  estimate_date: string | null
  created_at: string
}

interface SentTeamProposal {
  id: number
  team_id: number | null
  team_name: string
  maker_id: string
  maker_name: string
  message: string | null
  status: string | null // team_members에서 가져온 상태
  created_at: string
}

interface SentJoinRequest {
  id: number
  team_id: number
  team_name: string
  manager_id: string
  manager_name: string
  status: string
  created_at: string
}

export default function SentRequestsClient() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [sentEstimates, setSentEstimates] = useState<SentEstimate[]>([])
  const [sentTeamProposals, setSentTeamProposals] = useState<SentTeamProposal[]>([])
  const [sentJoinRequests, setSentJoinRequests] = useState<SentJoinRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'MANAGER' | 'MAKER' | null>(null)

  useEffect(() => {
    loadSentRequests()
  }, [])

  const loadSentRequests = async () => {
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

      // 1. 보낸 견적서 목록 (매니저 역할로 보낸 견적서)
      // estimate.manager_id = 현재 로그인 user_id
      // 역할에 관계없이 조회 (프로젝트마다 역할이 다를 수 있음)
      const { data: estimates, error: estimatesError } = await supabase
        .from('estimate')
        .select(`
          estimate_id,
          counsel_id,
          estimate_status,
          estimate_date,
          manager_id,
          counsel:counsel_id (
            counsel_id,
            title
          )
        `)
        .eq('manager_id', user.id)
        .order('estimate_date', { ascending: false })

      if (estimatesError) {
        console.error('견적서 조회 실패:', estimatesError)
        toast({
          variant: 'destructive',
          title: '견적서 조회 실패',
          description: estimatesError.message,
        })
        setSentEstimates([])
      } else if (estimates && estimates.length > 0) {
        const formattedEstimates: SentEstimate[] = estimates.map((est: any) => ({
          estimate_id: est.estimate_id,
          counsel_id: est.counsel_id,
          title: est.counsel?.title || '제목 없음',
          estimate_status: est.estimate_status,
          estimate_date: est.estimate_date,
          created_at: est.estimate_date || new Date().toISOString(),
        }))

        setSentEstimates(formattedEstimates)
        console.log('조회된 견적서 개수:', formattedEstimates.length)
      } else {
        console.log('견적서가 없습니다. manager_id:', user.id)
        setSentEstimates([])
      }

      // 2. 보낸 팀 요청(매니저 역할로 보낸 팀 제안)
      // team_proposals.manager_id = 현재 로그인 user_id
      // 역할에 관계없이 조회 (프로젝트마다 역할이 다를 수 있음)
      const { data: sentProposals, error: sentProposalsError } = await supabase
        .from('team_proposals')
        .select('id, team_id, maker_id, message, created_at')
        .eq('manager_id', user.id)
        .order('created_at', { ascending: false })

      if (!sentProposalsError && sentProposals) {
        // team_id 목록 추출
        const sentTeamIds = sentProposals
          .map((p: any) => p.team_id)
          .filter((id: any) => id !== null) as number[]

        // 팀 정보 별도 조회
        const sentTeamInfo: Record<number, any> = {}
        if (sentTeamIds.length > 0) {
          const { data: teams } = await supabase
            .from('teams')
            .select('id, name')
            .in('id', sentTeamIds)

          if (teams) {
            teams.forEach((team: any) => {
              sentTeamInfo[team.id] = team
            })
          }
        }

        // 메이커 정보를 별도로 조회
        const makerIds = sentProposals
          .map((p: any) => p.maker_id)
          .filter(Boolean) || []
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

        // 각 제안에 대해 team_members에서 상태 확인
        // team_proposals를 보낸 후 메이커가 수락하면 team_members에 추가됨
        const proposalsWithStatus = await Promise.all(
          sentProposals.map(async (proposal: any) => {
            // 메이커의 profile_id 조회
            const { data: makerProfile } = await supabase
              .from('accounts')
              .select('profile_id')
              .eq('user_id', proposal.maker_id)
              .eq('profile_type', 'FREELANCER')
              .maybeSingle()

            let status = 'pending'
            
            // team_members에서 해당 메이커와 팀의 상태 확인
            if (makerProfile && proposal.team_id) {
              const { data: teamMember } = await supabase
                .from('team_members')
                .select('status')
                .eq('team_id', proposal.team_id)
                .eq('profile_id', makerProfile.profile_id)
                .eq('request_type', 'invite')
                .maybeSingle()

              if (teamMember && teamMember.status) {
                status = teamMember.status
              }
            }

            const team = proposal.team_id ? sentTeamInfo[proposal.team_id] : null
            const maker = makerInfo[proposal.maker_id]

            return {
              id: proposal.id,
              team_id: proposal.team_id,
              team_name: team?.name || '알 수 없음',
              maker_id: proposal.maker_id,
              maker_name: maker?.username || '알 수 없음',
              message: proposal.message,
              status: status,
              created_at: proposal.created_at,
            }
          })
        )

        setSentTeamProposals(proposalsWithStatus)
      } else {
        setSentTeamProposals([])
      }

      // 3. 보낸 합류 요청(메이커 역할로 보낸 합류 요청)
      // team_members.maker_id = 현재 로그인 user_id
      // teams.manager_id로 매니저 정보 조회
      // 역할에 관계없이 조회 (프로젝트마다 역할이 다를 수 있음)
      const { data: sentJoinRequests, error: sentJoinRequestsError } = await supabase
        .from('team_members')
        .select('id, team_id, status, created_at, maker_id')
        .eq('maker_id', user.id)
        .order('created_at', { ascending: false })

      if (!sentJoinRequestsError && sentJoinRequests && sentJoinRequests.length > 0) {
        // 팀 정보 조회
        const sentJoinTeamIds = sentJoinRequests
          .map((r: any) => r.team_id)
          .filter((id: any) => id !== null) as number[]

        const sentJoinTeamInfo: Record<number, any> = {}
        if (sentJoinTeamIds.length > 0) {
          const { data: teams } = await supabase
            .from('teams')
            .select('id, name, manager_id')
            .in('id', sentJoinTeamIds)

          if (teams) {
            teams.forEach((team: any) => {
              sentJoinTeamInfo[team.id] = team
            })

            // 매니저 정보 조회 (teams.manager_id로)
            const managerIds = teams
              .map((t: any) => t.manager_id)
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

            const formattedJoinRequests: SentJoinRequest[] = sentJoinRequests.map((request: any) => {
              const team = sentJoinTeamInfo[request.team_id]
              const manager = team?.manager_id ? managerInfo[team.manager_id] : null

              return {
                id: request.id,
                team_id: request.team_id,
                team_name: team?.name || '알 수 없음',
                manager_id: team?.manager_id || '',
                manager_name: manager?.username || '알 수 없음',
                status: request.status || 'pending',
                created_at: request.created_at,
              }
            })

            setSentJoinRequests(formattedJoinRequests)
          } else {
            setSentJoinRequests([])
          }
        } else {
          setSentJoinRequests([])
        }
      } else {
        setSentJoinRequests([])
      }
    } catch (error: any) {
      console.error('보낸 요청 목록 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '보낸 요청 목록을 불러오는데 실패했습니다',
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
      active: {
        label: '수락됨',
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle,
      },
      declined: {
        label: '거절됨',
        className: 'bg-red-100 text-red-800',
        icon: XCircle,
      },
      accepted: {
        label: '수락됨',
        className: 'bg-green-100 text-green-800',
        icon: CheckCircle,
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

  const getStatusMessage = (type: 'team' | 'join', status: string, name: string) => {
    if (type === 'team') {
      if (status === 'active' || status === 'accepted') {
        return `${name} 메이커님이 회원님의 팀 요청을 수락했습니다.`
      } else if (status === 'declined') {
        return `${name} 메이커님이 회원님의 팀 제안을 거절했습니다.`
      }
      // pending 상태일 때는 기본 메시지 표시하지 않음 (아래에서 처리)
      return null
    } else if (type === 'join') {
      if (status === 'active' || status === 'accepted') {
        return `${name} 매니저님이 회원님의 합류 요청을 수락했습니다.`
      } else if (status === 'declined') {
        return `${name} 매니저님이 회원님의 합류 요청을 거절했습니다.`
      }
      // pending 상태일 때는 기본 메시지 표시하지 않음 (아래에서 처리)
      return null
    }
    return null
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">보낸 요청 목록</h1>
        <p className="text-gray-600">보낸 요청들의 상태를 확인하고 관리하세요</p>
      </div>

      <div className="space-y-8">
        {/* 1. 보낸 견적서 목록 (매니저 역할로 보낸 견적서) */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">보낸 견적서 목록</h2>
          </div>
          {sentEstimates.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">보낸 견적서가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentEstimates.map((estimate) => (
                <div
                  key={estimate.estimate_id}
                  className="bg-white rounded-lg shadow-sm border p-4 md:p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {estimate.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        회원님이 {estimate.title} 프로젝트에 세부 견적서를 제출했습니다.
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(estimate.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    {getStatusBadge(estimate.estimate_status)}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/my/estimates-dashboard?estimate_id=${estimate.estimate_id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        제출한 견적서 상세보기
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/enterprise/my-counsel/${estimate.counsel_id}`}>
                      <Button variant="outline" size="sm">
                        프로젝트 상세보기
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. 보낸 팀 요청(매니저 역할로 보낸 팀 제안) */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">보낸 팀 요청(매니저)</h2>
          </div>
          {sentTeamProposals.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">보낸 팀 요청이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentTeamProposals.map((proposal) => {
                const statusMessage = getStatusMessage('team', proposal.status || 'pending', proposal.maker_name)
                return (
                  <div
                    key={proposal.id}
                    className="bg-white rounded-lg shadow-sm border p-4 md:p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {proposal.team_name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {statusMessage || `${proposal.maker_name} 메이커님에게 팀 합류를 제안했습니다.`}
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
                      {getStatusBadge(proposal.status)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 3. 보낸 합류 요청(메이커 역할로 보낸 합류 요청) */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">보낸 합류 요청(메이커)</h2>
          </div>
          {sentJoinRequests.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
              <UserPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">보낸 합류 요청이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentJoinRequests.map((request) => {
                const statusMessage = getStatusMessage('join', request.status, request.manager_name)
                return (
                  <div
                    key={request.id}
                    className="bg-white rounded-lg shadow-sm border p-4 md:p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {request.team_name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {statusMessage || `${request.manager_name} 매니저님의 팀에 합류를 요청했습니다.`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

