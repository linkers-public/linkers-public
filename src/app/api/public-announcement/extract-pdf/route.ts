import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/public-announcement/extract-pdf
 * PDF에서 텍스트 추출
 */
export async function POST(request: NextRequest) {
  try {
    const { pdfUrl } = await request.json();

    if (!pdfUrl) {
      return NextResponse.json(
        { error: 'PDF URL이 필요합니다.' },
        { status: 400 }
      );
    }

    // PDF 텍스트 추출 (pdf-parse 또는 pdfjs-dist 사용)
    // 간단한 구현: URL에서 PDF 다운로드 후 텍스트 추출
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error('PDF 다운로드 실패');
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // pdf-parse 라이브러리 사용 (npm install pdf-parse 필요)
    try {
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      
      return NextResponse.json({
        success: true,
        text: data.text,
        pages: data.numpages,
      });
    } catch (parseError) {
      // pdf-parse가 없는 경우 기본 처리
      return NextResponse.json({
        success: false,
        error: 'PDF 파싱 라이브러리가 필요합니다. npm install pdf-parse를 실행하세요.',
        fallback: 'PDF 텍스트 추출 기능을 사용하려면 pdf-parse 패키지가 필요합니다.',
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('PDF 추출 오류:', error);
    return NextResponse.json(
      { error: error.message || 'PDF 텍스트 추출 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

