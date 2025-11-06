'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createProfile, getUserProfiles } from '@/apis/profile-refactor.service'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft } from 'lucide-react'
import { JOB_OPTIONS, EXPERTISE_OPTIONS } from '@/constants/job-options'

type ProfileType = Database['public']['Enums']['profile_type']

function CreateProfilePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profileType, setProfileType] = useState<ProfileType | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    main_job: [] as string[],
    expertise: [] as string[],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)

  // 쿼리 파라미터에서 프로필 타입 가져오기 및 중복 체크
  useEffect(() => {
    const checkExistingProfiles = async () => {
      try {
        const typeParam = searchParams.get('type')
        if (typeParam && (typeParam === 'FREELANCER' || typeParam === 'COMPANY')) {
          // 기존 프로필 확인
          const profiles = await getUserProfiles()
          const existingProfile = profiles.find((p: any) => p.profile_type === typeParam)
          
          if (existingProfile) {
            toast({
              variant: 'destructive',
              title: '프로필이 이미 존재합니다',
              description: `${typeParam === 'FREELANCER' ? '프리랜서' : '기업'} 프로필이 이미 생성되어 있습니다.`,
            })
            router.push('/my/profile/manage')
            return
          }
          
          setProfileType(typeParam as ProfileType)
        }
      } catch (err: any) {
        console.error('프로필 확인 실패:', err)
      } finally {
        setChecking(false)
      }
    }

    checkExistingProfiles()
  }, [searchParams, router])

  const handleProfileTypeSelect = (type: ProfileType) => {
    setProfileType(type)
    setError(null)
  }

  const toggleJob = (job: string) => {
    setFormData((prev) => ({
      ...prev,
      main_job: prev.main_job.includes(job)
        ? prev.main_job.filter((j) => j !== job)
        : [...prev.main_job, job],
    }))
  }

  const toggleExpertise = (expertise: string) => {
    setFormData((prev) => ({
      ...prev,
      expertise: prev.expertise.includes(expertise)
        ? prev.expertise.filter((e) => e !== expertise)
        : [...prev.expertise, expertise],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profileType) {
      setError('프로필 타입을 선택해주세요.')
      return
    }

    if (!formData.username.trim()) {
      setError('사용자명을 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await createProfile({
        profile_type: profileType,
        username: formData.username,
        bio: formData.bio,
        main_job: formData.main_job.length > 0 ? formData.main_job : undefined,
        expertise: formData.expertise.length > 0 ? formData.expertise : undefined,
      })

      toast({
        title: '프로필 생성 완료',
        description: `${profileType === 'FREELANCER' ? '프리랜서' : '기업'} 프로필이 생성되었습니다.`,
      })

      router.push('/my/profile')
    } catch (err: any) {
      setError(err.message || '프로필 생성에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">프로필 확인 중...</p>
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">새 프로필 생성</h1>
        <p className="text-gray-600 mb-6 md:mb-8">
          {profileType 
            ? `${profileType === 'FREELANCER' ? '프리랜서' : '기업'} 프로필을 생성하세요.`
            : '프리랜서 또는 기업 프로필을 생성하세요. 한 유저당 각각 최대 1개씩 생성할 수 있습니다.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
          {/* 프로필 타입 선택 */}
          {!profileType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                프로필 타입 선택 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleProfileTypeSelect('FREELANCER')}
                  className={`p-4 md:p-6 border-2 rounded-lg text-left transition-all ${
                    profileType === 'FREELANCER'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-lg text-gray-900 mb-2">
                    프리랜서
                  </div>
                  <div className="text-sm text-gray-600">
                    개인 개발자, 디자이너, 컨설턴트 등으로 활동하시나요?
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleProfileTypeSelect('COMPANY')}
                  className={`p-4 md:p-6 border-2 rounded-lg text-left transition-all ${
                    profileType === 'COMPANY'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-lg text-gray-900 mb-2">
                    기업
                  </div>
                  <div className="text-sm text-gray-600">
                    회사 또는 팀으로 프로젝트를 수주하시나요?
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* 프로필 타입이 선택된 경우 표시 */}
          {profileType && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>{profileType === 'FREELANCER' ? '프리랜서' : '기업'}</strong> 프로필을 생성합니다.
              </p>
            </div>
          )}

          {/* 기본 정보 */}
          {profileType && (
            <>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  사용자명 <span className="text-red-500">*</span>
                </label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  placeholder="예: johndoe"
                  required
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                  소개
                </label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  placeholder="자신에 대해 간단히 소개해주세요."
                />
              </div>

              {/* 주요 업무 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  주요 업무
                </label>
                <div className="flex flex-wrap gap-2">
                  {JOB_OPTIONS.map((job) => (
                    <button
                      key={job}
                      type="button"
                      onClick={() => toggleJob(job)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        formData.main_job.includes(job)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {job}
                    </button>
                  ))}
                </div>
              </div>

              {/* 전문 기술 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  전문 기술
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE_OPTIONS.map((expertise) => (
                    <button
                      key={expertise}
                      type="button"
                      onClick={() => toggleExpertise(expertise)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        formData.expertise.includes(expertise)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {expertise}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 제출 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !profileType}
            >
              {loading ? '생성 중...' : '프로필 생성'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CreateProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <CreateProfilePageContent />
    </Suspense>
  )
}
