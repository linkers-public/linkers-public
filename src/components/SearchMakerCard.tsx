import React from 'react'
import { calculateTotalExperience } from '@/lib/transformExperienceDate'

//TODO - ZOD 반영
interface Maker {
  username: string
  main_job: string[] | null
  expertise: string[] | null
  bio: string
  user_id: string
  profile_id?: string // 새로운 프로필 시스템
  profile_type?: 'FREELANCER' | 'COMPANY' | null
  is_active?: boolean | null
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
    <div className="py-4 px-5 border border-gray-200 rounded-md hover:border-gray-300 hover:shadow-sm transition-all bg-white">
      <div className="flex gap-4 items-start w-full">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 mb-2">{maker.username}</h3>
          <div className="flex flex-col gap-1.5 text-sm text-gray-600">
            {totalExp ? (
              <span className="text-gray-700">
                경력 {totalExp.years}년 {totalExp.months}개월
              </span>
            ) : (
              <span className="text-gray-700">경력 신입</span>
            )}
            {maker.main_job && maker.main_job.length > 0 && (
              <span className="text-gray-600">
                직무: {maker.main_job.slice(0, 3).join(', ')}
                {maker.main_job.length > 3 && ` 외 ${maker.main_job.length - 3}개`}
              </span>
            )}
            {maker.expertise && maker.expertise.length > 0 && (
              <span className="text-gray-600">
                전문분야: {maker.expertise.slice(0, 3).join(', ')}
                {maker.expertise.length > 3 && ` 외 ${maker.expertise.length - 3}개`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
