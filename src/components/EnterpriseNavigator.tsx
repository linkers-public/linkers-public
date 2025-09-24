import React from "react";
import Link from "next/link";
import Logo from './Logo';  

const ClientNavigator: React.FC = () => {
  return (
    <section className="w-full flex items-center h-[60px] border-b-[1px] border-solid border-[rgba(0,0,0,0.08)] px-4">
      <div className="flex justify-between items-center w-full mx-auto max-w-[1024px]">
        
      <Logo /> 
        {/* 중앙: 네비게이션 링크 */}
        <div className="flex items-center gap-6">
          <Link href="/enterprise">
            <span className="text-sm font-bold text-gray-600 hover:text-gray-900">
              기업 홈
            </span>
          </Link>
          <Link href="/enterprise/counsel-form">
            <span className="text-sm font-bold text-gray-600 hover:text-gray-900">
              상담서 작성
            </span>
          </Link>
          <Link href="/enterprise/my-counsel">
            <span className="text-sm font-bold text-gray-600 hover:text-gray-900">
              보낸 프로젝트
            </span>
          </Link>
        </div>

        {/* 오른쪽: 검색 및 로그인/회원가입 버튼 */}
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="search"
            className="w-[200px] p-2 border border-gray-300 rounded-md text-sm"
          />
          <Link href="/auth?role=manager">
            <span className="text-sm font-bold text-gray-600 hover:text-gray-900">
              로그인
            </span>
          </Link>
          <Link href="/auth?role=manager">
            <button
              className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700"
            >
              회원가입
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ClientNavigator;
