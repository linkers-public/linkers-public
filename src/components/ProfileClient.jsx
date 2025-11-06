'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/dateFormat'
import { useRouter } from 'next/navigation'
import { useProfileStore } from '@/stores/useProfileStore'
import { selectAccount, useAccountStore } from '@/stores/useAccoutStore'
import { updateAvailabilityStatus } from '@/apis/availability.service'
import { ProposalDialog } from '@/components/ProposalDialog'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { submitCareerVerification } from '@/apis/career-verification.service'

export const ProfileClient = ({ username, isOwner = false }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { profile, fetchMyProfileData, fetchUserProfileData } =
    useProfileStore()
  const account = useAccountStore(selectAccount)

  useEffect(() => {
    // 페이지 진입 시 스크롤을 맨 위로 이동
    window.scrollTo(0, 0)
    
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
    profile_type,
    badges = [],
    account_work_experiences = [],
    account_educations = [],
    account_license = [],
  } = profile || {}

  const [showProposalDialog, setShowProposalDialog] = useState(false)

  const onclickBookmark = () => {}
  const onclickProposal = () => {
    setShowProposalDialog(true)
  }

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
    <div className="flex flex-col gap-6 w-full pb-8 pt-16 md:pt-20">
      <ProfileMeta
        username={profileUsername}
        mainJob={main_job}
        expertise={expertise}
        bio={bio}
        profileType={profile_type}
        badges={badges}
        availabilityStatus={availability_status || 'available'}
        onClickBookmark={onclickBookmark}
        onClickProposal={onclickProposal}
        onEditProfile={navigateToEditProfile}
        onToggleAvailability={handleToggleAvailability}
        isOwner={isOwner}
      />

      {/* 제안하기 다이얼로그 */}
      {!isOwner && profile?.user_id && (
        <ProposalDialog
          open={showProposalDialog}
          onOpenChange={setShowProposalDialog}
          makerUsername={profileUsername}
          makerId={profile.user_id}
        />
      )}

      {!alreadyOnboarding ? (
        <>
          {profile_type === 'FREELANCER' && (
            <>
              <WorkExperienceMeta
                account_work_experiences={account_work_experiences}
                onEditExperience={navigateToEditExperience}
                onCreateExperience={navigateToCreateExperience}
                isOwner={isOwner}
                profileId={profile?.profile_id}
              />
              <EduCationMeta
                account_educations={account_educations}
                onEditEducation={navigateToEditEducation}
                onCreateEducation={navigateToCreateEducation}
                isOwner={isOwner}
                profileId={profile?.profile_id}
              />
              <LicenseMeta
                account_license={account_license}
                isOwner={isOwner}
                profileId={profile?.profile_id}
              />
              <PortfolioMeta
                profileId={profile?.profile_id}
                isOwner={isOwner}
              />
            </>
          )}
        </>
      ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 md:p-12 text-center">
          <div className="text-4xl mb-4">📝</div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">
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
  profileType,
  badges = [],
  availabilityStatus,
  onClickBookmark,
  onClickProposal,
  onEditProfile,
  onToggleAvailability,
  isOwner,
}) => {
  const getProfileTypeLabel = (type) => {
    if (!type) return null
    return type === 'FREELANCER' ? '프리랜서' : '기업'
  }
  return (
    <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">{username || '사용자'}</h1>
                {profileType && (
                  <span className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 font-medium">
                    {getProfileTypeLabel(profileType)}
                  </span>
                )}
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
              
              {/* 경력 인증 배지 */}
              {badges && Array.isArray(badges) && badges.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium"
                    >
                      🏆 {badge}
                    </span>
                  ))}
                </div>
              )}
              
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
            <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
              {isOwner ? (
                <Button onClick={onEditProfile} variant="outline">
                  ✏️ 편집하기
                </Button>
              ) : (
                profileType !== 'COMPANY' && (
                  <>
                    <Button onClick={onClickBookmark} variant="outline">
                      ⭐ 북마크
                    </Button>
                    <Button onClick={onClickProposal}>
                      💬 제안하기
                    </Button>
                  </>
                )
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
  profileId,
}) => {
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [selectedExpId, setSelectedExpId] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async () => {
    if (!file || !selectedExpId) return

    try {
      setUploading(true)
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('로그인이 필요합니다')
        return
      }

      // 파일 업로드
      const fileExt = file.name.split('.').pop()
      const fileName = `career/${user.id}/${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('career-verifications')
        .upload(fileName, file)

      if (uploadError) {
        throw new Error('파일 업로드 실패: ' + uploadError.message)
      }

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('career-verifications')
        .getPublicUrl(fileName)

      // 경력 인증 요청 생성
      await submitCareerVerification({
        profile_id: profileId,
        file_url: publicUrl,
        badge_type: '경력',
        description: `경력 인증: ${account_work_experiences.find(e => e.id === selectedExpId)?.company_name || ''}`,
      })

      alert('경력 인증 요청이 제출되었습니다.')
      setShowFileDialog(false)
      setFile(null)
      setSelectedExpId(null)
    } catch (error) {
      console.error('파일 업로드 실패:', error)
      alert('파일 업로드에 실패했습니다: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  if (!account_work_experiences || account_work_experiences.length === 0) {
    return null
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">💼 이력</h2>
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
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedExpId(exp.id)
                          setShowFileDialog(true)
                        }}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        📎 파일
                      </Button>
                      <Button
                        onClick={() => onEditExperience(exp.id)}
                        size="icon"
                        variant="ghost"
                        className="flex-shrink-0"
                      >
                        ✏️
                      </Button>
                    </div>
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

      {/* 파일 업로드 다이얼로그 */}
      {showFileDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">경력 인증 파일 첨부</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">파일 선택</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG 파일만 업로드 가능합니다.</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowFileDialog(false)
                    setFile(null)
                    setSelectedExpId(null)
                  }}
                >
                  취소
                </Button>
                <Button
                  onClick={handleFileUpload}
                  disabled={!file || uploading}
                >
                  {uploading ? '업로드 중...' : '업로드'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const EduCationMeta = ({
  account_educations,
  onEditEducation,
  onCreateEducation,
  isOwner,
  profileId,
}) => {
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [selectedEduId, setSelectedEduId] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async () => {
    if (!file || !selectedEduId) return

    try {
      setUploading(true)
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('로그인이 필요합니다')
        return
      }

      // 파일 업로드
      const fileExt = file.name.split('.').pop()
      const fileName = `education/${user.id}/${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('career-verifications')
        .upload(fileName, file)

      if (uploadError) {
        throw new Error('파일 업로드 실패: ' + uploadError.message)
      }

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('career-verifications')
        .getPublicUrl(fileName)

      // 학력 인증 요청 생성
      await submitCareerVerification({
        profile_id: profileId,
        file_url: publicUrl,
        badge_type: '학력',
        description: `학력 인증: ${account_educations.find(e => e.id === selectedEduId)?.name || ''}`,
      })

      alert('학력 인증 요청이 제출되었습니다.')
      setShowFileDialog(false)
      setFile(null)
      setSelectedEduId(null)
    } catch (error) {
      console.error('파일 업로드 실패:', error)
      alert('파일 업로드에 실패했습니다: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  if (!account_educations || account_educations.length === 0) {
    return null
  }
  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">🎓 학력</h2>
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
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setSelectedEduId(edu.id)
                          setShowFileDialog(true)
                        }}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        📎 파일
                      </Button>
                      <Button
                        onClick={() => onEditEducation(edu.id)}
                        size="icon"
                        variant="ghost"
                        className="flex-shrink-0"
                      >
                        ✏️
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 파일 업로드 다이얼로그 */}
      {showFileDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">학력 인증 파일 첨부</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">파일 선택</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG 파일만 업로드 가능합니다.</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowFileDialog(false)
                    setFile(null)
                    setSelectedEduId(null)
                  }}
                >
                  취소
                </Button>
                <Button
                  onClick={handleFileUpload}
                  disabled={!file || uploading}
                >
                  {uploading ? '업로드 중...' : '업로드'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const LicenseMeta = ({ account_license, isOwner, profileId }) => {
  const router = useRouter()
  const [showFileDialog, setShowFileDialog] = useState(false)
  const [selectedLicenseId, setSelectedLicenseId] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const navigateToCreateLicense = () => {
    router.push('/my/profile/licenses/create')
  }

  const navigateToEditLicense = (id) => {
    router.push(`/my/profile/licenses/${id}/update`)
  }

  const handleFileUpload = async () => {
    if (!file || !selectedLicenseId) return

    try {
      setUploading(true)
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        alert('로그인이 필요합니다')
        return
      }

      // 파일 업로드
      const fileExt = file.name.split('.').pop()
      const fileName = `license/${user.id}/${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('career-verifications')
        .upload(fileName, file)

      if (uploadError) {
        throw new Error('파일 업로드 실패: ' + uploadError.message)
      }

      // Public URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('career-verifications')
        .getPublicUrl(fileName)

      // 자격증 인증 요청 생성
      await submitCareerVerification({
        profile_id: profileId,
        file_url: publicUrl,
        badge_type: '자격증',
        description: `자격증 인증: ${account_license.find(l => l.id === selectedLicenseId)?.name || ''}`,
      })

      alert('자격증 인증 요청이 제출되었습니다.')
      setShowFileDialog(false)
      setFile(null)
      setSelectedLicenseId(null)
    } catch (error) {
      console.error('파일 업로드 실패:', error)
      alert('파일 업로드에 실패했습니다: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  if (!account_license || account_license.length === 0) {
    if (!isOwner) {
      return null
    }
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">🏆 자격증</h2>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToCreateLicense}
            >
              + 추가하기
            </Button>
          )}
        </div>
        <div className="text-center py-8 text-gray-500">
          등록된 자격증이 없습니다.
        </div>
      </div>
    )
  }
  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">🏆 자격증</h2>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={navigateToCreateLicense}
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
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setSelectedLicenseId(license.id)
                      setShowFileDialog(true)
                    }}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    📎 파일
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="flex-shrink-0"
                    onClick={() => navigateToEditLicense(license.id)}
                  >
                    ✏️
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 파일 업로드 다이얼로그 */}
      {showFileDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">자격증 인증 파일 첨부</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">파일 선택</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG 파일만 업로드 가능합니다.</p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowFileDialog(false)
                    setFile(null)
                    setSelectedLicenseId(null)
                  }}
                >
                  취소
                </Button>
                <Button
                  onClick={handleFileUpload}
                  disabled={!file || uploading}
                >
                  {uploading ? '업로드 중...' : '업로드'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const PortfolioMeta = ({ profileId, isOwner }) => {
  const router = useRouter()
  const [portfolios, setPortfolios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link_url: '',
    role: '',
    achievements: '',
    image_url: '',
  })

  useEffect(() => {
    if (!profileId) return
    loadPortfolios()
  }, [profileId])

  const loadPortfolios = async () => {
    try {
      setLoading(true)
      const supabase = createSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('account_portfolios')
        .select('*')
        .eq('profile_id', profileId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(6) // 최대 6개만 표시

      if (error) throw error
      setPortfolios(data || [])
    } catch (error) {
      console.error('포트폴리오 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase
        .from('account_portfolios')
        .insert({
          profile_id: profileId,
          title: formData.title,
          description: formData.description || null,
          link_url: formData.link_url,
          role: formData.role || null,
          achievements: formData.achievements || null,
          image_url: formData.image_url || null,
        })

      if (error) throw error

      setShowDialog(false)
      setFormData({
        title: '',
        description: '',
        link_url: '',
        role: '',
        achievements: '',
        image_url: '',
      })
      await loadPortfolios()
    } catch (error) {
      console.error('포트폴리오 추가 실패:', error)
      alert('포트폴리오 추가에 실패했습니다.')
    }
  }

  if (loading) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">📁 포트폴리오</h2>
        {isOwner && (
          <div className="flex gap-2">
            <Button
              onClick={() => setShowDialog(true)}
              variant="outline"
              size="sm"
            >
              + 추가하기
            </Button>
            {portfolios.length > 0 && (
              <Button
                onClick={() => router.push('/my/profile/portfolio')}
                variant="outline"
                size="sm"
              >
                전체 보기
              </Button>
            )}
          </div>
        )}
      </div>
      {portfolios && portfolios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {portfolio.image_url && (
                <img
                  src={portfolio.image_url}
                  alt={portfolio.title}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
              )}
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">
                {portfolio.title}
              </h3>
              {portfolio.description && (
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {portfolio.description}
                </p>
              )}
              {portfolio.role && (
                <p className="text-xs text-gray-500 mb-2">
                  역할: {portfolio.role}
                </p>
              )}
              <a
                href={portfolio.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                링크 보기 →
              </a>
            </div>
          ))}
        </div>
      ) : (
        isOwner && (
          <div className="text-center py-8 text-gray-500">
            등록된 포트폴리오가 없습니다.
          </div>
        )
      )}

      {/* 포트폴리오 추가 다이얼로그 */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">포트폴리오 추가</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">제목 *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">설명</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">링크 URL *</label>
                <input
                  type="url"
                  name="link_url"
                  value={formData.link_url}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">역할</label>
                <input
                  type="text"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">성과</label>
                <textarea
                  name="achievements"
                  value={formData.achievements}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">이미지 URL</label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false)
                    setFormData({
                      title: '',
                      description: '',
                      link_url: '',
                      role: '',
                      achievements: '',
                      image_url: '',
                    })
                  }}
                >
                  취소
                </Button>
                <Button type="submit">추가</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

