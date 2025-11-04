import React from 'react'
import { calculateTotalExperience } from '@/lib/transformExperienceDate'

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

interface SearchMakerCardProps {
  maker: Maker
}

export const SearchMakerCard = ({ maker }: SearchMakerCardProps) => {
  const totalExp = maker.account_work_experiences.length > 0
    ? calculateTotalExperience(maker.account_work_experiences)
    : null

  return (
    <div className="flex justify-between py-4 px-6 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors bg-white">
      <div className="flex gap-4 items-start w-full">
        <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{maker.username}</h3>
          <div className="flex flex-col gap-1.5 text-sm text-gray-600">
            {totalExp ? (
              <span>
                경력: {totalExp.years}년 {totalExp.months}개월
              </span>
            ) : (
              <span>경력: 신입</span>
            )}
            {maker.main_job && maker.main_job.length > 0 && (
              <span>주직무: {maker.main_job.join(', ')}</span>
            )}
            {maker.expertise && maker.expertise.length > 0 && (
              <span>전문분야: {maker.expertise.join(', ')}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
