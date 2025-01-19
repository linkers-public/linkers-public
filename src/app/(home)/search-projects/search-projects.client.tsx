'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; // App Router의 useRouter
import { fetchAllCounsel } from '@/apis/counsel.service';

type Project = {
  id: number;
  title: string;
  cost: number;
  status: 'pending' | 'recruiting' | 'end';
  startDate: string;
  dueDate: string;
  skills: string[];
  field: string;
  isRemote: boolean;
};

const calculateDurationInMonths = (startDate: string, dueDate: string) => {
  const start = new Date(startDate);
  const end = new Date(dueDate);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return months > 0 ? months : 0;
};

const SearchProjectsClient: React.FC = () => {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data: Project[] = await fetchAllCounsel(); // 모든 counsel 데이터 가져오기
        setProjects(data);
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
  // 금액 변환: 원 → 만원
  const formattedCost = `${Math.round(project.cost / 10000)}만원`;

  // 상태 변환: recruiting → 모집중
  const formattedStatus =
    project.status === 'recruiting'
      ? '모집중'
      : project.status === 'pending'
      ? '대기중'
      : '종료';

  // 예상 기간 계산 (개월 수)
  const durationInMonths = calculateDurationInMonths(project.startDate, project.dueDate);

  return (
    <li
      className="flex py-4 px-6 shadow-emphasize w-full rounded-[12px] cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
    >
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-[20px] leading-snug tracking-[-0.04em]">
          {project.title}
        </h3>
        <div className="flex gap-4">
          <div className="flex gap-1">
            <span className="text-palette-coolNeutral-60 text-p2">예상 금액:</span>
            <span className="text-palette-coolNeutral-60 text-p2">{formattedCost}</span>
          </div>
          <div className="flex gap-1">
            <span className="text-palette-coolNeutral-60 text-p2">시작일:</span>
            <span className="text-palette-coolNeutral-60 text-p2">{project.startDate}</span>
          </div>
          <div className="flex gap-1">
            <span className="text-palette-coolNeutral-60 text-p2">예상 기간:</span>
            <span className="text-palette-coolNeutral-60 text-p2">
              {durationInMonths}개월
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <span className="text-palette-coolNeutral-60 text-p3">{project.field}</span>
        </div>

        <div className="flex mt-1 gap-2">
          {project.skills.map((skill, index) => (
            <div
              key={index}
              className="px-2 py-1 shadow-normal text-palette-coolNeutral-40 rounded-[8px] text-[12px] bg-palette-coolNeutral-95"
            >
              {skill}
            </div>
          ))}
        </div>

        <div className="flex mt-2 gap-2">
          <div className="bg-palette-green-90 text-palette-lime-30 text-p4 px-2 rounded-[6px]">
            {project.isRemote ? '원격' : '현장'}
          </div>
          <div
            className={`${
              formattedStatus === '모집중'
                ? 'bg-palette-violet-60 text-white'
                : 'bg-palette-coolNeutral-60 text-palette-coolNeutral-40'
            } text-p4 px-2 rounded-[6px]`}
          >
            {formattedStatus}
          </div>
        </div>
      </div>
    </li>
  );
};

export default SearchProjectsClient;
