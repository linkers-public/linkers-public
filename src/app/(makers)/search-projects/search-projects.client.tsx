import React from 'react'

const SearchProjectsClient = () => {
  return (
    <div className="w-full">
      <h2 className="text-h3 ml-1 mb-4">프로젝트 찾기</h2>
      <section className="flex flex-col gap-4 w-full">
        <ProjectMeta />
        <ProjectMeta />
        <ProjectMeta />
        <ProjectMeta />
        <ProjectMeta />
      </section>
    </div>
  )
}

const ProjectMeta = () => {
  return (
    <li className="flex py-4 px-6 shadow-emphasize w-full rounded-[12px]">
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-[20px] leading-snug tracking-[-0.04em]">
          [원격] [부동산] Java 기반 부동산 평가 검증 시스템 개발
        </h3>
        <div className="flex gap-4">
          <div className="flex gap-1">
            <span className="text-palette-coolNeutral-60 text-p2">
              예상 금액 :
            </span>
            <span className="text-palette-coolNeutral-60 text-p2">
              4000만원 ~ 6500만원
            </span>
          </div>
          <div className="flex gap-1">
            <span className="text-palette-coolNeutral-60 text-p2">예정일</span>
            <span className="text-palette-coolNeutral-60 text-p2">
              2025년 1월
            </span>
          </div>
          <div className="flex gap-1">
            <span className="text-palette-coolNeutral-60 text-p2">
              예상 기간
            </span>
            <span className="text-palette-coolNeutral-60 text-p2">12개월</span>
          </div>
        </div>
        <div className="flex gap-1">
          <span className="text-palette-coolNeutral-60 text-p3">IOT</span>
          <span>·</span>
          <span className="text-palette-coolNeutral-60 text-p3">감정평가</span>
          <span>·</span>
          <span className="text-palette-coolNeutral-60 text-p3">
            프론트엔드 개발자
          </span>
        </div>

        <div className="flex mt-1 gap-2">
          <div className="px-2 py-1 shadow-normal text-palette-coolNeutral-40 rounded-[8px] text-[12px] bg-palette-coolNeutral-95">
            JAVA 4년 이상
          </div>
          <div className="px-2 py-1 shadow-normal text-palette-coolNeutral-40 rounded-[8px] text-[12px] bg-palette-coolNeutral-95">
            REACT 4년 이상
          </div>
        </div>

        <div className="flex mt-2 gap-2">
          <div className="bg-palette-green-90 text-palette-lime-30 text-p4 px-2 rounded-[6px]">
            원격
          </div>
          <div className="bg-palette-violet-60 text-white text-p4 px-2 rounded-[6px]">
            모집중
          </div>
        </div>
      </div>
    </li>
  )
}

export default SearchProjectsClient
