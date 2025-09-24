'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAllCounsel } from '@/apis/counsel.service';

const SearchProjectsClient: React.FC = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchAllCounsel(); // API에서 프로젝트 목록 가져오기
        if (Array.isArray(data)) {
          setProjects(data); // 변환 없이 원본 데이터를 그대로 사용
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
    <div className="w-full min-h-screen bg-gray-100">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">내 프로젝트</h2>
          <p className="text-gray-600">제출한 상담 신청서의 진행 상황을 확인하실 수 있습니다</p>
        </div>

        {/* 상태 필터 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체 ({projects.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 접수됨 ({projects.filter(p => (p.counsel_status || p.status) === 'pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('recruiting')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'recruiting'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🔍 매칭 중 ({projects.filter(p => (p.counsel_status || p.status) === 'recruiting').length})
            </button>
            <button
              onClick={() => setStatusFilter('estimate_received')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'estimate_received'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📄 견적 도착 ({projects.filter(p => (p.counsel_status || p.status) === 'estimate_received').length})
            </button>
            <button
              onClick={() => setStatusFilter('contract_progress')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter === 'contract_progress'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📝 계약 진행 ({projects.filter(p => (p.counsel_status || p.status) === 'contract_progress').length})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">프로젝트 목록을 불러오는 중...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {projects.length === 0 ? (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">아직 제출한 상담서가 없습니다</h3>
                <p className="text-gray-600 mb-4">첫 번째 프로젝트 상담을 신청해보세요!</p>
                <button
                  onClick={() => router.push('/enterprise/counsel-form')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  프로젝트 상담 신청하기
                </button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">해당 상태의 프로젝트가 없습니다</h3>
                <p className="text-gray-600 mb-4">다른 상태 필터를 선택해보세요.</p>
                <button
                  onClick={() => setStatusFilter('all')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  전체 보기
                </button>
              </>
            )}
          </div>
        ) : (
          <section className="flex flex-col gap-4 w-full">
            {filteredProjects.map((project) => (
              <ProjectMeta
                key={project.id}
                project={project}
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
  onClick,
}: {
  project: any;
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
    <li
      className="flex py-6 px-6 shadow-lg w-full rounded-xl cursor-pointer bg-white hover:shadow-2xl transition-all duration-300 border border-gray-200"
      onClick={onClick}
    >
      <div className="flex flex-col gap-4 w-full">
        {/* 프로젝트 제목과 상태 */}
        <div className="flex justify-between items-start">
          <h3 className="font-semibold text-[22px] leading-snug tracking-tight text-gray-900 flex-1">
            {project.title}
          </h3>
          <div className={`px-3 py-1 text-sm font-medium rounded-full shadow-sm ${statusInfo.color} flex items-center gap-1`}>
            <span>{statusInfo.icon}</span>
            <span>{statusInfo.text}</span>
          </div>
        </div>

        {/* 프로젝트 설명 */}
        {project.outline && (
          <p className="text-gray-600 text-sm line-clamp-2">
            {project.outline}
          </p>
        )}

        {/* 예상 금액 및 기간 */}
        <div className="flex flex-wrap gap-4 text-gray-600 text-sm">
          <div className="flex items-center gap-1">
            <span className="font-medium">💰 예상 금액:</span>
            <span>{project.cost}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">⏳ 예상 기간:</span>
            <span>{project.period}</span>
          </div>
        </div>

        {/* 프로젝트 분야 */}
        <div className="flex flex-wrap gap-2 mt-1">
          {(Array.isArray(project.feild) ? project.feild : [project.feild]).map(
            (skill: string, index: number) => (
              <div
                key={index}
                className="px-3 py-1 text-gray-700 text-xs font-medium bg-gray-100 rounded-lg shadow-sm"
              >
                {skill}
              </div>
            )
          )}
        </div>

        {/* 신청일 및 액션 버튼 */}
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">
            신청일: {new Date(project.start_date).toLocaleDateString('ko-KR')}
          </span>
          <div className="flex gap-2">
            {(project.counsel_status || project.status) === 'estimate_received' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/enterprise/estimate-review?counselId=${project.counsel_id}`);
                }}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
              >
                견적서 검토
              </button>
            )}
            <span className="text-xs text-blue-600 hover:text-blue-800">
              자세히 보기 →
            </span>
          </div>
        </div>
      </div>
    </li>
  );
};

export default SearchProjectsClient;
