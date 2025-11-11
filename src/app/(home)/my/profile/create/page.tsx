'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createProfile, getUserProfiles } from '@/apis/profile-refactor.service'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Database } from '@/types/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, X } from 'lucide-react'
import {
  JOB_CATEGORIES,
  MAX_MAIN_JOB_SELECTION,
  SPECIALTY_OPTIONS_BY_CATEGORY,
  SPECIALTY_TO_CATEGORY_MAP,
  CATEGORY_ALLOW_CUSTOM_SPECIALTY,
  OTHER_CATEGORY_LABEL,
} from '@/constants/job-options'

type ProfileType = Database['public']['Enums']['profile_type']

const MAIN_JOB_OPTIONS = JOB_CATEGORIES.map((category) => category.category)
const OTHER_CATEGORY_VALUE = OTHER_CATEGORY_LABEL

function CreateProfilePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profileType, setProfileType] = useState<ProfileType | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    bio: '',
    main_job: [] as string[],
    expertise: [] as string[],
    // 기업 프로필 전용 필드
    company_name: '',
    contact_person: '',
    contact_phone: '',
    address: '',
    website: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [otherSpecialtyInput, setOtherSpecialtyInput] = useState('')

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

  const toggleMainJob = (role: string) => {
    let limitReached = false
    let shouldClearCustomInput = false

    setFormData((prev) => {
      const isSelected = prev.main_job.includes(role)

      if (!isSelected && prev.main_job.length >= MAX_MAIN_JOB_SELECTION) {
        limitReached = true
        return prev
      }

      if (isSelected && role === OTHER_CATEGORY_VALUE) {
        shouldClearCustomInput = true
      }

      const nextMainJobs = isSelected
        ? prev.main_job.filter((item) => item !== role)
        : [...prev.main_job, role]

      const nextExpertise = isSelected
        ? prev.expertise.filter((item) => {
            const mappedRole = SPECIALTY_TO_CATEGORY_MAP[item]
            if (mappedRole) {
              return mappedRole !== role
            }
            if (role === OTHER_CATEGORY_VALUE) {
              return false
            }
            return true
          })
        : prev.expertise

      return {
        ...prev,
        main_job: nextMainJobs,
        expertise: nextExpertise,
      }
    })

    if (limitReached) {
      toast({
        variant: 'destructive',
        title: '주직무 선택 제한',
        description: `주직무는 최대 ${MAX_MAIN_JOB_SELECTION}개까지 선택할 수 있습니다.`,
      })
    }

    if (shouldClearCustomInput) {
      setOtherSpecialtyInput('')
    }
  }

  const toggleExpertise = (expertise: string) => {
    setFormData((prev) => {
      const parentRole = SPECIALTY_TO_CATEGORY_MAP[expertise]
      if (parentRole && !prev.main_job.includes(parentRole)) {
        toast({
          variant: 'destructive',
          title: '전문 분야 선택 불가',
          description: '해당 전문 분야의 주직무를 먼저 선택해주세요.',
        })
        return prev
      }

      const isSelected = prev.expertise.includes(expertise)
      const nextExpertise = isSelected
        ? prev.expertise.filter((item) => item !== expertise)
        : [...prev.expertise, expertise]

      return {
        ...prev,
        expertise: nextExpertise,
      }
    })
  }

  const removeExpertise = (expertise: string) => {
    setFormData((prev) => ({
      ...prev,
      expertise: prev.expertise.filter((item) => item !== expertise),
    }))
  }

  const addCustomSpecialty = () => {
    const trimmed = otherSpecialtyInput.trim()
    if (!trimmed) return

    if (!formData.main_job.includes(OTHER_CATEGORY_VALUE)) {
      toast({
        variant: 'destructive',
        title: '전문 분야 입력 불가',
        description: '"기타" 주직무를 선택하면 직접 입력할 수 있습니다.',
      })
      return
    }

    let isDuplicate = false
    setFormData((prev) => {
      if (prev.expertise.includes(trimmed)) {
        isDuplicate = true
        return prev
      }

      return {
        ...prev,
        expertise: [...prev.expertise, trimmed],
      }
    })

    if (isDuplicate) {
      toast({
        variant: 'destructive',
        title: '이미 추가된 전문 분야입니다.',
      })
      return
    }

    setOtherSpecialtyInput('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profileType) {
      setError('프로필 타입을 선택해주세요.')
      return
    }

    if (profileType === 'COMPANY') {
      if (!formData.company_name.trim()) {
        setError('회사명을 입력해주세요.')
        return
      }
      if (!formData.contact_person.trim()) {
        setError('담당자명을 입력해주세요.')
        return
      }
      if (!formData.contact_phone.trim()) {
        setError('연락처를 입력해주세요.')
        return
      }
    } else {
      if (!formData.username.trim()) {
        setError('사용자명을 입력해주세요.')
        return
      }
    }

    try {
      setLoading(true)
      setError(null)

      const uniqueMainJobs = Array.from(
        new Set(formData.main_job.filter((item) => item.trim())),
      )
      const uniqueExpertise = Array.from(
        new Set(formData.expertise.filter((item) => item.trim())),
      )

      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      // 프로필 생성
      const profile = await createProfile({
        profile_type: profileType,
        username: profileType === 'COMPANY' ? formData.company_name : formData.username,
        bio: formData.bio,
        main_job: uniqueMainJobs.length > 0 ? uniqueMainJobs : undefined,
        expertise:
          uniqueExpertise.length > 0 ? uniqueExpertise : undefined,
      })

      // 기업 프로필인 경우 client 테이블에도 데이터 저장
      if (profileType === 'COMPANY') {
        const { error: clientError } = await supabase
          .from('client')
          .upsert({
            user_id: user.id,
            company_name: formData.company_name,
            email: user.email || '',
            contact_person: formData.contact_person,
            contact_phone: formData.contact_phone,
            address: formData.address || null,
            website: formData.website || null,
          }, {
            onConflict: 'user_id'
          })

        if (clientError) {
          console.error('client 테이블 저장 실패:', clientError)
          // 프로필은 생성되었으므로 계속 진행
        }
      }

      toast({
        title: '프로필 생성 완료',
        description: `${profileType === 'FREELANCER' ? '프리랜서' : '기업'} 프로필이 생성되었습니다.`,
      })

      router.push(profileType === 'COMPANY' ? '/my/company/info' : '/my/profile')
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
    <div className="w-full md:py-6">
      {profileType !== 'COMPANY' && (
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-4 md:mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          돌아가기
        </Button>
      )}

      <div className={profileType === 'COMPANY' 
        ? 'bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8'
        : 'bg-white rounded-lg shadow-sm border p-4 md:p-6 lg:p-8'
      }>
        {profileType === 'COMPANY' ? (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">기업 프로필 생성</h1>
              <p className="text-gray-600">회사명·담당자·연락처 등을 입력하세요</p>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">새 프로필 생성</h1>
            <p className="text-gray-600 mb-6 md:mb-8">
              {profileType 
                ? `${profileType === 'FREELANCER' ? '프리랜서' : '기업'} 프로필을 생성하세요.`
                : '프리랜서 또는 기업 프로필을 생성하세요. 한 유저당 각각 최대 1개씩 생성할 수 있습니다.'}
            </p>
          </>
        )}

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
              {/* 기업 프로필인 경우 /my/company/info 스타일 적용 */}
              {profileType === 'COMPANY' ? (
                <>
                  <div>
                    <Label htmlFor="company_name" className="text-sm font-semibold text-gray-900 mb-2 block">
                      회사명 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, company_name: e.target.value }))}
                      required
                      className="border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_person" className="text-sm font-semibold text-gray-900 mb-2 block">
                      담당자명 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contact_person: e.target.value }))}
                      required
                      className="border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contact_phone" className="text-sm font-semibold text-gray-900 mb-2 block">
                      연락처 <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contact_phone: e.target.value }))}
                      required
                      className="border-gray-300 focus:ring-2 focus:ring-blue-500"
                      placeholder="010-1234-5678"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address" className="text-sm font-semibold text-gray-900 mb-2 block">
                      주소
                    </Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                      className="border-gray-300 focus:ring-2 focus:ring-blue-500"
                      placeholder="서울시 강남구..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="website" className="text-sm font-semibold text-gray-900 mb-2 block">
                      웹사이트
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                      placeholder="https://example.com"
                      className="border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-sm font-semibold text-gray-900 mb-2 block">
                      소개
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                      rows={4}
                      placeholder="회사에 대해 간단히 소개해주세요."
                      className="border-gray-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : (
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
                </>
              )}

              {/* 주직무 (프리랜서 전용) */}
              {profileType === 'FREELANCER' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  주직무
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  최대 {MAX_MAIN_JOB_SELECTION}개까지 선택할 수 있습니다.
                </p>
                <div className="flex flex-wrap gap-2">
                  {MAIN_JOB_OPTIONS.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleMainJob(role)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        formData.main_job.includes(role)
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* 전문 분야 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  전문 분야
                </label>
                <div className="space-y-4">
                  {formData.main_job.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      주직무를 먼저 선택해주세요.
                    </p>
                  ) : (
                    formData.main_job.map((role) => {
                      const specialties = SPECIALTY_OPTIONS_BY_CATEGORY[role] || []
                      const allowCustom =
                        CATEGORY_ALLOW_CUSTOM_SPECIALTY[role] || false

                      return (
                        <div key={role} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800">
                              {role}
                            </span>
                            {allowCustom && (
                              <span className="text-xs text-gray-500">
                                필요한 전문 분야를 직접 추가할 수 있습니다.
                              </span>
                            )}
                          </div>

                          {specialties.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {specialties.map((specialty) => (
                                <button
                                  key={specialty}
                                  type="button"
                                  onClick={() => toggleExpertise(specialty)}
                                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                                    formData.expertise.includes(specialty)
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {specialty}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">
                              선택 가능한 전문 분야가 없습니다. 직접 입력을
                              사용해주세요.
                            </p>
                          )}

                          {allowCustom && (
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                              <Input
                                value={otherSpecialtyInput}
                                onChange={(e) =>
                                  setOtherSpecialtyInput(e.target.value)
                                }
                                placeholder="전문 분야를 직접 입력하세요"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    addCustomSpecialty()
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                onClick={addCustomSpecialty}
                                variant="outline"
                              >
                                추가
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      선택된 전문 분야
                    </h3>
                    {formData.expertise.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.expertise.map((expertise) => (
                          <span
                            key={expertise}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                          >
                            {expertise}
                            <button
                              type="button"
                              onClick={() => removeExpertise(expertise)}
                              className="hover:text-green-900"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2">
                        전문 분야를 선택하거나 직접 추가해주세요.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              )}
            </>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* 제출 버튼 */}
          {profileType === 'COMPANY' ? (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Button 
                type="submit" 
                disabled={loading || !profileType} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 shadow-sm hover:shadow-md transition-all"
              >
                {loading ? '생성 중...' : '프로필 생성'}
              </Button>
            </div>
          ) : (
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
          )}
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
