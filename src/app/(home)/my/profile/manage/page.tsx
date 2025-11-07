'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserProfiles, switchActiveProfile } from '@/apis/profile-refactor.service'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  RefreshCw
} from 'lucide-react'

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
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">프로필을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:py-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        돌아가기
      </Button>

      <div className="space-y-6">
        {/* 헤더 섹션 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 border border-blue-100">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">프로필 관리</h1>
          <p className="text-gray-700 leading-relaxed">
            프리랜서와 기업 프로필을 생성하고 전환하여 다양한 역할로 활동할 수 있습니다.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* 프로필 목록 */}
        <div className="space-y-4">
          {profiles.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
              <p className="text-gray-600 text-lg font-medium mb-2">생성된 프로필이 없습니다</p>
              <p className="text-gray-500 text-sm mb-6">첫 프로필을 생성하여 시작하세요</p>
              <Button 
                onClick={() => router.push('/my/profile/create')}
              >
                첫 프로필 생성하기
              </Button>
            </div>
                 ) : (
            profiles.map((profile) => {
              const isFreelancer = profile.profile_type === 'FREELANCER'
              
              return (
                     <div
                       key={profile.profile_id}
                  className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                         profile.is_active
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg shadow-blue-100'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                       }`}
                     >
                  {profile.is_active && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 opacity-10 rounded-full -mr-16 -mt-16"></div>
                  )}
                  
                  <div className="p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* 프로필 헤더 */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                               {profile.username}
                             </h3>
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                isFreelancer
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                               {getProfileTypeLabel(profile.profile_type)}
                             </span>
                             {profile.is_active && (
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                                  활성 프로필
                               </span>
                             )}
                            </div>
                          </div>
                           </div>

                        {/* 소개 */}
                           {profile.bio && (
                          <p className="text-gray-700 mb-4 line-clamp-2 leading-relaxed">
                               {profile.bio}
                             </p>
                           )}

                           {/* 배지 표시 */}
                           {profile.badges && Array.isArray(profile.badges) && profile.badges.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                               {profile.badges.map((badge: string, idx: number) => (
                                 <span
                                   key={idx}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-100 text-amber-700 border border-amber-200"
                                 >
                                   {badge}
                                 </span>
                               ))}
                             </div>
                           )}

                           {/* 주요 정보 */}
                        <div className="flex flex-wrap gap-6 text-sm text-gray-600 mt-6 pt-6 border-t border-gray-200">
                             {profile.main_job && profile.main_job.length > 0 && (
                               <div>
                              <span className="font-medium text-gray-700">주직무: </span>
                                 <span>{profile.main_job.slice(0, 3).join(', ')}</span>
                               </div>
                             )}
                             {profile.profile_created_at && (
                               <div>
                              <span className="font-medium text-gray-700">생성일: </span>
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
                            variant="default"
                               size="sm"
                            className="min-w-[140px]"
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
                </div>
              )
            })
          )}
        </div>

        {/* 프로필 생성 안내 */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 md:p-8 border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-2">프로필 생성 안내</h3>
          <p className="text-sm text-gray-600 mb-6">
            한 유저당 프리랜서 프로필과 기업 프로필을 각각 최대 1개씩 생성할 수 있습니다.
          </p>

          {/* 프로필 타입 설명 */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">프리랜서 프로필</h4>
              <p className="text-sm text-gray-600 mb-2">
                개인 개발자, 디자이너로 프로젝트를 수행할 때 사용합니다.
              </p>
              <p className="text-xs text-gray-500">
                프로젝트에 참여하고 개발 작업을 수행
              </p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">기업 프로필</h4>
              <p className="text-sm text-gray-600 mb-2">
                프로젝트를 의뢰하고 견적서를 요청할 때 사용합니다.
            </p>
              <p className="text-xs text-gray-500">
                프로젝트 의뢰서 작성 및 견적 요청
              </p>
            </div>
          </div>

          {/* 프로필 생성 버튼 */}
          <div className="space-y-3">
              {!hasFreelancer && (
              <div className="flex items-center justify-between p-5 bg-white rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-300 transition-colors">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">프리랜서 프로필</h4>
                    <p className="text-sm text-gray-600">프로젝트를 수행하는 역할 (메이커)</p>
                  </div>
                  <Button
                    onClick={() => router.push('/my/profile/create?type=FREELANCER')}
                  >
                    생성하기
                  </Button>
                </div>
              )}
              {!hasCompany && (
              <div className="flex items-center justify-between p-5 bg-white rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-300 transition-colors">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">기업 프로필</h4>
                    <p className="text-sm text-gray-600">프로젝트를 의뢰하고 견적서를 요청하는 역할</p>
                  </div>
                  <Button
                    onClick={() => router.push('/my/profile/create?type=COMPANY')}
                  >
                    생성하기
                  </Button>
                </div>
              )}
              {hasFreelancer && hasCompany && (
              <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <p className="text-sm font-semibold text-green-800 mb-1">
                  모든 프로필이 생성되었습니다
                </p>
                <p className="text-xs text-green-700">
                  프로필 전환을 통해 다른 프로필을 활성화할 수 있습니다.
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}

