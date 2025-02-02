import React from "react";
import Link from "next/link";

const DashboardSidebar = () => {
  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        width: "250px", // 사이드바 너비를 조금 더 넓혀줍니다
        padding: "20px",
        backgroundColor: "#2C3E50", // 더 깊은 색상의 배경
        height: "100vh", // 화면 전체 높이
        color: "#ECF0F1", // 텍스트 색상
        boxShadow: "4px 0 6px rgba(0, 0, 0, 0.1)", // 오른쪽 그림자 추가
        borderRight: "1px solid #34495E", // 오른쪽에 선 추가
      }}
    >
      

      {/* 네비게이션 목록 */}
      <nav style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {/* 작성된 견적서 목록 */}
        <div
          style={{
            padding: "15px",
            backgroundColor: "#34495E", // 배경 색상
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            transition: "background-color 0.3s ease",
          }}
        >
          <Link
            href="enterprise/client-estimates"
            style={{
              textDecoration: "none",
              color: "#ECF0F1", // 텍스트 색상
              fontSize: "16px",
              fontWeight: "500",
              display: "block",
            }}
          >
            작성된 견적서 목록
          </Link>
        </div>

        {/* 상담 현황 */}
        <div
          style={{
            padding: "15px",
            backgroundColor: "#34495E",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            transition: "background-color 0.3s ease",
          }}
        >
          <Link
            href="enterprise/counsel-status"
            style={{
              textDecoration: "none",
              color: "#ECF0F1",
              fontSize: "16px",
              fontWeight: "500",
              display: "block",
            }}
          >
            상담 현황
          </Link>
        </div>

        {/* 진행 중인 프로젝트 */}
        <div
          style={{
            padding: "15px",
            backgroundColor: "#34495E",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            transition: "background-color 0.3s ease",
          }}
        >
          <Link
            href="/enterprise/manager-team"
            style={{
              textDecoration: "none",
              color: "#ECF0F1",
              fontSize: "16px",
              fontWeight: "500",
              display: "block",
            }}
          >
            진행 중인 프로젝트
          </Link>
        </div>
      </nav>

      {/* 푸터 */}
      <footer style={{ marginTop: "30px", textAlign: "center", fontSize: "14px" }}>
        <div>기업명</div>
        <div>gal123@naver.com</div>
      </footer>
    </aside>
  );
};

export default DashboardSidebar;
