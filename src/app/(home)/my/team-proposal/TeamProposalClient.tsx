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
}

//TODO - ZOD 반영
interface Proposal {
  id: number
  maker_id: string
  maker: Maker
  created_at: string
  manager_id: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null
}

type ProposalStatusFilter = 'PENDING' | 'ACCEPTED' | 'REJECTED'

const TeamProposalClient = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const { filters, handleFilterChange } = useMakerFilter()
  const [selectedStatuses, setSelectedStatuses] = useState<
    ProposalStatusFilter[]
  >(['PENDING', 'REJECTED'])

  useEffect(() => {
    const getBookmarkList = async () => {
      try {
        const { data, error } = await fetchTeamPropsalList({})
        if (error) {
          setError(error)
          return
        }
        if (data) {
          //@ts-ignore
          setBookmarkList(data)
        }
      } catch (err) {
        setError(err as PostgrestError)
      } finally {
        setIsLoading(false)
      }
    }
    getBookmarkList()
  }, [filters]) // TODO 필터 연동

  const cancelPropose = useCallback(async (makerId: string) => {
    try {
      //await unbookmark(makerId)

      setProposals((prev) =>
        prev.filter((proposal) => proposal.maker_id !== makerId),
      )
      toast({
        title: '제안 취소 완료',
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

  const handlePropose = async (makerId: string) => {}

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
        <div className="flex gap-2">
          <div
            onClick={() => {
              setSelectedStatuses((prev) =>
                prev.includes('PENDING')
                  ? prev.filter((status) => status !== 'PENDING')
                  : [...prev, 'PENDING'],
              )
            }}
            className={`flex justify-center items-center px-3 py-1 rounded-[12px] text-p3 cursor-pointer ${
              selectedStatuses.includes('PENDING')
                ? 'shadow-emphasize'
                : 'shadow-normal'
            }`}
          >
            대기중
          </div>
          <div
            onClick={() => {
              setSelectedStatuses((prev) =>
                prev.includes('ACCEPTED')
                  ? prev.filter((status) => status !== 'ACCEPTED')
                  : [...prev, 'ACCEPTED'],
              )
            }}
            className={`flex justify-center items-center px-3 py-1 rounded-[12px] text-p3 cursor-pointer ${
              selectedStatuses.includes('ACCEPTED')
                ? 'shadow-emphasize'
                : 'shadow-normal'
            }`}
          >
            수락됨
          </div>
          <div
            onClick={() => {
              setSelectedStatuses((prev) =>
                prev.includes('REJECTED')
                  ? prev.filter((status) => status !== 'REJECTED')
                  : [...prev, 'REJECTED'],
              )
            }}
            className={`flex justify-center items-center px-3 py-1 rounded-[12px] text-p3 cursor-pointer ${
              selectedStatuses.includes('REJECTED')
                ? 'shadow-emphasize'
                : 'shadow-normal'
            }`}
          >
            거절됨
          </div>
        </div>

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
        {proposals.length > 0 ? (
          proposals.map((proposal) => {
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
    </div>
  )
}

export default TeamProposalClient
