'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/dateFormat'

const ProfileClient = ({ profile }: { profile: any }) => {
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

  const navigateToEditProfile = () => {}
  const navigateToEditExperience = (id?: string) => {}
  const navigateToEditEducation = (id?: string) => {}
  const navigateToCreateExperience = () => {}
  const navigateToCreateEducation = () => {}

  if (profile === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-palette-coolNeutral-60">
          프로필 정보가 없습니다.
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
        />

        <WorkExperienceMeta
          account_work_experiences={account_work_experiences}
          onEditExperience={navigateToEditExperience}
          onCreateExperience={navigateToCreateExperience}
        />

        <EduCationMeta
          account_educations={account_educations}
          onEditEducation={navigateToEditEducation}
          onCreateEducation={navigateToCreateEducation}
        />

        <LicenseMeta account_license={account_license} />
      </div>
    </div>
  )
}

export default ProfileClient

const ProfileMeta = ({
  username,
  mainJob,
  expertise,
  bio,
  onClickBookmark,
  onClickProposal,
  onEditProfile,
}: {
  username: string
  mainJob: string[]
  expertise: string[]
  bio: string
  onClickBookmark: () => void
  onClickProposal: () => void
  onEditProfile: () => void
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
              {expertise?.map((ex: string) => (
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
}: {
  account_work_experiences: any[]
  onEditExperience: (id: string) => void
  onCreateExperience: () => void
}) => {
  return (
    <>
      <h3 className="text-subtitle2">이력</h3>
      <div className="flex flex-col gap-2 itmes-center">
        {account_work_experiences?.map((exp: any, index: number) => (
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
    </>
  )
}

const EduCationMeta = ({
  account_educations,
  onEditEducation,
  onCreateEducation,
}: {
  account_educations: any[]
  onEditEducation: (id: string) => void
  onCreateEducation: () => void
}) => {
  return (
    <>
      <h3 className="text-subtitle2">학력</h3>
      <div className="flex flex-col gap-2 itmes-center">
        {account_educations?.map((edu: any, index: number) => (
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
    </>
  )
}

const LicenseMeta = ({ account_license }: { account_license: string[] }) => {
  return (
    <>
      <h3 className="text-subtitle2">자격증</h3>
      {account_license?.map((license: any, index: number) => (
        <div key={index}>{license.name}</div>
      ))}
    </>
  )
}
