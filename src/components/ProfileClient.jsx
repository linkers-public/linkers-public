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
    bio = '',
    username: profileUsername = '',
    main_job = [],
    expertise = [],
    availability_status,
    account_work_experiences = [],
    account_educations = [],
    account_license = [],
  } = profile || {}

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
    !profile ||
    (!profile.expertise || profile.expertise?.length === 0) &&
    (!profile.main_job || profile.main_job?.length === 0) &&
    (!profile.bio || profile.bio?.length === 0) &&
    (!profile.account_work_experiences || profile.account_work_experiences?.length === 0) &&
    (!profile.account_educations || profile.account_educations?.length === 0) &&
    (!profile.account_license || profile.account_license?.length === 0)

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">프로필을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-lg font-semibold text-red-900 mb-2">에러가 발생했습니다</p>
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-8">
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
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            아직 정보를 입력하지 않았습니다
          </h3>
          <p className="text-gray-600 mb-6">
            프로필 정보를 추가하여 더 많은 기회를 얻어보세요
          </p>
          {isOwner && (
            <Button onClick={navigateToEditProfile} size="lg">
              프로필 작성하기
            </Button>
          )}
        </div>
      )}
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
    <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
      <div className="flex gap-4">
        {/* 프로필 이미지 */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {username?.[0] || '?'}
            </div>
            {/* 연락 가능 여부 표시 */}
            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
              availabilityStatus === 'available' ? 'bg-green-500' : 'bg-gray-400'
            }`} title={availabilityStatus === 'available' ? '연락 가능' : '연락 불가'}></div>
          </div>
        </div>

        {/* 프로필 정보 */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{username || '사용자'}</h1>
                {isOwner && (
                  <button
                    onClick={onToggleAvailability}
                    className={`px-3 py-1 text-xs rounded-full transition-colors font-medium ${
                      availabilityStatus === 'available'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {availabilityStatus === 'available' ? '✅ 연락 가능' : '⏸️ 연락 불가'}
                  </button>
                )}
              </div>
              
              {/* 주직무 */}
              {mainJob && mainJob.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">주직무:</span>
                  <div className="flex flex-wrap gap-2">
                    {mainJob.map((job, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg"
                      >
                        {job}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 전문 분야 */}
              {expertise && expertise.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {expertise.map((ex) => (
                    <span
                      key={ex}
                      className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md"
                    >
                      {ex}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              {isOwner ? (
                <Button onClick={onEditProfile} variant="outline">
                  ✏️ 편집하기
                </Button>
              ) : (
                <>
                  <Button onClick={onClickBookmark} variant="outline">
                    ⭐ 북마크
                  </Button>
                  <Button onClick={onClickProposal}>
                    💬 제안하기
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* 소개 */}
          {bio && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-gray-700 leading-relaxed">{bio}</p>
            </div>
          )}
        </div>
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
  if (!account_work_experiences || account_work_experiences.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">💼 이력</h2>
        {isOwner && (
          <Button
            onClick={onCreateExperience}
            variant="outline"
            size="sm"
          >
            + 추가하기
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {account_work_experiences?.map((exp, index) => (
          <div
            className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
            key={exp.id || index}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              {exp.company_name?.[0] || '?'}
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{exp.company_name || '회사명 없음'}</h3>
                  {exp.position && (
                    <p className="text-sm text-gray-600 mt-1">{exp.position}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    📅 {formatDate(exp.start_date)} ~ {exp.end_date ? formatDate(exp.end_date) : '현재'}
                  </p>
                </div>
                {isOwner && (
                  <Button
                    onClick={() => onEditExperience(exp.id)}
                    size="icon"
                    variant="ghost"
                    className="flex-shrink-0"
                  >
                    ✏️
                  </Button>
                )}
              </div>
              
              {/* 작업 내용 */}
              {exp.content && (
                <div className="flex flex-col gap-1 mt-2">
                  {Array.isArray(exp.content) ? (
                    // 배열 형식인 경우
                    exp.content.map((item, idx) => (
                      <span
                        className="text-sm text-gray-700 flex items-start gap-2"
                        key={idx}
                      >
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{item}</span>
                      </span>
                    ))
                  ) : typeof exp.content === 'object' ? (
                    // 객체 형식인 경우
                    Object.entries(exp.content).map(([key, value], idx) => (
                      <span
                        className="text-sm text-gray-700 flex items-start gap-2"
                        key={idx}
                      >
                        <span className="text-blue-500 mt-1">•</span>
                        <span><strong>{key}:</strong> {value}</span>
                      </span>
                    ))
                  ) : (
                    // 문자열인 경우
                    <span className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{exp.content}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const EduCationMeta = ({
  account_educations,
  onEditEducation,
  onCreateEducation,
  isOwner,
}) => {
  if (!account_educations || account_educations.length === 0) {
    return null
  }
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">🎓 학력</h2>
        {isOwner && (
          <Button
            onClick={onCreateEducation}
            variant="outline"
            size="sm"
          >
            + 추가하기
          </Button>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {account_educations?.map((edu, index) => (
          <div
            className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
            key={edu.id || index}
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              🎓
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{edu.name || '학교명 없음'}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    📅 {formatDate(edu.start_date)} ~ {edu.end_date ? formatDate(edu.end_date) : '현재'}
                  </p>
                  {edu.content && (
                    <p className="text-sm text-gray-700 mt-2">{edu.content}</p>
                  )}
                </div>
                {isOwner && (
                  <Button
                    onClick={() => onEditEducation(edu.id)}
                    size="icon"
                    variant="ghost"
                    className="flex-shrink-0"
                  >
                    ✏️
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const LicenseMeta = ({ account_license, isOwner }) => {
  if (!account_license || account_license.length === 0) {
    return null
  }
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">🏆 자격증</h2>
        {isOwner && (
          <Button
            variant="outline"
            size="sm"
          >
            + 추가하기
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {account_license?.map((license, index) => (
          <div
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
            key={license.id || index}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                🏆
              </div>
              <div>
                <p className="font-medium text-gray-900">{license.name}</p>
                {license.acquisition_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    취득일: {formatDate(license.acquisition_date)}
                  </p>
                )}
              </div>
            </div>
            {isOwner && (
              <Button
                size="icon"
                variant="ghost"
                className="flex-shrink-0"
              >
                ✏️
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
