'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchCounselWithClient } from '@/apis/counsel.service';
import { ArrowLeft } from 'lucide-react';

const ClientEstimateDetailPage: React.FC = () => {
  const [counsel, setCounsel] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const counselId = params?.id;

  // 페이지 접속 시 스크롤을 맨 위로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [counselId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!counselId) {
        console.error('counselId가 제공되지 않았습니다.');
        setLoading(false);
        return;
      }

      try {
        const result = await fetchCounselWithClient(Number(counselId));
        setCounsel(result?.counsel);
        setClient(result?.client);
      } catch (error) {
        console.error('Error fetching counsel details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [counselId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">상담서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!counsel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md">
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">상담서를 불러올 수 없습니다</h3>
          <p className="text-gray-600 mb-6">상담서 정보를 가져오는 중 오류가 발생했습니다.</p>
          <button
            onClick={() => router.push('/enterprise/my-counsel')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 w-full -mx-4 md:-mx-6 px-4 md:px-6">
      <div className="w-full">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/enterprise/my-counsel')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">목록으로 돌아가기</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">상담서 상세</h1>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* 고객사 정보 섹션 */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">고객사 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">고객사 이름</label>
                <input
                  type="text"
                  value={client?.name || client?.company_name || '정보 없음'}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">이메일</label>
                <input
                  type="email"
                  value={client?.email || '정보 없음'}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
            </div>
          </section>

          {/* 프로젝트 정보 섹션 */}
          <section className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">프로젝트 정보</h2>
            
            {/* 예상 견적 비용 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">예상 견적 비용</label>
              <div className="flex flex-wrap gap-2">
                {counsel.cost ? (
                  <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 font-medium">
                    {counsel.cost}
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg border border-gray-200">
                    미정
                  </span>
                )}
              </div>
            </div>

            {/* 프로젝트 기간 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">프로젝트 기간</label>
              <div className="flex flex-wrap gap-2">
                {counsel.period ? (
                  <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 font-medium">
                    {counsel.period}
                  </span>
                ) : (
                  <span className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg border border-gray-200">
                    미정
                  </span>
                )}
              </div>
            </div>

            {/* 분야 */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">분야</label>
              <div className="flex flex-wrap gap-2">
                {counsel.field ? (
                  Array.isArray(counsel.field) ? (
                    counsel.field.map((item: string, index: number) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 font-medium"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 font-medium">
                      {counsel.field}
                    </span>
                  )
                ) : (
                  <span className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg border border-gray-200">
                    정보 없음
                  </span>
                )}
              </div>
            </div>

            {/* 최종 도출안 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">최종 도출안</label>
              <div className="flex flex-wrap gap-2">
                {counsel.output ? (
                  Array.isArray(counsel.output) ? (
                    counsel.output.map((item: string, index: number) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 font-medium"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="px-4 py-2 bg-orange-50 text-orange-700 rounded-lg border border-orange-200 font-medium">
                      {counsel.output}
                    </span>
                  )
                ) : (
                  <span className="px-4 py-2 bg-gray-50 text-gray-500 rounded-lg border border-gray-200">
                    정보 없음
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* 상담 내용 섹션 */}
          <section className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">상담 내용</label>
            <textarea
              value={counsel.outline || ''}
              readOnly
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 min-h-[150px] resize-none"
            />
          </section>

          {/* 하단 버튼 */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push('/enterprise/my-counsel')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientEstimateDetailPage;
