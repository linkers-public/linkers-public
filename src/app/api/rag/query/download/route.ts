import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/rag/query/download
 * 분석 결과를 마크다운 파일로 다운로드
 */
export async function POST(request: NextRequest) {
  try {
    const { markdown, title = '분석_결과' } = await request.json()

    if (!markdown) {
      return NextResponse.json(
        { error: '다운로드할 마크다운 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    // 파일명 생성 (특수문자 제거)
    const sanitizedTitle = title
      .replace(/[^a-zA-Z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50)
    
    const filename = `${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.md`

    // 마크다운 파일로 반환
    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    })
  } catch (error: any) {
    console.error('다운로드 오류:', error)
    return NextResponse.json(
      { error: error.message || '다운로드 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

