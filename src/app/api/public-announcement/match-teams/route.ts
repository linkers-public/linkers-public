import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/supabase/supabase-server';

/**
 * POST /api/public-announcement/match-teams
 * AI 매칭 추천 (의미기반 검색)
 * 백엔드 Python API로 프록시 (향후 구현 필요)
 */
export async function POST(request: NextRequest) {
  try {
    const { announcementId, topN = 10 } = await request.json();

    if (!announcementId) {
      return NextResponse.json(
        { error: 'announcementId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 백엔드 API URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
    
    const supabase = await createServerSideClient();

    // 공고 정보 조회
    const { data: announcement, error: annError } = await supabase
      .from('public_announcements')
      .select('*')
      .eq('id', announcementId)
      .single();

    if (annError || !announcement) {
      return NextResponse.json(
        { error: '공고를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 백엔드에 팀 매칭 요청
    // 백엔드에 /api/v2/announcements/{id}/match-teams 엔드포인트 추가 필요
    try {
      const matchUrl = `${backendUrl}/api/v2/announcements/${announcementId}/match-teams`
      
      const backendResponse = await fetch(matchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          top_n: topN,
          announcement_data: {
            title: announcement.title,
            raw_text: announcement.raw_text,
            required_skills: announcement.required_skills,
          },
        }),
      })
      
      if (backendResponse.ok) {
        const backendData = await backendResponse.json()
        return NextResponse.json({
          success: true,
          matches: backendData.matches || [],
        })
      }
    } catch (backendError) {
      console.error('백엔드 팀 매칭 실패:', backendError)
    }
    
    // 백엔드 엔드포인트가 없으면 에러 반환
    return NextResponse.json(
      { 
        error: '백엔드 팀 매칭 엔드포인트가 필요합니다.',
        hint: '백엔드에 /api/v2/announcements/{id}/match-teams 엔드포인트를 추가해주세요.'
      },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('팀 매칭 오류:', error);
    return NextResponse.json(
      { error: error.message || '팀 매칭 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
