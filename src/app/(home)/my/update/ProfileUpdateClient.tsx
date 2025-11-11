'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRouter, useSearchParams } from 'next/navigation'
import { useProfileStore } from '@/stores/useProfileStore'
import { updateProfile, fetchMyProfile } from '@/apis/profile.service'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { X } from 'lucide-react'
import {
  JOB_CATEGORIES,
  MAX_MAIN_JOB_SELECTION,
  SPECIALTY_OPTIONS_BY_CATEGORY,
  SPECIALTY_TO_CATEGORY_MAP,
  CATEGORY_ALLOW_CUSTOM_SPECIALTY,
  OTHER_CATEGORY_LABEL,
} from '@/constants/job-options'
import { toast } from '@/hooks/use-toast'

interface FormData {
  bio: string
  username: string
  main_job: string[]
  expertise: string[]
  email: string
  phone: string
  website: string
  skills: string[]
}

const MAIN_JOB_OPTIONS = JOB_CATEGORIES.map((category) => category.category)
const OTHER_CATEGORY_VALUE = OTHER_CATEGORY_LABEL

const deriveInitialMainJobs = (
  storedMainJobs: string[] = [],
  storedExpertise: string[] = [],
) => {
  const roleSet = new Set<string>()

  storedMainJobs.forEach((item) => {
    if (MAIN_JOB_OPTIONS.includes(item)) {
      roleSet.add(item)
      return
    }
    const mappedRole = SPECIALTY_TO_CATEGORY_MAP[item]
    if (mappedRole) {
      roleSet.add(mappedRole)
    }
  })

  storedExpertise.forEach((item) => {
    const mappedRole = SPECIALTY_TO_CATEGORY_MAP[item]
    if (mappedRole) {
      roleSet.add(mappedRole)
    }
  })

  const hasCustomSpecialty = storedExpertise.some(
    (item) => !SPECIALTY_TO_CATEGORY_MAP[item],
  )

  if (hasCustomSpecialty) {
    roleSet.add(OTHER_CATEGORY_VALUE)
  }

  return Array.from(roleSet)
}

