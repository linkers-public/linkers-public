/**
 * RAG 인덱싱 API
 * 백엔드의 무료 스택 (Ollama + sentence-transformers)을 사용하도록 프록시
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    
    // 백엔드 API URL 가져오기
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
    const backendEndpoint = `${backendUrl}/api/v2/announcements/upload`

    console.log(`[RAG Ingest] 백엔드로 요청 전달: ${backendEndpoint}`)

    // 백엔드로 요청 전달
    let response: Response
    try {
      response = await fetch(backendEndpoint, {
      method: 'POST',
      body: formData,
        // 타임아웃 설정 (60초)
        signal: AbortSignal.timeout(60000),
      })
    } catch (fetchError: any) {
      console.error('[RAG Ingest] 백엔드 연결 실패:', fetchError)
      
      // 네트워크 오류인 경우
      if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
        return NextResponse.json(
          {
            error: '백엔드 서버 응답 시간 초과',
            message: '백엔드 서버가 응답하지 않습니다. 서버가 실행 중인지 확인해주세요.',
            backendUrl,
          },
          { status: 504 }
        )
      }
      
      if (fetchError.code === 'ECONNREFUSED' || fetchError.message?.includes('fetch failed')) {
        return NextResponse.json(
          {
            error: '백엔드 서버에 연결할 수 없습니다',
            message: `백엔드 서버(${backendUrl})가 실행 중인지 확인해주세요.`,
            backendUrl,
          },
          { status: 503 }
        )
      }
      
      throw fetchError
    }

    if (!response.ok) {
      let errorData: any
      try {
        errorData = await response.json()
      } catch {
        errorData = { 
          error: `백엔드 오류 (${response.status})`,
          detail: await response.text().catch(() => '응답을 읽을 수 없습니다')
        }
      }
      
      console.error('[RAG Ingest] 백엔드 오류:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })
      
      return NextResponse.json(
        { 
          error: errorData.error || errorData.detail || '업로드 실패',
          message: errorData.message || errorData.detail || `백엔드 오류: ${response.status} ${response.statusText}`,
          backendStatus: response.status,
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('[RAG Ingest] 백엔드 응답 성공:', data)
    
    // 백엔드 응답 형식: { status, message, data: { announcement_id, source, title } }
    // 프론트엔드 형식: { docId, chunks }
    const announcementId = data?.data?.announcement_id || data?.announcement_id || data?.id || 0
    
    return NextResponse.json({
      docId: announcementId,
      chunks: data?.data?.chunks || data?.chunks || data?.chunk_count || 0,
    })
  } catch (error) {
    console.error('[RAG Ingest] 예상치 못한 오류:', error)
    return NextResponse.json(
      {
        error: '인덱싱 실패',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

