import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/rag/embed
 * 텍스트를 벡터 임베딩으로 변환하는 API
 */
export async function POST(request: NextRequest) {
  try {
    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    // OpenAI Embeddings API 호출
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // 또는 'text-embedding-ada-002'
      input: text,
    });

    const embedding = response.data[0].embedding;

    return NextResponse.json({ embedding });
  } catch (error: any) {
    console.error('임베딩 생성 오류:', error);
    return NextResponse.json(
      { error: error.message || '임베딩 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

