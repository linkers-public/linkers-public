'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/dateFormat'
import { useRouter } from 'next/navigation'
import { useProfileStore } from '@/stores/useProfileStore'
import { selectAccount, useAccountStore } from '@/stores/useAccoutStore'

export const ProfileClient = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { profile, fetchProfile } = useProfileStore()
  const account = useAccountStore(selectAccount)

  useEffect(() => {
    const getProfile = async () => {
      setIsLoading(true)
      try {
        await fetchProfile()
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    getProfile()
  }, [])

  const {
    bio,
    username,
    main_job,
    expertise,
    account_work_experiences,
    account_educations,
    account_license,
  } = profile

  const onclickBookmark = () => {}
  const onclickProposal = () => {}

  const navigateToEditProfile = () => {
    router.push('/my/update')
  }
  const navigateToEditExperience = (id) => {
    router.push(`/my/profile/careers/${id}/update`)
  }
  const navigateToEditEducation = (id) => {
    router.push(`/my/profile/educations/${id}/update`)
  }
  const navigateToCreateExperience = () => {
    router.push('/my/profile/careers/create')
  }
  const navigateToCreateEducation = () => {
    router.push('/my/profile/educations/create')
  }

  const isOwner = account?.id === profile?.account_id

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-palette-coolNeutral-60">로딩중...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-palette-coolNeutral-60">
          에러가 발생했습니다: {error.message}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-4">
        <ProfileMeta
          username={username}
          mainJob={main_job}
          expertise={expertise}
          bio={bio}
          onClickBookmark={onclickBookmark}
          onClickProposal={onclickProposal}
          onEditProfile={navigateToEditProfile}
          isOwner={isOwner}
        />

        <WorkExperienceMeta
          account_work_experiences={account_work_experiences}
          onEditExperience={navigateToEditExperience}
          onCreateExperience={navigateToCreateExperience}
          isOwner={isOwner}
        />

        <EduCationMeta
          account_educations={account_educations}
          onEditEducation={navigateToEditEducation}
          onCreateEducation={navigateToCreateEducation}
          isOwner={isOwner}
        />

        <LicenseMeta
          account_license={account_license}
          isOwner={isOwner}
        />
      </div>
    </div>
  )
}

const ProfileMeta = ({
  username,
  mainJob,
  expertise,
  bio,
  onClickBookmark,
  onClickProposal,
  onEditProfile,
  isOwner,
}) => {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="flex flex-col items-center justify-between gap-2">
          <div className="w-14 h-14 rounded-full bg-palette-coolNeutral-90"></div>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col ">
            <p className="text-subtitle2">{username}</p>
            <div className="flex items-center gap-1">
              <p className="text-p3">{mainJob[0]}</p>
            </div>
            <div className="flex items-center gap-1">
              {expertise?.map((ex) => (
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
      <div className="px-2">
        <span className="text-p2 text-palette-coolNeutral-30">{bio}</span>
      </div>
    </section>
  )
}

const WorkExperienceMeta = ({
  account_work_experiences,
  onEditExperience,
  onCreateExperience,
  isOwner,
}) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="text-subtitle2">이력</h3>
        {isOwner && (
          <Button
            onClick={onCreateExperience}
            variant="outline"
            size="sm"
          >
            추가하기
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {account_work_experiences?.map((exp, index) => (
          <div
            className="flex gap-2"
            key={index}
          >
            <div className="w-8 h-8 rounded-full bg-palette-coolNeutral-90" />
            <div className="flex flex-1 flex-col">
              <div className="text-subtitle3">{exp.company_name}</div>
              <div className="text-p2 text-palette-coolNeutral-60">
                {formatDate(exp.start_date)} ~{' '}
                {exp.end_date ? formatDate(exp.end_date) : '현재'}
              </div>
              <div className="flex flex-col mt-2">
                {exp.content?.map((item, index) => (
                  <span
                    className="text-p2 text-palette-coolNeutral-20"
                    key={index}
                  >
                    · {item}
                  </span>
                ))}
              </div>
            </div>
            {isOwner && (
              <Button
                onClick={() => onEditExperience(exp.id)}
                size="icon"
                variant="ghost"
              >
                ✏️
              </Button>
            )}
          </div>
        ))}
      </div>
    </>
  )
}

const EduCationMeta = ({
  account_educations,
  onEditEducation,
  onCreateEducation,
  isOwner,
}) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="text-subtitle2">학력</h3>
        {isOwner && (
          <Button
            onClick={onCreateEducation}
            variant="outline"
            size="sm"
          >
            추가하기
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {account_educations?.map((edu, index) => (
          <div
            className="flex gap-2"
            key={index}
          >
            <div className="w-8 h-8 rounded-full bg-palette-coolNeutral-90" />
            <div className="flex flex-1 flex-col">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <div className="text-subtitle3">{edu.name}</div>
                  <div className="text-p2 text-palette-coolNeutral-60">
                    {formatDate(edu.start_date)} ~{' '}
                    {edu.end_date ? formatDate(edu.end_date) : '현재'}
                  </div>
                </div>
                {isOwner && (
                  <Button
                    onClick={() => onEditEducation(edu.id)}
                    size="icon"
                    variant="ghost"
                  >
                    ✏️
                  </Button>
                )}
              </div>
              <div className="text-p2 text-palette-coolNeutral-20">
                {edu.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

const LicenseMeta = ({ account_license, isOwner }) => {
  return (
    <>
      <div className="flex justify-between items-center">
        <h3 className="text-subtitle2">자격증</h3>
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
          >
            추가하기
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {account_license?.map((license, index) => (
          <div
            className="flex justify-between items-center"
            key={index}
          >
            <div>{license.name}</div>
            {isOwner && (
              <Button
                size="icon"
                variant="ghost"
              >
                ✏️
              </Button>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
