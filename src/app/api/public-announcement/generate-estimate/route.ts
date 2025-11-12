import { NextRequest, NextResponse } from 'next/server';
import { createServerSideClient } from '@/supabase/supabase-server';

/**
 * POST /api/public-announcement/generate-estimate
 * 견적 자동 초안 생성
 * 백엔드 Python API로 프록시 (향후 구현 필요)
 */
export async function POST(request: NextRequest) {
  try {
    const { announcementId, teamId } = await request.json();

    if (!announcementId || !teamId) {
      return NextResponse.json(
        { error: 'announcementId와 teamId가 필요합니다.' },
        { status: 400 }
      );
    }

    // 백엔드 API URL
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
    
    // 백엔드에 견적 생성 엔드포인트가 있다면 사용
    // 없으면 Supabase에서 데이터를 가져와서 백엔드로 전달
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

    // 팀 정보 조회
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select(`
        *,
        accounts!teams_manager_profile_id_fkey (*)
      `)
      .eq('id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        { error: '팀을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 백엔드에 견적 생성 요청
    // 백엔드에 /api/v2/announcements/{id}/estimate 엔드포인트 추가 필요
    try {
      const estimateUrl = `${backendUrl}/api/v2/announcements/${announcementId}/estimate`
      
      const backendResponse = await fetch(estimateUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          team_id: teamId,
          announcement_data: {
            title: announcement.title,
            raw_text: announcement.raw_text,
            required_skills: announcement.required_skills,
            budget_min: announcement.budget_min,
            budget_max: announcement.budget_max,
            duration_months: announcement.duration_months,
          },
          team_data: {
            name: team.name,
            expertise: team.expertise,
            description: team.description,
          },
        }),
      })
      
      if (backendResponse.ok) {
        const backendData = await backendResponse.json()
        return NextResponse.json({
          success: true,
          ...backendData.data,
        })
      }
    } catch (backendError) {
      console.error('백엔드 견적 생성 실패:', backendError)
    }
    
    // 백엔드 엔드포인트가 없으면 에러 반환
    return NextResponse.json(
      { 
        error: '백엔드 견적 생성 엔드포인트가 필요합니다.',
        hint: '백엔드에 /api/v2/announcements/{id}/estimate 엔드포인트를 추가해주세요.'
      },
      { status: 501 }
    )
  } catch (error: any) {
    console.error('견적 초안 생성 오류:', error);
    return NextResponse.json(
      { error: error.message || '견적 초안 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
