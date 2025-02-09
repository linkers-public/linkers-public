'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import FieldDropBar from './fieldDropBar';

const ClientEstimateForm: React.FC = () => {
  const router = useRouter();
  
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [projectDuration, setProjectDuration] = useState('');
  const [fields, setFields] = useState<string[]>([]); // 분야 선택 상태
  const [output, setOutput] = useState('');
  const [consultationDetails, setConsultationDetails] = useState('');

  const estimatedCostOptions = [
    '500만원 이하',
    '500만원 ~ 1000만원',
    '1000만원 ~ 5000만원',
    '5000만원 ~ 1억원',
  ];

  const projectDurationOptions = [
    '1개월 이하',
    '1개월 ~ 3개월',
    '3개월 ~ 6개월',
    '6개월 ~ 1년',
  ];

  const handleCostClick = (option: string) => {
    setEstimatedCost(option);
  };

  const handleDurationClick = (option: string) => {
    setProjectDuration(option);
  };

  return (
    <div
      style={{
        width: '700px',
        margin: '20px auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#fff',
      }}
    >
      <h2 style={{ textAlign: 'center', fontSize: 20, marginBottom: '20px', fontWeight: 'bold' }}>상담서</h2>

      {/* 예상 견적 비용 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>예상 견적 비용</label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {estimatedCostOptions.map((option, index) => (
            <div
              key={index}
              style={{
                padding: '10px 20px',
                borderRadius: '50px',
                border: `2px solid ${estimatedCost === option ? '#5bc0de' : '#ddd'}`,
                backgroundColor: estimatedCost === option ? '#5bc0de' : '#f9f9f9',
                color: estimatedCost === option ? '#fff' : '#333',
                cursor: 'pointer',
                textAlign: 'center',
              }}
              onClick={() => handleCostClick(option)}
            >
              {option}
            </div>
          ))}
        </div>
      </div>

      {/* 프로젝트 기간 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>프로젝트 기간</label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {projectDurationOptions.map((option, index) => (
            <div
              key={index}
              style={{
                padding: '10px 20px',
                borderRadius: '50px',
                border: `2px solid ${projectDuration === option ? '#5bc0de' : '#ddd'}`,
                backgroundColor: projectDuration === option ? '#5bc0de' : '#f9f9f9',
                color: projectDuration === option ? '#fff' : '#333',
                cursor: 'pointer',
                textAlign: 'center',
              }}
              onClick={() => handleDurationClick(option)}
            >
              {option}
            </div>
          ))}
        </div>
      </div>

      {/* 분야 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>분야</label>
        <FieldDropBar value={fields} onChange={setFields} /> {/* 필수 속성 전달 */}
      </div>

      {/* 최종 도출안 */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>최종 도출안</label>
        <input
          type="text"
          value={output}
          onChange={(e) => setOutput(e.target.value)}
          placeholder="최종 도출안을 입력하세요"
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
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>상담 내용</label>
        <textarea
          value={consultationDetails}
          onChange={(e) => setConsultationDetails(e.target.value)}
          placeholder="상담 내용을 입력하세요"
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
            backgroundColor: '#5bc0de',
            color: '#fff',
            borderRadius: '5px',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => alert('견적서 저장됨')} // 견적서 저장 기능 추가 가능
        >
          견적서 저장
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

export default ClientEstimateForm;
