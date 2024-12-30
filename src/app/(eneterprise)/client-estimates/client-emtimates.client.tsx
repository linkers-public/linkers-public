// /manager-estimates/page.tsx
'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../../components/Sidebar";  // Sidebar 컴포넌트 임포트

const ManagerEstimatesPage: React.FC = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const [estimates] = useState([
    { id: 1, title: "견적서 제목 1", content: "견적서 내용 1", status: "진행중", imageUrl: "/images/image.png" },
    { id: 2, title: "견적서 제목 2", content: "견적서 내용 2", status: "정산 완료", imageUrl: "/images/image.png" },
    { id: 3, title: "견적서 제목 3", content: "견적서 내용 3", status: "결제 완료", imageUrl: "/images/image.png" },
  ]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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
            .filter((estimate) => estimate.title.includes(searchTerm)) // 검색어 필터링
            .map((estimate) => (
              <div
                key={estimate.id}
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
                onClick={() => handleCardClick(estimate.id)}  // 카드 클릭 시 상세 페이지로 이동
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
                    src={estimate.imageUrl}
                    alt="file icon"
                    style={{ width: '16px', height: '16px' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0', fontWeight: 'bold' }}>{estimate.title}</p>
                  <p style={{ margin: '0', color: '#888' }}>{estimate.content}</p>
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
                    {estimate.status}
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
