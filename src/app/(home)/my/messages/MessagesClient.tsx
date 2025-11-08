'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, Mail, Users, Building2 } from 'lucide-react'
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

interface SentTeamProposal {
  id: number
  team_id: number | null
  team_name: string
  maker_id: string
  maker_name: string
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

interface SentTeamJoinRequest {
  id: number
  team_id: number
  team_name: string
  status: string
  created_at: string
}

export default function MessagesClient() {
  const router = useRouter()
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([])
  const [teamProposals, setTeamProposals] = useState<TeamProposal[]>([])
  const [sentTeamProposals, setSentTeamProposals] = useState<SentTeamProposal[]>([])
  const [sentTeamJoinRequests, setSentTeamJoinRequests] = useState<SentTeamJoinRequest[]>([])
  const [teamJoinRequests, setTeamJoinRequests] = useState<TeamJoinRequest[]>([])
  const [companyProposals, setCompanyProposals] = useState<CompanyProposal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'invites' | 'team-proposals' | 'sent-proposals' | 'sent-join-requests' | 'join-requests' | 'proposals'>('invites')

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
          request_type,
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
        .eq('request_type', 'invite') // 매니저가 초대한 것만
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

      // 보낸 팀 제안 조회 (team_proposals 테이블에서 본인이 보낸 제안)
      const { data: sentProposals, error: sentProposalsError } = await supabase
        .from('team_proposals')
        .select('id, team_id, maker_id, message, created_at')
        .eq('manager_id', user.id)
        .order('created_at', { ascending: false })

      if (sentProposalsError) {
        console.error('보낸 팀 제안 조회 실패:', sentProposalsError)
        setSentTeamProposals([])
      } else if (!sentProposals || sentProposals.length === 0) {
        setSentTeamProposals([])
      } else {
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

        const formattedSentProposals: SentTeamProposal[] =
          sentProposals.map((proposal: any) => {
            const team = proposal.team_id ? sentTeamInfo[proposal.team_id] : null
            const maker = makerInfo[proposal.maker_id]
            
            return {
              id: proposal.id,
              team_id: proposal.team_id,
              team_name: team?.name || '알 수 없음',
              maker_id: proposal.maker_id,
              maker_name: maker?.username || '알 수 없음',
              message: proposal.message,
              created_at: proposal.created_at,
            }
          })
        setSentTeamProposals(formattedSentProposals)
      }

      // 메이커가 보낸 합류 신청 조회 (team_members 테이블에서 status가 'pending'이고 request_type이 'request'인 경우)
      const { data: sentJoinRequests, error: sentJoinRequestsError } = await supabase
        .from('team_members')
        .select('id, team_id, status, created_at')
        .eq('profile_id', currentProfile.profile_id)
        .eq('status', 'pending')
        .eq('request_type', 'request') // 메이커가 신청한 것만
        .order('created_at', { ascending: false })

      if (sentJoinRequestsError) {
        console.error('보낸 합류 신청 조회 실패:', sentJoinRequestsError)
        setSentTeamJoinRequests([])
      } else if (!sentJoinRequests || sentJoinRequests.length === 0) {
        setSentTeamJoinRequests([])
      } else {
        // 팀 정보 조회
        const sentJoinTeamIds = sentJoinRequests
          .map((r: any) => r.team_id)
          .filter((id: any) => id !== null) as number[]
        
        const sentJoinTeamInfo: Record<number, any> = {}
        if (sentJoinTeamIds.length > 0) {
          const { data: teams } = await supabase
            .from('teams')
            .select('id, name')
            .in('id', sentJoinTeamIds)
          
          if (teams) {
            teams.forEach((team: any) => {
              sentJoinTeamInfo[team.id] = team
            })
          }
        }

        const formattedSentJoinRequests: SentTeamJoinRequest[] =
          sentJoinRequests.map((request: any) => {
            const team = sentJoinTeamInfo[request.team_id]
            
            return {
              id: request.id,
              team_id: request.team_id,
              team_name: team?.name || '알 수 없음',
              status: request.status,
              created_at: request.created_at,
            }
          })
        setSentTeamJoinRequests(formattedSentJoinRequests)
      }

      // 매니저가 받은 합류 신청 조회 (team_members 테이블에서 status가 'pending'인 경우)
      // 현재 사용자가 매니저인 팀들의 합류 신청 조회
      const { data: managedTeams } = await supabase
        .from('teams')
        .select('id, name')
        .eq('manager_profile_id', currentProfile.profile_id)

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
          .eq('request_type', 'request') // 메이커가 신청한 것만
          .order('created_at', { ascending: false })

        if (joinRequestsError) {
          console.error('합류 신청 조회 실패:', joinRequestsError)
          setTeamJoinRequests([])
        } else if (!joinRequests || joinRequests.length === 0) {
          setTeamJoinRequests([])
        } else {
          // 메이커 정보 조회
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

          const formattedJoinRequests: TeamJoinRequest[] =
            joinRequests.map((request: any) => {
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
      } else {
        setTeamJoinRequests([])
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

  const handleJoinRequestAction = async (
    requestId: number,
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
        .eq('id', requestId)

      if (error) throw error

      toast({
        title: action === 'accept' ? '합류 신청을 수락했습니다' : '합류 신청을 거절했습니다',
      })

      await loadMessages()
    } catch (error: any) {
      console.error('합류 신청 처리 실패:', error)
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
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" />
          대기 중
        </span>
      )
    }
    if (status === 'active' || status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3.5 h-3.5" />
          수락됨
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-red-50 text-red-700 border border-red-200">
        <XCircle className="w-3.5 h-3.5" />
        거절됨
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">메시지를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-8 pr-6 md:pr-8 overflow-x-hidden">
      <div className="mb-8">
      <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">쪽지함</h1>
          <p className="text-sm text-gray-500">팀 초대 및 프로젝트 제안을 확인하세요</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-1 bg-gray-50 p-1 rounded-lg mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('invites')}
            className={`px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap rounded-md ${
              activeTab === 'invites'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            팀 초대
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'invites' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {teamInvites.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('team-proposals')}
            className={`px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap rounded-md ${
              activeTab === 'team-proposals'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            받은 팀 제안
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'team-proposals' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {teamProposals.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sent-proposals')}
            className={`px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap rounded-md ${
              activeTab === 'sent-proposals'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            보낸 팀 제안 (매니저)
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'sent-proposals' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {sentTeamProposals.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('sent-join-requests')}
            className={`px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap rounded-md ${
              activeTab === 'sent-join-requests'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            보낸 합류 신청 (메이커)
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'sent-join-requests' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {sentTeamJoinRequests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('join-requests')}
            className={`px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap rounded-md ${
              activeTab === 'join-requests'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            받은 합류 신청 (매니저)
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'join-requests' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {teamJoinRequests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('proposals')}
            className={`px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap rounded-md ${
              activeTab === 'proposals'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            기업 제안
            <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
              activeTab === 'proposals' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {companyProposals.length}
            </span>
          </button>
        </div>

        {/* 팀 초대 목록 */}
        {activeTab === 'invites' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900">팀 초대:</span> 다른 매니저가 나를 팀 멤버로 초대한 내역입니다. 수락하면 해당 팀의 멤버가 되며, 거절할 수 있습니다.
              </p>
            </div>
            {teamInvites.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">팀 초대가 없습니다</p>
                <p className="text-sm text-gray-500 mt-1">새로운 팀 초대가 오면 여기에 표시됩니다</p>
              </div>
            ) : (
              teamInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {invite.team_name} 팀 초대
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        매니저: <span className="font-medium">{invite.manager_name}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(invite.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="ml-4">
                    {getStatusBadge(invite.status)}
                    </div>
                  </div>
                  {(!invite.status || invite.status === 'pending') && (
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <Button
                        onClick={() => handleTeamInviteAction(invite.id, 'accept')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        수락
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleTeamInviteAction(invite.id, 'decline')}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        거절
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* 받은 팀 제안 목록 */}
        {activeTab === 'team-proposals' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900">받은 팀 제안:</span> 다른 매니저가 나에게 팀 합류를 제안한 내역입니다. 제안 내용과 팀 정보를 확인할 수 있습니다.
              </p>
            </div>
            {teamProposals.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">받은 팀 제안이 없습니다</p>
                <p className="text-sm text-gray-500 mt-1">새로운 팀 제안이 오면 여기에 표시됩니다</p>
              </div>
            ) : (
              teamProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors p-6"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {proposal.team_name} 팀 제안
                      </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      매니저: <span className="font-medium">{proposal.manager_name}</span>
                      </p>
                      {proposal.message && (
                      <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {proposal.message}
                          </p>
                        </div>
                      )}
                    <p className="text-xs text-gray-500 mt-3">
                      {new Date(proposal.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                  </div>
                  {proposal.team_id && (
                    <div className="pt-4 border-t border-gray-100">
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/team/${proposal.team_id}`)}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        팀 프로필 보기
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* 보낸 팀 제안 목록 (매니저가 메이커에게 보낸 제안) */}
        {activeTab === 'sent-proposals' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900">보낸 팀 제안 (매니저):</span> 내가 매니저로서 다른 메이커에게 팀 합류를 제안한 내역입니다. 제안한 메이커와 팀 정보를 확인할 수 있습니다.
              </p>
            </div>
            {sentTeamProposals.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">보낸 팀 제안이 없습니다</p>
                <p className="text-sm text-gray-500 mt-1">메이커에게 팀 제안을 보내면 여기에 표시됩니다</p>
              </div>
            ) : (
              sentTeamProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors p-6"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {proposal.team_name} 팀 제안
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      메이커: <span className="font-medium">{proposal.maker_name}</span>
                    </p>
                    {proposal.message && (
                      <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {proposal.message}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-3">
                      {new Date(proposal.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    {proposal.team_id && (
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/team/${proposal.team_id}`)}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        팀 프로필 보기
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/profile/${encodeURIComponent(proposal.maker_name)}`)}
                      className="border-gray-300 hover:bg-gray-50"
                    >
                      메이커 프로필 보기
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 보낸 합류 신청 목록 (메이커가 팀에 보낸 신청) */}
        {activeTab === 'sent-join-requests' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900">보낸 합류 신청 (메이커):</span> 내가 메이커로서 팀에 합류를 신청한 내역입니다. 매니저의 승인을 기다리는 중입니다.
              </p>
            </div>
            {sentTeamJoinRequests.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">보낸 합류 신청이 없습니다</p>
                <p className="text-sm text-gray-500 mt-1">팀에 합류 신청을 보내면 여기에 표시됩니다</p>
              </div>
            ) : (
              sentTeamJoinRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {request.team_name} 팀 합류 신청
                      </h3>
                      <p className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                  {request.team_id && (
                    <div className="pt-4 border-t border-gray-100">
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/team/${request.team_id}`)}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        팀 프로필 보기
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* 받은 합류 신청 목록 (매니저가 받은 신청) */}
        {activeTab === 'join-requests' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900">받은 합류 신청 (매니저):</span> 메이커가 내 팀에 합류를 신청한 내역입니다. 수락하면 해당 메이커가 팀원이 되며, 거절할 수 있습니다.
              </p>
            </div>
            {teamJoinRequests.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">받은 합류 신청이 없습니다</p>
                <p className="text-sm text-gray-500 mt-1">메이커가 팀 합류를 신청하면 여기에 표시됩니다</p>
              </div>
            ) : (
              teamJoinRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {request.team_name} 팀 합류 신청
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        메이커: <span className="font-medium">{request.maker_name}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                  {request.status === 'pending' && (
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <Button
                        onClick={() => handleJoinRequestAction(request.id, 'accept')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        수락
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleJoinRequestAction(request.id, 'decline')}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        거절
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/profile/${encodeURIComponent(request.maker_name)}`)}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        메이커 프로필 보기
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* 기업 제안 목록 */}
        {activeTab === 'proposals' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900">기업 제안:</span> 기업이 나를 프로젝트에 초대한 내역입니다. 수락하면 프로젝트에 참여하게 되며, 거절할 수 있습니다.
              </p>
            </div>
            {companyProposals.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">기업 제안이 없습니다</p>
                <p className="text-sm text-gray-500 mt-1">새로운 프로젝트 제안이 오면 여기에 표시됩니다</p>
              </div>
            ) : (
              companyProposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-colors p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {proposal.counsel_title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        기업: <span className="font-medium">{proposal.client_name}</span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(proposal.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="ml-4">
                    {getStatusBadge(proposal.status)}
                    </div>
                  </div>
                  {(!proposal.status || proposal.status === 'INVITED') && (
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <Button
                        onClick={() => handleProposalAction(proposal.id, 'accept')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        수락
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleProposalAction(proposal.id, 'decline')}
                        className="border-gray-300 hover:bg-gray-50"
                      >
                        거절
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/project-detail/${proposal.counsel_id}`)}
                        className="border-gray-300 hover:bg-gray-50"
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

