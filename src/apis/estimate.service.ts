import { createSupabaseBrowserClient } from '@/supabase/supabase-client';

export const insertEstimate = async (estimateData: any) => {
    const supabase = createSupabaseBrowserClient();

    console.log('Insert Estimate data:', estimateData);

    // 세션 확인
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
        throw new Error('인증되지 않은 사용자입니다.');
    }
    console.log('manager_id: ' + sessionData.session.user.id);

    const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('manager_id', sessionData.session.user.id)
        .single();

    if (teamError) {
        console.error('팀 데이터 조회 실패:', teamError);
        throw new Error('팀 데이터 조회 실패');
    }
    console.log('teamId: ' + team.id);

    // Estimate 테이블에 데이터 삽입
    const { data: insertedEstimate, error: estimateError } = await supabase
        .from('estimate')
        .insert({
            client_id: estimateData.clientId,
            counsel_id: estimateData.counselId,
            estimate_date: new Date().toISOString(),
            estimate_due_date: estimateData.projectEndDate,
            estimate_start_date: estimateData.projectStartDate,
            estimate_status: 'pending',
            manager_id: sessionData.session.user.id,
            team_id: team.id,
        })
        .select('*')
        .single();

    if (estimateError) {
        console.error('Estimate 삽입 실패:', estimateError);
        throw new Error('견적 삽입 실패');
    }

    // Estimate Version 테이블에 데이터 삽입
    const { data: insertedEstimateVersion, error: versionError } = await supabase
        .from('estimate_version')
        .insert({
            estimate_id: insertedEstimate.estimate_id,
            version_date: new Date().toISOString(),
            start_date: estimateData.projectStartDate,
            end_date: estimateData.projectEndDate,
            detail: estimateData.detailEstimate,
            total_amount: estimateData.budget,
        })
        .select('*')
        .single();

    if (versionError) {
        console.error('Estimate Version 삽입 실패:', versionError);
        throw new Error('견적 버전 삽입 실패');
    }

    // 날짜 포맷 함수
    const formatDateToDB = (date: Date): string => {
        return date.toISOString().split('T')[0];  // 날짜만 'YYYY-MM-DD' 포맷으로 반환
    };

    // 마일스톤 삽입
    let lastDueDate = new Date(estimateData.projectStartDate);  // 첫 번째 마일스톤의 시작일을 projectStartDate로 설정

    const insertMilestone = async (row: any, isFirstRow: boolean) => {
        const start_date = isFirstRow ? new Date(lastDueDate) : new Date(lastDueDate.setDate(lastDueDate.getDate() + 1));  // 첫 번째는 projectStartDate, 그 이후는 이전 due_date에서 1일 더함
        const due_date = new Date(start_date.getTime() + row.days * 24 * 60 * 60 * 1000);  // start_date + row.days 만큼 밀리초로 계산

        if (isNaN(start_date.getTime()) || isNaN(due_date.getTime())) {
            throw new Error('유효하지 않은 날짜 값입니다.');
        }

        lastDueDate = due_date;  // 마지막 due_date 업데이트

        const { error: milestoneError } = await supabase
            .from('milestone')
            .insert({
                estimate_id: insertedEstimate.estimate_id,
                estimate_version_id: insertedEstimateVersion.estimate_version_id,
                milestone_due_date: formatDateToDB(due_date),
                milestone_start_date: formatDateToDB(start_date),
                payment_amount: row.paymentAmount,
                title: row.title,
                detail: row.detail,
                progress: row.progress,
                output: row.output
            });

        if (milestoneError) {
            console.error('마일스톤 삽입 실패:', milestoneError);
            throw new Error('마일스톤 삽입 실패');
        }
    };

    // 마일스톤 데이터 삽입
    const milestoneInserts = estimateData.milestones.map((row: any, index: number) => {
        return insertMilestone(row, index === 0);  // 첫 번째 row는 true, 이후는 false
    });

    try {
        // 모든 마일스톤 삽입을 처리하고, 하나라도 실패하면 롤백됨
        await Promise.all(milestoneInserts);
    } catch (error) {
        // 만약 하나라도 실패하면, 이미 삽입된 모든 데이터 롤백
        console.error('전체 작업 롤백:', error);
        await supabase.from('estimate').delete().eq('estimate_id', insertedEstimate.estimate_id);
        await supabase.from('estimate_version').delete().eq('estimate_version_id', insertedEstimateVersion.estimate_version_id);
        await supabase.from('milestone').delete().eq('estimate_id', insertedEstimate.estimate_id);
        throw new Error('마일스톤 삽입 중 오류 발생, 롤백됨');
    }

    // 최종적으로 삽입된 데이터 반환
    return {
        estimate: insertedEstimate,
        estimateVersion: insertedEstimateVersion,
    };
};



