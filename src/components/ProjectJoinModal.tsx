'use client'

import { useState, useEffect } from 'react'
import { joinProject } from '@/apis/project-member.service'
import { getUserProfiles } from '@/apis/profile-refactor.service'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ProfileSelector from './ProfileSelector'

type ProjectRole = Database['public']['Enums']['project_role']
type ProfileType = Database['public']['Enums']['profile_type']
type Profile = {
  user_id: string
  profile_id: string
  username: string
  profile_type: ProfileType
  bio: string
  main_job: string[] | null
  expertise: string[] | null
  badges: string[] | null
  is_active: boolean | null
}

interface ProjectJoinModalProps {
  open: boolean
  onClose: () => void
  counselId: number
  onSuccess?: () => void
}

export default function ProjectJoinModal({
  open,
  onClose,
  counselId,
  onSuccess,
}: ProjectJoinModalProps) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('MAKER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadProfiles()
    }
  }, [open])

  const loadProfiles = async () => {
    try {
      const data = await getUserProfiles()
      setProfiles(data as Profile[])
      
      // 활성 프로필이 있으면 자동 선택
      const activeProfile = data.find((p: any) => p.is_active)
      if (activeProfile) {
        setSelectedProfileId(activeProfile.profile_id)
      } else if (data.length > 0) {
        setSelectedProfileId(data[0].profile_id)
      }
    } catch (err: any) {
      setError(err.message || '프로필을 불러오는데 실패했습니다.')
    }
  }

  const handleJoin = async () => {
    if (!selectedProfileId) {
      setError('프로필을 선택해주세요.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await joinProject({
        counsel_id: counselId,
        profile_id: selectedProfileId,
        role: selectedRole,
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.message || '참여 신청에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const selectedProfile = profiles.find((p) => p.profile_id === selectedProfileId)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>프로젝트 참여하기</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 프로필 선택 */}
          <div>
            <ProfileSelector
              selectedProfileId={selectedProfileId}
              onProfileSelect={setSelectedProfileId}
            />
          </div>

          {/* 역할 선택 */}
          {selectedProfile && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                참여 역할 선택
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedRole('MAKER')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedRole === 'MAKER'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">메이커</div>
                  <div className="text-sm text-gray-600">
                    개발 업무를 담당합니다
                  </div>
                </button>
                <button
                  onClick={() => setSelectedRole('MANAGER')}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedRole === 'MANAGER'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">매니저</div>
                  <div className="text-sm text-gray-600">
                    기업 소통, 견적서 작성, 프로젝트 관리 등을 담당합니다
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 선택된 프로필 정보 */}
          {selectedProfile && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">선택된 프로필</div>
              <div className="font-semibold text-gray-900">
                {selectedProfile.username} ({selectedProfile.profile_type === 'FREELANCER' ? '프리랜서' : '기업'})
              </div>
              <div className="text-sm text-gray-600 mt-1">
                역할: {selectedRole === 'MAKER' ? '메이커' : '매니저'}
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              onClick={handleJoin}
              className="flex-1"
              disabled={loading || !selectedProfileId}
            >
              {loading ? '처리 중...' : '참여 신청'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

