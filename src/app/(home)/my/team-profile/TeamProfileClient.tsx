'use client'

import React, { useEffect, useState } from 'react'
import { selectAccount, useAccountStore } from '@/stores/useAccoutStore'
import { useTeamProfileStore } from '@/stores/useTeamProfileStore'

const TeamProfileClient = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { teamProfile, fetchTeamProfile } = useTeamProfileStore()
  const account = useAccountStore(selectAccount)

  useEffect(() => {
    const getProfile = async () => {
      setIsLoading(true)
      try {
        await fetchTeamProfile()
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    getProfile()
  }, [])

  const {
    id,
    name,
    bio,
    specialty,
    sub_specialty,
    prefered,
    manager_id,
    created_at,
    updated_at,
    team_members,
  } = teamProfile || {}
  console.log(teamProfile)
  const editIntroduction = () => {}
  const editProfile = () => {}
  const editTeam = () => {}
  const editProject = () => {}
  const editCareer = () => {}

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
          에러가 발생했습니다: {error}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center  h-full w-full">
      <div className="p-4 flex flex-col gap-4">
        <span>이름 : {name}</span>
        <span>소개 : {bio}</span>
        <span>
          전문분야 :
          {specialty?.map((sep) => (
            <div>{sep}</div>
          ))}
        </span>
        <span>
          부분야 :{' '}
          {sub_specialty?.map((ssep) => (
            <div>{ssep}</div>
          ))}
        </span>
        <span>
          선호 유형:{' '}
          {prefered?.map((perfer) => (
            <div>{perfer}</div>
          ))}
        </span>
      </div>

      <div className="p-4 flex gap-4">
        {team_members?.map((member) => (
          <div>{member.name}</div>
        ))}
      </div>

      <div className="p-4 flex gap-4">
        <div>팀목록</div>
        {team_members?.map((member) => {
          console.log(member)
          return (
            <>
              <div>{member.account.username}</div>
              <div>{member.account.role}</div>
            </>
          )
        })}
      </div>
      <div className="p-4 flex gap-4">진행중인 프로젝트</div>
      <div className="p-4 flex gap-4">팀 경력</div>
    </div>
  )
}

export default TeamProfileClient
