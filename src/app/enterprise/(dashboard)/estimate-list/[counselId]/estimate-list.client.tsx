'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from 'next/navigation'; // useParams로 URL 매개변수 추출
import Sidebar from "../../../../../components/DashboardSidebar";  // Sidebar 컴포넌트 임포트
import { getClientTeamAndMilestones } from '@/apis/estimate.service'; // getEstimatesWithVersions 임포트
import EnterpriseSidebar from '../../../../../components/EnterpriseSidebar';

const EstimateListPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [estimateVersion, setEstimateVersion] = useState<any | null>(null);
  const [estimate, setEstimate] = useState<any | null>(null);
  const [team, setTeam] = useState<any | null>(null);

  const counselId = params?.counselId;
  const clientId = 'baa0fd5e-4add-44f2-b1df-1ec59a838b7e' // 실제 client_id를 동적으로 처리해야 함

  console.log('counselId:: ' + counselId);

  // 데이터 불러오기 함수

  const fetchEstimate = async () => {
    try {
      if (counselId) {
        const data = await getClientTeamAndMilestones(clientId, Number(counselId), ["pending"]);
        setEstimateVersion(data?.estimateVersion || null);
        setEstimate(data?.estimate || null);
        setTeam(data?.team || null)
      }
    } catch (error) {
      console.error("견적서 불러오기 실패:", error);
    }
  };

  useEffect(() => {
    fetchEstimate();
  }, [counselId]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value); // 검색어 상태 업데이트
  };

  const handleCardClick = (estimateVersionId: number) => {
    router.push(`/enterprise/client-estimates-detail?counselId=${Number(counselId)}&estimateVersionId=${estimateVersionId}`);
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


        {/* 견적서 카드 */}
        {estimate ? (
          <div key={estimate.estimate_id} style={{
            marginBottom: "30px",
            padding: "20px",
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            transition: "0.3s",
            cursor: "pointer",
          }} onClick={() => handleCardClick(estimateVersion.estimate_version_id)} // 함수 호출을 감싸기
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <div
            style={{
              width: '50px',
              height: '50px',
              backgroundColor: '#808080',
              borderRadius: '50%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: '15px',
            }}
          >
            <img
              src="/images/image.png"
              alt="file icon"
              style={{ width: '20px', height: '20px' }}
            />
          </div>
                <h3 style={{ margin: 0, color: "#34495E", fontSize: "18px" }}>
                  {team.name}
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

            {/* 상세 정보 */}
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
              marginTop: "10px"
            }}>
              {estimateVersion.detail || '견적서 설명이 없습니다.'}
            </p>
          </div>
        ) : (
          <p style={{ color: "#777", textAlign: "center", marginTop: "20px" }}>
            조회할 견적서가 없습니다.
          </p>
        )}
      </main>

    </div>
  );
};

export default EstimateListPage;
