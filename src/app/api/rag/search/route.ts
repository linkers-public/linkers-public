import { NextRequest, NextResponse } from 'next/server';
import { searchEstimatesByRAG } from '@/apis/estimate-rag.service';

/**
 * POST /api/rag/search
 * RAG를 사용하여 견적서 검색하는 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, options } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: '검색 쿼리가 필요합니다.' },
        { status: 400 }
      );
    }

    // RAG 검색 실행
    const results = await searchEstimatesByRAG(query, options || {});

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error: any) {
    console.error('RAG 검색 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '검색 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

