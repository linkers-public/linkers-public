'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

const DashboardSidebar = () => {
  const router = useRouter();
  const params = useParams();

  // ✅ counselId 상태 (세션 유지)
  const [counseld, setCounseld] = useState<string | null>(
    typeof window !== "undefined" ? sessionStorage.getItem("counselId") : null
  );

  useEffect(() => {
    if (params?.counselId && /^\d+$/.test(params.counselId as string)) {
      setCounseld(params.counselId as string);
      sessionStorage.setItem("counselId", params.counselId as string);
    }
  }, [params]);

  // ✅ 경로 생성: counselId가 있으면 URL 경로에 포함
  const generateHref = (path: string) => {
    let basePath = `/${path}`;
    const idToUse = counseld ?? (params?.counselId as string);

    if (idToUse) {
      basePath += `/${idToUse}`;
    }

    return basePath;
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
            href={generateHref("enterprise/estimate-list")}
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
