'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserProfiles, switchActiveProfile } from '@/apis/profile-refactor.service'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, Plus, RefreshCw, CheckCircle, Trophy } from 'lucide-react'

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
  profile_created_at: string | null
}

export default function ProfileManagePage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUserProfiles()
      setProfiles(data as Profile[])
    } catch (err: any) {
      setError(err.message || '프로필을 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchProfile = async (profileId: string) => {
    try {
      setSwitching(profileId)
      await switchActiveProfile(profileId)
      
      toast({
        title: '프로필 전환 완료',
        description: '활성 프로필이 변경되었습니다.',
      })

      await loadProfiles()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: '프로필 전환 실패',
        description: err.message || '에 실패했습니다.',
      })
    } finally {
      setSwitching(null)
    }
  }

  const getProfileTypeLabel = (type: ProfileType) => {
    return type === 'FREELANCER' ? '프리랜서' : '기업'
  }

  const hasFreelancer = profiles.some((p) => p.profile_type === 'FREELANCER')
  const hasCompany = profiles.some((p) => p.profile_type === 'COMPANY')

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:py-6 md:px-4">
      <Button
        variant="outline"
        onClick={() => router.back()}
        className="mb-4 md:mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        돌아가기
      </Button>

      <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 lg:p-8">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">프로필 관리</h1>
          <p className="text-gray-600">
            프리랜서와 기업 프로필을 관리하고 전환할 수 있습니다.
            <br />
            <span className="text-sm text-gray-500">
              • 프리랜서: 프로젝트를 수행하는 역할 (메이커)
              <br />
              • 기업: 프로젝트를 의뢰하고 견적서를 요청하는 역할 (클라이언트)
            </span>
          </p>
        </div>

        {error && (
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* 프로필 목록 */}
        <div className="space-y-4">
          {profiles.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500 mb-4">생성된 프로필이 없습니다.</p>
              <Button onClick={() => router.push('/my/profile/create')}>
                첫 프로필 생성하기
              </Button>
            </div>
                 ) : (
                   profiles.map((profile) => (
                     <div
                       key={profile.profile_id}
                       className={`p-4 md:p-6 border-2 rounded-lg transition-all ${
                         profile.is_active
                           ? 'border-blue-500 bg-blue-50'
                           : 'border-gray-200 bg-white hover:border-gray-300'
                       }`}
                     >
                       <div className="flex items-start justify-between">
                         <div className="flex-1">
                           <div className="flex items-center gap-3 mb-3">
                             <h3 className="text-xl font-semibold text-gray-900">
                               {profile.username}
                             </h3>
                             <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-700">
                               {getProfileTypeLabel(profile.profile_type)}
                             </span>
                             {profile.is_active && (
                               <span className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700 font-medium">
                                 현재 활성 프로필
                               </span>
                             )}
                           </div>

                           {profile.bio && (
                             <p className="text-gray-600 mb-3 line-clamp-2">
                               {profile.bio}
                             </p>
                           )}

                           {/* 배지 표시 */}
                           {profile.badges && Array.isArray(profile.badges) && profile.badges.length > 0 && (
                             <div className="flex flex-wrap gap-2 mb-3">
                               {profile.badges.map((badge: string, idx: number) => (
                                 <span
                                   key={idx}
                                   className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium flex items-center gap-1"
                                 >
                                   <Trophy className="w-3 h-3" />
                                   {badge}
                                 </span>
                               ))}
                             </div>
                           )}

                           {/* 주요 정보 */}
                           <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-4">
                             {profile.main_job && profile.main_job.length > 0 && (
                               <div>
                                 <span className="font-medium">주직무: </span>
                                 <span>{profile.main_job.slice(0, 3).join(', ')}</span>
                               </div>
                             )}
                             {profile.profile_created_at && (
                               <div>
                                 <span className="font-medium">생성일: </span>
                                 <span>
                                   {new Date(profile.profile_created_at).toLocaleDateString('ko-KR')}
                                 </span>
                               </div>
                             )}
                           </div>
                         </div>

                         {/* 액션 버튼 */}
                         <div className="flex flex-col gap-2 ml-4">
                           {!profile.is_active && (
                             <Button
                               onClick={() => handleSwitchProfile(profile.profile_id)}
                               disabled={switching === profile.profile_id}
                               variant="outline"
                               size="sm"
                             >
                               {switching === profile.profile_id ? (
                                 <>
                                   <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                   전환 중...
                                 </>
                               ) : (
                                 '활성 프로필로 전환'
                               )}
                             </Button>
                           )}
                    <Button
                      onClick={() => router.push(`/my/profile`)}
                      variant="outline"
                      size="sm"
                    >
                      프로필 보기
                    </Button>
                    <Button
                      onClick={() => router.push(`/my/update`)}
                      variant="outline"
                      size="sm"
                    >
                      프로필 수정
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 프로필 생성 안내 */}
        <div className="mt-4 md:mt-8 p-4 md:p-6 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">프로필 생성 안내</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>프리랜서 프로필:</strong> 개인 개발자, 디자이너로 프로젝트를 수행할 때 사용합니다.
              <br />
              <span className="text-gray-500 ml-4">→ 프로젝트에 참여하고 개발 작업을 수행</span>
            </p>
            <p>
              <strong>기업 프로필:</strong> 프로젝트를 의뢰하고 견적서를 요청할 때 사용합니다.
              <br />
              <span className="text-gray-500 ml-4">→ 프로젝트 의뢰서 작성 및 견적 요청</span>
            </p>
            <p className="mt-3 pt-3 border-t border-gray-300">
              <strong>프로필 전환 방법:</strong>
              <br />
              • 현재 활성화된 프로필 아래에 있는 <strong>"활성 프로필로 전환"</strong> 버튼을 클릭하세요.
              <br />
              • 또는 헤더의 프로필 버튼을 클릭하여 드롭다운에서 다른 프로필을 선택할 수 있습니다.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              한 유저당 프리랜서 프로필과 기업 프로필을 각각 최대 1개씩 생성할 수 있습니다.
            </p>
            <div className="mt-4 space-y-3">
              {!hasFreelancer && (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">프리랜서 프로필</h4>
                    <p className="text-sm text-gray-600">프로젝트를 수행하는 역할 (메이커)</p>
                  </div>
                  <Button
                    onClick={() => router.push('/my/profile/create?type=FREELANCER')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    생성하기
                  </Button>
                </div>
              )}
              {!hasCompany && (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">기업 프로필</h4>
                    <p className="text-sm text-gray-600">프로젝트를 의뢰하고 견적서를 요청하는 역할</p>
                  </div>
                  <Button
                    onClick={() => router.push('/my/profile/create?type=COMPANY')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    생성하기
                  </Button>
                </div>
              )}
              {hasFreelancer && hasCompany && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-800 flex-shrink-0" />
                  <p className="text-sm text-green-800 font-medium">
                    모든 프로필이 생성되었습니다. 프로필 전환을 통해 다른 프로필을 활성화할 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

