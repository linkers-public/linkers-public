'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Upload, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface VerificationRequest {
  id: number
  badge_type: string
  file_url: string
  description: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejection_reason: string | null
  created_at: string | null
  reviewed_at: string | null
  updated_at?: string | null
  reviewed_by?: string | null
  profile_id?: string
}

export default function BadgesClient() {
  const router = useRouter()
  const [requests, setRequests] = useState<VerificationRequest[]>([])
  const [badges, setBadges] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({
    badge_type: '',
    description: '',
    file: null as File | null,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
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

      // 활성 프로필 가져오기
      const { data: profile } = await supabase
        .from('accounts')
        .select('profile_id, badges')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single()

      if (!profile) {
        toast({
          variant: 'destructive',
          title: '프로필을 찾을 수 없습니다',
          description: '먼저 프로필을 생성해주세요.',
        })
        router.push('/my/profile/create')
        return
      }

      // 배지 가져오기
      if (profile.badges && Array.isArray(profile.badges)) {
        setBadges(profile.badges as string[])
      }

      // 인증 요청 가져오기
      const { data, error } = await supabase
        .from('career_verification_requests')
        .select('*')
        .eq('profile_id', profile.profile_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error: any) {
      console.error('데이터 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '데이터를 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData({ ...formData, file })
    }
  }

  const handleSubmit = async () => {
    try {
      if (!formData.badge_type || !formData.file) {
        toast({
          variant: 'destructive',
          title: '필수 항목을 입력해주세요',
          description: '배지 타입과 파일은 필수입니다.',
        })
        return
      }

      setUploading(true)
      const supabase = createSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // 활성 프로필 가져오기
      const { data: profile } = await supabase
        .from('accounts')
        .select('profile_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single()

      if (!profile) {
        throw new Error('프로필을 찾을 수 없습니다')
      }

      // 파일 업로드
      const fileExt = formData.file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('career-verifications')
        .upload(fileName, formData.file)

      if (uploadError) {
        // 버킷이 없을 수 있으므로, 일단 파일 URL을 직접 저장하는 방식으로 변경
        // 실제로는 버킷을 먼저 생성해야 함
        throw new Error('파일 업로드 실패: ' + uploadError.message)
      }

      // Public URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from('career-verifications').getPublicUrl(fileName)

      // 인증 요청 생성
      const { error } = await supabase
        .from('career_verification_requests')
        .insert({
          profile_id: profile.profile_id,
          badge_type: formData.badge_type,
          file_url: publicUrl,
          description: formData.description || null,
          status: 'PENDING',
        })

      if (error) throw error

      toast({
        title: '인증 요청이 제출되었습니다',
        description: '운영자 검토 후 승인되면 배지가 추가됩니다.',
      })

      setShowDialog(false)
      setFormData({
        badge_type: '',
        description: '',
        file: null,
      })
      await loadData()
    } catch (error: any) {
      console.error('인증 요청 제출 실패:', error)
      toast({
        variant: 'destructive',
        title: '인증 요청 제출에 실패했습니다',
        description: error.message,
      })
    } finally {
      setUploading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '승인됨'
      case 'REJECTED':
        return '거절됨'
      case 'PENDING':
        return '검토 중'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:py-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">경력 인증 배지</h1>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          인증 요청
        </Button>
      </div>

      {/* 승인된 배지 */}
      {badges.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">
            승인된 배지
          </h2>
          <div className="flex flex-wrap gap-3">
            {badges.map((badge, idx) => (
              <span
                key={idx}
                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-medium flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 인증 요청 목록 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          인증 요청 내역
        </h2>
        {requests.length === 0 ? (
            <div className="text-center py-6 md:py-12">
            <p className="text-gray-600 mb-4">인증 요청이 없습니다.</p>
            <Button onClick={() => setShowDialog(true)} variant="outline">
              첫 인증 요청하기
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {request.badge_type}
                      </h3>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(request.status)}
                        <span className="text-sm text-gray-600">
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                    </div>
                    {request.description && (
                      <p className="text-sm text-gray-600 mb-2">
                        {request.description}
                      </p>
                    )}
                    {request.status === 'REJECTED' && request.rejection_reason && (
                      <p className="text-sm text-red-600 mb-2">
                        거절 사유: {request.rejection_reason}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {request.created_at && (
                        <span>
                          요청일: {new Date(request.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                      {request.reviewed_at && (
                        <span>
                          검토일: {new Date(request.reviewed_at).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                    </div>
                    <a
                      href={request.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                    >
                      증빙 자료 확인
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>경력 인증 요청</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                배지 타입 <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.badge_type}
                onChange={(e) =>
                  setFormData({ ...formData, badge_type: e.target.value })
                }
                placeholder="예: PM 5년 이상, SI 1억 이상 납품"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="경력 인증에 대한 설명을 입력하세요"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                증빙 자료 <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {formData.file
                      ? formData.file.name
                      : '파일을 선택하세요 (PDF, 이미지, 문서)'}
                  </span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                취소
              </Button>
              <Button onClick={handleSubmit} disabled={uploading}>
                {uploading ? '업로드 중...' : '제출'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

