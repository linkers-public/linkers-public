'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/dateFormat'
import { useRouter } from 'next/navigation'
import { useProfileStore } from '@/stores/useProfileStore'
import { selectAccount, useAccountStore } from '@/stores/useAccoutStore'
import { updateAvailabilityStatus } from '@/apis/availability.service'

export const ProfileClient = ({ username, isOwner = false }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { profile, fetchMyProfileData, fetchUserProfileData } =
    useProfileStore()
  const account = useAccountStore(selectAccount)

  useEffect(() => {
    const getProfile = async () => {
      setIsLoading(true)
      try {
        if (isOwner) {
          await fetchMyProfileData()
        } else {
          await fetchUserProfileData(username)
        }
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    getProfile()
  }, [username])
  const {
    bio,
    username: profileUsername,
    main_job,
    expertise,
    availability_status,
    account_work_experiences,
    account_educations,
    account_license,
  } = profile

  const onclickBookmark = () => {}
  const onclickProposal = () => {}

  const handleToggleAvailability = async () => {
    try {
      const newStatus = availability_status === 'available' ? 'busy' : 'available'
      await updateAvailabilityStatus(newStatus)
      
      // 프로필 데이터 새로고침
      if (isOwner) {
        await fetchMyProfileData()
      } else {
        await fetchUserProfileData(username)
      }
    } catch (error) {
      console.error('Failed to update availability status:', error)
      alert('연락 가능 여부 업데이트에 실패했습니다.')
    }
  }

  const navigateToEditProfile = () => {
    router.push(isOwner ? '/my/update' : `/profile/${username}/update`)
  }

  const navigateToEditExperience = (id) => {
    router.push(
      isOwner
        ? `/my/profile/careers/${id}/update`
        : `/profile/${username}/careers/${id}/update`,
    )
  }

  const navigateToEditEducation = (id) => {
    router.push(
      isOwner
        ? `/my/profile/educations/${id}/update`
        : `/profile/${username}/educations/${id}/update`,
    )
  }

  const navigateToCreateExperience = () => {
    router.push(
      isOwner
        ? '/my/profile/careers/create'
        : `/profile/${username}/careers/create`,
    )
  }

  const navigateToCreateEducation = () => {
    router.push(
      isOwner
        ? '/my/profile/educations/create'
        : `/profile/${username}/educations/create`,
    )
  }

  const alreadyOnboarding =
    profile.expertise?.length === 0 &&
    profile.main_job?.length === 0 &&
    profile.bio?.length === 0 &&
    profile.account_work_experiences?.length === 0 &&
    profile.account_educations?.length === 0 &&
    profile.account_license?.length === 0

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
          username={profileUsername}
          mainJob={main_job}
          expertise={expertise}
          bio={bio}
          availabilityStatus={availability_status || 'available'}
          onClickBookmark={onclickBookmark}
          onClickProposal={onclickProposal}
          onEditProfile={navigateToEditProfile}
          onToggleAvailability={handleToggleAvailability}
          isOwner={isOwner}
        />

        {!alreadyOnboarding ? (
          <>
            <div>
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
          </>
        ) : (
          <>
            <div className="flex justify-center text-[42px]">
              아직 정보를 입력하지 않았습니다.
            </div>
            {isOwner && <Button>추가하기</Button>}
          </>
        )}
      </div>
    </div>
  )
}

const ProfileMeta = ({
  username,
  mainJob,
  expertise,
  bio,
  availabilityStatus,
  onClickBookmark,
  onClickProposal,
  onEditProfile,
  onToggleAvailability,
  isOwner,
}) => {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="flex flex-col items-center justify-between gap-2">
          <div className="w-14 h-14 rounded-full bg-palette-coolNeutral-90"></div>
          {/* 연락 가능 여부 표시 */}
          <div className={`w-3 h-3 rounded-full ${
            availabilityStatus === 'available' ? 'bg-green-500' : 'bg-gray-400'
          }`} title={availabilityStatus === 'available' ? '연락 가능' : '연락 불가'}></div>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col ">
            <div className="flex items-center gap-2">
              <p className="text-subtitle2">{username}</p>
              {isOwner && (
                <button
                  onClick={onToggleAvailability}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    availabilityStatus === 'available'
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {availabilityStatus === 'available' ? '연락 가능' : '연락 불가'}
                </button>
              )}
            </div>
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
          {isOwner ? (
            <Button>편집하기</Button>
          ) : (
            <>
              <Button> 북마크 </Button>
              <Button> 제안하기 </Button>
            </>
          )}
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
  if (!account_work_experiences) {
    return null
  }

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
  if (!account_educations) {
    return null
  }
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
  if (!account_license) {
    return null
  }
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
