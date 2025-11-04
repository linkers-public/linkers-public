'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserProfiles, switchActiveProfile } from '@/apis/profile-refactor.service'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ChevronDown, User, Building2, Plus } from 'lucide-react'

type ProfileType = Database['public']['Enums']['profile_type']
type Profile = {
  user_id: string
  profile_id: string
  username: string
  profile_type: ProfileType
  bio: string
  is_active: boolean | null
}

export default function ProfileSwitchButton() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const data = await getUserProfiles()
      // profile_type이 null이 아닌 프로필만 필터링
      const validProfiles = (data as any[]).filter((p: any) => p.profile_type !== null) as Profile[]
      setProfiles(validProfiles)
      const active = validProfiles.find((p: any) => p.is_active)
      setActiveProfile(active || (validProfiles.length > 0 ? validProfiles[0] : null))
    } catch (error) {
      console.error('프로필 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSwitch = async (profileId: string) => {
    try {
      await switchActiveProfile(profileId)
      await loadProfiles()
      
      // 프로필 페이지 새로고침
      router.refresh()
    } catch (error: any) {
      console.error(' 실패:', error)
      alert(`프로필 전환에 실패했습니다: ${error.message || error}`)
    }
  }

  const getProfileIcon = (type: ProfileType) => {
    return type === 'FREELANCER' ? <User className="w-4 h-4" /> : <Building2 className="w-4 h-4" />
  }

  const getProfileLabel = (type: ProfileType) => {
    return type === 'FREELANCER' ? '프리랜서' : '기업'
  }

  if (loading || !activeProfile) {
    return null
  }

  if (profiles.length <= 1) {
    // 프로필이 1개만 있으면 간단한 버튼
    return (
      <Button
        variant="outline"
        onClick={() => router.push('/my/profile/manage')}
        className="flex items-center gap-2 text-sm"
      >
        {getProfileIcon(activeProfile.profile_type)}
        <span>{activeProfile.username}</span>
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 text-sm"
      >
        {getProfileIcon(activeProfile.profile_type)}
        <span>{activeProfile.username} ({getProfileLabel(activeProfile.profile_type)})</span>
        <ChevronDown className="w-4 h-4" />
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>프로필 전환</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            사용할 프로필을 선택하세요. 프리랜서는 프로젝트 수행, 기업은 프로젝트 의뢰 및 견적 요청을 담당합니다.
          </DialogDescription>
          
          <div className="space-y-3 py-4">
            
            {profiles.map((profile) => (
              <button
                key={profile.profile_id}
                onClick={() => {
                  handleSwitch(profile.profile_id)
                  setShowDialog(false)
                }}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  profile.is_active
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProfileIcon(profile.profile_type)}
                    <div>
                      <div className="font-semibold text-gray-900">
                        {profile.username}
                      </div>
                      <div className="text-sm text-gray-600">
                        {getProfileLabel(profile.profile_type)}
                      </div>
                    </div>
                  </div>
                  {profile.is_active && (
                    <span className="text-xs text-blue-600 font-medium">활성</span>
                  )}
                </div>
              </button>
            ))}
            
            <div className="border-t pt-4 mt-4 space-y-2">
              <Button
                variant="outline"
                onClick={() => {
                  router.push('/my/profile/manage')
                  setShowDialog(false)
                }}
                className="w-full"
              >
                프로필 관리
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  router.push('/my/profile/create')
                  setShowDialog(false)
                }}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                새 프로필 생성
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

