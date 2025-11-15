/**
 * RAG 질의 API
 * 백엔드 Python API로 프록시
 */

import { NextRequest, NextResponse } from 'next/server'
import type { QueryRequest, QueryResponse } from '@/types/rag'

export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json()
    const { mode, query, topK = 8, withTeams = false, docIds } = body

    if (!query) {
      return NextResponse.json({ error: '질의가 필요합니다' }, { status: 400 })
    }

    // 백엔드 API URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
    
    // 법률 상담 챗 모드인 경우 별도 처리
    if (mode === 'legal_contract_chat') {
      try {
        const chatResponse = await fetch(`${backendUrl}/api/v1/legal/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            doc_ids: docIds || [],
            selected_issue_id: body.selectedIssueId,
            selected_issue: body.selectedIssue,
            analysis_summary: body.analysisSummary,
            risk_score: body.riskScore,
            total_issues: body.totalIssues,
            top_k: topK || 8,
          }),
        })

        if (!chatResponse.ok) {
          const errorText = await chatResponse.text()
          throw new Error(`백엔드 API 오류: ${chatResponse.status} - ${errorText}`)
        }

        const chatData = await chatResponse.json()
        
        return NextResponse.json({
          answer: chatData.answer || '답변을 생성할 수 없습니다.',
          markdown: chatData.markdown || chatData.answer,
          usedChunks: chatData.used_chunks || [],
          query: chatData.query || query,
          format: 'markdown',
        } as QueryResponse & { markdown?: string; format?: string })
      } catch (chatError) {
        console.error('법률 상담 챗 API 호출 실패:', chatError)
        return NextResponse.json(
          { 
            error: '법률 상담 챗 API 호출 실패',
            message: chatError instanceof Error ? chatError.message : String(chatError),
            hint: `백엔드 서버(${backendUrl})가 실행 중인지 확인해주세요.`
          },
          { status: 500 }
        )
      }
    }
    
    // 기존 공고문 검색 모드
    try {
      // 백엔드 API는 GET이므로 쿼리 파라미터 사용
      const searchUrl = new URL(`${backendUrl}/api/v2/announcements/search`)
      searchUrl.searchParams.set('query', query)
      searchUrl.searchParams.set('limit', String(topK))
      
      // docIds가 있으면 announcement_id로 필터링 (첫 번째 ID만 사용)
      if (docIds && docIds.length > 0) {
        // UUID 또는 숫자 ID 모두 지원
        const docId = docIds[0]
        searchUrl.searchParams.set('announcement_id', String(docId))
      }
      
      const backendResponse = await fetch(searchUrl.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!backendResponse.ok) {
        const errorText = await backendResponse.text()
        throw new Error(`백엔드 API 오류: ${backendResponse.status} - ${errorText}`)
      }
      
      const backendData = await backendResponse.json()
      
      // 백엔드 응답을 프론트엔드 형식으로 변환
      const answer = backendData.answer || backendData.markdown || '관련 정보를 찾을 수 없습니다.'
      
      return NextResponse.json({
        answer: answer,
        markdown: backendData.markdown || answer,  // 마크다운 형식
        usedChunks: (backendData.results || []).map((r: any, idx: number) => ({
          id: idx,
          doc_id: r.announcement_id || '',
          score: r.score || 0,
          content: r.content?.substring(0, 200),  // 미리보기용
        })),
        query: backendData.query || query,
        format: backendData.format || 'markdown',
      } as QueryResponse & { markdown?: string; format?: string })
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
  } catch (error) {
    console.error('질의 오류:', error)
    return NextResponse.json(
      {
        error: '질의 실패',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
