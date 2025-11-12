import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/rag/embed
 * 텍스트를 벡터 임베딩으로 변환하는 API
 * 백엔드 Python API로 프록시
 */
export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 백엔드 API URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
    
    // 백엔드의 임베딩 생성은 내부적으로 처리되므로
    // 검색 API를 통해 간접적으로 사용하거나
    // 백엔드에 직접 임베딩 엔드포인트가 있다면 사용
    
    // 임시: 백엔드의 generator를 통해 임베딩 생성
    // 실제로는 백엔드에 /api/v2/embed 엔드포인트가 필요할 수 있음
    // 일단 검색 API를 통해 간접적으로 처리
    try {
      // 백엔드 검색 API를 호출하여 임베딩이 생성되는지 확인
      // 실제로는 백엔드에 직접 임베딩 엔드포인트가 필요
      const searchUrl = new URL(`${backendUrl}/api/v2/announcements/search`)
      searchUrl.searchParams.set('query', text)
      searchUrl.searchParams.set('limit', '1')
      
      // 검색을 통해 임베딩이 생성되는지 확인
      // 실제로는 백엔드에 /api/v2/embed 엔드포인트 추가 필요
      return NextResponse.json({
        error: '백엔드 임베딩 엔드포인트가 필요합니다. 백엔드에 /api/v2/embed 엔드포인트를 추가해주세요.',
        hint: '임시로 검색 API를 사용하거나 백엔드에 직접 임베딩 엔드포인트를 구현해주세요.'
      }, { status: 501 })
    } catch (backendError) {
      console.error('백엔드 API 호출 실패:', backendError)
      return NextResponse.json(
        { 
          error: '백엔드 API 호출 실패',
          message: backendError instanceof Error ? backendError.message : String(backendError),
          hint: `백엔드 서버(${backendUrl})가 실행 중인지 확인해주세요.`
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('임베딩 생성 오류:', error);
    return NextResponse.json(
      { error: error.message || '임베딩 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
