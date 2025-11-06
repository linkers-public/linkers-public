'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, UserPlus, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface TeamMember {
  id: string
  email: string
  name: string
  role: string
  status?: string
  created_at: string
}

export default function TeamMembersClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<TeamMember[]>([])
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadTeamMembers()
  }, [])

  const loadTeamMembers = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // company_team_members 테이블에서 팀 멤버 조회
      const { data: teamMembers, error } = await supabase
        .from('company_team_members' as any)
        .select('*')
        .eq('company_user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('팀 멤버 조회 실패:', error)
        throw error
      }

      // 멤버 정보 포맷팅
      const formattedMembers: TeamMember[] = (teamMembers || []).map((member: any) => ({
        id: member.id.toString(),
        email: member.member_email,
        name: member.member_name || member.member_email,
        role: member.role || 'member',
        status: member.status || 'pending',
        created_at: member.created_at,
      }))

      setMembers(formattedMembers)
    } catch (error: any) {
      console.error('팀 멤버 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '팀 멤버를 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      toast({
        variant: 'destructive',
        title: '이메일을 입력해주세요',
      })
      return
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newMemberEmail)) {
      toast({
        variant: 'destructive',
        title: '올바른 이메일 형식이 아닙니다',
      })
      return
    }

    try {
      setAdding(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // 이미 팀 멤버인지 확인 (이메일 기준)
      const { data: existingMember } = await supabase
        .from('company_team_members' as any)
        .select('id')
        .eq('company_user_id', user.id)
        .eq('member_email', newMemberEmail)
        .maybeSingle()

      if (existingMember) {
        toast({
          variant: 'destructive',
          title: '이미 팀 멤버입니다',
          description: '해당 이메일은 이미 팀에 추가되어 있습니다.',
        })
        setNewMemberEmail('')
        return
      }

      // accounts 테이블에서 이메일로 사용자 찾기 (간접적으로)
      // 실제로는 auth.users를 직접 조회할 수 없으므로, 
      // 이메일만 저장하고 나중에 사용자가 가입하면 연결되도록 함
      const { data: accountData } = await supabase
        .from('accounts')
        .select('user_id, username')
        .eq('user_id', newMemberEmail) // 임시로 이메일을 user_id로 사용
        .maybeSingle()

      // 팀 멤버 추가
      // member_user_id는 이메일을 임시로 사용하고, 나중에 실제 user_id로 업데이트
      const { error: insertError } = await supabase
        .from('company_team_members' as any)
        .insert({
          company_user_id: user.id,
          member_user_id: newMemberEmail, // 임시로 이메일 사용 (나중에 실제 user_id로 업데이트)
          member_email: newMemberEmail,
          member_name: accountData?.username || null,
          role: 'member',
          status: 'pending', // 초대 대기 상태
          invited_by: user.id,
        })

      if (insertError) {
        // 중복 에러 처리
        if (insertError.code === '23505') {
          toast({
            variant: 'destructive',
            title: '이미 팀 멤버입니다',
            description: '해당 이메일은 이미 팀에 추가되어 있습니다.',
          })
        } else {
          throw insertError
        }
      } else {
        toast({
          title: '팀 멤버 초대 완료',
          description: '초대가 발송되었습니다. 사용자가 가입하면 팀에 추가됩니다.',
        })
        setNewMemberEmail('')
        // 목록 새로고침
        loadTeamMembers()
      }
    } catch (error: any) {
      console.error('팀 멤버 추가 실패:', error)
      toast({
        variant: 'destructive',
        title: '팀 멤버 추가 실패',
        description: error.message || '팀 멤버를 추가하는데 실패했습니다.',
      })
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('정말로 이 멤버를 제거하시겠습니까?')) {
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // 팀 멤버 제거
      const { error } = await supabase
        .from('company_team_members' as any)
        .delete()
        .eq('id', parseInt(memberId))
        .eq('company_user_id', user.id) // 본인만 제거 가능하도록 확인

      if (error) throw error

      toast({
        title: '팀 멤버 제거 완료',
        description: '팀 멤버가 제거되었습니다.',
      })

      // 목록 새로고침
      loadTeamMembers()
    } catch (error: any) {
      console.error('팀 멤버 제거 실패:', error)
      toast({
        variant: 'destructive',
        title: '팀 멤버 제거 실패',
        description: error.message || '팀 멤버를 제거하는데 실패했습니다.',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">팀 멤버를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-4 md:py-6 px-2 md:px-4">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">팀 멤버 관리</h1>
        <p className="text-gray-600">기업 계정 멀티 사용자를 관리하세요</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">멤버 추가</h2>
        </div>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="이메일 주소"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAddMember} disabled={adding}>
            {adding ? '추가 중...' : '추가'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">팀 멤버 목록</h2>
        </div>
        {members.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>등록된 팀 멤버가 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900">{member.name}</p>
                    {member.status === 'pending' && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        대기중
                      </span>
                    )}
                    {member.status === 'active' && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                        활성
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  <p className="text-xs text-gray-500 mt-1">역할: {member.role === 'admin' ? '관리자' : '멤버'}</p>
                </div>
                <Button
                  onClick={() => handleRemoveMember(member.id)}
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

