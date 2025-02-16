'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchCounselWithClient } from '@/apis/counsel.service';
import { getClientTeamAndMilestones, acceptEstimateVersion } from '@/apis/estimate.service';

const ConsultationForm: React.FC = () => {
  const searchParams = useSearchParams();
  const counselId = searchParams.get("counselId");
  const estimateVersionId = searchParams.get("estimateVersionId");

  const [counsel, setCounsel] = useState<any>(null);
  const [client, setClient] = useState<any>(null);
  const [estimateVersion, setEstimateVersion] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const clientId = 'baa0fd5e-4add-44f2-b1df-1ec59a838b7e' // 실제 client_id를 동적으로 처리해야 함

  useEffect(() => {
    const fetchData = async () => {
      if (!counselId || !estimateVersionId) {
        console.error('필수 ID가 제공되지 않았습니다.');
        setLoading(false);
        return;
      }

      try {
        const counselData = await fetchCounselWithClient(Number(counselId));
        const estimateData = await getClientTeamAndMilestones(clientId, Number(counselId), ["pending"]);

        setCounsel(counselData?.counsel || {});
        setClient(counselData?.client || {});
        setEstimateVersion(estimateData?.estimateVersion || {});
        
        const sortedMilestones = (estimateData?.milestones || [])
        .filter(milestone => milestone.milestone_start_date) // null 제거
        .sort((a, b) => 
          new Date(a.milestone_start_date!).getTime() - new Date(b.milestone_start_date!).getTime()
        );
        setMilestones(sortedMilestones);
      } catch (error) {
        console.error('데이터 불러오기 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [counselId, estimateVersionId]);


  const handleAccept = async () => {
    try {
        console.log("견적 수락 중...");
        const response = await acceptEstimateVersion(Number(estimateVersionId));
        alert(response?.message); // 성공 메시지 표시
    } catch (error) {
        console.error("견적 수락 실패:", error);
        alert("견적 수락에 실패했습니다. 다시 시도해 주세요."); // 실패 메시지 표시
    }
};





  if (loading) return <p style={{ textAlign: 'center', fontSize: '16px', color: '#666' }}>Loading...</p>;
  if (!counsel) return <p style={{ textAlign: 'center', fontSize: '16px', color: 'red' }}>상담 내용을 불러올 수 없습니다.</p>;

  return (
    <div style={{
      width: '1000px',
      margin: '20px auto',
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      backgroundColor: '#fff',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>상담서 및 견적 상세 보기</h2>

      {/* 고객사 정보 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold', color: '#888' }}>고객사 이름</label>
        <div style={readonlyStyle}>{client?.name || 'Unknown Company'}</div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold', color: '#888' }}>이메일</label>
        <div style={readonlyStyle}>{client?.email || 'Unknown Email'}</div>
      </div>

      {/* 상담 정보 */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold', color: '#888' }}>분야</label>
        <div style={readonlyStyle}>{counsel.feild || '-'}</div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold', color: '#888' }}>상담 내용</label>
        <div style={readonlyStyle}>{counsel.outline || '-'}</div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold', color: '#888' }}>프로젝트 기간</label>
        <div style={readonlyStyle}>{counsel.period || '-'}</div>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold', color: '#888' }}>예상 견적 비용</label>
        <div style={readonlyStyle}>{counsel.cost?.toLocaleString() || '0'} 원</div>
      </div>

      <hr style={{ margin: '20px 0' }} />

      {/* 견적서 상세 */}
      <h3 style={{ color: '#333', marginBottom: '10px' }}>견적서 상세</h3>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold', color: '#888' }}>견적 상세 내용</label>
        <textarea value={estimateVersion?.detail || ''} disabled style={inputStyle} />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold', color: '#888' }}>프로젝트 일정</label>
        <input type="date" value={estimateVersion?.start_date || ''} disabled style={inputStyle} />
        <span style={{ margin: '0 10px' }}>~</span>
        <input type="date" value={estimateVersion?.end_date || ''} disabled style={inputStyle} />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{ fontWeight: 'bold', color: '#888' }}>총 견적 비용</label>
        <div style={readonlyStyle}>{estimateVersion?.total_amount?.toLocaleString() || '0'} 원</div>
      </div>

      <hr style={{ margin: '20px 0' }} />

      {/* 마일스톤 목록 */}
      <h3 style={{ color: '#333', marginBottom: '10px' }}>마일스톤</h3>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '10px',
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f9f9f9' }}>
            <th style={tableHeaderStyle}>시작일</th>
            <th style={tableHeaderStyle}>마감일</th>
            <th style={tableHeaderStyle}>마일스톤 제목</th>
            <th style={tableHeaderStyle}>작업 항목</th>
            <th style={tableHeaderStyle}>가격</th>
            <th style={tableHeaderStyle}>달성률 (%)</th>
          </tr>
        </thead>
        <tbody>
          {milestones.length > 0 ? (
            milestones.map((milestone, index) => (
              <tr key={index}>
                <td style={tableCellStyle}>{milestone.milestone_start_date}</td>
                <td style={tableCellStyle}>{milestone.milestone_due_date}</td>
                <td style={tableCellStyle}>{milestone.title}</td>
                <td style={tableCellStyle}>{milestone.detail}</td>
                <td style={tableCellStyle}>{milestone.payment_amount?.toLocaleString()} 원</td>
                <td style={tableCellStyle}>{milestone.progress} %</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', color: '#999' }}>등록된 마일스톤이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>


      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          onClick={handleAccept}
          style={{
            padding: '12px 20px',
            backgroundColor: '#007bff',
            color: '#fff',
            fontSize: '16px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
          }}
        >
          수락하기
        </button>
      </div>
    </div>
  );
};

const readonlyStyle = { padding: '10px', border: '1px solid #ddd', backgroundColor: '#f9f9f9', borderRadius: '5px' };
const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '5px', backgroundColor: '#f9f9f9' };
const tableHeaderStyle: React.CSSProperties = { 
  padding: '10px', 
  textAlign: 'center' as 'left' | 'right' | 'center', 
  border: '1px solid #ddd' 
};

const tableCellStyle: React.CSSProperties = { 
  padding: '10px', 
  textAlign: 'center' as 'left' | 'right' | 'center', 
  border: '1px solid #ddd' 
};

export default ConsultationForm;
