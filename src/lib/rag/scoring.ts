/**
 * 팀 매칭 스코어 계산 모듈
 * 의미유사도 + 태그일치 + 평점 + 지역 가중치
 */

export interface TeamProfile {
  team_id: number
  summary: string
  meta: {
    stacks?: string[]
    regions?: string[]
    success_rate?: number
    rating?: number
    [key: string]: any
  }
  semanticScore: number // 벡터 유사도 점수 (0~1)
}

export interface ProjectRequirements {
  techStack?: string[]
  region?: string
  budget?: {
    min?: number
    max?: number
  }
  period?: {
    months?: number
  }
}

export interface ScoringWeights {
  semantic?: number // 의미 유사도 가중치 (기본 0.4)
  techStack?: number // 기술 스택 일치 가중치 (기본 0.3)
  rating?: number // 평점 가중치 (기본 0.2)
  region?: number // 지역 가중치 (기본 0.1)
}

/**
 * 팀 매칭 최종 스코어 계산
 */
export function calculateTeamScore(
  team: TeamProfile,
  requirements: ProjectRequirements,
  weights: ScoringWeights = {}
): number {
  const {
    semantic = 0.4,
    techStack = 0.3,
    rating = 0.2,
    region = 0.1,
  } = weights

  // 의미 유사도 점수
  const semanticScore = team.semanticScore

  // 기술 스택 일치 점수
  const techStackScore = calculateTechStackMatch(
    team.meta.stacks || [],
    requirements.techStack || []
  )

  // 평점 점수 (0~5를 0~1로 정규화)
  const ratingScore = team.meta.rating
    ? Math.min(team.meta.rating / 5, 1)
    : 0.5 // 평점이 없으면 중간값

  // 지역 일치 점수
  const regionScore = calculateRegionMatch(
    team.meta.regions || [],
    requirements.region
  )

  // 가중 평균 계산
  const finalScore =
    semantic * semanticScore +
    techStack * techStackScore +
    rating * ratingScore +
    region * regionScore

  return Math.min(Math.max(finalScore, 0), 1) // 0~1 범위로 제한
}

/**
 * 기술 스택 일치 점수 계산
 */
function calculateTechStackMatch(
  teamStacks: string[],
  requiredStacks: string[]
): number {
  if (requiredStacks.length === 0) return 0.5 // 요구사항이 없으면 중간값

  const normalizedTeamStacks = teamStacks.map((s) => s.toLowerCase())
  const normalizedRequiredStacks = requiredStacks.map((s) => s.toLowerCase())

  // 일치하는 기술 스택 수
  const matches = normalizedRequiredStacks.filter((req) =>
    normalizedTeamStacks.some((team) => team.includes(req) || req.includes(team))
  ).length

  // 일치율 반환
  return matches / requiredStacks.length
}

/**
 * 지역 일치 점수 계산
 */
function calculateRegionMatch(
  teamRegions: string[],
  requiredRegion?: string
): number {
  if (!requiredRegion) return 0.5 // 요구사항이 없으면 중간값

  const normalizedRequired = requiredRegion.toLowerCase()
  const normalizedTeamRegions = teamRegions.map((r) => r.toLowerCase())

  // 정확히 일치
  if (normalizedTeamRegions.includes(normalizedRequired)) {
    return 1.0
  }

  // 부분 일치 (예: "서울"과 "서울시")
  if (
    normalizedTeamRegions.some(
      (r) => r.includes(normalizedRequired) || normalizedRequired.includes(r)
    )
  ) {
    return 0.7
  }

  return 0.0
}

/**
 * 여러 팀의 스코어 계산 및 정렬
 */
export function scoreAndRankTeams(
  teams: TeamProfile[],
  requirements: ProjectRequirements,
  weights?: ScoringWeights
): Array<TeamProfile & { finalScore: number }> {
  return teams
    .map((team) => ({
      ...team,
      finalScore: calculateTeamScore(team, requirements, weights),
    }))
    .sort((a, b) => b.finalScore - a.finalScore)
}

