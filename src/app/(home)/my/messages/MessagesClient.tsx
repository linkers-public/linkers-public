'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, Mail, Users, Building2, UserCircle, ChevronRight, Info, X, Calendar, MessageSquare, UserPlus, Send, FileText, DollarSign } from 'lucide-react'
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

interface TeamEstimateRequest {
  id: number
  team_id: number
  team_name: string
  counsel_id: number | null
  counsel_title: string | null
  message: string | null
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
  const [teamEstimateRequests, setTeamEstimateRequests] = useState<TeamEstimateRequest[]>([])
  const [profileType, setProfileType] = useState<'FREELANCER' | 'COMPANY' | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'invites' | 'team-proposals' | 'sent-proposals' | 'sent-join-requests' | 'join-requests' | 'proposals' | 'estimate-requests'>('invites')
  const [showInfo, setShowInfo] = useState(true)

  // 상대 시간 포맷 함수
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return '방금 전'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`
    
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

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

      // 활성 프로필 확인
      const { data: activeProfile } = await supabase
        .from('accounts')
        .select('profile_id, profile_type')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle()

      if (!activeProfile) {
        setLoading(false)
        return
      }

      setProfileType(activeProfile.profile_type as 'FREELANCER' | 'COMPANY')

      // 프로필 타입에 따라 다른 메시지 로드
      if (activeProfile.profile_type === 'FREELANCER') {
        await loadFreelancerMessages(supabase, user.id, activeProfile.profile_id)
      } else if (activeProfile.profile_type === 'COMPANY') {
        await loadCompanyMessages(supabase, user.id, activeProfile.profile_id)
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

  const loadFreelancerMessages = async (supabase: any, userId: string, profileId: string) => {
    try {
      let hasInvites = false
      let hasTeamProposals = false
      let hasProposals = false

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
        .eq('profile_id', profileId)
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
        hasInvites = formattedInvites.length > 0
      }

      // 팀 제안 조회 (team_proposals 테이블에서 본인이 받은 제안)
      // teams 조인을 피하고 별도로 조회하여 PostgREST 관계 충돌 방지
      const { data: teamProposalsData, error: teamProposalsError } = await supabase
        .from('team_proposals')
        .select('id, team_id, manager_id, message, created_at')
        .eq('maker_id', userId)
        .order('created_at', { ascending: false })

      if (teamProposalsError) {
        console.error('팀 제안 조회 실패:', teamProposalsError)
        setTeamProposals([])
      } else if (!teamProposalsData || teamProposalsData.length === 0) {
        setTeamProposals([])
      } else {
        // team_id 목록 추출
        const teamIds = teamProposalsData
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
        const managerIds = teamProposalsData
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
          teamProposalsData.map((proposal: any) => {
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
        hasTeamProposals = formattedTeamProposals.length > 0
      }

      // 보낸 팀 제안 조회 (team_proposals 테이블에서 본인이 보낸 제안)
      const { data: sentProposals, error: sentProposalsError } = await supabase
        .from('team_proposals')
        .select('id, team_id, maker_id, message, created_at')
        .eq('manager_id', userId)
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
        .eq('profile_id', profileId)
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
        .eq('manager_profile_id', profileId)

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

      // 프리랜서가 받는 기업 제안 조회 (project_members 테이블에서 본인이 초대된 경우)
      const { data: companyProposalsData, error: proposalsError } = await supabase
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
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })

      if (proposalsError) {
        console.error('기업 제안 조회 실패:', proposalsError)
      } else {
        // 클라이언트 정보를 별도로 조회
        const clientIds = companyProposalsData?.map((p: any) => p.counsel?.client_id).filter(Boolean) || []
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
          companyProposalsData?.map((proposal: any) => {
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
        hasProposals = formattedProposals.length > 0
      }

      // 프리랜서 프로필일 때 기본 탭 설정
      if (hasInvites) {
        setActiveTab('invites')
      } else if (hasTeamProposals) {
        setActiveTab('team-proposals')
      } else if (hasProposals) {
        setActiveTab('proposals')
      }
    } catch (error: any) {
      console.error('프리랜서 메시지 로드 실패:', error)
      throw error
    }
  }

  const loadCompanyMessages = async (supabase: any, userId: string, profileId: string) => {
    try {
      let hasEstimateRequests = false
      let hasProposals = false

      // 기업이 받는 프로젝트 제안 조회 (project_members 테이블)
      // PostgREST 조인을 피하고 별도로 조회하여 안정성 향상
      const { data: companyProposalsData, error: proposalsError } = await supabase
        .from('project_members')
        .select('id, counsel_id, status, created_at')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false })

      if (proposalsError) {
        console.error('기업 제안 조회 실패:', proposalsError)
        setCompanyProposals([])
      } else if (companyProposalsData && companyProposalsData.length > 0) {
        // counsel_id 목록 추출
        const counselIds = companyProposalsData
          .map((p: any) => p.counsel_id)
          .filter((id: any) => id !== null && id !== undefined) as number[]
        
        // counsel 정보 별도 조회
        const counselInfo: Record<number, any> = {}
        if (counselIds.length > 0) {
          const { data: counsels, error: counselsError } = await supabase
            .from('counsel')
            .select('counsel_id, title, client_id')
            .in('counsel_id', counselIds)
          
          if (counselsError) {
            console.error('프로젝트 정보 조회 실패:', counselsError)
          } else if (counsels) {
            counsels.forEach((counsel: any) => {
              counselInfo[counsel.counsel_id] = counsel
            })
          }
        }

        // 클라이언트 정보를 별도로 조회
        const clientIds = Object.values(counselInfo)
          .map((c: any) => c?.client_id)
          .filter((id: any) => id !== null && id !== undefined) as string[]
        
        const clientInfo: Record<string, any> = {}
        if (clientIds.length > 0) {
          const { data: clients, error: clientsError } = await supabase
            .from('client')
            .select('user_id, company_name')
            .in('user_id', clientIds)
          
          if (clientsError) {
            console.error('클라이언트 정보 조회 실패:', clientsError)
          } else if (clients) {
            const userIds = clients.map((c: any) => c.user_id)
            const { data: accounts, error: accountsError } = await supabase
              .from('accounts')
              .select('user_id, username')
              .in('user_id', userIds)
              .eq('profile_type', 'COMPANY')
            
            if (accountsError) {
              console.error('계정 정보 조회 실패:', accountsError)
            } else if (accounts) {
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
          companyProposalsData.map((proposal: any) => {
            const counsel = counselInfo[proposal.counsel_id]
            const client = counsel?.client_id 
              ? clientInfo[counsel.client_id]
              : null
            
            return {
              id: proposal.id,
              counsel_id: proposal.counsel_id,
              counsel_title: counsel?.title || '제목 없음',
              client_id: counsel?.client_id || '',
              client_name: client?.username || client?.company_name || '알 수 없음',
              status: proposal.status,
              created_at: proposal.created_at,
            }
          })
        setCompanyProposals(formattedProposals)
        hasProposals = formattedProposals.length > 0
      } else {
        setCompanyProposals([])
      }

      // 기업이 받는 팀 견적 요청 조회 (notifications 테이블)
      // client 테이블에서 기업의 user_id 확인
      const { data: clientData } = await supabase
        .from('client')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (clientData) {
        const { data: estimateRequests, error: estimateRequestsError } = await supabase
          .from('notifications')
          .select('id, sender_team_id, counsel_id, payload, status, created_at')
          .eq('type', 'TEAM_TO_CLIENT_ESTIMATE_REQUEST')
          .eq('target_client_id', userId)
          .eq('status', 'PENDING')
          .order('created_at', { ascending: false })

        if (estimateRequestsError) {
          console.error('팀 견적 요청 조회 실패:', estimateRequestsError)
          setTeamEstimateRequests([])
        } else if (estimateRequests && estimateRequests.length > 0) {
          // 팀 정보 조회
          const teamIds = estimateRequests
            .map((req: any) => req.sender_team_id)
            .filter((id: any) => id !== null && id !== undefined) as number[]
          
          const teamInfo: Record<number, any> = {}
          if (teamIds.length > 0) {
            const { data: teams, error: teamsError } = await supabase
              .from('teams')
              .select('id, name')
              .in('id', teamIds)
            
            if (teamsError) {
              console.error('팀 정보 조회 실패:', teamsError)
            } else if (teams) {
              teams.forEach((team: any) => {
                teamInfo[team.id] = team
              })
            }
          }

          // counsel 정보 조회 (counsel_id가 있는 경우만)
          const counselIds = estimateRequests
            .map((req: any) => req.counsel_id)
            .filter((id: any) => id !== null && id !== undefined) as number[]
          
          const counselInfo: Record<number, any> = {}
          if (counselIds.length > 0) {
            const { data: counsels, error: counselsError } = await supabase
              .from('counsel')
              .select('counsel_id, title')
              .in('counsel_id', counselIds)
            
            if (counselsError) {
              console.error('프로젝트 정보 조회 실패:', counselsError)
            } else if (counsels) {
              counsels.forEach((counsel: any) => {
                counselInfo[counsel.counsel_id] = counsel
              })
            }
          }

          const formattedEstimateRequests: TeamEstimateRequest[] =
            estimateRequests.map((req: any) => {
              const team = req.sender_team_id ? teamInfo[req.sender_team_id] : null
              const counsel = req.counsel_id ? counselInfo[req.counsel_id] : null
              
              return {
                id: req.id,
                team_id: req.sender_team_id || 0,
                team_name: team?.name || '알 수 없음',
                counsel_id: req.counsel_id || null,
                counsel_title: counsel?.title || null,
                message: req.payload?.note || req.payload?.message || null,
                status: req.status,
                created_at: req.created_at,
              }
            })
          setTeamEstimateRequests(formattedEstimateRequests)
          hasEstimateRequests = formattedEstimateRequests.length > 0
        } else {
          setTeamEstimateRequests([])
        }
      } else {
        setTeamEstimateRequests([])
      }

      // 기업 프로필일 때 기본 탭 설정
      if (hasEstimateRequests) {
        setActiveTab('estimate-requests')
      } else if (hasProposals) {
        setActiveTab('proposals')
      }
    } catch (error: any) {
      console.error('기업 메시지 로드 실패:', error)
      throw error
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" />
          대기 중
        </span>
      )
    }
    if (status === 'active' || status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3 h-3" />
          수락됨
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-700 border border-red-200">
        <XCircle className="w-3 h-3" />
        거절됨
      </span>
    )
  }

  // 탭 버튼 컴포넌트
  const TabButton = ({ 
    active, 
    onClick, 
    icon, 
    label, 
    count, 
    highlight = false 
  }: { 
    active: boolean
    onClick: () => void
    icon: React.ReactNode
    label: string
    count: number
    highlight?: boolean
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap rounded-lg ${
        active
          ? 'bg-blue-600 text-white shadow-md'
          : highlight
          ? 'bg-white text-gray-900 border-2 border-blue-300 shadow-sm'
          : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span>{label}</span>
      {count > 0 && (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
          active 
            ? 'bg-white/20 text-white' 
            : highlight
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-700'
        }`}>
          {count}
        </span>
      )}
    </button>
  )

  // 메시지 카드 컴포넌트
  const MessageCard = ({
    type,
    title,
    subtitle,
    message,
    time,
    status,
    statusBadge,
    actions,
    onClick,
    icon,
  }: {
    type?: string
    title: string
    subtitle?: string
    message?: string | null
    time: string
    status?: string | null
    statusBadge: React.ReactNode
    actions?: React.ReactNode
    onClick?: () => void
    icon?: React.ReactNode
  }) => {
    const getIcon = () => {
      if (icon) return icon
      switch (type) {
        case 'invite':
          return <Users className="w-5 h-5 text-blue-600" />
        case 'proposal':
          return <MessageSquare className="w-5 h-5 text-purple-600" />
        case 'estimate':
          return <FileText className="w-5 h-5 text-green-600" />
        default:
          return <Mail className="w-5 h-5 text-gray-600" />
      }
    }

    return (
      <div
        className={`bg-white rounded-xl border-2 transition-all duration-200 ${
          !status || status === 'pending' || status === 'INVITED'
            ? 'border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md'
            : 'border-gray-200 hover:border-gray-300'
        } overflow-hidden`}
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* 아이콘 */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
              {getIcon()}
            </div>
            
            {/* 내용 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 
                    className={`text-lg font-bold text-gray-900 mb-1 ${
                      onClick ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''
                    }`}
                    onClick={onClick}
                  >
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-sm text-gray-600 flex items-center gap-1.5">
                      <UserCircle className="w-3.5 h-3.5" />
                      {subtitle}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {statusBadge}
                </div>
              </div>

              {/* 메시지 내용 */}
              {message && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {message}
                  </p>
                </div>
              )}

              {/* 시간 */}
              <div className="flex items-center gap-1.5 mt-3 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{time}</span>
              </div>

              {/* 액션 버튼 */}
              {actions && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  {actions}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 빈 상태 컴포넌트
  const EmptyState = ({
    icon,
    title,
    description,
  }: {
    icon: React.ReactNode
    title: string
    description: string
  }) => (
    <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
    </div>
  )

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
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">쪽지함</h1>
            <p className="text-sm text-gray-500">
              {profileType === 'FREELANCER' 
                ? '팀 초대 및 프로젝트 제안을 확인하세요'
                : '프로젝트 제안 및 팀 견적 요청을 확인하세요'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadMessages()}
            className="text-gray-600 hover:text-gray-900"
          >
            새로고침
          </Button>
        </div>

        {/* 탭 - 프로필 타입에 따라 다르게 표시 */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {profileType === 'FREELANCER' ? (
              <>
                <TabButton
                  active={activeTab === 'invites'}
                  onClick={() => setActiveTab('invites')}
                  icon={<Mail className="w-4 h-4" />}
                  label="팀 초대"
                  count={teamInvites.length}
                  highlight={teamInvites.filter(i => !i.status || i.status === 'pending').length > 0}
                />
                <TabButton
                  active={activeTab === 'team-proposals'}
                  onClick={() => setActiveTab('team-proposals')}
                  icon={<MessageSquare className="w-4 h-4" />}
                  label="받은 팀 제안"
                  count={teamProposals.length}
                />
                <TabButton
                  active={activeTab === 'proposals'}
                  onClick={() => setActiveTab('proposals')}
                  icon={<Building2 className="w-4 h-4" />}
                  label="기업 제안"
                  count={companyProposals.filter(p => !p.status || p.status === 'INVITED').length}
                  highlight={companyProposals.filter(p => !p.status || p.status === 'INVITED').length > 0}
                />
                <TabButton
                  active={activeTab === 'join-requests'}
                  onClick={() => setActiveTab('join-requests')}
                  icon={<UserPlus className="w-4 h-4" />}
                  label="받은 합류 신청"
                  count={teamJoinRequests.filter(r => r.status === 'pending').length}
                  highlight={teamJoinRequests.filter(r => r.status === 'pending').length > 0}
                />
                <TabButton
                  active={activeTab === 'sent-proposals'}
                  onClick={() => setActiveTab('sent-proposals')}
                  icon={<Send className="w-4 h-4" />}
                  label="보낸 팀 제안"
                  count={sentTeamProposals.length}
                />
                <TabButton
                  active={activeTab === 'sent-join-requests'}
                  onClick={() => setActiveTab('sent-join-requests')}
                  icon={<Send className="w-4 h-4" />}
                  label="보낸 합류 신청"
                  count={sentTeamJoinRequests.filter(r => r.status === 'pending').length}
                />
              </>
            ) : (
              <>
                <TabButton
                  active={activeTab === 'estimate-requests'}
                  onClick={() => setActiveTab('estimate-requests')}
                  icon={<FileText className="w-4 h-4" />}
                  label="팀 견적 요청"
                  count={teamEstimateRequests.length}
                  highlight={teamEstimateRequests.length > 0}
                />
                <TabButton
                  active={activeTab === 'proposals'}
                  onClick={() => setActiveTab('proposals')}
                  icon={<Building2 className="w-4 h-4" />}
                  label="프로젝트 제안"
                  count={companyProposals.filter(p => !p.status || p.status === 'INVITED').length}
                  highlight={companyProposals.filter(p => !p.status || p.status === 'INVITED').length > 0}
                />
              </>
            )}
          </div>
        </div>

        {/* 팀 초대 목록 */}
        {activeTab === 'invites' && (
          <div className="space-y-3">
            {showInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 relative">
                <button
                  onClick={() => setShowInfo(false)}
                  className="absolute top-2 right-2 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-900 leading-relaxed flex-1">
                    <span className="font-semibold">팀 초대:</span> 다른 매니저가 나를 팀 멤버로 초대한 내역입니다. 수락하면 해당 팀의 멤버가 되며, 거절할 수 있습니다.
                  </p>
                </div>
              </div>
            )}
            {teamInvites.length === 0 ? (
              <EmptyState
                icon={<Mail className="w-12 h-12" />}
                title="팀 초대가 없습니다"
                description="새로운 팀 초대가 오면 여기에 표시됩니다"
              />
            ) : (
              teamInvites.map((invite) => (
                <MessageCard
                  key={invite.id}
                  type="invite"
                  title={`${invite.team_name} 팀 초대`}
                  subtitle={`매니저: ${invite.manager_name}`}
                  time={formatRelativeTime(invite.created_at)}
                  status={invite.status}
                  statusBadge={getStatusBadge(invite.status)}
                  actions={
                    (!invite.status || invite.status === 'pending') ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleTeamInviteAction(invite.id, 'accept')}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          수락
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleTeamInviteAction(invite.id, 'decline')}
                          className="border-gray-300 hover:bg-gray-50"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          거절
                        </Button>
                      </div>
                    ) : null
                  }
                  onClick={() => invite.team_id && router.push(`/team/${invite.team_id}`)}
                />
              ))
            )}
          </div>
        )}

        {/* 받은 팀 제안 목록 */}
        {activeTab === 'team-proposals' && (
          <div className="space-y-3">
            {teamProposals.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="w-12 h-12" />}
                title="받은 팀 제안이 없습니다"
                description="새로운 팀 제안이 오면 여기에 표시됩니다"
              />
            ) : (
              teamProposals.map((proposal) => (
                <MessageCard
                  key={proposal.id}
                  type="proposal"
                  title={`${proposal.team_name} 팀 제안`}
                  subtitle={`매니저: ${proposal.manager_name}`}
                  message={proposal.message}
                  time={formatRelativeTime(proposal.created_at)}
                  status={null}
                  statusBadge={<span className="text-xs text-gray-500">제안</span>}
                  actions={
                    proposal.team_id ? (
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/team/${proposal.team_id}`)}
                        className="border-gray-300 hover:bg-gray-50"
                        size="sm"
                      >
                        <ChevronRight className="w-4 h-4 mr-1.5" />
                        팀 프로필 보기
                      </Button>
                    ) : null
                  }
                  onClick={proposal.team_id ? () => router.push(`/team/${proposal.team_id}`) : undefined}
                />
              ))
            )}
          </div>
        )}

        {/* 보낸 팀 제안 목록 (매니저가 메이커에게 보낸 제안) */}
        {activeTab === 'sent-proposals' && (
          <div className="space-y-3">
            {sentTeamProposals.length === 0 ? (
              <EmptyState
                icon={<Send className="w-12 h-12" />}
                title="보낸 팀 제안이 없습니다"
                description="메이커에게 팀 제안을 보내면 여기에 표시됩니다"
              />
            ) : (
              sentTeamProposals.map((proposal) => (
                <MessageCard
                  key={proposal.id}
                  type="proposal"
                  title={`${proposal.team_name} 팀 제안`}
                  subtitle={`메이커: ${proposal.maker_name}`}
                  message={proposal.message}
                  time={formatRelativeTime(proposal.created_at)}
                  status={null}
                  statusBadge={<span className="text-xs text-gray-500">보낸 제안</span>}
                  actions={
                    <div className="flex gap-2">
                      {proposal.team_id && (
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/team/${proposal.team_id}`)}
                          className="border-gray-300 hover:bg-gray-50"
                          size="sm"
                        >
                          <ChevronRight className="w-4 h-4 mr-1.5" />
                          팀 프로필
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/profile/${encodeURIComponent(proposal.maker_name)}`)}
                        className="border-gray-300 hover:bg-gray-50"
                        size="sm"
                      >
                        <UserCircle className="w-4 h-4 mr-1.5" />
                        메이커 프로필
                      </Button>
                    </div>
                  }
                />
              ))
            )}
          </div>
        )}

        {/* 보낸 합류 신청 목록 (메이커가 팀에 보낸 신청) */}
        {activeTab === 'sent-join-requests' && (
          <div className="space-y-3">
            {sentTeamJoinRequests.length === 0 ? (
              <EmptyState
                icon={<Send className="w-12 h-12" />}
                title="보낸 합류 신청이 없습니다"
                description="팀에 합류 신청을 보내면 여기에 표시됩니다"
              />
            ) : (
              sentTeamJoinRequests.map((request) => (
                <MessageCard
                  key={request.id}
                  type="invite"
                  title={`${request.team_name} 팀 합류 신청`}
                  time={formatRelativeTime(request.created_at)}
                  status={request.status}
                  statusBadge={getStatusBadge(request.status)}
                  actions={
                    request.team_id ? (
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/team/${request.team_id}`)}
                        className="border-gray-300 hover:bg-gray-50"
                        size="sm"
                      >
                        <ChevronRight className="w-4 h-4 mr-1.5" />
                        팀 프로필 보기
                      </Button>
                    ) : null
                  }
                  onClick={request.team_id ? () => router.push(`/team/${request.team_id}`) : undefined}
                />
              ))
            )}
          </div>
        )}

        {/* 받은 합류 신청 목록 (매니저가 받은 신청) */}
        {activeTab === 'join-requests' && (
          <div className="space-y-3">
            {teamJoinRequests.length === 0 ? (
              <EmptyState
                icon={<UserPlus className="w-12 h-12" />}
                title="받은 합류 신청이 없습니다"
                description="메이커가 팀 합류를 신청하면 여기에 표시됩니다"
              />
            ) : (
              teamJoinRequests.map((request) => (
                <MessageCard
                  key={request.id}
                  type="invite"
                  title={`${request.team_name} 팀 합류 신청`}
                  subtitle={`메이커: ${request.maker_name}`}
                  time={formatRelativeTime(request.created_at)}
                  status={request.status}
                  statusBadge={getStatusBadge(request.status)}
                  actions={
                    request.status === 'pending' ? (
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={() => handleJoinRequestAction(request.id, 'accept')}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          수락
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleJoinRequestAction(request.id, 'decline')}
                          className="border-gray-300 hover:bg-gray-50"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          거절
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/profile/${encodeURIComponent(request.maker_name)}`)}
                          className="border-gray-300 hover:bg-gray-50"
                          size="sm"
                        >
                          <UserCircle className="w-4 h-4 mr-1.5" />
                          프로필 보기
                        </Button>
                      </div>
                    ) : null
                  }
                />
              ))
            )}
          </div>
        )}

        {/* 기업 제안 목록 */}
        {activeTab === 'proposals' && (
          <div className="space-y-3">
            {companyProposals.length === 0 ? (
              <EmptyState
                icon={<Building2 className="w-12 h-12" />}
                title={profileType === 'FREELANCER' ? '기업 제안이 없습니다' : '프로젝트 제안이 없습니다'}
                description="새로운 프로젝트 제안이 오면 여기에 표시됩니다"
              />
            ) : (
              companyProposals.map((proposal) => (
                <MessageCard
                  key={proposal.id}
                  type="proposal"
                  title={proposal.counsel_title || '제목 없음'}
                  subtitle={`기업: ${proposal.client_name}`}
                  time={formatRelativeTime(proposal.created_at)}
                  status={proposal.status}
                  statusBadge={getStatusBadge(proposal.status)}
                  icon={<Building2 className="w-5 h-5 text-purple-600" />}
                  actions={
                    (!proposal.status || proposal.status === 'INVITED') ? (
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          onClick={() => handleProposalAction(proposal.id, 'accept')}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          size="sm"
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          수락
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleProposalAction(proposal.id, 'decline')}
                          className="border-gray-300 hover:bg-gray-50"
                          size="sm"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          거절
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/project-detail/${proposal.counsel_id}`)}
                          className="border-gray-300 hover:bg-gray-50"
                          size="sm"
                        >
                          <ChevronRight className="w-4 h-4 mr-1.5" />
                          상세 보기
                        </Button>
                      </div>
                    ) : null
                  }
                  onClick={() => router.push(`/project-detail/${proposal.counsel_id}`)}
                />
              ))
            )}
          </div>
        )}

        {/* 팀 견적 요청 목록 (기업 프로필 전용) */}
        {activeTab === 'estimate-requests' && profileType === 'COMPANY' && (
          <div className="space-y-3">
            {teamEstimateRequests.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-12 h-12" />}
                title="팀 견적 요청이 없습니다"
                description="팀이 견적을 요청하면 여기에 표시됩니다"
              />
            ) : (
              teamEstimateRequests.map((request) => (
                <MessageCard
                  key={request.id}
                  type="estimate"
                  title={`${request.team_name} 팀 견적 요청`}
                  subtitle={request.counsel_title ? `프로젝트: ${request.counsel_title}` : undefined}
                  message={request.message}
                  time={formatRelativeTime(request.created_at)}
                  status={request.status}
                  statusBadge={getStatusBadge(request.status)}
                  icon={<FileText className="w-5 h-5 text-green-600" />}
                  actions={
                    <div className="flex gap-2 flex-wrap">
                      {request.team_id && (
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/team/${request.team_id}`)}
                          className="border-gray-300 hover:bg-gray-50"
                          size="sm"
                        >
                          <ChevronRight className="w-4 h-4 mr-1.5" />
                          팀 프로필
                        </Button>
                      )}
                      {request.counsel_id && (
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/project-detail/${request.counsel_id}`)}
                          className="border-gray-300 hover:bg-gray-50"
                          size="sm"
                        >
                          <ChevronRight className="w-4 h-4 mr-1.5" />
                          프로젝트 상세
                        </Button>
                      )}
                    </div>
                  }
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

