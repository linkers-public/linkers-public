'use client'

import React, { useEffect, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { useMakerFilter } from '@/hooks/use-maker-filter'
import { useRouter } from 'next/navigation'
import {
  ExperienceFilter,
  JobFilter,
  SpecializationFilter,
} from '@/components/CommonMakerFilter'
import { searchMakers } from '@/apis/serarch-maker.service'
import { PostgrestError } from '@supabase/supabase-js'
import { SearchMakerCard } from '@/components/SearchMakerCard'
import Link from 'next/link'

//TODO - 중북 추출 / ZOD 반영영
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

const SearchMakersClient = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<PostgrestError | null>(null)
  const { filters, handleFilterChange } = useMakerFilter()
  const [makerList, setMakerList] = useState<Maker[]>([])

  console.log('makerList', makerList)

  useEffect(() => {
    const getMakers = async () => {
      try {
        const { data, error } = await searchMakers({})
        if (error) {
          setError(error)
          return
        }
        if (data) {
          //@ts-ignore
          setMakerList(data)
        }
      } catch (err) {
        setError(err as PostgrestError)
      } finally {
        setIsLoading(false)
      }
    }
    getMakers()
  }, [filters])

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-h3">메이커 찾기</h3>
      <section className="flex gap-4">
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
        <div className="flex-1 flex gap-4 shadow-normal py-2 px-4 rounded-[12px] hover:shadow-emphasize">
          <SearchIcon />
          <span className="text-palette-coolNeutral-40">검색</span>
        </div>
      </section>

      <ul className="flex flex-wrap gap-6 justify-between mt-6">
        {makerList.map((maker) => (
          <Link
            href={`/profile/${maker.username}`}
            key={maker.user_id}
          >
            <SearchMakerCard
              key={maker.user_id}
              maker={maker}
            />
          </Link>
        ))}
      </ul>
    </div>
  )
}

export default SearchMakersClient
