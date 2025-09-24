'use client'
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/supabase/supabase-client';
import EnterpriseSidebar from '@/components/EnterpriseSidebar';

interface Estimate {
  estimate_id: number;
  counsel_id: number | null;
  estimate_status: string;
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
      const { data, error } = await supabase
        .from('estimate')
        .select(`
          estimate_id,
          counsel_id,
          estimate_status,
          team:team_id (
            name,
            bio,
            specialty
          ),
          estimate_version:estimate_version_id (
            detail,
            total_amount,
            start_date,
            end_date
          ),
          milestone:milestone_id (
            title,
            detail,
            payment_amount,
            milestone_start_date,
            milestone_due_date
          )
        `)
        .eq('counsel_id', counselId)
        .eq('estimate_status', 'pending');

      if (error) throw error;
      setEstimates(data || []);
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
      <div className="flex w-full h-screen bg-gray-100">
        <EnterpriseSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">견적서를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-100">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">견적서 검토</h1>
            <p className="text-gray-600">운영자가 매칭한 메이커 팀의 견적서를 검토하고 선택해주세요</p>
            
            {estimates.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-blue-800">
                    📋 총 <strong>{estimates.length}</strong>개의 견적서가 도착했습니다
                  </span>
                  <span className="text-blue-600">
                    검토 완료: {Object.values(decisions).filter(d => d !== null).length}개
                  </span>
                </div>
              </div>
            )}
          </div>

          {estimates.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">아직 도착한 견적서가 없습니다</h3>
              <p className="text-gray-600 mb-4">운영자가 적합한 메이커를 매칭하고 있습니다.</p>
              <button
                onClick={() => router.push('/enterprise/my-counsel')}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                내 프로젝트로 돌아가기
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 견적서 목록 */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">견적서 목록</h2>
                {estimates.map((estimate) => (
                  <div
                    key={estimate.estimate_id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedEstimate?.estimate_id === estimate.estimate_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedEstimate(estimate)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">견적서 #{estimate.estimate_id}</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                    
                    <p className="text-sm text-gray-600 mb-2">상태: {estimate.estimate_status}</p>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-blue-600">
                        견적서 ID: {estimate.estimate_id}
                      </span>
                      <span className="text-sm text-gray-500">
                        상담 ID: {estimate.counsel_id}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 견적서 상세 */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">견적서 상세</h2>
                
                {selectedEstimate ? (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    {/* 견적서 정보 */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">견적서 #{selectedEstimate.estimate_id}</h3>
                      <p className="text-gray-600 mb-4">상태: {selectedEstimate.estimate_status}</p>
                      
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          상담 ID: {selectedEstimate.counsel_id}
                        </span>
                      </div>
                    </div>

                    {/* 견적 요약 */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-semibold text-gray-900">견적서 정보</span>
                        <span className="text-2xl font-bold text-blue-600">
                          ID: {selectedEstimate.estimate_id}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>상태</span>
                        <span>{selectedEstimate.estimate_status}</span>
                      </div>
                    </div>

                    {/* 견적 상세 */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">견적서 상세</h4>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-700">
                          견적서 ID: {selectedEstimate.estimate_id}<br/>
                          상담 ID: {selectedEstimate.counsel_id}<br/>
                          상태: {selectedEstimate.estimate_status}
                        </p>
                      </div>
                    </div>

                    {/* 선택 버튼 */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3">이 견적서에 대해 어떻게 생각하시나요?</h4>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleDecision(selectedEstimate.estimate_id, 'interested')}
                          disabled={decisions[selectedEstimate.estimate_id] === 'interested'}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                            decisions[selectedEstimate.estimate_id] === 'interested'
                              ? 'bg-green-100 text-green-800 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          👍 관심 있음
                        </button>
                        <button
                          onClick={() => handleDecision(selectedEstimate.estimate_id, 'not_interested')}
                          disabled={decisions[selectedEstimate.estimate_id] === 'not_interested'}
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                            decisions[selectedEstimate.estimate_id] === 'not_interested'
                              ? 'bg-red-100 text-red-800 cursor-not-allowed'
                              : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                        >
                          👎 관심 없음
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        선택하시면 운영자에게 알림이 전달됩니다
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-600">견적서를 선택하면 상세 내용을 확인할 수 있습니다</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
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
