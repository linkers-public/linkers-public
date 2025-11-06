'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAllCounsel } from '@/apis/counsel.service';
import { createSupabaseBrowserClient } from '@/supabase/supabase-client';
import { FileText } from 'lucide-react';

const SearchProjectsClient: React.FC = () => {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [estimateCounts, setEstimateCounts] = useState<{[key: number]: number}>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchAllCounsel(); // API에서 프로젝트 목록 가져오기
        if (Array.isArray(data)) {
          setProjects(data); // 변환 없이 원본 데이터를 그대로 사용
          
          // 각 프로젝트의 견적서 개수 가져오기
          const counts: {[key: number]: number} = {};
          await Promise.all(
            data.map(async (project: any) => {
              if (project.counsel_id) {
                const { count } = await supabase
                  .from('estimate')
                  .select('*', { count: 'exact', head: true })
                  .eq('counsel_id', project.counsel_id)
                  .in('estimate_status', ['pending', 'accept']);
                counts[project.counsel_id] = count || 0;
              }
            })
          );
          setEstimateCounts(counts);
        } else {
          console.error('Invalid data format:', data);
          setProjects([]); // 데이터 형식이 다를 경우 빈 배열 설정
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 상태 필터링
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(projects.filter(project => 
        (project.counsel_status || project.status) === statusFilter
      ));
    }
  }, [projects, statusFilter]);

  const handleProjectClick = (counselId: number) => {
    router.push(`/enterprise/counsel-detail/${counselId}`); // 상담서 상세 페이지 이동
  };

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">내 프로젝트 목록</h1>
            <p className="text-gray-600 text-lg">제출한 상담 신청서의 진행 상황을 확인하실 수 있습니다</p>
          </div>

          {/* 상태 필터 */}
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체 ({projects.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  statusFilter === 'pending'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📋 접수됨 ({projects.filter(p => (p.counsel_status || p.status) === 'pending').length})
              </button>
              <button
                onClick={() => setStatusFilter('recruiting')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  statusFilter === 'recruiting'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔍 매칭 중 ({projects.filter(p => (p.counsel_status || p.status) === 'recruiting').length})
              </button>
              <button
                onClick={() => setStatusFilter('estimate_received')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  statusFilter === 'estimate_received'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📄 견적 도착 ({projects.filter(p => (p.counsel_status || p.status) === 'estimate_received').length})
              </button>
              <button
                onClick={() => setStatusFilter('contract_progress')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  statusFilter === 'contract_progress'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📝 계약 진행 ({projects.filter(p => (p.counsel_status || p.status) === 'contract_progress').length})
              </button>
              <button
                onClick={() => setStatusFilter('end')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  statusFilter === 'end'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✅ 완료 ({projects.filter(p => (p.counsel_status || p.status) === 'end').length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">프로젝트 목록을 불러오는 중...</p>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {projects.length === 0 ? (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">아직 제출한 상담서가 없습니다</h3>
                  <p className="text-gray-600 mb-6 text-lg">첫 번째 프로젝트 상담을 신청해보세요!</p>
                  <button
                    onClick={() => router.push('/enterprise/counsel-form')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                  >
                    프로젝트 상담 신청하기
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">해당 상태의 프로젝트가 없습니다</h3>
                  <p className="text-gray-600 mb-6 text-lg">다른 상태 필터를 선택해보세요.</p>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                  >
                    전체 보기
                  </button>
                </>
              )}
            </div>
          ) : (
            <section className="grid grid-cols-1 gap-6">
              {filteredProjects.map((project) => (
                <ProjectMeta
                  key={project.id}
                  project={project}
                  estimateCount={estimateCounts[project.counsel_id] || 0}
                  onClick={() => handleProjectClick(project.counsel_id)}
                />
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

const ProjectMeta = ({
  project,
  estimateCount,
  onClick,
}: {
  project: any;
  estimateCount: number;
  onClick: () => void;
}) => {
  const router = useRouter();
  // 상태 변환 및 색상 설정
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { text: '접수됨', color: 'bg-blue-100 text-blue-800', icon: '📋' };
      case 'recruiting':
        return { text: '매칭 중', color: 'bg-yellow-100 text-yellow-800', icon: '🔍' };
      case 'estimate_received':
        return { text: '견적 도착', color: 'bg-green-100 text-green-800', icon: '📄' };
      case 'contract_progress':
        return { text: '계약 진행', color: 'bg-purple-100 text-purple-800', icon: '📝' };
      case 'end':
        return { text: '완료', color: 'bg-gray-100 text-gray-800', icon: '✅' };
      default:
        return { text: '접수됨', color: 'bg-blue-100 text-blue-800', icon: '📋' };
    }
  };

  const statusInfo = getStatusInfo(project.counsel_status || project.status);

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex flex-col gap-5">
          {/* 프로젝트 제목과 상태 */}
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-xl text-gray-900 leading-tight mb-2">
                {project.title}
              </h3>
              {/* 견적서 개수 표시 */}
              {estimateCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/enterprise/estimate-review?counselId=${project.counsel_id}`);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold border border-blue-200"
                >
                  <FileText className="w-4 h-4" />
                  <span>견적서 {estimateCount}개 도착</span>
                  <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                    {estimateCount}
                  </span>
                </button>
              )}
            </div>
            <div className={`px-4 py-1.5 text-sm font-semibold rounded-lg shadow-sm ${statusInfo.color} flex items-center gap-2 whitespace-nowrap`}>
              <span className="text-base">{statusInfo.icon}</span>
              <span>{statusInfo.text}</span>
            </div>
          </div>

          {/* 프로젝트 설명 */}
          {project.outline && (
            <p className="text-gray-600 text-base line-clamp-2 leading-relaxed">
              {project.outline}
            </p>
          )}

          {/* 예상 금액 및 기간 */}
          <div className="flex flex-wrap gap-6 text-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">💰</span>
              <div>
                <span className="text-sm font-medium text-gray-500">예상 금액</span>
                <p className="text-base font-semibold">{project.cost || '미정'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⏳</span>
              <div>
                <span className="text-sm font-medium text-gray-500">예상 기간</span>
                <p className="text-base font-semibold">{project.period || '미정'}</p>
              </div>
            </div>
          </div>

          {/* 프로젝트 분야 */}
          {project.feild && (
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(project.feild) ? project.feild : [project.feild]).filter(Boolean).map(
                (skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg border border-gray-200"
                  >
                    {skill}
                  </span>
                )
              )}
            </div>
          )}

          {/* 하단 정보 및 액션 */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              신청일: {project.start_date ? new Date(project.start_date).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : '날짜 없음'}
            </span>
            <div className="flex items-center gap-3">
              {/* 매칭중 상태일 때 프로젝트 수정 버튼 */}
              {(project.counsel_status || project.status) === 'recruiting' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/enterprise/counsel-form?edit=${project.counsel_id}`);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  프로젝트 수정
                </button>
              )}
              {/* 견적서가 있으면 견적서 검토 버튼 표시 (상태와 무관하게) */}
              {estimateCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/enterprise/estimate-review?counselId=${project.counsel_id}`);
                  }}
                  className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>견적서 검토 ({estimateCount})</span>
                </button>
              )}
              <span className="text-sm text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
                자세히 보기
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchProjectsClient;
