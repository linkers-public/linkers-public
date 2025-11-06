'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

export default function DeleteAccountClient() {
  const router = useRouter()
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const supabase = createSupabaseBrowserClient()

  const handleDelete = async () => {
    if (confirmText !== '탈퇴') {
      toast({
        variant: 'destructive',
        title: '확인 문구가 일치하지 않습니다',
        description: '정확히 "탈퇴"라고 입력해주세요.',
      })
      return
    }

    if (!confirm('정말로 회원 탈퇴를 하시겠습니까? 이 작업은 되돌릴 수 없으며, 모든 데이터가 삭제됩니다.')) {
      return
    }

    try {
      setDeleting(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // Soft delete: accounts 테이블의 deleted_at 업데이트
      const { error: accountError } = await supabase
        .from('accounts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', user.id)

      if (accountError) throw accountError

      // client 테이블도 soft delete (있는 경우)
      const { error: clientError } = await supabase
        .from('client')
        .update({ client_status: 'deleted' })
        .eq('user_id', user.id)

      if (clientError) {
        console.error('Client 삭제 실패:', clientError)
        // 계속 진행
      }

      toast({
        title: '회원 탈퇴 완료',
        description: '회원 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.',
      })

      // 로그아웃 및 홈으로 이동
      await supabase.auth.signOut()
      router.push('/')
    } catch (error: any) {
      console.error('회원 탈퇴 실패:', error)
      toast({
        variant: 'destructive',
        title: '회원 탈퇴 실패',
        description: error.message,
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="w-full py-4 md:py-6 px-2 md:px-4">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">회원 탈퇴</h1>
        <p className="text-gray-600">Soft delete or RLS 처리</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 border-red-200">
        <div className="flex items-start gap-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-semibold text-red-900 mb-2">회원 탈퇴 안내</h2>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• 회원 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.</li>
              <li>• 진행 중인 프로젝트가 있다면 완료 후 탈퇴해주세요.</li>
              <li>• 구독 중인 서비스가 있다면 해지 후 탈퇴해주세요.</li>
              <li>• 탈퇴 후 30일 이내 재가입이 제한될 수 있습니다.</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="confirm">
              탈퇴를 확인하려면 아래 입력란에 <strong>&quot;탈퇴&quot;</strong>라고 입력하세요.
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="탈퇴"
              className="mt-2"
            />
          </div>

          <Button
            onClick={handleDelete}
            variant="destructive"
            disabled={confirmText !== '탈퇴' || deleting}
            className="w-full md:w-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {deleting ? '탈퇴 처리 중...' : '회원 탈퇴'}
          </Button>
        </div>
      </div>
    </div>
  )
}

