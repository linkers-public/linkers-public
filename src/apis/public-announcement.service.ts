import { createSupabaseBrowserClient } from '@/supabase/supabase-client';

const handleError = (message: string, error?: any) => {
  console.error(message, error);
  throw new Error(message);
};

const supabase = createSupabaseBrowserClient();

const checkSession = async (): Promise<string> => {
  const { data: sessionData, error } = await supabase.auth.getSession();
  if (error || !sessionData || !sessionData.session) {
    handleError('인증되지 않은 사용자입니다.', error);
    throw new Error('Unreachable code');
  }
  return sessionData.session.user.id;
};

/**
 * 공고 업로드 (파일 또는 URL)
 * title이 없으면 파일명에서 자동으로 추출합니다.
 */
export const uploadAnnouncement = async (
  file: File | null,
  url: string | null,
  title?: string
): Promise<{ id: number; pdfUrl?: string }> => {
  try {
    const userId = await checkSession();

    let pdfUrl: string | undefined;
    // title이 없으면 파일명 또는 URL에서 자동 추출
    const autoTitle = title || (file ? file.name.replace(/\.[^/.]+$/, '') : url || '제목 없음');

    // 파일 업로드
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `announcements/${userId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attach_file')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        handleError('파일 업로드 실패', uploadError);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('attach_file')
        .getPublicUrl(filePath);

      pdfUrl = publicUrl;
    }

    // 공고 데이터 저장
    const { data, error } = await supabase
      .from('public_announcements')
      .insert({
        title: autoTitle,
        source_url: url,
        pdf_file_url: pdfUrl,
        status: 'pending',
        created_by: userId,
      })
      .select('id')
      .single();

    if (error) {
      handleError('공고 저장 실패', error);
    }

    return { id: data.id, pdfUrl };
  } catch (error) {
    handleError('공고 업로드 중 오류 발생', error);
    throw error;
  }
};

/**
 * PDF 텍스트 추출 (서버 사이드 API 호출)
 */
export const extractPdfText = async (pdfUrl: string): Promise<string> => {
  try {
    const response = await fetch('/api/public-announcement/extract-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdfUrl }),
    });

    if (!response.ok) {
      throw new Error('PDF 텍스트 추출 실패');
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    handleError('PDF 텍스트 추출 중 오류 발생', error);
    throw error;
  }
};

/**
 * 공고 AI 분석 (요구기술, 예산, 기간 추출)
 */
export const analyzeAnnouncement = async (
  announcementId: number,
  rawText: string
): Promise<{
  requiredSkills: string[];
  budgetMin?: number;
  budgetMax?: number;
  durationMonths?: number;
  organizationName?: string;
  deadline?: string;
  location?: string;
  summary: string;
}> => {
  try {
    const response = await fetch('/api/public-announcement/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        announcementId,
        rawText,
      }),
    });

    if (!response.ok) {
      throw new Error('공고 분석 실패');
    }

    const analysis = await response.json();

    // 분석 결과를 데이터베이스에 저장
    await supabase
      .from('public_announcements')
      .update({
        raw_text: rawText,
        ai_analysis: analysis,
        required_skills: analysis.requiredSkills || [],
        budget_min: analysis.budgetMin,
        budget_max: analysis.budgetMax,
        duration_months: analysis.durationMonths,
        organization_name: analysis.organizationName,
        deadline: analysis.deadline ? new Date(analysis.deadline).toISOString().split('T')[0] : null,
        location: analysis.location,
        status: 'analyzed',
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', announcementId);

    // RAG를 위한 벡터 임베딩 저장
    if (analysis.embedding) {
      await saveAnnouncementEmbedding(announcementId, rawText, analysis.embedding);
    }

    return analysis;
  } catch (error) {
    handleError('공고 분석 중 오류 발생', error);
    throw error;
  }
};

/**
 * AI 매칭 추천 (의미기반 검색)
 */
export const findMatchingTeams = async (
  announcementId: number,
  topN: number = 10
): Promise<Array<{
  teamId: number;
  teamName: string;
  matchScore: number;
  matchReasons: {
    skillMatch: number;
    experienceMatch: number;
    locationMatch: boolean;
    rating: number;
  };
}>> => {
  try {
    const response = await fetch('/api/public-announcement/match-teams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        announcementId,
        topN,
      }),
    });

    if (!response.ok) {
      throw new Error('팀 매칭 실패');
    }

    const matches = await response.json();

    // 매칭 결과를 데이터베이스에 저장
    if (matches.length > 0) {
      const matchData = matches.map((match: any) => ({
        announcement_id: announcementId,
        team_id: match.teamId,
        match_score: match.matchScore,
        match_reasons: match.matchReasons,
        status: 'pending',
      }));

      await supabase
        .from('announcement_team_matches')
        .upsert(matchData, {
          onConflict: 'announcement_id,team_id',
        });
    }

    // 공고 상태 업데이트
    await supabase
      .from('public_announcements')
      .update({ status: 'matched' })
      .eq('id', announcementId);

    return matches;
  } catch (error) {
    handleError('팀 매칭 중 오류 발생', error);
    throw error;
  }
};

/**
 * 견적 자동 초안 생성
 */
export const generateEstimateDraft = async (
  announcementId: number,
  teamId: number
): Promise<{
  totalAmount: number;
  startDate: string;
  endDate: string;
  detail: string;
  milestones: Array<{
    title: string;
    detail: string;
    paymentAmount: number;
    startDate: string;
    endDate: string;
  }>;
}> => {
  try {
    const response = await fetch('/api/public-announcement/generate-estimate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        announcementId,
        teamId,
      }),
    });

    if (!response.ok) {
      throw new Error('견적 초안 생성 실패');
    }

    const draft = await response.json();

    // 초안을 매칭 결과에 저장
    await supabase
      .from('announcement_team_matches')
      .update({
        auto_estimate_draft: draft,
      })
      .eq('announcement_id', announcementId)
      .eq('team_id', teamId);

    return draft;
  } catch (error) {
    handleError('견적 초안 생성 중 오류 발생', error);
    throw error;
  }
};

/**
 * 공고 목록 조회
 */
export const getAnnouncements = async (status?: string) => {
  try {
    await checkSession();

    let query = supabase
      .from('public_announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      handleError('공고 목록 조회 실패', error);
    }

    return data || [];
  } catch (error) {
    handleError('공고 목록 조회 중 오류 발생', error);
    return [];
  }
};

/**
 * 공고 상세 조회
 */
export const getAnnouncement = async (announcementId: number) => {
  try {
    await checkSession();

    const { data, error } = await supabase
      .from('public_announcements')
      .select('*')
      .eq('id', announcementId)
      .single();

    if (error) {
      handleError('공고 조회 실패', error);
    }

    return data;
  } catch (error) {
    handleError('공고 조회 중 오류 발생', error);
    throw error;
  }
};

/**
 * 공고 임베딩 저장 (RAG용)
 */
const saveAnnouncementEmbedding = async (
  announcementId: number,
  text: string,
  embedding: number[]
): Promise<void> => {
  try {
    // 텍스트를 청크로 나누기 (1000자 단위, 200자 오버랩)
    const chunkSize = 1000;
    const overlap = 200;
    const chunks: Array<{ text: string; index: number; type: string }> = [];

    // 전체 텍스트 청크
    chunks.push({
      text: text.substring(0, chunkSize),
      index: 0,
      type: 'full',
    });

    // 나머지 청크들
    for (let i = chunkSize - overlap; i < text.length; i += chunkSize - overlap) {
      chunks.push({
        text: text.substring(i, i + chunkSize),
        index: chunks.length,
        type: 'chunk',
      });
    }

    // 각 청크에 대한 임베딩 생성 및 저장
    // 여기서는 전체 텍스트의 임베딩을 하나의 청크로 저장
    // 실제로는 각 청크별로 임베딩을 생성하는 것이 좋음
    const { error } = await supabase
      .from('announcement_embeddings')
      .insert({
        announcement_id: announcementId,
        embedding: embedding,
        content_text: text.substring(0, 2000), // 처음 2000자만 저장
        chunk_index: 0,
        chunk_type: 'full',
        metadata: {
          total_chunks: chunks.length,
        },
      });

    if (error) {
      console.warn('임베딩 저장 실패:', error);
    }
  } catch (error) {
    console.warn('임베딩 저장 중 오류:', error);
  }
};

/**
 * RAG 검색 (공고/과거 사례/팀 이력)
 */
export const searchWithRAG = async (
  query: string,
  options: {
    matchThreshold?: number;
    matchCount?: number;
    includePastProjects?: boolean;
    includeTeamHistory?: boolean;
  } = {}
): Promise<Array<{
  type: 'announcement' | 'project' | 'team';
  id: number;
  content: string;
  similarity: number;
  metadata: any;
}>> => {
  try {
    await checkSession();

    const {
      matchThreshold = 0.7,
      matchCount = 10,
      includePastProjects = true,
      includeTeamHistory = true,
    } = options;

    // 쿼리 임베딩 생성
    const response = await fetch('/api/rag/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: query }),
    });

    if (!response.ok) {
      throw new Error('임베딩 생성 실패');
    }

    const { embedding } = await response.json();

    const results: Array<{
      type: 'announcement' | 'project' | 'team';
      id: number;
      content: string;
      similarity: number;
      metadata: any;
    }> = [];

    // 1. 공고 검색
    const { data: announcementMatches, error: annError } = await supabase.rpc(
      'match_announcement_embeddings',
      {
        query_embedding: embedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
      }
    );

    if (!annError && announcementMatches) {
      announcementMatches.forEach((match: any) => {
        results.push({
          type: 'announcement',
          id: match.announcement_id,
          content: match.content_text,
          similarity: match.similarity,
          metadata: match.metadata,
        });
      });
    }

    // 2. 과거 프로젝트 검색 (선택사항)
    if (includePastProjects) {
      const { data: projectMatches, error: projError } = await supabase.rpc(
        'match_estimate_embeddings',
        {
          query_embedding: embedding,
          match_threshold: matchThreshold,
          match_count: 5,
        }
      );

      if (!projError && projectMatches) {
        projectMatches.forEach((match: any) => {
          results.push({
            type: 'project',
            id: match.estimate_id,
            content: match.content_text,
            similarity: match.similarity,
            metadata: match.metadata,
          });
        });
      }
    }

    // 유사도 순으로 정렬
    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(0, matchCount);
  } catch (error) {
    handleError('RAG 검색 중 오류 발생', error);
    return [];
  }
};

