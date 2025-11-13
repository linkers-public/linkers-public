/**
 * 팀 프로필에서 RAG용 summary 생성
 */

import type { TeamProfile } from '@/stores/useTeamProfileStore'

export interface TeamSummaryData {
  summary: string
  meta: {
    specialty?: string[]
    sub_specialty?: string[]
    prefered?: string[]
    member_count?: number
    member_skills?: string[]
  }
}

/**
 * 팀 프로필에서 RAG용 summary와 meta 생성
 */
export function generateTeamSummary(team: TeamProfile): TeamSummaryData {
  const parts: string[] = []
  
  // 1. 팀 이름
  if (team.name) {
    parts.push(`팀명: ${team.name}`)
  }
  
  // 2. 팀 소개
  if (team.bio) {
    parts.push(`소개: ${team.bio}`)
  }
  
  // 3. 전문 분야
  if (team.specialty && team.specialty.length > 0) {
    parts.push(`전문 분야: ${team.specialty.join(', ')}`)
  }
  
  // 4. 세부 전문 분야
  if (team.sub_specialty && team.sub_specialty.length > 0) {
    parts.push(`세부 전문 분야: ${team.sub_specialty.join(', ')}`)
  }
  
  // 5. 선호 기술/도메인
  if (team.prefered && team.prefered.length > 0) {
    parts.push(`선호 기술: ${team.prefered.join(', ')}`)
  }
  
  // 6. 팀 멤버 정보
  if (team.team_members && team.team_members.length > 0) {
    const memberNames = team.team_members
      .map(m => m.account?.username || '멤버')
      .filter(Boolean)
    
    if (memberNames.length > 0) {
      parts.push(`팀 멤버: ${memberNames.join(', ')}`)
    }
    
    // 멤버들의 기술 스택 수집
    const memberSkills = team.team_members
      .map(m => m.account?.expertise || [])
      .flat()
      .filter((skill, index, arr) => arr.indexOf(skill) === index) // 중복 제거
    
    if (memberSkills.length > 0) {
      parts.push(`멤버 기술 스택: ${memberSkills.join(', ')}`)
    }
  }
  
  // 7. 매니저 정보
  if (team.manager) {
    parts.push(`매니저: ${team.manager.username}`)
    if (team.manager.bio) {
      parts.push(`매니저 소개: ${team.manager.bio}`)
    }
  }
  
  const summary = parts.join('\n')
  
  // Meta 데이터 구성
  const meta: TeamSummaryData['meta'] = {
    specialty: team.specialty || undefined,
    sub_specialty: team.sub_specialty || undefined,
    prefered: team.prefered || undefined,
    member_count: team.team_members?.length || 0,
    member_skills: team.team_members
      ?.map(m => m.account?.expertise || [])
      .flat()
      .filter((skill, index, arr) => arr.indexOf(skill) === index) || undefined,
  }
  
  return {
    summary,
    meta,
  }
}

/**
 * 간단한 팀 정보만으로 summary 생성 (팀 상세 정보가 없을 때)
 */
export function generateTeamSummarySimple(data: {
  name: string
  bio?: string | null
  specialty?: string[] | null
  sub_specialty?: string[] | null
  prefered?: string[] | null
}): TeamSummaryData {
  const parts: string[] = []
  
  if (data.name) {
    parts.push(`팀명: ${data.name}`)
  }
  
  if (data.bio) {
    parts.push(`소개: ${data.bio}`)
  }
  
  if (data.specialty && data.specialty.length > 0) {
    parts.push(`전문 분야: ${data.specialty.join(', ')}`)
  }
  
  if (data.sub_specialty && data.sub_specialty.length > 0) {
    parts.push(`세부 전문 분야: ${data.sub_specialty.join(', ')}`)
  }
  
  if (data.prefered && data.prefered.length > 0) {
    parts.push(`선호 기술: ${data.prefered.join(', ')}`)
  }
  
  const summary = parts.join('\n')
  
  const meta: TeamSummaryData['meta'] = {
    specialty: data.specialty || undefined,
    sub_specialty: data.sub_specialty || undefined,
    prefered: data.prefered || undefined,
  }
  
  return {
    summary,
    meta,
  }
}

