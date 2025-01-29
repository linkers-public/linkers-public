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
  return (
    <div className="flex shadow-normal justify-between py-4 px-6 rounded-[12px] gap-2">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-full bg-palette-coolNeutral-90" />
        <div>
          <h3 className="text-subtitle2">{maker.username}</h3>
          <div className="flex flex-col gap-2 text-p3 text-palette-coolNeutral-60">
            <span>
              총 경력 :
              {maker.account_work_experiences.length > 0 ? (
                <span>
                  {
                    calculateTotalExperience(maker.account_work_experiences)
                      .years
                  }
                  년{' '}
                  {
                    calculateTotalExperience(maker.account_work_experiences)
                      .months
                  }
                  개월
                </span>
              ) : (
                <span>신입</span>
              )}
              <span className="text-palette-coolNeutral-40 ml">
                {'  '}(
                {maker.account_work_experiences.length > 0 &&
                  maker.account_work_experiences.map((exp) => exp.company_name)}
                )
              </span>
            </span>
            <span>주직무 : {maker.main_job?.join(', ')}</span>
            <span>전문분야 : {maker.expertise?.join(', ')}</span>
            <div className="flex gap-2">
              <span className="rounded-full px-2 py-1 border-solid border border-palette-coolNeutral-90 text-palette-coolNeutral-40 text-xs">
                주요 스킬1
              </span>
              <span className="rounded-full px-2 py-1 border-solid border border-palette-coolNeutral-90 text-palette-coolNeutral-40 text-xs">
                주요 스킬2
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
