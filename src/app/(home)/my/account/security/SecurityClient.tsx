'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Mail, Key, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function SecurityClient() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [updating, setUpdating] = useState(false)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      setLoading(true)
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        router.push('/auth')
        return
      }

      setUser(currentUser)
      setEmail(currentUser.email || '')
    } catch (error: any) {
      console.error('사용자 정보 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '사용자 정보를 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEmailUpdate = async () => {
    try {
      setUpdating(true)
      // TODO: 이메일 변경 로직 구현 (Supabase Auth의 updateUser 사용)
      toast({
        title: '준비 중',
        description: '이메일 변경 기능은 곧 제공될 예정입니다.',
      })
    } catch (error: any) {
      console.error('이메일 변경 실패:', error)
      toast({
        variant: 'destructive',
        title: '이메일 변경 실패',
        description: error.message,
      })
    } finally {
      setUpdating(false)
    }
  }

  const handlePasswordUpdate = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: '비밀번호 불일치',
        description: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.',
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: '비밀번호 길이',
        description: '비밀번호는 최소 6자 이상이어야 합니다.',
      })
      return
    }

    try {
      setUpdating(true)
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast({
        title: '비밀번호 변경 완료',
        description: '비밀번호가 성공적으로 변경되었습니다.',
      })

      setNewPassword('')
      setConfirmPassword('')
    } catch (error: any) {
      console.error('비밀번호 변경 실패:', error)
      toast({
        variant: 'destructive',
        title: '비밀번호 변경 실패',
        description: error.message,
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteAccount = async () => {
    // 회원 탈퇴 페이지로 리다이렉트
    router.push('/my/account/delete')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:py-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">로그인/보안</h1>
        <p className="text-gray-600">OAuth 연결, 이메일 변경, 탈퇴 등을 관리하세요</p>
      </div>

      <div className="space-y-6">
        {/* 이메일 변경 */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">이메일 주소</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">현재 이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled
                className="mt-1"
              />
            </div>
            <Button onClick={handleEmailUpdate} disabled={updating}>
              {updating ? '변경 중...' : '이메일 변경'}
            </Button>
          </div>
        </div>

        {/* 비밀번호 변경 */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">비밀번호 변경</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newPassword">새 비밀번호</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handlePasswordUpdate} disabled={updating}>
              {updating ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </div>
        </div>

        {/* 계정 삭제 */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 border-red-200">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">계정 삭제</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            계정을 삭제하면 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
          </p>
          <Button
            onClick={handleDeleteAccount}
            variant="outline"
            className="text-red-600 border-red-600 hover:bg-red-50"
          >
            계정 삭제
          </Button>
        </div>
      </div>
    </div>
  )
}

