'use client'

import React from 'react'
import { SearchIcon } from 'lucide-react'
import { useMakerFilter } from '@/hooks/use-maker-filter'
import { useRouter } from 'next/navigation'
import {
  ExperienceFilter,
  JobFilter,
  SpecializationFilter,
} from '@/components/CommonMakerFilter'

const SearchMakersClient = () => {
  const router = useRouter()
  const { filters, handleFilterChange } = useMakerFilter()

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
        <MakerMeta />
        <MakerMeta />
        <MakerMeta />
        <MakerMeta />
        <MakerMeta />
        <MakerMeta />
        <MakerMeta />
      </ul>
    </div>
  )
}

const MakerMeta = () => {
  return (
    <li className="flex flex-col gap-2 hover:shadow-strong p-4 rounded-[12px] bg-white shadow-normal">
      {/* 요약 내용 */}
      <div className="flex gap-4 items-center">
        <div className="w-14 h-14 rounded-full bg-palette-coolNeutral-90"></div>

        <div className="flex flex-col">
          <span className="text-subtitle2">김유빈</span>
          <p className="text-p3">경력 2년</p>
          <div className="flex gap-1">
            <p className="text-p3 text-palette-inverse-primary font-semibold">
              응답율 100%
            </p>
            <p className="text-p3 font-semibold">마지막 접속일 </p>
            <p className="text-p3">2024 / 12 / 29 </p>
          </div>
        </div>
        <aside className="ml-auto">
          <div className="px-8 py-2 bg-palette-primary-normal rounded-[8px] text-white text-[14px]">
            즐겨찾기
          </div>
        </aside>
      </div>

      {/* 상세내용 */}
      <div className="flex-col py-2 space-y-1">
        <div className="text-subtitle3 text-palette-coolNeutral-50">
          경험한 회사
        </div>
        <div className="flex px-4 gap-1 items-center">
          <span className="text-p3">브로드컴</span>
          <span>·</span>
          <span className="text-p3">엔디비아</span>
          <span>·</span>
          <span className="text-p3">네이쳐스퓨어</span>
          <span>·</span>
          <span className="text-p3">이니시스프리</span>
        </div>
        <div className="text-subtitle3 text-palette-coolNeutral-50">
          전문 분야
        </div>
        <div className="flex px-4 gap-1 items-center">
          <span className="text-p3">자산운용사</span>
          <span>·</span>
          <span className="text-p3">리스크 관리 전문가</span>
          <span>·</span>
          <span className="text-p3">보험계리학 </span>
        </div>
        <div className="text-subtitle3 text-palette-coolNeutral-50">
          스킬 영역
        </div>
        <div className="flex px-4 gap-1 items-center">
          <span className="text-p3">위험 평가 및 관리</span>
          <span>·</span>
          <span className="text-p3">CPA (Certified Public Accountant)</span>
          <span>·</span>
          <span className="text-p3">CFP (Certified Financial Planner)</span>
        </div>
      </div>
    </li>
  )
}

export default SearchMakersClient
