'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from 'next/navigation'; // useParams로 URL 매개변수 추출
import Sidebar from "../../../../components/DashboardSidebar";  // Sidebar 컴포넌트 임포트
import { getEstimatesWithVersions } from '@/apis/estimate.service'; // getEstimatesWithVersions 임포트

const ManagerEstimatesPage: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [estimates, setEstimates] = useState<any[]>([]);  // API로 받아온 데이터를 담을 상태
  const params = useParams(); // useParams를 사용하여 URL의 매개변수 추출
  const counselId = params?.id; // URL에서 id 추출

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

  // 페이지 로드 시 데이터 불러오기
  useEffect(() => {
    fetchEstimates();  // component가 렌더링될 때 API 호출
  }, [counselId]);  // counselId가 변경될 때마다 재호출

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value); // 검색어 상태 업데이트
  };

  const handleCardClick = (id: number) => {
    router.push(`/client-estimates-detail/${id}`);  // 동적 경로로 이동
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '20px', backgroundColor: '#f9f9f9' }}>
        <h2>견적서 목록</h2>

        {/* 상단 검색 및 필터 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="팀명으로 검색해보세요"
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '60%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '16px',
            }}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            >
              <option value="">필터 1</option>
              <option value="filter1-1">필터 1-1</option>
              <option value="filter1-2">필터 1-2</option>
            </select>

            <select
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}
            >
              <option value="">필터 2</option>
              <option value="filter2-1">필터 2-1</option>
              <option value="filter2-2">필터 2-2</option>
            </select>
          </div>
        </div>

        {/* 견적서 목록 */}
        <div>
          {estimates
            .filter((estimate) => estimate.estimate_version[0]?.detail.includes(searchTerm)) // 검색어 필터링
            .map((estimate) => (
              <div
                key={estimate.estimate_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  marginBottom: '12px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #ddd',
                  cursor: 'pointer',  // 클릭 가능한 느낌을 주기 위한 커서 스타일
                }}
                onClick={() => handleCardClick(estimate.estimate_id)}  // 카드 클릭 시 상세 페이지로 이동
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: '#808080',
                    borderRadius: '50%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: '15px',
                  }}
                >
                  <img
                    src={estimate.imageUrl || '/images/image.png'}
                    alt="file icon"
                    style={{ width: '16px', height: '16px' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0', fontWeight: 'bold' }}>
                    견적서 {estimate.estimate_id} - {estimate.estimate_version[0]?.version_date}
                  </p>
                  <p style={{ margin: '0', color: '#888' }}>
                    {estimate.estimate_version[0]?.detail}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '5px',
                    marginLeft: '10px',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: '#007bff',
                      color: '#fff',
                      padding: '5px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      textAlign: 'center',
                    }}
                  >
                    {estimate.estimate_status}
                  </div>
                </div>
              </div>
            ))}
        </div>

      </main>
    </div>
  );
};

export default ManagerEstimatesPage;
