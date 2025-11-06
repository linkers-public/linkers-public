'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PostgrestError } from '@supabase/supabase-js'
import {
  ExperienceFilter,
  JobFilter,
  SpecializationFilter,
} from '@/components/CommonMakerFilter'
import { toast } from '@/hooks/use-toast'
import { useMakerFilter } from '@/hooks/use-maker-filter'
import { ManageableMakerCard } from '@/components/ManageableMakerCard'
import { fetchBookmarkList, unbookmark, propose } from '@/apis/proposal.service'
import { ProposalDialog } from '@/components/ProposalDialog'

//TODO - ZOD 반영
interface Maker {
  username: string
  main_job: string[] | null
  expertise: string[] | null
  bio: string
  user_id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  role: 'MAKER' | 'MANAGER' | 'NONE'
  account_work_experiences: any[]
  account_license: any[]
}

//TODO - ZOD 반영
interface Bookmark {
  id: number
  maker_id: string
  maker: Maker
  created_at: string
  manager_id: string
  proposal_status: boolean
}

const TeamProposalClient = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const { filters, handleFilterChange } = useMakerFilter()
  const [showProposalDialog, setShowProposalDialog] = useState(false)
  const [selectedMakerId, setSelectedMakerId] = useState<string | null>(null)
  const [selectedMakerUsername, setSelectedMakerUsername] = useState<string>('')

  useEffect(() => {
    const getBookmarkList = async () => {
      try {
        const { data, error } = await fetchBookmarkList({
          isProposed: false, // 찜한 메이커 목록
          experience: filters.experience,
          job: filters.job,
          specialization: filters.specialization,
        })
        if (error) {
          setError(error)
          return
        }
        if (data) {
          setBookmarks(data as unknown as Bookmark[])
        }
      } catch (err) {
        setError(err as PostgrestError)
      } finally {
        setIsLoading(false)
      }
    }
    getBookmarkList()
  }, [filters]) // TODO 필터 연동

  const handleUnbookmark = useCallback(async (makerId: string) => {
    try {
      await unbookmark(makerId)

      setBookmarks((prev) =>
        prev.filter((bookmark) => bookmark.maker_id !== makerId),
      )
      toast({
        title: '찜 취소 완료',
        description: '메이커 찜이 취소되었습니다.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '에러 발생',
        description: '작업 중 문제가 발생했습니다.',
      })
    }
  }, [])

  const handlePropose = async (makerId: string) => {
    const bookmark = bookmarks.find((b) => b.maker_id === makerId)
    if (bookmark) {
      setSelectedMakerId(makerId)
      setSelectedMakerUsername(bookmark.maker.username)
      setShowProposalDialog(true)
    }
  }

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">로딩중...</div>
    )
  if (error)
    return (
      <div className="flex justify-center items-center h-64">
        에러가 발생했습니다
      </div>
    )

  return (
    <div className="flex flex-col gap-4 w-full">
      <h3 className="text-h3">내가 찜한 메이커</h3>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2 relative">
          <ExperienceFilter
            value={filters.experience}
            onChange={(value) => handleFilterChange('experience', value)}
          />
          <JobFilter
            value={filters.job}
            onChange={(value) => handleFilterChange('job', value)}
          />
          <SpecializationFilter
            value={filters.specialization}
            onChange={(value) => handleFilterChange('specialization', value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {bookmarks.length > 0 ? (
          bookmarks.map((bookmark) => {
            return (
              <ManageableMakerCard
                key={bookmark.id}
                bookmark={bookmark}
                onUnbookmark={handleUnbookmark}
                onPropose={handlePropose}
              />
            )
          })
        ) : (
          <div className="flex justify-center items-center h-64">
            찜한 메이커가 없습니다.
          </div>
        )}
      </div>

      {/* 팀 제안 다이얼로그 */}
      {showProposalDialog && selectedMakerId && (
        <ProposalDialog
          open={showProposalDialog}
          onOpenChange={setShowProposalDialog}
          makerUsername={selectedMakerUsername}
          makerId={selectedMakerId}
        />
      )}
    </div>
  )
}

export default TeamProposalClient
