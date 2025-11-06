'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, Mail } from 'lucide-react'
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

export default function TeamInvitesClient() {
  const router = useRouter()
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadTeamInvites()
  }, [])

  const loadTeamInvites = async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // 활성 프로필 확인
      const { data: profile } = await supabase
        .from('accounts')
        .select('profile_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle()

      if (!profile) {
        toast({
          variant: 'destructive',
          title: '프로필이 필요합니다',
          description: '프로필을 생성해주세요.',
        })
        router.push('/my/profile/manage')
        return
      }

      // 팀 초대 조회 (team_members 테이블에서 본인이 초대된 경우)
      // profile_id를 우선 사용하고, 없으면 maker_id 사용
      const { data: invites, error: invitesError } = await supabase
        .from('team_members')
        .select(`
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
        `)
        .or(`profile_id.eq.${profile.profile_id},maker_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (invitesError) {
        console.error('팀 초대 조회 실패:', invitesError)
        throw invitesError
      }

      // 매니저 정보 조회 (manager_profile_id 우선, 없으면 manager_id 사용)
      const managerProfileIds = Array.from(new Set((invites || [])
        .map((invite: any) => invite.teams?.manager_profile_id)
        .filter(Boolean)))
      
      const managerIds = Array.from(new Set((invites || [])
        .map((invite: any) => invite.teams?.manager_id)
        .filter(Boolean)))

      let managerMap: Record<string, string> = {}
      
      // manager_profile_id로 조회 (우선)
      if (managerProfileIds.length > 0) {
        const { data: managerAccounts } = await supabase
          .from('accounts')
          .select('profile_id, username')
          .in('profile_id', managerProfileIds)
          .eq('profile_type', 'FREELANCER')
          .eq('is_active', true)
          .is('deleted_at', null)

        if (managerAccounts) {
          managerAccounts.forEach((account: any) => {
            managerMap[account.profile_id] = account.username
          })
        }
      }
      
      // manager_id로 조회 (fallback)
      if (managerIds.length > 0) {
        const { data: managerAccounts } = await supabase
          .from('accounts')
          .select('user_id, username')
          .in('user_id', managerIds)
          .eq('profile_type', 'FREELANCER')
          .eq('is_active', true)
          .is('deleted_at', null)

        if (managerAccounts) {
          managerAccounts.forEach((account: any) => {
            managerMap[account.user_id] = account.username
          })
        }
      }

      // 초대 데이터 포맷팅
      const formattedInvites: TeamInvite[] = (invites || []).map((invite: any) => {
        const managerProfileId = invite.teams?.manager_profile_id
        const managerId = invite.teams?.manager_id || ''
        const managerName = managerProfileId 
          ? managerMap[managerProfileId] 
          : managerMap[managerId] || '알 수 없음'
        
        return {
          id: invite.id,
          team_id: invite.team_id,
          team_name: invite.teams?.name || '알 수 없음',
          manager_id: managerProfileId || managerId,
          manager_name: managerName,
          status: invite.status,
          created_at: invite.created_at,
        }
      })

      setTeamInvites(formattedInvites)
    } catch (error: any) {
      console.error('팀 초대 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '팀 초대를 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (inviteId: number) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'active' })
        .eq('id', inviteId)

      if (error) throw error

      toast({
        title: '팀 초대 수락',
        description: '팀 초대를 수락했습니다.',
      })
      loadTeamInvites()
    } catch (error: any) {
      console.error('팀 초대 수락 실패:', error)
      toast({
        variant: 'destructive',
        title: '팀 초대 수락 실패',
        description: error.message,
      })
    }
  }

  const handleDecline = async (inviteId: number) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'declined' })
        .eq('id', inviteId)

      if (error) throw error

      toast({
        title: '팀 초대 거절',
        description: '팀 초대를 거절했습니다.',
      })
      loadTeamInvites()
    } catch (error: any) {
      console.error('팀 초대 거절 실패:', error)
      toast({
        variant: 'destructive',
        title: '팀 초대 거절 실패',
        description: error.message,
      })
    }
  }

  const getStatusBadge = (status: string | null) => {
    if (!status || status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3" />
          대기중
        </span>
      )
    }
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          수락됨
        </span>
      )
    }
    if (status === 'declined') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          거절됨
        </span>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">팀 초대를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-4 md:py-6 px-2 md:px-4">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">받은 팀 초대</h1>
        <p className="text-gray-600">다른 매니저가 보낸 팀 합류 제안을 확인하세요</p>
      </div>

      <div className="space-y-4">
        {teamInvites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">받은 팀 초대가 없습니다.</p>
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
                    onClick={() => handleAccept(invite.id)}
                    className="flex-1"
                  >
                    수락
                  </Button>
                  <Button
                    onClick={() => handleDecline(invite.id)}
                    variant="outline"
                    className="flex-1"
                  >
                    거절
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

