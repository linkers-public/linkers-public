import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/supabase/supabase-server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/public-announcement/generate-estimate
 * 견적 자동 초안 생성
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { announcementId, teamId } = await request.json();

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

    // 팀 정보 조회
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select(`
        *,
        accounts!teams_manager_profile_id_fkey (*)
      `)
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: '팀을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 과거 유사 프로젝트 조회 (RAG용)
    const { data: similarProjects } = await supabase
      .from('counsel')
      .select('*, estimate_version(*)')
      .eq('feild', announcement.ai_analysis?.field || '')
      .limit(5);

    // GPT-4o-mini로 견적 초안 생성
    const prompt = `
다음 공공 프로젝트 공고를 기반으로 견적서 초안을 작성해주세요.

## 공고 정보
제목: ${announcement.title}
요구 기술: ${(announcement.required_skills || []).join(', ')}
예산 범위: ${announcement.budget_min ? `${announcement.budget_min.toLocaleString()}원` : ''} ~ ${announcement.budget_max ? `${announcement.budget_max.toLocaleString()}원` : ''}
기간: ${announcement.duration_months ? `${announcement.duration_months}개월` : ''}
내용: ${announcement.raw_text?.substring(0, 2000) || ''}

## 팀 정보
팀명: ${team.name}
전문분야: ${(team.expertise || []).join(', ')}

## 과거 유사 프로젝트 (참고용)
${similarProjects?.map((p, i) => `
프로젝트 ${i + 1}:
- 제목: ${p.title}
- 금액: ${p.cost || 'N/A'}
- 기간: ${p.period || 'N/A'}
`).join('\n') || '없음'}

다음 JSON 형식으로 견적서 초안을 작성해주세요:
{
  "totalAmount": 총 금액 (숫자),
  "startDate": 시작일 (YYYY-MM-DD),
  "endDate": 종료일 (YYYY-MM-DD),
  "detail": 상세 작업 범위 설명 (500자 이상),
  "milestones": [
    {
      "title": "마일스톤 제목",
      "detail": "상세 설명",
      "paymentAmount": 금액 (숫자),
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD"
    }
  ]
}

각 마일스톤에는 [id:##] 형식으로 참조 근거를 표기해주세요.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '당신은 공공 프로젝트 견적서 작성 전문가입니다. 정확하고 상세한 견적서를 작성해주세요.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const draft = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({
      success: true,
      ...draft,
    });
  } catch (error: any) {
    console.error('견적 초안 생성 오류:', error);
    return NextResponse.json(
      { error: error.message || '견적 초안 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

