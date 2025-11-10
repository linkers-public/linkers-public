'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { useProfileStore } from '@/stores/useProfileStore'
import { deleteLicense, updateLicense } from '@/apis/profile.service'
import { Tables } from '@/types/supabase'

interface FormData {
  name: string
  acquisition_date: string
}

const LicenseUpdateClient = ({ id }: { id: string }) => {
  const router = useRouter()
  const { profile } = useProfileStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    acquisition_date: '',
  })

  useEffect(() => {
    const license = profile?.account_license?.find(
      (lic: Tables<'account_license'>) => lic.id === Number(id)
    )

    if (!license) {
      setError('해당 자격증 정보를 찾을 수 없습니다.')
      return
    }

    setFormData({
      name: license.name || '',
      acquisition_date: license.acquisition_date || '',
    })
  }, [profile, id])

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
      const updateData = {
        name: formData.name,
        acquisition_date: formData.acquisition_date || null,
      }

      const { error: updateError } = await updateLicense(Number(id), updateData)

      if (updateError) {
        throw updateError
      }

      useProfileStore.getState().updateLicense(Number(id), updateData)
      router.push('/my/profile')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '업데이트 중 오류가 발생했습니다.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('선택한 자격증을 삭제하시겠습니까?')) return

    setIsDeleting(true)
    setError(null)
    try {
      const { error: deleteError } = await deleteLicense(Number(id))
      if (deleteError) {
        throw deleteError
      }

      useProfileStore.getState().deleteLicense(Number(id))
      router.push('/my/profile')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="w-full p-4 md:p-6 -mt-4 md:-mt-8">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">자격증 수정</h1>

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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            disabled={isLoading || isDeleting}
            className="border-red-400 text-red-600 hover:text-red-700 hover:border-red-500"
          >
            {isDeleting ? '삭제 중...' : '삭제'}
          </Button>
          <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading || isDeleting}
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isLoading || isDeleting}
          >
            {isLoading ? '저장 중...' : '저장'}
          </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default LicenseUpdateClient

