import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/public-announcement/analyze
 * 공고 AI 분석 (요구기술, 예산, 기간 추출)
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { announcementId, rawText } = await request.json();

    if (!rawText) {
      return NextResponse.json(
        { error: '분석할 텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    // GPT-4o-mini를 사용하여 공고 분석
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 공공 프로젝트 발주 공고를 분석하는 전문가입니다. 
다음 정보를 JSON 형식으로 추출해주세요:
- requiredSkills: 요구 기술 스택 배열 (예: ["React", "Node.js", "PostgreSQL"])
- budgetMin: 최소 예산 (숫자, 없으면 null)
- budgetMax: 최대 예산 (숫자, 없으면 null)
- durationMonths: 프로젝트 기간 (개월 수, 없으면 null)
- organizationName: 발주기관명
- deadline: 마감일 (YYYY-MM-DD 형식, 없으면 null)
- location: 지역 (없으면 null)
- summary: 공고 요약 (200자 이내)`,
        },
        {
          role: 'user',
          content: `다음 공고를 분석해주세요:\n\n${rawText.substring(0, 8000)}`, // 토큰 제한 고려
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');

    // 벡터 임베딩 생성 (RAG용)
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: rawText,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // 임베딩을 청크로 나누어 저장 (향후 RAG 검색용)
    // 여기서는 전체 텍스트를 하나의 청크로 저장
    // 실제로는 텍스트를 의미 단위로 청크화하는 것이 좋음

    return NextResponse.json({
      success: true,
      ...analysis,
      embedding, // 클라이언트에서 저장하도록
    });
  } catch (error: any) {
    console.error('공고 분석 오류:', error);
    return NextResponse.json(
      { error: error.message || '공고 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

