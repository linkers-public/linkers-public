
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation"; // useRouter 훅을 사용하여 URL 파라미터 접근

const DashboardSidebar = () => {
  const router = useRouter(); // useRouter로 Next.js의 router를 사용
  const params = useParams(); // useParams를 사용하여 URL의 매개변수 추출
  const counselId = params?.id; // URL에서 id 추출
const [queryParams, setQueryParams] = useState<Record<string, string>>({});

useEffect(() => {
  // URL에서 counselId를 가져오고 이를 사용하여 다른 상태를 업데이트 할 수 있습니다
}, [counselId]);
  const generateHref = (path: string) => {
    return counselId ? `/${path}/${counselId}` : `/${path}`;

  };

  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        width: "250px",
        padding: "20px",
        backgroundColor: "#2C3E50",
        height: "100vh",
        color: "#ECF0F1",
        boxShadow: "4px 0 6px rgba(0, 0, 0, 0.1)",
        borderRight: "1px solid #34495E",
      }}
    >
      <nav style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {/* 작성된 견적서 목록 */}
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
            href={generateHref("enterprise/client-estimates")}
            style={{
              textDecoration: "none",
              color: "#ECF0F1",
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
            href={generateHref("enterprise/counsel-status")}
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
            href={generateHref("enterprise/manager-team")}
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

      <footer style={{ marginTop: "30px", textAlign: "center", fontSize: "14px" }}>
        <div>기업명</div>
        <div>gal123@naver.com</div>
      </footer>
    </aside>
  );
};

export default DashboardSidebar;
