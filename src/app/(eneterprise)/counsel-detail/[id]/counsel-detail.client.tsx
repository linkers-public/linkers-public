'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation'; // useParams로 URL 매개변수 추출
import { fetchCounselWithClient } from '@/apis/counsel.service';

const ClientEstimateDetailPage: React.FC = () => {
  const [counsel, setCounsel] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams(); // useParams를 사용하여 URL의 매개변수 추출
  const counselId = params?.id; // URL에서 id 추출

  useEffect(() => {
    const fetchData = async () => {
      if (!counselId) {
        console.error('counselId가 제공되지 않았습니다.');
        setLoading(false);
        return;
      }

      try {
        const { counsel, client } = await fetchCounselWithClient(Number(counselId));
        setCounsel(counsel);
        setClient(client);
      } catch (error) {
        console.error('Error fetching counsel details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [counselId]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!counsel) {
    return <p>상담 요청서를 불러올 수 없습니다.</p>;
  }

  return (
    <div
      style={{
        width: '700px',
        margin: '20px auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#fff',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>상담서</h2>

      {/* 고객사 이름 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>고객사 이름</label>
        <input
          type="text"
          value={client?.name || 'Unknown Company'}
          readOnly
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        />
      </div>

      {/* 이메일 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>이메일</label>
        <input
          type="email"
          value={client?.email || 'Unknown Email'}
          readOnly
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        />
      </div>

      {/* 예산 견적 비용 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>예산 견적 비용</label>
        <input
          type="text"
          value={`${counsel.cost}만원`}
          readOnly
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        />
      </div>

      {/* 프로젝트 기간 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>프로젝트 기간</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="date"
            value={counsel.startDate || ''}
            readOnly
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
            }}
          />
          <span style={{ alignSelf: 'center' }}>부터</span>
          <input
            type="date"
            value={counsel.dueDate || ''}
            readOnly
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '5px',
              border: '1px solid #ddd',
            }}
          />
        </div>
      </div>

      {/* 분야 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>분야</label>
        <input
          type="text"
          value={counsel.field || ''}
          readOnly
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        />
      </div>

      {/* 상담 내용 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '5px' }}>상담 내용</label>
        <textarea
          value={counsel.outline || ''}
          readOnly
          style={{
            width: '100%',
            height: '100px',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        />
      </div>

      {/* 하단 버튼 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '20px',
        }}
      >
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: '#f0ad4e',
            color: '#fff',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => router.push(`/estimate-detail/${counsel.id}`)} // 견적서 작성 버튼 클릭 시 이동
        >
          견적서 작성
        </button>
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: '#d9534f',
            color: '#fff',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => router.push('/search-projects')} // 뒤로 가기
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default ClientEstimateDetailPage;
