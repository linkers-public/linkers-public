import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/public-announcement/analyze
 * 공고 AI 분석 (요구기술, 예산, 기간 추출)
 * 백엔드 Python API로 프록시
 */
export async function POST(request: NextRequest) {
  try {
    const { announcementId, rawText } = await request.json();

    if (!rawText) {
      return NextResponse.json(
        { error: '분석할 텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 백엔드 API URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
    
    // 백엔드의 공고 분석은 업로드 시 자동으로 수행되므로
    // announcementId로 분석 결과를 조회
    if (announcementId) {
      try {
        const analysisUrl = `${backendUrl}/api/v2/announcements/${announcementId}/analysis`
        
        const backendResponse = await fetch(analysisUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (backendResponse.ok) {
          const backendData = await backendResponse.json()
          
          // 백엔드 응답을 프론트엔드 형식으로 변환
          const analysis = backendData.data || backendData
          return NextResponse.json({
            success: true,
            requiredSkills: analysis.required_skills || analysis.requiredSkills || [],
            budgetMin: analysis.budget_min || analysis.budgetMin,
            budgetMax: analysis.budget_max || analysis.budgetMax,
            durationMonths: analysis.duration_months || analysis.durationMonths,
            organizationName: analysis.organization_name || analysis.organizationName || analysis.agency,
            deadline: analysis.deadline,
            location: analysis.location,
            summary: analysis.summary || analysis.title || '',
            // 임베딩은 백엔드에서 자동 생성됨
          })
        } else {
          // 분석 결과가 없으면 rawText로 직접 분석 요청
          // 백엔드에 /api/v2/announcements/analyze 엔드포인트가 필요할 수 있음
          return NextResponse.json(
            { 
              error: '분석 결과를 찾을 수 없습니다.',
              hint: '공고 업로드 후 분석이 완료될 때까지 기다려주세요.'
            },
            { status: 404 }
          )
        }
      } catch (backendError) {
        console.error('백엔드 분석 결과 조회 실패:', backendError)
        return NextResponse.json(
          { 
            error: '백엔드 API 호출 실패',
            message: backendError instanceof Error ? backendError.message : String(backendError),
            hint: `백엔드 서버(${backendUrl})가 실행 중인지 확인해주세요.`
          },
          { status: 500 }
        )
      }
    }
    
    // announcementId가 없으면 에러
    return NextResponse.json(
      { error: 'announcementId가 필요합니다.' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('공고 분석 오류:', error);
    return NextResponse.json(
      { error: error.message || '공고 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
