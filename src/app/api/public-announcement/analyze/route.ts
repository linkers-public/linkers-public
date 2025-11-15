import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/public-announcement/analyze
 * 공고 AI 분석 (요구기술, 예산, 기간 추출)
 * 백엔드 Python API로 프록시
 */
export async function POST(request: NextRequest) {
  try {
    const { announcementId, rawText } = await request.json();

    if (!announcementId) {
      return NextResponse.json(
        { error: 'announcementId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 백엔드 API URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
    
    try {
      // 방법 1: 백엔드에서 분석 결과 조회 시도
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
          requiredSkills: analysis.required_skills || analysis.essential_skills || analysis.requiredSkills || [],
          budgetMin: analysis.budget_min || analysis.budgetMin,
          budgetMax: analysis.budget_max || analysis.budgetMax,
          durationMonths: analysis.duration_months || analysis.durationMonths,
          organizationName: analysis.organization_name || analysis.organizationName || analysis.agency,
          deadline: analysis.deadline,
          location: analysis.location,
          summary: analysis.summary || analysis.project_name || analysis.title || '',
        })
      }
      
      // 방법 2: rawText가 있고 실제 텍스트인 경우 직접 분석 요청
      if (rawText && rawText.length > 50 && !rawText.includes('서버에서 자동으로 처리')) {
        const analyzeUrl = `${backendUrl}/api/v2/announcements/analyze`
        
        const analyzeResponse = await fetch(analyzeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: rawText,
            announcement_id: announcementId,
          }),
        })
        
        if (analyzeResponse.ok) {
          const analyzeData = await analyzeResponse.json()
          const analysis = analyzeData.data || analyzeData
          
          return NextResponse.json({
            success: true,
            requiredSkills: analysis.required_skills || analysis.essential_skills || analysis.requiredSkills || [],
            budgetMin: analysis.budget_min || analysis.budgetMin,
            budgetMax: analysis.budget_max || analysis.budgetMax,
            durationMonths: analysis.duration_months || analysis.durationMonths,
            organizationName: analysis.organization_name || analysis.organizationName || analysis.agency,
            deadline: analysis.deadline,
            location: analysis.location,
            summary: analysis.summary || analysis.project_name || analysis.title || '',
          })
        }
      }
      
      // 방법 3: 분석 결과가 아직 준비되지 않은 경우
      return NextResponse.json(
        { 
          error: '분석 결과를 찾을 수 없습니다.',
          hint: '공고 업로드 후 분석이 완료될 때까지 기다려주세요. 잠시 후 다시 시도해주세요.',
          retry: true
        },
        { status: 404 }
      )
    } catch (backendError) {
      console.error('백엔드 분석 API 호출 실패:', backendError)
      
      // 백엔드가 없는 경우 기본 응답 (개발 환경)
      if (rawText && rawText.length > 50 && !rawText.includes('서버에서 자동으로 처리')) {
        // 간단한 키워드 기반 추출 (폴백)
        const skills = extractSkillsFromText(rawText)
        const budget = extractBudgetFromText(rawText)
        const duration = extractDurationFromText(rawText)
        
        return NextResponse.json({
          success: true,
          requiredSkills: skills,
          budgetMin: budget.min,
          budgetMax: budget.max,
          durationMonths: duration,
          summary: rawText.substring(0, 200) + '...',
        })
      }
      
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
    console.error('공고 분석 오류:', error);
    return NextResponse.json(
      { error: error.message || '공고 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 간단한 키워드 기반 추출 (폴백용)
function extractSkillsFromText(text: string): string[] {
  const skills: string[] = []
  const skillKeywords = [
    'Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular',
    'Node.js', 'Spring', 'Django', 'Flask', 'FastAPI',
    'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
    'AI', '머신러닝', '딥러닝', '데이터 분석', '빅데이터'
  ]
  
  for (const skill of skillKeywords) {
    if (text.includes(skill)) {
      skills.push(skill)
    }
  }
  
  return skills.slice(0, 5) // 최대 5개
}

function extractBudgetFromText(text: string): { min?: number; max?: number } {
  const budgetRegex = /(\d+)\s*억/g
  const matches = text.match(budgetRegex)
  
  if (matches && matches.length > 0) {
    const amounts = matches.map(m => {
      const num = parseInt(m.replace('억', ''))
      return num * 100000000
    })
    
    return {
      min: Math.min(...amounts),
      max: Math.max(...amounts),
    }
  }
  
  return {}
}

function extractDurationFromText(text: string): number | undefined {
  const durationRegex = /(\d+)\s*개월/g
  const match = text.match(durationRegex)
  
  if (match) {
    return parseInt(match[0].replace('개월', ''))
  }
  
  return undefined
}
