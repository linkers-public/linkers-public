'use client'

import React, { useEffect, useRef, useState } from 'react'
import MultiSelectButton from '@/components/MultiSelector'
import { Slider } from '@/components/ui/slider'
import { XCircle } from 'lucide-react'

type ProposalStatus = '수락' | '거절' | '미응답'

type MakerProfile = {
  id: number
  profileImage: string | null
  name: string
  currentCompany: string | null
  duration: string
  specialization: string
  projectLink: string | null
  status: ProposalStatus
  messageSent: boolean
}

const MakerProposalClient = () => {
  const [profiles, setProfiles] = useState<MakerProfile[]>([])
  const [showSlider, setShowSlider] = useState(false)
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const [filters, setFilters] = useState<{
    status: ProposalStatus[]
    specialization: string[]
    experience: [number, number]
    job: string[]
  }>({
    status: ['미응답', '거절'],
    specialization: [],
    experience: [0, 20],
    job: [],
  })

  useEffect(() => {
    const fetchProfiles = async () => {
      const data = null
      setProfiles(data)
    }
    fetchProfiles()
  }, [filters])

  const handleStatusChange = (value: ProposalStatus) => {
    setFilters((prev) => {
      const newStatus = prev.status.includes(value)
        ? prev.status.filter((status) => status !== value)
        : [...prev.status, value]
      return { ...prev, status: newStatus }
    })
  }

  const handleFilterChange = (
    key: 'specialization' | 'experience' | 'job',
    value: string | string[] | number[],
  ) => {
    setFilters((prev) => {
      if (key === 'experience' && Array.isArray(value)) {
        return { ...prev, [key]: value as [number, number] }
      }
      return { ...prev, [key]: value }
    })
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <h3 className="text-h3">메이커 제안 현황</h3>

      {/* 필터 영역 */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {['수락', '거절', '미응답'].map((status) => (
            <label
              key={status}
              className={`px-3 py-1 shadow-normal rounded-[12px] text-[12px] hover:shadow-emphasize ${
                filters.status.includes(status as ProposalStatus)
                  ? 'bg-blue-500 text-white'
                  : ''
              }`}
            >
              <input
                type="checkbox"
                value={status}
                checked={filters.status.includes(status as ProposalStatus)}
                onChange={() => handleStatusChange(status as ProposalStatus)}
                className="hidden"
              />
              {status}
            </label>
          ))}
        </div>

        <div className="flex gap-2 relative">
          <button
            className="flex items-center justify-center px-4 py-2 rounded-[12px] shadow-normal min-w-[120px]"
            onClick={() => setShowSlider((prev) => !prev)}
          >
            <span className="text-p2 text-palette-coolNeutral-40">
              경력 :{' '}
              {filters.experience
                ? `${filters.experience[0]}년 ~ ${filters.experience[1]}년`
                : '경력을 선택하세요'}
            </span>
          </button>

          {showSlider && (
            <div
              ref={sliderRef}
              className="flex flex-col gap-6 absolute top-full mt-2 bg-white shadow-emphasize p-4 rounded-[12px] z-50"
            >
              <div className="flex items-center justify-between">
                <div className="text-subtitle2">경력</div>
                <div
                  className="cursor-pointer rounded-full p-1 hover:bg-gray-200"
                  onClick={() => setShowSlider(false)}
                >
                  <XCircle />
                </div>
              </div>
              <Slider
                value={filters.experience}
                onValueChange={(value) =>
                  handleFilterChange('experience', value as [number, number])
                }
                min={1}
                max={20}
                step={1}
                className="w-40"
              />
              <p className="text-md  text-gray-600 whitespace-nowrap">
                선택된 경력: {filters.experience[0]}년 ~ {filters.experience[1]}
                년
              </p>
            </div>
          )}
          <MultiSelectButton
            values={filters.job}
            onChange={(values) => handleFilterChange('job', values)}
            placeholder="직무를 선택하세요"
            options={[
              { label: '프론트엔드', value: '프론트엔드' },
              { label: '백엔드', value: '백엔드' },
              { label: '데이터 분석', value: '데이터 분석' },
              { label: '디자인', value: '디자인' },
            ]}
          />

          <MultiSelectButton
            values={filters.specialization}
            onChange={(values) => handleFilterChange('specialization', values)}
            placeholder="분야를 선택하세요"
            options={[
              { label: '웹 개발', value: '웹 개발' },
              { label: '모바일 개발', value: '모바일 개발' },
              { label: 'AI', value: 'AI' },
              { label: 'UI/UX', value: 'UI/UX' },
            ]}
          />
        </div>
      </div>

      {/* 검색 영역 */}
      <div className="flex flex-col gap-4">
        {profiles.map((profile) => (
          <div
            className="flex shadow-normal justify-between py-4 px-6 rounded-[12px] gap-2"
            key={profile.id}
          >
            <div className="flex flex-col items-center justify-between gap-2">
              <div className="w-14 h-14 rounded-full bg-palette-coolNeutral-90"></div>
              <div className="px-4 py-1 rounded-[12px] shadow-normal text-p4">
                {profile.status}
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div>
                <p className="text-subtitle2">{profile.name}</p>
                <div className="flex items-center gap-1">
                  <p className="text-p3">
                    {profile.currentCompany || '정보 없음'}
                  </p>
                  <span>·</span>
                  <p className="text-p3">{profile.duration}</p>
                  <span>·</span>
                  <p className="text-p3">{profile.specialization}</p>
                </div>
              </div>

              <div className="flex gap-2 w-full h-full p-4">
                {profile.projectLink && (
                  <a
                    href={profile.projectLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  ></a>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-center gap-4">
              <button className="bg-palette-primary-normal text-subtitle3 text-white rounded-[12px] w-[240px] h-[48px]">
                즐겨찾기 취소
              </button>
              <button className=" text-palette-coolNeutral-20 text-subtitle3 shadow-normal border rounded-[12px] w-[240px] h-[48px]">
                제한하기 취소
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MakerProposalClient
