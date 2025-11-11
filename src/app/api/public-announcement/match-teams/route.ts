import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/supabase/supabase-server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/public-announcement/match-teams
 * AI 매칭 추천 (의미기반 검색)
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { announcementId, topN = 10 } = await request.json();

    const supabase = await createServerSideClient();

    // 공고 정보 조회
    const { data: announcement, error: annError } = await supabase
      .from('public_announcements')
      .select('*')
      .eq('id', announcementId)
      .single();

    if (annError || !announcement) {
      return NextResponse.json(
        { error: '공고를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 공고 텍스트를 벡터로 변환
    const queryText = `${announcement.title}\n${announcement.raw_text || ''}`;
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: queryText,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // 1. 팀 프로필과 이력에서 의미기반 검색
    // 팀 프로필 임베딩이 있다면 사용, 없으면 팀 정보로 검색
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        description,
        expertise,
        accounts!teams_manager_profile_id_fkey (
          profile_id,
          username,
          bio,
          main_job,
          expertise
        )
      `)
      .limit(100); // 모든 팀 조회 (실제로는 필터링 필요)

    if (teamsError) {
      return NextResponse.json(
        { error: '팀 조회 실패' },
        { status: 500 }
      );
    }

    // 2. 각 팀과의 유사도 계산
    const teamScores = await Promise.all(
      (teams || []).map(async (team) => {
        // 팀 정보를 텍스트로 변환
        const teamText = `
          팀명: ${team.name}
          설명: ${team.description || ''}
          전문분야: ${(team.expertise || []).join(', ')}
          매니저: ${team.accounts?.username || ''}
          매니저 소개: ${team.accounts?.bio || ''}
          주요 직무: ${(team.accounts?.main_job || []).join(', ')}
          전문 기술: ${(team.accounts?.expertise || []).join(', ')}
        `;

        // 팀 임베딩 생성
        const teamEmbedding = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: teamText,
        });

        // 코사인 유사도 계산
        const similarity = cosineSimilarity(
          queryEmbedding,
          teamEmbedding.data[0].embedding
        );

        // 추가 점수 계산 (기술 스택 매칭, 경력 등)
        const skillMatch = calculateSkillMatch(
          announcement.required_skills || [],
          team.accounts?.expertise || []
        );

        const finalScore = similarity * 0.7 + skillMatch * 0.3;

        return {
          teamId: team.id,
          teamName: team.name,
          matchScore: finalScore,
          matchReasons: {
            skillMatch,
            experienceMatch: 0.8, // 실제로는 경력 데이터 기반 계산
            locationMatch: true, // 실제로는 지역 비교
            rating: 4.5, // 실제로는 평점 데이터
          },
        };
      })
    );

    // 상위 N개 정렬
    const topMatches = teamScores
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, topN);

    return NextResponse.json({
      success: true,
      matches: topMatches,
    });
  } catch (error: any) {
    console.error('팀 매칭 오류:', error);
    return NextResponse.json(
      { error: error.message || '팀 매칭 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 코사인 유사도 계산
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// 기술 스택 매칭 점수 계산
function calculateSkillMatch(required: string[], teamSkills: string[]): number {
  if (required.length === 0) return 0.5; // 요구사항이 없으면 중간 점수

  const requiredLower = required.map(s => s.toLowerCase());
  const teamSkillsLower = teamSkills.map(s => s.toLowerCase());

  const matched = requiredLower.filter(req =>
    teamSkillsLower.some(team => team.includes(req) || req.includes(team))
  ).length;

  return matched / required.length;
}

