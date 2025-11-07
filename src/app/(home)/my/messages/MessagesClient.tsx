'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, Mail, User, Building2, Users } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface TeamInvite {
  id: number
  team_id: number
  team_name: string
  manager_id: string
  manager_name: string
  status: string | null
  created_at: string
}

interface CompanyProposal {
  id: number
  counsel_id: number
  counsel_title: string | null
  client_id: string
  client_name: string | null
  status: string | null
  created_at: string
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

export default function MessagesClient() {
  const router = useRouter()
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([])
  const [teamProposals, setTeamProposals] = useState<TeamProposal[]>([])
  const [companyProposals, setCompanyProposals] = useState<CompanyProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'invites' | 'team-proposals' | 'proposals'>('invites')

  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      setLoading(true)
      const supabase = createSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // 팀 초대 조회 (team_members 테이블에서 본인이 초대된 경우)
      // 먼저 현재 사용자의 profile_id를 찾아야 함
      const { data: currentProfile } = await supabase
        .from('accounts')
        .select('profile_id')
        .eq('user_id', user.id)
        .eq('profile_type', 'FREELANCER')
        .maybeSingle()

      if (!currentProfile) {
        setLoading(false)
        return
      }

      const { data: invites, error: invitesError } = await supabase
        .from('team_members')
        .select(
          `
          id,
          team_id,
          status,
          created_at,
          teams:team_id (
            id,
            name,
            manager_id,
            manager_profile_id
          )
        `
        )
        .eq('profile_id', currentProfile.profile_id)
        .order('created_at', { ascending: false })

      if (invitesError) {
        console.error('팀 초대 조회 실패:', invitesError)
      } else {
        // 매니저 정보를 별도로 조회
        const teamIds = invites?.map((invite: any) => invite.teams?.manager_profile_id).filter(Boolean) || []
        const managerProfiles: Record<string, any> = {}
        
        if (teamIds.length > 0) {
          const { data: managers } = await supabase
            .from('accounts')
            .select('profile_id, username')
            .in('profile_id', teamIds)
          
          if (managers) {
            managers.forEach((manager: any) => {
              managerProfiles[manager.profile_id] = manager
            })
          }
        }

        const formattedInvites: TeamInvite[] =
          invites?.map((invite: any) => {
            const managerProfile = invite.teams?.manager_profile_id 
              ? managerProfiles[invite.teams.manager_profile_id]
              : null
            
            return {
              id: invite.id,
              team_id: invite.team_id,
              team_name: invite.teams?.name || '알 수 없음',
              manager_id: invite.teams?.manager_id || '',
              manager_name: managerProfile?.username || '알 수 없음',
              status: invite.status,
              created_at: invite.created_at,
            }
          }) || []
        setTeamInvites(formattedInvites)
      }

      // 팀 제안 조회 (team_proposals 테이블에서 본인이 받은 제안)
      // teams 조인을 피하고 별도로 조회하여 PostgREST 관계 충돌 방지
      const { data: proposals, error: teamProposalsError } = await supabase
        .from('team_proposals')
        .select('id, team_id, manager_id, message, created_at')
        .eq('maker_id', user.id)
        .order('created_at', { ascending: false })

      if (teamProposalsError) {
        console.error('팀 제안 조회 실패:', teamProposalsError)
        setTeamProposals([])
      } else if (!proposals || proposals.length === 0) {
        setTeamProposals([])
      } else {
        // team_id 목록 추출
        const teamIds = proposals
          .map((p: any) => p.team_id)
          .filter((id: any) => id !== null) as number[]
        
        // 팀 정보 별도 조회
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

        // 매니저 정보를 별도로 조회
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

        const formattedTeamProposals: TeamProposal[] =
          proposals.map((proposal: any) => {
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

      // 기업 제안 조회 (project_members 테이블에서 본인이 초대된 경우)
      const { data: profile } = await supabase
        .from('accounts')
        .select('profile_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single()

      if (profile) {
        const { data: proposals, error: proposalsError } = await supabase
          .from('project_members')
          .select(
            `
            id,
            counsel_id,
            status,
            created_at,
            counsel:counsel_id (
              counsel_id,
              title,
              client_id
            )
          `
          )
          .eq('profile_id', profile.profile_id)
          .order('created_at', { ascending: false })

        if (proposalsError) {
          console.error('기업 제안 조회 실패:', proposalsError)
        } else {
          // 클라이언트 정보를 별도로 조회
          const clientIds = proposals?.map((p: any) => p.counsel?.client_id).filter(Boolean) || []
          const clientInfo: Record<string, any> = {}
          
          if (clientIds.length > 0) {
            const { data: clients } = await supabase
              .from('client')
              .select('user_id, company_name')
              .in('user_id', clientIds)
            
            if (clients) {
              // accounts 테이블에서 username 조회
              const userIds = clients.map((c: any) => c.user_id)
              const { data: accounts } = await supabase
                .from('accounts')
                .select('user_id, username')
                .in('user_id', userIds)
                .eq('profile_type', 'COMPANY')
              
              if (accounts) {
                const accountMap: Record<string, any> = {}
                accounts.forEach((acc: any) => {
                  accountMap[acc.user_id] = acc
                })
                
                clients.forEach((client: any) => {
                  clientInfo[client.user_id] = {
                    company_name: client.company_name,
                    username: accountMap[client.user_id]?.username || client.company_name || '알 수 없음'
                  }
                })
              }
            }
          }

          const formattedProposals: CompanyProposal[] =
            proposals?.map((proposal: any) => {
              const client = proposal.counsel?.client_id 
                ? clientInfo[proposal.counsel.client_id]
                : null
              
              return {
                id: proposal.id,
                counsel_id: proposal.counsel_id,
                counsel_title: proposal.counsel?.title || '제목 없음',
                client_id: proposal.counsel?.client_id || '',
                client_name: client?.username || client?.company_name || '알 수 없음',
                status: proposal.status,
                created_at: proposal.created_at,
              }
            }) || []
          setCompanyProposals(formattedProposals)
        }
      }
    } catch (error: any) {
      console.error('메시지 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '메시지를 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTeamInviteAction = async (
    inviteId: number,
    action: 'accept' | 'decline'
  ) => {
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase
        .from('team_members')
        .update({
          status: action === 'accept' ? 'active' : 'declined',
          updated_at: new Date().toISOString(),
        })
        .eq('id', inviteId)

      if (error) throw error

      toast({
        title: action === 'accept' ? '팀 초대를 수락했습니다' : '팀 초대를 거절했습니다',
      })

      await loadMessages()
    } catch (error: any) {
      console.error('팀 초대 처리 실패:', error)
      toast({
        variant: 'destructive',
        title: '처리에 실패했습니다',
        description: error.message,
      })
    }
  }

  const handleProposalAction = async (
    proposalId: number,
    action: 'accept' | 'decline'
  ) => {
    try {
      const supabase = createSupabaseBrowserClient()
      const status = action === 'accept' ? 'ACTIVE' : 'LEFT'
      const { error } = await supabase
        .from('project_members')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(action === 'accept' && {
            joined_at: new Date().toISOString(),
          }),
        })
        .eq('id', proposalId)

      if (error) throw error

      toast({
        title:
          action === 'accept'
            ? '프로젝트 제안을 수락했습니다'
            : '프로젝트 제안을 거절했습니다',
      })

      await loadMessages()
    } catch (error: any) {
      console.error('제안 처리 실패:', error)
      toast({
        variant: 'destructive',
        title: '처리에 실패했습니다',
        description: error.message,
      })
    }
  }

  const getStatusBadge = (status: string | null) => {
    if (!status || status === 'pending' || status === 'INVITED') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
          대기 중
        </span>
      )
    }
    if (status === 'active' || status === 'ACTIVE') {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
          수락됨
        </span>
      )
    }
    return (
      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
        거절됨
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">메시지를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">쪽지함</h1>

        {/* 탭 */}
        <div className="flex gap-2 border-b mb-4 md:mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('invites')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'invites'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            팀 초대 ({teamInvites.length})
          </button>
          <button
            onClick={() => setActiveTab('team-proposals')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'team-proposals'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            팀 제안 ({teamProposals.length})
          </button>
          <button
            onClick={() => setActiveTab('proposals')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'proposals'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            기업 제안 ({companyProposals.length})
          </button>
        </div>

        {/* 팀 초대 목록 */}
        {activeTab === 'invites' && (
          <div className="space-y-4">
            {teamInvites.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">팀 초대가 없습니다.</p>
              </div>
            ) : (
              teamInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-white rounded-lg shadow-sm border p-4 md:p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {invite.team_name} 팀 초대
                      </h3>
                      <p className="text-sm text-gray-600">
                        매니저: {invite.manager_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(invite.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    {getStatusBadge(invite.status)}
                  </div>
                  {(!invite.status || invite.status === 'pending') && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleTeamInviteAction(invite.id, 'accept')}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        수락
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleTeamInviteAction(invite.id, 'decline')}
                        className="flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        거절
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* 팀 제안 목록 */}
        {activeTab === 'team-proposals' && (
          <div className="space-y-4">
            {teamProposals.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">받은 팀 제안이 없습니다.</p>
              </div>
            ) : (
              teamProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-white rounded-lg shadow-sm border p-4 md:p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {proposal.team_name} 팀 제안
                      </h3>
                      <p className="text-sm text-gray-600">
                        매니저: {proposal.manager_name}
                      </p>
                      {proposal.message && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {proposal.message}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(proposal.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {proposal.team_id && (
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/team/${proposal.team_id}`)}
                      >
                        팀 프로필 보기
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 기업 제안 목록 */}
        {activeTab === 'proposals' && (
          <div className="space-y-4">
            {companyProposals.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
                <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">기업 제안이 없습니다.</p>
              </div>
            ) : (
              companyProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-white rounded-lg shadow-sm border p-4 md:p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {proposal.counsel_title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        기업: {proposal.client_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(proposal.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    {getStatusBadge(proposal.status)}
                  </div>
                  {(!proposal.status || proposal.status === 'INVITED') && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleProposalAction(proposal.id, 'accept')}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        수락
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleProposalAction(proposal.id, 'decline')}
                        className="flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        거절
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          router.push(`/project-detail/${proposal.counsel_id}`)
                        }
                      >
                        상세 보기
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

