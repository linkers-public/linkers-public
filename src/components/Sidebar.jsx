import React, { useState } from "react";
import Link from "next/link";

const Sidebar = () => {
  const [openProjects, setOpenProjects] = useState(false); // 드롭다운 상태 관리

  const handleClickProjects = () => {
    setOpenProjects(!openProjects); // 진행 중인 프로젝트 항목 클릭 시 드롭다운 상태 토글
  };

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', width: '200px', padding: '20px', backgroundColor: '#f4f4f4' }}>
      {/* 로고 */}
      <div style={{ marginBottom: '20px' }}>
        <img src="/circle-icon.png" alt="logo" style={{ width: '50px', height: '50px' }} />
        <p>로고</p>
      </div>
      
      {/* 네비게이션 목록 */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* 작성된 견적서 목록 */}
        <div style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <Link href="/client-estimates" style={{ textDecoration: 'none', color: '#333' }}>작성된 견적서 목록</Link>
        </div>

        {/* 상담 현황 */}
        <div style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <Link href="/counsel-status" style={{ textDecoration: 'none', color: '#333' }}>상담 현황</Link>
        </div>

        {/* 진행 중인 프로젝트 (드롭다운) */}
        <div style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer' }} onClick={handleClickProjects}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <p>진행 중인 프로젝트</p>
            <span>{openProjects ? '▲' : '▼'}</span>
          </div>
          {openProjects && (
            <div style={{ paddingLeft: '20px', paddingTop: '5px' }}>
              <div style={{ padding: '5px 0' }}>
                <Link href="/manager-team" style={{ textDecoration: 'none', color: '#333' }}>매니저팀 1</Link>
              </div>
              <div style={{ padding: '5px 0' }}>
                <Link href="/manager-team" style={{ textDecoration: 'none', color: '#333' }}>매니저팀 2</Link>
              </div>
            </div>
          )}
        </div>

        {/* 완료된 프로젝트 */}
        <div style={{ padding: '10px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <p>완료된 프로젝트</p>
        </div>
      </nav>

      {/* 푸터 */}
      <footer style={{ marginTop: '20px' }}>
        <div>기업명</div>
        <div>gal123@naver.com</div>
      </footer>
    </aside>
  );
};

export default Sidebar;
