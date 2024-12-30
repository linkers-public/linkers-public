'use client';

import React, { useState } from 'react';

const CounselStatus: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [counselList] = useState([
    { team: '팀명', content: '질문 및 그에 대한 답변이 길어집니다...' },
    { team: '팀명', content: '질문 및 그에 대한 답변이 길어집니다...' },
    { team: '팀명', content: '질문 및 그에 대한 답변이 길어집니다...' },
    { team: '팀명', content: '질문 및 그에 대한 답변이 길어집니다...' },
    { team: '팀명', content: '질문 및 그에 대한 답변이 길어집니다...' },
  ]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div style={{ backgroundColor: '#f9f9f9', padding: '20px', height: '100vh' }}>
      {/* 검색바 */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="팀명으로 검색해보세요"
          value={searchTerm}
          onChange={handleSearchChange}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '16px',
            marginRight: '10px', // 검색창과 버튼 간격
          }}
        />
        <button
          style={{
            padding: '10px 15px',
            backgroundColor: '#007bff',
            color: '#fff',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          검색
        </button>
      </div>

      {/* 상담 목록 */}
      <div>
        {counselList
          .filter((item) => item.team.includes(searchTerm))
          .map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                marginBottom: '12px', // 항목 간 간격 증가
                backgroundColor: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
              }}
            >
              {/* 회색 원 배경에 아이콘 이미지 추가 */}
              <div
                style={{
                  width: '40px', // 원의 크기
                  height: '40px',
                  backgroundColor: '#808080', // 회색 배경
                  borderRadius: '50%', // 원 모양
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: '15px', // 아이콘과 텍스트 간 간격
                }}
              >
                <img
                  src="/images/image.png" // 이미지 파일 경로
                  alt="file icon"
                  style={{ width: '16px', height: '16px' }} // 이미지 크기
                />
              </div>

              {/* 팀명과 상담 미리보기 */}
              <div>
                <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '16px' }}>{item.team}</p>
                <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>{item.content}</p>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default CounselStatus;
