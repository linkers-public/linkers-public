'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // App Router의 useRouter
import { fetchAllCounsel } from '@/apis/counsel.service';

type Counsel = {
  counsel_id: number;
  title: string | null;
  cost: string;
  counsel_status: 'pending' | 'recruiting' | 'end';
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
  status: 'pending' | 'recruiting' | 'end';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const counselData: Counsel[] = await fetchAllCounsel(); // 모든 counsel 데이터 가져오기
        const transformedData = counselData.map(transformCounselToProject);
        setProjects(transformedData);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchData();
  }, []);

  const handleProjectClick = (id: number) => {
    router.push(`/counsel-detail/${id}`); // 상세 페이지로 이동
  };

  return (
    <div className="w-full">
      <h2 className="text-h3 ml-1 mb-4">프로젝트 찾기</h2>
      <section className="flex flex-col gap-4 w-full">
        {projects.map((project) => (
          <ProjectMeta
            key={project.id}
            project={project}
            onClick={() => handleProjectClick(project.id)}
          />
        ))}
      </section>
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


  // 상태 변환: recruiting → 모집중
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
          {[project.field].map((skill, index) => (
            <div
              key={index}
              className="px-3 py-1 text-gray-700 text-xs font-medium bg-gray-100 rounded-lg shadow-sm"
            >
              {skill}
            </div>
          ))}
        </div>

        {/* 상태 및 근무 방식 */}
        <div className="flex flex-wrap gap-2 mt-3">
          <div className="px-3 py-1 text-sm font-medium rounded-md shadow-sm bg-green-100 text-green-700">
            {project.isRemote ? "🌍 원격" : "🏢 현장"}
          </div>
          <div
            className={`px-3 py-1 text-sm font-medium rounded-md shadow-sm ${
              formattedStatus === "모집중"
                ? "bg-purple-600 text-white"
                : "bg-gray-400 text-gray-100"
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
