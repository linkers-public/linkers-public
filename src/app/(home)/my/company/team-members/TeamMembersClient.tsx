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

      // TODO: 팀 멤버 테이블이 있다면 조회, 현재는 임시로 빈 배열
      setMembers([])
      
      toast({
        title: '준비 중',
        description: '팀 멤버 관리 기능은 곧 제공될 예정입니다.',
      })
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

    try {
      setAdding(true)
      // TODO: 팀 멤버 추가 로직 구현
      toast({
        title: '준비 중',
        description: '팀 멤버 추가 기능은 곧 제공될 예정입니다.',
      })
      setNewMemberEmail('')
    } catch (error: any) {
      console.error('팀 멤버 추가 실패:', error)
      toast({
        variant: 'destructive',
        title: '팀 멤버 추가 실패',
        description: error.message,
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
      // TODO: 팀 멤버 제거 로직 구현
      toast({
        title: '준비 중',
        description: '팀 멤버 제거 기능은 곧 제공될 예정입니다.',
      })
    } catch (error: any) {
      console.error('팀 멤버 제거 실패:', error)
      toast({
        variant: 'destructive',
        title: '팀 멤버 제거 실패',
        description: error.message,
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
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  <p className="text-xs text-gray-500 mt-1">역할: {member.role}</p>
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

