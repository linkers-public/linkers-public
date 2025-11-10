"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MajorSelector } from '@/components/education/MajorSelector'
import { formatMajorsForStorage } from '@/utils/education'
import { useRouter } from 'next/navigation'
import { useProfileStore } from '@/stores/useProfileStore'
import { createEducation } from '@/apis/profile.service'

interface FormData {
  name: string
  start_date: string
  end_date: string | null
  education_level: string
  majors: string[]
}

const EducationCreateClient = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCurrentEducation, setIsCurrentEducation] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    start_date: '',
    end_date: null,
    education_level: '',
    majors: [],
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setIsCurrentEducation(checked)
    setFormData((prev) => ({
      ...prev,
      end_date: checked ? null : '',
    }))
  }

  const handleMajorsChange = (majors: string[]) => {
    setFormData((prev) => ({
      ...prev,
      majors,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const createData = {
        name: formData.name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        content: formatMajorsForStorage(formData.majors),
      }

      const { error: createError } = await createEducation(createData)

      if (createError) {
        throw createError
      }

      await useProfileStore.getState().fetchMyProfileData()

      router.push('/my/profile')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '생성 중 오류가 발생했습니다.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full p-4 md:p-6">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">학력 추가</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">학교명</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">학력 레벨</label>
            <select
              name="education_level"
              value={formData.education_level}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  education_level: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">선택하세요</option>
              <option value="고교">고교</option>
              <option value="대학">대학</option>
              <option value="대학원">대학원</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">시작일</label>
              <Input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">종료일</label>
              <Input
                type="date"
                name="end_date"
                value={formData.end_date || ''}
                onChange={handleInputChange}
                disabled={isCurrentEducation}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="currentEducation"
              checked={isCurrentEducation}
              onChange={handleCheckboxChange}
              className="h-4 w-4"
            />
            <label className="text-sm">현재 재학중</label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              전공/부전공
            </label>
            <MajorSelector
              value={formData.majors}
              onChange={handleMajorsChange}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default EducationCreateClient
