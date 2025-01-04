'use client'

import React, { useEffect, useState } from 'react'
import { fetchUserProfile } from '@/apis/user.client'
import { Button } from '@/components/ui/button'

const ProfileClient = () => {
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchUserProfile()
        setProfile(data)
      } catch (error) {
        console.error('프로필 로딩 중 에러:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

  const formatDate = (dateString: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}`
  }

  if (isLoading) {
    return <div>로딩 중...</div>
  }

  if (!profile) {
    return <div>프로필을 찾을 수 없습니다.</div>
  }
  console.log(profile)
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-4">
        <section className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="flex flex-col items-center justify-between gap-2">
              <div className="w-14 h-14 rounded-full bg-palette-coolNeutral-90"></div>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-col ">
                <p className="text-subtitle2">{profile.username}</p>
                <div className="flex items-center gap-1">
                  <p className="text-p3">{profile.main_job[0]}</p>
                </div>
                <div className="flex items-center gap-1">
                  {profile.expertise?.map((ex: string) => (
                    <span
                      className="text-p4 "
                      key={ex}
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex  justify-center gap-4">
              <Button>매니저 버튼 1</Button>
              <Button variant="secondary">매니저 버튼 2</Button>
            </div>
          </div>
          {/* 자기소개 */}
          <div className="px-2">
            <span className="text-p2 text-palette-coolNeutral-30">
              {profile.bio}
            </span>
          </div>
        </section>
        {/* 이력 */}
        <h3 className="text-subtitle2">이력</h3>
        <div className="flex flex-col gap-2 itmes-center">
          {profile.account_work_experiences?.map((exp: any, index: number) => (
            <div
              className="flex gap-2"
              key={index}
            >
              <div className="w-8 h-8 rounded-full bg-palette-coolNeutral-90"></div>
              <div className="flex flex-col">
                <div
                  className="text-subtitle3"
                  key={index}
                >
                  {exp.name}
                </div>
                <div className="text-p2 text-palette-coolNeutral-60">
                  {formatDate(exp.start_date)} ~{' '}
                  {exp.end_date ? formatDate(exp.end_date) : '현재'}
                </div>

                <div className="flex flex-col mt-2">
                  {exp.content?.map((item: string, index: number) => (
                    <span
                      className="text-p2 text-palette-coolNeutral-20"
                      key={index}
                    >
                      · {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* 학력 */}

        <h3 className="text-subtitle2">학력</h3>
        <div className="flex flex-col gap-2 itmes-center">
          {profile.account_educations?.map((edu: any, index: number) => (
            <div
              className="flex gap-2"
              key={index}
            >
              <div className="w-8 h-8 rounded-full bg-palette-coolNeutral-90"></div>
              <div className="flex flex-col">
                <div className="flex gap-2">
                  <div
                    className="text-subtitle3"
                    key={index}
                  >
                    {edu.name}
                  </div>
                  <div className="text-p2 text-palette-coolNeutral-60">
                    {formatDate(edu.start_date)} ~{' '}
                    {edu.end_date ? formatDate(edu.end_date) : '현재'}
                  </div>
                </div>
                <div className="text-p2 text-palette-coolNeutral-20">
                  {edu.content}
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* 자격증 */}
        <h3 className="text-subtitle2">자격증</h3>
        {profile.account_license?.map((license: any, index: number) => (
          <div key={index}>{license.name}</div>
        ))}
      </div>
    </div>
  )
}

export default ProfileClient
