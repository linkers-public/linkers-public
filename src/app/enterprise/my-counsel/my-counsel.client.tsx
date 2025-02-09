'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchAllCounsel } from '@/apis/counsel.service';
import EnterpriseSidebar from '../../../components/EnterpriseSidebar';

const SearchProjectsClient: React.FC = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleProjectClick = (counselId: number) => {
    router.push(`/enterprise/estimate-list/${counselId}`); // 상세 페이지 이동
  };

  return (
    <div className="flex w-full h-screen bg-gray-100">
      {/* 왼쪽 사이드바 */}
      <div >
        <EnterpriseSidebar />
      </div>

      {/* 오른쪽 콘텐츠 (프로젝트 목록) */}
      <div className="flex flex-col w-3/4 p-6">
        <h2 className="text-h3 ml-1 mb-4">내 프로젝트</h2>

        {loading ? (
          <p className="text-gray-500 text-center">🔄 로딩 중...</p>
        ) : projects.length === 0 ? (
          <p className="text-gray-500 text-center">📂 표시할 프로젝트가 없습니다.</p>
        ) : (
          <section className="flex flex-col gap-4 w-full">
            {projects.map((project) => (
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
  );
};

const ProjectMeta = ({
  project,
  onClick,
}: {
  project: any;
  onClick: () => void;
}) => {
  // 상태 변환: recruiting → 모집중, pending → 대기중, end → 종료
  const formattedStatus =
    project.status === 'recruiting'
      ? '모집중'
      : project.status === 'pending'
        ? '대기중'
        : '종료';

  return (
    <li
      className="flex py-5 px-6 shadow-lg w-full rounded-xl cursor-pointer bg-white hover:shadow-2xl transition-all duration-300 border border-gray-200"
      onClick={onClick}
    >
      <div className="flex flex-col gap-4 w-full">
        {/* 프로젝트 제목 */}
        <h3 className="font-semibold text-[22px] leading-snug tracking-tight text-gray-900">
          {project.title}
        </h3>

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

        {/* 상태 및 근무 방식 */}
        <div className="flex flex-wrap gap-2 mt-3">

          <div
            className={`px-3 py-1 text-sm font-medium rounded-md shadow-sm ${formattedStatus === '모집중'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-400 text-gray-100'
              }`}
          >
            {formattedStatus}
          </div>
        </div>
      </div>
    </li>
  );
};

export default SearchProjectsClient;
