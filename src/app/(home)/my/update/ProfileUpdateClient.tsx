'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { useProfileStore } from '@/stores/useProfileStore'
import { updateProfile, fetchMyProfile } from '@/apis/profile.service'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { X } from 'lucide-react'

const JOB_OPTIONS = [
  '웹 개발',
  '앱 개발',
  '백엔드 개발',
  '프론트엔드 개발',
  '풀스택 개발',
  '데이터 엔지니어링',
  '데이터 분석',
  'AI/ML',
  'DevOps',
  'UI/UX 디자인',
  '프로젝트 매니저',
  'QA/테스팅',
]

const EXPERTISE_OPTIONS = [
  '데이터 분석 및 처리',
  '머신러닝 및 인공지능',
  '데이터 시각화',
  '데이터베이스 설계 및 최적화',
  '자연어 처리(NLP)',
  '데이터 마이그레이션 및 ETL',
  '앱 애플리케이션 개발',
  '모바일 개발 (iOS, Android)',
  '전자상거래 플랫폼 개발',
  'API 개발 및 운영',
  'SaaS 개발',
  '클라우드 인프라(AWS, Azure, GCP)',
  '컨테이너 오케스트레이션(Docker, Kubernetes)',
  'CI/CD 파이프라인 구축',
  '서비스 아키텍처 설계',
  '애플리케이션 보안',
  '네트워크 보안',
]

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

const ProfileUpdateClient = () => {
  const router = useRouter()
  const { profile, fetchMyProfileData } = useProfileStore()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skillInput, setSkillInput] = useState('')

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
        await fetchMyProfileData()
        
        // 사용자 이메일 가져오기
        const supabase = createSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        setFormData({
          bio: profile?.bio || '',
          username: profile?.username || '',
          main_job: profile?.main_job || [],
          expertise: profile?.expertise || [],
          email: user?.email || '',
          phone: (profile as any)?.contact_phone || '',
          website: (profile as any)?.contact_website || '',
          skills: [],
        })
      } catch (err) {
        console.error('프로필 로드 실패:', err)
        setError('프로필 정보를 불러오는데 실패했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
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
      await updateProfile({
        bio: formData.bio,
        username: formData.username,
        main_job: formData.main_job,
        expertise: formData.expertise,
        contact_phone: formData.phone || null,
        contact_website: formData.website || null,
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">프로필 수정</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
          <div className="space-y-4">
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
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">직무 및 전문 분야</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">
                주직무 <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {JOB_OPTIONS.map((job) => (
                  <button
                    key={job}
                    type="button"
                    onClick={() => toggleJob(job)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.main_job.includes(job)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {job}
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
              <div className="flex flex-wrap gap-2">
                {EXPERTISE_OPTIONS.map((exp) => (
                  <button
                    key={exp}
                    type="button"
                    onClick={() => toggleExpertise(exp)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.expertise.includes(exp)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {exp}
                  </button>
                ))}
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
        <div className="bg-white rounded-lg shadow-sm border p-6">
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
            <p className="text-xs text-gray-500">
              스킬 셋은 추후 데이터베이스에 저장될 예정입니다.
            </p>
          </div>
        </div>

        {/* 포트폴리오 파일 첨부 */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">포트폴리오 파일 첨부</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-2">포트폴리오 파일 첨부 기능은 추후 구현 예정입니다.</p>
            <p className="text-xs text-gray-400">
              PDF, 이미지 파일 등을 업로드할 수 있습니다.
            </p>
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

