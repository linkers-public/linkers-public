'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileClient } from '@/components/ProfileClient'
import { getUserProfiles } from '@/apis/profile-refactor.service'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function Page() {
  const router = useRouter()
  const [hasProfile, setHasProfile] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkProfiles = async () => {
      try {
        const profiles = await getUserProfiles()
        setHasProfile(profiles && profiles.length > 0)
      } catch (error) {
        console.error('프로필 확인 실패:', error)
        setHasProfile(false)
      } finally {
        setLoading(false)
      }
    }
    checkProfiles()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!hasProfile) {
    return (
      <div className="w-full py-8 px-4">
        <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
          <div className="text-6xl mb-6">👤</div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
            프로필이 없습니다
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            프로젝트에 참여하려면 먼저 프리랜서 또는 기업 프로필을 생성해주세요.
            한 유저당 각각 최대 1개씩 생성할 수 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push('/my/profile/create')}
              size="lg"
              className="flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              프로필 생성하기
            </Button>
            <Button
              onClick={() => router.push('/my/profile/manage')}
              variant="outline"
              size="lg"
            >
              프로필 관리
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProfileClient
      isOwner={true}
      username={''}
    />
  )
}
