'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useProfileStore } from '@/stores/useProfileStore'
import { createLicense } from '@/apis/profile.service'

interface FormData {
  name: string
  acquisition_date: string
}

const LicenseCreateClient = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    acquisition_date: '',
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const createData = {
        name: formData.name,
        acquisition_date: formData.acquisition_date || null,
      }

      const { data, error: createError } = await createLicense(createData)

      if (createError) {
        throw createError
      }

      if (data) {
        useProfileStore.getState().addLicense(data)
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
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">자격증 추가</h1>
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
            <label className="block text-sm font-medium mb-1">자격증명</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="예: 정보처리기사"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">취득일</label>
            <Input
              type="date"
              name="acquisition_date"
              value={formData.acquisition_date}
              onChange={handleInputChange}
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

export default LicenseCreateClient