export const getEstimatesWithVersions = async (counselId: number) => {
    const supabase = createSupabaseBrowserClient();
  
    console.log('counselId: ' + counselId);
    // Estimate와 해당하는 Estimate Version 조회 (필터 적용)
    const { data: estimatesWithVersions, error: estimatesError } = await supabase
      .from('estimate')
      .select('*, estimate_version(*)')  // estimate_version을 포함한 조회
      .eq('counsel_id', counselId);
  
    if (estimatesError) {
      console.error('Estimate 목록과 해당 Estimate Version 조회 실패:', estimatesError);
      throw new Error('Estimate 목록과 해당 Estimate Version 조회 실패');
    }
  
    // 최종적으로 반환할 데이터
    console.log('estimateWithVersion:', estimatesWithVersions)
    return estimatesWithVersions;
  };
  
// 견적서 상세 조회
export const getEstimateDetails = async (counselId: String) => {
  const supabase = createSupabaseBrowserClient();

  // 세션 확인
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new Error('인증되지 않은 사용자입니다.');
  }

  console.log('manager_id: ' + sessionData.session.user.id);

  // 해당 counsel_id로 estimate 조회
  const { data: estimateData, error: estimateError } = await supabase
    .from('estimate')
    .select('*')
    .eq('counsel_id', counselId)
    .single();

  if (estimateError || !estimateData) {
    console.error('Estimate 조회 실패:', estimateError);
    throw new Error('견적 조회 실패');
  }

  // 해당 estimate_id로 estimate_version 조회
  const { data: estimateVersionData, error: versionError } = await supabase
    .from('estimate_version')
    .select('*')
    .eq('estimate_id', estimateData.estimate_id)
    .single();

  if (versionError || !estimateVersionData) {
    console.error('Estimate Version 조회 실패:', versionError);
    throw new Error('견적 버전 조회 실패');
  }

  // 해당 estimate_id로 milestones 조회
  const { data: milestonesData, error: milestonesError } = await supabase
    .from('milestone')
    .select('*')
    .eq('estimate_id', estimateData.estimate_id);

  if (milestonesError) {
    console.error('Milestones 조회 실패:', milestonesError);
    throw new Error('마일스톤 조회 실패');
  }


  // 최종적으로 반환할 데이터
  return {
    estimate: estimateData,
    estimateVersion: estimateVersionData,
    milestones: milestonesData,
  };
};

export const getEstimateAndVersionDetails = async (counselId: number, estimateVersionId: number) => {
  const supabase = createSupabaseBrowserClient();

  console.log("Fetching data for counselId:", counselId, "estimateVersionId:", estimateVersionId);

  try {
    // ✅ 1. counsel 테이블에서 상담 정보 가져오기
    const { data: counselData, error: counselError } = await supabase
      .from("counsel")
      .select("*")
      .eq("counsel_id", counselId)
      .single();

    if (counselError || !counselData) {
      console.error("Counsel 조회 실패:", counselError);
      throw new Error("상담 데이터 조회 실패");
    }

    // ✅ 2. estimate 테이블에서 견적서 데이터 가져오기 (counselId 기준)
    const { data: estimateData, error: estimateError } = await supabase
      .from("estimate")
      .select("*")
      .eq("counsel_id", counselId)
      .single();

    if (estimateError || !estimateData) {
      console.error("Estimate 조회 실패:", estimateError);
      throw new Error("견적 데이터 조회 실패");
    }

    // ✅ 3. estimate_version 테이블에서 특정 견적서 버전 데이터 가져오기 (estimateVersionId 기준)
    const { data: estimateVersionData, error: versionError } = await supabase
      .from("estimate_version")
      .select("*")
      .eq("estimate_version_id", estimateVersionId)
      .single();

    if (versionError || !estimateVersionData) {
      console.error("Estimate Version 조회 실패:", versionError);
      throw new Error("견적 버전 데이터 조회 실패");
    }

    // ✅ 4. 해당 estimate_id에 대한 milestones 가져오기
    const { data: milestonesData, error: milestonesError } = await supabase
      .from("milestone")
      .select("*")
      .eq("estimate_id", estimateData.estimate_id);

    if (milestonesError) {
      console.error("Milestones 조회 실패:", milestonesError);
      throw new Error("마일스톤 데이터 조회 실패");
    }

    // ✅ 최종적으로 모든 데이터 반환
    return {
      counsel: counselData,                 // 상담 데이터
      estimate: estimateData,               // 견적 데이터
      estimateVersion: estimateVersionData, // 견적 버전 데이터
      milestones: milestonesData,           // 마일스톤 데이터
    };

  } catch (error) {
    console.error("데이터 조회 실패:", error);
    throw new Error("전체 데이터 조회 중 오류 발생");
  }
};
