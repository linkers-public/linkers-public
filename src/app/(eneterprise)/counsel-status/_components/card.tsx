'use client'

import React from 'react'
import { Ellipsis } from 'lucide-react'

interface CardProps {
  title: string;
  subtitle: string;
  content: string;
  buttonText1: string;
  buttonText2: string;
  sender: string;
  onButtonClick1: () => void;
  onButtonClick2: () => void;
}


const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  content,
  buttonText1,
  buttonText2,
  sender,
  onButtonClick1,
  onButtonClick2,
}) => {
  // subtitle에서 개행 문자 처리
  const formattedSubtitle = subtitle.split('\n').map((line, index) => (
    <span key={index}>{line}<br /></span>
  ));

  return (
    <div
      style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        border: '1px solid #ddd', // 회색 배경선 추가
        marginBottom: '20px',
        width: '90%', // 너비를 90%로 설정하여 여유 공간 확보
        maxWidth: '500px', // 최대 너비를 500px로 제한하여 과도하게 커지지 않도록 함
        marginLeft: 'auto',
        marginRight: 'auto', // 카드가 가운데 정렬되도록 설정
        marginLeft: sender === 'client' ? 'auto' : '0', // sender가 'client'이면 오른쪽 정렬
        marginRight: sender === 'manager' ? 'auto' : '0', // sender가 'manager'이면 왼쪽 정렬
      }}
    >
      {/* 카드 상단의 '세 개의 점' 아이콘 (ellipsis 아이콘) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontWeight: 'bold', fontSize: '18px' }}>{title}</h2>
        <Ellipsis size={24} style={{ cursor: 'pointer' }} />
      </div>
      
      {/* 선 */}
      <hr style={{ margin: '10px 0', borderColor: '#ddd' }} />

      {/* 중간 제목 */}
      <h3 style={{ margin: '10px 0', fontSize: '16px', color: '#555' }}>
        {formattedSubtitle}
      </h3>

      {/* 내용 설명 */}
      <p style={{ fontSize: '14px', color: '#666' }}>{content}</p>

      {/* 하단 버튼들 */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button
          style={{
            backgroundColor: '#f1f1f1',
            color: '#333',
            padding: '10px 20px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            cursor: 'pointer',
            flex: 1,
          }}
          onClick={onButtonClick1}
        >
          {buttonText1}
        </button>
        <button
          style={{
            backgroundColor: '#007bff',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer',
            flex: 1,
          }}
          onClick={onButtonClick2}
        >
          {buttonText2}
        </button>
      </div>
    </div>
  )
}

export default Card
