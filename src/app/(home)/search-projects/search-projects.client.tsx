'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAllCounsel } from '@/apis/counsel.service';
import { Search, Briefcase, DollarSign, Tag, MapPin, ChevronRight, Clock } from 'lucide-react';

type Counsel = {
  counsel_id: number;
  title: string | null;
  cost: string;
  counsel_status: string;
  start_date: string;
  due_date: string;
  skill: string[] | null;
  feild: string | null;
  period: string;
  client_id: string;
  counsel_date: string | null;
  counsel_type: string | null;
  outline: string | null;
  output: string | null;
};

type Project = {
  id: number;
  title: string;
  cost: string;
  status: string;
  startDate: string;
  dueDate: string;
  skills: string[];
  field: string;
  isRemote: boolean;
  period: string;
};

const calculateDurationInMonths = (startDate: string, dueDate: string) => {
  const start = new Date(startDate);
  const end = new Date(dueDate);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return months > 0 ? months : 0;
};

const transformCounselToProject = (counsel: Counsel): Project => {
  return {
    id: counsel.counsel_id,
    title: counsel.title || '제목 없음',
    cost: counsel.cost,
    status: counsel.counsel_status,
    startDate: counsel.start_date,
    dueDate: counsel.due_date,
    skills: counsel.skill || [],
    field: counsel.feild || '분야 미지정',
    isRemote: false, // 기본값
    period: counsel.period,
  };
};

const SearchProjectsClient: React.FC = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const counselData: Counsel[] = await fetchAllCounsel();
        const transformedData = counselData.map(transformCounselToProject);
        setProjects(transformedData);
        setFilteredProjects(transformedData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 검색어 및 상태 필터링
  useEffect(() => {
    let filtered = projects;

    // 검색어 필터링
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((project) => {
        return (
          project.title?.toLowerCase().includes(searchLower) ||
          project.field?.toLowerCase().includes(searchLower) ||
          project.skills?.some((skill) => skill.toLowerCase().includes(searchLower))
        );
      });
    }

    // 상태 필터링
    if (statusFilter !== 'all') {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  }, [searchTerm, statusFilter, projects]);

  const handleProjectClick = (id: number) => {
    router.push(`/project-detail/${id}`);
  };

  const statusOptions = [
    { value: 'all', label: '전체', count: projects.length },
    { value: 'recruiting', label: '모집중', count: projects.filter((p) => p.status === 'recruiting').length },
    { value: 'pending', label: '대기중', count: projects.filter((p) => p.status === 'pending').length },
    { value: 'end', label: '종료', count: projects.filter((p) => p.status === 'end').length },
  ];

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">프로젝트 찾기</h1>
            <p className="text-gray-600 text-lg">원하는 프로젝트를 찾아 지원해보세요</p>
          </div>

          {/* 검색 및 필터 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            {/* 검색창 */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="프로젝트 제목, 분야, 기술 스택으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* 상태 필터 */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-600" />
                프로젝트 상태
              </h3>
              <div className="flex flex-wrap gap-3">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      statusFilter === option.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 결과 통계 */}
          {!loading && (
            <div className="mb-6 flex items-center gap-2 text-gray-600">
              <Briefcase className="w-5 h-5" />
              <span className="font-medium">
                총 <strong className="text-gray-900">{filteredProjects.length}</strong>개의 프로젝트를 찾았습니다
              </span>
            </div>
          )}

          {/* 로딩 상태 */}
          {loading && (
            <div className="flex items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">프로젝트를 불러오는 중...</p>
              </div>
            </div>
          )}

          {/* 프로젝트 목록 */}
          {!loading && (
            <section className="grid grid-cols-1 gap-6">
              {filteredProjects.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Briefcase className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    {searchTerm ? '다른 검색어로 시도해보세요' : '필터 조건을 변경해보세요'}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                    >
                      검색어 초기화
                    </button>
                  )}
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <ProjectMeta
                    key={project.id}
                    project={project}
                    onClick={() => handleProjectClick(project.id)}
                  />
                ))
              )}
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
  project: Project;
  onClick: () => void;
}) => {
  // 상태 변환 및 색상 설정
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'recruiting':
        return { text: '모집중', color: 'bg-green-50 text-green-700 border-green-200' };
      case 'pending':
        return { text: '대기중', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'end':
        return { text: '종료', color: 'bg-gray-50 text-gray-700 border-gray-200' };
      default:
        return { text: '대기중', color: 'bg-gray-50 text-gray-700 border-gray-200' };
    }
  };

  const statusInfo = getStatusInfo(project.status);

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex flex-col gap-5">
          {/* 프로젝트 제목과 상태 */}
          <div className="flex justify-between items-start gap-4">
            <h3 className="font-bold text-xl text-gray-900 flex-1 leading-tight">
              {project.title}
            </h3>
            <div className={`px-4 py-1.5 text-sm font-medium rounded-lg border ${statusInfo.color} whitespace-nowrap`}>
              {statusInfo.text}
            </div>
          </div>

          {/* 예상 금액 및 기간 */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block mb-1">예상 금액</span>
                <p className="text-sm font-semibold text-gray-900">{project.cost || '미정'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block mb-1">예상 기간</span>
                <p className="text-sm font-semibold text-gray-900">{project.period || '미정'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <MapPin className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 block mb-1">근무 방식</span>
                <p className="text-sm font-semibold text-gray-900">{project.isRemote ? '원격' : '현장'}</p>
              </div>
            </div>
          </div>

          {/* 프로젝트 분야 */}
          {project.field && (
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-blue-50 rounded-lg border border-blue-200">
                {project.field}
              </span>
            </div>
          )}

          {/* 기술 스택 */}
          {project.skills && project.skills.length > 0 && (
            <div>
              <span className="text-sm font-semibold text-gray-700 mb-2 block">기술 스택</span>
              <div className="flex flex-wrap gap-2">
                {project.skills.slice(0, 5).map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg border border-gray-200"
                  >
                    {skill}
                  </span>
                ))}
                {project.skills.length > 5 && (
                  <span className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg">
                    +{project.skills.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 하단 정보 */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              등록일: {project.startDate ? new Date(project.startDate).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : '날짜 없음'}
            </span>
            <span className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
              자세히 보기
              <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchProjectsClient;
