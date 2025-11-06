'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { useProfileStore } from '@/stores/useProfileStore'
import { createCareer } from '@/apis/profile.service'

interface FormData {
  company_name: string
  position: string
  start_date: string
  end_date: string | null
  content: string
}

const CareerCreateClient = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCurrentJob, setIsCurrentJob] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    company_name: '',
    position: '',
    start_date: '',
    end_date: null,
    content: '',
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
    setIsCurrentJob(checked)
    setFormData((prev) => ({
      ...prev,
      end_date: checked ? null : '',
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const createData = {
        company_name: formData.company_name,
        position: formData.position,
        start_date: formData.start_date,
        end_date: formData.end_date,
        content: formData.content.split('\n').filter((line) => line.trim()),
      }

      const { data, error: createError } = await createCareer(createData)

      if (createError) {
        throw createError
      }
      if (data) {
        useProfileStore.getState().addWorkExperience(createData)
      }
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
    <div className="w-full p-4 md:p-6 -mt-4 md:-mt-8">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">경력 추가</h1>
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
            <label className="block text-sm font-medium mb-1">회사명</label>
            <Input
              name="company_name"
              value={formData.company_name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">직책</label>
            <Input
              name="position"
              value={formData.position}
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
                disabled={isCurrentJob}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="currentJob"
              checked={isCurrentJob}
              onChange={handleCheckboxChange}
              className="h-4 w-4"
            />
            <label className="text-sm">현재 재직중</label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">업무 설명</label>
            <Textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows={4}
              placeholder="업무 내용을 입력해주세요. 여러 줄 입력 가능합니다."
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

export default CareerCreateClient
