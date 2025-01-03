'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation'; // useParams for retrieving the dynamic id from the URL
import Sidebar from '../../../../components/Sidebar'; // Sidebar 컴포넌트 임포트

// 가상 데이터 (실제 데이터는 API나 DB에서 받아옴)
const estimateData = [
  {
    id: 1,
    title: '견적서 제목 1',
    description: '상세한 견적서 내용이 들어갑니다.',
    date: '2024-01-01',
    tasks: ['작업 1', '작업 2', '작업 3'],
    status: '진행중',
  },
  {
    id: 2,
    title: '견적서 제목 2',
    description: '상세한 견적서 내용이 들어갑니다.',
    date: '2024-02-01',
    tasks: ['작업 A', '작업 B'],
    status: '정산 완료',
  },
  {
    id: 3,
    title: '견적서 제목 3',
    description: '상세한 견적서 내용이 들어갑니다.',
    date: '2024-03-01',
    tasks: ['작업 X'],
    status: '결제 완료',
  },
];

const ClientEstimateDetailPage: React.FC = () => {
  const [estimate, setEstimate] = useState<any>(null);
  const params = useParams(); // URL의 파라미터 가져오기
  const { id } = params;

  useEffect(() => {
    // id 값에 맞는 견적서를 찾아서 state에 저장
    if (id) {
      const selectedEstimate = estimateData.find(
        (item) => item.id.toString() === id
      );
      if (selectedEstimate) {
        setEstimate(selectedEstimate);
      }
    }
  }, [id]);

  // 데이터가 없으면 로딩 중 화면을 보여줌
  if (!estimate) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9f9f9' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: '#fff', padding: '20px', borderRight: '1px solid #ddd' }}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{estimate.title}</h2>

        {/* 견적서 설명 */}
        <div
          style={{
            marginBottom: '20px',
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>견적서 내용</h3>
          <p>{estimate.description}</p>
        </div>

        {/* 하단 세부 항목 */}
        <div
          style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>작업 목록</h3>
          <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
            {estimate.tasks.map((task: string, index: number) => (
              <li key={index} style={{ fontSize: '16px', marginBottom: '10px' }}>
                {task}
              </li>
            ))}
          </ul>
        </div>

        {/* 견적서 상태 */}
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: '#fff',
              borderRadius: '20px',
              textAlign: 'center',
              fontSize: '14px',
            }}
          >
            {estimate.status}
          </div>
          <div
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: '#fff',
              borderRadius: '20px',
              textAlign: 'center',
              fontSize: '14px',
            }}
          >
            {estimate.date}
          </div>
        </div>

        {/* 하단 버튼 */}
        <div
          style={{
            marginTop: '30px',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: '#fff',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientEstimateDetailPage;
