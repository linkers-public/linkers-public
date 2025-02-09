'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useParams,useSearchParams   } from 'next/navigation'; // useParams로 URL 매개변수 추출
import Sidebar from "../../../../../components/DashboardSidebar";  // Sidebar 컴포넌트 임포트
import { getEstimatesWithVersions } from '@/apis/estimate.service'; // getEstimatesWithVersions 임포트
import EnterpriseSidebar from '../../../../../components/EnterpriseSidebar';

const EstimateListPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams(); 

  const [searchTerm, setSearchTerm] = useState("");
  const [estimates, setEstimates] = useState<any[]>([]); 
  
  const rawCounselId = params?.counselId;
  const counselId = Array.isArray(rawCounselId) ? rawCounselId[0] : rawCounselId;

  console.log('counselId:: '+counselId); 
  // 데이터 불러오기 함수
  
  const fetchEstimates = async () => {
    try {
      if (counselId) {
        const fetchedEstimates = await getEstimatesWithVersions(Number(counselId));  // getEstimatesWithVersions 호출
        setEstimates(fetchedEstimates);  // 상태 업데이트
      }
    } catch (error) {
      console.error("견적서 목록 불러오기 실패:", error);
    }
  };

  useEffect(() => {
    fetchEstimates();  
  }, [counselId]);  

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value); // 검색어 상태 업데이트
  };

  const handleCardClick = (estimateId: number) => {
    router.push(`/enterprise/client-estimates-detail?counselId=${Number(counselId)}&estimateVersionId=${estimateId}`);  // 동적 경로로 이동
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>      
      <EnterpriseSidebar />
      <Sidebar />
      <main style={{ flex: 1, padding: '20px', backgroundColor: '#f9f9f9' }}>
        <h2>견적서 목록</h2>

        {/* 상단 검색 및 필터 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '15px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}
        >
          <input
            type="text"
            placeholder="팀명으로 검색해보세요"
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '16px',
              backgroundColor: '#fff',
            }}
          />

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <select
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
              }}
            >
              <option value="">필터 1</option>
              <option value="filter1-1">필터 1-1</option>
              <option value="filter1-2">필터 1-2</option>
            </select>

            <select
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
              }}
            >
              <option value="">필터 2</option>
              <option value="filter2-1">필터 2-1</option>
              <option value="filter2-2">필터 2-2</option>
            </select>
          </div>
        </div>


        {/* 견적서 그룹 */}
        {estimates.map((estimate) => (
          <div key={estimate.estimate_id} style={{ 
            marginBottom: "30px", 
            padding: "20px", 
            backgroundColor: "#fff", 
            borderRadius: "12px", 
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)", 
            transition: "0.3s",
          }}>
            {/* 상단: 이미지 + 견적서 정보 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                {/* 대표 이미지 */}
                <img
                  src={estimate.imageUrl || '/images/image.png'}
                  alt="file icon"
                  style={{ width: "50px", height: "50px", borderRadius: "8px", objectFit: "cover" }}
                />
                <h3 style={{ margin: 0, color: "#34495E", fontSize: "18px" }}>
                  견적서 ID: {estimate.estimate_id}
                </h3>
              </div>

              {/* 상태 표시 */}
              <div style={{
                backgroundColor: '#007bff',
                color: '#fff',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                textAlign: 'center',
                fontWeight: "bold",
              }}>
                {estimate.estimate_status}
              </div>
            </div>

            {/* 견적서 버전 카드 목록 */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginTop: "15px" }}>
              {estimate.estimate_version?.map((version: any) => (
                <div
                  key={version.estimate_version_id}
                  style={{
                    flex: "1 1 300px",
                    padding: "15px",
                    backgroundColor: "#f9f9f9",
                    borderRadius: "10px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    transition: "0.3s",
                    borderLeft: "5px solid #007bff",
                    position: "relative",
                  }}
                  onClick={() => handleCardClick(version.estimate_version_id)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e0e0e0"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
                >
                  <p style={{ fontWeight: "bold", fontSize: "16px", marginBottom: "5px", color: "#2C3E50" }}>
                    버전 {version.estimate_version_id} - {version.version_date}
                  </p>
                  <p style={{
                    color: "#555",
                    fontSize: "14px",
                    maxHeight: "38px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: "19px",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}>
                    {version.detail}
                  </p>

                  {/* 버전별 상태 표시 */}
                  {/* <div
                    style={{
                      backgroundColor: "#007bff",
                      color: "#fff",
                      padding: "4px 10px",
                      borderRadius: "15px",
                      fontSize: "12px",
                      textAlign: "center",
                      position: "absolute",
                      bottom: "10px",
                      right: "10px",
                      fontWeight: "bold",
                    }}
                  >
                    {estimate.estimate_status}
                  </div> */}
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

    </div>
  );
};

export default EstimateListPage;