const ProfileUpdateClient = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { profile, fetchMyProfileData } = useProfileStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skillInput, setSkillInput] = useState('')
  const [isNewProfile, setIsNewProfile] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [otherSpecialtyInput, setOtherSpecialtyInput] = useState('')

  const [formData, setFormData] = useState<FormData>({
    bio: '',
    username: '',
    main_job: [],
    expertise: [],
    email: '',
    phone: '',
    website: '',
    skills: [],
  })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // 온보딩 플로우 확인 (from=onboarding 또는 new_profile=true)
        const fromParam = searchParams.get('from')
        const newProfileParam = searchParams.get('new_profile')
        const isOnboarding = fromParam === 'onboarding' || newProfileParam === 'true'
        
        if (isOnboarding) {
          setIsNewProfile(true)
          toast({
            title: '프로필 생성 완료!',
            description: '프로필을 완성하기 위해 추가 정보를 입력해주세요.',
          })
        }

        await fetchMyProfileData()
        const latestProfile: any = useProfileStore.getState().profile

        const storedMainJobs = Array.isArray(latestProfile?.main_job)
          ? (latestProfile.main_job as any[]).filter(
              (item): item is string => typeof item === 'string' && item.trim(),
            )
          : []
        const storedExpertise = Array.isArray(latestProfile?.expertise)
          ? (latestProfile.expertise as any[]).filter(
              (item): item is string => typeof item === 'string' && item.trim(),
            )
          : []
        const storedSkills = Array.isArray(latestProfile?.skills)
          ? (latestProfile.skills as any[]).filter(
              (item): item is string => typeof item === 'string' && item.trim(),
            )
          : []

        const initialMainJobs = deriveInitialMainJobs(
          storedMainJobs,
          storedExpertise,
        )
        const uniqueExpertise = Array.from(new Set(storedExpertise))

        // 사용자 이메일 가져오기
        const supabase = createSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        setFormData({
          bio: latestProfile?.bio || '',
          username: latestProfile?.username || '',
          main_job: initialMainJobs,
          expertise: uniqueExpertise,
          email: user?.email || '',
          phone: latestProfile?.contact_phone || '',
          website: latestProfile?.contact_website || '',
          skills: storedSkills,
        })
        setProfileImage(latestProfile?.profile_image_url || null)
      } catch (err) {
        console.error('프로필 로드 실패:', err)
        setError('프로필 정보를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [searchParams])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
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

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }))
      setSkillInput('')
    }
  }

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const uniqueMainJobs = Array.from(
        new Set(formData.main_job.filter((item) => item.trim())),
      )
      const uniqueExpertise = Array.from(
        new Set(formData.expertise.filter((item) => item.trim())),
      )

      await updateProfile({
        bio: formData.bio,
        username: formData.username,
        main_job: uniqueMainJobs,
        expertise: uniqueExpertise,
        contact_phone: formData.phone || null,
        contact_website: formData.website || null,
        profile_image_url: profileImage || null,
      })

      // 프로필 새로고침
      await fetchMyProfileData()
      
      router.push('/my/profile')
    } catch (err) {
      console.error('프로필 업데이트 실패:', err)
      setError(
        err instanceof Error ? err.message : '프로필 업데이트에 실패했습니다.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">프로필 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: '이미지 파일만 업로드 가능합니다',
      })
      return
    }

    // 파일 크기 검증 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: '파일 크기는 5MB 이하여야 합니다',
      })
      return
    }

    try {
      setIsUploadingImage(true)
      const supabase = createSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('로그인이 필요합니다')
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
      const fileExt = file.name.split('.').pop()
      const fileName = `profiles/${user.id}/${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: true })

      if (uploadError) {
        throw new Error('파일 업로드 실패: ' + uploadError.message)
      }

      // Public URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from('profile-images').getPublicUrl(fileName)

      setProfileImage(publicUrl)
      toast({
        title: '이미지 업로드 완료',
        description: '프로필 이미지가 업로드되었습니다.',
      })
    } catch (error: any) {
      console.error('이미지 업로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '이미지 업로드 실패',
        description: error.message,
      })
    } finally {
      setIsUploadingImage(false)
    }
  }

  return (
    <div className="w-full md:py-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">프로필 수정</h1>

      {/* 새 프로필 완성 유도 메시지 */}
      {isNewProfile && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-6">
          <div className="flex items-start">
            <div className="flex-1">
              <h3 className="font-semibold mb-1">프로필을 완성해주세요!</h3>
              <p className="text-sm">
                프로필이 생성되었습니다. 더 나은 서비스 이용을 위해 자기소개, 직무, 전문 분야 등의 정보를 입력해주세요.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsNewProfile(false)}
              className="text-blue-600 hover:text-blue-800 ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
          <div className="space-y-4">
            {/* 프로필 이미지 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                프로필 이미지
              </label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="프로필 이미지"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-gray-200">
                      {formData.username?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-block">
                      {isUploadingImage ? '업로드 중...' : '이미지 선택'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                    />
                  </label>
                  {profileImage && (
                    <button
                      type="button"
                      onClick={() => setProfileImage(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                    >
                      이미지 제거
                    </button>
                  )}
                  <p className="text-xs text-gray-500">
                    JPG, PNG, GIF (최대 5MB)
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                사용자명 <span className="text-red-500">*</span>
              </label>
              <Input
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                placeholder="사용자명을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                자기소개 <span className="text-red-500">*</span>
              </label>
              <Textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={5}
                required
                placeholder="간단한 자기소개를 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">이메일</label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                이메일은 인증 정보에서 가져옵니다.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">전화번호</label>
              <Input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="전화번호를 입력하세요 (선택사항)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">웹사이트</label>
              <Input
                name="website"
                type="url"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://example.com (선택사항)"
              />
            </div>
          </div>
        </div>

        {/* 직무 및 전문 분야 */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">직무 및 전문 분야</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">
                주직무 <span className="text-red-500">*</span>
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
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.main_job.includes(role)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
              {formData.main_job.length === 0 && (
                <p className="text-xs text-red-500 mt-2">
                  최소 1개 이상의 직무를 선택해주세요.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                전문 분야 <span className="text-red-500">*</span>
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
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                  formData.expertise.includes(specialty)
                                    ? 'bg-blue-600 text-white'
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
                      {formData.expertise.map((exp) => (
                        <span
                          key={exp}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                        >
                          {exp}
                          <button
                            type="button"
                            onClick={() => removeExpertise(exp)}
                            className="hover:text-blue-900"
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

              {formData.expertise.length === 0 && (
                <p className="text-xs text-red-500 mt-2">
                  최소 1개 이상의 전문 분야를 선택해주세요.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 스킬 셋 */}
        <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">스킬 셋</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="스킬을 입력하고 추가 버튼을 클릭하세요"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSkill()
                  }
                }}
              />
              <Button type="button" onClick={addSkill} variant="outline">
                추가
              </Button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSaving}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={
              isSaving ||
              !formData.username ||
              !formData.bio ||
              formData.main_job.length === 0 ||
              formData.expertise.length === 0
            }
          >
            {isSaving ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default ProfileUpdateClient

