import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import MultiSelectButton from '@/components/MultiSelector'
import { XCircle } from 'lucide-react'

interface ExperienceFilterProps {
  value: [number, number]
  onChange: (value: [number, number]) => void
}

export const ExperienceFilter = ({
  value,
  onChange,
}: ExperienceFilterProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center justify-center px-4 py-2 rounded-[12px] shadow-normal min-w-[120px]">
          경력 : {value[0]}년 ~ {value[1]}년
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>경력 선택</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 p-4">
          <Slider
            value={value}
            onValueChange={(value) => onChange(value as [number, number])}
            min={1}
            max={20}
            step={1}
            className="w-full"
          />
          <p className="text-md text-gray-600">
            선택된 경력: {value[0]}년 ~ {value[1]}년
          </p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button>선택</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface JobFilterProps {
  value: string[]
  onChange: (value: string[]) => void
}

const jobCategories = [
  {
    category: '개발',
    jobs: ['프론트엔드', '백엔드', '풀스택', '모바일', '데브옵스'],
  },
  {
    category: '디자인',
    jobs: ['UX/UI', '그래픽', '브랜드', '3D'],
  },
  {
    category: '기획',
    jobs: [
      '서비스 기획',
      '전략 기획',
      '프로덕트 매니저',
      '프로젝트 매니저',
      '서비스 기획',
      '전략 기획',
      '프로덕트 매니저',
      '프로젝트 매니저',
    ],
  },
]

export const JobFilter = ({ value, onChange }: JobFilterProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          {selectedCategory ? (
            <>
              {selectedCategory} · {value[0]}
              {value.length > 1 && ` 외 ${value.length - 1}개`}
            </>
          ) : (
            `직무를 선택하세요 (${value.length})`
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[500px]">
        <DialogHeader>
          <DialogTitle>직무 선택</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_1fr] gap-4">
          <div className="border-r pr-4">
            <h4 className="font-medium mb-2">대분류</h4>
            {jobCategories.map((category) => (
              <div
                key={category.category}
                onClick={() => setSelectedCategory(category.category)}
                className={`cursor-pointer p-2 hover:bg-gray-50 ${
                  selectedCategory === category.category ? 'bg-gray-100' : ''
                }`}
              >
                {category.category}
              </div>
            ))}
          </div>

          <div>
            <h4 className="font-medium mb-2">소분류</h4>
            {selectedCategory &&
              jobCategories
                .find((c) => c.category === selectedCategory)
                ?.jobs.map((job) => (
                  <div
                    key={job}
                    className="flex justify-between p-2 hover:bg-gray-50"
                  >
                    <span>{job}</span>
                    <input
                      type="checkbox"
                      disabled={!selectedCategory}
                      checked={value.includes(job)}
                      onChange={() => {
                        if (value.length >= 3 && !value.includes(job)) return
                        const newJobs = value.includes(job)
                          ? value.filter((j) => j !== job)
                          : [...value, job]
                        onChange(newJobs)
                      }}
                    />
                  </div>
                ))}
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          {value.length}/2개 직무가 선택되었습니다
        </div>

        <div className="flex gap-2 mt-2">
          {value.map((job) => (
            <div
              key={job}
              className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"
            >
              {job}
              <XCircle
                className="h-4 w-4 cursor-pointer"
                onClick={() => onChange(value.filter((j) => j !== job))}
              />
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onChange([])}
          >
            초기화
          </Button>
          <DialogClose asChild>
            <Button>선택</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface SpecializationFilterProps {
  value: string[]
  onChange: (value: string[]) => void
}

export const SpecializationFilter = ({
  value,
  onChange,
}: SpecializationFilterProps) => {
  return (
    <MultiSelectButton
      values={value}
      onChange={onChange}
      placeholder="분야를 선택하세요"
      options={[
        { label: '웹 개발', value: '웹 개발' },
        { label: '모바일 개발', value: '모바일 개발' },
        { label: 'AI', value: 'AI' },
        { label: 'UI/UX', value: 'UI/UX' },
      ]}
    />
  )
}
