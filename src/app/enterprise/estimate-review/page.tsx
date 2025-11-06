'use client'
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/supabase/supabase-client';
import { ArrowLeft, FileText, Calendar, DollarSign, Users, CheckCircle, XCircle } from 'lucide-react';

interface Estimate {
  estimate_id: number;
  counsel_id: number | null;
  estimate_status: string;
  team?: {
    id: number;
    name: string;
    bio: string | null;
    specialty: string[] | null;
    manager_profile_id: string;
    manager?: {
      profile_id: string;
      username: string;
      bio: string | null;
    };
  };
  estimate_version?: {
    estimate_version_id: number;
    total_amount: number | null;
    detail: string | null;
    start_date: string | null;
    end_date: string | null;
    version_date: string;
  };
  milestones?: Array<{
    milestone_id: number;
    title: string;
    detail: string | null;
    payment_amount: number | null;
    milestone_start_date: string | null;
    milestone_due_date: string | null;
  }>;
}

const EstimateReviewPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [decisions, setDecisions] = useState<{[key: number]: 'interested' | 'not_interested' | null}>({});

  const counselId = searchParams.get('counselId');

  useEffect(() => {
    if (counselId) {
      fetchEstimates(Number(counselId));
    }
  }, [counselId]);

  const fetchEstimates = async (counselId: number) => {
    try {
      // counsel_id로 해당 상담의 견적서들을 가져오기
      const { data: estimatesData, error: estimatesError } = await supabase
        .from('estimate')
        .select(`
          estimate_id,
          counsel_id,
          estimate_status,
          team_id,
          teams:team_id (
            id,
            name,
            bio,
            specialty,
            manager_profile_id,
            manager:manager_profile_id (
              profile_id,
              username,
              bio
            )
          )
        `)
        .eq('counsel_id', counselId)
        .in('estimate_status', ['pending', 'accept']);

      if (estimatesError) throw estimatesError;

      // 각 견적서에 대해 estimate_version과 milestone 조회
      const estimatesWithDetails = await Promise.all(
        (estimatesData || []).map(async (est: any) => {
          // 최신 estimate_version 조회
          const { data: versionData } = await supabase
            .from('estimate_version')
            .select('*')
            .eq('estimate_id', est.estimate_id)
            .order('version_date', { ascending: false })
            .limit(1)
            .maybeSingle();

          // milestone 조회
          const { data: milestoneData } = await supabase
            .from('milestone')
            .select('*')
            .eq('estimate_id', est.estimate_id)
            .order('milestone_start_date', { ascending: true });

          return {
            ...est,
            team: est.teams || null,
            estimate_version: versionData || null,
            milestones: milestoneData || [],
          };
        })
      );

      setEstimates(estimatesWithDetails);
    } catch (error) {
      console.error('견적서 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (estimateId: number, decision: 'interested' | 'not_interested') => {
    try {
      // 견적서 상태 업데이트
      const { error } = await supabase
        .from('estimate')
        .update({ 
          estimate_status: decision === 'interested' ? 'accept' : 'pending'
        })
        .eq('estimate_id', estimateId);

      if (error) throw error;

      // 로컬 상태 업데이트
      setDecisions(prev => ({
        ...prev,
        [estimateId]: decision
      }));

      // 성공 메시지
      alert(decision === 'interested' ? '관심 있음으로 표시했습니다!' : '관심 없음으로 표시했습니다!');
      
    } catch (error) {
      console.error('견적서 상태 업데이트 실패:', error);
      alert('처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">견적서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 w-full -mx-4 md:-mx-6 px-4 md:px-6">
      <div className="w-full">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/enterprise/my-counsel')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">목록으로 돌아가기</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">견적서 검토</h1>
          <p className="text-gray-600 text-lg">메이커 팀의 견적서를 검토하고 선택해주세요</p>
          
          {estimates.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm">
                <span className="text-blue-800 font-semibold">
                  📋 총 <strong className="text-lg">{estimates.length}</strong>개의 견적서가 도착했습니다
                </span>
                <span className="text-blue-600">
                  검토 완료: <strong>{Object.values(decisions).filter(d => d !== null).length}</strong>개
                </span>
              </div>
            </div>
          )}
        </div>

        {estimates.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">아직 도착한 견적서가 없습니다</h3>
            <p className="text-gray-600 mb-6 text-lg">운영자가 적합한 메이커를 매칭하고 있습니다.</p>
            <button
              onClick={() => router.push('/enterprise/my-counsel')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
            >
              내 프로젝트로 돌아가기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            {/* 견적서 목록 */}
            <div className="space-y-4">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">견적서 목록</h2>
              {estimates.map((estimate) => (
                <div
                  key={estimate.estimate_id}
                  className={`p-4 md:p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedEstimate?.estimate_id === estimate.estimate_id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedEstimate(estimate)}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1">
                        {estimate.team?.name || `견적서 #${estimate.estimate_id}`}
                      </h3>
                      {estimate.team?.bio && (
                        <p className="text-sm text-gray-600 line-clamp-2">{estimate.team.bio}</p>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      decisions[estimate.estimate_id] === 'interested'
                        ? 'bg-green-100 text-green-800'
                        : decisions[estimate.estimate_id] === 'not_interested'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {decisions[estimate.estimate_id] === 'interested' ? '관심 있음' :
                       decisions[estimate.estimate_id] === 'not_interested' ? '관심 없음' : '검토 대기'}
                    </div>
                  </div>
                  
                  {estimate.estimate_version && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-2">
                      {estimate.estimate_version.total_amount && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {formatCurrency(estimate.estimate_version.total_amount)}
                        </span>
                      )}
                      {estimate.estimate_version.start_date && estimate.estimate_version.end_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(estimate.estimate_version.start_date)} ~ {formatDate(estimate.estimate_version.end_date)}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>견적서 ID: {estimate.estimate_id}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 견적서 상세 */}
            <div className="space-y-4">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">견적서 상세</h2>
              
              {selectedEstimate ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-8">
                  {/* 팀 정보 */}
                  {selectedEstimate.team && (
                    <section className="mb-8 pb-8 border-b border-gray-200">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        팀 정보
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">팀 이름</label>
                          <p className="text-gray-900 font-medium">{selectedEstimate.team.name}</p>
                        </div>
                        {selectedEstimate.team.bio && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">팀 소개</label>
                            <p className="text-gray-700">{selectedEstimate.team.bio}</p>
                          </div>
                        )}
                        {selectedEstimate.team.specialty && selectedEstimate.team.specialty.length > 0 && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">전문 분야</label>
                            <div className="flex flex-wrap gap-2">
                              {(Array.isArray(selectedEstimate.team.specialty) ? selectedEstimate.team.specialty : [selectedEstimate.team.specialty]).map((spec: string, idx: number) => (
                                <span key={idx} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 text-sm font-medium">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedEstimate.team.manager && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">팀 매니저</label>
                            <p className="text-gray-700">{selectedEstimate.team.manager.username}</p>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* 견적서 정보 */}
                  {selectedEstimate.estimate_version && (
                    <section className="mb-8 pb-8 border-b border-gray-200">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        견적서 정보
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedEstimate.estimate_version.total_amount && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">총 견적 금액</label>
                            <p className="text-2xl font-bold text-blue-600">
                              {formatCurrency(selectedEstimate.estimate_version.total_amount)}
                            </p>
                          </div>
                        )}
                        {selectedEstimate.estimate_version.start_date && selectedEstimate.estimate_version.end_date && (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">프로젝트 기간</label>
                            <p className="text-gray-900 font-medium">
                              {formatDate(selectedEstimate.estimate_version.start_date)} ~ {formatDate(selectedEstimate.estimate_version.end_date)}
                            </p>
                          </div>
                        )}
                      </div>
                      {selectedEstimate.estimate_version.detail && (
                        <div className="mt-6">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">상세 설명</label>
                          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-700 whitespace-pre-wrap">{selectedEstimate.estimate_version.detail}</p>
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* 마일스톤 */}
                  {selectedEstimate.milestones && selectedEstimate.milestones.length > 0 && (
                    <section className="mb-8 pb-8 border-b border-gray-200">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        마일스톤
                      </h3>
                      <div className="space-y-4">
                        {selectedEstimate.milestones.map((milestone, idx) => (
                          <div key={milestone.milestone_id || idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                              {milestone.payment_amount && (
                                <span className="text-lg font-bold text-blue-600">
                                  {formatCurrency(milestone.payment_amount)}
                                </span>
                              )}
                            </div>
                            {milestone.detail && (
                              <p className="text-sm text-gray-600 mb-2">{milestone.detail}</p>
                            )}
                            {milestone.milestone_start_date && milestone.milestone_due_date && (
                              <p className="text-xs text-gray-500">
                                {formatDate(milestone.milestone_start_date)} ~ {formatDate(milestone.milestone_due_date)}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* 선택 버튼 */}
                  <div className="pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">이 견적서에 대해 어떻게 생각하시나요?</h4>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <button
                        onClick={() => handleDecision(selectedEstimate.estimate_id, 'interested')}
                        disabled={decisions[selectedEstimate.estimate_id] === 'interested'}
                        className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                          decisions[selectedEstimate.estimate_id] === 'interested'
                            ? 'bg-green-100 text-green-800 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                        }`}
                      >
                        <CheckCircle className="w-5 h-5" />
                        관심 있음
                      </button>
                      <button
                        onClick={() => handleDecision(selectedEstimate.estimate_id, 'not_interested')}
                        disabled={decisions[selectedEstimate.estimate_id] === 'not_interested'}
                        className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                          decisions[selectedEstimate.estimate_id] === 'not_interested'
                            ? 'bg-red-100 text-red-800 cursor-not-allowed'
                            : 'bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg'
                        }`}
                      >
                        <XCircle className="w-5 h-5" />
                        관심 없음
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-3 text-center">
                      선택하시면 운영자에게 알림이 전달됩니다
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600 text-lg">견적서를 선택하면 상세 내용을 확인할 수 있습니다</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const EstimateReviewPageWithSuspense = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EstimateReviewPage />
    </Suspense>
  );
};

export default EstimateReviewPageWithSuspense;
