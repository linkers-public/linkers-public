'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { selectEducations, useProfileStore } from '@/stores/useProfileStore'
import { updateEducation } from '@/apis/profile.service'
import { Tables } from '@/types/supabase'

interface FormData {
  name: string
  start_date: string
  end_date: string | null
  content: string
}

const EducationUpdateClient = ({ id }: { id: string }) => {
  const router = useRouter()
  const educations = useProfileStore(selectEducations)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCurrentEducation, setIsCurrentEducation] = useState(false)
  console.log(educations)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    start_date: '',
    end_date: null,
    content: '',
  })

  useEffect(() => {
    const education = educations.find((edu: Tables<'account_educations'>) => edu.id === Number(id))

    if (!education) {
      setError('해당 학력 정보를 찾을 수 없습니다.')
      return
    }

    setFormData({
      name: education.name,
      start_date: education.start_date,
      end_date: education.end_date,
      content: education.content,
    })

    setIsCurrentEducation(education.end_date === null)
  }, [educations, id])

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const updateData = {
        name: formData.name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        content: formData.content,
      }

      const { error: updateError } = await updateEducation(
        Number(id),
        updateData,
      )

      if (updateError) {
        throw updateError
      }

      useProfileStore.getState().updateEducation(Number(id), updateData)
      router.push('/my/profile')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '업데이트 중 오류가 발생했습니다.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full p-4 md:p-6">
      <h1 className="text-2xl font-bold mb-6">학력 수정</h1>

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
            <Textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={4}
              placeholder="전공 및 부전공 정보를 입력해주세요."
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

export default EducationUpdateClient
