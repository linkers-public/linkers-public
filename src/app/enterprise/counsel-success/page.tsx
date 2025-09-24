'use client'
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/supabase/supabase-client';
import EnterpriseSidebar from '@/components/EnterpriseSidebar';
import MakersLogo from '@/components/common/MakersLogo';

const CounselSuccessPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  
  const [counselData, setCounselData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const counselId = searchParams.get('counselId');

  useEffect(() => {
    const fetchCounselData = async () => {
      if (!counselId) {
        router.push('/enterprise');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('counsel')
          .select(`
            *,
            client:client_id (
              company_name,
              email
            )
          `)
          .eq('counsel_id', counselId)
          .single();

        if (error) throw error;
        setCounselData(data);
      } catch (error) {
        console.error('상담 데이터 조회 실패:', error);
        router.push('/enterprise');
      } finally {
        setLoading(false);
      }
    };

    fetchCounselData();
  }, [counselId, router, supabase]);

  if (loading) {
    return (
      <div className="flex w-full h-screen bg-gray-100">
        <EnterpriseSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!counselData) {
    return (
      <div className="flex w-full h-screen bg-gray-100">
        <EnterpriseSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">상담 데이터를 찾을 수 없습니다.</p>
            <button
              onClick={() => router.push('/enterprise')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen bg-gray-100">
      <EnterpriseSidebar />
      
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {/* 성공 아이콘 */}
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                상담 신청이 완료되었습니다!
              </h1>
              <p className="text-gray-600">
                프로젝트 상담 신청이 성공적으로 접수되었습니다.
              </p>
            </div>

            {/* 상담 정보 요약 */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">상담 신청 정보</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">프로젝트 제목:</span>
                  <span className="font-medium">{counselData.title}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">회사명:</span>
                  <span className="font-medium">{counselData.client?.company_name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">예상 예산:</span>
                  <span className="font-medium">{counselData.cost}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">예상 기간:</span>
                  <span className="font-medium">{counselData.period}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">프로젝트 분야:</span>
                  <span className="font-medium">{counselData.feild}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">상담 상태:</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    {counselData.counsel_status === 'pending' ? '대기중' : counselData.counsel_status}
                  </span>
                </div>
              </div>
            </div>

            {/* 다음 단계 안내 */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">다음 단계</h3>
              <div className="text-left space-y-2 text-blue-800">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="font-medium">메이커 매칭</p>
                    <p className="text-sm text-blue-600">적합한 메이커 팀을 찾아 매칭해드립니다.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center mr-3 mt-0.5">
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="font-medium">견적서 수신</p>
                    <p className="text-sm text-blue-600">매칭된 메이커로부터 견적서를 받아보실 수 있습니다.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center mr-3 mt-0.5">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <div>
                    <p className="font-medium">프로젝트 시작</p>
                    <p className="text-sm text-blue-600">견적서 승인 후 프로젝트를 시작할 수 있습니다.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 연락처 정보 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">
                상담 관련 문의사항이 있으시면 언제든지 연락해주세요.
              </p>
              <p className="text-sm text-gray-800">
                이메일: {counselData.client?.email}
              </p>
            </div>

            {/* 버튼들 */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/enterprise/my-counsel')}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                내 프로젝트 보기
              </button>
              
              <button
                onClick={() => router.push('/enterprise')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                홈으로 돌아가기
              </button>
            </div>

            {/* 로고 */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-center">
                <MakersLogo size="sm" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Makers와 함께 성공적인 프로젝트를 만들어보세요
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CounselSuccessPageWithSuspense = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CounselSuccessPage />
    </Suspense>
  );
};

export default CounselSuccessPageWithSuspense;
